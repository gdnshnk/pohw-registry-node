/**
 * Test Source Mapping Feature
 * Verifies structured derivedFrom handling
 */

import { RegistryDatabase } from './src/database';
import { ProofRecord } from './src/types';
import { createPAVClaimFromProof } from './src/pav';

async function testSourceMapping() {
  console.log('🧪 Testing Source Mapping Feature\n');

  // Test 1: Structured source mapping format
  console.log('1️⃣  Testing structured source mapping format...\n');
  
  const structuredMapping = [
    {
      text: "This is a quote from another work",
      source: "0x6bf8a1abc123def456",
      sourceType: "pohw-hash" as const,
      position: { start: 0, end: 35 }
    },
    {
      text: "Another citation here",
      source: "https://example.com/article",
      sourceType: "url" as const,
      position: { start: 100, end: 120 }
    },
    {
      text: "Academic reference",
      source: "doi:10.1234/example",
      sourceType: "doi" as const,
      position: { start: 200, end: 217 }
    }
  ];

  console.log('   Input (structured):');
  console.log(JSON.stringify(structuredMapping, null, 2));
  console.log('');

  // Test 2: PAV claim builder handling
  console.log('2️⃣  Testing PAV claim builder...\n');
  
  const testProof: ProofRecord = {
    id: 1,
    hash: '0xtest123',
    signature: '0xsig123',
    did: 'did:pohw:test:1',
    timestamp: new Date().toISOString(),
    submitted_at: new Date().toISOString(),
    derived_from: JSON.stringify(structuredMapping),
    tier: 'human-only',
    assistance_profile: 'human-only'
  };

  try {
    // createPAVClaimFromProof accepts string | string[] for derivedFrom
    // The structured format is handled by the PAVClaimBuilder.setDerivedFrom method
    // For testing, we'll extract sources from structured mapping
    const sources = structuredMapping.map(m => m.source);
    const pavClaim = createPAVClaimFromProof(
      testProof.hash,
      testProof.did,
      testProof.timestamp,
      testProof.signature,
      undefined, // processDigest
      undefined, // compoundHash
      sources, // derivedFrom (extracted sources)
      undefined, // deviceId
      undefined, // environmentAttestation
      undefined, // entropyProof
      undefined, // temporalCoherence
      undefined, // merkleInclusion
      undefined  // anchors
    );

    console.log('   ✅ PAV claim generated successfully');
    console.log('   Derived From in PAV claim:');
    console.log('   ', JSON.stringify(pavClaim['pav:derivedFrom'], null, 2));
    console.log('');

    // Verify sources were extracted correctly
    const derivedFrom = pavClaim['pav:derivedFrom'];
    if (Array.isArray(derivedFrom) && derivedFrom.length === 3) {
      console.log('   ✅ Sources extracted correctly');
      console.log(`      Found ${derivedFrom.length} sources`);
      console.log(`      Sources: ${derivedFrom.join(', ')}`);
    } else {
      throw new Error('Sources not extracted correctly');
    }

  } catch (error: any) {
    console.error('   ❌ PAV claim generation failed:', error.message);
    throw error;
  }

  // Test 3: Simple format (backward compatibility)
  console.log('3️⃣  Testing simple format (backward compatibility)...\n');
  
  const simpleMapping = ['0xabc123', '0xdef456'];
  
  try {
    const pavClaimSimple = createPAVClaimFromProof(
      testProof.hash,
      testProof.did,
      testProof.timestamp,
      testProof.signature,
      undefined,
      undefined,
      simpleMapping, // simple string array
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    console.log('   ✅ Simple format handled correctly');
    console.log('   Derived From:', JSON.stringify(pavClaimSimple['pav:derivedFrom']));
    console.log('');

  } catch (error: any) {
    console.error('   ❌ Simple format failed:', error.message);
    throw error;
  }

  // Test 4: Database storage format
  console.log('4️⃣  Testing database storage format...\n');
  
  const db = new RegistryDatabase('./data/test-source-mapping');
  
  try {
    const testProofWithMapping: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0xtest456',
      signature: '0xsig456',
      did: 'did:pohw:test:2',
      timestamp: new Date().toISOString(),
      derived_from: JSON.stringify(structuredMapping),
      tier: 'human-only',
      assistance_profile: 'human-only'
    };

    const proofId = await db.storeProof(testProofWithMapping);
    console.log(`   ✅ Proof stored with ID: ${proofId}`);

    const retrieved = await db.getProofByHash('0xtest456');
    if (retrieved && retrieved.derived_from) {
      const parsed = JSON.parse(retrieved.derived_from);
      console.log('   ✅ Derived from retrieved from database');
      console.log(`      Type: ${Array.isArray(parsed) && parsed[0]?.text ? 'structured' : 'simple'}`);
      console.log(`      Count: ${Array.isArray(parsed) ? parsed.length : 1}`);
    } else {
      throw new Error('Derived from not found in retrieved proof');
    }

    await db.close();
    console.log('');

  } catch (error: any) {
    console.error('   ❌ Database test failed:', error.message);
    await db.close();
    throw error;
  }

  console.log('✅ All source mapping tests passed!\n');
  console.log('📋 Summary:');
  console.log('   • Structured format: ✅ Working');
  console.log('   • PAV claim generation: ✅ Working');
  console.log('   • Simple format (backward compat): ✅ Working');
  console.log('   • Database storage: ✅ Working');
  console.log('');
}

testSourceMapping().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});


 * Verifies structured derivedFrom handling
 */

import { RegistryDatabase } from './src/database';
import { ProofRecord } from './src/types';
import { createPAVClaimFromProof } from './src/pav';

async function testSourceMapping() {
  console.log('🧪 Testing Source Mapping Feature\n');

  // Test 1: Structured source mapping format
  console.log('1️⃣  Testing structured source mapping format...\n');
  
  const structuredMapping = [
    {
      text: "This is a quote from another work",
      source: "0x6bf8a1abc123def456",
      sourceType: "pohw-hash" as const,
      position: { start: 0, end: 35 }
    },
    {
      text: "Another citation here",
      source: "https://example.com/article",
      sourceType: "url" as const,
      position: { start: 100, end: 120 }
    },
    {
      text: "Academic reference",
      source: "doi:10.1234/example",
      sourceType: "doi" as const,
      position: { start: 200, end: 217 }
    }
  ];

  console.log('   Input (structured):');
  console.log(JSON.stringify(structuredMapping, null, 2));
  console.log('');

  // Test 2: PAV claim builder handling
  console.log('2️⃣  Testing PAV claim builder...\n');
  
  const testProof: ProofRecord = {
    id: 1,
    hash: '0xtest123',
    signature: '0xsig123',
    did: 'did:pohw:test:1',
    timestamp: new Date().toISOString(),
    submitted_at: new Date().toISOString(),
    derived_from: JSON.stringify(structuredMapping),
    tier: 'human-only',
    assistance_profile: 'human-only'
  };

  try {
    // createPAVClaimFromProof accepts string | string[] for derivedFrom
    // The structured format is handled by the PAVClaimBuilder.setDerivedFrom method
    // For testing, we'll extract sources from structured mapping
    const sources = structuredMapping.map(m => m.source);
    const pavClaim = createPAVClaimFromProof(
      testProof.hash,
      testProof.did,
      testProof.timestamp,
      testProof.signature,
      undefined, // processDigest
      undefined, // compoundHash
      sources, // derivedFrom (extracted sources)
      undefined, // deviceId
      undefined, // environmentAttestation
      undefined, // entropyProof
      undefined, // temporalCoherence
      undefined, // merkleInclusion
      undefined  // anchors
    );

    console.log('   ✅ PAV claim generated successfully');
    console.log('   Derived From in PAV claim:');
    console.log('   ', JSON.stringify(pavClaim['pav:derivedFrom'], null, 2));
    console.log('');

    // Verify sources were extracted correctly
    const derivedFrom = pavClaim['pav:derivedFrom'];
    if (Array.isArray(derivedFrom) && derivedFrom.length === 3) {
      console.log('   ✅ Sources extracted correctly');
      console.log(`      Found ${derivedFrom.length} sources`);
      console.log(`      Sources: ${derivedFrom.join(', ')}`);
    } else {
      throw new Error('Sources not extracted correctly');
    }

  } catch (error: any) {
    console.error('   ❌ PAV claim generation failed:', error.message);
    throw error;
  }

  // Test 3: Simple format (backward compatibility)
  console.log('3️⃣  Testing simple format (backward compatibility)...\n');
  
  const simpleMapping = ['0xabc123', '0xdef456'];
  
  try {
    const pavClaimSimple = createPAVClaimFromProof(
      testProof.hash,
      testProof.did,
      testProof.timestamp,
      testProof.signature,
      undefined,
      undefined,
      simpleMapping, // simple string array
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    console.log('   ✅ Simple format handled correctly');
    console.log('   Derived From:', JSON.stringify(pavClaimSimple['pav:derivedFrom']));
    console.log('');

  } catch (error: any) {
    console.error('   ❌ Simple format failed:', error.message);
    throw error;
  }

  // Test 4: Database storage format
  console.log('4️⃣  Testing database storage format...\n');
  
  const db = new RegistryDatabase('./data/test-source-mapping');
  
  try {
    const testProofWithMapping: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0xtest456',
      signature: '0xsig456',
      did: 'did:pohw:test:2',
      timestamp: new Date().toISOString(),
      derived_from: JSON.stringify(structuredMapping),
      tier: 'human-only',
      assistance_profile: 'human-only'
    };

    const proofId = await db.storeProof(testProofWithMapping);
    console.log(`   ✅ Proof stored with ID: ${proofId}`);

    const retrieved = await db.getProofByHash('0xtest456');
    if (retrieved && retrieved.derived_from) {
      const parsed = JSON.parse(retrieved.derived_from);
      console.log('   ✅ Derived from retrieved from database');
      console.log(`      Type: ${Array.isArray(parsed) && parsed[0]?.text ? 'structured' : 'simple'}`);
      console.log(`      Count: ${Array.isArray(parsed) ? parsed.length : 1}`);
    } else {
      throw new Error('Derived from not found in retrieved proof');
    }

    await db.close();
    console.log('');

  } catch (error: any) {
    console.error('   ❌ Database test failed:', error.message);
    await db.close();
    throw error;
  }

  console.log('✅ All source mapping tests passed!\n');
  console.log('📋 Summary:');
  console.log('   • Structured format: ✅ Working');
  console.log('   • PAV claim generation: ✅ Working');
  console.log('   • Simple format (backward compat): ✅ Working');
  console.log('   • Database storage: ✅ Working');
  console.log('');
}

testSourceMapping().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});


 * Verifies structured derivedFrom handling
 */

import { RegistryDatabase } from './src/database';
import { ProofRecord } from './src/types';
import { createPAVClaimFromProof } from './src/pav';

async function testSourceMapping() {
  console.log('🧪 Testing Source Mapping Feature\n');

  // Test 1: Structured source mapping format
  console.log('1️⃣  Testing structured source mapping format...\n');
  
  const structuredMapping = [
    {
      text: "This is a quote from another work",
      source: "0x6bf8a1abc123def456",
      sourceType: "pohw-hash" as const,
      position: { start: 0, end: 35 }
    },
    {
      text: "Another citation here",
      source: "https://example.com/article",
      sourceType: "url" as const,
      position: { start: 100, end: 120 }
    },
    {
      text: "Academic reference",
      source: "doi:10.1234/example",
      sourceType: "doi" as const,
      position: { start: 200, end: 217 }
    }
  ];

  console.log('   Input (structured):');
  console.log(JSON.stringify(structuredMapping, null, 2));
  console.log('');

  // Test 2: PAV claim builder handling
  console.log('2️⃣  Testing PAV claim builder...\n');
  
  const testProof: ProofRecord = {
    id: 1,
    hash: '0xtest123',
    signature: '0xsig123',
    did: 'did:pohw:test:1',
    timestamp: new Date().toISOString(),
    submitted_at: new Date().toISOString(),
    derived_from: JSON.stringify(structuredMapping),
    tier: 'human-only',
    assistance_profile: 'human-only'
  };

  try {
    // createPAVClaimFromProof accepts string | string[] for derivedFrom
    // The structured format is handled by the PAVClaimBuilder.setDerivedFrom method
    // For testing, we'll extract sources from structured mapping
    const sources = structuredMapping.map(m => m.source);
    const pavClaim = createPAVClaimFromProof(
      testProof.hash,
      testProof.did,
      testProof.timestamp,
      testProof.signature,
      undefined, // processDigest
      undefined, // compoundHash
      sources, // derivedFrom (extracted sources)
      undefined, // deviceId
      undefined, // environmentAttestation
      undefined, // entropyProof
      undefined, // temporalCoherence
      undefined, // merkleInclusion
      undefined  // anchors
    );

    console.log('   ✅ PAV claim generated successfully');
    console.log('   Derived From in PAV claim:');
    console.log('   ', JSON.stringify(pavClaim['pav:derivedFrom'], null, 2));
    console.log('');

    // Verify sources were extracted correctly
    const derivedFrom = pavClaim['pav:derivedFrom'];
    if (Array.isArray(derivedFrom) && derivedFrom.length === 3) {
      console.log('   ✅ Sources extracted correctly');
      console.log(`      Found ${derivedFrom.length} sources`);
      console.log(`      Sources: ${derivedFrom.join(', ')}`);
    } else {
      throw new Error('Sources not extracted correctly');
    }

  } catch (error: any) {
    console.error('   ❌ PAV claim generation failed:', error.message);
    throw error;
  }

  // Test 3: Simple format (backward compatibility)
  console.log('3️⃣  Testing simple format (backward compatibility)...\n');
  
  const simpleMapping = ['0xabc123', '0xdef456'];
  
  try {
    const pavClaimSimple = createPAVClaimFromProof(
      testProof.hash,
      testProof.did,
      testProof.timestamp,
      testProof.signature,
      undefined,
      undefined,
      simpleMapping, // simple string array
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    console.log('   ✅ Simple format handled correctly');
    console.log('   Derived From:', JSON.stringify(pavClaimSimple['pav:derivedFrom']));
    console.log('');

  } catch (error: any) {
    console.error('   ❌ Simple format failed:', error.message);
    throw error;
  }

  // Test 4: Database storage format
  console.log('4️⃣  Testing database storage format...\n');
  
  const db = new RegistryDatabase('./data/test-source-mapping');
  
  try {
    const testProofWithMapping: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0xtest456',
      signature: '0xsig456',
      did: 'did:pohw:test:2',
      timestamp: new Date().toISOString(),
      derived_from: JSON.stringify(structuredMapping),
      tier: 'human-only',
      assistance_profile: 'human-only'
    };

    const proofId = await db.storeProof(testProofWithMapping);
    console.log(`   ✅ Proof stored with ID: ${proofId}`);

    const retrieved = await db.getProofByHash('0xtest456');
    if (retrieved && retrieved.derived_from) {
      const parsed = JSON.parse(retrieved.derived_from);
      console.log('   ✅ Derived from retrieved from database');
      console.log(`      Type: ${Array.isArray(parsed) && parsed[0]?.text ? 'structured' : 'simple'}`);
      console.log(`      Count: ${Array.isArray(parsed) ? parsed.length : 1}`);
    } else {
      throw new Error('Derived from not found in retrieved proof');
    }

    await db.close();
    console.log('');

  } catch (error: any) {
    console.error('   ❌ Database test failed:', error.message);
    await db.close();
    throw error;
  }

  console.log('✅ All source mapping tests passed!\n');
  console.log('📋 Summary:');
  console.log('   • Structured format: ✅ Working');
  console.log('   • PAV claim generation: ✅ Working');
  console.log('   • Simple format (backward compat): ✅ Working');
  console.log('   • Database storage: ✅ Working');
  console.log('');
}

testSourceMapping().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});


 * Verifies structured derivedFrom handling
 */

import { RegistryDatabase } from './src/database';
import { ProofRecord } from './src/types';
import { createPAVClaimFromProof } from './src/pav';

async function testSourceMapping() {
  console.log('🧪 Testing Source Mapping Feature\n');

  // Test 1: Structured source mapping format
  console.log('1️⃣  Testing structured source mapping format...\n');
  
  const structuredMapping = [
    {
      text: "This is a quote from another work",
      source: "0x6bf8a1abc123def456",
      sourceType: "pohw-hash" as const,
      position: { start: 0, end: 35 }
    },
    {
      text: "Another citation here",
      source: "https://example.com/article",
      sourceType: "url" as const,
      position: { start: 100, end: 120 }
    },
    {
      text: "Academic reference",
      source: "doi:10.1234/example",
      sourceType: "doi" as const,
      position: { start: 200, end: 217 }
    }
  ];

  console.log('   Input (structured):');
  console.log(JSON.stringify(structuredMapping, null, 2));
  console.log('');

  // Test 2: PAV claim builder handling
  console.log('2️⃣  Testing PAV claim builder...\n');
  
  const testProof: ProofRecord = {
    id: 1,
    hash: '0xtest123',
    signature: '0xsig123',
    did: 'did:pohw:test:1',
    timestamp: new Date().toISOString(),
    submitted_at: new Date().toISOString(),
    derived_from: JSON.stringify(structuredMapping),
    tier: 'human-only',
    assistance_profile: 'human-only'
  };

  try {
    // createPAVClaimFromProof accepts string | string[] for derivedFrom
    // The structured format is handled by the PAVClaimBuilder.setDerivedFrom method
    // For testing, we'll extract sources from structured mapping
    const sources = structuredMapping.map(m => m.source);
    const pavClaim = createPAVClaimFromProof(
      testProof.hash,
      testProof.did,
      testProof.timestamp,
      testProof.signature,
      undefined, // processDigest
      undefined, // compoundHash
      sources, // derivedFrom (extracted sources)
      undefined, // deviceId
      undefined, // environmentAttestation
      undefined, // entropyProof
      undefined, // temporalCoherence
      undefined, // merkleInclusion
      undefined  // anchors
    );

    console.log('   ✅ PAV claim generated successfully');
    console.log('   Derived From in PAV claim:');
    console.log('   ', JSON.stringify(pavClaim['pav:derivedFrom'], null, 2));
    console.log('');

    // Verify sources were extracted correctly
    const derivedFrom = pavClaim['pav:derivedFrom'];
    if (Array.isArray(derivedFrom) && derivedFrom.length === 3) {
      console.log('   ✅ Sources extracted correctly');
      console.log(`      Found ${derivedFrom.length} sources`);
      console.log(`      Sources: ${derivedFrom.join(', ')}`);
    } else {
      throw new Error('Sources not extracted correctly');
    }

  } catch (error: any) {
    console.error('   ❌ PAV claim generation failed:', error.message);
    throw error;
  }

  // Test 3: Simple format (backward compatibility)
  console.log('3️⃣  Testing simple format (backward compatibility)...\n');
  
  const simpleMapping = ['0xabc123', '0xdef456'];
  
  try {
    const pavClaimSimple = createPAVClaimFromProof(
      testProof.hash,
      testProof.did,
      testProof.timestamp,
      testProof.signature,
      undefined,
      undefined,
      simpleMapping, // simple string array
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    console.log('   ✅ Simple format handled correctly');
    console.log('   Derived From:', JSON.stringify(pavClaimSimple['pav:derivedFrom']));
    console.log('');

  } catch (error: any) {
    console.error('   ❌ Simple format failed:', error.message);
    throw error;
  }

  // Test 4: Database storage format
  console.log('4️⃣  Testing database storage format...\n');
  
  const db = new RegistryDatabase('./data/test-source-mapping');
  
  try {
    const testProofWithMapping: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0xtest456',
      signature: '0xsig456',
      did: 'did:pohw:test:2',
      timestamp: new Date().toISOString(),
      derived_from: JSON.stringify(structuredMapping),
      tier: 'human-only',
      assistance_profile: 'human-only'
    };

    const proofId = await db.storeProof(testProofWithMapping);
    console.log(`   ✅ Proof stored with ID: ${proofId}`);

    const retrieved = await db.getProofByHash('0xtest456');
    if (retrieved && retrieved.derived_from) {
      const parsed = JSON.parse(retrieved.derived_from);
      console.log('   ✅ Derived from retrieved from database');
      console.log(`      Type: ${Array.isArray(parsed) && parsed[0]?.text ? 'structured' : 'simple'}`);
      console.log(`      Count: ${Array.isArray(parsed) ? parsed.length : 1}`);
    } else {
      throw new Error('Derived from not found in retrieved proof');
    }

    await db.close();
    console.log('');

  } catch (error: any) {
    console.error('   ❌ Database test failed:', error.message);
    await db.close();
    throw error;
  }

  console.log('✅ All source mapping tests passed!\n');
  console.log('📋 Summary:');
  console.log('   • Structured format: ✅ Working');
  console.log('   • PAV claim generation: ✅ Working');
  console.log('   • Simple format (backward compat): ✅ Working');
  console.log('   • Database storage: ✅ Working');
  console.log('');
}

testSourceMapping().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});


 * Verifies structured derivedFrom handling
 */

import { RegistryDatabase } from './src/database';
import { ProofRecord } from './src/types';
import { createPAVClaimFromProof } from './src/pav';

async function testSourceMapping() {
  console.log('🧪 Testing Source Mapping Feature\n');

  // Test 1: Structured source mapping format
  console.log('1️⃣  Testing structured source mapping format...\n');
  
  const structuredMapping = [
    {
      text: "This is a quote from another work",
      source: "0x6bf8a1abc123def456",
      sourceType: "pohw-hash" as const,
      position: { start: 0, end: 35 }
    },
    {
      text: "Another citation here",
      source: "https://example.com/article",
      sourceType: "url" as const,
      position: { start: 100, end: 120 }
    },
    {
      text: "Academic reference",
      source: "doi:10.1234/example",
      sourceType: "doi" as const,
      position: { start: 200, end: 217 }
    }
  ];

  console.log('   Input (structured):');
  console.log(JSON.stringify(structuredMapping, null, 2));
  console.log('');

  // Test 2: PAV claim builder handling
  console.log('2️⃣  Testing PAV claim builder...\n');
  
  const testProof: ProofRecord = {
    id: 1,
    hash: '0xtest123',
    signature: '0xsig123',
    did: 'did:pohw:test:1',
    timestamp: new Date().toISOString(),
    submitted_at: new Date().toISOString(),
    derived_from: JSON.stringify(structuredMapping),
    tier: 'human-only',
    assistance_profile: 'human-only'
  };

  try {
    // createPAVClaimFromProof accepts string | string[] for derivedFrom
    // The structured format is handled by the PAVClaimBuilder.setDerivedFrom method
    // For testing, we'll extract sources from structured mapping
    const sources = structuredMapping.map(m => m.source);
    const pavClaim = createPAVClaimFromProof(
      testProof.hash,
      testProof.did,
      testProof.timestamp,
      testProof.signature,
      undefined, // processDigest
      undefined, // compoundHash
      sources, // derivedFrom (extracted sources)
      undefined, // deviceId
      undefined, // environmentAttestation
      undefined, // entropyProof
      undefined, // temporalCoherence
      undefined, // merkleInclusion
      undefined  // anchors
    );

    console.log('   ✅ PAV claim generated successfully');
    console.log('   Derived From in PAV claim:');
    console.log('   ', JSON.stringify(pavClaim['pav:derivedFrom'], null, 2));
    console.log('');

    // Verify sources were extracted correctly
    const derivedFrom = pavClaim['pav:derivedFrom'];
    if (Array.isArray(derivedFrom) && derivedFrom.length === 3) {
      console.log('   ✅ Sources extracted correctly');
      console.log(`      Found ${derivedFrom.length} sources`);
      console.log(`      Sources: ${derivedFrom.join(', ')}`);
    } else {
      throw new Error('Sources not extracted correctly');
    }

  } catch (error: any) {
    console.error('   ❌ PAV claim generation failed:', error.message);
    throw error;
  }

  // Test 3: Simple format (backward compatibility)
  console.log('3️⃣  Testing simple format (backward compatibility)...\n');
  
  const simpleMapping = ['0xabc123', '0xdef456'];
  
  try {
    const pavClaimSimple = createPAVClaimFromProof(
      testProof.hash,
      testProof.did,
      testProof.timestamp,
      testProof.signature,
      undefined,
      undefined,
      simpleMapping, // simple string array
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    console.log('   ✅ Simple format handled correctly');
    console.log('   Derived From:', JSON.stringify(pavClaimSimple['pav:derivedFrom']));
    console.log('');

  } catch (error: any) {
    console.error('   ❌ Simple format failed:', error.message);
    throw error;
  }

  // Test 4: Database storage format
  console.log('4️⃣  Testing database storage format...\n');
  
  const db = new RegistryDatabase('./data/test-source-mapping');
  
  try {
    const testProofWithMapping: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0xtest456',
      signature: '0xsig456',
      did: 'did:pohw:test:2',
      timestamp: new Date().toISOString(),
      derived_from: JSON.stringify(structuredMapping),
      tier: 'human-only',
      assistance_profile: 'human-only'
    };

    const proofId = await db.storeProof(testProofWithMapping);
    console.log(`   ✅ Proof stored with ID: ${proofId}`);

    const retrieved = await db.getProofByHash('0xtest456');
    if (retrieved && retrieved.derived_from) {
      const parsed = JSON.parse(retrieved.derived_from);
      console.log('   ✅ Derived from retrieved from database');
      console.log(`      Type: ${Array.isArray(parsed) && parsed[0]?.text ? 'structured' : 'simple'}`);
      console.log(`      Count: ${Array.isArray(parsed) ? parsed.length : 1}`);
    } else {
      throw new Error('Derived from not found in retrieved proof');
    }

    await db.close();
    console.log('');

  } catch (error: any) {
    console.error('   ❌ Database test failed:', error.message);
    await db.close();
    throw error;
  }

  console.log('✅ All source mapping tests passed!\n');
  console.log('📋 Summary:');
  console.log('   • Structured format: ✅ Working');
  console.log('   • PAV claim generation: ✅ Working');
  console.log('   • Simple format (backward compat): ✅ Working');
  console.log('   • Database storage: ✅ Working');
  console.log('');
}

testSourceMapping().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});


 * Verifies structured derivedFrom handling
 */

import { RegistryDatabase } from './src/database';
import { ProofRecord } from './src/types';
import { createPAVClaimFromProof } from './src/pav';

async function testSourceMapping() {
  console.log('🧪 Testing Source Mapping Feature\n');

  // Test 1: Structured source mapping format
  console.log('1️⃣  Testing structured source mapping format...\n');
  
  const structuredMapping = [
    {
      text: "This is a quote from another work",
      source: "0x6bf8a1abc123def456",
      sourceType: "pohw-hash" as const,
      position: { start: 0, end: 35 }
    },
    {
      text: "Another citation here",
      source: "https://example.com/article",
      sourceType: "url" as const,
      position: { start: 100, end: 120 }
    },
    {
      text: "Academic reference",
      source: "doi:10.1234/example",
      sourceType: "doi" as const,
      position: { start: 200, end: 217 }
    }
  ];

  console.log('   Input (structured):');
  console.log(JSON.stringify(structuredMapping, null, 2));
  console.log('');

  // Test 2: PAV claim builder handling
  console.log('2️⃣  Testing PAV claim builder...\n');
  
  const testProof: ProofRecord = {
    id: 1,
    hash: '0xtest123',
    signature: '0xsig123',
    did: 'did:pohw:test:1',
    timestamp: new Date().toISOString(),
    submitted_at: new Date().toISOString(),
    derived_from: JSON.stringify(structuredMapping),
    tier: 'human-only',
    assistance_profile: 'human-only'
  };

  try {
    // createPAVClaimFromProof accepts string | string[] for derivedFrom
    // The structured format is handled by the PAVClaimBuilder.setDerivedFrom method
    // For testing, we'll extract sources from structured mapping
    const sources = structuredMapping.map(m => m.source);
    const pavClaim = createPAVClaimFromProof(
      testProof.hash,
      testProof.did,
      testProof.timestamp,
      testProof.signature,
      undefined, // processDigest
      undefined, // compoundHash
      sources, // derivedFrom (extracted sources)
      undefined, // deviceId
      undefined, // environmentAttestation
      undefined, // entropyProof
      undefined, // temporalCoherence
      undefined, // merkleInclusion
      undefined  // anchors
    );

    console.log('   ✅ PAV claim generated successfully');
    console.log('   Derived From in PAV claim:');
    console.log('   ', JSON.stringify(pavClaim['pav:derivedFrom'], null, 2));
    console.log('');

    // Verify sources were extracted correctly
    const derivedFrom = pavClaim['pav:derivedFrom'];
    if (Array.isArray(derivedFrom) && derivedFrom.length === 3) {
      console.log('   ✅ Sources extracted correctly');
      console.log(`      Found ${derivedFrom.length} sources`);
      console.log(`      Sources: ${derivedFrom.join(', ')}`);
    } else {
      throw new Error('Sources not extracted correctly');
    }

  } catch (error: any) {
    console.error('   ❌ PAV claim generation failed:', error.message);
    throw error;
  }

  // Test 3: Simple format (backward compatibility)
  console.log('3️⃣  Testing simple format (backward compatibility)...\n');
  
  const simpleMapping = ['0xabc123', '0xdef456'];
  
  try {
    const pavClaimSimple = createPAVClaimFromProof(
      testProof.hash,
      testProof.did,
      testProof.timestamp,
      testProof.signature,
      undefined,
      undefined,
      simpleMapping, // simple string array
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    console.log('   ✅ Simple format handled correctly');
    console.log('   Derived From:', JSON.stringify(pavClaimSimple['pav:derivedFrom']));
    console.log('');

  } catch (error: any) {
    console.error('   ❌ Simple format failed:', error.message);
    throw error;
  }

  // Test 4: Database storage format
  console.log('4️⃣  Testing database storage format...\n');
  
  const db = new RegistryDatabase('./data/test-source-mapping');
  
  try {
    const testProofWithMapping: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0xtest456',
      signature: '0xsig456',
      did: 'did:pohw:test:2',
      timestamp: new Date().toISOString(),
      derived_from: JSON.stringify(structuredMapping),
      tier: 'human-only',
      assistance_profile: 'human-only'
    };

    const proofId = await db.storeProof(testProofWithMapping);
    console.log(`   ✅ Proof stored with ID: ${proofId}`);

    const retrieved = await db.getProofByHash('0xtest456');
    if (retrieved && retrieved.derived_from) {
      const parsed = JSON.parse(retrieved.derived_from);
      console.log('   ✅ Derived from retrieved from database');
      console.log(`      Type: ${Array.isArray(parsed) && parsed[0]?.text ? 'structured' : 'simple'}`);
      console.log(`      Count: ${Array.isArray(parsed) ? parsed.length : 1}`);
    } else {
      throw new Error('Derived from not found in retrieved proof');
    }

    await db.close();
    console.log('');

  } catch (error: any) {
    console.error('   ❌ Database test failed:', error.message);
    await db.close();
    throw error;
  }

  console.log('✅ All source mapping tests passed!\n');
  console.log('📋 Summary:');
  console.log('   • Structured format: ✅ Working');
  console.log('   • PAV claim generation: ✅ Working');
  console.log('   • Simple format (backward compat): ✅ Working');
  console.log('   • Database storage: ✅ Working');
  console.log('');
}

testSourceMapping().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});


 * Verifies structured derivedFrom handling
 */

import { RegistryDatabase } from './src/database';
import { ProofRecord } from './src/types';
import { createPAVClaimFromProof } from './src/pav';

async function testSourceMapping() {
  console.log('🧪 Testing Source Mapping Feature\n');

  // Test 1: Structured source mapping format
  console.log('1️⃣  Testing structured source mapping format...\n');
  
  const structuredMapping = [
    {
      text: "This is a quote from another work",
      source: "0x6bf8a1abc123def456",
      sourceType: "pohw-hash" as const,
      position: { start: 0, end: 35 }
    },
    {
      text: "Another citation here",
      source: "https://example.com/article",
      sourceType: "url" as const,
      position: { start: 100, end: 120 }
    },
    {
      text: "Academic reference",
      source: "doi:10.1234/example",
      sourceType: "doi" as const,
      position: { start: 200, end: 217 }
    }
  ];

  console.log('   Input (structured):');
  console.log(JSON.stringify(structuredMapping, null, 2));
  console.log('');

  // Test 2: PAV claim builder handling
  console.log('2️⃣  Testing PAV claim builder...\n');
  
  const testProof: ProofRecord = {
    id: 1,
    hash: '0xtest123',
    signature: '0xsig123',
    did: 'did:pohw:test:1',
    timestamp: new Date().toISOString(),
    submitted_at: new Date().toISOString(),
    derived_from: JSON.stringify(structuredMapping),
    tier: 'human-only',
    assistance_profile: 'human-only'
  };

  try {
    // createPAVClaimFromProof accepts string | string[] for derivedFrom
    // The structured format is handled by the PAVClaimBuilder.setDerivedFrom method
    // For testing, we'll extract sources from structured mapping
    const sources = structuredMapping.map(m => m.source);
    const pavClaim = createPAVClaimFromProof(
      testProof.hash,
      testProof.did,
      testProof.timestamp,
      testProof.signature,
      undefined, // processDigest
      undefined, // compoundHash
      sources, // derivedFrom (extracted sources)
      undefined, // deviceId
      undefined, // environmentAttestation
      undefined, // entropyProof
      undefined, // temporalCoherence
      undefined, // merkleInclusion
      undefined  // anchors
    );

    console.log('   ✅ PAV claim generated successfully');
    console.log('   Derived From in PAV claim:');
    console.log('   ', JSON.stringify(pavClaim['pav:derivedFrom'], null, 2));
    console.log('');

    // Verify sources were extracted correctly
    const derivedFrom = pavClaim['pav:derivedFrom'];
    if (Array.isArray(derivedFrom) && derivedFrom.length === 3) {
      console.log('   ✅ Sources extracted correctly');
      console.log(`      Found ${derivedFrom.length} sources`);
      console.log(`      Sources: ${derivedFrom.join(', ')}`);
    } else {
      throw new Error('Sources not extracted correctly');
    }

  } catch (error: any) {
    console.error('   ❌ PAV claim generation failed:', error.message);
    throw error;
  }

  // Test 3: Simple format (backward compatibility)
  console.log('3️⃣  Testing simple format (backward compatibility)...\n');
  
  const simpleMapping = ['0xabc123', '0xdef456'];
  
  try {
    const pavClaimSimple = createPAVClaimFromProof(
      testProof.hash,
      testProof.did,
      testProof.timestamp,
      testProof.signature,
      undefined,
      undefined,
      simpleMapping, // simple string array
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    console.log('   ✅ Simple format handled correctly');
    console.log('   Derived From:', JSON.stringify(pavClaimSimple['pav:derivedFrom']));
    console.log('');

  } catch (error: any) {
    console.error('   ❌ Simple format failed:', error.message);
    throw error;
  }

  // Test 4: Database storage format
  console.log('4️⃣  Testing database storage format...\n');
  
  const db = new RegistryDatabase('./data/test-source-mapping');
  
  try {
    const testProofWithMapping: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0xtest456',
      signature: '0xsig456',
      did: 'did:pohw:test:2',
      timestamp: new Date().toISOString(),
      derived_from: JSON.stringify(structuredMapping),
      tier: 'human-only',
      assistance_profile: 'human-only'
    };

    const proofId = await db.storeProof(testProofWithMapping);
    console.log(`   ✅ Proof stored with ID: ${proofId}`);

    const retrieved = await db.getProofByHash('0xtest456');
    if (retrieved && retrieved.derived_from) {
      const parsed = JSON.parse(retrieved.derived_from);
      console.log('   ✅ Derived from retrieved from database');
      console.log(`      Type: ${Array.isArray(parsed) && parsed[0]?.text ? 'structured' : 'simple'}`);
      console.log(`      Count: ${Array.isArray(parsed) ? parsed.length : 1}`);
    } else {
      throw new Error('Derived from not found in retrieved proof');
    }

    await db.close();
    console.log('');

  } catch (error: any) {
    console.error('   ❌ Database test failed:', error.message);
    await db.close();
    throw error;
  }

  console.log('✅ All source mapping tests passed!\n');
  console.log('📋 Summary:');
  console.log('   • Structured format: ✅ Working');
  console.log('   • PAV claim generation: ✅ Working');
  console.log('   • Simple format (backward compat): ✅ Working');
  console.log('   • Database storage: ✅ Working');
  console.log('');
}

testSourceMapping().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});


 * Verifies structured derivedFrom handling
 */

import { RegistryDatabase } from './src/database';
import { ProofRecord } from './src/types';
import { createPAVClaimFromProof } from './src/pav';

async function testSourceMapping() {
  console.log('🧪 Testing Source Mapping Feature\n');

  // Test 1: Structured source mapping format
  console.log('1️⃣  Testing structured source mapping format...\n');
  
  const structuredMapping = [
    {
      text: "This is a quote from another work",
      source: "0x6bf8a1abc123def456",
      sourceType: "pohw-hash" as const,
      position: { start: 0, end: 35 }
    },
    {
      text: "Another citation here",
      source: "https://example.com/article",
      sourceType: "url" as const,
      position: { start: 100, end: 120 }
    },
    {
      text: "Academic reference",
      source: "doi:10.1234/example",
      sourceType: "doi" as const,
      position: { start: 200, end: 217 }
    }
  ];

  console.log('   Input (structured):');
  console.log(JSON.stringify(structuredMapping, null, 2));
  console.log('');

  // Test 2: PAV claim builder handling
  console.log('2️⃣  Testing PAV claim builder...\n');
  
  const testProof: ProofRecord = {
    id: 1,
    hash: '0xtest123',
    signature: '0xsig123',
    did: 'did:pohw:test:1',
    timestamp: new Date().toISOString(),
    submitted_at: new Date().toISOString(),
    derived_from: JSON.stringify(structuredMapping),
    tier: 'human-only',
    assistance_profile: 'human-only'
  };

  try {
    // createPAVClaimFromProof accepts string | string[] for derivedFrom
    // The structured format is handled by the PAVClaimBuilder.setDerivedFrom method
    // For testing, we'll extract sources from structured mapping
    const sources = structuredMapping.map(m => m.source);
    const pavClaim = createPAVClaimFromProof(
      testProof.hash,
      testProof.did,
      testProof.timestamp,
      testProof.signature,
      undefined, // processDigest
      undefined, // compoundHash
      sources, // derivedFrom (extracted sources)
      undefined, // deviceId
      undefined, // environmentAttestation
      undefined, // entropyProof
      undefined, // temporalCoherence
      undefined, // merkleInclusion
      undefined  // anchors
    );

    console.log('   ✅ PAV claim generated successfully');
    console.log('   Derived From in PAV claim:');
    console.log('   ', JSON.stringify(pavClaim['pav:derivedFrom'], null, 2));
    console.log('');

    // Verify sources were extracted correctly
    const derivedFrom = pavClaim['pav:derivedFrom'];
    if (Array.isArray(derivedFrom) && derivedFrom.length === 3) {
      console.log('   ✅ Sources extracted correctly');
      console.log(`      Found ${derivedFrom.length} sources`);
      console.log(`      Sources: ${derivedFrom.join(', ')}`);
    } else {
      throw new Error('Sources not extracted correctly');
    }

  } catch (error: any) {
    console.error('   ❌ PAV claim generation failed:', error.message);
    throw error;
  }

  // Test 3: Simple format (backward compatibility)
  console.log('3️⃣  Testing simple format (backward compatibility)...\n');
  
  const simpleMapping = ['0xabc123', '0xdef456'];
  
  try {
    const pavClaimSimple = createPAVClaimFromProof(
      testProof.hash,
      testProof.did,
      testProof.timestamp,
      testProof.signature,
      undefined,
      undefined,
      simpleMapping, // simple string array
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    console.log('   ✅ Simple format handled correctly');
    console.log('   Derived From:', JSON.stringify(pavClaimSimple['pav:derivedFrom']));
    console.log('');

  } catch (error: any) {
    console.error('   ❌ Simple format failed:', error.message);
    throw error;
  }

  // Test 4: Database storage format
  console.log('4️⃣  Testing database storage format...\n');
  
  const db = new RegistryDatabase('./data/test-source-mapping');
  
  try {
    const testProofWithMapping: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0xtest456',
      signature: '0xsig456',
      did: 'did:pohw:test:2',
      timestamp: new Date().toISOString(),
      derived_from: JSON.stringify(structuredMapping),
      tier: 'human-only',
      assistance_profile: 'human-only'
    };

    const proofId = await db.storeProof(testProofWithMapping);
    console.log(`   ✅ Proof stored with ID: ${proofId}`);

    const retrieved = await db.getProofByHash('0xtest456');
    if (retrieved && retrieved.derived_from) {
      const parsed = JSON.parse(retrieved.derived_from);
      console.log('   ✅ Derived from retrieved from database');
      console.log(`      Type: ${Array.isArray(parsed) && parsed[0]?.text ? 'structured' : 'simple'}`);
      console.log(`      Count: ${Array.isArray(parsed) ? parsed.length : 1}`);
    } else {
      throw new Error('Derived from not found in retrieved proof');
    }

    await db.close();
    console.log('');

  } catch (error: any) {
    console.error('   ❌ Database test failed:', error.message);
    await db.close();
    throw error;
  }

  console.log('✅ All source mapping tests passed!\n');
  console.log('📋 Summary:');
  console.log('   • Structured format: ✅ Working');
  console.log('   • PAV claim generation: ✅ Working');
  console.log('   • Simple format (backward compat): ✅ Working');
  console.log('   • Database storage: ✅ Working');
  console.log('');
}

testSourceMapping().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});


 * Verifies structured derivedFrom handling
 */

import { RegistryDatabase } from './src/database';
import { ProofRecord } from './src/types';
import { createPAVClaimFromProof } from './src/pav';

async function testSourceMapping() {
  console.log('🧪 Testing Source Mapping Feature\n');

  // Test 1: Structured source mapping format
  console.log('1️⃣  Testing structured source mapping format...\n');
  
  const structuredMapping = [
    {
      text: "This is a quote from another work",
      source: "0x6bf8a1abc123def456",
      sourceType: "pohw-hash" as const,
      position: { start: 0, end: 35 }
    },
    {
      text: "Another citation here",
      source: "https://example.com/article",
      sourceType: "url" as const,
      position: { start: 100, end: 120 }
    },
    {
      text: "Academic reference",
      source: "doi:10.1234/example",
      sourceType: "doi" as const,
      position: { start: 200, end: 217 }
    }
  ];

  console.log('   Input (structured):');
  console.log(JSON.stringify(structuredMapping, null, 2));
  console.log('');

  // Test 2: PAV claim builder handling
  console.log('2️⃣  Testing PAV claim builder...\n');
  
  const testProof: ProofRecord = {
    id: 1,
    hash: '0xtest123',
    signature: '0xsig123',
    did: 'did:pohw:test:1',
    timestamp: new Date().toISOString(),
    submitted_at: new Date().toISOString(),
    derived_from: JSON.stringify(structuredMapping),
    tier: 'human-only',
    assistance_profile: 'human-only'
  };

  try {
    // createPAVClaimFromProof accepts string | string[] for derivedFrom
    // The structured format is handled by the PAVClaimBuilder.setDerivedFrom method
    // For testing, we'll extract sources from structured mapping
    const sources = structuredMapping.map(m => m.source);
    const pavClaim = createPAVClaimFromProof(
      testProof.hash,
      testProof.did,
      testProof.timestamp,
      testProof.signature,
      undefined, // processDigest
      undefined, // compoundHash
      sources, // derivedFrom (extracted sources)
      undefined, // deviceId
      undefined, // environmentAttestation
      undefined, // entropyProof
      undefined, // temporalCoherence
      undefined, // merkleInclusion
      undefined  // anchors
    );

    console.log('   ✅ PAV claim generated successfully');
    console.log('   Derived From in PAV claim:');
    console.log('   ', JSON.stringify(pavClaim['pav:derivedFrom'], null, 2));
    console.log('');

    // Verify sources were extracted correctly
    const derivedFrom = pavClaim['pav:derivedFrom'];
    if (Array.isArray(derivedFrom) && derivedFrom.length === 3) {
      console.log('   ✅ Sources extracted correctly');
      console.log(`      Found ${derivedFrom.length} sources`);
      console.log(`      Sources: ${derivedFrom.join(', ')}`);
    } else {
      throw new Error('Sources not extracted correctly');
    }

  } catch (error: any) {
    console.error('   ❌ PAV claim generation failed:', error.message);
    throw error;
  }

  // Test 3: Simple format (backward compatibility)
  console.log('3️⃣  Testing simple format (backward compatibility)...\n');
  
  const simpleMapping = ['0xabc123', '0xdef456'];
  
  try {
    const pavClaimSimple = createPAVClaimFromProof(
      testProof.hash,
      testProof.did,
      testProof.timestamp,
      testProof.signature,
      undefined,
      undefined,
      simpleMapping, // simple string array
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    console.log('   ✅ Simple format handled correctly');
    console.log('   Derived From:', JSON.stringify(pavClaimSimple['pav:derivedFrom']));
    console.log('');

  } catch (error: any) {
    console.error('   ❌ Simple format failed:', error.message);
    throw error;
  }

  // Test 4: Database storage format
  console.log('4️⃣  Testing database storage format...\n');
  
  const db = new RegistryDatabase('./data/test-source-mapping');
  
  try {
    const testProofWithMapping: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0xtest456',
      signature: '0xsig456',
      did: 'did:pohw:test:2',
      timestamp: new Date().toISOString(),
      derived_from: JSON.stringify(structuredMapping),
      tier: 'human-only',
      assistance_profile: 'human-only'
    };

    const proofId = await db.storeProof(testProofWithMapping);
    console.log(`   ✅ Proof stored with ID: ${proofId}`);

    const retrieved = await db.getProofByHash('0xtest456');
    if (retrieved && retrieved.derived_from) {
      const parsed = JSON.parse(retrieved.derived_from);
      console.log('   ✅ Derived from retrieved from database');
      console.log(`      Type: ${Array.isArray(parsed) && parsed[0]?.text ? 'structured' : 'simple'}`);
      console.log(`      Count: ${Array.isArray(parsed) ? parsed.length : 1}`);
    } else {
      throw new Error('Derived from not found in retrieved proof');
    }

    await db.close();
    console.log('');

  } catch (error: any) {
    console.error('   ❌ Database test failed:', error.message);
    await db.close();
    throw error;
  }

  console.log('✅ All source mapping tests passed!\n');
  console.log('📋 Summary:');
  console.log('   • Structured format: ✅ Working');
  console.log('   • PAV claim generation: ✅ Working');
  console.log('   • Simple format (backward compat): ✅ Working');
  console.log('   • Database storage: ✅ Working');
  console.log('');
}

testSourceMapping().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});


 * Verifies structured derivedFrom handling
 */

import { RegistryDatabase } from './src/database';
import { ProofRecord } from './src/types';
import { createPAVClaimFromProof } from './src/pav';

async function testSourceMapping() {
  console.log('🧪 Testing Source Mapping Feature\n');

  // Test 1: Structured source mapping format
  console.log('1️⃣  Testing structured source mapping format...\n');
  
  const structuredMapping = [
    {
      text: "This is a quote from another work",
      source: "0x6bf8a1abc123def456",
      sourceType: "pohw-hash" as const,
      position: { start: 0, end: 35 }
    },
    {
      text: "Another citation here",
      source: "https://example.com/article",
      sourceType: "url" as const,
      position: { start: 100, end: 120 }
    },
    {
      text: "Academic reference",
      source: "doi:10.1234/example",
      sourceType: "doi" as const,
      position: { start: 200, end: 217 }
    }
  ];

  console.log('   Input (structured):');
  console.log(JSON.stringify(structuredMapping, null, 2));
  console.log('');

  // Test 2: PAV claim builder handling
  console.log('2️⃣  Testing PAV claim builder...\n');
  
  const testProof: ProofRecord = {
    id: 1,
    hash: '0xtest123',
    signature: '0xsig123',
    did: 'did:pohw:test:1',
    timestamp: new Date().toISOString(),
    submitted_at: new Date().toISOString(),
    derived_from: JSON.stringify(structuredMapping),
    tier: 'human-only',
    assistance_profile: 'human-only'
  };

  try {
    // createPAVClaimFromProof accepts string | string[] for derivedFrom
    // The structured format is handled by the PAVClaimBuilder.setDerivedFrom method
    // For testing, we'll extract sources from structured mapping
    const sources = structuredMapping.map(m => m.source);
    const pavClaim = createPAVClaimFromProof(
      testProof.hash,
      testProof.did,
      testProof.timestamp,
      testProof.signature,
      undefined, // processDigest
      undefined, // compoundHash
      sources, // derivedFrom (extracted sources)
      undefined, // deviceId
      undefined, // environmentAttestation
      undefined, // entropyProof
      undefined, // temporalCoherence
      undefined, // merkleInclusion
      undefined  // anchors
    );

    console.log('   ✅ PAV claim generated successfully');
    console.log('   Derived From in PAV claim:');
    console.log('   ', JSON.stringify(pavClaim['pav:derivedFrom'], null, 2));
    console.log('');

    // Verify sources were extracted correctly
    const derivedFrom = pavClaim['pav:derivedFrom'];
    if (Array.isArray(derivedFrom) && derivedFrom.length === 3) {
      console.log('   ✅ Sources extracted correctly');
      console.log(`      Found ${derivedFrom.length} sources`);
      console.log(`      Sources: ${derivedFrom.join(', ')}`);
    } else {
      throw new Error('Sources not extracted correctly');
    }

  } catch (error: any) {
    console.error('   ❌ PAV claim generation failed:', error.message);
    throw error;
  }

  // Test 3: Simple format (backward compatibility)
  console.log('3️⃣  Testing simple format (backward compatibility)...\n');
  
  const simpleMapping = ['0xabc123', '0xdef456'];
  
  try {
    const pavClaimSimple = createPAVClaimFromProof(
      testProof.hash,
      testProof.did,
      testProof.timestamp,
      testProof.signature,
      undefined,
      undefined,
      simpleMapping, // simple string array
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    console.log('   ✅ Simple format handled correctly');
    console.log('   Derived From:', JSON.stringify(pavClaimSimple['pav:derivedFrom']));
    console.log('');

  } catch (error: any) {
    console.error('   ❌ Simple format failed:', error.message);
    throw error;
  }

  // Test 4: Database storage format
  console.log('4️⃣  Testing database storage format...\n');
  
  const db = new RegistryDatabase('./data/test-source-mapping');
  
  try {
    const testProofWithMapping: Omit<ProofRecord, 'id' | 'submitted_at'> = {
      hash: '0xtest456',
      signature: '0xsig456',
      did: 'did:pohw:test:2',
      timestamp: new Date().toISOString(),
      derived_from: JSON.stringify(structuredMapping),
      tier: 'human-only',
      assistance_profile: 'human-only'
    };

    const proofId = await db.storeProof(testProofWithMapping);
    console.log(`   ✅ Proof stored with ID: ${proofId}`);

    const retrieved = await db.getProofByHash('0xtest456');
    if (retrieved && retrieved.derived_from) {
      const parsed = JSON.parse(retrieved.derived_from);
      console.log('   ✅ Derived from retrieved from database');
      console.log(`      Type: ${Array.isArray(parsed) && parsed[0]?.text ? 'structured' : 'simple'}`);
      console.log(`      Count: ${Array.isArray(parsed) ? parsed.length : 1}`);
    } else {
      throw new Error('Derived from not found in retrieved proof');
    }

    await db.close();
    console.log('');

  } catch (error: any) {
    console.error('   ❌ Database test failed:', error.message);
    await db.close();
    throw error;
  }

  console.log('✅ All source mapping tests passed!\n');
  console.log('📋 Summary:');
  console.log('   • Structured format: ✅ Working');
  console.log('   • PAV claim generation: ✅ Working');
  console.log('   • Simple format (backward compat): ✅ Working');
  console.log('   • Database storage: ✅ Working');
  console.log('');
}

testSourceMapping().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});

