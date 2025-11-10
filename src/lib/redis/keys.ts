/**
 * Redis key namespace functions for Hunter Screen
 * Provides consistent key naming to avoid cross-environment collisions
 * 
 * Requirements: 8.7, 8.8, 8.9
 */

export const RedisKeys = {
  /**
   * Guardian scan cache key
   * @param opportunityId - The opportunity UUID
   * @returns Redis key for guardian scan data
   */
  guardianScan: (opportunityId: string): string => 
    `guardian:scan:${opportunityId}`,

  /**
   * Eligibility cache key
   * @param opportunityId - The opportunity UUID
   * @param walletHash - Hashed wallet address
   * @returns Redis key for eligibility data
   */
  eligibility: (opportunityId: string, walletHash: string): string => 
    `elig:op:${opportunityId}:wa:${walletHash}`,

  /**
   * Wallet signals cache key
   * @param wallet - Wallet address
   * @param day - Day identifier (YYYY-MM-DD)
   * @returns Redis key for wallet signals
   */
  walletSignals: (wallet: string, day: string): string => 
    `wallet:signals:${wallet}:${day}`,

  /**
   * Trending opportunities cache key
   * @returns Redis key for trending feed
   */
  trending: (): string => 
    `feed:trending`,

  /**
   * User preferences cache key
   * @param userId - User UUID
   * @returns Redis key for user preferences
   */
  userPrefs: (userId: string): string => 
    `user:prefs:${userId}`,

  /**
   * Feed page cache key
   * @param filterHash - Hash of filter parameters
   * @param cursor - Pagination cursor
   * @returns Redis key for cached feed page
   */
  feedPage: (filterHash: string, cursor: string = 'first'): string => 
    `feed:page:${filterHash}:${cursor}`,

  /**
   * Opportunity detail cache key
   * @param slug - Opportunity slug
   * @returns Redis key for opportunity details
   */
  opportunityDetail: (slug: string): string => 
    `opp:detail:${slug}`,

  /**
   * Rate limit key
   * @param identifier - IP address or user ID
   * @param endpoint - API endpoint
   * @returns Redis key for rate limiting
   */
  rateLimit: (identifier: string, endpoint: string): string => 
    `ratelimit:${endpoint}:${identifier}`,

  /**
   * Lock key for distributed operations
   * @param resource - Resource identifier
   * @returns Redis key for distributed lock
   */
  lock: (resource: string): string => 
    `lock:${resource}`,

  /**
   * Session-specific cache key
   * @param sessionId - Session identifier
   * @param key - Cache key
   * @returns Redis key for session cache
   */
  session: (sessionId: string, key: string): string => 
    `session:${sessionId}:${key}`,
} as const;

/**
 * Key pattern matchers for bulk operations
 */
export const RedisKeyPatterns = {
  allGuardianScans: 'guardian:scan:*',
  allEligibility: 'elig:op:*',
  allWalletSignals: 'wallet:signals:*',
  allFeedPages: 'feed:page:*',
  allOpportunityDetails: 'opp:detail:*',
  allUserPrefs: 'user:prefs:*',
  allRateLimits: 'ratelimit:*',
  allLocks: 'lock:*',
  allSessions: 'session:*',
} as const;

/**
 * TTL constants (in seconds)
 */
export const RedisTTL = {
  guardianScan: 3600, // 1 hour
  eligibility: 3600, // 1 hour
  walletSignals: 1200, // 20 minutes
  trending: 600, // 10 minutes
  userPrefs: 1800, // 30 minutes
  feedPage: 300, // 5 minutes
  opportunityDetail: 600, // 10 minutes
  session: 86400, // 24 hours
} as const;
