/**
 * Observability and Logging
 * Request tracking, structured logging, and error monitoring
 */

export interface LogContext {
  requestId?: string;
  userId?: string;
  walletAddress?: string;
  action?: string;
  [key: string]: any;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Structured logger with context
 */
export class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...(data && { data }),
    };

    // In production, send to logging service
    if (import.meta.env.PROD) {
      // TODO: Send to external logging service (e.g., Sentry, LogRocket)
      console[level](JSON.stringify(logEntry));
    } else {
      // Development: pretty print
      console[level](`[${level.toUpperCase()}] ${message}`, logEntry);
    }

    // Send errors to Sentry if configured
    if (level === 'error' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;
      Sentry.captureException(new Error(message), {
        extra: logEntry,
      });
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }

  /**
   * Time an operation
   */
  async time<T>(
    operationName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    this.debug(`Starting operation: ${operationName}`);

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.info(`Operation completed: ${operationName}`, { durationMs: duration });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`Operation failed: ${operationName}`, {
        durationMs: duration,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger({ service: 'guardian' });

/**
 * Performance metrics tracker
 */
export class PerformanceTracker {
  private metrics: Map<string, number[]> = new Map();

  track(metricName: string, value: number) {
    const existing = this.metrics.get(metricName) || [];
    existing.push(value);
    this.metrics.set(metricName, existing);
  }

  getStats(metricName: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const values = this.metrics.get(metricName);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count,
      min: sorted[0],
      max: sorted[count - 1],
      avg: sum / count,
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
    };
  }

  reset(metricName?: string) {
    if (metricName) {
      this.metrics.delete(metricName);
    } else {
      this.metrics.clear();
    }
  }

  getAllMetrics(): Record<string, ReturnType<typeof this.getStats>> {
    const result: Record<string, any> = {};
    for (const [name] of this.metrics) {
      result[name] = this.getStats(name);
    }
    return result;
  }
}

export const performanceTracker = new PerformanceTracker();

/**
 * Error boundary helper
 */
export function captureError(
  error: Error,
  context: LogContext = {}
): void {
  logger.error(error.message, {
    ...context,
    stack: error.stack,
    name: error.name,
  });

  // Send to Sentry if available
  if ((window as any).Sentry) {
    const Sentry = (window as any).Sentry;
    Sentry.captureException(error, { extra: context });
  }
}

/**
 * Initialize Sentry (call this in your app startup)
 */
export function initSentry(dsn?: string): void {
  if (!dsn) {
    console.warn('Sentry DSN not provided. Error tracking disabled.');
    return;
  }

  // Dynamically load Sentry
  const script = document.createElement('script');
  script.src = 'https://browser.sentry-cdn.com/7.x/bundle.min.js';
  script.onload = () => {
    const Sentry = (window as any).Sentry;
    if (Sentry) {
      Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        integrations: [
          new Sentry.BrowserTracing(),
          new Sentry.Replay(),
        ],
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      });
      logger.info('Sentry initialized');
    }
  };
  document.head.appendChild(script);
}

/**
 * Track custom event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
): void {
  logger.info(`Event: ${eventName}`, properties);

  // Send to analytics service if configured
  if ((window as any).analytics) {
    (window as any).analytics.track(eventName, properties);
  }
}




