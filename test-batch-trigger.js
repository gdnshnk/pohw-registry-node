/**
 * Test Manual Batch Trigger
 * Tests the manual batch creation endpoint
 */

const http = require('http');
const crypto = require('crypto');

const REGISTRY_URL = 'http://localhost:3000';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, REGISTRY_URL);
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: body ? JSON.parse(body) : {} });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function generateTestProof(content) {
  const hash = '0x' + crypto.createHash('sha256').update(content).digest('hex');
  return {
    hash,
    signature: crypto.createHash('sha256').update(`signature-${content}`).digest('hex'),
    did: `did:pohw:test:${crypto.randomBytes(4).toString('hex')}`,
    timestamp: new Date().toISOString()
  };
}

async function testBatchTrigger() {
  console.log('🧪 Testing Manual Batch Trigger\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Check current status
    console.log('\n1. Checking registry status...');
    const statusBefore = await makeRequest('GET', '/pohw/status');
    console.log(`   Total proofs: ${statusBefore.data.total_proofs}`);
    console.log(`   Pending batch: ${statusBefore.data.pending_batch}`);

    const pendingBefore = statusBefore.data.pending_batch || 0;

    if (pendingBefore === 0) {
      console.log('\n2. Creating test proofs...');
      // Create 5 test proofs
      for (let i = 0; i < 5; i++) {
        const proof = generateTestProof(`batch-test-${i}-${Date.now()}`);
        const result = await makeRequest('POST', '/pohw/attest', proof);
        if (result.status === 201) {
          console.log(`   ✅ Proof ${i + 1} submitted`);
        }
      }
    }

    // Step 2: Check status after adding proofs
    console.log('\n3. Checking status after adding proofs...');
    const statusAfter = await makeRequest('GET', '/pohw/status');
    const pendingAfter = statusAfter.data.pending_batch || 0;
    console.log(`   Pending batch: ${pendingAfter}`);

    if (pendingAfter === 0) {
      console.log('   ⚠️  No pending proofs to batch');
      return;
    }

    // Step 3: Trigger manual batch creation
    console.log('\n4. Triggering manual batch creation...');
    const batchResult = await makeRequest('POST', '/pohw/batch/create');

    if (batchResult.status === 200) {
      console.log('   ✅ Batch created successfully!');
      console.log(`   Batch ID: ${batchResult.data.batch_id}`);
      console.log(`   Merkle Root: ${batchResult.data.merkle_root}`);
      console.log(`   Size: ${batchResult.data.size} proofs`);
      console.log(`   Created At: ${batchResult.data.created_at}`);
    } else if (batchResult.status === 400) {
      console.log('   ⚠️  No pending proofs to batch');
      console.log(`   Message: ${batchResult.data.error}`);
    } else {
      console.log(`   ❌ Batch creation failed: ${batchResult.status}`);
      console.log(`   Error: ${JSON.stringify(batchResult.data)}`);
      return;
    }

    // Step 4: Verify batch was created
    console.log('\n5. Verifying batch was created...');
    const statusFinal = await makeRequest('GET', '/pohw/status');
    console.log(`   Total proofs: ${statusFinal.data.total_proofs}`);
    console.log(`   Pending batch: ${statusFinal.data.pending_batch || 0}`);
    console.log(`   Latest hash: ${statusFinal.data.latest_hash?.substring(0, 20) || 'N/A'}...`);

    // Step 5: Test Merkle proof retrieval
    if (batchResult.status === 200 && pendingAfter > 0) {
      console.log('\n6. Testing Merkle proof retrieval...');
      // Get a proof hash from the batch
      const testHash = batchResult.data.merkle_root;
      const merkleProof = await makeRequest('GET', `/pohw/proof/${testHash.substring(0, 42)}`);
      
      if (merkleProof.status === 200) {
        console.log('   ✅ Merkle proof retrieved');
        console.log(`   Root: ${merkleProof.data.root?.substring(0, 20)}...`);
        console.log(`   Proof length: ${merkleProof.data.proof?.length || 0}`);
      } else {
        console.log('   ⚠️  Could not retrieve Merkle proof (may need specific proof hash)');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Manual batch trigger test completed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testBatchTrigger();

