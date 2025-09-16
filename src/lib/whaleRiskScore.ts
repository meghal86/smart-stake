import { supabase } from '@/integrations/supabase/client';

interface RiskFactors {
  whaleAddress: string;
  transferVelocity7d: number;
  transferVelocity30d: number;
  sizeConcentration: number;
  cexProximity: number;
  dexPropensity: number;
  anomalyZScore: number;
}

interface RiskResult {
  riskScore: number;
  factorWeights: {
    velocity: number;
    concentration: number;
    cexProximity: number;
    dexPropensity: number;
    anomaly: number;
  };
  reasons: string[];
}

/**
 * Winsorize value to 5th-95th percentile range to handle outliers
 */
function winsorize(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Logistic normalization to map values to 0-1 range
 */
function logisticNormalize(value: number, midpoint: number = 0, steepness: number = 1): number {
  return 1 / (1 + Math.exp(-steepness * (value - midpoint)));
}

/**
 * Compute whale risk score using multiple behavioral factors
 */
export function computeWhaleRiskScore(factors: RiskFactors): RiskResult {
  // Winsorize inputs to handle extreme outliers (5th-95th percentile bounds)
  const velocity7d = winsorize(factors.transferVelocity7d, 0, 100);
  const velocity30d = winsorize(factors.transferVelocity30d, 0, 50);
  const concentration = winsorize(factors.sizeConcentration, 0, 1);
  const cexProximity = winsorize(factors.cexProximity, 0, 1);
  const dexPropensity = winsorize(factors.dexPropensity, 0, 1);
  const anomalyZ = winsorize(factors.anomalyZScore, -3, 3);

  // Normalize factors to 0-1 using logistic functions
  const velocityScore = logisticNormalize(velocity7d / 10, 2, 0.5); // Higher velocity = higher risk
  const concentrationScore = logisticNormalize(concentration, 0.7, 5); // High concentration = higher risk
  const cexScore = logisticNormalize(cexProximity, 0.5, 3); // CEX proximity = higher risk
  const dexScore = 1 - logisticNormalize(dexPropensity, 0.5, 3); // DEX usage = lower risk
  const anomalyScore = logisticNormalize(Math.abs(anomalyZ), 1.5, 2); // Anomalies = higher risk

  // Factor weights (sum to 1.0)
  const weights = {
    velocity: 0.25,
    concentration: 0.20,
    cexProximity: 0.20,
    dexPropensity: 0.15,
    anomaly: 0.20
  };

  // Weighted risk score (0-100)
  const riskScore = Math.round(
    (velocityScore * weights.velocity +
     concentrationScore * weights.concentration +
     cexScore * weights.cexProximity +
     dexScore * weights.dexPropensity +
     anomalyScore * weights.anomaly) * 100
  );

  // Generate explanatory reasons
  const reasons: string[] = [];
  
  if (velocityScore > 0.7) reasons.push(`High transfer velocity: ${velocity7d} tx/week`);
  if (concentrationScore > 0.6) reasons.push(`High balance concentration: ${(concentration * 100).toFixed(1)}%`);
  if (cexScore > 0.6) reasons.push(`Frequent CEX interactions: ${(cexProximity * 100).toFixed(1)}%`);
  if (dexScore > 0.6) reasons.push(`Low DEX usage indicates centralized behavior`);
  if (anomalyScore > 0.7) reasons.push(`Anomalous behavior detected (z-score: ${anomalyZ.toFixed(2)})`);
  
  if (reasons.length === 0) reasons.push('Normal whale behavior patterns detected');

  return {
    riskScore,
    factorWeights: weights,
    reasons
  };
}

/**
 * Persist risk score results to whale_signals table
 */
export async function persistRiskScore(
  whaleAddress: string,
  chain: string,
  result: RiskResult
): Promise<void> {
  try {
    const { error } = await supabase
      .from('whale_signals')
      .insert({
        address: whaleAddress,
        chain,
        signal_type: 'risk_score',
        value: result.riskScore.toString(),
        confidence: Math.min(0.95, result.riskScore / 100), // Higher risk = higher confidence
        reasons: result.reasons,
        supporting_events: [], // Could include recent tx hashes
        ts: new Date().toISOString(),
        provider: 'whale-analytics',
        method: 'risk_score_computation'
      });

    if (error) {
      console.error('Failed to persist risk score:', error);
      throw error;
    }

    console.log(`Risk score ${result.riskScore} persisted for ${whaleAddress}`);
  } catch (error) {
    console.error('Error persisting risk score:', error);
    throw error;
  }
}

/**
 * Complete risk assessment workflow
 */
export async function assessWhaleRisk(factors: RiskFactors, chain: string = 'ethereum'): Promise<RiskResult> {
  // Compute risk score
  const result = computeWhaleRiskScore(factors);
  
  // Persist to database
  await persistRiskScore(factors.whaleAddress, chain, result);
  
  return result;
}