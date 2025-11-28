// Premium Features TypeScript Interfaces

// Market Maker Flow Sentinel
export interface MarketMakerFlow {
  id: string
  timestamp: string
  source_exchange: string
  source_address: string
  destination_mm: string
  destination_address: string
  token: string
  amount: number
  amount_usd: number
  flow_type: 'inbound' | 'outbound' | 'rebalance'
  confidence_score: number
  market_impact_prediction: number
  signal_strength: 'weak' | 'moderate' | 'strong'
}

export interface MMFlowSignal {
  id: string
  flow_id: string
  signal_type: 'accumulation' | 'distribution' | 'arbitrage' | 'liquidation'
  confidence: number
  predicted_price_impact: number
  timeframe: string
  reasoning: string[]
}

// Multi-Channel Alert Delivery
export interface AlertChannel {
  id: string
  user_id: string
  channel_type: 'push' | 'email' | 'webhook' | 'sms'
  endpoint: string
  is_active: boolean
  subscription_tier_required: 'free' | 'premium' | 'enterprise'
  settings: AlertChannelSettings
}

export interface AlertChannelSettings {
  frequency_limit?: number
  quiet_hours?: { start: string; end: string }
  priority_filter?: 'all' | 'high' | 'critical'
  custom_template?: string
}

export interface AlertDelivery {
  id: string
  alert_id: string
  channel_id: string
  status: 'pending' | 'sent' | 'failed' | 'rate_limited'
  sent_at?: string
  error_message?: string
  delivery_metadata: Record<string, unknown>
}

// NFT Whale Tracking
export interface NFTWhaleTransaction {
  id: string
  transaction_hash: string
  block_number: number
  timestamp: string
  from_address: string
  to_address: string
  contract_address: string
  token_id: string
  collection_name: string
  collection_slug: string
  transaction_type: 'sale' | 'transfer' | 'mint' | 'burn'
  marketplace: 'opensea' | 'blur' | 'looksrare' | 'x2y2' | 'direct'
  price_eth?: number
  price_usd?: number
  rarity_rank?: number
  is_whale_transaction: boolean
  whale_threshold_met: string[]
}

export interface NFTCollection {
  contract_address: string
  name: string
  slug: string
  floor_price_eth: number
  volume_24h_eth: number
  total_supply: number
  is_monitored: boolean
  whale_threshold_usd: number
}