/**
 * Trust Score calculation engine
 */
import type { ApprovalRisk } from './approvals';
import type { HoneypotResult } from './honeypot';
import type { MixerProximityResult } from './mixer';
import type { ReputationResult } from './reputation';

export interface RiskFactor {
  category:
    | 'Approvals'
    | 'Honeypot'
    | 'Hidden Mint'
    | 'Reputation'
    | 'Mixer'
    | 'Age'
    | 'Liquidity'
    | 'Taxes'
    | 'Contract';
  impact: number; // Negative points deducted
  severity: 'low' | 'medium' | 'high';
  description: string;
  meta?: Record<string, any>;
}

export interface TrustScoreResult {
  score: number; // 0..100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: RiskFactor[];
  totals: {
    flags: number;
    critical: number; // High severity count
  };
}

export interface TrustScoreInputs {
  approvals: ApprovalRisk[];
  honeypotResults: Map<string, HoneypotResult>;
  mixerProximity: MixerProximityResult;
  reputation: ReputationResult;
  contractVerified?: boolean;
  contractAge?: number; // Days since deployment
  walletAge?: number; // Days since first transaction
}

/**
 * Calculate trust score from various inputs
 */
export function calculateTrustScore(
  inputs: TrustScoreInputs
): TrustScoreResult {
  let score = 100; // Start at perfect score
  const factors: RiskFactor[] = [];

  // === 1. Approvals Analysis ===
  const unlimitedApprovals = inputs.approvals.filter(
    (a) => a.reason.toLowerCase().includes('unlimited')
  );
  
  if (unlimitedApprovals.length > 0) {
    const deduction = Math.min(unlimitedApprovals.length * 15, 45);
    score -= deduction;
    factors.push({
      category: 'Approvals',
      impact: -deduction,
      severity: unlimitedApprovals.length > 2 ? 'high' : 'medium',
      description: `${unlimitedApprovals.length} unlimited approval${
        unlimitedApprovals.length > 1 ? 's' : ''
      } detected`,
      meta: {
        count: unlimitedApprovals.length,
        tokens: unlimitedApprovals.map((a) => a.symbol),
      },
    });
  }

  // === 2. Honeypot Analysis ===
  for (const [token, result] of inputs.honeypotResults.entries()) {
    if (result.isHoneypot) {
      score -= 60;
      factors.push({
        category: 'Honeypot',
        impact: -60,
        severity: 'high',
        description: `Honeypot token detected: ${token.slice(0, 10)}...`,
        meta: {
          token,
          warnings: result.warnings,
        },
      });
    }

    // High taxes
    if (result.buyTax > 10 || result.sellTax > 10) {
      score -= 20;
      factors.push({
        category: 'Taxes',
        impact: -20,
        severity: 'medium',
        description: `High token taxes: ${result.buyTax}% buy, ${result.sellTax}% sell`,
        meta: {
          token,
          buyTax: result.buyTax,
          sellTax: result.sellTax,
        },
      });
    }
  }

  // === 3. Mixer Proximity ===
  if (inputs.mixerProximity.directInteractions > 0) {
    score -= 40;
    factors.push({
      category: 'Mixer',
      impact: -40,
      severity: 'high',
      description: `Direct mixer interactions: ${inputs.mixerProximity.directInteractions}`,
      meta: {
        direct: inputs.mixerProximity.directInteractions,
        lastInteraction: inputs.mixerProximity.lastInteraction,
      },
    });
  } else if (inputs.mixerProximity.oneHopInteractions > 0) {
    score -= 20;
    factors.push({
      category: 'Mixer',
      impact: -20,
      severity: 'medium',
      description: `Indirect mixer exposure: ${inputs.mixerProximity.oneHopInteractions} intermediary`,
      meta: {
        oneHop: inputs.mixerProximity.oneHopInteractions,
      },
    });
  }

  // === 4. Reputation ===
  if (inputs.reputation.level === 'bad') {
    score -= 50;
    factors.push({
      category: 'Reputation',
      impact: -50,
      severity: 'high',
      description: 'Negative reputation indicators found',
      meta: {
        reasons: inputs.reputation.reasons,
        labels: inputs.reputation.labels,
      },
    });
  } else if (inputs.reputation.level === 'caution') {
    score -= 15;
    factors.push({
      category: 'Reputation',
      impact: -15,
      severity: 'low',
      description: 'Limited reputation data',
      meta: {
        reasons: inputs.reputation.reasons,
      },
    });
  }

  // === 5. Contract Verification (if target is contract) ===
  if (inputs.contractVerified !== undefined) {
    if (!inputs.contractVerified) {
      score -= 25;
      factors.push({
        category: 'Contract',
        impact: -25,
        severity: 'high',
        description: 'Contract not verified on block explorer',
      });
    } else {
      // Bonus for verification
      score += 5;
      factors.push({
        category: 'Contract',
        impact: 5,
        severity: 'low',
        description: 'Contract verified',
      });
    }
  }

  // === 6. Contract/Wallet Age ===
  const ageToCheck = inputs.contractAge || inputs.walletAge;
  if (ageToCheck !== undefined && ageToCheck < 7) {
    score -= 15;
    factors.push({
      category: 'Age',
      impact: -15,
      severity: 'medium',
      description: `Recently created (${Math.floor(ageToCheck)} days old)`,
      meta: {
        ageDays: ageToCheck,
      },
    });
  }

  // === Bonuses ===
  // Add bonuses for good reputation
  if (inputs.reputation.level === 'good') {
    score += 10;
    factors.push({
      category: 'Reputation',
      impact: 10,
      severity: 'low',
      description: 'Positive reputation indicators',
      meta: {
        reasons: inputs.reputation.reasons,
      },
    });
  }

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Calculate grade
  const grade = gradeByScore(score);

  // Calculate totals
  const totals = {
    flags: factors.filter((f) => f.impact < 0).length,
    critical: factors.filter((f) => f.severity === 'high' && f.impact < 0)
      .length,
  };

  return {
    score,
    grade,
    factors,
    totals,
  };
}

/**
 * Convert score to letter grade
 */
export function gradeByScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Get color for score
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
}

/**
 * Get background color for score
 */
export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

/**
 * Get status tone from score
 */
export function getStatusTone(
  score: number
): 'trusted' | 'warning' | 'danger' {
  if (score >= 80) return 'trusted';
  if (score >= 60) return 'warning';
  return 'danger';
}

/**
 * Get plain English summary
 */
export function getSummary(result: TrustScoreResult): string {
  if (result.totals.critical > 0) {
    return `⚠️ ${result.totals.critical} critical issue${
      result.totals.critical > 1 ? 's' : ''
    } detected. Review carefully before proceeding.`;
  }

  if (result.totals.flags > 0) {
    return `${result.totals.flags} potential risk${
      result.totals.flags > 1 ? 's' : ''
    } identified. Exercise caution.`;
  }

  return '✅ No significant risks detected. This address appears safe.';
}

