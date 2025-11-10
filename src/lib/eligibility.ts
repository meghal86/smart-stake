/**
 * Eligibility Scoring Algorithm
 * 
 * Calculates eligibility scores for opportunities based on wallet signals.
 * Implements weighted scoring as per Requirements 6.1-6.4.
 * 
 * Weights:
 * - Chain presence: 40%
 * - Wallet age: 25% (capped at 30 days)
 * - Transaction count: 20% (capped at 10 tx)
 * - Holdings: 15%
 * - Allowlist proofs: +5% bonus
 * 
 * Labels:
 * - "likely": score ≥ 0.7
 * - "maybe": score 0.4-0.69
 * - "unlikely": score < 0.4
 */

export interface EligibilitySignals {
  /** Wallet age in days */
  walletAgeDays: number;
  /** Total transaction count */
  txCount: number;
  /** Whether wallet holds tokens on the required chain */
  holdsOnChain: boolean;
  /** Function to check if wallet has activity on a specific chain */
  hasActivityOnChain: (chain: string) => boolean;
  /** Whether wallet has allowlist proofs */
  allowlistProofs: boolean;
  /** Required chain for the opportunity */
  requiredChain: string;
}

export interface EligibilityResult {
  /** Final eligibility score (0-1 range, can exceed 1 with bonus) */
  score: number;
  /** Human-readable label */
  label: 'likely' | 'maybe' | 'unlikely';
  /** Breakdown of score components for debugging */
  breakdown: {
    chainPresence: number;
    walletAge: number;
    transactionCount: number;
    holdings: number;
    allowlistBonus: number;
  };
  /** Reasons explaining the determination */
  reasons: string[];
}

/**
 * Calculate eligibility score based on wallet signals
 * 
 * @param signals - Wallet signals for scoring
 * @returns Eligibility result with score, label, breakdown, and reasons
 */
export function calculateEligibilityScore(signals: EligibilitySignals): EligibilityResult {
  const breakdown = {
    chainPresence: 0,
    walletAge: 0,
    transactionCount: 0,
    holdings: 0,
    allowlistBonus: 0,
  };
  
  const reasons: string[] = [];

  // Chain presence: 40% weight
  const hasChainActivity = signals.hasActivityOnChain(signals.requiredChain);
  breakdown.chainPresence = hasChainActivity ? 0.40 : 0;
  
  if (hasChainActivity) {
    reasons.push(`Active on ${signals.requiredChain}`);
  } else {
    reasons.push(`No activity on ${signals.requiredChain}`);
  }

  // Wallet age: 25% weight (capped at 30 days)
  const ageScore = Math.max(0, Math.min(signals.walletAgeDays / 30, 1));
  breakdown.walletAge = ageScore * 0.25;
  
  if (signals.walletAgeDays >= 30) {
    reasons.push('Wallet age 30+ days');
  } else if (signals.walletAgeDays >= 7) {
    reasons.push(`Wallet age ${signals.walletAgeDays} days`);
  } else {
    reasons.push(`New wallet (${signals.walletAgeDays} days)`);
  }

  // Transaction count: 20% weight (capped at 10 tx)
  const txScore = Math.max(0, Math.min(signals.txCount / 10, 1));
  breakdown.transactionCount = txScore * 0.20;
  
  if (signals.txCount >= 10) {
    reasons.push('10+ transactions');
  } else if (signals.txCount >= 5) {
    reasons.push(`${signals.txCount} transactions`);
  } else if (signals.txCount > 0) {
    reasons.push(`Only ${signals.txCount} transaction${signals.txCount === 1 ? '' : 's'}`);
  } else {
    reasons.push('No transactions');
  }

  // Holdings: 15% weight
  breakdown.holdings = signals.holdsOnChain ? 0.15 : 0;
  
  if (signals.holdsOnChain) {
    reasons.push('Holds tokens on chain');
  } else {
    reasons.push('No token holdings detected');
  }

  // Allowlist proofs: +5% bonus
  if (signals.allowlistProofs) {
    breakdown.allowlistBonus = 0.05;
    reasons.push('On allowlist');
  }

  // Calculate total score
  const score = 
    breakdown.chainPresence +
    breakdown.walletAge +
    breakdown.transactionCount +
    breakdown.holdings +
    breakdown.allowlistBonus;

  // Determine label based on score thresholds
  let label: 'likely' | 'maybe' | 'unlikely';
  if (score >= 0.7) {
    label = 'likely';
  } else if (score >= 0.4) {
    label = 'maybe';
  } else {
    label = 'unlikely';
  }

  // Round score to 2 decimal places for consistency
  const roundedScore = Number(score.toFixed(2));

  return {
    score: roundedScore,
    label,
    breakdown,
    reasons,
  };
}

/**
 * Helper function to create a mock hasActivityOnChain function for testing
 * 
 * @param activeChains - Array of chains where wallet has activity
 * @returns Function that checks if wallet has activity on a given chain
 */
export function createChainActivityChecker(activeChains: string[]): (chain: string) => boolean {
  return (chain: string) => activeChains.includes(chain);
}
