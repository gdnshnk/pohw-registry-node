/**
 * Registry Node - Type Definitions
 */

export interface AttestationRequest {
  hash: string;
  signature: string;
  did: string;
  timestamp: string;
  /** Process digest (optional, from Process Layer) */
  processDigest?: string;
  /** Compound hash (content + process, optional) */
  compoundHash?: string;
  /** Process metrics (optional, for verification) */
  processMetrics?: {
    duration: number;
    entropy: number;
    temporalCoherence: number;
    inputEvents: number;
    meetsThresholds: boolean;
  };
  /** ZK-SNARK proof (optional, for privacy-preserving verification) */
  zkProof?: {
    proof: {
      pi_a: [string, string];
      pi_b: [[string, string], [string, string]];
      pi_c: [string, string];
    };
    publicSignals: string[];
  };
  /** Assistance profile (human-only, AI-assisted, AI-generated) - for tier determination */
  assistanceProfile?: 'human-only' | 'AI-assisted' | 'AI-generated';
  /** Device identifier where work was authored */
  authoredOnDevice?: string;
  /** Environment attestation (browser, OS, etc.) */
  environmentAttestation?: string | string[];
  /** Source hashes for derived content (citations, quotes, etc.) - pav:derivedFrom 
   * Can be string/string[] for simple hashes, or array of objects for structured mappings */
  derivedFrom?: string | string[] | Array<{
    text: string;
    source: string;
    sourceType: 'pohw-hash' | 'url' | 'doi' | 'other';
    position: { start: number; end: number };
    otherType?: string; // For "other" source type
    contentAddress?: { // Optional content address (per whitepaper Section 7.3)
      type: 'ipfs' | 'arweave';
      value: string; // CID or transaction ID
      url: string; // Full URL for retrieval
    };
  }>;
  /** Content archive URI (IPFS/Arweave) - per whitepaper Section 7.3
   * Format: "ipfs://QmXxx..." or "ar://xxx..." or just CID/TX ID */
  claimURI?: string;
}

export interface AttestationReceipt {
  receipt_hash: string;
  merkle_root?: string;
  timestamp: string;
  registry: string;
  batch_id?: string;
}

export interface ProofRecord {
  id: number;
  hash: string;
  signature: string;
  did: string;
  timestamp: string;
  submitted_at: string;
  batch_id?: string;
  merkle_index?: number;
  anchored?: boolean;
  anchor_tx?: string;
  anchor_chain?: string;
  /** Process digest (from Process Layer) */
  process_digest?: string;
  /** Compound hash (content + process) */
  compound_hash?: string;
  /** Process metrics summary */
  process_metrics?: string; // JSON string
  /** ZK-SNARK proof (JSON string) */
  zk_proof?: string; // JSON string
  /** Proof tier (green, blue, purple, grey) - determined from credentials */
  tier?: string;
  /** Device identifier where work was authored */
  authored_on_device?: string;
  /** Environment attestation (JSON string) */
  environment_attestation?: string; // JSON string
  /** Source hashes for derived content (pav:derivedFrom) - JSON string array */
  derived_from?: string; // JSON string array
  /** Assistance profile (human-only, AI-assisted, AI-generated) */
  assistance_profile?: 'human-only' | 'AI-assisted' | 'AI-generated';
  /** Content archive URI (IPFS/Arweave) - per whitepaper Section 7.3 */
  claim_uri?: string; // Format: "ipfs://QmXxx..." or "ar://xxx..."
}

export interface MerkleBatch {
  id: string;
  root: string;
  size: number;
  created_at: string;
  anchored_at?: string;
  anchor_tx?: string;
  anchor_chain?: string;
}

export interface VerificationResult {
  valid: boolean;
  signer?: string;
  timestamp?: string;
  registry?: string;
  merkle_proof?: string[];
  merkle_root?: string;
  error?: string;
  // Batch transparency metadata
  batch_id?: string;
  batch_size?: number;
  merkle_index?: number;
  batch_status?: 'pending' | 'batched';
  pending_count?: number;
  // Full proof record (for structured derivedFrom access)
  proof?: ProofRecord;
}

export interface RegistryStatus {
  status: string;
  node: string;
  protocol: string;
  latest_hash?: string;
  timestamp?: string;
  total_proofs?: number;
  pending_batch?: number;
}

/**
 * Challenge types for dispute resolution (Section 8.5)
 */
export type ChallengeReason = 
  | 'suspected_ai_generated'
  | 'suspected_plagiarism'
  | 'suspected_fraud'
  | 'entropy_discrepancy'
  | 'rate_limit_anomaly'
  | 'signature_invalid'
  | 'process_metrics_inconsistent'
  | 'other';

export type ChallengeStatus = 
  | 'pending'      // Challenge submitted, awaiting author response
  | 'responded'   // Author has responded
  | 'resolved'     // Challenge resolved (exonerated or confirmed)
  | 'dismissed';  // Challenge dismissed without resolution

export type ChallengeResolution = 
  | 'exonerated'  // Author cleared, no fraud found
  | 'confirmed'    // Fraud confirmed
  | 'dismissed';  // Challenge dismissed

/**
 * Challenge record for dispute resolution
 */
export interface ChallengeRecord {
  id: string;
  proof_hash: string;
  proof_did: string;  // DID of proof author
  challenger_did: string;  // DID of person submitting challenge
  reason: ChallengeReason;
  description: string;
  evidence?: string;  // Optional evidence (JSON string)
  status: ChallengeStatus;
  resolution?: ChallengeResolution;
  created_at: string;
  responded_at?: string;
  resolved_at?: string;
  resolver_did?: string;  // DID of arbitrator (if resolved)
  author_response?: string;  // Author's response
  resolution_notes?: string;  // Arbitrator's notes
}

/**
 * Challenge submission request
 */
export interface ChallengeRequest {
  proof_hash: string;
  challenger_did: string;
  reason: ChallengeReason;
  description: string;
  evidence?: any;  // Optional evidence object
}

/**
 * Challenge response from author
 */
export interface ChallengeResponse {
  challenge_id: string;
  author_did: string;
  response: string;
  evidence?: any;  // Optional evidence (ZK proofs, process commitments, etc.)
}

/**
 * Challenge resolution request (from arbitrator)
 */
export interface ChallengeResolutionRequest {
  challenge_id: string;
  resolver_did: string;
  resolution: ChallengeResolution;
  notes: string;
}

export interface MerkleProof {
  proof: string[];
  root: string;
  anchors?: Array<{
    chain: string;
    tx: string;
    block?: number;
  }>;
}

