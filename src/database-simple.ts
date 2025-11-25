/**
 * Simple File-Based Database
 * Fallback implementation using JSON files (for development/testing)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ProofRecord, MerkleBatch } from './types';

export class SimpleDatabase {
  private dataDir: string;
  private proofsFile: string;
  private batchesFile: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
    this.proofsFile = join(dataDir, 'proofs.json');
    this.batchesFile = join(dataDir, 'batches.json');

    // Ensure data directory exists
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    // Initialize files if they don't exist
    if (!existsSync(this.proofsFile)) {
      writeFileSync(this.proofsFile, JSON.stringify([], null, 2));
    }
    if (!existsSync(this.batchesFile)) {
      writeFileSync(this.batchesFile, JSON.stringify([], null, 2));
    }
  }

  private readProofs(): ProofRecord[] {
    const data = readFileSync(this.proofsFile, 'utf8');
    return JSON.parse(data);
  }

  private writeProofs(proofs: ProofRecord[]) {
    writeFileSync(this.proofsFile, JSON.stringify(proofs, null, 2));
  }

  private readBatches(): MerkleBatch[] {
    const data = readFileSync(this.batchesFile, 'utf8');
    return JSON.parse(data);
  }

  private writeBatches(batches: MerkleBatch[]) {
    writeFileSync(this.batchesFile, JSON.stringify(batches, null, 2));
  }

  storeProof(proof: Omit<ProofRecord, 'id' | 'submitted_at'>): number {
    const proofs = this.readProofs();
    const newId = proofs.length > 0 ? Math.max(...proofs.map(p => p.id)) + 1 : 1;
    
    const newProof: ProofRecord = {
      id: newId,
      ...proof,
      submitted_at: new Date().toISOString()
    };

    proofs.push(newProof);
    this.writeProofs(proofs);
    return newId;
  }

  getProofByHash(hash: string): ProofRecord | null {
    const proofs = this.readProofs();
    return proofs.find(p => p.hash === hash) || null;
  }

  getPendingProofs(limit: number = 1000): ProofRecord[] {
    const proofs = this.readProofs();
    return proofs
      .filter(p => !p.batch_id)
      .slice(0, limit);
  }

  updateProofBatch(hash: string, batchId: string, merkleIndex: number) {
    const proofs = this.readProofs();
    const proof = proofs.find(p => p.hash === hash);
    if (proof) {
      proof.batch_id = batchId;
      proof.merkle_index = merkleIndex;
      this.writeProofs(proofs);
    }
  }

  storeMerkleBatch(batch: Omit<MerkleBatch, 'created_at'>) {
    const batches = this.readBatches();
    const newBatch: MerkleBatch = {
      ...batch,
      created_at: new Date().toISOString()
    };
    batches.push(newBatch);
    this.writeBatches(batches);
  }

  updateBatchAnchors(batchId: string, anchors: Array<{ chain: string; tx: string; block?: number }>) {
    const batches = this.readBatches();
    const batch = batches.find(b => b.id === batchId);
    if (batch) {
      // Store anchor info (we'll use anchor_tx and anchor_chain fields)
      // For multiple anchors, we'll store as JSON in anchor_tx
      if (anchors.length > 0) {
        batch.anchor_tx = JSON.stringify(anchors);
        batch.anchor_chain = anchors.map(a => a.chain).join(',');
        batch.anchored_at = new Date().toISOString();
        this.writeBatches(batches);
      }
    }
  }

  getLatestBatch(): MerkleBatch | null {
    const batches = this.readBatches();
    if (batches.length === 0) return null;
    return batches[batches.length - 1];
  }

  getBatchProofs(batchId: string): ProofRecord[] {
    const proofs = this.readProofs();
    return proofs
      .filter(p => p.batch_id === batchId)
      .sort((a, b) => (a.merkle_index || 0) - (b.merkle_index || 0));
  }

  getBatchById(batchId: string): MerkleBatch | null {
    const batches = this.readBatches();
    return batches.find(b => b.id === batchId) || null;
  }

  getTotalProofs(): number {
    return this.readProofs().length;
  }

  getPendingCount(): number {
    return this.readProofs().filter(p => !p.batch_id).length;
  }

  close() {
    // No-op for file-based storage
  }
}

