/**
 * Freshness Derivation (Locked)
 * 
 * Computes freshness based on timestamps and expiration.
 * 
 * Precedence:
 * 1. expiring if expires_at is within 72h
 * 2. else new if event_time > last_opened_at
 * 3. else updated if (updated_at exists) AND (updated_at > last_opened_at) AND (updated_at != created_at)
 * 4. else stable
 * 
 * Requirements: Freshness Derivation (Locked)
 */

import { ActionFreshness, URGENCY_THRESHOLDS } from '../types';

/**
 * Derives the freshness status for an action.
 * 
 * @param params - Parameters for freshness computation
 * @param params.expiresAt - Expiration timestamp (ISO8601) or null
 * @param params.eventTime - Event timestamp (ISO8601)
 * @param params.createdAt - Creation timestamp (ISO8601)
 * @param params.updatedAt - Update timestamp (ISO8601) or null
 * @param params.lastOpenedAt - User's last opened timestamp (ISO8601) or null
 * @param now - Current timestamp (defaults to Date.now())
 * @returns Freshness status
 */
export function deriveFreshness(params: {
  expiresAt: string | null;
  eventTime: string;
  createdAt: string;
  updatedAt: string | null;
  lastOpenedAt: string | null;
}, now: number = Date.now()): ActionFreshness {
  const { expiresAt, eventTime, createdAt, updatedAt, lastOpenedAt } = params;
  
  // 1. Check if expiring (within 72h)
  if (expiresAt) {
    const expiresAtMs = new Date(expiresAt).getTime();
    if (!isNaN(expiresAtMs)) {
      const timeRemainingMs = expiresAtMs - now;
      if (timeRemainingMs > 0 && timeRemainingMs < URGENCY_THRESHOLDS.URGENT_72H_MS) {
        return 'expiring';
      }
    }
  }
  
  // If no last_opened_at, treat as now - 24h (per Requirement 11.5)
  const effectiveLastOpenedAt = lastOpenedAt 
    ? new Date(lastOpenedAt).getTime()
    : now - (24 * 60 * 60 * 1000);
  
  // 2. Check if new (event_time > last_opened_at)
  const eventTimeMs = new Date(eventTime).getTime();
  if (!isNaN(eventTimeMs) && eventTimeMs > effectiveLastOpenedAt) {
    return 'new';
  }
  
  // 3. Check if updated (updated_at > last_opened_at AND updated_at != created_at)
  if (updatedAt) {
    const updatedAtMs = new Date(updatedAt).getTime();
    const createdAtMs = new Date(createdAt).getTime();
    
    if (!isNaN(updatedAtMs) && !isNaN(createdAtMs)) {
      // Check if updated_at differs from created_at (actual update, not just creation)
      const isActualUpdate = Math.abs(updatedAtMs - createdAtMs) > 1000; // 1 second tolerance
      
      if (isActualUpdate && updatedAtMs > effectiveLastOpenedAt) {
        return 'updated';
      }
    }
  }
  
  // 4. Default to stable
  return 'stable';
}

/**
 * Checks if an item is new since the user's last open.
 * 
 * @param eventTime - Event timestamp (ISO8601)
 * @param lastOpenedAt - User's last opened timestamp (ISO8601) or null
 * @param now - Current timestamp (defaults to Date.now())
 * @returns true if the item is new
 */
export function isNewSinceLast(
  eventTime: string,
  lastOpenedAt: string | null,
  now: number = Date.now()
): boolean {
  // If no last_opened_at, treat as now - 24h
  const effectiveLastOpenedAt = lastOpenedAt 
    ? new Date(lastOpenedAt).getTime()
    : now - (24 * 60 * 60 * 1000);
  
  const eventTimeMs = new Date(eventTime).getTime();
  
  if (isNaN(eventTimeMs)) {
    return false;
  }
  
  return eventTimeMs > effectiveLastOpenedAt;
}
