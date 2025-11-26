# Process Layer Implementation

## Overview

The Process Layer is a core component of the PoHW protocol as specified in the whitepaper. It tracks human activity indicators during creative sessions and generates **process digests** - one-way cryptographic hashes that serve as mathematical witnesses to the presence of human effort.

## Features

✅ **Session Duration Tracking** - Measures total time spent in creative session  
✅ **Input Entropy Measurement** - Calculates randomness/variance in input patterns  
✅ **Temporal Coherence Signals** - Detects human-like timing patterns vs. automation  
✅ **Zero-Knowledge Commitments** - Privacy-preserving proof commitments  
✅ **Process Digest Generation** - Creates one-way hashes of human effort  
✅ **Human Threshold Verification** - Validates that metrics meet human effort requirements  

## Architecture

### Process Metrics

The Process Layer collects the following metrics during a creative session:

- **Session Duration** - Total time from start to end (milliseconds)
- **Input Entropy** - Shannon entropy of input intervals (0-1, higher = more varied)
- **Temporal Coherence** - Measures human-like timing patterns (0-1)
- **Input Events** - Number of discrete input events (keystrokes, clicks, etc.)
- **Timing Variance** - Standard deviation of inter-event timing
- **Average/Min/Max Intervals** - Statistical measures of input timing

### Human Thresholds

Default thresholds that must be met for a proof to be considered "human":

- **Minimum Duration**: 5 minutes
- **Minimum Entropy**: 0.5 (moderate variation required)
- **Minimum Temporal Coherence**: 0.3 (some human-like patterns)
- **Maximum Input Rate**: 20 events/second (prevents automation)
- **Minimum Event Interval**: 50ms (prevents machine-speed input)

## Usage

### Basic Usage

```typescript
import { ProcessSession, generateCompoundHash } from './process-layer';

// Create a new session
const session = new ProcessSession({
  minDuration: 5 * 60 * 1000, // 5 minutes
  minEntropy: 0.5,
  minTemporalCoherence: 0.3
}, {
  tool: 'text-editor',
  environment: 'desktop',
  aiAssisted: false
});

// Record input events during creative work
session.recordInput('keystroke');
session.recordInput('keystroke');
// ... more events ...

// Generate process digest
const digest = session.generateDigest();

// Check if thresholds are met
if (digest.meetsThresholds) {
  console.log('Human effort verified!');
  console.log('Process Digest:', digest.digest);
  console.log('ZK Commitment:', digest.zkCommitment);
}

// Generate compound hash (content + process)
const contentHash = '0x...'; // Your content hash
const compoundHash = generateCompoundHash(contentHash, digest.digest);
```

### Integration with Registry API

When submitting a proof to the registry, include the process digest:

```json
{
  "hash": "0x...",
  "signature": "...",
  "did": "did:pohw:...",
  "timestamp": "2025-11-25T12:00:00Z",
  "processDigest": "0x...",
  "compoundHash": "0x...",
  "processMetrics": {
    "duration": 300000,
    "entropy": 0.75,
    "temporalCoherence": 0.65,
    "inputEvents": 150,
    "meetsThresholds": true
  }
}
```

## How It Works

### 1. Session Tracking

The `ProcessSession` class tracks all input events with timestamps. This creates a temporal record of human activity without storing the actual content.

### 2. Entropy Calculation

Input entropy is calculated using Shannon entropy on the distribution of inter-event intervals. This measures how varied and unpredictable the input patterns are - a key indicator of human vs. machine behavior.

### 3. Temporal Coherence

Temporal coherence measures the coefficient of variation (CV) in timing patterns. Human input has moderate CV (0.3-0.7), while machines tend to be either too consistent (low CV) or too random (high CV).

### 4. Process Digest

The process digest is a SHA-256 hash of canonicalized metrics. It proves human effort without revealing behavioral data:

```typescript
{
  duration: 300000,
  entropy: 0.75,
  temporalCoherence: 0.65,
  inputEvents: 150,
  timingVariance: 12345,
  averageInterval: 2000,
  minInterval: 150,
  maxInterval: 5000
}
```

### 5. Zero-Knowledge Commitments

The ZK commitment proves that thresholds are met without revealing the actual metric values. This preserves privacy while enabling verification.

### 6. Compound Hash

The compound hash binds the content hash to the process digest, creating an immutable link between the creative outcome and the human effort that produced it.

## Privacy & Security

- **No Behavioral Data Stored** - Only statistical aggregates are hashed
- **One-Way Hashing** - Process digests cannot be reversed to reveal behavior
- **Local Computation** - All metrics calculated on-device
- **Zero-Knowledge Proofs** - Threshold verification without value disclosure
- **Metadata Optional** - Tool/environment info is optional and privacy-preserving

## Testing

Run the test script to see the Process Layer in action:

```bash
npm run build
node test-process-layer.js
```

This will:
1. Simulate a human creative session (passes thresholds)
2. Simulate a bot/automated session (fails thresholds)
3. Demonstrate compound hash generation

## Whitepaper Compliance

This implementation follows the PoHW whitepaper specification:

- ✅ **Section 5.1**: Process Layer tracks human activity indicators
- ✅ **Section 5.2**: Process digests are one-way hashes
- ✅ **Section 3.3**: Privacy-preserving (no behavioral data stored)
- ✅ **Section 4.2**: Resists AI mimicry through entropy and temporal analysis
- ✅ **Section 5.2**: Compound hash binds content to process

## Future Enhancements

- [ ] Full ZK-SNARK implementation for threshold proofs
- [ ] BBS+ signatures for selective disclosure
- [ ] Multi-modal input tracking (mouse, touch, stylus)
- [ ] Advanced entropy models (multi-scale, fractal)
- [ ] Machine learning models for human pattern detection

## References

- PoHW Whitepaper: Section 5 (Reference Architecture)
- PoHW Whitepaper: Section 3.3 (Human Authenticity)
- PoHW Whitepaper: Section 4.2 (AI Mimicry and Human Process Spoofing)

