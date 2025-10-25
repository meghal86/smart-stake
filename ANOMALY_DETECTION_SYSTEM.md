# 🔍 Anomaly Detection System - Phase 2 Implementation

## Overview
The Anomaly Detection System uses advanced statistical methods and ML-inspired algorithms to identify unusual whale behavior patterns in real-time. This Pro+ feature provides early warning signals for potential market movements.

## 🎯 Key Features

### 1. **Statistical Anomaly Detection**
- **Z-Score Analysis**: Detects deviations beyond 3σ (99.7% threshold)
- **Modified Z-Score (MAD)**: Robust to outliers using Median Absolute Deviation
- **Isolation Forest Algorithm**: Multivariate anomaly detection
- **Historical Baseline Comparison**: 30-day rolling baseline

### 2. **Anomaly Types Detected**

#### Volume Spike
- Detects unusual increases in trading volume
- Compares 24h volume against 30-day baseline
- **Severity Levels**:
  - Critical: >5σ deviation
  - High: >4σ deviation
  - Medium: >3σ deviation

#### Coordinated Movement
- Identifies multiple whales moving to similar destinations
- Focuses on CEX (Centralized Exchange) concentration
- **Triggers**: 5+ whales with >50% CEX interaction ratio
- **Use Case**: Early warning for coordinated sell-offs

#### Dormant Activation
- Detects reactivation of dormant whale wallets
- **Dormancy Threshold**: 30+ days inactive
- **Balance Threshold**: $1M+ USD
- **Severity**: Based on dormancy duration (30d/60d/90d+)

#### Velocity Anomaly
- Identifies unusual transaction frequency
- Detects rapid succession of transfers
- **Applications**: 
  - Automated trading detection
  - Arbitrage activity monitoring
  - Potential wallet compromise alerts

#### Balance Deviation
- Multivariate analysis of balance patterns
- Uses isolation forest-inspired scoring
- Features analyzed:
  - Balance USD
  - Transfer volume
  - Unique counterparties

### 3. **Real-time Processing**
- **Edge Function**: `supabase/functions/anomaly-detector/`
- **Trigger**: Runs via cron (configurable interval)
- **Data Sources**:
  - `whale_balances`: Current balance data
  - `whale_transfers`: Transaction history
  - `whale_signals`: Risk indicators

### 4. **User Interface**
- **Dashboard**: `/anomaly-detection`
- **Real-time Updates**: WebSocket subscriptions
- **Filtering**: By severity, type, and affected whales
- **Statistics**: Total, Critical, High, Medium, Low counts
- **Actionable Insights**: Suggested actions for each anomaly

## 🗄️ Database Schema

### `anomaly_detections` Table
```sql
- id: UUID (primary key)
- anomaly_id: TEXT (unique identifier)
- severity: TEXT (low/medium/high/critical)
- confidence: DECIMAL (0-1 detection confidence)
- type: TEXT (anomaly type enum)
- description: TEXT (human-readable description)
- affected_whales: TEXT[] (whale addresses)
- metrics: JSONB (detection metrics)
- suggested_actions: TEXT[] (actionable insights)
- timestamp: TIMESTAMPTZ
- resolved: BOOLEAN
- resolved_at: TIMESTAMPTZ
```

### `anomaly_alerts` Table
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- anomaly_id: TEXT (references anomaly_detections)
- viewed: BOOLEAN
- viewed_at: TIMESTAMPTZ
- dismissed: BOOLEAN
- dismissed_at: TIMESTAMPTZ
```

### `anomaly_statistics` View
Real-time aggregated statistics:
- Count by type and severity
- Average confidence scores
- Active vs. resolved anomalies
- 30-day time window

## 🔬 Detection Algorithms

### 1. Statistical Z-Score
```typescript
zScore = (value - mean) / stdDev
```
- **Threshold**: |z| > 3
- **Use**: Volume and velocity anomalies

### 2. Modified Z-Score (MAD)
```typescript
modifiedZ = 0.6745 * (value - median) / MAD
```
- **Advantage**: Robust to outliers
- **Use**: Transaction pattern analysis

### 3. Isolation Forest Score
```typescript
isolationScore = 2^(-avgPathLength / c)
```
- **Threshold**: score > 0.6
- **Use**: Multivariate balance deviations
- **Features**: [balance, volume, counterparties]

## 📊 Confidence Scoring

Each anomaly includes a confidence score (0-1):
- **Volume Spike**: 0.7 + (|zScore| - 3) * 0.1
- **Coordinated Movement**: 0.75 + (whaleCount * 0.02)
- **Dormant Activation**: 0.85 (fixed, high confidence)
- **Velocity Anomaly**: 0.8 (fixed)
- **Balance Deviation**: isolation score (dynamic)

## 🎨 User Experience

### Dashboard Features
1. **Summary Statistics**
   - Total anomalies
   - Count by severity (Critical/High/Medium/Low)
   - Real-time updates

2. **Type Filtering**
   - 8 anomaly types with visual icons
   - Badge showing count per type
   - One-click filtering

3. **Severity Tabs**
   - All / Critical / High / Medium / Low
   - Color-coded badges
   - Quick navigation

4. **Anomaly Cards**
   - Expandable details
   - Affected whale addresses
   - Detection metrics (z-scores, deviations)
   - Suggested actions
   - Resolve/dismiss functionality

5. **Real-time Scanning**
   - "Run Detection" button
   - Progress indicator
   - Auto-refresh on new detections

### Mobile Responsive
- Optimized for all screen sizes
- Touch-friendly interactions
- Swipeable cards

## 🔧 Technical Implementation

### Service Layer
**File**: `src/services/anomalyDetection.ts`
- `detectAnomalies()`: Main detection function
- `getRecentAnomalies()`: Fetch from database
- `resolveAnomaly()`: Mark as resolved
- Statistical helper functions

### UI Components
**File**: `src/components/analytics/AnomalyDetectionDashboard.tsx`
- Main dashboard component
- Anomaly card rendering
- Real-time subscriptions
- Filtering and sorting

### Edge Function
**File**: `supabase/functions/anomaly-detector/index.ts`
- Serverless anomaly detection
- Scheduled execution (cron)
- Auto-persistence to database
- Alert generation for Pro+ users

### Database Migration
**File**: `supabase/migrations/20250126000000_anomaly_detections.sql`
- Table creation
- Indices for performance
- RLS policies
- Auto-alert trigger function

## 🚀 Deployment

### 1. Apply Database Migration
```bash
cd /Users/meghalparikh/Downloads/Whalepulse/smart-stake
supabase db push
```

### 2. Deploy Edge Function
```bash
supabase functions deploy anomaly-detector
```

### 3. Set Up Cron Job (Supabase Dashboard)
```sql
-- Run every 10 minutes
SELECT cron.schedule(
  'anomaly-detection-cron',
  '*/10 * * * *',
  $$SELECT net.http_post(
    url := 'https://[your-project].supabase.co/functions/v1/anomaly-detector',
    headers := '{"Authorization": "Bearer [your-anon-key]"}'::jsonb
  )$$
);
```

### 4. Route Configuration
Already added to `src/App.tsx`:
```typescript
<Route path="/anomaly-detection" element={<AnomalyDetection />} />
```

## 📈 Performance Considerations

### Query Optimization
- Indexed columns: `timestamp`, `severity`, `type`, `resolved`
- 30-day time window for historical data
- Limit of 100 recent anomalies in UI

### Caching Strategy
- Real-time subscriptions for live updates
- Client-side filtering to reduce re-fetching
- Memoized calculations in React components

### Scalability
- Edge function for distributed processing
- Async parallel detection algorithms
- Batch database inserts

## 🎯 Business Value

### For Users
- **Early Warning System**: Detect market movements before they happen
- **Risk Management**: Identify coordinated whale behavior
- **Portfolio Protection**: Alert on unusual patterns affecting holdings
- **Actionable Insights**: Clear suggestions for each anomaly

### For Product
- **Pro+ Feature**: Drives subscription upgrades
- **Competitive Advantage**: Advanced ML capabilities
- **Data-Driven**: Evidence-based anomaly detection
- **Extensible**: Easy to add new anomaly types

## 🔮 Future Enhancements

1. **Machine Learning Models**
   - LSTM for time-series pattern recognition
   - Clustering algorithms for behavior grouping
   - Supervised learning from resolved anomalies

2. **Advanced Analytics**
   - Anomaly correlation analysis
   - Predictive anomaly scoring
   - Custom user-defined thresholds

3. **Integration**
   - Push notifications for critical anomalies
   - Email alerts with detailed reports
   - Webhook support for external systems

4. **Visualization**
   - Anomaly timeline view
   - Geographic distribution maps
   - Network graphs for whale relationships

## 📚 Usage Examples

### Example 1: Volume Spike Detection
```typescript
// Detected when 24h volume > 3σ above 30-day average
{
  type: 'volume_spike',
  severity: 'high',
  confidence: 0.92,
  description: "Unusual trading volume: 156.75M USD (4.2σ above normal)",
  metrics: {
    currentVolume: 156750000,
    baselineMean: 45200000,
    zScore: 4.2,
    deviation: 246.8
  }
}
```

### Example 2: Coordinated Movement
```typescript
// Detected when 5+ whales send >50% of transfers to CEXs
{
  type: 'coordinated_movement',
  severity: 'critical',
  confidence: 0.85,
  description: "12 whales showing coordinated CEX transfers",
  affectedWhales: ["0x123...", "0x456...", ...],
  suggestedActions: [
    "Possible coordinated sell-off detected",
    "Monitor order books on major exchanges"
  ]
}
```

## ✅ Testing

### Manual Testing
1. Navigate to `/anomaly-detection`
2. Click "Run Detection"
3. View detected anomalies
4. Filter by severity and type
5. Expand anomaly for details
6. Mark as resolved

### Automated Testing
Create test data:
```sql
-- Insert whale transfers to trigger volume spike
INSERT INTO whale_transfers (from_address, to_address, amount_usd, chain, timestamp)
VALUES ('0xtest...', '0xdest...', 50000000, 'ethereum', NOW())
-- Repeat multiple times
```

## 📊 Monitoring

### Key Metrics
- Anomalies detected per day
- False positive rate
- Average confidence score
- User engagement (views, dismissals)

### Dashboard Queries
```sql
-- Active anomalies by severity
SELECT severity, COUNT(*) 
FROM anomaly_detections 
WHERE resolved = false 
GROUP BY severity;

-- Detection accuracy (user feedback)
SELECT 
  type,
  AVG(confidence) as avg_confidence,
  COUNT(*) FILTER (WHERE resolved = true) / COUNT(*)::float as resolution_rate
FROM anomaly_detections
GROUP BY type;
```

## 🎓 Best Practices

1. **Review Regularly**: Check dashboard daily for new anomalies
2. **Adjust Thresholds**: Fine-tune based on false positives
3. **Act on Insights**: Follow suggested actions
4. **Historical Analysis**: Review resolved anomalies for patterns
5. **Combine with Other Features**: Use with Guardian and Whale Analytics

## 🔒 Security & Privacy

- **RLS Policies**: Row-level security for user data
- **Service Role**: Edge function uses elevated permissions
- **Data Anonymization**: Wallet addresses truncated in UI
- **Audit Trail**: All resolutions logged with timestamps

---

## 📞 Support

For issues or questions:
- Dashboard: `/anomaly-detection`
- Documentation: This file
- Support: support@whalepulse.com

**Status**: ✅ Phase 2 - Complete and Production Ready

