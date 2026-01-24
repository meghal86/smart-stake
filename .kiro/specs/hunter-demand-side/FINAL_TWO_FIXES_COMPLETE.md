# Final Two Fixes Applied - Hunter Demand-Side Spec

## Status: ✅ COMPLETE

All 10 critical fixes have been applied to the Hunter Demand-Side spec. The final two fixes address conflicts identified by the user.

## Fix #9: Property 20 Hybrid Preselection Mismatch

**Problem:** Property 20 stated "top 50 opportunities by trust_score" but this conflicts with the hybrid preselection rule defined in Requirements 11.2-11.3.

**Fix Applied:**
- Updated Property 20 in `design.md` (line 851-856)
- Changed from: "top 50 opportunities by trust_score"
- Changed to: "preselect the top 100 candidates by hybrid score (trust_score * 0.7 + recency_boost * 0.3), then compute eligibility for the top 50 of those preselected candidates"
- Updated validation to reference Requirements 11.2, 11.3 (not just 11.2)

**Why This Matters:**
Selecting top 50 by trust_score alone would miss high-relevance opportunities with lower trust scores. The hybrid preselection ensures we consider both trust AND recency before computing expensive eligibility checks.

## Fix #10: Eligibility Cache TTL Enforcement

**Problem:** The eligibility_cache table doesn't automatically expire old records. The TTL must be enforced via query logic, not table-level auto-expiration.

**Fix Applied:**
- Updated Eligibility Engine "Cache Check" section in `design.md` (line 216)
- Added note: "TTL is enforced via query timestamp check, not automatic table expiration. The table does not auto-delete old records."
- Updated "Cache Store" section (line 254)
- Added note: "Always update `updated_at` timestamp on upsert to track last computation time"
- Updated ON CONFLICT clause to explicitly update `updated_at = NOW()`
- Updated Cost Control section to clarify: "Cache results for 24 hours (enforced via query: `created_at > NOW() - INTERVAL '24 hours'`)"

**Why This Matters:**
Without explicit timestamp updates on upsert, the cache would use stale `created_at` values and never refresh. The query-based TTL approach is standard for PostgreSQL caching patterns.

## Updated Files

1. `.kiro/specs/hunter-demand-side/design.md`
   - Property 20 (lines 851-856)
   - Eligibility Engine Cache Check (line 216)
   - Eligibility Engine Cache Store (line 254)
   - Eligibility Engine Cost Control (line 257-259)

2. `.kiro/specs/hunter-demand-side/CRITICAL_FIXES_APPLIED.md`
   - Added Fix #9 and Fix #10 to summary
   - Updated verification checklist with 2 new items
   - Updated "Next Steps" to reference all 10 fixes

## Verification

To verify these fixes are correct:

```bash
# Check Property 20 matches hybrid preselection
grep -A 3 "Property 20" .kiro/specs/hunter-demand-side/design.md

# Check cache TTL enforcement notes
grep -B 2 -A 2 "TTL is enforced" .kiro/specs/hunter-demand-side/design.md
grep -B 2 -A 2 "Always update.*updated_at" .kiro/specs/hunter-demand-side/design.md
```

## Implementation Guidance

**For Property 20 (Hybrid Preselection):**
```typescript
// Step 1: Preselect top 100 by hybrid score
const now = Date.now();
const candidatesWithScore = opportunities.map(opp => ({
  ...opp,
  hybridScore: (opp.trust_score * 0.7) + (calculateRecencyBoost(opp.created_at, now) * 0.3)
}));
candidatesWithScore.sort((a, b) => b.hybridScore - a.hybridScore);
const top100 = candidatesWithScore.slice(0, 100);

// Step 2: Compute eligibility for top 50 of preselected
const top50 = top100.slice(0, 50);
const eligibilityResults = await Promise.all(
  top50.map(opp => evaluateEligibility(walletSignals, opp))
);
```

**For Eligibility Cache TTL:**
```typescript
// Cache check with TTL
const cached = await db.query(`
  SELECT * FROM eligibility_cache 
  WHERE wallet_address = $1 
    AND opportunity_id = $2 
    AND created_at > NOW() - INTERVAL '24 hours'
`, [walletAddress, opportunityId]);

// Cache store with updated_at
await db.query(`
  INSERT INTO eligibility_cache 
    (wallet_address, opportunity_id, eligibility_status, eligibility_score, reasons, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
  ON CONFLICT (wallet_address, opportunity_id) 
  DO UPDATE SET 
    eligibility_status = EXCLUDED.eligibility_status,
    eligibility_score = EXCLUDED.eligibility_score,
    reasons = EXCLUDED.reasons,
    updated_at = NOW()
`, [walletAddress, opportunityId, status, score, reasons]);
```

## Spec Status

**All 10 critical fixes applied:**
1. ✅ Schema: source_ref (not source_id)
2. ✅ Wallet age: Alchemy Transfers API only
3. ✅ Scoring: Clamp all scores [0, 1]
4. ✅ UI: Minimal changes allowed
5. ✅ API: Single endpoint pattern
6. ✅ Eligibility: Hybrid preselection
7. ✅ Referrals: First completion activation
8. ✅ Strategies: Cached trust + breakdown
9. ✅ Property 20: Hybrid preselection match
10. ✅ Cache TTL: Query-based enforcement

**The spec is now ready for implementation with zero known conflicts.**

## Next Steps

1. Review the updated spec documents
2. Begin implementation starting with Phase 0 (Shared Foundations)
3. Follow the tasks.md file for step-by-step implementation
4. Write property-based tests for all 21 correctness properties
5. Verify each fix during implementation using the verification checklist

---

**Date:** January 23, 2026  
**Status:** Complete  
**Total Fixes:** 10/10
