# 🐋 Live Whale Tracking Setup Guide

Complete setup for real-time whale transaction monitoring using live blockchain data.

## 🔑 Required API Keys

### 1. Etherscan API
- Visit: https://etherscan.io/apis
- Create free account
- Generate API key
- Add to `.env`: `ETHERSCAN_API_KEY="your-key"`

### 2. Alchemy API (Recommended)
- Visit: https://www.alchemy.com/
- Create free account (100M requests/month)
- Create new app for Ethereum Mainnet
- Add to `.env`: `ALCHEMY_API_KEY="your-key"`

### 3. Moralis API (Optional)
- Visit: https://moralis.io/
- Create free account
- Generate API key
- Add to `.env`: `MORALIS_API_KEY="your-key"`

## 🚀 Deployment Steps

### 1. Deploy Live Whale Tracker
```bash
supabase functions deploy live-whale-tracker
```

### 2. Deploy Real Whale Alerts
```bash
supabase functions deploy real-whale-alerts
```

### 3. Set Environment Variables
```bash
supabase secrets set ETHERSCAN_API_KEY="your-etherscan-key"
supabase secrets set ALCHEMY_API_KEY="your-alchemy-key"
```

### 4. Setup Cron Job (Optional)
```bash
# Add to crontab for automated whale monitoring
*/5 * * * * curl -X POST https://your-project.supabase.co/functions/v1/live-whale-tracker
```

## 📊 Data Sources

### Primary Sources
- **Etherscan**: Ethereum transactions
- **Alchemy**: Real-time blockchain data
- **CoinGecko**: Price data (free)

### Supported Chains
- Ethereum (ETH)
- Bitcoin (BTC) - via external APIs
- Tron (TRX) - via TronScan
- Solana (SOL) - via Solscan
- Avalanche (AVAX) - via SnowTrace

## 🔧 Configuration

### Whale Thresholds
```typescript
// Minimum transaction amounts to track
const WHALE_THRESHOLDS = {
  ETH: 100,      // 100+ ETH
  BTC: 10,       // 10+ BTC
  USDT: 1000000, // $1M+ USDT
  USDC: 1000000  // $1M+ USDC
}
```

### Update Intervals
- **Live Tracker**: Every 5 minutes
- **Price Updates**: Every 30 seconds
- **Frontend Refresh**: Every 2 minutes

## 🎯 Features

### Real-time Monitoring
- Live blockchain scanning
- Automatic whale detection
- Transaction classification
- Exchange identification

### Data Processing
- USD value calculation
- Risk level assessment
- Transaction type detection
- Historical tracking

### API Endpoints
- `/functions/v1/live-whale-tracker` - Blockchain scanner
- `/functions/v1/real-whale-alerts` - Alert API
- `/functions/v1/whale-predictions` - Live predictions

## 🔍 Monitoring

### Health Checks
```bash
# Test live whale tracker
curl https://your-project.supabase.co/functions/v1/live-whale-tracker

# Test real whale alerts
curl https://your-project.supabase.co/functions/v1/real-whale-alerts
```

### Database Queries
```sql
-- Check recent whale alerts
SELECT * FROM alerts 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY amount_usd DESC;

-- Monitor API performance
SELECT COUNT(*) as total_alerts,
       AVG(amount_usd) as avg_amount
FROM alerts 
WHERE created_at > NOW() - INTERVAL '24 hours';
```

## 🚨 Rate Limits

### API Limits
- **Etherscan**: 5 calls/second (free)
- **Alchemy**: 330 CU/second (free tier)
- **CoinGecko**: 50 calls/minute (free)

### Optimization
- Cache price data for 30 seconds
- Batch blockchain requests
- Use webhooks when available
- Implement exponential backoff

## 🛠️ Troubleshooting

### Common Issues

#### API Key Errors
```bash
# Check if secrets are set
supabase secrets list

# Update secrets
supabase secrets set ETHERSCAN_API_KEY="new-key"
```

#### Rate Limiting
- Implement request queuing
- Use multiple API keys
- Add delays between requests

#### Data Quality
- Validate transaction amounts
- Filter out dust transactions
- Handle API downtime gracefully

### Monitoring Commands
```bash
# Check function logs
supabase functions logs live-whale-tracker

# Monitor database
supabase db logs

# Test API endpoints
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  https://your-project.supabase.co/functions/v1/real-whale-alerts
```

## 📈 Performance Optimization

### Database Indexing
```sql
-- Add indexes for better performance
CREATE INDEX idx_alerts_timestamp ON alerts(created_at);
CREATE INDEX idx_alerts_amount ON alerts(amount_usd);
CREATE INDEX idx_alerts_chain ON alerts(chain);
```

### Caching Strategy
- Redis for real-time data
- CDN for static assets
- Browser caching for UI

### Scaling Considerations
- Horizontal scaling with multiple regions
- Load balancing for API calls
- Database read replicas

## 🔐 Security

### API Key Management
- Store keys in Supabase secrets
- Rotate keys regularly
- Monitor usage patterns

### Data Validation
- Sanitize all inputs
- Validate transaction hashes
- Check address formats

### Access Control
- Rate limiting per user
- Premium feature gating
- Audit logging

---

**Ready to track real whales! 🐋**