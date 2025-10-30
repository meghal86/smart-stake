# Guardian Smart Automation

Production-grade system for automated, gasless token approval revocations using Smart Contract Wallets and relayer infrastructure.

## Architecture Overview

```
User EOA → Smart Contract Wallet → Guardian Backend → Relayer Service → Blockchain
                ↓                        ↓               ↓
         Policy Engine ←→ Risk Assessment ←→ Queue Processing
                ↓                        ↓               ↓
         Supabase Logs ←→ Activity Feed ←→ Notifications
```

## Components

### 1. Smart Contract Wallet (`contracts/GuardianSmartWallet.sol`)
- Non-custodial wallet with automation policies
- Enforces daily limits and gas price caps
- Only allows pre-approved revoke operations (approve with 0 amount)
- Emergency withdrawal for owner

### 2. Relayer Service (`services/guardian-relayer/`)
- Node.js/TypeScript service with Redis queue
- Processes automation requests with rate limiting
- Manages transaction signing and gas payment
- Provides health monitoring and error handling

### 3. Database Schema (`supabase/migrations/`)
- `guardian_automations`: User opt-in status and wallet addresses
- `guardian_automation_policies`: User-defined automation rules
- `guardian_automation_logs`: Complete audit trail with tx hashes

### 4. Edge Functions (`supabase/functions/`)
- `guardian-automation-propose`: Validates and queues automation requests
- Policy enforcement and trust score validation
- Integration with relayer service

### 5. Frontend Components (`src/components/guardian/`)
- `AutomationMigrationModal`: One-time opt-in flow
- `AutomationActivityFeed`: Transaction history and status
- Integration with existing Guardian screens

## Deployment

### Prerequisites
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Variables
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Blockchain
RPC_URL=https://mainnet.infura.io/v3/your_key
RELAYER_PRIVATE_KEY=your_relayer_private_key

# Relayer Service
GUARDIAN_RELAYER_URL=http://localhost:3001
GUARDIAN_RELAYER_API_KEY=your_api_key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Database Setup
```bash
# Run migrations
supabase db reset
supabase migration up
```

### Smart Contract Deployment
```bash
# Deploy to testnet
npx hardhat run scripts/deploy-guardian-wallet.js --network goerli

# Verify contract
npx hardhat verify --network goerli DEPLOYED_ADDRESS
```

### Relayer Service
```bash
cd services/guardian-relayer
npm install
npm run build
npm start
```

### Edge Functions
```bash
supabase functions deploy guardian-automation-propose
```

## Usage Flow

### 1. User Opt-in
```typescript
// User clicks "Enable Automation" in Guardian
// AutomationMigrationModal handles:
// 1. Deploy smart contract wallet
// 2. Create automation record in DB
// 3. Set default policies (auto-revoke below trust score 3.0)
```

### 2. Risk Detection
```typescript
// Guardian detects risky approval
// Calls guardian-automation-propose edge function
// Validates policies and trust score threshold
// Queues automation request with relayer
```

### 3. Automated Execution
```typescript
// Relayer processes queue
// Creates revoke transaction (approve with 0 amount)
// Submits transaction and updates logs
// Triggers re-scan to update trust score
```

### 4. Activity Tracking
```typescript
// All actions logged in guardian_automation_logs
// User sees activity in AutomationActivityFeed
// Includes tx hashes, gas costs, and status updates
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

## Monitoring & Operations

### Health Checks
```bash
# Relayer health
curl http://localhost:3001/health

# Queue status
curl http://localhost:3001/api/queue-status
```

### Error Handling
- Failed transactions logged with error messages
- Automatic retry with exponential backoff
- User notifications for critical failures
- Rollback capabilities where possible

### Billing & Gas Management
- Sponsored gas model (configurable)
- Per-action billing support
- Subscription-based gas allowances
- Gas cost tracking and reporting

## Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
# Start local testnet
npx hardhat node

# Run integration tests
npm run test:integration
```

### Contract Tests
```bash
npx hardhat test
```

## Legal & Regulatory Notes

### Gas Sponsorship
- Sponsoring gas may create regulatory obligations
- Consider implementing user-pays model for compliance
- Document terms of service for sponsored transactions

### Automated Actions
- Users must explicitly opt-in to automation
- Clear disclosure of automated actions
- Ability to disable automation at any time
- Audit trail for all automated transactions

## Incident Response

### Failed Transactions
1. Check relayer service logs
2. Verify blockchain connectivity
3. Check gas price and network congestion
4. Retry with higher gas if needed

### Smart Contract Issues
1. Pause automation via contract owner
2. Emergency withdrawal if funds at risk
3. Deploy new contract version if needed
4. Migrate user policies to new contract

### Database Issues
1. Check RLS policies for access issues
2. Verify edge function connectivity
3. Monitor for unusual activity patterns
4. Backup and restore if data corruption

## Performance Metrics

### Target SLAs
- Automation request processing: < 30 seconds
- Transaction confirmation: < 5 minutes
- System uptime: 99.9%
- Error rate: < 1%

### Monitoring
- Queue depth and processing time
- Transaction success/failure rates
- Gas cost optimization
- User adoption and retention

## Future Enhancements

### Planned Features
- Multi-chain support (Polygon, Arbitrum)
- Advanced policy types (time-based, amount-based)
- Batch revocation for multiple approvals
- Integration with hardware wallets

### Scalability
- Horizontal relayer scaling
- Database sharding for high volume
- CDN for global edge function deployment
- Load balancing for high availability