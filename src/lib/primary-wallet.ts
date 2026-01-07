/**
 * Primary Wallet Management Utilities
 * 
 * Implements address-level primary wallet semantics where:
 * - Primary is set at the address level (one representative row marked)
 * - When choosing a representative row, prefer: activeNetwork → eip155:1 → oldest
 * 
 * @see .kiro/specs/multi-chain-wallet-system/requirements.md - Requirement 8
 * @see .kiro/specs/multi-chain-wallet-system/design.md - Primary Semantics
 */

export interface WalletRow {
  id: string
  address: string
  chain_namespace: string
  created_at: string
  is_primary: boolean
}

/**
 * Extended wallet interface for property tests
 */
export interface Wallet extends WalletRow {
  user_id: string
  updated_at: string
}

/**
 * Find the best representative row for an address to mark as primary
 * 
 * Priority order:
 * 1. Row matching activeNetwork (if provided)
 * 2. Row with chain_namespace = 'eip155:1' (Ethereum mainnet)
 * 3. Oldest row by created_at (tiebreaker: smallest id)
 * 
 * @param wallets - All wallet rows for the address
 * @param activeNetwork - Current active network (optional)
 * @returns The ID of the best representative row, or null if no wallets
 */
export function findBestPrimaryRepresentative(
  wallets: WalletRow[],
  activeNetwork?: string
): string | null {
  if (wallets.length === 0) {
    return null
  }

  // Priority 1: Row matching activeNetwork
  if (activeNetwork) {
    const activeNetworkWallet = wallets.find(w => w.chain_namespace === activeNetwork)
    if (activeNetworkWallet) {
      return activeNetworkWallet.id
    }
  }

  // Priority 2: Row with eip155:1 (Ethereum mainnet)
  const ethereumWallet = wallets.find(w => w.chain_namespace === 'eip155:1')
  if (ethereumWallet) {
    return ethereumWallet.id
  }

  // Priority 3: Oldest by created_at (tiebreaker: smallest id)
  let bestWallet = wallets[0]
  for (const wallet of wallets) {
    const bestTime = new Date(bestWallet.created_at).getTime()
    const walletTime = new Date(wallet.created_at).getTime()

    if (walletTime < bestTime) {
      bestWallet = wallet
    } else if (walletTime === bestTime && wallet.id < bestWallet.id) {
      // Tiebreaker: smallest id
      bestWallet = wallet
    }
  }

  return bestWallet.id
}

/**
 * Find the best candidate for primary reassignment when a primary wallet is deleted
 * 
 * Priority order:
 * 1. Row with chain_namespace = 'eip155:1' (Ethereum mainnet)
 * 2. Oldest row by created_at (tiebreaker: smallest id)
 * 3. If no other rows exist for that address, pick from another address
 * 
 * @param wallets - All remaining wallet rows for the user
 * @returns The ID of the best candidate, or null if no wallets
 */
export function findBestPrimaryReassignmentCandidate(
  wallets: WalletRow[]
): string | null {
  if (wallets.length === 0) {
    return null
  }

  // Priority 1: Row with eip155:1 (Ethereum mainnet)
  const ethereumWallet = wallets.find(w => w.chain_namespace === 'eip155:1')
  if (ethereumWallet) {
    return ethereumWallet.id
  }

  // Priority 2: Oldest by created_at (tiebreaker: smallest id)
  let bestWallet = wallets[0]
  for (const wallet of wallets) {
    const bestTime = new Date(bestWallet.created_at).getTime()
    const walletTime = new Date(wallet.created_at).getTime()

    if (walletTime < bestTime) {
      bestWallet = wallet
    } else if (walletTime === bestTime && wallet.id < bestWallet.id) {
      // Tiebreaker: smallest id
      bestWallet = wallet
    }
  }

  return bestWallet.id
}

/**
 * Alias for findBestPrimaryReassignmentCandidate for backward compatibility
 * Used in property tests
 */
export function findBestPrimaryCandidate(wallets: Wallet[]): string | null {
  return findBestPrimaryReassignmentCandidate(wallets)
}

/**
 * Get the primary wallet from a list of wallets
 * 
 * @param wallets - List of wallets
 * @returns The primary wallet if found, undefined otherwise
 */
export function getPrimaryWallet(wallets: Wallet[]): Wallet | undefined {
  return wallets.find(w => w.is_primary === true)
}

/**
 * Check if a wallet is marked as primary
 * 
 * @param wallet - Wallet to check
 * @returns true if wallet is marked as primary, false otherwise
 */
export function isPrimaryWallet(wallet: Wallet): boolean {
  return wallet.is_primary === true
}

/**
 * Validate that a user has exactly one primary wallet
 * 
 * @param wallets - All wallet rows for the user
 * @returns true if exactly one primary wallet exists, false otherwise
 */
export function hasExactlyOnePrimary(wallets: WalletRow[]): boolean {
  const primaryCount = wallets.filter(w => w.is_primary).length
  return primaryCount === 1
}

/**
 * Get all unique addresses from wallet rows (case-insensitive)
 * 
 * @param wallets - Wallet rows
 * @returns Array of unique addresses (lowercase)
 */
export function getUniqueAddresses(wallets: WalletRow[]): string[] {
  const uniqueAddresses = new Set(wallets.map(w => w.address.toLowerCase()))
  return Array.from(uniqueAddresses)
}

/**
 * Get all wallet rows for a specific address (case-insensitive)
 * 
 * @param wallets - All wallet rows
 * @param address - Address to filter by
 * @returns Wallet rows for the address
 */
export function getWalletsForAddress(wallets: WalletRow[], address: string): WalletRow[] {
  const lowerAddress = address.toLowerCase()
  return wallets.filter(w => w.address.toLowerCase() === lowerAddress)
}

/**
 * Verify address-level primary semantics
 * 
 * For each unique address, there should be at most one primary wallet row.
 * 
 * @param wallets - All wallet rows for the user
 * @returns true if address-level semantics are valid, false otherwise
 */
export function verifyAddressLevelPrimarySemantics(wallets: WalletRow[]): boolean {
  const uniqueAddresses = getUniqueAddresses(wallets)

  for (const address of uniqueAddresses) {
    const addressWallets = getWalletsForAddress(wallets, address)
    const primaryCount = addressWallets.filter(w => w.is_primary).length

    // Each address should have at most one primary
    if (primaryCount > 1) {
      console.error(`Address ${address} has ${primaryCount} primary wallets (should be 0 or 1)`)
      return false
    }
  }

  return true
}

