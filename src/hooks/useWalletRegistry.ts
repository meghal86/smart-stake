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
  address_lc?: string
  label?: string
  chain_namespace: string
  network_metadata?: unknown
  balance_cache?: unknown
  guardian_scores?: unknown
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface AddWalletOptions {
  address: string
  label?: string
  chain_namespace?: string
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
      const chainNamespace = options.chain_namespace || 'eip155:1'

      // Check if wallet already exists (more robust check)
      const existing = wallets.find(
        w => w.address.toLowerCase() === normalizedAddress && w.chain_namespace === chainNamespace
      )

      if (existing) {
        console.log('Wallet already exists in registry, returning existing:', existing.address)
        // Update label if provided
        if (options.label && options.label !== existing.label) {
          const { data, error } = await supabase
            .from('user_wallets')
            .update({ label: options.label, updated_at: new Date().toISOString() })
            .eq('id', existing.id)
            .select()
            .single()

          if (error) {
            console.error('Failed to update wallet label:', error)
            // Return existing wallet even if label update fails
            return existing
          }
          return data
        }
        return existing
      }

      // Insert new wallet with duplicate handling
      const { data, error } = await supabase
        .from('user_wallets')
        .insert({
          user_id: userId,
          address: normalizedAddress,
          label: options.label,
          chain_namespace: chainNamespace,
          is_primary: false,
        })
        .select()
        .single()

      if (error) {
        // Handle duplicate key constraint violation gracefully
        if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('uq_user_wallets_user_addr_chain')) {
          console.log('Wallet already exists in database (duplicate key), fetching existing wallet')
          
          // Fetch the existing wallet from database
          const { data: existingData, error: fetchError } = await supabase
            .from('user_wallets')
            .select('*')
            .eq('user_id', userId)
            .eq('address', normalizedAddress)
            .eq('chain_namespace', chainNamespace)
            .single()
          
          if (fetchError) {
            console.error('Failed to fetch existing wallet after duplicate error:', fetchError)
            throw new Error('Wallet already exists but could not be retrieved')
          }
          
          return existingData
        }
        
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
      updates: Partial<Pick<UserWallet, 'label' | 'is_primary' | 'balance_cache' | 'guardian_scores'>>
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
        try {
          await addWalletMutation.mutateAsync({
            address: connectedAddress,
            label: connector?.name || 'Connected Wallet',
            chain_namespace: 'eip155:1',
          })
          console.log('✅ Successfully auto-synced wallet:', connectedAddress)
        } catch (err: any) {
          console.error('Failed to auto-sync wallet:', err)
          
          // Handle different error types gracefully
          const errorCode = err?.code || err?.error?.code
          const errorMessage = err?.message || err?.error?.message || ''
          
          // If it's a duplicate key error, the wallet already exists - treat as success
          if (errorCode === '23505' || 
              errorMessage.includes('duplicate key') || 
              errorMessage.includes('uq_user_wallets_user_addr_chain')) {
            console.log('✅ Wallet already exists in database, auto-sync complete')
            // Disable auto-sync temporarily to prevent further attempts
            setAutoSyncEnabled(false)
            // Re-enable after a delay to allow for future wallet connections
            setTimeout(() => setAutoSyncEnabled(true), 5000)
            return
          }
          
          // If it's a permission error, disable auto-sync to prevent loops
          if (errorCode === '42501' || errorMessage.includes('permission denied')) {
            console.error('❌ Permission denied. Disabling auto-sync to prevent loops.')
            setAutoSyncEnabled(false)
            return
          }
          
          // For other errors, disable auto-sync temporarily
          console.error('❌ Auto-sync failed with error:', errorCode, errorMessage)
          setAutoSyncEnabled(false)
          // Re-enable after a longer delay for other errors
          setTimeout(() => setAutoSyncEnabled(true), 10000)
        }
      }
    }

    // Add a small delay to prevent rapid-fire attempts
    const timeoutId = setTimeout(syncConnectedWallet, 100)
    return () => clearTimeout(timeoutId)
  }, [connectedAddress, isConnected, userId, autoSyncEnabled, connector, addWalletMutation, wallets])

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
    async (walletId: string, updates: Partial<Pick<UserWallet, 'label' | 'is_primary' | 'balance_cache' | 'guardian_scores'>>) => {
      return updateWalletMutation.mutateAsync({ walletId, updates })
    },
    [updateWalletMutation]
  )

  const setPrimaryWallet = useCallback(
    async (address: string) => {
      if (!userId) throw new Error('User not authenticated')
      
      console.log('🔄 Setting primary wallet:', address)
      
      // Find the wallet to set as primary
      const targetWallet = wallets.find(w => w.address.toLowerCase() === address.toLowerCase())
      if (!targetWallet) {
        throw new Error(`Wallet ${address} not found`)
      }
      
      // Update in database: set all to false, then set target to true
      const { error } = await supabase.rpc('set_primary_wallet', {
        p_user_id: userId,
        p_wallet_address: address.toLowerCase()
      })
      
      if (error) {
        console.error('Failed to set primary wallet:', error)
        throw error
      }
      
      // Invalidate queries to refresh
      queryClient.invalidateQueries({ queryKey: walletKeys.registry() })
      
      console.log('✅ Primary wallet set successfully')
    },
    [userId, wallets, queryClient]
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
    (address: string, chain_namespace: string = 'eip155:1') => {
      return wallets.find(
        w => w.address.toLowerCase() === address.toLowerCase() && w.chain_namespace === chain_namespace
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
    setPrimaryWallet,
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
export function useWalletsByChain(chain_namespace: string = 'eip155:1') {
  const { wallets, isLoading } = useWalletRegistry()
  
  const chainWallets = wallets.filter(w => w.chain_namespace === chain_namespace)
  
  return {
    wallets: chainWallets,
    isLoading,
  }
}




