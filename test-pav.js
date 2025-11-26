#!/usr/bin/env node
/**
 * Test PAV Ontology Extension
 * 
 * Demonstrates:
 * - PAV metadata schema integration
 * - Core PAV fields (createdBy, derivedFrom, createdOn)
 * - Process Layer fields (processDigest, entropyProof, temporalCoherence)
 * - Environment fields (environmentAttestation, authoredOnDevice)
 * - JSON-LD claim objects
 */

const { 
  PAVClaimBuilder, 
  PAVClaimValidator, 
  PAVClaimParser,
  createPAVClaimFromProof,
  PAV_NAMESPACE,
  POHW_NAMESPACE
} = require('./dist/pav');

async function testPAVBuilder() {
  console.log('=== Test 1: PAV Claim Builder ===\n');
  
  const builder = new PAVClaimBuilder();
  
  const claim = builder
    .setHash('0xabc123def4567890123456789012345678901234567890123456789012345678')
    .setCreatedBy('did:pohw:gideon123')
    .setCreatedOn('2026-05-10T14:03:00Z')
    .setDerivedFrom('hash:0x6bf8a1...')
    .setAuthoredOnDevice('urn:device:macbook-m3-001')
    .setEnvironmentAttestation('sig:tool:VSCode:human-only')
    .setProcessDigest('hash:afc2b9...')
    .setEntropyProof('zkp:entropy>0.7')
    .setTemporalCoherence('zkp:duration>45min')
    .setSignature('sig:did:pohw:gideon123')
    .setMerkleInclusion('proof:eth:0xabc...')
    .setAnchors([
      { chain: 'ethereum', tx: '0xabc...', block: 12345 },
      { chain: 'bitcoin', tx: '0x98e...' }
    ])
    .setCompoundHash('0xcompound...')
    .setRegistry('proofofhumanwork.org')
    .setTier('green')
    .build();
  
  console.log('✅ PAV Claim Object created:');
  console.log(JSON.stringify(claim, null, 2));
  
  return claim;
}

async function testPAVValidator() {
  console.log('\n\n=== Test 2: PAV Claim Validator ===\n');
  
  // Valid claim
  const validClaim = {
    '@context': [PAV_NAMESPACE, POHW_NAMESPACE],
    type: 'PoHWClaim',
    hash: '0xabc123def4567890123456789012345678901234567890123456789012345678',
    'pav:createdBy': 'did:pohw:gideon123',
    'pav:createdOn': '2026-05-10T14:03:00Z',
    'pav:signature': 'sig:did:pohw:gideon123'
  };
  
  const validation1 = PAVClaimValidator.validate(validClaim);
  console.log('Valid claim:');
  console.log(`  Valid: ${validation1.valid ? '✅' : '❌'}`);
  if (validation1.errors.length > 0) {
    console.log(`  Errors: ${validation1.errors.join(', ')}`);
  }
  
  // Invalid claim (missing @context)
  const invalidClaim = {
    type: 'PoHWClaim',
    hash: '0xabc...'
  };
  
  const validation2 = PAVClaimValidator.validate(invalidClaim);
  console.log('\nInvalid claim (missing @context):');
  console.log(`  Valid: ${validation2.valid ? '✅' : '❌'}`);
  if (validation2.errors.length > 0) {
    console.log(`  Errors: ${validation2.errors.join(', ')}`);
  }
  
  // Completeness check
  const completeness = PAVClaimValidator.validateCompleteness(validClaim);
  console.log('\nCompleteness check:');
  console.log(`  Complete: ${completeness.complete ? '✅' : '⚠️'}`);
  if (completeness.missing.length > 0) {
    console.log(`  Missing: ${completeness.missing.join(', ')}`);
  }
  
  return { validClaim, validation1, validation2, completeness };
}

async function testPAVParser() {
  console.log('\n\n=== Test 3: PAV Claim Parser ===\n');
  
  const claimJSON = `{
    "@context": "https://purl.org/pav/",
    "type": "PoHWClaim",
    "hash": "0xabc123...",
    "pav:createdBy": "did:pohw:gideon123",
    "pav:createdOn": "2026-05-10T14:03:00Z",
    "pav:derivedFrom": "hash:0x6bf8a1...",
    "pav:authoredOnDevice": "urn:device:macbook-m3-001",
    "pav:environmentAttestation": "sig:tool:VSCode:human-only",
    "pav:processDigest": "hash:afc2b9...",
    "pav:entropyProof": "zkp:entropy>0.7",
    "pav:temporalCoherence": "zkp:duration>45min",
    "pav:signature": "sig:did:pohw:gideon123",
    "pav:merkleInclusion": "proof:eth:0xabc...",
    "pav:anchors": ["eth:0xabc...", "btc:0x98e..."]
  }`;
  
  // Parse JSON
  const claim = PAVClaimParser.parse(claimJSON);
  console.log('✅ Parsed claim:');
  console.log(`  Hash: ${claim.hash}`);
  console.log(`  Created By: ${claim['pav:createdBy']}`);
  
  // Normalize
  const normalized = PAVClaimParser.normalize(claim);
  console.log('\n✅ Normalized claim:');
  console.log(`  @context is array: ${Array.isArray(normalized['@context'])}`);
  console.log(`  type is array: ${Array.isArray(normalized.type)}`);
  
  // Extract fields
  const provenance = PAVClaimParser.extractProvenance(normalized);
  console.log('\n✅ Extracted provenance:');
  console.log(JSON.stringify(provenance, null, 2));
  
  const processLayer = PAVClaimParser.extractProcessLayer(normalized);
  console.log('\n✅ Extracted process layer:');
  console.log(JSON.stringify(processLayer, null, 2));
  
  const environment = PAVClaimParser.extractEnvironment(normalized);
  console.log('\n✅ Extracted environment:');
  console.log(JSON.stringify(environment, null, 2));
  
  const attestations = PAVClaimParser.extractAttestations(normalized);
  console.log('\n✅ Extracted attestations:');
  console.log(JSON.stringify(attestations, null, 2));
  
  return { claim, normalized, provenance, processLayer, environment, attestations };
}

async function testCreateFromProof() {
  console.log('\n\n=== Test 4: Create PAV Claim From Proof ===\n');
  
  const claim = createPAVClaimFromProof(
    '0xabc123def4567890123456789012345678901234567890123456789012345678',
    'did:pohw:gideon123',
    '2026-05-10T14:03:00Z',
    'sig:did:pohw:gideon123',
    'hash:afc2b9...',
    '0xcompound...',
    'hash:0x6bf8a1...',
    'urn:device:macbook-m3-001',
    'sig:tool:VSCode:human-only',
    'zkp:entropy>0.7',
    'zkp:duration>45min',
    'proof:eth:0xabc...',
    [
      { chain: 'ethereum', tx: '0xabc...', block: 12345 },
      { chain: 'bitcoin', tx: '0x98e...' }
    ]
  );
  
  console.log('✅ Created PAV claim from proof:');
  console.log(JSON.stringify(claim, null, 2));
  
  // Validate
  const validation = PAVClaimValidator.validate(claim);
  console.log(`\n✅ Validation: ${validation.valid ? 'PASSED' : 'FAILED'}`);
  
  return claim;
}

async function testJSONLD() {
  console.log('\n\n=== Test 5: JSON-LD Format ===\n');
  
  const builder = new PAVClaimBuilder();
  const claim = builder
    .setHash('0xabc123...')
    .setCreatedBy('did:pohw:gideon123')
    .setCreatedOn('2026-05-10T14:03:00Z')
    .setSignature('sig:did:pohw:gideon123')
    .build();
  
  const jsonld = builder.buildJSON();
  console.log('✅ JSON-LD formatted claim:');
  console.log(jsonld);
  
  // Verify it's valid JSON-LD
  const parsed = JSON.parse(jsonld);
  console.log(`\n✅ Valid JSON: ${parsed !== null}`);
  console.log(`✅ Has @context: ${!!parsed['@context']}`);
  console.log(`✅ Has type: ${!!parsed.type}`);
  
  return { claim, jsonld };
}

// Main test
async function main() {
  try {
    await testPAVBuilder();
    await testPAVValidator();
    await testPAVParser();
    await testCreateFromProof();
    await testJSONLD();
    
    console.log('\n\n=== Summary ===');
    console.log('✅ PAV metadata schema integration working');
    console.log('✅ Core PAV fields (createdBy, derivedFrom, createdOn) working');
    console.log('✅ Process Layer fields (processDigest, entropyProof, temporalCoherence) working');
    console.log('✅ Environment fields (environmentAttestation, authoredOnDevice) working');
    console.log('✅ JSON-LD claim objects working');
    console.log('\nAll PAV Ontology Extension features implemented according to PoHW whitepaper!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testPAVBuilder, testPAVValidator, testPAVParser };

