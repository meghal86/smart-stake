/**
 * Address reputation checking
 */
import { getLabels } from '../api/etherscan';

export interface ReputationResult {
  level: 'good' | 'neutral' | 'caution' | 'bad';
  score: number; // 0-100, higher is better
  reasons: string[];
  labels: string[];
}

// Known good labels
const GOOD_LABELS = [
  'exchange',
  'verified',
  'audit',
  'multisig',
  'timelock',
  'dao',
  'defi',
  'official',
];

// Known bad labels
const BAD_LABELS = [
  'phishing',
  'scam',
  'hack',
  'exploit',
  'malicious',
  'fake',
  'suspicious',
  'blacklist',
  'sanction',
];

/**
 * Analyze labels and return reputation
 */
function analyzeLabels(labels: string[]): {
  goodCount: number;
  badCount: number;
  matchedGood: string[];
  matchedBad: string[];
} {
  const lowerLabels = labels.map((l) => l.toLowerCase());
  const matchedGood: string[] = [];
  const matchedBad: string[] = [];

  for (const label of lowerLabels) {
    for (const good of GOOD_LABELS) {
      if (label.includes(good)) {
        matchedGood.push(label);
        break;
      }
    }

    for (const bad of BAD_LABELS) {
      if (label.includes(bad)) {
        matchedBad.push(label);
        break;
      }
    }
  }

  return {
    goodCount: matchedGood.length,
    badCount: matchedBad.length,
    matchedGood,
    matchedBad,
  };
}

/**
 * Calculate reputation score
 */
function calculateReputationScore(
  goodCount: number,
  badCount: number,
  hasLabels: boolean
): number {
  let score = 50; // Neutral starting point

  // Good labels increase score
  score += goodCount * 15;

  // Bad labels severely decrease score
  score -= badCount * 40;

  // Having no labels at all is slightly negative (unknown)
  if (!hasLabels) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Get reputation level from score
 */
function getReputationLevel(
  score: number,
  badCount: number
): ReputationResult['level'] {
  if (badCount > 0) return 'bad';
  if (score >= 70) return 'good';
  if (score >= 45) return 'neutral';
  return 'caution';
}

/**
 * Check address reputation
 */
export async function checkReputation(
  address: string,
  chain = 'ethereum'
): Promise<ReputationResult> {
  const reputationSource = import.meta.env.VITE_REPUTATION_SOURCE || 'none';

  if (reputationSource === 'none') {
    return {
      level: 'neutral',
      score: 50,
      reasons: ['Reputation checking disabled'],
      labels: [],
    };
  }

  try {
    // Get labels from Etherscan
    const labels = await getLabels(address, chain);

    if (labels.length === 0) {
      return {
        level: 'neutral',
        score: 45,
        reasons: ['No reputation data available'],
        labels: [],
      };
    }

    // Analyze labels
    const analysis = analyzeLabels(labels);
    const score = calculateReputationScore(
      analysis.goodCount,
      analysis.badCount,
      labels.length > 0
    );
    const level = getReputationLevel(score, analysis.badCount);

    // Build reasons
    const reasons: string[] = [];

    if (analysis.matchedGood.length > 0) {
      reasons.push(`Positive indicators: ${analysis.matchedGood.join(', ')}`);
    }

    if (analysis.matchedBad.length > 0) {
      reasons.push(`Warning flags: ${analysis.matchedBad.join(', ')}`);
    }

    if (analysis.goodCount === 0 && analysis.badCount === 0) {
      reasons.push('No significant reputation indicators found');
    }

    return {
      level,
      score,
      reasons,
      labels,
    };
  } catch (error) {
    console.error('Error checking reputation:', error);
    return {
      level: 'neutral',
      score: 50,
      reasons: ['Failed to check reputation'],
      labels: [],
    };
  }
}

/**
 * Check for sanctions (OFAC, etc.)
 * This is a placeholder - real implementation would use Chainalysis/TRM/etc.
 */
export async function checkSanctions(
  address: string
): Promise<{
  isSanctioned: boolean;
  source?: string;
  details?: string;
}> {
  // Placeholder implementation
  // In production, integrate with Chainalysis Sanctions API, TRM Labs, etc.

  return {
    isSanctioned: false,
  };
}

/**
 * Format reputation for display
 */
export function formatReputation(result: ReputationResult): {
  badge: string;
  color: string;
  description: string;
} {
  switch (result.level) {
    case 'good':
      return {
        badge: 'Good',
        color: 'text-green-500',
        description: 'Address has positive reputation indicators',
      };
    case 'neutral':
      return {
        badge: 'OK',
        color: 'text-slate-500',
        description: 'No significant reputation data',
      };
    case 'caution':
      return {
        badge: 'Caution',
        color: 'text-yellow-500',
        description: 'Limited reputation data, proceed with caution',
      };
    case 'bad':
      return {
        badge: 'Warning',
        color: 'text-red-500',
        description: 'Address has negative reputation indicators',
      };
  }
}

