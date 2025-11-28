/**
 * Sync Scheduler with Exponential Backoff and Circuit Breaker
 * 
 * Implements per-source rate limits, exponential backoff with jitter,
 * circuit breaker pattern, and observability for external API syncs.
 * 
 * Requirements: 12.1-12.8
 */

export type SyncSource = 
  | 'airdrops'
  | 'airdrops_upcoming'
  | 'quests'
  | 'yield'
  | 'points'
  | 'sponsored'
  | 'community';

export interface SyncConfig {
  source: SyncSource;
  endpoint: string;
  intervalMs: number;
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
  backoff: {
    initialDelayMs: number;
    maxDelayMs: number;
    multiplier: number;
    jitterFactor: number;
  };
  circuitBreaker: {
    failureThreshold: number;
    resetTimeoutMs: number;
    halfOpenMaxAttempts: number;
  };
  timeout: number;
}

export interface SyncResult {
  source: SyncSource;
  success: boolean;
  itemsProcessed?: number;
  error?: string;
  duration: number;
  timestamp: string;
  retryCount: number;
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
  halfOpenAttempts: number;
}

export interface RateLimitState {
  requests: number[];
  lastReset: number;
}

/**
 * Default sync configurations per source
 * Based on Requirements 12.1-12.5
 */
export const DEFAULT_SYNC_CONFIGS: Record<SyncSource, SyncConfig> = {
  airdrops: {
    source: 'airdrops',
    endpoint: '/api/sync/airdrops',
    intervalMs: 60 * 60 * 1000, // 1 hour
    rateLimit: {
      maxRequests: 60,
      windowMs: 60 * 60 * 1000, // 60 requests per hour
    },
    backoff: {
      initialDelayMs: 1000,
      maxDelayMs: 60000,
      multiplier: 2,
      jitterFactor: 0.1,
    },
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeoutMs: 5 * 60 * 1000, // 5 minutes
      halfOpenMaxAttempts: 3,
    },
    timeout: 30000,
  },
  airdrops_upcoming: {
    source: 'airdrops_upcoming',
    endpoint: '/api/sync/airdrops_upcoming',
    intervalMs: 4 * 60 * 60 * 1000, // 4 hours
    rateLimit: {
      maxRequests: 15,
      windowMs: 60 * 60 * 1000, // 15 requests per hour
    },
    backoff: {
      initialDelayMs: 1000,
      maxDelayMs: 60000,
      multiplier: 2,
      jitterFactor: 0.1,
    },
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeoutMs: 5 * 60 * 1000,
      halfOpenMaxAttempts: 3,
    },
    timeout: 30000,
  },
  quests: {
    source: 'quests',
    endpoint: '/api/sync/quests',
    intervalMs: 60 * 60 * 1000, // 1 hour
    rateLimit: {
      maxRequests: 60,
      windowMs: 60 * 60 * 1000,
    },
    backoff: {
      initialDelayMs: 1000,
      maxDelayMs: 60000,
      multiplier: 2,
      jitterFactor: 0.1,
    },
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeoutMs: 5 * 60 * 1000,
      halfOpenMaxAttempts: 3,
    },
    timeout: 30000,
  },
  yield: {
    source: 'yield',
    endpoint: '/api/sync/yield',
    intervalMs: 2 * 60 * 60 * 1000, // 2 hours
    rateLimit: {
      maxRequests: 30,
      windowMs: 60 * 60 * 1000,
    },
    backoff: {
      initialDelayMs: 1000,
      maxDelayMs: 60000,
      multiplier: 2,
      jitterFactor: 0.1,
    },
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeoutMs: 5 * 60 * 1000,
      halfOpenMaxAttempts: 3,
    },
    timeout: 30000,
  },
  points: {
    source: 'points',
    endpoint: '/api/sync/points',
    intervalMs: 24 * 60 * 60 * 1000, // 24 hours
    rateLimit: {
      maxRequests: 10,
      windowMs: 60 * 60 * 1000,
    },
    backoff: {
      initialDelayMs: 1000,
      maxDelayMs: 60000,
      multiplier: 2,
      jitterFactor: 0.1,
    },
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeoutMs: 5 * 60 * 1000,
      halfOpenMaxAttempts: 3,
    },
    timeout: 30000,
  },
  sponsored: {
    source: 'sponsored',
    endpoint: '/api/sync/sponsored',
    intervalMs: 5 * 60 * 1000, // 5 minutes (real-time)
    rateLimit: {
      maxRequests: 120,
      windowMs: 60 * 60 * 1000,
    },
    backoff: {
      initialDelayMs: 500,
      maxDelayMs: 30000,
      multiplier: 2,
      jitterFactor: 0.1,
    },
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeoutMs: 2 * 60 * 1000, // 2 minutes
      halfOpenMaxAttempts: 3,
    },
    timeout: 15000,
  },
  community: {
    source: 'community',
    endpoint: '/api/sync/community',
    intervalMs: 60 * 60 * 1000, // 1 hour
    rateLimit: {
      maxRequests: 30,
      windowMs: 60 * 60 * 1000,
    },
    backoff: {
      initialDelayMs: 1000,
      maxDelayMs: 60000,
      multiplier: 2,
      jitterFactor: 0.1,
    },
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeoutMs: 5 * 60 * 1000,
      halfOpenMaxAttempts: 3,
    },
    timeout: 30000,
  },
};

/**
 * Sync Scheduler with Circuit Breaker and Rate Limiting
 */
export class SyncScheduler {
  private configs: Map<SyncSource, SyncConfig>;
  private circuitBreakers: Map<SyncSource, CircuitBreakerState>;
  private rateLimiters: Map<SyncSource, RateLimitState>;
  private retryCounters: Map<SyncSource, number>;
  private timers: Map<SyncSource, NodeJS.Timeout>;
  private syncHandler: (source: SyncSource) => Promise<{ itemsProcessed: number }>;
  private onResult?: (result: SyncResult) => void;

  constructor(
    configs?: Partial<Record<SyncSource, SyncConfig>>,
    syncHandler?: (source: SyncSource) => Promise<{ itemsProcessed: number }>,
    onResult?: (result: SyncResult) => void
  ) {
    this.configs = new Map();
    this.circuitBreakers = new Map();
    this.rateLimiters = new Map();
    this.retryCounters = new Map();
    this.timers = new Map();
    this.onResult = onResult;

    // Initialize with default configs
    Object.entries(DEFAULT_SYNC_CONFIGS).forEach(([source, config]) => {
      this.configs.set(source as SyncSource, configs?.[source as SyncSource] || config);
      this.circuitBreakers.set(source as SyncSource, {
        state: 'closed',
        failureCount: 0,
        halfOpenAttempts: 0,
      });
      this.rateLimiters.set(source as SyncSource, {
        requests: [],
        lastReset: Date.now(),
      });
      this.retryCounters.set(source as SyncSource, 0);
    });

    // Default sync handler (can be overridden)
    this.syncHandler = syncHandler || this.defaultSyncHandler;
  }

  /**
   * Default sync handler - makes HTTP request to sync endpoint
   */
  private async defaultSyncHandler(source: SyncSource): Promise<{ itemsProcessed: number }> {
    const config = this.configs.get(source)!;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('RATE_LIMITED');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { itemsProcessed: data.itemsProcessed || 0 };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('TIMEOUT');
      }
      throw error;
    }
  }

  /**
   * Check if rate limit allows request
   */
  private checkRateLimit(source: SyncSource): boolean {
    const config = this.configs.get(source)!;
    const state = this.rateLimiters.get(source)!;
    const now = Date.now();

    // Remove requests outside the window
    state.requests = state.requests.filter(
      (timestamp) => now - timestamp < config.rateLimit.windowMs
    );

    // Check if under limit
    if (state.requests.length >= config.rateLimit.maxRequests) {
      return false;
    }

    // Record this request
    state.requests.push(now);
    return true;
  }

  /**
   * Calculate backoff delay with jitter
   */
  private calculateBackoff(source: SyncSource, retryCount: number): number {
    const config = this.configs.get(source)!;
    const { initialDelayMs, maxDelayMs, multiplier, jitterFactor } = config.backoff;

    // Exponential backoff
    const exponentialDelay = Math.min(
      initialDelayMs * Math.pow(multiplier, retryCount),
      maxDelayMs
    );

    // Add jitter to prevent thundering herd
    const jitter = exponentialDelay * jitterFactor * (Math.random() * 2 - 1);
    
    return Math.floor(exponentialDelay + jitter);
  }

  /**
   * Check circuit breaker state
   */
  private checkCircuitBreaker(source: SyncSource): { allowed: boolean; reason?: string } {
    const config = this.configs.get(source)!;
    const state = this.circuitBreakers.get(source)!;
    const now = Date.now();

    switch (state.state) {
      case 'closed':
        return { allowed: true };

      case 'open':
        // Check if enough time has passed to try half-open
        if (state.nextAttemptTime && now >= state.nextAttemptTime) {
          state.state = 'half-open';
          state.halfOpenAttempts = 0;
          return { allowed: true };
        }
        return { 
          allowed: false, 
          reason: `Circuit breaker open until ${new Date(state.nextAttemptTime!).toISOString()}` 
        };

      case 'half-open':
        // Allow limited attempts in half-open state
        if (state.halfOpenAttempts < config.circuitBreaker.halfOpenMaxAttempts) {
          state.halfOpenAttempts++;
          return { allowed: true };
        }
        return { allowed: false, reason: 'Circuit breaker half-open, max attempts reached' };

      default:
        return { allowed: true };
    }
  }

  /**
   * Record sync success
   */
  private recordSuccess(source: SyncSource): void {
    const state = this.circuitBreakers.get(source)!;
    
    // Reset circuit breaker on success
    if (state.state === 'half-open') {
      state.state = 'closed';
      state.failureCount = 0;
      state.halfOpenAttempts = 0;
    } else if (state.state === 'closed') {
      state.failureCount = 0;
    }

    // Reset retry counter
    this.retryCounters.set(source, 0);
  }

  /**
   * Record sync failure
   */
  private recordFailure(source: SyncSource): void {
    const config = this.configs.get(source)!;
    const state = this.circuitBreakers.get(source)!;
    const now = Date.now();

    state.failureCount++;
    state.lastFailureTime = now;

    // Increment retry counter
    const retryCount = this.retryCounters.get(source)! + 1;
    this.retryCounters.set(source, retryCount);

    // Check if we should open the circuit breaker
    if (state.failureCount >= config.circuitBreaker.failureThreshold) {
      state.state = 'open';
      state.nextAttemptTime = now + config.circuitBreaker.resetTimeoutMs;
    }
  }

  /**
   * Execute sync for a source
   */
  async executeSync(source: SyncSource): Promise<SyncResult> {
    const config = this.configs.get(source)!;
    const startTime = Date.now();
    const retryCount = this.retryCounters.get(source)!;

    try {
      // Check circuit breaker
      const cbCheck = this.checkCircuitBreaker(source);
      if (!cbCheck.allowed) {
        throw new Error(`CIRCUIT_BREAKER_OPEN: ${cbCheck.reason}`);
      }

      // Check rate limit
      if (!this.checkRateLimit(source)) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }

      // Execute sync
      const { itemsProcessed } = await this.syncHandler(source);

      // Record success
      this.recordSuccess(source);

      const result: SyncResult = {
        source,
        success: true,
        itemsProcessed,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        retryCount,
      };

      this.onResult?.(result);
      return result;

    } catch (error) {
      // Record failure
      this.recordFailure(source);

      const result: SyncResult = {
        source,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        retryCount,
      };

      this.onResult?.(result);

      // Schedule retry with backoff
      const backoffDelay = this.calculateBackoff(source, retryCount);
      console.warn(
        `[SyncScheduler] ${source} failed (attempt ${retryCount + 1}), ` +
        `retrying in ${backoffDelay}ms. Error: ${result.error}`
      );

      // Don't schedule immediate retry if circuit breaker is open
      const cbState = this.circuitBreakers.get(source)!;
      if (cbState.state !== 'open') {
        setTimeout(() => this.executeSync(source), backoffDelay);
      }

      return result;
    }
  }

  /**
   * Start scheduled sync for a source
   */
  start(source: SyncSource): void {
    if (this.timers.has(source)) {
      console.warn(`[SyncScheduler] ${source} already started`);
      return;
    }

    const config = this.configs.get(source)!;

    // Execute immediately
    this.executeSync(source);

    // Schedule recurring sync
    const timer = setInterval(() => {
      this.executeSync(source);
    }, config.intervalMs);

    this.timers.set(source, timer);
    console.log(`[SyncScheduler] Started ${source} with interval ${config.intervalMs}ms`);
  }

  /**
   * Stop scheduled sync for a source
   */
  stop(source: SyncSource): void {
    const timer = this.timers.get(source);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(source);
      console.log(`[SyncScheduler] Stopped ${source}`);
    }
  }

  /**
   * Start all sources
   */
  startAll(): void {
    this.configs.forEach((_, source) => this.start(source));
  }

  /**
   * Stop all sources
   */
  stopAll(): void {
    this.timers.forEach((timer) => clearInterval(timer));
    this.timers.clear();
    console.log('[SyncScheduler] Stopped all sources');
  }

  /**
   * Get circuit breaker state for a source
   */
  getCircuitBreakerState(source: SyncSource): CircuitBreakerState | undefined {
    return this.circuitBreakers.get(source);
  }

  /**
   * Get rate limit state for a source
   */
  getRateLimitState(source: SyncSource): RateLimitState | undefined {
    return this.rateLimiters.get(source);
  }

  /**
   * Get retry count for a source
   */
  getRetryCount(source: SyncSource): number {
    return this.retryCounters.get(source) || 0;
  }

  /**
   * Manually reset circuit breaker for a source
   */
  resetCircuitBreaker(source: SyncSource): void {
    const state = this.circuitBreakers.get(source);
    if (state) {
      state.state = 'closed';
      state.failureCount = 0;
      state.halfOpenAttempts = 0;
      state.lastFailureTime = undefined;
      state.nextAttemptTime = undefined;
      this.retryCounters.set(source, 0);
      console.log(`[SyncScheduler] Reset circuit breaker for ${source}`);
    }
  }

  /**
   * Get all circuit breaker states (for observability)
   */
  getAllStates(): Record<SyncSource, {
    circuitBreaker: CircuitBreakerState;
    rateLimit: RateLimitState;
    retryCount: number;
  }> {
    const states: unknown = {};
    
    this.configs.forEach((_, source) => {
      states[source] = {
        circuitBreaker: this.circuitBreakers.get(source)!,
        rateLimit: this.rateLimiters.get(source)!,
        retryCount: this.retryCounters.get(source)!,
      };
    });

    return states;
  }
}

/**
 * Create a singleton scheduler instance
 */
let schedulerInstance: SyncScheduler | null = null;

export function getScheduler(
  configs?: Partial<Record<SyncSource, SyncConfig>>,
  syncHandler?: (source: SyncSource) => Promise<{ itemsProcessed: number }>,
  onResult?: (result: SyncResult) => void
): SyncScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new SyncScheduler(configs, syncHandler, onResult);
  }
  return schedulerInstance;
}

export function resetScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.stopAll();
    schedulerInstance = null;
  }
}
