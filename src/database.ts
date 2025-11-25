/**
 * Database Module
 * Database interface for storing proofs and Merkle batches
 * Uses simple file-based storage (JSON files)
 */

import { SimpleDatabase } from './database-simple';
import { ProofRecord, MerkleBatch } from './types';

export class RegistryDatabase {
  private db: SimpleDatabase;

  constructor(dbPath: string = './data/registry.db') {
    // Use simple file-based database
    this.db = new SimpleDatabase('./data');
  }

  /**
   * Store a proof
   */
  storeProof(proof: Omit<ProofRecord, 'id' | 'submitted_at'>): number {
    return this.db.storeProof(proof);
  }

  /**
   * Get proof by hash
   */
  getProofByHash(hash: string): ProofRecord | null {
    return this.db.getProofByHash(hash);
  }

  /**
   * Get pending proofs (not yet batched)
   */
  getPendingProofs(limit: number = 1000): ProofRecord[] {
    return this.db.getPendingProofs(limit);
  }

  /**
   * Update proof with batch information
   */
  updateProofBatch(hash: string, batchId: string, merkleIndex: number) {
    this.db.updateProofBatch(hash, batchId, merkleIndex);
  }

  /**
   * Store Merkle batch
   */
  storeMerkleBatch(batch: Omit<MerkleBatch, 'created_at'>) {
    this.db.storeMerkleBatch(batch);
  }

  /**
   * Update batch with anchor information
   */
  updateBatchAnchors(batchId: string, anchors: Array<{ chain: string; tx: string; block?: number }>) {
    this.db.updateBatchAnchors(batchId, anchors);
  }

  /**
   * Get latest Merkle batch
   */
  getLatestBatch(): MerkleBatch | null {
    return this.db.getLatestBatch();
  }

  /**
   * Get proofs in a batch
   */
  getBatchProofs(batchId: string): ProofRecord[] {
    return this.db.getBatchProofs(batchId);
  }

  /**
   * Get batch by ID
   */
  getBatchById(batchId: string): MerkleBatch | null {
    return this.db.getBatchById(batchId);
  }

  /**
   * Get total proof count
   */
  getTotalProofs(): number {
    return this.db.getTotalProofs();
  }

  /**
   * Get pending proof count
   */
  getPendingCount(): number {
    return this.db.getPendingCount();
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}

