/**
 * Portfolio System Logger with Privacy Protection
 * 
 * This logger enforces privacy rules for wallet addresses:
 * - Raw addresses are NEVER logged unless explicit debug flag is enabled
 * - Address hashes are used for correlation in logs
 * - Sensitive data is automatically redacted
 * 
 * Requirements: R12.5, R12.6, R12.7
 */

import { createHash } from 'crypto';

/**
 * Check if debug raw addresses is enabled
 * This function checks the environment variable at runtime
 */
function isDebugEnabled(): boolean {
  return process.env.DEBUG_RAW_ADDRESSES === 'true';
}

// Severity levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Log context interface
export interface LogContext {
  userId?: string;
  walletAddress?: string;
  planId?: string;
  stepId?: string;
  correlationId?: string;
  [key: string]: any;
}

/**
 * Hash a wallet address for logging purposes
 * Uses SHA-256 to create a consistent, privacy-preserving identifier
 */
export function hashAddress(address: string): string {
  if (!address) return 'null';
  const normalized = address.toLowerCase();
  return createHash('sha256').update(normalized).digest('hex').substring(0, 16);
}

/**
 * Redact sensitive data from log context
 * - Replaces raw wallet addresses with hashes
 * - Preserves address hashes for correlation
 * - Removes other PII
 */
function redactSensitiveData(context: LogContext): LogContext {
  const redacted: LogContext = { ...context };

  // Handle wallet address
  if (redacted.walletAddress) {
    if (isDebugEnabled()) {
      // In debug mode, keep raw address but add warning
      redacted._debug_raw_address = redacted.walletAddress;
      redacted._debug_warning = 'RAW ADDRESS LOGGING ENABLED - DO NOT USE IN PRODUCTION';
    }
    // Always replace with hash
    redacted.walletAddressHash = hashAddress(redacted.walletAddress);
    delete redacted.walletAddress;
  }

  // Redact any other address-like fields
  const addressFields = ['address', 'spenderAddress', 'tokenAddress', 'targetAddress'];
  for (const field of addressFields) {
    if (redacted[field] && typeof redacted[field] === 'string') {
      if (isDebugEnabled()) {
        redacted[`_debug_raw_${field}`] = redacted[field];
      }
      redacted[`${field}Hash`] = hashAddress(redacted[field]);
      delete redacted[field];
    }
  }

  // Redact transaction hashes (keep first 8 chars for correlation)
  if (redacted.transactionHash && typeof redacted.transactionHash === 'string') {
    redacted.transactionHashPrefix = redacted.transactionHash.substring(0, 10);
    delete redacted.transactionHash;
  }

  return redacted;
}

/**
 * Format log message with context
 */
function formatLogMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const redactedContext = context ? redactSensitiveData(context) : {};
  
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...redactedContext,
  };

  return JSON.stringify(logEntry);
}

/**
 * Portfolio logger class with privacy protection
 */
export class PortfolioLogger {
  private context: LogContext;

  constructor(baseContext: LogContext = {}) {
    this.context = baseContext;
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): PortfolioLogger {
    return new PortfolioLogger({ ...this.context, ...additionalContext });
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      const mergedContext = { ...this.context, ...context };
      console.debug(formatLogMessage('debug', message, mergedContext));
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    const mergedContext = { ...this.context, ...context };
    console.info(formatLogMessage('info', message, mergedContext));
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    const mergedContext = { ...this.context, ...context };
    console.warn(formatLogMessage('warn', message, mergedContext));
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const mergedContext = {
      ...this.context,
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };
    console.error(formatLogMessage('error', message, mergedContext));
  }

  /**
   * Log audit event (always logged, even in production)
   */
  audit(eventType: string, context?: LogContext): void {
    const mergedContext = {
      ...this.context,
      ...context,
      eventType,
      auditLog: true,
    };
    console.info(formatLogMessage('info', `AUDIT: ${eventType}`, mergedContext));
  }
}

/**
 * Create a default portfolio logger instance
 */
export const portfolioLogger = new PortfolioLogger({
  service: 'unified-portfolio',
});

/**
 * Utility function to safely log wallet-related operations
 * 
 * @example
 * logWalletOperation('snapshot_created', {
 *   userId: user.id,
 *   walletAddress: '0x1234...', // Will be automatically hashed
 *   netWorth: 50000,
 * });
 */
export function logWalletOperation(
  operation: string,
  context: LogContext
): void {
  portfolioLogger.info(`Wallet operation: ${operation}`, context);
}

/**
 * Utility function to log plan execution events
 */
export function logPlanExecution(
  planId: string,
  stepId: string | undefined,
  status: string,
  context?: LogContext
): void {
  portfolioLogger.info(`Plan execution: ${status}`, {
    planId,
    stepId,
    ...context,
  });
}

/**
 * Utility function to log security events
 */
export function logSecurityEvent(
  eventType: string,
  severity: 'critical' | 'high' | 'medium' | 'low',
  context: LogContext
): void {
  portfolioLogger.audit(`SECURITY: ${eventType}`, {
    severity,
    ...context,
  });
}

/**
 * Type guard to check if debug raw addresses is enabled
 * Use this to conditionally include raw addresses in error messages
 */
export function isDebugRawAddressesEnabled(): boolean {
  return isDebugEnabled();
}

/**
 * Safely format an address for display in error messages
 * Returns hash in production, raw address in debug mode
 */
export function safeFormatAddress(address: string): string {
  if (isDebugEnabled()) {
    return `${address} (hash: ${hashAddress(address)})`;
  }
  return `address_hash:${hashAddress(address)}`;
}
