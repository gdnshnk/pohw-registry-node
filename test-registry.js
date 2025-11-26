/**
 * Test script for PoHW Registry Node
 * Tests basic functionality: submit proof, verify, get status
 */

const http = require('http');

const REGISTRY_URL = 'http://localhost:3000';

// Test data
const testProof = {
  hash: '0x' + require('crypto').createHash('sha256').update('test-content').digest('hex'),
  signature: 'test-signature-12345',
  did: 'did:pohw:test:example',
  timestamp: new Date().toISOString()
};

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

async function runTests() {
  console.log('🧪 Testing PoHW Registry Node\n');

  // Test 1: Health check
  console.log('1. Testing health endpoint...');
  try {
    const health = await makeRequest('GET', '/health');
    console.log('   ✓ Health check:', health.status === 200 ? 'OK' : 'FAILED');
    console.log('   Response:', JSON.stringify(health.data, null, 2));
  } catch (error) {
    console.log('   ✗ Health check failed:', error.message);
  }

  // Test 2: Submit proof
  console.log('\n2. Testing proof submission...');
  try {
    const submit = await makeRequest('POST', '/pohw/attest', testProof);
    console.log('   ✓ Submit proof:', submit.status === 201 ? 'OK' : 'FAILED');
    console.log('   Response:', JSON.stringify(submit.data, null, 2));
  } catch (error) {
    console.log('   ✗ Submit failed:', error.message);
  }

  // Test 3: Verify proof
  console.log('\n3. Testing proof verification...');
  try {
    const verify = await makeRequest('GET', `/pohw/verify/${testProof.hash}`);
    console.log('   ✓ Verify proof:', verify.status === 200 ? 'OK' : 'FAILED');
    console.log('   Response:', JSON.stringify(verify.data, null, 2));
  } catch (error) {
    console.log('   ✗ Verify failed:', error.message);
  }

  // Test 4: Get status
  console.log('\n4. Testing registry status...');
  try {
    const status = await makeRequest('GET', '/pohw/status');
    console.log('   ✓ Status:', status.status === 200 ? 'OK' : 'FAILED');
    console.log('   Response:', JSON.stringify(status.data, null, 2));
  } catch (error) {
    console.log('   ✗ Status failed:', error.message);
  }

  console.log('\n✅ Tests completed!');
}

// Run tests
runTests().catch(console.error);

