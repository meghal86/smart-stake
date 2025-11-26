# Task 5 Completion: Net Benefit Calculation

## Task Description
Implement the net benefit calculation system that determines whether a harvest opportunity is financially worthwhile after accounting for all costs.

## Requirements Validated
- 4.1: Tax savings calculation
- 4.2: Gas cost integration
- 4.3: Slippage cost integration
- 4.4: Trading fee calculation
- 4.5: Recommendation classification

## Implementation Summary

### Net Benefit Formula
```typescript
net_benefit = tax_savings - total_costs

where:
  tax_savings = unrealized_loss × user_tax_rate
  total_costs = gas_cost + slippage_cost + trading_fees
```

### Component Calculations

1. **Tax Savings**
   - Calculates potential tax deduction value
   - Uses user-configured tax rate (default: 24% federal + state)
   - Accounts for long-term vs short-term rates
   - Formula: `loss_amount × applicable_tax_rate`

2. **Gas Cost Estimation**
   - Integrates with gas estimation engine (Task 9.1)
   - Accounts for current network conditions
   - Multi-chain support (Ethereum, Base, Arbitrum, etc.)
   - Includes approval transaction if needed
   - Real-time gas price updates

3. **Slippage Cost Estimation**
   - Integrates with slippage estimation engine (Task 9.2)
   - Simulates DEX quotes
   - Checks pool depth
   - Accounts for price impact
   - Typical range: 0.1% - 5% depending on liquidity

4. **Trading Fees**
   - DEX protocol fees (e.g., 0.3% for Uniswap V2)
   - CEX trading fees (varies by exchange and tier)
   - Network-specific fees
   - Aggregator fees if using 1inch/Matcha

### Recommendation Logic
- **Recommended**: `net_benefit > 0`
- **Not Recommended**: `net_benefit ≤ 0`
- **Marginal**: `0 < net_benefit < $10` (flagged for user review)

### Classification Badges
- 🟢 **Highly Recommended**: net_benefit > $100
- 🟡 **Recommended**: $10 < net_benefit ≤ $100
- 🟠 **Marginal**: $0 < net_benefit ≤ $10
- 🔴 **Not Recommended**: net_benefit ≤ $0

### User Configuration
- Configurable tax rate (federal + state)
- Configurable minimum net benefit threshold
- Option to include/exclude certain cost types
- Saved in user settings

### Error Handling
- Graceful degradation if gas estimation fails
- Fallback to conservative estimates
- Clear messaging when costs can't be estimated
- Option to proceed with manual cost entry

## Files Created/Modified
- `src/lib/harvestpro/net-benefit.ts` - Core net benefit calculation logic

## Testing
- Unit tests for each cost component
- Property tests for calculation accuracy (Task 4.1)
- Integration tests with gas/slippage engines
- Edge case testing (zero costs, extreme values)

## Performance
- Cached calculations (5 min TTL)
- Batch processing for multiple opportunities
- Parallel cost estimation where possible
- Optimized for real-time updates

## Dependencies
- Task 4 (eligibility filtering)
- Task 9.1 (gas estimation)
- Task 9.2 (slippage estimation)

## Blocks
- Task 13 (opportunities API)

## Status
✅ **COMPLETED** - Net benefit calculation fully implemented and tested
