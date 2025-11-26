# Test Proofs for Verification Interface

This document contains test proof hashes that can be used to test the verification interface.

## ⚠️ Important Note

These are **TEST PROOFS ONLY** with fake data. They are:
- **NOT cryptographically secure**
- **NOT real proofs**
- **For testing purposes only**
- **Should NOT be used in production**

## Test Proof Hashes

### 1. Basic Test Proof (Grey Tier)
**Hash:** `0xbf521edae7cb2d13378e254b7cb329866b2fc7c1097bea54e9f60c24a04008ac`

- **DID:** `did:pohw:test:verification-test-user`
- **Tier:** Grey (no credentials)
- **Assistance Profile:** human-only
- **Status:** ✅ Submitted and verified

### 2. Test Proof with Process Digest
**Hash:** `0x6ae4cdb5e5fcbc1ea342535294d20445c19a7f7ed16b9b5ff64df34fc419a811`

- **DID:** `did:pohw:test:verification-test-user`
- **Tier:** Grey (no credentials)
- **Assistance Profile:** human-only
- **Process Metrics:** Included (duration, entropy, temporal coherence)
- **Status:** ✅ Submitted

### 3. AI-Assisted Test Proof (Purple Tier)
**Hash:** `0xd409eebed1a3aed0003992a85c3c6ebee5aae53391faea1a84e314d22d915f27`

- **DID:** `did:pohw:test:verification-test-user`
- **Tier:** Purple (AI-assisted)
- **Assistance Profile:** AI-assisted
- **Process Metrics:** Included
- **Status:** ⚠️ May be rate-limited (submit separately)

## How to Use

1. **Start the registry** (if not already running):
   ```bash
   cd pohw-registry-node
   npm start
   ```

2. **Create a new test proof**:
   ```bash
   node create-test-proof.js
   ```

3. **Create multiple test proofs** (with delays):
   ```bash
   node create-multiple-test-proofs.js
   ```

4. **Test on verification interface**:
   - Go to: `http://proofofhumanwork.org/verify/`
   - Paste any hash from above
   - Click "Verify"

## Creating Custom Test Proofs

### Basic Proof (Grey Tier)
```bash
node create-test-proof.js
```

### Proof with Process Digest
```bash
node create-test-proof.js --with-process
```

### AI-Assisted Proof (Purple Tier)
```bash
node create-test-proof.js --ai-assisted
```

### AI-Generated Proof (Purple Tier)
```bash
node create-test-proof.js --ai-generated
```

## Notes

- **Rate Limiting:** The registry enforces rate limiting (minimum 6 seconds between submissions from the same DID)
- **Mock Attestors:** Mock attestors are automatically created in development mode
- **Credentials:** To test Blue/Green tiers, credentials must be issued via the attestor API first
- **Batching:** Proofs may need to be batched before Merkle proofs are available

## Security Warning

**DO NOT** use these test proofs or the test script in production. They use:
- Non-cryptographic signatures
- Predictable test data
- Mock attestors
- Test DIDs

For production use, always use the official SDK with proper cryptographic signing.

