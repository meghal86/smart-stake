/**
 * Risk-Aware Cache Service
 * 
 * Implements severity-based TTL caching for portfolio data.
 * Requirements: 10.5, 10.6
 */

export type CacheSeverity = 'critical' | 'high' | 'medium' | 'low';
export type Severity = CacheSeverity; // Alias for backward compatibility

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  severity: CacheSeverity;
}

/**
 * Calculate cache TTL based on severity
 * Requirements: 10.5 - Severity-based TTL ranges
 */
export function calculateCacheTTL(severity: CacheSeverity): number {
  const ranges = {
    critical: [3, 10],
    high: [10, 30],
    medium: [30, 60],
    low: [60, 120],
  } as const;
  
  const [min, max] = ranges[severity];
  const jitter = Math.random() * (max - min);
  return Math.floor(min + jitter) * 1000; // Convert to milliseconds
}

export class RiskAwareCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private warmingQueue = new Map<string, Promise<any>>();

  /**
   * Get cached value if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Set cached value with severity-based TTL
   */
  set<T>(key: string, data: T, severity: CacheSeverity): void {
    const ttl = calculateCacheTTL(severity);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      severity
    });
  }

  /**
   * Invalidate cache entries matching pattern
   */
  invalidate(pattern: string): number {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }

  /**
   * Invalidate critical caches immediately
   * Requirements: 10.6 - Cache invalidation on new transactions
   */
  invalidateCritical(walletAddress: string): number {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (key.includes(walletAddress) && 
          (entry.severity === 'critical' || 
           key.includes('portfolio_snapshot') || 
           key.includes('approval_risks') || 
           key.includes('recommended_actions') || 
           key.includes('guardian_scan'))) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }

  /**
   * Warm cache for critical data
   * Requirements: 10.6 - Cache warming for critical data
   */
  async warmCache<T>(
    key: string, 
    dataFetcher: () => Promise<T>, 
    severity: CacheSeverity
  ): Promise<T> {
    // Check if already cached
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Check if already warming
    if (this.warmingQueue.has(key)) {
      return this.warmingQueue.get(key) as Promise<T>;
    }
    
    // Start warming
    const warmingPromise = dataFetcher().then(data => {
      this.set(key, data, severity);
      this.warmingQueue.delete(key);
      return data;
    }).catch(error => {
      this.warmingQueue.delete(key);
      throw error;
    });
    
    this.warmingQueue.set(key, warmingPromise);
    return warmingPromise;
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    entriesBySeverity: Record<CacheSeverity, number>;
    expiredEntries: number;
    memoryUsage: number;
  } {
    const now = Date.now();
    const stats = {
      totalEntries: this.cache.size,
      entriesBySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      } as Record<CacheSeverity, number>,
      expiredEntries: 0,
      memoryUsage: 0
    };

    for (const entry of this.cache.values()) {
      stats.entriesBySeverity[entry.severity]++;
      
      if (now - entry.timestamp > entry.ttl) {
        stats.expiredEntries++;
      }
      
      // Rough memory usage estimation
      stats.memoryUsage += JSON.stringify(entry.data).length;
    }

    return stats;
  }
}

export const riskAwareCache = new RiskAwareCacheService();