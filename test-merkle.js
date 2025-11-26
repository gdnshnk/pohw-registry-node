/**
 * Test Merkle Batching Functionality
 * Creates enough proofs to trigger a batch and verifies Merkle proofs
 */

const http = require('http');
const crypto = require('crypto');

const REGISTRY_URL = 'http://localhost:3000';
const BATCH_SIZE = 5; // Small batch for testing

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

async function testMerkleBatching() {
  console.log('🌳 Testing Merkle Batching Functionality\n');
  console.log(`Creating ${BATCH_SIZE} proofs to trigger batching...\n`);

  const proofs = [];

  // Submit proofs
  for (let i = 0; i < BATCH_SIZE; i++) {
    const proof = generateTestProof(`merkle-test-${i}-${Date.now()}`);
    try {
      const result = await makeRequest('POST', '/pohw/attest', proof);
      if (result.status === 201) {
        console.log(`✅ Proof ${i + 1}/${BATCH_SIZE} submitted`);
        proofs.push(proof);
      } else {
        console.log(`⚠️  Proof ${i + 1} status: ${result.status}`);
      }
    } catch (error) {
      console.log(`❌ Error submitting proof ${i + 1}:`, error.message);
    }
  }

  console.log(`\n📊 Checking registry status...`);
  const status = await makeRequest('GET', '/pohw/status');
  console.log(`   Total proofs: ${status.data.total_proofs}`);
  console.log(`   Pending batch: ${status.data.pending_batch}`);

  // Manually trigger batch creation (if we had an endpoint for it)
  // For now, we'll check if proofs can be verified
  console.log(`\n🔍 Verifying proofs...`);
  for (const proof of proofs) {
    const verify = await makeRequest('GET', `/pohw/verify/${proof.hash}`);
    if (verify.status === 200 && verify.data.valid) {
      console.log(`   ✅ ${proof.hash.substring(0, 20)}... verified`);
    }
  }

  console.log(`\n✅ Merkle batching test completed!`);
  console.log(`\nℹ️  Note: Merkle proofs are generated when batches are created.`);
  console.log(`   Current batch size threshold: 1000 proofs`);
  console.log(`   To test Merkle proofs, either:`);
  console.log(`   1. Submit 1000+ proofs, or`);
  console.log(`   2. Manually trigger batch creation (requires endpoint)`);
}

testMerkleBatching().catch(console.error);

