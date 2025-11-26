/**
 * PAV (Provenance, Authoring, and Versioning) Ontology Extension
 * PoHW Whitepaper Implementation
 * 
 * Implements:
 * - PAV metadata schema integration (JSON-LD)
 * - Core PAV fields (createdBy, derivedFrom, createdOn)
 * - Process Layer fields (processDigest, entropyProof, temporalCoherence)
 * - Environment fields (environmentAttestation, authoredOnDevice)
 * - JSON-LD claim objects
 * 
 * Based on PoHW Whitepaper Section 5.3
 */

/**
 * PAV Namespace
 */
export const PAV_NAMESPACE = 'https://purl.org/pav/';
export const POHW_NAMESPACE = 'https://pohw.org/ns/';

/**
 * PoHW Claim Object (JSON-LD)
 * Structured metadata document encoding intellectual lineage and cryptographic evidence
 */
export interface PoHWClaimObject {
  /** JSON-LD context */
  '@context': string | string[];
  
  /** Object type */
  type: string | string[];
  
  /** Content hash (primary identifier) */
  hash?: string;
  
  // Core PAV fields (semantic provenance)
  /** Creator DID */
  'pav:createdBy'?: string;
  
  /** Creation timestamp (ISO 8601) */
  'pav:createdOn'?: string;
  
  /** Source hash (for derived works) */
  'pav:derivedFrom'?: string | string[];
  
  // Environment fields
  /** Device identifier where work was authored */
  'pav:authoredOnDevice'?: string;
  
  /** Tool/OS environment attestation */
  'pav:environmentAttestation'?: string | string[];
  
  // Process Layer fields
  /** Process digest hash */
  'pav:processDigest'?: string;
  
  /** Entropy proof (zero-knowledge proof) */
  'pav:entropyProof'?: string;
  
  /** Temporal coherence proof */
  'pav:temporalCoherence'?: string;
  
  /** Full ZK-SNARK proof (optional) */
  'pav:zkProof'?: {
    proof: {
      pi_a: [string, string];
      pi_b: [[string, string], [string, string]];
      pi_c: [string, string];
    };
    publicSignals: string[];
  };
  
  // Cryptographic attestations
  /** Digital signature */
  'pav:signature'?: string;
  
  /** Merkle inclusion proof */
  'pav:merkleInclusion'?: string;
  
  /** Blockchain anchors */
  'pav:anchors'?: string[] | AnchorReference[];
  
  // Additional metadata
  /** Compound hash (content + process) */
  'pohw:compoundHash'?: string;
  
  /** Registry identifier */
  'pohw:registry'?: string;
  
  /** Proof tier (green, blue, purple, grey) */
  'pohw:tier'?: string;
  
  // Additional PAV fields (Appendix A.3)
  /** Assistance profile (human-only, AI-assisted, AI-generated) */
  'pav:assistanceProfile'?: 'human-only' | 'AI-assisted' | 'AI-generated';
  
  /** Verification tier (Green, Blue, Purple, Grey) */
  'pav:verificationTier'?: 'Green' | 'Blue' | 'Purple' | 'Grey';
  
  /** Revocation state (active, revoked, rotated) */
  'pav:revocationState'?: 'active' | 'revoked' | 'rotated';
  
  /** Registry anchor URI */
  'pav:registryAnchor'?: string;
  
  /** Compliance profile URI */
  'pav:complianceProfile'?: string;
  
  /** Additional custom fields */
  [key: string]: any;
}

/**
 * Anchor reference
 */
export interface AnchorReference {
  /** Chain identifier */
  chain: string;
  
  /** Transaction hash */
  tx: string;
  
  /** Block number (optional) */
  block?: number;
  
  /** Timestamp (optional) */
  timestamp?: string;
}

/**
 * PAV Claim Builder
 * Constructs PoHW Claim Objects with proper JSON-LD structure
 */
export class PAVClaimBuilder {
  private claim: Partial<PoHWClaimObject>;

  constructor() {
    this.claim = {
      '@context': [
        PAV_NAMESPACE,
        POHW_NAMESPACE
      ],
      type: 'PoHWClaim'
    };
  }

  /**
   * Set content hash
   */
  setHash(hash: string): this {
    this.claim.hash = hash;
    return this;
  }

  /**
   * Set creator DID (pav:createdBy)
   */
  setCreatedBy(did: string): this {
    this.claim['pav:createdBy'] = did;
    return this;
  }

  /**
   * Set creation timestamp (pav:createdOn)
   */
  setCreatedOn(timestamp: string): this {
    this.claim['pav:createdOn'] = timestamp;
    return this;
  }

  /**
   * Set derived from hash(es) (pav:derivedFrom)
   */
  setDerivedFrom(sourceHash: string | string[]): this {
    this.claim['pav:derivedFrom'] = sourceHash;
    return this;
  }

  /**
   * Set device identifier (pav:authoredOnDevice)
   */
  setAuthoredOnDevice(deviceId: string): this {
    this.claim['pav:authoredOnDevice'] = deviceId;
    return this;
  }

  /**
   * Set environment attestation (pav:environmentAttestation)
   */
  setEnvironmentAttestation(attestation: string | string[]): this {
    this.claim['pav:environmentAttestation'] = attestation;
    return this;
  }

  /**
   * Set process digest (pav:processDigest)
   */
  setProcessDigest(digest: string): this {
    this.claim['pav:processDigest'] = digest;
    return this;
  }

  /**
   * Set entropy proof (pav:entropyProof)
   */
  setEntropyProof(proof: string): this {
    this.claim['pav:entropyProof'] = proof;
    return this;
  }

  /**
   * Set temporal coherence proof (pav:temporalCoherence)
   */
  setTemporalCoherence(proof: string): this {
    this.claim['pav:temporalCoherence'] = proof;
    return this;
  }

  /**
   * Set digital signature (pav:signature)
   */
  setSignature(signature: string): this {
    this.claim['pav:signature'] = signature;
    return this;
  }

  /**
   * Set Merkle inclusion proof (pav:merkleInclusion)
   */
  setMerkleInclusion(proof: string): this {
    this.claim['pav:merkleInclusion'] = proof;
    return this;
  }

  /**
   * Set blockchain anchors (pav:anchors)
   */
  setAnchors(anchors: string[] | AnchorReference[]): this {
    this.claim['pav:anchors'] = anchors;
    return this;
  }

  /**
   * Set compound hash
   */
  setCompoundHash(hash: string): this {
    this.claim['pohw:compoundHash'] = hash;
    return this;
  }

  /**
   * Set registry identifier
   */
  setRegistry(registry: string): this {
    this.claim['pohw:registry'] = registry;
    return this;
  }

  /**
   * Set proof tier
   */
  setTier(tier: string): this {
    this.claim['pohw:tier'] = tier;
    return this;
  }

  /**
   * Set assistance profile (pav:assistanceProfile)
   */
  setAssistanceProfile(profile: 'human-only' | 'AI-assisted' | 'AI-generated'): this {
    this.claim['pav:assistanceProfile'] = profile;
    return this;
  }

  /**
   * Set verification tier (pav:verificationTier)
   */
  setVerificationTier(tier: 'Green' | 'Blue' | 'Purple' | 'Grey'): this {
    this.claim['pav:verificationTier'] = tier;
    return this;
  }

  /**
   * Set revocation state (pav:revocationState)
   */
  setRevocationState(state: 'active' | 'revoked' | 'rotated'): this {
    this.claim['pav:revocationState'] = state;
    return this;
  }

  /**
   * Set registry anchor (pav:registryAnchor)
   */
  setRegistryAnchor(anchor: string): this {
    this.claim['pav:registryAnchor'] = anchor;
    return this;
  }

  /**
   * Set compliance profile (pav:complianceProfile)
   */
  setComplianceProfile(profile: string): this {
    this.claim['pav:complianceProfile'] = profile;
    return this;
  }

  /**
   * Set custom field
   */
  setCustomField(key: string, value: any): this {
    this.claim[key] = value;
    return this;
  }

  /**
   * Build the claim object
   */
  build(): PoHWClaimObject {
    // Validate required fields
    if (!this.claim.hash && !this.claim['pav:createdBy']) {
      throw new Error('Claim must have either hash or pav:createdBy');
    }

    return this.claim as PoHWClaimObject;
  }

  /**
   * Build and return as JSON string
   */
  buildJSON(): string {
    return JSON.stringify(this.build(), null, 2);
  }
}

/**
 * PAV Claim Validator
 * Validates PoHW Claim Objects
 */
export class PAVClaimValidator {
  /**
   * Validate claim object structure
   */
  static validate(claim: PoHWClaimObject): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check @context
    if (!claim['@context']) {
      errors.push('Missing @context');
    } else {
      const contexts = Array.isArray(claim['@context']) ? claim['@context'] : [claim['@context']];
      if (!contexts.includes(PAV_NAMESPACE)) {
        errors.push(`@context must include ${PAV_NAMESPACE}`);
      }
    }

    // Check type
    if (!claim.type) {
      errors.push('Missing type');
    } else {
      const types = Array.isArray(claim.type) ? claim.type : [claim.type];
      if (!types.includes('PoHWClaim')) {
        errors.push('type must include PoHWClaim');
      }
    }

    // Validate DID format (if present)
    if (claim['pav:createdBy'] && !claim['pav:createdBy'].startsWith('did:')) {
      errors.push('pav:createdBy must be a valid DID');
    }

    // Validate timestamp format (if present)
    if (claim['pav:createdOn']) {
      const date = new Date(claim['pav:createdOn']);
      if (isNaN(date.getTime())) {
        errors.push('pav:createdOn must be a valid ISO 8601 timestamp');
      }
    }

    // Validate hash format (if present)
    if (claim.hash && !claim.hash.match(/^(0x)?[a-f0-9]{64}$/i)) {
      errors.push('hash must be a valid hex string (64 characters)');
    }

    // Validate process digest format (if present)
    if (claim['pav:processDigest'] && !claim['pav:processDigest'].match(/^(0x)?[a-f0-9]{64}$/i)) {
      errors.push('pav:processDigest must be a valid hex string (64 characters)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate claim completeness (all recommended fields present)
   */
  static validateCompleteness(claim: PoHWClaimObject): { complete: boolean; missing: string[] } {
    const recommended = [
      'hash',
      'pav:createdBy',
      'pav:createdOn',
      'pav:signature'
    ];

    const missing: string[] = [];
    for (const field of recommended) {
      if (!claim[field]) {
        missing.push(field);
      }
    }

    return {
      complete: missing.length === 0,
      missing
    };
  }
}

/**
 * PAV Claim Parser
 * Parses and normalizes PAV claim objects
 */
export class PAVClaimParser {
  /**
   * Parse JSON string to claim object
   */
  static parse(json: string): PoHWClaimObject {
    try {
      const claim = JSON.parse(json);
      return claim as PoHWClaimObject;
    } catch (error) {
      throw new Error(`Invalid JSON: ${error}`);
    }
  }

  /**
   * Normalize claim object (expand @context, validate structure)
   */
  static normalize(claim: PoHWClaimObject): PoHWClaimObject {
    // Ensure @context is array
    if (typeof claim['@context'] === 'string') {
      claim['@context'] = [claim['@context']];
    }

    // Ensure type is array
    if (typeof claim.type === 'string') {
      claim.type = [claim.type];
    }

    // Ensure pav:derivedFrom is array if present
    if (claim['pav:derivedFrom'] && typeof claim['pav:derivedFrom'] === 'string') {
      claim['pav:derivedFrom'] = [claim['pav:derivedFrom']];
    }

    // Ensure pav:environmentAttestation is array if present
    if (claim['pav:environmentAttestation'] && typeof claim['pav:environmentAttestation'] === 'string') {
      claim['pav:environmentAttestation'] = [claim['pav:environmentAttestation']];
    }

    return claim;
  }

  /**
   * Extract core provenance fields
   */
  static extractProvenance(claim: PoHWClaimObject): {
    createdBy?: string;
    createdOn?: string;
    derivedFrom?: string[];
  } {
    return {
      createdBy: claim['pav:createdBy'],
      createdOn: claim['pav:createdOn'],
      derivedFrom: Array.isArray(claim['pav:derivedFrom'])
        ? claim['pav:derivedFrom']
        : claim['pav:derivedFrom'] ? [claim['pav:derivedFrom']] : undefined
    };
  }

  /**
   * Extract process layer fields
   */
  static extractProcessLayer(claim: PoHWClaimObject): {
    processDigest?: string;
    entropyProof?: string;
    temporalCoherence?: string;
  } {
    return {
      processDigest: claim['pav:processDigest'],
      entropyProof: claim['pav:entropyProof'],
      temporalCoherence: claim['pav:temporalCoherence']
    };
  }

  /**
   * Extract environment fields
   */
  static extractEnvironment(claim: PoHWClaimObject): {
    authoredOnDevice?: string;
    environmentAttestation?: string[];
  } {
    return {
      authoredOnDevice: claim['pav:authoredOnDevice'],
      environmentAttestation: Array.isArray(claim['pav:environmentAttestation'])
        ? claim['pav:environmentAttestation']
        : claim['pav:environmentAttestation'] ? [claim['pav:environmentAttestation']] : undefined
    };
  }

  /**
   * Extract cryptographic attestations
   */
  static extractAttestations(claim: PoHWClaimObject): {
    signature?: string;
    merkleInclusion?: string;
    anchors?: AnchorReference[];
  } {
    let anchors: AnchorReference[] | undefined;
    
    if (claim['pav:anchors']) {
      if (Array.isArray(claim['pav:anchors'])) {
        anchors = claim['pav:anchors'].map(anchor => {
          if (typeof anchor === 'string') {
            // Parse string format: "chain:tx" or "chain:tx:block"
            const parts = anchor.split(':');
            return {
              chain: parts[0],
              tx: parts[1],
              block: parts[2] ? parseInt(parts[2]) : undefined
            };
          } else {
            return anchor;
          }
        });
      }
    }

    return {
      signature: claim['pav:signature'],
      merkleInclusion: claim['pav:merkleInclusion'],
      anchors
    };
  }
}

/**
 * Create a PoHW Claim Object from proof record
 */
export function createPAVClaimFromProof(
  hash: string,
  did: string,
  timestamp: string,
  signature: string,
  processDigest?: string,
  compoundHash?: string,
  derivedFrom?: string | string[],
  deviceId?: string,
  environmentAttestation?: string | string[],
  entropyProof?: string,
  temporalCoherence?: string,
  merkleInclusion?: string,
  anchors?: string[] | AnchorReference[]
): PoHWClaimObject {
  const builder = new PAVClaimBuilder();
  
  builder
    .setHash(hash)
    .setCreatedBy(did)
    .setCreatedOn(timestamp)
    .setSignature(signature);

  if (processDigest) {
    builder.setProcessDigest(processDigest);
  }

  if (compoundHash) {
    builder.setCompoundHash(compoundHash);
  }

  if (derivedFrom) {
    builder.setDerivedFrom(derivedFrom);
  }

  if (deviceId) {
    builder.setAuthoredOnDevice(deviceId);
  }

  if (environmentAttestation) {
    builder.setEnvironmentAttestation(environmentAttestation);
  }

  if (entropyProof) {
    builder.setEntropyProof(entropyProof);
  }

  if (temporalCoherence) {
    builder.setTemporalCoherence(temporalCoherence);
  }

  if (merkleInclusion) {
    builder.setMerkleInclusion(merkleInclusion);
  }

  if (anchors) {
    builder.setAnchors(anchors);
  }

  return builder.build();
}

