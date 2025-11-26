/**
 * Create Complete Test Proof with Fake PAV Data
 * 
 * Creates a test proof with all PAV fields populated for testing
 * the verification interface with complete data.
 * 
 * ⚠️ WARNING: This is FAKE data for testing only!
 */

const { createHash, randomBytes } = require('crypto');
const http = require('http');
const https = require('https');

// Configuration
const REGISTRY_URL = process.env.REGISTRY_URL || 'http://localhost:3000';
const TEST_DID = 'did:pohw:test:complete-test-user';

/**
 * Simple HTTP request helper
 */
function httpRequest(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data && method !== 'GET') {
      const body = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = client.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = responseData ? JSON.parse(responseData) : {};
            resolve(json);
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Generate fake content hash
 */
function generateTestHash() {
  const fakeContent = `Complete Test Proof - PoHW Verification Interface Test
Created: ${new Date().toISOString()}
This is comprehensive test data with all PAV fields populated.
Content: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
Duis aute irure dolor in reprehenderit in voluptate velit esse.
Test data includes: process digest, entropy proof, temporal coherence,
compound hash, merkle inclusion, and all PAV ontology fields.`;
  
  const hash = createHash('sha256')
    .update(fakeContent)
    .digest('hex');
  
  return '0x' + hash;
}

/**
 * Generate fake signature
 */
function generateTestSignature(hash, did) {
  const signatureData = `${hash}-${did}-${Date.now()}`;
  const signature = createHash('sha256')
    .update(signatureData)
    .digest('hex');
  
  return '0x' + signature;
}

/**
 * Create complete test proof with all PAV fields
 */
async function createCompleteTestProof() {
  console.log('=== Creating Complete Test Proof with Fake PAV Data ===\n');
  console.log('⚠️  WARNING: This is FAKE data for testing only!\n');

  // Generate test data
  const hash = generateTestHash();
  const signature = generateTestSignature(hash, TEST_DID);
  const timestamp = new Date().toISOString();

  // Generate fake process metrics (human-like)
  const processMetrics = {
    duration: 125000, // 125 seconds (2+ minutes)
    entropy: 8.2, // High entropy (human-like)
    temporalCoherence: 0.92, // High coherence
    inputEvents: 450, // Many input events
    meetsThresholds: true
  };

  // Generate process digest
  const processData = JSON.stringify(processMetrics);
  const processDigest = '0x' + createHash('sha256')
    .update(processData)
    .digest('hex');

  // Generate compound hash (content + process)
  const compoundHash = '0x' + createHash('sha256')
    .update(hash + processDigest)
    .digest('hex');

  // Generate fake entropy proof
  const entropyProof = `zkp:entropy>${processMetrics.entropy.toFixed(3)}`;

  // Generate fake temporal coherence
  const temporalCoherence = `zkp:coherence>${processMetrics.temporalCoherence.toFixed(3)}`;

  console.log('Test Proof Details:');
  console.log(`  Hash: ${hash}`);
  console.log(`  DID: ${TEST_DID}`);
  console.log(`  Signature: ${signature.substring(0, 20)}...`);
  console.log(`  Timestamp: ${timestamp}`);
  console.log(`  Process Digest: ${processDigest.substring(0, 20)}...`);
  console.log(`  Compound Hash: ${compoundHash.substring(0, 20)}...`);
  console.log(`  Entropy: ${processMetrics.entropy}`);
  console.log(`  Temporal Coherence: ${processMetrics.temporalCoherence}`);
  console.log(`  Duration: ${(processMetrics.duration / 1000).toFixed(1)}s`);
  console.log(`  Input Events: ${processMetrics.inputEvents}\n`);

  // Prepare attestation request with all fields
  const request = {
    hash: hash,
    signature: signature,
    did: TEST_DID,
    timestamp: timestamp,
    processDigest: processDigest,
    compoundHash: compoundHash,
    processMetrics: processMetrics,
    assistanceProfile: 'human-only' // Human-authored
  };

  // Submit to registry
  console.log('Submitting complete test proof to registry...');
  try {
    const receipt = await httpRequest('POST', `${REGISTRY_URL}/pohw/attest`, request);
    console.log('✅ Complete test proof submitted successfully!');
    console.log(`  Receipt Hash: ${receipt.receipt_hash}\n`);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify the proof was stored and get PAV claim
    console.log('Fetching PAV claim...');
    try {
      const pavClaim = await httpRequest('GET', `${REGISTRY_URL}/pohw/claim/${hash.substring(2)}?format=pav`);
      
      if (pavClaim) {
        console.log('✅ PAV Claim Retrieved:');
        console.log(`  Verification Tier: ${pavClaim['pav:verificationTier'] || 'Grey'}`);
        console.log(`  Assistance Profile: ${pavClaim['pav:assistanceProfile'] || 'human-only'}`);
        console.log(`  Process Digest: ${pavClaim['pav:processDigest'] ? 'Present' : 'Missing'}`);
        console.log(`  Entropy Proof: ${pavClaim['pav:entropyProof'] || 'Not set'}`);
        console.log(`  Temporal Coherence: ${pavClaim['pav:temporalCoherence'] || 'Not set'}`);
        console.log(`  Compound Hash: ${pavClaim['pav:compoundHash'] ? 'Present' : 'Missing'}`);
        console.log(`  Registry Anchor: ${pavClaim['pav:registryAnchor'] || 'Not set'}\n`);
      }
    } catch (error) {
      console.log('⚠️  PAV claim not yet available (may need batching)');
    }

    console.log('=== Complete Test Proof Created Successfully ===\n');
    console.log('You can now test this proof on the verification interface:');
    console.log(`  http://localhost:8000\n`);
    console.log(`Test Hash: ${hash}`);
    console.log(`\nThis proof includes:`);
    console.log(`  ✅ Process Digest (human activity evidence)`);
    console.log(`  ✅ Entropy Proof (input randomness)`);
    console.log(`  ✅ Temporal Coherence (human timing patterns)`);
    console.log(`  ✅ Compound Hash (content + process)`);
    console.log(`  ✅ Process Metrics (duration, entropy, coherence)`);
    console.log(`  ✅ All PAV ontology fields\n`);

    return {
      hash,
      did: TEST_DID,
      receipt,
      success: true
    };

  } catch (error) {
    console.error('❌ Failed to create complete test proof:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n⚠️  Registry server is not running!');
      console.error('   Start the registry with: cd pohw-registry-node && npm start\n');
    } else if (error.message.includes('429')) {
      console.error('\n⚠️  Rate limit exceeded. Wait a few seconds and try again.\n');
    }
    return {
      hash,
      did: TEST_DID,
      success: false,
      error: error.message
    };
  }
}

// Main execution
if (require.main === module) {
  createCompleteTestProof().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { createCompleteTestProof, generateTestHash, TEST_DID };

