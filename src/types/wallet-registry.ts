/**
 * Type Definitions for Multi-Wallet Registry System
 */

export interface UserWallet {
  id: string
  user_id: string
  address: string
  label?: string
  chain: string
  source?: 'rainbowkit' | 'manual' | 'import' | 'demo' | 'migration'
  verified: boolean
  last_scan?: string
  trust_score?: number
  risk_flags?: RiskFlag[]
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface RiskFlag {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high'
  details?: string
  timestamp?: string
}

export interface AddWalletOptions {
  address: string
  label?: string
  chain?: string
  source?: UserWallet['source']
}

export interface WalletRegistryStats {
  totalWallets: number
  averageTrustScore: number
  totalRiskFlags: number
  lastScanned?: string
  walletsNeedingScan: number
}

export interface BatchScanResult {
  walletId: string
  address: string
  result?: {
    trustScorePercent: number
    riskLevel: 'Low' | 'Medium' | 'High'
    flags: RiskFlag[]
  }
  error?: string
  success: boolean
}

export interface AggregatedPortfolio {
  totalBalanceUSD: number
  totalWallets: number
  walletBalances: WalletBalance[]
  topTokens: TokenHolding[]
  chainDistribution: Record<string, number>
}

export interface WalletBalance {
  walletId: string
  address: string
  label?: string
  balance: number
  balanceUSD: number
  tokens: TokenBalance[]
}

export interface TokenBalance {
  symbol: string
  balance: number
  balanceUSD: number
  price: number
}

export interface TokenHolding {
  symbol: string
  totalBalance: number
  totalBalanceUSD: number
  walletCount: number
}

export interface WalletScanJob {
  jobId: string
  userId: string
  walletIds: string[]
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt?: string
  completedAt?: string
  totalWallets: number
  scannedWallets: number
  failedWallets: number
}




