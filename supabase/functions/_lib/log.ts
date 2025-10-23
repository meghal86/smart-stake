/**
 * Structured Logging & Request Tracing
 * World-class observability for Edge Functions
 */

export function generateRequestId(): string {
  return crypto.randomUUID();
}

export interface LogContext {
  requestId: string;
  event: string;
  [key: string]: any;
}

export class Logger {
  private requestId: string;

  constructor(requestId: string) {
    this.requestId = requestId;
  }

  private log(level: string, event: string, data: Record<string, any> = {}) {
    const logEntry = {
      level,
      event,
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      ...data,
    };

    // JSON structured logging
    console.log(JSON.stringify(logEntry));
  }

  info(event: string, data?: Record<string, any>) {
    this.log('info', event, data);
  }

  warn(event: string, data?: Record<string, any>) {
    this.log('warn', event, data);
  }

  error(event: string, error: Error | unknown, data?: Record<string, any>) {
    this.log('error', event, {
      ...data,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : String(error),
    });
  }

  debug(event: string, data?: Record<string, any>) {
    this.log('debug', event, data);
  }

  // Timing helper
  time(label: string): () => number {
    const start = Date.now();
    return () => {
      const elapsed = Date.now() - start;
      this.debug('timing', { label, durationMs: elapsed });
      return elapsed;
    };
  }
}

export function createLogger(requestId?: string): Logger {
  return new Logger(requestId || generateRequestId());
}

// Sentry stub
export function captureException(error: Error, context?: Record<string, any>) {
  // Stub for Sentry integration
  console.error('Sentry Capture:', {
    error: {
      message: error.message,
      stack: error.stack,
    },
    context,
  });

  // In production, add:
  // import * as Sentry from '@sentry/deno';
  // Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
  console.log('Sentry Message:', { message, level, context });

  // In production:
  // Sentry.captureMessage(message, { level, extra: context });
}

