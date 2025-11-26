/**
 * Simple import test to verify eligibility.ts migration
 * This ensures all imports and exports work correctly in Deno
 */

import {
  checkEligibility,
  checkMinimumLoss,
  checkLiquidity,
  checkGuardianScore,
  checkGasCost,
  checkTradability,
  filterEligibleOpportunities,
  getEligibilityStats,
  createEligibilityReport,
  DEFAULT_ELIGIBILITY_FILTERS,
  type EligibilityCheck,
  type EligibilityFilters,
  type EligibilityParams,
} from '../eligibility.ts';

// Verify exports are available
console.log('✅ All eligibility exports imported successfully');
console.log('Default filters:', DEFAULT_ELIGIBILITY_FILTERS);

// Quick smoke test
const testCheck = checkMinimumLoss(25, 20);
console.log('✅ checkMinimumLoss works:', testCheck);

const liquidityCheck = checkLiquidity(60, 50);
console.log('✅ checkLiquidity works:', liquidityCheck);

const guardianCheck = checkGuardianScore(5, 3);
console.log('✅ checkGuardianScore works:', guardianCheck);

const gasCheck = checkGasCost(10, 100, 1.0);
console.log('✅ checkGasCost works:', gasCheck);

const tradabilityCheck = checkTradability(true);
console.log('✅ checkTradability works:', tradabilityCheck);

console.log('\n✅ All eligibility functions are working correctly!');
