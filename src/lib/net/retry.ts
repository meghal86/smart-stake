export async function withRetry<T>(
  fn: () => Promise<T>,
  tries: number = 3,
  baseMs: number = 800
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < tries; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)
    try {
      // Allow fn to optionally use the signal via closure
      const result = await fn()
      clearTimeout(timeout)
      return result
    } catch (error) {
      lastError = error
      clearTimeout(timeout)
      if (attempt < tries - 1) {
        const jitter = Math.floor(Math.random() * 200)
        const delay = baseMs * Math.pow(2, attempt) + jitter
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('withRetry failed')
}

/**
 * Retry utility with exponential backoff and timeout
 */

export interface RetryOptions {
  tries?: number;
  baseMs?: number;
  timeoutMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  tries: 3,
  baseMs: 800,
  timeoutMs: 10000,
  onRetry: () => {},
};

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.tries; attempt++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Timeout after ${opts.timeoutMs}ms`));
        }, opts.timeoutMs);
      });

      // Race the function against the timeout
      const result = await Promise.race([fn(), timeoutPromise]);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on the last attempt
      if (attempt === opts.tries) {
        break;
      }

      // Call the retry callback
      opts.onRetry(attempt, lastError);

      // Exponential backoff: wait baseMs * 2^(attempt-1)
      const delayMs = opts.baseMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error('Unknown error in withRetry');
}

/**
 * Retry with abort signal support
 */
export async function withRetryAbortable<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.tries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs);

    try {
      const result = await fn(controller.signal);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === opts.tries) {
        break;
      }

      opts.onRetry(attempt, lastError);

      const delayMs = opts.baseMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error('Unknown error in withRetryAbortable');
}

/**
 * Batch retry for multiple operations
 */
export async function batchWithRetry<T>(
  fns: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<Array<{ success: boolean; data?: T; error?: Error }>> {
  const results = await Promise.allSettled(
    fns.map((fn) => withRetry(fn, options))
  );

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return { success: true, data: result.value };
    }
    return { success: false, error: result.reason };
  });
}

