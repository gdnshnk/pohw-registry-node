/**
 * Create Multiple Test Proofs for Verification Interface
 * 
 * Creates several test proofs with different configurations
 * for comprehensive testing of the verification interface.
 */

const { createTestProof } = require('./create-test-proof');

async function createMultipleTestProofs() {
  console.log('=== Creating Multiple Test Proofs for Verification Interface ===\n');

  const proofs = [];

  // Helper to wait between submissions (rate limiting)
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // 1. Basic proof (Grey tier)
  console.log('1. Creating basic test proof (Grey tier)...');
  const proof1 = await createTestProof({ tier: 'grey' });
  proofs.push({ ...proof1, name: 'Basic (Grey Tier)' });
  await wait(7000); // Wait 7 seconds for rate limiting
  console.log('\n');

  // 2. Proof with process digest (Grey tier, but with process metrics)
  console.log('2. Creating proof with process digest...');
  const proof2 = await createTestProof({ 
    tier: 'grey',
    includeProcessDigest: true 
  });
  proofs.push({ ...proof2, name: 'With Process Digest' });
  await wait(7000); // Wait 7 seconds for rate limiting
  console.log('\n');

  // 3. AI-assisted proof (Purple tier)
  console.log('3. Creating AI-assisted proof (Purple tier)...');
  const proof3 = await createTestProof({ 
    tier: 'purple',
    assistanceProfile: 'AI-assisted',
    includeProcessDigest: true 
  });
  proofs.push({ ...proof3, name: 'AI-Assisted (Purple Tier)' });
  console.log('\n');

  // Summary
  console.log('=== Test Proofs Created ===\n');
  console.log('You can test these proofs on the verification interface:\n');
  
  proofs.forEach((proof, index) => {
    if (proof.success && proof.hash) {
      console.log(`${index + 1}. ${proof.name}`);
      console.log(`   Hash: ${proof.hash}`);
      console.log(`   DID: ${proof.did}\n`);
    }
  });

  console.log('Verification Interface: http://proofofhumanwork.org/verify/');
  console.log('\nCopy and paste any hash above into the verification interface!\n');
}

// Run if called directly
if (require.main === module) {
  createMultipleTestProofs().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { createMultipleTestProofs };

