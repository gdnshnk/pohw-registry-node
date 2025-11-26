/**
 * Test Real Bitcoin Testnet Anchoring
 * This tests anchoring with your actual wallet and testnet coins
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

async function testRealAnchoring() {
  console.log('🔗 Testing Real Bitcoin Testnet Anchoring\n');
  console.log('='.repeat(70));
  console.log('\n⚠️  Prerequisites:');
  console.log('   1. Server must be running with ANCHORING_ENABLED=true');
  console.log('   2. BITCOIN_ENABLED=true');
  console.log('   3. BITCOIN_PRIVATE_KEY set');
  console.log('   4. Wallet has testnet coins\n');

  try {
    // Check server status
    console.log('1. Checking server status...');
    const status = await makeRequest('GET', '/pohw/status');
    console.log(`   ✅ Server is running`);
    console.log(`   Status: ${status.data.status}`);
    console.log(`   Total proofs: ${status.data.total_proofs}`);

    // Create test proof
    console.log('\n2. Creating test proof...');
    const proof = generateTestProof(`real-anchor-test-${Date.now()}`);
    const attestResult = await makeRequest('POST', '/pohw/attest', proof);
    
    if (attestResult.status === 201) {
      console.log(`   ✅ Proof submitted: ${proof.hash.substring(0, 20)}...`);
    } else {
      console.log(`   ⚠️  Proof submission: ${attestResult.status}`);
    }

    // Create batch
    console.log('\n3. Creating batch...');
    const batchResult = await makeRequest('POST', '/pohw/batch/create');
    
    if (batchResult.status !== 200) {
      console.log(`   ⚠️  Batch creation: ${batchResult.status}`);
      if (batchResult.data.error) {
        console.log(`   Message: ${batchResult.data.error}`);
      }
      return;
    }
    
    console.log(`   ✅ Batch created`);
    console.log(`   Batch ID: ${batchResult.data.batch_id}`);
    console.log(`   Merkle Root: ${batchResult.data.merkle_root}`);
    console.log(`   Size: ${batchResult.data.size} proofs`);

    // Test anchoring
    console.log('\n4. Testing REAL blockchain anchoring...');
    console.log('   ⚠️  This will create a REAL transaction on Bitcoin testnet!');
    console.log('   ⚠️  It will cost ~2250 satoshis in fees\n');
    
    const batchId = batchResult.data.batch_id;
    const anchorResult = await makeRequest('POST', `/pohw/batch/anchor/${batchId}`);
    
    if (anchorResult.status === 200) {
      console.log(`   ✅ Anchoring successful!`);
      console.log(`\n   Anchor Results:`);
      anchorResult.data.anchors.forEach((anchor, i) => {
        console.log(`\n   ${i + 1}. ${anchor.chain.toUpperCase()}:`);
        console.log(`      Success: ${anchor.success}`);
        if (anchor.success) {
          console.log(`      Transaction Hash: ${anchor.txHash}`);
          if (anchor.blockNumber) {
            console.log(`      Block Number: ${anchor.blockNumber}`);
          }
          console.log(`      Timestamp: ${anchor.timestamp}`);
          console.log(`\n      🔗 View on explorer:`);
          if (anchor.chain === 'bitcoin') {
            console.log(`         https://blockstream.info/testnet/tx/${anchor.txHash}`);
          }
        } else {
          console.log(`      Error: ${anchor.error}`);
        }
      });
      
      if (anchorResult.data.stored_anchors && anchorResult.data.stored_anchors.length > 0) {
        console.log(`\n   ✅ Anchors stored in database: ${anchorResult.data.stored_anchors.length}`);
      }
    } else if (anchorResult.status === 400) {
      console.log(`   ❌ Anchoring not enabled or misconfigured`);
      console.log(`   Response: ${JSON.stringify(anchorResult.data, null, 2)}`);
      console.log(`\n   💡 Make sure you:`);
      console.log(`      1. Set ANCHORING_ENABLED=true`);
      console.log(`      2. Set BITCOIN_ENABLED=true`);
      console.log(`      3. Set BITCOIN_PRIVATE_KEY=your_wif_key`);
      console.log(`      4. Restarted the server`);
    } else {
      console.log(`   ⚠️  Unexpected status: ${anchorResult.status}`);
      console.log(`   Response: ${JSON.stringify(anchorResult.data, null, 2)}`);
    }

    // Get Merkle proof with anchors
    console.log('\n5. Retrieving Merkle proof with anchors...');
    const proofResult = await makeRequest('GET', `/pohw/proof/${proof.hash}`);
    
    if (proofResult.status === 200) {
      console.log(`   ✅ Merkle proof retrieved`);
      if (proofResult.data.anchors && proofResult.data.anchors.length > 0) {
        console.log(`   🔗 Anchors found: ${proofResult.data.anchors.length}`);
        proofResult.data.anchors.forEach((anchor, i) => {
          console.log(`      ${i + 1}. ${anchor.chain}: tx ${anchor.tx?.substring(0, 20)}...`);
        });
      } else {
        console.log(`   ℹ️  No anchors in proof (may need to wait for confirmation)`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Real anchoring test completed!');
    console.log('\n📝 Next Steps:');
    console.log('   - Check transaction on block explorer');
    console.log('   - Verify anchors are stored in database');
    console.log('   - Test with more batches');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Check if server is running
makeRequest('GET', '/health')
  .then(() => {
    console.log('✅ Registry node is running\n');
    testRealAnchoring();
  })
  .catch((error) => {
    console.error('❌ Registry node is not running!');
    console.error('   Please start the server first: npm start');
    console.error('   Make sure to set environment variables first!');
    process.exit(1);
  });

