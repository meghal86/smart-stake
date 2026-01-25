/**
 * Ranking Engine
 * 
 * Scores opportunities based on relevance, trust, and freshness.
 * Requirements: 6.1-6.13
 */

import type { Opportunity } from './types';
import type { WalletSignals } from './wallet-signals';
import type { EligibilityResult } from './eligibility-engine';

/**
 * Ranking scores interface
 */
export interface RankingScores {
  overall: number; // 0-1
  relevance: number; // 0-1
  freshness: number; // 0-1
}

/**
 * User history interface for relevance scoring
 */
export interface UserHistory {
  saved_tags?: string[];
  most_completed_type?: string;
  completed_count?: number;
}

/**
 * Clamp a value between 0 and 1
 */
function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Calculate relevance score
 * Requirements: 6.2-6.7
 * 
 * Relevance components:
 * - +0.4 if opportunity chains intersect with wallet active chains
 * - +0.2 if eligibility status is "likely"
 * - +0.1 if eligibility status is "maybe"
 * - +0.1 if opportunity tags intersect with user saved tags
 * - +0.2 if opportunity type matches user's most completed type
 * 
 * @param opportunity - The opportunity to score
 * @param eligibility - Eligibility result for this opportunity
 * @param walletSignals - Wallet characteristics
 * @param userHistory - User's historical behavior
 * @returns Relevance score clamped to [0, 1]
 */
function calculateRelevance(
  opportunity: Opportunity,
  eligibility: EligibilityResult,
  walletSignals: WalletSignals,
  userHistory: UserHistory
): number {
  let relevance = 0.0;

  // Requirement 6.2: +0.4 if opportunity chains intersect with wallet active chains
  if (opportunity.chains && walletSignals.chains_active) {
    const hasChainMatch = opportunity.chains.some(chain =>
      walletSignals.chains_active.includes(chain.toLowerCase())
    );
    if (hasChainMatch) {
      relevance += 0.4;
    }
  }

  // Requirement 6.3: +0.2 if eligibility status is "likely"
  if (eligibility.status === 'likely') {
    relevance += 0.2;
  }

  // Requirement 6.4: +0.1 if eligibility status is "maybe"
  if (eligibility.status === 'maybe') {
    relevance += 0.1;
  }

  // Requirement 6.5: +0.1 if opportunity tags intersect with user saved tags
  if (opportunity.tags && userHistory.saved_tags && userHistory.saved_tags.length > 0) {
    const hasTagMatch = opportunity.tags.some(tag =>
      userHistory.saved_tags!.includes(tag)
    );
    if (hasTagMatch) {
      relevance += 0.1;
    }
  }

  // Requirement 6.6: +0.2 if opportunity type matches user's most completed type
  if (userHistory.most_completed_type && opportunity.type === userHistory.most_completed_type) {
    relevance += 0.2;
  }

  // Requirement 6.7: Clamp relevance to [0, 1]
  return clamp(relevance);
}

/**
 * Calculate freshness score
 * Requirements: 6.8-6.11
 * 
 * Freshness components:
 * - Urgency boost: max(0, 1 - hours_to_end / 168) for opportunities with end_date
 * - Recency: max(0, 1 - days_since_created / 30) for all opportunities
 * - Freshness: max(urgency, recency)
 * 
 * @param opportunity - The opportunity to score
 * @returns Freshness score clamped to [0, 1]
 */
function calculateFreshness(opportunity: Opportunity): number {
  const now = new Date();
  let urgency = 0;
  let recency = 0;

  // Requirement 6.8: Calculate urgency boost for opportunities with end_date
  if (opportunity.end_date) {
    const endDate = new Date(opportunity.end_date);
    const hoursToEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // urgency = max(0, 1 - hours_to_end / 168)
    // 168 hours = 7 days
    urgency = Math.max(0, 1 - hoursToEnd / 168);
  }

  // Requirement 6.9: Calculate recency for all opportunities
  const createdAt = new Date(opportunity.created_at);
  const daysSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  
  // recency = max(0, 1 - days_since_created / 30)
  // 30 days window
  recency = Math.max(0, 1 - daysSinceCreated / 30);

  // Requirement 6.10: Freshness is max of urgency and recency
  const freshness = Math.max(urgency, recency);

  // Requirement 6.11: Clamp freshness to [0, 1]
  return clamp(freshness);
}

/**
 * Calculate overall ranking score
 * Requirements: 6.1, 6.12, 6.13
 * 
 * Overall score formula:
 * overall = 0.60 × relevance + 0.25 × (trust_score / 100) + 0.15 × freshness
 * 
 * @param opportunity - The opportunity to score
 * @param eligibility - Eligibility result for this opportunity
 * @param walletSignals - Wallet characteristics
 * @param userHistory - User's historical behavior
 * @returns RankingScores with overall, relevance, and freshness
 */
export function calculateRanking(
  opportunity: Opportunity,
  eligibility: EligibilityResult,
  walletSignals: WalletSignals,
  userHistory: UserHistory = {}
): RankingScores {
  // Calculate component scores
  const relevance = calculateRelevance(opportunity, eligibility, walletSignals, userHistory);
  const freshness = calculateFreshness(opportunity);
  
  // Normalize trust score to [0, 1]
  const trust = opportunity.trust_score / 100;

  // Requirement 6.1: Calculate overall score with weights
  // 0.60 × relevance + 0.25 × trust + 0.15 × freshness
  const overall = 0.60 * relevance + 0.25 * trust + 0.15 * freshness;

  // Requirement 6.12: Clamp overall score to [0, 1]
  const clampedOverall = clamp(overall);

  // Requirement 6.13: Return ranking object with all scores
  return {
    overall: clampedOverall,
    relevance,
    freshness,
  };
}

/**
 * Batch calculate rankings for multiple opportunities
 * 
 * @param opportunities - Array of opportunities to rank
 * @param eligibilityResults - Array of eligibility results (same order as opportunities)
 * @param walletSignals - Wallet characteristics
 * @param userHistory - User's historical behavior
 * @returns Array of RankingScores in same order as input
 */
export function batchCalculateRanking(
  opportunities: Opportunity[],
  eligibilityResults: EligibilityResult[],
  walletSignals: WalletSignals,
  userHistory: UserHistory = {}
): RankingScores[] {
  if (opportunities.length !== eligibilityResults.length) {
    throw new Error('Opportunities and eligibility results arrays must have same length');
  }

  return opportunities.map((opp, index) =>
    calculateRanking(opp, eligibilityResults[index], walletSignals, userHistory)
  );
}

/**
 * Calculate recency boost for preselection
 * Used in cost control to preselect candidates before eligibility computation
 * 
 * @param createdAt - ISO timestamp of opportunity creation
 * @param now - Current timestamp (for testing)
 * @returns Recency boost score [0, 1]
 */
export function calculateRecencyBoost(createdAt: string, now: number = Date.now()): number {
  const createdAtTime = new Date(createdAt).getTime();
  const daysSinceCreated = (now - createdAtTime) / (1000 * 60 * 60 * 24);
  
  // Same formula as freshness recency component
  const recency = Math.max(0, 1 - daysSinceCreated / 30);
  
  return clamp(recency);
}

/**
 * Sort opportunities by ranking score (descending)
 * 
 * @param opportunities - Array of opportunities with ranking scores
 * @returns Sorted array (highest ranking first)
 */
export function sortByRanking<T extends { ranking: RankingScores }>(
  opportunities: T[]
): T[] {
  return [...opportunities].sort((a, b) => b.ranking.overall - a.ranking.overall);
}
