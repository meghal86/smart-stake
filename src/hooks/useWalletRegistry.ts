/**
 * useWalletRegistry Hook
 * 
 * Persistent multi-wallet management for Guardian and Portfolio.
 * Automatically syncs connected wallets with Supabase.
 * Supports watch-only wallets (no signing required).
 */

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { supabase } from '@/lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  walletKeys,
  getWalletAddressDependentQueryKeys,
} from '@/lib/query-keys'

export interface UserWallet {
  id: string
  user_id: string
  address: string
  label?: string
  chain: string
  source?: string
  verified: boolean
  last_scan?: string
  trust_score?: number
  risk_flags?: unknown[]
  created_at: string
  updated_at: string
}

export interface AddWalletOptions {
  address: string
  label?: string
  chain?: string
  source?: string
}

/**
 * Hook for managing user's wallet registry
 */
export function useWalletRegistry() {
  const queryClient = useQueryClient()
  const { address: connectedAddress, connector, isConnected } = useAccount()
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true)

  // Get current user from Supabase auth
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch wallets from Supabase
  const { 
    data: wallets = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: walletKeys.registry(),
    queryFn: async (): Promise<UserWallet[]> => {
      if (!userId) return []

      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch wallets:', error)
        throw error
      }

      return data || []
    },
    enabled: !!userId,
    staleTime: 30_000, // 30 seconds
  })

  // Add wallet mutation
  const addWalletMutation = useMutation({
    mutationFn: async (options: AddWalletOptions) => {
      if (!userId) throw new Error('User not authenticated')

      const normalizedAddress = options.address.toLowerCase()

      // Check if wallet already exists
      const existing = wallets.find(
        w => w.address.toLowerCase() === normalizedAddress && w.chain === (options.chain || 'ethereum')
      )

      if (existing) {
        // Update label if provided
        if (options.label) {
          const { data, error } = await supabase
            .from('user_wallets')
            .update({ label: options.label, updated_at: new Date().toISOString() })
            .eq('id', existing.id)
            .select()
            .single()

          if (error) throw error
          return data
        }
        return existing
      }

      // Insert new wallet
      const { data, error } = await supabase
        .from('user_wallets')
        .insert({
          user_id: userId,
          address: normalizedAddress,
          label: options.label,
          chain: options.chain || 'ethereum',
          source: options.source || 'manual',
          verified: false,
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to add wallet:', error)
        throw error
      }

      return data
    },
    onSuccess: (data) => {
      // Invalidate wallet registry (primary query)
      queryClient.invalidateQueries({ queryKey: walletKeys.registry() })
      
      // Invalidate all queries dependent on this wallet address
      const keysToInvalidate = getWalletAddressDependentQueryKeys(data.address)
      keysToInvalidate.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    },
  })

  // Remove wallet mutation
  const removeWalletMutation = useMutation({
    mutationFn: async (walletId: string) => {
      if (!userId) throw new Error('User not authenticated')

      // Get wallet address before deletion for invalidation
      const walletToRemove = wallets.find(w => w.id === walletId)
      if (!walletToRemove) throw new Error('Wallet not found')

      const { error } = await supabase
        .from('user_wallets')
        .delete()
        .eq('id', walletId)
        .eq('user_id', userId)

      if (error) {
        console.error('Failed to remove wallet:', error)
        throw error
      }

      return walletToRemove
    },
    onSuccess: (removedWallet) => {
      // Invalidate wallet registry (primary query)
      queryClient.invalidateQueries({ queryKey: walletKeys.registry() })
      
      // Invalidate all queries dependent on this wallet address
      const keysToInvalidate = getWalletAddressDependentQueryKeys(removedWallet.address)
      keysToInvalidate.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    },
  })

  // Update wallet mutation
  const updateWalletMutation = useMutation({
    mutationFn: async ({ 
      walletId, 
      updates 
    }: { 
      walletId: string
      updates: Partial<Pick<UserWallet, 'label' | 'verified' | 'trust_score' | 'risk_flags'>>
    }) => {
      if (!userId) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('user_wallets')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', walletId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Failed to update wallet:', error)
        throw error
      }

      return data
    },
    onSuccess: (updatedWallet) => {
      // Invalidate wallet registry (primary query)
      queryClient.invalidateQueries({ queryKey: walletKeys.registry() })
      
      // Invalidate all queries dependent on this wallet address
      const keysToInvalidate = getWalletAddressDependentQueryKeys(updatedWallet.address)
      keysToInvalidate.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    },
  })

  // Auto-sync connected wallet from RainbowKit/wagmi
  useEffect(() => {
    if (!autoSyncEnabled || !isConnected || !connectedAddress || !userId) return

    const syncConnectedWallet = async () => {
      const normalizedAddress = connectedAddress.toLowerCase()
      const alreadyAdded = wallets.some(
        w => w.address.toLowerCase() === normalizedAddress
      )

      if (!alreadyAdded) {
        console.log('🔗 Auto-syncing connected wallet:', connectedAddress)
        await addWalletMutation.mutateAsync({
          address: connectedAddress,
          label: connector?.name || 'Connected Wallet',
          chain: 'ethereum',
          source: 'rainbowkit',
        })
      }
    }

    syncConnectedWallet()
  }, [connectedAddress, isConnected, userId, autoSyncEnabled, connector])

  // Helper functions
  const addWallet = useCallback(
    async (options: AddWalletOptions) => {
      return addWalletMutation.mutateAsync(options)
    },
    [addWalletMutation]
  )

  const removeWallet = useCallback(
    async (walletId: string) => {
      return removeWalletMutation.mutateAsync(walletId)
    },
    [removeWalletMutation]
  )

  const updateWallet = useCallback(
    async (walletId: string, updates: Partial<Pick<UserWallet, 'label' | 'verified' | 'trust_score' | 'risk_flags'>>) => {
      return updateWalletMutation.mutateAsync({ walletId, updates })
    },
    [updateWalletMutation]
  )

  const refreshWallets = useCallback(async () => {
    await refetch()
  }, [refetch])

  const getWalletById = useCallback(
    (walletId: string) => {
      return wallets.find(w => w.id === walletId)
    },
    [wallets]
  )

  const getWalletByAddress = useCallback(
    (address: string, chain: string = 'ethereum') => {
      return wallets.find(
        w => w.address.toLowerCase() === address.toLowerCase() && w.chain === chain
      )
    },
    [wallets]
  )

  return {
    // Data
    wallets,
    isLoading,
    error,
    userId,
    connectedAddress,
    isConnected,
    
    // Mutations
    addWallet,
    removeWallet,
    updateWallet,
    refreshWallets,
    
    // Helpers
    getWalletById,
    getWalletByAddress,
    
    // State
    isAdding: addWalletMutation.isPending,
    isRemoving: removeWalletMutation.isPending,
    isUpdating: updateWalletMutation.isPending,
    
    // Settings
    autoSyncEnabled,
    setAutoSyncEnabled,
  }
}

/**
 * Hook to get a specific wallet by ID
 */
export function useWallet(walletId: string | undefined) {
  const { wallets, isLoading } = useWalletRegistry()
  
  const wallet = wallets.find(w => w.id === walletId)
  
  return {
    wallet,
    isLoading,
  }
}

/**
 * Hook to get wallets for a specific chain
 */
export function useWalletsByChain(chain: string = 'ethereum') {
  const { wallets, isLoading } = useWalletRegistry()
  
  const chainWallets = wallets.filter(w => w.chain === chain)
  
  return {
    wallets: chainWallets,
    isLoading,
  }
}




