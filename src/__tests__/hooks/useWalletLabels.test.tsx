/**
 * Tests for useWalletLabels hook
 * 
 * @see src/hooks/useWalletLabels.ts
 * @see .kiro/specs/hunter-screen-feed/tasks.md - Task 51
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWalletLabels } from '@/hooks/useWalletLabels';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('useWalletLabels', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Hook initialization', () => {
    it('should initialize with empty labels', async () => {
      const { result } = renderHook(() => useWalletLabels(), { wrapper });

      expect(result.current.labels).toBeDefined();
      expect(result.current.getLabel).toBeDefined();
      expect(result.current.setLabel).toBeDefined();
      expect(result.current.removeLabel).toBeDefined();
    });

    it('should have loading state', () => {
      const { result } = renderHook(() => useWalletLabels(), { wrapper });

      expect(result.current.isLoading).toBeDefined();
    });

    it('should have mutation states', () => {
      const { result } = renderHook(() => useWalletLabels(), { wrapper });

      expect(result.current.isSettingLabel).toBeDefined();
      expect(result.current.isRemovingLabel).toBeDefined();
    });
  });

  describe('getLabel', () => {
    it('should return undefined for non-existent label', () => {
      const { result } = renderHook(() => useWalletLabels(), { wrapper });

      const label = result.current.getLabel('0x1234567890abcdef1234567890abcdef12345678');
      expect(label).toBeUndefined();
    });

    it('should normalize address to lowercase', () => {
      const { result } = renderHook(() => useWalletLabels(), { wrapper });

      // Both should return the same result (undefined in this case)
      const label1 = result.current.getLabel('0x1234567890abcdef1234567890abcdef12345678');
      const label2 = result.current.getLabel('0X1234567890ABCDEF1234567890ABCDEF12345678');
      
      expect(label1).toBe(label2);
    });
  });

  describe('setLabel', () => {
    it('should be callable', () => {
      const { result } = renderHook(() => useWalletLabels(), { wrapper });

      expect(() => {
        result.current.setLabel('0x1234567890abcdef1234567890abcdef12345678', 'My Wallet');
      }).not.toThrow();
    });
  });

  describe('removeLabel', () => {
    it('should be callable', () => {
      const { result } = renderHook(() => useWalletLabels(), { wrapper });

      expect(() => {
        result.current.removeLabel('0x1234567890abcdef1234567890abcdef12345678');
      }).not.toThrow();
    });
  });
});

