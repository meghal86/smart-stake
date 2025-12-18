# Guardian Feature - Complete Documentation Index

**Version:** 2.0  
**Status:** ✅ Production Ready  
**URL:** http://localhost:8083/guardian

---

## 📚 Documentation Overview

This directory contains complete architecture and implementation documentation for the Guardian security scanning feature.

### Quick Links

- **[Architecture](./ARCHITECTURE.md)** - System architecture, data flow, business logic
- **[Components Guide](./COMPONENTS_GUIDE.md)** - UI component documentation
- **[API Reference](./API_REFERENCE.md)** - Complete API documentation
- **[Deployment Guide](./DEPLOYMENT.md)** - Deployment checklist and procedures

---

## What is Guardian?

Guardian is AlphaWhale's **AI-powered wallet security scanner** that provides:

- **Trust Score (0-100):** Comprehensive security rating
- **Risk Detection:** 9 categories of security risks
- **Real-time Scanning:** < 5 second scans with SSE streaming
- **Multi-Wallet Support:** Manage unlimited wallets
- **Automated Protection:** One-click approval revocation
- **Confidence Scoring:** Data quality indicators (0.0-1.0)

---

## Feature Status

### ✅ Completed Features (100%)

**Core Functionality:**
- [x] Wallet security scanning
- [x] Trust score calculation (0-100)
- [x] Risk detection (9 categories)
- [x] SSE streaming for progressive updates
- [x] Confidence scoring (0.0-1.0)
- [x] Multi-wallet management
- [x] Approval revocation with gas estimation
- [x] Score delta prediction

**UI/UX:**
- [x] GuardianPage (basic)
- [x] GuardianEnhanced (multi-wallet)
- [x] GuardianUX2 (Tesla-inspired)
- [x] GuardianMobile (mobile-optimized)
- [x] Glassmorphism design system
- [x] Dark theme
- [x] Animations (Framer Motion)
- [x] Accessibility (WCAG 2.1 AA)

**Backend:**
- [x] guardian-scan-v2 Edge Function
- [x] guardian-revoke-v2 Edge Function
- [x] guardian-healthz Edge Function
- [x] Rate limiting (Upstash Redis)
- [x] Idempotency
- [x] Request tracing
- [x] Database schema with RLS

**Integrations:**
- [x] Alchemy API (blockchain data)
- [x] Etherscan API (reputation)
- [x] Honeypot API (token analysis)
- [x] Upstash Redis (caching, rate limiting)
- [x] Wagmi + RainbowKit (wallet connection)
- [x] React Query (data fetching)

---

## Architecture Summary

### System Diagram

```
Frontend (Vite/React)
  ├─ GuardianEnhanced / GuardianUX2 / GuardianMobile
  ├─ useGuardianScan (SSE hook)
  ├─ useGuardianAnalytics
  └─ Multi-wallet management
       ↓
Supabase Edge Functions (Deno)
  ├─ guardian-scan-v2 (SSE streaming)
  ├─ guardian-revoke-v2 (gas estimation)
  └─ guardian-healthz (health checks)
       ↓
External Services
  ├─ Alchemy (RPC + API)
  ├─ Etherscan (labels, reputation)
  └─ Upstash Redis (rate limiting, cache)
```

### Trust Score Algorithm

**Starting Score:** 100 (perfect)

**Deductions:**
- Unlimited approvals: -15 each (max -45)
- Honeypot tokens: -60 each
- High token taxes: -20
- Direct mixer interactions: -40
- Indirect mixer exposure: -20
- Bad reputation: -50
- Unverified contract: -25
- Recent creation (<7 days): -15

**Bonuses:**
- Verified contract: +5
- Good reputation: +10

**Final:** Clamped to 0-100, converted to letter grade (A-F)

---

## Key Components

### Pages
- `GuardianPage.tsx` - Basic Guardian page
- `GuardianEnhanced.tsx` - Enhanced UX with multi-wallet
- `GuardianUX2.tsx` - Tesla-inspired minimal UI
- `GuardianMobile.tsx` - Mobile-optimized version

### Core Components
- `TrustGauge.tsx` - Animated circular gauge
- `ScoreCard.tsx` - Trust score display
- `RiskCard.tsx` - Individual risk cards
- `RevokeModal.tsx` - Approval revocation UI
- `AddWalletModal.tsx` - Multi-wallet management
- `NotificationCenter.tsx` - Alert system
- `WalletTimeline.tsx` - Transaction history
- `AchievementSystem.tsx` - Gamification

### Hooks
- `useGuardianScan.ts` - Main scan hook with SSE
- `useGuardianAutomation.ts` - Automation features
- `useNotifications.ts` - Notification management

### Services
- `guardianService.ts` - API client
- `trust-score.ts` - Score calculation
- `riskEngine.ts` - Risk classification
- `approvals.ts` - Approval analysis
- `mixer.ts` - Mixer detection
- `honeypot.ts` - Honeypot detection
- `reputation.ts` - Reputation scoring

---

## API Endpoints

### 1. Guardian Scan
```
POST {SUPABASE_URL}/functions/v1/guardian-scan-v2
```
- SSE streaming with 4 progress steps
- Returns trust score, risk level, flags, confidence
- Rate limit: 10/min (anon), 20/min (auth)

### 2. Guardian Revoke
```
POST {SUPABASE_URL}/functions/v1/guardian-revoke-v2
```
- Gas estimation with dry_run mode
- Score delta prediction
- Idempotency with Upstash Redis

### 3. Guardian Summary (Hunter Integration)
```
GET /api/guardian/summary?ids={uuid1},{uuid2},...
```
- Batch fetching for multiple opportunities
- Redis caching (1 hour TTL)
- Rate limit: 60/hr (anon), 120/hr (auth)

### 4. Health Check
```
GET {SUPABASE_URL}/functions/v1/guardian-healthz
```
- Service status monitoring
- Alchemy, Etherscan, Upstash checks

---

## Database Schema

### guardian_scans
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- wallet_address (TEXT)
- network (TEXT)
- trust_score (INTEGER, 0-100)
- risk_score (NUMERIC, 0-10)
- risk_level (TEXT)
- confidence (NUMERIC, 0.0-1.0)
- request_id (TEXT)
- flags (JSONB)
- evidence (JSONB)
- created_at (TIMESTAMPTZ)
- last_scan (TIMESTAMPTZ)
```

### guardian_wallets
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- address (TEXT)
- network (TEXT)
- alias (TEXT)
- ens_name (TEXT)
- trust_score (INTEGER)
- risk_count (INTEGER)
- last_scan (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

---

## Performance Metrics

| Metric | Target | Status |
|--------|--------|--------|
| TTFP (Time to First Progress) | ≤ 1.5s | ✅ |
| Full Scan Duration | ≤ 5s | ✅ |
| API Response Time (P95) | < 200ms | ✅ |
| Cache Hit Ratio | > 70% | ✅ |
| Lighthouse Score | > 90 | ✅ |

---

## Security Features

- **Rate Limiting:** Upstash Redis-based
- **Idempotency:** Prevents duplicate operations
- **RLS Policies:** User-scoped data access
- **Request Tracing:** Unique x-request-id per request
- **Input Validation:** Zod schemas
- **No Private Keys:** Read-only blockchain access

---

## Getting Started

### 1. Prerequisites
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys
```

### 2. Run Locally
```bash
# Start dev server
npm run dev

# Navigate to
http://localhost:8083/guardian
```

### 3. Deploy
```bash
# Deploy Edge Functions
supabase functions deploy guardian-scan-v2
supabase functions deploy guardian-revoke-v2

# Deploy frontend
vercel --prod
```

---

## Documentation Files

### Core Documentation
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system architecture
  - Golden Rule (UI is presentation only)
  - Data flow diagrams
  - Trust score algorithm
  - Business logic modules
  - Database schema
  - Security & performance

- **[COMPONENTS_GUIDE.md](./COMPONENTS_GUIDE.md)** - UI component documentation
  - Component hierarchy
  - Props and usage examples
  - Styling guidelines
  - Best practices

- **[API_REFERENCE.md](./API_REFERENCE.md)** - Complete API documentation
  - Endpoint specifications
  - Request/response formats
  - Rate limiting
  - Error codes
  - Example usage

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide
  - Prerequisites
  - Step-by-step deployment
  - Post-deployment checklist
  - Monitoring setup
  - Rollback procedures

### Legacy Documentation
- `GUARDIAN_PRODUCTION_READY.md` - Production readiness summary
- `GUARDIAN_IMPLEMENTATION_GUIDE.md` - Implementation guide
- `GUARDIAN_UX_COMPLETE_SUMMARY.md` - UX redesign summary

---

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Accessibility Tests
```bash
npm run test:a11y
```

---

## Support

### Troubleshooting
- Check Edge Function logs: `supabase functions logs guardian-scan-v2`
- Review Sentry errors
- Check Vercel deployment logs
- Use `x-request-id` for debugging

### Resources
- [Supabase Docs](https://supabase.com/docs)
- [Wagmi Docs](https://wagmi.sh)
- [React Query Docs](https://tanstack.com/query)
- [Framer Motion Docs](https://www.framer.com/motion/)

---

## Changelog

### v2.0.0 (January 2025)
- ✅ Complete architecture documentation
- ✅ SSE streaming implementation
- ✅ Multi-wallet support
- ✅ Confidence scoring
- ✅ Glassmorphism design system
- ✅ Mobile optimization
- ✅ Accessibility compliance (WCAG 2.1 AA)
- ✅ Analytics integration
- ✅ Rate limiting & idempotency

### v1.0.0 (October 2024)
- Initial Guardian release
- Basic trust score calculation
- Single wallet scanning
- Risk detection

---

## License

Proprietary - AlphaWhale Platform

---

**Last Updated:** January 30, 2025  
**Maintained by:** AlphaWhale Engineering Team
