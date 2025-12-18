# Guardian Quick Reference

## One-Page Cheat Sheet

---

## URLs

- **Local:** http://localhost:8083/guardian
- **Production:** https://alphawhale.app/guardian

---

## Key Files

### Pages
```
src/pages/GuardianEnhanced.tsx    # Main page (multi-wallet)
src/pages/GuardianUX2.tsx         # Tesla-inspired UI
src/pages/GuardianMobile.tsx      # Mobile-optimized
```

### Components
```
src/components/guardian/
├── TrustGauge.tsx               # Animated gauge
├── ScoreCard.tsx                # Trust score display
├── RiskCard.tsx                 # Risk category cards
├── RevokeModal.tsx              # Approval revocation
├── AddWalletModal.tsx           # Multi-wallet management
└── NotificationCenter.tsx       # Alert system
```

### Hooks
```
src/hooks/useGuardianScan.ts     # Main scan hook
src/hooks/useGuardianAutomation.ts
```

### Services
```
src/services/guardianService.ts  # API client
src/lib/guardian/trust-score.ts  # Score calculation
```

---

## API Endpoints

### Scan
```bash
POST {SUPABASE_URL}/functions/v1/guardian-scan-v2
Body: { wallet_address, network, request_id? }
Response: SSE stream with progress updates
```

### Revoke
```bash
POST {SUPABASE_URL}/functions/v1/guardian-revoke-v2
Body: { wallet, approvals[], network, dry_run? }
Response: { transactions[], gas_estimate, score_delta }
```

### Summary (Hunter)
```bash
GET /api/guardian/summary?ids=uuid1,uuid2,...
Response: { summaries: {...}, count, requested, ts }
```

---

## Trust Score Algorithm

```
Start: 100 points

Deductions:
- Unlimited approvals: -15 each (max -45)
- Honeypot tokens: -60 each
- High taxes (>10%): -20
- Direct mixer: -40
- Indirect mixer: -20
- Bad reputation: -50
- Unverified contract: -25
- Recent (<7 days): -15

Bonuses:
- Verified contract: +5
- Good reputation: +10

Final: Clamp to 0-100
Grade: A (90-100), B (80-89), C (70-79), D (60-69), F (0-59)
```

---

## Component Usage

### useGuardianScan Hook
```typescript
const {
  data,              // GuardianScanResult
  isLoading,
  refetch,
  rescan,
  isRescanning,
  statusAccent,      // Gradient class
  scoreGlow,         // Shadow class
} = useGuardianScan({
  walletAddress: '0x...',
  network: 'ethereum',
  enabled: true,
});
```

### TrustGauge
```tsx
<TrustGauge 
  score={87} 
  confidence={0.85} 
  isScanning={false} 
/>
```

### ScoreCard
```tsx
<ScoreCard
  score={87}
  grade="B"
  flags={2}
  critical={0}
  lastScan="2m ago"
  chains={['ethereum']}
  autoRefreshEnabled={false}
  onRescan={handleRescan}
  onFixRisks={() => setShowFixModal(true)}
/>
```

### RiskCard
```tsx
<RiskCard
  title="Mixer Exposure"
  severity="medium"
  lines={["Counterparty mixed funds", "Score impact: −8"]}
  cta={{ label: "View tx", onClick: handleClick }}
/>
```

---

## Database Schema

### guardian_scans
```sql
id, user_id, wallet_address, network,
trust_score (0-100), risk_score (0-10), risk_level,
confidence (0.0-1.0), request_id,
flags (JSONB), evidence (JSONB),
created_at, last_scan
```

### guardian_wallets
```sql
id, user_id, address, network,
alias, ens_name,
trust_score, risk_count, last_scan,
created_at, updated_at
```

---

## Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Alchemy
ALCHEMY_API_KEY=

# Etherscan
ETHERSCAN_API_KEY=

# WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=
```

---

## Common Commands

### Development
```bash
npm run dev                    # Start dev server
npm test                       # Run tests
npm run build                  # Build for production
```

### Deployment
```bash
supabase functions deploy guardian-scan-v2
supabase functions deploy guardian-revoke-v2
vercel --prod
```

### Debugging
```bash
supabase functions logs guardian-scan-v2
supabase functions logs guardian-revoke-v2 --tail
```

---

## Rate Limits

| Endpoint | Anonymous | Authenticated |
|----------|-----------|---------------|
| Scan | 10/min | 20/min |
| Revoke | 10/min | 20/min |
| Summary | 60/hr | 120/hr |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| TTFP | ≤ 1.5s |
| Full Scan | ≤ 5s |
| API P95 | < 200ms |
| Cache Hit | > 70% |
| Lighthouse | > 90 |

---

## Risk Categories

1. **Approvals** - Unlimited token approvals
2. **Honeypot** - Scam tokens
3. **Hidden Mint** - Mintable tokens
4. **Reputation** - Address labels
5. **Mixer** - Tornado Cash, etc.
6. **Age** - Recently created
7. **Liquidity** - Locked/unlocked
8. **Taxes** - Buy/sell taxes
9. **Contract** - Verified/unverified

---

## Severity Levels

- **good** - Green (#00C9A7)
- **ok** - Blue (#3B82F6)
- **medium** - Amber (#F9B040)
- **high** - Red (#F95A5A)

---

## Confidence Score

```
0.0-0.3: Low confidence (missing data)
0.3-0.7: Medium confidence (cached/old data)
0.7-1.0: High confidence (fresh data)

Factors:
- Data source quality (Alchemy: 0.95, Etherscan: 0.95)
- Data freshness (decay over TTL)
- Cache status (cached: ×0.95)
```

---

## Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `RATE_LIMITED` | Too many requests | Wait retry_after_sec |
| `BAD_FILTER` | Invalid params | Check request |
| `INTERNAL` | Server error | Retry with backoff |
| `UNAUTHORIZED` | Missing auth | Check API key |

---

## Troubleshooting

### Scans timing out
- Check Alchemy API quota
- Verify Etherscan API key
- Increase Edge Function timeout

### Rate limit errors
- Check Upstash Redis connection
- Verify rate limit config
- Increase limits if needed

### Incorrect scores
- Review trust score logic
- Check data source responses
- Verify confidence calculation

---

## Support

- **Logs:** `supabase functions logs guardian-scan-v2`
- **Errors:** Check Sentry
- **Deployment:** Check Vercel logs
- **Debugging:** Use `x-request-id` header

---

**Last Updated:** January 30, 2025
