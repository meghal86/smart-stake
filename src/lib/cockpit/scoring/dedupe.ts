/**
 * Duplicate Detection (Locked)
 * 
 * Handles duplicate detection for actions shown in Action Preview.
 * 
 * Rules:
 * - dedupe_key = source.kind + ":" + source.ref_id + ":" + cta.kind
 * - If same dedupe_key was shown in Action_Preview within last 2 hours → apply -30 penalty
 * - shown_actions is per-user, stores (dedupe_key, shown_at)
 * - Entries expire after 2 hours
 * 
 * Requirements: Duplicate Detection (Locked)
 */

import { ActionDraft, ActionSource, CTAKind, SCORING_WEIGHTS } from '../types';

/**
 * Generates a dedupe key for an action.
 * 
 * Format: source.kind:source.ref_id:cta.kind
 * 
 * @param source - Action source
 * @param ctaKind - CTA kind
 * @returns Dedupe key string
 */
export function generateDedupeKey(source: ActionSource, ctaKind: CTAKind): string {
  return `${source.kind}:${source.ref_id}:${ctaKind}`;
}

/**
 * Generates a dedupe key from an ActionDraft.
 * 
 * @param action - The action draft
 * @returns Dedupe key string
 */
export function getDedupeKeyFromAction(action: ActionDraft): string {
  return generateDedupeKey(action.source, action.cta.kind);
}

/**
 * Checks if an action was recently shown (within 2 hours).
 * 
 * @param dedupeKey - The dedupe key to check
 * @param recentlyShownKeys - Set of recently shown dedupe keys
 * @returns true if the action was recently shown
 */
export function wasRecentlyShown(
  dedupeKey: string,
  recentlyShownKeys: Set<string>
): boolean {
  return recentlyShownKeys.has(dedupeKey);
}

/**
 * Calculates the duplicate penalty for an action.
 * 
 * @param action - The action draft
 * @param recentlyShownKeys - Set of recently shown dedupe keys
 * @returns Penalty value (negative number or 0)
 */
export function calculateDuplicatePenalty(
  action: ActionDraft,
  recentlyShownKeys: Set<string>
): number {
  const dedupeKey = getDedupeKeyFromAction(action);
  
  if (wasRecentlyShown(dedupeKey, recentlyShownKeys)) {
    return SCORING_WEIGHTS.duplicate_penalty;
  }
  
  return 0;
}

/**
 * Filters out duplicate actions from a list.
 * 
 * Note: This doesn't remove duplicates, but marks them for penalty.
 * The actual penalty is applied during scoring.
 * 
 * @param actions - Array of action drafts
 * @param recentlyShownKeys - Set of recently shown dedupe keys
 * @returns Array of actions with duplicate info
 */
export function markDuplicates(
  actions: ActionDraft[],
  recentlyShownKeys: Set<string>
): Array<{ action: ActionDraft; isDuplicate: boolean; dedupeKey: string }> {
  return actions.map(action => {
    const dedupeKey = getDedupeKeyFromAction(action);
    const isDuplicate = wasRecentlyShown(dedupeKey, recentlyShownKeys);
    return { action, isDuplicate, dedupeKey };
  });
}

/**
 * TTL for shown actions in milliseconds (2 hours)
 */
export const SHOWN_ACTIONS_TTL_MS = 2 * 60 * 60 * 1000;

/**
 * Checks if a shown_at timestamp is still within the TTL window.
 * 
 * @param shownAt - ISO8601 timestamp when the action was shown
 * @param now - Current timestamp (defaults to Date.now())
 * @returns true if the shown_at is within the TTL window
 */
export function isWithinTTL(shownAt: string, now: number = Date.now()): boolean {
  const shownAtMs = new Date(shownAt).getTime();
  
  if (isNaN(shownAtMs)) {
    return false;
  }
  
  return (now - shownAtMs) < SHOWN_ACTIONS_TTL_MS;
}
