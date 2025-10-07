# AlphaWhale Data Sources - Live vs Mock

## Live Data (API/Supabase)

### 1. **Index Page (Home/Lite Hub)** - `/`
- **KPI Data**: `supabase.functions.invoke('market-kpis')`
  - whalePressure
  - marketSentiment
  - riskIndex
  - whaleInflow/Outflow
  - btcDominance
  - activeWhales
- **Status**: Live data with fallback to defaults

### 2. **Home Page (Whale Alerts)** - `/whales`
- **Whale Transactions**: `supabase.functions.invoke('whale-alerts')`
  - Real-time whale transaction data
  - Falls back to mock data on error
- **Status**: Live data with mock fallback
- **Mock Fallback**: 3 sample transactions when API fails

### 3. **Market Hub** - `/market/hub`
- **Whale Clusters**: `supabase.functions.invoke('whale-clusters')`
- **Market Summary**: `supabase.functions.invoke('market-summary-enhanced')`
- **Chain Risk**: `supabase.functions.invoke('market-chain-risk-quant')`
- **Status**: Live data with auto-refresh (30s for 24h, 5min for longer windows)

### 4. **Hub2 Pages** - `/hub2/*`
- **Entity Data**: `fetch('/api/edge/hub/entity/${id}')`
- **Status**: Live data from API routes

### 5. **Predictions** - `/predictions`
- **Predictions Data**: `supabase.functions.invoke('whale-predictions')`
- **Status**: Live data (non-fatal if fails)

## Mock/Demo Data

### 1. **DigestCard Component**
- Uses `demoMode` prop when user is not logged in
- Shows demo AI digest content for non-authenticated users

### 2. **Portfolio Components**
- Demo portfolio data for non-authenticated users
- Shows sample holdings and performance

### 3. **Signal Cards**
- Static signal data (not fetched from API)
- Hardcoded examples

### 4. **Streak/Progress**
- Mock streak data for non-authenticated users
- Real streak data from user profile when logged in

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     AlphaWhale Data Flow                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Index Page (/)                                              │
│  ├─ KPIs: Live (market-kpis) → Defaults                     │
│  ├─ Digest: Demo mode for guests                            │
│  └─ Signals: Static                                          │
│                                                               │
│  Home/Whales (/whales)                                       │
│  └─ Transactions: Live (whale-alerts) → Mock fallback       │
│                                                               │
│  Market Hub (/market/hub)                                    │
│  ├─ Clusters: Live (whale-clusters)                         │
│  ├─ Summary: Live (market-summary-enhanced)                 │
│  └─ Risk: Live (market-chain-risk-quant)                    │
│                                                               │
│  Hub2 (/hub2/*)                                              │
│  └─ Entity: Live (API routes)                               │
│                                                               │
│  Predictions (/predictions)                                  │
│  └─ Predictions: Live (whale-predictions)                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Supabase Edge Functions
- `market-kpis` - Market KPI data
- `whale-alerts` - Real-time whale transactions
- `whale-clusters` - Whale clustering analysis
- `market-summary-enhanced` - Enhanced market summary
- `market-chain-risk-quant` - Chain risk quantification
- `whale-predictions` - Predictive analytics

### Next.js API Routes
- `/api/edge/hub/entity/${id}` - Entity detail data

## Recommendations

1. **Add Loading States**: Ensure all live data fetches show proper loading indicators
2. **Error Boundaries**: Wrap live data components in error boundaries
3. **Cache Strategy**: Implement proper caching for frequently accessed data
4. **Fallback UI**: Provide meaningful fallback UI when data fails to load
5. **Mock Data Toggle**: Add dev mode toggle to test with mock data
