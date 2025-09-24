// Market Intelligence Hub Types
// Complete type definitions for the Market Intelligence Hub system

// =====================================================
// 1. CORE DATA TYPES
// =====================================================

export interface TimeWindow {
  value: '24h' | '7d'
  label: string
  milliseconds: number
}

export interface RefreshStatus {
  refreshedAt: string
  minutesAgo: number
  isStale: boolean
}

// =====================================================
// 2. MARKET SUMMARY TYPES
// =====================================================

export interface MarketSummary {
  window: string
  marketMood: number // 0-100
  marketMoodDelta: number // % change
  volume24h: number // USD
  volumeDelta: number // % change vs prior period
  activeWhales: number // count
  whalesDelta: number // % change vs prior period
  riskIndex: number // 0-100
  topAlerts: CriticalAlert[]
  refreshedAt: string
}

export interface CriticalAlert {
  id: string
  severity: 'High' | 'Medium' | 'Info'
  title: string
  timestamp: string
}

// =====================================================
// 3. WHALE CLUSTERING TYPES
// =====================================================

export type ClusterType = 
  | 'DORMANT_WAKING' 
  | 'CEX_INFLOW' 
  | 'DEFI_ACTIVITY' 
  | 'DISTRIBUTION' 
  | 'ACCUMULATION'

export interface WhaleCluster {
  id: string
  type: ClusterType
  name: string
  membersCount: number
  sumBalanceUsd: number
  netFlow24h: number
  riskScore: number // 0-100
  riskSkew: number // deviation from neutral 50
  avgConfidence: number // 0-1
  members: WhaleMember[]
}

export interface WhaleMember {
  address: string
  balanceUsd: number
  riskScore: number // 0-100
  reasonCodes: string[] // max 3
  lastActivityTs: string
  confidence: number // 0-1
}

export interface ClusteringThresholds {
  MIN_AMOUNT: number // q70_usd(chain)
  HIGH_VALUE: number // q85_usd(chain)
  DEFI_THRESHOLD: number // q80_defi_usd(chain)
  NET_OUT_THRESHOLD: number // q80_netOut(chain)
  NET_IN_THRESHOLD: number // q80_netIn(chain)
}

// =====================================================
// 4. CHAIN RISK TYPES
// =====================================================

export interface ChainRisk {
  window: string
  chains: ChainRiskData[]
  refreshedAt: string
  summary: {
    chainsWithData: number
    avgRisk: number
    highRiskChains: number
  }
}

export interface ChainRiskData {
  chain: 'BTC' | 'ETH' | 'SOL' | 'Others'
  risk: number | null // 0-100, null if insufficient data
  reason?: string // explanation if risk is null
  components: RiskComponents
  metrics?: RiskMetrics
  refreshedAt: string
}

export interface RiskComponents {
  whaleRiskMean: number // balance-weighted whale risk
  cexInflowRatio: number // % of flow to CEX
  netOutflowRatio: number // % net outflow
  volatilityZ: number // z-score of volatility
  largeTxShare: number // % of large transactions
  dormantWakeupsRate: number // dormant wakeups per active whale
  stablecoinBufferRatio: number // stablecoin inflow ratio (reduces risk)
  rawScore: number // raw risk score before normalization
}

export interface RiskMetrics {
  totalWhales: number
  totalTransfers: number
  totalFlow: number
  activeWhales: number
  largeTxs: number
  dormantWakeups: number
}

// =====================================================
// 5. ALERTS STREAM TYPES
// =====================================================

export interface AlertsStream {
  alerts: ProcessedAlert[]
  cursor: string | null
  hasMore: boolean
  keepRate: number // % of alerts kept after filtering
  totalProcessed: number
  totalKept: number
  filters: AlertFilters
}

export interface ProcessedAlert {
  id: string
  ts: string
  chain: string
  token: string
  usd: number
  cluster: ClusterType | 'unknown'
  severity: 'High' | 'Medium' | 'Info'
  impactScore: number // 0-1
  confidence: number // 0-1
  reasons: string[]
  threadKey: string // for grouping similar alerts
  isRead: boolean
  score: number
  threadCount?: number // if this is a thread representative
  threadAlerts?: ProcessedAlert[] // other alerts in thread
}

export interface AlertFilters {
  severity: 'All' | 'High' | 'Medium' | 'Info'
  minUsd: string // minimum USD amount
  chain: 'All' | 'BTC' | 'ETH' | 'SOL' | 'Others'
  watchlistOnly: boolean
}

// =====================================================
// 6. WHALE ANALYTICS TYPES
// =====================================================

export interface WhaleAnalytics {
  address: string
  riskScore: number // 0-100
  riskCategory: 'High' | 'Medium' | 'Low'
  factorBars: RiskFactorBars
  transactions24h: number
  netFlow24h: number
  clusterRank: number
  clusterSize: number
  actions: WhaleActions
}

export interface RiskFactorBars {
  exchangeActivity: number // 0-100
  largeTransfers: number // 0-100
  priceCorrelation: number // 0-100
  liquidityImpact: number // 0-100
  entityReputation: number // 0-100
  weights: {
    exchangeActivity: number
    largeTransfers: number
    priceCorrelation: number
    liquidityImpact: number
    entityReputation: number
  }
}

export interface WhaleActions {
  detailedAnalysis: boolean
  addToWatchlist: boolean
  trade?: boolean // feature flag dependent
}

// =====================================================
// 7. SENTIMENT & CORRELATION TYPES
// =====================================================

export interface AssetSentiment {
  asset: string
  price: number
  change24h: number // % change
  sentiment: number // 0-100
  sentimentLabel: 'Bearish' | 'Neutral' | 'Bullish'
  isFavorite: boolean
}

export interface SentimentCorrelation {
  assets: string[]
  correlationMatrix: number[][] // -1 to +1
  sampleSizes: number[][]
  lastUpdated: string
}

// =====================================================
// 8. USER SETTINGS & PERMISSIONS TYPES
// =====================================================

export interface UserSettings {
  userId: string
  filtersJson: AlertFilters
  thresholdsJson: ClusteringThresholds
  subscriptionTier: 'free' | 'pro' | 'enterprise'
  createdAt: string
  updatedAt: string
}

export interface FeaturePermissions {
  aiDigest: boolean
  advancedFilters: boolean
  export: boolean
  fullHistory: boolean
  chainHeatmapDetails: boolean
  tradeActions: boolean
}

// =====================================================
// 9. BOTTOM ACTION BAR TYPES
// =====================================================

export interface BottomActionBar {
  visible: boolean
  selectedItem: SelectedItem | null
  actions: ActionButton[]
}

export interface SelectedItem {
  type: 'alert' | 'whale'
  id: string
  data: ProcessedAlert | WhaleMember
}

export interface ActionButton {
  id: string
  label: string
  icon: string
  enabled: boolean
  proOnly?: boolean
  featureFlag?: string
  tooltip?: string
}

// =====================================================
// 10. API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T> {
  data: T
  error?: string
  refreshedAt: string
  cached?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  cursor: string | null
  hasMore: boolean
  total?: number
}

// =====================================================
// 11. TELEMETRY & OBSERVABILITY TYPES
// =====================================================

export interface TelemetryMetrics {
  keepRate: number
  topSkipReasons: string[]
  perChainThresholds: Record<string, ClusteringThresholds>
  perClusterCounts: Record<ClusterType, number>
  avgConfidence: number
}

export interface UserInteractionMetrics {
  viewMarketHub: number
  openAlert: number
  clickTopAlert: number
  applyFilter: number
  muteEntity: number
  addWatchlist: number
  exportReport: number
  tradeClick: number
  conversionRate: number // any_action_within_5m_of_alert_open
}

export interface PerformanceMetrics {
  latency: {
    marketSummary: number
    whaleClusters: number
    chainRisk: number
    alertsStream: number
  }
  cacheHitRate: number
  p95Latency: number
}

// =====================================================
// 12. COMPONENT PROPS TYPES
// =====================================================

export interface MarketHubProps {
  initialTimeWindow?: TimeWindow['value']
  userId?: string
  subscriptionTier?: UserSettings['subscriptionTier']
}

export interface TopCardsProps {
  marketSummary: MarketSummary | null
  loading: boolean
  onAlertClick?: (alert: CriticalAlert) => void
}

export interface WhaleClustersProps {
  clusters: WhaleCluster[]
  loading: boolean
  selectedCluster: string | null
  onClusterSelect: (clusterId: string | null) => void
  timeWindow: TimeWindow['value']
}

export interface ChainRiskHeatmapProps {
  data: ChainRisk | null
  loading: boolean
  onChainClick?: (chain: ChainRiskData) => void
}

export interface AlertsSidebarProps {
  alerts: ProcessedAlert[]
  loading: boolean
  filters: AlertFilters
  onFiltersChange: (filters: AlertFilters) => void
  timeWindow: TimeWindow['value']
  onAlertSelect?: (alert: ProcessedAlert) => void
}

// =====================================================
// 13. UTILITY TYPES
// =====================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface ErrorState {
  message: string
  code?: string
  retryable: boolean
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// =====================================================
// 14. CONSTANTS
// =====================================================

export const CLUSTER_NAMES: Record<ClusterType, string> = {
  DORMANT_WAKING: 'Dormant → Waking',
  CEX_INFLOW: 'CEX Inflow',
  DEFI_ACTIVITY: 'DeFi Activity',
  DISTRIBUTION: 'Distribution',
  ACCUMULATION: 'Accumulation'
}

export const CLUSTER_PRIORITY_ORDER: ClusterType[] = [
  'DORMANT_WAKING',
  'CEX_INFLOW', 
  'DEFI_ACTIVITY',
  'DISTRIBUTION',
  'ACCUMULATION'
]

export const CEX_ENTITIES = [
  'binance', 'okx', 'coinbase', 'kraken', 'bybit', 'kucoin'
]

export const DEFI_TAGS = [
  'swap', 'lend', 'stake', 'bridge', 'yield', 'liquidity', 'perps'
]

export const RISK_THRESHOLDS = {
  HIGH: 70,
  MEDIUM: 40,
  LOW: 0
}

export const CACHE_TTL = {
  MARKET_SUMMARY: 15000, // 15s
  WHALE_CLUSTERS: 60000, // 60s
  CHAIN_RISK: 15000, // 15s
  ALERTS_STREAM: 5000 // 5s
}