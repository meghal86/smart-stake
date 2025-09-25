# Whale Behavior Clustering System

## Overview

The whale clustering system implements behavior-first, chain-adaptive classification of large cryptocurrency transactions. It analyzes whale movements in real-time and groups them into meaningful behavioral patterns.

## Classification Rules

The system uses a priority-based classification system that stops at the first matching rule:

### 1. DORMANT_WAKING
- **Condition**: `dormant_days >= 30 AND first_tx_usd >= max(q70_usd(chain), 50_000)`
- **Description**: Wallets that have been inactive for 30+ days making their first significant transaction
- **Confidence**: High (0.9)

### 2. CEX_INFLOW  
- **Condition**: `to_entity ∈ {binance, okx, coinbase, kraken, bybit, kucoin} AND usd >= max(q85_usd(chain), 100_000)`
- **Description**: Large transfers to major centralized exchanges
- **Confidence**: High (0.85)

### 3. DEFI_ACTIVITY
- **Condition**: `(tags ∩ {swap,lend,stake,bridge,yield,liquidity,perps} ≠ ∅ OR counterparty_type ∈ {amm,lending,bridge,perps}) AND usd >= max(q80_defi_usd(chain), 50_000)`
- **Description**: Interactions with DeFi protocols
- **Confidence**: Medium-High (0.8)

### 4. DISTRIBUTION
- **Condition**: `net_flow < -max(q80_netOut_usd(chain), 100_000) AND toCexRatio < 0.5 AND uniqueRecipients24h >= 3`
- **Description**: Large outflows to multiple non-exchange addresses
- **Confidence**: Medium (0.75)

### 5. ACCUMULATION
- **Condition**: `net_flow >= max(q80_netIn_usd(chain), 100_000)` (high confidence) OR `net_flow > 0` (low confidence)
- **Description**: Net inflow patterns indicating accumulation
- **Confidence**: High (0.8) or Low (0.4)

## Global Filters

- Skip transactions below `max(q70_usd(chain), 50_000)` unless they exceed `max(q85_usd(chain), 100_000)`
- Skip transactions with no behavioral evidence (unknown entities, no tags, no direction) below high-value threshold

## Database Schema

### Core Tables

1. **whale_transfers**: Raw whale transaction data
2. **whale_balances**: Current balance and dormancy context  
3. **whale_signals**: Behavioral signals and risk indicators
4. **whale_clusters**: Computed cluster results
5. **chain_quantiles**: Rolling 30-day quantiles per chain

### Key Fields

```sql
-- whale_transfers
from_address, to_address, amount_usd, token, chain, timestamp
from_entity, to_entity, tags[], counterparty_type

-- whale_balances  
address, chain, balance_usd, dormant_days, last_activity_ts

-- whale_signals
address, chain, risk_score, reason_codes[], net_flow_24h
to_cex_ratio, unique_recipients_24h, confidence
```

## API Endpoints

### GET /functions/v1/whale-clusters
```json
{
  "chain": "ETH|SOL|BTC|all",
  "window": "24h|7d"
}
```

**Response:**
```json
[
  {
    "id": "cluster_dormant_waking",
    "type": "DORMANT_WAKING", 
    "name": "Dormant Wallets Awakening",
    "membersCount": 15,
    "sumBalanceUsd": 250000000,
    "netFlow24h": -50000000,
    "riskScore": 85,
    "confidence": 0.9,
    "members": [...]
  }
]
```

## Setup Instructions

1. **Deploy Database Schema**:
   ```bash
   supabase db push
   ```

2. **Deploy Edge Function**:
   ```bash
   supabase functions deploy whale-clusters
   ```

3. **Run Setup Script**:
   ```bash
   ./scripts/setup-whale-clustering.sh
   ```

## Testing

Use the debug component in the Hub tab to verify:
- ✅ Edge Function is deployed
- ✅ Database tables exist with data
- ✅ Clusters are being generated
- ✅ Classification rules are working

## Configuration

### Chain-Specific Thresholds

Quantiles are calculated per chain with fallback values:

```typescript
const FALLBACK_THRESHOLDS = {
  ETH: { q70: 50000, q85: 250000 },
  SOL: { q70: 25000, q85: 100000 }, 
  BTC: { q70: 100000, q85: 500000 }
};
```

### Entity Recognition

- **CEX Entities**: binance, okx, coinbase, kraken, bybit, kucoin
- **DeFi Tags**: swap, lend, stake, bridge, yield, liquidity, perps
- **DeFi Types**: amm, lending, bridge, perps

## Performance

- **Hysteresis**: 15-minute buckets with 2/3 confirmation requirement
- **Cool-down**: 6-hour period before cluster changes
- **Threading**: Groups similar alerts by `thread_key`
- **Target Keep Rate**: 55-75% of processed alerts

## Monitoring

Key metrics to track:
- `keep_rate`: Percentage of alerts that pass classification
- `per_cluster_counts`: Distribution across cluster types
- `avg_confidence`: Average confidence scores
- `top_skip_reasons`: Most common reasons for skipping alerts

## Troubleshooting

### No Clusters Found
1. Check database has sample data in `whale_transfers`
2. Verify Edge Function deployment: `supabase functions list`
3. Check network connectivity and authentication
4. Review transaction amounts vs. chain thresholds

### Low Classification Rate
1. Adjust chain quantiles in `chain_quantiles` table
2. Review entity recognition mappings
3. Check tag and counterparty_type data quality
4. Verify behavioral signal calculations

### Performance Issues
1. Check database indexes on timestamp, chain, amount_usd
2. Monitor Edge Function execution time
3. Consider caching for frequently accessed data
4. Review query optimization in clustering logic