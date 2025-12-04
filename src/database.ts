/**
 * Database Module
 * Database interface for storing proofs and Merkle batches
 * Supports both file-based (development) and PostgreSQL (production) backends
 * Per whitepaper Section 12.2: "Written with modular backends for PostgreSQL"
 */

import { SimpleDatabase } from './database-simple';
import { PostgreSQLDatabase } from './database-postgres';
import { ProofRecord, MerkleBatch, ChallengeRecord } from './types';
import { DIDDocument, KCGNode } from './did';
import { AttestorRecord, VerifiableHumanCredential, RevocationRecord, AuditLogEntry } from './attestors';

// Database interface - both implementations must match
type DatabaseBackend = SimpleDatabase | PostgreSQLDatabase;

export class RegistryDatabase {
  private db: DatabaseBackend;
  private isPostgres: boolean;

  constructor(dbPath?: string) {
    // Use PostgreSQL if DATABASE_URL is set, otherwise use file-based
    const usePostgres = !!process.env.DATABASE_URL;
    
    if (usePostgres) {
      console.log('[Database] Using PostgreSQL backend');
      this.db = new PostgreSQLDatabase();
      this.isPostgres = true;
      // Initialize schema (async, but we'll handle it)
      (this.db as PostgreSQLDatabase).initialize().catch(err => {
        console.error('[Database] Failed to initialize PostgreSQL:', err);
      });
    } else {
      console.log('[Database] Using file-based backend (development)');
      this.db = new SimpleDatabase(dbPath || './data');
      this.isPostgres = false;
    }
  }

  /**
   * Store a proof
   */
  async storeProof(proof: Omit<ProofRecord, 'id' | 'submitted_at'>): Promise<number> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeProof(proof);
    } else {
      return (this.db as SimpleDatabase).storeProof(proof);
    }
  }

  /**
   * Get proof by hash
   */
  async getProofByHash(hash: string): Promise<ProofRecord | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getProofByHash(hash);
    } else {
      return (this.db as SimpleDatabase).getProofByHash(hash);
    }
  }

  /**
   * Get proof by compound hash (fallback for old proofs)
   */
  async getProofByCompoundHash(compoundHash: string): Promise<ProofRecord | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getProofByCompoundHash(compoundHash);
    } else {
      return (this.db as SimpleDatabase).getProofByCompoundHash(compoundHash);
    }
  }

  /**
   * Get all proofs by hash (for cases where multiple people prove same content)
   */
  async getAllProofsByHash(hash: string): Promise<ProofRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllProofsByHash(hash);
    } else {
      return (this.db as SimpleDatabase).getAllProofsByHash(hash);
    }
  }

  /**
   * Get pending proofs (not yet batched)
   */
  async getPendingProofs(limit: number = 1000): Promise<ProofRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getPendingProofs();
    } else {
      return (this.db as SimpleDatabase).getPendingProofs(limit);
    }
  }

  /**
   * Update proof with batch information
   */
  async updateProofBatch(hash: string, batchId: string, merkleIndex: number): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).updateProofBatch(hash, batchId, merkleIndex);
    } else {
      (this.db as SimpleDatabase).updateProofBatch(hash, batchId, merkleIndex);
    }
  }

  /**
   * Store Merkle batch
   */
  async storeMerkleBatch(batch: Omit<MerkleBatch, 'created_at'>): Promise<string> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeMerkleBatch(batch);
    } else {
      (this.db as SimpleDatabase).storeMerkleBatch(batch);
      return batch.id || `batch_${Date.now()}`;
    }
  }

  /**
   * Update batch with anchor information
   */
  async updateBatchAnchors(batchId: string, anchors: Array<{ chain: string; tx: string; block?: number }>): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).updateBatchAnchors(batchId, anchors);
    } else {
      (this.db as SimpleDatabase).updateBatchAnchors(batchId, anchors);
    }
  }

  /**
   * Get latest Merkle batch
   */
  async getLatestBatch(): Promise<MerkleBatch | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getLatestBatch();
    } else {
      return (this.db as SimpleDatabase).getLatestBatch();
    }
  }

  /**
   * Get proofs in a batch
   */
  async getBatchProofs(batchId: string): Promise<ProofRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getBatchProofs(batchId);
    } else {
      return (this.db as SimpleDatabase).getBatchProofs(batchId);
    }
  }

  /**
   * Get batch by ID
   */
  async getBatchById(batchId: string): Promise<MerkleBatch | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getBatchById(batchId);
    } else {
      return (this.db as SimpleDatabase).getBatchById(batchId);
    }
  }

  /**
   * Get all batches
   */
  async getAllBatches(): Promise<MerkleBatch[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllBatches();
    } else {
      return (this.db as SimpleDatabase).getAllBatches();
    }
  }

  /**
   * Get total proof count
   */
  async getTotalProofs(): Promise<number> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getTotalProofs();
    } else {
      return (this.db as SimpleDatabase).getTotalProofs();
    }
  }

  /**
   * Get pending proof count
   */
  async getPendingCount(): Promise<number> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getPendingCount();
    } else {
      return (this.db as SimpleDatabase).getPendingCount();
    }
  }

  /**
   * Store DID document
   */
  storeDIDDocument(did: string, document: DIDDocument): void {
    this.db.storeDIDDocument(did, document);
  }

  /**
   * Get DID document
   */
  async getDIDDocument(did: string): Promise<DIDDocument | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getDIDDocument(did);
    } else {
      return (this.db as SimpleDatabase).getDIDDocument(did);
    }
  }

  /**
   * Get all DID documents
   */
  async getAllDIDDocuments(): Promise<DIDDocument[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllDIDDocuments();
    } else {
      return (this.db as SimpleDatabase).getAllDIDDocuments();
    }
  }

  /**
   * Store KCG node
   */
  async storeKCGNode(did: string, node: KCGNode): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeKCGNode(did, node);
    } else {
      (this.db as SimpleDatabase).storeKCGNode(did, node);
    }
  }

  /**
   * Get KCG node
   */
  async getKCGNode(did: string): Promise<KCGNode | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getKCGNode(did);
    } else {
      return (this.db as SimpleDatabase).getKCGNode(did);
    }
  }

  /**
   * Get continuity chain for a DID
   */
  async getContinuityChain(did: string): Promise<KCGNode[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getContinuityChain(did);
    } else {
      return (this.db as SimpleDatabase).getContinuityChain(did);
    }
  }

  /**
   * Store attestor record
   */
  async storeAttestor(did: string, record: AttestorRecord): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeAttestor(did, record);
    } else {
      (this.db as SimpleDatabase).storeAttestor(did, record);
    }
  }

  /**
   * Get attestor record
   */
  async getAttestor(did: string): Promise<AttestorRecord | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAttestor(did);
    } else {
      return (this.db as SimpleDatabase).getAttestor(did);
    }
  }

  /**
   * Get all attestors
   */
  async getAllAttestors(): Promise<AttestorRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllAttestors();
    } else {
      return (this.db as SimpleDatabase).getAllAttestors();
    }
  }

  /**
   * Store credential
   */
  async storeCredential(hash: string, credential: VerifiableHumanCredential): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeCredential(hash, credential);
    } else {
      (this.db as SimpleDatabase).storeCredential(hash, credential);
    }
  }

  /**
   * Get credential
   */
  async getCredential(hash: string): Promise<VerifiableHumanCredential | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getCredential(hash);
    } else {
      return (this.db as SimpleDatabase).getCredential(hash);
    }
  }

  /**
   * Get all credentials
   */
  async getAllCredentials(): Promise<VerifiableHumanCredential[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllCredentials();
    } else {
      return (this.db as SimpleDatabase).getAllCredentials();
    }
  }

  /**
   * Store revocation
   */
  async storeRevocation(hash: string, revocation: RevocationRecord): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeRevocation(hash, revocation);
    } else {
      (this.db as SimpleDatabase).storeRevocation(hash, revocation);
    }
  }

  /**
   * Get revocation
   */
  async getRevocation(hash: string): Promise<RevocationRecord | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getRevocation(hash);
    } else {
      return (this.db as SimpleDatabase).getRevocation(hash);
    }
  }

  /**
   * Get all revocations
   */
  async getAllRevocations(): Promise<RevocationRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllRevocations();
    } else {
      return (this.db as SimpleDatabase).getAllRevocations();
    }
  }

  /**
   * Append audit log
   */
  async appendAuditLog(entry: AuditLogEntry): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).appendAuditLog(entry);
    } else {
      (this.db as SimpleDatabase).appendAuditLog(entry);
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(attestorDID?: string, limit: number = 100): Promise<AuditLogEntry[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAuditLogs(attestorDID, limit);
    } else {
      return (this.db as SimpleDatabase).getAuditLogs(attestorDID, limit);
    }
  }

  /**
   * Store reputation record
   */
  async storeReputation(did: string, reputation: any): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeReputation(did, reputation);
    } else {
      (this.db as SimpleDatabase).storeReputation(did, reputation);
    }
  }

  /**
   * Get reputation record
   */
  async getReputation(did: string): Promise<any | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getReputation(did);
    } else {
      return (this.db as SimpleDatabase).getReputation(did);
    }
  }

  /**
   * Get all reputation records
   */
  async getAllReputation(): Promise<{ [did: string]: any }> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllReputation();
    } else {
      return (this.db as SimpleDatabase).getAllReputation();
    }
  }

  /**
   * Append submission history
   */
  async appendSubmissionHistory(did: string, record: any): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).appendSubmissionHistory(did, record);
    } else {
      (this.db as SimpleDatabase).appendSubmissionHistory(did, record);
    }
  }

  /**
   * Get submission history
   */
  async getSubmissionHistory(did: string): Promise<any[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getSubmissionHistory(did);
    } else {
      return (this.db as SimpleDatabase).getSubmissionHistory(did);
    }
  }

  /**
   * Append anomaly log entry
   */
  async appendAnomalyLog(did: string, entry: string): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).appendAnomalyLog(did, entry);
    } else {
      (this.db as SimpleDatabase).appendAnomalyLog(did, entry);
    }
  }

  /**
   * Get anomaly log
   */
  async getAnomalyLog(did: string): Promise<string[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAnomalyLog(did);
    } else {
      return (this.db as SimpleDatabase).getAnomalyLog(did);
    }
  }

  /**
   * Store a challenge
   */
  async storeChallenge(challenge: Omit<ChallengeRecord, 'id'>): Promise<string> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeChallenge(challenge);
    } else {
      return (this.db as SimpleDatabase).storeChallenge(challenge);
    }
  }

  /**
   * Get challenge by ID
   */
  async getChallengeById(challengeId: string): Promise<ChallengeRecord | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getChallengeById(challengeId);
    } else {
      return (this.db as SimpleDatabase).getChallengeById(challengeId);
    }
  }

  /**
   * Get all challenges for a proof hash
   */
  async getChallengesByProofHash(proofHash: string): Promise<ChallengeRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getChallengesByProofHash(proofHash);
    } else {
      return (this.db as SimpleDatabase).getChallengesByProofHash(proofHash);
    }
  }

  /**
   * Get all challenges for a DID (as author or challenger)
   */
  async getChallengesByDID(did: string): Promise<ChallengeRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getChallengesByDID(did);
    } else {
      return (this.db as SimpleDatabase).getChallengesByDID(did);
    }
  }

  /**
   * Update challenge status
   */
  async updateChallenge(challengeId: string, updates: Partial<ChallengeRecord>): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).updateChallenge(challengeId, updates);
    } else {
      (this.db as SimpleDatabase).updateChallenge(challengeId, updates);
    }
  }

  /**
   * Append entry to transparency log
   */
  async appendTransparencyLog(entry: {
    type: 'challenge_submitted' | 'challenge_responded' | 'challenge_resolved';
    challenge_id: string;
    proof_hash: string;
    did?: string;
    resolution?: string;
    timestamp: string;
    details?: any;
  }): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).appendTransparencyLog(entry);
    } else {
      (this.db as SimpleDatabase).appendTransparencyLog(entry);
    }
  }

  /**
   * Get transparency log
   */
  async getTransparencyLog(limit: number = 100): Promise<any[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getTransparencyLog(limit);
    } else {
      return (this.db as SimpleDatabase).getTransparencyLog(limit);
    }
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}


    } else {
      return (this.db as SimpleDatabase).getAttestor(did);
    }
  }

  /**
   * Get all attestors
   */
  async getAllAttestors(): Promise<AttestorRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllAttestors();
    } else {
      return (this.db as SimpleDatabase).getAllAttestors();
    }
  }

  /**
   * Store credential
   */
  async storeCredential(hash: string, credential: VerifiableHumanCredential): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeCredential(hash, credential);
    } else {
      (this.db as SimpleDatabase).storeCredential(hash, credential);
    }
  }

  /**
   * Get credential
   */
  async getCredential(hash: string): Promise<VerifiableHumanCredential | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getCredential(hash);
    } else {
      return (this.db as SimpleDatabase).getCredential(hash);
    }
  }

  /**
   * Get all credentials
   */
  async getAllCredentials(): Promise<VerifiableHumanCredential[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllCredentials();
    } else {
      return (this.db as SimpleDatabase).getAllCredentials();
    }
  }

  /**
   * Store revocation
   */
  async storeRevocation(hash: string, revocation: RevocationRecord): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeRevocation(hash, revocation);
    } else {
      (this.db as SimpleDatabase).storeRevocation(hash, revocation);
    }
  }

  /**
   * Get revocation
   */
  async getRevocation(hash: string): Promise<RevocationRecord | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getRevocation(hash);
    } else {
      return (this.db as SimpleDatabase).getRevocation(hash);
    }
  }

  /**
   * Get all revocations
   */
  async getAllRevocations(): Promise<RevocationRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllRevocations();
    } else {
      return (this.db as SimpleDatabase).getAllRevocations();
    }
  }

  /**
   * Append audit log
   */
  async appendAuditLog(entry: AuditLogEntry): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).appendAuditLog(entry);
    } else {
      (this.db as SimpleDatabase).appendAuditLog(entry);
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(attestorDID?: string, limit: number = 100): Promise<AuditLogEntry[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAuditLogs(attestorDID, limit);
    } else {
      return (this.db as SimpleDatabase).getAuditLogs(attestorDID, limit);
    }
  }

  /**
   * Store reputation record
   */
  async storeReputation(did: string, reputation: any): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeReputation(did, reputation);
    } else {
      (this.db as SimpleDatabase).storeReputation(did, reputation);
    }
  }

  /**
   * Get reputation record
   */
  async getReputation(did: string): Promise<any | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getReputation(did);
    } else {
      return (this.db as SimpleDatabase).getReputation(did);
    }
  }

  /**
   * Get all reputation records
   */
  async getAllReputation(): Promise<{ [did: string]: any }> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllReputation();
    } else {
      return (this.db as SimpleDatabase).getAllReputation();
    }
  }

  /**
   * Append submission history
   */
  async appendSubmissionHistory(did: string, record: any): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).appendSubmissionHistory(did, record);
    } else {
      (this.db as SimpleDatabase).appendSubmissionHistory(did, record);
    }
  }

  /**
   * Get submission history
   */
  async getSubmissionHistory(did: string): Promise<any[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getSubmissionHistory(did);
    } else {
      return (this.db as SimpleDatabase).getSubmissionHistory(did);
    }
  }

  /**
   * Append anomaly log entry
   */
  async appendAnomalyLog(did: string, entry: string): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).appendAnomalyLog(did, entry);
    } else {
      (this.db as SimpleDatabase).appendAnomalyLog(did, entry);
    }
  }

  /**
   * Get anomaly log
   */
  async getAnomalyLog(did: string): Promise<string[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAnomalyLog(did);
    } else {
      return (this.db as SimpleDatabase).getAnomalyLog(did);
    }
  }

  /**
   * Store a challenge
   */
  async storeChallenge(challenge: Omit<ChallengeRecord, 'id'>): Promise<string> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeChallenge(challenge);
    } else {
      return (this.db as SimpleDatabase).storeChallenge(challenge);
    }
  }

  /**
   * Get challenge by ID
   */
  async getChallengeById(challengeId: string): Promise<ChallengeRecord | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getChallengeById(challengeId);
    } else {
      return (this.db as SimpleDatabase).getChallengeById(challengeId);
    }
  }

  /**
   * Get all challenges for a proof hash
   */
  async getChallengesByProofHash(proofHash: string): Promise<ChallengeRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getChallengesByProofHash(proofHash);
    } else {
      return (this.db as SimpleDatabase).getChallengesByProofHash(proofHash);
    }
  }

  /**
   * Get all challenges for a DID (as author or challenger)
   */
  async getChallengesByDID(did: string): Promise<ChallengeRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getChallengesByDID(did);
    } else {
      return (this.db as SimpleDatabase).getChallengesByDID(did);
    }
  }

  /**
   * Update challenge status
   */
  async updateChallenge(challengeId: string, updates: Partial<ChallengeRecord>): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).updateChallenge(challengeId, updates);
    } else {
      (this.db as SimpleDatabase).updateChallenge(challengeId, updates);
    }
  }

  /**
   * Append entry to transparency log
   */
  async appendTransparencyLog(entry: {
    type: 'challenge_submitted' | 'challenge_responded' | 'challenge_resolved';
    challenge_id: string;
    proof_hash: string;
    did?: string;
    resolution?: string;
    timestamp: string;
    details?: any;
  }): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).appendTransparencyLog(entry);
    } else {
      (this.db as SimpleDatabase).appendTransparencyLog(entry);
    }
  }

  /**
   * Get transparency log
   */
  async getTransparencyLog(limit: number = 100): Promise<any[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getTransparencyLog(limit);
    } else {
      return (this.db as SimpleDatabase).getTransparencyLog(limit);
    }
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}


    } else {
      return (this.db as SimpleDatabase).getAttestor(did);
    }
  }

  /**
   * Get all attestors
   */
  async getAllAttestors(): Promise<AttestorRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllAttestors();
    } else {
      return (this.db as SimpleDatabase).getAllAttestors();
    }
  }

  /**
   * Store credential
   */
  async storeCredential(hash: string, credential: VerifiableHumanCredential): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeCredential(hash, credential);
    } else {
      (this.db as SimpleDatabase).storeCredential(hash, credential);
    }
  }

  /**
   * Get credential
   */
  async getCredential(hash: string): Promise<VerifiableHumanCredential | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getCredential(hash);
    } else {
      return (this.db as SimpleDatabase).getCredential(hash);
    }
  }

  /**
   * Get all credentials
   */
  async getAllCredentials(): Promise<VerifiableHumanCredential[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllCredentials();
    } else {
      return (this.db as SimpleDatabase).getAllCredentials();
    }
  }

  /**
   * Store revocation
   */
  async storeRevocation(hash: string, revocation: RevocationRecord): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeRevocation(hash, revocation);
    } else {
      (this.db as SimpleDatabase).storeRevocation(hash, revocation);
    }
  }

  /**
   * Get revocation
   */
  async getRevocation(hash: string): Promise<RevocationRecord | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getRevocation(hash);
    } else {
      return (this.db as SimpleDatabase).getRevocation(hash);
    }
  }

  /**
   * Get all revocations
   */
  async getAllRevocations(): Promise<RevocationRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllRevocations();
    } else {
      return (this.db as SimpleDatabase).getAllRevocations();
    }
  }

  /**
   * Append audit log
   */
  async appendAuditLog(entry: AuditLogEntry): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).appendAuditLog(entry);
    } else {
      (this.db as SimpleDatabase).appendAuditLog(entry);
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(attestorDID?: string, limit: number = 100): Promise<AuditLogEntry[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAuditLogs(attestorDID, limit);
    } else {
      return (this.db as SimpleDatabase).getAuditLogs(attestorDID, limit);
    }
  }

  /**
   * Store reputation record
   */
  async storeReputation(did: string, reputation: any): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeReputation(did, reputation);
    } else {
      (this.db as SimpleDatabase).storeReputation(did, reputation);
    }
  }

  /**
   * Get reputation record
   */
  async getReputation(did: string): Promise<any | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getReputation(did);
    } else {
      return (this.db as SimpleDatabase).getReputation(did);
    }
  }

  /**
   * Get all reputation records
   */
  async getAllReputation(): Promise<{ [did: string]: any }> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllReputation();
    } else {
      return (this.db as SimpleDatabase).getAllReputation();
    }
  }

  /**
   * Append submission history
   */
  async appendSubmissionHistory(did: string, record: any): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).appendSubmissionHistory(did, record);
    } else {
      (this.db as SimpleDatabase).appendSubmissionHistory(did, record);
    }
  }

  /**
   * Get submission history
   */
  async getSubmissionHistory(did: string): Promise<any[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getSubmissionHistory(did);
    } else {
      return (this.db as SimpleDatabase).getSubmissionHistory(did);
    }
  }

  /**
   * Append anomaly log entry
   */
  async appendAnomalyLog(did: string, entry: string): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).appendAnomalyLog(did, entry);
    } else {
      (this.db as SimpleDatabase).appendAnomalyLog(did, entry);
    }
  }

  /**
   * Get anomaly log
   */
  async getAnomalyLog(did: string): Promise<string[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAnomalyLog(did);
    } else {
      return (this.db as SimpleDatabase).getAnomalyLog(did);
    }
  }

  /**
   * Store a challenge
   */
  async storeChallenge(challenge: Omit<ChallengeRecord, 'id'>): Promise<string> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeChallenge(challenge);
    } else {
      return (this.db as SimpleDatabase).storeChallenge(challenge);
    }
  }

  /**
   * Get challenge by ID
   */
  async getChallengeById(challengeId: string): Promise<ChallengeRecord | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getChallengeById(challengeId);
    } else {
      return (this.db as SimpleDatabase).getChallengeById(challengeId);
    }
  }

  /**
   * Get all challenges for a proof hash
   */
  async getChallengesByProofHash(proofHash: string): Promise<ChallengeRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getChallengesByProofHash(proofHash);
    } else {
      return (this.db as SimpleDatabase).getChallengesByProofHash(proofHash);
    }
  }

  /**
   * Get all challenges for a DID (as author or challenger)
   */
  async getChallengesByDID(did: string): Promise<ChallengeRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getChallengesByDID(did);
    } else {
      return (this.db as SimpleDatabase).getChallengesByDID(did);
    }
  }

  /**
   * Update challenge status
   */
  async updateChallenge(challengeId: string, updates: Partial<ChallengeRecord>): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).updateChallenge(challengeId, updates);
    } else {
      (this.db as SimpleDatabase).updateChallenge(challengeId, updates);
    }
  }

  /**
   * Append entry to transparency log
   */
  async appendTransparencyLog(entry: {
    type: 'challenge_submitted' | 'challenge_responded' | 'challenge_resolved';
    challenge_id: string;
    proof_hash: string;
    did?: string;
    resolution?: string;
    timestamp: string;
    details?: any;
  }): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).appendTransparencyLog(entry);
    } else {
      (this.db as SimpleDatabase).appendTransparencyLog(entry);
    }
  }

  /**
   * Get transparency log
   */
  async getTransparencyLog(limit: number = 100): Promise<any[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getTransparencyLog(limit);
    } else {
      return (this.db as SimpleDatabase).getTransparencyLog(limit);
    }
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}


    } else {
      return (this.db as SimpleDatabase).getAttestor(did);
    }
  }

  /**
   * Get all attestors
   */
  async getAllAttestors(): Promise<AttestorRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllAttestors();
    } else {
      return (this.db as SimpleDatabase).getAllAttestors();
    }
  }

  /**
   * Store credential
   */
  async storeCredential(hash: string, credential: VerifiableHumanCredential): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeCredential(hash, credential);
    } else {
      (this.db as SimpleDatabase).storeCredential(hash, credential);
    }
  }

  /**
   * Get credential
   */
  async getCredential(hash: string): Promise<VerifiableHumanCredential | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getCredential(hash);
    } else {
      return (this.db as SimpleDatabase).getCredential(hash);
    }
  }

  /**
   * Get all credentials
   */
  async getAllCredentials(): Promise<VerifiableHumanCredential[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllCredentials();
    } else {
      return (this.db as SimpleDatabase).getAllCredentials();
    }
  }

  /**
   * Store revocation
   */
  async storeRevocation(hash: string, revocation: RevocationRecord): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeRevocation(hash, revocation);
    } else {
      (this.db as SimpleDatabase).storeRevocation(hash, revocation);
    }
  }

  /**
   * Get revocation
   */
  async getRevocation(hash: string): Promise<RevocationRecord | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getRevocation(hash);
    } else {
      return (this.db as SimpleDatabase).getRevocation(hash);
    }
  }

  /**
   * Get all revocations
   */
  async getAllRevocations(): Promise<RevocationRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllRevocations();
    } else {
      return (this.db as SimpleDatabase).getAllRevocations();
    }
  }

  /**
   * Append audit log
   */
  async appendAuditLog(entry: AuditLogEntry): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).appendAuditLog(entry);
    } else {
      (this.db as SimpleDatabase).appendAuditLog(entry);
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(attestorDID?: string, limit: number = 100): Promise<AuditLogEntry[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAuditLogs(attestorDID, limit);
    } else {
      return (this.db as SimpleDatabase).getAuditLogs(attestorDID, limit);
    }
  }

  /**
   * Store reputation record
   */
  async storeReputation(did: string, reputation: any): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeReputation(did, reputation);
    } else {
      (this.db as SimpleDatabase).storeReputation(did, reputation);
    }
  }

  /**
   * Get reputation record
   */
  async getReputation(did: string): Promise<any | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getReputation(did);
    } else {
      return (this.db as SimpleDatabase).getReputation(did);
    }
  }

  /**
   * Get all reputation records
   */
  async getAllReputation(): Promise<{ [did: string]: any }> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllReputation();
    } else {
      return (this.db as SimpleDatabase).getAllReputation();
    }
  }

  /**
   * Append submission history
   */
  async appendSubmissionHistory(did: string, record: any): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).appendSubmissionHistory(did, record);
    } else {
      (this.db as SimpleDatabase).appendSubmissionHistory(did, record);
    }
  }

  /**
   * Get submission history
   */
  async getSubmissionHistory(did: string): Promise<any[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getSubmissionHistory(did);
    } else {
      return (this.db as SimpleDatabase).getSubmissionHistory(did);
    }
  }

  /**
   * Append anomaly log entry
   */
  async appendAnomalyLog(did: string, entry: string): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).appendAnomalyLog(did, entry);
    } else {
      (this.db as SimpleDatabase).appendAnomalyLog(did, entry);
    }
  }

  /**
   * Get anomaly log
   */
  async getAnomalyLog(did: string): Promise<string[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAnomalyLog(did);
    } else {
      return (this.db as SimpleDatabase).getAnomalyLog(did);
    }
  }

  /**
   * Store a challenge
   */
  async storeChallenge(challenge: Omit<ChallengeRecord, 'id'>): Promise<string> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeChallenge(challenge);
    } else {
      return (this.db as SimpleDatabase).storeChallenge(challenge);
    }
  }

  /**
   * Get challenge by ID
   */
  async getChallengeById(challengeId: string): Promise<ChallengeRecord | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getChallengeById(challengeId);
    } else {
      return (this.db as SimpleDatabase).getChallengeById(challengeId);
    }
  }

  /**
   * Get all challenges for a proof hash
   */
  async getChallengesByProofHash(proofHash: string): Promise<ChallengeRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getChallengesByProofHash(proofHash);
    } else {
      return (this.db as SimpleDatabase).getChallengesByProofHash(proofHash);
    }
  }

  /**
   * Get all challenges for a DID (as author or challenger)
   */
  async getChallengesByDID(did: string): Promise<ChallengeRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getChallengesByDID(did);
    } else {
      return (this.db as SimpleDatabase).getChallengesByDID(did);
    }
  }

  /**
   * Update challenge status
   */
  async updateChallenge(challengeId: string, updates: Partial<ChallengeRecord>): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).updateChallenge(challengeId, updates);
    } else {
      (this.db as SimpleDatabase).updateChallenge(challengeId, updates);
    }
  }

  /**
   * Append entry to transparency log
   */
  async appendTransparencyLog(entry: {
    type: 'challenge_submitted' | 'challenge_responded' | 'challenge_resolved';
    challenge_id: string;
    proof_hash: string;
    did?: string;
    resolution?: string;
    timestamp: string;
    details?: any;
  }): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).appendTransparencyLog(entry);
    } else {
      (this.db as SimpleDatabase).appendTransparencyLog(entry);
    }
  }

  /**
   * Get transparency log
   */
  async getTransparencyLog(limit: number = 100): Promise<any[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getTransparencyLog(limit);
    } else {
      return (this.db as SimpleDatabase).getTransparencyLog(limit);
    }
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}


    } else {
      return (this.db as SimpleDatabase).getAttestor(did);
    }
  }

  /**
   * Get all attestors
   */
  async getAllAttestors(): Promise<AttestorRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllAttestors();
    } else {
      return (this.db as SimpleDatabase).getAllAttestors();
    }
  }

  /**
   * Store credential
   */
  async storeCredential(hash: string, credential: VerifiableHumanCredential): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeCredential(hash, credential);
    } else {
      (this.db as SimpleDatabase).storeCredential(hash, credential);
    }
  }

  /**
   * Get credential
   */
  async getCredential(hash: string): Promise<VerifiableHumanCredential | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getCredential(hash);
    } else {
      return (this.db as SimpleDatabase).getCredential(hash);
    }
  }

  /**
   * Get all credentials
   */
  async getAllCredentials(): Promise<VerifiableHumanCredential[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllCredentials();
    } else {
      return (this.db as SimpleDatabase).getAllCredentials();
    }
  }

  /**
   * Store revocation
   */
  async storeRevocation(hash: string, revocation: RevocationRecord): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeRevocation(hash, revocation);
    } else {
      (this.db as SimpleDatabase).storeRevocation(hash, revocation);
    }
  }

  /**
   * Get revocation
   */
  async getRevocation(hash: string): Promise<RevocationRecord | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getRevocation(hash);
    } else {
      return (this.db as SimpleDatabase).getRevocation(hash);
    }
  }

  /**
   * Get all revocations
   */
  async getAllRevocations(): Promise<RevocationRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllRevocations();
    } else {
      return (this.db as SimpleDatabase).getAllRevocations();
    }
  }

  /**
   * Append audit log
   */
  async appendAuditLog(entry: AuditLogEntry): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).appendAuditLog(entry);
    } else {
      (this.db as SimpleDatabase).appendAuditLog(entry);
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(attestorDID?: string, limit: number = 100): Promise<AuditLogEntry[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAuditLogs(attestorDID, limit);
    } else {
      return (this.db as SimpleDatabase).getAuditLogs(attestorDID, limit);
    }
  }

  /**
   * Store reputation record
   */
  async storeReputation(did: string, reputation: any): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeReputation(did, reputation);
    } else {
      (this.db as SimpleDatabase).storeReputation(did, reputation);
    }
  }

  /**
   * Get reputation record
   */
  async getReputation(did: string): Promise<any | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getReputation(did);
    } else {
      return (this.db as SimpleDatabase).getReputation(did);
    }
  }

  /**
   * Get all reputation records
   */
  async getAllReputation(): Promise<{ [did: string]: any }> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAllReputation();
    } else {
      return (this.db as SimpleDatabase).getAllReputation();
    }
  }

  /**
   * Append submission history
   */
  async appendSubmissionHistory(did: string, record: any): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).appendSubmissionHistory(did, record);
    } else {
      (this.db as SimpleDatabase).appendSubmissionHistory(did, record);
    }
  }

  /**
   * Get submission history
   */
  async getSubmissionHistory(did: string): Promise<any[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getSubmissionHistory(did);
    } else {
      return (this.db as SimpleDatabase).getSubmissionHistory(did);
    }
  }

  /**
   * Append anomaly log entry
   */
  async appendAnomalyLog(did: string, entry: string): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).appendAnomalyLog(did, entry);
    } else {
      (this.db as SimpleDatabase).appendAnomalyLog(did, entry);
    }
  }

  /**
   * Get anomaly log
   */
  async getAnomalyLog(did: string): Promise<string[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getAnomalyLog(did);
    } else {
      return (this.db as SimpleDatabase).getAnomalyLog(did);
    }
  }

  /**
   * Store a challenge
   */
  async storeChallenge(challenge: Omit<ChallengeRecord, 'id'>): Promise<string> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).storeChallenge(challenge);
    } else {
      return (this.db as SimpleDatabase).storeChallenge(challenge);
    }
  }

  /**
   * Get challenge by ID
   */
  async getChallengeById(challengeId: string): Promise<ChallengeRecord | null> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getChallengeById(challengeId);
    } else {
      return (this.db as SimpleDatabase).getChallengeById(challengeId);
    }
  }

  /**
   * Get all challenges for a proof hash
   */
  async getChallengesByProofHash(proofHash: string): Promise<ChallengeRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getChallengesByProofHash(proofHash);
    } else {
      return (this.db as SimpleDatabase).getChallengesByProofHash(proofHash);
    }
  }

  /**
   * Get all challenges for a DID (as author or challenger)
   */
  async getChallengesByDID(did: string): Promise<ChallengeRecord[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getChallengesByDID(did);
    } else {
      return (this.db as SimpleDatabase).getChallengesByDID(did);
    }
  }

  /**
   * Update challenge status
   */
  async updateChallenge(challengeId: string, updates: Partial<ChallengeRecord>): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).updateChallenge(challengeId, updates);
    } else {
      (this.db as SimpleDatabase).updateChallenge(challengeId, updates);
    }
  }

  /**
   * Append entry to transparency log
   */
  async appendTransparencyLog(entry: {
    type: 'challenge_submitted' | 'challenge_responded' | 'challenge_resolved';
    challenge_id: string;
    proof_hash: string;
    did?: string;
    resolution?: string;
    timestamp: string;
    details?: any;
  }): Promise<void> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).appendTransparencyLog(entry);
    } else {
      (this.db as SimpleDatabase).appendTransparencyLog(entry);
    }
  }

  /**
   * Get transparency log
   */
  async getTransparencyLog(limit: number = 100): Promise<any[]> {
    if (this.isPostgres) {
      return await (this.db as PostgreSQLDatabase).getTransparencyLog(limit);
    } else {
      return (this.db as SimpleDatabase).getTransparencyLog(limit);
    }
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}

