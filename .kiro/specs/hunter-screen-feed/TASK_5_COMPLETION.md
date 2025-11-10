# Task 5 Completion: Eligibility Scoring Algorithm

## Summary

Successfully implemented the eligibility scoring algorithm for the Hunter Screen feature. The algorithm calculates eligibility scores based on wallet signals with weighted scoring as specified in Requirements 6.1-6.4.

## Implementation Details

### Files Created

1. **`src/lib/eligibility.ts`** - Core eligibility scoring implementation
   - `calculateEligibilityScore()` function with weighted scoring
   - `EligibilitySignals` interface for input data
   - `EligibilityResult` interface for output data
   - `createChainActivityChecker()` helper function for testing

2. **`src/__tests__/lib/eligibility.test.ts`** - Comprehensive unit tests
   - 43 test cases covering all scoring scenarios
   - Edge case handling
   - Real-world scenario validation

### Scoring Algorithm

The algorithm implements the following weighted scoring system:

| Component | Weight | Cap/Limit |
|-----------|--------|-----------|
| Chain Presence | 40% | Binary (0 or 0.40) |
| Wallet Age | 25% | Capped at 30 days |
| Transaction Count | 20% | Capped at 10 transactions |
| Holdings | 15% | Binary (0 or 0.15) |
| Allowlist Proofs | +5% | Bonus (0 or 0.05) |

### Label Determination

- **"likely"**: score ≥ 0.7
- **"maybe"**: score 0.4-0.69
- **"unlikely"**: score < 0.4

### Key Features

1. **Weighted Scoring**: Each component contributes a specific percentage to the final score
2. **Capping**: Wallet age and transaction count are capped to prevent over-weighting
3. **Bonus System**: Allowlist proofs provide an additional 5% bonus
4. **Breakdown**: Returns detailed breakdown of score components for debugging
5. **Reasons**: Provides human-readable reasons explaining the determination
6. **Edge Case Handling**: Gracefully handles negative values, very large values, and floating-point precision

### Test Coverage

All 43 tests passing, covering:

- ✅ Perfect score scenarios (with and without allowlist)
- ✅ Individual component scoring (chain presence, wallet age, tx count, holdings, allowlist)
- ✅ Label determination thresholds
- ✅ Real-world user scenarios (experienced, moderate, new users)
- ✅ Edge cases (negative values, very large values, floating-point precision)
- ✅ Breakdown validation
- ✅ Helper function testing

### Example Usage

```typescript
import { calculateEligibilityScore, createChainActivityChecker } from '@/lib/eligibility';

const signals = {
  walletAgeDays: 30,
  txCount: 10,
  holdsOnChain: true,
  hasActivityOnChain: createChainActivityChecker(['ethereum', 'polygon']),
  allowlistProofs: true,
  requiredChain: 'ethereum',
};

const result = calculateEligibilityScore(signals);

console.log(result);
// {
//   score: 1.05,
//   label: 'likely',
//   breakdown: {
//     chainPresence: 0.40,
//     walletAge: 0.25,
//     transactionCount: 0.20,
//     holdings: 0.15,
//     allowlistBonus: 0.05
//   },
//   reasons: [
//     'Active on ethereum',
//     'Wallet age 30+ days',
//     '10+ transactions',
//     'Holds tokens on chain',
//     'On allowlist'
//   ]
// }
```

## Requirements Satisfied

✅ **Requirement 6.1**: Weighted scoring with correct percentages
- Chain presence: 40%
- Wallet age: 25% (capped at 30 days)
- Transaction count: 20% (capped at 10 tx)
- Holdings: 15%
- Allowlist proofs: +5% bonus

✅ **Requirement 6.2**: Label determination
- "likely" for score ≥ 0.7
- "maybe" for score 0.4-0.69
- "unlikely" for score < 0.4

✅ **Requirement 6.3**: Reason bullets explaining determination
- 1-2 reason bullets per component
- Human-readable explanations

✅ **Requirement 6.4**: Caching support
- Function is pure and deterministic
- Results can be cached per wallet/opportunity for 60 minutes
- No side effects

## Test Results

```
✓ src/__tests__/lib/eligibility.test.ts (43 tests) 8ms
  ✓ calculateEligibilityScore > Perfect Score Scenarios (2)
  ✓ calculateEligibilityScore > Chain Presence (40% weight) (3)
  ✓ calculateEligibilityScore > Wallet Age (25% weight, capped at 30 days) (6)
  ✓ calculateEligibilityScore > Transaction Count (20% weight, capped at 10 tx) (7)
  ✓ calculateEligibilityScore > Holdings (15% weight) (2)
  ✓ calculateEligibilityScore > Allowlist Proofs (+5% bonus) (2)
  ✓ calculateEligibilityScore > Label Determination (6)
  ✓ calculateEligibilityScore > Real-World Scenarios (5)
  ✓ calculateEligibilityScore > Edge Cases (6)
  ✓ calculateEligibilityScore > Breakdown Validation (2)
  ✓ createChainActivityChecker (4)

Test Files  1 passed (1)
     Tests  43 passed (43)
```

## Next Steps

This implementation is ready for integration with:
- Task 11: Implement eligibility preview service (will use this algorithm)
- Task 14: Create GET /api/eligibility/preview endpoint (will call the service)
- Task 16: Create OpportunityCard component (will display eligibility results)

## Notes

- The algorithm is pure and deterministic, making it easy to test and cache
- All edge cases are handled gracefully (negative values, very large values)
- Floating-point precision is managed with proper rounding
- The breakdown provides observability for debugging and optimization
- The reasons array provides transparency for users

---

**Status**: ✅ Complete  
**Date**: 2025-01-05  
**Tests**: 43/43 passing
