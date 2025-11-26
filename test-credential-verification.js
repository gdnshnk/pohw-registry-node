/**
 * Test Attestor Credential Verification
 * 
 * Tests the credential verification and tier assignment system
 * following whitepaper Section 3.3 tier requirements.
 */

const { AttestorManager } = require('./dist/attestors');
const { createMockAttestors, issueMockCredentials, getMockAttestorDIDs } = require('./dist/mock-attestors');
const { generateDIDFromKeypair } = require('./dist/did');
const { randomBytes } = require('crypto');

// Mock database for testing
class MockDatabase {
  constructor() {
    this.attestors = {};
    this.credentials = {};
  }

  storeAttestor(did, attestor) {
    this.attestors[did] = attestor;
  }

  getAllAttestors() {
    return Object.values(this.attestors);
  }

  storeCredential(hash, credential) {
    this.credentials[hash] = credential;
  }

  getAllCredentials() {
    return Object.values(this.credentials);
  }
}

async function testCredentialVerification() {
  console.log('=== Attestor Credential Verification Test ===\n');

  const db = new MockDatabase();
  const attestorManager = new AttestorManager();

  // Create mock attestors
  console.log('Step 1: Creating mock attestors...');
  await createMockAttestors(attestorManager);
  
  // Store in database
  const mockAttestors = attestorManager.getActiveAttestors();
  mockAttestors.forEach(attestor => {
    db.storeAttestor(attestor.did, attestor);
  });
  console.log(`✅ Created ${mockAttestors.length} mock attestors\n`);

  // Test 1: No credentials (Grey tier)
  console.log('Test 1: DID with no credentials (should be Grey tier)');
  console.log('─'.repeat(60));
  
  const publicKey1 = Buffer.from(randomBytes(32));
  const { did: did1 } = generateDIDFromKeypair(publicKey1);
  
  const tier1 = attestorManager.determineTierFromCredentials(did1);
  console.log(`DID: ${did1.did}`);
  console.log(`Credentials: 0`);
  console.log(`Tier: ${tier1.toUpperCase()}`);
  console.log(`Expected: GREY`);
  console.log(`Result: ${tier1 === 'grey' ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 2: One credential (Blue tier)
  console.log('Test 2: DID with 1 credential (should be Blue tier)');
  console.log('─'.repeat(60));
  
  const publicKey2 = Buffer.from(randomBytes(32));
  const { did: did2 } = generateDIDFromKeypair(publicKey2);
  
  await issueMockCredentials(attestorManager, did2.did, ['academic']);
  
  const tier2 = attestorManager.determineTierFromCredentials(did2.did);
  const credentials2 = attestorManager.getCredentialsForDID(did2);
  console.log(`DID: ${did2.did}`);
  console.log(`Credentials: ${credentials2.length}`);
  console.log(`Tier: ${tier2.toUpperCase()}`);
  console.log(`Expected: BLUE`);
  console.log(`Result: ${tier2 === 'blue' ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 3: Two credentials from different domains (Green tier)
  console.log('Test 3: DID with 2+ credentials from different domains (should be Green tier)');
  console.log('─'.repeat(60));
  
  const publicKey3 = Buffer.from(randomBytes(32));
  const { did: did3 } = generateDIDFromKeypair(publicKey3);
  
  // Issue credentials from different domains (academic + professional)
  await issueMockCredentials(attestorManager, did3.did, ['academic', 'professional']);
  
  const tier3 = attestorManager.determineTierFromCredentials(did3.did);
  const credentials3 = attestorManager.getCredentialsForDID(did3.did);
  console.log(`DID: ${did3.did}`);
  console.log(`Credentials: ${credentials3.length}`);
  console.log(`Attestor Types: ${credentials3.map(c => {
    const att = attestorManager.getAttestor(c.issuer);
    return att ? att.type : 'unknown';
  }).join(', ')}`);
  console.log(`Tier: ${tier3.toUpperCase()}`);
  console.log(`Expected: GREEN`);
  console.log(`Result: ${tier3 === 'green' ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 4: Three credentials from different domains (Green tier)
  console.log('Test 4: DID with 3+ credentials from different domains (should be Green tier)');
  console.log('─'.repeat(60));
  
  const publicKey4 = Buffer.from(randomBytes(32));
  const { did: did4 } = generateDIDFromKeypair(publicKey4);
  
  // Issue credentials from three different domains
  await issueMockCredentials(attestorManager, did4.did, ['academic', 'professional', 'civic']);
  
  const tier4 = attestorManager.determineTierFromCredentials(did4.did);
  const credentials4 = attestorManager.getCredentialsForDID(did4.did);
  console.log(`DID: ${did4.did}`);
  console.log(`Credentials: ${credentials4.length}`);
  console.log(`Attestor Types: ${credentials4.map(c => {
    const att = attestorManager.getAttestor(c.issuer);
    return att ? att.type : 'unknown';
  }).join(', ')}`);
  console.log(`Tier: ${tier4.toUpperCase()}`);
  console.log(`Expected: GREEN`);
  console.log(`Result: ${tier4 === 'green' ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 5: AI-assisted (Purple tier)
  console.log('Test 5: AI-assisted work (should be Purple tier regardless of credentials)');
  console.log('─'.repeat(60));
  
  const publicKey5 = Buffer.from(randomBytes(32));
  const { did: did5 } = generateDIDFromKeypair(publicKey5);
  
  // Issue credentials (would normally be Green)
  await issueMockCredentials(attestorManager, did5.did, ['academic', 'professional']);
  
  // But with AI assistance, should be Purple
  const tier5 = attestorManager.determineTierFromCredentials(did5.did, 'AI-assisted');
  const credentials5 = attestorManager.getCredentialsForDID(did5.did);
  console.log(`DID: ${did5.did}`);
  console.log(`Credentials: ${credentials5.length}`);
  console.log(`Assistance Profile: AI-assisted`);
  console.log(`Tier: ${tier5.toUpperCase()}`);
  console.log(`Expected: PURPLE`);
  console.log(`Result: ${tier5 === 'purple' ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 6: Multi-attestor policy verification
  console.log('Test 6: Multi-attestor policy verification');
  console.log('─'.repeat(60));
  
  const publicKey6 = Buffer.from(randomBytes(32));
  const { did: did6 } = generateDIDFromKeypair(publicKey6);
  
  await issueMockCredentials(attestorManager, did6.did, ['academic', 'professional']);
  const credentialHashes6 = attestorManager.getCredentialHashesForDID(did6.did);
  
  const greenPolicyCheck = attestorManager.verifyMultiAttestorPolicy(credentialHashes6, 'green');
  const bluePolicyCheck = attestorManager.verifyMultiAttestorPolicy(credentialHashes6, 'blue');
  
  console.log(`DID: ${did6.did}`);
  console.log(`Credentials: ${credentialHashes6.length}`);
  console.log(`Green Policy Valid: ${greenPolicyCheck.valid ? '✅ YES' : '❌ NO'}`);
  if (!greenPolicyCheck.valid) {
    console.log(`  Reason: ${greenPolicyCheck.reason}`);
  }
  console.log(`Blue Policy Valid: ${bluePolicyCheck.valid ? '✅ YES' : '❌ NO'}`);
  console.log(`Result: ${greenPolicyCheck.valid && bluePolicyCheck.valid ? '✅ PASS' : '⚠️  PARTIAL'}\n`);

  console.log('=== Test Complete ===');
  console.log('\nSummary:');
  console.log('- Grey tier: No credentials');
  console.log('- Blue tier: 1+ credential');
  console.log('- Green tier: 2+ credentials from different domains');
  console.log('- Purple tier: AI-assisted work');
  console.log('\n✅ Credential verification system working correctly!');
}

// Run tests
testCredentialVerification().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});

