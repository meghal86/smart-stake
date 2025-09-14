# 🐋 Whale Analytics Implementation Guide

## Overview
The Whale Analytics system tracks large cryptocurrency holders (whales) and provides real-time insights into their trading patterns, risk profiles, and market behavior.

## Architecture

### 1. **Data Flow**
```
Blockchain APIs → blockchain-monitor → whale_data_cache → whale-analytics → Frontend
```

### 2. **Components**

#### **Frontend Component**
- **File**: `src/pages/WhaleAnalytics.tsx`
- **Purpose**: Display whale data with filtering, sorting, and detailed views
- **Features**:
  - Whale list with risk scores
  - Activity sparklines
  - Watchlist management
  - Alert creation
  - Behavior AI integration

#### **Backend Functions**

##### **whale-analytics** (Edge Function)
- **File**: `supabase/functions/whale-analytics/index.ts`
- **Purpose**: API endpoint to fetch whale data for frontend
- **Returns**:
```json
{
  "success": true,
  "whales": [
    {
      "id": "whale-1",
      "address": "0x47ac0F...a6D503",
      "fullAddress": "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503",
      "label": "Whale 1",
      "balance": 1250.5,
      "type": "investment|trading",
      "riskScore": 8.5,
      "roi": 145,
      "recentActivity": 45,
      "chain": "ethereum",
      "activityData": [10,15,20...],
      "isWatched": false
    }
  ],
  "marketSignals": {
    "highRisk": 1,
    "clustering": 0,
    "accumulation": 1
  },
  "totalWhales": 2,
  "lastUpdated": "2025-09-14T10:53:21.736Z"
}
```

##### **blockchain-monitor** (Edge Function)
- **File**: `supabase/functions/blockchain-monitor/index.ts`
- **Purpose**: Fetch whale data from blockchain APIs and store in database
- **APIs Used**:
  - **Alchemy API**: Primary blockchain data provider
  - **Moralis API**: Fallback blockchain data provider
- **Data Sources**:
  - Transaction history
  - Wallet balances
  - Gas usage patterns
  - Token transfers

#### **Cron Job**
- **File**: `scripts/whale-monitor-cron.sh`
- **Schedule**: Every 10 minutes
- **Purpose**: Automatically update whale data
- **Monitored Addresses**:
```bash
WHALE_ADDRESSES='[
  "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503",
  "0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a",
  "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "0x1522900b6dafac587d499a862861c0869be6e428"
]'
```

## Database Schema

### **whale_data_cache**
```sql
CREATE TABLE whale_data_cache (
  whale_address TEXT PRIMARY KEY,
  chain TEXT NOT NULL,
  balance DECIMAL,
  transaction_count INTEGER,
  last_activity TIMESTAMP,
  risk_score DECIMAL,
  wallet_type TEXT,
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '5 minutes')
);
```

### **whale_alerts**
```sql
CREATE TABLE whale_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  whale_address TEXT NOT NULL,
  alert_type TEXT CHECK (alert_type IN ('withdrawal', 'deposit', 'activity', 'balance')),
  threshold_amount DECIMAL,
  notification_method TEXT DEFAULT 'email',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **user_watchlists**
```sql
CREATE TABLE user_watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  whale_address TEXT NOT NULL,
  whale_label TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Integration

### **Alchemy API**
- **Purpose**: Primary blockchain data provider
- **Endpoints Used**:
  - `alchemy_getAssetTransfers`: Get transaction history
  - `eth_getBalance`: Get wallet balance
- **Configuration**:
```javascript
const baseUrl = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`;
```

### **Moralis API**
- **Purpose**: Fallback blockchain data provider
- **Endpoints Used**:
  - `/{address}?chain=eth`: Get transaction history
  - `/{address}/balance?chain=eth`: Get wallet balance
- **Configuration**:
```javascript
const baseUrl = 'https://deep-index.moralis.io/api/v2.2';
```

## Data Processing

### **Risk Score Calculation**
```javascript
function calculateRiskScore(transactions, balance) {
  let score = 5; // Base score
  if (balance > 1000) score += 2; // High balance = lower risk
  if (transactions.length < 10) score += 1; // Low activity = lower risk
  if (avgValue < 10) score += 1; // Small transactions = lower risk
  return Math.min(10, Math.max(1, score));
}
```

### **Wallet Type Classification**
```javascript
function classifyWalletType(transactions) {
  const txCount = transactions.length;
  const avgGasPrice = transactions.reduce((sum, tx) => 
    sum + parseFloat(tx.gasPrice || '0'), 0) / txCount;
  
  if (txCount > 50 && avgGasPrice > 20000000000) return 'trading';
  return 'investment';
}
```

### **Signal Generation**
```javascript
function generateSignals(transactions) {
  const signals = [];
  if (transactions.length > 100) signals.push('High Activity');
  if (transactions.some(tx => parseFloat(tx.value) > 100)) 
    signals.push('Large Transfers');
  return signals;
}
```

## Frontend Features

### **Whale List View**
- **Filtering**: By wallet type (trading/investment)
- **Sorting**: By balance, ROI, risk score, activity
- **Display Fields**:
  - Whale address (truncated)
  - Balance in ETH
  - ROI percentage
  - Risk score (1-10 scale)
  - Recent activity count
  - 30-day activity sparkline

### **Whale Detail Modal**
- **Portfolio Breakdown**: ETH, USDC, Other tokens
- **Activity Timeline**: 30-day transaction chart
- **Recent Counterparties**: Uniswap, Binance, etc.
- **Risk Analysis**: Detailed risk explanation

### **Alert System**
- **Alert Types**: Withdrawal, Deposit, Activity Spike, Balance Change
- **Thresholds**: Configurable amount limits
- **Notifications**: Email, Push, Both

### **Watchlist Management**
- **Personal Watchlists**: User-specific whale tracking
- **Community Watchlists**: Shared whale lists
- **Follow System**: Follow other users' watchlists

## Current Implementation Status

### ✅ **Completed**
- Frontend whale analytics page
- Database schema and tables
- Edge functions (whale-analytics, blockchain-monitor)
- Cron job for automated updates
- Risk scoring algorithm
- Wallet type classification
- Alert system UI
- Watchlist management

### 🔄 **Current State**
- **Data Source**: Hardcoded whale data (2 whales)
- **API Integration**: Configured but not actively fetching
- **Cron Job**: Running but not populating database
- **Database**: Tables created but empty

### 🚧 **To Complete**
1. **Fix API Integration**: Ensure blockchain APIs are working
2. **Database Population**: Fix cron job to store real data
3. **Live Data Flow**: Connect all components end-to-end
4. **Alert Processing**: Implement real-time notifications
5. **Performance Optimization**: Add caching and indexing

## Deployment

### **Functions**
```bash
supabase functions deploy whale-analytics
supabase functions deploy blockchain-monitor
```

### **Database**
```bash
supabase db push --include-all
```

### **Cron Job**
```bash
# Add to system crontab
*/10 * * * * /path/to/whale-monitor-cron.sh
```

## Environment Variables

### **Required**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALCHEMY_API_KEY=your-alchemy-key
MORALIS_API_KEY=your-moralis-key
```

## Monitoring

### **Logs**
- **Cron Job**: `/tmp/whale-monitor.log`
- **Edge Functions**: Supabase Dashboard → Functions → Logs

### **Health Checks**
- **API Status**: Check function response times
- **Data Freshness**: Monitor `cached_at` timestamps
- **Error Rates**: Track failed API calls

## Troubleshooting

### **No Whales Showing**
1. Check if `whale_data_cache` table exists
2. Verify cron job is running: `cat /tmp/whale-monitor.log`
3. Test API manually: Call blockchain-monitor function
4. Check database permissions

### **API Errors**
1. Verify API keys are set in Supabase secrets
2. Check API rate limits
3. Test with curl commands
4. Review function logs

### **Performance Issues**
1. Add database indexes
2. Implement query caching
3. Optimize API calls
4. Use connection pooling

## Future Enhancements

### **Phase 1**
- Real-time WebSocket updates
- Advanced risk algorithms
- Multi-chain support (Polygon, BSC, etc.)

### **Phase 2**
- Machine learning predictions
- Social sentiment analysis
- Portfolio correlation analysis

### **Phase 3**
- Mobile app integration
- API access for premium users
- Institutional features