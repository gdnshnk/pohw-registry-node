/**
 * Test Merkle Proof Retrieval
 * Tests getting Merkle proofs for proofs in a batch
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

async function testMerkleProofs() {
  console.log('🌳 Testing Merkle Proof Retrieval\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Create a few proofs
    console.log('\n1. Creating test proofs...');
    const proofHashes = [];
    
    for (let i = 0; i < 3; i++) {
      const content = `merkle-test-${i}-${Date.now()}`;
      const hash = '0x' + crypto.createHash('sha256').update(content).digest('hex');
      const proof = {
        hash,
        signature: crypto.createHash('sha256').update(`sig-${content}`).digest('hex'),
        did: `did:pohw:test:${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date().toISOString()
      };
      
      const result = await makeRequest('POST', '/pohw/attest', proof);
      if (result.status === 201) {
        console.log(`   ✅ Proof ${i + 1} submitted: ${hash.substring(0, 20)}...`);
        proofHashes.push(hash);
      }
    }

    if (proofHashes.length === 0) {
      console.log('   ⚠️  No proofs created');
      return;
    }

    // Step 2: Create batch
    console.log('\n2. Creating batch...');
    const batchResult = await makeRequest('POST', '/pohw/batch/create');
    
    if (batchResult.status !== 200) {
      console.log(`   ❌ Batch creation failed: ${batchResult.status}`);
      return;
    }
    
    console.log(`   ✅ Batch created`);
    console.log(`   Merkle Root: ${batchResult.data.merkle_root}`);
    console.log(`   Batch Size: ${batchResult.data.size}`);

    // Step 3: Get Merkle proof for each proof
    console.log('\n3. Retrieving Merkle proofs...');
    for (let i = 0; i < proofHashes.length; i++) {
      const hash = proofHashes[i];
      console.log(`\n   Proof ${i + 1}: ${hash.substring(0, 20)}...`);
      
      const merkleResult = await makeRequest('GET', `/pohw/proof/${hash}`);
      
      if (merkleResult.status === 200) {
        console.log(`   ✅ Merkle proof retrieved`);
        console.log(`      Root: ${merkleResult.data.root?.substring(0, 20)}...`);
        console.log(`      Proof path length: ${merkleResult.data.proof?.length || 0}`);
        if (merkleResult.data.proof && merkleResult.data.proof.length > 0) {
          console.log(`      First proof element: ${merkleResult.data.proof[0].substring(0, 20)}...`);
        }
      } else {
        console.log(`   ❌ Failed to get Merkle proof: ${merkleResult.status}`);
        console.log(`      Error: ${merkleResult.data.error || 'Unknown'}`);
      }
    }

    // Step 4: Verify a proof
    console.log('\n4. Verifying proof with Merkle data...');
    const verifyResult = await makeRequest('GET', `/pohw/verify/${proofHashes[0]}`);
    
    if (verifyResult.status === 200 && verifyResult.data.valid) {
      console.log(`   ✅ Proof verified`);
      console.log(`      Signer: ${verifyResult.data.signer}`);
      if (verifyResult.data.merkle_root) {
        console.log(`      Merkle Root: ${verifyResult.data.merkle_root.substring(0, 20)}...`);
      }
      if (verifyResult.data.merkle_proof) {
        console.log(`      Merkle Proof: ${verifyResult.data.merkle_proof.length} elements`);
      }
    } else {
      console.log(`   ❌ Verification failed`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Merkle proof test completed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testMerkleProofs();

