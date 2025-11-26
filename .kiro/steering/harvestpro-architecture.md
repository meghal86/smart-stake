# HarvestPro System Architecture Rules

## CRITICAL: The Golden Rule - UI is Presentation Only

**NEVER write business logic, tax calculations, or complex data transformation in React/Next.js components.**

### UI Responsibilities (ALLOWED)
- Fetch data via API calls
- Display data in components
- Capture user input
- Trigger API calls
- Handle user interactions and navigation
- Manage local UI state (filters, modals, loading states)

### Forbidden in UI (NEVER DO THIS)
- ❌ `useEffect` with complex math or financial calculations
- ❌ `reduce` functions calculating tax benefits, PnL, or financial totals
- ❌ Filtering arrays > 100 items in components
- ❌ FIFO cost basis calculations
- ❌ Eligibility filtering logic
- ❌ Net benefit calculations
- ❌ Risk classification logic
- ❌ Guardian score integration
- ❌ Economic substance validation
- ❌ Guardrail enforcement
- ❌ Any tax-related calculations

## Backend: Supabase Edge Functions

**ALL business logic MUST reside in `./supabase/functions`**

### Edge Function Responsibilities
- FIFO cost basis engine
- PnL calculation engine
- Harvest opportunity detection
- Eligibility filtering
- Net benefit calculation
- Risk classification
- Economic substance validation
- Guardrail enforcement
- MEV protection logic
- Sanctions screening
- TWAP execution logic

### Edge Functions Required for HarvestPro

**v1 Core:**
- `harvest-sync-wallets` - Fetch on-chain tx history, rebuild harvest_lots
- `harvest-sync-cex` - Call CEX APIs, update cex_trades and harvest_lots
- `harvest-recompute-opportunities` - Heavy optimization: compute PnL, eligibility, net benefit
- `harvest-notify` - Scan opportunities, send notifications (scheduled)

**v2 Institutional:**
- `harvest-economic-substance` - Detect patterns, compute economic substance score
- `harvest-mev-protection` - Private RPC routing logic

**v3 Enterprise:**
- `harvest-kyt-screen` - Call TRM/Chainalysis for sanctions screening
- `webhook-fireblocks` - Handle custody provider webhooks
- `webhook-copper` - Handle custody provider webhooks
- `harvest-twap-worker` - Execute TWAP slicing (scheduled)

## Data Flow Architecture

### Read / Normal Flows
```
UI Component
  ↓ (user action)
Next.js API Route (thin layer: auth, schema validation)
  ↓
Supabase DB (read with RLS)
  ↓
Next.js API Route (wraps in { data, ts })
  ↓
UI Component (display)
```

### Heavy Compute / Execution Flows
```
UI Component
  ↓ (user action)
Next.js API Route (e.g. /api/harvest/sessions/:id/execute)
  ↓
Supabase Edge Function (harvest-*)
  ↓
Supabase DB (update sessions, steps, logs)
  ↓
Next.js API Route (returns status)
  ↓
UI Component (progress / success)
```

**Rule:** UI SHOULD normally call Edge Functions indirectly via Next.js API routes. Direct `supabase.functions.invoke` from UI is reserved for explicit "sync/long-running job" buttons where you want to show real-time progress.

### Next.js API Routes (Thin Layer Only)

Next.js API routes should ONLY:
- Read from database (simple queries with filters/pagination)
- Validate auth/RLS
- Return JSON responses
- Orchestrate calls to Edge Functions
- Handle file downloads (CSV, PDF)

**Example of CORRECT Next.js API Route:**
```typescript
// app/api/harvest/opportunities/route.ts
export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  
  // Simple read with filters - NO BUSINESS LOGIC
  const { data, error } = await supabase
    .from('harvest_opportunities')
    .select('*')
    .eq('user_id', userId)
    .order('net_tax_benefit', { ascending: false })
    .limit(50);
  
  if (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to load opportunities',
        },
      },
      { status: 500 },
    );
  }
  
  return NextResponse.json({
    data,
    ts: new Date().toISOString(),
  });
}
```

**Example of WRONG Next.js API Route:**
```typescript
// ❌ NEVER DO THIS
export async function GET(req: NextRequest) {
  const lots = await getLots();
  
  // ❌ Business logic in API route!
  const opportunities = lots
    .filter(lot => lot.unrealizedPnl < -20)
    .map(lot => ({
      ...lot,
      netBenefit: (lot.unrealizedPnl * taxRate) - gasEstimate // ❌ Tax calculation!
    }));
  
  return NextResponse.json({ items: opportunities });
}
```

## Database Access Rules

### Direct DB Writes (Forbidden for Complex Tables)
Do NOT use Supabase Client for direct writes on:
- `harvest_sessions` (use Edge Function)
- `harvest_opportunities` (use Edge Function)
- `execution_steps` (use Edge Function)
- `approval_requests` (use Edge Function)

### Direct DB Writes (Allowed for Simple Tables)
You MAY use Supabase Client for:
- `harvest_user_settings` (simple CRUD)
- User preferences
- UI state

## When to Use Edge Functions vs Next.js API Routes

| Scenario | Use Edge Function | Use Next.js API Route |
|----------|-------------------|----------------------|
| Calculate FIFO cost basis | ✅ Yes | ❌ No |
| Compute net tax benefit | ✅ Yes | ❌ No |
| Filter opportunities by eligibility | ✅ Yes | ❌ No |
| Read opportunities with pagination | ❌ No | ✅ Yes |
| Update user tax rate setting | ❌ No | ✅ Yes |
| Generate CSV export | ❌ No | ✅ Yes (light formatting) |
| Validate economic substance | ✅ Yes | ❌ No |
| Check institutional guardrails | ✅ Yes | ❌ No |
| Screen for sanctions | ✅ Yes | ❌ No |
| Execute TWAP slicing | ✅ Yes | ❌ No |

## Enforcement

If you find yourself writing any of the following in a React component or Next.js API route:
- Tax rate multiplication
- FIFO lot selection
- Eligibility checks (Guardian score, liquidity, gas cost)
- Economic substance pattern detection
- Guardrail limit checking

**STOP IMMEDIATELY** and move that logic to an Edge Function.

## Why This Matters

1. **Tax Compliance**: Tax calculations must be deterministic and auditable
2. **Security**: Business logic in UI can be manipulated by users
3. **Performance**: Heavy calculations should run server-side
4. **Maintainability**: Single source of truth for business logic
5. **Testing**: Edge Functions are easier to test with property-based tests
6. **Future OaaS**: Positions system for Opportunities-as-a-Service model

## Summary

**UI = Presentation Only**
**Edge Functions = All Business Logic**
**Next.js API Routes = Thin Read Layer + Orchestration**

This is non-negotiable for HarvestPro.
