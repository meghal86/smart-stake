/**
 * Urgency Score Computation (Locked)
 * 
 * Computes urgency_score based on expires_at timestamp.
 * 
 * Rules:
 * - expires_at null → 0
 * - <24h → 90-100 (90 + clamp based on closeness)
 * - <72h → 60-89
 * - else → 0
 * 
 * Requirements: 6.4, Ranking Pipeline (Locked)
 */

import { URGENCY_THRESHOLDS } from '../types';

/**
 * Computes the urgency score for an action based on its expiration time.
 * 
 * @param expiresAt - ISO8601 timestamp string or null
 * @param now - Current timestamp (defaults to Date.now())
 * @returns Urgency score between 0-100
 */
export function computeUrgencyScore(
  expiresAt: string | null,
  now: number = Date.now()
): number {
  // No expiration = no urgency
  if (!expiresAt) {
    return 0;
  }
  
  const expiresAtMs = new Date(expiresAt).getTime();
  
  // Invalid date
  if (isNaN(expiresAtMs)) {
    return 0;
  }
  
  const timeRemainingMs = expiresAtMs - now;
  
  // Already expired or negative time
  if (timeRemainingMs <= 0) {
    return URGENCY_THRESHOLDS.SCORE_24H_MAX; // Maximum urgency for expired items
  }
  
  // <24h: 90-100 (90 + clamp based on closeness)
  if (timeRemainingMs < URGENCY_THRESHOLDS.URGENT_24H_MS) {
    // Linear interpolation: closer to expiration = higher score
    // At 0ms remaining: 100
    // At 24h remaining: 90
    const ratio = 1 - (timeRemainingMs / URGENCY_THRESHOLDS.URGENT_24H_MS);
    const bonus = Math.round(ratio * (URGENCY_THRESHOLDS.SCORE_24H_MAX - URGENCY_THRESHOLDS.SCORE_24H_BASE));
    return URGENCY_THRESHOLDS.SCORE_24H_BASE + bonus;
  }
  
  // <72h: 60-89
  if (timeRemainingMs < URGENCY_THRESHOLDS.URGENT_72H_MS) {
    // Linear interpolation within 24h-72h range
    // At 24h remaining: 89
    // At 72h remaining: 60
    const timeIn72hWindow = timeRemainingMs - URGENCY_THRESHOLDS.URGENT_24H_MS;
    const windowSize = URGENCY_THRESHOLDS.URGENT_72H_MS - URGENCY_THRESHOLDS.URGENT_24H_MS;
    const ratio = 1 - (timeIn72hWindow / windowSize);
    const range = URGENCY_THRESHOLDS.SCORE_72H_MAX - URGENCY_THRESHOLDS.SCORE_72H_BASE;
    return URGENCY_THRESHOLDS.SCORE_72H_BASE + Math.round(ratio * range);
  }
  
  // >72h: no urgency
  return 0;
}

/**
 * Checks if an action is expiring soon (within 72h)
 * 
 * @param expiresAt - ISO8601 timestamp string or null
 * @param now - Current timestamp (defaults to Date.now())
 * @returns true if expiring within 72h
 */
export function isExpiringSoon(
  expiresAt: string | null,
  now: number = Date.now()
): boolean {
  if (!expiresAt) {
    return false;
  }
  
  const expiresAtMs = new Date(expiresAt).getTime();
  
  if (isNaN(expiresAtMs)) {
    return false;
  }
  
  const timeRemainingMs = expiresAtMs - now;
  return timeRemainingMs > 0 && timeRemainingMs < URGENCY_THRESHOLDS.URGENT_72H_MS;
}
