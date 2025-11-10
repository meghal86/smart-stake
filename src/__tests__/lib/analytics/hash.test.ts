/**
 * Tests for wallet address hashing utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  hashWalletAddress,
  isPlainWalletAddress,
  sanitizeEventProperties,
} from '@/lib/analytics/hash';

describe('Analytics Hash Utilities', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  describe('hashWalletAddress', () => {
    it('should hash wallet address with session salt', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const hash = await hashWalletAddress(address);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(address);
      expect(hash.length).toBe(64); // SHA-256 produces 64 hex chars
    });

    it('should produce consistent hash within same session', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const hash1 = await hashWalletAddress(address);
      const hash2 = await hashWalletAddress(address);

      expect(hash1).toBe(hash2);
    });

    it('should normalize address to lowercase', async () => {
      const address1 = '0x1234567890123456789012345678901234567890';
      const address2 = '0X1234567890123456789012345678901234567890';
      
      const hash1 = await hashWalletAddress(address1);
      const hash2 = await hashWalletAddress(address2);

      expect(hash1).toBe(hash2);
    });

    it('should return empty string for empty address', async () => {
      const hash = await hashWalletAddress('');
      expect(hash).toBe('');
    });

    it('should produce different hashes in different sessions', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const hash1 = await hashWalletAddress(address);

      // Clear session to simulate new session
      sessionStorage.clear();

      const hash2 = await hashWalletAddress(address);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('isPlainWalletAddress', () => {
    it('should detect Ethereum addresses', () => {
      expect(isPlainWalletAddress('0x1234567890123456789012345678901234567890')).toBe(true);
      expect(isPlainWalletAddress('0xAbCdEf1234567890123456789012345678901234')).toBe(true);
    });

    it('should detect Solana addresses', () => {
      expect(isPlainWalletAddress('DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK')).toBe(true);
      expect(isPlainWalletAddress('11111111111111111111111111111111')).toBe(true);
    });

    it('should not detect hashed values', () => {
      expect(isPlainWalletAddress('a3f5b2c1d4e6f7g8h9i0j1k2l3m4n5o6')).toBe(false);
      expect(isPlainWalletAddress('user_123')).toBe(false);
      expect(isPlainWalletAddress('opp_456')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(isPlainWalletAddress('')).toBe(false);
    });

    it('should handle invalid formats', () => {
      expect(isPlainWalletAddress('0x123')).toBe(false); // Too short
      expect(isPlainWalletAddress('not_an_address')).toBe(false);
    });
  });

  describe('sanitizeEventProperties', () => {
    it('should redact plain Ethereum addresses', () => {
      const props = {
        wallet: '0x1234567890123456789012345678901234567890',
        opportunityId: 'opp_123',
      };

      const sanitized = sanitizeEventProperties(props);

      expect(sanitized.wallet).toBe('[REDACTED]');
      expect(sanitized.opportunityId).toBe('opp_123');
    });

    it('should redact plain Solana addresses', () => {
      const props = {
        wallet: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
        opportunityId: 'opp_123',
      };

      const sanitized = sanitizeEventProperties(props);

      expect(sanitized.wallet).toBe('[REDACTED]');
      expect(sanitized.opportunityId).toBe('opp_123');
    });

    it('should preserve non-address values', () => {
      const props = {
        userId: 'user_123',
        opportunityId: 'opp_456',
        count: 5,
        enabled: true,
      };

      const sanitized = sanitizeEventProperties(props);

      expect(sanitized).toEqual(props);
    });

    it('should recursively sanitize nested objects', () => {
      const props = {
        user: {
          id: 'user_123',
          wallet: '0x1234567890123456789012345678901234567890',
        },
        opportunity: {
          id: 'opp_123',
        },
      };

      const sanitized = sanitizeEventProperties(props);

      expect(sanitized.user.id).toBe('user_123');
      expect(sanitized.user.wallet).toBe('[REDACTED]');
      expect(sanitized.opportunity.id).toBe('opp_123');
    });

    it('should log security warning when plain address detected', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const props = {
        wallet: '0x1234567890123456789012345678901234567890',
      };

      sanitizeEventProperties(props);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY WARNING: Plain wallet address detected')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle null and undefined values', () => {
      const props = {
        value1: null,
        value2: undefined,
        value3: 'test',
      };

      const sanitized = sanitizeEventProperties(props);

      expect(sanitized.value1).toBeNull();
      expect(sanitized.value2).toBeUndefined();
      expect(sanitized.value3).toBe('test');
    });
  });
});
