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

export interface MerkleProof {
  proof: string[];
  root: string;
  anchors?: Array<{
    chain: string;
    tx: string;
    block?: number;
  }>;
}

