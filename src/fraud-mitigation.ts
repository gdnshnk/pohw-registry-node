/**
 * Fraud Mitigation and Reputation Decay
 * PoHW Whitepaper Section 8.5 Implementation
 * 
 * Implements:
 * - Behavioral rate limiting embedded in cryptography
 * - Reputation decay model anchored in temporal trust
 * - Entropy discrepancy warnings
 * - Anomaly detection without surveillance
 */

import { createHash } from 'crypto';

/**
 * Rate limiting thresholds (human-like behavior)
 */
export const RATE_LIMITS = {
  /** Maximum proofs per minute (human threshold) */
  MAX_PROOFS_PER_MINUTE: 10,
  /** Maximum proofs per hour */
  MAX_PROOFS_PER_HOUR: 100,
  /** Maximum proofs per day */
  MAX_PROOFS_PER_DAY: 1000,
  /** Minimum interval between proofs (milliseconds) */
  MIN_INTERVAL_MS: 6000, // 6 seconds between proofs
  /** Anomaly threshold multiplier (e.g., 5x normal rate triggers warning) */
  ANOMALY_MULTIPLIER: 5,
};

/**
 * Reputation scoring parameters
 */
export const REPUTATION_CONFIG = {
  /** Initial reputation score (neutral) */
  INITIAL_SCORE: 50,
  /** Maximum reputation score */
  MAX_SCORE: 100,
  /** Minimum reputation score */
  MIN_SCORE: 0,
  /** Points added per successful proof */
  PROOF_SUCCESS_POINTS: 1,
  /** Points deducted per revocation */
  REVOCATION_PENALTY: 10,
  /** Points deducted per failed attestation */
  FAILED_ATTESTATION_PENALTY: 5,
  /** Points deducted per cryptographic anomaly */
  ANOMALY_PENALTY: 15,
  /** Decay rate per day (exponential decay) */
  DECAY_RATE: 0.01, // 1% per day
  /** Recovery time constant (days to recover from penalty) */
  RECOVERY_TIME_DAYS: 30,
};

/**
 * Proof submission record for rate limiting
 */
export interface ProofSubmissionRecord {
  did: string;
  timestamp: string;
  hash: string;
  /** Whether this submission triggered a rate limit warning */
  rateLimitWarning?: boolean;
  /** Entropy discrepancy detected */
  entropyDiscrepancy?: boolean;
}

/**
 * Reputation record
 */
export interface ReputationRecord {
  did: string;
  /** Current reputation score (0-100) */
  score: number;
  /** Last updated timestamp */
  lastUpdated: string;
  /** Total successful proofs */
  successfulProofs: number;
  /** Total revocations */
  revocations: number;
  /** Total failed attestations */
  failedAttestations: number;
  /** Total cryptographic anomalies */
  anomalies: number;
  /** Reputation tier (green, blue, purple, grey) */
  tier: 'green' | 'blue' | 'purple' | 'grey';
  /** Trust level (0-1) */
  trustLevel: number;
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  warnings?: string[];
  /** Current rate (proofs per minute) */
  currentRate?: number;
  /** Entropy discrepancy detected */
  entropyDiscrepancy?: boolean;
}

/**
 * Fraud Mitigation Manager
 */
export class FraudMitigationManager {
  private submissionHistory: Map<string, ProofSubmissionRecord[]>;
  private reputationScores: Map<string, ReputationRecord>;
  private anomalyLog: Map<string, string[]>; // DID -> array of anomaly descriptions
  private db: any; // RegistryDatabase instance

  constructor(db?: any) {
    this.submissionHistory = new Map();
    this.reputationScores = new Map();
    this.anomalyLog = new Map();
    this.db = db;

    // Load existing data from database if available
    if (this.db) {
      this.loadFromDatabase();
    }
  }

  /**
   * Load data from database
   */
  private loadFromDatabase(): void {
    if (!this.db) return;

    // Load reputation scores
    const allReputation = this.db.getAllReputation();
    for (const [did, reputation] of Object.entries(allReputation)) {
      this.reputationScores.set(did, reputation as ReputationRecord);
    }

    // Load submission history
    const allReputationKeys = Object.keys(allReputation);
    for (const did of allReputationKeys) {
      const history = this.db.getSubmissionHistory(did);
      this.submissionHistory.set(did, history);
    }

    // Load anomaly logs
    for (const did of allReputationKeys) {
      const anomalies = this.db.getAnomalyLog(did);
      if (anomalies.length > 0) {
        this.anomalyLog.set(did, anomalies);
      }
    }
  }

  /**
   * Check rate limits for a DID
   * Returns whether submission is allowed and any warnings
   */
  checkRateLimit(did: string, currentTimestamp: string = new Date().toISOString()): RateLimitResult {
    const history = this.submissionHistory.get(did) || [];
    const now = new Date(currentTimestamp).getTime();

    // Filter to recent submissions (last hour)
    const recentSubmissions = history.filter(record => {
      const recordTime = new Date(record.timestamp).getTime();
      const ageMs = now - recordTime;
      return ageMs <= 3600000; // 1 hour
    });

    // Calculate rates
    const lastMinute = recentSubmissions.filter(r => {
      const recordTime = new Date(r.timestamp).getTime();
      return (now - recordTime) <= 60000; // 1 minute
    });

    const lastHour = recentSubmissions.filter(r => {
      const recordTime = new Date(r.timestamp).getTime();
      return (now - recordTime) <= 3600000; // 1 hour
    });

    const proofsPerMinute = lastMinute.length;
    const proofsPerHour = lastHour.length;

    // Check minimum interval
    if (recentSubmissions.length > 0) {
      const lastSubmission = recentSubmissions[recentSubmissions.length - 1];
      const lastTime = new Date(lastSubmission.timestamp).getTime();
      const intervalMs = now - lastTime;
      
      if (intervalMs < RATE_LIMITS.MIN_INTERVAL_MS) {
        return {
          allowed: false,
          reason: `Proofs submitted too quickly. Minimum interval: ${RATE_LIMITS.MIN_INTERVAL_MS}ms`,
          currentRate: proofsPerMinute,
        };
      }
    }

    // Check rate limits
    const warnings: string[] = [];
    let entropyDiscrepancy = false;

    if (proofsPerMinute > RATE_LIMITS.MAX_PROOFS_PER_MINUTE) {
      const anomalyRate = proofsPerMinute / RATE_LIMITS.MAX_PROOFS_PER_MINUTE;
      
      if (anomalyRate >= RATE_LIMITS.ANOMALY_MULTIPLIER) {
        // Severe anomaly - block submission
        entropyDiscrepancy = true;
        this.logAnomaly(did, `Extreme rate anomaly: ${proofsPerMinute} proofs/minute (${anomalyRate.toFixed(1)}x threshold)`);
        return {
          allowed: false,
          reason: `Rate limit exceeded: ${proofsPerMinute} proofs/minute exceeds human threshold`,
          currentRate: proofsPerMinute,
          entropyDiscrepancy: true,
        };
      } else {
        // Warning but allow
        warnings.push(`High submission rate: ${proofsPerMinute} proofs/minute`);
        entropyDiscrepancy = true;
      }
    }

    if (proofsPerHour > RATE_LIMITS.MAX_PROOFS_PER_HOUR) {
      warnings.push(`High hourly rate: ${proofsPerHour} proofs/hour`);
    }

    return {
      allowed: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      currentRate: proofsPerMinute,
      entropyDiscrepancy: entropyDiscrepancy || undefined,
    };
  }

  /**
   * Record a proof submission
   */
  recordSubmission(did: string, hash: string, timestamp: string = new Date().toISOString(), rateLimitResult?: RateLimitResult): void {
    const history = this.submissionHistory.get(did) || [];
    
    const record: ProofSubmissionRecord = {
      did,
      timestamp,
      hash,
      rateLimitWarning: rateLimitResult?.warnings !== undefined && rateLimitResult.warnings.length > 0,
      entropyDiscrepancy: rateLimitResult?.entropyDiscrepancy || false,
    };

    history.push(record);
    
    // Keep only last 24 hours of history
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const filteredHistory = history.filter(r => r.timestamp >= oneDayAgo);
    
    this.submissionHistory.set(did, filteredHistory);

    // Persist to database
    if (this.db) {
      this.db.appendSubmissionHistory(did, record);
    }

    // Update reputation (successful proof)
    if (rateLimitResult?.allowed !== false) {
      this.updateReputation(did, 'proof_success');
    }
  }

  /**
   * Get or initialize reputation record
   */
  getReputation(did: string): ReputationRecord {
    let reputation = this.reputationScores.get(did);
    
    if (!reputation) {
      // Try loading from database
      if (this.db) {
        const dbReputation = this.db.getReputation(did);
        if (dbReputation) {
          reputation = dbReputation as ReputationRecord;
          this.reputationScores.set(did, reputation);
        }
      }

      if (!reputation) {
        reputation = {
          did,
          score: REPUTATION_CONFIG.INITIAL_SCORE,
          lastUpdated: new Date().toISOString(),
          successfulProofs: 0,
          revocations: 0,
          failedAttestations: 0,
          anomalies: 0,
          tier: 'grey',
          trustLevel: 0.5,
        };
        this.reputationScores.set(did, reputation);
      }
    } else {
      // Apply decay since last update
      if (reputation) {
        this.applyDecay(reputation);
      }
    }

    // At this point, reputation is guaranteed to be defined
    return reputation!;
  }

  /**
   * Update reputation based on event
   */
  updateReputation(did: string, event: 'proof_success' | 'revocation' | 'failed_attestation' | 'anomaly'): void {
    const reputation = this.getReputation(did);
    const now = new Date().toISOString();

    // Apply decay first
    this.applyDecay(reputation);

    // Update based on event
    switch (event) {
      case 'proof_success':
        reputation.score = Math.min(
          REPUTATION_CONFIG.MAX_SCORE,
          reputation.score + REPUTATION_CONFIG.PROOF_SUCCESS_POINTS
        );
        reputation.successfulProofs++;
        break;

      case 'revocation':
        reputation.score = Math.max(
          REPUTATION_CONFIG.MIN_SCORE,
          reputation.score - REPUTATION_CONFIG.REVOCATION_PENALTY
        );
        reputation.revocations++;
        break;

      case 'failed_attestation':
        reputation.score = Math.max(
          REPUTATION_CONFIG.MIN_SCORE,
          reputation.score - REPUTATION_CONFIG.FAILED_ATTESTATION_PENALTY
        );
        reputation.failedAttestations++;
        break;

      case 'anomaly':
        reputation.score = Math.max(
          REPUTATION_CONFIG.MIN_SCORE,
          reputation.score - REPUTATION_CONFIG.ANOMALY_PENALTY
        );
        reputation.anomalies++;
        this.logAnomaly(did, 'Cryptographic anomaly detected');
        break;
    }

    // Update tier and trust level
    reputation.tier = this.calculateTier(reputation.score);
    reputation.trustLevel = reputation.score / REPUTATION_CONFIG.MAX_SCORE;
    reputation.lastUpdated = now;

    this.reputationScores.set(did, reputation);

    // Persist to database
    if (this.db) {
      this.db.storeReputation(did, reputation);
    }
  }

  /**
   * Apply exponential decay to reputation
   */
  private applyDecay(reputation: ReputationRecord): void {
    const now = new Date();
    const lastUpdate = new Date(reputation.lastUpdated);
    const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate > 0) {
      // Exponential decay: score * (1 - decay_rate) ^ days
      const decayFactor = Math.pow(1 - REPUTATION_CONFIG.DECAY_RATE, daysSinceUpdate);
      reputation.score = Math.max(
        REPUTATION_CONFIG.MIN_SCORE,
        reputation.score * decayFactor
      );
    }
  }

  /**
   * Calculate reputation tier from score
   */
  private calculateTier(score: number): 'green' | 'blue' | 'purple' | 'grey' {
    if (score >= 80) return 'green';
    if (score >= 60) return 'blue';
    if (score >= 40) return 'purple';
    return 'grey';
  }

  /**
   * Log an anomaly for a DID
   */
  private logAnomaly(did: string, description: string): void {
    const anomalies = this.anomalyLog.get(did) || [];
    const entry = `${new Date().toISOString()}: ${description}`;
    anomalies.push(entry);
    
    // Keep only last 100 anomalies
    if (anomalies.length > 100) {
      anomalies.shift();
    }
    
    this.anomalyLog.set(did, anomalies);

    // Persist to database
    if (this.db) {
      this.db.appendAnomalyLog(did, entry);
    }
  }

  /**
   * Get anomaly log for a DID (for transparency)
   */
  getAnomalyLog(did: string): string[] {
    let anomalies = this.anomalyLog.get(did);
    if (!anomalies && this.db) {
      anomalies = this.db.getAnomalyLog(did);
      if (anomalies && anomalies.length > 0) {
        this.anomalyLog.set(did, anomalies);
      }
    }
    return anomalies || [];
  }

  /**
   * Check if DID has recent anomalies
   */
  hasRecentAnomalies(did: string, hours: number = 24): boolean {
    const anomalies = this.getAnomalyLog(did);
    if (anomalies.length === 0) return false;

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    return anomalies.some(entry => entry.split(':')[0] >= cutoff);
  }

  /**
   * Get submission statistics for a DID
   */
  getSubmissionStats(did: string): {
    totalSubmissions: number;
    submissionsLastHour: number;
    submissionsLastDay: number;
    averageInterval: number;
    warnings: number;
  } {
    const history = this.submissionHistory.get(did) || [];
    const now = Date.now();

    const lastHour = history.filter(r => {
      const recordTime = new Date(r.timestamp).getTime();
      return (now - recordTime) <= 3600000;
    });

    const lastDay = history.filter(r => {
      const recordTime = new Date(r.timestamp).getTime();
      return (now - recordTime) <= 86400000;
    });

    // Calculate average interval
    let averageInterval = 0;
    if (history.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < history.length; i++) {
        const prev = new Date(history[i - 1].timestamp).getTime();
        const curr = new Date(history[i].timestamp).getTime();
        intervals.push(curr - prev);
      }
      averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    const warnings = history.filter(r => r.rateLimitWarning || r.entropyDiscrepancy).length;

    return {
      totalSubmissions: history.length,
      submissionsLastHour: lastHour.length,
      submissionsLastDay: lastDay.length,
      averageInterval,
      warnings,
    };
  }

  /**
   * Generate entropy discrepancy warning (for proof log)
   */
  generateEntropyWarning(did: string, rateLimitResult: RateLimitResult): string | null {
    if (!rateLimitResult.entropyDiscrepancy) return null;

    const stats = this.getSubmissionStats(did);
    const reputation = this.getReputation(did);

    return `ENTROPY_DISCREPANCY: DID ${did.substring(0, 20)}... rate=${rateLimitResult.currentRate}/min, reputation=${reputation.score.toFixed(1)}, tier=${reputation.tier}`;
  }
}

