/**
 * Mock Attestors for Testing
 * 
 * Creates test attestors that can be used for development and testing
 * before real attestor bodies (universities, institutions) are available.
 */

import { AttestorManager } from './attestors';
import { randomBytes } from 'crypto';

/**
 * Create mock attestors for testing
 * Following whitepaper: different types (academic, professional, civic, media)
 */
export async function createMockAttestors(attestorManager: AttestorManager): Promise<void> {
  console.log('[Mock Attestors] Creating mock attestors for testing...');

  // Mock Academic Attestor (University)
  // Generate Ed25519 keypair (simplified - just use random bytes for testing)
  const academicPublicKey = randomBytes(32).toString('hex');
  const academicDID = `did:pohw:test:university1`;
  
  attestorManager.registerAttestor(
    academicDID,
    'Test University',
    'academic',
    academicPublicKey,
    undefined,
    {
      domain: 'academic',
      contact: 'test@university.test',
      policies: 'test-policy'
    }
  );
  attestorManager.approveAttestor(academicDID);
  console.log(`[Mock Attestors] Created academic attestor: ${academicDID}`);

  // Mock Professional Attestor (Guild/Organization)
  const professionalPublicKey = randomBytes(32).toString('hex');
  const professionalDID = `did:pohw:test:guild1`;
  
  attestorManager.registerAttestor(
    professionalDID,
    'Test Professional Guild',
    'professional',
    professionalPublicKey,
    undefined,
    {
      domain: 'professional',
      contact: 'test@guild.test',
      policies: 'test-policy'
    }
  );
  attestorManager.approveAttestor(professionalDID);
  console.log(`[Mock Attestors] Created professional attestor: ${professionalDID}`);

  // Mock Civic Attestor (Government/Civic Body)
  const civicPublicKey = randomBytes(32).toString('hex');
  const civicDID = `did:pohw:test:civic1`;
  
  attestorManager.registerAttestor(
    civicDID,
    'Test Civic Authority',
    'civic',
    civicPublicKey,
    undefined,
    {
      domain: 'civic',
      contact: 'test@civic.test',
      policies: 'test-policy'
    }
  );
  attestorManager.approveAttestor(civicDID);
  console.log(`[Mock Attestors] Created civic attestor: ${civicDID}`);

  // Mock Media Attestor (News Organization)
  const mediaPublicKey = randomBytes(32).toString('hex');
  const mediaDID = `did:pohw:test:media1`;
  
  attestorManager.registerAttestor(
    mediaDID,
    'Test Media Organization',
    'media',
    mediaPublicKey,
    undefined,
    {
      domain: 'media',
      contact: 'test@media.test',
      policies: 'test-policy'
    }
  );
  attestorManager.approveAttestor(mediaDID);
  console.log(`[Mock Attestors] Created media attestor: ${mediaDID}`);

  console.log('[Mock Attestors] All mock attestors created successfully!');
  console.log('[Mock Attestors] You can now issue credentials to test DIDs for tier testing.');
}

/**
 * Issue mock credentials to a DID for testing
 * 
 * @param attestorManager - The attestor manager instance
 * @param subjectDID - The DID to issue credentials to
 * @param attestorTypes - Array of attestor types to issue credentials from (e.g., ['academic', 'professional'])
 */
export async function issueMockCredentials(
  attestorManager: AttestorManager,
  subjectDID: string,
  attestorTypes: ('academic' | 'professional' | 'civic' | 'media')[] = ['academic']
): Promise<string[]> {
  const credentialHashes: string[] = [];
  const activeAttestors = attestorManager.getActiveAttestors();

  for (const type of attestorTypes) {
    // Find an attestor of this type
    const attestor = activeAttestors.find(a => 
      a.type === type && 
      a.did.startsWith('did:pohw:test:')
    );

    if (attestor) {
      try {
        const credential = attestorManager.issueCredential(
          attestor.did,
          subjectDID,
          'hardware', // verification method (one of: in-person, remote, automated, hardware)
          'green', // assurance level
          'test-policy',
          undefined // no expiration for test credentials
        );

        if (credential.credentialHash) {
          credentialHashes.push(credential.credentialHash);
          console.log(`[Mock Credentials] Issued ${type} credential to ${subjectDID}`);
        }
      } catch (error: any) {
        console.warn(`[Mock Credentials] Failed to issue ${type} credential:`, error.message);
      }
    } else {
      console.warn(`[Mock Credentials] No mock attestor found for type: ${type}`);
    }
  }

  return credentialHashes;
}

/**
 * Get mock attestor DIDs by type
 */
export function getMockAttestorDIDs(): {
  academic: string;
  professional: string;
  civic: string;
  media: string;
} {
  return {
    academic: 'did:pohw:test:university1',
    professional: 'did:pohw:test:guild1',
    civic: 'did:pohw:test:civic1',
    media: 'did:pohw:test:media1'
  };
}

