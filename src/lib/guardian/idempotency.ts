/**
 * Idempotency Key Management
 * Prevents duplicate transaction submissions
 */

/**
 * Generate a deterministic idempotency key for a revoke operation
 */
export function generateIdempotencyKey(
  userAddress: string,
  tokenAddress: string,
  spenderAddress: string,
  timestamp?: number
): string {
  const ts = timestamp || Date.now();
  const key = `revoke_${userAddress}_${tokenAddress}_${spenderAddress}_${ts}`;
  return key.toLowerCase();
}

/**
 * Check if an idempotency key was recently used (client-side)
 */
const recentKeys = new Map<string, number>();
const KEY_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export function isKeyRecentlyUsed(key: string): boolean {
  const usedAt = recentKeys.get(key);
  if (!usedAt) return false;
  
  const now = Date.now();
  if (now - usedAt > KEY_EXPIRY_MS) {
    recentKeys.delete(key);
    return false;
  }
  
  return true;
}

export function markKeyAsUsed(key: string): void {
  recentKeys.set(key, Date.now());
  
  // Clean up old keys periodically
  if (recentKeys.size > 100) {
    const now = Date.now();
    for (const [k, usedAt] of recentKeys.entries()) {
      if (now - usedAt > KEY_EXPIRY_MS) {
        recentKeys.delete(k);
      }
    }
  }
}

/**
 * Parse an idempotency key to extract metadata
 */
export function parseIdempotencyKey(key: string): {
  type: string;
  userAddress: string;
  tokenAddress: string;
  spenderAddress: string;
  timestamp: number;
} | null {
  const parts = key.split('_');
  if (parts.length !== 5 || parts[0] !== 'revoke') {
    return null;
  }
  
  return {
    type: parts[0],
    userAddress: parts[1],
    tokenAddress: parts[2],
    spenderAddress: parts[3],
    timestamp: parseInt(parts[4], 10),
  };
}



