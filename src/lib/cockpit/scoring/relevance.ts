/**
 * Relevance Score Computation
 * 
 * Computes relevance_score (0-30) based on:
 * - Holdings match
 * - Wallet role
 * - Saved tags
 * 
 * Requirements: 6.6, Ranking Pipeline (Locked)
 */

import { ActionDraft, AdapterContext, RELEVANCE_SCORE } from '../types';

/**
 * Relevance scoring weights
 */
const RELEVANCE_WEIGHTS = {
  /** Item is saved/bookmarked by user */
  SAVED: 15,
  /** Item matches user's wallet role */
  WALLET_ROLE: 10,
  /** Item matches user's alert tags */
  ALERT_TAG: 5,
} as const;

/**
 * Computes the relevance score for an action based on user context.
 * 
 * @param action - The action draft
 * @param context - Adapter context with user preferences
 * @returns Relevance score between 0-30
 */
export function computeRelevanceScore(
  action: ActionDraft,
  context: AdapterContext
): number {
  let score = 0;
  
  // Check if item is saved
  if (context.saved_ref_ids.has(action.source.ref_id)) {
    score += RELEVANCE_WEIGHTS.SAVED;
  }
  
  // Check wallet role match (for actions with wallet context)
  // Extract wallet address from action if available
  const walletMatch = extractWalletFromAction(action);
  if (walletMatch && context.wallet_roles.has(walletMatch)) {
    score += RELEVANCE_WEIGHTS.WALLET_ROLE;
  }
  
  // Check alert tag match
  // Extract tags from action title/source
  const actionTags = extractTagsFromAction(action);
  for (const tag of actionTags) {
    if (context.alert_tags.has(tag.toLowerCase())) {
      score += RELEVANCE_WEIGHTS.ALERT_TAG;
      break; // Only count once
    }
  }
  
  // Clamp to valid range
  return Math.min(Math.max(score, RELEVANCE_SCORE.MIN), RELEVANCE_SCORE.MAX);
}

/**
 * Extracts wallet address from an action if available.
 * 
 * @param action - The action draft
 * @returns Wallet address or null
 */
function extractWalletFromAction(action: ActionDraft): string | null {
  // Check href for wallet parameter
  const hrefMatch = action.cta.href.match(/wallet=([0-9a-fA-Fx]+)/);
  if (hrefMatch) {
    return hrefMatch[1].toLowerCase();
  }
  
  // Check ref_id for wallet-like patterns
  const refIdMatch = action.source.ref_id.match(/0x[0-9a-fA-F]{40}/);
  if (refIdMatch) {
    return refIdMatch[0].toLowerCase();
  }
  
  return null;
}

/**
 * Extracts relevant tags from an action for alert matching.
 * 
 * @param action - The action draft
 * @returns Array of tags
 */
function extractTagsFromAction(action: ActionDraft): string[] {
  const tags: string[] = [];
  
  // Add source kind as a tag
  tags.push(action.source.kind);
  
  // Add lane as a tag
  tags.push(action.lane.toLowerCase());
  
  // Extract keywords from title
  const titleWords = action.title.toLowerCase().split(/\s+/);
  const relevantKeywords = [
    'approval', 'revoke', 'airdrop', 'quest', 'staking', 'yield',
    'risk', 'security', 'balance', 'price', 'token', 'nft',
  ];
  
  for (const word of titleWords) {
    if (relevantKeywords.includes(word)) {
      tags.push(word);
    }
  }
  
  return tags;
}

/**
 * Creates an empty adapter context for testing or default scenarios.
 * 
 * @returns Empty adapter context
 */
export function createEmptyContext(): AdapterContext {
  return {
    last_opened_at: null,
    degraded_mode: false,
    saved_ref_ids: new Set(),
    wallet_roles: new Map(),
    alert_tags: new Set(),
  };
}
