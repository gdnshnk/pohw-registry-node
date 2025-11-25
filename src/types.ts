/**
 * Registry Node - Type Definitions
 */

export interface AttestationRequest {
  hash: string;
  signature: string;
  did: string;
  timestamp: string;
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

