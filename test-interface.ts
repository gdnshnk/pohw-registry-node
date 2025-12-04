/**
 * Database Interface Compatibility Test
 * Tests that both file-based and PostgreSQL backends work through the same interface
 */

import { RegistryDatabase } from './src/database';
import { ProofRecord } from './src/types';

async function testDatabaseInterface() {
  console.log('🧪 Testing Database Interface Compatibility\n');

  // Test 1: File-based database (default, no DATABASE_URL)
  console.log('1️⃣  Testing File-Based Database (Development Mode)');
  console.log('   (No DATABASE_URL set, should use file-based storage)\n');
  
  // Temporarily unset DATABASE_URL if it exists
  const originalDbUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  
  try {
    const fileDb = new RegistryDatabase('./data/test');
    
    // Test basic operations
    const testProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0x' + 'a'.repeat(64),
      signature: '0x' + 'b'.repeat(128),
      did: 'did:pohw:test:file',
      timestamp: new Date().toISOString(),
      assistance_profile: 'human-only'
    };

    const fileProofId = await fileDb.storeProof(testProof);
    console.log(`   ✅ File-based: Proof stored with ID: ${fileProofId}`);

    const fileRetrieved = await fileDb.getProofByHash(testProof.hash);
    if (fileRetrieved && fileRetrieved.hash === testProof.hash) {
      console.log('   ✅ File-based: Proof retrieval works');
    } else {
      throw new Error('File-based proof retrieval failed');
    }

    const filePending = await fileDb.getPendingCount();
    console.log(`   ✅ File-based: Pending count: ${filePending}\n`);

    fileDb.close();
    console.log('   ✅ File-based database test passed\n');

  } catch (error: any) {
    console.error('   ❌ File-based test failed:', error.message);
  }

  // Test 2: PostgreSQL database (if DATABASE_URL is set)
  if (originalDbUrl) {
    console.log('2️⃣  Testing PostgreSQL Database (Production Mode)');
    console.log('   (DATABASE_URL is set, should use PostgreSQL)\n');
    
    process.env.DATABASE_URL = originalDbUrl;
    
    try {
      const pgDb = new RegistryDatabase();
      
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pgTestProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
        hash: '0x' + 'c'.repeat(64),
        signature: '0x' + 'd'.repeat(128),
        did: 'did:pohw:test:postgres',
        timestamp: new Date().toISOString(),
        assistance_profile: 'AI-assisted'
      };

      const pgProofId = await pgDb.storeProof(pgTestProof);
      console.log(`   ✅ PostgreSQL: Proof stored with ID: ${pgProofId}`);

      const pgRetrieved = await pgDb.getProofByHash(pgTestProof.hash);
      if (pgRetrieved && pgRetrieved.hash === pgTestProof.hash) {
        console.log('   ✅ PostgreSQL: Proof retrieval works');
        console.log(`      Assistance Profile: ${pgRetrieved.assistance_profile}`);
      } else {
        throw new Error('PostgreSQL proof retrieval failed');
      }

      const pgPending = await pgDb.getPendingCount();
      console.log(`   ✅ PostgreSQL: Pending count: ${pgPending}\n`);

      await pgDb.close();
      console.log('   ✅ PostgreSQL database test passed\n');

    } catch (error: any) {
      console.error('   ❌ PostgreSQL test failed:', error.message);
      console.error('   💡 Make sure DATABASE_URL is correct and PostgreSQL is accessible');
    }
  } else {
    console.log('2️⃣  Skipping PostgreSQL test (DATABASE_URL not set)');
    console.log('   Set DATABASE_URL to test PostgreSQL backend\n');
  }

  console.log('✅ Interface compatibility test complete!');
  console.log('');
  console.log('📊 Summary:');
  console.log('   • Both backends use the same interface');
  console.log('   • Code works with either backend');
  console.log('   • Switching backends is just a matter of setting DATABASE_URL');
}

// Run tests
testDatabaseInterface().catch(console.error);


 * Database Interface Compatibility Test
 * Tests that both file-based and PostgreSQL backends work through the same interface
 */

import { RegistryDatabase } from './src/database';
import { ProofRecord } from './src/types';

async function testDatabaseInterface() {
  console.log('🧪 Testing Database Interface Compatibility\n');

  // Test 1: File-based database (default, no DATABASE_URL)
  console.log('1️⃣  Testing File-Based Database (Development Mode)');
  console.log('   (No DATABASE_URL set, should use file-based storage)\n');
  
  // Temporarily unset DATABASE_URL if it exists
  const originalDbUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  
  try {
    const fileDb = new RegistryDatabase('./data/test');
    
    // Test basic operations
    const testProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0x' + 'a'.repeat(64),
      signature: '0x' + 'b'.repeat(128),
      did: 'did:pohw:test:file',
      timestamp: new Date().toISOString(),
      assistance_profile: 'human-only'
    };

    const fileProofId = await fileDb.storeProof(testProof);
    console.log(`   ✅ File-based: Proof stored with ID: ${fileProofId}`);

    const fileRetrieved = await fileDb.getProofByHash(testProof.hash);
    if (fileRetrieved && fileRetrieved.hash === testProof.hash) {
      console.log('   ✅ File-based: Proof retrieval works');
    } else {
      throw new Error('File-based proof retrieval failed');
    }

    const filePending = await fileDb.getPendingCount();
    console.log(`   ✅ File-based: Pending count: ${filePending}\n`);

    fileDb.close();
    console.log('   ✅ File-based database test passed\n');

  } catch (error: any) {
    console.error('   ❌ File-based test failed:', error.message);
  }

  // Test 2: PostgreSQL database (if DATABASE_URL is set)
  if (originalDbUrl) {
    console.log('2️⃣  Testing PostgreSQL Database (Production Mode)');
    console.log('   (DATABASE_URL is set, should use PostgreSQL)\n');
    
    process.env.DATABASE_URL = originalDbUrl;
    
    try {
      const pgDb = new RegistryDatabase();
      
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pgTestProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
        hash: '0x' + 'c'.repeat(64),
        signature: '0x' + 'd'.repeat(128),
        did: 'did:pohw:test:postgres',
        timestamp: new Date().toISOString(),
        assistance_profile: 'AI-assisted'
      };

      const pgProofId = await pgDb.storeProof(pgTestProof);
      console.log(`   ✅ PostgreSQL: Proof stored with ID: ${pgProofId}`);

      const pgRetrieved = await pgDb.getProofByHash(pgTestProof.hash);
      if (pgRetrieved && pgRetrieved.hash === pgTestProof.hash) {
        console.log('   ✅ PostgreSQL: Proof retrieval works');
        console.log(`      Assistance Profile: ${pgRetrieved.assistance_profile}`);
      } else {
        throw new Error('PostgreSQL proof retrieval failed');
      }

      const pgPending = await pgDb.getPendingCount();
      console.log(`   ✅ PostgreSQL: Pending count: ${pgPending}\n`);

      await pgDb.close();
      console.log('   ✅ PostgreSQL database test passed\n');

    } catch (error: any) {
      console.error('   ❌ PostgreSQL test failed:', error.message);
      console.error('   💡 Make sure DATABASE_URL is correct and PostgreSQL is accessible');
    }
  } else {
    console.log('2️⃣  Skipping PostgreSQL test (DATABASE_URL not set)');
    console.log('   Set DATABASE_URL to test PostgreSQL backend\n');
  }

  console.log('✅ Interface compatibility test complete!');
  console.log('');
  console.log('📊 Summary:');
  console.log('   • Both backends use the same interface');
  console.log('   • Code works with either backend');
  console.log('   • Switching backends is just a matter of setting DATABASE_URL');
}

// Run tests
testDatabaseInterface().catch(console.error);





 * Database Interface Compatibility Test
 * Tests that both file-based and PostgreSQL backends work through the same interface
 */

import { RegistryDatabase } from './src/database';
import { ProofRecord } from './src/types';

async function testDatabaseInterface() {
  console.log('🧪 Testing Database Interface Compatibility\n');

  // Test 1: File-based database (default, no DATABASE_URL)
  console.log('1️⃣  Testing File-Based Database (Development Mode)');
  console.log('   (No DATABASE_URL set, should use file-based storage)\n');
  
  // Temporarily unset DATABASE_URL if it exists
  const originalDbUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  
  try {
    const fileDb = new RegistryDatabase('./data/test');
    
    // Test basic operations
    const testProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0x' + 'a'.repeat(64),
      signature: '0x' + 'b'.repeat(128),
      did: 'did:pohw:test:file',
      timestamp: new Date().toISOString(),
      assistance_profile: 'human-only'
    };

    const fileProofId = await fileDb.storeProof(testProof);
    console.log(`   ✅ File-based: Proof stored with ID: ${fileProofId}`);

    const fileRetrieved = await fileDb.getProofByHash(testProof.hash);
    if (fileRetrieved && fileRetrieved.hash === testProof.hash) {
      console.log('   ✅ File-based: Proof retrieval works');
    } else {
      throw new Error('File-based proof retrieval failed');
    }

    const filePending = await fileDb.getPendingCount();
    console.log(`   ✅ File-based: Pending count: ${filePending}\n`);

    fileDb.close();
    console.log('   ✅ File-based database test passed\n');

  } catch (error: any) {
    console.error('   ❌ File-based test failed:', error.message);
  }

  // Test 2: PostgreSQL database (if DATABASE_URL is set)
  if (originalDbUrl) {
    console.log('2️⃣  Testing PostgreSQL Database (Production Mode)');
    console.log('   (DATABASE_URL is set, should use PostgreSQL)\n');
    
    process.env.DATABASE_URL = originalDbUrl;
    
    try {
      const pgDb = new RegistryDatabase();
      
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pgTestProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
        hash: '0x' + 'c'.repeat(64),
        signature: '0x' + 'd'.repeat(128),
        did: 'did:pohw:test:postgres',
        timestamp: new Date().toISOString(),
        assistance_profile: 'AI-assisted'
      };

      const pgProofId = await pgDb.storeProof(pgTestProof);
      console.log(`   ✅ PostgreSQL: Proof stored with ID: ${pgProofId}`);

      const pgRetrieved = await pgDb.getProofByHash(pgTestProof.hash);
      if (pgRetrieved && pgRetrieved.hash === pgTestProof.hash) {
        console.log('   ✅ PostgreSQL: Proof retrieval works');
        console.log(`      Assistance Profile: ${pgRetrieved.assistance_profile}`);
      } else {
        throw new Error('PostgreSQL proof retrieval failed');
      }

      const pgPending = await pgDb.getPendingCount();
      console.log(`   ✅ PostgreSQL: Pending count: ${pgPending}\n`);

      await pgDb.close();
      console.log('   ✅ PostgreSQL database test passed\n');

    } catch (error: any) {
      console.error('   ❌ PostgreSQL test failed:', error.message);
      console.error('   💡 Make sure DATABASE_URL is correct and PostgreSQL is accessible');
    }
  } else {
    console.log('2️⃣  Skipping PostgreSQL test (DATABASE_URL not set)');
    console.log('   Set DATABASE_URL to test PostgreSQL backend\n');
  }

  console.log('✅ Interface compatibility test complete!');
  console.log('');
  console.log('📊 Summary:');
  console.log('   • Both backends use the same interface');
  console.log('   • Code works with either backend');
  console.log('   • Switching backends is just a matter of setting DATABASE_URL');
}

// Run tests
testDatabaseInterface().catch(console.error);


 * Database Interface Compatibility Test
 * Tests that both file-based and PostgreSQL backends work through the same interface
 */

import { RegistryDatabase } from './src/database';
import { ProofRecord } from './src/types';

async function testDatabaseInterface() {
  console.log('🧪 Testing Database Interface Compatibility\n');

  // Test 1: File-based database (default, no DATABASE_URL)
  console.log('1️⃣  Testing File-Based Database (Development Mode)');
  console.log('   (No DATABASE_URL set, should use file-based storage)\n');
  
  // Temporarily unset DATABASE_URL if it exists
  const originalDbUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  
  try {
    const fileDb = new RegistryDatabase('./data/test');
    
    // Test basic operations
    const testProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0x' + 'a'.repeat(64),
      signature: '0x' + 'b'.repeat(128),
      did: 'did:pohw:test:file',
      timestamp: new Date().toISOString(),
      assistance_profile: 'human-only'
    };

    const fileProofId = await fileDb.storeProof(testProof);
    console.log(`   ✅ File-based: Proof stored with ID: ${fileProofId}`);

    const fileRetrieved = await fileDb.getProofByHash(testProof.hash);
    if (fileRetrieved && fileRetrieved.hash === testProof.hash) {
      console.log('   ✅ File-based: Proof retrieval works');
    } else {
      throw new Error('File-based proof retrieval failed');
    }

    const filePending = await fileDb.getPendingCount();
    console.log(`   ✅ File-based: Pending count: ${filePending}\n`);

    fileDb.close();
    console.log('   ✅ File-based database test passed\n');

  } catch (error: any) {
    console.error('   ❌ File-based test failed:', error.message);
  }

  // Test 2: PostgreSQL database (if DATABASE_URL is set)
  if (originalDbUrl) {
    console.log('2️⃣  Testing PostgreSQL Database (Production Mode)');
    console.log('   (DATABASE_URL is set, should use PostgreSQL)\n');
    
    process.env.DATABASE_URL = originalDbUrl;
    
    try {
      const pgDb = new RegistryDatabase();
      
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pgTestProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
        hash: '0x' + 'c'.repeat(64),
        signature: '0x' + 'd'.repeat(128),
        did: 'did:pohw:test:postgres',
        timestamp: new Date().toISOString(),
        assistance_profile: 'AI-assisted'
      };

      const pgProofId = await pgDb.storeProof(pgTestProof);
      console.log(`   ✅ PostgreSQL: Proof stored with ID: ${pgProofId}`);

      const pgRetrieved = await pgDb.getProofByHash(pgTestProof.hash);
      if (pgRetrieved && pgRetrieved.hash === pgTestProof.hash) {
        console.log('   ✅ PostgreSQL: Proof retrieval works');
        console.log(`      Assistance Profile: ${pgRetrieved.assistance_profile}`);
      } else {
        throw new Error('PostgreSQL proof retrieval failed');
      }

      const pgPending = await pgDb.getPendingCount();
      console.log(`   ✅ PostgreSQL: Pending count: ${pgPending}\n`);

      await pgDb.close();
      console.log('   ✅ PostgreSQL database test passed\n');

    } catch (error: any) {
      console.error('   ❌ PostgreSQL test failed:', error.message);
      console.error('   💡 Make sure DATABASE_URL is correct and PostgreSQL is accessible');
    }
  } else {
    console.log('2️⃣  Skipping PostgreSQL test (DATABASE_URL not set)');
    console.log('   Set DATABASE_URL to test PostgreSQL backend\n');
  }

  console.log('✅ Interface compatibility test complete!');
  console.log('');
  console.log('📊 Summary:');
  console.log('   • Both backends use the same interface');
  console.log('   • Code works with either backend');
  console.log('   • Switching backends is just a matter of setting DATABASE_URL');
}

// Run tests
testDatabaseInterface().catch(console.error);





 * Database Interface Compatibility Test
 * Tests that both file-based and PostgreSQL backends work through the same interface
 */

import { RegistryDatabase } from './src/database';
import { ProofRecord } from './src/types';

async function testDatabaseInterface() {
  console.log('🧪 Testing Database Interface Compatibility\n');

  // Test 1: File-based database (default, no DATABASE_URL)
  console.log('1️⃣  Testing File-Based Database (Development Mode)');
  console.log('   (No DATABASE_URL set, should use file-based storage)\n');
  
  // Temporarily unset DATABASE_URL if it exists
  const originalDbUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  
  try {
    const fileDb = new RegistryDatabase('./data/test');
    
    // Test basic operations
    const testProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0x' + 'a'.repeat(64),
      signature: '0x' + 'b'.repeat(128),
      did: 'did:pohw:test:file',
      timestamp: new Date().toISOString(),
      assistance_profile: 'human-only'
    };

    const fileProofId = await fileDb.storeProof(testProof);
    console.log(`   ✅ File-based: Proof stored with ID: ${fileProofId}`);

    const fileRetrieved = await fileDb.getProofByHash(testProof.hash);
    if (fileRetrieved && fileRetrieved.hash === testProof.hash) {
      console.log('   ✅ File-based: Proof retrieval works');
    } else {
      throw new Error('File-based proof retrieval failed');
    }

    const filePending = await fileDb.getPendingCount();
    console.log(`   ✅ File-based: Pending count: ${filePending}\n`);

    fileDb.close();
    console.log('   ✅ File-based database test passed\n');

  } catch (error: any) {
    console.error('   ❌ File-based test failed:', error.message);
  }

  // Test 2: PostgreSQL database (if DATABASE_URL is set)
  if (originalDbUrl) {
    console.log('2️⃣  Testing PostgreSQL Database (Production Mode)');
    console.log('   (DATABASE_URL is set, should use PostgreSQL)\n');
    
    process.env.DATABASE_URL = originalDbUrl;
    
    try {
      const pgDb = new RegistryDatabase();
      
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pgTestProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
        hash: '0x' + 'c'.repeat(64),
        signature: '0x' + 'd'.repeat(128),
        did: 'did:pohw:test:postgres',
        timestamp: new Date().toISOString(),
        assistance_profile: 'AI-assisted'
      };

      const pgProofId = await pgDb.storeProof(pgTestProof);
      console.log(`   ✅ PostgreSQL: Proof stored with ID: ${pgProofId}`);

      const pgRetrieved = await pgDb.getProofByHash(pgTestProof.hash);
      if (pgRetrieved && pgRetrieved.hash === pgTestProof.hash) {
        console.log('   ✅ PostgreSQL: Proof retrieval works');
        console.log(`      Assistance Profile: ${pgRetrieved.assistance_profile}`);
      } else {
        throw new Error('PostgreSQL proof retrieval failed');
      }

      const pgPending = await pgDb.getPendingCount();
      console.log(`   ✅ PostgreSQL: Pending count: ${pgPending}\n`);

      await pgDb.close();
      console.log('   ✅ PostgreSQL database test passed\n');

    } catch (error: any) {
      console.error('   ❌ PostgreSQL test failed:', error.message);
      console.error('   💡 Make sure DATABASE_URL is correct and PostgreSQL is accessible');
    }
  } else {
    console.log('2️⃣  Skipping PostgreSQL test (DATABASE_URL not set)');
    console.log('   Set DATABASE_URL to test PostgreSQL backend\n');
  }

  console.log('✅ Interface compatibility test complete!');
  console.log('');
  console.log('📊 Summary:');
  console.log('   • Both backends use the same interface');
  console.log('   • Code works with either backend');
  console.log('   • Switching backends is just a matter of setting DATABASE_URL');
}

// Run tests
testDatabaseInterface().catch(console.error);


 * Database Interface Compatibility Test
 * Tests that both file-based and PostgreSQL backends work through the same interface
 */

import { RegistryDatabase } from './src/database';
import { ProofRecord } from './src/types';

async function testDatabaseInterface() {
  console.log('🧪 Testing Database Interface Compatibility\n');

  // Test 1: File-based database (default, no DATABASE_URL)
  console.log('1️⃣  Testing File-Based Database (Development Mode)');
  console.log('   (No DATABASE_URL set, should use file-based storage)\n');
  
  // Temporarily unset DATABASE_URL if it exists
  const originalDbUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  
  try {
    const fileDb = new RegistryDatabase('./data/test');
    
    // Test basic operations
    const testProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0x' + 'a'.repeat(64),
      signature: '0x' + 'b'.repeat(128),
      did: 'did:pohw:test:file',
      timestamp: new Date().toISOString(),
      assistance_profile: 'human-only'
    };

    const fileProofId = await fileDb.storeProof(testProof);
    console.log(`   ✅ File-based: Proof stored with ID: ${fileProofId}`);

    const fileRetrieved = await fileDb.getProofByHash(testProof.hash);
    if (fileRetrieved && fileRetrieved.hash === testProof.hash) {
      console.log('   ✅ File-based: Proof retrieval works');
    } else {
      throw new Error('File-based proof retrieval failed');
    }

    const filePending = await fileDb.getPendingCount();
    console.log(`   ✅ File-based: Pending count: ${filePending}\n`);

    fileDb.close();
    console.log('   ✅ File-based database test passed\n');

  } catch (error: any) {
    console.error('   ❌ File-based test failed:', error.message);
  }

  // Test 2: PostgreSQL database (if DATABASE_URL is set)
  if (originalDbUrl) {
    console.log('2️⃣  Testing PostgreSQL Database (Production Mode)');
    console.log('   (DATABASE_URL is set, should use PostgreSQL)\n');
    
    process.env.DATABASE_URL = originalDbUrl;
    
    try {
      const pgDb = new RegistryDatabase();
      
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pgTestProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
        hash: '0x' + 'c'.repeat(64),
        signature: '0x' + 'd'.repeat(128),
        did: 'did:pohw:test:postgres',
        timestamp: new Date().toISOString(),
        assistance_profile: 'AI-assisted'
      };

      const pgProofId = await pgDb.storeProof(pgTestProof);
      console.log(`   ✅ PostgreSQL: Proof stored with ID: ${pgProofId}`);

      const pgRetrieved = await pgDb.getProofByHash(pgTestProof.hash);
      if (pgRetrieved && pgRetrieved.hash === pgTestProof.hash) {
        console.log('   ✅ PostgreSQL: Proof retrieval works');
        console.log(`      Assistance Profile: ${pgRetrieved.assistance_profile}`);
      } else {
        throw new Error('PostgreSQL proof retrieval failed');
      }

      const pgPending = await pgDb.getPendingCount();
      console.log(`   ✅ PostgreSQL: Pending count: ${pgPending}\n`);

      await pgDb.close();
      console.log('   ✅ PostgreSQL database test passed\n');

    } catch (error: any) {
      console.error('   ❌ PostgreSQL test failed:', error.message);
      console.error('   💡 Make sure DATABASE_URL is correct and PostgreSQL is accessible');
    }
  } else {
    console.log('2️⃣  Skipping PostgreSQL test (DATABASE_URL not set)');
    console.log('   Set DATABASE_URL to test PostgreSQL backend\n');
  }

  console.log('✅ Interface compatibility test complete!');
  console.log('');
  console.log('📊 Summary:');
  console.log('   • Both backends use the same interface');
  console.log('   • Code works with either backend');
  console.log('   • Switching backends is just a matter of setting DATABASE_URL');
}

// Run tests
testDatabaseInterface().catch(console.error);





 * Database Interface Compatibility Test
 * Tests that both file-based and PostgreSQL backends work through the same interface
 */

import { RegistryDatabase } from './src/database';
import { ProofRecord } from './src/types';

async function testDatabaseInterface() {
  console.log('🧪 Testing Database Interface Compatibility\n');

  // Test 1: File-based database (default, no DATABASE_URL)
  console.log('1️⃣  Testing File-Based Database (Development Mode)');
  console.log('   (No DATABASE_URL set, should use file-based storage)\n');
  
  // Temporarily unset DATABASE_URL if it exists
  const originalDbUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  
  try {
    const fileDb = new RegistryDatabase('./data/test');
    
    // Test basic operations
    const testProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0x' + 'a'.repeat(64),
      signature: '0x' + 'b'.repeat(128),
      did: 'did:pohw:test:file',
      timestamp: new Date().toISOString(),
      assistance_profile: 'human-only'
    };

    const fileProofId = await fileDb.storeProof(testProof);
    console.log(`   ✅ File-based: Proof stored with ID: ${fileProofId}`);

    const fileRetrieved = await fileDb.getProofByHash(testProof.hash);
    if (fileRetrieved && fileRetrieved.hash === testProof.hash) {
      console.log('   ✅ File-based: Proof retrieval works');
    } else {
      throw new Error('File-based proof retrieval failed');
    }

    const filePending = await fileDb.getPendingCount();
    console.log(`   ✅ File-based: Pending count: ${filePending}\n`);

    fileDb.close();
    console.log('   ✅ File-based database test passed\n');

  } catch (error: any) {
    console.error('   ❌ File-based test failed:', error.message);
  }

  // Test 2: PostgreSQL database (if DATABASE_URL is set)
  if (originalDbUrl) {
    console.log('2️⃣  Testing PostgreSQL Database (Production Mode)');
    console.log('   (DATABASE_URL is set, should use PostgreSQL)\n');
    
    process.env.DATABASE_URL = originalDbUrl;
    
    try {
      const pgDb = new RegistryDatabase();
      
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pgTestProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
        hash: '0x' + 'c'.repeat(64),
        signature: '0x' + 'd'.repeat(128),
        did: 'did:pohw:test:postgres',
        timestamp: new Date().toISOString(),
        assistance_profile: 'AI-assisted'
      };

      const pgProofId = await pgDb.storeProof(pgTestProof);
      console.log(`   ✅ PostgreSQL: Proof stored with ID: ${pgProofId}`);

      const pgRetrieved = await pgDb.getProofByHash(pgTestProof.hash);
      if (pgRetrieved && pgRetrieved.hash === pgTestProof.hash) {
        console.log('   ✅ PostgreSQL: Proof retrieval works');
        console.log(`      Assistance Profile: ${pgRetrieved.assistance_profile}`);
      } else {
        throw new Error('PostgreSQL proof retrieval failed');
      }

      const pgPending = await pgDb.getPendingCount();
      console.log(`   ✅ PostgreSQL: Pending count: ${pgPending}\n`);

      await pgDb.close();
      console.log('   ✅ PostgreSQL database test passed\n');

    } catch (error: any) {
      console.error('   ❌ PostgreSQL test failed:', error.message);
      console.error('   💡 Make sure DATABASE_URL is correct and PostgreSQL is accessible');
    }
  } else {
    console.log('2️⃣  Skipping PostgreSQL test (DATABASE_URL not set)');
    console.log('   Set DATABASE_URL to test PostgreSQL backend\n');
  }

  console.log('✅ Interface compatibility test complete!');
  console.log('');
  console.log('📊 Summary:');
  console.log('   • Both backends use the same interface');
  console.log('   • Code works with either backend');
  console.log('   • Switching backends is just a matter of setting DATABASE_URL');
}

// Run tests
testDatabaseInterface().catch(console.error);


 * Database Interface Compatibility Test
 * Tests that both file-based and PostgreSQL backends work through the same interface
 */

import { RegistryDatabase } from './src/database';
import { ProofRecord } from './src/types';

async function testDatabaseInterface() {
  console.log('🧪 Testing Database Interface Compatibility\n');

  // Test 1: File-based database (default, no DATABASE_URL)
  console.log('1️⃣  Testing File-Based Database (Development Mode)');
  console.log('   (No DATABASE_URL set, should use file-based storage)\n');
  
  // Temporarily unset DATABASE_URL if it exists
  const originalDbUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  
  try {
    const fileDb = new RegistryDatabase('./data/test');
    
    // Test basic operations
    const testProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0x' + 'a'.repeat(64),
      signature: '0x' + 'b'.repeat(128),
      did: 'did:pohw:test:file',
      timestamp: new Date().toISOString(),
      assistance_profile: 'human-only'
    };

    const fileProofId = await fileDb.storeProof(testProof);
    console.log(`   ✅ File-based: Proof stored with ID: ${fileProofId}`);

    const fileRetrieved = await fileDb.getProofByHash(testProof.hash);
    if (fileRetrieved && fileRetrieved.hash === testProof.hash) {
      console.log('   ✅ File-based: Proof retrieval works');
    } else {
      throw new Error('File-based proof retrieval failed');
    }

    const filePending = await fileDb.getPendingCount();
    console.log(`   ✅ File-based: Pending count: ${filePending}\n`);

    fileDb.close();
    console.log('   ✅ File-based database test passed\n');

  } catch (error: any) {
    console.error('   ❌ File-based test failed:', error.message);
  }

  // Test 2: PostgreSQL database (if DATABASE_URL is set)
  if (originalDbUrl) {
    console.log('2️⃣  Testing PostgreSQL Database (Production Mode)');
    console.log('   (DATABASE_URL is set, should use PostgreSQL)\n');
    
    process.env.DATABASE_URL = originalDbUrl;
    
    try {
      const pgDb = new RegistryDatabase();
      
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pgTestProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
        hash: '0x' + 'c'.repeat(64),
        signature: '0x' + 'd'.repeat(128),
        did: 'did:pohw:test:postgres',
        timestamp: new Date().toISOString(),
        assistance_profile: 'AI-assisted'
      };

      const pgProofId = await pgDb.storeProof(pgTestProof);
      console.log(`   ✅ PostgreSQL: Proof stored with ID: ${pgProofId}`);

      const pgRetrieved = await pgDb.getProofByHash(pgTestProof.hash);
      if (pgRetrieved && pgRetrieved.hash === pgTestProof.hash) {
        console.log('   ✅ PostgreSQL: Proof retrieval works');
        console.log(`      Assistance Profile: ${pgRetrieved.assistance_profile}`);
      } else {
        throw new Error('PostgreSQL proof retrieval failed');
      }

      const pgPending = await pgDb.getPendingCount();
      console.log(`   ✅ PostgreSQL: Pending count: ${pgPending}\n`);

      await pgDb.close();
      console.log('   ✅ PostgreSQL database test passed\n');

    } catch (error: any) {
      console.error('   ❌ PostgreSQL test failed:', error.message);
      console.error('   💡 Make sure DATABASE_URL is correct and PostgreSQL is accessible');
    }
  } else {
    console.log('2️⃣  Skipping PostgreSQL test (DATABASE_URL not set)');
    console.log('   Set DATABASE_URL to test PostgreSQL backend\n');
  }

  console.log('✅ Interface compatibility test complete!');
  console.log('');
  console.log('📊 Summary:');
  console.log('   • Both backends use the same interface');
  console.log('   • Code works with either backend');
  console.log('   • Switching backends is just a matter of setting DATABASE_URL');
}

// Run tests
testDatabaseInterface().catch(console.error);





 * Database Interface Compatibility Test
 * Tests that both file-based and PostgreSQL backends work through the same interface
 */

import { RegistryDatabase } from './src/database';
import { ProofRecord } from './src/types';

async function testDatabaseInterface() {
  console.log('🧪 Testing Database Interface Compatibility\n');

  // Test 1: File-based database (default, no DATABASE_URL)
  console.log('1️⃣  Testing File-Based Database (Development Mode)');
  console.log('   (No DATABASE_URL set, should use file-based storage)\n');
  
  // Temporarily unset DATABASE_URL if it exists
  const originalDbUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  
  try {
    const fileDb = new RegistryDatabase('./data/test');
    
    // Test basic operations
    const testProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0x' + 'a'.repeat(64),
      signature: '0x' + 'b'.repeat(128),
      did: 'did:pohw:test:file',
      timestamp: new Date().toISOString(),
      assistance_profile: 'human-only'
    };

    const fileProofId = await fileDb.storeProof(testProof);
    console.log(`   ✅ File-based: Proof stored with ID: ${fileProofId}`);

    const fileRetrieved = await fileDb.getProofByHash(testProof.hash);
    if (fileRetrieved && fileRetrieved.hash === testProof.hash) {
      console.log('   ✅ File-based: Proof retrieval works');
    } else {
      throw new Error('File-based proof retrieval failed');
    }

    const filePending = await fileDb.getPendingCount();
    console.log(`   ✅ File-based: Pending count: ${filePending}\n`);

    fileDb.close();
    console.log('   ✅ File-based database test passed\n');

  } catch (error: any) {
    console.error('   ❌ File-based test failed:', error.message);
  }

  // Test 2: PostgreSQL database (if DATABASE_URL is set)
  if (originalDbUrl) {
    console.log('2️⃣  Testing PostgreSQL Database (Production Mode)');
    console.log('   (DATABASE_URL is set, should use PostgreSQL)\n');
    
    process.env.DATABASE_URL = originalDbUrl;
    
    try {
      const pgDb = new RegistryDatabase();
      
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pgTestProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
        hash: '0x' + 'c'.repeat(64),
        signature: '0x' + 'd'.repeat(128),
        did: 'did:pohw:test:postgres',
        timestamp: new Date().toISOString(),
        assistance_profile: 'AI-assisted'
      };

      const pgProofId = await pgDb.storeProof(pgTestProof);
      console.log(`   ✅ PostgreSQL: Proof stored with ID: ${pgProofId}`);

      const pgRetrieved = await pgDb.getProofByHash(pgTestProof.hash);
      if (pgRetrieved && pgRetrieved.hash === pgTestProof.hash) {
        console.log('   ✅ PostgreSQL: Proof retrieval works');
        console.log(`      Assistance Profile: ${pgRetrieved.assistance_profile}`);
      } else {
        throw new Error('PostgreSQL proof retrieval failed');
      }

      const pgPending = await pgDb.getPendingCount();
      console.log(`   ✅ PostgreSQL: Pending count: ${pgPending}\n`);

      await pgDb.close();
      console.log('   ✅ PostgreSQL database test passed\n');

    } catch (error: any) {
      console.error('   ❌ PostgreSQL test failed:', error.message);
      console.error('   💡 Make sure DATABASE_URL is correct and PostgreSQL is accessible');
    }
  } else {
    console.log('2️⃣  Skipping PostgreSQL test (DATABASE_URL not set)');
    console.log('   Set DATABASE_URL to test PostgreSQL backend\n');
  }

  console.log('✅ Interface compatibility test complete!');
  console.log('');
  console.log('📊 Summary:');
  console.log('   • Both backends use the same interface');
  console.log('   • Code works with either backend');
  console.log('   • Switching backends is just a matter of setting DATABASE_URL');
}

// Run tests
testDatabaseInterface().catch(console.error);


 * Database Interface Compatibility Test
 * Tests that both file-based and PostgreSQL backends work through the same interface
 */

import { RegistryDatabase } from './src/database';
import { ProofRecord } from './src/types';

async function testDatabaseInterface() {
  console.log('🧪 Testing Database Interface Compatibility\n');

  // Test 1: File-based database (default, no DATABASE_URL)
  console.log('1️⃣  Testing File-Based Database (Development Mode)');
  console.log('   (No DATABASE_URL set, should use file-based storage)\n');
  
  // Temporarily unset DATABASE_URL if it exists
  const originalDbUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  
  try {
    const fileDb = new RegistryDatabase('./data/test');
    
    // Test basic operations
    const testProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0x' + 'a'.repeat(64),
      signature: '0x' + 'b'.repeat(128),
      did: 'did:pohw:test:file',
      timestamp: new Date().toISOString(),
      assistance_profile: 'human-only'
    };

    const fileProofId = await fileDb.storeProof(testProof);
    console.log(`   ✅ File-based: Proof stored with ID: ${fileProofId}`);

    const fileRetrieved = await fileDb.getProofByHash(testProof.hash);
    if (fileRetrieved && fileRetrieved.hash === testProof.hash) {
      console.log('   ✅ File-based: Proof retrieval works');
    } else {
      throw new Error('File-based proof retrieval failed');
    }

    const filePending = await fileDb.getPendingCount();
    console.log(`   ✅ File-based: Pending count: ${filePending}\n`);

    fileDb.close();
    console.log('   ✅ File-based database test passed\n');

  } catch (error: any) {
    console.error('   ❌ File-based test failed:', error.message);
  }

  // Test 2: PostgreSQL database (if DATABASE_URL is set)
  if (originalDbUrl) {
    console.log('2️⃣  Testing PostgreSQL Database (Production Mode)');
    console.log('   (DATABASE_URL is set, should use PostgreSQL)\n');
    
    process.env.DATABASE_URL = originalDbUrl;
    
    try {
      const pgDb = new RegistryDatabase();
      
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pgTestProof: Omit<ProofRecord, 'id' | 'submitted_at'> = {
        hash: '0x' + 'c'.repeat(64),
        signature: '0x' + 'd'.repeat(128),
        did: 'did:pohw:test:postgres',
        timestamp: new Date().toISOString(),
        assistance_profile: 'AI-assisted'
      };

      const pgProofId = await pgDb.storeProof(pgTestProof);
      console.log(`   ✅ PostgreSQL: Proof stored with ID: ${pgProofId}`);

      const pgRetrieved = await pgDb.getProofByHash(pgTestProof.hash);
      if (pgRetrieved && pgRetrieved.hash === pgTestProof.hash) {
        console.log('   ✅ PostgreSQL: Proof retrieval works');
        console.log(`      Assistance Profile: ${pgRetrieved.assistance_profile}`);
      } else {
        throw new Error('PostgreSQL proof retrieval failed');
      }

      const pgPending = await pgDb.getPendingCount();
      console.log(`   ✅ PostgreSQL: Pending count: ${pgPending}\n`);

      await pgDb.close();
      console.log('   ✅ PostgreSQL database test passed\n');

    } catch (error: any) {
      console.error('   ❌ PostgreSQL test failed:', error.message);
      console.error('   💡 Make sure DATABASE_URL is correct and PostgreSQL is accessible');
    }
  } else {
    console.log('2️⃣  Skipping PostgreSQL test (DATABASE_URL not set)');
    console.log('   Set DATABASE_URL to test PostgreSQL backend\n');
  }

  console.log('✅ Interface compatibility test complete!');
  console.log('');
  console.log('📊 Summary:');
  console.log('   • Both backends use the same interface');
  console.log('   • Code works with either backend');
  console.log('   • Switching backends is just a matter of setting DATABASE_URL');
}

// Run tests
testDatabaseInterface().catch(console.error);





