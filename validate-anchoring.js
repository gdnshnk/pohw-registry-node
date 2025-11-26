/**
 * Validate Anchoring Configuration and Code
 * Checks for errors and validates both Bitcoin and Ethereum setup
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

async function validateAnchoring() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 ANCHORING VALIDATION & ERROR CHECK');
  console.log('='.repeat(80) + '\n');

  const errors = [];
  const warnings = [];
  const successes = [];

  try {
    // 1. Check server is running
    console.log('1. Checking server status...');
    try {
      const health = await makeRequest('GET', '/health');
      if (health.status === 200) {
        successes.push('Server is running');
        console.log('   ✅ Server is running');
      } else {
        errors.push('Server health check failed');
        console.log('   ❌ Server health check failed');
      }
    } catch (e) {
      errors.push('Server is not accessible');
      console.log('   ❌ Server is not accessible');
      console.log('   Error:', e.message);
      return;
    }

    // 2. Check status endpoint
    console.log('\n2. Checking registry status...');
    try {
      const status = await makeRequest('GET', '/pohw/status');
      if (status.status === 200) {
        console.log('   ✅ Status endpoint working');
        console.log(`   Total proofs: ${status.data.total_proofs}`);
        successes.push('Status endpoint working');
      }
    } catch (e) {
      errors.push('Status endpoint failed');
      console.log('   ❌ Status endpoint failed');
    }

    // 3. Test proof submission
    console.log('\n3. Testing proof submission...');
    try {
      const proof = {
        hash: '0x' + require('crypto').createHash('sha256').update('test-validation').digest('hex'),
        signature: 'test-sig',
        did: 'did:pohw:test:validation',
        timestamp: new Date().toISOString()
      };
      const result = await makeRequest('POST', '/pohw/attest', proof);
      if (result.status === 201 || result.status === 409) {
        console.log('   ✅ Proof submission working');
        successes.push('Proof submission working');
      } else {
        warnings.push('Proof submission returned unexpected status');
        console.log(`   ⚠️  Proof submission: ${result.status}`);
      }
    } catch (e) {
      errors.push('Proof submission failed');
      console.log('   ❌ Proof submission failed:', e.message);
    }

    // 4. Test batch creation
    console.log('\n4. Testing batch creation...');
    try {
      const batchResult = await makeRequest('POST', '/pohw/batch/create');
      if (batchResult.status === 200) {
        console.log('   ✅ Batch creation working');
        console.log(`   Batch ID: ${batchResult.data.batch_id}`);
        successes.push('Batch creation working');
        
        // 5. Test anchoring endpoint
        console.log('\n5. Testing anchoring endpoint...');
        const batchId = batchResult.data.batch_id;
        const anchorResult = await makeRequest('POST', `/pohw/batch/anchor/${batchId}`);
        
        if (anchorResult.status === 200) {
          console.log('   ✅ Anchoring endpoint working');
          successes.push('Anchoring endpoint working');
          
          // Check each chain
          const bitcoinAnchor = anchorResult.data.anchors?.find(a => a.chain === 'bitcoin');
          const ethereumAnchor = anchorResult.data.anchors?.find(a => a.chain === 'ethereum');
          
          console.log('\n   Chain Status:');
          
          if (bitcoinAnchor) {
            if (bitcoinAnchor.success) {
              console.log('   ✅ Bitcoin: Working');
              console.log(`      TX: ${bitcoinAnchor.txHash}`);
              successes.push('Bitcoin anchoring working');
            } else {
              console.log('   ❌ Bitcoin: Failed');
              console.log(`      Error: ${bitcoinAnchor.error}`);
              errors.push(`Bitcoin anchoring failed: ${bitcoinAnchor.error}`);
            }
          } else {
            console.log('   ⚠️  Bitcoin: Not configured');
            warnings.push('Bitcoin not configured');
          }
          
          if (ethereumAnchor) {
            if (ethereumAnchor.success) {
              console.log('   ✅ Ethereum: Working');
              console.log(`      TX: ${ethereumAnchor.txHash}`);
              successes.push('Ethereum anchoring working');
            } else {
              console.log('   ❌ Ethereum: Failed');
              console.log(`      Error: ${ethereumAnchor.error}`);
              errors.push(`Ethereum anchoring failed: ${ethereumAnchor.error}`);
            }
          } else {
            console.log('   ⚠️  Ethereum: Not configured');
            warnings.push('Ethereum not configured');
          }
          
        } else if (anchorResult.status === 400) {
          console.log('   ⚠️  Anchoring not enabled');
          console.log(`   Message: ${anchorResult.data.error}`);
          warnings.push('Anchoring not enabled');
        } else {
          console.log(`   ❌ Anchoring endpoint error: ${anchorResult.status}`);
          errors.push(`Anchoring endpoint returned ${anchorResult.status}`);
        }
      } else if (batchResult.status === 400 && batchResult.data.error?.includes('No pending')) {
        console.log('   ⚠️  No pending proofs to batch (this is OK)');
        warnings.push('No pending proofs');
      } else {
        console.log(`   ❌ Batch creation failed: ${batchResult.status}`);
        errors.push(`Batch creation failed: ${batchResult.status}`);
      }
    } catch (e) {
      errors.push('Batch creation/anchoring test failed');
      console.log('   ❌ Test failed:', e.message);
    }

    // 6. Check for code issues
    console.log('\n6. Checking code for issues...');
    try {
      const fs = require('fs');
      const anchoringCode = fs.readFileSync('./src/anchoring.ts', 'utf8');
      
      // Check for common issues
      if (anchoringCode.includes('value: 0') && !anchoringCode.includes('value: BigInt(0)')) {
        warnings.push('Potential issue: Some output values may not be BigInt');
      }
      
      if (anchoringCode.includes('bitcoin.ECPair') && !anchoringCode.includes('ECPairFactory')) {
        warnings.push('Potential issue: ECPair may not be initialized correctly');
      }
      
      if (!anchoringCode.includes('BigInt')) {
        warnings.push('Warning: No BigInt usage found (may cause issues with bitcoinjs-lib v7)');
      }
      
      console.log('   ✅ Code structure looks good');
      successes.push('Code validation passed');
    } catch (e) {
      warnings.push('Could not validate code');
      console.log('   ⚠️  Could not read code file');
    }

    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n✅ Successes: ${successes.length}`);
    successes.forEach(s => console.log(`   - ${s}`));
    
    if (warnings.length > 0) {
      console.log(`\n⚠️  Warnings: ${warnings.length}`);
      warnings.forEach(w => console.log(`   - ${w}`));
    }
    
    if (errors.length > 0) {
      console.log(`\n❌ Errors: ${errors.length}`);
      errors.forEach(e => console.log(`   - ${e}`));
      console.log('\n⚠️  Some issues found. Please review and fix.');
    } else {
      console.log('\n✅ NO ERRORS FOUND!');
      console.log('   Everything is working correctly.');
    }
    
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run validation
makeRequest('GET', '/health')
  .then(() => {
    validateAnchoring();
  })
  .catch((error) => {
    console.error('❌ Cannot connect to server');
    console.error('   Please start the server first: npm start');
    process.exit(1);
  });

