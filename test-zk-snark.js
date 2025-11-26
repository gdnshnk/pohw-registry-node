/**
 * Test ZK-SNARK Implementation for Process Digests
 * 
 * Tests the full ZK-SNARK proof generation and verification
 * for process digest threshold verification.
 */

const { ProcessSession, DEFAULT_THRESHOLDS } = require('./dist/process-layer');
const { generateZKProof, verifyZKProof, getZKManager } = require('./dist/zk-snark');

async function testZKSNARK() {
  console.log('=== ZK-SNARK Process Digest Verification Test ===\n');

  // Test 1: Human-like session (should pass thresholds)
  console.log('Test 1: Human-like session (should generate valid ZK proof)');
  console.log('─'.repeat(60));
  
  const humanSession = new ProcessSession();
  
  // Simulate human input over 6 minutes
  const startTime = Date.now();
  for (let i = 0; i < 200; i++) {
    // Random intervals between 100ms and 2000ms (human-like)
    const interval = 100 + Math.random() * 1900;
    await new Promise(resolve => setTimeout(resolve, interval));
    humanSession.recordInput('keystroke');
  }
  
  // Ensure minimum duration
  const elapsed = Date.now() - startTime;
  if (elapsed < DEFAULT_THRESHOLDS.minDuration) {
    const remaining = DEFAULT_THRESHOLDS.minDuration - elapsed;
    await new Promise(resolve => setTimeout(resolve, remaining));
  }
  
  const humanDigest = await humanSession.generateDigest();
  
  console.log(`Session Duration: ${(humanDigest.metrics.duration / 1000).toFixed(2)}s`);
  console.log(`Entropy: ${humanDigest.metrics.entropy.toFixed(3)}`);
  console.log(`Temporal Coherence: ${humanDigest.metrics.temporalCoherence.toFixed(3)}`);
  console.log(`Meets Thresholds: ${humanDigest.meetsThresholds ? '✅ YES' : '❌ NO'}`);
  
  if (humanDigest.zkProof) {
    console.log('\n✅ ZK-SNARK Proof Generated');
    console.log(`Proof Structure: ${JSON.stringify(Object.keys(humanDigest.zkProof.proof))}`);
    console.log(`Public Signals: ${humanDigest.zkProof.publicSignals.length} signals`);
    
    // Verify the proof
    const isValid = await verifyZKProof(humanDigest.zkProof, DEFAULT_THRESHOLDS);
    console.log(`Proof Verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    
    if (isValid) {
      console.log('\n✅ SUCCESS: ZK-SNARK proof verified without revealing metric values!');
      console.log('   Privacy preserved: verifier knows thresholds are met');
      console.log('   but cannot see actual duration, entropy, or coherence values.');
    }
  } else {
    console.log('\n⚠️  No ZK-SNARK proof generated (thresholds may not be met)');
  }
  
  console.log('\n');
  
  // Test 2: Bot-like session (should fail thresholds)
  console.log('Test 2: Bot-like session (should fail thresholds)');
  console.log('─'.repeat(60));
  
  const botSession = new ProcessSession();
  
  // Simulate bot input (very fast, regular intervals)
  for (let i = 0; i < 50; i++) {
    await new Promise(resolve => setTimeout(resolve, 10)); // 10ms intervals (too fast)
    botSession.recordInput('keystroke');
  }
  
  const botDigest = await botSession.generateDigest();
  
  console.log(`Session Duration: ${(botDigest.metrics.duration / 1000).toFixed(2)}s`);
  console.log(`Entropy: ${botDigest.metrics.entropy.toFixed(3)}`);
  console.log(`Temporal Coherence: ${botDigest.metrics.temporalCoherence.toFixed(3)}`);
  console.log(`Meets Thresholds: ${botDigest.meetsThresholds ? '✅ YES' : '❌ NO'}`);
  
  if (botDigest.zkProof) {
    console.log('\n⚠️  ZK-SNARK proof generated (unexpected for bot session)');
    const isValid = await verifyZKProof(botDigest.zkProof, DEFAULT_THRESHOLDS);
    console.log(`Proof Verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
  } else {
    console.log('\n✅ Expected: No ZK-SNARK proof (thresholds not met)');
  }
  
  console.log('\n');
  
  // Test 3: Direct ZK proof generation
  console.log('Test 3: Direct ZK proof generation');
  console.log('─'.repeat(60));
  
  const testMetrics = {
    sessionStart: new Date().toISOString(),
    sessionEnd: new Date().toISOString(),
    duration: 10 * 60 * 1000, // 10 minutes
    entropy: 0.75,
    temporalCoherence: 0.65,
    inputEvents: 500,
    timingVariance: 5000,
    averageInterval: 1200,
    minInterval: 100,
    maxInterval: 5000,
  };
  
  const zkResult = await generateZKProof(testMetrics, DEFAULT_THRESHOLDS);
  
  if (zkResult && zkResult.valid) {
    console.log('✅ ZK proof generated successfully');
    console.log(`Circuit: ${zkResult.metadata.circuit}`);
    console.log(`Scheme: ${zkResult.metadata.scheme}`);
    
    const verifyResult = await verifyZKProof(zkResult.proof, DEFAULT_THRESHOLDS);
    console.log(`Verification: ${verifyResult ? '✅ VALID' : '❌ INVALID'}`);
  } else {
    console.log('❌ Failed to generate ZK proof');
  }
  
  console.log('\n=== Test Complete ===');
}

// Run tests
testZKSNARK().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});

