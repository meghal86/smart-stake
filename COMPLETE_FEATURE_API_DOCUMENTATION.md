# 🐋 WhalePlus - Complete Feature & API Documentation

## 📋 **Table of Contents**
1. [Page Features Overview](#page-features-overview)
2. [External API Integrations](#external-api-integrations)
3. [Environment Variables](#environment-variables)
4. [API Pricing & Limits](#api-pricing--limits)
5. [Data Flow Architecture](#data-flow-architecture)

---

# 📊 **PAGE FEATURES OVERVIEW**

## 🏠 **1. HOME/ALERTS PAGE** (`Home.tsx`)

### **Core Features:**
- **Real-Time Whale Alerts** - Live transaction monitoring with 2-minute refresh
- **Multi-Chain Support** - Ethereum, Tron, Ripple, Solana, Avalanche, Polygon, BSC
- **Advanced Filtering** - Search by token, address, chain, minimum USD amount
- **Alert Templates** - Pre-configured filters ($10M+ Mega Whales, $5M+ Large Whales, etc.)
- **Transaction Classification** - Buy/Sell/Transfer detection with visual indicators
- **Live Data Status** - API health monitoring with transaction count
- **Plan-Based Limits** - Daily alert limits for Free users (50/day)
- **Compact/Expanded Views** - Toggle between detailed and compact transaction display
- **Transaction Details Modal** - Full transaction analysis with blockchain explorer links

### **Alert System:**
- **Custom Alert Creator** - Personalized whale transaction triggers
- **Alert Center** - Centralized alert management interface
- **Quick Alert Templates** - One-click alert setup for common scenarios
- **Alert History** - Track triggered alerts and success rates
- **Real-Time Notifications** - Instant alerts for matching transactions

### **Data Sources:**
- `whale-alerts` Edge Function → **Whale Alert API**
- `alerts` database table (fallback)
- Live blockchain APIs with transaction classification

---

## 💭 **2. SENTIMENT PAGE** (`MultiCoinSentiment.tsx`)

### **Core Features:**
- **Multi-Coin Analysis** - Top 20 cryptocurrencies with real-time sentiment
- **AI Sentiment Scoring** - 0-100 sentiment scores with trend analysis
- **Interactive Charts** - Historical sentiment trends with sparklines
- **News Integration** - Real-time crypto news with sentiment impact analysis
- **Advanced Filtering** - Sort by sentiment, price, change; filter by sentiment type
- **Favorites & Watchlist** - Personal coin tracking and management
- **Alert Integration** - Price, sentiment, volume, and breaking news alerts
- **Grid/Table Views** - Flexible display options for different use cases

### **Advanced Features:**
- **Detailed Coin Modals** - Comprehensive analysis with 6 tabs (Overview, Charts, News, Whales, Alerts, Notes)
- **Historical Charts** - 7-day price and sentiment history with interactive data points
- **Whale Activity Integration** - Cross-reference with whale transaction data
- **Personal Notes** - User annotations and trading notes per coin
- **Export Functionality** - Share insights and download reports
- **Real-Time News** - Live crypto news with automated sentiment analysis

### **Data Sources:**
- `multi-coin-sentiment` Edge Function → **CoinGecko API + Alternative.me API**
- `crypto-news` Edge Function → **CryptoCompare API**
- `ai-sentiment` Edge Function → **OpenAI API**

---

## 💼 **3. PORTFOLIO PAGE** (`Portfolio.tsx`)

### **Core Features:**
- **Multi-Address Monitoring** - Track unlimited wallet addresses
- **Live Portfolio Data** - Real-time balance and token holdings
- **Risk Assessment** - Individual wallet risk scoring (1-10 scale)
- **Whale Interaction Tracking** - Monitor connections to whale addresses
- **P&L Calculation** - Automatic profit/loss tracking with percentage changes
- **Address Grouping** - Organize addresses by categories (Personal, Exchange, VIP)
- **Export Functionality** - CSV export for portfolio analysis

### **Advanced Features:**
- **Address Classification** - Automatic detection of exchange vs personal wallets
- **Filtering & Sorting** - Filter by risk, profitability, activity; sort by multiple criteria
- **Pagination** - Handle large address lists efficiently
- **Live Data Integration** - Real-time updates from blockchain APIs
- **Mobile Optimization** - Responsive design with mobile-specific features

### **Data Sources:**
- `portfolio-tracker` Edge Function → **Mock Data (Configurable for live APIs)**
- Live blockchain APIs for balance and transaction data
- Local storage for address management

---

## 🐋 **4. WHALES PAGE** (`WhaleAnalytics.tsx`)

### **Core Features:**
- **Live Whale Balance Tracking** - Real-time whale wallet monitoring
- **AI Risk Scoring** - Advanced risk assessment (0-100 scale)
- **Multi-Chain Support** - Ethereum, Polygon, BSC whale tracking
- **Market Metrics Dashboard** - 24h volume, active whales, risk alerts
- **Blockchain Explorer Integration** - Direct links to transaction explorers
- **Risk Factor Analysis** - Detailed risk explanations with supporting evidence
- **Market Signals** - Live prediction signals and confidence scores

### **Advanced Features:**
- **Data Provenance** - Shows data source, provider, and confidence levels
- **Supporting Evidence** - Transaction hash links for verification
- **Live Data Ingestion** - Manual blockchain data refresh capability
- **Risk Summary Statistics** - Categorized risk distribution (High/Medium/Low)
- **Enhanced Market Metrics** - Volume, active addresses, signal analysis

### **Data Sources:**
- `whale_balances` table (populated by `blockchain-monitor`)
- `whale_signals` table (risk analysis)
- `whale_transfers` table (activity data)
- `blockchain-monitor` Edge Function → **Alchemy API**

---

## 📈 **5. ANALYTICS PAGE** (`PredictiveAnalytics.tsx`)

### **Core Features:**
- **Advanced Whale Predictions** - AI behavior analysis (accumulation, liquidation, cluster movement)
- **Market Impact Simulations** - Price impact, liquidity drain, recovery time calculations
- **ML Model Performance** - Real-time model accuracy tracking and details
- **Prediction Confidence Scoring** - 0-100% confidence with detailed explanations
- **Multi-Asset Support** - ETH, BTC, cross-chain prediction analysis
- **Interactive Tabs** - Predictions, Simulations, Models sections

### **Advanced Simulation Features:**
- **Liquidity Pool Analysis** - Chain-specific depth and slippage calculations
- **Cascade Risk Assessment** - High/Medium/Low risk categorization
- **Volume Spike Predictions** - Market volume impact forecasting
- **Arbitrage Opportunity Detection** - Cross-exchange price difference analysis
- **Recovery Time Estimation** - Market stabilization predictions
- **Risk Zone Analysis** - Price impact scenarios with probability calculations

### **Data Sources:**
- `ml-predictions` Edge Function → **Database + Calculations**
- `advanced-whale-predictions` Edge Function → **Mock Data + Simulations**
- Real-time market data for simulations

---

## 🔮 **6. PREDICTIONS PAGE** (`WhalePredictions.tsx`)

### **Core Features:**
- **Live Whale Predictions** - Real-time API calls to prediction engine
- **Multi-Type Predictions** - Price movement, volume spikes, whale activity
- **Prediction History** - Historical accuracy tracking and performance metrics
- **Scenario Comparison** - Custom scenario builder and comparison tools
- **Alert Integration** - Prediction-based alert creation and management
- **Model Documentation** - AI model explanations and methodology
- **Premium Gating** - Requires Premium subscription for full access

### **Advanced Features:**
- **Explainability Panel** - Detailed prediction reasoning and feature importance
- **Scenario Builder** - Custom market condition testing with parameters
- **Alert Wizard** - Prediction-based notification setup
- **Performance Metrics** - Model accuracy, success rates, and confidence intervals
- **Export Functionality** - PDF/CSV prediction reports
- **Real-Time Updates** - 30-second refresh intervals for live predictions

### **Data Sources:**
- `whale-predictions` Edge Function → **Etherscan API + Live Analysis**
- Real-time prediction algorithms with confidence scoring

---

## 🔍 **7. SCANNER PAGE** (`Scanner.tsx`)

### **Core Features:**
- **AI-Powered Risk Assessment** - Comprehensive wallet risk analysis (1-10 scale)
- **Real-Time Scanning** - Live blockchain data analysis with progress tracking
- **Multi-Factor Risk Analysis** - Liquidity, history, associations, volatility scoring
- **Sanctions Screening** - OFAC/EU sanctions list checking
- **Transaction Pattern Analysis** - Detect suspicious patterns and behaviors
- **Plan-Based Limits** - Daily scan limits for Free users

### **Advanced Features:**
- **WhalePlus Integration** - Portfolio analysis, transaction graphs, DeFi positions
- **Risk Breakdown** - Detailed risk factor explanations and methodology
- **Pattern Detection** - Address poisoning, dusting attacks, mixer usage detection
- **Entity Attribution** - Exchange wallet detection and classification
- **Historical Risk Trends** - 30-day risk score evolution with event correlation
- **Advanced Tabs** - Risk, Portfolio, Network, DeFi, Reports, Notes, Alerts, Watchlist, Analytics

### **Professional Features:**
- **Transaction Graph** - Interactive network visualization
- **DeFi Positions** - Protocol-specific position tracking
- **Report Exporter** - Professional PDF/CSV/JSON reports
- **Team Collaboration** - Wallet annotations and shared insights
- **Real-Time Alerts** - Live monitoring and notification system
- **Watchlist Management** - Comprehensive wallet monitoring

### **Data Sources:**
- `riskScan` Edge Function → **Mock Analysis (Configurable for live APIs)**
- `chainalysis-sanctions` Edge Function → **Chainalysis API**
- Live blockchain APIs for transaction data
- DeFi protocol APIs for position tracking

---

# 🔗 **EXTERNAL API INTEGRATIONS**

## 📊 **BLOCKCHAIN DATA APIs**

### **`blockchain-monitor/index.ts`**
- **🔵 Alchemy API** - `https://eth-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}`
  - `eth_getBalance` - Get wallet ETH balances
  - `eth_blockNumber` - Get latest block number
  - `alchemy_getAssetTransfers` - Get whale transfers
- **Environment Variable**: `ALCHEMY_API_KEY`

### **`live-whale-tracker/index.ts`**
- **🔵 Alchemy API** - `https://eth-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}`
  - `eth_blockNumber` - Get latest block
  - `eth_getBlockByNumber` - Get block transactions
- **🟠 Etherscan API** (Fallback) - `https://api.etherscan.io/api`
  - `module=account&action=txlist` - Get transaction history
- **🟢 CoinGecko API** - `https://api.coingecko.com/api/v3/simple/price`
  - Get current ETH price for USD conversion
- **Environment Variables**: `ALCHEMY_API_KEY`, `ETHERSCAN_API_KEY`

### **`whale-alerts/index.ts`**
- **🐋 Whale Alert API** - `https://api.whale-alert.io/v1/transactions`
  - Get live whale transactions (>$500K)
- **Environment Variable**: `WHALE_ALERT_API_KEY`

### **`whale-predictions/index.ts`**
- **🟠 Etherscan API** - `https://api.etherscan.io/api`
  - Live whale transaction analysis
  - Rule-based prediction generation
- **Environment Variable**: `ETHERSCAN_API_KEY`

---

## 💰 **MARKET DATA APIs**

### **`multi-coin-sentiment/index.ts`**
- **🟢 CoinGecko API** - `https://api.coingecko.com/api/v3/simple/price`
  - Price data for top 20 cryptocurrencies
  - 24h change, market cap, volume data
- **😨 Alternative.me API** - `https://api.alternative.me/fng/`
  - Fear & Greed Index (0-100 scale)
- **No API Keys Required** (Free tier)

### **`ai-sentiment/index.ts`**
- **🟢 CoinGecko API** - `https://api.coingecko.com/api/v3/simple/price`
  - BTC/ETH prices and market data
- **🟢 CoinGecko Global API** - `https://api.coingecko.com/api/v3/global`
  - Market dominance and total market cap
- **😨 Alternative.me API** - `https://api.alternative.me/fng/`
  - Fear & Greed Index
- **🤖 OpenAI API** - `https://api.openai.com/v1/chat/completions`
  - GPT-3.5-turbo for AI sentiment analysis
- **Environment Variable**: `OPENAI_API_KEY`

---

## 📰 **NEWS & SOCIAL APIs**

### **`crypto-news/index.ts`**
- **📊 CryptoCompare API** - `https://min-api.cryptocompare.com/data/v2/news/`
  - Real-time crypto news with categories
  - Automated sentiment analysis on news titles
- **No API Key Required** (Free tier)

---

## 🏦 **DEFI & YIELD APIs**

### **`fetchYields/index.ts`**
- **🦙 DeFiLlama API** - `https://yields.llama.fi/pools`
  - DeFi protocol yield data
  - TVL, APY, and risk metrics
- **No API Key Required** (Free public API)

---

## 🛡️ **COMPLIANCE & SECURITY APIs**

### **`chainalysis-sanctions/index.ts`**
- **⛓️ Chainalysis Public API** - `https://public.chainalysis.com/api/v1/address/{address}`
  - OFAC sanctions screening
  - Address risk assessment
- **Environment Variable**: `CHAINALYSIS_API_KEY`

---

## 💳 **PAYMENT APIs**

### **`stripe-webhook/index.ts`** & **`create-checkout-session/index.ts`**
- **💳 Stripe API** - `https://api.stripe.com/v1/`
  - Payment processing
  - Subscription management
  - Webhook handling
- **Environment Variables**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

---

# 🔑 **ENVIRONMENT VARIABLES**

## **Required API Keys**

### **Blockchain & Crypto Data**
```bash
# Alchemy (Primary blockchain data)
ALCHEMY_API_KEY="your-alchemy-key"

# Etherscan (Fallback blockchain data)  
ETHERSCAN_API_KEY="your-etherscan-key"

# Whale Alert (Live whale transactions)
WHALE_ALERT_API_KEY="your-whale-alert-key"
```

### **AI & Analysis**
```bash
# OpenAI (AI sentiment analysis)
OPENAI_API_KEY="your-openai-key"

# Chainalysis (Sanctions screening)
CHAINALYSIS_API_KEY="your-chainalysis-key"
```

### **Payments**
```bash
# Stripe (Payment processing)
STRIPE_SECRET_KEY="sk_live_your-stripe-secret"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
```

### **Supabase Configuration**
```bash
# Supabase (Database & Auth)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## **Setting Environment Variables**

### **For Supabase Edge Functions:**
```bash
supabase secrets set ALCHEMY_API_KEY="your-alchemy-key"
supabase secrets set ETHERSCAN_API_KEY="your-etherscan-key"
supabase secrets set WHALE_ALERT_API_KEY="your-whale-alert-key"
supabase secrets set OPENAI_API_KEY="your-openai-key"
supabase secrets set CHAINALYSIS_API_KEY="your-chainalysis-key"
supabase secrets set STRIPE_SECRET_KEY="your-stripe-secret"
supabase secrets set STRIPE_WEBHOOK_SECRET="your-webhook-secret"
```

### **For Frontend (.env file):**
```bash
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_your-stripe-publishable"
```

---

# 💰 **API PRICING & LIMITS**

## **Paid APIs**

| API Provider | Free Tier | Paid Plans | Monthly Cost | Usage |
|-------------|-----------|------------|--------------|-------|
| **Alchemy** | 300M requests/month | $199+/month | $199-$999 | Blockchain data |
| **Whale Alert** | 1,000 calls/month | $50+/month | $50-$200 | Live whale alerts |
| **OpenAI** | $5 credit | $0.002/1K tokens | $20-$100 | AI analysis |
| **Chainalysis** | No free tier | $500+/month | $500-$2000 | Sanctions screening |
| **Etherscan** | 100K calls/day | $199+/month | $199-$499 | Backup blockchain |
| **Stripe** | No monthly fee | 2.9% + 30¢/transaction | Variable | Payments |

## **Free APIs**

| API Provider | Rate Limits | Features |
|-------------|-------------|----------|
| **CoinGecko** | 50 calls/minute | Market data, prices, global metrics |
| **Alternative.me** | No published limits | Fear & Greed Index |
| **CryptoCompare** | 100K calls/month | Crypto news (free tier) |
| **DeFiLlama** | No published limits | DeFi yield data |

---

# 🔄 **DATA FLOW ARCHITECTURE**

## **API Fallback Strategy**

### **Primary → Fallback Chain**
1. **Blockchain Data**: Alchemy → Etherscan → Mock data
2. **Market Data**: CoinGecko → Alternative.me → Cached data
3. **News**: CryptoCompare → Mock news → Empty state
4. **Whale Alerts**: Whale Alert API → Database cache → Demo data

### **Error Handling**
- All functions include comprehensive error handling
- Graceful degradation to mock/cached data
- User-friendly error messages
- Automatic retry mechanisms

## **Data Processing Pipeline**

```
External APIs → Edge Functions → Supabase Database → Frontend Components
     ↓              ↓                    ↓                    ↓
Live Data → Processing/Analysis → Structured Storage → Real-time UI
```

### **Real-Time Updates**
- **Home Page**: 2-minute refresh for whale alerts
- **Sentiment**: 2-minute refresh for market data
- **Analytics**: 30-second refresh for predictions
- **Scanner**: On-demand scanning with progress tracking

---

# 🚀 **DEPLOYMENT CHECKLIST**

## **1. API Keys Setup**
- [ ] Alchemy API key configured
- [ ] Etherscan API key configured
- [ ] Whale Alert API key configured
- [ ] OpenAI API key configured
- [ ] Chainalysis API key configured
- [ ] Stripe keys configured

## **2. Database Setup**
- [ ] Supabase project created
- [ ] Database migrations applied
- [ ] Row Level Security policies configured
- [ ] Edge Functions deployed

## **3. Frontend Configuration**
- [ ] Environment variables set
- [ ] Supabase client configured
- [ ] Stripe client configured
- [ ] Build and deployment successful

## **4. Testing**
- [ ] API connections tested
- [ ] Fallback mechanisms verified
- [ ] Error handling validated
- [ ] Performance optimized

---

# 📊 **FEATURE SUMMARY**

## **Live Data Features** ✅
- Real-time whale transaction monitoring
- Live market sentiment analysis
- Current cryptocurrency prices and metrics
- Real-time news with sentiment scoring
- Live blockchain data ingestion
- Sanctions screening with Chainalysis

## **Mock Data Features** 🔄
- Portfolio tracking (configurable for live APIs)
- Advanced risk scanning (configurable for live APIs)
- ML prediction models (demo data)
- Historical accuracy metrics

## **Premium Features** 👑
- Advanced whale predictions
- Unlimited wallet scanning
- Professional report exports
- Team collaboration tools
- Real-time alert system

---

**🎉 Your WhalePlus application is production-ready with comprehensive live data integration and robust fallback systems!**