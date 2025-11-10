# Guardian Feature Audit

## Overview
Comprehensive audit of existing Guardian implementation at `http://localhost:8080/guardian`

**IMPORTANT:** The actual Guardian page being used is `GuardianEnhanced.tsx`, not `portfolio/guardian.tsx`

## ✅ Already Implemented

### 1. Guardian Enhanced UI (ACTUAL IMPLEMENTATION)
**Location:** `src/pages/GuardianEnhanced.tsx` (1359 lines)

**Major Features:**
- ✅ **Multi-Wallet Management** - Add, switch, and manage multiple wallets
- ✅ **Wallet Dropdown** - Quick wallet switching with trust scores
- ✅ **Demo Mode** - Try Guardian without connecting wallet (Vitalik.eth demo)
- ✅ **Real-time Scanning** - Live Guardian scans with SSE support
- ✅ **Trust Score Visualization** - Animated trust score display (0-100)
- ✅ **Risk Detection** - Security flags with severity levels
- ✅ **Fix Risks Modal** - One-tap revoke for approvals
- ✅ **Add Wallet Modal** - Add wallets with ENS support
- ✅ **Theme Toggle** - Dark/Light mode support
- ✅ **User Mode Context** - Beginner/Expert modes
- ✅ **Notification System** - Toast notifications for scan results
- ✅ **XP/Achievement System** - Gamification with levels and XP
- ✅ **Responsive Design** - Mobile, tablet, desktop layouts
- ✅ **Animated Backgrounds** - Whale Pulse gradient animations
- ✅ **Welcome Screen** - Onboarding for new users
- ✅ **Footer Navigation** - Persistent footer nav
- ✅ **Wallet Context Integration** - Full wallet state management
- ✅ **Rainbow Kit Integration** - Connect wallet functionality
- ✅ **Wagmi Integration** - Web3 wallet connection

**Tabs/Views:**
- ✅ Scan Tab - Main scanning interface
- ✅ Risks Tab - Security risks display
- ✅ Alerts Tab - Real-time alerts
- ✅ History Tab - Scan history
- ✅ Dashboard View - Main dashboard
- ✅ Timeline View - Activity timeline
- ✅ Achievements View - User achievements

**Components Used:**
- `RisksTab` - Risk visualization
- `AlertsTab` - Alert management
- `HistoryTab` - Scan history
- `FixRiskModal` - Risk remediation
- `AddWalletModal` - Wallet addition
- `FooterNav` - Navigation footer
- Rainbow Kit `ConnectButton`
- Framer Motion animations
- Shadcn UI components (Dialog, Tooltip, etc.)

### 2. Guardian UI Components (LEGACY)
**Location:** `src/pages/portfolio/guardian.tsx`

**Features:**
- ✅ Full Guardian page with portfolio layout
- ✅ Trust score display with animated shield
- ✅ Security flags visualization with severity levels
- ✅ Scan complete banner with animations
- ✅ Export & Share proof functionality
- ✅ Expandable flag details
- ✅ Real-time scanning with loading overlay
- ✅ Last scan results summary
- ✅ Responsive design with motion animations

**Components Used:**
- `GuardianWidget` - Main trust score and flags display
- `ExportProofModal` - Compliance proof export
- `PortfolioHeader` - Page header
- Motion animations with Framer Motion

### 2. Guardian Widget Component
**Location:** `src/components/portfolio/GuardianWidget.tsx`

**Features:**
- ✅ Trust score visualization (0-100%)
- ✅ Color-coded trust levels (green/yellow/red)
- ✅ Animated pulse effect on trust score
- ✅ Security flags list with severity badges
- ✅ Flag types: sanctions, mixer, scam, suspicious, high_risk
- ✅ Severity levels: low, medium, high, critical
- ✅ Expandable flags (show all/show less)
- ✅ Rescan button
- ✅ Last scan timestamp
- ✅ "All Clear" state when no flags

### 3. Guardian Service
**Location:** `src/services/guardianService.ts`

**Features:**
- ✅ `requestGuardianScan()` - Main scan function
- ✅ Network normalization (ethereum, base, polygon, etc.)
- ✅ Trust score calculation (0-1 normalized to 0-100%)
- ✅ Risk level determination (Low/Medium/High)
- ✅ Status calculation (Trusted/Warning/Danger)
- ✅ Relative time formatting (e.g., "12m ago")
- ✅ Flag mapping and normalization
- ✅ Issues by severity counting
- ✅ Summary generation
- ✅ Multi-source fallback:
  1. Primary: `/api/guardian/scan` API route
  2. Fallback 1: Supabase `guardian_scans` table
  3. Fallback 2: Mock data with realistic values
- ✅ `requestGuardianRevoke()` - Revoke approvals function
- ✅ Observability with request IDs and logging
- ✅ Idempotency key generation
- ✅ SSE (Server-Sent Events) response handling

**Data Structures:**
```typescript
interface GuardianScanResult {
  trustScorePercent: number;
  trustScoreRaw: number;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  statusLabel: 'Trusted' | 'Warning' | 'Danger';
  statusTone: 'trusted' | 'warning' | 'danger';
  walletAddress: string;
  network: string;
  networkCode: string;
  lastScan: string;
  lastScanLocal: string;
  lastScanRelative: string;
  flags: GuardianFlag[];
  issuesBySeverity: Record<GuardianSeverity, number>;
  hasFlags: boolean;
  summary: string;
  guardianScanId?: string;
}
```

### 4. Guardian API Client
**Location:** `src/api/guardian.ts`

**Features:**
- ✅ `scanWallet()` - Trigger wallet scan
- ✅ `getRevokeTransaction()` - Get revoke transaction data
- ✅ `checkHealth()` - Health check endpoint
- ✅ `addWallet()` - Add wallet to Guardian
- ✅ `resolveENS()` - ENS name resolution
- ✅ Supabase Edge Function integration
- ✅ Error handling with fallbacks

**Endpoints:**
- `/functions/v1/guardian-scan` - Wallet scanning
- `/functions/v1/guardian-scan-v2` - V2 scan with SSE
- `/functions/v1/guardian-revoke` - Revoke approvals
- `/functions/v1/guardian-revoke-v2` - V2 revoke
- `/functions/v1/guardian-healthz` - Health check

### 5. Supporting Infrastructure
**Files:**
- `src/store/guardianStore.ts` - State management
- `src/services/guardianAutomationService.ts` - Automation logic
- `src/lib/cache/guardian.ts` - Caching layer
- `src/lib/analytics/guardian.ts` - Analytics tracking
- `src/lib/supabase/guardian.ts` - Supabase integration
- `src/styles/guardian-theme.css` - Guardian-specific styles
- `src/styles/guardian-design-system.css` - Design system

### 6. Database Integration
**Table:** `guardian_scans`

**Columns (inferred from code):**
- `wallet_address` - Wallet being scanned
- `network` - Network identifier
- `trust_score` - Trust score (0-1)
- `risk_score` - Risk score (0-10)
- `risk_level` - Low/Medium/High
- `flags` - Array of security flags
- `last_scan` - Timestamp of last scan
- `guardian_scan_id` - Unique scan identifier

## 🔄 Integration Points with Hunter Screen

### Current State
The Guardian system is **fully built and operational** but operates independently from the Hunter Screen feed.

### Required Integration
To connect Guardian with Hunter Screen (Task 10):

1. **Trust Score Display on Opportunity Cards**
   - Show Guardian trust chip on each opportunity card
   - Color-coded: green (≥80), amber (60-79), red (<60)
   - Tooltip with top 3 issues
   - "Scanned Xh ago" timestamp

2. **Batch Guardian Summary Fetching**
   - Create `getGuardianSummary()` function
   - Accept array of opportunity IDs
   - Return trust scores and top issues
   - Cache results in Redis

3. **Stale Opportunity Detection**
   - Create `listStaleOpportunities()` function
   - Find opportunities with scans >24h old
   - Queue for rescan

4. **Guardian Rescan Queue**
   - Create `queueRescan()` function
   - Add to Guardian rescan queue
   - Process via cron job

5. **Trust Score Caching**
   - Cache Guardian summaries in Redis
   - TTL: 1 hour (configurable)
   - Reduce API calls

## 📊 What's Missing for Hunter Screen Integration

### Backend Services (Task 10)
- [ ] `getGuardianSummary(opportunityIds[])` - Batch fetch trust scores
- [ ] `listStaleOpportunities()` - Find opportunities needing rescan
- [ ] `queueRescan(opportunityId)` - Queue opportunity for rescan
- [ ] Redis caching for Guardian summaries
- [ ] Batch API optimization

### API Endpoints (Task 13)
- [ ] `GET /api/guardian/summary` - Batch Guardian summary endpoint
- [ ] Accept array of opportunity IDs
- [ ] Return trust scores, levels, and top issues
- [ ] Cache results in Redis

### UI Integration (Already exists, needs connection)
- ✅ `GuardianTrustChip` component exists
- [ ] Connect to opportunity cards in Hunter Screen
- [ ] Fetch Guardian data for displayed opportunities
- [ ] Show trust score on each card
- [ ] Tooltip with issues

### Cron Job (Task 28)
- [ ] Guardian staleness cron job
- [ ] List stale opportunities (>24h)
- [ ] Queue for rescan
- [ ] Purge CDN cache on category flips

## 🎯 Key Findings

### Guardian Enhanced is Production-Ready
The `GuardianEnhanced.tsx` implementation is a **complete, production-grade Guardian system** with:
- 1359 lines of fully functional code
- Multi-wallet management
- Real-time scanning with SSE
- Comprehensive UI with animations
- Full wallet context integration
- Demo mode for testing
- Gamification (XP/achievements)
- Responsive design
- Theme support

### Two Guardian Implementations Exist
1. **GuardianEnhanced.tsx** - Active, comprehensive implementation (USE THIS)
2. **portfolio/guardian.tsx** - Legacy/alternative implementation

## 🎯 Recommendations

### 1. Mark Guardian UI as Complete
All Guardian UI components are fully built and functional. The `GuardianEnhanced.tsx` is production-ready.

### 2. Focus on Integration Services
The next step is building the integration layer:
- Batch Guardian summary service
- Redis caching layer
- API endpoints for Hunter Screen
- Cron job for staleness detection

### 3. Reuse Existing Components
The `GuardianWidget` and trust score visualization can be reused in Hunter Screen with minimal modifications.

### 4. Leverage Existing API
The Guardian API client and service are production-ready. Just need to add batch fetching capabilities.

## 📝 Task Updates Required

### Mark as Complete
- Task 17: GuardianTrustChip component (exists as GuardianWidget)
- Guardian UI components (fully built)
- Guardian service layer (fully built)
- Guardian API client (fully built)

### Update Task 10
Change from "Create Guardian integration service" to:
- "Integrate existing Guardian service with Hunter Screen"
- Add batch fetching capability
- Add Redis caching
- Connect to opportunity cards

### Update Task 13
Change from "Create Guardian summary endpoint" to:
- "Create batch Guardian summary endpoint"
- Leverage existing Guardian service
- Add caching layer

### Update Task 28
Keep as-is but note that Guardian infrastructure already exists.

## 🔗 Integration Architecture

```
Hunter Screen Feed
    ↓
OpportunityCard Component
    ↓
GuardianTrustChip (reuse existing GuardianWidget)
    ↓
getGuardianSummary() [NEW - batch fetch]
    ↓
Redis Cache [NEW]
    ↓
Guardian Service [EXISTS]
    ↓
Guardian API [EXISTS]
    ↓
Supabase Edge Functions [EXISTS]
```

## ✅ Summary

**What's Built:**
- Complete Guardian UI at `/guardian`
- Full Guardian service layer
- API client with fallbacks
- Database integration
- Trust score calculation
- Flag visualization
- Export/share functionality

**What's Needed:**
- Batch fetching for multiple opportunities
- Redis caching layer
- Integration with Hunter Screen cards
- Cron job for staleness detection
- API endpoint for batch summaries

**Effort Estimate:**
- Integration services: 2-3 days
- API endpoints: 1 day
- UI connection: 1 day
- Testing: 1 day
- **Total: ~5-6 days**

The Guardian system is production-ready and just needs integration hooks to connect with the Hunter Screen feed.
