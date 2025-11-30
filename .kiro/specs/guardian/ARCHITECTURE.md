# Guardian System Architecture

## CRITICAL: The Golden Rule - UI is Presentation Only

**NEVER write business logic, security calculations, or complex data transformation in React/Next.js components.**

### UI Responsibilities (ALLOWED)
- Fetch data via API calls
- Display scan results in components
- Capture user input (wallet addresses)
- Trigger API calls
- Handle user interactions and navigation
- Manage local UI state (modals, loading states)

### Forbidden in UI (NEVER DO THIS)
- ❌ Trust score calculations
- ❌ Risk classification logic
- ❌ Mixer detection algorithms
- ❌ Approval risk analysis
- ❌ Honeypot detection
- ❌ Reputation scoring
- ❌ Evidence aggregation
- ❌ Confidence score calculations

## Backend: Supabase Edge Functions

**ALL business logic MUST reside in `./supabase/functions`**

### Edge Function Responsibilities
- Trust score calculation engine
- Risk detection and classification
- Mixer proximity analysis
- Token approval auditing
- Honeypot detection
- Reputation scoring
- Evidence aggregation
- Confidence calculation
- SSE streaming for progressive updates

### Edge Functions for Guardian

**Core Functions:**
- `guardian-scan-v2` - Main security scan with SSE streaming
- `guardian-revoke-v2` - Approval revocation with gas estimation
- `guardian-healthz` - Service health checks

---

## Data Flow Architecture

### Read / Scan Flow
```
UI Component (GuardianPage)
  ↓ (user connects wallet)
Next.js API Route (thin layer: auth, validation)
  ↓
Supabase Edge Function (guardian-scan-v2)
  ↓ (SSE streaming)
  ├─ Parallel Probes:
  │  ├─ Alchemy API (approvals, transactions)
  │  ├─ Etherscan API (labels, reputation)
  │  ├─ Honeypot API (token analysis)
  │  └─ Mixer Detection (pattern matching)
  ↓
Trust Score Engine (calculates 0-100 score)
  ↓
Supabase DB (cache results)
  ↓
UI Component (display with animations)
```

### Revoke / Action Flow
```
UI Component (RevokeModal)
  ↓ (user selects approvals to revoke)
Supabase Edge Function (guardian-revoke-v2)
  ↓
Pre-Simulation (Alchemy)
  ├─ Gas estimation
  ├─ Success prediction
  └─ Score delta calculation
  ↓
Idempotency Check (Upstash Redis)
  ↓
Transaction Preparation
  ↓
UI Component (confirm & execute)
```

---

## Component Architecture

### File Structure
```
src/
├── pages/
│   ├── GuardianPage.tsx              # Basic Guardian page
│   ├── GuardianEnhanced.tsx          # Enhanced UX with multi-wallet
│   ├── GuardianUX2.tsx               # Tesla-inspired minimal UI
│   ├── GuardianMobile.tsx            # Mobile-optimized version
│   └── GuardianRegistry.tsx          # Wallet registry management
├── components/
│   └── guardian/
│       ├── ScoreCard.tsx             # Trust score display
│       ├── RiskCard.tsx              # Individual risk cards
│       ├── RevokeModal.tsx           # Approval revocation UI
│       ├── ScanDialog.tsx            # Scanning progress
│       ├── TrustGauge.tsx            # Animated gauge component
│       ├── AddWalletModal.tsx        # Multi-wallet management
│       ├── NotificationCenter.tsx    # Alert system
│       ├── WalletTimeline.tsx        # Transaction history
│       ├── AchievementSystem.tsx     # Gamification
│       └── AIExplainerTooltip.tsx    # Contextual help
├── hooks/
│   ├── useGuardianScan.ts            # Main scan hook
│   └── useGuardianAutomation.ts      # Automation features
├── services/
│   └── guardianService.ts            # API client
└── lib/
    └── guardian/
        ├── trust-score.ts            # Score calculation (SHARED)
        ├── riskEngine.ts             # Risk classification
        ├── approvals.ts              # Approval analysis
        ├── mixer.ts                  # Mixer detection
        ├── honeypot.ts               # Honeypot detection
        ├── reputation.ts             # Reputation scoring
        ├── streaming.ts              # SSE utilities
        └── hunter-integration.ts     # Hunter feature integration
```

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vite/React)                │
├─────────────────────────────────────────────────────────┤
│  GuardianEnhanced / GuardianUX2 / GuardianMobile       │
│  ├─ useGuardianScan (SSE hook)                         │
│  ├─ useGuardianAnalytics                               │
│  ├─ RevokeModal (gas + score delta)                    │
│  └─ Multi-wallet management                            │
│                                                         │
│  WalletProvider (Wagmi + RainbowKit)                   │
│  ├─ Ethereum, Base, Arbitrum, Polygon                  │
│  └─ Dark theme with glassmorphism                      │
└─────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────┐
│             Supabase Edge Functions (Deno)              │
├─────────────────────────────────────────────────────────┤
│  guardian-scan-v2                                       │
│  ├─ SSE streaming (4 progress steps)                   │
│  ├─ Parallel probe execution                            │
│  ├─ Trust score calculation                             │
│  ├─ Confidence blending                                 │
│  └─ Request tracing (x-request-id)                      │
│                                                         │
│  guardian-revoke-v2                                     │
│  ├─ Idempotency (Upstash Redis)                        │
│  ├─ Pre-simulation (Alchemy)                           │
│  ├─ Gas estimation                                      │
│  └─ Score delta prediction                              │
│                                                         │
│  guardian-healthz                                       │
│  └─ Service health checks                               │
└─────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Alchemy    │    │  Etherscan   │    │   Upstash    │
│   (RPC+API)  │    │  (Labels)    │    │   (Redis)    │
│              │    │              │    │              │
│ - Approvals  │    │ - Reputation │    │ - Rate Limit │
│ - Txs        │    │ - Labels     │    │ - Idempotency│
│ - Simulate   │    │ - Verified   │    │ - Cache      │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## Trust Score Calculation Engine

### Algorithm Overview

**Starting Score:** 100 (perfect security)

**Deductions:**
1. **Unlimited Approvals:** -15 points each (max -45)
2. **Honeypot Tokens:** -60 points each
3. **High Token Taxes:** -20 points (>10% buy/sell)
4. **Direct Mixer Interactions:** -40 points
5. **Indirect Mixer Exposure:** -20 points
6. **Bad Reputation:** -50 points
7. **Unverified Contract:** -25 points
8. **Recent Creation (<7 days):** -15 points

**Bonuses:**
1. **Verified Contract:** +5 points
2. **Good Reputation:** +10 points

**Final Score:** Clamped to 0-100

### Confidence Score (0.0-1.0)

Calculated based on:
- **Data Source Quality:** Alchemy (0.95), Etherscan (0.95), Honeypot API (0.85)
- **Data Freshness:** Decay over TTL (0.7-1.0 range)
- **Cache Status:** Cached data slightly lower (×0.95)
- **Evidence Availability:** No evidence = 0.5 confidence

### Letter Grades
- **A:** 90-100 (Excellent)
- **B:** 80-89 (Good)
- **C:** 70-79 (Fair)
- **D:** 60-69 (Poor)
- **F:** 0-59 (Critical)

### Risk Categories

```typescript
interface RiskFactor {
  category: 'Approvals' | 'Honeypot' | 'Hidden Mint' | 
            'Reputation' | 'Mixer' | 'Age' | 
            'Liquidity' | 'Taxes' | 'Contract';
  impact: number;        // Negative = deduction, Positive = bonus
  severity: 'low' | 'medium' | 'high';
  description: string;
  evidence?: Evidence;
  meta?: Record<string, unknown>;
}
```

---

## API Documentation

### 1. Guardian Scan API

**Endpoint:** `POST /functions/v1/guardian-scan-v2`

**Request:**
```typescript
{
  wallet_address: string;      // Ethereum address
  network: string;             // 'ethereum' | 'base' | 'polygon' | etc.
  request_id?: string;         // Optional tracing ID
}
```

**Response (SSE Stream):**
```typescript
// Event 1: Started
data: {
  "step": "started",
  "message": "Initiating security scan..."
}

// Event 2: Progress
data: {
  "step": "progress",
  "message": "Analyzing approvals...",
  "progress": 25
}

// Event 3: Progress
data: {
  "step": "progress",
  "message": "Checking mixer exposure...",
  "progress": 50
}

// Event 4: Progress
data: {
  "step": "progress",
  "message": "Evaluating reputation...",
  "progress": 75
}

// Event 5: Complete
data: {
  "step": "complete",
  "data": {
    "trust_score": 87,
    "risk_score": 6.2,
    "risk_level": "Medium",
    "confidence": 0.85,
    "flags": [...],
    "wallet_address": "0x...",
    "network": "ethereum",
    "last_scan": "2025-01-30T12:00:00Z",
    "guardian_scan_id": "uuid"
  }
}
```

**Headers:**
- `Authorization: Bearer <SUPABASE_ANON_KEY>`
- `Content-Type: application/json`
- `x-request-id: <optional-trace-id>`

**Rate Limits:**
- Anonymous: 10 requests/minute per IP
- Authenticated: 20 requests/minute per user

---

### 2. Guardian Revoke API

**Endpoint:** `POST /functions/v1/guardian-revoke-v2`

**Request:**
```typescript
{
  wallet: string;              // User's wallet address
  approvals: Array<{
    token: string;             // Token contract address
    spender: string;           // Spender contract address
  }>;
  network: string;             // Network identifier
  dry_run?: boolean;           // If true, only estimate (no execution)
}
```

**Response:**
```typescript
{
  transactions: Array<{
    token: string;
    spender: string;
    data: string;              // Encoded transaction data
    to: string;                // Contract address
    value: string;             // ETH value (usually "0")
  }>;
  gas_estimate?: {
    total_gas: number;         // Total gas units
    per_tx: number;            // Gas per transaction
  };
  score_delta?: number;        // Expected trust score improvement
  idempotency_key?: string;    // For duplicate prevention
}
```

**Idempotency:**
- Uses Upstash Redis to prevent duplicate revocations
- Key format: `revoke:{wallet}:{token}:{spender}`
- TTL: 5 minutes

---

### 3. Guardian Summary API (Hunter Integration)

**Endpoint:** `GET /api/guardian/summary?ids=<uuid1>,<uuid2>,...`

**Query Parameters:**
- `ids`: Comma-separated list of opportunity IDs (max 100)

**Response:**
```typescript
{
  summaries: {
    [opportunityId: string]: {
      score: number;                    // 0-100
      level: 'green' | 'amber' | 'red'; // Traffic light
      last_scanned_ts: string;          // ISO 8601
      top_issues: string[];             // Top 3 issues
    }
  };
  count: number;                        // Number of summaries returned
  requested: number;                    // Number requested
  ts: string;                           // Response timestamp
}
```

**Caching:**
- Redis cache: 1 hour TTL
- HTTP cache: 5 minutes (public)

**Rate Limits:**
- Anonymous: 60 requests/hour
- Authenticated: 120 requests/hour

---

## Frontend Hooks

### useGuardianScan

**Purpose:** Main hook for wallet security scanning with SSE streaming

**Usage:**
```typescript
const {
  data,              // GuardianScanResult | undefined
  isLoading,         // boolean
  isRefetching,      // boolean
  error,             // unknown
  refetch,           // () => Promise<GuardianScanResult>
  rescan,            // () => Promise<GuardianScanResult>
  isRescanning,      // boolean
  statusAccent,      // Gradient class for UI
  scoreGlow,         // Shadow class for UI
} = useGuardianScan({
  walletAddress: '0x...',
  network: 'ethereum',
  enabled: true,
});
```

**Features:**
- React Query integration
- SSE streaming support
- Automatic caching (60s stale time)
- Status-based styling helpers

---

## UI/UX Components

### Component Hierarchy

```
GuardianEnhanced (Main Page)
├── Header
│   ├── Logo
│   ├── WalletDropdown (Multi-wallet selector)
│   ├── UserModeToggle (Beginner/Expert)
│   ├── NotificationCenter
│   └── ConnectButton
├── ScoreCard (Hero Section)
│   ├── TrustGauge (Animated circular gauge)
│   ├── Grade Badge (A-F)
│   ├── Confidence Indicator
│   └── Action Buttons (Rescan, Fix Risks)
├── RisksTab (Active Risks)
│   ├── RiskCard (Mixer Exposure)
│   ├── RiskCard (Contract Risks)
│   ├── RiskCard (Unlimited Approvals)
│   └── RiskCard (Address Reputation)
├── AlertsTab (Notifications)
│   └── NotificationCenter
├── HistoryTab (Scan History)
│   └── WalletTimeline
└── FooterNav (Mobile Navigation)
```

### Key Components

#### 1. **TrustGauge**
- Animated circular progress indicator
- Color-coded by score (green/yellow/red)
- Confidence ring overlay
- Smooth animations with Framer Motion

#### 2. **ScoreCard**
- Trust score display (0-100)
- Letter grade badge
- Flag count and critical count
- Last scan timestamp
- Rescan and Fix Risks buttons
- Auto-refresh toggle

#### 3. **RiskCard**
- Risk category title
- Severity badge (low/medium/high)
- Description lines
- Optional CTA button
- Side badge for status
- Glassmorphism styling

#### 4. **RevokeModal**
- Approval selection checkboxes
- Real-time gas estimation
- Trust score delta preview
- Batch revoke capability
- Loading states
- Success/error feedback

#### 5. **AddWalletModal**
- Address input with ENS support
- Network selector
- Label/alias input
- Validation feedback
- API integration for wallet creation

#### 6. **NotificationCenter**
- Bell icon with badge count
- Dropdown panel
- Categorized notifications (Security, Activity, Achievements)
- Priority-based styling
- Mark as read / Dismiss actions
- Sound effects for critical alerts

#### 7. **WalletTimeline**
- Transaction history list
- Search and filter
- Date grouping
- AI insights summary
- Export to CSV
- Expandable details

#### 8. **AchievementSystem**
- Badge showcase
- Progress tracking
- XP and leveling
- Unlock celebrations
- Confetti effects

---

## Design System

### Color Palette

**Dark Mode (Primary):**
```css
--bg-primary: #0A0E1A;
--bg-secondary: #111827;
--accent-trust: #00F5A0;      /* Emerald green */
--accent-warning: #F9B040;    /* Amber */
--accent-danger: #F95A5A;     /* Red */
--accent-tech: #7B61FF;       /* Purple */
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-border: rgba(255, 255, 255, 0.1);
```

**Typography:**
```css
--font-primary: 'Inter', sans-serif;
--font-mono: 'SF Mono', 'Fira Code', monospace;
```

### Glassmorphism

```css
.guardian-glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.25);
}
```

### Animations

**Durations:**
- Instant: 100ms
- Fast: 200ms
- Normal: 300ms
- Slow: 500ms
- Slower: 800ms

**Easings:**
- `ease-out`: Default for entrances
- `ease-in-out`: For state changes
- `spring`: For interactive elements

**Accessibility:**
- All animations respect `prefers-reduced-motion`
- Fallback to instant transitions when needed

---

## Security & Performance

### Security Measures

1. **Rate Limiting**
   - Upstash Redis-based
   - Per-IP and per-user limits
   - Exponential backoff on violations

2. **Idempotency**
   - Prevents duplicate revocations
   - 5-minute TTL on keys
   - Cryptographic key generation

3. **Input Validation**
   - Zod schemas for all inputs
   - Address checksum validation
   - Network whitelist

4. **Request Tracing**
   - Unique `x-request-id` per request
   - Full request/response logging
   - Error tracking with context

5. **Data Privacy**
   - No private keys stored
   - Read-only blockchain access
   - Encrypted credentials (if any)

### Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| TTFP (Time to First Progress) | ≤ 1.5s | ✅ |
| Full Scan Duration | ≤ 5s | ✅ |
| API Response Time (P95) | < 200ms | ✅ |
| Cache Hit Ratio | > 70% | ✅ |
| Lighthouse Score | > 90 | ✅ |

### Caching Strategy

**Redis Cache (Upstash):**
- Contract verification: 1 hour TTL
- Honeypot results: 10 minutes TTL
- Reputation data: 1 hour TTL
- Scan results: 5 minutes TTL

**React Query Cache:**
- Stale time: 60 seconds
- Cache time: 5 minutes
- Automatic refetch on window focus

---

## Database Schema

### Tables

#### guardian_scans
```sql
CREATE TABLE guardian_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  wallet_address TEXT NOT NULL,
  network TEXT NOT NULL,
  trust_score INTEGER NOT NULL,           -- 0-100
  risk_score NUMERIC NOT NULL,            -- 0-10
  risk_level TEXT NOT NULL,               -- 'Low' | 'Medium' | 'High'
  confidence NUMERIC DEFAULT 0.8,         -- 0.0-1.0
  request_id TEXT,                        -- For tracing
  flags JSONB DEFAULT '[]'::jsonb,
  evidence JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_scan TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_guardian_scans_user_created 
  ON guardian_scans(user_id, created_at DESC);
  
CREATE INDEX idx_guardian_scans_wallet_recent 
  ON guardian_scans(wallet_address, last_scan DESC) 
  WHERE last_scan > NOW() - INTERVAL '30 days';
  
CREATE INDEX idx_guardian_scans_request_id 
  ON guardian_scans(request_id) 
  WHERE request_id IS NOT NULL;
```

#### guardian_wallets
```sql
CREATE TABLE guardian_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  address TEXT NOT NULL,
  network TEXT DEFAULT 'ethereum',
  alias TEXT,                             -- User-defined label
  ens_name TEXT,                          -- Resolved ENS name
  trust_score INTEGER,                    -- Cached from last scan
  risk_count INTEGER DEFAULT 0,           -- Number of active risks
  last_scan TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, address, network)
);

-- Indexes
CREATE INDEX idx_guardian_wallets_user 
  ON guardian_wallets(user_id, created_at DESC);
  
CREATE INDEX idx_guardian_wallets_address 
  ON guardian_wallets(address);
```

#### guardian_automation (Future)
```sql
CREATE TABLE guardian_automation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT DEFAULT 'active',           -- 'active' | 'paused'
  min_trust_score NUMERIC DEFAULT 3.0,    -- Threshold for auto-revoke
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

```sql
-- Users can only see their own scans
CREATE POLICY guardian_scans_user_policy ON guardian_scans
  FOR ALL USING (auth.uid() = user_id);

-- Users can only manage their own wallets
CREATE POLICY guardian_wallets_user_policy ON guardian_wallets
  FOR ALL USING (auth.uid() = user_id);
```

---

## Business Logic Modules

### 1. Trust Score Engine (`trust-score.ts`)

**Exports:**
- `calculateTrustScore(inputs)` - Main calculation function
- `calculateConfidence(factors)` - Confidence score calculation
- `gradeByScore(score)` - Convert score to letter grade
- `getStatusTone(score)` - Get color tone (trusted/warning/danger)
- `getSummary(result)` - Plain English summary

**Key Algorithm:**
```typescript
function calculateTrustScore(inputs: TrustScoreInputs): TrustScoreResult {
  let score = 100; // Start perfect
  const factors: RiskFactor[] = [];
  
  // Deduct for risks
  score -= calculateApprovalRisk(inputs.approvals);
  score -= calculateHoneypotRisk(inputs.honeypotResults);
  score -= calculateMixerRisk(inputs.mixerProximity);
  score -= calculateReputationRisk(inputs.reputation);
  
  // Add bonuses
  score += calculateBonuses(inputs);
  
  // Clamp to 0-100
  score = Math.max(0, Math.min(100, Math.round(score)));
  
  return {
    score,
    grade: gradeByScore(score),
    confidence: calculateConfidence(factors),
    factors,
    totals: { flags: factors.length, critical: countCritical(factors) }
  };
}
```

### 2. Approval Analysis (`approvals.ts`)

**Exports:**
- `analyzeApprovals(wallet, network)` - Fetch and analyze approvals
- `classifyApprovalRisk(approval)` - Risk level classification
- `isUnlimitedApproval(allowance)` - Check if approval is unlimited

**Risk Factors:**
- Unlimited allowance (2^256-1)
- Unknown/unverified spender
- High-risk contract (known exploits)
- Recent approval (<7 days)

### 3. Mixer Detection (`mixer.ts`)

**Exports:**
- `detectMixerProximity(wallet, network)` - Analyze mixer interactions
- `KNOWN_MIXERS` - List of known mixer addresses

**Detection Levels:**
- **Direct:** Wallet sent/received from mixer
- **One-hop:** Wallet interacted with address that used mixer
- **Two-hop:** Second-degree connection

### 4. Honeypot Detection (`honeypot.ts`)

**Exports:**
- `checkHoneypot(tokenAddress, network)` - Check if token is honeypot
- `analyzeTokenTaxes(tokenAddress)` - Get buy/sell tax percentages

**Honeypot Indicators:**
- Cannot sell token
- High taxes (>10%)
- Hidden mint function
- Ownership not renounced
- Liquidity not locked

### 5. Reputation Scoring (`reputation.ts`)

**Exports:**
- `getReputationScore(address, network)` - Fetch reputation data
- `classifyReputation(labels)` - Good/Caution/Bad classification

**Data Sources:**
- Etherscan labels
- Known scam databases
- Community reports
- Historical behavior

---

## Testing Strategy

### Unit Tests

**Coverage Target:** 80%+

**Test Files:**
- `trust-score.test.ts` - Score calculation logic
- `approvals.test.ts` - Approval analysis
- `mixer.test.ts` - Mixer detection
- `honeypot.test.ts` - Honeypot detection
- `reputation.test.ts` - Reputation scoring

**Example:**
```typescript
describe('calculateTrustScore', () => {
  it('should return 100 for clean wallet', () => {
    const result = calculateTrustScore({
      approvals: [],
      honeypotResults: new Map(),
      mixerProximity: { directInteractions: 0, oneHopInteractions: 0 },
      reputation: { level: 'good', score: 100, reasons: [] }
    });
    
    expect(result.score).toBe(100);
    expect(result.grade).toBe('A');
  });
  
  it('should deduct points for unlimited approvals', () => {
    const result = calculateTrustScore({
      approvals: [
        { isUnlimited: true, riskLevel: 'high', token: 'USDC', spender: '0x...' }
      ],
      // ... other inputs
    });
    
    expect(result.score).toBeLessThan(100);
    expect(result.factors).toContainEqual(
      expect.objectContaining({ category: 'Approvals', impact: expect.any(Number) })
    );
  });
});
```

### Integration Tests

**Test Scenarios:**
- Full scan flow (wallet → scan → results)
- Revoke flow (select → estimate → execute)
- Multi-wallet management
- SSE streaming
- Cache behavior
- Rate limiting

### E2E Tests (Playwright)

**Critical Flows:**
```typescript
test('complete Guardian scan flow', async ({ page }) => {
  await page.goto('/guardian');
  
  // Connect wallet
  await page.click('[data-testid="connect-wallet"]');
  
  // Wait for scan to complete
  await expect(page.locator('[data-testid="trust-score"]')).toBeVisible();
  
  // Verify score displayed
  const score = await page.locator('[data-testid="trust-score"]').textContent();
  expect(parseInt(score!)).toBeGreaterThanOrEqual(0);
  expect(parseInt(score!)).toBeLessThanOrEqual(100);
});
```

### Accessibility Tests

**Tools:** axe-core, WAVE

**Requirements:**
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast ratios
- ARIA labels
- Focus indicators
