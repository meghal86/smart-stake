/**
 * Confidence Aggregation Utilities
 * 
 * Implements R1.10: Confidence Aggregation Rule
 * - For safety-critical aggregates (approvals, actions, plans): confidence = min(sourceConfidences)
 * - Weighted averages allowed ONLY for non-execution UI metrics
 */

export interface SourceConfidence {
  source: string;
  confidence: number; // 0.0 to 1.0
  isSafetyCritical: boolean;
}

export interface AggregatedConfidence {
  confidence: number;
  method: 'min' | 'weighted_avg';
  sources: SourceConfidence[];
}

/**
 * Aggregate confidence values according to R1.10 rules
 * 
 * @param sources - Array of source confidences
 * @param minThreshold - Minimum confidence threshold (default 0.50)
 * @returns Aggregated confidence value
 */
export function aggregateConfidence(
  sources: SourceConfidence[],
  minThreshold: number = 0.50
): AggregatedConfidence {
  if (sources.length === 0) {
    return {
      confidence: minThreshold,
      method: 'min',
      sources: []
    };
  }

  // Filter out NaN values and clamp to valid range
  const validSources = sources.map(s => ({
    ...s,
    confidence: isNaN(s.confidence) ? 0.0 : Math.max(0.0, Math.min(1.0, s.confidence))
  }));

  // Check if any source is safety-critical
  const hasSafetyCritical = validSources.some(s => s.isSafetyCritical);

  let confidence: number;
  let method: 'min' | 'weighted_avg';

  if (hasSafetyCritical) {
    // For safety-critical aggregates: use minimum rule
    confidence = Math.min(...validSources.map(s => s.confidence));
    method = 'min';
  } else {
    // For non-execution UI metrics: weighted average allowed
    const totalWeight = validSources.length;
    const weightedSum = validSources.reduce((sum, s) => sum + s.confidence, 0);
    confidence = weightedSum / totalWeight;
    method = 'weighted_avg';
  }

  // Enforce minimum threshold
  confidence = Math.max(minThreshold, confidence);

  return {
    confidence,
    method,
    sources: validSources
  };
}

/**
 * Create a source confidence from a Promise result
 * 
 * @param source - Source name
 * @param result - Promise settled result
 * @param isSafetyCritical - Whether this source is safety-critical
 * @returns SourceConfidence object
 */
export function sourceConfidenceFromResult(
  source: string,
  result: PromiseSettledResult<any>,
  isSafetyCritical: boolean
): SourceConfidence {
  return {
    source,
    confidence: result.status === 'fulfilled' ? 1.0 : 0.0,
    isSafetyCritical
  };
}

/**
 * Determine if a data source is safety-critical
 * 
 * Safety-critical sources are those that affect:
 * - Approvals
 * - Actions (recommended actions)
 * - Plans (intent plans)
 * 
 * @param source - Source name
 * @returns true if safety-critical
 */
export function isSafetyCriticalSource(source: string): boolean {
  const safetyCriticalSources = ['Guardian', 'Portfolio'];
  return safetyCriticalSources.includes(source);
}
