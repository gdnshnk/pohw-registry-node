/**
 * Test Both Bitcoin and Ethereum Anchoring
 * Comprehensive test for multi-chain anchoring
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

async function testBothChains() {
  console.log('\n' + '='.repeat(80));
  console.log('🔗 COMPREHENSIVE MULTI-CHAIN ANCHORING TEST');
  console.log('='.repeat(80) + '\n');

  try {
    // Check server status
    console.log('1. Checking server configuration...');
    const status = await makeRequest('GET', '/pohw/status');
    console.log(`   ✅ Server is running`);
    console.log(`   Status: ${status.data.status}`);
    console.log(`   Total proofs: ${status.data.total_proofs}`);

    // Create test proof
    console.log('\n2. Creating test proof...');
    const proof = generateTestProof(`multi-chain-test-${Date.now()}`);
    const attestResult = await makeRequest('POST', '/pohw/attest', proof);
    
    if (attestResult.status === 201) {
      console.log(`   ✅ Proof submitted: ${proof.hash.substring(0, 30)}...`);
    } else {
      console.log(`   ❌ Proof submission failed: ${attestResult.status}`);
      return;
    }

    // Create batch
    console.log('\n3. Creating batch...');
    const batchResult = await makeRequest('POST', '/pohw/batch/create');
    
    if (batchResult.status !== 200) {
      console.log(`   ❌ Batch creation failed: ${batchResult.status}`);
      console.log(JSON.stringify(batchResult.data, null, 2));
      return;
    }
    
    console.log(`   ✅ Batch created`);
    console.log(`   Batch ID: ${batchResult.data.batch_id}`);
    console.log(`   Merkle Root: ${batchResult.data.merkle_root}`);
    
    const batchId = batchResult.data.batch_id;

    // Test anchoring to both chains
    console.log('\n4. Testing multi-chain anchoring...');
    console.log('   ⚠️  This will create REAL transactions on both blockchains!');
    console.log('   - Bitcoin testnet: ~2250 satoshis');
    console.log('   - Ethereum Sepolia: ~0.0001-0.001 ETH\n');
    
    const anchorResult = await makeRequest('POST', `/pohw/batch/anchor/${batchId}`);
    
    if (anchorResult.status === 200) {
      console.log(`   ✅ Anchoring completed!`);
      console.log(`\n   Results Summary:`);
      
      const bitcoinAnchor = anchorResult.data.anchors.find(a => a.chain === 'bitcoin');
      const ethereumAnchor = anchorResult.data.anchors.find(a => a.chain === 'ethereum');
      
      if (bitcoinAnchor) {
        console.log(`\n   📍 BITCOIN:`);
        console.log(`      Success: ${bitcoinAnchor.success ? '✅ YES' : '❌ NO'}`);
        if (bitcoinAnchor.success) {
          console.log(`      Transaction: ${bitcoinAnchor.txHash}`);
          if (bitcoinAnchor.blockNumber) {
            console.log(`      Block: ${bitcoinAnchor.blockNumber}`);
          }
          console.log(`      🔗 https://blockstream.info/testnet/tx/${bitcoinAnchor.txHash}`);
        } else {
          console.log(`      Error: ${bitcoinAnchor.error}`);
        }
      } else {
        console.log(`\n   📍 BITCOIN: ⚠️  Not configured or failed`);
      }
      
      if (ethereumAnchor) {
        console.log(`\n   📍 ETHEREUM:`);
        console.log(`      Success: ${ethereumAnchor.success ? '✅ YES' : '❌ NO'}`);
        if (ethereumAnchor.success) {
          console.log(`      Transaction: ${ethereumAnchor.txHash}`);
          if (ethereumAnchor.blockNumber) {
            console.log(`      Block: ${ethereumAnchor.blockNumber}`);
          }
          console.log(`      🔗 https://sepolia.etherscan.io/tx/${ethereumAnchor.txHash}`);
        } else {
          console.log(`      Error: ${ethereumAnchor.error}`);
        }
      } else {
        console.log(`\n   📍 ETHEREUM: ⚠️  Not configured or failed`);
      }
      
      const successCount = anchorResult.data.anchors.filter(a => a.success).length;
      const totalCount = anchorResult.data.anchors.length;
      
      console.log(`\n   📊 Summary: ${successCount}/${totalCount} chains anchored successfully`);
      
      if (anchorResult.data.stored_anchors && anchorResult.data.stored_anchors.length > 0) {
        console.log(`   ✅ ${anchorResult.data.stored_anchors.length} anchor(s) stored in database`);
      }
    } else {
      console.log(`   ❌ Anchoring failed: ${anchorResult.status}`);
      console.log(JSON.stringify(anchorResult.data, null, 2));
    }

    // Get Merkle proof with anchors
    console.log('\n5. Retrieving Merkle proof with anchors...');
    const proofResult = await makeRequest('GET', `/pohw/proof/${proof.hash}`);
    
    if (proofResult.status === 200) {
      console.log(`   ✅ Merkle proof retrieved`);
      if (proofResult.data.anchors && proofResult.data.anchors.length > 0) {
        console.log(`   🔗 Anchors found: ${proofResult.data.anchors.length}`);
        proofResult.data.anchors.forEach((anchor, i) => {
          console.log(`      ${i + 1}. ${anchor.chain.toUpperCase()}: ${anchor.tx?.substring(0, 20)}...`);
        });
      } else {
        console.log(`   ℹ️  No anchors in proof yet`);
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL STATUS');
    console.log('='.repeat(80));
    
    if (anchorResult.status === 200) {
      const allSuccess = anchorResult.data.anchors.every(a => a.success);
      if (allSuccess && anchorResult.data.anchors.length > 0) {
        console.log('\n✅ ALL CHAINS WORKING PERFECTLY!');
        console.log('   Both Bitcoin and Ethereum anchoring are operational.');
      } else {
        console.log('\n⚠️  PARTIAL SUCCESS');
        console.log('   Some chains may need configuration or have errors.');
        anchorResult.data.anchors.forEach(anchor => {
          if (!anchor.success) {
            console.log(`   - ${anchor.chain}: ${anchor.error}`);
          }
        });
      }
    } else {
      console.log('\n❌ ANCHORING FAILED');
      console.log('   Check configuration and try again.');
    }

    console.log('\n' + '='.repeat(80) + '\n');

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
    testBothChains();
  })
  .catch((error) => {
    console.error('❌ Registry node is not running!');
    console.error('   Please start the server first.');
    process.exit(1);
  });

