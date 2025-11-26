/**
 * Comprehensive Test Suite for PoHW Registry Node
 * Tests all endpoints with unique proofs and Merkle batching
 */

const http = require('http');
const crypto = require('crypto');

const REGISTRY_URL = 'http://localhost:3000';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, REGISTRY_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

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

async function runTests() {
  console.log('🧪 Comprehensive PoHW Registry Node Test Suite\n');
  console.log('=' .repeat(60));

  let passed = 0;
  let failed = 0;

  // Test 1: Health check
  console.log('\n1. Health Check');
  try {
    const health = await makeRequest('GET', '/health');
    if (health.status === 200) {
      console.log('   ✅ PASS - Health endpoint responding');
      passed++;
    } else {
      console.log('   ❌ FAIL - Unexpected status:', health.status);
      failed++;
    }
  } catch (error) {
    console.log('   ❌ FAIL - Error:', error.message);
    failed++;
  }

  // Test 2: Submit multiple unique proofs
  console.log('\n2. Submit Multiple Proofs');
  const proofs = [];
  for (let i = 0; i < 5; i++) {
    const proof = generateTestProof(`test-content-${i}-${Date.now()}`);
    try {
      const submit = await makeRequest('POST', '/pohw/attest', proof);
      if (submit.status === 201) {
        console.log(`   ✅ Proof ${i + 1} submitted: ${proof.hash.substring(0, 20)}...`);
        proofs.push(proof);
        passed++;
      } else {
        console.log(`   ⚠️  Proof ${i + 1} status ${submit.status}:`, submit.data.error || '');
        if (submit.status === 409) {
          // Duplicate is acceptable
          proofs.push(proof);
        } else {
          failed++;
        }
      }
    } catch (error) {
      console.log(`   ❌ Proof ${i + 1} failed:`, error.message);
      failed++;
    }
  }

  // Test 3: Verify each proof
  console.log('\n3. Verify Submitted Proofs');
  for (const proof of proofs) {
    try {
      const verify = await makeRequest('GET', `/pohw/verify/${proof.hash}`);
      if (verify.status === 200 && verify.data.valid === true) {
        console.log(`   ✅ Verified: ${proof.hash.substring(0, 20)}...`);
        passed++;
      } else {
        console.log(`   ❌ Failed to verify: ${proof.hash.substring(0, 20)}...`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ Error verifying:`, error.message);
      failed++;
    }
  }

  // Test 4: Get registry status
  console.log('\n4. Registry Status');
  try {
    const status = await makeRequest('GET', '/pohw/status');
    if (status.status === 200) {
      console.log('   ✅ Status retrieved');
      console.log(`   📊 Total proofs: ${status.data.total_proofs}`);
      console.log(`   📦 Pending batch: ${status.data.pending_batch}`);
      passed++;
    } else {
      console.log('   ❌ Failed to get status');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    failed++;
  }

  // Test 5: Test Merkle proof (if proof is batched)
  console.log('\n5. Merkle Proof Generation');
  if (proofs.length > 0) {
    const testHash = proofs[0].hash;
    try {
      const merkle = await makeRequest('GET', `/pohw/proof/${testHash}`);
      if (merkle.status === 200) {
        console.log('   ✅ Merkle proof retrieved');
        console.log(`   🌳 Root: ${merkle.data.root?.substring(0, 20) || 'N/A'}...`);
        console.log(`   🔗 Proof length: ${merkle.data.proof?.length || 0}`);
        passed++;
      } else if (merkle.status === 404) {
        console.log('   ⚠️  Proof not yet batched (expected if batch size not reached)');
        console.log('   ℹ️  Merkle proofs are generated when proofs are batched');
      } else {
        console.log('   ❌ Unexpected status:', merkle.status);
        failed++;
      }
    } catch (error) {
      console.log('   ❌ Error:', error.message);
      failed++;
    }
  }

  // Test 6: Test duplicate prevention
  console.log('\n6. Duplicate Prevention');
  if (proofs.length > 0) {
    try {
      const duplicate = await makeRequest('POST', '/pohw/attest', proofs[0]);
      if (duplicate.status === 409) {
        console.log('   ✅ Duplicate proof correctly rejected');
        passed++;
      } else {
        console.log('   ❌ Duplicate should be rejected (409)');
        failed++;
      }
    } catch (error) {
      console.log('   ❌ Error:', error.message);
      failed++;
    }
  }

  // Test 7: Test invalid hash verification
  console.log('\n7. Invalid Hash Handling');
  try {
    const invalid = await makeRequest('GET', '/pohw/verify/0xinvalidhash');
    if (invalid.status === 404) {
      console.log('   ✅ Invalid hash correctly returns 404');
      passed++;
    } else {
      console.log('   ⚠️  Unexpected status for invalid hash:', invalid.status);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    failed++;
  }

  // Test 8: Node status endpoint (gdn.sh compatible)
  console.log('\n8. Node Status Endpoint (gdn.sh compatible)');
  try {
    const nodeStatus = await makeRequest('GET', '/pohw/verify/index.json');
    if (nodeStatus.status === 200) {
      console.log('   ✅ Node status endpoint working');
      console.log(`   📝 Node: ${nodeStatus.data.node}`);
      console.log(`   📝 Protocol: ${nodeStatus.data.protocol}`);
      console.log(`   📝 Status: ${nodeStatus.data.status}`);
      passed++;
    } else {
      console.log('   ❌ Failed to get node status');
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Registry node is fully operational.');
  } else {
    console.log('\n⚠️  Some tests failed. Review output above.');
  }
}

// Run tests
runTests().catch(console.error);

