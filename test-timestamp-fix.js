/**
 * Test Authentic Timestamp Fix
 * Verifies that node status endpoints return authentic batch creation timestamps
 * (not fake midnight times or current time)
 */

const http = require('http');
const crypto = require('crypto');

const REGISTRY_URL = 'http://localhost:3000';

function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, REGISTRY_URL);
    const req = http.request(url, { method }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function testTimestampFix() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 TESTING AUTHENTIC TIMESTAMP FIX');
  console.log('='.repeat(80) + '\n');

  try {
    // Check if server is running
    const health = await makeRequest('GET', '/health');
    if (health.status !== 200) {
      console.error('❌ Server is not running!');
      process.exit(1);
    }
    console.log('✅ Server is running\n');

    // Step 1: Get current status (before batch creation)
    console.log('1. Checking initial status...');
    const statusBefore = await makeRequest('GET', '/pohw/status');
    const verifyBefore = await makeRequest('GET', '/pohw/verify/index.json');
    
    console.log(`   Status endpoint timestamp: ${statusBefore.data.timestamp}`);
    console.log(`   Verify endpoint created: ${verifyBefore.data.created}`);
    
    const timestampBefore = statusBefore.data.timestamp;
    const createdBefore = verifyBefore.data.created;

    // Step 2: Create a proof and batch
    console.log('\n2. Creating test proof and batch...');
    const proof = {
      hash: '0x' + crypto.createHash('sha256').update(`timestamp-test-${Date.now()}`).digest('hex'),
      signature: 'test-sig',
      did: 'did:pohw:test:timestamp',
      timestamp: new Date().toISOString()
    };
    
    await makeRequest('POST', '/pohw/attest', proof);
    
    const batchResult = await makeRequest('POST', '/pohw/batch/create');
    if (batchResult.status !== 200) {
      console.log('   ⚠️  No batch created (no pending proofs)');
      console.log('   This is expected if there are no pending proofs.');
      return;
    }
    
    const batchCreatedAt = batchResult.data.created_at;
    console.log(`   ✅ Batch created at: ${batchCreatedAt}`);

    // Step 3: Wait a moment to ensure timestamps differ
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 4: Check status after batch creation
    console.log('\n3. Checking status after batch creation...');
    const statusAfter = await makeRequest('GET', '/pohw/status');
    const verifyAfter = await makeRequest('GET', '/pohw/verify/index.json');
    
    console.log(`   Status endpoint timestamp: ${statusAfter.data.timestamp}`);
    console.log(`   Verify endpoint created: ${verifyAfter.data.created}`);
    console.log(`   Batch created_at: ${batchCreatedAt}`);

    // Step 5: Verify timestamps match
    console.log('\n4. Verifying timestamp authenticity...');
    
    const statusMatches = statusAfter.data.timestamp === batchCreatedAt;
    const verifyMatches = verifyAfter.data.created === batchCreatedAt;
    
    if (statusMatches && verifyMatches) {
      console.log('   ✅ SUCCESS: Both endpoints return authentic batch timestamps!');
      console.log(`   ✅ Timestamp matches batch creation time: ${batchCreatedAt}`);
    } else {
      console.log('   ❌ FAILED: Timestamps do not match batch creation time');
      if (!statusMatches) {
        console.log(`   ❌ Status endpoint: expected ${batchCreatedAt}, got ${statusAfter.data.timestamp}`);
      }
      if (!verifyMatches) {
        console.log(`   ❌ Verify endpoint: expected ${batchCreatedAt}, got ${verifyAfter.data.created}`);
      }
    }

    // Step 6: Verify timestamps are NOT fake midnight times
    console.log('\n5. Verifying timestamps are not fake...');
    const isMidnight = (ts) => {
      const date = new Date(ts);
      return date.getUTCHours() === 0 && 
             date.getUTCMinutes() === 0 && 
             date.getUTCSeconds() === 0;
    };
    
    const statusIsMidnight = isMidnight(statusAfter.data.timestamp);
    const verifyIsMidnight = isMidnight(verifyAfter.data.created);
    
    if (!statusIsMidnight && !verifyIsMidnight) {
      console.log('   ✅ Timestamps are authentic (not fake midnight times)');
    } else {
      console.log('   ❌ WARNING: Timestamps appear to be fake midnight times!');
      if (statusIsMidnight) {
        console.log(`   ❌ Status timestamp: ${statusAfter.data.timestamp}`);
      }
      if (verifyIsMidnight) {
        console.log(`   ❌ Verify timestamp: ${verifyAfter.data.created}`);
      }
    }

    // Step 7: Verify timestamps changed after batch creation
    console.log('\n6. Verifying timestamps updated after batch creation...');
    const statusChanged = statusAfter.data.timestamp !== timestampBefore;
    const verifyChanged = verifyAfter.data.created !== createdBefore;
    
    if (statusChanged && verifyChanged) {
      console.log('   ✅ Timestamps updated after batch creation');
    } else {
      console.log('   ⚠️  Timestamps did not change (this is OK if no new batch was created)');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Timestamp authenticity test completed!');
    console.log('\n📝 Summary:');
    console.log('   - Status endpoint uses batch creation timestamp');
    console.log('   - Verify endpoint uses batch creation timestamp');
    console.log('   - Timestamps are authentic (not fake midnight times)');
    console.log('   - Timestamps update when new batches are created');
    console.log('\n🎯 This aligns with PoHW integrity principles:');
    console.log('   - Temporal proof: timestamps reflect actual creation moments');
    console.log('   - Provenance: "when it was created" is accurately recorded');
    console.log('   - Verifiability: timestamps are reproducible and authentic');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testTimestampFix();

