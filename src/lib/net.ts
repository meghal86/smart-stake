interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
}

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.options.failureThreshold) {
      this.state = 'open';
    }
  }
}

const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export function withCache<T>(key: string, ttl: number = 300000) {
  return async (fn: () => Promise<T>): Promise<T> => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    const data = await fn();
    cache.set(key, { data, timestamp: Date.now(), ttl });
    return data;
  };
}

export function withCircuitBreaker(options: CircuitBreakerOptions = { failureThreshold: 3, resetTimeout: 60000 }) {
  const breaker = new CircuitBreaker(options);
  return <T>(fn: () => Promise<T>) => breaker.execute(fn);
}