# Enhanced HarvestPro Design Document - App Store Version

## Overview

HarvestPro is a tax-loss harvesting module within AlphaWhale that helps users identify unrealized losses, estimate tax benefits, and prepare transactions through the Action Center. This design document outlines the system architecture, components, and implementation approach for the enhanced App Store-compliant version.

### Key Design Principles

1. **UI is Presentation Only**: All business logic resides in Supabase Edge Functions
2. **Apple App Store Compliance**: Safe language, no tax advice claims, clear disclaimers
3. **Trinity-Correct Flow**: Hunter → Action Center → Guardian integration
4. **Demo Mode First**: Full functionality without wallet connection
5. **Tax Compliance**: Deterministic calculations, auditable records, property-based testing

### System Boundaries

**In Scope:**
- Opportunity identification and ranking
- Tax impact estimation (informational only)
- Transaction preparation (not execution)
- Form 8949-compatible export generation
- Proof-of-Activity integrity records
- Demo mode with realistic sample data

**Out of Scope:**
- Tax advice or guarantees
- Automatic transaction execution
- IRS filing or submission
- Portfolio management recommendations
- Real-time trading

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js UI    │    │  Supabase Edge   │    │   External      │
│   (Presentation │◄──►│   Functions      │◄──►│   Services      │
│    Layer Only)  │    │ (Business Logic) │    │ (Price/Guardian)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Query   │    │   PostgreSQL     │    │   Action Center │
│   (Caching)     │    │   (Database)     │    │  (Tx Routing)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Data Flow

**Read Operations (Dashboard, Opportunities):**
```
UI Component → Next.js API Route → Supabase DB → Response
```

**Heavy Compute Operations (Opportunity Detection, Net Benefit Calculation):**
```
UI Component → Next.js API Route → Edge Function → Supabase DB → Response
```

**Transaction Preparation:**
```
UI Component → Next.js API Route → Edge Function → Action Center → External Wallet
```

### Edge Functions Architecture

All business logic resides in Supabase Edge Functions:

```
supabase/functions/
├── harvest-sync-wallets/          # Fetch tx history, rebuild lots
├── harvest-sync-cex/              # CEX API integration, update lots
├── harvest-recompute-opportunities/ # Heavy optimization engine
├── harvest-notify/                # Scheduled notifications
├── harvest-economic-substance/    # v2: Pattern detection
├── harvest-mev-protection/        # v2: Private RPC routing
├── harvest-kyt-screen/            # v3: Sanctions screening
├── webhook-fireblocks/            # v3: Custody webhooks
├── webhook-copper/                # v3: Custody webhooks
├── harvest-twap-worker/           # v3: TWAP execution
└── _shared/harvestpro/            # Shared utilities
```

## Components and Interfaces

### Core Components

#### 1. HarvestPro Dashboard (`src/app/(app)/harvest/page.tsx`)

**Responsibilities:**
- Display opportunity cards in Hunter-style layout
- Handle filter interactions
- Manage demo/live mode switching
- Show summary metrics

**Props:** None (page component)

**State Management:**
- React Query for opportunities data
- Zustand for filter state
- Local state for UI interactions

#### 2. OpportunityCard (`src/components/harvestpro/OpportunityCard.tsx`)

**Responsibilities:**
- Display individual harvest opportunity
- Show risk indicators and metrics
- Handle card interactions

**Props:**
```typescript
interface OpportunityCardProps {
  opportunity: HarvestOpportunity;
  isDemo: boolean;
  onSelect: (id: string) => void;
  onPrepare: (id: string) => void;
}
```

#### 3. HarvestModal (`src/components/harvestpro/HarvestModal.tsx`)

**Responsibilities:**
- Show detailed opportunity information
- Display execution steps
- Handle transaction preparation

**Props:**
```typescript
interface HarvestModalProps {
  opportunity: HarvestOpportunity;
  isOpen: boolean;
  onClose: () => void;
  onPrepare: () => void;
}
```

#### 4. ExecutionFlow (`src/components/harvestpro/ExecutionFlow.tsx`)

**Responsibilities:**
- Guide user through harvest execution
- Show step-by-step progress
- Handle wallet handoff

**Props:**
```typescript
interface ExecutionFlowProps {
  session: HarvestSession;
  onComplete: (sessionId: string) => void;
  onCancel: () => void;
}
```

#### 5. ProofOfActivity (`src/components/harvestpro/ProofOfActivity.tsx`)

**Responsibilities:**
- Display integrity record
- Show cryptographic proof
- Handle PDF export

**Props:**
```typescript
interface ProofOfActivityProps {
  sessionId: string;
  proofData: ProofOfActivityData;
}
```

### API Layer

#### Next.js API Routes (Thin Layer)

**Read Operations:**
- `GET /api/harvest/opportunities` - List opportunities with filters
- `GET /api/harvest/sessions/:id` - Get session details
- `GET /api/harvest/settings` - Get user settings

**Orchestration:**
- `POST /api/harvest/sessions` - Create session, call Edge Function
- `POST /api/harvest/sessions/:id/prepare` - Trigger preparation
- `POST /api/harvest/sync/wallets` - Trigger wallet sync

**File Operations:**
- `GET /api/harvest/sessions/:id/export` - Generate CSV
- `GET /api/harvest/sessions/:id/proof` - Generate PDF

#### Edge Functions (Business Logic)

**harvest-recompute-opportunities:**
```typescript
interface ComputeRequest {
  userId: string;
  walletAddresses?: string[];
  forceRefresh?: boolean;
}

interface ComputeResponse {
  opportunities: HarvestOpportunity[];
  summary: {
    totalLoss: number;
    netBenefit: number;
    eligibleCount: number;
  };
  computedAt: string;
}
```

**harvest-sync-wallets:**
```typescript
interface SyncRequest {
  userId: string;
  walletAddress: string;
  fromBlock?: number;
}

interface SyncResponse {
  lotsProcessed: number;
  transactionsScanned: number;
  lastBlock: number;
  syncedAt: string;
}
```

### Data Models (Enhanced)

#### HarvestOpportunity (Extended)
```typescript
interface HarvestOpportunity {
  // Core fields
  id: string;
  lotId: string;
  token: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  
  // Financial calculations
  unrealizedLoss: number;
  gasEstimate: number;
  slippageEstimate: number;
  tradingFees: number;
  netTaxBenefit: number;
  
  // Risk and confidence
  guardianScore: number;
  confidence: number;
  washSaleRisk: boolean;
  
  // Data quality (Requirement 23)
  costBasisConfidence: "HIGH" | "MEDIUM" | "LOW";
  dataQualityFlags: string[];
  
  // Execution details
  executionTimeEstimate: string;
  venue: string;
  
  // Metadata
  metadata: {
    walletName: string;
    venue: string;
    reasons: string[];
    dataQualityFlags: string[];
    transferInferred?: boolean;
  };
}
```

#### HarvestSession (Extended)
```typescript
interface HarvestSession {
  sessionId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "preparing" | "completed" | "failed" | "cancelled";
  
  // Opportunities and results
  opportunitiesSelected: HarvestOpportunity[];
  realizedLossesTotal: number;
  netBenefitTotal: number;
  
  // Execution tracking
  executionSteps: ExecutionStep[];
  
  // Exports and proof
  exportUrl: string | null;
  activityProofHash: string | null;
  
  // Legal compliance (Requirements 0, 24)
  disclosureAccepted: boolean;
  disclosureVersion: string;
  disclosureTimestamp: string;
  
  // Wallet handoff tracking (Requirement 29)
  walletHandoffMethod?: string;
  walletHandoffSessionId?: string;
}
```

#### ExecutionStep (Extended)
```typescript
interface ExecutionStep {
  stepNumber: number;
  description: string;
  type: "on-chain" | "cex-manual";
  status: "pending" | "preparing" | "completed" | "failed";
  
  // Transaction details
  transactionHash: string | null;
  errorMessage: string | null;
  
  // Risk assessment
  guardianScore: number;
  
  // Timing
  timestamp: string | null;
  
  // Preparation vs execution (Requirement 22)
  preparedOnly: boolean;
  
  // CEX instructions (Requirement 9)
  cexInstructions?: {
    exchange: string;
    pair: string;
    quantity: number;
    orderType: string;
    steps: string[];
  };
}
```

## Data Models

### Database Schema

#### harvest_lots
```sql
CREATE TABLE harvest_lots (
  lot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  token VARCHAR(20) NOT NULL,
  wallet_or_cex VARCHAR(100) NOT NULL,
  acquired_at TIMESTAMPTZ NOT NULL,
  acquired_qty DECIMAL(36,18) NOT NULL,
  acquired_price_usd DECIMAL(18,8) NOT NULL,
  current_price_usd DECIMAL(18,8),
  unrealized_pnl DECIMAL(18,8),
  holding_period_days INTEGER,
  risk_level VARCHAR(10) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  liquidity_score INTEGER CHECK (liquidity_score >= 0 AND liquidity_score <= 100),
  guardian_score DECIMAL(3,1) CHECK (guardian_score >= 0 AND guardian_score <= 10),
  eligible_for_harvest BOOLEAN DEFAULT FALSE,
  cost_basis_confidence VARCHAR(10) CHECK (cost_basis_confidence IN ('HIGH', 'MEDIUM', 'LOW')),
  data_quality_flags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### harvest_opportunities
```sql
CREATE TABLE harvest_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  lot_id UUID NOT NULL REFERENCES harvest_lots(lot_id),
  token VARCHAR(20) NOT NULL,
  risk_level VARCHAR(10) NOT NULL,
  unrealized_loss DECIMAL(18,8) NOT NULL,
  gas_estimate DECIMAL(18,8),
  slippage_estimate DECIMAL(18,8),
  trading_fees DECIMAL(18,8),
  net_tax_benefit DECIMAL(18,8),
  guardian_score DECIMAL(3,1),
  execution_time_estimate VARCHAR(50),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  wash_sale_risk BOOLEAN DEFAULT FALSE,
  cost_basis_confidence VARCHAR(10),
  data_quality_flags TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### harvest_sessions
```sql
CREATE TABLE harvest_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status VARCHAR(20) CHECK (status IN ('draft', 'preparing', 'completed', 'failed', 'cancelled')),
  opportunities_selected JSONB NOT NULL,
  realized_losses_total DECIMAL(18,8) DEFAULT 0,
  net_benefit_total DECIMAL(18,8) DEFAULT 0,
  export_url TEXT,
  activity_proof_hash VARCHAR(64),
  disclosure_accepted BOOLEAN DEFAULT FALSE,
  disclosure_version VARCHAR(10),
  disclosure_timestamp TIMESTAMPTZ,
  wallet_handoff_method VARCHAR(50),
  wallet_handoff_session_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### harvest_execution_steps
```sql
CREATE TABLE harvest_execution_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES harvest_sessions(session_id),
  step_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(20) CHECK (type IN ('on-chain', 'cex-manual')),
  status VARCHAR(20) CHECK (status IN ('pending', 'preparing', 'completed', 'failed')),
  transaction_hash VARCHAR(66),
  error_message TEXT,
  guardian_score DECIMAL(3,1),
  timestamp TIMESTAMPTZ,
  prepared_only BOOLEAN DEFAULT FALSE,
  cex_instructions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### harvest_user_settings
```sql
CREATE TABLE harvest_user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  estimated_marginal_rate DECIMAL(5,4) CHECK (estimated_marginal_rate >= 0 AND estimated_marginal_rate <= 1),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  notification_threshold DECIMAL(18,8) DEFAULT 20,
  preferred_wallets TEXT[],
  risk_tolerance VARCHAR(20) CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
  wash_sale_warnings_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes and Performance

```sql
-- Performance indexes
CREATE INDEX idx_harvest_lots_user_eligible ON harvest_lots(user_id, eligible_for_harvest);
CREATE INDEX idx_harvest_opportunities_user_benefit ON harvest_opportunities(user_id, net_tax_benefit DESC);
CREATE INDEX idx_harvest_sessions_user_status ON harvest_sessions(user_id, status, created_at DESC);

-- RLS Policies
ALTER TABLE harvest_lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own lots" ON harvest_lots FOR ALL USING (auth.uid() = user_id);

ALTER TABLE harvest_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own opportunities" ON harvest_opportunities FOR ALL USING (auth.uid() = user_id);

ALTER TABLE harvest_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own sessions" ON harvest_sessions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE harvest_execution_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see steps for their sessions" ON harvest_execution_steps FOR ALL USING (
  EXISTS (SELECT 1 FROM harvest_sessions WHERE session_id = harvest_execution_steps.session_id AND user_id = auth.uid())
);

ALTER TABLE harvest_user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own settings" ON harvest_user_settings FOR ALL USING (auth.uid() = user_id);
```

## Correctness Properties

Based on the requirements analysis, here are the key correctness properties that must hold for all valid inputs:

### v1 Core Properties (1-20)

#### Property 1: FIFO Cost Basis Consistency
**Requirement:** 2, 16
**Property:** For any sequence of acquisitions and disposals, FIFO cost basis calculation must be deterministic and chronologically ordered.
```typescript
// Feature: harvestpro, Property 1: FIFO Cost Basis Consistency
// Validates: Requirements 2.1, 16.1
test('FIFO always processes lots in chronological order', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        token: fc.constantFrom('ETH', 'BTC', 'USDC'),
        quantity: fc.float({ min: 0.001, max: 1000 }),
        price: fc.float({ min: 0.01, max: 100000 }),
        timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date() })
      })),
      (lots) => {
        const result = calculateFIFOCostBasis(lots);
        // Property: lots are always processed chronologically
        for (let i = 1; i < result.processedLots.length; i++) {
          expect(result.processedLots[i].timestamp >= result.processedLots[i-1].timestamp).toBe(true);
        }
      }
    ),
    { numRuns: 1000 }
  );
});
```

#### Property 2: Unrealized PnL Calculation Accuracy
**Requirement:** 2
**Property:** Unrealized PnL must equal (current_price - acquired_price) * quantity for all lots.
```typescript
// Feature: harvestpro, Property 2: Unrealized PnL Calculation Accuracy
// Validates: Requirements 2.2
test('unrealized PnL equals price difference times quantity', () => {
  fc.assert(
    fc.property(
      fc.record({
        acquiredPrice: fc.float({ min: 0.01, max: 100000 }),
        currentPrice: fc.float({ min: 0.01, max: 100000 }),
        quantity: fc.float({ min: 0.001, max: 1000 })
      }),
      (lot) => {
        const result = calculateUnrealizedPnL(lot);
        const expected = (lot.currentPrice - lot.acquiredPrice) * lot.quantity;
        expect(Math.abs(result - expected)).toBeLessThan(0.0001);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 3: Loss Threshold Filtering
**Requirement:** 3
**Property:** Only lots with unrealized loss > $20 should be eligible for harvest.
```typescript
// Feature: harvestpro, Property 3: Loss Threshold Filtering
// Validates: Requirements 3.1
test('only lots with loss > $20 are eligible', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        unrealizedPnl: fc.float({ min: -10000, max: 1000 }),
        liquidityScore: fc.integer({ min: 0, max: 100 }),
        guardianScore: fc.float({ min: 0, max: 10 })
      })),
      (lots) => {
        const eligible = filterEligibleLots(lots);
        eligible.forEach(lot => {
          expect(lot.unrealizedPnl).toBeLessThan(-20);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 4: Holding Period Calculation
**Requirement:** 2
**Property:** Holding period must be calculated as days between acquisition and current date.
```typescript
// Feature: harvestpro, Property 4: Holding Period Calculation
// Validates: Requirements 2.4
test('holding period equals days between acquisition and now', () => {
  fc.assert(
    fc.property(
      fc.date({ min: new Date('2020-01-01'), max: new Date() }),
      (acquiredAt) => {
        const now = new Date();
        const result = calculateHoldingPeriod(acquiredAt, now);
        const expectedDays = Math.floor((now.getTime() - acquiredAt.getTime()) / (1000 * 60 * 60 * 24));
        expect(result).toBe(expectedDays);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 5: Eligibility Filter Composition
**Requirement:** 3
**Property:** Eligibility filters must be composable and order-independent.
```typescript
// Feature: harvestpro, Property 5: Eligibility Filter Composition
// Validates: Requirements 3.1-3.5
test('eligibility filters are order-independent', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        unrealizedPnl: fc.float({ min: -10000, max: 1000 }),
        liquidityScore: fc.integer({ min: 0, max: 100 }),
        guardianScore: fc.float({ min: 0, max: 10 }),
        gasEstimate: fc.float({ min: 0, max: 1000 })
      })),
      (lots) => {
        const filter1 = applyEligibilityFilters(lots, ['loss', 'liquidity', 'guardian', 'gas']);
        const filter2 = applyEligibilityFilters(lots, ['guardian', 'gas', 'loss', 'liquidity']);
        expect(filter1).toEqual(filter2);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 6: Net Benefit Calculation
**Requirement:** 4
**Property:** Net benefit must equal tax savings minus all costs.
```typescript
// Feature: harvestpro, Property 6: Net Benefit Calculation
// Validates: Requirements 4.1, 4.2, 4.3, 4.4
test('net benefit equals tax savings minus costs', () => {
  fc.assert(
    fc.property(
      fc.record({
        unrealizedLoss: fc.float({ min: 20, max: 10000 }),
        taxRate: fc.float({ min: 0, max: 0.5 }),
        gasEstimate: fc.float({ min: 0, max: 1000 }),
        slippageEstimate: fc.float({ min: 0, max: 1000 }),
        tradingFees: fc.float({ min: 0, max: 1000 })
      }),
      (params) => {
        const result = calculateNetBenefit(params);
        const expectedTaxSavings = Math.abs(params.unrealizedLoss) * params.taxRate;
        const expectedCosts = params.gasEstimate + params.slippageEstimate + params.tradingFees;
        const expectedNetBenefit = expectedTaxSavings - expectedCosts;
        expect(Math.abs(result.netBenefit - expectedNetBenefit)).toBeLessThan(0.01);
      }
    ),
    { numRuns: 1000 }
  );
});
```

#### Property 7: Not Recommended Classification
**Requirement:** 4
**Property:** Opportunities with net benefit ≤ 0 must be marked as not recommended.
```typescript
// Feature: harvestpro, Property 7: Not Recommended Classification
// Validates: Requirements 4.5
test('opportunities with net benefit <= 0 are not recommended', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        netTaxBenefit: fc.float({ min: -1000, max: 1000 })
      })),
      (opportunities) => {
        const classified = classifyRecommendations(opportunities);
        classified.forEach(opp => {
          if (opp.netTaxBenefit <= 0) {
            expect(opp.recommended).toBe(false);
          }
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 8: Filter Application
**Requirement:** 6
**Property:** Filter application must preserve data integrity and be reversible.
```typescript
// Feature: harvestpro, Property 8: Filter Application
// Validates: Requirements 6.1-6.5
test('filter application preserves data integrity', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        netTaxBenefit: fc.float({ min: -1000, max: 1000 }),
        holdingPeriodDays: fc.integer({ min: 1, max: 3650 }),
        walletAddress: fc.constantFrom('wallet1', 'wallet2', 'wallet3')
      })),
      (opportunities) => {
        const filtered = applyFilters(opportunities, { minBenefit: 100 });
        const unfiltered = applyFilters(opportunities, {});
        
        // All filtered items should be in original set
        filtered.forEach(item => {
          expect(unfiltered).toContainEqual(item);
        });
        
        // Filtered set should be subset of original
        expect(filtered.length).toBeLessThanOrEqual(unfiltered.length);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 9: Session State Transitions
**Requirement:** 8
**Property:** Session status transitions must follow valid state machine rules.
```typescript
// Feature: harvestpro, Property 9: Session State Transitions
// Validates: Requirements 8.1-8.5
test('session state transitions follow valid rules', () => {
  fc.assert(
    fc.property(
      fc.array(fc.constantFrom('prepare', 'complete', 'fail', 'cancel')),
      (actions) => {
        let session = createSession(); // starts as 'draft'
        
        actions.forEach(action => {
          const previousStatus = session.status;
          session = applyAction(session, action);
          
          // Validate transition is legal
          expect(isValidTransition(previousStatus, session.status)).toBe(true);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 10: CSV Export Completeness
**Requirement:** 11, 21
**Property:** CSV export must include all required fields for each harvested lot.
```typescript
// Feature: harvestpro, Property 10: CSV Export Completeness
// Validates: Requirements 11.2, 21.2
test('CSV export includes all required fields', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        token: fc.constantFrom('ETH', 'BTC', 'USDC'),
        dateAcquired: fc.date(),
        dateDisposed: fc.date(),
        proceeds: fc.float({ min: 0, max: 100000 }),
        costBasis: fc.float({ min: 0, max: 100000 })
      })),
      (harvestedLots) => {
        const csv = generateCSVExport(harvestedLots);
        const lines = csv.split('\n');
        const headers = lines[0].split(',');
        
        // Required fields must be present
        const requiredFields = ['description', 'date_acquired', 'date_disposed', 'proceeds_usd', 'cost_basis_usd', 'gain_or_loss_usd'];
        requiredFields.forEach(field => {
          expect(headers).toContain(field);
        });
        
        // Each lot should have a corresponding row
        expect(lines.length - 1).toBe(harvestedLots.length); // -1 for header
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 11: Monetary Value Formatting
**Requirement:** 11
**Property:** All monetary values must be formatted with exactly 2 decimal places.
```typescript
// Feature: harvestpro, Property 11: Monetary Value Formatting
// Validates: Requirements 11.3
test('monetary values formatted with 2 decimal places', () => {
  fc.assert(
    fc.property(
      fc.array(fc.float({ min: 0.001, max: 999999.999 })),
      (values) => {
        values.forEach(value => {
          const formatted = formatMonetaryValue(value);
          const decimalPart = formatted.split('.')[1];
          expect(decimalPart).toBeDefined();
          expect(decimalPart.length).toBe(2);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 12: Risk Level Classification
**Requirement:** 15
**Property:** Risk classification must be consistent based on Guardian score and liquidity.
```typescript
// Feature: harvestpro, Property 12: Risk Level Classification
// Validates: Requirements 15.1-15.4
test('risk classification is consistent with Guardian score', () => {
  fc.assert(
    fc.property(
      fc.record({
        guardianScore: fc.float({ min: 0, max: 10 }),
        liquidityFlag: fc.boolean()
      }),
      (lot) => {
        const riskLevel = classifyRiskLevel(lot);
        
        if (!lot.liquidityFlag) {
          expect(riskLevel).toBe('HIGH');
        } else if (lot.guardianScore <= 3) {
          expect(riskLevel).toBe('HIGH');
        } else if (lot.guardianScore >= 7) {
          expect(riskLevel).toBe('LOW');
        } else {
          expect(riskLevel).toBe('MEDIUM');
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 13: Calculation Determinism
**Requirement:** 16
**Property:** All calculations must produce identical results for identical inputs.
```typescript
// Feature: harvestpro, Property 13: Calculation Determinism
// Validates: Requirements 16.2
test('calculations are deterministic', () => {
  fc.assert(
    fc.property(
      fc.record({
        unrealizedLoss: fc.float({ min: 20, max: 10000 }),
        taxRate: fc.float({ min: 0, max: 0.5 }),
        gasEstimate: fc.float({ min: 0, max: 1000 })
      }),
      (params) => {
        const result1 = calculateNetBenefit(params);
        const result2 = calculateNetBenefit(params);
        expect(result1).toEqual(result2);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 14: Export Data Completeness
**Requirement:** 16
**Property:** Export must include all source data used in calculations.
```typescript
// Feature: harvestpro, Property 14: Export Data Completeness
// Validates: Requirements 16.3
test('export includes all source calculation data', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        lotId: fc.string(),
        calculationInputs: fc.record({
          acquiredPrice: fc.float({ min: 0.01, max: 100000 }),
          currentPrice: fc.float({ min: 0.01, max: 100000 }),
          quantity: fc.float({ min: 0.001, max: 1000 })
        })
      })),
      (lots) => {
        const exportData = generateExportWithSourceData(lots);
        
        lots.forEach(lot => {
          const exportRow = exportData.find(row => row.lotId === lot.lotId);
          expect(exportRow).toBeDefined();
          expect(exportRow.sourceData).toEqual(lot.calculationInputs);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 15: Session Data Persistence
**Requirement:** 16
**Property:** All session input parameters and results must be recorded.
```typescript
// Feature: harvestpro, Property 15: Session Data Persistence
// Validates: Requirements 16.4
test('session records all inputs and outputs', () => {
  fc.assert(
    fc.property(
      fc.record({
        selectedOpportunities: fc.array(fc.string()),
        taxRate: fc.float({ min: 0, max: 0.5 }),
        executionResults: fc.array(fc.string())
      }),
      (sessionData) => {
        const session = createHarvestSession(sessionData);
        
        expect(session.inputParameters).toEqual({
          selectedOpportunities: sessionData.selectedOpportunities,
          taxRate: sessionData.taxRate
        });
        expect(session.executionResults).toEqual(sessionData.executionResults);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 16: Hash Function Determinism
**Requirement:** 16, 24
**Property:** Cryptographic hash must be deterministic for identical session data.
```typescript
// Feature: harvestpro, Property 16: Hash Function Determinism
// Validates: Requirements 16.5, 24.2
test('activity proof hash is deterministic', () => {
  fc.assert(
    fc.property(
      fc.record({
        sessionId: fc.string(),
        inputs: fc.object(),
        outputs: fc.object(),
        executionOutcomes: fc.array(fc.string())
      }),
      (sessionData) => {
        const hash1 = generateActivityProofHash(sessionData);
        const hash2 = generateActivityProofHash(sessionData);
        expect(hash1).toBe(hash2);
        expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 format
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 17: Credential Encryption
**Requirement:** 17, 26
**Property:** All sensitive credentials must be encrypted at rest.
```typescript
// Feature: harvestpro, Property 17: Credential Encryption
// Validates: Requirements 17.3, 26.3
test('credentials are always encrypted at rest', () => {
  fc.assert(
    fc.property(
      fc.record({
        apiKey: fc.string({ minLength: 10, maxLength: 100 }),
        apiSecret: fc.string({ minLength: 10, maxLength: 100 })
      }),
      (credentials) => {
        const stored = storeCredentials(credentials);
        
        // Stored data should not contain plaintext
        expect(stored.encryptedApiKey).not.toBe(credentials.apiKey);
        expect(stored.encryptedApiSecret).not.toBe(credentials.apiSecret);
        
        // Should be able to decrypt back to original
        const decrypted = decryptCredentials(stored);
        expect(decrypted).toEqual(credentials);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 18: Data Aggregation Completeness
**Requirement:** 1
**Property:** Multi-source data aggregation must preserve all source information.
```typescript
// Feature: harvestpro, Property 18: Data Aggregation Completeness
// Validates: Requirements 1.5
test('multi-source aggregation preserves all data', () => {
  fc.assert(
    fc.property(
      fc.record({
        walletData: fc.array(fc.object()),
        cexData: fc.array(fc.object())
      }),
      (sources) => {
        const aggregated = aggregateMultiSourceData(sources);
        
        const totalSourceItems = sources.walletData.length + sources.cexData.length;
        expect(aggregated.length).toBe(totalSourceItems);
        
        // Each source item should be represented
        sources.walletData.forEach(item => {
          expect(aggregated.some(agg => agg.sourceData === item)).toBe(true);
        });
        sources.cexData.forEach(item => {
          expect(aggregated.some(agg => agg.sourceData === item)).toBe(true);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 19: Settings Application
**Requirement:** 20
**Property:** User settings must be applied consistently to all calculations.
```typescript
// Feature: harvestpro, Property 19: Settings Application
// Validates: Requirements 20.2
test('user settings applied consistently to calculations', () => {
  fc.assert(
    fc.property(
      fc.record({
        taxRate: fc.float({ min: 0, max: 0.5 }),
        opportunities: fc.array(fc.record({
          unrealizedLoss: fc.float({ min: 20, max: 10000 }),
          gasEstimate: fc.float({ min: 0, max: 1000 })
        }))
      }),
      (data) => {
        const results = calculateWithUserSettings(data.opportunities, { taxRate: data.taxRate });
        
        results.forEach(result => {
          const expectedTaxSavings = Math.abs(result.unrealizedLoss) * data.taxRate;
          expect(Math.abs(result.taxSavings - expectedTaxSavings)).toBeLessThan(0.01);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 20: Notification Threshold
**Requirement:** 13, 20
**Property:** Notifications must only be sent when net benefit exceeds user threshold.
```typescript
// Feature: harvestpro, Property 20: Notification Threshold
// Validates: Requirements 13.1, 20.3
test('notifications only sent above threshold', () => {
  fc.assert(
    fc.property(
      fc.record({
        threshold: fc.float({ min: 0, max: 1000 }),
        opportunities: fc.array(fc.record({
          netTaxBenefit: fc.float({ min: -100, max: 2000 })
        }))
      }),
      (data) => {
        const notifications = generateNotifications(data.opportunities, data.threshold);
        
        notifications.forEach(notification => {
          expect(notification.opportunity.netTaxBenefit).toBeGreaterThan(data.threshold);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

### v2 Institutional Properties (21-29)

#### Property 21: Private RPC Routing
**Requirement:** MEV Protection (v2)
**Property:** Private RPC routing must preserve transaction integrity while protecting from MEV.

#### Property 22: Private RPC Recording
**Requirement:** MEV Protection (v2)
**Property:** All private RPC usage must be logged for audit purposes.

#### Property 23: Economic Substance Evaluation
**Requirement:** Economic Substance (v2)
**Property:** Economic substance scoring must be consistent and explainable.

#### Property 24: Economic Substance Blocking
**Requirement:** Economic Substance (v2)
**Property:** Transactions lacking economic substance must be blocked or warned.

#### Property 25: Proxy Asset Recording
**Requirement:** Economic Substance (v2)
**Property:** Proxy asset relationships must be tracked and disclosed.

#### Property 26: Guardrail Enforcement - Daily Loss
**Requirement:** Institutional Guardrails (v2)
**Property:** Daily loss limits must be enforced across all harvest activities.

#### Property 27: Guardrail Enforcement - Position Size
**Requirement:** Institutional Guardrails (v2)
**Property:** Position size limits must be enforced per asset and aggregate.

#### Property 28: Guardrail Enforcement - Slippage
**Requirement:** Institutional Guardrails (v2)
**Property:** Slippage limits must be enforced with circuit breakers.

#### Property 29: Enhanced Proof Payload
**Requirement:** Enhanced Proof (v2)
**Property:** Institutional proof records must include additional compliance data.

### v3 Enterprise Properties (30-37)

#### Property 30: Custody Integration - No Private Keys
**Requirement:** Custody Integration (v3)
**Property:** System must never handle or store private keys.

#### Property 31: Custody Transaction Routing
**Requirement:** Custody Integration (v3)
**Property:** All transactions must route through approved custody providers.

#### Property 32: Approval Threshold Transition
**Requirement:** Multi-Approval (v3)
**Property:** Approval thresholds must trigger appropriate workflow transitions.

#### Property 33: Approval Requirement
**Requirement:** Multi-Approval (v3)
**Property:** High-value transactions must require multiple approvals.

#### Property 34: Sanctions Screening
**Requirement:** KYT/AML (v3)
**Property:** All counterparties must be screened against sanctions lists.

#### Property 35: Sanctioned Route Blocking
**Requirement:** KYT/AML (v3)
**Property:** Transactions involving sanctioned entities must be blocked.

#### Property 36: TWAP Order Slicing
**Requirement:** TWAP Execution (v3)
**Property:** Large orders must be sliced according to TWAP algorithm.

#### Property 37: TWAP Safety Floor
**Requirement:** TWAP Execution (v3)
**Property:** TWAP execution must respect minimum slice sizes and timing.

## Error Handling

### Error Categories

#### 1. User Input Errors (4xx)
- Invalid wallet addresses
- Malformed CEX credentials
- Out-of-range tax rates
- Invalid opportunity selections

**Handling Strategy:**
- Validate at API boundary with Zod schemas
- Return structured error responses
- Provide actionable error messages
- Log for monitoring but not alerting

#### 2. External Service Errors (5xx)
- Price oracle failures
- Guardian API timeouts
- CEX API rate limits
- Blockchain RPC errors

**Handling Strategy:**
- Implement exponential backoff retry
- Use circuit breakers for cascading failures
- Fallback to cached data when appropriate
- Alert on sustained failures

#### 3. Business Logic Errors (4xx)
- Insufficient liquidity for harvest
- Wash sale rule violations
- Risk threshold exceeded
- Data quality too low

**Handling Strategy:**
- Return as structured business errors
- Provide clear explanations and alternatives
- Allow user override with warnings where appropriate
- Log for product analytics

#### 4. System Errors (5xx)
- Database connection failures
- Edge function timeouts
- Encryption/decryption failures
- File generation errors

**Handling Strategy:**
- Implement graceful degradation
- Use health checks and monitoring
- Automatic retry with backoff
- Alert immediately for investigation

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    retryAfterSec?: number;
    userAction?: string;
  };
  timestamp: string;
  requestId: string;
}
```

### Error Codes

```typescript
const ERROR_CODES = {
  // User Input (4xx)
  INVALID_WALLET_ADDRESS: 'INVALID_WALLET_ADDRESS',
  INVALID_TAX_RATE: 'INVALID_TAX_RATE',
  INVALID_OPPORTUNITY_SELECTION: 'INVALID_OPPORTUNITY_SELECTION',
  
  // Business Logic (4xx)
  INSUFFICIENT_LIQUIDITY: 'INSUFFICIENT_LIQUIDITY',
  WASH_SALE_RISK: 'WASH_SALE_RISK',
  RISK_THRESHOLD_EXCEEDED: 'RISK_THRESHOLD_EXCEEDED',
  DATA_QUALITY_LOW: 'DATA_QUALITY_LOW',
  
  // External Services (5xx)
  PRICE_ORACLE_UNAVAILABLE: 'PRICE_ORACLE_UNAVAILABLE',
  GUARDIAN_API_TIMEOUT: 'GUARDIAN_API_TIMEOUT',
  CEX_API_RATE_LIMITED: 'CEX_API_RATE_LIMITED',
  BLOCKCHAIN_RPC_ERROR: 'BLOCKCHAIN_RPC_ERROR',
  
  // System (5xx)
  DATABASE_CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
  EDGE_FUNCTION_TIMEOUT: 'EDGE_FUNCTION_TIMEOUT',
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  FILE_GENERATION_FAILED: 'FILE_GENERATION_FAILED'
} as const;
```

## Testing Strategy

### Property-Based Testing (Primary)

**Library:** fast-check
**Coverage:** All correctness properties (1-37)
**Iterations:** 100 minimum, 1000 for critical tax calculations

**Example Test Structure:**
```typescript
import * as fc from 'fast-check';
import { describe, test } from 'vitest';

describe('Feature: harvestpro, Property X: [description]', () => {
  test('property holds for all valid inputs', () => {
    fc.assert(
      fc.property(
        // Smart generators for valid input space
        fc.record({
          token: fc.constantFrom('ETH', 'BTC', 'USDC'),
          quantity: fc.float({ min: 0.001, max: 1000 }),
          price: fc.float({ min: 0.01, max: 100000 })
        }),
        // Property verification
        (input) => {
          const result = functionUnderTest(input);
          expect(result).toSatisfy(propertyCondition);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing (Complementary)

**Library:** Vitest
**Coverage:** Edge cases, error conditions, integration points

**Test Categories:**
- Specific examples demonstrating correct behavior
- Boundary value testing
- Error condition handling
- Mock integration testing

### Integration Testing

**API Endpoint Testing:**
```typescript
describe('GET /api/harvest/opportunities', () => {
  test('returns opportunities for authenticated user', async () => {
    const response = await fetch('/api/harvest/opportunities', {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.opportunities).toBeInstanceOf(Array);
  });
});
```

**Edge Function Testing:**
```typescript
Deno.test('harvest-recompute-opportunities calculates correctly', async () => {
  const result = await invokeEdgeFunction('harvest-recompute-opportunities', {
    userId: 'test-user-id'
  });
  
  assertEquals(result.success, true);
  assertEquals(result.opportunities.length > 0, true);
});
```

### E2E Testing

**Library:** Playwright
**Coverage:** Critical user flows

**Test Scenarios:**
- Complete harvest flow (demo and live)
- Error recovery scenarios
- Mobile responsiveness
- Accessibility compliance

### Test Organization

```
src/lib/harvestpro/
├── fifo.ts
├── __tests__/
│   ├── fifo.test.ts           # Property tests
│   └── fifo.unit.test.ts      # Unit tests
```

### CI/CD Integration

```yaml
# .github/workflows/harvestpro-test.yml
- name: Run property tests
  run: npm test -- --grep "Property"
  
- name: Run unit tests  
  run: npm test -- --grep "unit"
  
- name: Run integration tests
  run: npm test -- --grep "integration"
```

## Implementation Phases

### Phase 1: Core Foundation (Requirements 0-10)
**Duration:** 4-6 weeks
**Deliverables:**
- Legal disclaimers and Apple-safe UI copy
- Basic opportunity detection and FIFO engine
- Hunter-style dashboard with filtering
- Transaction preparation (no execution)
- Form 8949-compatible CSV export

### Phase 2: Enhanced Features (Requirements 11-20)
**Duration:** 3-4 weeks  
**Deliverables:**
- Proof-of-Activity integrity records
- Risk classification and Guardian integration
- User settings and notifications
- Mobile responsiveness
- Performance optimization

### Phase 3: App Store Compliance (Requirements 21-30)
**Duration:** 2-3 weeks
**Deliverables:**
- Enhanced export format with metadata
- Action Center guardrails
- Data quality transparency
- Wash sale warnings
- Demo mode implementation

### Phase 4: v2 Institutional (Future)
**Deliverables:**
- Economic substance detection
- MEV protection via private RPC
- Enhanced guardrails and compliance

### Phase 5: v3 Enterprise (Future)
**Deliverables:**
- Custody provider integration
- Multi-approval workflows
- KYT/AML screening
- TWAP execution engine

## Security Considerations

### Data Protection
- All CEX credentials encrypted at rest using KMS
- No private keys stored or handled
- PII redacted from logs
- Audit trails for all credential operations

### API Security
- Rate limiting on all endpoints
- Input validation with Zod schemas
- SQL injection prevention via parameterized queries
- CORS configuration for web clients only

### Wallet Security
- WalletConnect v2 for secure connections
- Transaction preparation only (no signing)
- External wallet confirmation required
- Deep link validation for mobile handoffs

### Compliance
- SOC 2 Type II controls for credential handling
- GDPR compliance for EU users
- Audit logs for all financial calculations
- Immutable session records for tax purposes

## Monitoring and Observability

### Key Metrics
- Opportunity detection accuracy
- Calculation performance (P95 < 200ms)
- Export generation success rate
- User engagement and conversion

### Alerting
- Edge function failures
- Database connection issues
- External API degradation
- Unusual error patterns

### Logging
- Structured JSON logs
- Request/response correlation IDs
- Performance timing data
- Business event tracking

This design document provides the foundation for implementing the enhanced HarvestPro system with Apple App Store compliance, legal safety, and Trinity-correct architecture.