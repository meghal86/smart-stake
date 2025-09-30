interface CircuitBreakerConfig {
  failureThreshold: number;
  timeWindow: number; // ms
  openDuration: number; // ms
  latencyThreshold: number; // ms
  latencyWindow: number; // ms
}

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailureTime: number;
  openedAt: number;
  latencyBuffer: number[];
  lastLatencyCheck: number;
}

export class CircuitBreaker {
  private state: CircuitBreakerState;
  private config: CircuitBreakerConfig;
  private name: string;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = {
      failureThreshold: 5,
      timeWindow: 60000, // 60s
      openDuration: 90000, // 90s
      latencyThreshold: 2000, // 2s
      latencyWindow: 60000, // 60s
      ...config
    };
    
    this.state = {
      state: 'closed',
      failures: 0,
      lastFailureTime: 0,
      openedAt: 0,
      latencyBuffer: [],
      lastLatencyCheck: Date.now()
    };
  }

  async execute<T>(operation: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    
    // Check if we should transition from open to half-open
    if (this.state.state === 'open' && this.shouldAttemptReset()) {
      this.state.state = 'half-open';
      console.log(`🔄 Circuit breaker ${this.name}: open → half-open`);
    }

    // If open, use fallback or throw
    if (this.state.state === 'open') {
      if (fallback) {
        console.log(`⚡ Circuit breaker ${this.name}: using fallback (cached response SLA <150ms)`);
        return await fallback();
      }
      throw new Error(`Circuit breaker ${this.name} is OPEN`);
    }

    try {
      const result = await operation();
      const latency = Date.now() - startTime;
      
      this.onSuccess(latency);
      return result;
    } catch (error) {
      const latency = Date.now() - startTime;
      this.onFailure(latency);
      
      if (fallback && this.state.state === 'open') {
        console.log(`⚡ Circuit breaker ${this.name}: fallback after failure`);
        return await fallback();
      }
      
      throw error;
    }
  }

  private onSuccess(latency: number) {
    // Track latency
    this.trackLatency(latency);
    
    // Reset failure count on success
    if (this.state.state === 'half-open') {
      this.state.state = 'closed';
      this.state.failures = 0;
      console.log(`✅ Circuit breaker ${this.name}: half-open → closed`);
    } else if (this.state.state === 'closed') {
      // Decay failures over time
      const now = Date.now();
      if (now - this.state.lastFailureTime > this.config.timeWindow) {
        this.state.failures = 0;
      }
    }
  }

  private onFailure(latency: number) {
    this.trackLatency(latency);
    this.state.failures++;
    this.state.lastFailureTime = Date.now();

    // Check if we should open the circuit
    if (this.shouldOpen()) {
      this.state.state = 'open';
      this.state.openedAt = Date.now();
      console.warn(`🔴 Circuit breaker ${this.name}: OPEN (${this.state.failures} failures)`);
    }
  }

  private trackLatency(latency: number) {
    const now = Date.now();
    this.state.latencyBuffer.push(latency);
    
    // Keep only latencies within the window
    const cutoff = now - this.config.latencyWindow;
    this.state.latencyBuffer = this.state.latencyBuffer.filter((_, index) => {
      const timestamp = now - (this.state.latencyBuffer.length - index - 1) * 1000;
      return timestamp > cutoff;
    });

    // Check latency-based circuit opening
    if (now - this.state.lastLatencyCheck > 60000) { // Check every minute
      const p95Latency = this.calculateP95();
      if (p95Latency > this.config.latencyThreshold) {
        console.warn(`⚠️ Circuit breaker ${this.name}: High latency detected (p95: ${p95Latency}ms)`);
        this.state.failures += 3; // Treat high latency as failures
      }
      this.state.lastLatencyCheck = now;
    }
  }

  private shouldOpen(): boolean {
    const now = Date.now();
    const recentFailures = this.state.failures;
    const withinTimeWindow = (now - this.state.lastFailureTime) < this.config.timeWindow;
    
    return recentFailures >= this.config.failureThreshold && withinTimeWindow;
  }

  private shouldAttemptReset(): boolean {
    const now = Date.now();
    return (now - this.state.openedAt) >= this.config.openDuration;
  }

  private calculateP95(): number {
    if (this.state.latencyBuffer.length === 0) return 0;
    
    const sorted = [...this.state.latencyBuffer].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[Math.max(0, index)];
  }

  // Public methods for monitoring
  getState() {
    return {
      name: this.name,
      state: this.state.state,
      failures: this.state.failures,
      p95Latency: this.calculateP95(),
      isHealthy: this.state.state === 'closed',
      lastFailure: this.state.lastFailureTime ? new Date(this.state.lastFailureTime) : null,
      openedAt: this.state.openedAt ? new Date(this.state.openedAt) : null
    };
  }

  reset() {
    this.state = {
      state: 'closed',
      failures: 0,
      lastFailureTime: 0,
      openedAt: 0,
      latencyBuffer: [],
      lastLatencyCheck: Date.now()
    };
    console.log(`🔄 Circuit breaker ${this.name}: manually reset`);
  }
}

// Global circuit breakers
export const coinGeckoBreaker = new CircuitBreaker('CoinGecko', {
  failureThreshold: 3,
  latencyThreshold: 1500
});

export const etherscanBreaker = new CircuitBreaker('Etherscan', {
  failureThreshold: 5,
  latencyThreshold: 2000
});