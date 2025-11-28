/**
 * Personalized Ranking Service
 * 
 * Adjusts opportunity ranking based on wallet history and preferences
 * 
 * Requirements: 3.1-3.6, 17.4, 18.4
 */

import { Opportunity, Chain, OpportunityType } from '@/types/hunter';
import { WalletHistory } from '@/lib/wallet-history';

/**
 * Relevance scoring weights for personalized ranking
 * 
 * Total: 60% relevance weight in overall ranking
 * Breakdown:
 * - Chain match: 40% of relevance (24% of total)
 * - Type match: 30% of relevance (18% of total)
 * - Completion history: 20% of relevance (12% of total)
 * - Save history: 10% of relevance (6% of total)
 */
const RELEVANCE_WEIGHTS = {
  chainMatch: 0.40,
  typeMatch: 0.30,
  completionHistory: 0.20,
  saveHistory: 0.10,
};

/**
 * Calculates personalized relevance score for an opportunity
 * 
 * This score is used as the 60% relevance component in the overall ranking formula:
 * rank_score = relevance(60%) + trust(25%) + freshness/urgency(15%)
 * 
 * @param opportunity - The opportunity to score
 * @param walletHistory - Wallet activity history
 * @returns Relevance score between 0 and 1
 * 
 * Requirements:
 * - 3.1: 60% relevance weight in ranking
 * - 3.2: Consider wallet chain history, completions, saves, preferred chains
 * - 17.4: Personalized ranking based on wallet history
 */
export function calculateRelevanceScore(
  opportunity: Opportunity,
  walletHistory: WalletHistory
): number {
  let score = 0;

  // Chain match score (40% of relevance)
  const chainScore = calculateChainMatchScore(opportunity.chains, walletHistory);
  score += chainScore * RELEVANCE_WEIGHTS.chainMatch;

  // Type match score (30% of relevance)
  const typeScore = calculateTypeMatchScore(opportunity.type, walletHistory);
  score += typeScore * RELEVANCE_WEIGHTS.typeMatch;

  // Completion history score (20% of relevance)
  const completionScore = calculateCompletionScore(opportunity.type, walletHistory);
  score += completionScore * RELEVANCE_WEIGHTS.completionHistory;

  // Save history score (10% of relevance)
  const saveScore = calculateSaveScore(opportunity.type, walletHistory);
  score += saveScore * RELEVANCE_WEIGHTS.saveHistory;

  return Math.min(1, Math.max(0, score));
}

/**
 * Calculates chain match score
 * 
 * Scores higher if opportunity chains match:
 * 1. Preferred chains (from user preferences)
 * 2. Chains from completed opportunities
 * 3. Chains from saved opportunities
 * 
 * @param oppChains - Opportunity chains
 * @param walletHistory - Wallet history
 * @returns Score between 0 and 1
 */
function calculateChainMatchScore(
  oppChains: Chain[],
  walletHistory: WalletHistory
): number {
  if (oppChains.length === 0) {
    return 0.5; // Neutral score for multi-chain or unspecified
  }

  // Check for preferred chains (highest weight)
  const preferredMatches = oppChains.filter(chain => 
    walletHistory.preferredChains.includes(chain)
  ).length;
  
  if (preferredMatches > 0) {
    return 1.0; // Perfect match with preferred chains
  }

  // Check for chains from wallet history
  const historyMatches = oppChains.filter(chain => 
    walletHistory.chains.includes(chain)
  ).length;

  if (historyMatches > 0) {
    // Partial match - score based on percentage of chains matched
    return 0.7 + (0.3 * (historyMatches / oppChains.length));
  }

  // No match - return low score but not zero (exploration)
  return 0.3;
}

/**
 * Calculates type match score
 * 
 * Scores higher if opportunity type matches:
 * 1. Types from completed opportunities
 * 2. Types from saved opportunities
 * 
 * @param oppType - Opportunity type
 * @param walletHistory - Wallet history
 * @returns Score between 0 and 1
 */
function calculateTypeMatchScore(
  oppType: OpportunityType,
  walletHistory: WalletHistory
): number {
  // Check completed types (higher weight)
  if (walletHistory.completedTypes.includes(oppType)) {
    return 1.0;
  }

  // Check saved types (medium weight)
  if (walletHistory.savedTypes.includes(oppType)) {
    return 0.7;
  }

  // No match - return neutral score for exploration
  return 0.5;
}

/**
 * Calculates completion history score
 * 
 * Scores based on user's completion activity:
 * - More completions = higher engagement = higher score
 * - Similar types completed = higher score
 * 
 * @param oppType - Opportunity type
 * @param walletHistory - Wallet history
 * @returns Score between 0 and 1
 */
function calculateCompletionScore(
  oppType: OpportunityType,
  walletHistory: WalletHistory
): number {
  const { completedCount, completedTypes } = walletHistory;

  // Base score from completion count (engagement level)
  // Normalize to 0-1 scale (cap at 20 completions for max score)
  const engagementScore = Math.min(1, completedCount / 20);

  // Bonus if this type has been completed before
  const typeBonus = completedTypes.includes(oppType) ? 0.3 : 0;

  return Math.min(1, engagementScore * 0.7 + typeBonus);
}

/**
 * Calculates save history score
 * 
 * Scores based on user's save activity:
 * - More saves = higher interest = higher score
 * - Similar types saved = higher score
 * 
 * @param oppType - Opportunity type
 * @param walletHistory - Wallet history
 * @returns Score between 0 and 1
 */
function calculateSaveScore(
  oppType: OpportunityType,
  walletHistory: WalletHistory
): number {
  const { savedCount, savedTypes } = walletHistory;

  // Base score from save count (interest level)
  // Normalize to 0-1 scale (cap at 10 saves for max score)
  const interestScore = Math.min(1, savedCount / 10);

  // Bonus if this type has been saved before
  const typeBonus = savedTypes.includes(oppType) ? 0.3 : 0;

  return Math.min(1, interestScore * 0.7 + typeBonus);
}

/**
 * Applies personalized ranking to a list of opportunities
 * 
 * This function:
 * 1. Calculates relevance score for each opportunity
 * 2. Adjusts the rank_score using the relevance component
 * 3. Maintains the overall ranking formula: relevance(60%) + trust(25%) + freshness(15%)
 * 
 * Note: The trust and freshness components are already computed in the materialized view.
 * We only need to adjust the relevance component based on wallet history.
 * 
 * @param opportunities - List of opportunities to rank
 * @param walletHistory - Wallet activity history
 * @returns Ranked opportunities with adjusted scores
 * 
 * Requirements:
 * - 3.1: Personalized ranking with 60% relevance, 25% trust, 15% freshness
 * - 3.2: Consider wallet history for relevance
 * - 17.4: Personalized ranking based on wallet
 */
export function applyPersonalizedRanking(
  opportunities: Opportunity[],
  walletHistory: WalletHistory
): Opportunity[] {
  // Calculate personalized relevance scores
  const scoredOpportunities = opportunities.map(opp => {
    const relevanceScore = calculateRelevanceScore(opp, walletHistory);
    
    // The materialized view provides a base rank_score
    // We need to adjust it by incorporating personalized relevance
    // 
    // Original formula (from view): rank_score = base_relevance(60%) + trust(25%) + freshness(15%)
    // Personalized formula: rank_score = personalized_relevance(60%) + trust(25%) + freshness(15%)
    //
    // To adjust, we extract the trust and freshness components and recombine with personalized relevance
    
    const trustScore = opp.trust.score / 100; // Normalize to 0-1
    const trustComponent = trustScore * 0.25; // 25% weight
    
    // Freshness/urgency component (15% weight)
    // Higher score for ending soon, new, or hot items
    let freshnessScore = 0.5; // Base freshness
    if (opp.urgency === 'ending_soon') {
      freshnessScore = 1.0;
    } else if (opp.urgency === 'new') {
      freshnessScore = 0.8;
    } else if (opp.urgency === 'hot') {
      freshnessScore = 0.9;
    }
    const freshnessComponent = freshnessScore * 0.15; // 15% weight
    
    // Combine components with personalized relevance
    const personalizedRankScore = 
      (relevanceScore * 0.60) + // Personalized relevance (60%)
      trustComponent +            // Trust (25%)
      freshnessComponent;         // Freshness/urgency (15%)
    
    return {
      ...opp,
      personalizedRankScore,
      relevanceScore, // Store for debugging
    };
  });

  // Sort by personalized rank score (descending)
  scoredOpportunities.sort((a, b) => {
    const scoreDiff = (b as unknown).personalizedRankScore - (a as unknown).personalizedRankScore;
    
    // If scores are equal, use secondary sort criteria
    if (Math.abs(scoreDiff) < 0.001) {
      // Secondary: trust score
      const trustDiff = b.trust.score - a.trust.score;
      if (Math.abs(trustDiff) > 0.1) {
        return trustDiff;
      }
      
      // Tertiary: expires_at (sooner first)
      if (a.expires_at && b.expires_at) {
        return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
      }
      
      // Final: id for stable sort
      return a.id.localeCompare(b.id);
    }
    
    return scoreDiff;
  });

  return scoredOpportunities;
}

/**
 * Gets default (non-personalized) ranking for cold start
 * 
 * When no wallet is connected, use global trending + high trust + easy opportunities
 * 
 * Requirements:
 * - 3.3: Cold start ranking without wallet
 */
export function getDefaultRankingBoost(opportunity: Opportunity): number {
  let boost = 0;

  // Boost high trust items
  if (opportunity.trust.level === 'green') {
    boost += 0.2;
  }

  // Boost easy difficulty
  if (opportunity.difficulty === 'easy') {
    boost += 0.15;
  }

  // Boost featured items
  if (opportunity.featured) {
    boost += 0.1;
  }

  // Boost trending (hot/new)
  if (opportunity.urgency === 'hot' || opportunity.urgency === 'new') {
    boost += 0.1;
  }

  return Math.min(0.5, boost); // Cap boost at 0.5
}
