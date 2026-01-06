/**
 * Tests for useWalletQuota Hook
 * 
 * Tests the hook that fetches wallet quota information from the wallets-list Edge Function.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useWalletQuota } from '../useWalletQuota'

// Mock the AuthProvider
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    session: {
      user: { id: 'test-user-id' },
      access_token: 'test-token',
    },
  }),
}))

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => {
    const React = require('react')
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    )
  }
}

describe('useWalletQuota Hook', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
    
    // Mock fetch globally
    global.fetch = vi.fn()
  })

  test('fetches quota data successfully', async () => {
    const mockQuotaData = {
      wallets: [],
      quota: {
        used_addresses: 2,
        used_rows: 4,
        total: 5,
        plan: 'free',
      },
      active_hint: { primary_wallet_id: null },
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuotaData,
    })

    const { result } = renderHook(() => useWalletQuota(), {
      wrapper: createWrapper(),
    })

    // Initially loading
    expect(result.current.isLoading).toBe(true)
    expect(result.current.quota).toBeNull()

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify quota data
    expect(result.current.quota).toEqual({
      used_addresses: 2,
      used_rows: 4,
      total: 5,
      plan: 'free',
    })
    expect(result.current.error).toBeNull()
  })

  test('handles fetch errors gracefully', async () => {
    const mockError = new Error('Network error')
    ;(global.fetch as any).mockRejectedValueOnce(mockError)

    const { result } = renderHook(() => useWalletQuota(), {
      wrapper: createWrapper(),
    })

    // Wait for error
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify error state
    expect(result.current.error).toBeDefined()
    expect(result.current.quota).toBeNull()
  })

  test('handles non-ok response status', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Unauthorized',
    })

    const { result } = renderHook(() => useWalletQuota(), {
      wrapper: createWrapper(),
    })

    // Wait for error
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify error state
    expect(result.current.error).toBeDefined()
    expect(result.current.quota).toBeNull()
  })

  test('includes correct authorization header', async () => {
    const mockQuotaData = {
      wallets: [],
      quota: {
        used_addresses: 0,
        used_rows: 0,
        total: 5,
        plan: 'free',
      },
      active_hint: { primary_wallet_id: null },
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuotaData,
    })

    renderHook(() => useWalletQuota(), {
      wrapper: createWrapper(),
    })

    // Wait for fetch to be called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    // Verify fetch was called with correct headers
    expect(global.fetch).toHaveBeenCalledWith(
      '/functions/v1/wallets-list',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
      })
    )
  })

  test('returns quota with correct structure', async () => {
    const mockQuotaData = {
      wallets: [],
      quota: {
        used_addresses: 3,
        used_rows: 5,
        total: 20,
        plan: 'pro',
      },
      active_hint: { primary_wallet_id: 'wallet-123' },
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuotaData,
    })

    const { result } = renderHook(() => useWalletQuota(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify quota structure
    expect(result.current.quota).toHaveProperty('used_addresses')
    expect(result.current.quota).toHaveProperty('used_rows')
    expect(result.current.quota).toHaveProperty('total')
    expect(result.current.quota).toHaveProperty('plan')

    // Verify values
    expect(result.current.quota?.used_addresses).toBe(3)
    expect(result.current.quota?.used_rows).toBe(5)
    expect(result.current.quota?.total).toBe(20)
    expect(result.current.quota?.plan).toBe('pro')
  })

  test('provides refetch function', async () => {
    const mockQuotaData = {
      wallets: [],
      quota: {
        used_addresses: 1,
        used_rows: 1,
        total: 5,
        plan: 'free',
      },
      active_hint: { primary_wallet_id: null },
    }

    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockQuotaData,
    })

    const { result } = renderHook(() => useWalletQuota(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify refetch function exists
    expect(result.current.refetch).toBeDefined()
    expect(typeof result.current.refetch).toBe('function')

    // Call refetch
    const refetchResult = await result.current.refetch()
    expect(refetchResult).toBeDefined()
  })
})

