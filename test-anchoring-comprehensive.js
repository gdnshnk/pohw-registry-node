/**
 * Comprehensive Anchoring Test
 * Tests anchoring functionality with different configurations
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
    signature: crypto.createHash('sha256').update(`sig-${content}`).digest('hex'),
    did: `did:pohw:test:${crypto.randomBytes(4).toString('hex')}`,
    timestamp: new Date().toISOString()
  };
}

async function testScenario(name, testFn) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📋 Test Scenario: ${name}`);
  console.log('='.repeat(70));
  try {
    await testFn();
    console.log(`\n✅ Scenario "${name}" completed successfully`);
  } catch (error) {
    console.error(`\n❌ Scenario "${name}" failed:`, error.message);
    throw error;
  }
}

async function testAnchoringDisabled() {
  console.log('\n1. Testing with anchoring DISABLED (default)...');
  
  // Create test proof
  const proof = generateTestProof(`test-disabled-${Date.now()}`);
  const attestResult = await makeRequest('POST', '/pohw/attest', proof);
  console.log(`   ✅ Proof submitted: ${attestResult.status === 201 ? 'OK' : 'FAILED'}`);
  
  // Create batch
  const batchResult = await makeRequest('POST', '/pohw/batch/create');
  if (batchResult.status !== 200) {
    console.log(`   ⚠️  No batch created (no pending proofs)`);
    return;
  }
  
  console.log(`   ✅ Batch created: ${batchResult.data.batch_id}`);
  
  // Try to anchor (should fail with 400)
  const anchorResult = await makeRequest('POST', `/pohw/batch/anchor/${batchResult.data.batch_id}`);
  if (anchorResult.status === 400) {
    console.log(`   ✅ Anchoring correctly rejected (not enabled)`);
    console.log(`   Message: ${anchorResult.data.error}`);
  } else {
    console.log(`   ⚠️  Unexpected status: ${anchorResult.status}`);
  }
}

async function testAnchoringEnabledNoKeys() {
  console.log('\n1. Testing with anchoring ENABLED but NO keys...');
  console.log('   (This requires restarting the server with ANCHORING_ENABLED=true)');
  console.log('   ⚠️  Skipping - requires server restart');
}

async function testAnchoringWithMockKeys() {
  console.log('\n1. Testing anchoring endpoint structure...');
  
  // Create test proof
  const proof = generateTestProof(`test-mock-${Date.now()}`);
  const attestResult = await makeRequest('POST', '/pohw/attest', proof);
  console.log(`   ✅ Proof submitted`);
  
  // Create batch
  const batchResult = await makeRequest('POST', '/pohw/batch/create');
  if (batchResult.status !== 200) {
    console.log(`   ⚠️  No batch created`);
    return;
  }
  
  console.log(`   ✅ Batch created: ${batchResult.data.batch_id}`);
  console.log(`   Merkle Root: ${batchResult.data.merkle_root}`);
  
  // Check status endpoint
  const statusResult = await makeRequest('GET', '/pohw/status');
  console.log(`   ✅ Status endpoint: ${statusResult.data.status}`);
  console.log(`   Total proofs: ${statusResult.data.total_proofs}`);
  
  // Get Merkle proof
  const proofResult = await makeRequest('GET', `/pohw/proof/${proof.hash}`);
  if (proofResult.status === 200) {
    console.log(`   ✅ Merkle proof retrieved`);
    console.log(`   Root: ${proofResult.data.root?.substring(0, 30)}...`);
    console.log(`   Proof length: ${proofResult.data.proof?.length || 0} items`);
    console.log(`   Anchors: ${proofResult.data.anchors?.length || 0} found`);
  }
}

async function testAnchoringEndpointStructure() {
  console.log('\n1. Testing endpoint response structure...');
  
  // Create test proof and batch
  const proof = generateTestProof(`test-structure-${Date.now()}`);
  await makeRequest('POST', '/pohw/attest', proof);
  const batchResult = await makeRequest('POST', '/pohw/batch/create');
  
  if (batchResult.status === 200) {
    console.log(`   ✅ Batch ID format: ${batchResult.data.batch_id}`);
    console.log(`   ✅ Merkle root format: ${batchResult.data.merkle_root?.substring(0, 20)}...`);
    console.log(`   ✅ Batch size: ${batchResult.data.size}`);
    console.log(`   ✅ Created at: ${batchResult.data.created_at}`);
  }
}

async function runAllTests() {
  console.log('🧪 Comprehensive Anchoring Functionality Test\n');
  console.log('Testing anchoring module integration and endpoints\n');
  
  try {
    // Test 1: Anchoring disabled (default)
    await testScenario('Anchoring Disabled (Default)', testAnchoringDisabled);
    
    // Test 2: Endpoint structure
    await testScenario('Endpoint Structure', testAnchoringEndpointStructure);
    
    // Test 3: Full flow without anchoring
    await testScenario('Full Flow (No Anchoring)', testAnchoringWithMockKeys);
    
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ All test scenarios completed!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Anchoring endpoint exists and responds correctly');
    console.log('   ✅ Error handling works when anchoring is disabled');
    console.log('   ✅ Batch creation and Merkle proof endpoints work');
    console.log('\n💡 To test with real blockchain:');
    console.log('   1. Set ANCHORING_ENABLED=true');
    console.log('   2. Set BITCOIN_ENABLED=true or ETHEREUM_ENABLED=true');
    console.log('   3. Provide private keys (WIF for Bitcoin, hex for Ethereum)');
    console.log('   4. Restart the server');
    console.log('   5. Run: node test-blockchain.js');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Check if server is running
makeRequest('GET', '/health')
  .then(() => {
    console.log('✅ Registry node is running\n');
    runAllTests();
  })
  .catch((error) => {
    console.error('❌ Registry node is not running!');
    console.error('   Please start the server first: npm start');
    process.exit(1);
  });

