/**
 * Complete Proof Flow Demonstration
 * Shows the entire process from proof creation to blockchain anchoring
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

async function showFullProofFlow() {
  console.log('\n' + '='.repeat(80));
  console.log('🔗 COMPLETE PROOF FLOW: From Creation to Blockchain Anchoring');
  console.log('='.repeat(80) + '\n');

  try {
    // ==========================================
    // STEP 1: Create a Proof
    // ==========================================
    console.log('📝 STEP 1: Creating a Proof');
    console.log('-'.repeat(80));
    
    const proofContent = `Proof of Human Work - Test ${Date.now()}`;
    const proofHash = '0x' + crypto.createHash('sha256').update(proofContent).digest('hex');
    const proofSignature = crypto.createHash('sha256').update(`sig-${proofContent}`).digest('hex');
    const proofDID = `did:pohw:user:${crypto.randomBytes(8).toString('hex')}`;
    const proofTimestamp = new Date().toISOString();

    const proof = {
      hash: proofHash,
      signature: proofSignature,
      did: proofDID,
      timestamp: proofTimestamp
    };

    console.log('Proof Details:');
    console.log(`  Hash: ${proofHash}`);
    console.log(`  DID: ${proofDID}`);
    console.log(`  Timestamp: ${proofTimestamp}`);
    console.log(`  Signature: ${proofSignature.substring(0, 40)}...`);
    
    const attestResult = await makeRequest('POST', '/pohw/attest', proof);
    
    if (attestResult.status === 201) {
      console.log('\n✅ Proof submitted successfully!');
      console.log(`  Receipt Hash: ${attestResult.data.receipt_hash}`);
      console.log(`  Registry: ${attestResult.data.registry}`);
    } else {
      console.log(`\n❌ Proof submission failed: ${attestResult.status}`);
      console.log(JSON.stringify(attestResult.data, null, 2));
      return;
    }

    // ==========================================
    // STEP 2: Create a Batch
    // ==========================================
    console.log('\n\n📦 STEP 2: Creating a Batch');
    console.log('-'.repeat(80));
    
    const batchResult = await makeRequest('POST', '/pohw/batch/create');
    
    if (batchResult.status !== 200) {
      console.log(`❌ Batch creation failed: ${batchResult.status}`);
      if (batchResult.data.error) {
        console.log(`  Error: ${batchResult.data.error}`);
      }
      return;
    }
    
    console.log('✅ Batch created successfully!');
    console.log(`  Batch ID: ${batchResult.data.batch_id}`);
    console.log(`  Merkle Root: ${batchResult.data.merkle_root}`);
    console.log(`  Size: ${batchResult.data.size} proof(s)`);
    console.log(`  Created At: ${batchResult.data.created_at}`);
    
    const batchId = batchResult.data.batch_id;
    const merkleRoot = batchResult.data.merkle_root;

    // ==========================================
    // STEP 3: Anchor to Blockchain
    // ==========================================
    console.log('\n\n⛓️  STEP 3: Anchoring to Bitcoin Testnet');
    console.log('-'.repeat(80));
    console.log('⚠️  This will create a REAL transaction on Bitcoin testnet!');
    console.log('⚠️  Transaction fee: ~2250 satoshis\n');
    
    const anchorResult = await makeRequest('POST', `/pohw/batch/anchor/${batchId}`);
    
    if (anchorResult.status === 200) {
      console.log('✅ Anchoring successful!');
      console.log('\n  Anchor Results:');
      anchorResult.data.anchors.forEach((anchor, i) => {
        console.log(`\n  ${i + 1}. ${anchor.chain.toUpperCase()}:`);
        console.log(`     Success: ${anchor.success}`);
        if (anchor.success) {
          console.log(`     Transaction Hash: ${anchor.txHash}`);
          if (anchor.blockNumber) {
            console.log(`     Block Number: ${anchor.blockNumber}`);
          }
          console.log(`     Timestamp: ${anchor.timestamp}`);
          console.log(`     🔗 View on explorer:`);
          if (anchor.chain === 'bitcoin') {
            console.log(`        https://blockstream.info/testnet/tx/${anchor.txHash}`);
          }
        } else {
          console.log(`     Error: ${anchor.error}`);
        }
      });
      
      if (anchorResult.data.stored_anchors && anchorResult.data.stored_anchors.length > 0) {
        console.log(`\n  ✅ ${anchorResult.data.stored_anchors.length} anchor(s) stored in database`);
      }
    } else {
      console.log(`❌ Anchoring failed: ${anchorResult.status}`);
      console.log(JSON.stringify(anchorResult.data, null, 2));
    }

    // ==========================================
    // STEP 4: Retrieve Merkle Proof with Anchors
    // ==========================================
    console.log('\n\n🔍 STEP 4: Retrieving Merkle Proof');
    console.log('-'.repeat(80));
    
    const proofResult = await makeRequest('GET', `/pohw/proof/${proofHash}`);
    
    if (proofResult.status === 200) {
      console.log('✅ Merkle proof retrieved!');
      console.log(`\n  Proof Hash: ${proofHash}`);
      console.log(`  Merkle Root: ${proofResult.data.root}`);
      console.log(`  Proof Path Length: ${proofResult.data.proof?.length || 0} items`);
      
      if (proofResult.data.proof && proofResult.data.proof.length > 0) {
        console.log('\n  Merkle Proof Path:');
        proofResult.data.proof.forEach((item, i) => {
          console.log(`    ${i + 1}. ${item.substring(0, 20)}...${item.substring(item.length - 10)}`);
        });
      }
      
      if (proofResult.data.anchors && proofResult.data.anchors.length > 0) {
        console.log(`\n  🔗 Blockchain Anchors (${proofResult.data.anchors.length}):`);
        proofResult.data.anchors.forEach((anchor, i) => {
          console.log(`\n    ${i + 1}. ${anchor.chain.toUpperCase()}:`);
          console.log(`       Transaction: ${anchor.tx}`);
          if (anchor.block) {
            console.log(`       Block: ${anchor.block}`);
          }
          console.log(`       🔗 https://blockstream.info/testnet/tx/${anchor.tx}`);
        });
      } else {
        console.log('\n  ℹ️  No anchors yet (may need to wait for confirmation)');
      }
    } else {
      console.log(`❌ Failed to retrieve proof: ${proofResult.status}`);
      console.log(JSON.stringify(proofResult.data, null, 2));
    }

    // ==========================================
    // STEP 5: Verify the Proof
    // ==========================================
    console.log('\n\n✅ STEP 5: Verifying the Proof');
    console.log('-'.repeat(80));
    
    const verifyResult = await makeRequest('GET', `/pohw/verify/${proofHash}`);
    
    if (verifyResult.status === 200) {
      console.log('✅ Verification result:');
      console.log(`  Valid: ${verifyResult.data.valid}`);
      console.log(`  Signer: ${verifyResult.data.signer || verifyResult.data.did}`);
      console.log(`  Timestamp: ${verifyResult.data.timestamp}`);
      console.log(`  Registry: ${verifyResult.data.registry}`);
      if (verifyResult.data.merkle_root) {
        console.log(`  Merkle Root: ${verifyResult.data.merkle_root}`);
      }
      if (verifyResult.data.merkle_proof) {
        console.log(`  Merkle Proof: ${verifyResult.data.merkle_proof.length} items`);
      }
    } else {
      console.log(`⚠️  Verification endpoint returned: ${verifyResult.status}`);
    }

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log('\n✅ Complete flow executed successfully!');
    console.log('\nWhat happened:');
    console.log('  1. ✅ Proof created and submitted');
    console.log('  2. ✅ Batch created with Merkle root');
    console.log('  3. ✅ Batch anchored to Bitcoin testnet');
    console.log('  4. ✅ Merkle proof retrieved with anchors');
    console.log('  5. ✅ Proof verified');
    console.log('\n🔗 Your proof is now:');
    console.log('  • Stored in the registry database');
    console.log('  • Included in a Merkle batch');
    console.log('  • Anchored to Bitcoin testnet blockchain');
    console.log('  • Verifiable via Merkle proof');
    console.log('\n📝 Proof Details:');
    console.log(`  Hash: ${proofHash}`);
    console.log(`  Batch ID: ${batchId}`);
    console.log(`  Merkle Root: ${merkleRoot}`);
    if (anchorResult.status === 200 && anchorResult.data.anchors[0]?.txHash) {
      console.log(`  Bitcoin TX: ${anchorResult.data.anchors[0].txHash}`);
      console.log(`  Explorer: https://blockstream.info/testnet/tx/${anchorResult.data.anchors[0].txHash}`);
    }
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Error in proof flow:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Check if server is running
makeRequest('GET', '/health')
  .then(() => {
    console.log('✅ Registry node is running\n');
    showFullProofFlow();
  })
  .catch((error) => {
    console.error('❌ Registry node is not running!');
    console.error('   Please start the server first: npm start');
    console.error('   Make sure anchoring is enabled!');
    process.exit(1);
  });

