# 🚨 On-chain Alert Customization Feature

## Overview

The On-chain Alert Customization feature empowers users to create sophisticated, multi-condition alerts with advanced logic and time-based triggers for precise whale monitoring and actionable insights.

## 🎯 Core Features

### 1. Alert Rule Builder
- **Multi-Condition Setup**: Create alerts with multiple conditions (amount, chain, token, whale tags, etc.)
- **Boolean Logic**: Configure AND/OR/NOR operators for complex rule combinations
- **Time-Based Triggers**: Set time windows and frequency limits
- **Real-Time Validation**: Preview and test rules before activation

### 2. Alert Management Dashboard
- **My Alerts**: Comprehensive dashboard showing active, inactive, and triggered alerts
- **Rule Operations**: Edit, pause, duplicate, or delete alert rules
- **Performance Tracking**: View trigger counts and last activation times
- **History Logs**: Complete audit trail of alert activations

### 3. Delivery Channels
- **Multi-Channel Support**: Push notifications, email, SMS, and webhooks
- **Custom Webhooks**: Integration with external systems and APIs
- **Priority Levels**: 5-tier priority system (Low to Emergency)
- **Delivery Status**: Track success/failure of each notification method

### 4. Alert Templates
- **Preset Configurations**: Ready-to-use templates for common scenarios
- **Categories**: Whale, DeFi, Security, and Trading templates
- **Premium Templates**: Advanced configurations for premium users
- **Template Customization**: Modify templates to fit specific needs

## 🏗️ Technical Architecture

### Database Schema

#### `alert_rules` Table
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to auth.users)
- name: TEXT (Rule name)
- description: TEXT (Optional description)
- conditions: JSONB (Array of condition objects)
- logic_operator: TEXT (AND/OR/NOR)
- time_window_hours: INTEGER (Optional time constraint)
- frequency_limit: INTEGER (Max alerts per time window)
- delivery_channels: JSONB (Channel preferences)
- webhook_url: TEXT (Optional webhook endpoint)
- priority: INTEGER (1-5 priority level)
- is_active: BOOLEAN (Rule status)
- times_triggered: INTEGER (Trigger count)
- last_triggered_at: TIMESTAMP (Last activation)
```

#### `alert_rule_history` Table
```sql
- id: UUID (Primary Key)
- alert_rule_id: UUID (Foreign Key to alert_rules)
- user_id: UUID (Foreign Key to auth.users)
- alert_id: UUID (Foreign Key to alerts)
- matched_conditions: JSONB (Conditions that matched)
- delivery_status: JSONB (Delivery attempt results)
- triggered_at: TIMESTAMP (When rule was triggered)
```

#### `alert_templates` Table
```sql
- id: UUID (Primary Key)
- name: TEXT (Template name)
- description: TEXT (Template description)
- category: TEXT (whale/defi/security/trading)
- template_conditions: JSONB (Default conditions)
- default_logic_operator: TEXT (Suggested logic)
- suggested_delivery_channels: JSONB (Recommended channels)
- is_premium: BOOLEAN (Premium feature flag)
- popularity_score: INTEGER (Usage popularity)
```

### Edge Function Processing

The `custom-alert-processor` Edge Function:
1. Receives whale alert data
2. Evaluates against all active user rules
3. Processes matched rules with frequency limits
4. Sends notifications via configured channels
5. Records history and updates statistics

### React Components

#### Core Components
- `AlertRuleBuilder`: Visual rule creation interface
- `AlertDashboard`: Management dashboard with tabs
- `AlertTemplates`: Template browser and selector
- `AlertsManager`: Main modal with tabbed interface
- `AlertQuickActions`: Sidebar integration component

#### Custom Hook
- `useCustomAlerts`: Manages CRUD operations and state

## 🎨 User Experience

### Alert Rule Creation Flow
1. **Access**: Click "Create Custom Alert" from Alert Center
2. **Template Selection**: Choose from preset templates or start from scratch
3. **Condition Setup**: Add multiple conditions with operators
4. **Logic Configuration**: Set AND/OR/NOR relationships
5. **Delivery Setup**: Configure notification channels
6. **Testing**: Preview and test rule behavior
7. **Activation**: Save and activate the rule

### Alert Management
- **Dashboard Tabs**: Active, Inactive, Recently Triggered, History
- **Quick Actions**: Toggle status, edit, duplicate, delete
- **Performance Metrics**: Trigger counts and timing
- **Delivery Tracking**: Success/failure status per channel

### Template System
- **Categories**: Organized by use case (Whale, DeFi, Security, Trading)
- **Popularity**: Templates ranked by usage
- **Premium Features**: Advanced templates for premium users
- **Customization**: Modify templates before creating rules

## 🔧 Implementation Guide

### 1. Database Setup
```bash
# Run the migration
supabase db push

# The migration creates all necessary tables and RLS policies
```

### 2. Edge Function Deployment
```bash
# Deploy the alert processor function
supabase functions deploy custom-alert-processor

# Set required environment variables
supabase secrets set SUPABASE_URL="your-supabase-url"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 3. Frontend Integration
```tsx
// Add to your whale tracking page
import { AlertQuickActions } from '@/components/alerts/AlertQuickActions';

// In your component
<AlertQuickActions />
```

### 4. Webhook Integration
Users can configure webhook URLs to receive alerts in external systems:

```json
{
  "rule": {
    "id": "rule-uuid",
    "name": "Large ETH Movements"
  },
  "alert": {
    "from_addr": "0x...",
    "to_addr": "0x...",
    "amount_usd": 2500000,
    "token": "ETH",
    "chain": "ethereum",
    "tx_hash": "0x..."
  },
  "matchedConditions": {
    "amount": 2500000,
    "token": "ETH"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 📊 Alert Condition Types

### Amount Conditions
- **Operators**: ≥ (gte), ≤ (lte), = (eq)
- **Currencies**: USD, ETH, BTC
- **Example**: Amount ≥ $1,000,000 USD

### Chain Conditions
- **Operators**: Equals, In List, Not In List
- **Supported**: Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche
- **Example**: Chain = Ethereum

### Token Conditions
- **Operators**: Equals, In List, Not In List
- **Tokens**: ETH, BTC, USDC, USDT, MATIC, BNB, etc.
- **Example**: Token in [USDC, USDT]

### Whale Tag Conditions
- **Detection**: Based on wallet analysis and transaction patterns
- **Operators**: Is Whale, Not Whale
- **Example**: Wallet = Known Whale

### Direction Conditions
- **Types**: Buy/Deposit, Sell/Withdrawal, Transfer
- **Analysis**: Transaction flow and exchange interaction
- **Example**: Direction = Buy

### Time Window Conditions
- **Units**: Hours, Days, Minutes
- **Usage**: Multi-transaction pattern detection
- **Example**: Within 24 hours

## 🔐 Security & Privacy

### Row Level Security (RLS)
- Users can only access their own alert rules
- History records are user-scoped
- Templates are publicly readable for authenticated users

### Webhook Security
- HTTPS-only webhook URLs
- User-Agent identification: `WhalePlus-Alert-System/1.0`
- Timeout protection (30 seconds)
- Retry logic for failed deliveries

### Rate Limiting
- Frequency limits prevent spam
- Time window controls
- Per-user rule limits (configurable)

## 📈 Analytics & Monitoring

### Rule Performance
- Trigger frequency tracking
- Delivery success rates
- User engagement metrics
- Popular template usage

### System Health
- Edge function performance
- Database query optimization
- Notification delivery monitoring
- Error rate tracking

## 🚀 Future Enhancements

### Phase 1 (Current)
- ✅ Multi-condition rule builder
- ✅ Boolean logic operators
- ✅ Template system
- ✅ Multi-channel delivery

### Phase 2 (Planned)
- 🔄 Machine learning condition suggestions
- 🔄 Advanced whale behavior patterns
- 🔄 Cross-chain correlation alerts
- 🔄 Social sentiment integration

### Phase 3 (Future)
- 📋 API access for rule management
- 📋 Collaborative rule sharing
- 📋 Advanced analytics dashboard
- 📋 Mobile app push notifications

## 🆘 Troubleshooting

### Common Issues

#### Rules Not Triggering
1. Check rule is active (`is_active = true`)
2. Verify conditions match alert data
3. Check frequency limits aren't exceeded
4. Review logic operator (AND vs OR)

#### Delivery Failures
1. Verify webhook URLs are accessible
2. Check notification permissions
3. Review delivery status in history
4. Test individual channels

#### Performance Issues
1. Monitor Edge function logs
2. Check database query performance
3. Review rule complexity
4. Optimize condition logic

### Debug Commands
```sql
-- Check active rules for user
SELECT * FROM alert_rules WHERE user_id = 'user-uuid' AND is_active = true;

-- View recent rule history
SELECT * FROM alert_rule_history WHERE user_id = 'user-uuid' ORDER BY triggered_at DESC LIMIT 10;

-- Check template usage
SELECT name, popularity_score FROM alert_templates ORDER BY popularity_score DESC;
```

## 📚 API Reference

### Edge Function Endpoints

#### Process Alert
```
POST /functions/v1/custom-alert-processor
Content-Type: application/json

{
  "alert": {
    "id": "alert-uuid",
    "from_addr": "0x...",
    "to_addr": "0x...",
    "amount_usd": 1000000,
    "token": "ETH",
    "chain": "ethereum",
    "tx_hash": "0x...",
    "detected_at": "2024-01-15T10:30:00Z"
  }
}
```

### Database Functions

#### Check Alert Rules
```sql
SELECT check_alert_rules('{"amount_usd": 1000000, "chain": "ethereum", "token": "ETH"}'::jsonb);
```

This comprehensive alert customization system provides users with powerful tools to monitor on-chain activity with precision and receive timely notifications through their preferred channels.