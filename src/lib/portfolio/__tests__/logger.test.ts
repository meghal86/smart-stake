/**
 * Unit tests for Portfolio Logger with Privacy Protection
 * 
 * Tests Requirements: R12.5, R12.6, R12.7
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PortfolioLogger,
  hashAddress,
  safeFormatAddress,
  logWalletOperation,
  logPlanExecution,
  logSecurityEvent,
  isDebugRawAddressesEnabled,
} from '../logger';

describe('hashAddress', () => {
  test('produces consistent hashes for same address', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    const hash1 = hashAddress(address);
    const hash2 = hashAddress(address);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(16); // First 16 chars of SHA-256 hex
  });

  test('normalizes addresses before hashing', () => {
    const upperCase = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
    const lowerCase = '0xabcdef1234567890abcdef1234567890abcdef12';
    
    const hash1 = hashAddress(upperCase);
    const hash2 = hashAddress(lowerCase);
    
    expect(hash1).toBe(hash2);
  });

  test('handles null/empty addresses', () => {
    expect(hashAddress('')).toBe('null');
    expect(hashAddress(null as any)).toBe('null');
  });

  test('produces different hashes for different addresses', () => {
    const address1 = '0x1111111111111111111111111111111111111111';
    const address2 = '0x2222222222222222222222222222222222222222';
    
    const hash1 = hashAddress(address1);
    const hash2 = hashAddress(address2);
    
    expect(hash1).not.toBe(hash2);
  });
});

describe('PortfolioLogger', () => {
  let consoleSpy: any;

  beforeEach(() => {
    // Spy on console methods
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    // Restore console methods
    Object.values(consoleSpy).forEach((spy: any) => spy.mockRestore());
  });

  test('redacts wallet addresses in logs', () => {
    const logger = new PortfolioLogger();
    const testAddress = '0x1234567890abcdef1234567890abcdef12345678';
    
    logger.info('Test message', {
      walletAddress: testAddress,
    });
    
    const logOutput = consoleSpy.info.mock.calls[0][0];
    const parsedLog = JSON.parse(logOutput);
    
    expect(parsedLog.walletAddress).toBeUndefined();
    expect(parsedLog.walletAddressHash).toBeDefined();
    expect(parsedLog.walletAddressHash).toBe(hashAddress(testAddress));
    expect(logOutput).not.toContain(testAddress);
  });

  test('redacts multiple address fields', () => {
    const logger = new PortfolioLogger();
    
    logger.info('Test message', {
      address: '0x1111111111111111111111111111111111111111',
      spenderAddress: '0x2222222222222222222222222222222222222222',
      tokenAddress: '0x3333333333333333333333333333333333333333',
      targetAddress: '0x4444444444444444444444444444444444444444',
    });
    
    const logOutput = consoleSpy.info.mock.calls[0][0];
    const parsedLog = JSON.parse(logOutput);
    
    expect(parsedLog.address).toBeUndefined();
    expect(parsedLog.addressHash).toBeDefined();
    expect(parsedLog.spenderAddress).toBeUndefined();
    expect(parsedLog.spenderAddressHash).toBeDefined();
    expect(parsedLog.tokenAddress).toBeUndefined();
    expect(parsedLog.tokenAddressHash).toBeDefined();
    expect(parsedLog.targetAddress).toBeUndefined();
    expect(parsedLog.targetAddressHash).toBeDefined();
  });

  test('redacts transaction hashes to prefix only', () => {
    const logger = new PortfolioLogger();
    const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    
    logger.info('Test message', {
      transactionHash: txHash,
    });
    
    const logOutput = consoleSpy.info.mock.calls[0][0];
    const parsedLog = JSON.parse(logOutput);
    
    expect(parsedLog.transactionHash).toBeUndefined();
    expect(parsedLog.transactionHashPrefix).toBe(txHash.substring(0, 10));
  });

  test('preserves non-sensitive context fields', () => {
    const logger = new PortfolioLogger();
    
    logger.info('Test message', {
      userId: 'user-123',
      planId: 'plan-456',
      netWorth: 50000,
      scopeMode: 'active_wallet',
    });
    
    const logOutput = consoleSpy.info.mock.calls[0][0];
    const parsedLog = JSON.parse(logOutput);
    
    expect(parsedLog.userId).toBe('user-123');
    expect(parsedLog.planId).toBe('plan-456');
    expect(parsedLog.netWorth).toBe(50000);
    expect(parsedLog.scopeMode).toBe('active_wallet');
  });

  test('child logger inherits parent context', () => {
    const parentLogger = new PortfolioLogger({
      userId: 'user-123',
      service: 'portfolio',
    });
    
    const childLogger = parentLogger.child({
      planId: 'plan-456',
    });
    
    childLogger.info('Test message');
    
    const logOutput = consoleSpy.info.mock.calls[0][0];
    const parsedLog = JSON.parse(logOutput);
    
    expect(parsedLog.userId).toBe('user-123');
    expect(parsedLog.service).toBe('portfolio');
    expect(parsedLog.planId).toBe('plan-456');
  });

  test('child logger redacts addresses from parent context', () => {
    const parentLogger = new PortfolioLogger({
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    });
    
    const childLogger = parentLogger.child({
      planId: 'plan-456',
    });
    
    childLogger.info('Test message');
    
    const logOutput = consoleSpy.info.mock.calls[0][0];
    const parsedLog = JSON.parse(logOutput);
    
    expect(parsedLog.walletAddress).toBeUndefined();
    expect(parsedLog.walletAddressHash).toBeDefined();
  });

  test('error method includes error details', () => {
    const logger = new PortfolioLogger();
    const testError = new Error('Test error message');
    testError.stack = 'Error stack trace';
    
    logger.error('Operation failed', testError, {
      userId: 'user-123',
    });
    
    const logOutput = consoleSpy.error.mock.calls[0][0];
    const parsedLog = JSON.parse(logOutput);
    
    expect(parsedLog.error).toBeDefined();
    expect(parsedLog.error.name).toBe('Error');
    expect(parsedLog.error.message).toBe('Test error message');
    expect(parsedLog.error.stack).toBe('Error stack trace');
  });

  test('audit method marks logs as audit logs', () => {
    const logger = new PortfolioLogger();
    
    logger.audit('wallet_linked', {
      userId: 'user-123',
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    });
    
    const logOutput = consoleSpy.info.mock.calls[0][0];
    const parsedLog = JSON.parse(logOutput);
    
    expect(parsedLog.auditLog).toBe(true);
    expect(parsedLog.eventType).toBe('wallet_linked');
    expect(parsedLog.message).toContain('AUDIT:');
  });

  test('includes timestamp in all logs', () => {
    const logger = new PortfolioLogger();
    
    logger.info('Test message');
    
    const logOutput = consoleSpy.info.mock.calls[0][0];
    const parsedLog = JSON.parse(logOutput);
    
    expect(parsedLog.timestamp).toBeDefined();
    expect(new Date(parsedLog.timestamp).getTime()).toBeGreaterThan(0);
  });

  test('includes log level in all logs', () => {
    const logger = new PortfolioLogger();
    
    logger.info('Info message');
    logger.warn('Warn message');
    logger.error('Error message');
    
    const infoLog = JSON.parse(consoleSpy.info.mock.calls[0][0]);
    const warnLog = JSON.parse(consoleSpy.warn.mock.calls[0][0]);
    const errorLog = JSON.parse(consoleSpy.error.mock.calls[0][0]);
    
    expect(infoLog.level).toBe('INFO');
    expect(warnLog.level).toBe('WARN');
    expect(errorLog.level).toBe('ERROR');
  });
});

describe('safeFormatAddress', () => {
  test('returns hash in production mode', () => {
    const originalEnv = process.env.DEBUG_RAW_ADDRESSES;
    process.env.DEBUG_RAW_ADDRESSES = 'false';
    
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    const formatted = safeFormatAddress(address);
    
    expect(formatted).toContain('address_hash:');
    expect(formatted).not.toContain(address);
    expect(formatted).toContain(hashAddress(address));
    
    process.env.DEBUG_RAW_ADDRESSES = originalEnv;
  });

  test('includes raw address in debug mode', () => {
    const originalEnv = process.env.DEBUG_RAW_ADDRESSES;
    process.env.DEBUG_RAW_ADDRESSES = 'true';
    
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    const formatted = safeFormatAddress(address);
    
    expect(formatted).toContain(address);
    expect(formatted).toContain('hash:');
    
    process.env.DEBUG_RAW_ADDRESSES = originalEnv;
  });
});

describe('utility functions', () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('logWalletOperation logs with correct format', () => {
    logWalletOperation('snapshot_created', {
      userId: 'user-123',
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      netWorth: 50000,
    });
    
    const logOutput = consoleSpy.mock.calls[0][0];
    const parsedLog = JSON.parse(logOutput);
    
    expect(parsedLog.message).toContain('Wallet operation: snapshot_created');
    expect(parsedLog.userId).toBe('user-123');
    expect(parsedLog.walletAddress).toBeUndefined();
    expect(parsedLog.walletAddressHash).toBeDefined();
    expect(parsedLog.netWorth).toBe(50000);
  });

  test('logPlanExecution logs with plan and step context', () => {
    logPlanExecution('plan-123', 'step-456', 'executing', {
      userId: 'user-789',
    });
    
    const logOutput = consoleSpy.mock.calls[0][0];
    const parsedLog = JSON.parse(logOutput);
    
    expect(parsedLog.message).toContain('Plan execution: executing');
    expect(parsedLog.planId).toBe('plan-123');
    expect(parsedLog.stepId).toBe('step-456');
    expect(parsedLog.userId).toBe('user-789');
  });

  test('logSecurityEvent logs as audit with severity', () => {
    logSecurityEvent('payload_mismatch_blocked', 'critical', {
      planId: 'plan-123',
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    });
    
    const logOutput = consoleSpy.mock.calls[0][0];
    const parsedLog = JSON.parse(logOutput);
    
    expect(parsedLog.message).toContain('SECURITY: payload_mismatch_blocked');
    expect(parsedLog.auditLog).toBe(true);
    expect(parsedLog.severity).toBe('critical');
    expect(parsedLog.walletAddress).toBeUndefined();
    expect(parsedLog.walletAddressHash).toBeDefined();
  });
});

describe('isDebugRawAddressesEnabled', () => {
  test('returns false when DEBUG_RAW_ADDRESSES is not set', () => {
    const originalEnv = process.env.DEBUG_RAW_ADDRESSES;
    delete process.env.DEBUG_RAW_ADDRESSES;
    
    expect(isDebugRawAddressesEnabled()).toBe(false);
    
    process.env.DEBUG_RAW_ADDRESSES = originalEnv;
  });

  test('returns false when DEBUG_RAW_ADDRESSES is false', () => {
    const originalEnv = process.env.DEBUG_RAW_ADDRESSES;
    process.env.DEBUG_RAW_ADDRESSES = 'false';
    
    expect(isDebugRawAddressesEnabled()).toBe(false);
    
    process.env.DEBUG_RAW_ADDRESSES = originalEnv;
  });

  test('returns true when DEBUG_RAW_ADDRESSES is true', () => {
    const originalEnv = process.env.DEBUG_RAW_ADDRESSES;
    process.env.DEBUG_RAW_ADDRESSES = 'true';
    
    expect(isDebugRawAddressesEnabled()).toBe(true);
    
    process.env.DEBUG_RAW_ADDRESSES = originalEnv;
  });
});

describe('debug mode behavior', () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('includes raw addresses with warning in debug mode', () => {
    const originalEnv = process.env.DEBUG_RAW_ADDRESSES;
    process.env.DEBUG_RAW_ADDRESSES = 'true';
    
    const logger = new PortfolioLogger();
    const testAddress = '0x1234567890abcdef1234567890abcdef12345678';
    
    logger.info('Test message', {
      walletAddress: testAddress,
    });
    
    const logOutput = consoleSpy.mock.calls[0][0];
    const parsedLog = JSON.parse(logOutput);
    
    expect(parsedLog._debug_raw_address).toBe(testAddress);
    expect(parsedLog._debug_warning).toContain('DO NOT USE IN PRODUCTION');
    expect(parsedLog.walletAddressHash).toBeDefined();
    
    process.env.DEBUG_RAW_ADDRESSES = originalEnv;
  });

  test('does not include raw addresses in production mode', () => {
    const originalEnv = process.env.DEBUG_RAW_ADDRESSES;
    process.env.DEBUG_RAW_ADDRESSES = 'false';
    
    const logger = new PortfolioLogger();
    const testAddress = '0x1234567890abcdef1234567890abcdef12345678';
    
    logger.info('Test message', {
      walletAddress: testAddress,
    });
    
    const logOutput = consoleSpy.mock.calls[0][0];
    const parsedLog = JSON.parse(logOutput);
    
    expect(parsedLog._debug_raw_address).toBeUndefined();
    expect(parsedLog._debug_warning).toBeUndefined();
    expect(parsedLog.walletAddressHash).toBeDefined();
    
    process.env.DEBUG_RAW_ADDRESSES = originalEnv;
  });
});
