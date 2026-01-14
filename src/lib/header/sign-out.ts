/**
 * Sign Out Handler for Unified Header System
 * 
 * Handles the S3 → S2 transition when user signs out:
 * - Clears Supabase JWT/session
 * - Clears wallet registry query cache
 * - Keeps wagmi wallet connection intact
 * - Header transitions to S2 showing wallet pill + "Save wallet" CTA
 * 
 * Requirements: 2.1, 2.4, 15.2
 */

import type { QueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

/**
 * Sign out handler with proper cache clearing
 * 
 * This function:
 * 1. Signs out from Supabase (clears JWT/session)
 * 2. Clears wallet registry query cache to prevent "ghost primary wallet"
 * 3. Keeps wagmi wallet connection intact
 * 
 * After sign out:
 * - If wallet is still connected: Header shows S2 state (WalletPill + Save Wallet + Sign In)
 * - If wallet is disconnected: Header shows S0 state (Sign In + Connect Wallet)
 * 
 * @param queryClient - React Query client instance
 * @returns Promise that resolves when sign out is complete
 */
export async function handleSignOut(queryClient: QueryClient): Promise<void> {
  try {
    // 1. Sign out from Supabase (clears JWT/session only)
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }

    // 2. Clear wallet registry query cache
    // This prevents "ghost primary wallet" from showing after sign out
    queryClient.removeQueries({
      queryKey: ['wallets', 'registry'],
      exact: false,
    })

    // Also clear any user-specific wallet queries
    queryClient.removeQueries({
      queryKey: ['wallets'],
      exact: false,
    })

    // 3. Clear user metadata cache
    queryClient.removeQueries({
      queryKey: ['user', 'metadata'],
      exact: false,
    })

    // 4. Clear user preferences cache
    queryClient.removeQueries({
      queryKey: ['user', 'preferences'],
      exact: false,
    })

    // Note: We do NOT disconnect the wagmi wallet
    // The wallet connection persists, allowing the user to:
    // - See their wallet in the header (S2 state)
    // - Save the wallet to their account after signing back in
    
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

/**
 * Check if sign out should show "Save wallet" CTA
 * 
 * After sign out, if the user still has a wallet connected via wagmi,
 * the header should show the "Save wallet" CTA to allow them to
 * save the wallet to their account after signing back in.
 * 
 * @param hasWallet - Whether wagmi wallet is connected
 * @returns true if "Save wallet" CTA should be shown
 */
export function shouldShowSaveWalletAfterSignOut(hasWallet: boolean): boolean {
  return hasWallet
}

/**
 * Get expected session state after sign out
 * 
 * @param hasWallet - Whether wagmi wallet is connected
 * @returns Expected session state after sign out
 */
export function getSessionStateAfterSignOut(hasWallet: boolean): 'S0_GUEST' | 'S2_WALLET' {
  return hasWallet ? 'S2_WALLET' : 'S0_GUEST'
}
