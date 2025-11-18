# Design Document: HarvestPro Tax-Loss Harvesting Module

## Overview

HarvestPro is a comprehensive tax-loss harvesting module for AlphaWhale that enables users to identify, optimize, and execute cryptocurrency tax-loss harvesting opportunities across connected wallets and centralized exchange (CEX) accounts. The system detects unrealized losses, calculates net tax benefits after accounting for gas and slippage, executes harvesting transactions through the Action Engine, and generates compliance-ready export files with cryptographic proof of execution.

**Key Design Principles:**
- **Hunter/Guardian UI Consistency**: Pixel-perfect adherence to existing design patterns
- **Performance First**: Sub-2s scan time, <200ms API responses
- **Security by Default**: No private keys stored, encrypted API credentials, Guardian integration
- **Tax Compliance**: IRS Form 8949 compatible exports with audit trails
- **Progressive Enhancement**: Works with wallets only, enhanced with CEX integration

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Next.js/React)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ HarvestPro   │  │ Harvest      │  │ Execution    │      │
│  │  Dashboard   │  │ Detail Modal │  │  Flow UI     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                     ┌──────▼──────┐                         │
│                     │  API Client  │                         │
│                     │ (React Query)│                         │
│                     └──────┬──────┘                         │
└────────────────────────────┼────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Edge CDN      │
                    │  (Vercel/CF)    │
                    └────────┬────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                    API Layer (Next.js API Routes)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/harvest/│  │ /api/harvest/│  │ /api/harvest/│      │
│  │opportunities │  │  sessions    │  │   export     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                     ┌──────▼──────┐                         │
│                     │  Services    │                         │
│                     │  Layer       │                         │
│                     └──────┬──────┘                         │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                    Data Layer (Supabase)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ harvest_lots │  │ harvest_     │  │ harvest_     │      │
│  │              │  │ opportunities│  │ sessions     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ user_        │  │ wallet_      │  │ cex_         │      │
│  │ settings     │  │ transactions │  │ accounts     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                    External Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Price Oracle │  │ Guardian API │  │ Action Engine│      │
│  │ (CoinGecko)  │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ CEX APIs     │  │ RPC Nodes    │  │ Stripe       │      │
│  │ (Binance,etc)│  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14+ (App Router)
- React 18+ with Server Components
- TypeScript 5+
- TailwindCSS + shadcn/ui components
- React Query (TanStack Query) for data fetching
- Zustand for client state management
- Zod for runtime validation
- Framer Motion for animations

**Backend:**
- Next.js API Routes (Edge Runtime where possible)
- Supabase (PostgreSQL + Realtime + Auth)
- Redis for caching (Upstash/Vercel KV)
- Feature flags (Vercel Edge Config)

**External Services:**
- Price Oracle (CoinGecko, CoinMarketCap)
- Guardian API (security scanning)
- Action Engine (transaction execution)
- CEX APIs (Binance, Coinbase, Kraken - read-only)
- RPC Nodes (Alchemy, Infura)
- Stripe (payment processing for premium features)

## Components and Interfaces

### Component Hierarchy

```
HarvestProScreen (Page)
├── HarvestProHeader
│   ├── Logo
│   ├── Title
│   ├── LastUpdated
│   ├── ConnectWalletButton
│   ├── DemoChip
│   ├── LiveChip
│   └── AIDigestButton
├── FilterChipRow
│   └── FilterChip[] (All, High Benefit, Short-Term, Long-Term, etc.)
├── HarvestSummaryCard (Guardian-style)
│   ├── SummaryMetrics (2x2 grid)
│   └── GuardianWarningStrip (conditional)
├── HarvestOpportunityFeed
│   ├── HarvestOpportunityCard[] (Hunter-style)
│   │   ├── CategoryTag
│   │   ├── RiskChip
│   │   ├── RecommendationBadge
│   │   ├── Title
│   │   ├── Subtitle
│   │   ├── MetricStrip
│   │   └── CTAButton
│   └── EndOfFeedState
├── HarvestDetailModal
│   ├── ModalHeader
│   ├── SummarySection
│   ├── GuardianWarning (conditional)
│   ├── StepByStepActions
│   ├── OnChainExecutionPanel
│   ├── CEXInstructionPanel
│   ├── CostTable
│   ├── NetBenefitSummary
│   └── ExecuteButton
├── ExecutionFlowUI (Action Engine)
│   ├── TransactionConfirmationModal
│   ├── SpinnerAnimation
│   ├── PerStepGuardianScore
│   └── LogsPanel
├── SuccessScreen
│   ├── SuccessCard (Achievement-style)
│   ├── DownloadCSVButton
│   └── ViewProofButton
└── ProofOfHarvestPage
    ├── ProofHeader
    ├── SummaryStats
    ├── ExecutedStepsList
    ├── CryptographicProofHash
    └── ExportButtons
```

### Key Component Interfaces

#### HarvestOpportunity Component

```typescript
interface HarvestOpportunityCardProps {
  opportunity: HarvestOpportunity;
  onStartHarvest: (id: string) => void;
  onSave: (id: string) => void;
  onShare: (id: string) => void;
  onReport: (id: string) => void;
  isConnected: boolean;
  userWallet?: string;
}

interface HarvestOpportunity {
  id: string;
  lotId: string;
  token: string;
  tokenLogoUrl: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  unrealizedLoss: number;
  remainingQty: number;
  gasEstimate: number;
  slippageEstimate: number;
  tradingFees: number;
  netTaxBenefit: number;
  guardianScore: number;
  executionTimeEstimate: string;
  confidence: number;
  recommendationBadge: 'recommended' | 'not-recommended' | 'high-benefit' | 'gas-heavy' | 'guardian-flagged';
  metadata: {
    walletName: string;
    venue: string;
    reasons: string[];
  };
}

interface Lot {
  lotId: string;
  token: string;
  walletOrCex: string;
  acquiredAt: string;
  acquiredQty: number;
  acquiredPriceUsd: number;
  currentPriceUsd: number;
  unrealizedPnl: number;
  holdingPeriodDays: number;
  longTerm: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  liquidityScore: number;
  guardianScore: number;
  eligibleForHarvest: boolean;
}
```

#### HarvestSession Component

```typescript
interface HarvestSessionProps {
  sessionId: string;
  onComplete: (sessionId: string) => void;
  onCancel: (sessionId: string) => void;
}

interface HarvestSession {
  sessionId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'executing' | 'completed' | 'failed' | 'cancelled';
  opportunitiesSelected: HarvestOpportunity[];
  realizedLossesTotal: number;
  netBenefitTotal: number;
  executionSteps: ExecutionStep[];
  exportUrl: string | null;
  proofHash: string | null;
}

interface ExecutionStep {
  stepNumber: number;
  description: string;
  type: 'on-chain' | 'cex-manual';
  status: 'pending' | 'executing' | 'completed' | 'failed';
  transactionHash: string | null;
  cexPlatform?: string;
  errorMessage: string | null;
  guardianScore: number;
  timestamp: string | null;
  durationMs?: number;
}
```

#### FilterState Component

```typescript
interface FilterState {
  search: string;
  types: ('harvest' | 'loss-lot' | 'cex-position')[];
  wallets: string[];
  riskLevels: ('LOW' | 'MEDIUM' | 'HIGH')[];
  minBenefit: number;
  holdingPeriod: ('short-term' | 'long-term' | 'all');
  gasEfficiency: ('A' | 'B' | 'C' | 'all');
  liquidity: ('high' | 'medium' | 'low' | 'all');
  sort: SortOption;
}

type SortOption = 
  | 'net-benefit-desc'
  | 'loss-amount-desc'
  | 'guardian-score-desc'
  | 'gas-efficiency-asc'
  | 'newest';
```

## Data Models

### State Machine

HarvestSession status transitions follow this state machine:

```
draft
  ↓ (execute)
executing
  ↓ (success)
completed
  ↳ (retry) → executing
  ↓ (fail)
failed
  ↓ (cancel)
cancelled
```

**Valid Transitions:**
- `draft → executing`: User clicks "Execute Harvest"
- `draft → cancelled`: User cancels before execution
- `executing → completed`: All steps succeed
- `executing → failed`: Any step fails
- `failed → executing`: User retries after fixing issues
- `failed → cancelled`: User gives up

### Database Schema (Supabase/PostgreSQL)

```sql
-- Harvest lots table
CREATE TABLE harvest_lots (
  lot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  wallet_or_cex TEXT NOT NULL,
  acquired_at TIMESTAMPTZ NOT NULL,
  acquired_qty NUMERIC NOT NULL,
  acquired_price_usd NUMERIC NOT NULL,
  current_price_usd NUMERIC NOT NULL,
  unrealized_pnl NUMERIC NOT NULL,
  holding_period_days INTEGER NOT NULL,
  long_term BOOLEAN NOT NULL,
  risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  liquidity_score NUMERIC CHECK (liquidity_score >= 0 AND liquidity_score <= 100),
  guardian_score NUMERIC CHECK (guardian_score >= 0 AND guardian_score <= 10),
  eligible_for_harvest BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Harvest opportunities table
CREATE TABLE harvest_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_id UUID REFERENCES harvest_lots(lot_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  token_logo_url TEXT,
  risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  unrealized_loss NUMERIC NOT NULL,
  remaining_qty NUMERIC NOT NULL,
  gas_estimate NUMERIC NOT NULL,
  slippage_estimate NUMERIC NOT NULL,
  trading_fees NUMERIC NOT NULL,
  net_tax_benefit NUMERIC NOT NULL,
  guardian_score NUMERIC CHECK (guardian_score >= 0 AND guardian_score <= 10),
  execution_time_estimate TEXT,
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 100),
  recommendation_badge TEXT CHECK (recommendation_badge IN ('recommended', 'not-recommended', 'high-benefit', 'gas-heavy', 'guardian-flagged')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Harvest sessions table
CREATE TABLE harvest_sessions (
  session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'executing', 'completed', 'failed', 'cancelled')),
  opportunities_selected JSONB DEFAULT '[]',
  realized_losses_total NUMERIC DEFAULT 0,
  net_benefit_total NUMERIC DEFAULT 0,
  execution_steps JSONB DEFAULT '[]',
  export_url TEXT,
  proof_hash TEXT
);

-- Execution steps table
CREATE TABLE execution_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES harvest_sessions(session_id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('on-chain', 'cex-manual')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'failed')),
  transaction_hash TEXT,
  cex_platform TEXT,
  error_message TEXT,
  guardian_score NUMERIC CHECK (guardian_score >= 0 AND guardian_score <= 10),
  timestamp TIMESTAMPTZ,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings table
CREATE TABLE harvest_user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_rate NUMERIC NOT NULL DEFAULT 0.24 CHECK (tax_rate >= 0 AND tax_rate <= 1),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  notification_threshold NUMERIC DEFAULT 100,
  preferred_wallets TEXT[] DEFAULT '{}',
  risk_tolerance TEXT DEFAULT 'moderate' CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet transactions table (for FIFO calculation)
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  token TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('buy', 'sell', 'transfer_in', 'transfer_out')),
  quantity NUMERIC NOT NULL,
  price_usd NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(transaction_hash, wallet_address)
);

-- CEX accounts table
CREATE TABLE cex_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exchange_name TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  api_secret_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CEX trades table
CREATE TABLE cex_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cex_account_id UUID REFERENCES cex_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  trade_type TEXT CHECK (trade_type IN ('buy', 'sell')),
  quantity NUMERIC NOT NULL,
  price_usd NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cex_account_id, token, timestamp)
);

-- Indexes for performance
CREATE INDEX idx_harvest_lots_user ON harvest_lots(user_id, created_at DESC);
CREATE INDEX idx_harvest_lots_eligible ON harvest_lots(user_id, eligible_for_harvest) WHERE eligible_for_harvest = TRUE;
CREATE INDEX idx_harvest_opportunities_user ON harvest_opportunities(user_id, created_at DESC);
CREATE INDEX idx_harvest_opportunities_benefit ON harvest_opportunities(user_id, net_tax_benefit DESC);
CREATE INDEX idx_harvest_sessions_user ON harvest_sessions(user_id, created_at DESC);
CREATE INDEX idx_harvest_sessions_status ON harvest_sessions(user_id, status);
CREATE INDEX idx_execution_steps_session ON execution_steps(session_id, step_number);
CREATE INDEX idx_wallet_transactions_user_token ON wallet_transactions(user_id, wallet_address, token, timestamp DESC);
CREATE INDEX idx_cex_trades_user_token ON cex_trades(user_id, token, timestamp DESC);

-- Full-text search index for token search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_token_fts ON harvest_opportunities USING GIN (token gin_trgm_ops);

-- RLS Policies
ALTER TABLE harvest_lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY p_harvest_lots_user ON harvest_lots
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE harvest_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY p_harvest_opportunities_user ON harvest_opportunities
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE harvest_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY p_harvest_sessions_user ON harvest_sessions
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE harvest_user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY p_harvest_settings_user ON harvest_user_settings
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY p_wallet_transactions_user ON wallet_transactions
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE cex_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY p_cex_accounts_user ON cex_accounts
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE cex_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY p_cex_trades_user ON cex_trades
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### API Response Schemas

```typescript
// GET /api/harvest/opportunities response
interface OpportunitiesResponse {
  items: HarvestOpportunity[];
  cursor: string | null;
  ts: string; // RFC3339 UTC
  summary: {
    totalHarvestableLoss: number;
    estimatedNetBenefit: number;
    eligibleTokensCount: number;
    gasEfficiencyScore: 'A' | 'B' | 'C';
  };
}

// GET /api/harvest/prices response
interface PriceResponse {
  ts: string; // RFC3339 UTC
  prices: Record<string, number>; // token symbol -> USD price
}

// POST /api/harvest/sessions response
interface CreateSessionResponse {
  sessionId: string;
  status: 'draft';
  createdAt: string;
}

// GET /api/harvest/sessions/:id response
interface SessionResponse {
  session: HarvestSession;
}

// POST /api/harvest/sessions/:id/execute response
interface ExecuteResponse {
  sessionId: string;
  status: 'executing';
  steps: ExecutionStep[];
}

// GET /api/harvest/sessions/:id/export response
// Returns CSV file download

// GET /api/harvest/sessions/:id/proof response
interface ProofOfHarvest {
  sessionId: string;
  userId: string;
  executedAt: string;
  lots: HarvestedLot[];
  totalLoss: number;
  netBenefit: number;
  proofHash: string;
}

// Error response
interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    retry_after_sec?: number;
  };
}

type ErrorCode = 
  | 'RATE_LIMITED'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'INTERNAL'
  | 'UNAVAILABLE'
  | 'INSUFFICIENT_BALANCE'
  | 'GAS_ESTIMATION_FAILED'
  | 'EXECUTION_FAILED';
```

## Corr
ectness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: FIFO Cost Basis Consistency
*For any* sequence of transactions for a token, calculating cost basis using FIFO SHALL produce lots in chronological order where the oldest acquisition is always sold first.
**Validates: Requirements 2.1, 16.1**

### Property 2: Unrealized PnL Calculation Accuracy
*For any* lot with acquisition price and current price, the unrealized PnL SHALL equal (current_price - acquired_price) * quantity.
**Validates: Requirements 2.2**

### Property 3: Loss Threshold Filtering
*For any* lot with unrealized loss less than or equal to $20, the lot SHALL NOT be flagged as a harvest opportunity.
**Validates: Requirements 2.3**

### Property 4: Holding Period Calculation
*For any* lot with an acquisition date, the holding period in days SHALL equal the number of days between acquisition date and current date.
**Validates: Requirements 2.4**

### Property 5: Eligibility Filter Composition
*For any* lot, it SHALL be eligible for harvest if and only if: unrealized loss > $20 AND liquidity score >= threshold AND guardian score >= 3 AND gas cost < unrealized loss AND token is tradable.
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 6: Net Benefit Calculation
*For any* harvest opportunity, net benefit SHALL equal (unrealized_loss * tax_rate) - gas_estimate - slippage_estimate - trading_fees.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 7: Not Recommended Classification
*For any* harvest opportunity where net benefit <= 0, the opportunity SHALL be tagged as not recommended.
**Validates: Requirements 4.5**

### Property 8: Filter Application
*For any* set of opportunities and any filter criteria, applying the filter SHALL return only opportunities matching all active filter conditions.
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 9: Session State Transitions
*For any* harvest session, state transitions SHALL follow the valid paths: draft → executing → completed, draft → cancelled, or executing → failed.
**Validates: Requirements 8.1**

### Property 10: CSV Export Completeness
*For any* completed harvest session, the generated CSV SHALL include exactly one row per harvested lot with all required columns (description, date acquired, date sold, proceeds, cost basis, gain/loss).
**Validates: Requirements 11.2, 11.4**


### Property 11: Monetary Value Formatting
*For any* monetary value in CSV exports, the value SHALL be formatted with exactly two decimal places.
**Validates: Requirements 11.3**

### Property 12: Risk Level Classification
*For any* lot, risk level SHALL be HIGH if guardian_score <= 3 OR liquidity_flag = false, MEDIUM if guardian_score is 4-6, and LOW if guardian_score >= 7.
**Validates: Requirements 15.1, 15.2, 15.3, 15.4**

### Property 13: Calculation Determinism
*For any* two opportunities with identical input parameters (unrealized loss, tax rate, gas estimate, slippage, fees), the net benefit calculation SHALL produce identical results.
**Validates: Requirements 16.2**

### Property 14: Export Data Completeness
*For any* harvest session export, all source data used in calculations (lot details, prices, costs) SHALL be included in the export.
**Validates: Requirements 16.3**

### Property 15: Session Data Persistence
*For any* harvest session, all input parameters and calculation results SHALL be stored in the database.
**Validates: Requirements 16.4**

### Property 16: Hash Function Determinism
*For any* harvest session data, generating the proof hash twice with identical input SHALL produce identical hash values.
**Validates: Requirements 16.5**

### Property 17: Credential Encryption
*For any* API credential (wallet or CEX), the stored value SHALL be encrypted and SHALL NOT match the plaintext value.
**Validates: Requirements 1.4**

### Property 18: Data Aggregation Completeness
*For any* user with N connected wallets and M CEX accounts, the unified view SHALL include data from all N+M sources.
**Validates: Requirements 1.5**

### Property 19: Settings Application
*For any* user settings change (tax rate, notification threshold), all subsequent calculations SHALL use the updated values.
**Validates: Requirements 20.2, 20.5**

### Property 20: Notification Threshold
*For any* harvest opportunity where net benefit exceeds the user's notification threshold, a notification SHALL be sent.
**Validates: Requirements 13.1, 13.2**

## Error Handling

### Error Handling Strategy

1. **API Errors**: Structured error responses with stable error codes
2. **Network Errors**: Retry with exponential backoff (max 3 retries)
3. **Rate Limiting**: Respect Retry-After headers
4. **Validation Errors**: Client-side validation with Zod before API calls
5. **Execution Errors**: Graceful degradation with clear user messaging
6. **Fallback UI**: Show cached data when API unavailable

### Error States and Handling

```typescript
// Error boundary for HarvestPro screens
class HarvestProErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logErrorToService('harvestpro', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <HarvestProErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

// Specific error handlers
const ERROR_HANDLERS = {
  NO_WALLETS_CONNECTED: () => ({
    type: 'warning',
    message: 'Please connect a wallet to view harvest opportunities',
    action: 'Connect Wallet',
  }),
  
  CEX_API_ERROR: (exchange: string) => ({
    type: 'error',
    message: `Unable to fetch data from ${exchange}. Please check your API credentials.`,
    action: 'Reconnect',
  }),
  
  GAS_ESTIMATION_FAILED: () => ({
    type: 'error',
    message: 'Unable to estimate gas costs. Network may be congested.',
    action: 'Retry',
  }),
  
  ILLIQUID_SWAP: (token: string) => ({
    type: 'warning',
    message: `${token} has low liquidity. Slippage may be higher than estimated.`,
    action: 'Proceed with Caution',
  }),
  
  EXECUTION_FAILED: (step: string, reason: string) => ({
    type: 'error',
    message: `Step "${step}" failed: ${reason}`,
    action: 'Retry',
  }),
};
```

## Testing Strategy

### Unit Tests
- FIFO cost basis calculation algorithm
- Net benefit calculation with various inputs
- Eligibility filtering logic
- Risk classification rules
- CSV generation and formatting
- Hash function determinism
- State machine transitions

### Property-Based Tests
- **Property 1-20**: Implement each correctness property as a property-based test
- Use fast-check library for TypeScript
- Generate random inputs for comprehensive coverage
- Minimum 100 iterations per property test
- Tag each test with property number and requirement reference

### Integration Tests
- Wallet connection and data fetching
- CEX API integration
- Guardian score integration
- Action Engine execution flow
- Database queries and mutations
- Export file generation

### E2E Tests (Playwright)
- Complete harvest flow from dashboard to success
- Filter application and persistence
- Modal interactions
- Execution flow with mocked transactions
- CSV download and verification
- Proof-of-Harvest page display
- Mobile responsive behavior
- Accessibility compliance

### Performance Tests
- Scan completion time (P95 < 10s)
- API response time (P95 < 200ms)
- Export generation time (< 2s)
- Database query performance
- Cache hit rates


## Performance Optimization

### Frontend Optimizations

1. **Code Splitting**: Dynamic imports for heavy components (modals, charts)
2. **Image Optimization**: Next.js Image component with lazy loading for token logos
3. **Memoization**: React.memo for expensive components (opportunity cards)
4. **Debouncing**: Filter inputs debounced by 300ms
5. **Virtual Scrolling**: For large opportunity lists (>50 items)
6. **Prefetching**: Prefetch next page at 70% scroll

### Backend Optimizations

1. **Database Indexing**: Optimized queries with proper indexes on user_id, created_at, net_benefit
2. **Query Batching**: Batch Guardian score lookups
3. **Cursor Pagination**: Efficient infinite scroll with stable cursors
4. **Redis Caching**: Cache opportunity calculations for 5 minutes
5. **Connection Pooling**: Supabase connection management
6. **Parallel Processing**: Fetch wallet and CEX data in parallel

### Caching Strategy

```typescript
const CACHE_STRATEGY = {
  // Redis/KV
  redis: {
    opportunities: {
      ttl: 300, // 5 minutes
      key: (userId: string) => `harvest:opps:${userId}`,
    },
    guardianScores: {
      ttl: 3600, // 1 hour
      key: (token: string) => `harvest:guardian:${token}`,
    },
    priceData: {
      ttl: 60, // 1 minute
      key: (token: string) => `harvest:price:${token}`,
    },
  },
  
  // Client (React Query)
  client: {
    opportunities: {
      staleTime: 60000, // 1 minute
      cacheTime: 300000, // 5 minutes
    },
    sessions: {
      staleTime: 30000, // 30 seconds
      cacheTime: 300000, // 5 minutes
    },
    settings: {
      staleTime: Infinity, // Never stale
    },
  },
};
```

## Security Considerations

### Content Security Policy

```typescript
const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'", 'vercel.live'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:', 'blob:', 'imageproxy.alphawhale.com'],
  'font-src': ["'self'", 'data:'],
  'connect-src': [
    "'self'",
    'https://api.alphawhale.com',
    'https://*.supabase.co',
    'https://api.coingecko.com',
    'https://*.alchemy.com',
  ],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};
```

### Data Encryption

```typescript
import crypto from 'crypto';

// Encrypt CEX API credentials
export function encryptCredential(plaintext: string): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptCredential(ciphertext: string): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Rate Limiting

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, '1 h'), // 60 requests per hour
  analytics: true,
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(
    `harvestpro:${identifier}`
  );
  
  if (!success) {
    throw new RateLimitError({
      limit,
      reset,
      remaining,
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    });
  }
}
```

### Input Validation

```typescript
import { z } from 'zod';

// Validate harvest opportunity creation
export const CreateOpportunitySchema = z.object({
  lotId: z.string().uuid(),
  token: z.string().min(1).max(20),
  unrealizedLoss: z.number().positive(),
  gasEstimate: z.number().nonnegative(),
  slippageEstimate: z.number().nonnegative(),
  tradingFees: z.number().nonnegative(),
});

// Validate user settings
export const UserSettingsSchema = z.object({
  taxRate: z.number().min(0).max(1),
  notificationsEnabled: z.boolean(),
  notificationThreshold: z.number().nonnegative(),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
});
```

## Monitoring and Observability

### Metrics to Track

1. **Performance Metrics**
   - Scan completion time (P50, P95, P99)
   - API response time by endpoint
   - Database query time
   - Cache hit rates
   - Export generation time

2. **Business Metrics**
   - Opportunities discovered per user
   - Harvest completion rate
   - Average net benefit per harvest
   - Filter usage patterns
   - CEX vs wallet opportunity distribution

3. **Error Metrics**
   - Error rate by endpoint
   - Failed executions by reason
   - CEX API failures by exchange
   - Gas estimation failures
   - Rate limit hits

### Alerting Rules

```typescript
const ALERT_RULES = {
  scan_time_p95: {
    threshold: 10000, // 10 seconds
    window: '5m',
    severity: 'warning',
  },
  api_latency_p95: {
    threshold: 200, // ms
    window: '5m',
    severity: 'warning',
  },
  error_rate: {
    threshold: 0.01, // 1%
    window: '5m',
    severity: 'critical',
  },
  execution_failure_rate: {
    threshold: 0.05, // 5%
    window: '15m',
    severity: 'critical',
  },
};
```


## Implementation Details

### FIFO Cost Basis Calculation

```typescript
// lib/fifo.ts
export interface Transaction {
  timestamp: Date;
  type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out';
  quantity: number;
  priceUsd: number;
}

export interface Lot {
  acquiredAt: Date;
  quantity: number;
  priceUsd: number;
  remaining: number;
}

export function calculateFIFOLots(transactions: Transaction[]): Lot[] {
  // Sort transactions chronologically
  const sorted = [...transactions].sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  );
  
  const lots: Lot[] = [];
  
  for (const tx of sorted) {
    if (tx.type === 'buy' || tx.type === 'transfer_in') {
      // Add new lot
      lots.push({
        acquiredAt: tx.timestamp,
        quantity: tx.quantity,
        priceUsd: tx.priceUsd,
        remaining: tx.quantity,
      });
    } else if (tx.type === 'sell' || tx.type === 'transfer_out') {
      // Consume from oldest lots first (FIFO)
      let remaining = tx.quantity;
      
      for (const lot of lots) {
        if (remaining <= 0) break;
        if (lot.remaining <= 0) continue;
        
        const consumed = Math.min(lot.remaining, remaining);
        lot.remaining -= consumed;
        remaining -= consumed;
      }
    }
  }
  
  // Return only lots with remaining quantity
  return lots.filter(lot => lot.remaining > 0);
}
```

### Net Benefit Calculation

```typescript
// lib/harvest-calculator.ts
export interface HarvestCalculation {
  unrealizedLoss: number;
  taxSavings: number;
  gasCost: number;
  slippageCost: number;
  tradingFees: number;
  netBenefit: number;
  recommended: boolean;
}

export function calculateNetBenefit(
  lot: Lot,
  currentPrice: number,
  taxRate: number,
  gasEstimate: number,
  slippageEstimate: number,
  tradingFees: number
): HarvestCalculation {
  // Calculate unrealized loss
  const unrealizedLoss = (lot.priceUsd - currentPrice) * lot.remaining;
  
  // Only proceed if there's a loss
  if (unrealizedLoss <= 0) {
    return {
      unrealizedLoss: 0,
      taxSavings: 0,
      gasCost: 0,
      slippageCost: 0,
      tradingFees: 0,
      netBenefit: 0,
      recommended: false,
    };
  }
  
  // Calculate tax savings
  const taxSavings = unrealizedLoss * taxRate;
  
  // Calculate net benefit
  const netBenefit = taxSavings - gasEstimate - slippageEstimate - tradingFees;
  
  return {
    unrealizedLoss,
    taxSavings,
    gasCost: gasEstimate,
    slippageCost: slippageEstimate,
    tradingFees,
    netBenefit,
    recommended: netBenefit > 0,
  };
}
```

### Eligibility Filtering

```typescript
// lib/eligibility.ts
export interface EligibilityCheck {
  eligible: boolean;
  reasons: string[];
}

export function checkEligibility(
  lot: Lot,
  currentPrice: number,
  liquidityScore: number,
  guardianScore: number,
  gasEstimate: number,
  isTradable: boolean
): EligibilityCheck {
  const reasons: string[] = [];
  
  // Calculate unrealized loss
  const unrealizedLoss = (lot.priceUsd - currentPrice) * lot.remaining;
  
  // Check minimum loss threshold
  if (unrealizedLoss <= 20) {
    reasons.push('Unrealized loss must exceed $20');
  }
  
  // Check liquidity
  if (liquidityScore < 50) {
    reasons.push('Insufficient liquidity');
  }
  
  // Check Guardian score
  if (guardianScore < 3) {
    reasons.push('Guardian score too low (high risk)');
  }
  
  // Check gas cost
  if (gasEstimate >= unrealizedLoss) {
    reasons.push('Gas cost exceeds potential benefit');
  }
  
  // Check tradability
  if (!isTradable) {
    reasons.push('Token not tradable on supported venues');
  }
  
  return {
    eligible: reasons.length === 0,
    reasons,
  };
}
```

### CSV Export Generation

```typescript
// lib/export.ts
import { stringify } from 'csv-stringify/sync';

export interface HarvestedLot {
  token: string;
  dateAcquired: Date;
  dateSold: Date;
  quantity: number;
  costBasis: number;
  proceeds: number;
  gainLoss: number;
}

export function generateForm8949CSV(lots: HarvestedLot[]): string {
  const records = lots.map(lot => ({
    'Description': `${lot.quantity.toFixed(8)} ${lot.token}`,
    'Date Acquired': lot.dateAcquired.toISOString().split('T')[0],
    'Date Sold': lot.dateSold.toISOString().split('T')[0],
    'Proceeds': lot.proceeds.toFixed(2),
    'Cost Basis': lot.costBasis.toFixed(2),
    'Gain or Loss': lot.gainLoss.toFixed(2),
  }));
  
  return stringify(records, {
    header: true,
    columns: [
      'Description',
      'Date Acquired',
      'Date Sold',
      'Proceeds',
      'Cost Basis',
      'Gain or Loss',
    ],
  });
}
```

### Proof Hash Generation

```typescript
// lib/proof.ts
import crypto from 'crypto';

export interface ProofData {
  sessionId: string;
  userId: string;
  timestamp: string;
  lots: HarvestedLot[];
  totalLoss: number;
  netBenefit: number;
}

export function generateProofHash(data: ProofData): string {
  // Create deterministic string representation
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  
  // Generate SHA-256 hash
  return crypto
    .createHash('sha256')
    .update(canonical)
    .digest('hex');
}

export function verifyProofHash(data: ProofData, hash: string): boolean {
  const computed = generateProofHash(data);
  return computed === hash;
}
```

### API Implementation Examples

```typescript
// app/api/harvest/opportunities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { getHarvestOpportunities } from '@/lib/harvest-service';

const QuerySchema = z.object({
  wallets: z.array(z.string()).optional(),
  minBenefit: z.coerce.number().min(0).optional(),
  riskLevels: z.array(z.enum(['LOW', 'MEDIUM', 'HIGH'])).optional(),
  cursor: z.string().optional(),
});

export async function GET(req: NextRequest) {
  // Rate limiting
  const identifier = req.headers.get('x-forwarded-for') || 'anonymous';
  try {
    await checkRateLimit(identifier);
  } catch (error) {
    return NextResponse.json(
      { 
        error: { 
          code: 'RATE_LIMITED', 
          message: 'Too many requests', 
          retry_after_sec: error.retryAfter 
        } 
      },
      { 
        status: 429, 
        headers: { 'Retry-After': String(error.retryAfter) } 
      }
    );
  }

  // Validate query parameters
  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    wallets: searchParams.getAll('wallet'),
    minBenefit: searchParams.get('minBenefit'),
    riskLevels: searchParams.getAll('riskLevel'),
    cursor: searchParams.get('cursor'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid query parameters' } },
      { status: 400 }
    );
  }

  // Fetch opportunities
  const result = await getHarvestOpportunities(parsed.data);

  const response = NextResponse.json({
    items: result.opportunities,
    cursor: result.nextCursor,
    ts: new Date().toISOString(),
    summary: result.summary,
  });

  response.headers.set('Cache-Control', 'private, max-age=60');
  return response;
}
```

## Deployment Strategy

### Feature Flags

```typescript
interface FeatureFlags {
  harvestProEnabled: boolean;
  cexIntegrationEnabled: boolean;
  automatedExecutionEnabled: boolean;
  advancedFiltersEnabled: boolean;
}

const ROLLOUT_PERCENTAGES = {
  harvestProEnabled: 100, // Full rollout
  cexIntegrationEnabled: 50, // 50% of users
  automatedExecutionEnabled: 10, // 10% of users
  advancedFiltersEnabled: 100, // Full rollout
};
```

### Deployment Checklist

- [ ] Run all tests (unit, integration, property-based, E2E)
- [ ] Verify database migrations
- [ ] Test feature flags
- [ ] Review security headers and CSP
- [ ] Check rate limiting configuration
- [ ] Verify encryption keys are set
- [ ] Test CEX API integrations
- [ ] Validate Guardian integration
- [ ] Test Action Engine integration
- [ ] Verify export file generation
- [ ] Check monitoring dashboards
- [ ] Test error handling and fallbacks
- [ ] Validate analytics events
- [ ] Review accessibility compliance
- [ ] Test mobile responsive design

## Future Enhancements (v2.0+)

1. **Automated CEX Execution**: Direct API execution for supported exchanges
2. **Multi-Year Tax Planning**: Optimize harvesting across multiple tax years
3. **Wash Sale Detection**: Automatic detection and prevention of wash sales
4. **Portfolio Rebalancing**: Combine harvesting with portfolio rebalancing
5. **Tax Form Generation**: Generate complete IRS forms (not just CSV)
6. **International Tax Support**: Support for non-US tax regimes
7. **Advanced Analytics**: Historical harvest performance tracking
8. **AI Recommendations**: ML-based optimization of harvest timing
9. **Batch Harvesting**: Execute multiple harvests in a single transaction
10. **Mobile App**: Native iOS/Android app for on-the-go harvesting

---

**Document Version:** 1.0  
**Last Updated:** November 2025  
**Next Review:** After v1 launch
