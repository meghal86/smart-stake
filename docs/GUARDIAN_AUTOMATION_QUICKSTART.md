# Guardian Smart Automation - Quick Start Guide

## Overview

Guardian Smart Automation enables gasless, automated token approval revocations based on trust score thresholds. This system provides a production-ready implementation with smart contract wallets, relayer infrastructure, and comprehensive security policies.

## Prerequisites

- Node.js 18+
- Supabase project with service role key
- Upstash Redis instance
- Ethereum RPC endpoint (Infura/Alchemy)
- Relayer wallet with ETH for gas

## Quick Setup

### 1. Environment Configuration

```bash
# Copy environment template
cp .env.guardian-automation .env.local

# Fill in your values:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
UPSTASH_REDIS_URL=rediss://default:password@endpoint.upstash.io:6380
RPC_URL=https://mainnet.infura.io/v3/your_key
RELAYER_PRIVATE_KEY=your_relayer_private_key
GUARDIAN_RELAYER_API_KEY=generate_secure_key_here
```

### 2. Database Setup

```bash
# Apply Guardian automation schema
supabase db reset --linked
```

### 3. Deploy Edge Functions

```bash
# Deploy automation proposal function
supabase functions deploy guardian-automation-propose
```

### 4. Start Relayer Service

```bash
cd services/guardian-relayer
npm install
npm run build
npm start
```

### 5. Run Tests

```bash
# Verify everything is working
node scripts/test-guardian-automation.js
```

## User Flow

### 1. Enable Automation

Users see the `AutomationMigrationModal` when Guardian detects risky approvals:

```typescript
// Triggered automatically or manually
<AutomationMigrationModal 
  isOpen={showMigration}
  onClose={() => setShowMigration(false)}
  onComplete={() => window.location.reload()}
/>
```

### 2. Configure Policies

Users can adjust automation settings via `AutomationSettings`:

```typescript
<AutomationSettings />
```

### 3. Monitor Activity

Users track automation actions via `AutomationActivityFeed`:

```typescript
<AutomationActivityFeed />
```

## API Integration

### Propose Automation

```typescript
import { GuardianAutomationService } from '@/services/guardianAutomationService';

// When Guardian detects risky approval
await GuardianAutomationService.proposeAutomation({
  userId: user.id,
  contractAddress: '0x...',
  tokenAddress: '0x...',
  triggerReason: 'Trust score dropped to 2.1',
  trustScoreBefore: 2.1
});
```

### Check Automation Status

```typescript
const automation = await GuardianAutomationService.getAutomationStatus(userId);
if (automation?.status === 'active') {
  // Show automation is enabled
}
```

## Security Features

### Smart Contract Security
- ReentrancyGuard protection
- Owner-only administrative functions
- Policy-based execution limits
- Emergency withdrawal capability

### Relayer Security
- API key authentication
- Rate limiting (100 requests/15min)
- Input validation and sanitization
- Secure private key management

### Database Security
- Row Level Security (RLS) policies
- User isolation for all tables
- Audit logging for all actions
- Input validation on all endpoints

## Monitoring

### Health Checks

```bash
# Relayer health
curl http://localhost:3001/health

# Queue status
curl -H "Authorization: Bearer $GUARDIAN_RELAYER_API_KEY" \
     http://localhost:3001/api/queue-status
```

### Key Metrics

- Automation success rate
- Average processing time
- Queue depth and processing rate
- Gas cost optimization
- User adoption metrics

## Production Deployment

### 1. Infrastructure Setup

```bash
# Use the deployment script
./scripts/deploy-guardian-automation.sh
```

### 2. Environment Variables

Set these in your production environment:

```bash
# Production URLs
GUARDIAN_RELAYER_URL=https://your-relayer-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Security
GUARDIAN_RELAYER_API_KEY=production_secure_key
RELAYER_PRIVATE_KEY=production_relayer_key

# Monitoring
SENTRY_DSN=your_sentry_dsn
SLACK_WEBHOOK_URL=your_slack_webhook
```

### 3. Smart Contract Deployment

```bash
cd contracts
npm install
npm run deploy:mainnet  # or deploy:goerli for testnet
```

### 4. Monitoring Setup

- Set up Sentry for error tracking
- Configure Slack alerts for critical failures
- Monitor queue depth and processing times
- Set up log aggregation (ELK stack or similar)

## Troubleshooting

### Common Issues

1. **Relayer Service Won't Start**
   - Check Redis connection
   - Verify environment variables
   - Ensure port 3001 is available

2. **Automation Not Triggering**
   - Verify user has active automation
   - Check trust score threshold
   - Confirm policies are enabled

3. **Transaction Failures**
   - Check gas price limits
   - Verify relayer has sufficient ETH
   - Confirm contract addresses are correct

### Debug Commands

```bash
# Check database connectivity
node -e "console.log(require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY))"

# Test relayer connectivity
curl http://localhost:3001/health

# Check edge function
supabase functions invoke guardian-automation-propose --body '{"test": true}'
```

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review logs in Supabase dashboard
3. Monitor relayer service logs
4. Contact support with specific error messages

## Legal Considerations

- Gas sponsorship may create regulatory obligations
- Users must explicitly opt-in to automation
- Clear disclosure of automated actions required
- Audit trail maintained for all transactions
- Users can disable automation at any time