/**
 * useAggregatedPortfolio Hook
 * 
 * Aggregates portfolio data across all registered wallets.
 * Integrates with wallet registry for unified multi-wallet view.
 */

import { useQuery } from '@tanstack/react-query'
import { useWalletRegistry } from './useWalletRegistry'
import { supabase } from '@/lib/supabase'

interface WalletBalance {
  walletId: string
  address: string
  label?: string
  balance: number
  balanceUSD: number
  tokens: Array<{
    symbol: string
    balance: number
    balanceUSD: number
    price: number
  }>
}

interface AggregatedPortfolio {
  totalBalanceUSD: number
  totalWallets: number
  walletBalances: WalletBalance[]
  topTokens: Array<{
    symbol: string
    totalBalance: number
    totalBalanceUSD: number
    walletCount: number
  }>
  chainDistribution: Record<string, number>
}

/**
 * Aggregates portfolio data from all user's wallets
 */
export function useAggregatedPortfolio() {
  const { wallets, isLoading: walletsLoading, userId } = useWalletRegistry()

  const {
    data: portfolio,
    isLoading: portfolioLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['aggregated-portfolio', userId, wallets.map((w) => w.id)],
    queryFn: async (): Promise<AggregatedPortfolio> => {
      if (!userId || wallets.length === 0) {
        return {
          totalBalanceUSD: 0,
          totalWallets: 0,
          walletBalances: [],
          topTokens: [],
          chainDistribution: {},
        }
      }

      // Fetch positions for all wallets
      // This assumes you have a portfolio_positions table linked to wallet addresses
      const { data: positions, error: positionsError } = await supabase
        .from('portfolio_positions')
        .select('*')
        .in(
          'wallet_address',
          wallets.map((w) => w.address.toLowerCase())
        )

      if (positionsError) {
        console.error('Failed to fetch portfolio positions:', positionsError)
        throw positionsError
      }

      // Group positions by wallet
      const walletBalances: WalletBalance[] = wallets.map((wallet) => {
        const walletPositions = (positions || []).filter(
          (p: any) => p.wallet_address.toLowerCase() === wallet.address.toLowerCase()
        )

        const tokens = walletPositions.map((p: any) => ({
          symbol: p.token_symbol || 'UNKNOWN',
          balance: parseFloat(p.balance || '0'),
          balanceUSD: parseFloat(p.balance_usd || '0'),
          price: parseFloat(p.price_usd || '0'),
        }))

        const balanceUSD = tokens.reduce((sum, t) => sum + t.balanceUSD, 0)

        return {
          walletId: wallet.id,
          address: wallet.address,
          label: wallet.label,
          balance: 0, // Native token balance (ETH, etc.)
          balanceUSD,
          tokens,
        }
      })

      // Calculate total balance
      const totalBalanceUSD = walletBalances.reduce((sum, w) => sum + w.balanceUSD, 0)

      // Aggregate tokens across all wallets
      const tokenMap = new Map<
        string,
        {
          symbol: string
          totalBalance: number
          totalBalanceUSD: number
          walletCount: number
        }
      >()

      walletBalances.forEach((wallet) => {
        wallet.tokens.forEach((token) => {
          const existing = tokenMap.get(token.symbol)
          if (existing) {
            existing.totalBalance += token.balance
            existing.totalBalanceUSD += token.balanceUSD
            existing.walletCount += 1
          } else {
            tokenMap.set(token.symbol, {
              symbol: token.symbol,
              totalBalance: token.balance,
              totalBalanceUSD: token.balanceUSD,
              walletCount: 1,
            })
          }
        })
      })

      const topTokens = Array.from(tokenMap.values())
        .sort((a, b) => b.totalBalanceUSD - a.totalBalanceUSD)
        .slice(0, 10)

      // Chain distribution
      const chainDistribution: Record<string, number> = {}
      wallets.forEach((wallet) => {
        const balance =
          walletBalances.find((w) => w.walletId === wallet.id)?.balanceUSD || 0
        chainDistribution[wallet.chain] = (chainDistribution[wallet.chain] || 0) + balance
      })

      return {
        totalBalanceUSD,
        totalWallets: wallets.length,
        walletBalances,
        topTokens,
        chainDistribution,
      }
    },
    enabled: !!userId && wallets.length > 0,
    staleTime: 60_000, // 1 minute
    refetchInterval: 5 * 60_000, // 5 minutes
  })

  return {
    portfolio,
    isLoading: walletsLoading || portfolioLoading,
    error,
    refetch,
    hasWallets: wallets.length > 0,
  }
}




