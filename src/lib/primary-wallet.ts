/**
 * Primary Wallet Management Utilities
 * 
 * Handles client-side logic for primary wallet operations.
 * All mutations are performed via Edge Functions for atomicity and security.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

/**
 * Set a wallet as the primary wallet for the authenticated user
 * 
 * @param walletId - UUID of the wallet to set as primary
 * @returns Success response with wallet_id or error
 */
export async function setPrimaryWallet(walletId: string): Promise<{
  success: boolean
  wallet_id?: string
  error?: {
    code: string
    message: string
  }
}> {
  try {
    // Get the current session to ensure user is authenticated
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User is not authenticated',
        },
      }
    }

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke(
      'wallets-set-primary',
      {
        body: {
          wallet_id: walletId,
        },
      }
    )

    if (error) {
      console.error('Error setting primary wallet:', error)
      return {
        success: false,
        error: {
          code: 'FUNCTION_ERROR',
          message: error.message || 'Failed to set primary wallet',
        },
      }
    }

    return {
      success: true,
      wallet_id: data?.wallet_id,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    console.error('Unexpected error in setPrimaryWallet:', error)
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message,
      },
    }
  }
}

/**
 * Validate that a wallet ID is a valid UUID
 * 
 * @param walletId - The wallet ID to validate
 * @returns true if valid UUID format, false otherwise
 */
export function isValidWalletId(walletId: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidPattern.test(walletId)
}

/**
 * Type for wallet data from the database
 */
export interface Wallet {
  id: string
  user_id: string
  address: string
  chain_namespace: string
  is_primary: boolean
  created_at: string
  updated_at: string
  label?: string
  guardian_scores?: Record<string, unknown>
  balance_cache?: Record<string, unknown>
}

/**
 * Find the best candidate for primary wallet from a list of wallets
 * Priority: eip155:1 (Ethereum mainnet) → oldest by created_at → smallest id
 * 
 * @param wallets - Array of wallets to choose from
 * @returns The wallet ID of the best candidate, or null if no wallets
 */
export function findBestPrimaryCandidate(wallets: Wallet[]): string | null {
  if (wallets.length === 0) {
    return null
  }

  // First priority: eip155:1 (Ethereum mainnet)
  const ethereumWallet = wallets.find(w => w.chain_namespace === 'eip155:1')
  if (ethereumWallet) {
    return ethereumWallet.id
  }

  // Second priority: oldest by created_at
  let oldestWallet = wallets[0]
  for (const wallet of wallets) {
    const walletDate = new Date(wallet.created_at).getTime()
    const oldestDate = new Date(oldestWallet.created_at).getTime()

    if (walletDate < oldestDate) {
      oldestWallet = wallet
    } else if (walletDate === oldestDate && wallet.id < oldestWallet.id) {
      // Tiebreaker: smallest id
      oldestWallet = wallet
    }
  }

  return oldestWallet.id
}

/**
 * Get the primary wallet from a list of wallets
 * 
 * @param wallets - Array of wallets
 * @returns The primary wallet, or null if none is marked as primary
 */
export function getPrimaryWallet(wallets: Wallet[]): Wallet | null {
  return wallets.find(w => w.is_primary) || null
}

/**
 * Check if a wallet is the primary wallet
 * 
 * @param wallet - The wallet to check
 * @returns true if the wallet is marked as primary
 */
export function isPrimaryWallet(wallet: Wallet): boolean {
  return wallet.is_primary === true
}
