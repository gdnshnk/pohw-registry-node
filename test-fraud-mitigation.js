/**
 * Test Fraud Mitigation and Reputation Decay
 * Tests rate limiting and reputation scoring
 */

const BASE_URL = process.env.REGISTRY_URL || 'http://localhost:3000';

async function testRateLimiting() {
  console.log('\n=== Testing Rate Limiting ===\n');

  const testDID = 'did:pohw:test:rate-limit';
  const testHash = '0x' + require('crypto').randomBytes(32).toString('hex');

  // Submit multiple proofs quickly to trigger rate limit
  console.log('Submitting 15 proofs in rapid succession...');
  
  for (let i = 0; i < 15; i++) {
    const hash = '0x' + require('crypto').randomBytes(32).toString('hex');
    const timestamp = new Date().toISOString();
    
    try {
      const response = await fetch(`${BASE_URL}/pohw/attest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hash,
          signature: 'test-signature',
          did: testDID,
          timestamp
        })
      });

      const data = await response.json();
      
      if (response.status === 429) {
        console.log(`✓ Proof ${i + 1}: Rate limited (expected)`);
        console.log(`  Reason: ${data.reason}`);
        console.log(`  Current rate: ${data.currentRate} proofs/minute`);
        break;
      } else if (response.ok) {
        console.log(`✓ Proof ${i + 1}: Accepted`);
      } else {
        console.log(`✗ Proof ${i + 1}: Error - ${data.error}`);
      }
    } catch (error) {
      console.log(`✗ Proof ${i + 1}: Network error - ${error.message}`);
    }

    // Small delay to avoid immediate blocking
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Check rate limit status
  console.log('\nChecking rate limit status...');
  try {
    const response = await fetch(`${BASE_URL}/pohw/rate-limit/${testDID}`);
    const data = await response.json();
    console.log('Rate limit status:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Error checking rate limit:', error.message);
  }
}

async function testReputation() {
  console.log('\n=== Testing Reputation System ===\n');

  const testDID = 'did:pohw:test:reputation';

  // Check initial reputation
  console.log('1. Checking initial reputation...');
  try {
    const response = await fetch(`${BASE_URL}/pohw/reputation/${testDID}`);
    const data = await response.json();
    console.log('Initial reputation:', JSON.stringify(data.reputation, null, 2));
    console.log('Initial stats:', JSON.stringify(data.stats, null, 2));
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Submit successful proofs to increase reputation
  console.log('\n2. Submitting 5 successful proofs...');
  for (let i = 0; i < 5; i++) {
    const hash = '0x' + require('crypto').randomBytes(32).toString('hex');
    const timestamp = new Date().toISOString();
    
    try {
      const response = await fetch(`${BASE_URL}/pohw/attest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hash,
          signature: 'test-signature',
          did: testDID,
          timestamp
        })
      });

      if (response.ok) {
        console.log(`✓ Proof ${i + 1} submitted`);
      } else {
        const data = await response.json();
        console.log(`✗ Proof ${i + 1} failed: ${data.error}`);
      }
    } catch (error) {
      console.log(`✗ Proof ${i + 1} error: ${error.message}`);
    }

    // Wait between submissions
    await new Promise(resolve => setTimeout(resolve, 7000));
  }

  // Check reputation after successful proofs
  console.log('\n3. Checking reputation after successful proofs...');
  try {
    const response = await fetch(`${BASE_URL}/pohw/reputation/${testDID}`);
    const data = await response.json();
    console.log('Updated reputation:', JSON.stringify(data.reputation, null, 2));
    console.log(`Score: ${data.reputation.score} (was 50, should be higher)`);
    console.log(`Tier: ${data.reputation.tier}`);
    console.log(`Trust Level: ${data.reputation.trustLevel.toFixed(2)}`);
  } catch (error) {
    console.log('Error:', error.message);
  }
}

async function testAnomalyDetection() {
  console.log('\n=== Testing Anomaly Detection ===\n');

  const testDID = 'did:pohw:test:anomaly';

  // Try to submit proofs too quickly
  console.log('Attempting rapid submissions to trigger anomaly...');
  
  for (let i = 0; i < 20; i++) {
    const hash = '0x' + require('crypto').randomBytes(32).toString('hex');
    const timestamp = new Date().toISOString();
    
    try {
      const response = await fetch(`${BASE_URL}/pohw/attest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hash,
          signature: 'test-signature',
          did: testDID,
          timestamp
        })
      });

      const data = await response.json();
      
      if (response.status === 429) {
        console.log(`✓ Anomaly detected at proof ${i + 1}`);
        console.log(`  Reason: ${data.reason}`);
        break;
      } else if (response.ok) {
        // Continue
      }
    } catch (error) {
      // Continue
    }

    // Very small delay to trigger rate limit
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Check anomaly log
  console.log('\nChecking anomaly log...');
  try {
    const response = await fetch(`${BASE_URL}/pohw/reputation/${testDID}`);
    const data = await response.json();
    console.log('Anomalies detected:', data.anomalies.length);
    if (data.anomalies.length > 0) {
      console.log('Recent anomalies:');
      data.anomalies.forEach((anomaly, i) => {
        console.log(`  ${i + 1}. ${anomaly}`);
      });
    }
    console.log('Has recent anomalies:', data.hasRecentAnomalies);
  } catch (error) {
    console.log('Error:', error.message);
  }
}

async function testAllReputation() {
  console.log('\n=== Testing All Reputation Records ===\n');

  try {
    const response = await fetch(`${BASE_URL}/pohw/reputation`);
    const data = await response.json();
    console.log(`Total reputation records: ${data.total}`);
    console.log('\nTop 10 by reputation score:');
    data.reputations.slice(0, 10).forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.did.substring(0, 30)}... - Score: ${item.reputation.score}, Tier: ${item.reputation.tier}`);
    });
  } catch (error) {
    console.log('Error:', error.message);
  }
}

async function main() {
  console.log('Fraud Mitigation and Reputation Decay Test');
  console.log('==========================================');
  console.log(`Testing against: ${BASE_URL}\n`);

  try {
    await testRateLimiting();
    await testReputation();
    await testAnomalyDetection();
    await testAllReputation();

    console.log('\n=== Test Complete ===\n');
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testRateLimiting, testReputation, testAnomalyDetection, testAllReputation };

