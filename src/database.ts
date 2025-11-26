/**
 * Database Module
 * Database interface for storing proofs and Merkle batches
 * Uses simple file-based storage (JSON files)
 */

import { SimpleDatabase } from './database-simple';
import { ProofRecord, MerkleBatch } from './types';
import { DIDDocument, KCGNode } from './did';
import { AttestorRecord, VerifiableHumanCredential, RevocationRecord, AuditLogEntry } from './attestors';

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
   * Get proof by compound hash (fallback for old proofs)
   */
  getProofByCompoundHash(compoundHash: string): ProofRecord | null {
    return this.db.getProofByCompoundHash(compoundHash);
  }

  /**
   * Get all proofs by hash (for cases where multiple people prove same content)
   */
  getAllProofsByHash(hash: string): ProofRecord[] {
    return this.db.getAllProofsByHash(hash);
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
   * Store DID document
   */
  storeDIDDocument(did: string, document: DIDDocument): void {
    this.db.storeDIDDocument(did, document);
  }

  /**
   * Get DID document
   */
  getDIDDocument(did: string): DIDDocument | null {
    return this.db.getDIDDocument(did);
  }

  /**
   * Get all DID documents
   */
  getAllDIDDocuments(): DIDDocument[] {
    return this.db.getAllDIDDocuments();
  }

  /**
   * Store KCG node
   */
  storeKCGNode(did: string, node: KCGNode): void {
    this.db.storeKCGNode(did, node);
  }

  /**
   * Get KCG node
   */
  getKCGNode(did: string): KCGNode | null {
    return this.db.getKCGNode(did);
  }

  /**
   * Get continuity chain for a DID
   */
  getContinuityChain(did: string): KCGNode[] {
    return this.db.getContinuityChain(did);
  }

  /**
   * Store attestor record
   */
  storeAttestor(did: string, record: AttestorRecord): void {
    this.db.storeAttestor(did, record);
  }

  /**
   * Get attestor record
   */
  getAttestor(did: string): AttestorRecord | null {
    return this.db.getAttestor(did);
  }

  /**
   * Get all attestors
   */
  getAllAttestors(): AttestorRecord[] {
    return this.db.getAllAttestors();
  }

  /**
   * Store credential
   */
  storeCredential(hash: string, credential: VerifiableHumanCredential): void {
    this.db.storeCredential(hash, credential);
  }

  /**
   * Get credential
   */
  getCredential(hash: string): VerifiableHumanCredential | null {
    return this.db.getCredential(hash);
  }

  /**
   * Get all credentials
   */
  getAllCredentials(): VerifiableHumanCredential[] {
    return this.db.getAllCredentials();
  }

  /**
   * Store revocation
   */
  storeRevocation(hash: string, revocation: RevocationRecord): void {
    this.db.storeRevocation(hash, revocation);
  }

  /**
   * Get revocation
   */
  getRevocation(hash: string): RevocationRecord | null {
    return this.db.getRevocation(hash);
  }

  /**
   * Get all revocations
   */
  getAllRevocations(): RevocationRecord[] {
    return this.db.getAllRevocations();
  }

  /**
   * Append audit log
   */
  appendAuditLog(entry: AuditLogEntry): void {
    this.db.appendAuditLog(entry);
  }

  /**
   * Get audit logs
   */
  getAuditLogs(attestorDID?: string, limit: number = 100): AuditLogEntry[] {
    return this.db.getAuditLogs(attestorDID, limit);
  }

  /**
   * Store reputation record
   */
  storeReputation(did: string, reputation: any): void {
    this.db.storeReputation(did, reputation);
  }

  /**
   * Get reputation record
   */
  getReputation(did: string): any | null {
    return this.db.getReputation(did);
  }

  /**
   * Get all reputation records
   */
  getAllReputation(): { [did: string]: any } {
    return this.db.getAllReputation();
  }

  /**
   * Append submission history
   */
  appendSubmissionHistory(did: string, record: any): void {
    this.db.appendSubmissionHistory(did, record);
  }

  /**
   * Get submission history
   */
  getSubmissionHistory(did: string): any[] {
    return this.db.getSubmissionHistory(did);
  }

  /**
   * Append anomaly log entry
   */
  appendAnomalyLog(did: string, entry: string): void {
    this.db.appendAnomalyLog(did, entry);
  }

  /**
   * Get anomaly log
   */
  getAnomalyLog(did: string): string[] {
    return this.db.getAnomalyLog(did);
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}

