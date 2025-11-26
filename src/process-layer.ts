/**
 * Process Layer - PoHW Whitepaper Implementation
 * 
 * Tracks human activity indicators and generates process digests
 * that serve as mathematical witnesses to the presence of human effort.
 * 
 * Features:
 * - Session duration tracking
 * - Input entropy/variance measurement
 * - Temporal coherence signals
 * - Zero-knowledge proofs for human effort thresholds
 * - Process digest generation and hashing
 */

import { createHash, randomBytes } from 'crypto';
import { generateZKProof, ZKProof, ZKProofResult } from './zk-snark';

/**
 * Process metrics collected during a creative session
 */
export interface ProcessMetrics {
  /** Session start timestamp (ISO 8601) */
  sessionStart: string;
  
  /** Session end timestamp (ISO 8601) */
  sessionEnd: string;
  
  /** Total session duration in milliseconds */
  duration: number;
  
  /** Input entropy score (0-1, higher = more random/varied input) */
  entropy: number;
  
  /** Temporal coherence score (0-1, measures human-like timing patterns) */
  temporalCoherence: number;
  
  /** Number of discrete input events (keystrokes, clicks, etc.) */
  inputEvents: number;
  
  /** Variance in inter-event timing (standard deviation in ms) */
  timingVariance: number;
  
  /** Average time between input events (ms) */
  averageInterval: number;
  
  /** Minimum time between events (ms) - detects automation */
  minInterval: number;
  
  /** Maximum time between events (ms) */
  maxInterval: number;
  
  /** Process metadata (optional, privacy-preserving) */
  metadata?: {
    tool?: string;
    environment?: string;
    aiAssisted?: boolean;
  };
}

/**
 * Process digest - a one-way hash representing human effort
 */
export interface ProcessDigest {
  /** SHA-256 hash of the process metrics */
  digest: string;
  
  /** Original metrics (for verification, can be discarded after hashing) */
  metrics: ProcessMetrics;
  
  /** Zero-knowledge proof commitment (optional, legacy) */
  zkCommitment?: string;
  
  /** Full ZK-SNARK proof (optional) */
  zkProof?: ZKProof;
  
  /** ZK-SNARK proof result (optional) */
  zkProofResult?: ZKProofResult;
  
  /** Human threshold verification result */
  meetsThresholds: boolean;
}

/**
 * Human effort thresholds (from PoHW whitepaper)
 */
export interface HumanThresholds {
  /** Minimum session duration in milliseconds (default: 5 minutes) */
  minDuration: number;
  
  /** Minimum entropy score (default: 0.5) */
  minEntropy: number;
  
  /** Minimum temporal coherence (default: 0.3) */
  minTemporalCoherence: number;
  
  /** Maximum input rate (events per second) - detects automation */
  maxInputRate: number;
  
  /** Minimum time between events (ms) - prevents machine-speed input */
  minEventInterval: number;
}

/**
 * Default human thresholds
 */
export const DEFAULT_THRESHOLDS: HumanThresholds = {
  minDuration: 5 * 60 * 1000, // 5 minutes
  minEntropy: 0.5,
  minTemporalCoherence: 0.3,
  maxInputRate: 20, // 20 events per second max
  minEventInterval: 50 // 50ms minimum between events
};

/**
 * Process Layer Session Tracker
 * 
 * Tracks human activity during a creative session and generates
 * process digests that prove human effort without revealing behavior.
 */
export class ProcessSession {
  private sessionStart: number;
  private inputEvents: Array<{ timestamp: number; type?: string }>;
  private thresholds: HumanThresholds;
  private metadata?: ProcessMetrics['metadata'];

  constructor(thresholds?: Partial<HumanThresholds>, metadata?: ProcessMetrics['metadata']) {
    this.sessionStart = Date.now();
    this.inputEvents = [];
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.metadata = metadata;
  }

  /**
   * Record an input event (keystroke, mouse click, etc.)
   */
  recordInput(type?: string): void {
    this.inputEvents.push({
      timestamp: Date.now(),
      type
    });
  }

  /**
   * Calculate input entropy
   * Measures the randomness/variance in input patterns
   */
  private calculateEntropy(): number {
    if (this.inputEvents.length < 2) {
      return 0;
    }

    // Calculate intervals between events
    const intervals: number[] = [];
    for (let i = 1; i < this.inputEvents.length; i++) {
      intervals.push(this.inputEvents[i].timestamp - this.inputEvents[i - 1].timestamp);
    }

    if (intervals.length === 0) {
      return 0;
    }

    // Calculate Shannon entropy of intervals
    // Group intervals into bins and calculate entropy
    const binSize = 100; // 100ms bins
    const bins: Map<number, number> = new Map();
    
    intervals.forEach(interval => {
      const bin = Math.floor(interval / binSize);
      bins.set(bin, (bins.get(bin) || 0) + 1);
    });

    // Calculate entropy
    const total = intervals.length;
    let entropy = 0;
    
    bins.forEach(count => {
      const probability = count / total;
      if (probability > 0) {
        entropy -= probability * Math.log2(probability);
      }
    });

    // Normalize to 0-1 range (max entropy for uniform distribution)
    const maxEntropy = Math.log2(bins.size || 1);
    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }

  /**
   * Calculate temporal coherence
   * Measures how human-like the timing patterns are
   */
  private calculateTemporalCoherence(): number {
    if (this.inputEvents.length < 3) {
      return 0;
    }

    const intervals: number[] = [];
    for (let i = 1; i < this.inputEvents.length; i++) {
      intervals.push(this.inputEvents[i].timestamp - this.inputEvents[i - 1].timestamp);
    }

    if (intervals.length === 0) {
      return 0;
    }

    // Calculate coefficient of variation (CV)
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // CV = stdDev / mean
    // Lower CV = more consistent (machine-like)
    // Higher CV = more variable (human-like)
    // We want moderate CV (0.3-0.7) for human-like patterns
    const cv = mean > 0 ? stdDev / mean : 0;
    
    // Score: 1.0 when CV is in optimal range (0.3-0.7), decreases outside
    if (cv >= 0.3 && cv <= 0.7) {
      return 1.0;
    } else if (cv < 0.3) {
      // Too consistent (machine-like)
      return cv / 0.3;
    } else {
      // Too variable (also suspicious)
      return Math.max(0, 1.0 - (cv - 0.7) / 0.3);
    }
  }

  /**
   * Calculate timing statistics
   */
  private calculateTimingStats(): {
    variance: number;
    average: number;
    min: number;
    max: number;
  } {
    if (this.inputEvents.length < 2) {
      return { variance: 0, average: 0, min: 0, max: 0 };
    }

    const intervals: number[] = [];
    for (let i = 1; i < this.inputEvents.length; i++) {
      intervals.push(this.inputEvents[i].timestamp - this.inputEvents[i - 1].timestamp);
    }

    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
    const min = Math.min(...intervals);
    const max = Math.max(...intervals);

    return { variance, average: mean, min, max };
  }

  /**
   * Check if metrics meet human thresholds
   */
  private meetsThresholds(metrics: ProcessMetrics): boolean {
    const duration = metrics.duration;
    const entropy = metrics.entropy;
    const temporalCoherence = metrics.temporalCoherence;
    const inputRate = metrics.inputEvents / (duration / 1000); // events per second

    return (
      duration >= this.thresholds.minDuration &&
      entropy >= this.thresholds.minEntropy &&
      temporalCoherence >= this.thresholds.minTemporalCoherence &&
      inputRate <= this.thresholds.maxInputRate &&
      metrics.minInterval >= this.thresholds.minEventInterval
    );
  }

  /**
   * Generate process metrics from the session
   */
  generateMetrics(): ProcessMetrics {
    const sessionEnd = Date.now();
    const duration = sessionEnd - this.sessionStart;
    const timingStats = this.calculateTimingStats();

    return {
      sessionStart: new Date(this.sessionStart).toISOString(),
      sessionEnd: new Date(sessionEnd).toISOString(),
      duration,
      entropy: this.calculateEntropy(),
      temporalCoherence: this.calculateTemporalCoherence(),
      inputEvents: this.inputEvents.length,
      timingVariance: timingStats.variance,
      averageInterval: timingStats.average,
      minInterval: timingStats.min,
      maxInterval: timingStats.max,
      metadata: this.metadata
    };
  }

  /**
   * Generate process digest from metrics
   * Creates a one-way hash that proves human effort without revealing behavior
   */
  async generateDigest(): Promise<ProcessDigest> {
    const metrics = this.generateMetrics();
    const meetsThresholds = this.meetsThresholds(metrics);

    // Create canonical JSON representation of metrics
    // Exclude metadata for privacy, only hash essential indicators
    const digestData = {
      duration: metrics.duration,
      entropy: Math.round(metrics.entropy * 1000) / 1000, // Round to 3 decimals
      temporalCoherence: Math.round(metrics.temporalCoherence * 1000) / 1000,
      inputEvents: metrics.inputEvents,
      timingVariance: Math.round(metrics.timingVariance),
      averageInterval: Math.round(metrics.averageInterval),
      minInterval: metrics.minInterval,
      maxInterval: metrics.maxInterval
    };

    // Generate SHA-256 hash of canonical JSON
    const canonicalJson = JSON.stringify(digestData, Object.keys(digestData).sort());
    const digest = createHash('sha256').update(canonicalJson).digest('hex');

    // Generate ZK commitment (legacy, for backward compatibility)
    const zkCommitment = this.generateZKCommitment(metrics);

    // Generate full ZK-SNARK proof (if thresholds are met)
    let zkProof: ZKProof | undefined;
    let zkProofResult: ZKProofResult | undefined;
    
    if (meetsThresholds) {
      try {
        const result = await generateZKProof(metrics, this.thresholds);
        if (result && result.valid) {
          zkProofResult = result;
          zkProof = result.proof;
        }
      } catch (error) {
        console.warn('Failed to generate ZK-SNARK proof:', error);
        // Fall back to commitment-based proof
      }
    }

    return {
      digest: '0x' + digest,
      metrics,
      zkCommitment,
      zkProof,
      zkProofResult,
      meetsThresholds
    };
  }

  /**
   * Generate zero-knowledge proof commitment
   * In production, this would use actual ZK-SNARKs or BBS+ signatures
   * For now, we generate a commitment that can be verified without revealing metrics
   */
  private generateZKCommitment(metrics: ProcessMetrics): string {
    // Create a commitment that proves thresholds are met without revealing values
    // This is a simplified version - production would use proper ZK circuits
    
    const commitmentData = {
      durationMet: metrics.duration >= this.thresholds.minDuration ? 1 : 0,
      entropyMet: metrics.entropy >= this.thresholds.minEntropy ? 1 : 0,
      coherenceMet: metrics.temporalCoherence >= this.thresholds.minTemporalCoherence ? 1 : 0,
      rateMet: (metrics.inputEvents / (metrics.duration / 1000)) <= this.thresholds.maxInputRate ? 1 : 0,
      intervalMet: metrics.minInterval >= this.thresholds.minEventInterval ? 1 : 0,
      // Add randomness to prevent correlation
      nonce: randomBytes(16).toString('hex')
    };

    const commitment = createHash('sha256')
      .update(JSON.stringify(commitmentData))
      .digest('hex');

    return '0x' + commitment;
  }

  /**
   * Verify a process digest meets human thresholds
   */
  static verifyDigest(digest: ProcessDigest, thresholds?: Partial<HumanThresholds>): boolean {
    const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    const metrics = digest.metrics;
    
    const duration = metrics.duration >= finalThresholds.minDuration;
    const entropy = metrics.entropy >= finalThresholds.minEntropy;
    const coherence = metrics.temporalCoherence >= finalThresholds.minTemporalCoherence;
    const inputRate = (metrics.inputEvents / (metrics.duration / 1000)) <= finalThresholds.maxInputRate;
    const interval = metrics.minInterval >= finalThresholds.minEventInterval;

    return duration && entropy && coherence && inputRate && interval;
  }

  /**
   * Verify a process digest using ZK-SNARK proof (if available)
   * This provides privacy-preserving verification without revealing metrics
   */
  static async verifyDigestWithZK(
    digest: ProcessDigest,
    thresholds?: Partial<HumanThresholds>
  ): Promise<boolean> {
    // If ZK-SNARK proof is available, verify it
    if (digest.zkProof) {
      const { verifyZKProof } = await import('./zk-snark');
      const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
      const isValid = await verifyZKProof(digest.zkProof, finalThresholds);
      
      if (isValid) {
        return true; // ZK proof verified - thresholds met
      }
      // If ZK proof fails, fall back to direct verification
    }

    // Fall back to direct verification if no ZK proof or ZK proof invalid
    return ProcessSession.verifyDigest(digest, thresholds);
  }
}

/**
 * Generate a compound hash from content hash and process digest
 * This binds the creative outcome to the human effort that produced it
 */
export function generateCompoundHash(contentHash: string, processDigest: string): string {
  const compoundData = {
    contentHash,
    processDigest
  };

  const canonicalJson = JSON.stringify(compoundData, Object.keys(compoundData).sort());
  const compoundHash = createHash('sha256').update(canonicalJson).digest('hex');
  
  return '0x' + compoundHash;
}

/**
 * Create a process session with default settings
 */
export function createProcessSession(
  metadata?: ProcessMetrics['metadata'],
  thresholds?: Partial<HumanThresholds>
): ProcessSession {
  return new ProcessSession(thresholds, metadata);
}

