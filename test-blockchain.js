/**
 * Test Real Blockchain Anchoring
 * Tests anchoring with Bitcoin testnet and Ethereum Sepolia
 * 
 * NOTE: This requires testnet coins and private keys
 */

const http = require('http');

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

async function testBlockchainAnchoring() {
  console.log('🔗 Testing Real Blockchain Anchoring\n');
  console.log('='.repeat(70));
  console.log('\n⚠️  NOTE: This test requires:');
  console.log('   1. ANCHORING_ENABLED=true');
  console.log('   2. Private keys for Bitcoin testnet and/or Ethereum Sepolia');
  console.log('   3. Testnet coins (from faucets)');
  console.log('   4. RPC endpoints (or use public RPC)\n');

  try {
    // Check if anchoring is enabled
    console.log('1. Checking anchoring configuration...');
    const status = await makeRequest('GET', '/pohw/status');
    console.log('   Registry status:', status.data.status);

    // Create a test batch
    console.log('\n2. Creating test batch...');
    const batchResult = await makeRequest('POST', '/pohw/batch/create');
    
    if (batchResult.status !== 200) {
      console.log('   ⚠️  No pending proofs to batch');
      console.log('   Creating test proof first...');
      
      // Create a test proof
      const crypto = require('crypto');
      const testProof = {
        hash: '0x' + crypto.createHash('sha256').update('blockchain-test').digest('hex'),
        signature: crypto.createHash('sha256').update('sig-blockchain-test').digest('hex'),
        did: 'did:pohw:test:blockchain',
        timestamp: new Date().toISOString()
      };
      
      await makeRequest('POST', '/pohw/attest', testProof);
      console.log('   ✅ Test proof created');
      
      // Create batch again
      const batchResult2 = await makeRequest('POST', '/pohw/batch/create');
      if (batchResult2.status === 200) {
        console.log('   ✅ Batch created');
        console.log(`   Batch ID: ${batchResult2.data.batch_id}`);
        console.log(`   Merkle Root: ${batchResult2.data.merkle_root}`);
        
        // Test anchoring
        console.log('\n3. Testing blockchain anchoring...');
        const anchorResult = await makeRequest('POST', `/pohw/batch/anchor/${batchResult2.data.batch_id}`);
        
        if (anchorResult.status === 200) {
          console.log('   ✅ Anchoring successful!');
          console.log('\n   Anchor Results:');
          anchorResult.data.anchors.forEach((anchor, i) => {
            console.log(`\n   ${i + 1}. ${anchor.chain.toUpperCase()}:`);
            console.log(`      Success: ${anchor.success}`);
            if (anchor.success) {
              console.log(`      Transaction: ${anchor.txHash}`);
              if (anchor.blockNumber) {
                console.log(`      Block: ${anchor.blockNumber}`);
              }
            } else {
              console.log(`      Error: ${anchor.error}`);
            }
          });
        } else {
          console.log(`   ⚠️  Anchoring status: ${anchorResult.status}`);
          console.log(`   Response: ${JSON.stringify(anchorResult.data, null, 2)}`);
        }
      }
    } else {
      console.log('   ✅ Batch already exists');
      console.log(`   Batch ID: ${batchResult.data.batch_id}`);
      
      // Test anchoring
      console.log('\n3. Testing blockchain anchoring...');
      const anchorResult = await makeRequest('POST', `/pohw/batch/anchor/${batchResult.data.batch_id}`);
      
      if (anchorResult.status === 200) {
        console.log('   ✅ Anchoring endpoint works');
        console.log('\n   Anchor Results:');
        anchorResult.data.anchors.forEach((anchor, i) => {
          console.log(`\n   ${i + 1}. ${anchor.chain.toUpperCase()}:`);
          console.log(`      Success: ${anchor.success}`);
          if (anchor.success) {
            console.log(`      Transaction: ${anchor.txHash}`);
            if (anchor.blockNumber) {
              console.log(`      Block: ${anchor.blockNumber}`);
            }
          } else {
            console.log(`      Error: ${anchor.error}`);
          }
        });
      } else {
        console.log(`   ⚠️  Anchoring status: ${anchorResult.status}`);
        console.log(`   Response: ${JSON.stringify(anchorResult.data, null, 2)}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Blockchain anchoring test completed!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Get testnet coins:');
    console.log('      - Bitcoin testnet: https://testnet-faucet.mempool.co/');
    console.log('      - Ethereum Sepolia: https://sepoliafaucet.com/');
    console.log('   2. Generate testnet wallets');
    console.log('   3. Set environment variables with private keys');
    console.log('   4. Test on testnets before mainnet');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testBlockchainAnchoring();

