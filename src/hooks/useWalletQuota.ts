/**
 * useWalletQuota Hook
 * 
 * Retrieves wallet quota information from the wallets-list Edge Function.
 * Displays quota usage (used_addresses, used_rows, total) for the user's plan.
 * 
 * Requirement 7.7: The UI SHALL display quota usage (used_addresses, used_rows, total)
 */

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'

export interface WalletQuotaData {
  used_addresses: number
  used_rows: number
  total: number
  plan: string
}

export interface UseWalletQuotaResult {
  quota: WalletQuotaData | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<any>
}

/**
 * Hook to fetch wallet quota information
 * 
 * Returns quota data including:
 * - used_addresses: Number of unique wallet addresses
 * - used_rows: Total number of wallet rows (address + network combinations)
 * - total: Total quota limit for the user's plan
 * - plan: User's plan (free, pro, enterprise)
 */
export function useWalletQuota(): UseWalletQuotaResult {
  const { session } = useAuth()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['wallet-quota', session?.user?.id],
    queryFn: async () => {
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Get the access token from the session
      const accessToken = session.access_token

      const response = await fetch('/functions/v1/wallets-list', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch quota: ${response.statusText}`)
      }

      const data = await response.json()
      return data.quota as WalletQuotaData
    },
    enabled: !!session,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  return {
    quota: data || null,
    isLoading,
    error: error instanceof Error ? error : null,
    refetch,
  }
}

