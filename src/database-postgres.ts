/**
 * PostgreSQL Database Adapter
 * Production-ready database implementation for PoHW registry nodes
 * Per whitepaper Section 12.2: "Written with modular backends for PostgreSQL"
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { ProofRecord, MerkleBatch, ChallengeRecord } from './types';
import { DIDDocument, KCGNode } from './did';
import { AttestorRecord, VerifiableHumanCredential, RevocationRecord, AuditLogEntry } from './attestors';

export class PostgreSQLDatabase {
  private pool: Pool;
  private initialized: boolean = false;

  constructor(connectionString?: string) {
    const connString = connectionString || process.env.DATABASE_URL || 
      `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || ''}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'pohw_registry'}`;
    
    this.pool = new Pool({
      connectionString: connString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }

  /**
   * Initialize database schema
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Create proofs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS proofs (
          id SERIAL PRIMARY KEY,
          hash VARCHAR(66) NOT NULL UNIQUE,
          signature TEXT NOT NULL,
          did VARCHAR(255) NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
          batch_id VARCHAR(255),
          merkle_index INTEGER,
          anchored BOOLEAN DEFAULT FALSE,
          anchor_tx VARCHAR(255),
          anchor_chain VARCHAR(50),
          process_digest VARCHAR(66),
          compound_hash VARCHAR(66),
          process_metrics JSONB,
          zk_proof JSONB,
          tier VARCHAR(20),
          authored_on_device TEXT,
          environment_attestation JSONB,
          derived_from JSONB,
          assistance_profile VARCHAR(20),
          claim_uri TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Add claim_uri column if it doesn't exist (for existing databases)
      await client.query(`
        ALTER TABLE proofs 
        ADD COLUMN IF NOT EXISTS claim_uri TEXT
      `);

      // Create indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_hash ON proofs(hash)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_compound_hash ON proofs(compound_hash)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_did ON proofs(did)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_batch_id ON proofs(batch_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_timestamp ON proofs(timestamp)');

      // Create batches table
      await client.query(`
        CREATE TABLE IF NOT EXISTS batches (
          id VARCHAR(255) PRIMARY KEY,
          root VARCHAR(66) NOT NULL,
          size INTEGER NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          anchored_at TIMESTAMP,
          anchor_tx VARCHAR(255),
          anchor_chain VARCHAR(50)
        )
      `);

      // Create DIDs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS dids (
          did VARCHAR(255) PRIMARY KEY,
          document JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create KCG nodes table
      await client.query(`
        CREATE TABLE IF NOT EXISTS kcg_nodes (
          did VARCHAR(255) PRIMARY KEY,
          node_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create attestors table
      await client.query(`
        CREATE TABLE IF NOT EXISTS attestors (
          did VARCHAR(255) PRIMARY KEY,
          record_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create credentials table
      await client.query(`
        CREATE TABLE IF NOT EXISTS credentials (
          credential_hash VARCHAR(255) PRIMARY KEY,
          subject_did VARCHAR(255) NOT NULL,
          credential_data JSONB NOT NULL,
          issued_at TIMESTAMP NOT NULL,
          expires_at TIMESTAMP,
          revoked BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_credentials_subject_did ON credentials(subject_did)');

      // Create revocations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS revocations (
          credential_hash VARCHAR(255) PRIMARY KEY,
          revocation_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create audit logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          log_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)');

      // Create reputation table
      await client.query(`
        CREATE TABLE IF NOT EXISTS reputation (
          did VARCHAR(255) PRIMARY KEY,
          score REAL NOT NULL DEFAULT 50.0,
          tier VARCHAR(20) NOT NULL DEFAULT 'grey',
          successful_proofs INTEGER DEFAULT 0,
          anomalies INTEGER DEFAULT 0,
          last_updated TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create submission history table
      await client.query(`
        CREATE TABLE IF NOT EXISTS submission_history (
          did VARCHAR(255) NOT NULL,
          hash VARCHAR(66) NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY (did, hash, timestamp)
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_submission_history_did ON submission_history(did)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_submission_history_timestamp ON submission_history(timestamp)');

      // Create anomaly log table
      await client.query(`
        CREATE TABLE IF NOT EXISTS anomaly_log (
          id SERIAL PRIMARY KEY,
          did VARCHAR(255) NOT NULL,
          entry TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_anomaly_log_did ON anomaly_log(did)');

      // Create challenges table
      await client.query(`
        CREATE TABLE IF NOT EXISTS challenges (
          id VARCHAR(255) PRIMARY KEY,
          proof_hash VARCHAR(66) NOT NULL,
          proof_did VARCHAR(255) NOT NULL,
          challenger_did VARCHAR(255) NOT NULL,
          reason VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          evidence JSONB,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          resolution VARCHAR(20),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          responded_at TIMESTAMP,
          resolved_at TIMESTAMP,
          resolver_did VARCHAR(255),
          author_response TEXT,
          resolution_notes TEXT
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_challenges_proof_hash ON challenges(proof_hash)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_challenges_proof_did ON challenges(proof_did)');

      // Create transparency log table
      await client.query(`
        CREATE TABLE IF NOT EXISTS transparency_log (
          id SERIAL PRIMARY KEY,
          log_type VARCHAR(50) NOT NULL,
          challenge_id VARCHAR(255),
          proof_hash VARCHAR(66),
          did VARCHAR(255),
          resolution VARCHAR(50),
          timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
          details JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_transparency_log_timestamp ON transparency_log(timestamp)');

      await client.query('COMMIT');
      this.initialized = true;
      console.log('[PostgreSQL] Database schema initialized');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Proof operations
  async storeProof(proof: Omit<ProofRecord, 'id' | 'submitted_at'>): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO proofs (
          hash, signature, did, timestamp, submitted_at,
          batch_id, merkle_index, anchored, anchor_tx, anchor_chain,
          process_digest, compound_hash, process_metrics, zk_proof, tier,
          authored_on_device, environment_attestation, derived_from, assistance_profile, claim_uri
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id
      `, [
        proof.hash, proof.signature, proof.did, proof.timestamp,
        proof.batch_id || null, proof.merkle_index || null, proof.anchored || false,
        proof.anchor_tx || null, proof.anchor_chain || null,
        proof.process_digest || null, proof.compound_hash || null,
        proof.process_metrics ? JSON.stringify(proof.process_metrics) : null,
        proof.zk_proof ? JSON.stringify(proof.zk_proof) : null,
        proof.tier || null, proof.authored_on_device || null,
        proof.environment_attestation ? JSON.stringify(proof.environment_attestation) : null,
        proof.derived_from ? JSON.stringify(proof.derived_from) : null,
        proof.assistance_profile || null,
        proof.claim_uri || null
      ]);
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  async getProofByHash(hash: string): Promise<ProofRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE hash = $1', [hash]);
      if (result.rows.length === 0) return null;
      return this.rowToProofRecord(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getProofByCompoundHash(compoundHash: string): Promise<ProofRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE compound_hash = $1', [compoundHash]);
      if (result.rows.length === 0) return null;
      return this.rowToProofRecord(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getAllProofsByHash(hash: string): Promise<ProofRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE hash = $1 ORDER BY timestamp DESC', [hash]);
      return result.rows.map(row => this.rowToProofRecord(row));
    } finally {
      client.release();
    }
  }

  async getPendingProofs(): Promise<ProofRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE batch_id IS NULL ORDER BY timestamp ASC');
      return result.rows.map(row => this.rowToProofRecord(row));
    } finally {
      client.release();
    }
  }

  async getPendingCount(): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) FROM proofs WHERE batch_id IS NULL');
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  async updateProofBatch(hash: string, batchId: string, merkleIndex: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('UPDATE proofs SET batch_id = $1, merkle_index = $2 WHERE hash = $3', 
        [batchId, merkleIndex, hash]);
    } finally {
      client.release();
    }
  }

  async updateProofAnchors(hash: string, anchorTx: string, anchorChain: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('UPDATE proofs SET anchored = TRUE, anchor_tx = $1, anchor_chain = $2 WHERE hash = $3',
        [anchorTx, anchorChain, hash]);
    } finally {
      client.release();
    }
  }

  // Batch operations
  async storeBatch(batch: Omit<MerkleBatch, 'id'>): Promise<string> {
    const client = await this.pool.connect();
    try {
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await client.query(`
        INSERT INTO batches (id, root, size, created_at, anchored_at, anchor_tx, anchor_chain)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [batchId, batch.root, batch.size, batch.created_at, batch.anchored_at || null, 
          batch.anchor_tx || null, batch.anchor_chain || null]);
      return batchId;
    } finally {
      client.release();
    }
  }

  async getBatchById(batchId: string): Promise<MerkleBatch | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM batches WHERE id = $1', [batchId]);
      if (result.rows.length === 0) return null;
      return this.rowToMerkleBatch(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getAllBatches(): Promise<MerkleBatch[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM batches ORDER BY created_at DESC');
      return result.rows.map(row => this.rowToMerkleBatch(row));
    } finally {
      client.release();
    }
  }

  // Helper methods to convert database rows to types
  private rowToProofRecord(row: any): ProofRecord {
    return {
      id: row.id,
      hash: row.hash,
      signature: row.signature,
      did: row.did,
      timestamp: row.timestamp.toISOString(),
      submitted_at: row.submitted_at.toISOString(),
      batch_id: row.batch_id,
      merkle_index: row.merkle_index,
      anchored: row.anchored,
      anchor_tx: row.anchor_tx,
      anchor_chain: row.anchor_chain,
      process_digest: row.process_digest,
      compound_hash: row.compound_hash,
      process_metrics: row.process_metrics ? (typeof row.process_metrics === 'string' ? row.process_metrics : JSON.stringify(row.process_metrics)) : undefined,
      zk_proof: row.zk_proof ? (typeof row.zk_proof === 'string' ? row.zk_proof : JSON.stringify(row.zk_proof)) : undefined,
      tier: row.tier,
      authored_on_device: row.authored_on_device,
      environment_attestation: row.environment_attestation ? (typeof row.environment_attestation === 'string' ? row.environment_attestation : JSON.stringify(row.environment_attestation)) : undefined,
      derived_from: row.derived_from ? (typeof row.derived_from === 'string' ? row.derived_from : JSON.stringify(row.derived_from)) : undefined,
      assistance_profile: row.assistance_profile,
      claim_uri: row.claim_uri
    };
  }

  private rowToMerkleBatch(row: any): MerkleBatch {
    return {
      id: row.id,
      root: row.root,
      size: row.size,
      created_at: row.created_at.toISOString(),
      anchored_at: row.anchored_at ? row.anchored_at.toISOString() : undefined,
      anchor_tx: row.anchor_tx,
      anchor_chain: row.anchor_chain
    };
  }

  // Additional batch operations
  async storeMerkleBatch(batch: Omit<MerkleBatch, 'created_at'>): Promise<string> {
    return this.storeBatch({ ...batch, created_at: new Date().toISOString() });
  }

  async updateBatchAnchors(batchId: string, anchors: Array<{ chain: string; tx: string; block?: number }>): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Update with first anchor (simplified - could support multiple)
      if (anchors.length > 0) {
        const anchor = anchors[0];
        await client.query(
          'UPDATE batches SET anchored_at = NOW(), anchor_tx = $1, anchor_chain = $2 WHERE id = $3',
          [anchor.tx, anchor.chain, batchId]
        );
      }
    } finally {
      client.release();
    }
  }

  async getLatestBatch(): Promise<MerkleBatch | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM batches ORDER BY created_at DESC LIMIT 1');
      if (result.rows.length === 0) return null;
      return this.rowToMerkleBatch(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getBatchProofs(batchId: string): Promise<ProofRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE batch_id = $1 ORDER BY merkle_index ASC', [batchId]);
      return result.rows.map(row => this.rowToProofRecord(row));
    } finally {
      client.release();
    }
  }

  async getTotalProofs(): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) FROM proofs');
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  // DID operations
  async storeDIDDocument(did: string, document: DIDDocument): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO dids (did, document, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (did) DO UPDATE SET document = $2, updated_at = NOW()
      `, [did, JSON.stringify(document)]);
    } finally {
      client.release();
    }
  }

  async getDIDDocument(did: string): Promise<DIDDocument | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT document FROM dids WHERE did = $1', [did]);
      if (result.rows.length === 0) return null;
      return result.rows[0].document as DIDDocument;
    } finally {
      client.release();
    }
  }

  async getAllDIDDocuments(): Promise<DIDDocument[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT document FROM dids');
      return result.rows.map(row => row.document as DIDDocument);
    } finally {
      client.release();
    }
  }

  // KCG operations
  async storeKCGNode(did: string, node: KCGNode): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO kcg_nodes (did, node_data)
        VALUES ($1, $2)
        ON CONFLICT (did) DO UPDATE SET node_data = $2
      `, [did, JSON.stringify(node)]);
    } finally {
      client.release();
    }
  }

  async getKCGNode(did: string): Promise<KCGNode | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT node_data FROM kcg_nodes WHERE did = $1', [did]);
      if (result.rows.length === 0) return null;
      return result.rows[0].node_data as KCGNode;
    } finally {
      client.release();
    }
  }

  async getContinuityChain(did: string): Promise<KCGNode[]> {
    const chain: KCGNode[] = [];
    let currentDID: string | undefined = did;

    while (currentDID) {
      const node = await this.getKCGNode(currentDID);
      if (!node) break;
      chain.unshift(node);
      currentDID = node.previousNode;
    }

    return chain;
  }

  // Attestor operations
  async storeAttestor(did: string, record: AttestorRecord): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO attestors (did, record_data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (did) DO UPDATE SET record_data = $2, updated_at = NOW()
      `, [did, JSON.stringify(record)]);
    } finally {
      client.release();
    }
  }

  async getAttestor(did: string): Promise<AttestorRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT record_data FROM attestors WHERE did = $1', [did]);
      if (result.rows.length === 0) return null;
      return result.rows[0].record_data as AttestorRecord;
    } finally {
      client.release();
    }
  }

  async getAllAttestors(): Promise<AttestorRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT record_data FROM attestors');
      return result.rows.map(row => row.record_data as AttestorRecord);
    } finally {
      client.release();
    }
  }

  // Credential operations
  async storeCredential(hash: string, credential: VerifiableHumanCredential): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO credentials (credential_hash, subject_did, credential_data, issued_at, expires_at, revoked)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (credential_hash) DO UPDATE SET credential_data = $3, expires_at = $5, revoked = $6
      `, [
        hash,
        credential.credentialSubject?.id || (credential as any).subjectDID || '',
        JSON.stringify(credential),
        credential.issuanceDate || (credential as any).issuedAt || new Date().toISOString(),
        credential.expirationDate || null,
        (credential as any).revoked || false
      ]);
    } finally {
      client.release();
    }
  }

  async getCredential(hash: string): Promise<VerifiableHumanCredential | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT credential_data FROM credentials WHERE credential_hash = $1 AND revoked = FALSE', [hash]);
      if (result.rows.length === 0) return null;
      return result.rows[0].credential_data as VerifiableHumanCredential;
    } finally {
      client.release();
    }
  }

  async getAllCredentials(): Promise<VerifiableHumanCredential[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT credential_data FROM credentials WHERE revoked = FALSE');
      return result.rows.map(row => row.credential_data as VerifiableHumanCredential);
    } finally {
      client.release();
    }
  }

  // Revocation operations
  async storeRevocation(hash: string, revocation: RevocationRecord): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO revocations (credential_hash, revocation_data)
        VALUES ($1, $2)
        ON CONFLICT (credential_hash) DO UPDATE SET revocation_data = $2
      `, [hash, JSON.stringify(revocation)]);
      // Also mark credential as revoked
      await client.query('UPDATE credentials SET revoked = TRUE WHERE credential_hash = $1', [hash]);
    } finally {
      client.release();
    }
  }

  async getRevocation(hash: string): Promise<RevocationRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT revocation_data FROM revocations WHERE credential_hash = $1', [hash]);
      if (result.rows.length === 0) return null;
      return result.rows[0].revocation_data as RevocationRecord;
    } finally {
      client.release();
    }
  }

  async getAllRevocations(): Promise<RevocationRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT revocation_data FROM revocations');
      return result.rows.map(row => row.revocation_data as RevocationRecord);
    } finally {
      client.release();
    }
  }

  // Audit log operations
  async appendAuditLog(entry: AuditLogEntry): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('INSERT INTO audit_logs (log_data) VALUES ($1)', [JSON.stringify(entry)]);
      // Keep only last 10000 entries
      await client.query(`
        DELETE FROM audit_logs
        WHERE id NOT IN (
          SELECT id FROM audit_logs ORDER BY created_at DESC LIMIT 10000
        )
      `);
    } finally {
      client.release();
    }
  }

  async getAuditLogs(attestorDID?: string, limit: number = 100): Promise<AuditLogEntry[]> {
    const client = await this.pool.connect();
    try {
      let query = 'SELECT log_data FROM audit_logs';
      const params: any[] = [];
      
      if (attestorDID) {
        query += ' WHERE log_data->>\'attestorDID\' = $1';
        params.push(attestorDID);
      }
      
      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
      params.push(limit);
      
      const result = await client.query(query, params);
      return result.rows.map(row => row.log_data as AuditLogEntry);
    } finally {
      client.release();
    }
  }

  // Reputation operations
  async storeReputation(did: string, reputation: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO reputation (did, score, tier, successful_proofs, anomalies, last_updated)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (did) DO UPDATE SET
          score = $2, tier = $3, successful_proofs = $4, anomalies = $5, last_updated = NOW()
      `, [
        did,
        reputation.score || 50.0,
        reputation.tier || 'grey',
        reputation.successfulProofs || 0,
        reputation.anomalies || 0
      ]);
    } finally {
      client.release();
    }
  }

  async getReputation(did: string): Promise<any | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM reputation WHERE did = $1', [did]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        score: row.score,
        tier: row.tier,
        successfulProofs: row.successful_proofs,
        anomalies: row.anomalies,
        trustLevel: row.score / 100.0
      };
    } finally {
      client.release();
    }
  }

  async getAllReputation(): Promise<{ [did: string]: any }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM reputation');
      const reputation: { [did: string]: any } = {};
      result.rows.forEach(row => {
        reputation[row.did] = {
          score: row.score,
          tier: row.tier,
          successfulProofs: row.successful_proofs,
          anomalies: row.anomalies,
          trustLevel: row.score / 100.0
        };
      });
      return reputation;
    } finally {
      client.release();
    }
  }

  // Submission history operations
  async appendSubmissionHistory(did: string, record: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO submission_history (did, hash, timestamp)
        VALUES ($1, $2, $3)
        ON CONFLICT (did, hash, timestamp) DO NOTHING
      `, [did, record.hash, record.timestamp]);
      // Clean up old entries (older than 24 hours)
      await client.query(`
        DELETE FROM submission_history
        WHERE did = $1 AND timestamp < NOW() - INTERVAL '24 hours'
      `, [did]);
    } finally {
      client.release();
    }
  }

  async getSubmissionHistory(did: string): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT hash, timestamp FROM submission_history WHERE did = $1 ORDER BY timestamp DESC',
        [did]
      );
      return result.rows.map(row => ({
        hash: row.hash,
        timestamp: row.timestamp.toISOString()
      }));
    } finally {
      client.release();
    }
  }

  // Anomaly log operations
  async appendAnomalyLog(did: string, entry: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('INSERT INTO anomaly_log (did, entry) VALUES ($1, $2)', [did, entry]);
      // Keep only last 100 entries per DID
      await client.query(`
        DELETE FROM anomaly_log
        WHERE did = $1 AND id NOT IN (
          SELECT id FROM anomaly_log WHERE did = $1 ORDER BY created_at DESC LIMIT 100
        )
      `, [did]);
    } finally {
      client.release();
    }
  }

  async getAnomalyLog(did: string): Promise<string[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT entry FROM anomaly_log WHERE did = $1 ORDER BY created_at DESC LIMIT 100',
        [did]
      );
      return result.rows.map(row => row.entry);
    } finally {
      client.release();
    }
  }

  // Challenge operations
  async storeChallenge(challenge: Omit<ChallengeRecord, 'id'>): Promise<string> {
    const client = await this.pool.connect();
    try {
      const challengeId = `0x${require('crypto').createHash('sha256')
        .update(`${challenge.proof_hash}-${challenge.challenger_did}-${challenge.created_at}`)
        .digest('hex')
        .substring(0, 16)}`;
      
      await client.query(`
        INSERT INTO challenges (
          id, proof_hash, proof_did, challenger_did, reason, description,
          evidence, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        challengeId,
        challenge.proof_hash,
        challenge.proof_did,
        challenge.challenger_did,
        challenge.reason,
        challenge.description,
        challenge.evidence ? JSON.stringify(challenge.evidence) : null,
        challenge.status,
        challenge.created_at
      ]);
      
      return challengeId;
    } finally {
      client.release();
    }
  }

  async getChallengeById(challengeId: string): Promise<ChallengeRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM challenges WHERE id = $1', [challengeId]);
      if (result.rows.length === 0) return null;
      return this.rowToChallengeRecord(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getChallengesByProofHash(proofHash: string): Promise<ChallengeRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM challenges WHERE proof_hash = $1 ORDER BY created_at DESC', [proofHash]);
      return result.rows.map(row => this.rowToChallengeRecord(row));
    } finally {
      client.release();
    }
  }

  async getChallengesByDID(did: string): Promise<ChallengeRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM challenges WHERE proof_did = $1 OR challenger_did = $1 ORDER BY created_at DESC',
        [did]
      );
      return result.rows.map(row => this.rowToChallengeRecord(row));
    } finally {
      client.release();
    }
  }

  async updateChallenge(challengeId: string, updates: Partial<ChallengeRecord>): Promise<void> {
    const client = await this.pool.connect();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.status !== undefined) {
        fields.push(`status = $${paramIndex++}`);
        values.push(updates.status);
      }
      if (updates.resolution !== undefined) {
        fields.push(`resolution = $${paramIndex++}`);
        values.push(updates.resolution);
      }
      if (updates.resolver_did !== undefined) {
        fields.push(`resolver_did = $${paramIndex++}`);
        values.push(updates.resolver_did);
      }
      if (updates.author_response !== undefined) {
        fields.push(`author_response = $${paramIndex++}`);
        values.push(updates.author_response);
      }
      if (updates.resolution_notes !== undefined) {
        fields.push(`resolution_notes = $${paramIndex++}`);
        values.push(updates.resolution_notes);
      }
      if (updates.responded_at !== undefined) {
        fields.push(`responded_at = $${paramIndex++}`);
        values.push(updates.responded_at);
      }
      if (updates.resolved_at !== undefined) {
        fields.push(`resolved_at = $${paramIndex++}`);
        values.push(updates.resolved_at);
      }

      if (fields.length > 0) {
        values.push(challengeId);
        await client.query(
          `UPDATE challenges SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
          values
        );
      }
    } finally {
      client.release();
    }
  }

  // Transparency log operations
  async appendTransparencyLog(entry: {
    type: 'challenge_submitted' | 'challenge_responded' | 'challenge_resolved';
    challenge_id: string;
    proof_hash: string;
    did?: string;
    resolution?: string;
    timestamp: string;
    details?: any;
  }): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO transparency_log (log_type, challenge_id, proof_hash, did, resolution, timestamp, details)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        entry.type,
        entry.challenge_id,
        entry.proof_hash,
        entry.did || null,
        entry.resolution || null,
        entry.timestamp,
        entry.details ? JSON.stringify(entry.details) : null
      ]);
      // Keep only last 10000 entries
      await client.query(`
        DELETE FROM transparency_log
        WHERE id NOT IN (
          SELECT id FROM transparency_log ORDER BY created_at DESC LIMIT 10000
        )
      `);
    } finally {
      client.release();
    }
  }

  async getTransparencyLog(limit: number = 100): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM transparency_log ORDER BY timestamp DESC LIMIT $1',
        [limit]
      );
      return result.rows.map(row => ({
        type: row.log_type,
        challenge_id: row.challenge_id,
        proof_hash: row.proof_hash,
        did: row.did,
        resolution: row.resolution,
        timestamp: row.timestamp.toISOString(),
        details: row.details
      }));
    } finally {
      client.release();
    }
  }

  // Helper to convert row to ChallengeRecord
  private rowToChallengeRecord(row: any): ChallengeRecord {
    return {
      id: row.id,
      proof_hash: row.proof_hash,
      proof_did: row.proof_did,
      challenger_did: row.challenger_did,
      reason: row.reason,
      description: row.description,
      evidence: row.evidence ? (typeof row.evidence === 'string' ? row.evidence : JSON.stringify(row.evidence)) : undefined,
      status: row.status,
      resolution: row.resolution,
      created_at: row.created_at.toISOString(),
      responded_at: row.responded_at ? row.responded_at.toISOString() : undefined,
      resolved_at: row.resolved_at ? row.resolved_at.toISOString() : undefined,
      resolver_did: row.resolver_did,
      author_response: row.author_response,
      resolution_notes: row.resolution_notes
    };
  }

  // Close connection pool
  async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * Production-ready database implementation for PoHW registry nodes
 * Per whitepaper Section 12.2: "Written with modular backends for PostgreSQL"
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { ProofRecord, MerkleBatch, ChallengeRecord } from './types';
import { DIDDocument, KCGNode } from './did';
import { AttestorRecord, VerifiableHumanCredential, RevocationRecord, AuditLogEntry } from './attestors';

export class PostgreSQLDatabase {
  private pool: Pool;
  private initialized: boolean = false;

  constructor(connectionString?: string) {
    const connString = connectionString || process.env.DATABASE_URL || 
      `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || ''}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'pohw_registry'}`;
    
    this.pool = new Pool({
      connectionString: connString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }

  /**
   * Initialize database schema
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Create proofs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS proofs (
          id SERIAL PRIMARY KEY,
          hash VARCHAR(66) NOT NULL UNIQUE,
          signature TEXT NOT NULL,
          did VARCHAR(255) NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
          batch_id VARCHAR(255),
          merkle_index INTEGER,
          anchored BOOLEAN DEFAULT FALSE,
          anchor_tx VARCHAR(255),
          anchor_chain VARCHAR(50),
          process_digest VARCHAR(66),
          compound_hash VARCHAR(66),
          process_metrics JSONB,
          zk_proof JSONB,
          tier VARCHAR(20),
          authored_on_device TEXT,
          environment_attestation JSONB,
          derived_from JSONB,
          assistance_profile VARCHAR(20),
          claim_uri TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Add claim_uri column if it doesn't exist (for existing databases)
      await client.query(`
        ALTER TABLE proofs 
        ADD COLUMN IF NOT EXISTS claim_uri TEXT
      `);

      // Create indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_hash ON proofs(hash)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_compound_hash ON proofs(compound_hash)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_did ON proofs(did)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_batch_id ON proofs(batch_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_timestamp ON proofs(timestamp)');

      // Create batches table
      await client.query(`
        CREATE TABLE IF NOT EXISTS batches (
          id VARCHAR(255) PRIMARY KEY,
          root VARCHAR(66) NOT NULL,
          size INTEGER NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          anchored_at TIMESTAMP,
          anchor_tx VARCHAR(255),
          anchor_chain VARCHAR(50)
        )
      `);

      // Create DIDs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS dids (
          did VARCHAR(255) PRIMARY KEY,
          document JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create KCG nodes table
      await client.query(`
        CREATE TABLE IF NOT EXISTS kcg_nodes (
          did VARCHAR(255) PRIMARY KEY,
          node_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create attestors table
      await client.query(`
        CREATE TABLE IF NOT EXISTS attestors (
          did VARCHAR(255) PRIMARY KEY,
          record_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create credentials table
      await client.query(`
        CREATE TABLE IF NOT EXISTS credentials (
          credential_hash VARCHAR(255) PRIMARY KEY,
          subject_did VARCHAR(255) NOT NULL,
          credential_data JSONB NOT NULL,
          issued_at TIMESTAMP NOT NULL,
          expires_at TIMESTAMP,
          revoked BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_credentials_subject_did ON credentials(subject_did)');

      // Create revocations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS revocations (
          credential_hash VARCHAR(255) PRIMARY KEY,
          revocation_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create audit logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          log_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)');

      // Create reputation table
      await client.query(`
        CREATE TABLE IF NOT EXISTS reputation (
          did VARCHAR(255) PRIMARY KEY,
          score REAL NOT NULL DEFAULT 50.0,
          tier VARCHAR(20) NOT NULL DEFAULT 'grey',
          successful_proofs INTEGER DEFAULT 0,
          anomalies INTEGER DEFAULT 0,
          last_updated TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create submission history table
      await client.query(`
        CREATE TABLE IF NOT EXISTS submission_history (
          did VARCHAR(255) NOT NULL,
          hash VARCHAR(66) NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY (did, hash, timestamp)
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_submission_history_did ON submission_history(did)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_submission_history_timestamp ON submission_history(timestamp)');

      // Create anomaly log table
      await client.query(`
        CREATE TABLE IF NOT EXISTS anomaly_log (
          id SERIAL PRIMARY KEY,
          did VARCHAR(255) NOT NULL,
          entry TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_anomaly_log_did ON anomaly_log(did)');

      // Create challenges table
      await client.query(`
        CREATE TABLE IF NOT EXISTS challenges (
          id VARCHAR(255) PRIMARY KEY,
          proof_hash VARCHAR(66) NOT NULL,
          proof_did VARCHAR(255) NOT NULL,
          challenger_did VARCHAR(255) NOT NULL,
          reason VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          evidence JSONB,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          resolution VARCHAR(20),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          responded_at TIMESTAMP,
          resolved_at TIMESTAMP,
          resolver_did VARCHAR(255),
          author_response TEXT,
          resolution_notes TEXT
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_challenges_proof_hash ON challenges(proof_hash)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_challenges_proof_did ON challenges(proof_did)');

      // Create transparency log table
      await client.query(`
        CREATE TABLE IF NOT EXISTS transparency_log (
          id SERIAL PRIMARY KEY,
          log_type VARCHAR(50) NOT NULL,
          challenge_id VARCHAR(255),
          proof_hash VARCHAR(66),
          did VARCHAR(255),
          resolution VARCHAR(50),
          timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
          details JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_transparency_log_timestamp ON transparency_log(timestamp)');

      await client.query('COMMIT');
      this.initialized = true;
      console.log('[PostgreSQL] Database schema initialized');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Proof operations
  async storeProof(proof: Omit<ProofRecord, 'id' | 'submitted_at'>): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO proofs (
          hash, signature, did, timestamp, submitted_at,
          batch_id, merkle_index, anchored, anchor_tx, anchor_chain,
          process_digest, compound_hash, process_metrics, zk_proof, tier,
          authored_on_device, environment_attestation, derived_from, assistance_profile, claim_uri
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id
      `, [
        proof.hash, proof.signature, proof.did, proof.timestamp,
        proof.batch_id || null, proof.merkle_index || null, proof.anchored || false,
        proof.anchor_tx || null, proof.anchor_chain || null,
        proof.process_digest || null, proof.compound_hash || null,
        proof.process_metrics ? JSON.stringify(proof.process_metrics) : null,
        proof.zk_proof ? JSON.stringify(proof.zk_proof) : null,
        proof.tier || null, proof.authored_on_device || null,
        proof.environment_attestation ? JSON.stringify(proof.environment_attestation) : null,
        proof.derived_from ? JSON.stringify(proof.derived_from) : null,
        proof.assistance_profile || null,
        proof.claim_uri || null
      ]);
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  async getProofByHash(hash: string): Promise<ProofRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE hash = $1', [hash]);
      if (result.rows.length === 0) return null;
      return this.rowToProofRecord(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getProofByCompoundHash(compoundHash: string): Promise<ProofRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE compound_hash = $1', [compoundHash]);
      if (result.rows.length === 0) return null;
      return this.rowToProofRecord(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getAllProofsByHash(hash: string): Promise<ProofRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE hash = $1 ORDER BY timestamp DESC', [hash]);
      return result.rows.map(row => this.rowToProofRecord(row));
    } finally {
      client.release();
    }
  }

  async getPendingProofs(): Promise<ProofRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE batch_id IS NULL ORDER BY timestamp ASC');
      return result.rows.map(row => this.rowToProofRecord(row));
    } finally {
      client.release();
    }
  }

  async getPendingCount(): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) FROM proofs WHERE batch_id IS NULL');
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  async updateProofBatch(hash: string, batchId: string, merkleIndex: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('UPDATE proofs SET batch_id = $1, merkle_index = $2 WHERE hash = $3', 
        [batchId, merkleIndex, hash]);
    } finally {
      client.release();
    }
  }

  async updateProofAnchors(hash: string, anchorTx: string, anchorChain: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('UPDATE proofs SET anchored = TRUE, anchor_tx = $1, anchor_chain = $2 WHERE hash = $3',
        [anchorTx, anchorChain, hash]);
    } finally {
      client.release();
    }
  }

  // Batch operations
  async storeBatch(batch: Omit<MerkleBatch, 'id'>): Promise<string> {
    const client = await this.pool.connect();
    try {
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await client.query(`
        INSERT INTO batches (id, root, size, created_at, anchored_at, anchor_tx, anchor_chain)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [batchId, batch.root, batch.size, batch.created_at, batch.anchored_at || null, 
          batch.anchor_tx || null, batch.anchor_chain || null]);
      return batchId;
    } finally {
      client.release();
    }
  }

  async getBatchById(batchId: string): Promise<MerkleBatch | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM batches WHERE id = $1', [batchId]);
      if (result.rows.length === 0) return null;
      return this.rowToMerkleBatch(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getAllBatches(): Promise<MerkleBatch[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM batches ORDER BY created_at DESC');
      return result.rows.map(row => this.rowToMerkleBatch(row));
    } finally {
      client.release();
    }
  }

  // Helper methods to convert database rows to types
  private rowToProofRecord(row: any): ProofRecord {
    return {
      id: row.id,
      hash: row.hash,
      signature: row.signature,
      did: row.did,
      timestamp: row.timestamp.toISOString(),
      submitted_at: row.submitted_at.toISOString(),
      batch_id: row.batch_id,
      merkle_index: row.merkle_index,
      anchored: row.anchored,
      anchor_tx: row.anchor_tx,
      anchor_chain: row.anchor_chain,
      process_digest: row.process_digest,
      compound_hash: row.compound_hash,
      process_metrics: row.process_metrics ? (typeof row.process_metrics === 'string' ? row.process_metrics : JSON.stringify(row.process_metrics)) : undefined,
      zk_proof: row.zk_proof ? (typeof row.zk_proof === 'string' ? row.zk_proof : JSON.stringify(row.zk_proof)) : undefined,
      tier: row.tier,
      authored_on_device: row.authored_on_device,
      environment_attestation: row.environment_attestation ? (typeof row.environment_attestation === 'string' ? row.environment_attestation : JSON.stringify(row.environment_attestation)) : undefined,
      derived_from: row.derived_from ? (typeof row.derived_from === 'string' ? row.derived_from : JSON.stringify(row.derived_from)) : undefined,
      assistance_profile: row.assistance_profile,
      claim_uri: row.claim_uri
    };
  }

  private rowToMerkleBatch(row: any): MerkleBatch {
    return {
      id: row.id,
      root: row.root,
      size: row.size,
      created_at: row.created_at.toISOString(),
      anchored_at: row.anchored_at ? row.anchored_at.toISOString() : undefined,
      anchor_tx: row.anchor_tx,
      anchor_chain: row.anchor_chain
    };
  }

  // Additional batch operations
  async storeMerkleBatch(batch: Omit<MerkleBatch, 'created_at'>): Promise<string> {
    return this.storeBatch({ ...batch, created_at: new Date().toISOString() });
  }

  async updateBatchAnchors(batchId: string, anchors: Array<{ chain: string; tx: string; block?: number }>): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Update with first anchor (simplified - could support multiple)
      if (anchors.length > 0) {
        const anchor = anchors[0];
        await client.query(
          'UPDATE batches SET anchored_at = NOW(), anchor_tx = $1, anchor_chain = $2 WHERE id = $3',
          [anchor.tx, anchor.chain, batchId]
        );
      }
    } finally {
      client.release();
    }
  }

  async getLatestBatch(): Promise<MerkleBatch | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM batches ORDER BY created_at DESC LIMIT 1');
      if (result.rows.length === 0) return null;
      return this.rowToMerkleBatch(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getBatchProofs(batchId: string): Promise<ProofRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE batch_id = $1 ORDER BY merkle_index ASC', [batchId]);
      return result.rows.map(row => this.rowToProofRecord(row));
    } finally {
      client.release();
    }
  }

  async getTotalProofs(): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) FROM proofs');
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  // DID operations
  async storeDIDDocument(did: string, document: DIDDocument): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO dids (did, document, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (did) DO UPDATE SET document = $2, updated_at = NOW()
      `, [did, JSON.stringify(document)]);
    } finally {
      client.release();
    }
  }

  async getDIDDocument(did: string): Promise<DIDDocument | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT document FROM dids WHERE did = $1', [did]);
      if (result.rows.length === 0) return null;
      return result.rows[0].document as DIDDocument;
    } finally {
      client.release();
    }
  }

  async getAllDIDDocuments(): Promise<DIDDocument[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT document FROM dids');
      return result.rows.map(row => row.document as DIDDocument);
    } finally {
      client.release();
    }
  }

  // KCG operations
  async storeKCGNode(did: string, node: KCGNode): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO kcg_nodes (did, node_data)
        VALUES ($1, $2)
        ON CONFLICT (did) DO UPDATE SET node_data = $2
      `, [did, JSON.stringify(node)]);
    } finally {
      client.release();
    }
  }

  async getKCGNode(did: string): Promise<KCGNode | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT node_data FROM kcg_nodes WHERE did = $1', [did]);
      if (result.rows.length === 0) return null;
      return result.rows[0].node_data as KCGNode;
    } finally {
      client.release();
    }
  }

  async getContinuityChain(did: string): Promise<KCGNode[]> {
    const chain: KCGNode[] = [];
    let currentDID: string | undefined = did;

    while (currentDID) {
      const node = await this.getKCGNode(currentDID);
      if (!node) break;
      chain.unshift(node);
      currentDID = node.previousNode;
    }

    return chain;
  }

  // Attestor operations
  async storeAttestor(did: string, record: AttestorRecord): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO attestors (did, record_data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (did) DO UPDATE SET record_data = $2, updated_at = NOW()
      `, [did, JSON.stringify(record)]);
    } finally {
      client.release();
    }
  }

  async getAttestor(did: string): Promise<AttestorRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT record_data FROM attestors WHERE did = $1', [did]);
      if (result.rows.length === 0) return null;
      return result.rows[0].record_data as AttestorRecord;
    } finally {
      client.release();
    }
  }

  async getAllAttestors(): Promise<AttestorRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT record_data FROM attestors');
      return result.rows.map(row => row.record_data as AttestorRecord);
    } finally {
      client.release();
    }
  }

  // Credential operations
  async storeCredential(hash: string, credential: VerifiableHumanCredential): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO credentials (credential_hash, subject_did, credential_data, issued_at, expires_at, revoked)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (credential_hash) DO UPDATE SET credential_data = $3, expires_at = $5, revoked = $6
      `, [
        hash,
        credential.credentialSubject?.id || (credential as any).subjectDID || '',
        JSON.stringify(credential),
        credential.issuanceDate || (credential as any).issuedAt || new Date().toISOString(),
        credential.expirationDate || null,
        (credential as any).revoked || false
      ]);
    } finally {
      client.release();
    }
  }

  async getCredential(hash: string): Promise<VerifiableHumanCredential | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT credential_data FROM credentials WHERE credential_hash = $1 AND revoked = FALSE', [hash]);
      if (result.rows.length === 0) return null;
      return result.rows[0].credential_data as VerifiableHumanCredential;
    } finally {
      client.release();
    }
  }

  async getAllCredentials(): Promise<VerifiableHumanCredential[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT credential_data FROM credentials WHERE revoked = FALSE');
      return result.rows.map(row => row.credential_data as VerifiableHumanCredential);
    } finally {
      client.release();
    }
  }

  // Revocation operations
  async storeRevocation(hash: string, revocation: RevocationRecord): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO revocations (credential_hash, revocation_data)
        VALUES ($1, $2)
        ON CONFLICT (credential_hash) DO UPDATE SET revocation_data = $2
      `, [hash, JSON.stringify(revocation)]);
      // Also mark credential as revoked
      await client.query('UPDATE credentials SET revoked = TRUE WHERE credential_hash = $1', [hash]);
    } finally {
      client.release();
    }
  }

  async getRevocation(hash: string): Promise<RevocationRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT revocation_data FROM revocations WHERE credential_hash = $1', [hash]);
      if (result.rows.length === 0) return null;
      return result.rows[0].revocation_data as RevocationRecord;
    } finally {
      client.release();
    }
  }

  async getAllRevocations(): Promise<RevocationRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT revocation_data FROM revocations');
      return result.rows.map(row => row.revocation_data as RevocationRecord);
    } finally {
      client.release();
    }
  }

  // Audit log operations
  async appendAuditLog(entry: AuditLogEntry): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('INSERT INTO audit_logs (log_data) VALUES ($1)', [JSON.stringify(entry)]);
      // Keep only last 10000 entries
      await client.query(`
        DELETE FROM audit_logs
        WHERE id NOT IN (
          SELECT id FROM audit_logs ORDER BY created_at DESC LIMIT 10000
        )
      `);
    } finally {
      client.release();
    }
  }

  async getAuditLogs(attestorDID?: string, limit: number = 100): Promise<AuditLogEntry[]> {
    const client = await this.pool.connect();
    try {
      let query = 'SELECT log_data FROM audit_logs';
      const params: any[] = [];
      
      if (attestorDID) {
        query += ' WHERE log_data->>\'attestorDID\' = $1';
        params.push(attestorDID);
      }
      
      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
      params.push(limit);
      
      const result = await client.query(query, params);
      return result.rows.map(row => row.log_data as AuditLogEntry);
    } finally {
      client.release();
    }
  }

  // Reputation operations
  async storeReputation(did: string, reputation: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO reputation (did, score, tier, successful_proofs, anomalies, last_updated)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (did) DO UPDATE SET
          score = $2, tier = $3, successful_proofs = $4, anomalies = $5, last_updated = NOW()
      `, [
        did,
        reputation.score || 50.0,
        reputation.tier || 'grey',
        reputation.successfulProofs || 0,
        reputation.anomalies || 0
      ]);
    } finally {
      client.release();
    }
  }

  async getReputation(did: string): Promise<any | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM reputation WHERE did = $1', [did]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        score: row.score,
        tier: row.tier,
        successfulProofs: row.successful_proofs,
        anomalies: row.anomalies,
        trustLevel: row.score / 100.0
      };
    } finally {
      client.release();
    }
  }

  async getAllReputation(): Promise<{ [did: string]: any }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM reputation');
      const reputation: { [did: string]: any } = {};
      result.rows.forEach(row => {
        reputation[row.did] = {
          score: row.score,
          tier: row.tier,
          successfulProofs: row.successful_proofs,
          anomalies: row.anomalies,
          trustLevel: row.score / 100.0
        };
      });
      return reputation;
    } finally {
      client.release();
    }
  }

  // Submission history operations
  async appendSubmissionHistory(did: string, record: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO submission_history (did, hash, timestamp)
        VALUES ($1, $2, $3)
        ON CONFLICT (did, hash, timestamp) DO NOTHING
      `, [did, record.hash, record.timestamp]);
      // Clean up old entries (older than 24 hours)
      await client.query(`
        DELETE FROM submission_history
        WHERE did = $1 AND timestamp < NOW() - INTERVAL '24 hours'
      `, [did]);
    } finally {
      client.release();
    }
  }

  async getSubmissionHistory(did: string): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT hash, timestamp FROM submission_history WHERE did = $1 ORDER BY timestamp DESC',
        [did]
      );
      return result.rows.map(row => ({
        hash: row.hash,
        timestamp: row.timestamp.toISOString()
      }));
    } finally {
      client.release();
    }
  }

  // Anomaly log operations
  async appendAnomalyLog(did: string, entry: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('INSERT INTO anomaly_log (did, entry) VALUES ($1, $2)', [did, entry]);
      // Keep only last 100 entries per DID
      await client.query(`
        DELETE FROM anomaly_log
        WHERE did = $1 AND id NOT IN (
          SELECT id FROM anomaly_log WHERE did = $1 ORDER BY created_at DESC LIMIT 100
        )
      `, [did]);
    } finally {
      client.release();
    }
  }

  async getAnomalyLog(did: string): Promise<string[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT entry FROM anomaly_log WHERE did = $1 ORDER BY created_at DESC LIMIT 100',
        [did]
      );
      return result.rows.map(row => row.entry);
    } finally {
      client.release();
    }
  }

  // Challenge operations
  async storeChallenge(challenge: Omit<ChallengeRecord, 'id'>): Promise<string> {
    const client = await this.pool.connect();
    try {
      const challengeId = `0x${require('crypto').createHash('sha256')
        .update(`${challenge.proof_hash}-${challenge.challenger_did}-${challenge.created_at}`)
        .digest('hex')
        .substring(0, 16)}`;
      
      await client.query(`
        INSERT INTO challenges (
          id, proof_hash, proof_did, challenger_did, reason, description,
          evidence, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        challengeId,
        challenge.proof_hash,
        challenge.proof_did,
        challenge.challenger_did,
        challenge.reason,
        challenge.description,
        challenge.evidence ? JSON.stringify(challenge.evidence) : null,
        challenge.status,
        challenge.created_at
      ]);
      
      return challengeId;
    } finally {
      client.release();
    }
  }

  async getChallengeById(challengeId: string): Promise<ChallengeRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM challenges WHERE id = $1', [challengeId]);
      if (result.rows.length === 0) return null;
      return this.rowToChallengeRecord(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getChallengesByProofHash(proofHash: string): Promise<ChallengeRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM challenges WHERE proof_hash = $1 ORDER BY created_at DESC', [proofHash]);
      return result.rows.map(row => this.rowToChallengeRecord(row));
    } finally {
      client.release();
    }
  }

  async getChallengesByDID(did: string): Promise<ChallengeRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM challenges WHERE proof_did = $1 OR challenger_did = $1 ORDER BY created_at DESC',
        [did]
      );
      return result.rows.map(row => this.rowToChallengeRecord(row));
    } finally {
      client.release();
    }
  }

  async updateChallenge(challengeId: string, updates: Partial<ChallengeRecord>): Promise<void> {
    const client = await this.pool.connect();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.status !== undefined) {
        fields.push(`status = $${paramIndex++}`);
        values.push(updates.status);
      }
      if (updates.resolution !== undefined) {
        fields.push(`resolution = $${paramIndex++}`);
        values.push(updates.resolution);
      }
      if (updates.resolver_did !== undefined) {
        fields.push(`resolver_did = $${paramIndex++}`);
        values.push(updates.resolver_did);
      }
      if (updates.author_response !== undefined) {
        fields.push(`author_response = $${paramIndex++}`);
        values.push(updates.author_response);
      }
      if (updates.resolution_notes !== undefined) {
        fields.push(`resolution_notes = $${paramIndex++}`);
        values.push(updates.resolution_notes);
      }
      if (updates.responded_at !== undefined) {
        fields.push(`responded_at = $${paramIndex++}`);
        values.push(updates.responded_at);
      }
      if (updates.resolved_at !== undefined) {
        fields.push(`resolved_at = $${paramIndex++}`);
        values.push(updates.resolved_at);
      }

      if (fields.length > 0) {
        values.push(challengeId);
        await client.query(
          `UPDATE challenges SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
          values
        );
      }
    } finally {
      client.release();
    }
  }

  // Transparency log operations
  async appendTransparencyLog(entry: {
    type: 'challenge_submitted' | 'challenge_responded' | 'challenge_resolved';
    challenge_id: string;
    proof_hash: string;
    did?: string;
    resolution?: string;
    timestamp: string;
    details?: any;
  }): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO transparency_log (log_type, challenge_id, proof_hash, did, resolution, timestamp, details)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        entry.type,
        entry.challenge_id,
        entry.proof_hash,
        entry.did || null,
        entry.resolution || null,
        entry.timestamp,
        entry.details ? JSON.stringify(entry.details) : null
      ]);
      // Keep only last 10000 entries
      await client.query(`
        DELETE FROM transparency_log
        WHERE id NOT IN (
          SELECT id FROM transparency_log ORDER BY created_at DESC LIMIT 10000
        )
      `);
    } finally {
      client.release();
    }
  }

  async getTransparencyLog(limit: number = 100): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM transparency_log ORDER BY timestamp DESC LIMIT $1',
        [limit]
      );
      return result.rows.map(row => ({
        type: row.log_type,
        challenge_id: row.challenge_id,
        proof_hash: row.proof_hash,
        did: row.did,
        resolution: row.resolution,
        timestamp: row.timestamp.toISOString(),
        details: row.details
      }));
    } finally {
      client.release();
    }
  }

  // Helper to convert row to ChallengeRecord
  private rowToChallengeRecord(row: any): ChallengeRecord {
    return {
      id: row.id,
      proof_hash: row.proof_hash,
      proof_did: row.proof_did,
      challenger_did: row.challenger_did,
      reason: row.reason,
      description: row.description,
      evidence: row.evidence ? (typeof row.evidence === 'string' ? row.evidence : JSON.stringify(row.evidence)) : undefined,
      status: row.status,
      resolution: row.resolution,
      created_at: row.created_at.toISOString(),
      responded_at: row.responded_at ? row.responded_at.toISOString() : undefined,
      resolved_at: row.resolved_at ? row.resolved_at.toISOString() : undefined,
      resolver_did: row.resolver_did,
      author_response: row.author_response,
      resolution_notes: row.resolution_notes
    };
  }

  // Close connection pool
  async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * Production-ready database implementation for PoHW registry nodes
 * Per whitepaper Section 12.2: "Written with modular backends for PostgreSQL"
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { ProofRecord, MerkleBatch, ChallengeRecord } from './types';
import { DIDDocument, KCGNode } from './did';
import { AttestorRecord, VerifiableHumanCredential, RevocationRecord, AuditLogEntry } from './attestors';

export class PostgreSQLDatabase {
  private pool: Pool;
  private initialized: boolean = false;

  constructor(connectionString?: string) {
    const connString = connectionString || process.env.DATABASE_URL || 
      `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || ''}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'pohw_registry'}`;
    
    this.pool = new Pool({
      connectionString: connString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }

  /**
   * Initialize database schema
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Create proofs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS proofs (
          id SERIAL PRIMARY KEY,
          hash VARCHAR(66) NOT NULL UNIQUE,
          signature TEXT NOT NULL,
          did VARCHAR(255) NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
          batch_id VARCHAR(255),
          merkle_index INTEGER,
          anchored BOOLEAN DEFAULT FALSE,
          anchor_tx VARCHAR(255),
          anchor_chain VARCHAR(50),
          process_digest VARCHAR(66),
          compound_hash VARCHAR(66),
          process_metrics JSONB,
          zk_proof JSONB,
          tier VARCHAR(20),
          authored_on_device TEXT,
          environment_attestation JSONB,
          derived_from JSONB,
          assistance_profile VARCHAR(20),
          claim_uri TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Add claim_uri column if it doesn't exist (for existing databases)
      await client.query(`
        ALTER TABLE proofs 
        ADD COLUMN IF NOT EXISTS claim_uri TEXT
      `);

      // Create indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_hash ON proofs(hash)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_compound_hash ON proofs(compound_hash)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_did ON proofs(did)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_batch_id ON proofs(batch_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_timestamp ON proofs(timestamp)');

      // Create batches table
      await client.query(`
        CREATE TABLE IF NOT EXISTS batches (
          id VARCHAR(255) PRIMARY KEY,
          root VARCHAR(66) NOT NULL,
          size INTEGER NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          anchored_at TIMESTAMP,
          anchor_tx VARCHAR(255),
          anchor_chain VARCHAR(50)
        )
      `);

      // Create DIDs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS dids (
          did VARCHAR(255) PRIMARY KEY,
          document JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create KCG nodes table
      await client.query(`
        CREATE TABLE IF NOT EXISTS kcg_nodes (
          did VARCHAR(255) PRIMARY KEY,
          node_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create attestors table
      await client.query(`
        CREATE TABLE IF NOT EXISTS attestors (
          did VARCHAR(255) PRIMARY KEY,
          record_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create credentials table
      await client.query(`
        CREATE TABLE IF NOT EXISTS credentials (
          credential_hash VARCHAR(255) PRIMARY KEY,
          subject_did VARCHAR(255) NOT NULL,
          credential_data JSONB NOT NULL,
          issued_at TIMESTAMP NOT NULL,
          expires_at TIMESTAMP,
          revoked BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_credentials_subject_did ON credentials(subject_did)');

      // Create revocations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS revocations (
          credential_hash VARCHAR(255) PRIMARY KEY,
          revocation_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create audit logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          log_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)');

      // Create reputation table
      await client.query(`
        CREATE TABLE IF NOT EXISTS reputation (
          did VARCHAR(255) PRIMARY KEY,
          score REAL NOT NULL DEFAULT 50.0,
          tier VARCHAR(20) NOT NULL DEFAULT 'grey',
          successful_proofs INTEGER DEFAULT 0,
          anomalies INTEGER DEFAULT 0,
          last_updated TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create submission history table
      await client.query(`
        CREATE TABLE IF NOT EXISTS submission_history (
          did VARCHAR(255) NOT NULL,
          hash VARCHAR(66) NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY (did, hash, timestamp)
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_submission_history_did ON submission_history(did)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_submission_history_timestamp ON submission_history(timestamp)');

      // Create anomaly log table
      await client.query(`
        CREATE TABLE IF NOT EXISTS anomaly_log (
          id SERIAL PRIMARY KEY,
          did VARCHAR(255) NOT NULL,
          entry TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_anomaly_log_did ON anomaly_log(did)');

      // Create challenges table
      await client.query(`
        CREATE TABLE IF NOT EXISTS challenges (
          id VARCHAR(255) PRIMARY KEY,
          proof_hash VARCHAR(66) NOT NULL,
          proof_did VARCHAR(255) NOT NULL,
          challenger_did VARCHAR(255) NOT NULL,
          reason VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          evidence JSONB,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          resolution VARCHAR(20),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          responded_at TIMESTAMP,
          resolved_at TIMESTAMP,
          resolver_did VARCHAR(255),
          author_response TEXT,
          resolution_notes TEXT
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_challenges_proof_hash ON challenges(proof_hash)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_challenges_proof_did ON challenges(proof_did)');

      // Create transparency log table
      await client.query(`
        CREATE TABLE IF NOT EXISTS transparency_log (
          id SERIAL PRIMARY KEY,
          log_type VARCHAR(50) NOT NULL,
          challenge_id VARCHAR(255),
          proof_hash VARCHAR(66),
          did VARCHAR(255),
          resolution VARCHAR(50),
          timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
          details JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_transparency_log_timestamp ON transparency_log(timestamp)');

      await client.query('COMMIT');
      this.initialized = true;
      console.log('[PostgreSQL] Database schema initialized');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Proof operations
  async storeProof(proof: Omit<ProofRecord, 'id' | 'submitted_at'>): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO proofs (
          hash, signature, did, timestamp, submitted_at,
          batch_id, merkle_index, anchored, anchor_tx, anchor_chain,
          process_digest, compound_hash, process_metrics, zk_proof, tier,
          authored_on_device, environment_attestation, derived_from, assistance_profile, claim_uri
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id
      `, [
        proof.hash, proof.signature, proof.did, proof.timestamp,
        proof.batch_id || null, proof.merkle_index || null, proof.anchored || false,
        proof.anchor_tx || null, proof.anchor_chain || null,
        proof.process_digest || null, proof.compound_hash || null,
        proof.process_metrics ? JSON.stringify(proof.process_metrics) : null,
        proof.zk_proof ? JSON.stringify(proof.zk_proof) : null,
        proof.tier || null, proof.authored_on_device || null,
        proof.environment_attestation ? JSON.stringify(proof.environment_attestation) : null,
        proof.derived_from ? JSON.stringify(proof.derived_from) : null,
        proof.assistance_profile || null,
        proof.claim_uri || null
      ]);
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  async getProofByHash(hash: string): Promise<ProofRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE hash = $1', [hash]);
      if (result.rows.length === 0) return null;
      return this.rowToProofRecord(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getProofByCompoundHash(compoundHash: string): Promise<ProofRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE compound_hash = $1', [compoundHash]);
      if (result.rows.length === 0) return null;
      return this.rowToProofRecord(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getAllProofsByHash(hash: string): Promise<ProofRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE hash = $1 ORDER BY timestamp DESC', [hash]);
      return result.rows.map(row => this.rowToProofRecord(row));
    } finally {
      client.release();
    }
  }

  async getPendingProofs(): Promise<ProofRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE batch_id IS NULL ORDER BY timestamp ASC');
      return result.rows.map(row => this.rowToProofRecord(row));
    } finally {
      client.release();
    }
  }

  async getPendingCount(): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) FROM proofs WHERE batch_id IS NULL');
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  async updateProofBatch(hash: string, batchId: string, merkleIndex: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('UPDATE proofs SET batch_id = $1, merkle_index = $2 WHERE hash = $3', 
        [batchId, merkleIndex, hash]);
    } finally {
      client.release();
    }
  }

  async updateProofAnchors(hash: string, anchorTx: string, anchorChain: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('UPDATE proofs SET anchored = TRUE, anchor_tx = $1, anchor_chain = $2 WHERE hash = $3',
        [anchorTx, anchorChain, hash]);
    } finally {
      client.release();
    }
  }

  // Batch operations
  async storeBatch(batch: Omit<MerkleBatch, 'id'>): Promise<string> {
    const client = await this.pool.connect();
    try {
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await client.query(`
        INSERT INTO batches (id, root, size, created_at, anchored_at, anchor_tx, anchor_chain)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [batchId, batch.root, batch.size, batch.created_at, batch.anchored_at || null, 
          batch.anchor_tx || null, batch.anchor_chain || null]);
      return batchId;
    } finally {
      client.release();
    }
  }

  async getBatchById(batchId: string): Promise<MerkleBatch | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM batches WHERE id = $1', [batchId]);
      if (result.rows.length === 0) return null;
      return this.rowToMerkleBatch(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getAllBatches(): Promise<MerkleBatch[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM batches ORDER BY created_at DESC');
      return result.rows.map(row => this.rowToMerkleBatch(row));
    } finally {
      client.release();
    }
  }

  // Helper methods to convert database rows to types
  private rowToProofRecord(row: any): ProofRecord {
    return {
      id: row.id,
      hash: row.hash,
      signature: row.signature,
      did: row.did,
      timestamp: row.timestamp.toISOString(),
      submitted_at: row.submitted_at.toISOString(),
      batch_id: row.batch_id,
      merkle_index: row.merkle_index,
      anchored: row.anchored,
      anchor_tx: row.anchor_tx,
      anchor_chain: row.anchor_chain,
      process_digest: row.process_digest,
      compound_hash: row.compound_hash,
      process_metrics: row.process_metrics ? (typeof row.process_metrics === 'string' ? row.process_metrics : JSON.stringify(row.process_metrics)) : undefined,
      zk_proof: row.zk_proof ? (typeof row.zk_proof === 'string' ? row.zk_proof : JSON.stringify(row.zk_proof)) : undefined,
      tier: row.tier,
      authored_on_device: row.authored_on_device,
      environment_attestation: row.environment_attestation ? (typeof row.environment_attestation === 'string' ? row.environment_attestation : JSON.stringify(row.environment_attestation)) : undefined,
      derived_from: row.derived_from ? (typeof row.derived_from === 'string' ? row.derived_from : JSON.stringify(row.derived_from)) : undefined,
      assistance_profile: row.assistance_profile,
      claim_uri: row.claim_uri
    };
  }

  private rowToMerkleBatch(row: any): MerkleBatch {
    return {
      id: row.id,
      root: row.root,
      size: row.size,
      created_at: row.created_at.toISOString(),
      anchored_at: row.anchored_at ? row.anchored_at.toISOString() : undefined,
      anchor_tx: row.anchor_tx,
      anchor_chain: row.anchor_chain
    };
  }

  // Additional batch operations
  async storeMerkleBatch(batch: Omit<MerkleBatch, 'created_at'>): Promise<string> {
    return this.storeBatch({ ...batch, created_at: new Date().toISOString() });
  }

  async updateBatchAnchors(batchId: string, anchors: Array<{ chain: string; tx: string; block?: number }>): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Update with first anchor (simplified - could support multiple)
      if (anchors.length > 0) {
        const anchor = anchors[0];
        await client.query(
          'UPDATE batches SET anchored_at = NOW(), anchor_tx = $1, anchor_chain = $2 WHERE id = $3',
          [anchor.tx, anchor.chain, batchId]
        );
      }
    } finally {
      client.release();
    }
  }

  async getLatestBatch(): Promise<MerkleBatch | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM batches ORDER BY created_at DESC LIMIT 1');
      if (result.rows.length === 0) return null;
      return this.rowToMerkleBatch(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getBatchProofs(batchId: string): Promise<ProofRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE batch_id = $1 ORDER BY merkle_index ASC', [batchId]);
      return result.rows.map(row => this.rowToProofRecord(row));
    } finally {
      client.release();
    }
  }

  async getTotalProofs(): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) FROM proofs');
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  // DID operations
  async storeDIDDocument(did: string, document: DIDDocument): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO dids (did, document, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (did) DO UPDATE SET document = $2, updated_at = NOW()
      `, [did, JSON.stringify(document)]);
    } finally {
      client.release();
    }
  }

  async getDIDDocument(did: string): Promise<DIDDocument | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT document FROM dids WHERE did = $1', [did]);
      if (result.rows.length === 0) return null;
      return result.rows[0].document as DIDDocument;
    } finally {
      client.release();
    }
  }

  async getAllDIDDocuments(): Promise<DIDDocument[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT document FROM dids');
      return result.rows.map(row => row.document as DIDDocument);
    } finally {
      client.release();
    }
  }

  // KCG operations
  async storeKCGNode(did: string, node: KCGNode): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO kcg_nodes (did, node_data)
        VALUES ($1, $2)
        ON CONFLICT (did) DO UPDATE SET node_data = $2
      `, [did, JSON.stringify(node)]);
    } finally {
      client.release();
    }
  }

  async getKCGNode(did: string): Promise<KCGNode | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT node_data FROM kcg_nodes WHERE did = $1', [did]);
      if (result.rows.length === 0) return null;
      return result.rows[0].node_data as KCGNode;
    } finally {
      client.release();
    }
  }

  async getContinuityChain(did: string): Promise<KCGNode[]> {
    const chain: KCGNode[] = [];
    let currentDID: string | undefined = did;

    while (currentDID) {
      const node = await this.getKCGNode(currentDID);
      if (!node) break;
      chain.unshift(node);
      currentDID = node.previousNode;
    }

    return chain;
  }

  // Attestor operations
  async storeAttestor(did: string, record: AttestorRecord): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO attestors (did, record_data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (did) DO UPDATE SET record_data = $2, updated_at = NOW()
      `, [did, JSON.stringify(record)]);
    } finally {
      client.release();
    }
  }

  async getAttestor(did: string): Promise<AttestorRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT record_data FROM attestors WHERE did = $1', [did]);
      if (result.rows.length === 0) return null;
      return result.rows[0].record_data as AttestorRecord;
    } finally {
      client.release();
    }
  }

  async getAllAttestors(): Promise<AttestorRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT record_data FROM attestors');
      return result.rows.map(row => row.record_data as AttestorRecord);
    } finally {
      client.release();
    }
  }

  // Credential operations
  async storeCredential(hash: string, credential: VerifiableHumanCredential): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO credentials (credential_hash, subject_did, credential_data, issued_at, expires_at, revoked)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (credential_hash) DO UPDATE SET credential_data = $3, expires_at = $5, revoked = $6
      `, [
        hash,
        credential.credentialSubject?.id || (credential as any).subjectDID || '',
        JSON.stringify(credential),
        credential.issuanceDate || (credential as any).issuedAt || new Date().toISOString(),
        credential.expirationDate || null,
        (credential as any).revoked || false
      ]);
    } finally {
      client.release();
    }
  }

  async getCredential(hash: string): Promise<VerifiableHumanCredential | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT credential_data FROM credentials WHERE credential_hash = $1 AND revoked = FALSE', [hash]);
      if (result.rows.length === 0) return null;
      return result.rows[0].credential_data as VerifiableHumanCredential;
    } finally {
      client.release();
    }
  }

  async getAllCredentials(): Promise<VerifiableHumanCredential[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT credential_data FROM credentials WHERE revoked = FALSE');
      return result.rows.map(row => row.credential_data as VerifiableHumanCredential);
    } finally {
      client.release();
    }
  }

  // Revocation operations
  async storeRevocation(hash: string, revocation: RevocationRecord): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO revocations (credential_hash, revocation_data)
        VALUES ($1, $2)
        ON CONFLICT (credential_hash) DO UPDATE SET revocation_data = $2
      `, [hash, JSON.stringify(revocation)]);
      // Also mark credential as revoked
      await client.query('UPDATE credentials SET revoked = TRUE WHERE credential_hash = $1', [hash]);
    } finally {
      client.release();
    }
  }

  async getRevocation(hash: string): Promise<RevocationRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT revocation_data FROM revocations WHERE credential_hash = $1', [hash]);
      if (result.rows.length === 0) return null;
      return result.rows[0].revocation_data as RevocationRecord;
    } finally {
      client.release();
    }
  }

  async getAllRevocations(): Promise<RevocationRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT revocation_data FROM revocations');
      return result.rows.map(row => row.revocation_data as RevocationRecord);
    } finally {
      client.release();
    }
  }

  // Audit log operations
  async appendAuditLog(entry: AuditLogEntry): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('INSERT INTO audit_logs (log_data) VALUES ($1)', [JSON.stringify(entry)]);
      // Keep only last 10000 entries
      await client.query(`
        DELETE FROM audit_logs
        WHERE id NOT IN (
          SELECT id FROM audit_logs ORDER BY created_at DESC LIMIT 10000
        )
      `);
    } finally {
      client.release();
    }
  }

  async getAuditLogs(attestorDID?: string, limit: number = 100): Promise<AuditLogEntry[]> {
    const client = await this.pool.connect();
    try {
      let query = 'SELECT log_data FROM audit_logs';
      const params: any[] = [];
      
      if (attestorDID) {
        query += ' WHERE log_data->>\'attestorDID\' = $1';
        params.push(attestorDID);
      }
      
      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
      params.push(limit);
      
      const result = await client.query(query, params);
      return result.rows.map(row => row.log_data as AuditLogEntry);
    } finally {
      client.release();
    }
  }

  // Reputation operations
  async storeReputation(did: string, reputation: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO reputation (did, score, tier, successful_proofs, anomalies, last_updated)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (did) DO UPDATE SET
          score = $2, tier = $3, successful_proofs = $4, anomalies = $5, last_updated = NOW()
      `, [
        did,
        reputation.score || 50.0,
        reputation.tier || 'grey',
        reputation.successfulProofs || 0,
        reputation.anomalies || 0
      ]);
    } finally {
      client.release();
    }
  }

  async getReputation(did: string): Promise<any | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM reputation WHERE did = $1', [did]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        score: row.score,
        tier: row.tier,
        successfulProofs: row.successful_proofs,
        anomalies: row.anomalies,
        trustLevel: row.score / 100.0
      };
    } finally {
      client.release();
    }
  }

  async getAllReputation(): Promise<{ [did: string]: any }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM reputation');
      const reputation: { [did: string]: any } = {};
      result.rows.forEach(row => {
        reputation[row.did] = {
          score: row.score,
          tier: row.tier,
          successfulProofs: row.successful_proofs,
          anomalies: row.anomalies,
          trustLevel: row.score / 100.0
        };
      });
      return reputation;
    } finally {
      client.release();
    }
  }

  // Submission history operations
  async appendSubmissionHistory(did: string, record: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO submission_history (did, hash, timestamp)
        VALUES ($1, $2, $3)
        ON CONFLICT (did, hash, timestamp) DO NOTHING
      `, [did, record.hash, record.timestamp]);
      // Clean up old entries (older than 24 hours)
      await client.query(`
        DELETE FROM submission_history
        WHERE did = $1 AND timestamp < NOW() - INTERVAL '24 hours'
      `, [did]);
    } finally {
      client.release();
    }
  }

  async getSubmissionHistory(did: string): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT hash, timestamp FROM submission_history WHERE did = $1 ORDER BY timestamp DESC',
        [did]
      );
      return result.rows.map(row => ({
        hash: row.hash,
        timestamp: row.timestamp.toISOString()
      }));
    } finally {
      client.release();
    }
  }

  // Anomaly log operations
  async appendAnomalyLog(did: string, entry: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('INSERT INTO anomaly_log (did, entry) VALUES ($1, $2)', [did, entry]);
      // Keep only last 100 entries per DID
      await client.query(`
        DELETE FROM anomaly_log
        WHERE did = $1 AND id NOT IN (
          SELECT id FROM anomaly_log WHERE did = $1 ORDER BY created_at DESC LIMIT 100
        )
      `, [did]);
    } finally {
      client.release();
    }
  }

  async getAnomalyLog(did: string): Promise<string[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT entry FROM anomaly_log WHERE did = $1 ORDER BY created_at DESC LIMIT 100',
        [did]
      );
      return result.rows.map(row => row.entry);
    } finally {
      client.release();
    }
  }

  // Challenge operations
  async storeChallenge(challenge: Omit<ChallengeRecord, 'id'>): Promise<string> {
    const client = await this.pool.connect();
    try {
      const challengeId = `0x${require('crypto').createHash('sha256')
        .update(`${challenge.proof_hash}-${challenge.challenger_did}-${challenge.created_at}`)
        .digest('hex')
        .substring(0, 16)}`;
      
      await client.query(`
        INSERT INTO challenges (
          id, proof_hash, proof_did, challenger_did, reason, description,
          evidence, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        challengeId,
        challenge.proof_hash,
        challenge.proof_did,
        challenge.challenger_did,
        challenge.reason,
        challenge.description,
        challenge.evidence ? JSON.stringify(challenge.evidence) : null,
        challenge.status,
        challenge.created_at
      ]);
      
      return challengeId;
    } finally {
      client.release();
    }
  }

  async getChallengeById(challengeId: string): Promise<ChallengeRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM challenges WHERE id = $1', [challengeId]);
      if (result.rows.length === 0) return null;
      return this.rowToChallengeRecord(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getChallengesByProofHash(proofHash: string): Promise<ChallengeRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM challenges WHERE proof_hash = $1 ORDER BY created_at DESC', [proofHash]);
      return result.rows.map(row => this.rowToChallengeRecord(row));
    } finally {
      client.release();
    }
  }

  async getChallengesByDID(did: string): Promise<ChallengeRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM challenges WHERE proof_did = $1 OR challenger_did = $1 ORDER BY created_at DESC',
        [did]
      );
      return result.rows.map(row => this.rowToChallengeRecord(row));
    } finally {
      client.release();
    }
  }

  async updateChallenge(challengeId: string, updates: Partial<ChallengeRecord>): Promise<void> {
    const client = await this.pool.connect();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.status !== undefined) {
        fields.push(`status = $${paramIndex++}`);
        values.push(updates.status);
      }
      if (updates.resolution !== undefined) {
        fields.push(`resolution = $${paramIndex++}`);
        values.push(updates.resolution);
      }
      if (updates.resolver_did !== undefined) {
        fields.push(`resolver_did = $${paramIndex++}`);
        values.push(updates.resolver_did);
      }
      if (updates.author_response !== undefined) {
        fields.push(`author_response = $${paramIndex++}`);
        values.push(updates.author_response);
      }
      if (updates.resolution_notes !== undefined) {
        fields.push(`resolution_notes = $${paramIndex++}`);
        values.push(updates.resolution_notes);
      }
      if (updates.responded_at !== undefined) {
        fields.push(`responded_at = $${paramIndex++}`);
        values.push(updates.responded_at);
      }
      if (updates.resolved_at !== undefined) {
        fields.push(`resolved_at = $${paramIndex++}`);
        values.push(updates.resolved_at);
      }

      if (fields.length > 0) {
        values.push(challengeId);
        await client.query(
          `UPDATE challenges SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
          values
        );
      }
    } finally {
      client.release();
    }
  }

  // Transparency log operations
  async appendTransparencyLog(entry: {
    type: 'challenge_submitted' | 'challenge_responded' | 'challenge_resolved';
    challenge_id: string;
    proof_hash: string;
    did?: string;
    resolution?: string;
    timestamp: string;
    details?: any;
  }): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO transparency_log (log_type, challenge_id, proof_hash, did, resolution, timestamp, details)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        entry.type,
        entry.challenge_id,
        entry.proof_hash,
        entry.did || null,
        entry.resolution || null,
        entry.timestamp,
        entry.details ? JSON.stringify(entry.details) : null
      ]);
      // Keep only last 10000 entries
      await client.query(`
        DELETE FROM transparency_log
        WHERE id NOT IN (
          SELECT id FROM transparency_log ORDER BY created_at DESC LIMIT 10000
        )
      `);
    } finally {
      client.release();
    }
  }

  async getTransparencyLog(limit: number = 100): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM transparency_log ORDER BY timestamp DESC LIMIT $1',
        [limit]
      );
      return result.rows.map(row => ({
        type: row.log_type,
        challenge_id: row.challenge_id,
        proof_hash: row.proof_hash,
        did: row.did,
        resolution: row.resolution,
        timestamp: row.timestamp.toISOString(),
        details: row.details
      }));
    } finally {
      client.release();
    }
  }

  // Helper to convert row to ChallengeRecord
  private rowToChallengeRecord(row: any): ChallengeRecord {
    return {
      id: row.id,
      proof_hash: row.proof_hash,
      proof_did: row.proof_did,
      challenger_did: row.challenger_did,
      reason: row.reason,
      description: row.description,
      evidence: row.evidence ? (typeof row.evidence === 'string' ? row.evidence : JSON.stringify(row.evidence)) : undefined,
      status: row.status,
      resolution: row.resolution,
      created_at: row.created_at.toISOString(),
      responded_at: row.responded_at ? row.responded_at.toISOString() : undefined,
      resolved_at: row.resolved_at ? row.resolved_at.toISOString() : undefined,
      resolver_did: row.resolver_did,
      author_response: row.author_response,
      resolution_notes: row.resolution_notes
    };
  }

  // Close connection pool
  async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * Production-ready database implementation for PoHW registry nodes
 * Per whitepaper Section 12.2: "Written with modular backends for PostgreSQL"
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { ProofRecord, MerkleBatch, ChallengeRecord } from './types';
import { DIDDocument, KCGNode } from './did';
import { AttestorRecord, VerifiableHumanCredential, RevocationRecord, AuditLogEntry } from './attestors';

export class PostgreSQLDatabase {
  private pool: Pool;
  private initialized: boolean = false;

  constructor(connectionString?: string) {
    const connString = connectionString || process.env.DATABASE_URL || 
      `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || ''}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'pohw_registry'}`;
    
    this.pool = new Pool({
      connectionString: connString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }

  /**
   * Initialize database schema
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Create proofs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS proofs (
          id SERIAL PRIMARY KEY,
          hash VARCHAR(66) NOT NULL UNIQUE,
          signature TEXT NOT NULL,
          did VARCHAR(255) NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
          batch_id VARCHAR(255),
          merkle_index INTEGER,
          anchored BOOLEAN DEFAULT FALSE,
          anchor_tx VARCHAR(255),
          anchor_chain VARCHAR(50),
          process_digest VARCHAR(66),
          compound_hash VARCHAR(66),
          process_metrics JSONB,
          zk_proof JSONB,
          tier VARCHAR(20),
          authored_on_device TEXT,
          environment_attestation JSONB,
          derived_from JSONB,
          assistance_profile VARCHAR(20),
          claim_uri TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Add claim_uri column if it doesn't exist (for existing databases)
      await client.query(`
        ALTER TABLE proofs 
        ADD COLUMN IF NOT EXISTS claim_uri TEXT
      `);

      // Create indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_hash ON proofs(hash)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_compound_hash ON proofs(compound_hash)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_did ON proofs(did)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_batch_id ON proofs(batch_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_timestamp ON proofs(timestamp)');

      // Create batches table
      await client.query(`
        CREATE TABLE IF NOT EXISTS batches (
          id VARCHAR(255) PRIMARY KEY,
          root VARCHAR(66) NOT NULL,
          size INTEGER NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          anchored_at TIMESTAMP,
          anchor_tx VARCHAR(255),
          anchor_chain VARCHAR(50)
        )
      `);

      // Create DIDs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS dids (
          did VARCHAR(255) PRIMARY KEY,
          document JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create KCG nodes table
      await client.query(`
        CREATE TABLE IF NOT EXISTS kcg_nodes (
          did VARCHAR(255) PRIMARY KEY,
          node_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create attestors table
      await client.query(`
        CREATE TABLE IF NOT EXISTS attestors (
          did VARCHAR(255) PRIMARY KEY,
          record_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create credentials table
      await client.query(`
        CREATE TABLE IF NOT EXISTS credentials (
          credential_hash VARCHAR(255) PRIMARY KEY,
          subject_did VARCHAR(255) NOT NULL,
          credential_data JSONB NOT NULL,
          issued_at TIMESTAMP NOT NULL,
          expires_at TIMESTAMP,
          revoked BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_credentials_subject_did ON credentials(subject_did)');

      // Create revocations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS revocations (
          credential_hash VARCHAR(255) PRIMARY KEY,
          revocation_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create audit logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          log_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)');

      // Create reputation table
      await client.query(`
        CREATE TABLE IF NOT EXISTS reputation (
          did VARCHAR(255) PRIMARY KEY,
          score REAL NOT NULL DEFAULT 50.0,
          tier VARCHAR(20) NOT NULL DEFAULT 'grey',
          successful_proofs INTEGER DEFAULT 0,
          anomalies INTEGER DEFAULT 0,
          last_updated TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create submission history table
      await client.query(`
        CREATE TABLE IF NOT EXISTS submission_history (
          did VARCHAR(255) NOT NULL,
          hash VARCHAR(66) NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY (did, hash, timestamp)
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_submission_history_did ON submission_history(did)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_submission_history_timestamp ON submission_history(timestamp)');

      // Create anomaly log table
      await client.query(`
        CREATE TABLE IF NOT EXISTS anomaly_log (
          id SERIAL PRIMARY KEY,
          did VARCHAR(255) NOT NULL,
          entry TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_anomaly_log_did ON anomaly_log(did)');

      // Create challenges table
      await client.query(`
        CREATE TABLE IF NOT EXISTS challenges (
          id VARCHAR(255) PRIMARY KEY,
          proof_hash VARCHAR(66) NOT NULL,
          proof_did VARCHAR(255) NOT NULL,
          challenger_did VARCHAR(255) NOT NULL,
          reason VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          evidence JSONB,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          resolution VARCHAR(20),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          responded_at TIMESTAMP,
          resolved_at TIMESTAMP,
          resolver_did VARCHAR(255),
          author_response TEXT,
          resolution_notes TEXT
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_challenges_proof_hash ON challenges(proof_hash)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_challenges_proof_did ON challenges(proof_did)');

      // Create transparency log table
      await client.query(`
        CREATE TABLE IF NOT EXISTS transparency_log (
          id SERIAL PRIMARY KEY,
          log_type VARCHAR(50) NOT NULL,
          challenge_id VARCHAR(255),
          proof_hash VARCHAR(66),
          did VARCHAR(255),
          resolution VARCHAR(50),
          timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
          details JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_transparency_log_timestamp ON transparency_log(timestamp)');

      await client.query('COMMIT');
      this.initialized = true;
      console.log('[PostgreSQL] Database schema initialized');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Proof operations
  async storeProof(proof: Omit<ProofRecord, 'id' | 'submitted_at'>): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO proofs (
          hash, signature, did, timestamp, submitted_at,
          batch_id, merkle_index, anchored, anchor_tx, anchor_chain,
          process_digest, compound_hash, process_metrics, zk_proof, tier,
          authored_on_device, environment_attestation, derived_from, assistance_profile, claim_uri
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id
      `, [
        proof.hash, proof.signature, proof.did, proof.timestamp,
        proof.batch_id || null, proof.merkle_index || null, proof.anchored || false,
        proof.anchor_tx || null, proof.anchor_chain || null,
        proof.process_digest || null, proof.compound_hash || null,
        proof.process_metrics ? JSON.stringify(proof.process_metrics) : null,
        proof.zk_proof ? JSON.stringify(proof.zk_proof) : null,
        proof.tier || null, proof.authored_on_device || null,
        proof.environment_attestation ? JSON.stringify(proof.environment_attestation) : null,
        proof.derived_from ? JSON.stringify(proof.derived_from) : null,
        proof.assistance_profile || null,
        proof.claim_uri || null
      ]);
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  async getProofByHash(hash: string): Promise<ProofRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE hash = $1', [hash]);
      if (result.rows.length === 0) return null;
      return this.rowToProofRecord(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getProofByCompoundHash(compoundHash: string): Promise<ProofRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE compound_hash = $1', [compoundHash]);
      if (result.rows.length === 0) return null;
      return this.rowToProofRecord(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getAllProofsByHash(hash: string): Promise<ProofRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE hash = $1 ORDER BY timestamp DESC', [hash]);
      return result.rows.map(row => this.rowToProofRecord(row));
    } finally {
      client.release();
    }
  }

  async getPendingProofs(): Promise<ProofRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE batch_id IS NULL ORDER BY timestamp ASC');
      return result.rows.map(row => this.rowToProofRecord(row));
    } finally {
      client.release();
    }
  }

  async getPendingCount(): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) FROM proofs WHERE batch_id IS NULL');
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  async updateProofBatch(hash: string, batchId: string, merkleIndex: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('UPDATE proofs SET batch_id = $1, merkle_index = $2 WHERE hash = $3', 
        [batchId, merkleIndex, hash]);
    } finally {
      client.release();
    }
  }

  async updateProofAnchors(hash: string, anchorTx: string, anchorChain: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('UPDATE proofs SET anchored = TRUE, anchor_tx = $1, anchor_chain = $2 WHERE hash = $3',
        [anchorTx, anchorChain, hash]);
    } finally {
      client.release();
    }
  }

  // Batch operations
  async storeBatch(batch: Omit<MerkleBatch, 'id'>): Promise<string> {
    const client = await this.pool.connect();
    try {
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await client.query(`
        INSERT INTO batches (id, root, size, created_at, anchored_at, anchor_tx, anchor_chain)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [batchId, batch.root, batch.size, batch.created_at, batch.anchored_at || null, 
          batch.anchor_tx || null, batch.anchor_chain || null]);
      return batchId;
    } finally {
      client.release();
    }
  }

  async getBatchById(batchId: string): Promise<MerkleBatch | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM batches WHERE id = $1', [batchId]);
      if (result.rows.length === 0) return null;
      return this.rowToMerkleBatch(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getAllBatches(): Promise<MerkleBatch[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM batches ORDER BY created_at DESC');
      return result.rows.map(row => this.rowToMerkleBatch(row));
    } finally {
      client.release();
    }
  }

  // Helper methods to convert database rows to types
  private rowToProofRecord(row: any): ProofRecord {
    return {
      id: row.id,
      hash: row.hash,
      signature: row.signature,
      did: row.did,
      timestamp: row.timestamp.toISOString(),
      submitted_at: row.submitted_at.toISOString(),
      batch_id: row.batch_id,
      merkle_index: row.merkle_index,
      anchored: row.anchored,
      anchor_tx: row.anchor_tx,
      anchor_chain: row.anchor_chain,
      process_digest: row.process_digest,
      compound_hash: row.compound_hash,
      process_metrics: row.process_metrics ? (typeof row.process_metrics === 'string' ? row.process_metrics : JSON.stringify(row.process_metrics)) : undefined,
      zk_proof: row.zk_proof ? (typeof row.zk_proof === 'string' ? row.zk_proof : JSON.stringify(row.zk_proof)) : undefined,
      tier: row.tier,
      authored_on_device: row.authored_on_device,
      environment_attestation: row.environment_attestation ? (typeof row.environment_attestation === 'string' ? row.environment_attestation : JSON.stringify(row.environment_attestation)) : undefined,
      derived_from: row.derived_from ? (typeof row.derived_from === 'string' ? row.derived_from : JSON.stringify(row.derived_from)) : undefined,
      assistance_profile: row.assistance_profile,
      claim_uri: row.claim_uri
    };
  }

  private rowToMerkleBatch(row: any): MerkleBatch {
    return {
      id: row.id,
      root: row.root,
      size: row.size,
      created_at: row.created_at.toISOString(),
      anchored_at: row.anchored_at ? row.anchored_at.toISOString() : undefined,
      anchor_tx: row.anchor_tx,
      anchor_chain: row.anchor_chain
    };
  }

  // Additional batch operations
  async storeMerkleBatch(batch: Omit<MerkleBatch, 'created_at'>): Promise<string> {
    return this.storeBatch({ ...batch, created_at: new Date().toISOString() });
  }

  async updateBatchAnchors(batchId: string, anchors: Array<{ chain: string; tx: string; block?: number }>): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Update with first anchor (simplified - could support multiple)
      if (anchors.length > 0) {
        const anchor = anchors[0];
        await client.query(
          'UPDATE batches SET anchored_at = NOW(), anchor_tx = $1, anchor_chain = $2 WHERE id = $3',
          [anchor.tx, anchor.chain, batchId]
        );
      }
    } finally {
      client.release();
    }
  }

  async getLatestBatch(): Promise<MerkleBatch | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM batches ORDER BY created_at DESC LIMIT 1');
      if (result.rows.length === 0) return null;
      return this.rowToMerkleBatch(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getBatchProofs(batchId: string): Promise<ProofRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE batch_id = $1 ORDER BY merkle_index ASC', [batchId]);
      return result.rows.map(row => this.rowToProofRecord(row));
    } finally {
      client.release();
    }
  }

  async getTotalProofs(): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) FROM proofs');
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  // DID operations
  async storeDIDDocument(did: string, document: DIDDocument): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO dids (did, document, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (did) DO UPDATE SET document = $2, updated_at = NOW()
      `, [did, JSON.stringify(document)]);
    } finally {
      client.release();
    }
  }

  async getDIDDocument(did: string): Promise<DIDDocument | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT document FROM dids WHERE did = $1', [did]);
      if (result.rows.length === 0) return null;
      return result.rows[0].document as DIDDocument;
    } finally {
      client.release();
    }
  }

  async getAllDIDDocuments(): Promise<DIDDocument[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT document FROM dids');
      return result.rows.map(row => row.document as DIDDocument);
    } finally {
      client.release();
    }
  }

  // KCG operations
  async storeKCGNode(did: string, node: KCGNode): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO kcg_nodes (did, node_data)
        VALUES ($1, $2)
        ON CONFLICT (did) DO UPDATE SET node_data = $2
      `, [did, JSON.stringify(node)]);
    } finally {
      client.release();
    }
  }

  async getKCGNode(did: string): Promise<KCGNode | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT node_data FROM kcg_nodes WHERE did = $1', [did]);
      if (result.rows.length === 0) return null;
      return result.rows[0].node_data as KCGNode;
    } finally {
      client.release();
    }
  }

  async getContinuityChain(did: string): Promise<KCGNode[]> {
    const chain: KCGNode[] = [];
    let currentDID: string | undefined = did;

    while (currentDID) {
      const node = await this.getKCGNode(currentDID);
      if (!node) break;
      chain.unshift(node);
      currentDID = node.previousNode;
    }

    return chain;
  }

  // Attestor operations
  async storeAttestor(did: string, record: AttestorRecord): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO attestors (did, record_data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (did) DO UPDATE SET record_data = $2, updated_at = NOW()
      `, [did, JSON.stringify(record)]);
    } finally {
      client.release();
    }
  }

  async getAttestor(did: string): Promise<AttestorRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT record_data FROM attestors WHERE did = $1', [did]);
      if (result.rows.length === 0) return null;
      return result.rows[0].record_data as AttestorRecord;
    } finally {
      client.release();
    }
  }

  async getAllAttestors(): Promise<AttestorRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT record_data FROM attestors');
      return result.rows.map(row => row.record_data as AttestorRecord);
    } finally {
      client.release();
    }
  }

  // Credential operations
  async storeCredential(hash: string, credential: VerifiableHumanCredential): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO credentials (credential_hash, subject_did, credential_data, issued_at, expires_at, revoked)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (credential_hash) DO UPDATE SET credential_data = $3, expires_at = $5, revoked = $6
      `, [
        hash,
        credential.credentialSubject?.id || (credential as any).subjectDID || '',
        JSON.stringify(credential),
        credential.issuanceDate || (credential as any).issuedAt || new Date().toISOString(),
        credential.expirationDate || null,
        (credential as any).revoked || false
      ]);
    } finally {
      client.release();
    }
  }

  async getCredential(hash: string): Promise<VerifiableHumanCredential | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT credential_data FROM credentials WHERE credential_hash = $1 AND revoked = FALSE', [hash]);
      if (result.rows.length === 0) return null;
      return result.rows[0].credential_data as VerifiableHumanCredential;
    } finally {
      client.release();
    }
  }

  async getAllCredentials(): Promise<VerifiableHumanCredential[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT credential_data FROM credentials WHERE revoked = FALSE');
      return result.rows.map(row => row.credential_data as VerifiableHumanCredential);
    } finally {
      client.release();
    }
  }

  // Revocation operations
  async storeRevocation(hash: string, revocation: RevocationRecord): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO revocations (credential_hash, revocation_data)
        VALUES ($1, $2)
        ON CONFLICT (credential_hash) DO UPDATE SET revocation_data = $2
      `, [hash, JSON.stringify(revocation)]);
      // Also mark credential as revoked
      await client.query('UPDATE credentials SET revoked = TRUE WHERE credential_hash = $1', [hash]);
    } finally {
      client.release();
    }
  }

  async getRevocation(hash: string): Promise<RevocationRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT revocation_data FROM revocations WHERE credential_hash = $1', [hash]);
      if (result.rows.length === 0) return null;
      return result.rows[0].revocation_data as RevocationRecord;
    } finally {
      client.release();
    }
  }

  async getAllRevocations(): Promise<RevocationRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT revocation_data FROM revocations');
      return result.rows.map(row => row.revocation_data as RevocationRecord);
    } finally {
      client.release();
    }
  }

  // Audit log operations
  async appendAuditLog(entry: AuditLogEntry): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('INSERT INTO audit_logs (log_data) VALUES ($1)', [JSON.stringify(entry)]);
      // Keep only last 10000 entries
      await client.query(`
        DELETE FROM audit_logs
        WHERE id NOT IN (
          SELECT id FROM audit_logs ORDER BY created_at DESC LIMIT 10000
        )
      `);
    } finally {
      client.release();
    }
  }

  async getAuditLogs(attestorDID?: string, limit: number = 100): Promise<AuditLogEntry[]> {
    const client = await this.pool.connect();
    try {
      let query = 'SELECT log_data FROM audit_logs';
      const params: any[] = [];
      
      if (attestorDID) {
        query += ' WHERE log_data->>\'attestorDID\' = $1';
        params.push(attestorDID);
      }
      
      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
      params.push(limit);
      
      const result = await client.query(query, params);
      return result.rows.map(row => row.log_data as AuditLogEntry);
    } finally {
      client.release();
    }
  }

  // Reputation operations
  async storeReputation(did: string, reputation: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO reputation (did, score, tier, successful_proofs, anomalies, last_updated)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (did) DO UPDATE SET
          score = $2, tier = $3, successful_proofs = $4, anomalies = $5, last_updated = NOW()
      `, [
        did,
        reputation.score || 50.0,
        reputation.tier || 'grey',
        reputation.successfulProofs || 0,
        reputation.anomalies || 0
      ]);
    } finally {
      client.release();
    }
  }

  async getReputation(did: string): Promise<any | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM reputation WHERE did = $1', [did]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        score: row.score,
        tier: row.tier,
        successfulProofs: row.successful_proofs,
        anomalies: row.anomalies,
        trustLevel: row.score / 100.0
      };
    } finally {
      client.release();
    }
  }

  async getAllReputation(): Promise<{ [did: string]: any }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM reputation');
      const reputation: { [did: string]: any } = {};
      result.rows.forEach(row => {
        reputation[row.did] = {
          score: row.score,
          tier: row.tier,
          successfulProofs: row.successful_proofs,
          anomalies: row.anomalies,
          trustLevel: row.score / 100.0
        };
      });
      return reputation;
    } finally {
      client.release();
    }
  }

  // Submission history operations
  async appendSubmissionHistory(did: string, record: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO submission_history (did, hash, timestamp)
        VALUES ($1, $2, $3)
        ON CONFLICT (did, hash, timestamp) DO NOTHING
      `, [did, record.hash, record.timestamp]);
      // Clean up old entries (older than 24 hours)
      await client.query(`
        DELETE FROM submission_history
        WHERE did = $1 AND timestamp < NOW() - INTERVAL '24 hours'
      `, [did]);
    } finally {
      client.release();
    }
  }

  async getSubmissionHistory(did: string): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT hash, timestamp FROM submission_history WHERE did = $1 ORDER BY timestamp DESC',
        [did]
      );
      return result.rows.map(row => ({
        hash: row.hash,
        timestamp: row.timestamp.toISOString()
      }));
    } finally {
      client.release();
    }
  }

  // Anomaly log operations
  async appendAnomalyLog(did: string, entry: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('INSERT INTO anomaly_log (did, entry) VALUES ($1, $2)', [did, entry]);
      // Keep only last 100 entries per DID
      await client.query(`
        DELETE FROM anomaly_log
        WHERE did = $1 AND id NOT IN (
          SELECT id FROM anomaly_log WHERE did = $1 ORDER BY created_at DESC LIMIT 100
        )
      `, [did]);
    } finally {
      client.release();
    }
  }

  async getAnomalyLog(did: string): Promise<string[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT entry FROM anomaly_log WHERE did = $1 ORDER BY created_at DESC LIMIT 100',
        [did]
      );
      return result.rows.map(row => row.entry);
    } finally {
      client.release();
    }
  }

  // Challenge operations
  async storeChallenge(challenge: Omit<ChallengeRecord, 'id'>): Promise<string> {
    const client = await this.pool.connect();
    try {
      const challengeId = `0x${require('crypto').createHash('sha256')
        .update(`${challenge.proof_hash}-${challenge.challenger_did}-${challenge.created_at}`)
        .digest('hex')
        .substring(0, 16)}`;
      
      await client.query(`
        INSERT INTO challenges (
          id, proof_hash, proof_did, challenger_did, reason, description,
          evidence, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        challengeId,
        challenge.proof_hash,
        challenge.proof_did,
        challenge.challenger_did,
        challenge.reason,
        challenge.description,
        challenge.evidence ? JSON.stringify(challenge.evidence) : null,
        challenge.status,
        challenge.created_at
      ]);
      
      return challengeId;
    } finally {
      client.release();
    }
  }

  async getChallengeById(challengeId: string): Promise<ChallengeRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM challenges WHERE id = $1', [challengeId]);
      if (result.rows.length === 0) return null;
      return this.rowToChallengeRecord(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getChallengesByProofHash(proofHash: string): Promise<ChallengeRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM challenges WHERE proof_hash = $1 ORDER BY created_at DESC', [proofHash]);
      return result.rows.map(row => this.rowToChallengeRecord(row));
    } finally {
      client.release();
    }
  }

  async getChallengesByDID(did: string): Promise<ChallengeRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM challenges WHERE proof_did = $1 OR challenger_did = $1 ORDER BY created_at DESC',
        [did]
      );
      return result.rows.map(row => this.rowToChallengeRecord(row));
    } finally {
      client.release();
    }
  }

  async updateChallenge(challengeId: string, updates: Partial<ChallengeRecord>): Promise<void> {
    const client = await this.pool.connect();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.status !== undefined) {
        fields.push(`status = $${paramIndex++}`);
        values.push(updates.status);
      }
      if (updates.resolution !== undefined) {
        fields.push(`resolution = $${paramIndex++}`);
        values.push(updates.resolution);
      }
      if (updates.resolver_did !== undefined) {
        fields.push(`resolver_did = $${paramIndex++}`);
        values.push(updates.resolver_did);
      }
      if (updates.author_response !== undefined) {
        fields.push(`author_response = $${paramIndex++}`);
        values.push(updates.author_response);
      }
      if (updates.resolution_notes !== undefined) {
        fields.push(`resolution_notes = $${paramIndex++}`);
        values.push(updates.resolution_notes);
      }
      if (updates.responded_at !== undefined) {
        fields.push(`responded_at = $${paramIndex++}`);
        values.push(updates.responded_at);
      }
      if (updates.resolved_at !== undefined) {
        fields.push(`resolved_at = $${paramIndex++}`);
        values.push(updates.resolved_at);
      }

      if (fields.length > 0) {
        values.push(challengeId);
        await client.query(
          `UPDATE challenges SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
          values
        );
      }
    } finally {
      client.release();
    }
  }

  // Transparency log operations
  async appendTransparencyLog(entry: {
    type: 'challenge_submitted' | 'challenge_responded' | 'challenge_resolved';
    challenge_id: string;
    proof_hash: string;
    did?: string;
    resolution?: string;
    timestamp: string;
    details?: any;
  }): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO transparency_log (log_type, challenge_id, proof_hash, did, resolution, timestamp, details)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        entry.type,
        entry.challenge_id,
        entry.proof_hash,
        entry.did || null,
        entry.resolution || null,
        entry.timestamp,
        entry.details ? JSON.stringify(entry.details) : null
      ]);
      // Keep only last 10000 entries
      await client.query(`
        DELETE FROM transparency_log
        WHERE id NOT IN (
          SELECT id FROM transparency_log ORDER BY created_at DESC LIMIT 10000
        )
      `);
    } finally {
      client.release();
    }
  }

  async getTransparencyLog(limit: number = 100): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM transparency_log ORDER BY timestamp DESC LIMIT $1',
        [limit]
      );
      return result.rows.map(row => ({
        type: row.log_type,
        challenge_id: row.challenge_id,
        proof_hash: row.proof_hash,
        did: row.did,
        resolution: row.resolution,
        timestamp: row.timestamp.toISOString(),
        details: row.details
      }));
    } finally {
      client.release();
    }
  }

  // Helper to convert row to ChallengeRecord
  private rowToChallengeRecord(row: any): ChallengeRecord {
    return {
      id: row.id,
      proof_hash: row.proof_hash,
      proof_did: row.proof_did,
      challenger_did: row.challenger_did,
      reason: row.reason,
      description: row.description,
      evidence: row.evidence ? (typeof row.evidence === 'string' ? row.evidence : JSON.stringify(row.evidence)) : undefined,
      status: row.status,
      resolution: row.resolution,
      created_at: row.created_at.toISOString(),
      responded_at: row.responded_at ? row.responded_at.toISOString() : undefined,
      resolved_at: row.resolved_at ? row.resolved_at.toISOString() : undefined,
      resolver_did: row.resolver_did,
      author_response: row.author_response,
      resolution_notes: row.resolution_notes
    };
  }

  // Close connection pool
  async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * Production-ready database implementation for PoHW registry nodes
 * Per whitepaper Section 12.2: "Written with modular backends for PostgreSQL"
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { ProofRecord, MerkleBatch, ChallengeRecord } from './types';
import { DIDDocument, KCGNode } from './did';
import { AttestorRecord, VerifiableHumanCredential, RevocationRecord, AuditLogEntry } from './attestors';

export class PostgreSQLDatabase {
  private pool: Pool;
  private initialized: boolean = false;

  constructor(connectionString?: string) {
    const connString = connectionString || process.env.DATABASE_URL || 
      `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || ''}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'pohw_registry'}`;
    
    this.pool = new Pool({
      connectionString: connString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }

  /**
   * Initialize database schema
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Create proofs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS proofs (
          id SERIAL PRIMARY KEY,
          hash VARCHAR(66) NOT NULL UNIQUE,
          signature TEXT NOT NULL,
          did VARCHAR(255) NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
          batch_id VARCHAR(255),
          merkle_index INTEGER,
          anchored BOOLEAN DEFAULT FALSE,
          anchor_tx VARCHAR(255),
          anchor_chain VARCHAR(50),
          process_digest VARCHAR(66),
          compound_hash VARCHAR(66),
          process_metrics JSONB,
          zk_proof JSONB,
          tier VARCHAR(20),
          authored_on_device TEXT,
          environment_attestation JSONB,
          derived_from JSONB,
          assistance_profile VARCHAR(20),
          claim_uri TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Add claim_uri column if it doesn't exist (for existing databases)
      await client.query(`
        ALTER TABLE proofs 
        ADD COLUMN IF NOT EXISTS claim_uri TEXT
      `);

      // Create indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_hash ON proofs(hash)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_compound_hash ON proofs(compound_hash)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_did ON proofs(did)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_batch_id ON proofs(batch_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_proofs_timestamp ON proofs(timestamp)');

      // Create batches table
      await client.query(`
        CREATE TABLE IF NOT EXISTS batches (
          id VARCHAR(255) PRIMARY KEY,
          root VARCHAR(66) NOT NULL,
          size INTEGER NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          anchored_at TIMESTAMP,
          anchor_tx VARCHAR(255),
          anchor_chain VARCHAR(50)
        )
      `);

      // Create DIDs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS dids (
          did VARCHAR(255) PRIMARY KEY,
          document JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create KCG nodes table
      await client.query(`
        CREATE TABLE IF NOT EXISTS kcg_nodes (
          did VARCHAR(255) PRIMARY KEY,
          node_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create attestors table
      await client.query(`
        CREATE TABLE IF NOT EXISTS attestors (
          did VARCHAR(255) PRIMARY KEY,
          record_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create credentials table
      await client.query(`
        CREATE TABLE IF NOT EXISTS credentials (
          credential_hash VARCHAR(255) PRIMARY KEY,
          subject_did VARCHAR(255) NOT NULL,
          credential_data JSONB NOT NULL,
          issued_at TIMESTAMP NOT NULL,
          expires_at TIMESTAMP,
          revoked BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_credentials_subject_did ON credentials(subject_did)');

      // Create revocations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS revocations (
          credential_hash VARCHAR(255) PRIMARY KEY,
          revocation_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create audit logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          log_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)');

      // Create reputation table
      await client.query(`
        CREATE TABLE IF NOT EXISTS reputation (
          did VARCHAR(255) PRIMARY KEY,
          score REAL NOT NULL DEFAULT 50.0,
          tier VARCHAR(20) NOT NULL DEFAULT 'grey',
          successful_proofs INTEGER DEFAULT 0,
          anomalies INTEGER DEFAULT 0,
          last_updated TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create submission history table
      await client.query(`
        CREATE TABLE IF NOT EXISTS submission_history (
          did VARCHAR(255) NOT NULL,
          hash VARCHAR(66) NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY (did, hash, timestamp)
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_submission_history_did ON submission_history(did)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_submission_history_timestamp ON submission_history(timestamp)');

      // Create anomaly log table
      await client.query(`
        CREATE TABLE IF NOT EXISTS anomaly_log (
          id SERIAL PRIMARY KEY,
          did VARCHAR(255) NOT NULL,
          entry TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_anomaly_log_did ON anomaly_log(did)');

      // Create challenges table
      await client.query(`
        CREATE TABLE IF NOT EXISTS challenges (
          id VARCHAR(255) PRIMARY KEY,
          proof_hash VARCHAR(66) NOT NULL,
          proof_did VARCHAR(255) NOT NULL,
          challenger_did VARCHAR(255) NOT NULL,
          reason VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          evidence JSONB,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          resolution VARCHAR(20),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          responded_at TIMESTAMP,
          resolved_at TIMESTAMP,
          resolver_did VARCHAR(255),
          author_response TEXT,
          resolution_notes TEXT
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_challenges_proof_hash ON challenges(proof_hash)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_challenges_proof_did ON challenges(proof_did)');

      // Create transparency log table
      await client.query(`
        CREATE TABLE IF NOT EXISTS transparency_log (
          id SERIAL PRIMARY KEY,
          log_type VARCHAR(50) NOT NULL,
          challenge_id VARCHAR(255),
          proof_hash VARCHAR(66),
          did VARCHAR(255),
          resolution VARCHAR(50),
          timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
          details JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX IF NOT EXISTS idx_transparency_log_timestamp ON transparency_log(timestamp)');

      await client.query('COMMIT');
      this.initialized = true;
      console.log('[PostgreSQL] Database schema initialized');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Proof operations
  async storeProof(proof: Omit<ProofRecord, 'id' | 'submitted_at'>): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO proofs (
          hash, signature, did, timestamp, submitted_at,
          batch_id, merkle_index, anchored, anchor_tx, anchor_chain,
          process_digest, compound_hash, process_metrics, zk_proof, tier,
          authored_on_device, environment_attestation, derived_from, assistance_profile, claim_uri
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id
      `, [
        proof.hash, proof.signature, proof.did, proof.timestamp,
        proof.batch_id || null, proof.merkle_index || null, proof.anchored || false,
        proof.anchor_tx || null, proof.anchor_chain || null,
        proof.process_digest || null, proof.compound_hash || null,
        proof.process_metrics ? JSON.stringify(proof.process_metrics) : null,
        proof.zk_proof ? JSON.stringify(proof.zk_proof) : null,
        proof.tier || null, proof.authored_on_device || null,
        proof.environment_attestation ? JSON.stringify(proof.environment_attestation) : null,
        proof.derived_from ? JSON.stringify(proof.derived_from) : null,
        proof.assistance_profile || null,
        proof.claim_uri || null
      ]);
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  async getProofByHash(hash: string): Promise<ProofRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE hash = $1', [hash]);
      if (result.rows.length === 0) return null;
      return this.rowToProofRecord(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getProofByCompoundHash(compoundHash: string): Promise<ProofRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE compound_hash = $1', [compoundHash]);
      if (result.rows.length === 0) return null;
      return this.rowToProofRecord(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getAllProofsByHash(hash: string): Promise<ProofRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE hash = $1 ORDER BY timestamp DESC', [hash]);
      return result.rows.map(row => this.rowToProofRecord(row));
    } finally {
      client.release();
    }
  }

  async getPendingProofs(): Promise<ProofRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE batch_id IS NULL ORDER BY timestamp ASC');
      return result.rows.map(row => this.rowToProofRecord(row));
    } finally {
      client.release();
    }
  }

  async getPendingCount(): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) FROM proofs WHERE batch_id IS NULL');
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  async updateProofBatch(hash: string, batchId: string, merkleIndex: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('UPDATE proofs SET batch_id = $1, merkle_index = $2 WHERE hash = $3', 
        [batchId, merkleIndex, hash]);
    } finally {
      client.release();
    }
  }

  async updateProofAnchors(hash: string, anchorTx: string, anchorChain: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('UPDATE proofs SET anchored = TRUE, anchor_tx = $1, anchor_chain = $2 WHERE hash = $3',
        [anchorTx, anchorChain, hash]);
    } finally {
      client.release();
    }
  }

  // Batch operations
  async storeBatch(batch: Omit<MerkleBatch, 'id'>): Promise<string> {
    const client = await this.pool.connect();
    try {
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await client.query(`
        INSERT INTO batches (id, root, size, created_at, anchored_at, anchor_tx, anchor_chain)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [batchId, batch.root, batch.size, batch.created_at, batch.anchored_at || null, 
          batch.anchor_tx || null, batch.anchor_chain || null]);
      return batchId;
    } finally {
      client.release();
    }
  }

  async getBatchById(batchId: string): Promise<MerkleBatch | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM batches WHERE id = $1', [batchId]);
      if (result.rows.length === 0) return null;
      return this.rowToMerkleBatch(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getAllBatches(): Promise<MerkleBatch[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM batches ORDER BY created_at DESC');
      return result.rows.map(row => this.rowToMerkleBatch(row));
    } finally {
      client.release();
    }
  }

  // Helper methods to convert database rows to types
  private rowToProofRecord(row: any): ProofRecord {
    return {
      id: row.id,
      hash: row.hash,
      signature: row.signature,
      did: row.did,
      timestamp: row.timestamp.toISOString(),
      submitted_at: row.submitted_at.toISOString(),
      batch_id: row.batch_id,
      merkle_index: row.merkle_index,
      anchored: row.anchored,
      anchor_tx: row.anchor_tx,
      anchor_chain: row.anchor_chain,
      process_digest: row.process_digest,
      compound_hash: row.compound_hash,
      process_metrics: row.process_metrics ? (typeof row.process_metrics === 'string' ? row.process_metrics : JSON.stringify(row.process_metrics)) : undefined,
      zk_proof: row.zk_proof ? (typeof row.zk_proof === 'string' ? row.zk_proof : JSON.stringify(row.zk_proof)) : undefined,
      tier: row.tier,
      authored_on_device: row.authored_on_device,
      environment_attestation: row.environment_attestation ? (typeof row.environment_attestation === 'string' ? row.environment_attestation : JSON.stringify(row.environment_attestation)) : undefined,
      derived_from: row.derived_from ? (typeof row.derived_from === 'string' ? row.derived_from : JSON.stringify(row.derived_from)) : undefined,
      assistance_profile: row.assistance_profile,
      claim_uri: row.claim_uri
    };
  }

  private rowToMerkleBatch(row: any): MerkleBatch {
    return {
      id: row.id,
      root: row.root,
      size: row.size,
      created_at: row.created_at.toISOString(),
      anchored_at: row.anchored_at ? row.anchored_at.toISOString() : undefined,
      anchor_tx: row.anchor_tx,
      anchor_chain: row.anchor_chain
    };
  }

  // Additional batch operations
  async storeMerkleBatch(batch: Omit<MerkleBatch, 'created_at'>): Promise<string> {
    return this.storeBatch({ ...batch, created_at: new Date().toISOString() });
  }

  async updateBatchAnchors(batchId: string, anchors: Array<{ chain: string; tx: string; block?: number }>): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Update with first anchor (simplified - could support multiple)
      if (anchors.length > 0) {
        const anchor = anchors[0];
        await client.query(
          'UPDATE batches SET anchored_at = NOW(), anchor_tx = $1, anchor_chain = $2 WHERE id = $3',
          [anchor.tx, anchor.chain, batchId]
        );
      }
    } finally {
      client.release();
    }
  }

  async getLatestBatch(): Promise<MerkleBatch | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM batches ORDER BY created_at DESC LIMIT 1');
      if (result.rows.length === 0) return null;
      return this.rowToMerkleBatch(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getBatchProofs(batchId: string): Promise<ProofRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM proofs WHERE batch_id = $1 ORDER BY merkle_index ASC', [batchId]);
      return result.rows.map(row => this.rowToProofRecord(row));
    } finally {
      client.release();
    }
  }

  async getTotalProofs(): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) FROM proofs');
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  // DID operations
  async storeDIDDocument(did: string, document: DIDDocument): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO dids (did, document, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (did) DO UPDATE SET document = $2, updated_at = NOW()
      `, [did, JSON.stringify(document)]);
    } finally {
      client.release();
    }
  }

  async getDIDDocument(did: string): Promise<DIDDocument | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT document FROM dids WHERE did = $1', [did]);
      if (result.rows.length === 0) return null;
      return result.rows[0].document as DIDDocument;
    } finally {
      client.release();
    }
  }

  async getAllDIDDocuments(): Promise<DIDDocument[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT document FROM dids');
      return result.rows.map(row => row.document as DIDDocument);
    } finally {
      client.release();
    }
  }

  // KCG operations
  async storeKCGNode(did: string, node: KCGNode): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO kcg_nodes (did, node_data)
        VALUES ($1, $2)
        ON CONFLICT (did) DO UPDATE SET node_data = $2
      `, [did, JSON.stringify(node)]);
    } finally {
      client.release();
    }
  }

  async getKCGNode(did: string): Promise<KCGNode | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT node_data FROM kcg_nodes WHERE did = $1', [did]);
      if (result.rows.length === 0) return null;
      return result.rows[0].node_data as KCGNode;
    } finally {
      client.release();
    }
  }

  async getContinuityChain(did: string): Promise<KCGNode[]> {
    const chain: KCGNode[] = [];
    let currentDID: string | undefined = did;

    while (currentDID) {
      const node = await this.getKCGNode(currentDID);
      if (!node) break;
      chain.unshift(node);
      currentDID = node.previousNode;
    }

    return chain;
  }

  // Attestor operations
  async storeAttestor(did: string, record: AttestorRecord): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO attestors (did, record_data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (did) DO UPDATE SET record_data = $2, updated_at = NOW()
      `, [did, JSON.stringify(record)]);
    } finally {
      client.release();
    }
  }

  async getAttestor(did: string): Promise<AttestorRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT record_data FROM attestors WHERE did = $1', [did]);
      if (result.rows.length === 0) return null;
      return result.rows[0].record_data as AttestorRecord;
    } finally {
      client.release();
    }
  }

  async getAllAttestors(): Promise<AttestorRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT record_data FROM attestors');
      return result.rows.map(row => row.record_data as AttestorRecord);
    } finally {
      client.release();
    }
  }

  // Credential operations
  async storeCredential(hash: string, credential: VerifiableHumanCredential): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO credentials (credential_hash, subject_did, credential_data, issued_at, expires_at, revoked)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (credential_hash) DO UPDATE SET credential_data = $3, expires_at = $5, revoked = $6
      `, [
        hash,
        credential.credentialSubject?.id || (credential as any).subjectDID || '',
        JSON.stringify(credential),
        credential.issuanceDate || (credential as any).issuedAt || new Date().toISOString(),
        credential.expirationDate || null,
        (credential as any).revoked || false
      ]);
    } finally {
      client.release();
    }
  }

  async getCredential(hash: string): Promise<VerifiableHumanCredential | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT credential_data FROM credentials WHERE credential_hash = $1 AND revoked = FALSE', [hash]);
      if (result.rows.length === 0) return null;
      return result.rows[0].credential_data as VerifiableHumanCredential;
    } finally {
      client.release();
    }
  }

  async getAllCredentials(): Promise<VerifiableHumanCredential[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT credential_data FROM credentials WHERE revoked = FALSE');
      return result.rows.map(row => row.credential_data as VerifiableHumanCredential);
    } finally {
      client.release();
    }
  }

  // Revocation operations
  async storeRevocation(hash: string, revocation: RevocationRecord): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO revocations (credential_hash, revocation_data)
        VALUES ($1, $2)
        ON CONFLICT (credential_hash) DO UPDATE SET revocation_data = $2
      `, [hash, JSON.stringify(revocation)]);
      // Also mark credential as revoked
      await client.query('UPDATE credentials SET revoked = TRUE WHERE credential_hash = $1', [hash]);
    } finally {
      client.release();
    }
  }

  async getRevocation(hash: string): Promise<RevocationRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT revocation_data FROM revocations WHERE credential_hash = $1', [hash]);
      if (result.rows.length === 0) return null;
      return result.rows[0].revocation_data as RevocationRecord;
    } finally {
      client.release();
    }
  }

  async getAllRevocations(): Promise<RevocationRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT revocation_data FROM revocations');
      return result.rows.map(row => row.revocation_data as RevocationRecord);
    } finally {
      client.release();
    }
  }

  // Audit log operations
  async appendAuditLog(entry: AuditLogEntry): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('INSERT INTO audit_logs (log_data) VALUES ($1)', [JSON.stringify(entry)]);
      // Keep only last 10000 entries
      await client.query(`
        DELETE FROM audit_logs
        WHERE id NOT IN (
          SELECT id FROM audit_logs ORDER BY created_at DESC LIMIT 10000
        )
      `);
    } finally {
      client.release();
    }
  }

  async getAuditLogs(attestorDID?: string, limit: number = 100): Promise<AuditLogEntry[]> {
    const client = await this.pool.connect();
    try {
      let query = 'SELECT log_data FROM audit_logs';
      const params: any[] = [];
      
      if (attestorDID) {
        query += ' WHERE log_data->>\'attestorDID\' = $1';
        params.push(attestorDID);
      }
      
      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
      params.push(limit);
      
      const result = await client.query(query, params);
      return result.rows.map(row => row.log_data as AuditLogEntry);
    } finally {
      client.release();
    }
  }

  // Reputation operations
  async storeReputation(did: string, reputation: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO reputation (did, score, tier, successful_proofs, anomalies, last_updated)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (did) DO UPDATE SET
          score = $2, tier = $3, successful_proofs = $4, anomalies = $5, last_updated = NOW()
      `, [
        did,
        reputation.score || 50.0,
        reputation.tier || 'grey',
        reputation.successfulProofs || 0,
        reputation.anomalies || 0
      ]);
    } finally {
      client.release();
    }
  }

  async getReputation(did: string): Promise<any | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM reputation WHERE did = $1', [did]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        score: row.score,
        tier: row.tier,
        successfulProofs: row.successful_proofs,
        anomalies: row.anomalies,
        trustLevel: row.score / 100.0
      };
    } finally {
      client.release();
    }
  }

  async getAllReputation(): Promise<{ [did: string]: any }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM reputation');
      const reputation: { [did: string]: any } = {};
      result.rows.forEach(row => {
        reputation[row.did] = {
          score: row.score,
          tier: row.tier,
          successfulProofs: row.successful_proofs,
          anomalies: row.anomalies,
          trustLevel: row.score / 100.0
        };
      });
      return reputation;
    } finally {
      client.release();
    }
  }

  // Submission history operations
  async appendSubmissionHistory(did: string, record: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO submission_history (did, hash, timestamp)
        VALUES ($1, $2, $3)
        ON CONFLICT (did, hash, timestamp) DO NOTHING
      `, [did, record.hash, record.timestamp]);
      // Clean up old entries (older than 24 hours)
      await client.query(`
        DELETE FROM submission_history
        WHERE did = $1 AND timestamp < NOW() - INTERVAL '24 hours'
      `, [did]);
    } finally {
      client.release();
    }
  }

  async getSubmissionHistory(did: string): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT hash, timestamp FROM submission_history WHERE did = $1 ORDER BY timestamp DESC',
        [did]
      );
      return result.rows.map(row => ({
        hash: row.hash,
        timestamp: row.timestamp.toISOString()
      }));
    } finally {
      client.release();
    }
  }

  // Anomaly log operations
  async appendAnomalyLog(did: string, entry: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('INSERT INTO anomaly_log (did, entry) VALUES ($1, $2)', [did, entry]);
      // Keep only last 100 entries per DID
      await client.query(`
        DELETE FROM anomaly_log
        WHERE did = $1 AND id NOT IN (
          SELECT id FROM anomaly_log WHERE did = $1 ORDER BY created_at DESC LIMIT 100
        )
      `, [did]);
    } finally {
      client.release();
    }
  }

  async getAnomalyLog(did: string): Promise<string[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT entry FROM anomaly_log WHERE did = $1 ORDER BY created_at DESC LIMIT 100',
        [did]
      );
      return result.rows.map(row => row.entry);
    } finally {
      client.release();
    }
  }

  // Challenge operations
  async storeChallenge(challenge: Omit<ChallengeRecord, 'id'>): Promise<string> {
    const client = await this.pool.connect();
    try {
      const challengeId = `0x${require('crypto').createHash('sha256')
        .update(`${challenge.proof_hash}-${challenge.challenger_did}-${challenge.created_at}`)
        .digest('hex')
        .substring(0, 16)}`;
      
      await client.query(`
        INSERT INTO challenges (
          id, proof_hash, proof_did, challenger_did, reason, description,
          evidence, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        challengeId,
        challenge.proof_hash,
        challenge.proof_did,
        challenge.challenger_did,
        challenge.reason,
        challenge.description,
        challenge.evidence ? JSON.stringify(challenge.evidence) : null,
        challenge.status,
        challenge.created_at
      ]);
      
      return challengeId;
    } finally {
      client.release();
    }
  }

  async getChallengeById(challengeId: string): Promise<ChallengeRecord | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM challenges WHERE id = $1', [challengeId]);
      if (result.rows.length === 0) return null;
      return this.rowToChallengeRecord(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getChallengesByProofHash(proofHash: string): Promise<ChallengeRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM challenges WHERE proof_hash = $1 ORDER BY created_at DESC', [proofHash]);
      return result.rows.map(row => this.rowToChallengeRecord(row));
    } finally {
      client.release();
    }
  }

  async getChallengesByDID(did: string): Promise<ChallengeRecord[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM challenges WHERE proof_did = $1 OR challenger_did = $1 ORDER BY created_at DESC',
        [did]
      );
      return result.rows.map(row => this.rowToChallengeRecord(row));
    } finally {
      client.release();
    }
  }

  async updateChallenge(challengeId: string, updates: Partial<ChallengeRecord>): Promise<void> {
    const client = await this.pool.connect();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.status !== undefined) {
        fields.push(`status = $${paramIndex++}`);
        values.push(updates.status);
      }
      if (updates.resolution !== undefined) {
        fields.push(`resolution = $${paramIndex++}`);
        values.push(updates.resolution);
      }
      if (updates.resolver_did !== undefined) {
        fields.push(`resolver_did = $${paramIndex++}`);
        values.push(updates.resolver_did);
      }
      if (updates.author_response !== undefined) {
        fields.push(`author_response = $${paramIndex++}`);
        values.push(updates.author_response);
      }
      if (updates.resolution_notes !== undefined) {
        fields.push(`resolution_notes = $${paramIndex++}`);
        values.push(updates.resolution_notes);
      }
      if (updates.responded_at !== undefined) {
        fields.push(`responded_at = $${paramIndex++}`);
        values.push(updates.responded_at);
      }
      if (updates.resolved_at !== undefined) {
        fields.push(`resolved_at = $${paramIndex++}`);
        values.push(updates.resolved_at);
      }

      if (fields.length > 0) {
        values.push(challengeId);
        await client.query(
          `UPDATE challenges SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
          values
        );
      }
    } finally {
      client.release();
    }
  }

  // Transparency log operations
  async appendTransparencyLog(entry: {
    type: 'challenge_submitted' | 'challenge_responded' | 'challenge_resolved';
    challenge_id: string;
    proof_hash: string;
    did?: string;
    resolution?: string;
    timestamp: string;
    details?: any;
  }): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO transparency_log (log_type, challenge_id, proof_hash, did, resolution, timestamp, details)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        entry.type,
        entry.challenge_id,
        entry.proof_hash,
        entry.did || null,
        entry.resolution || null,
        entry.timestamp,
        entry.details ? JSON.stringify(entry.details) : null
      ]);
      // Keep only last 10000 entries
      await client.query(`
        DELETE FROM transparency_log
        WHERE id NOT IN (
          SELECT id FROM transparency_log ORDER BY created_at DESC LIMIT 10000
        )
      `);
    } finally {
      client.release();
    }
  }

  async getTransparencyLog(limit: number = 100): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM transparency_log ORDER BY timestamp DESC LIMIT $1',
        [limit]
      );
      return result.rows.map(row => ({
        type: row.log_type,
        challenge_id: row.challenge_id,
        proof_hash: row.proof_hash,
        did: row.did,
        resolution: row.resolution,
        timestamp: row.timestamp.toISOString(),
        details: row.details
      }));
    } finally {
      client.release();
    }
  }

  // Helper to convert row to ChallengeRecord
  private rowToChallengeRecord(row: any): ChallengeRecord {
    return {
      id: row.id,
      proof_hash: row.proof_hash,
      proof_did: row.proof_did,
      challenger_did: row.challenger_did,
      reason: row.reason,
      description: row.description,
      evidence: row.evidence ? (typeof row.evidence === 'string' ? row.evidence : JSON.stringify(row.evidence)) : undefined,
      status: row.status,
      resolution: row.resolution,
      created_at: row.created_at.toISOString(),
      responded_at: row.responded_at ? row.responded_at.toISOString() : undefined,
      resolved_at: row.resolved_at ? row.resolved_at.toISOString() : undefined,
      resolver_did: row.resolver_did,
      author_response: row.author_response,
      resolution_notes: row.resolution_notes
    };
  }

  // Close connection pool
  async close(): Promise<void> {
    await this.pool.end();
  }
}

