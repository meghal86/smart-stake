# 09 - API Reference

## Edge Functions

### `ingest_whales_live`

**Endpoint**: `POST /functions/v1/ingest_whales_live`

**Description**: Ingests whale transactions from Alchemy API

**Request**: No body required

**Response**:
```json
{
  "ingested": 42,
  "latestTs": "2024-01-15T10:30:00Z"
}
```

**Error Response**:
```json
{
  "ingested": 0,
  "error": "Provider timeout"
}
```

---

### `whale-spotlight`

**Endpoint**: `GET /functions/v1/whale-spotlight`

**Description**: Returns largest whale moves and activity summary

**Response**:
```json
{
  "largest_move_usd": 5000000,
  "most_active_wallet": "0x742d35Cc6634C0532925a3b8D",
  "total_volume_usd": 85000000,
  "tx_hash": "0xabc123...",
  "last_updated_iso": "2024-01-15T10:30:00Z",
  "provenance": "Real"
}
```

**Provenance Values**:
- `"Real"`: Data age ≤180 seconds
- `"Simulated"`: Data age >180 seconds or mock mode

---

### `fear-index`

**Endpoint**: `GET /functions/v1/fear-index`

**Description**: Calculates whale fear/greed index from recent activity

**Response**:
```json
{
  "score": 67,
  "label": "Accumulation",
  "last_updated_iso": "2024-01-15T10:30:00Z",
  "provenance": "Real",
  "methodologyUrl": "/docs/methodology#fear-index"
}
```

**Score Bands**:
- `0-24`: "Extreme fear"
- `25-44`: "Fear"  
- `45-55`: "Neutral"
- `56-74`: "Accumulation"
- `75-100`: "Aggressive accumulation"

---

### `prices`

**Endpoint**: `GET /functions/v1/prices?ids=ethereum,bitcoin`

**Description**: Proxies CoinGecko price API with caching

**Parameters**:
- `ids`: Comma-separated coin IDs (default: `ethereum,bitcoin`)

**Response**:
```json
{
  "ethereum": { "usd": 2500.50 },
  "bitcoin": { "usd": 45000.25 }
}
```

---

### `backfill_24h`

**Endpoint**: `POST /functions/v1/backfill_24h`

**Description**: Backfills last 24 hours of whale data (idempotent)

**Response**:
```json
{
  "backfilled": 156,
  "period": "24h"
}
```

---

## Health Endpoints

### `/api/healthz`

**Description**: System health check with data quality metrics

**Response** (200 - Healthy):
```json
{
  "status": "healthy",
  "latestEventAgeSec": 45,
  "provenance": "Real",
  "vol24h": 125000000,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response** (206 - Degraded):
```json
{
  "status": "degraded",
  "latestEventAgeSec": 300,
  "provenance": "Simulated",
  "vol24h": 125000000,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response** (500 - Unhealthy):
```json
{
  "status": "unhealthy",
  "latestEventAgeSec": 900,
  "provenance": "Simulated",
  "vol24h": 0,
  "error": "Database connection failed",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Database Schema

### `events_whale` Table

```sql
CREATE TABLE public.events_whale (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts timestamptz NOT NULL,
  asset text NOT NULL,
  amount_usd numeric NOT NULL,
  direction text DEFAULT 'unknown',
  src text DEFAULT 'unknown',
  wallet_hash text NOT NULL,
  tx_hash text NOT NULL,
  log_index int DEFAULT 0,
  confidence text DEFAULT 'Medium',
  meta jsonb DEFAULT '{}'::jsonb
);
```

**Indexes**:
- `uq_events_whale_tx` (unique): `tx_hash, log_index`
- `ix_events_whale_ts`: `ts DESC`
- `ix_events_whale_amount`: `amount_usd DESC`

---

### Data Quality Views

#### `data_freshness`
```sql
SELECT 
  max(ts) as latest_event,
  extract(epoch from (now() - max(ts))) as age_seconds,
  case 
    when extract(epoch from (now() - max(ts))) < 180 then 'Fresh'
    when extract(epoch from (now() - max(ts))) < 600 then 'Stale'
    else 'Critical'
  end as status
FROM public.events_whale;
```

#### `volume_24h`
```sql
SELECT 
  sum(amount_usd) as total_volume,
  count(*) as tx_count,
  count(distinct wallet_hash) as unique_wallets
FROM public.events_whale 
WHERE ts > now() - interval '24 hours';
```

---

## Error Codes

### Function Errors

| Code | Description | Action |
|------|-------------|---------|
| `PROVIDER_TIMEOUT` | Alchemy/Etherscan API timeout | Retry with backoff |
| `PROVIDER_RATE_LIMIT` | API rate limit exceeded | Wait and retry |
| `INVALID_RESPONSE` | Malformed API response | Log and skip |
| `DATABASE_ERROR` | Supabase connection failed | Check DB health |
| `PRICE_FETCH_FAILED` | CoinGecko API unavailable | Use cached prices |

### HTTP Status Codes

| Status | Meaning | Response |
|--------|---------|----------|
| `200` | Success | Normal response |
| `206` | Partial Content | Degraded/cached data |
| `429` | Rate Limited | Retry after delay |
| `500` | Server Error | Check logs |
| `503` | Service Unavailable | Provider down |

---

## Rate Limits

### External APIs
- **Alchemy**: 300 requests/second
- **Etherscan**: 5 requests/second  
- **CoinGecko**: 10-50 requests/minute

### Internal Limits
- **Ingestion**: Every 60 seconds
- **Health checks**: Every 30 seconds
- **Client requests**: 60 requests/minute per IP

---

## Monitoring Queries

### Recent Ingestion Activity
```sql
SELECT 
  date_trunc('hour', ts) as hour,
  count(*) as events,
  sum(amount_usd) as volume
FROM events_whale 
WHERE ts > now() - interval '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

### Top Wallets by Volume
```sql
SELECT 
  wallet_hash,
  count(*) as tx_count,
  sum(amount_usd) as total_volume
FROM events_whale 
WHERE ts > now() - interval '24 hours'
GROUP BY wallet_hash
ORDER BY total_volume DESC
LIMIT 10;
```

### Data Quality Metrics
```sql
SELECT 
  count(*) as total_events,
  count(*) FILTER (WHERE amount_usd < 0) as negative_amounts,
  count(*) FILTER (WHERE tx_hash IS NULL OR tx_hash = '') as missing_hashes,
  avg(amount_usd) as avg_amount,
  max(ts) as latest_event
FROM events_whale;
```

---

**Next**: [Troubleshooting](./10-troubleshooting.md)