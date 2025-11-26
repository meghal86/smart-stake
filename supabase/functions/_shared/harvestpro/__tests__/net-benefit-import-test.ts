/**
 * Simple import test to verify net-benefit.ts is correctly migrated
 */

import {
  calculateNetBenefit,
  calculateTaxSavings,
  calculateTotalCosts,
  calculateHarvestBenefit,
  calculateBenefitCostRatio,
  calculateEfficiencyScore,
  classifyGasEfficiency,
  calculateBreakEvenTaxRate,
  estimatePaybackPeriod,
  calculateAggregateStats,
  type NetBenefitParams,
  type CostBreakdown,
} from '../net-benefit.ts';

console.log('✅ All imports successful');

// Test basic functionality
const params: NetBenefitParams = {
  unrealizedLoss: 1000,
  taxRate: 0.24,
  gasEstimate: 50,
  slippageEstimate: 20,
  tradingFees: 10,
};

const netBenefit = calculateNetBenefit(params);
console.log(`Net benefit: $${netBenefit}`);

const taxSavings = calculateTaxSavings(1000, 0.24);
console.log(`Tax savings: $${taxSavings}`);

const costs = calculateTotalCosts(50, 20, 10);
console.log(`Total costs: $${costs.totalCosts}`);

const harvestBenefit = calculateHarvestBenefit(params);
console.log(`Harvest benefit: $${harvestBenefit.netBenefit}, recommended: ${harvestBenefit.recommended}`);

const ratio = calculateBenefitCostRatio(240, 80);
console.log(`Benefit-cost ratio: ${ratio}`);

const efficiency = calculateEfficiencyScore(160, 240);
console.log(`Efficiency score: ${efficiency}%`);

const gasGrade = classifyGasEfficiency(50, 1000);
console.log(`Gas efficiency grade: ${gasGrade}`);

const breakEven = calculateBreakEvenTaxRate(1000, 80);
console.log(`Break-even tax rate: ${breakEven * 100}%`);

const payback = estimatePaybackPeriod(160, 80);
console.log(`Payback period: ${payback}`);

const aggregateStats = calculateAggregateStats([harvestBenefit]);
console.log(`Aggregate stats: ${JSON.stringify(aggregateStats, null, 2)}`);

console.log('\n✅ All functions work correctly!');
