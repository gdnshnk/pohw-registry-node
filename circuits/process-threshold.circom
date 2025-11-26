/**
 * PoHW Process Threshold Verification Circuit
 * 
 * This Circom circuit verifies that process metrics meet human effort thresholds
 * without revealing the actual metric values.
 * 
 * Circuit proves:
 * - duration >= minDuration
 * - entropy >= minEntropy
 * - temporalCoherence >= minTemporalCoherence
 * - inputRate <= maxInputRate
 * - minInterval >= minEventInterval
 * 
 * All metric values remain private (witness), only threshold checks are public.
 */

pragma circom 2.0.0;

template ProcessThresholdVerification() {
    // Private inputs (witness) - actual metric values
    signal private input duration;
    signal private input entropyScaled;  // entropy * 1000
    signal private input coherenceScaled; // temporalCoherence * 1000
    signal private input inputEvents;
    signal private input minInterval;
    
    // Public inputs - threshold values
    signal public input minDuration;
    signal public input minEntropyScaled;  // minEntropy * 1000
    signal public input minCoherenceScaled; // minTemporalCoherence * 1000
    signal public input maxInputRate;      // events per second
    signal public input minEventInterval;
    
    // Public outputs - threshold check results
    signal output durationMet;
    signal output entropyMet;
    signal output coherenceMet;
    signal output rateMet;
    signal output intervalMet;
    signal output allMet; // All thresholds met
    
    // Component for comparison
    component durationCheck = GreaterThan(32);
    component entropyCheck = GreaterThan(32);
    component coherenceCheck = GreaterThan(32);
    component rateCheck = LessThan(32);
    component intervalCheck = GreaterThan(32);
    
    // Calculate input rate (events per second)
    // inputRate = inputEvents * 1000 / duration
    // We need to check: inputRate <= maxInputRate
    // Which is: inputEvents * 1000 <= maxInputRate * duration
    signal rateCheckValue;
    rateCheckValue <== inputEvents * 1000;
    signal rateThreshold;
    rateThreshold <== maxInputRate * duration;
    
    // Check duration >= minDuration
    durationCheck.in[0] <== duration;
    durationCheck.in[1] <== minDuration;
    durationMet <== durationCheck.out;
    
    // Check entropy >= minEntropy
    entropyCheck.in[0] <== entropyScaled;
    entropyCheck.in[1] <== minEntropyScaled;
    entropyMet <== entropyCheck.out;
    
    // Check coherence >= minCoherence
    coherenceCheck.in[0] <== coherenceScaled;
    coherenceCheck.in[1] <== minCoherenceScaled;
    coherenceMet <== coherenceCheck.out;
    
    // Check inputRate <= maxInputRate
    // rateCheckValue <= rateThreshold
    rateCheck.in[0] <== rateCheckValue;
    rateCheck.in[1] <== rateThreshold;
    rateMet <== rateCheck.out;
    
    // Check minInterval >= minEventInterval
    intervalCheck.in[0] <== minInterval;
    intervalCheck.in[1] <== minEventInterval;
    intervalMet <== intervalCheck.out;
    
    // All thresholds must be met
    allMet <== durationMet * entropyMet * coherenceMet * rateMet * intervalMet;
}

// Helper templates for comparisons
template GreaterThan(n) {
    signal input in[2];
    signal output out;
    
    component lt = LessThan(n);
    
    lt.in[0] <== in[0];
    lt.in[1] <== in[1];
    
    out <== 1 - lt.out;
}

template LessThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;
    
    component n2b = Num2Bits(n);
    n2b.in <== in[0] + (1 << n) - in[1];
    
    out <== 1 - n2b.out[n - 1];
}

template Num2Bits(n) {
    signal input in;
    signal output out[n];
    var lc1 = 0;
    
    var e2 = 1;
    for (var i = 0; i < n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] - 1) === 0;
        lc1 += out[i] * e2;
        e2 = e2 + e2;
    }
    
    lc1 === in;
}

// Main component
component main = ProcessThresholdVerification();

