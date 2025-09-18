# 🚀 WhalePlus Premium Features Implementation Plan

## 📋 **Executive Summary**

This document outlines the implementation plan for three high-impact premium features designed to boost WhalePlus monetization and user engagement. Each feature targets institutional clients and advanced traders with actionable intelligence and multi-channel delivery.

---

# 🎯 **FEATURE 1: Market Maker Flow Sentinel**

## **Overview**
Dedicated monitoring system for CEX-to-market maker flows (e.g., Binance → Wintermute, Coinbase → Jump Trading) with ML-based signal generation.

## **Technical Implementation**

### **Data Sources & Integration**
```typescript
// TypeScript Interface
interface MarketMakerFlow {
  id: string;
  timestamp: string;
  source_exchange: string;
  source_address: string;
  destination_mm: string;
  destination_address: string;
  token: string;
  amount: number;
  amount_usd: number;
  flow_type: 'inbound' | 'outbound' | 'rebalance';
  confidence_score: number;
  market_impact_prediction: number;
  signal_strength: 'weak' | 'moderate' | 'strong';
}

interface MMFlowSignal {
  id: string;
  flow_id: string;
  signal_type: 'accumulation' | 'distribution' | 'arbitrage' | 'liquidation';
  confidence: number;
  predicted_price_impact: number;
  timeframe: string;
  reasoning: string[];
}
```

### **Supabase Schema**
```sql
-- Market Maker Flow Tracking
CREATE TABLE market_maker_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL,
  source_exchange TEXT NOT NULL,
  source_address TEXT NOT NULL,
  destination_mm TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  token TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  amount_usd DECIMAL NOT NULL,
  flow_type TEXT CHECK (flow_type IN ('inbound', 'outbound', 'rebalance')),
  confidence_score DECIMAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  market_impact_prediction DECIMAL,
  signal_strength TEXT CHECK (signal_strength IN ('weak', 'moderate', 'strong')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ML-Generated Signals
CREATE TABLE mm_flow_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID REFERENCES market_maker_flows(id),
  signal_type TEXT NOT NULL,
  confidence DECIMAL NOT NULL,
  predicted_price_impact DECIMAL,
  timeframe TEXT NOT NULL,
  reasoning JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Labeled Market Maker Addresses
CREATE TABLE market_maker_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT UNIQUE NOT NULL,
  entity_name TEXT NOT NULL,
  entity_type TEXT CHECK (entity_type IN ('market_maker', 'exchange', 'fund')),
  chains TEXT[] DEFAULT ARRAY['ethereum'],
  is_active BOOLEAN DEFAULT true,
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_mm_flows_timestamp ON market_maker_flows(timestamp DESC);
CREATE INDEX idx_mm_flows_token ON market_maker_flows(token);
CREATE INDEX idx_mm_addresses_address ON market_maker_addresses(address);
```

### **Edge Function: `market-maker-sentinel/index.ts`**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Known Market Maker Addresses
const MARKET_MAKERS = {
  'wintermute': ['0x4f3a120E72C76c22ae802D129F599BFDbc31cb81'],
  'jump_trading': ['0x151e24A486D7258dd7C33Fb67E4bB01919B7B32c'],
  'alameda': ['0xf977814e90da44bfa03b6295a0616a897441acec'],
  'galaxy_digital': ['0x1111111254EEB25477B68fb85Ed929f73A960582']
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch recent large transfers to/from known MM addresses
    const alchemyKey = Deno.env.get('ALCHEMY_API_KEY')
    const flows: MarketMakerFlow[] = []

    for (const [mmName, addresses] of Object.entries(MARKET_MAKERS)) {
      for (const address of addresses) {
        // Get transfers using Alchemy
        const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'alchemy_getAssetTransfers',
            params: [{
              fromBlock: '0x' + (await getLatestBlock() - 100).toString(16),
              toBlock: 'latest',
              toAddress: address,
              category: ['external', 'erc20'],
              withMetadata: true,
              excludeZeroValue: true,
              maxCount: 50
            }],
            id: 1
          })
        })

        const data = await response.json()
        
        if (data.result?.transfers) {
          for (const transfer of data.result.transfers) {
            const valueUsd = parseFloat(transfer.value || '0') * 3500 // ETH price
            
            if (valueUsd > 1000000) { // $1M+ flows
              flows.push({
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                source_exchange: detectExchange(transfer.from),
                source_address: transfer.from,
                destination_mm: mmName,
                destination_address: address,
                token: transfer.asset || 'ETH',
                amount: parseFloat(transfer.value || '0'),
                amount_usd: valueUsd,
                flow_type: 'inbound',
                confidence_score: 0.85,
                market_impact_prediction: calculateImpact(valueUsd),
                signal_strength: valueUsd > 10000000 ? 'strong' : 'moderate'
              })
            }
          }
        }
      }
    }

    // Store flows and generate ML signals
    for (const flow of flows) {
      await supabase.from('market_maker_flows').insert(flow)
      
      // Generate ML signal
      const signal = generateMLSignal(flow)
      await supabase.from('mm_flow_signals').insert(signal)
    }

    return new Response(JSON.stringify({
      success: true,
      flows_detected: flows.length,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function detectExchange(address: string): string {
  const exchanges = {
    '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE': 'binance',
    '0x28C6c06298d514Db089934071355E5743bf21d60': 'coinbase',
    '0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa': 'kraken'
  }
  return exchanges[address] || 'unknown'
}

function calculateImpact(valueUsd: number): number {
  return Math.min(5, valueUsd / 10000000) // Max 5% impact
}

function generateMLSignal(flow: MarketMakerFlow): MMFlowSignal {
  return {
    id: crypto.randomUUID(),
    flow_id: flow.id,
    signal_type: flow.amount_usd > 5000000 ? 'distribution' : 'accumulation',
    confidence: flow.confidence_score,
    predicted_price_impact: flow.market_impact_prediction,
    timeframe: '2-6 hours',
    reasoning: [`Large ${flow.flow_type} flow to ${flow.destination_mm}`, 'Historical pattern analysis']
  }
}
```

### **Frontend Integration**
```typescript
// New component: MarketMakerFlowSentinel.tsx
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const MarketMakerFlowSentinel = () => {
  const [flows, setFlows] = useState<MarketMakerFlow[]>([])
  const [signals, setSignals] = useState<MMFlowSignal[]>([])

  useEffect(() => {
    fetchMarketMakerFlows()
    const interval = setInterval(fetchMarketMakerFlows, 60000) // 1-minute refresh
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Market Maker Flow Sentinel</h2>
        <Badge variant="outline" className="bg-green-50">
          Live Monitoring
        </Badge>
      </div>

      {/* Flow Detection Cards */}
      <div className="grid gap-4">
        {flows.map(flow => (
          <Card key={flow.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant={flow.signal_strength === 'strong' ? 'destructive' : 'default'}>
                  {flow.signal_strength.toUpperCase()}
                </Badge>
                <span className="font-medium">{flow.source_exchange} → {flow.destination_mm}</span>
              </div>
              <div className="text-right">
                <div className="font-bold">${flow.amount_usd.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">{flow.token}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Predicted Impact:</span>
                <div className="font-medium">{flow.market_impact_prediction.toFixed(2)}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Confidence:</span>
                <div className="font-medium">{(flow.confidence_score * 100).toFixed(0)}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Flow Type:</span>
                <div className="font-medium capitalize">{flow.flow_type}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

---

# 📢 **FEATURE 2: Multi-Channel Alert Delivery**

## **Overview**
Extend existing Alert Center to support push notifications, email (SendGrid), and webhooks (Zapier) with subscription-tier routing.

## **Technical Implementation**

### **TypeScript Interfaces**
```typescript
interface AlertChannel {
  id: string;
  user_id: string;
  channel_type: 'push' | 'email' | 'webhook' | 'sms';
  endpoint: string; // email, webhook URL, phone number
  is_active: boolean;
  subscription_tier_required: 'free' | 'premium' | 'enterprise';
  settings: AlertChannelSettings;
}

interface AlertChannelSettings {
  frequency_limit?: number; // max alerts per hour
  quiet_hours?: { start: string; end: string };
  priority_filter?: 'all' | 'high' | 'critical';
  custom_template?: string;
}

interface AlertDelivery {
  id: string;
  alert_id: string;
  channel_id: string;
  status: 'pending' | 'sent' | 'failed' | 'rate_limited';
  sent_at?: string;
  error_message?: string;
  delivery_metadata: Record<string, any>;
}
```

### **Supabase Schema**
```sql
-- Alert Channels Configuration
CREATE TABLE alert_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_type TEXT CHECK (channel_type IN ('push', 'email', 'webhook', 'sms')),
  endpoint TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  subscription_tier_required TEXT CHECK (subscription_tier_required IN ('free', 'premium', 'enterprise')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert Delivery Tracking
CREATE TABLE alert_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL,
  channel_id UUID REFERENCES alert_channels(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'rate_limited')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  delivery_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert Templates
CREATE TABLE alert_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel_type TEXT NOT NULL,
  template_content TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_alert_channels_user ON alert_channels(user_id);
CREATE INDEX idx_alert_deliveries_status ON alert_deliveries(status);
```

### **Edge Function: `multi-channel-alerts/index.ts`**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { alert, user_id } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user's alert channels
    const { data: channels } = await supabase
      .from('alert_channels')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)

    // Get user subscription tier
    const { data: user } = await supabase
      .from('users')
      .select('plan')
      .eq('user_id', user_id)
      .single()

    const userTier = user?.plan || 'free'
    const deliveries = []

    for (const channel of channels || []) {
      // Check subscription tier access
      if (!canAccessChannel(userTier, channel.subscription_tier_required)) {
        // Show sample notification for free users
        if (userTier === 'free') {
          await sendSampleNotification(channel, alert)
        }
        continue
      }

      // Check rate limits
      if (await isRateLimited(channel.id)) {
        await logDelivery(channel.id, alert.id, 'rate_limited')
        continue
      }

      // Send alert based on channel type
      const delivery = await sendAlert(channel, alert)
      deliveries.push(delivery)
      
      await logDelivery(channel.id, alert.id, delivery.status, delivery.error)
    }

    return new Response(JSON.stringify({
      success: true,
      deliveries_attempted: deliveries.length,
      deliveries
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function sendAlert(channel: AlertChannel, alert: any) {
  switch (channel.channel_type) {
    case 'email':
      return await sendEmailAlert(channel, alert)
    case 'webhook':
      return await sendWebhookAlert(channel, alert)
    case 'push':
      return await sendPushAlert(channel, alert)
    case 'sms':
      return await sendSMSAlert(channel, alert)
    default:
      throw new Error(`Unsupported channel type: ${channel.channel_type}`)
  }
}

async function sendEmailAlert(channel: AlertChannel, alert: any) {
  const sendgridKey = Deno.env.get('SENDGRID_API_KEY')
  
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sendgridKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: channel.endpoint }],
        subject: `🐋 Whale Alert: ${alert.token} ${alert.amount_usd.toLocaleString()}`
      }],
      from: { email: 'alerts@whaleplus.io', name: 'WhalePlus Alerts' },
      content: [{
        type: 'text/html',
        value: generateEmailTemplate(alert)
      }]
    })
  })

  return {
    status: response.ok ? 'sent' : 'failed',
    error: response.ok ? null : await response.text()
  }
}

async function sendWebhookAlert(channel: AlertChannel, alert: any) {
  const response = await fetch(channel.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'whale_alert',
      data: alert,
      timestamp: new Date().toISOString()
    })
  })

  return {
    status: response.ok ? 'sent' : 'failed',
    error: response.ok ? null : `HTTP ${response.status}`
  }
}

function generateEmailTemplate(alert: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a73e8;">🐋 Whale Transaction Detected</h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
        <p><strong>Amount:</strong> $${alert.amount_usd.toLocaleString()}</p>
        <p><strong>Token:</strong> ${alert.token}</p>
        <p><strong>Chain:</strong> ${alert.chain}</p>
        <p><strong>From:</strong> ${alert.from_addr}</p>
        <p><strong>To:</strong> ${alert.to_addr}</p>
        <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="https://whaleplus.io/scanner?address=${alert.from_addr}" 
           style="background: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          Analyze Wallet
        </a>
      </p>
    </div>
  `
}
```

### **Frontend Integration**
```typescript
// AlertChannelManager.tsx
export const AlertChannelManager = () => {
  const [channels, setChannels] = useState<AlertChannel[]>([])
  const { userPlan } = useSubscription()

  const addChannel = async (channelData: Partial<AlertChannel>) => {
    const { data, error } = await supabase
      .from('alert_channels')
      .insert({
        ...channelData,
        user_id: user.id
      })
      .select()
      .single()

    if (!error) {
      setChannels(prev => [...prev, data])
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Alert Delivery Channels</h3>
      
      {/* Channel Configuration Cards */}
      <div className="grid gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Email Notifications</h4>
            <Badge variant={userPlan === 'free' ? 'secondary' : 'default'}>
              {userPlan === 'free' ? 'Sample Only' : 'Active'}
            </Badge>
          </div>
          
          {userPlan === 'free' ? (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                📧 Sample: "🐋 Whale Alert: ETH $2,500,000 transaction detected"
              </p>
              <Button size="sm" variant="outline">
                Upgrade to Enable Email Alerts
              </Button>
            </div>
          ) : (
            <EmailChannelConfig onAdd={addChannel} />
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Webhook Integration</h4>
            <Badge variant={userPlan === 'enterprise' ? 'default' : 'secondary'}>
              {userPlan === 'enterprise' ? 'Available' : 'Enterprise Only'}
            </Badge>
          </div>
          
          {userPlan !== 'enterprise' ? (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                🔗 Connect to Zapier, Discord, Slack, or custom endpoints
              </p>
              <Button size="sm" variant="outline">
                Upgrade to Enterprise
              </Button>
            </div>
          ) : (
            <WebhookChannelConfig onAdd={addChannel} />
          )}
        </Card>
      </div>
    </div>
  )
}
```

---

# 🖼️ **FEATURE 3: NFT Whale Tracking**

## **Overview**
Integrate NFT activity monitoring for large whale transfers and purchases on top marketplaces (OpenSea, Blur) with filtering and alerts.

## **Technical Implementation**

### **TypeScript Interfaces**
```typescript
interface NFTWhaleTransaction {
  id: string;
  transaction_hash: string;
  block_number: number;
  timestamp: string;
  from_address: string;
  to_address: string;
  contract_address: string;
  token_id: string;
  collection_name: string;
  collection_slug: string;
  transaction_type: 'sale' | 'transfer' | 'mint' | 'burn';
  marketplace: 'opensea' | 'blur' | 'looksrare' | 'x2y2' | 'direct';
  price_eth?: number;
  price_usd?: number;
  rarity_rank?: number;
  is_whale_transaction: boolean;
  whale_threshold_met: string[]; // ['high_value', 'rare_nft', 'whale_wallet']
}

interface NFTCollection {
  contract_address: string;
  name: string;
  slug: string;
  floor_price_eth: number;
  volume_24h_eth: number;
  total_supply: number;
  is_monitored: boolean;
  whale_threshold_usd: number;
}
```

### **Supabase Schema**
```sql
-- NFT Collections Tracking
CREATE TABLE nft_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  floor_price_eth DECIMAL DEFAULT 0,
  volume_24h_eth DECIMAL DEFAULT 0,
  total_supply INTEGER DEFAULT 0,
  is_monitored BOOLEAN DEFAULT false,
  whale_threshold_usd DECIMAL DEFAULT 100000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NFT Whale Transactions
CREATE TABLE nft_whale_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_hash TEXT UNIQUE NOT NULL,
  block_number BIGINT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  contract_address TEXT REFERENCES nft_collections(contract_address),
  token_id TEXT NOT NULL,
  collection_name TEXT NOT NULL,
  collection_slug TEXT NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('sale', 'transfer', 'mint', 'burn')),
  marketplace TEXT CHECK (marketplace IN ('opensea', 'blur', 'looksrare', 'x2y2', 'direct')),
  price_eth DECIMAL,
  price_usd DECIMAL,
  rarity_rank INTEGER,
  is_whale_transaction BOOLEAN DEFAULT false,
  whale_threshold_met TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NFT Whale Addresses (known collectors)
CREATE TABLE nft_whale_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT UNIQUE NOT NULL,
  label TEXT,
  total_nft_value_usd DECIMAL DEFAULT 0,
  collection_count INTEGER DEFAULT 0,
  is_verified_whale BOOLEAN DEFAULT false,
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_nft_whale_txs_timestamp ON nft_whale_transactions(timestamp DESC);
CREATE INDEX idx_nft_whale_txs_collection ON nft_whale_transactions(contract_address);
CREATE INDEX idx_nft_whale_txs_price ON nft_whale_transactions(price_usd DESC);
```

### **Edge Function: `nft-whale-tracker/index.ts`**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Top NFT Collections to Monitor
const MONITORED_COLLECTIONS = [
  { address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', name: 'Bored Ape Yacht Club', slug: 'boredapeyachtclub' },
  { address: '0x60E4d786628Fea6478F785A6d7e704777c86a7c6', name: 'Mutant Ape Yacht Club', slug: 'mutant-ape-yacht-club' },
  { address: '0xED5AF388653567Af2F388E6224dC7C4b3241C544', name: 'Azuki', slug: 'azuki' },
  { address: '0x23581767a106ae21c074b2276D25e5C3e136a68b', name: 'Moonbirds', slug: 'proof-moonbirds' }
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const alchemyKey = Deno.env.get('ALCHEMY_API_KEY')
    const whaleTransactions: NFTWhaleTransaction[] = []

    // Monitor each collection for whale activity
    for (const collection of MONITORED_COLLECTIONS) {
      // Get recent NFT transfers using Alchemy NFT API
      const response = await fetch(`https://eth-mainnet.g.alchemy.com/nft/v2/${alchemyKey}/getNFTsForCollection`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })

      // Get recent transfers for this collection
      const transferResponse = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'alchemy_getAssetTransfers',
          params: [{
            fromBlock: '0x' + (await getLatestBlock() - 100).toString(16),
            toBlock: 'latest',
            contractAddresses: [collection.address],
            category: ['erc721', 'erc1155'],
            withMetadata: true,
            excludeZeroValue: false,
            maxCount: 100
          }],
          id: 1
        })
      })

      const transferData = await transferResponse.json()

      if (transferData.result?.transfers) {
        for (const transfer of transferData.result.transfers) {
          // Get OpenSea metadata for price information
          const priceData = await getOpenSeaPrice(collection.address, transfer.tokenId)
          
          const priceUsd = priceData?.price_usd || 0
          const isWhaleTransaction = priceUsd > 100000 || await isKnownWhaleAddress(transfer.to)

          if (isWhaleTransaction) {
            const whaleThresholds = []
            if (priceUsd > 100000) whaleThresholds.push('high_value')
            if (priceData?.rarity_rank && priceData.rarity_rank <= 100) whaleThresholds.push('rare_nft')
            if (await isKnownWhaleAddress(transfer.to)) whaleThresholds.push('whale_wallet')

            whaleTransactions.push({
              id: crypto.randomUUID(),
              transaction_hash: transfer.hash,
              block_number: parseInt(transfer.blockNum, 16),
              timestamp: new Date().toISOString(),
              from_address: transfer.from,
              to_address: transfer.to,
              contract_address: collection.address,
              token_id: transfer.tokenId,
              collection_name: collection.name,
              collection_slug: collection.slug,
              transaction_type: 'transfer',
              marketplace: detectMarketplace(transfer.hash),
              price_eth: priceData?.price_eth,
              price_usd: priceUsd,
              rarity_rank: priceData?.rarity_rank,
              is_whale_transaction: true,
              whale_threshold_met: whaleThresholds
            })
          }
        }
      }
    }

    // Store whale transactions
    for (const tx of whaleTransactions) {
      await supabase.from('nft_whale_transactions').upsert(tx, {
        onConflict: 'transaction_hash',
        ignoreDuplicates: true
      })
    }

    return new Response(JSON.stringify({
      success: true,
      whale_transactions_found: whaleTransactions.length,
      collections_monitored: MONITORED_COLLECTIONS.length,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function getOpenSeaPrice(contractAddress: string, tokenId: string) {
  try {
    const response = await fetch(`https://api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}/`, {
      headers: {
        'X-API-KEY': Deno.env.get('OPENSEA_API_KEY') || ''
      }
    })
    
    const data = await response.json()
    
    return {
      price_eth: data.last_sale?.total_price ? parseFloat(data.last_sale.total_price) / 1e18 : null,
      price_usd: data.last_sale?.usd_price || null,
      rarity_rank: data.traits?.find(t => t.trait_type === 'Rarity Rank')?.value
    }
  } catch (error) {
    return null
  }
}

async function isKnownWhaleAddress(address: string): Promise<boolean> {
  // Check against known NFT whale addresses
  const knownWhales = [
    '0x54BE3a794282C030b15E43aE2bB182E14c409C5e', // Pranksy
    '0x020cA66C30beC2c4Fe3861a94E4DB4A498A35872', // Whale Shark
    '0x8AD272Ac86c6C88683d9a60eb8ED57E6C304bB0C'  // Vincent Van Dough
  ]
  
  return knownWhales.includes(address)
}

function detectMarketplace(txHash: string): string {
  // This would analyze transaction logs to detect marketplace
  // For now, return 'opensea' as default
  return 'opensea'
}
```

### **Frontend Integration**
```typescript
// NFTWhaleTracker.tsx
export const NFTWhaleTracker = () => {
  const [nftTransactions, setNftTransactions] = useState<NFTWhaleTransaction[]>([])
  const [collections, setCollections] = useState<NFTCollection[]>([])
  const [filters, setFilters] = useState({
    minPrice: 100000,
    collections: [],
    timeframe: '24h'
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">NFT Whale Tracking</h2>
        <Badge variant="outline" className="bg-purple-50">
          Live NFT Monitoring
        </Badge>
      </div>

      {/* Filter Controls */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Min Price (USD)</Label>
            <Input
              type="number"
              value={filters.minPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, minPrice: Number(e.target.value) }))}
            />
          </div>
          <div>
            <Label>Collection</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="All Collections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Collections</SelectItem>
                <SelectItem value="bayc">Bored Ape Yacht Club</SelectItem>
                <SelectItem value="azuki">Azuki</SelectItem>
                <SelectItem value="moonbirds">Moonbirds</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Timeframe</Label>
            <Select value={filters.timeframe} onValueChange={(value) => setFilters(prev => ({ ...prev, timeframe: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full">Apply Filters</Button>
          </div>
        </div>
      </Card>

      {/* NFT Whale Transactions */}
      <div className="grid gap-4">
        {nftTransactions.map(tx => (
          <Card key={tx.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                  🖼️
                </div>
                <div>
                  <div className="font-medium">{tx.collection_name}</div>
                  <div className="text-sm text-muted-foreground">Token #{tx.token_id}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">${tx.price_usd?.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">{tx.price_eth?.toFixed(2)} ETH</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {tx.whale_threshold_met.map(threshold => (
                <Badge key={threshold} variant="secondary" className="text-xs">
                  {threshold.replace('_', ' ').toUpperCase()}
                </Badge>
              ))}
              <Badge variant="outline">{tx.marketplace}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">From:</span>
                <div className="font-mono">{tx.from_address.slice(0, 10)}...{tx.from_address.slice(-6)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">To:</span>
                <div className="font-mono">{tx.to_address.slice(0, 10)}...{tx.to_address.slice(-6)}</div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3 pt-3 border-t">
              <div className="text-sm text-muted-foreground">
                {new Date(tx.timestamp).toLocaleString()}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  View on OpenSea
                </Button>
                <Button size="sm" variant="outline">
                  Analyze Wallet
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

---

# 📊 **IMPLEMENTATION SUMMARY TABLE**

| Feature | Impact | Page(s) to Integrate | Estimated Effort | Monetization Tie-In |
|---------|--------|---------------------|------------------|-------------------|
| **Market Maker Flow Sentinel** | 🔥 High - Institutional traders need MM flow intelligence | Whales, Analytics | 2-3 weeks | Premium/Enterprise exclusive - $99/month value |
| **Multi-Channel Alert Delivery** | 🔥 High - Increases engagement & retention | All pages (Alert Center) | 2 weeks | Tiered access: Email (Premium), Webhooks (Enterprise) |
| **NFT Whale Tracking** | 🔥 Medium-High - Expands market to NFT traders | Whales, Scanner | 2-3 weeks | Premium feature - attracts NFT whale community |

## **Revenue Impact Projections**
- **Market Maker Sentinel**: +$50K ARR (institutional clients)
- **Multi-Channel Alerts**: +30% user retention, +$25K ARR
- **NFT Whale Tracking**: +$15K ARR (NFT trader segment)

## **Technical Dependencies**
- **APIs Required**: Alchemy NFT API, SendGrid, OpenSea API
- **New Tables**: 6 new Supabase tables
- **Edge Functions**: 3 new functions
- **Frontend Components**: 8 new components

## **Competitive Advantage**
- **Nansen**: Lacks real-time MM flow detection
- **Arkham**: No multi-channel alert delivery
- **DeFiLlama**: No NFT whale integration

**Total Implementation Time**: 6-8 weeks for all three features
**Expected ROI**: 300%+ within 6 months