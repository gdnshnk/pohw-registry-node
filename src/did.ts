/**
 * Decentralized Identifiers (DIDs) - PoHW Whitepaper Implementation
 * 
 * Implements W3C DID specification for PoHW:
 * - DID generation and management
 * - DID document storage/resolution
 * - DID-based identity binding
 * - DID rotation and continuity claims (Key Continuity Graph)
 * 
 * Based on PoHW Whitepaper Section 6.1 and 8.3
 */

import { createHash, randomBytes } from 'crypto';
import { createSign, createVerify } from 'crypto';

/**
 * DID format: did:pohw:{method-specific-id}
 * Example: did:pohw:abc123def456...
 */
export interface DID {
  /** Full DID string (e.g., "did:pohw:abc123...") */
  did: string;
  
  /** Method-specific identifier (part after "did:pohw:") */
  methodSpecificId: string;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Current status: active, rotated, revoked */
  status: 'active' | 'rotated' | 'revoked';
}

/**
 * DID Document (W3C DID Core specification)
 * Contains public keys, service endpoints, and verification methods
 */
export interface DIDDocument {
  /** DID context */
  '@context': string[];
  
  /** The DID this document describes */
  id: string;
  
  /** Public keys for verification */
  verificationMethod: VerificationMethod[];
  
  /** Authentication methods */
  authentication: string[];
  
  /** Service endpoints */
  service?: ServiceEndpoint[];
  
  /** Key agreement methods */
  keyAgreement?: string[];
  
  /** Created timestamp */
  created: string;
  
  /** Updated timestamp */
  updated?: string;
  
  /** Previous DID (for rotation) */
  previousDID?: string;
  
  /** Continuity claim (for rotation) */
  continuityClaim?: ContinuityClaim;
}

/**
 * Verification Method (public key)
 */
export interface VerificationMethod {
  /** Verification method ID */
  id: string;
  
  /** Type (e.g., "Ed25519VerificationKey2020") */
  type: string;
  
  /** Controller (the DID) */
  controller: string;
  
  /** Public key (multibase encoded) */
  publicKeyMultibase: string;
  
  /** Public key in hex format */
  publicKeyHex?: string;
}

/**
 * Service Endpoint
 */
export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string;
}

/**
 * Continuity Claim (for DID rotation)
 * Links new DID to previous DID cryptographically
 */
export interface ContinuityClaim {
  /** Previous DID */
  previousDID: string;
  
  /** Hash of previous key's public certificate */
  parentReference: string;
  
  /** Last valid registry anchor for previous DID */
  lastAnchor?: string;
  
  /** Succession signature (signed by both old and new keys) */
  successionSignature: string;
  
  /** Registry timestamp */
  registryTimestamp: string;
  
  /** Signature by old key */
  oldKeySignature: string;
  
  /** Signature by new key */
  newKeySignature: string;
}

/**
 * Key Continuity Graph Node
 * Represents a node in the DID rotation chain
 */
export interface KCGNode {
  /** Current DID */
  did: string;
  
  /** Public key fingerprint */
  keyFingerprint: string;
  
  /** Previous node (if rotated) */
  previousNode?: string;
  
  /** Continuity claim (if rotated) */
  continuityClaim?: ContinuityClaim;
  
  /** Created timestamp */
  createdAt: string;
  
  /** Status */
  status: 'active' | 'rotated' | 'revoked';
}

/**
 * DID Manager
 * Handles DID generation, document management, and rotation
 */
export class DIDManager {
  private documents: Map<string, DIDDocument> = new Map();
  private continuityGraph: Map<string, KCGNode> = new Map();
  private registryUrl?: string;

  constructor(registryUrl?: string) {
    this.registryUrl = registryUrl;
  }

  /**
   * Generate a new DID from a public key
   * Format: did:pohw:{base58-encoded-public-key-hash}
   */
  static generateDID(publicKey: Buffer | Uint8Array): DID {
    // Create hash of public key for method-specific ID
    const keyHash = createHash('sha256')
      .update(Buffer.from(publicKey))
      .digest('hex');
    
    // Use first 32 characters for readability (can be full hash)
    const methodSpecificId = keyHash.substring(0, 32);
    const did = `did:pohw:${methodSpecificId}`;

    return {
      did,
      methodSpecificId,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
  }

  /**
   * Create DID Document from public key
   */
  static createDIDDocument(
    did: DID,
    publicKey: Buffer | Uint8Array,
    keyType: string = 'Ed25519VerificationKey2020'
  ): DIDDocument {
    const publicKeyHex = Buffer.from(publicKey).toString('hex');
    const publicKeyMultibase = `z${publicKeyHex}`; // Multibase encoding (z = base58btc, simplified as hex)

    const verificationMethod: VerificationMethod = {
      id: `${did.did}#keys-1`,
      type: keyType,
      controller: did.did,
      publicKeyMultibase,
      publicKeyHex
    };

    return {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1'
      ],
      id: did.did,
      verificationMethod: [verificationMethod],
      authentication: [`${did.did}#keys-1`],
      created: did.createdAt
    };
  }

  /**
   * Store DID document
   */
  storeDIDDocument(document: DIDDocument): void {
    this.documents.set(document.id, document);
    
    // Create KCG node
    const verificationMethod = document.verificationMethod[0];
    const keyFingerprint = createHash('sha256')
      .update(verificationMethod.publicKeyHex || verificationMethod.publicKeyMultibase)
      .digest('hex');

    const node: KCGNode = {
      did: document.id,
      keyFingerprint,
      previousNode: document.previousDID,
      continuityClaim: document.continuityClaim,
      createdAt: document.created,
      status: 'active'
    };

    this.continuityGraph.set(document.id, node);
  }

  /**
   * Resolve DID to DID Document
   */
  resolveDID(did: string): DIDDocument | null {
    return this.documents.get(did) || null;
  }

  /**
   * Rotate DID (create new DID with continuity claim)
   */
  rotateDID(
    oldDID: string,
    oldPrivateKey: Buffer,
    newPublicKey: Buffer,
    lastAnchor?: string
  ): { newDID: DID; document: DIDDocument; continuityClaim: ContinuityClaim } {
    // Get old DID document
    const oldDocument = this.resolveDID(oldDID);
    if (!oldDocument) {
      throw new Error(`Old DID not found: ${oldDID}`);
    }

    // Generate new DID
    const newDID = DIDManager.generateDID(newPublicKey);
    
    // Create parent reference (hash of old key's public certificate)
    const oldVerificationMethod = oldDocument.verificationMethod[0];
    const parentReference = createHash('sha256')
      .update(JSON.stringify(oldVerificationMethod))
      .digest('hex');

    // Create continuity claim data
    const continuityData = {
      previousDID: oldDID,
      parentReference,
      lastAnchor,
      newDID: newDID.did,
      timestamp: new Date().toISOString()
    };

    // Sign with old key (simplified: hash-based signature for testing)
    // In production, use proper Ed25519 signing
    const continuityDataString = JSON.stringify(continuityData);
    const oldKeySignature = createHash('sha256')
      .update(continuityDataString)
      .update(oldPrivateKey)
      .digest('hex');

    // Sign with new key (placeholder - will be signed by new key holder in production)
    // For now, we create a commitment that can be completed later
    const newKeySignature = createHash('sha256')
      .update(continuityDataString)
      .update(newPublicKey)
      .digest('hex');

    const successionSignature = createHash('sha256')
      .update(`${oldKeySignature}:${newKeySignature}`)
      .digest('hex');

    const continuityClaim: ContinuityClaim = {
      previousDID: oldDID,
      parentReference,
      lastAnchor,
      successionSignature,
      registryTimestamp: new Date().toISOString(),
      oldKeySignature,
      newKeySignature
    };

    // Create new DID document with continuity claim
    const newDocument = DIDManager.createDIDDocument(newDID, newPublicKey);
    newDocument.previousDID = oldDID;
    newDocument.continuityClaim = continuityClaim;
    newDocument.updated = new Date().toISOString();

    // Update old DID status
    const oldNode = this.continuityGraph.get(oldDID);
    if (oldNode) {
      oldNode.status = 'rotated';
    }

    // Store new document
    this.storeDIDDocument(newDocument);

    return {
      newDID,
      document: newDocument,
      continuityClaim
    };
  }

  /**
   * Verify continuity claim
   */
  verifyContinuityClaim(claim: ContinuityClaim, oldPublicKey: Buffer, newPublicKey: Buffer, newDID?: string): boolean {
    try {
      // Get new DID if not provided (derive from new public key)
      const derivedNewDID = newDID || DIDManager.generateDID(newPublicKey).did;
      
      // Reconstruct continuity data (must match exactly what was signed)
      const continuityData = {
        previousDID: claim.previousDID,
        parentReference: claim.parentReference,
        lastAnchor: claim.lastAnchor,
        newDID: derivedNewDID,
        timestamp: claim.registryTimestamp
      };

      const continuityDataString = JSON.stringify(continuityData);

      // Verify old key signature (simplified: hash-based verification)
      // In production, use proper Ed25519 verification
      const expectedOldSignature = createHash('sha256')
        .update(continuityDataString)
        .update(oldPublicKey)
        .digest('hex');
      const oldValid = expectedOldSignature === claim.oldKeySignature;

      // Verify new key signature
      const expectedNewSignature = createHash('sha256')
        .update(continuityDataString)
        .update(newPublicKey)
        .digest('hex');
      const newValid = expectedNewSignature === claim.newKeySignature;

      // Verify succession signature
      const expectedSuccession = createHash('sha256')
        .update(`${claim.oldKeySignature}:${claim.newKeySignature}`)
        .digest('hex');
      const successionValid = expectedSuccession === claim.successionSignature;

      return oldValid && newValid && successionValid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get Key Continuity Graph for a DID
   * Returns the full chain of DID rotations
   */
  getContinuityGraph(did: string): KCGNode[] {
    const chain: KCGNode[] = [];
    let currentDID: string | undefined = did;

    // Traverse backwards through the chain
    while (currentDID) {
      const node = this.continuityGraph.get(currentDID);
      if (!node) break;

      chain.unshift(node); // Add to beginning
      currentDID = node.previousNode;
    }

    return chain;
  }

  /**
   * Revoke DID
   */
  revokeDID(did: string, reason?: string): void {
    const node = this.continuityGraph.get(did);
    if (node) {
      node.status = 'revoked';
    }

    const document = this.documents.get(did);
    if (document) {
      document.updated = new Date().toISOString();
      // Add revocation metadata
      (document as any).revoked = true;
      (document as any).revocationReason = reason;
    }
  }

  /**
   * Check if DID is valid (not revoked)
   */
  isDIDValid(did: string): boolean {
    const node = this.continuityGraph.get(did);
    if (!node) return false;
    return node.status === 'active' || node.status === 'rotated';
  }

  /**
   * Get all DIDs (for registry storage)
   */
  getAllDIDs(): DIDDocument[] {
    return Array.from(this.documents.values());
  }

  /**
   * Export DID document as JSON
   */
  exportDIDDocument(did: string): string | null {
    const document = this.resolveDID(did);
    return document ? JSON.stringify(document, null, 2) : null;
  }

  /**
   * Import DID document from JSON
   */
  importDIDDocument(json: string): DIDDocument {
    const document = JSON.parse(json) as DIDDocument;
    this.storeDIDDocument(document);
    return document;
  }
}

/**
 * Generate a new DID from a keypair
 */
export function generateDIDFromKeypair(
  publicKey: Buffer | Uint8Array
): { did: DID; document: DIDDocument } {
  const did = DIDManager.generateDID(publicKey);
  const document = DIDManager.createDIDDocument(did, publicKey);
  return { did, document };
}

/**
 * Parse DID string into components
 */
export function parseDID(didString: string): { method: string; methodSpecificId: string } | null {
  const match = didString.match(/^did:([^:]+):(.+)$/);
  if (!match) return null;

  return {
    method: match[1],
    methodSpecificId: match[2]
  };
}

/**
 * Validate DID format
 */
export function isValidDID(didString: string): boolean {
  return /^did:pohw:[a-f0-9]{32,}$/.test(didString);
}

