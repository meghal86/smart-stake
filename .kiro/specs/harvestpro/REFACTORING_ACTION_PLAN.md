# HarvestPro v1 Refactoring Action Plan

**Date:** November 24, 2025  
**Goal:** Move business logic from `src/lib/harvestpro/` to Supabase Edge Functions  
**Estimated Time:** 5-7 days

---

## Quick Start: Choose Your Approach

### Option 1: Incremental Refactoring (Recommended)
**Best for:** Production systems that need to stay running  
**Time:** 5-7 days  
**Risk:** Low

Start with Phase 1 below, test each Edge Function independently, then gradually migrate.

### Option 2: Big Bang Refactoring
**Best for:** Pre-production or if you can afford downtime  
**Time:** 3-4 days  
**Risk:** Medium

Create all Edge Functions at once, then switch over.

### Option 3: Keep Current + Add Edge Functions
**Best for:** Quick v2/v3 development  
**Time:** 2-3 days  
**Risk:** High (technical debt)

Keep current code, add Edge Functions for new features only. **Not recommended** for long-term.

---

## Recommended: Incremental Refactoring

### Phase 1: Create Edge Function Infrastructure (Day 1)

#### Step 1.1: Set up Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Initialize Supabase (if not already done)
supabase init

# Link to your project
supabase link --project-ref your-project-ref
```

#### Step 1.2: Create Edge Function directory structure
```bash
# Create the base structure
mkdir -p supabase/functions/_shared/harvestpro
mkdir -p supabase/functions/_shared/harvestpro/__tests__
mkdir -p supabase/functions/harvest-sync-wallets
mkdir -p supabase/functions/harvest-sync-cex
mkdir -p supabase/functions/harvest-recompute-opportunities
mkdir -p supabase/functions/harvest-notify
```

#### Step 1.3: Create shared utilities
Create `supabase/functions/_shared/harvestpro/types.ts`:
```typescript
// Copy types from src/types/harvestpro.ts
// This will be the shared type definitions for Edge Functions
```

#### Step 1.4: Set up Deno configuration
Create `supabase/functions/deno.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  },
  "imports": {
    "supabase": "https://esm.sh/@supabase/supabase-js@2"
  }
}
```

**Checkpoint:** Verify directory structure is created correctly.

---

### Phase 2: Move First Edge Function - harvest-recompute-opportunities (Days 2-3)

This is the most critical function. Start here.

#### Step 2.1: Copy business logic files
```bash
# Copy files to shared directory
cp src/lib/harvestpro/fifo.ts supabase/functions/_shared/harvestpro/
cp src/lib/harvestpro/opportunity-detection.ts supabase/functions/_shared/harvestpro/
cp src/lib/harvestpro/eligibility.ts supabase/functions/_shared/harvestpro/
cp src/lib/harvestpro/net-benefit.ts supabase/functions/_shared/harvestpro/
cp src/lib/harvestpro/risk-classification.ts supabase/functions/_shared/harvestpro/
cp src/lib/harvestpro/guardian-adapter.ts supabase/functions/_shared/harvestpro/
cp src/lib/harvestpro/price-oracle.ts supabase/functions/_shared/harvestpro/
cp src/lib/harvestpro/gas-estimation.ts supabase/functions/_shared/harvestpro/
cp src/lib/harvestpro/slippage-estimation.ts supabase/functions/_shared/harvestpro/
cp src/lib/harvestpro/token-tradability.ts supabase/functions/_shared/harvestpro/
cp src/lib/harvestpro/multi-chain-engine.ts supabase/functions/_shared/harvestpro/
```

#### Step 2.2: Convert imports to Deno-compatible
In each copied file, update imports:

**Before:**
```typescript
import { createClient } from '@/lib/supabase/client';
import type { HarvestOpportunity } from '@/types/harvestpro';
```

**After:**
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { HarvestOpportunity } from '../types.ts';
```

#### Step 2.3: Create the Edge Function
Create `supabase/functions/harvest-recompute-opportunities/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { detectOpportunities } from '../_shared/harvestpro/opportunity-detection.ts';
import { filterEligible } from '../_shared/harvestpro/eligibility.ts';
import { calculateNetBenefit } from '../_shared/harvestpro/net-benefit.ts';

serve(async (req) => {
  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { userId } = await req.json();

    // Fetch lots from database
    const { data: lots, error: lotsError } = await supabase
      .from('harvest_lots')
      .select('*')
      .eq('user_id', userId)
      .eq('eligible_for_harvest', true);

    if (lotsError) {
      throw lotsError;
    }

    // Detect opportunities
    const opportunities = await detectOpportunities(lots);

    // Filter eligible
    const eligible = await filterEligible(opportunities);

    // Calculate net benefits
    const withBenefits = await Promise.all(
      eligible.map(opp => calculateNetBenefit(opp))
    );

    // Store in database
    const { error: insertError } = await supabase
      .from('harvest_opportunities')
      .upsert(withBenefits);

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: withBenefits.length 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

#### Step 2.4: Deploy and test
```bash
# Deploy the Edge Function
supabase functions deploy harvest-recompute-opportunities

# Test it
curl -X POST \
  'https://your-project.supabase.co/functions/v1/harvest-recompute-opportunities' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"userId": "test-user-id"}'
```

#### Step 2.5: Update Next.js API route to call Edge Function
Update `src/app/api/harvest/opportunities/route.ts`:

**Before:**
```typescript
// Business logic in API route
const opportunities = detectOpportunities(lots);
```

**After:**
```typescript
// Call Edge Function
const { data, error } = await supabase.functions.invoke(
  'harvest-recompute-opportunities',
  { body: { userId: user.id } }
);
```

**Checkpoint:** Test that opportunities API still works via Edge Function.

---

### Phase 3: Move Property Tests (Day 3)

#### Step 3.1: Copy test files
```bash
# Copy property tests
cp src/lib/harvestpro/__tests__/fifo.test.ts supabase/functions/_shared/harvestpro/__tests__/
cp src/lib/harvestpro/__tests__/net-benefit.test.ts supabase/functions/_shared/harvestpro/__tests__/
cp src/lib/harvestpro/__tests__/eligibility.test.ts supabase/functions/_shared/harvestpro/__tests__/
# ... copy all test files
```

#### Step 3.2: Update test imports for Deno
```typescript
// Update imports to use Deno test framework
import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import fc from 'https://esm.sh/fast-check@3';
```

#### Step 3.3: Run tests in Deno
```bash
# Run tests
deno test supabase/functions/_shared/harvestpro/__tests__/
```

**Checkpoint:** All property tests pass in Deno environment.

---

### Phase 4: Create Remaining Edge Functions (Day 4)

#### Step 4.1: harvest-sync-wallets
Create `supabase/functions/harvest-sync-wallets/index.ts`:
- Copy wallet-connection.ts logic
- Copy fifo.ts logic
- Implement wallet sync endpoint

#### Step 4.2: harvest-sync-cex
Create `supabase/functions/harvest-sync-cex/index.ts`:
- Copy cex-integration.ts logic
- Copy data-aggregation.ts logic
- Implement CEX sync endpoint

#### Step 4.3: harvest-notify
Create `supabase/functions/harvest-notify/index.ts`:
- Implement notification logic
- Set up as scheduled function (cron)

**Checkpoint:** All 4 Edge Functions deployed and tested.

---

### Phase 5: Update API Routes (Day 5)

#### Step 5.1: Fix opportunities API route
Remove business logic from `src/app/api/harvest/opportunities/route.ts`:

**Remove:**
```typescript
function calculateGasEfficiencyGrade(opportunities: HarvestOpportunity[]): GasEfficiencyGrade {
  // ... remove this function
}

const summary = {
  totalHarvestableLoss: items.reduce(...), // remove
  estimatedNetBenefit: items.reduce(...),  // remove
  // ...
};
```

**Replace with:**
```typescript
// Read pre-computed values from database
const { data: summary } = await supabase
  .from('harvest_opportunity_summary')
  .select('*')
  .eq('user_id', userId)
  .single();
```

#### Step 5.2: Create database view for summary
Add migration:
```sql
CREATE VIEW harvest_opportunity_summary AS
SELECT 
  user_id,
  SUM(unrealized_loss) as total_harvestable_loss,
  SUM(net_tax_benefit) as estimated_net_benefit,
  COUNT(DISTINCT token) as eligible_tokens_count,
  CASE 
    WHEN AVG(gas_estimate / unrealized_loss * 100) < 5 THEN 'A'
    WHEN AVG(gas_estimate / unrealized_loss * 100) < 15 THEN 'B'
    ELSE 'C'
  END as gas_efficiency_score
FROM harvest_opportunities
GROUP BY user_id;
```

**Checkpoint:** API routes are thin read layers only.

---

### Phase 6: Clean Up and Test (Day 6)

#### Step 6.1: Remove old files (optional)
```bash
# Move old files to archive (don't delete yet)
mkdir -p archive/src/lib/harvestpro
mv src/lib/harvestpro/*.ts archive/src/lib/harvestpro/
```

#### Step 6.2: Update imports throughout codebase
Search for any remaining imports from `src/lib/harvestpro/` and update them.

#### Step 6.3: Run full test suite
```bash
# Run all tests
npm test

# Run E2E tests
npm run test:e2e

# Test Edge Functions
deno test supabase/functions/_shared/harvestpro/__tests__/
```

#### Step 6.4: Manual testing
- Test complete harvest flow
- Test wallet sync
- Test CEX sync
- Test opportunity detection
- Test execution flow

**Checkpoint:** All tests pass, system works end-to-end.

---

### Phase 7: Documentation and Deployment (Day 7)

#### Step 7.1: Update documentation
- Update README files
- Update API documentation
- Update architecture diagrams

#### Step 7.2: Deploy to production
```bash
# Deploy all Edge Functions
supabase functions deploy harvest-sync-wallets
supabase functions deploy harvest-sync-cex
supabase functions deploy harvest-recompute-opportunities
supabase functions deploy harvest-notify

# Run database migrations
supabase db push
```

#### Step 7.3: Monitor
- Check Edge Function logs
- Monitor error rates
- Verify performance metrics

**Checkpoint:** Production deployment successful.

---

## Quick Commands Reference

```bash
# Create Edge Function
supabase functions new function-name

# Deploy Edge Function
supabase functions deploy function-name

# Test Edge Function locally
supabase functions serve function-name

# View logs
supabase functions logs function-name

# Run Deno tests
deno test supabase/functions/_shared/harvestpro/__tests__/

# Deploy database migrations
supabase db push
```

---

## Troubleshooting

### Issue: Import errors in Edge Functions
**Solution:** Use Deno-compatible imports (https://esm.sh/ or https://deno.land/x/)

### Issue: Tests fail in Deno
**Solution:** Update test framework imports to Deno's testing library

### Issue: Edge Function timeout
**Solution:** Increase timeout in supabase/functions/function-name/index.ts

### Issue: CORS errors
**Solution:** Add CORS headers to Edge Function responses

---

## Next Steps After Refactoring

Once refactoring is complete:

1. ✅ **Verify architecture compliance** - Run validation again
2. ✅ **Update steering files** - Mark v1 as architecturally correct
3. ✅ **Proceed with v2/v3** - Start implementing institutional features
4. ✅ **Set up monitoring** - Track Edge Function performance
5. ✅ **Document lessons learned** - Update best practices

---

## Need Help?

**Ask me to:**
- "Start Phase 1" - I'll create the directory structure
- "Create harvest-recompute-opportunities Edge Function" - I'll write the code
- "Move property tests to Deno" - I'll convert the tests
- "Fix API route violations" - I'll update the API routes
- "Deploy Edge Functions" - I'll guide you through deployment

**Just tell me which phase you want to start with!**

---

**Created:** November 24, 2025  
**Status:** Ready to Execute  
**Estimated Completion:** 5-7 days

