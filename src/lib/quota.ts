/**
 * Quota Management Utilities
 * 
 * Handles plan-based wallet quota enforcement that counts unique addresses,
 * not rows. This ensures users can add the same address on multiple networks
 * without consuming additional quota.
 * 
 * Quota Semantics:
 * - Quota counts UNIQUE ADDRESSES (case-insensitive), not (address, network) rows
 * - Example: Adding 0xabc on Ethereum + Polygon = 1 quota unit (not 2)
 * - Example: Adding 0xdef on Ethereum = 2 quota units (new address)
 * - Adding existing address on new network does NOT consume quota
 * - Adding new address checks quota BEFORE insertion
 */

/**
 * Wallet row from database
 */
export interface WalletRow {
  id: string
  address: string
  chain_namespace: string
  is_primary?: boolean
  created_at?: string
}

/**
 * Quota information
 */
export interface QuotaInfo {
  used_addresses: number
  used_rows: number
  total: number
  plan: string
}

/**
 * Plan-based quota limits
 */
const QUOTA_LIMITS: Record<string, number> = {
  'free': 5,
  'pro': 20,
  'enterprise': 1000,
}

/**
 * Count unique addresses (case-insensitive) in a wallet list
 * 
 * Property 10: Quota Enforcement Logic
 * For any wallet list, counting unique addresses should be case-insensitive
 * and consistent regardless of input order.
 * 
 * @param wallets - Array of wallet rows
 * @returns Number of unique addresses (case-insensitive)
 */
export function countUniqueAddresses(wallets: WalletRow[]): number {
  const uniqueAddresses = new Set(
    wallets.map(w => w.address.toLowerCase())
  )
  return uniqueAddresses.size
}

/**
 * Get quota limit for a given plan
 * 
 * @param plan - User's plan (free, pro, enterprise)
 * @returns Quota limit for the plan
 */
export function getQuotaLimit(plan: string): number {
  return QUOTA_LIMITS[plan] || QUOTA_LIMITS['free']
}

/**
 * Check if adding a new address would exceed quota
 * 
 * Property 10: Quota Enforcement Logic
 * For any wallet addition operation, quota should be checked before allowing
 * new address additions, and quota limits should be enforced server-side.
 * 
 * @param wallets - Current user's wallets
 * @param newAddress - Address being added
 * @param plan - User's plan
 * @returns Object with canAdd flag and remaining quota
 */
export function canAddAddress(
  wallets: WalletRow[],
  newAddress: string,
  plan: string
): { canAdd: boolean; used: number; limit: number; remaining: number } {
  // Check if address already exists (case-insensitive)
  const addressExists = wallets.some(
    w => w.address.toLowerCase() === newAddress.toLowerCase()
  )

  // If address already exists, it can be added on another network without quota check
  if (addressExists) {
    const used = countUniqueAddresses(wallets)
    const limit = getQuotaLimit(plan)
    return {
      canAdd: true,
      used,
      limit,
      remaining: limit - used,
    }
  }

  // If new address, check if adding it would exceed quota
  const currentUnique = countUniqueAddresses(wallets)
  const limit = getQuotaLimit(plan)
  const wouldExceed = currentUnique >= limit

  return {
    canAdd: !wouldExceed,
    used: currentUnique,
    limit,
    remaining: limit - currentUnique,
  }
}

/**
 * Calculate quota information for a user
 * 
 * @param wallets - User's wallets
 * @param plan - User's plan
 * @returns Quota information
 */
export function calculateQuota(wallets: WalletRow[], plan: string): QuotaInfo {
  const usedAddresses = countUniqueAddresses(wallets)
  const usedRows = wallets.length
  const total = getQuotaLimit(plan)

  return {
    used_addresses: usedAddresses,
    used_rows: usedRows,
    total,
    plan,
  }
}

/**
 * Check if a user has reached their quota limit
 * 
 * @param wallets - User's wallets
 * @param plan - User's plan
 * @returns true if quota is reached, false otherwise
 */
export function isQuotaReached(wallets: WalletRow[], plan: string): boolean {
  const used = countUniqueAddresses(wallets)
  const limit = getQuotaLimit(plan)
  return used >= limit
}

/**
 * Get unique addresses from wallet list (case-insensitive)
 * 
 * @param wallets - User's wallets
 * @returns Array of unique addresses (lowercase)
 */
export function getUniqueAddresses(wallets: WalletRow[]): string[] {
  const uniqueAddresses = new Set(
    wallets.map(w => w.address.toLowerCase())
  )
  return Array.from(uniqueAddresses)
}

/**
 * Get all networks for a specific address
 * 
 * @param wallets - User's wallets
 * @param address - Address to find networks for
 * @returns Array of chain namespaces for the address
 */
export function getNetworksForAddress(
  wallets: WalletRow[],
  address: string
): string[] {
  return wallets
    .filter(w => w.address.toLowerCase() === address.toLowerCase())
    .map(w => w.chain_namespace)
}

/**
 * Check if an address is already registered on a specific network
 * 
 * @param wallets - User's wallets
 * @param address - Address to check
 * @param chainNamespace - Network to check
 * @returns true if address exists on network, false otherwise
 */
export function addressExistsOnNetwork(
  wallets: WalletRow[],
  address: string,
  chainNamespace: string
): boolean {
  return wallets.some(
    w =>
      w.address.toLowerCase() === address.toLowerCase() &&
      w.chain_namespace === chainNamespace
  )
}
