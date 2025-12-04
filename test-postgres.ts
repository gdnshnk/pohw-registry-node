/**
 * PostgreSQL Database Test Script
 * Tests the PostgreSQL database adapter implementation
 */

import { PostgreSQLDatabase } from './src/database-postgres';
import { ProofRecord, MerkleBatch } from './src/types';

async function testPostgreSQL() {
  console.log('🧪 Testing PostgreSQL Database Adapter\n');

  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('⚠️  DATABASE_URL not set. Using default connection string.');
    console.log('   Set DATABASE_URL environment variable to use a specific database.\n');
  }

  let db: PostgreSQLDatabase;
  try {
    // Initialize database
    console.log('1️⃣  Initializing database connection...');
    db = new PostgreSQLDatabase(databaseUrl);
    await db.initialize();
    console.log('   ✅ Database schema initialized\n');

    // Test 1: Store a proof
    console.log('2️⃣  Testing proof storage...');
    const testProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0x' + 'a'.repeat(64),
      signature: '0x' + 'b'.repeat(128),
      did: 'did:pohw:test:123',
      timestamp: new Date().toISOString(),
      process_digest: '0x' + 'c'.repeat(64),
      compound_hash: '0x' + 'd'.repeat(64),
      assistance_profile: 'human-only'
    };

    const proofId = await db.storeProof(testProof);
    console.log(`   ✅ Proof stored with ID: ${proofId}\n`);

    // Test 2: Retrieve proof by hash
    console.log('3️⃣  Testing proof retrieval by hash...');
    const retrievedProof = await db.getProofByHash(testProof.hash);
    if (retrievedProof && retrievedProof.hash === testProof.hash) {
      console.log('   ✅ Proof retrieved successfully');
      console.log(`      DID: ${retrievedProof.did}`);
      console.log(`      Timestamp: ${retrievedProof.timestamp}`);
      console.log(`      Assistance Profile: ${retrievedProof.assistance_profile}\n`);
    } else {
      throw new Error('Proof retrieval failed');
    }

    // Test 3: Test compound hash lookup
    console.log('4️⃣  Testing compound hash lookup...');
    const byCompoundHash = await db.getProofByCompoundHash(testProof.compound_hash!);
    if (byCompoundHash && byCompoundHash.compound_hash === testProof.compound_hash) {
      console.log('   ✅ Compound hash lookup successful\n');
    } else {
      throw new Error('Compound hash lookup failed');
    }

    // Test 4: Test pending proofs
    console.log('5️⃣  Testing pending proofs...');
    const pendingProofs = await db.getPendingProofs();
    console.log(`   ✅ Found ${pendingProofs.length} pending proof(s)\n`);

    // Test 5: Store a batch
    console.log('6️⃣  Testing batch storage...');
    const testBatch: Omit<MerkleBatch, 'created_at'> = {
      id: 'test-batch-' + Date.now(),
      root: '0x' + 'e'.repeat(64),
      size: 100
    };
    const batchId = await db.storeMerkleBatch(testBatch);
    console.log(`   ✅ Batch stored with ID: ${batchId}\n`);

    // Test 6: Update proof with batch info
    console.log('7️⃣  Testing proof batch update...');
    await db.updateProofBatch(testProof.hash, batchId, 0);
    const updatedProof = await db.getProofByHash(testProof.hash);
    if (updatedProof && updatedProof.batch_id === batchId && updatedProof.merkle_index === 0) {
      console.log('   ✅ Proof batch update successful\n');
    } else {
      throw new Error('Proof batch update failed');
    }

    // Test 7: Get batch by ID
    console.log('8️⃣  Testing batch retrieval...');
    const retrievedBatch = await db.getBatchById(batchId);
    if (retrievedBatch && retrievedBatch.root === testBatch.root) {
      console.log('   ✅ Batch retrieved successfully');
      console.log(`      Root: ${retrievedBatch.root}`);
      console.log(`      Size: ${retrievedBatch.size}\n`);
    } else {
      throw new Error('Batch retrieval failed');
    }

    // Test 8: Test counts
    console.log('9️⃣  Testing counts...');
    const totalProofs = await db.getTotalProofs();
    const pendingCount = await db.getPendingCount();
    console.log(`   ✅ Total proofs: ${totalProofs}`);
    console.log(`   ✅ Pending proofs: ${pendingCount}\n`);

    // Test 9: Test reputation
    console.log('🔟 Testing reputation storage...');
    await db.storeReputation('did:pohw:test:123', {
      score: 75.5,
      tier: 'blue',
      successfulProofs: 5,
      anomalies: 0
    });
    const reputation = await db.getReputation('did:pohw:test:123');
    if (reputation && reputation.score === 75.5) {
      console.log('   ✅ Reputation storage successful');
      console.log(`      Score: ${reputation.score}`);
      console.log(`      Tier: ${reputation.tier}\n`);
    } else {
      throw new Error('Reputation storage failed');
    }

    // Test 10: Test challenge storage
    console.log('1️⃣1️⃣  Testing challenge storage...');
    const challengeId = await db.storeChallenge({
      proof_hash: testProof.hash,
      proof_did: testProof.did,
      challenger_did: 'did:pohw:challenger:456',
      reason: 'suspected_ai_generated',
      description: 'Test challenge',
      status: 'pending',
      created_at: new Date().toISOString()
    });
    console.log(`   ✅ Challenge stored with ID: ${challengeId}\n`);

    // Test 11: Retrieve challenges
    console.log('1️⃣2️⃣  Testing challenge retrieval...');
    const challenges = await db.getChallengesByProofHash(testProof.hash);
    if (challenges.length > 0) {
      console.log(`   ✅ Found ${challenges.length} challenge(s)\n`);
    } else {
      throw new Error('Challenge retrieval failed');
    }

    console.log('✅ All tests passed!\n');
    console.log('📊 Summary:');
    console.log(`   • Proofs stored: ${await db.getTotalProofs()}`);
    console.log(`   • Batches stored: ${(await db.getAllBatches()).length}`);
    console.log(`   • Pending proofs: ${await db.getPendingCount()}\n`);

    // Close connection
    await db.close();
    console.log('🔌 Database connection closed');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testPostgreSQL().catch(console.error);


 * Tests the PostgreSQL database adapter implementation
 */

import { PostgreSQLDatabase } from './src/database-postgres';
import { ProofRecord, MerkleBatch } from './src/types';

async function testPostgreSQL() {
  console.log('🧪 Testing PostgreSQL Database Adapter\n');

  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('⚠️  DATABASE_URL not set. Using default connection string.');
    console.log('   Set DATABASE_URL environment variable to use a specific database.\n');
  }

  let db: PostgreSQLDatabase;
  try {
    // Initialize database
    console.log('1️⃣  Initializing database connection...');
    db = new PostgreSQLDatabase(databaseUrl);
    await db.initialize();
    console.log('   ✅ Database schema initialized\n');

    // Test 1: Store a proof
    console.log('2️⃣  Testing proof storage...');
    const testProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0x' + 'a'.repeat(64),
      signature: '0x' + 'b'.repeat(128),
      did: 'did:pohw:test:123',
      timestamp: new Date().toISOString(),
      process_digest: '0x' + 'c'.repeat(64),
      compound_hash: '0x' + 'd'.repeat(64),
      assistance_profile: 'human-only'
    };

    const proofId = await db.storeProof(testProof);
    console.log(`   ✅ Proof stored with ID: ${proofId}\n`);

    // Test 2: Retrieve proof by hash
    console.log('3️⃣  Testing proof retrieval by hash...');
    const retrievedProof = await db.getProofByHash(testProof.hash);
    if (retrievedProof && retrievedProof.hash === testProof.hash) {
      console.log('   ✅ Proof retrieved successfully');
      console.log(`      DID: ${retrievedProof.did}`);
      console.log(`      Timestamp: ${retrievedProof.timestamp}`);
      console.log(`      Assistance Profile: ${retrievedProof.assistance_profile}\n`);
    } else {
      throw new Error('Proof retrieval failed');
    }

    // Test 3: Test compound hash lookup
    console.log('4️⃣  Testing compound hash lookup...');
    const byCompoundHash = await db.getProofByCompoundHash(testProof.compound_hash!);
    if (byCompoundHash && byCompoundHash.compound_hash === testProof.compound_hash) {
      console.log('   ✅ Compound hash lookup successful\n');
    } else {
      throw new Error('Compound hash lookup failed');
    }

    // Test 4: Test pending proofs
    console.log('5️⃣  Testing pending proofs...');
    const pendingProofs = await db.getPendingProofs();
    console.log(`   ✅ Found ${pendingProofs.length} pending proof(s)\n`);

    // Test 5: Store a batch
    console.log('6️⃣  Testing batch storage...');
    const testBatch: Omit<MerkleBatch, 'created_at'> = {
      id: 'test-batch-' + Date.now(),
      root: '0x' + 'e'.repeat(64),
      size: 100
    };
    const batchId = await db.storeMerkleBatch(testBatch);
    console.log(`   ✅ Batch stored with ID: ${batchId}\n`);

    // Test 6: Update proof with batch info
    console.log('7️⃣  Testing proof batch update...');
    await db.updateProofBatch(testProof.hash, batchId, 0);
    const updatedProof = await db.getProofByHash(testProof.hash);
    if (updatedProof && updatedProof.batch_id === batchId && updatedProof.merkle_index === 0) {
      console.log('   ✅ Proof batch update successful\n');
    } else {
      throw new Error('Proof batch update failed');
    }

    // Test 7: Get batch by ID
    console.log('8️⃣  Testing batch retrieval...');
    const retrievedBatch = await db.getBatchById(batchId);
    if (retrievedBatch && retrievedBatch.root === testBatch.root) {
      console.log('   ✅ Batch retrieved successfully');
      console.log(`      Root: ${retrievedBatch.root}`);
      console.log(`      Size: ${retrievedBatch.size}\n`);
    } else {
      throw new Error('Batch retrieval failed');
    }

    // Test 8: Test counts
    console.log('9️⃣  Testing counts...');
    const totalProofs = await db.getTotalProofs();
    const pendingCount = await db.getPendingCount();
    console.log(`   ✅ Total proofs: ${totalProofs}`);
    console.log(`   ✅ Pending proofs: ${pendingCount}\n`);

    // Test 9: Test reputation
    console.log('🔟 Testing reputation storage...');
    await db.storeReputation('did:pohw:test:123', {
      score: 75.5,
      tier: 'blue',
      successfulProofs: 5,
      anomalies: 0
    });
    const reputation = await db.getReputation('did:pohw:test:123');
    if (reputation && reputation.score === 75.5) {
      console.log('   ✅ Reputation storage successful');
      console.log(`      Score: ${reputation.score}`);
      console.log(`      Tier: ${reputation.tier}\n`);
    } else {
      throw new Error('Reputation storage failed');
    }

    // Test 10: Test challenge storage
    console.log('1️⃣1️⃣  Testing challenge storage...');
    const challengeId = await db.storeChallenge({
      proof_hash: testProof.hash,
      proof_did: testProof.did,
      challenger_did: 'did:pohw:challenger:456',
      reason: 'suspected_ai_generated',
      description: 'Test challenge',
      status: 'pending',
      created_at: new Date().toISOString()
    });
    console.log(`   ✅ Challenge stored with ID: ${challengeId}\n`);

    // Test 11: Retrieve challenges
    console.log('1️⃣2️⃣  Testing challenge retrieval...');
    const challenges = await db.getChallengesByProofHash(testProof.hash);
    if (challenges.length > 0) {
      console.log(`   ✅ Found ${challenges.length} challenge(s)\n`);
    } else {
      throw new Error('Challenge retrieval failed');
    }

    console.log('✅ All tests passed!\n');
    console.log('📊 Summary:');
    console.log(`   • Proofs stored: ${await db.getTotalProofs()}`);
    console.log(`   • Batches stored: ${(await db.getAllBatches()).length}`);
    console.log(`   • Pending proofs: ${await db.getPendingCount()}\n`);

    // Close connection
    await db.close();
    console.log('🔌 Database connection closed');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testPostgreSQL().catch(console.error);


 * Tests the PostgreSQL database adapter implementation
 */

import { PostgreSQLDatabase } from './src/database-postgres';
import { ProofRecord, MerkleBatch } from './src/types';

async function testPostgreSQL() {
  console.log('🧪 Testing PostgreSQL Database Adapter\n');

  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('⚠️  DATABASE_URL not set. Using default connection string.');
    console.log('   Set DATABASE_URL environment variable to use a specific database.\n');
  }

  let db: PostgreSQLDatabase;
  try {
    // Initialize database
    console.log('1️⃣  Initializing database connection...');
    db = new PostgreSQLDatabase(databaseUrl);
    await db.initialize();
    console.log('   ✅ Database schema initialized\n');

    // Test 1: Store a proof
    console.log('2️⃣  Testing proof storage...');
    const testProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0x' + 'a'.repeat(64),
      signature: '0x' + 'b'.repeat(128),
      did: 'did:pohw:test:123',
      timestamp: new Date().toISOString(),
      process_digest: '0x' + 'c'.repeat(64),
      compound_hash: '0x' + 'd'.repeat(64),
      assistance_profile: 'human-only'
    };

    const proofId = await db.storeProof(testProof);
    console.log(`   ✅ Proof stored with ID: ${proofId}\n`);

    // Test 2: Retrieve proof by hash
    console.log('3️⃣  Testing proof retrieval by hash...');
    const retrievedProof = await db.getProofByHash(testProof.hash);
    if (retrievedProof && retrievedProof.hash === testProof.hash) {
      console.log('   ✅ Proof retrieved successfully');
      console.log(`      DID: ${retrievedProof.did}`);
      console.log(`      Timestamp: ${retrievedProof.timestamp}`);
      console.log(`      Assistance Profile: ${retrievedProof.assistance_profile}\n`);
    } else {
      throw new Error('Proof retrieval failed');
    }

    // Test 3: Test compound hash lookup
    console.log('4️⃣  Testing compound hash lookup...');
    const byCompoundHash = await db.getProofByCompoundHash(testProof.compound_hash!);
    if (byCompoundHash && byCompoundHash.compound_hash === testProof.compound_hash) {
      console.log('   ✅ Compound hash lookup successful\n');
    } else {
      throw new Error('Compound hash lookup failed');
    }

    // Test 4: Test pending proofs
    console.log('5️⃣  Testing pending proofs...');
    const pendingProofs = await db.getPendingProofs();
    console.log(`   ✅ Found ${pendingProofs.length} pending proof(s)\n`);

    // Test 5: Store a batch
    console.log('6️⃣  Testing batch storage...');
    const testBatch: Omit<MerkleBatch, 'created_at'> = {
      id: 'test-batch-' + Date.now(),
      root: '0x' + 'e'.repeat(64),
      size: 100
    };
    const batchId = await db.storeMerkleBatch(testBatch);
    console.log(`   ✅ Batch stored with ID: ${batchId}\n`);

    // Test 6: Update proof with batch info
    console.log('7️⃣  Testing proof batch update...');
    await db.updateProofBatch(testProof.hash, batchId, 0);
    const updatedProof = await db.getProofByHash(testProof.hash);
    if (updatedProof && updatedProof.batch_id === batchId && updatedProof.merkle_index === 0) {
      console.log('   ✅ Proof batch update successful\n');
    } else {
      throw new Error('Proof batch update failed');
    }

    // Test 7: Get batch by ID
    console.log('8️⃣  Testing batch retrieval...');
    const retrievedBatch = await db.getBatchById(batchId);
    if (retrievedBatch && retrievedBatch.root === testBatch.root) {
      console.log('   ✅ Batch retrieved successfully');
      console.log(`      Root: ${retrievedBatch.root}`);
      console.log(`      Size: ${retrievedBatch.size}\n`);
    } else {
      throw new Error('Batch retrieval failed');
    }

    // Test 8: Test counts
    console.log('9️⃣  Testing counts...');
    const totalProofs = await db.getTotalProofs();
    const pendingCount = await db.getPendingCount();
    console.log(`   ✅ Total proofs: ${totalProofs}`);
    console.log(`   ✅ Pending proofs: ${pendingCount}\n`);

    // Test 9: Test reputation
    console.log('🔟 Testing reputation storage...');
    await db.storeReputation('did:pohw:test:123', {
      score: 75.5,
      tier: 'blue',
      successfulProofs: 5,
      anomalies: 0
    });
    const reputation = await db.getReputation('did:pohw:test:123');
    if (reputation && reputation.score === 75.5) {
      console.log('   ✅ Reputation storage successful');
      console.log(`      Score: ${reputation.score}`);
      console.log(`      Tier: ${reputation.tier}\n`);
    } else {
      throw new Error('Reputation storage failed');
    }

    // Test 10: Test challenge storage
    console.log('1️⃣1️⃣  Testing challenge storage...');
    const challengeId = await db.storeChallenge({
      proof_hash: testProof.hash,
      proof_did: testProof.did,
      challenger_did: 'did:pohw:challenger:456',
      reason: 'suspected_ai_generated',
      description: 'Test challenge',
      status: 'pending',
      created_at: new Date().toISOString()
    });
    console.log(`   ✅ Challenge stored with ID: ${challengeId}\n`);

    // Test 11: Retrieve challenges
    console.log('1️⃣2️⃣  Testing challenge retrieval...');
    const challenges = await db.getChallengesByProofHash(testProof.hash);
    if (challenges.length > 0) {
      console.log(`   ✅ Found ${challenges.length} challenge(s)\n`);
    } else {
      throw new Error('Challenge retrieval failed');
    }

    console.log('✅ All tests passed!\n');
    console.log('📊 Summary:');
    console.log(`   • Proofs stored: ${await db.getTotalProofs()}`);
    console.log(`   • Batches stored: ${(await db.getAllBatches()).length}`);
    console.log(`   • Pending proofs: ${await db.getPendingCount()}\n`);

    // Close connection
    await db.close();
    console.log('🔌 Database connection closed');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testPostgreSQL().catch(console.error);


 * Tests the PostgreSQL database adapter implementation
 */

import { PostgreSQLDatabase } from './src/database-postgres';
import { ProofRecord, MerkleBatch } from './src/types';

async function testPostgreSQL() {
  console.log('🧪 Testing PostgreSQL Database Adapter\n');

  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('⚠️  DATABASE_URL not set. Using default connection string.');
    console.log('   Set DATABASE_URL environment variable to use a specific database.\n');
  }

  let db: PostgreSQLDatabase;
  try {
    // Initialize database
    console.log('1️⃣  Initializing database connection...');
    db = new PostgreSQLDatabase(databaseUrl);
    await db.initialize();
    console.log('   ✅ Database schema initialized\n');

    // Test 1: Store a proof
    console.log('2️⃣  Testing proof storage...');
    const testProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0x' + 'a'.repeat(64),
      signature: '0x' + 'b'.repeat(128),
      did: 'did:pohw:test:123',
      timestamp: new Date().toISOString(),
      process_digest: '0x' + 'c'.repeat(64),
      compound_hash: '0x' + 'd'.repeat(64),
      assistance_profile: 'human-only'
    };

    const proofId = await db.storeProof(testProof);
    console.log(`   ✅ Proof stored with ID: ${proofId}\n`);

    // Test 2: Retrieve proof by hash
    console.log('3️⃣  Testing proof retrieval by hash...');
    const retrievedProof = await db.getProofByHash(testProof.hash);
    if (retrievedProof && retrievedProof.hash === testProof.hash) {
      console.log('   ✅ Proof retrieved successfully');
      console.log(`      DID: ${retrievedProof.did}`);
      console.log(`      Timestamp: ${retrievedProof.timestamp}`);
      console.log(`      Assistance Profile: ${retrievedProof.assistance_profile}\n`);
    } else {
      throw new Error('Proof retrieval failed');
    }

    // Test 3: Test compound hash lookup
    console.log('4️⃣  Testing compound hash lookup...');
    const byCompoundHash = await db.getProofByCompoundHash(testProof.compound_hash!);
    if (byCompoundHash && byCompoundHash.compound_hash === testProof.compound_hash) {
      console.log('   ✅ Compound hash lookup successful\n');
    } else {
      throw new Error('Compound hash lookup failed');
    }

    // Test 4: Test pending proofs
    console.log('5️⃣  Testing pending proofs...');
    const pendingProofs = await db.getPendingProofs();
    console.log(`   ✅ Found ${pendingProofs.length} pending proof(s)\n`);

    // Test 5: Store a batch
    console.log('6️⃣  Testing batch storage...');
    const testBatch: Omit<MerkleBatch, 'created_at'> = {
      id: 'test-batch-' + Date.now(),
      root: '0x' + 'e'.repeat(64),
      size: 100
    };
    const batchId = await db.storeMerkleBatch(testBatch);
    console.log(`   ✅ Batch stored with ID: ${batchId}\n`);

    // Test 6: Update proof with batch info
    console.log('7️⃣  Testing proof batch update...');
    await db.updateProofBatch(testProof.hash, batchId, 0);
    const updatedProof = await db.getProofByHash(testProof.hash);
    if (updatedProof && updatedProof.batch_id === batchId && updatedProof.merkle_index === 0) {
      console.log('   ✅ Proof batch update successful\n');
    } else {
      throw new Error('Proof batch update failed');
    }

    // Test 7: Get batch by ID
    console.log('8️⃣  Testing batch retrieval...');
    const retrievedBatch = await db.getBatchById(batchId);
    if (retrievedBatch && retrievedBatch.root === testBatch.root) {
      console.log('   ✅ Batch retrieved successfully');
      console.log(`      Root: ${retrievedBatch.root}`);
      console.log(`      Size: ${retrievedBatch.size}\n`);
    } else {
      throw new Error('Batch retrieval failed');
    }

    // Test 8: Test counts
    console.log('9️⃣  Testing counts...');
    const totalProofs = await db.getTotalProofs();
    const pendingCount = await db.getPendingCount();
    console.log(`   ✅ Total proofs: ${totalProofs}`);
    console.log(`   ✅ Pending proofs: ${pendingCount}\n`);

    // Test 9: Test reputation
    console.log('🔟 Testing reputation storage...');
    await db.storeReputation('did:pohw:test:123', {
      score: 75.5,
      tier: 'blue',
      successfulProofs: 5,
      anomalies: 0
    });
    const reputation = await db.getReputation('did:pohw:test:123');
    if (reputation && reputation.score === 75.5) {
      console.log('   ✅ Reputation storage successful');
      console.log(`      Score: ${reputation.score}`);
      console.log(`      Tier: ${reputation.tier}\n`);
    } else {
      throw new Error('Reputation storage failed');
    }

    // Test 10: Test challenge storage
    console.log('1️⃣1️⃣  Testing challenge storage...');
    const challengeId = await db.storeChallenge({
      proof_hash: testProof.hash,
      proof_did: testProof.did,
      challenger_did: 'did:pohw:challenger:456',
      reason: 'suspected_ai_generated',
      description: 'Test challenge',
      status: 'pending',
      created_at: new Date().toISOString()
    });
    console.log(`   ✅ Challenge stored with ID: ${challengeId}\n`);

    // Test 11: Retrieve challenges
    console.log('1️⃣2️⃣  Testing challenge retrieval...');
    const challenges = await db.getChallengesByProofHash(testProof.hash);
    if (challenges.length > 0) {
      console.log(`   ✅ Found ${challenges.length} challenge(s)\n`);
    } else {
      throw new Error('Challenge retrieval failed');
    }

    console.log('✅ All tests passed!\n');
    console.log('📊 Summary:');
    console.log(`   • Proofs stored: ${await db.getTotalProofs()}`);
    console.log(`   • Batches stored: ${(await db.getAllBatches()).length}`);
    console.log(`   • Pending proofs: ${await db.getPendingCount()}\n`);

    // Close connection
    await db.close();
    console.log('🔌 Database connection closed');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testPostgreSQL().catch(console.error);


 * Tests the PostgreSQL database adapter implementation
 */

import { PostgreSQLDatabase } from './src/database-postgres';
import { ProofRecord, MerkleBatch } from './src/types';

async function testPostgreSQL() {
  console.log('🧪 Testing PostgreSQL Database Adapter\n');

  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('⚠️  DATABASE_URL not set. Using default connection string.');
    console.log('   Set DATABASE_URL environment variable to use a specific database.\n');
  }

  let db: PostgreSQLDatabase;
  try {
    // Initialize database
    console.log('1️⃣  Initializing database connection...');
    db = new PostgreSQLDatabase(databaseUrl);
    await db.initialize();
    console.log('   ✅ Database schema initialized\n');

    // Test 1: Store a proof
    console.log('2️⃣  Testing proof storage...');
    const testProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0x' + 'a'.repeat(64),
      signature: '0x' + 'b'.repeat(128),
      did: 'did:pohw:test:123',
      timestamp: new Date().toISOString(),
      process_digest: '0x' + 'c'.repeat(64),
      compound_hash: '0x' + 'd'.repeat(64),
      assistance_profile: 'human-only'
    };

    const proofId = await db.storeProof(testProof);
    console.log(`   ✅ Proof stored with ID: ${proofId}\n`);

    // Test 2: Retrieve proof by hash
    console.log('3️⃣  Testing proof retrieval by hash...');
    const retrievedProof = await db.getProofByHash(testProof.hash);
    if (retrievedProof && retrievedProof.hash === testProof.hash) {
      console.log('   ✅ Proof retrieved successfully');
      console.log(`      DID: ${retrievedProof.did}`);
      console.log(`      Timestamp: ${retrievedProof.timestamp}`);
      console.log(`      Assistance Profile: ${retrievedProof.assistance_profile}\n`);
    } else {
      throw new Error('Proof retrieval failed');
    }

    // Test 3: Test compound hash lookup
    console.log('4️⃣  Testing compound hash lookup...');
    const byCompoundHash = await db.getProofByCompoundHash(testProof.compound_hash!);
    if (byCompoundHash && byCompoundHash.compound_hash === testProof.compound_hash) {
      console.log('   ✅ Compound hash lookup successful\n');
    } else {
      throw new Error('Compound hash lookup failed');
    }

    // Test 4: Test pending proofs
    console.log('5️⃣  Testing pending proofs...');
    const pendingProofs = await db.getPendingProofs();
    console.log(`   ✅ Found ${pendingProofs.length} pending proof(s)\n`);

    // Test 5: Store a batch
    console.log('6️⃣  Testing batch storage...');
    const testBatch: Omit<MerkleBatch, 'created_at'> = {
      id: 'test-batch-' + Date.now(),
      root: '0x' + 'e'.repeat(64),
      size: 100
    };
    const batchId = await db.storeMerkleBatch(testBatch);
    console.log(`   ✅ Batch stored with ID: ${batchId}\n`);

    // Test 6: Update proof with batch info
    console.log('7️⃣  Testing proof batch update...');
    await db.updateProofBatch(testProof.hash, batchId, 0);
    const updatedProof = await db.getProofByHash(testProof.hash);
    if (updatedProof && updatedProof.batch_id === batchId && updatedProof.merkle_index === 0) {
      console.log('   ✅ Proof batch update successful\n');
    } else {
      throw new Error('Proof batch update failed');
    }

    // Test 7: Get batch by ID
    console.log('8️⃣  Testing batch retrieval...');
    const retrievedBatch = await db.getBatchById(batchId);
    if (retrievedBatch && retrievedBatch.root === testBatch.root) {
      console.log('   ✅ Batch retrieved successfully');
      console.log(`      Root: ${retrievedBatch.root}`);
      console.log(`      Size: ${retrievedBatch.size}\n`);
    } else {
      throw new Error('Batch retrieval failed');
    }

    // Test 8: Test counts
    console.log('9️⃣  Testing counts...');
    const totalProofs = await db.getTotalProofs();
    const pendingCount = await db.getPendingCount();
    console.log(`   ✅ Total proofs: ${totalProofs}`);
    console.log(`   ✅ Pending proofs: ${pendingCount}\n`);

    // Test 9: Test reputation
    console.log('🔟 Testing reputation storage...');
    await db.storeReputation('did:pohw:test:123', {
      score: 75.5,
      tier: 'blue',
      successfulProofs: 5,
      anomalies: 0
    });
    const reputation = await db.getReputation('did:pohw:test:123');
    if (reputation && reputation.score === 75.5) {
      console.log('   ✅ Reputation storage successful');
      console.log(`      Score: ${reputation.score}`);
      console.log(`      Tier: ${reputation.tier}\n`);
    } else {
      throw new Error('Reputation storage failed');
    }

    // Test 10: Test challenge storage
    console.log('1️⃣1️⃣  Testing challenge storage...');
    const challengeId = await db.storeChallenge({
      proof_hash: testProof.hash,
      proof_did: testProof.did,
      challenger_did: 'did:pohw:challenger:456',
      reason: 'suspected_ai_generated',
      description: 'Test challenge',
      status: 'pending',
      created_at: new Date().toISOString()
    });
    console.log(`   ✅ Challenge stored with ID: ${challengeId}\n`);

    // Test 11: Retrieve challenges
    console.log('1️⃣2️⃣  Testing challenge retrieval...');
    const challenges = await db.getChallengesByProofHash(testProof.hash);
    if (challenges.length > 0) {
      console.log(`   ✅ Found ${challenges.length} challenge(s)\n`);
    } else {
      throw new Error('Challenge retrieval failed');
    }

    console.log('✅ All tests passed!\n');
    console.log('📊 Summary:');
    console.log(`   • Proofs stored: ${await db.getTotalProofs()}`);
    console.log(`   • Batches stored: ${(await db.getAllBatches()).length}`);
    console.log(`   • Pending proofs: ${await db.getPendingCount()}\n`);

    // Close connection
    await db.close();
    console.log('🔌 Database connection closed');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testPostgreSQL().catch(console.error);


 * Tests the PostgreSQL database adapter implementation
 */

import { PostgreSQLDatabase } from './src/database-postgres';
import { ProofRecord, MerkleBatch } from './src/types';

async function testPostgreSQL() {
  console.log('🧪 Testing PostgreSQL Database Adapter\n');

  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('⚠️  DATABASE_URL not set. Using default connection string.');
    console.log('   Set DATABASE_URL environment variable to use a specific database.\n');
  }

  let db: PostgreSQLDatabase;
  try {
    // Initialize database
    console.log('1️⃣  Initializing database connection...');
    db = new PostgreSQLDatabase(databaseUrl);
    await db.initialize();
    console.log('   ✅ Database schema initialized\n');

    // Test 1: Store a proof
    console.log('2️⃣  Testing proof storage...');
    const testProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0x' + 'a'.repeat(64),
      signature: '0x' + 'b'.repeat(128),
      did: 'did:pohw:test:123',
      timestamp: new Date().toISOString(),
      process_digest: '0x' + 'c'.repeat(64),
      compound_hash: '0x' + 'd'.repeat(64),
      assistance_profile: 'human-only'
    };

    const proofId = await db.storeProof(testProof);
    console.log(`   ✅ Proof stored with ID: ${proofId}\n`);

    // Test 2: Retrieve proof by hash
    console.log('3️⃣  Testing proof retrieval by hash...');
    const retrievedProof = await db.getProofByHash(testProof.hash);
    if (retrievedProof && retrievedProof.hash === testProof.hash) {
      console.log('   ✅ Proof retrieved successfully');
      console.log(`      DID: ${retrievedProof.did}`);
      console.log(`      Timestamp: ${retrievedProof.timestamp}`);
      console.log(`      Assistance Profile: ${retrievedProof.assistance_profile}\n`);
    } else {
      throw new Error('Proof retrieval failed');
    }

    // Test 3: Test compound hash lookup
    console.log('4️⃣  Testing compound hash lookup...');
    const byCompoundHash = await db.getProofByCompoundHash(testProof.compound_hash!);
    if (byCompoundHash && byCompoundHash.compound_hash === testProof.compound_hash) {
      console.log('   ✅ Compound hash lookup successful\n');
    } else {
      throw new Error('Compound hash lookup failed');
    }

    // Test 4: Test pending proofs
    console.log('5️⃣  Testing pending proofs...');
    const pendingProofs = await db.getPendingProofs();
    console.log(`   ✅ Found ${pendingProofs.length} pending proof(s)\n`);

    // Test 5: Store a batch
    console.log('6️⃣  Testing batch storage...');
    const testBatch: Omit<MerkleBatch, 'created_at'> = {
      id: 'test-batch-' + Date.now(),
      root: '0x' + 'e'.repeat(64),
      size: 100
    };
    const batchId = await db.storeMerkleBatch(testBatch);
    console.log(`   ✅ Batch stored with ID: ${batchId}\n`);

    // Test 6: Update proof with batch info
    console.log('7️⃣  Testing proof batch update...');
    await db.updateProofBatch(testProof.hash, batchId, 0);
    const updatedProof = await db.getProofByHash(testProof.hash);
    if (updatedProof && updatedProof.batch_id === batchId && updatedProof.merkle_index === 0) {
      console.log('   ✅ Proof batch update successful\n');
    } else {
      throw new Error('Proof batch update failed');
    }

    // Test 7: Get batch by ID
    console.log('8️⃣  Testing batch retrieval...');
    const retrievedBatch = await db.getBatchById(batchId);
    if (retrievedBatch && retrievedBatch.root === testBatch.root) {
      console.log('   ✅ Batch retrieved successfully');
      console.log(`      Root: ${retrievedBatch.root}`);
      console.log(`      Size: ${retrievedBatch.size}\n`);
    } else {
      throw new Error('Batch retrieval failed');
    }

    // Test 8: Test counts
    console.log('9️⃣  Testing counts...');
    const totalProofs = await db.getTotalProofs();
    const pendingCount = await db.getPendingCount();
    console.log(`   ✅ Total proofs: ${totalProofs}`);
    console.log(`   ✅ Pending proofs: ${pendingCount}\n`);

    // Test 9: Test reputation
    console.log('🔟 Testing reputation storage...');
    await db.storeReputation('did:pohw:test:123', {
      score: 75.5,
      tier: 'blue',
      successfulProofs: 5,
      anomalies: 0
    });
    const reputation = await db.getReputation('did:pohw:test:123');
    if (reputation && reputation.score === 75.5) {
      console.log('   ✅ Reputation storage successful');
      console.log(`      Score: ${reputation.score}`);
      console.log(`      Tier: ${reputation.tier}\n`);
    } else {
      throw new Error('Reputation storage failed');
    }

    // Test 10: Test challenge storage
    console.log('1️⃣1️⃣  Testing challenge storage...');
    const challengeId = await db.storeChallenge({
      proof_hash: testProof.hash,
      proof_did: testProof.did,
      challenger_did: 'did:pohw:challenger:456',
      reason: 'suspected_ai_generated',
      description: 'Test challenge',
      status: 'pending',
      created_at: new Date().toISOString()
    });
    console.log(`   ✅ Challenge stored with ID: ${challengeId}\n`);

    // Test 11: Retrieve challenges
    console.log('1️⃣2️⃣  Testing challenge retrieval...');
    const challenges = await db.getChallengesByProofHash(testProof.hash);
    if (challenges.length > 0) {
      console.log(`   ✅ Found ${challenges.length} challenge(s)\n`);
    } else {
      throw new Error('Challenge retrieval failed');
    }

    console.log('✅ All tests passed!\n');
    console.log('📊 Summary:');
    console.log(`   • Proofs stored: ${await db.getTotalProofs()}`);
    console.log(`   • Batches stored: ${(await db.getAllBatches()).length}`);
    console.log(`   • Pending proofs: ${await db.getPendingCount()}\n`);

    // Close connection
    await db.close();
    console.log('🔌 Database connection closed');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testPostgreSQL().catch(console.error);


 * Tests the PostgreSQL database adapter implementation
 */

import { PostgreSQLDatabase } from './src/database-postgres';
import { ProofRecord, MerkleBatch } from './src/types';

async function testPostgreSQL() {
  console.log('🧪 Testing PostgreSQL Database Adapter\n');

  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('⚠️  DATABASE_URL not set. Using default connection string.');
    console.log('   Set DATABASE_URL environment variable to use a specific database.\n');
  }

  let db: PostgreSQLDatabase;
  try {
    // Initialize database
    console.log('1️⃣  Initializing database connection...');
    db = new PostgreSQLDatabase(databaseUrl);
    await db.initialize();
    console.log('   ✅ Database schema initialized\n');

    // Test 1: Store a proof
    console.log('2️⃣  Testing proof storage...');
    const testProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0x' + 'a'.repeat(64),
      signature: '0x' + 'b'.repeat(128),
      did: 'did:pohw:test:123',
      timestamp: new Date().toISOString(),
      process_digest: '0x' + 'c'.repeat(64),
      compound_hash: '0x' + 'd'.repeat(64),
      assistance_profile: 'human-only'
    };

    const proofId = await db.storeProof(testProof);
    console.log(`   ✅ Proof stored with ID: ${proofId}\n`);

    // Test 2: Retrieve proof by hash
    console.log('3️⃣  Testing proof retrieval by hash...');
    const retrievedProof = await db.getProofByHash(testProof.hash);
    if (retrievedProof && retrievedProof.hash === testProof.hash) {
      console.log('   ✅ Proof retrieved successfully');
      console.log(`      DID: ${retrievedProof.did}`);
      console.log(`      Timestamp: ${retrievedProof.timestamp}`);
      console.log(`      Assistance Profile: ${retrievedProof.assistance_profile}\n`);
    } else {
      throw new Error('Proof retrieval failed');
    }

    // Test 3: Test compound hash lookup
    console.log('4️⃣  Testing compound hash lookup...');
    const byCompoundHash = await db.getProofByCompoundHash(testProof.compound_hash!);
    if (byCompoundHash && byCompoundHash.compound_hash === testProof.compound_hash) {
      console.log('   ✅ Compound hash lookup successful\n');
    } else {
      throw new Error('Compound hash lookup failed');
    }

    // Test 4: Test pending proofs
    console.log('5️⃣  Testing pending proofs...');
    const pendingProofs = await db.getPendingProofs();
    console.log(`   ✅ Found ${pendingProofs.length} pending proof(s)\n`);

    // Test 5: Store a batch
    console.log('6️⃣  Testing batch storage...');
    const testBatch: Omit<MerkleBatch, 'created_at'> = {
      id: 'test-batch-' + Date.now(),
      root: '0x' + 'e'.repeat(64),
      size: 100
    };
    const batchId = await db.storeMerkleBatch(testBatch);
    console.log(`   ✅ Batch stored with ID: ${batchId}\n`);

    // Test 6: Update proof with batch info
    console.log('7️⃣  Testing proof batch update...');
    await db.updateProofBatch(testProof.hash, batchId, 0);
    const updatedProof = await db.getProofByHash(testProof.hash);
    if (updatedProof && updatedProof.batch_id === batchId && updatedProof.merkle_index === 0) {
      console.log('   ✅ Proof batch update successful\n');
    } else {
      throw new Error('Proof batch update failed');
    }

    // Test 7: Get batch by ID
    console.log('8️⃣  Testing batch retrieval...');
    const retrievedBatch = await db.getBatchById(batchId);
    if (retrievedBatch && retrievedBatch.root === testBatch.root) {
      console.log('   ✅ Batch retrieved successfully');
      console.log(`      Root: ${retrievedBatch.root}`);
      console.log(`      Size: ${retrievedBatch.size}\n`);
    } else {
      throw new Error('Batch retrieval failed');
    }

    // Test 8: Test counts
    console.log('9️⃣  Testing counts...');
    const totalProofs = await db.getTotalProofs();
    const pendingCount = await db.getPendingCount();
    console.log(`   ✅ Total proofs: ${totalProofs}`);
    console.log(`   ✅ Pending proofs: ${pendingCount}\n`);

    // Test 9: Test reputation
    console.log('🔟 Testing reputation storage...');
    await db.storeReputation('did:pohw:test:123', {
      score: 75.5,
      tier: 'blue',
      successfulProofs: 5,
      anomalies: 0
    });
    const reputation = await db.getReputation('did:pohw:test:123');
    if (reputation && reputation.score === 75.5) {
      console.log('   ✅ Reputation storage successful');
      console.log(`      Score: ${reputation.score}`);
      console.log(`      Tier: ${reputation.tier}\n`);
    } else {
      throw new Error('Reputation storage failed');
    }

    // Test 10: Test challenge storage
    console.log('1️⃣1️⃣  Testing challenge storage...');
    const challengeId = await db.storeChallenge({
      proof_hash: testProof.hash,
      proof_did: testProof.did,
      challenger_did: 'did:pohw:challenger:456',
      reason: 'suspected_ai_generated',
      description: 'Test challenge',
      status: 'pending',
      created_at: new Date().toISOString()
    });
    console.log(`   ✅ Challenge stored with ID: ${challengeId}\n`);

    // Test 11: Retrieve challenges
    console.log('1️⃣2️⃣  Testing challenge retrieval...');
    const challenges = await db.getChallengesByProofHash(testProof.hash);
    if (challenges.length > 0) {
      console.log(`   ✅ Found ${challenges.length} challenge(s)\n`);
    } else {
      throw new Error('Challenge retrieval failed');
    }

    console.log('✅ All tests passed!\n');
    console.log('📊 Summary:');
    console.log(`   • Proofs stored: ${await db.getTotalProofs()}`);
    console.log(`   • Batches stored: ${(await db.getAllBatches()).length}`);
    console.log(`   • Pending proofs: ${await db.getPendingCount()}\n`);

    // Close connection
    await db.close();
    console.log('🔌 Database connection closed');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testPostgreSQL().catch(console.error);


 * Tests the PostgreSQL database adapter implementation
 */

import { PostgreSQLDatabase } from './src/database-postgres';
import { ProofRecord, MerkleBatch } from './src/types';

async function testPostgreSQL() {
  console.log('🧪 Testing PostgreSQL Database Adapter\n');

  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('⚠️  DATABASE_URL not set. Using default connection string.');
    console.log('   Set DATABASE_URL environment variable to use a specific database.\n');
  }

  let db: PostgreSQLDatabase;
  try {
    // Initialize database
    console.log('1️⃣  Initializing database connection...');
    db = new PostgreSQLDatabase(databaseUrl);
    await db.initialize();
    console.log('   ✅ Database schema initialized\n');

    // Test 1: Store a proof
    console.log('2️⃣  Testing proof storage...');
    const testProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0x' + 'a'.repeat(64),
      signature: '0x' + 'b'.repeat(128),
      did: 'did:pohw:test:123',
      timestamp: new Date().toISOString(),
      process_digest: '0x' + 'c'.repeat(64),
      compound_hash: '0x' + 'd'.repeat(64),
      assistance_profile: 'human-only'
    };

    const proofId = await db.storeProof(testProof);
    console.log(`   ✅ Proof stored with ID: ${proofId}\n`);

    // Test 2: Retrieve proof by hash
    console.log('3️⃣  Testing proof retrieval by hash...');
    const retrievedProof = await db.getProofByHash(testProof.hash);
    if (retrievedProof && retrievedProof.hash === testProof.hash) {
      console.log('   ✅ Proof retrieved successfully');
      console.log(`      DID: ${retrievedProof.did}`);
      console.log(`      Timestamp: ${retrievedProof.timestamp}`);
      console.log(`      Assistance Profile: ${retrievedProof.assistance_profile}\n`);
    } else {
      throw new Error('Proof retrieval failed');
    }

    // Test 3: Test compound hash lookup
    console.log('4️⃣  Testing compound hash lookup...');
    const byCompoundHash = await db.getProofByCompoundHash(testProof.compound_hash!);
    if (byCompoundHash && byCompoundHash.compound_hash === testProof.compound_hash) {
      console.log('   ✅ Compound hash lookup successful\n');
    } else {
      throw new Error('Compound hash lookup failed');
    }

    // Test 4: Test pending proofs
    console.log('5️⃣  Testing pending proofs...');
    const pendingProofs = await db.getPendingProofs();
    console.log(`   ✅ Found ${pendingProofs.length} pending proof(s)\n`);

    // Test 5: Store a batch
    console.log('6️⃣  Testing batch storage...');
    const testBatch: Omit<MerkleBatch, 'created_at'> = {
      id: 'test-batch-' + Date.now(),
      root: '0x' + 'e'.repeat(64),
      size: 100
    };
    const batchId = await db.storeMerkleBatch(testBatch);
    console.log(`   ✅ Batch stored with ID: ${batchId}\n`);

    // Test 6: Update proof with batch info
    console.log('7️⃣  Testing proof batch update...');
    await db.updateProofBatch(testProof.hash, batchId, 0);
    const updatedProof = await db.getProofByHash(testProof.hash);
    if (updatedProof && updatedProof.batch_id === batchId && updatedProof.merkle_index === 0) {
      console.log('   ✅ Proof batch update successful\n');
    } else {
      throw new Error('Proof batch update failed');
    }

    // Test 7: Get batch by ID
    console.log('8️⃣  Testing batch retrieval...');
    const retrievedBatch = await db.getBatchById(batchId);
    if (retrievedBatch && retrievedBatch.root === testBatch.root) {
      console.log('   ✅ Batch retrieved successfully');
      console.log(`      Root: ${retrievedBatch.root}`);
      console.log(`      Size: ${retrievedBatch.size}\n`);
    } else {
      throw new Error('Batch retrieval failed');
    }

    // Test 8: Test counts
    console.log('9️⃣  Testing counts...');
    const totalProofs = await db.getTotalProofs();
    const pendingCount = await db.getPendingCount();
    console.log(`   ✅ Total proofs: ${totalProofs}`);
    console.log(`   ✅ Pending proofs: ${pendingCount}\n`);

    // Test 9: Test reputation
    console.log('🔟 Testing reputation storage...');
    await db.storeReputation('did:pohw:test:123', {
      score: 75.5,
      tier: 'blue',
      successfulProofs: 5,
      anomalies: 0
    });
    const reputation = await db.getReputation('did:pohw:test:123');
    if (reputation && reputation.score === 75.5) {
      console.log('   ✅ Reputation storage successful');
      console.log(`      Score: ${reputation.score}`);
      console.log(`      Tier: ${reputation.tier}\n`);
    } else {
      throw new Error('Reputation storage failed');
    }

    // Test 10: Test challenge storage
    console.log('1️⃣1️⃣  Testing challenge storage...');
    const challengeId = await db.storeChallenge({
      proof_hash: testProof.hash,
      proof_did: testProof.did,
      challenger_did: 'did:pohw:challenger:456',
      reason: 'suspected_ai_generated',
      description: 'Test challenge',
      status: 'pending',
      created_at: new Date().toISOString()
    });
    console.log(`   ✅ Challenge stored with ID: ${challengeId}\n`);

    // Test 11: Retrieve challenges
    console.log('1️⃣2️⃣  Testing challenge retrieval...');
    const challenges = await db.getChallengesByProofHash(testProof.hash);
    if (challenges.length > 0) {
      console.log(`   ✅ Found ${challenges.length} challenge(s)\n`);
    } else {
      throw new Error('Challenge retrieval failed');
    }

    console.log('✅ All tests passed!\n');
    console.log('📊 Summary:');
    console.log(`   • Proofs stored: ${await db.getTotalProofs()}`);
    console.log(`   • Batches stored: ${(await db.getAllBatches()).length}`);
    console.log(`   • Pending proofs: ${await db.getPendingCount()}\n`);

    // Close connection
    await db.close();
    console.log('🔌 Database connection closed');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testPostgreSQL().catch(console.error);


 * Tests the PostgreSQL database adapter implementation
 */

import { PostgreSQLDatabase } from './src/database-postgres';
import { ProofRecord, MerkleBatch } from './src/types';

async function testPostgreSQL() {
  console.log('🧪 Testing PostgreSQL Database Adapter\n');

  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('⚠️  DATABASE_URL not set. Using default connection string.');
    console.log('   Set DATABASE_URL environment variable to use a specific database.\n');
  }

  let db: PostgreSQLDatabase;
  try {
    // Initialize database
    console.log('1️⃣  Initializing database connection...');
    db = new PostgreSQLDatabase(databaseUrl);
    await db.initialize();
    console.log('   ✅ Database schema initialized\n');

    // Test 1: Store a proof
    console.log('2️⃣  Testing proof storage...');
    const testProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0x' + 'a'.repeat(64),
      signature: '0x' + 'b'.repeat(128),
      did: 'did:pohw:test:123',
      timestamp: new Date().toISOString(),
      process_digest: '0x' + 'c'.repeat(64),
      compound_hash: '0x' + 'd'.repeat(64),
      assistance_profile: 'human-only'
    };

    const proofId = await db.storeProof(testProof);
    console.log(`   ✅ Proof stored with ID: ${proofId}\n`);

    // Test 2: Retrieve proof by hash
    console.log('3️⃣  Testing proof retrieval by hash...');
    const retrievedProof = await db.getProofByHash(testProof.hash);
    if (retrievedProof && retrievedProof.hash === testProof.hash) {
      console.log('   ✅ Proof retrieved successfully');
      console.log(`      DID: ${retrievedProof.did}`);
      console.log(`      Timestamp: ${retrievedProof.timestamp}`);
      console.log(`      Assistance Profile: ${retrievedProof.assistance_profile}\n`);
    } else {
      throw new Error('Proof retrieval failed');
    }

    // Test 3: Test compound hash lookup
    console.log('4️⃣  Testing compound hash lookup...');
    const byCompoundHash = await db.getProofByCompoundHash(testProof.compound_hash!);
    if (byCompoundHash && byCompoundHash.compound_hash === testProof.compound_hash) {
      console.log('   ✅ Compound hash lookup successful\n');
    } else {
      throw new Error('Compound hash lookup failed');
    }

    // Test 4: Test pending proofs
    console.log('5️⃣  Testing pending proofs...');
    const pendingProofs = await db.getPendingProofs();
    console.log(`   ✅ Found ${pendingProofs.length} pending proof(s)\n`);

    // Test 5: Store a batch
    console.log('6️⃣  Testing batch storage...');
    const testBatch: Omit<MerkleBatch, 'created_at'> = {
      id: 'test-batch-' + Date.now(),
      root: '0x' + 'e'.repeat(64),
      size: 100
    };
    const batchId = await db.storeMerkleBatch(testBatch);
    console.log(`   ✅ Batch stored with ID: ${batchId}\n`);

    // Test 6: Update proof with batch info
    console.log('7️⃣  Testing proof batch update...');
    await db.updateProofBatch(testProof.hash, batchId, 0);
    const updatedProof = await db.getProofByHash(testProof.hash);
    if (updatedProof && updatedProof.batch_id === batchId && updatedProof.merkle_index === 0) {
      console.log('   ✅ Proof batch update successful\n');
    } else {
      throw new Error('Proof batch update failed');
    }

    // Test 7: Get batch by ID
    console.log('8️⃣  Testing batch retrieval...');
    const retrievedBatch = await db.getBatchById(batchId);
    if (retrievedBatch && retrievedBatch.root === testBatch.root) {
      console.log('   ✅ Batch retrieved successfully');
      console.log(`      Root: ${retrievedBatch.root}`);
      console.log(`      Size: ${retrievedBatch.size}\n`);
    } else {
      throw new Error('Batch retrieval failed');
    }

    // Test 8: Test counts
    console.log('9️⃣  Testing counts...');
    const totalProofs = await db.getTotalProofs();
    const pendingCount = await db.getPendingCount();
    console.log(`   ✅ Total proofs: ${totalProofs}`);
    console.log(`   ✅ Pending proofs: ${pendingCount}\n`);

    // Test 9: Test reputation
    console.log('🔟 Testing reputation storage...');
    await db.storeReputation('did:pohw:test:123', {
      score: 75.5,
      tier: 'blue',
      successfulProofs: 5,
      anomalies: 0
    });
    const reputation = await db.getReputation('did:pohw:test:123');
    if (reputation && reputation.score === 75.5) {
      console.log('   ✅ Reputation storage successful');
      console.log(`      Score: ${reputation.score}`);
      console.log(`      Tier: ${reputation.tier}\n`);
    } else {
      throw new Error('Reputation storage failed');
    }

    // Test 10: Test challenge storage
    console.log('1️⃣1️⃣  Testing challenge storage...');
    const challengeId = await db.storeChallenge({
      proof_hash: testProof.hash,
      proof_did: testProof.did,
      challenger_did: 'did:pohw:challenger:456',
      reason: 'suspected_ai_generated',
      description: 'Test challenge',
      status: 'pending',
      created_at: new Date().toISOString()
    });
    console.log(`   ✅ Challenge stored with ID: ${challengeId}\n`);

    // Test 11: Retrieve challenges
    console.log('1️⃣2️⃣  Testing challenge retrieval...');
    const challenges = await db.getChallengesByProofHash(testProof.hash);
    if (challenges.length > 0) {
      console.log(`   ✅ Found ${challenges.length} challenge(s)\n`);
    } else {
      throw new Error('Challenge retrieval failed');
    }

    console.log('✅ All tests passed!\n');
    console.log('📊 Summary:');
    console.log(`   • Proofs stored: ${await db.getTotalProofs()}`);
    console.log(`   • Batches stored: ${(await db.getAllBatches()).length}`);
    console.log(`   • Pending proofs: ${await db.getPendingCount()}\n`);

    // Close connection
    await db.close();
    console.log('🔌 Database connection closed');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testPostgreSQL().catch(console.error);


 * Tests the PostgreSQL database adapter implementation
 */

import { PostgreSQLDatabase } from './src/database-postgres';
import { ProofRecord, MerkleBatch } from './src/types';

async function testPostgreSQL() {
  console.log('🧪 Testing PostgreSQL Database Adapter\n');

  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('⚠️  DATABASE_URL not set. Using default connection string.');
    console.log('   Set DATABASE_URL environment variable to use a specific database.\n');
  }

  let db: PostgreSQLDatabase;
  try {
    // Initialize database
    console.log('1️⃣  Initializing database connection...');
    db = new PostgreSQLDatabase(databaseUrl);
    await db.initialize();
    console.log('   ✅ Database schema initialized\n');

    // Test 1: Store a proof
    console.log('2️⃣  Testing proof storage...');
    const testProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0x' + 'a'.repeat(64),
      signature: '0x' + 'b'.repeat(128),
      did: 'did:pohw:test:123',
      timestamp: new Date().toISOString(),
      process_digest: '0x' + 'c'.repeat(64),
      compound_hash: '0x' + 'd'.repeat(64),
      assistance_profile: 'human-only'
    };

    const proofId = await db.storeProof(testProof);
    console.log(`   ✅ Proof stored with ID: ${proofId}\n`);

    // Test 2: Retrieve proof by hash
    console.log('3️⃣  Testing proof retrieval by hash...');
    const retrievedProof = await db.getProofByHash(testProof.hash);
    if (retrievedProof && retrievedProof.hash === testProof.hash) {
      console.log('   ✅ Proof retrieved successfully');
      console.log(`      DID: ${retrievedProof.did}`);
      console.log(`      Timestamp: ${retrievedProof.timestamp}`);
      console.log(`      Assistance Profile: ${retrievedProof.assistance_profile}\n`);
    } else {
      throw new Error('Proof retrieval failed');
    }

    // Test 3: Test compound hash lookup
    console.log('4️⃣  Testing compound hash lookup...');
    const byCompoundHash = await db.getProofByCompoundHash(testProof.compound_hash!);
    if (byCompoundHash && byCompoundHash.compound_hash === testProof.compound_hash) {
      console.log('   ✅ Compound hash lookup successful\n');
    } else {
      throw new Error('Compound hash lookup failed');
    }

    // Test 4: Test pending proofs
    console.log('5️⃣  Testing pending proofs...');
    const pendingProofs = await db.getPendingProofs();
    console.log(`   ✅ Found ${pendingProofs.length} pending proof(s)\n`);

    // Test 5: Store a batch
    console.log('6️⃣  Testing batch storage...');
    const testBatch: Omit<MerkleBatch, 'created_at'> = {
      id: 'test-batch-' + Date.now(),
      root: '0x' + 'e'.repeat(64),
      size: 100
    };
    const batchId = await db.storeMerkleBatch(testBatch);
    console.log(`   ✅ Batch stored with ID: ${batchId}\n`);

    // Test 6: Update proof with batch info
    console.log('7️⃣  Testing proof batch update...');
    await db.updateProofBatch(testProof.hash, batchId, 0);
    const updatedProof = await db.getProofByHash(testProof.hash);
    if (updatedProof && updatedProof.batch_id === batchId && updatedProof.merkle_index === 0) {
      console.log('   ✅ Proof batch update successful\n');
    } else {
      throw new Error('Proof batch update failed');
    }

    // Test 7: Get batch by ID
    console.log('8️⃣  Testing batch retrieval...');
    const retrievedBatch = await db.getBatchById(batchId);
    if (retrievedBatch && retrievedBatch.root === testBatch.root) {
      console.log('   ✅ Batch retrieved successfully');
      console.log(`      Root: ${retrievedBatch.root}`);
      console.log(`      Size: ${retrievedBatch.size}\n`);
    } else {
      throw new Error('Batch retrieval failed');
    }

    // Test 8: Test counts
    console.log('9️⃣  Testing counts...');
    const totalProofs = await db.getTotalProofs();
    const pendingCount = await db.getPendingCount();
    console.log(`   ✅ Total proofs: ${totalProofs}`);
    console.log(`   ✅ Pending proofs: ${pendingCount}\n`);

    // Test 9: Test reputation
    console.log('🔟 Testing reputation storage...');
    await db.storeReputation('did:pohw:test:123', {
      score: 75.5,
      tier: 'blue',
      successfulProofs: 5,
      anomalies: 0
    });
    const reputation = await db.getReputation('did:pohw:test:123');
    if (reputation && reputation.score === 75.5) {
      console.log('   ✅ Reputation storage successful');
      console.log(`      Score: ${reputation.score}`);
      console.log(`      Tier: ${reputation.tier}\n`);
    } else {
      throw new Error('Reputation storage failed');
    }

    // Test 10: Test challenge storage
    console.log('1️⃣1️⃣  Testing challenge storage...');
    const challengeId = await db.storeChallenge({
      proof_hash: testProof.hash,
      proof_did: testProof.did,
      challenger_did: 'did:pohw:challenger:456',
      reason: 'suspected_ai_generated',
      description: 'Test challenge',
      status: 'pending',
      created_at: new Date().toISOString()
    });
    console.log(`   ✅ Challenge stored with ID: ${challengeId}\n`);

    // Test 11: Retrieve challenges
    console.log('1️⃣2️⃣  Testing challenge retrieval...');
    const challenges = await db.getChallengesByProofHash(testProof.hash);
    if (challenges.length > 0) {
      console.log(`   ✅ Found ${challenges.length} challenge(s)\n`);
    } else {
      throw new Error('Challenge retrieval failed');
    }

    console.log('✅ All tests passed!\n');
    console.log('📊 Summary:');
    console.log(`   • Proofs stored: ${await db.getTotalProofs()}`);
    console.log(`   • Batches stored: ${(await db.getAllBatches()).length}`);
    console.log(`   • Pending proofs: ${await db.getPendingCount()}\n`);

    // Close connection
    await db.close();
    console.log('🔌 Database connection closed');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testPostgreSQL().catch(console.error);

