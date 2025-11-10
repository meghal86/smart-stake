/**
 * Tests for CSP Nonce Utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('Nonce Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNonce', () => {
    it('should return nonce from headers', async () => {
      const { headers } = await import('next/headers');
      const { getNonce } = await import('../../../lib/security/nonce');

      const mockHeaders = new Map([['x-nonce', 'test-nonce-123']]);
      vi.mocked(headers).mockReturnValue({
        get: (key: string) => mockHeaders.get(key) || null,
      } as any);

      const nonce = getNonce();
      expect(nonce).toBe('test-nonce-123');
    });

    it('should return undefined if nonce header is not present', async () => {
      const { headers } = await import('next/headers');
      const { getNonce } = await import('../../../lib/security/nonce');

      vi.mocked(headers).mockReturnValue({
        get: () => null,
      } as any);

      const nonce = getNonce();
      expect(nonce).toBeUndefined();
    });

    it('should return undefined and warn if called outside Server Component', async () => {
      const { headers } = await import('next/headers');
      const { getNonce } = await import('../../../lib/security/nonce');

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(headers).mockImplementation(() => {
        throw new Error('headers() can only be called in Server Components');
      });

      const nonce = getNonce();
      expect(nonce).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'getNonce() can only be called in Server Components'
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('getNonceAttr', () => {
    it('should return object with nonce attribute when nonce is available', async () => {
      const { headers } = await import('next/headers');
      const { getNonceAttr } = await import('../../../lib/security/nonce');

      const mockHeaders = new Map([['x-nonce', 'test-nonce-456']]);
      vi.mocked(headers).mockReturnValue({
        get: (key: string) => mockHeaders.get(key) || null,
      } as any);

      const attr = getNonceAttr();
      expect(attr).toEqual({ nonce: 'test-nonce-456' });
    });

    it('should return empty object when nonce is not available', async () => {
      const { headers } = await import('next/headers');
      const { getNonceAttr } = await import('../../../lib/security/nonce');

      vi.mocked(headers).mockReturnValue({
        get: () => null,
      } as any);

      const attr = getNonceAttr();
      expect(attr).toEqual({});
    });

    it('should return empty object if called outside Server Component', async () => {
      const { headers } = await import('next/headers');
      const { getNonceAttr } = await import('../../../lib/security/nonce');

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(headers).mockImplementation(() => {
        throw new Error('headers() can only be called in Server Components');
      });

      const attr = getNonceAttr();
      expect(attr).toEqual({});

      consoleWarnSpy.mockRestore();
    });
  });
});
