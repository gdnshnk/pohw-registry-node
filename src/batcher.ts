/**
 * Batch Manager
 * Handles batching proofs into Merkle trees
 */

import { RegistryDatabase } from './database';
import { calculateMerkleRoot, generateMerkleProof } from './merkle';
import { ProofRecord, MerkleBatch } from './types';
import { createHash } from 'crypto';
import { anchorMerkleRoot, AnchorConfig, AnchorPayload } from './anchoring';

export interface BatchConfig {
  batchSize: number;
  batchInterval?: number; // milliseconds
}

export class BatchManager {
  private db: RegistryDatabase;
  private config: BatchConfig;
  private anchorConfig?: AnchorConfig;

  constructor(
    db: RegistryDatabase, 
    config: BatchConfig = { batchSize: 1000 },
    anchorConfig?: AnchorConfig
  ) {
    this.db = db;
    this.config = config;
    this.anchorConfig = anchorConfig;
  }

  /**
   * Create a new batch from pending proofs
   */
  async createBatch(): Promise<MerkleBatch | null> {
    const pending = this.db.getPendingProofs(this.config.batchSize);

    if (pending.length === 0) {
      return null;
    }

    // Generate batch ID
    const batchId = this.generateBatchId();

    // Extract hashes for Merkle tree
    const hashes = pending.map(p => p.hash);

    // Calculate Merkle root
    const root = calculateMerkleRoot(hashes);

    // Update proofs with batch info
    pending.forEach((proof, index) => {
      this.db.updateProofBatch(proof.hash, batchId, index);
    });

    // Store batch
    const batch: Omit<MerkleBatch, 'created_at'> = {
      id: batchId,
      root: '0x' + root,
      size: pending.length
    };

    this.db.storeMerkleBatch(batch);

    // Anchor to blockchains if configured
    if (this.anchorConfig?.enabled) {
      try {
        const anchorPayload: AnchorPayload = {
          merkleRoot: batch.root,
          batchId: batch.id,
          registryId: 'pohw-registry-node',
          timestamp: new Date().toISOString()
        };

        const anchorResults = await anchorMerkleRoot(anchorPayload, this.anchorConfig);
        
        // Store anchor information
        const anchors = anchorResults
          .filter(r => r.success)
          .map(r => ({
            chain: r.chain,
            tx: r.txHash,
            block: r.blockNumber
          }));

        if (anchors.length > 0) {
          this.db.updateBatchAnchors(batchId, anchors);
        }
      } catch (error) {
        console.error('Anchoring failed:', error);
        // Continue even if anchoring fails
      }
    }

    return {
      ...batch,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Get Merkle proof for a hash
   */
  getMerkleProof(hash: string): {
    proof: string[];
    root: string;
    batchId: string;
  } | null {
    const proofRecord = this.db.getProofByHash(hash);

    if (!proofRecord || !proofRecord.batch_id) {
      return null;
    }

    const batchProofs = this.db.getBatchProofs(proofRecord.batch_id);
    const hashes = batchProofs.map(p => p.hash);
    const proof = generateMerkleProof(hashes, hash);

    const batch = this.db.getLatestBatch();
    if (!batch || batch.id !== proofRecord.batch_id) {
      return null;
    }

    return {
      proof: proof.map(p => '0x' + p),
      root: batch.root,
      batchId: batch.id
    };
  }

  /**
   * Generate unique batch ID
   */
  private generateBatchId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const combined = `${timestamp}-${random}`;
    return createHash('sha256').update(combined).digest('hex').substring(0, 16);
  }

  /**
   * Check if batch should be created
   */
  shouldCreateBatch(): boolean {
    const pendingCount = this.db.getPendingCount();
    return pendingCount >= this.config.batchSize;
  }
}

