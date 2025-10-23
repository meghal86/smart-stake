# AlphaWhale 🛡 Guardian - Trust & Safety Scan

## Overview

Guardian is a comprehensive wallet trust & safety scanner that provides real-time risk analysis for Ethereum wallets. It scans for risky token approvals, mixer interactions, honeypot tokens, and reputation indicators to give users a Trust Score (0-100) and actionable insights.

## Features

✅ **Live Wallet Scanning**
- Auto-scan on wallet connection (<5s)
- Multi-chain support (Ethereum, Base, Arbitrum, Polygon, Optimism)
- Real-time risk factor analysis

✅ **Trust Score (0-100)**
- Weighted risk factors with severity levels
- Plain-English explanations
- Letter grade (A-F)

✅ **Risk Detection**
- Unlimited token approvals
- Honeypot/hidden mint detection
- Mixer proximity analysis (Tornado Cash, etc.)
- Address reputation checks
- Contract verification status
- High tax tokens

✅ **One-Tap Fixes**
- Revoke risky approvals with approve(spender, 0)
- Batch revocation support
- Gas estimation

✅ **Persistence & History**
- Scan results stored in Supabase
- Last scan time tracking
- Historical scan reports

## Architecture

```
┌─────────────────────────────────────────┐
│           Frontend (Vite + React)       │
│  ┌──────────────────────────────────┐   │
│  │  GuardianPage                    │   │
│  │  └─ ConnectGate                  │   │
│  │  └─ ScanDialog                   │   │
│  │  └─ ScoreCard                    │   │
│  │  └─ RiskCard (x4)                │   │
│  │  └─ RevokeModal                  │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  useGuardianStore (Zustand)      │   │
│  │  useGuardianScan (React Query)   │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     Supabase Edge Functions             │
│  ┌──────────────────────────────────┐   │
│  │  /guardian-scan                  │   │
│  │  └─ Rate limiting (10/min)       │   │
│  │  └─ Alchemy API integration      │   │
│  │  └─ Etherscan API integration    │   │
│  │  └─ Trust score calculation      │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  /guardian-revoke                │   │
│  │  └─ Transaction builder          │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  /guardian-healthz               │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Supabase Postgres DB            │
│  ┌──────────────────────────────────┐   │
│  │  users                           │   │
│  │  scans                           │   │
│  │  user_preferences                │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## File Structure

```
src/
├── lib/
│   ├── api/
│   │   ├── alchemy.ts         # Alchemy API integration
│   │   └── etherscan.ts       # Etherscan API integration
│   ├── guardian/
│   │   ├── approvals.ts       # Approval risk analysis
│   │   ├── honeypot.ts        # Honeypot detection
│   │   ├── mixer.ts           # Mixer proximity checks
│   │   ├── reputation.ts      # Address reputation
│   │   ├── trust-score.ts     # Trust score engine
│   │   └── revoke.ts          # Transaction builder
│   ├── supabase/
│   │   └── guardian.ts        # Supabase helpers
│   ├── net/
│   │   └── retry.ts           # Retry utilities
│   ├── cache/
│   │   └── guardian.ts        # Caching layer
│   └── http/
│       └── validate.ts        # Validation utilities
├── components/
│   └── guardian/
│       ├── ConnectGate.tsx    # Onboarding screen
│       ├── ScanDialog.tsx     # Scanning animation
│       ├── ScoreCard.tsx      # Trust score display
│       ├── RiskCard.tsx       # Risk factor card
│       └── RevokeModal.tsx    # Revoke interface
├── pages/
│   ├── Guardian.tsx           # Route wrapper
│   └── GuardianPage.tsx       # Main page
├── store/
│   └── guardianStore.ts       # Zustand state
├── hooks/
│   └── useGuardianScan.ts     # React Query hook
└── api/
    └── guardian.ts            # API client

supabase/
├── migrations/
│   └── 20251022000001_guardian_tables.sql
└── functions/
    ├── guardian-scan/
    │   └── index.ts
    ├── guardian-revoke/
    │   └── index.ts
    └── guardian-healthz/
        └── index.ts
```

## Setup

### 1. Install Dependencies

```bash
npm install wagmi viem @rainbow-me/rainbowkit @upstash/ratelimit @upstash/redis date-fns lottie-react
```

### 2. Environment Variables

Create `.env.local`:

```bash
# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend only (Supabase Edge Functions)
SUPABASE_SERVICE_ROLE=your-service-role-key
ALCHEMY_API_KEY=your-alchemy-key
ETHERSCAN_API_KEY=your-etherscan-key
HONEYPOT_API_URL=https://api.honeypot.is/v2/IsHoneypot
REPUTATION_SOURCE=etherscan
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

### 3. Database Setup

Run the migration:

```bash
supabase db push
```

Or manually execute:

```sql
-- See: supabase/migrations/20251022000001_guardian_tables.sql
```

### 4. Deploy Edge Functions

```bash
supabase functions deploy guardian-scan
supabase functions deploy guardian-revoke
supabase functions deploy guardian-healthz
```

### 5. Set Function Secrets

```bash
supabase secrets set ALCHEMY_API_KEY=your-key
supabase secrets set ETHERSCAN_API_KEY=your-key
supabase secrets set UPSTASH_REDIS_REST_URL=your-url
supabase secrets set UPSTASH_REDIS_REST_TOKEN=your-token
```

## Usage

### Basic Integration

```tsx
import { GuardianPage } from '@/pages/GuardianPage';

// In your router
<Route path="/guardian" element={<GuardianPage />} />
```

### With Wallet Connection

The page includes a mock wallet connection. To integrate with real wallets:

1. Install wagmi + RainbowKit
2. Replace `useMockWallet` with `useAccount` from wagmi
3. Update the `connect` button to use `<ConnectButton />` from RainbowKit

Example:

```tsx
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const { address, isConnected } = useAccount();

// Use in GuardianPage
if (!isConnected) {
  return <ConnectGate onConnect={() => {/* handled by RainbowKit */}} />;
}
```

### Programmatic Scanning

```tsx
import { useGuardianScan } from '@/hooks/useGuardianScan';

const { data, isLoading, refetch, rescan } = useGuardianScan({
  walletAddress: '0x...',
  network: 'ethereum',
  enabled: true,
});

// Manual rescan
await rescan();

// Refresh from cache
await refetch();
```

### Store Usage

```tsx
import { useGuardianStore } from '@/store/guardianStore';

const {
  scanning,
  result,
  lastError,
  setResult,
  setError,
} = useGuardianStore();
```

## Trust Score Algorithm

Starting at 100, deductions are made:

| Risk Factor | Impact | Severity |
|------------|--------|----------|
| Unlimited approval | -15 each (max -45) | Medium/High |
| Honeypot token | -60 | High |
| Hidden mint | -30 | High |
| Unverified contract | -25 | High |
| Direct mixer | -40 | High |
| 1-hop mixer | -20 | Medium |
| High tax (>10%) | -20 | Medium |
| Contract age <7d | -15 | Medium |
| Bad reputation | -50 | High |

**Bonuses:**
- Verified contract: +5
- Good reputation: +10

Score is clamped to 0-100.

**Grades:**
- A: 90-100
- B: 80-89
- C: 70-79
- D: 60-69
- F: <60

## API Reference

### POST /guardian-scan

**Request:**
```json
{
  "wallet_address": "0x...",
  "network": "ethereum"
}
```

**Response:**
```json
{
  "trust_score": 0.87,
  "risk_score": 6.2,
  "risk_level": "Medium",
  "flags": [
    {
      "id": 1,
      "type": "Mixer Interaction",
      "severity": "medium",
      "details": "Direct interaction with Tornado Cash",
      "timestamp": "2025-10-22T10:30:00Z"
    }
  ],
  "wallet_address": "0x...",
  "network": "Ethereum Mainnet",
  "last_scan": "2025-10-22T10:30:00Z",
  "guardian_scan_id": "uuid"
}
```

### POST /guardian-revoke

**Request:**
```json
{
  "token": "0x...",
  "spender": "0x...",
  "user": "0x...",
  "chain": "ethereum"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "to": "0x...",
    "data": "0x095ea7b3...",
    "value": "0x0"
  }
}
```

### GET /guardian-healthz

**Response:**
```json
{
  "ok": true,
  "latestEventAgeSec": 1.2,
  "checks": {
    "alchemy": true,
    "etherscan": true,
    "db": true
  }
}
```

## Testing

Run tests:

```bash
npm test
```

Test coverage includes:
- ✅ Trust score calculation
- ✅ Approval risk detection
- ✅ ScoreCard component rendering
- ✅ Button interactions
- ✅ Edge cases (clamping, unlimited values)

## Rate Limiting

- **Client-side:** 10 requests per minute per IP (in-memory)
- **Production:** Use Upstash Redis for distributed rate limiting

## Accessibility

- ✅ Semantic HTML
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ Screen reader support

## Mobile Responsiveness

- Responsive grid layouts
- Touch-friendly buttons (44x44px minimum)
- Stacked cards on mobile
- Reduced gauge size on small screens

## Security Considerations

1. **Non-custodial**: Never asks for private keys
2. **Read-only**: Only reads public blockchain data
3. **Rate-limited**: Prevents abuse
4. **Validated inputs**: Zod schemas for all API endpoints
5. **RLS policies**: Row-level security on Supabase tables

## Performance

- First scan: <5s
- Cached scans: <500ms
- Auto-scan trigger: <300ms
- Component renders: 60fps

## Troubleshooting

### Scans timing out

- Check Alchemy/Etherscan API keys
- Increase timeout in retry.ts
- Check network connectivity

### Rate limit errors

- Wait 1 minute between requests
- Configure Upstash Redis properly
- Check IP-based rate limiting

### Missing approvals

- Alchemy Token API may not return all approvals
- Implement transaction history parsing
- Use event logs (Approval events)

### Scan data not persisting

- Check Supabase RLS policies
- Verify user authentication
- Check service role key

## Future Enhancements

- [ ] Integrate Chainalysis Sanctions API
- [ ] Add support for NFT approvals (setApprovalForAll)
- [ ] Implement real-time monitoring
- [ ] Add notification system
- [ ] Support for more chains (Avalanche, Fantom, etc.)
- [ ] Historical trend charts
- [ ] Export scan reports (PDF)
- [ ] Batch wallet scanning

## License

Proprietary - AlphaWhale

## Support

For issues or questions, contact: support@alphawhale.com

