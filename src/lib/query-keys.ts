/**
 * Query Keys - Standardized React Query key factory
 * 
 * Provides centralized query key definitions for all modules to ensure
 * consistent invalidation patterns and cross-module reactivity.
 * 
 * Feature: multi-chain-wallet-system
 * Task: 11 - React Query Integration
 * Validates: Module Integration Contract
 * 
 * @see .kiro/specs/multi-chain-wallet-system/design.md - React Query Integration
 */

/**
 * Query key factory for wallet registry
 */
export const walletKeys = {
  all: ['wallets'] as const,
  registry: () => [...walletKeys.all, 'registry'] as const,
  byId: (id: string) => [...walletKeys.all, 'byId', id] as const,
  byAddress: (address: string) => [...walletKeys.all, 'byAddress', address] as const,
};

/**
 * Query key factory for Guardian module
 */
export const guardianKeys = {
  all: ['guardian'] as const,
  scan: (activeWallet: string | null, activeNetwork: string) =>
    [...guardianKeys.all, 'scan', activeWallet, activeNetwork] as const,
  scores: (activeWallet: string | null, activeNetwork: string) =>
    [...guardianKeys.all, 'scores', activeWallet, activeNetwork] as const,
  summary: (activeWallet: string | null) =>
    [...guardianKeys.all, 'summary', activeWallet] as const,
};

/**
 * Query key factory for Hunter module
 */
export const hunterKeys = {
  all: ['hunter'] as const,
  feed: (activeWallet: string | null, activeNetwork: string) =>
    [...hunterKeys.all, 'feed', activeWallet, activeNetwork] as const,
  opportunities: (activeWallet: string | null, activeNetwork: string) =>
    [...hunterKeys.all, 'opportunities', activeWallet, activeNetwork] as const,
  alerts: (activeWallet: string | null) =>
    [...hunterKeys.all, 'alerts', activeWallet] as const,
};

/**
 * Query key factory for HarvestPro module
 */
export const harvestproKeys = {
  all: ['harvestpro'] as const,
  opportunities: (activeWallet: string | null, activeNetwork: string) =>
    [...harvestproKeys.all, 'opportunities', activeWallet, activeNetwork] as const,
  sessions: (activeWallet: string | null) =>
    [...harvestproKeys.all, 'sessions', activeWallet] as const,
  session: (sessionId: string) =>
    [...harvestproKeys.all, 'session', sessionId] as const,
};

/**
 * Query key factory for portfolio data
 */
export const portfolioKeys = {
  all: ['portfolio'] as const,
  balances: (activeWallet: string | null, activeNetwork: string) =>
    [...portfolioKeys.all, 'balances', activeWallet, activeNetwork] as const,
  summary: (activeWallet: string | null) =>
    [...portfolioKeys.all, 'summary', activeWallet] as const,
  nfts: (activeWallet: string | null, activeNetwork: string) =>
    [...portfolioKeys.all, 'nfts', activeWallet, activeNetwork] as const,
};

/**
 * Query key factory for price data
 */
export const priceKeys = {
  all: ['prices'] as const,
  token: (tokenId: string) => [...priceKeys.all, 'token', tokenId] as const,
  tokens: (tokenIds: string[]) =>
    [...priceKeys.all, 'tokens', ...tokenIds.sort()] as const,
};

/**
 * Get all query keys that depend on wallet context
 * Used for invalidation when wallet or network changes
 */
export function getWalletDependentQueryKeys(
  activeWallet: string | null,
  activeNetwork: string
): (readonly string[])[] {
  return [
    walletKeys.registry(),
    guardianKeys.scan(activeWallet, activeNetwork),
    guardianKeys.scores(activeWallet, activeNetwork),
    guardianKeys.summary(activeWallet),
    hunterKeys.feed(activeWallet, activeNetwork),
    hunterKeys.opportunities(activeWallet, activeNetwork),
    hunterKeys.alerts(activeWallet),
    harvestproKeys.opportunities(activeWallet, activeNetwork),
    harvestproKeys.sessions(activeWallet),
    portfolioKeys.balances(activeWallet, activeNetwork),
    portfolioKeys.summary(activeWallet),
    portfolioKeys.nfts(activeWallet, activeNetwork),
  ];
}

/**
 * Get all query keys that depend on network context
 * Used for invalidation when network changes
 */
export function getNetworkDependentQueryKeys(
  activeWallet: string | null,
  activeNetwork: string
): (readonly string[])[] {
  return [
    guardianKeys.scan(activeWallet, activeNetwork),
    guardianKeys.scores(activeWallet, activeNetwork),
    hunterKeys.feed(activeWallet, activeNetwork),
    hunterKeys.opportunities(activeWallet, activeNetwork),
    harvestproKeys.opportunities(activeWallet, activeNetwork),
    portfolioKeys.balances(activeWallet, activeNetwork),
    portfolioKeys.nfts(activeWallet, activeNetwork),
  ];
}

/**
 * Get all query keys that depend on wallet address
 * Used for invalidation when wallet is added/removed
 */
export function getWalletAddressDependentQueryKeys(
  walletAddress: string
): (readonly string[])[] {
  return [
    walletKeys.registry(),
    walletKeys.byAddress(walletAddress),
    guardianKeys.summary(walletAddress),
    hunterKeys.alerts(walletAddress),
    harvestproKeys.sessions(walletAddress),
    portfolioKeys.summary(walletAddress),
  ];
}
