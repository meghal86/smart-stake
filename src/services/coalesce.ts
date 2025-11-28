interface CoalescedRequest<T> {
  promise: Promise<T>;
  timestamp: number;
  subscribers: Array<{
    resolve: (value: T) => void;
    reject: (error: unknown) => void;
  }>;
}

class RequestCoalescer {
  private activeRequests = new Map<string, CoalescedRequest<unknown>>();
  private readonly BUCKET_SIZE = 30000; // 30 seconds

  async coalesce<T>(
    key: string,
    operation: () => Promise<T>,
    bucketSize: number = this.BUCKET_SIZE
  ): Promise<T> {
    const bucketKey = this.getBucketKey(key, bucketSize);
    const existing = this.activeRequests.get(bucketKey);

    if (existing) {
      // Join existing request
      return new Promise<T>((resolve, reject) => {
        existing.subscribers.push({ resolve, reject });
      });
    }

    // Create new coalesced request
    const subscribers: Array<{ resolve: (value: T) => void; reject: (error: unknown) => void }> = [];
    
    const promise = operation()
      .then((result) => {
        // Resolve all subscribers
        subscribers.forEach(sub => sub.resolve(result));
        this.activeRequests.delete(bucketKey);
        return result;
      })
      .catch((error) => {
        // Reject all subscribers
        subscribers.forEach(sub => sub.reject(error));
        this.activeRequests.delete(bucketKey);
        throw error;
      });

    const coalescedRequest: CoalescedRequest<T> = {
      promise,
      timestamp: Date.now(),
      subscribers
    };

    this.activeRequests.set(bucketKey, coalescedRequest);

    // Return the promise for the first caller
    return promise;
  }

  private getBucketKey(key: string, bucketSize: number): string {
    const now = Date.now();
    const bucket = Math.floor(now / bucketSize);
    return `${key}_${bucket}`;
  }

  // Cleanup old requests (call periodically)
  cleanup(maxAge: number = 300000) { // 5 minutes
    const cutoff = Date.now() - maxAge;
    
    for (const [key, request] of this.activeRequests.entries()) {
      if (request.timestamp < cutoff) {
        this.activeRequests.delete(key);
      }
    }
  }

  getStats() {
    return {
      activeRequests: this.activeRequests.size,
      requests: Array.from(this.activeRequests.entries()).map(([key, req]) => ({
        key,
        subscribers: req.subscribers.length,
        age: Date.now() - req.timestamp
      }))
    };
  }
}

// Global coalescer instance
export const requestCoalescer = new RequestCoalescer();

// Cleanup every 5 minutes
setInterval(() => {
  requestCoalescer.cleanup();
}, 5 * 60 * 1000);