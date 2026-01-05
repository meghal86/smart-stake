/**
 * Wallet Shape Adapter
 * Transforms database rows (one per address/network tuple) into UI-friendly grouped wallet shape
 * 
 * Requirement 19: Database-to-UI Shape Adapter
 * - Groups rows by address (case-insensitive)
 * - Creates ConnectedWallet objects with networks array
 * - Handles missing wallet-network combinations gracefully
 * - Prevents duplicate addresses in final array
 * - Merges guardian scores and balance cache by network
 * - Preserves original address casing from server
 */

import { UserWallet, ConnectedWallet } from '@/types/wallet-registry';

/**
 * Groups database wallet rows by address (case-insensitive) and transforms into UI shape
 * 
 * @param rows - Array of database wallet rows (one per address/network combination)
 * @returns Array of ConnectedWallet objects grouped by address
 * 
 * Example:
 * Input:
 *   [
 *     { address: "0xabc", chain_namespace: "eip155:1", is_primary: true },
 *     { address: "0xabc", chain_namespace: "eip155:137", is_primary: false },
 *     { address: "0xdef", chain_namespace: "eip155:1", is_primary: false }
 *   ]
 * 
 * Output:
 *   [
 *     { address: "0xabc", networks: ["eip155:1", "eip155:137"], is_primary: true },
 *     { address: "0xdef", networks: ["eip155:1"], is_primary: false }
 *   ]
 */
export function adaptWalletRows(rows: UserWallet[]): ConnectedWallet[] {
  if (!rows || rows.length === 0) {
    return [];
  }

  // Group rows by address (case-insensitive)
  // Map: lowercase address → { originalAddress, rows[] }
  const groupedByAddressLc = new Map<
    string,
    {
      originalAddress: string;
      rows: UserWallet[];
    }
  >();

  for (const row of rows) {
    const addressLc = row.address.toLowerCase();

    if (!groupedByAddressLc.has(addressLc)) {
      groupedByAddressLc.set(addressLc, {
        originalAddress: row.address, // Preserve original casing
        rows: [],
      });
    }

    groupedByAddressLc.get(addressLc)!.rows.push(row);
  }

  // Transform each group into a ConnectedWallet
  const connectedWallets: ConnectedWallet[] = [];

  for (const { originalAddress, rows: addressRows } of groupedByAddressLc.values()) {
    // Extract networks from all rows for this address
    const networks = addressRows.map((row) => row.chain_namespace).filter(Boolean);

    // Determine if this address is primary (any row marked as primary)
    const isPrimary = addressRows.some((row) => row.is_primary === true);

    // Merge guardian scores and balance cache from all networks
    const mergedGuardianScores: Record<string, number> = {};
    const mergedBalanceCache: Record<string, unknown> = {};

    for (const row of addressRows) {
      if (row.guardian_scores) {
        Object.assign(mergedGuardianScores, row.guardian_scores);
      }
      if (row.balance_cache) {
        Object.assign(mergedBalanceCache, row.balance_cache);
      }
    }

    // Get the most recent timestamps
    const createdAt = addressRows.reduce((earliest, row) => {
      return new Date(row.created_at) < new Date(earliest) ? row.created_at : earliest;
    }, addressRows[0].created_at);

    const updatedAt = addressRows.reduce((latest, row) => {
      return new Date(row.updated_at) > new Date(latest) ? row.updated_at : latest;
    }, addressRows[0].updated_at);

    const connectedWallet: ConnectedWallet = {
      address: originalAddress,
      networks,
      is_primary: isPrimary,
      guardian_scores: Object.keys(mergedGuardianScores).length > 0 ? mergedGuardianScores : undefined,
      balance_cache: Object.keys(mergedBalanceCache).length > 0 ? mergedBalanceCache : undefined,
      created_at: createdAt,
      updated_at: updatedAt,
    };

    connectedWallets.push(connectedWallet);
  }

  return connectedWallets;
}

/**
 * Checks if a wallet-network combination exists in the connected wallets
 * 
 * @param connectedWallets - Array of connected wallets
 * @param address - Wallet address to check
 * @param chainNamespace - Network chain namespace to check
 * @returns true if the wallet-network combination exists, false otherwise
 */
export function hasWalletNetwork(
  connectedWallets: ConnectedWallet[],
  address: string,
  chainNamespace: string
): boolean {
  const wallet = connectedWallets.find(
    (w) => w.address.toLowerCase() === address.toLowerCase()
  );

  if (!wallet) {
    return false;
  }

  return wallet.networks.includes(chainNamespace);
}

/**
 * Gets a specific wallet by address (case-insensitive)
 * 
 * @param connectedWallets - Array of connected wallets
 * @param address - Wallet address to find
 * @returns ConnectedWallet if found, undefined otherwise
 */
export function getWalletByAddress(
  connectedWallets: ConnectedWallet[],
  address: string
): ConnectedWallet | undefined {
  return connectedWallets.find(
    (w) => w.address.toLowerCase() === address.toLowerCase()
  );
}

/**
 * Gets the primary wallet from connected wallets
 * 
 * @param connectedWallets - Array of connected wallets
 * @returns Primary ConnectedWallet if found, undefined otherwise
 */
export function getPrimaryWallet(
  connectedWallets: ConnectedWallet[]
): ConnectedWallet | undefined {
  return connectedWallets.find((w) => w.is_primary === true);
}

/**
 * Gets all supported networks that a wallet is NOT registered on
 * Useful for showing "Add network" UI when user switches to unsupported network
 * 
 * @param wallet - ConnectedWallet to check
 * @param allSupportedNetworks - Array of all supported network chain namespaces
 * @returns Array of networks the wallet is not registered on
 */
export function getMissingNetworks(
  wallet: ConnectedWallet,
  allSupportedNetworks: string[]
): string[] {
  return allSupportedNetworks.filter(
    (network) => !wallet.networks.includes(network)
  );
}

/**
 * Checks if a wallet-network combination is missing (not registered)
 * 
 * @param wallet - ConnectedWallet to check
 * @param chainNamespace - Network chain namespace to check
 * @returns true if the wallet-network combination is missing, false if it exists
 */
export function isWalletNetworkMissing(
  wallet: ConnectedWallet,
  chainNamespace: string
): boolean {
  return !wallet.networks.includes(chainNamespace);
}
