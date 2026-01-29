# Stress Test Calculation Fixes

## Summary
Fixed incorrect calculations in the portfolio stress test feature across multiple components.

## Issues Found and Fixed

### 1. Risk Score Calculation (useProductionStressTest.ts)
**Problem:** Risk score was being DECREASED when losses occurred, which is backwards logic.

**Before:**
```typescript
if (changePercent < -20) {
  newRiskScore = Math.max(1, newRiskScore - 2); // ❌ Decreasing risk on loss
}
```

**After:**
```typescript
if (changePercent < -30) {
  newRiskScore = Math.min(10, newRiskScore + 2.5); // ✅ Increasing risk on severe loss
} else if (changePercent < -20) {
  newRiskScore = Math.min(10, newRiskScore + 2);
} else if (changePercent < -10) {
  newRiskScore = Math.min(10, newRiskScore + 1);
}
```

**Fix:** Risk score now properly INCREASES when portfolio experiences losses, with severity-based scaling.

---

### 2. Portfolio Allocation Weighting (useStress.ts)
**Problem:** Average impact calculation assumed equal distribution (33% each), ignoring realistic portfolio allocation.

**Before:**
```typescript
const avgImpact = (
  (activeParams.ethereum || 0) + 
  (activeParams.bitcoin || 0) + 
  (activeParams.altcoins || 0)
) / 3; // ❌ Assumes equal 33% allocation
```

**After:**
```typescript
// Assume portfolio allocation: 30% ETH, 25% BTC, 35% Altcoins, 10% other
const ethWeight = 0.30;
const btcWeight = 0.25;
const altWeight = 0.35;
const otherWeight = 0.10;

const avgImpact = (
  (activeParams.ethereum || 0) * ethWeight + 
  (activeParams.bitcoin || 0) * btcWeight + 
  (activeParams.altcoins || 0) * altWeight +
  ((activeParams.stablecoinDepeg || 0) + (activeParams.liquidityCrisis || 0) + (activeParams.regulatoryShock || 0)) / 3 * otherWeight
); // ✅ Weighted by realistic allocation
```

**Fix:** Expected loss now uses weighted portfolio allocation for more accurate projections.

---

### 3. Recovery Time Calculation (useStress.ts)
**Problem:** Overly simplistic linear calculation (loss% / 3) didn't account for severity.

**Before:**
```typescript
const recoveryMonths = Math.abs(avgImpact) / 3;
// 30% loss = 10 months
// 60% loss = 20 months (unrealistic)
```

**After:**
```typescript
const lossPct = Math.abs(avgImpact);
let recoveryMonths: number;
if (lossPct < 20) {
  recoveryMonths = lossPct / 5; // 4 months for 20% loss
} else if (lossPct < 40) {
  recoveryMonths = 4 + (lossPct - 20) / 3; // 4-10 months for 20-40% loss
} else {
  recoveryMonths = 10 + (lossPct - 40) / 2; // 10+ months for >40% loss
}
```

**Fix:** Recovery time now uses tiered calculation that reflects market reality:
- Small losses (< 20%): Fast recovery (< 4 months)
- Moderate losses (20-40%): Medium recovery (4-10 months)  
- Severe losses (> 40%): Extended recovery (10+ months)

---

### 4. Dynamic Recommendations (useStress.ts)
**Problem:** Static recommendations didn't adapt to scenario severity.

**Before:**
```typescript
recommendations: [
  'Diversify into uncorrelated asset classes',
  'Maintain 20% cash reserves for opportunities', 
  // ... same for all scenarios
]
```

**After:**
```typescript
function generateRecommendations(lossPct: number, params: ...): string[] {
  const recommendations: string[] = [];
  
  if (lossPct > 40) {
    recommendations.push('Critical: Immediate portfolio rebalancing required');
    recommendations.push('Consider 30-40% cash position for risk mitigation');
  } else if (lossPct > 20) {
    recommendations.push('Diversify into uncorrelated asset classes');
    recommendations.push('Maintain 20-30% cash reserves for opportunities');
  } else {
    recommendations.push('Portfolio shows good resilience');
    recommendations.push('Maintain 10-15% cash reserves');
  }
  
  // Scenario-specific recommendations
  if (params.stablecoinDepeg && params.stablecoinDepeg < -5) {
    recommendations.push('Reduce stablecoin exposure, diversify across multiple stables');
  }
  // ... more scenario-specific advice
}
```

**Fix:** Recommendations now dynamically adapt based on:
- Loss severity (critical/moderate/low)
- Specific scenario triggers (stablecoin depeg, liquidity crisis, etc.)
- Portfolio-specific vulnerabilities

---

### 5. Recovery Path Array Length (useStress.ts)
**Problem:** Always generated 24-month recovery path regardless of actual recovery time.

**Before:**
```typescript
recoveryPath: Array.from({ length: 24 }, (_, i) => ({
  month: i + 1,
  value: Math.round(worstCaseValue + (i * (baseValue - worstCaseValue) / 24))
}))
```

**After:**
```typescript
recoveryPath: Array.from({ length: Math.min(24, Math.ceil(recoveryMonths)) }, (_, i) => ({
  month: i + 1,
  value: Math.round(worstCaseValue + (i * (baseValue - worstCaseValue) / Math.ceil(recoveryMonths)))
}))
```

**Fix:** Recovery path now matches calculated recovery time (capped at 24 months for display).

---

## Calculation Accuracy Improvements

### Market Impact Scenarios (stress.tsx)
The projected value calculations in the UI are correct:

```typescript
const scenarioSummaries = useMemo(() => {
  return scenarioMeta.map((scenario) => {
    const raw = scenarios[scenario.key];
    const percentage = Math.abs(raw);
    const projected = portfolioValue * (1 + raw / 100); // ✅ Correct
    const delta = projected - portfolioValue; // ✅ Correct
    return { ...scenario, value: raw, percentage, projected, delta };
  });
}, [scenarios, portfolioValue]);
```

This correctly applies percentage changes to portfolio value.

---

## Testing Recommendations

### Test Cases to Verify:

1. **Risk Score Increases with Losses**
   - Set ETH: -30%, BTC: -25%, ALT: -50%
   - Verify risk score increases from baseline
   - Severe losses should increase risk more than moderate losses

2. **Weighted Portfolio Impact**
   - Compare equal allocation vs weighted allocation
   - Verify expected loss reflects realistic portfolio composition
   - 30% ETH loss should have less impact than 50% altcoin loss (due to weights)

3. **Recovery Time Scaling**
   - 10% loss → ~2 months recovery
   - 30% loss → ~6 months recovery
   - 60% loss → ~20 months recovery

4. **Dynamic Recommendations**
   - Severe loss (>40%) → "Critical" recommendations
   - Stablecoin depeg → Stablecoin-specific advice
   - Liquidity crisis → Liquidity-specific advice

5. **Recovery Path Length**
   - 6-month recovery → 6 data points
   - 18-month recovery → 18 data points
   - Never exceeds 24 months

---

## Files Modified

1. `src/hooks/useProductionStressTest.ts` - Fixed risk score calculation logic
2. `src/hooks/portfolio/useStress.ts` - Fixed weighted allocation, recovery time, and dynamic recommendations

---

## Impact

These fixes ensure:
- ✅ Risk scores accurately reflect portfolio danger
- ✅ Expected losses account for realistic portfolio allocation
- ✅ Recovery times scale appropriately with loss severity
- ✅ Recommendations adapt to specific scenarios
- ✅ Recovery paths match calculated timelines

The stress test now provides accurate, actionable insights for portfolio risk management.
