# Task 3 Completion: Harvest Opportunity Detection

## Task Description
Implement the opportunity detection system that evaluates FIFO lots to identify tax-loss harvesting opportunities.

## Requirements Validated
- 2.2: Unrealized PnL calculation
- 2.3: Holding period calculation
- 2.4: Long-term vs short-term classification

## Implementation Summary

### Core Detection Logic
Implemented comprehensive lot evaluation system:
- Calculates unrealized PnL for each open lot
- Determines holding period from acquisition date
- Classifies as long-term (>365 days) or short-term (≤365 days)
- Identifies loss positions (negative PnL)
- Ranks opportunities by potential tax benefit

### Opportunity Scoring
Each opportunity includes:
- **Unrealized Loss Amount**: Absolute dollar value of loss
- **Holding Period**: Days held since acquisition
- **Tax Classification**: Long-term or short-term
- **Token Information**: Symbol, chain, quantity
- **Cost Basis**: Original purchase price
- **Current Price**: Real-time market price
- **Potential Tax Savings**: Estimated based on tax rate

### Holding Period Calculation
- Precise day counting from acquisition timestamp
- Handles timezone considerations
- Accounts for leap years
- Uses acquisition date, not settlement date

### Classification Rules
- **Long-term**: Held > 365 days (preferential tax treatment)
- **Short-term**: Held ≤ 365 days (ordinary income rates)
- Accurate to the day for tax compliance

### Filtering Logic
- Only includes lots with unrealized losses
- Excludes zero-quantity lots
- Excludes lots below minimum threshold
- Sorts by tax benefit potential

## Files Created/Modified
- `src/lib/harvestpro/opportunity-detection.ts` - Core detection engine

## Testing
- Unit tests for holding period calculation
- Unit tests for tax classification
- Unit tests for PnL calculation
- Integration tests with FIFO engine
- Property tests for calculation accuracy (Task 2.1)

## Performance
- Efficient batch processing of lots
- O(n) complexity for n lots
- Caching of current prices
- Optimized for large portfolios

## Dependencies
- Task 2 (FIFO engine)

## Blocks
- Task 4 (eligibility filtering)
- Task 13 (opportunities API)

## Status
✅ **COMPLETED** - Opportunity detection fully implemented and tested
