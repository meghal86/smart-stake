/**
 * Net Benefit Property-Based Tests for HarvestPro (Deno)
 * 
 * Feature: harvestpro, Property 6: Net Benefit Calculation Accuracy
 * Validates: Requirements 4.1-4.4
 * 
 * Mathematical Properties Tested:
 * 1. Formula Correctness: NetBenefit = (Loss × TaxRate) - GasCost - SlippageCost - TradingFees
 * 2. Monotonicity: Higher losses → higher benefits (all else equal)
 * 3. Tax Rate Sensitivity: Higher tax rates → higher benefits
 * 4. Cost Impact: Higher costs → lower benefits
 * 5. Boundary Conditions: Edge cases and limits
 */

import { assertEquals, assert } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { calculateNetBenefit, calculateHarvestBenefit, type NetBenefitParams } from '../net-benefit.ts';
import { createGenerators, property } from './property-test-framework.ts';

// ============================================================================
// PROPERTY 6: NET BENEFIT CALCULATION ACCURACY
// ============================================================================

Deno.test('Property 6.1: Net benefit formula correctness', async () => {
  const generators = createGenerators(11111);

  await property(
    () => {
      return {
        unrealizedLoss: generators.random.float(0.01, 50000), // $0.01 to $50k loss
        taxRate: generators.random.float(0.1, 0.5), // 10% to 50% tax rate
        gasEstimate: generators.random.float(1, 500), // $1 to $500 gas
        slippageEstimate: generators.random.float(0, 200), // $0 to $200 slippage
        tradingFees: generators.random.float(0, 100), // $0 to $100 fees
      };
    },
    ({ unrealizedLoss, taxRate, gasEstimate, slippageEstimate, tradingFees }) => {
      try {
        const params: NetBenefitParams = {
          unrealizedLoss,
          taxRate,
          gasEstimate,
          slippageEstimate,
          tradingFees,
        };

        const result = calculateNetBenefit(params);
        
        // Property: NetBenefit = (Loss × TaxRate) - GasCost - SlippageCost - TradingFees
        const expectedNetBenefit = (unrealizedLoss * taxRate) - gasEstimate - slippageEstimate - tradingFees;
        const tolerance = 0.01; // 1 cent tolerance for floating point
        
        if (Math.abs(result - expectedNetBenefit) > tolerance) {
          console.log('Formula violation:', {
            unrealizedLoss,
            taxRate,
            gasEstimate,
            slippageEstimate,
            tradingFees,
            expected: expectedNetBenefit,
            actual: result,
            difference: Math.abs(result - expectedNetBenefit),
          });
          return false;
        }
        
        return true;
      } catch (error) {
        console.log('Net benefit calculation failed:', error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    'Net benefit must follow formula: (Loss × TaxRate) - GasCost - SlippageCost - TradingFees',
    { numRuns: 300 }
  );
});

Deno.test('Property 6.2: Loss monotonicity - higher losses yield higher benefits', async () => {
  const generators = createGenerators(22222);

  await property(
    () => {
      const baseLoss = generators.random.float(100, 5000);
      const taxRate = generators.random.float(0.15, 0.4);
      const gasEstimate = generators.random.float(10, 100);
      const slippageEstimate = generators.random.float(0, 50);
      const tradingFees = generators.random.float(0, 30);
      
      return {
        lowerLoss: baseLoss,
        higherLoss: baseLoss + generators.random.float(100, 2000), // Always higher
        taxRate,
        gasEstimate,
        slippageEstimate,
        tradingFees,
      };
    },
    ({ lowerLoss, higherLoss, taxRate, gasEstimate, slippageEstimate, tradingFees }) => {
      try {
        const lowerParams: NetBenefitParams = {
          unrealizedLoss: lowerLoss,
          taxRate,
          gasEstimate,
          slippageEstimate,
          tradingFees,
        };
        
        const higherParams: NetBenefitParams = {
          unrealizedLoss: higherLoss,
          taxRate,
          gasEstimate,
          slippageEstimate,
          tradingFees,
        };
        
        const lowerResult = calculateNetBenefit(lowerParams);
        const higherResult = calculateNetBenefit(higherParams);
        
        // Property: Higher loss should yield higher net benefit (monotonicity)
        if (higherResult <= lowerResult) {
          console.log('Monotonicity violation:', {
            lowerLoss,
            higherLoss,
            lowerBenefit: lowerResult,
            higherBenefit: higherResult,
          });
          return false;
        }
        
        return true;
      } catch (error) {
        console.log('Monotonicity test failed:', error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    'Higher losses must yield higher net benefits (all else equal)',
    { numRuns: 200 }
  );
});

Deno.test('Property 6.3: Tax rate sensitivity', async () => {
  const generators = createGenerators(33333);

  await property(
    () => {
      const loss = generators.random.float(1000, 10000);
      const lowerTaxRate = generators.random.float(0.1, 0.25);
      const higherTaxRate = lowerTaxRate + generators.random.float(0.05, 0.2);
      const gasEstimate = generators.random.float(20, 150);
      const slippageEstimate = generators.random.float(0, 100);
      const tradingFees = generators.random.float(0, 50);
      
      return {
        loss,
        lowerTaxRate,
        higherTaxRate: Math.min(higherTaxRate, 0.5), // Cap at 50%
        gasEstimate,
        slippageEstimate,
        tradingFees,
      };
    },
    ({ loss, lowerTaxRate, higherTaxRate, gasEstimate, slippageEstimate, tradingFees }) => {
      try {
        const lowerTaxParams: NetBenefitParams = {
          unrealizedLoss: loss,
          taxRate: lowerTaxRate,
          gasEstimate,
          slippageEstimate,
          tradingFees,
        };
        
        const higherTaxParams: NetBenefitParams = {
          unrealizedLoss: loss,
          taxRate: higherTaxRate,
          gasEstimate,
          slippageEstimate,
          tradingFees,
        };
        
        const lowerResult = calculateNetBenefit(lowerTaxParams);
        const higherResult = calculateNetBenefit(higherTaxParams);
        
        // Property: Higher tax rate should yield higher net benefit
        if (higherResult <= lowerResult) {
          console.log('Tax rate sensitivity violation:', {
            loss,
            lowerTaxRate,
            higherTaxRate,
            lowerBenefit: lowerResult,
            higherBenefit: higherResult,
          });
          return false;
        }
        
        return true;
      } catch (error) {
        console.log('Tax rate sensitivity test failed:', error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    'Higher tax rates must yield higher net benefits (all else equal)',
    { numRuns: 200 }
  );
});

Deno.test('Property 6.4: Cost impact on net benefit', async () => {
  const generators = createGenerators(44444);

  await property(
    () => {
      const loss = generators.random.float(2000, 15000);
      const taxRate = generators.random.float(0.2, 0.4);
      const baseGasEstimate = generators.random.float(20, 100);
      const baseSlippageEstimate = generators.random.float(10, 80);
      const baseTradingFees = generators.random.float(5, 40);
      
      return {
        loss,
        taxRate,
        lowerGasEstimate: baseGasEstimate,
        higherGasEstimate: baseGasEstimate + generators.random.float(50, 200),
        lowerSlippageEstimate: baseSlippageEstimate,
        higherSlippageEstimate: baseSlippageEstimate + generators.random.float(20, 100),
        lowerTradingFees: baseTradingFees,
        higherTradingFees: baseTradingFees + generators.random.float(10, 50),
      };
    },
    ({ loss, taxRate, lowerGasEstimate, higherGasEstimate, lowerSlippageEstimate, higherSlippageEstimate, lowerTradingFees, higherTradingFees }) => {
      try {
        const lowerCostParams: NetBenefitParams = {
          unrealizedLoss: loss,
          taxRate,
          gasEstimate: lowerGasEstimate,
          slippageEstimate: lowerSlippageEstimate,
          tradingFees: lowerTradingFees,
        };
        
        const higherCostParams: NetBenefitParams = {
          unrealizedLoss: loss,
          taxRate,
          gasEstimate: higherGasEstimate,
          slippageEstimate: higherSlippageEstimate,
          tradingFees: higherTradingFees,
        };
        
        const lowerResult = calculateNetBenefit(lowerCostParams);
        const higherResult = calculateNetBenefit(higherCostParams);
        
        // Property: Higher costs should yield lower net benefit
        if (higherResult >= lowerResult) {
          console.log('Cost impact violation:', {
            loss,
            taxRate,
            lowerCosts: { gas: lowerGasEstimate, slippage: lowerSlippageEstimate, fees: lowerTradingFees },
            higherCosts: { gas: higherGasEstimate, slippage: higherSlippageEstimate, fees: higherTradingFees },
            lowerBenefit: lowerResult,
            higherBenefit: higherResult,
          });
          return false;
        }
        
        return true;
      } catch (error) {
        console.log('Cost impact test failed:', error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    'Higher costs must yield lower net benefits (all else equal)',
    { numRuns: 200 }
  );
});

Deno.test('Property 6.5: Boundary conditions and edge cases', async () => {
  const generators = createGenerators(55555);

  await property(
    () => {
      // Generate edge cases
      const edgeCase = generators.random.int(0, 4);
      
      switch (edgeCase) {
        case 0: // Zero loss
          return {
            unrealizedLoss: 0,
            taxRate: generators.random.float(0.1, 0.5),
            gasEstimate: generators.random.float(10, 100),
            slippageEstimate: generators.random.float(0, 50),
            tradingFees: generators.random.float(0, 30),
          };
        case 1: // Very small loss
          return {
            unrealizedLoss: generators.random.float(0.01, 1),
            taxRate: generators.random.float(0.1, 0.5),
            gasEstimate: generators.random.float(10, 100),
            slippageEstimate: generators.random.float(0, 50),
            tradingFees: generators.random.float(0, 30),
          };
        case 2: // Zero costs
          return {
            unrealizedLoss: generators.random.float(100, 5000),
            taxRate: generators.random.float(0.1, 0.5),
            gasEstimate: 0,
            slippageEstimate: 0,
            tradingFees: 0,
          };
        case 3: // Very high costs
          return {
            unrealizedLoss: generators.random.float(100, 1000),
            taxRate: generators.random.float(0.1, 0.3),
            gasEstimate: generators.random.float(500, 2000),
            slippageEstimate: generators.random.float(100, 500),
            tradingFees: generators.random.float(50, 200),
          };
        default: // Minimum tax rate
          return {
            unrealizedLoss: generators.random.float(100, 5000),
            taxRate: 0.01, // 1% tax rate
            gasEstimate: generators.random.float(10, 100),
            slippageEstimate: generators.random.float(0, 50),
            tradingFees: generators.random.float(0, 30),
          };
      }
    },
    ({ unrealizedLoss, taxRate, gasEstimate, slippageEstimate, tradingFees }) => {
      try {
        const params: NetBenefitParams = {
          unrealizedLoss,
          taxRate,
          gasEstimate,
          slippageEstimate,
          tradingFees,
        };

        const result = calculateNetBenefit(params);
        
        // Property: Result should be a finite number
        if (!isFinite(result)) {
          console.log('Non-finite result:', {
            input: params,
            result,
          });
          return false;
        }
        
        // Property: Net benefit can be negative (costs > savings)
        // This is valid and expected in some cases
        
        return true;
      } catch (error) {
        console.log('Boundary condition test failed:', error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    'Net benefit calculation must handle boundary conditions correctly',
    { numRuns: 150 }
  );
});

Deno.test('Property 6.6: Calculation is deterministic and stable', async () => {
  const generators = createGenerators(66666);

  await property(
    () => {
      return {
        unrealizedLoss: generators.random.float(100, 10000),
        taxRate: generators.random.float(0.1, 0.5),
        gasEstimate: generators.random.float(10, 200),
        slippageEstimate: generators.random.float(0, 100),
        tradingFees: generators.random.float(0, 50),
      };
    },
    ({ unrealizedLoss, taxRate, gasEstimate, slippageEstimate, tradingFees }) => {
      try {
        const params: NetBenefitParams = {
          unrealizedLoss,
          taxRate,
          gasEstimate,
          slippageEstimate,
          tradingFees,
        };

        // Run calculation multiple times
        const result1 = calculateNetBenefit(params);
        const result2 = calculateNetBenefit(params);
        const result3 = calculateNetBenefit(params);
        
        // Property: Results should be identical (deterministic)
        const tolerance = 0.000001;
        if (
          Math.abs(result1 - result2) > tolerance ||
          Math.abs(result2 - result3) > tolerance
        ) {
          console.log('Non-deterministic calculation:', {
            input: params,
            result1,
            result2,
            result3,
          });
          return false;
        }
        
        return true;
      } catch (error) {
        console.log('Determinism test failed:', error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    'Net benefit calculation must be deterministic and stable',
    { numRuns: 100 }
  );
});

console.log('✅ All net benefit property tests defined!');
