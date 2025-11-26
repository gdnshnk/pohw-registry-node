/**
 * Test Blockchain Anchoring
 * Tests the anchoring functionality
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

async function testAnchoring() {
  console.log('🔗 Testing Blockchain Anchoring\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Create test proofs
    console.log('\n1. Creating test proofs...');
    const proofHashes = [];
    
    for (let i = 0; i < 3; i++) {
      const proof = generateTestProof(`anchor-test-${i}-${Date.now()}`);
      const result = await makeRequest('POST', '/pohw/attest', proof);
      if (result.status === 201) {
        console.log(`   ✅ Proof ${i + 1} submitted`);
        proofHashes.push(proof.hash);
      }
    }

    // Step 2: Create batch
    console.log('\n2. Creating batch...');
    const batchResult = await makeRequest('POST', '/pohw/batch/create');
    
    if (batchResult.status !== 200) {
      console.log(`   ❌ Batch creation failed: ${batchResult.status}`);
      return;
    }
    
    console.log(`   ✅ Batch created`);
    console.log(`   Batch ID: ${batchResult.data.batch_id}`);
    console.log(`   Merkle Root: ${batchResult.data.merkle_root}`);

    // Step 3: Test anchoring (will fail if not configured, but tests the endpoint)
    console.log('\n3. Testing anchoring endpoint...');
    const anchorResult = await makeRequest('POST', `/pohw/batch/anchor/${batchResult.data.batch_id}`);
    
    if (anchorResult.status === 200) {
      console.log(`   ✅ Anchoring endpoint works`);
      console.log(`   Anchors: ${JSON.stringify(anchorResult.data.anchors, null, 2)}`);
    } else if (anchorResult.status === 400) {
      console.log(`   ⚠️  Anchoring not enabled (expected in default config)`);
      console.log(`   Message: ${anchorResult.data.error}`);
      console.log(`   ℹ️  To enable: Set ANCHORING_ENABLED=true and configure blockchain settings`);
    } else {
      console.log(`   ⚠️  Anchoring status: ${anchorResult.status}`);
      console.log(`   Response: ${JSON.stringify(anchorResult.data)}`);
    }

    // Step 4: Get Merkle proof with anchors
    console.log('\n4. Retrieving Merkle proof with anchors...');
    const merkleResult = await makeRequest('GET', `/pohw/proof/${proofHashes[0]}`);
    
    if (merkleResult.status === 200) {
      console.log(`   ✅ Merkle proof retrieved`);
      console.log(`   Root: ${merkleResult.data.root?.substring(0, 20)}...`);
      if (merkleResult.data.anchors && merkleResult.data.anchors.length > 0) {
        console.log(`   🔗 Anchors: ${merkleResult.data.anchors.length} found`);
        merkleResult.data.anchors.forEach((anchor, i) => {
          console.log(`      ${i + 1}. ${anchor.chain}: ${anchor.tx?.substring(0, 20)}...`);
        });
      } else {
        console.log(`   ℹ️  No anchors yet (anchoring may not be enabled)`);
      }
    } else {
      console.log(`   ❌ Failed to get Merkle proof: ${merkleResult.status}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Anchoring test completed!');
    console.log('\nℹ️  Note: Anchoring is currently using mock transactions.');
    console.log('   For real blockchain anchoring, configure:');
    console.log('   - ANCHORING_ENABLED=true');
    console.log('   - BITCOIN_ENABLED=true (optional)');
    console.log('   - ETHEREUM_ENABLED=true (optional)');
    console.log('   - Private keys and RPC URLs');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAnchoring();

