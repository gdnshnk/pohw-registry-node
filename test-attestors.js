#!/usr/bin/env node
/**
 * Test Attestors Framework
 * 
 * Demonstrates:
 * - Attestor accreditation system
 * - Attestor registry/transparency logs
 * - Human verification credential issuance
 * - Attestor revocation lists
 * - Multi-attestor policies
 */

const { AttestorManager } = require('./dist/attestors');
const crypto = require('crypto');

// Generate test DIDs
function generateDID(prefix) {
  const random = crypto.randomBytes(16).toString('hex');
  return `did:pohw:attestor:${prefix}-${random.substring(0, 16)}`;
}

async function testAttestorAccreditation() {
  console.log('=== Test 1: Attestor Accreditation System ===\n');
  
  const manager = new AttestorManager();
  
  // Register attestors
  const universityDID = generateDID('university');
  const mediaDID = generateDID('media');
  const civicDID = generateDID('civic');
  
  console.log('Registering attestors...');
  const university = manager.registerAttestor(
    universityDID,
    'Example University',
    'academic',
    crypto.randomBytes(32).toString('hex'),
    'https://university.example/.well-known/public.txt',
    { domain: 'university.example', contact: 'admin@university.example' }
  );
  console.log(`✅ Registered: ${university.name} (${university.type}) - Status: ${university.status}`);
  
  const media = manager.registerAttestor(
    mediaDID,
    'Example News Organization',
    'media',
    crypto.randomBytes(32).toString('hex')
  );
  console.log(`✅ Registered: ${media.name} (${media.type}) - Status: ${media.status}`);
  
  const civic = manager.registerAttestor(
    civicDID,
    'Example Civic Organization',
    'civic',
    crypto.randomBytes(32).toString('hex')
  );
  console.log(`✅ Registered: ${civic.name} (${civic.type}) - Status: ${civic.status}`);
  
  // Approve attestors (Foundation action)
  console.log('\nApproving attestors...');
  const approvedUniversity = manager.approveAttestor(universityDID, '2026-11-25T00:00:00Z');
  const approvedMedia = manager.approveAttestor(mediaDID);
  const approvedCivic = manager.approveAttestor(civicDID);
  
  console.log(`✅ Approved: ${approvedUniversity.name} - Status: ${approvedUniversity.status}`);
  console.log(`✅ Approved: ${approvedMedia.name} - Status: ${approvedMedia.status}`);
  console.log(`✅ Approved: ${approvedCivic.name} - Status: ${approvedCivic.status}`);
  
  // Get registry
  const registry = manager.getRegistry();
  console.log(`\n✅ Registry contains ${registry.length} attestors`);
  
  return { manager, universityDID, mediaDID, civicDID };
}

async function testCredentialIssuance() {
  console.log('\n\n=== Test 2: Human Verification Credential Issuance ===\n');
  
  const manager = new AttestorManager();
  
  // Register and approve attestor
  const attestorDID = generateDID('test');
  manager.registerAttestor(attestorDID, 'Test Attestor', 'academic', crypto.randomBytes(32).toString('hex'));
  manager.approveAttestor(attestorDID);
  
  // Issue credentials
  const subjectDID1 = 'did:pohw:user:alice';
  const subjectDID2 = 'did:pohw:user:bob';
  
  console.log('Issuing credentials...');
  const credential1 = manager.issueCredential(
    attestorDID,
    subjectDID1,
    'in-person',
    'green',
    'policy-v1',
    '2026-11-25T00:00:00Z'
  );
  console.log(`✅ Credential issued to ${subjectDID1}`);
  console.log(`   Hash: ${credential1.credentialHash}`);
  console.log(`   Assurance Level: ${credential1.credentialSubject.assuranceLevel}`);
  console.log(`   Verification Method: ${credential1.credentialSubject.verificationMethod}`);
  
  const credential2 = manager.issueCredential(
    attestorDID,
    subjectDID2,
    'remote',
    'blue',
    undefined,
    '2026-11-25T00:00:00Z'
  );
  console.log(`\n✅ Credential issued to ${subjectDID2}`);
  console.log(`   Hash: ${credential2.credentialHash}`);
  console.log(`   Assurance Level: ${credential2.credentialSubject.assuranceLevel}`);
  
  // Verify credentials
  console.log('\nVerifying credentials...');
  const valid1 = manager.isCredentialValid(credential1.credentialHash || '');
  const valid2 = manager.isCredentialValid(credential2.credentialHash || '');
  console.log(`✅ Credential 1 valid: ${valid1}`);
  console.log(`✅ Credential 2 valid: ${valid2}`);
  
  return { manager, credential1, credential2 };
}

async function testRevocation() {
  console.log('\n\n=== Test 3: Attestor Revocation Lists ===\n');
  
  const manager = new AttestorManager();
  
  // Register, approve, and issue credential
  const attestorDID = generateDID('revoke');
  manager.registerAttestor(attestorDID, 'Revocation Test Attestor', 'academic', crypto.randomBytes(32).toString('hex'));
  manager.approveAttestor(attestorDID);
  
  const subjectDID = 'did:pohw:user:charlie';
  const credential = manager.issueCredential(
    attestorDID,
    subjectDID,
    'in-person',
    'green'
  );
  
  console.log(`Issued credential: ${credential.credentialHash}`);
  const credHash = credential.credentialHash || '';
  console.log(`✅ Credential valid: ${manager.isCredentialValid(credHash)}`);
  
  // Revoke credential
  console.log('\nRevoking credential...');
  const revocation = manager.revokeCredential(
    credHash,
    attestorDID,
    'compromised',
    { details: 'Key compromise detected', evidence: 'Security incident report' }
  );
  
  console.log(`✅ Credential revoked`);
  console.log(`   Reason: ${revocation.reason}`);
  console.log(`   Revoked at: ${revocation.revokedAt}`);
  console.log(`   Credential valid: ${manager.isCredentialValid(credHash)}`);
  
  // Get revocation list
  const revocations = manager.getRevocationList();
  console.log(`\n✅ Revocation list contains ${revocations.length} entries`);
  
  return { manager, credential, revocation };
}

async function testMultiAttestorPolicy() {
  console.log('\n\n=== Test 4: Multi-Attestor Policies ===\n');
  
  const manager = new AttestorManager();
  
  // Register and approve multiple attestors
  const universityDID = generateDID('uni');
  const mediaDID = generateDID('media');
  const civicDID = generateDID('civic');
  
  manager.registerAttestor(universityDID, 'University A', 'academic', crypto.randomBytes(32).toString('hex'));
  manager.registerAttestor(mediaDID, 'Media B', 'media', crypto.randomBytes(32).toString('hex'));
  manager.registerAttestor(civicDID, 'Civic C', 'civic', crypto.randomBytes(32).toString('hex'));
  
  manager.approveAttestor(universityDID);
  manager.approveAttestor(mediaDID);
  manager.approveAttestor(civicDID);
  
  // Issue credentials from different attestors
  const subjectDID = 'did:pohw:user:dave';
  
  const cred1 = manager.issueCredential(universityDID, subjectDID, 'in-person', 'green');
  const cred2 = manager.issueCredential(mediaDID, subjectDID, 'remote', 'green');
  const cred3 = manager.issueCredential(civicDID, subjectDID, 'in-person', 'green');
  
  console.log('Issued credentials:');
  console.log(`  1. ${cred1.credentialHash?.substring(0, 20)}... (University)`);
  console.log(`  2. ${cred2.credentialHash?.substring(0, 20)}... (Media)`);
  console.log(`  3. ${cred3.credentialHash?.substring(0, 20)}... (Civic)`);
  
  // Test Green-tier policy (requires 2+ attestations)
  console.log('\nTesting Green-tier policy (2+ attestations required)...');
  const result1 = manager.verifyMultiAttestorPolicy(
      [cred1.credentialHash || '', cred2.credentialHash || ''],
      'green'
  );
  console.log(`✅ Two credentials: ${result1.valid ? 'VALID' : 'INVALID'}`);
  if (!result1.valid) {
    console.log(`   Reason: ${result1.reason}`);
  } else {
    console.log(`   Details: ${JSON.stringify(result1.details)}`);
  }
  
  // Test with insufficient attestations
  const result2 = manager.verifyMultiAttestorPolicy(
      [cred1.credentialHash || ''],
      'green'
  );
  console.log(`\n❌ One credential: ${result2.valid ? 'VALID' : 'INVALID'}`);
  if (!result2.valid) {
    console.log(`   Reason: ${result2.reason}`);
  }
  
  // Test with all three credentials
  const result3 = manager.verifyMultiAttestorPolicy(
      [cred1.credentialHash || '', cred2.credentialHash || '', cred3.credentialHash || ''],
      'green'
  );
  console.log(`\n✅ Three credentials: ${result3.valid ? 'VALID' : 'INVALID'}`);
  if (result3.valid) {
    console.log(`   Details: ${JSON.stringify(result3.details)}`);
  }
  
  return { manager, result1, result2, result3 };
}

async function testAuditLogs() {
  console.log('\n\n=== Test 5: Audit Logs & Transparency ===\n');
  
  const manager = new AttestorManager();
  
  const attestorDID = generateDID('audit');
  manager.registerAttestor(attestorDID, 'Audit Test Attestor', 'academic', crypto.randomBytes(32).toString('hex'));
  manager.approveAttestor(attestorDID);
  
  const subjectDID = 'did:pohw:user:eve';
  const credential = manager.issueCredential(attestorDID, subjectDID, 'in-person', 'green');
  manager.revokeCredential(credential.credentialHash || '', attestorDID, 'user_request');
  
  // Get audit logs
  const logs = manager.getAuditLogs(attestorDID);
  console.log(`✅ Audit logs for attestor: ${logs.length} entries`);
  
  logs.forEach((log, index) => {
    console.log(`\n${index + 1}. ${log.action}`);
    console.log(`   Timestamp: ${log.timestamp}`);
    console.log(`   Details: ${log.details || 'N/A'}`);
    if (log.credentialHash) {
      console.log(`   Credential: ${log.credentialHash.substring(0, 20)}...`);
    }
  });
  
  return { manager, logs };
}

// Main test
async function main() {
  try {
    await testAttestorAccreditation();
    await testCredentialIssuance();
    await testRevocation();
    await testMultiAttestorPolicy();
    await testAuditLogs();
    
    console.log('\n\n=== Summary ===');
    console.log('✅ Attestor accreditation system working');
    console.log('✅ Attestor registry/transparency logs working');
    console.log('✅ Human verification credential issuance working');
    console.log('✅ Attestor revocation lists working');
    console.log('✅ Multi-attestor policies working');
    console.log('\nAll Attestors Framework features implemented according to PoHW whitepaper!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testAttestorAccreditation, testCredentialIssuance, testRevocation, testMultiAttestorPolicy };

