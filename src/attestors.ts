/**
 * Attestors Framework - PoHW Whitepaper Implementation
 * 
 * Implements:
 * - Attestor accreditation system
 * - Attestor registry/transparency logs
 * - Human verification credential issuance
 * - Attestor revocation lists
 * - Multi-attestor policies
 * 
 * Based on PoHW Whitepaper Section 6.2
 */

import { createHash, randomBytes } from 'crypto';

/**
 * Attestor types (domains of legitimacy)
 */
export type AttestorType = 
  | 'academic'      // Universities, research institutions
  | 'professional'   // Professional guilds, certification bodies
  | 'media'         // Media organizations, publishers
  | 'civic'         // Civic bodies, government agencies
  | 'commercial'    // Identity verification services, KYC providers
  | 'community';    // Community validation networks

/**
 * Attestor status
 */
export type AttestorStatus = 
  | 'pending'       // Application submitted, awaiting review
  | 'active'        // Accredited and active
  | 'suspended'     // Temporarily suspended
  | 'revoked';      // Accreditation revoked

/**
 * Attestor accreditation record
 */
export interface AttestorRecord {
  /** Attestor DID */
  did: string;
  
  /** Attestor name */
  name: string;
  
  /** Attestor type/domain */
  type: AttestorType;
  
  /** Public key (for signing credentials) */
  publicKey: string;
  
  /** Public key URL (/.well-known/public.txt) */
  publicKeyUrl?: string;
  
  /** Status */
  status: AttestorStatus;
  
  /** Registration timestamp */
  registeredAt: string;
  
  /** Last audit timestamp */
  lastAudit?: string;
  
  /** Next audit due date */
  nextAuditDue?: string;
  
  /** Accreditation metadata */
  metadata?: {
    domain?: string;
    contact?: string;
    policies?: string;
    procedures?: string;
  };
}

/**
 * Verifiable Human Credential (VHC)
 * W3C Verifiable Credentials format
 */
export interface VerifiableHumanCredential {
  /** W3C VC context */
  '@context': string[];
  
  /** Credential type */
  type: string[];
  
  /** Issuer DID */
  issuer: string;
  
  /** Issuance date */
  issuanceDate: string;
  
  /** Expiration date (optional) */
  expirationDate?: string;
  
  /** Credential subject (the human being verified) */
  credentialSubject: {
    /** Subject DID */
    id: string;
    
    /** Human verification status */
    humanVerified: boolean;
    
    /** Verification method */
    verificationMethod: 'in-person' | 'remote' | 'automated' | 'hardware';
    
    /** Assurance level */
    assuranceLevel: 'green' | 'blue' | 'purple' | 'grey';
    
    /** Policy under which verified */
    policy?: string;
  };
  
  /** Cryptographic proof */
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
  };
  
  /** Credential hash (for revocation) */
  credentialHash?: string;
}

/**
 * Credential revocation record
 */
export interface RevocationRecord {
  /** Credential hash */
  credentialHash: string;
  
  /** Revoked timestamp */
  revokedAt: string;
  
  /** Revocation reason */
  reason: 'compromised' | 'expired' | 'fraud' | 'user_request' | 'attestor_policy';
  
  /** Attestor signature */
  attestorSignature: string;
  
  /** Attestor DID */
  attestorDID: string;
  
  /** Additional metadata */
  metadata?: {
    details?: string;
    evidence?: string;
  };
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  /** Timestamp */
  timestamp: string;
  
  /** Action type */
  action: 
    | 'credential_issued'
    | 'credential_revoked'
    | 'key_rotated'
    | 'anomaly_detected'
    | 'audit_completed'
    | 'status_changed';
  
  /** Credential hash (if applicable) */
  credentialHash?: string;
  
  /** Attestor DID */
  attestorDID: string;
  
  /** Details */
  details?: string;
  
  /** Signature */
  signature?: string;
}

/**
 * Multi-attestor policy configuration
 */
export interface MultiAttestorPolicy {
  /** Minimum number of attestations required */
  minAttestations: number;
  
  /** Required attestor types (at least one from each) */
  requiredTypes?: AttestorType[];
  
  /** Minimum assurance level */
  minAssuranceLevel: 'green' | 'blue' | 'purple' | 'grey';
  
  /** Policy name */
  policyName: string;
  
  /** Policy description */
  description?: string;
}

/**
 * Attestor Manager
 * Manages attestor accreditation, credentials, and revocation
 */
export class AttestorManager {
  private attestors: Map<string, AttestorRecord> = new Map();
  private credentials: Map<string, VerifiableHumanCredential> = new Map();
  private revocations: Map<string, RevocationRecord> = new Map();
  private auditLogs: AuditLogEntry[] = [];
  private policies: Map<string, MultiAttestorPolicy> = new Map();

  constructor() {
    // Initialize default policies
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default multi-attestor policies
   */
  private initializeDefaultPolicies(): void {
    // Green-tier policy: 2+ independent attestations
    this.policies.set('green', {
      minAttestations: 2,
      requiredTypes: ['academic', 'professional', 'media', 'civic'],
      minAssuranceLevel: 'green',
      policyName: 'Green Tier - Proven Human Work',
      description: 'Requires at least 2 independent attestations from accredited institutions'
    });

    // Blue-tier policy: 1+ attestation
    this.policies.set('blue', {
      minAttestations: 1,
      minAssuranceLevel: 'blue',
      policyName: 'Blue Tier - Verified Human Work',
      description: 'Requires at least 1 attestation from an accredited attestor'
    });
  }

  /**
   * Register/accredit a new attestor
   */
  registerAttestor(
    did: string,
    name: string,
    type: AttestorType,
    publicKey: string,
    publicKeyUrl?: string,
    metadata?: AttestorRecord['metadata']
  ): AttestorRecord {
    // Check if already registered
    if (this.attestors.has(did)) {
      throw new Error(`Attestor already registered: ${did}`);
    }

    const record: AttestorRecord = {
      did,
      name,
      type,
      publicKey,
      publicKeyUrl,
      status: 'pending', // Requires Foundation approval
      registeredAt: new Date().toISOString(),
      metadata
    };

    this.attestors.set(did, record);

    // Log registration
    this.addAuditLog({
      action: 'status_changed',
      attestorDID: did,
      details: `Attestor registered: ${name} (${type})`
    });

    return record;
  }

  /**
   * Approve/accredit an attestor (Foundation action)
   */
  approveAttestor(did: string, nextAuditDue?: string): AttestorRecord {
    const attestor = this.attestors.get(did);
    if (!attestor) {
      throw new Error(`Attestor not found: ${did}`);
    }

    attestor.status = 'active';
    attestor.lastAudit = new Date().toISOString();
    if (nextAuditDue) {
      attestor.nextAuditDue = nextAuditDue;
    }

    this.attestors.set(did, attestor);

    // Log approval
    this.addAuditLog({
      action: 'status_changed',
      attestorDID: did,
      details: `Attestor approved: ${attestor.name}`
    });

    return attestor;
  }

  /**
   * Suspend an attestor
   */
  suspendAttestor(did: string, reason?: string): AttestorRecord {
    const attestor = this.attestors.get(did);
    if (!attestor) {
      throw new Error(`Attestor not found: ${did}`);
    }

    attestor.status = 'suspended';
    this.attestors.set(did, attestor);

    this.addAuditLog({
      action: 'status_changed',
      attestorDID: did,
      details: `Attestor suspended: ${reason || 'Policy violation'}`
    });

    return attestor;
  }

  /**
   * Revoke attestor accreditation
   */
  revokeAttestor(did: string, reason?: string): AttestorRecord {
    const attestor = this.attestors.get(did);
    if (!attestor) {
      throw new Error(`Attestor not found: ${did}`);
    }

    attestor.status = 'revoked';
    this.attestors.set(did, attestor);

    this.addAuditLog({
      action: 'status_changed',
      attestorDID: did,
      details: `Attestor revoked: ${reason || 'Accreditation withdrawn'}`
    });

    return attestor;
  }

  /**
   * Get attestor record
   */
  getAttestor(did: string): AttestorRecord | null {
    return this.attestors.get(did) || null;
  }

  /**
   * Get all active attestors
   */
  getActiveAttestors(): AttestorRecord[] {
    return Array.from(this.attestors.values())
      .filter(a => a.status === 'active');
  }

  /**
   * Get attestors by type
   */
  getAttestorsByType(type: AttestorType): AttestorRecord[] {
    return Array.from(this.attestors.values())
      .filter(a => a.type === type && a.status === 'active');
  }

  /**
   * Issue a Verifiable Human Credential (VHC)
   */
  issueCredential(
    attestorDID: string,
    subjectDID: string,
    verificationMethod: VerifiableHumanCredential['credentialSubject']['verificationMethod'],
    assuranceLevel: VerifiableHumanCredential['credentialSubject']['assuranceLevel'],
    policy?: string,
    expirationDate?: string
  ): VerifiableHumanCredential {
    // Verify attestor is active
    const attestor = this.getAttestor(attestorDID);
    if (!attestor) {
      throw new Error(`Attestor not found: ${attestorDID}`);
    }
    if (attestor.status !== 'active') {
      throw new Error(`Attestor not active: ${attestorDID} (status: ${attestor.status})`);
    }

    // Create credential
    const credential: VerifiableHumanCredential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1'
      ],
      type: ['VerifiableCredential', 'HumanCredential'],
      issuer: attestorDID,
      issuanceDate: new Date().toISOString(),
      expirationDate,
      credentialSubject: {
        id: subjectDID,
        humanVerified: true,
        verificationMethod,
        assuranceLevel,
        policy
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        verificationMethod: `${attestorDID}#key-1`,
        proofPurpose: 'assertionMethod',
        proofValue: '' // Will be signed by attestor
      }
    };

    // Generate credential hash
    const credentialHash = this.hashCredential(credential);
    credential.credentialHash = credentialHash;

    // Store credential
    this.credentials.set(credentialHash, credential);

    // Log issuance
    this.addAuditLog({
      action: 'credential_issued',
      credentialHash,
      attestorDID,
      details: `Credential issued to ${subjectDID} (${assuranceLevel})`
    });

    return credential;
  }

  /**
   * Revoke a credential
   */
  revokeCredential(
    credentialHash: string,
    attestorDID: string,
    reason: RevocationRecord['reason'],
    metadata?: RevocationRecord['metadata']
  ): RevocationRecord {
    // Verify credential exists
    const credential = this.credentials.get(credentialHash);
    if (!credential) {
      throw new Error(`Credential not found: ${credentialHash}`);
    }

    // Verify attestor matches
    if (credential.issuer !== attestorDID) {
      throw new Error(`Attestor mismatch: credential issued by ${credential.issuer}`);
    }

    // Create revocation record
    const revocation: RevocationRecord = {
      credentialHash,
      revokedAt: new Date().toISOString(),
      reason,
      attestorSignature: '', // Will be signed by attestor
      attestorDID,
      metadata
    };

    // Store revocation
    this.revocations.set(credentialHash, revocation);

    // Log revocation
    this.addAuditLog({
      action: 'credential_revoked',
      credentialHash,
      attestorDID,
      details: `Credential revoked: ${reason}`
    });

    return revocation;
  }

  /**
   * Check if credential is valid (not revoked)
   */
  isCredentialValid(credentialHash: string): boolean {
    // Check if credential exists
    if (!this.credentials.has(credentialHash)) {
      return false;
    }

    // Check if revoked
    if (this.revocations.has(credentialHash)) {
      return false;
    }

    // Check expiration
    const credential = this.credentials.get(credentialHash);
    if (credential?.expirationDate) {
      const expiration = new Date(credential.expirationDate);
      if (expiration < new Date()) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get credential
   */
  getCredential(credentialHash: string): VerifiableHumanCredential | null {
    return this.credentials.get(credentialHash) || null;
  }

  /**
   * Get all valid credentials for a subject DID
   */
  getCredentialsForDID(subjectDID: string): VerifiableHumanCredential[] {
    const validCredentials: VerifiableHumanCredential[] = [];
    
    for (const [hash, credential] of this.credentials.entries()) {
      // Check if credential is for this subject
      if (credential.credentialSubject.id === subjectDID) {
        // Check if credential is valid (not revoked, not expired)
        if (this.isCredentialValid(hash)) {
          validCredentials.push(credential);
        }
      }
    }
    
    return validCredentials;
  }

  /**
   * Get credential hashes for a subject DID
   */
  getCredentialHashesForDID(subjectDID: string): string[] {
    const hashes: string[] = [];
    
    for (const [hash, credential] of this.credentials.entries()) {
      if (credential.credentialSubject.id === subjectDID && this.isCredentialValid(hash)) {
        hashes.push(hash);
      }
    }
    
    return hashes;
  }

  /**
   * Determine proof tier based on credentials (following whitepaper Section 3.3)
   * 
   * Whitepaper rules:
   * - Green Tier: 2+ independent attestations from different domains (e.g., civic + professional)
   * - Blue Tier: 1+ attestation
   * - Purple Tier: AI-assisted or hybrid works (determined by process digest/assistance profile)
   * - Grey Tier: No credentials (default)
   * 
   * @param subjectDID - The DID to check credentials for
   * @param assistanceProfile - Optional assistance profile (human-only, AI-assisted, AI-generated)
   * @returns Tier: 'green' | 'blue' | 'purple' | 'grey'
   */
  determineTierFromCredentials(
    subjectDID: string,
    assistanceProfile?: 'human-only' | 'AI-assisted' | 'AI-generated'
  ): 'green' | 'blue' | 'purple' | 'grey' {
    // Get all valid credentials for this DID
    const credentials = this.getCredentialsForDID(subjectDID);
    
    if (credentials.length === 0) {
      // No credentials = Grey tier (default)
      return 'grey';
    }

    // Check for AI assistance (Purple tier)
    if (assistanceProfile === 'AI-assisted' || assistanceProfile === 'AI-generated') {
      return 'purple';
    }

    // Check for Green tier: 2+ independent attestations from different domains
    if (credentials.length >= 2) {
      // Check if attestations are from different domains (types)
      const attestorTypes = new Set<AttestorType>();
      const attestorDIDs = new Set<string>();
      
      for (const cred of credentials) {
        const attestor = this.getAttestor(cred.issuer);
        if (attestor && attestor.status === 'active') {
          attestorTypes.add(attestor.type);
          attestorDIDs.add(cred.issuer);
        }
      }
      
      // Green tier requires 2+ attestations from different domains
      // Whitepaper: "one civic and one professional institution"
      if (attestorTypes.size >= 2 && attestorDIDs.size >= 2) {
        // Verify multi-attestor policy
        const credentialHashes = this.getCredentialHashesForDID(subjectDID);
        const policyCheck = this.verifyMultiAttestorPolicy(credentialHashes, 'green');
        
        if (policyCheck.valid) {
          return 'green';
        }
      }
    }

    // Blue tier: 1+ attestation
    if (credentials.length >= 1) {
      // Verify at least one credential is valid
      const credentialHashes = this.getCredentialHashesForDID(subjectDID);
      if (credentialHashes.length >= 1) {
        const policyCheck = this.verifyMultiAttestorPolicy(credentialHashes, 'blue');
        if (policyCheck.valid) {
          return 'blue';
        }
      }
    }

    // Fallback to grey if credentials exist but don't meet requirements
    return 'grey';
  }

  /**
   * Get revocation record
   */
  getRevocation(credentialHash: string): RevocationRecord | null {
    return this.revocations.get(credentialHash) || null;
  }

  /**
   * Verify multi-attestor policy compliance
   */
  verifyMultiAttestorPolicy(
    credentialHashes: string[],
    policyName: string = 'green'
  ): { valid: boolean; reason?: string; details?: any } {
    const policy = this.policies.get(policyName);
    if (!policy) {
      return { valid: false, reason: `Policy not found: ${policyName}` };
    }

    // Check minimum attestations
    if (credentialHashes.length < policy.minAttestations) {
      return {
        valid: false,
        reason: `Insufficient attestations: ${credentialHashes.length} < ${policy.minAttestations}`
      };
    }

    // Verify all credentials are valid
    const validCredentials: VerifiableHumanCredential[] = [];
    const attestorTypes: Set<AttestorType> = new Set();

    for (const hash of credentialHashes) {
      if (!this.isCredentialValid(hash)) {
        return { valid: false, reason: `Invalid or revoked credential: ${hash}` };
      }

      const credential = this.getCredential(hash);
      if (!credential) {
        return { valid: false, reason: `Credential not found: ${hash}` };
      }

      // Check assurance level
      if (credential.credentialSubject.assuranceLevel !== policy.minAssuranceLevel &&
          this.compareAssuranceLevel(credential.credentialSubject.assuranceLevel, policy.minAssuranceLevel) < 0) {
        return {
          valid: false,
          reason: `Insufficient assurance level: ${credential.credentialSubject.assuranceLevel} < ${policy.minAssuranceLevel}`
        };
      }

      // Get attestor type
      const attestor = this.getAttestor(credential.issuer);
      if (!attestor || attestor.status !== 'active') {
        return { valid: false, reason: `Attestor not active: ${credential.issuer}` };
      }

      validCredentials.push(credential);
      attestorTypes.add(attestor.type);
    }

    // Check required types
    if (policy.requiredTypes && policy.requiredTypes.length > 0) {
      const hasRequiredType = policy.requiredTypes.some(type => attestorTypes.has(type));
      if (!hasRequiredType) {
        return {
          valid: false,
          reason: `Missing required attestor type. Required: ${policy.requiredTypes.join(', ')}, Found: ${Array.from(attestorTypes).join(', ')}`
        };
      }
    }

    return {
      valid: true,
      details: {
        credentials: validCredentials.length,
        attestorTypes: Array.from(attestorTypes),
        policy: policyName
      }
    };
  }

  /**
   * Compare assurance levels (higher is better)
   */
  private compareAssuranceLevel(
    level1: VerifiableHumanCredential['credentialSubject']['assuranceLevel'],
    level2: VerifiableHumanCredential['credentialSubject']['assuranceLevel']
  ): number {
    const levels = { 'grey': 1, 'purple': 2, 'blue': 3, 'green': 4 };
    return (levels[level1] || 0) - (levels[level2] || 0);
  }

  /**
   * Hash credential for storage/revocation
   */
  private hashCredential(credential: VerifiableHumanCredential): string {
    // Create deterministic hash (exclude proof for hashing)
    const { proof, credentialHash, ...credentialData } = credential;
    const hash = createHash('sha256')
      .update(JSON.stringify(credentialData))
      .digest('hex');
    return `0x${hash}`;
  }

  /**
   * Add audit log entry
   */
  addAuditLog(entry: Partial<AuditLogEntry> & Pick<AuditLogEntry, 'action' | 'attestorDID'>): void {
    const logEntry: AuditLogEntry = {
      timestamp: entry.timestamp || new Date().toISOString(),
      action: entry.action,
      attestorDID: entry.attestorDID,
      credentialHash: entry.credentialHash,
      details: entry.details,
      signature: entry.signature
    };
    this.auditLogs.push(logEntry);
  }

  /**
   * Get audit logs for attestor
   */
  getAuditLogs(attestorDID?: string, limit: number = 100): AuditLogEntry[] {
    let logs = this.auditLogs;
    
    if (attestorDID) {
      logs = logs.filter(log => log.attestorDID === attestorDID);
    }

    return logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get attestor registry (public)
   */
  getRegistry(): AttestorRecord[] {
    return Array.from(this.attestors.values())
      .filter(a => a.status === 'active' || a.status === 'pending')
      .sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime());
  }

  /**
   * Get revocation list (public)
   */
  getRevocationList(): RevocationRecord[] {
    return Array.from(this.revocations.values())
      .sort((a, b) => new Date(b.revokedAt).getTime() - new Date(a.revokedAt).getTime());
  }

  /**
   * Get policy
   */
  getPolicy(policyName: string): MultiAttestorPolicy | null {
    return this.policies.get(policyName) || null;
  }

  /**
   * Set custom policy
   */
  setPolicy(policyName: string, policy: MultiAttestorPolicy): void {
    this.policies.set(policyName, policy);
  }
}

