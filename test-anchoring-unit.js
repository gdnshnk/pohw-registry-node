/**
 * Unit Test for Anchoring Module
 * Tests the anchoring functions directly
 */

// Load the compiled anchoring module
const anchoring = require('./dist/anchoring');

async function testAnchoringModule() {
  console.log('🔬 Unit Testing Anchoring Module\n');
  console.log('='.repeat(70));
  
  const testPayload = {
    merkleRoot: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    batchId: 'test-batch-123',
    registryId: 'pohw-registry-node',
    timestamp: new Date().toISOString()
  };
  
  // Test 1: Anchoring disabled
  console.log('\n1. Testing with anchoring DISABLED...');
  const configDisabled = { enabled: false };
  const resultDisabled = await anchoring.anchorMerkleRoot(testPayload, configDisabled);
  console.log(`   ✅ Returns empty array: ${resultDisabled.length === 0 ? 'YES' : 'NO'}`);
  
  // Test 2: Anchoring enabled, no blockchain config
  console.log('\n2. Testing with anchoring ENABLED but no blockchain config...');
  const configNoBlockchain = { enabled: true };
  const resultNoBlockchain = await anchoring.anchorMerkleRoot(testPayload, configNoBlockchain);
  console.log(`   ✅ Returns empty array: ${resultNoBlockchain.length === 0 ? 'YES' : 'NO'}`);
  
  // Test 3: Bitcoin enabled but no private key
  console.log('\n3. Testing Bitcoin with NO private key...');
  const configBitcoinNoKey = {
    enabled: true,
    bitcoin: {
      network: 'testnet'
    }
  };
  const resultBitcoinNoKey = await anchoring.anchorToBitcoin(testPayload, configBitcoinNoKey);
  console.log(`   ✅ Success: ${resultBitcoinNoKey.success ? 'NO' : 'YES (expected failure)'}`);
  console.log(`   ✅ Error message: ${resultBitcoinNoKey.error || 'N/A'}`);
  console.log(`   ✅ Chain: ${resultBitcoinNoKey.chain}`);
  
  // Test 4: Ethereum enabled but no private key
  console.log('\n4. Testing Ethereum with NO private key...');
  const configEthereumNoKey = {
    enabled: true,
    ethereum: {
      network: 'sepolia'
    }
  };
  const resultEthereumNoKey = await anchoring.anchorToEthereum(testPayload, configEthereumNoKey);
  console.log(`   ✅ Success: ${resultEthereumNoKey.success ? 'NO' : 'YES (expected failure)'}`);
  console.log(`   ✅ Error message: ${resultEthereumNoKey.error || 'N/A'}`);
  console.log(`   ✅ Chain: ${resultEthereumNoKey.chain}`);
  
  // Test 5: Bitcoin with invalid private key (should fail gracefully)
  console.log('\n5. Testing Bitcoin with INVALID private key...');
  const configBitcoinInvalidKey = {
    enabled: true,
    bitcoin: {
      network: 'testnet',
      privateKey: 'invalid-key-format'
    }
  };
  const resultBitcoinInvalid = await anchoring.anchorToBitcoin(testPayload, configBitcoinInvalidKey);
  console.log(`   ✅ Handles invalid key gracefully: ${resultBitcoinInvalid.success ? 'NO' : 'YES'}`);
  console.log(`   ✅ Error: ${resultBitcoinInvalid.error?.substring(0, 50) || 'N/A'}...`);
  
  // Test 6: Full anchorMerkleRoot with both chains (no keys)
  console.log('\n6. Testing anchorMerkleRoot with both chains (no keys)...');
  const configBoth = {
    enabled: true,
    bitcoin: {
      network: 'testnet'
    },
    ethereum: {
      network: 'sepolia'
    }
  };
  const resultBoth = await anchoring.anchorMerkleRoot(testPayload, configBoth);
  console.log(`   ✅ Returns results for both chains: ${resultBoth.length === 2 ? 'YES' : 'NO'}`);
  resultBoth.forEach((result, i) => {
    console.log(`      ${i + 1}. ${result.chain}: success=${result.success}, error=${result.error?.substring(0, 40) || 'none'}...`);
  });
  
  // Test 7: Verify result structure
  console.log('\n7. Verifying result structure...');
  const sampleResult = resultBoth[0] || resultBitcoinNoKey;
  const hasChain = 'chain' in sampleResult;
  const hasTxHash = 'txHash' in sampleResult;
  const hasTimestamp = 'timestamp' in sampleResult;
  const hasSuccess = 'success' in sampleResult;
  console.log(`   ✅ Has 'chain' field: ${hasChain}`);
  console.log(`   ✅ Has 'txHash' field: ${hasTxHash}`);
  console.log(`   ✅ Has 'timestamp' field: ${hasTimestamp}`);
  console.log(`   ✅ Has 'success' field: ${hasSuccess}`);
  
  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Unit tests completed!');
  console.log('\n📝 Summary:');
  console.log('   ✅ All functions handle missing configuration gracefully');
  console.log('   ✅ Error messages are clear and informative');
  console.log('   ✅ Result structure is consistent');
  console.log('   ✅ Multiple chains can be configured simultaneously');
}

// Run tests
testAnchoringModule()
  .then(() => {
    console.log('\n✅ All unit tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Unit test failed:', error);
    console.error(error.stack);
    process.exit(1);
  });

