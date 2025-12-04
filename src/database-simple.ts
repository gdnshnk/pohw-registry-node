/**
 * Simple File-Based Database
 * Fallback implementation using JSON files (for development/testing)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ProofRecord, MerkleBatch, ChallengeRecord } from './types';
import { DIDDocument, KCGNode } from './did';
import { AttestorRecord, VerifiableHumanCredential, RevocationRecord, AuditLogEntry } from './attestors';
import { createHash } from 'crypto';

export class SimpleDatabase {
  private dataDir: string;
  private proofsFile: string;
  private batchesFile: string;
  private didsFile: string;
  private kcgFile: string;
  private attestorsFile: string;
  private credentialsFile: string;
  private revocationsFile: string;
  private auditLogsFile: string;
  private reputationFile: string;
  private submissionHistoryFile: string;
  private anomalyLogFile: string;
  private challengesFile: string;
  private transparencyLogFile: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
    this.proofsFile = join(dataDir, 'proofs.json');
    this.batchesFile = join(dataDir, 'batches.json');
    this.didsFile = join(dataDir, 'dids.json');
    this.kcgFile = join(dataDir, 'kcg.json');
    this.attestorsFile = join(dataDir, 'attestors.json');
    this.credentialsFile = join(dataDir, 'credentials.json');
    this.revocationsFile = join(dataDir, 'revocations.json');
    this.auditLogsFile = join(dataDir, 'audit-logs.json');
    this.reputationFile = join(dataDir, 'reputation.json');
    this.submissionHistoryFile = join(dataDir, 'submission-history.json');
    this.anomalyLogFile = join(dataDir, 'anomaly-log.json');
    this.challengesFile = join(dataDir, 'challenges.json');
    this.transparencyLogFile = join(dataDir, 'transparency-log.json');

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
    if (!existsSync(this.didsFile)) {
      writeFileSync(this.didsFile, JSON.stringify({}, null, 2));
    }
    if (!existsSync(this.kcgFile)) {
      writeFileSync(this.kcgFile, JSON.stringify({}, null, 2));
    }
    if (!existsSync(this.attestorsFile)) {
      writeFileSync(this.attestorsFile, JSON.stringify({}, null, 2));
    }
    if (!existsSync(this.credentialsFile)) {
      writeFileSync(this.credentialsFile, JSON.stringify({}, null, 2));
    }
    if (!existsSync(this.revocationsFile)) {
      writeFileSync(this.revocationsFile, JSON.stringify({}, null, 2));
    }
    if (!existsSync(this.auditLogsFile)) {
      writeFileSync(this.auditLogsFile, JSON.stringify([], null, 2));
    }
    if (!existsSync(this.reputationFile)) {
      writeFileSync(this.reputationFile, JSON.stringify({}, null, 2));
    }
    if (!existsSync(this.submissionHistoryFile)) {
      writeFileSync(this.submissionHistoryFile, JSON.stringify({}, null, 2));
    }
    if (!existsSync(this.anomalyLogFile)) {
      writeFileSync(this.anomalyLogFile, JSON.stringify({}, null, 2));
    }
    if (!existsSync(this.challengesFile)) {
      writeFileSync(this.challengesFile, JSON.stringify([], null, 2));
    }
    if (!existsSync(this.transparencyLogFile)) {
      writeFileSync(this.transparencyLogFile, JSON.stringify([], null, 2));
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

  getProofByCompoundHash(compoundHash: string): ProofRecord | null {
    const proofs = this.readProofs();
    return proofs.find(p => p.compound_hash === compoundHash) || null;
  }

  getAllProofsByHash(hash: string): ProofRecord[] {
    const proofs = this.readProofs();
    return proofs.filter(p => p.hash === hash);
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

  getAllBatches(): MerkleBatch[] {
    return this.readBatches();
  }

  getTotalProofs(): number {
    return this.readProofs().length;
  }

  getPendingCount(): number {
    return this.readProofs().filter(p => !p.batch_id).length;
  }

  // DID Document storage
  private readDIDs(): Record<string, DIDDocument> {
    const data = readFileSync(this.didsFile, 'utf8');
    return JSON.parse(data);
  }

  private writeDIDs(dids: Record<string, DIDDocument>) {
    writeFileSync(this.didsFile, JSON.stringify(dids, null, 2));
  }

  storeDIDDocument(did: string, document: DIDDocument): void {
    const dids = this.readDIDs();
    dids[did] = document;
    this.writeDIDs(dids);
  }

  getDIDDocument(did: string): DIDDocument | null {
    const dids = this.readDIDs();
    return dids[did] || null;
  }

  getAllDIDDocuments(): DIDDocument[] {
    const dids = this.readDIDs();
    return Object.values(dids);
  }

  // Key Continuity Graph storage
  private readKCG(): Record<string, KCGNode> {
    const data = readFileSync(this.kcgFile, 'utf8');
    return JSON.parse(data);
  }

  private writeKCG(kcg: Record<string, KCGNode>) {
    writeFileSync(this.kcgFile, JSON.stringify(kcg, null, 2));
  }

  storeKCGNode(did: string, node: KCGNode): void {
    const kcg = this.readKCG();
    kcg[did] = node;
    this.writeKCG(kcg);
  }

  getKCGNode(did: string): KCGNode | null {
    const kcg = this.readKCG();
    return kcg[did] || null;
  }

  getContinuityChain(did: string): KCGNode[] {
    const chain: KCGNode[] = [];
    const kcg = this.readKCG();
    let currentDID: string | undefined = did;

    while (currentDID) {
      const node: KCGNode | undefined = kcg[currentDID];
      if (!node) break;
      chain.unshift(node);
      currentDID = node.previousNode;
    }

    return chain;
  }

  // Attestor storage
  private readAttestors(): Record<string, AttestorRecord> {
    const data = readFileSync(this.attestorsFile, 'utf8');
    return JSON.parse(data);
  }

  private writeAttestors(attestors: Record<string, AttestorRecord>) {
    writeFileSync(this.attestorsFile, JSON.stringify(attestors, null, 2));
  }

  storeAttestor(did: string, record: AttestorRecord): void {
    const attestors = this.readAttestors();
    attestors[did] = record;
    this.writeAttestors(attestors);
  }

  getAttestor(did: string): AttestorRecord | null {
    const attestors = this.readAttestors();
    return attestors[did] || null;
  }

  getAllAttestors(): AttestorRecord[] {
    const attestors = this.readAttestors();
    return Object.values(attestors);
  }

  // Credential storage
  private readCredentials(): Record<string, VerifiableHumanCredential> {
    const data = readFileSync(this.credentialsFile, 'utf8');
    return JSON.parse(data);
  }

  private writeCredentials(credentials: Record<string, VerifiableHumanCredential>) {
    writeFileSync(this.credentialsFile, JSON.stringify(credentials, null, 2));
  }

  storeCredential(hash: string, credential: VerifiableHumanCredential): void {
    const credentials = this.readCredentials();
    credentials[hash] = credential;
    this.writeCredentials(credentials);
  }

  getCredential(hash: string): VerifiableHumanCredential | null {
    const credentials = this.readCredentials();
    return credentials[hash] || null;
  }

  getAllCredentials(): VerifiableHumanCredential[] {
    const credentials = this.readCredentials();
    return Object.values(credentials);
  }

  // Revocation storage
  private readRevocations(): Record<string, RevocationRecord> {
    const data = readFileSync(this.revocationsFile, 'utf8');
    return JSON.parse(data);
  }

  private writeRevocations(revocations: Record<string, RevocationRecord>) {
    writeFileSync(this.revocationsFile, JSON.stringify(revocations, null, 2));
  }

  storeRevocation(hash: string, revocation: RevocationRecord): void {
    const revocations = this.readRevocations();
    revocations[hash] = revocation;
    this.writeRevocations(revocations);
  }

  getRevocation(hash: string): RevocationRecord | null {
    const revocations = this.readRevocations();
    return revocations[hash] || null;
  }

  getAllRevocations(): RevocationRecord[] {
    const revocations = this.readRevocations();
    return Object.values(revocations);
  }

  // Audit log storage
  private readAuditLogs(): AuditLogEntry[] {
    const data = readFileSync(this.auditLogsFile, 'utf8');
    return JSON.parse(data);
  }

  private writeAuditLogs(logs: AuditLogEntry[]) {
    writeFileSync(this.auditLogsFile, JSON.stringify(logs, null, 2));
  }

  appendAuditLog(entry: AuditLogEntry): void {
    const logs = this.readAuditLogs();
    logs.push(entry);
    // Keep only last 10000 entries
    if (logs.length > 10000) {
      logs.splice(0, logs.length - 10000);
    }
    this.writeAuditLogs(logs);
  }

  getAuditLogs(attestorDID?: string, limit: number = 100): AuditLogEntry[] {
    let logs = this.readAuditLogs();
    
    if (attestorDID) {
      logs = logs.filter(log => log.attestorDID === attestorDID);
    }

    return logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Fraud mitigation storage
  private readReputation(): { [did: string]: any } {
    if (!this.reputationFile) {
      this.reputationFile = join(this.dataDir, 'reputation.json');
      if (!existsSync(this.reputationFile)) {
        writeFileSync(this.reputationFile, JSON.stringify({}, null, 2));
      }
    }
    const data = readFileSync(this.reputationFile, 'utf8');
    return JSON.parse(data);
  }

  private writeReputation(reputation: { [did: string]: any }) {
    if (!this.reputationFile) {
      this.reputationFile = join(this.dataDir, 'reputation.json');
    }
    writeFileSync(this.reputationFile, JSON.stringify(reputation, null, 2));
  }

  storeReputation(did: string, reputation: any): void {
    const all = this.readReputation();
    all[did] = reputation;
    this.writeReputation(all);
  }

  getReputation(did: string): any | null {
    const all = this.readReputation();
    return all[did] || null;
  }

  getAllReputation(): { [did: string]: any } {
    return this.readReputation();
  }

  private readSubmissionHistory(): { [did: string]: any[] } {
    if (!this.submissionHistoryFile) {
      this.submissionHistoryFile = join(this.dataDir, 'submission-history.json');
      if (!existsSync(this.submissionHistoryFile)) {
        writeFileSync(this.submissionHistoryFile, JSON.stringify({}, null, 2));
      }
    }
    const data = readFileSync(this.submissionHistoryFile, 'utf8');
    return JSON.parse(data);
  }

  private writeSubmissionHistory(history: { [did: string]: any[] }) {
    if (!this.submissionHistoryFile) {
      this.submissionHistoryFile = join(this.dataDir, 'submission-history.json');
    }
    writeFileSync(this.submissionHistoryFile, JSON.stringify(history, null, 2));
  }

  appendSubmissionHistory(did: string, record: any): void {
    const all = this.readSubmissionHistory();
    if (!all[did]) {
      all[did] = [];
    }
    all[did].push(record);
    
    // Keep only last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    all[did] = all[did].filter((r: any) => r.timestamp >= oneDayAgo);
    
    this.writeSubmissionHistory(all);
  }

  getSubmissionHistory(did: string): any[] {
    const all = this.readSubmissionHistory();
    return all[did] || [];
  }

  private readAnomalyLog(): { [did: string]: string[] } {
    if (!this.anomalyLogFile) {
      this.anomalyLogFile = join(this.dataDir, 'anomaly-log.json');
      if (!existsSync(this.anomalyLogFile)) {
        writeFileSync(this.anomalyLogFile, JSON.stringify({}, null, 2));
      }
    }
    const data = readFileSync(this.anomalyLogFile, 'utf8');
    return JSON.parse(data);
  }

  private writeAnomalyLog(log: { [did: string]: string[] }) {
    if (!this.anomalyLogFile) {
      this.anomalyLogFile = join(this.dataDir, 'anomaly-log.json');
    }
    writeFileSync(this.anomalyLogFile, JSON.stringify(log, null, 2));
  }

  appendAnomalyLog(did: string, entry: string): void {
    const all = this.readAnomalyLog();
    if (!all[did]) {
      all[did] = [];
    }
    all[did].push(entry);
    
    // Keep only last 100 entries per DID
    if (all[did].length > 100) {
      all[did] = all[did].slice(-100);
    }
    
    this.writeAnomalyLog(all);
  }

  getAnomalyLog(did: string): string[] {
    const all = this.readAnomalyLog();
    return all[did] || [];
  }

  // Challenge storage (dispute resolution)
  private readChallenges(): ChallengeRecord[] {
    if (!existsSync(this.challengesFile)) {
      return [];
    }
    const data = readFileSync(this.challengesFile, 'utf8');
    return JSON.parse(data);
  }

  private writeChallenges(challenges: ChallengeRecord[]) {
    writeFileSync(this.challengesFile, JSON.stringify(challenges, null, 2));
  }

  storeChallenge(challenge: Omit<ChallengeRecord, 'id'>): string {
    const challenges = this.readChallenges();
    // Generate challenge ID from hash of proof_hash + challenger_did + timestamp
    const challengeData = `${challenge.proof_hash}-${challenge.challenger_did}-${challenge.created_at}`;
    const challengeId = '0x' + createHash('sha256').update(challengeData).digest('hex').substring(0, 16);
    
    const newChallenge: ChallengeRecord = {
      id: challengeId,
      ...challenge
    };
    
    challenges.push(newChallenge);
    this.writeChallenges(challenges);
    return challengeId;
  }

  getChallengeById(challengeId: string): ChallengeRecord | null {
    const challenges = this.readChallenges();
    return challenges.find(c => c.id === challengeId) || null;
  }

  getChallengesByProofHash(proofHash: string): ChallengeRecord[] {
    const challenges = this.readChallenges();
    return challenges.filter(c => c.proof_hash === proofHash);
  }

  getChallengesByDID(did: string): ChallengeRecord[] {
    const challenges = this.readChallenges();
    return challenges.filter(c => c.proof_did === did || c.challenger_did === did);
  }

  updateChallenge(challengeId: string, updates: Partial<ChallengeRecord>): void {
    const challenges = this.readChallenges();
    const index = challenges.findIndex(c => c.id === challengeId);
    if (index !== -1) {
      challenges[index] = { ...challenges[index], ...updates };
      this.writeChallenges(challenges);
    }
  }

  // Transparency log (for dispute outcomes)
  private readTransparencyLog(): any[] {
    if (!existsSync(this.transparencyLogFile)) {
      return [];
    }
    const data = readFileSync(this.transparencyLogFile, 'utf8');
    return JSON.parse(data);
  }

  private writeTransparencyLog(entries: any[]) {
    writeFileSync(this.transparencyLogFile, JSON.stringify(entries, null, 2));
  }

  appendTransparencyLog(entry: {
    type: 'challenge_submitted' | 'challenge_responded' | 'challenge_resolved';
    challenge_id: string;
    proof_hash: string;
    did?: string;
    resolution?: string;
    timestamp: string;
    details?: any;
  }): void {
    const log = this.readTransparencyLog();
    log.push(entry);
    // Keep only last 10000 entries
    if (log.length > 10000) {
      log.shift();
    }
    this.writeTransparencyLog(log);
  }

  getTransparencyLog(limit: number = 100): any[] {
    const log = this.readTransparencyLog();
    return log.slice(-limit).reverse(); // Most recent first
  }

  close() {
    // No-op for file-based storage
  }
}

  appendAnomalyLog(did: string, entry: string): void {
    const all = this.readAnomalyLog();
    if (!all[did]) {
      all[did] = [];
    }
    all[did].push(entry);
    
    // Keep only last 100 entries per DID
    if (all[did].length > 100) {
      all[did] = all[did].slice(-100);
    }
    
    this.writeAnomalyLog(all);
  }

  getAnomalyLog(did: string): string[] {
    const all = this.readAnomalyLog();
    return all[did] || [];
  }

  // Challenge storage (dispute resolution)
  private readChallenges(): ChallengeRecord[] {
    if (!existsSync(this.challengesFile)) {
      return [];
    }
    const data = readFileSync(this.challengesFile, 'utf8');
    return JSON.parse(data);
  }

  private writeChallenges(challenges: ChallengeRecord[]) {
    writeFileSync(this.challengesFile, JSON.stringify(challenges, null, 2));
  }

  storeChallenge(challenge: Omit<ChallengeRecord, 'id'>): string {
    const challenges = this.readChallenges();
    // Generate challenge ID from hash of proof_hash + challenger_did + timestamp
    const challengeData = `${challenge.proof_hash}-${challenge.challenger_did}-${challenge.created_at}`;
    const challengeId = '0x' + createHash('sha256').update(challengeData).digest('hex').substring(0, 16);
    
    const newChallenge: ChallengeRecord = {
      id: challengeId,
      ...challenge
    };
    
    challenges.push(newChallenge);
    this.writeChallenges(challenges);
    return challengeId;
  }

  getChallengeById(challengeId: string): ChallengeRecord | null {
    const challenges = this.readChallenges();
    return challenges.find(c => c.id === challengeId) || null;
  }

  getChallengesByProofHash(proofHash: string): ChallengeRecord[] {
    const challenges = this.readChallenges();
    return challenges.filter(c => c.proof_hash === proofHash);
  }

  getChallengesByDID(did: string): ChallengeRecord[] {
    const challenges = this.readChallenges();
    return challenges.filter(c => c.proof_did === did || c.challenger_did === did);
  }

  updateChallenge(challengeId: string, updates: Partial<ChallengeRecord>): void {
    const challenges = this.readChallenges();
    const index = challenges.findIndex(c => c.id === challengeId);
    if (index !== -1) {
      challenges[index] = { ...challenges[index], ...updates };
      this.writeChallenges(challenges);
    }
  }

  // Transparency log (for dispute outcomes)
  private readTransparencyLog(): any[] {
    if (!existsSync(this.transparencyLogFile)) {
      return [];
    }
    const data = readFileSync(this.transparencyLogFile, 'utf8');
    return JSON.parse(data);
  }

  private writeTransparencyLog(entries: any[]) {
    writeFileSync(this.transparencyLogFile, JSON.stringify(entries, null, 2));
  }

  appendTransparencyLog(entry: {
    type: 'challenge_submitted' | 'challenge_responded' | 'challenge_resolved';
    challenge_id: string;
    proof_hash: string;
    did?: string;
    resolution?: string;
    timestamp: string;
    details?: any;
  }): void {
    const log = this.readTransparencyLog();
    log.push(entry);
    // Keep only last 10000 entries
    if (log.length > 10000) {
      log.shift();
    }
    this.writeTransparencyLog(log);
  }

  getTransparencyLog(limit: number = 100): any[] {
    const log = this.readTransparencyLog();
    return log.slice(-limit).reverse(); // Most recent first
  }

  close() {
    // No-op for file-based storage
  }
}

  appendAnomalyLog(did: string, entry: string): void {
    const all = this.readAnomalyLog();
    if (!all[did]) {
      all[did] = [];
    }
    all[did].push(entry);
    
    // Keep only last 100 entries per DID
    if (all[did].length > 100) {
      all[did] = all[did].slice(-100);
    }
    
    this.writeAnomalyLog(all);
  }

  getAnomalyLog(did: string): string[] {
    const all = this.readAnomalyLog();
    return all[did] || [];
  }

  // Challenge storage (dispute resolution)
  private readChallenges(): ChallengeRecord[] {
    if (!existsSync(this.challengesFile)) {
      return [];
    }
    const data = readFileSync(this.challengesFile, 'utf8');
    return JSON.parse(data);
  }

  private writeChallenges(challenges: ChallengeRecord[]) {
    writeFileSync(this.challengesFile, JSON.stringify(challenges, null, 2));
  }

  storeChallenge(challenge: Omit<ChallengeRecord, 'id'>): string {
    const challenges = this.readChallenges();
    // Generate challenge ID from hash of proof_hash + challenger_did + timestamp
    const challengeData = `${challenge.proof_hash}-${challenge.challenger_did}-${challenge.created_at}`;
    const challengeId = '0x' + createHash('sha256').update(challengeData).digest('hex').substring(0, 16);
    
    const newChallenge: ChallengeRecord = {
      id: challengeId,
      ...challenge
    };
    
    challenges.push(newChallenge);
    this.writeChallenges(challenges);
    return challengeId;
  }

  getChallengeById(challengeId: string): ChallengeRecord | null {
    const challenges = this.readChallenges();
    return challenges.find(c => c.id === challengeId) || null;
  }

  getChallengesByProofHash(proofHash: string): ChallengeRecord[] {
    const challenges = this.readChallenges();
    return challenges.filter(c => c.proof_hash === proofHash);
  }

  getChallengesByDID(did: string): ChallengeRecord[] {
    const challenges = this.readChallenges();
    return challenges.filter(c => c.proof_did === did || c.challenger_did === did);
  }

  updateChallenge(challengeId: string, updates: Partial<ChallengeRecord>): void {
    const challenges = this.readChallenges();
    const index = challenges.findIndex(c => c.id === challengeId);
    if (index !== -1) {
      challenges[index] = { ...challenges[index], ...updates };
      this.writeChallenges(challenges);
    }
  }

  // Transparency log (for dispute outcomes)
  private readTransparencyLog(): any[] {
    if (!existsSync(this.transparencyLogFile)) {
      return [];
    }
    const data = readFileSync(this.transparencyLogFile, 'utf8');
    return JSON.parse(data);
  }

  private writeTransparencyLog(entries: any[]) {
    writeFileSync(this.transparencyLogFile, JSON.stringify(entries, null, 2));
  }

  appendTransparencyLog(entry: {
    type: 'challenge_submitted' | 'challenge_responded' | 'challenge_resolved';
    challenge_id: string;
    proof_hash: string;
    did?: string;
    resolution?: string;
    timestamp: string;
    details?: any;
  }): void {
    const log = this.readTransparencyLog();
    log.push(entry);
    // Keep only last 10000 entries
    if (log.length > 10000) {
      log.shift();
    }
    this.writeTransparencyLog(log);
  }

  getTransparencyLog(limit: number = 100): any[] {
    const log = this.readTransparencyLog();
    return log.slice(-limit).reverse(); // Most recent first
  }

  close() {
    // No-op for file-based storage
  }
}

  appendAnomalyLog(did: string, entry: string): void {
    const all = this.readAnomalyLog();
    if (!all[did]) {
      all[did] = [];
    }
    all[did].push(entry);
    
    // Keep only last 100 entries per DID
    if (all[did].length > 100) {
      all[did] = all[did].slice(-100);
    }
    
    this.writeAnomalyLog(all);
  }

  getAnomalyLog(did: string): string[] {
    const all = this.readAnomalyLog();
    return all[did] || [];
  }

  // Challenge storage (dispute resolution)
  private readChallenges(): ChallengeRecord[] {
    if (!existsSync(this.challengesFile)) {
      return [];
    }
    const data = readFileSync(this.challengesFile, 'utf8');
    return JSON.parse(data);
  }

  private writeChallenges(challenges: ChallengeRecord[]) {
    writeFileSync(this.challengesFile, JSON.stringify(challenges, null, 2));
  }

  storeChallenge(challenge: Omit<ChallengeRecord, 'id'>): string {
    const challenges = this.readChallenges();
    // Generate challenge ID from hash of proof_hash + challenger_did + timestamp
    const challengeData = `${challenge.proof_hash}-${challenge.challenger_did}-${challenge.created_at}`;
    const challengeId = '0x' + createHash('sha256').update(challengeData).digest('hex').substring(0, 16);
    
    const newChallenge: ChallengeRecord = {
      id: challengeId,
      ...challenge
    };
    
    challenges.push(newChallenge);
    this.writeChallenges(challenges);
    return challengeId;
  }

  getChallengeById(challengeId: string): ChallengeRecord | null {
    const challenges = this.readChallenges();
    return challenges.find(c => c.id === challengeId) || null;
  }

  getChallengesByProofHash(proofHash: string): ChallengeRecord[] {
    const challenges = this.readChallenges();
    return challenges.filter(c => c.proof_hash === proofHash);
  }

  getChallengesByDID(did: string): ChallengeRecord[] {
    const challenges = this.readChallenges();
    return challenges.filter(c => c.proof_did === did || c.challenger_did === did);
  }

  updateChallenge(challengeId: string, updates: Partial<ChallengeRecord>): void {
    const challenges = this.readChallenges();
    const index = challenges.findIndex(c => c.id === challengeId);
    if (index !== -1) {
      challenges[index] = { ...challenges[index], ...updates };
      this.writeChallenges(challenges);
    }
  }

  // Transparency log (for dispute outcomes)
  private readTransparencyLog(): any[] {
    if (!existsSync(this.transparencyLogFile)) {
      return [];
    }
    const data = readFileSync(this.transparencyLogFile, 'utf8');
    return JSON.parse(data);
  }

  private writeTransparencyLog(entries: any[]) {
    writeFileSync(this.transparencyLogFile, JSON.stringify(entries, null, 2));
  }

  appendTransparencyLog(entry: {
    type: 'challenge_submitted' | 'challenge_responded' | 'challenge_resolved';
    challenge_id: string;
    proof_hash: string;
    did?: string;
    resolution?: string;
    timestamp: string;
    details?: any;
  }): void {
    const log = this.readTransparencyLog();
    log.push(entry);
    // Keep only last 10000 entries
    if (log.length > 10000) {
      log.shift();
    }
    this.writeTransparencyLog(log);
  }

  getTransparencyLog(limit: number = 100): any[] {
    const log = this.readTransparencyLog();
    return log.slice(-limit).reverse(); // Most recent first
  }

  close() {
    // No-op for file-based storage
  }
}

  appendAnomalyLog(did: string, entry: string): void {
    const all = this.readAnomalyLog();
    if (!all[did]) {
      all[did] = [];
    }
    all[did].push(entry);
    
    // Keep only last 100 entries per DID
    if (all[did].length > 100) {
      all[did] = all[did].slice(-100);
    }
    
    this.writeAnomalyLog(all);
  }

  getAnomalyLog(did: string): string[] {
    const all = this.readAnomalyLog();
    return all[did] || [];
  }

  // Challenge storage (dispute resolution)
  private readChallenges(): ChallengeRecord[] {
    if (!existsSync(this.challengesFile)) {
      return [];
    }
    const data = readFileSync(this.challengesFile, 'utf8');
    return JSON.parse(data);
  }

  private writeChallenges(challenges: ChallengeRecord[]) {
    writeFileSync(this.challengesFile, JSON.stringify(challenges, null, 2));
  }

  storeChallenge(challenge: Omit<ChallengeRecord, 'id'>): string {
    const challenges = this.readChallenges();
    // Generate challenge ID from hash of proof_hash + challenger_did + timestamp
    const challengeData = `${challenge.proof_hash}-${challenge.challenger_did}-${challenge.created_at}`;
    const challengeId = '0x' + createHash('sha256').update(challengeData).digest('hex').substring(0, 16);
    
    const newChallenge: ChallengeRecord = {
      id: challengeId,
      ...challenge
    };
    
    challenges.push(newChallenge);
    this.writeChallenges(challenges);
    return challengeId;
  }

  getChallengeById(challengeId: string): ChallengeRecord | null {
    const challenges = this.readChallenges();
    return challenges.find(c => c.id === challengeId) || null;
  }

  getChallengesByProofHash(proofHash: string): ChallengeRecord[] {
    const challenges = this.readChallenges();
    return challenges.filter(c => c.proof_hash === proofHash);
  }

  getChallengesByDID(did: string): ChallengeRecord[] {
    const challenges = this.readChallenges();
    return challenges.filter(c => c.proof_did === did || c.challenger_did === did);
  }

  updateChallenge(challengeId: string, updates: Partial<ChallengeRecord>): void {
    const challenges = this.readChallenges();
    const index = challenges.findIndex(c => c.id === challengeId);
    if (index !== -1) {
      challenges[index] = { ...challenges[index], ...updates };
      this.writeChallenges(challenges);
    }
  }

  // Transparency log (for dispute outcomes)
  private readTransparencyLog(): any[] {
    if (!existsSync(this.transparencyLogFile)) {
      return [];
    }
    const data = readFileSync(this.transparencyLogFile, 'utf8');
    return JSON.parse(data);
  }

  private writeTransparencyLog(entries: any[]) {
    writeFileSync(this.transparencyLogFile, JSON.stringify(entries, null, 2));
  }

  appendTransparencyLog(entry: {
    type: 'challenge_submitted' | 'challenge_responded' | 'challenge_resolved';
    challenge_id: string;
    proof_hash: string;
    did?: string;
    resolution?: string;
    timestamp: string;
    details?: any;
  }): void {
    const log = this.readTransparencyLog();
    log.push(entry);
    // Keep only last 10000 entries
    if (log.length > 10000) {
      log.shift();
    }
    this.writeTransparencyLog(log);
  }

  getTransparencyLog(limit: number = 100): any[] {
    const log = this.readTransparencyLog();
    return log.slice(-limit).reverse(); // Most recent first
  }

  close() {
    // No-op for file-based storage
  }
}
