/**
 * Create Test Proof for Verification Interface
 * 
 * Generates a test proof with fake data and submits it to the registry
 * for testing the verification interface.
 */

const { createHash, randomBytes } = require('crypto');
const http = require('http');
const https = require('https');

// Configuration
const REGISTRY_URL = process.env.REGISTRY_URL || 'http://localhost:3000';
const TEST_DID = 'did:pohw:test:verification-test-user';

/**
 * Generate a test hash from fake content
 */
function generateTestHash() {
  const fakeContent = `This is test content for PoHW verification interface.
Created at: ${new Date().toISOString()}
This is NOT a real proof - it's test data only.
Content: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`;
  
  const hash = createHash('sha256')
    .update(fakeContent)
    .digest('hex');
  
  return '0x' + hash;
}

/**
 * Generate a fake signature (for testing only)
 * In production, this would be a real cryptographic signature
 */
function generateTestSignature(hash, did) {
  // Create a deterministic "signature" for testing
  // This is NOT cryptographically secure - just for testing
  const signatureData = `${hash}-${did}-${Date.now()}`;
  const signature = createHash('sha256')
    .update(signatureData)
    .digest('hex');
  
  return '0x' + signature;
}

/**
 * Submit test proof to registry
 */
async function createTestProof(options = {}) {
  const {
    withCredentials = false,
    tier = 'grey',
    assistanceProfile = 'human-only',
    includeProcessDigest = false
  } = options;

  console.log('=== Creating Test Proof for Verification Interface ===\n');

  // Generate test data
  const hash = generateTestHash();
  const signature = generateTestSignature(hash, TEST_DID);
  const timestamp = new Date().toISOString();

  console.log('Test Proof Details:');
  console.log(`  Hash: ${hash}`);
  console.log(`  DID: ${TEST_DID}`);
  console.log(`  Signature: ${signature.substring(0, 20)}...`);
  console.log(`  Timestamp: ${timestamp}`);
  console.log(`  Tier: ${tier}`);
  console.log(`  Assistance Profile: ${assistanceProfile}\n`);

  // Prepare attestation request
  const request = {
    hash: hash,
    signature: signature,
    did: TEST_DID,
    timestamp: timestamp,
    assistanceProfile: assistanceProfile
  };

  // Add process digest if requested
  if (includeProcessDigest) {
    // Generate fake process metrics
    const processMetrics = {
      duration: 45000, // 45 seconds
      entropy: 7.5,
      temporalCoherence: 0.85,
      inputEvents: 120,
      meetsThresholds: true
    };

    // Generate process digest
    const processData = JSON.stringify(processMetrics);
    const processDigest = '0x' + createHash('sha256')
      .update(processData)
      .digest('hex');

    request.processDigest = processDigest;
    request.processMetrics = processMetrics;
    request.compoundHash = '0x' + createHash('sha256')
      .update(hash + processDigest)
      .digest('hex');

    console.log('  Process Digest: ' + processDigest.substring(0, 20) + '...');
    console.log('  Compound Hash: ' + request.compoundHash.substring(0, 20) + '...\n');
  }

  // If credentials are needed, issue them first
  if (withCredentials) {
    console.log('Issuing mock credentials...');
    try {
      // Note: This assumes the registry has mock attestors initialized
      // In a real scenario, you'd call the attestor API to issue credentials
      console.log('  (Credentials should be issued via attestor API)\n');
    } catch (error) {
      console.warn('  Warning: Could not issue credentials:', error.message);
    }
  }

  // Submit to registry
  console.log('Submitting proof to registry...');
  try {
    const receipt = await httpRequest('POST', `${REGISTRY_URL}/pohw/attest`, request);
    console.log('✅ Proof submitted successfully!');
    console.log(`  Receipt Hash: ${receipt.receipt_hash}\n`);

    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify the proof was stored
    console.log('Verifying proof was stored...');
    try {
      const pavClaim = await httpRequest('GET', `${REGISTRY_URL}/pohw/claim/${hash.substring(2)}?format=pav`);
      
      if (pavClaim) {
        console.log('✅ Proof verified and retrievable!');
        console.log(`  Verification Tier: ${pavClaim['pav:verificationTier'] || 'Grey'}`);
        console.log(`  Assistance Profile: ${pavClaim['pav:assistanceProfile'] || 'human-only'}\n`);
      }
    } catch (error) {
      console.log('⚠️  Proof submitted but not yet available for verification (may need batching)');
      console.log('   This is normal - the proof will be available after batching.\n');
    }

    console.log('=== Test Proof Created Successfully ===\n');
    console.log('You can now test this proof on the verification interface:');
    console.log(`  ${REGISTRY_URL.replace('localhost:3000', 'proofofhumanwork.org')}/verify/`);
    console.log(`\nTest Hash: ${hash}`);
    console.log(`\nCopy this hash and paste it into the verification interface!\n`);

    return {
      hash,
      did: TEST_DID,
      receipt,
      success: true
    };

  } catch (error) {
    console.error('❌ Failed to create test proof:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n⚠️  Registry server is not running!');
      console.error('   Start the registry with: cd pohw-registry-node && npm start\n');
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
async function main() {
  const args = process.argv.slice(2);
  const options = {
    withCredentials: args.includes('--with-credentials') || args.includes('-c'),
    tier: args.includes('--green') ? 'green' : 
          args.includes('--blue') ? 'blue' : 
          args.includes('--purple') ? 'purple' : 'grey',
    assistanceProfile: args.includes('--ai-assisted') ? 'AI-assisted' : 
                      args.includes('--ai-generated') ? 'AI-generated' : 'human-only',
    includeProcessDigest: args.includes('--with-process') || args.includes('-p')
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node create-test-proof.js [options]

Options:
  --with-credentials, -c    Issue mock credentials (for Blue/Green tier)
  --green                   Create Green tier proof (requires --with-credentials)
  --blue                    Create Blue tier proof (requires --with-credentials)
  --purple                  Create Purple tier proof (AI-assisted)
  --ai-assisted             Mark as AI-assisted (Purple tier)
  --ai-generated            Mark as AI-generated (Purple tier)
  --with-process, -p        Include process digest and metrics
  --help, -h                Show this help

Examples:
  # Basic test proof (Grey tier)
  node create-test-proof.js

  # Test proof with process digest
  node create-test-proof.js --with-process

  # Test proof with credentials (Blue tier)
  node create-test-proof.js --with-credentials --blue

  # Test proof with multiple credentials (Green tier)
  node create-test-proof.js --with-credentials --green

  # AI-assisted proof (Purple tier)
  node create-test-proof.js --ai-assisted

Environment Variables:
  REGISTRY_URL              Registry URL (default: http://localhost:3000)
`);
    process.exit(0);
  }

  await createTestProof(options);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

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

module.exports = { createTestProof, generateTestHash, TEST_DID };

