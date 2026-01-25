/**
 * Property-Based Tests for Policy Engine Enforcement
 * 
 * Feature: unified-portfolio, Property 16: Policy Engine Enforcement
 * Validates: Requirements 6.8
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import { 
  PolicyEngine, 
  DEFAULT_POLICY_CONFIG, 
  type PolicyContext 
} from '../PolicyEngine';
import type { 
  PolicyEngineConfig, 
  ExecutionStep, 
  WalletScope 
} from '@/types/portfolio';

// ============================================================================
// Generators
// ============================================================================

// Generate valid Ethereum addresses
const addressGenerator = fc.integer({ min: 0, max: 15 })
  .chain(n => fc.array(fc.integer({ min: 0, max: 15 }), { minLength: 40, maxLength: 40 }))
  .map(arr => `0x${arr.map(n => n.toString(16)).join('')}`);

// Generate transaction hashes
const txHashGenerator = fc.integer({ min: 0, max: 15 })
  .chain(n => fc.array(fc.integer({ min: 0, max: 15 }), { minLength: 64, maxLength: 64 }))
  .map(arr => `0x${arr.map(n => n.toString(16)).join('')}`);

const policyConfigGenerator = fc.record({
  maxGasUsd: fc.float({ min: 0, max: 1000, noNaN: true }),
  blockNewContractsDays: fc.integer({ min: 0, max: 365 }),
  blockInfiniteApprovalsToUnknown: fc.boolean(),
  requireSimulationForValueOverUsd: fc.float({ min: 0, max: 10000, noNaN: true }),
  confidenceThreshold: fc.float({ min: 0.50, max: 1.0, noNaN: true }),
  allowedSlippagePercent: fc.float({ min: 0, max: 100, noNaN: true }),
  maxDailyTransactionCount: fc.integer({ min: 0, max: 1000 })
}) as fc.Arbitrary<PolicyEngineConfig>;

const executionStepGenerator = fc.record({
  stepId: fc.string({ minLength: 1, maxLength: 50 }),
  kind: fc.constantFrom('revoke', 'approve', 'swap', 'transfer'),
  chainId: fc.integer({ min: 1, max: 100000 }),
  target_address: addressGenerator,
  status: fc.constantFrom('pending', 'simulated', 'blocked', 'ready', 'signing', 'submitted', 'confirmed', 'failed'),
  payload: fc.option(fc.string(), { nil: undefined }),
  gas_estimate: fc.option(fc.integer({ min: 21000, max: 10000000 }), { nil: undefined }),
  error_message: fc.option(fc.string(), { nil: undefined }),
  transaction_hash: fc.option(txHashGenerator, { nil: undefined }),
  block_number: fc.option(fc.bigInt({ min: 0n, max: 20000000n }), { nil: undefined }),
  step_idempotency_key: fc.option(fc.string(), { nil: undefined })
}) as fc.Arbitrary<ExecutionStep>;

const walletScopeGenerator = fc.oneof(
  fc.record({
    mode: fc.constant('active_wallet' as const),
    address: addressGenerator
  }),
  fc.record({
    mode: fc.constant('all_wallets' as const)
  })
) as fc.Arbitrary<WalletScope>;

const policyContextGenerator = fc.record({
  userId: fc.uuid(),
  walletScope: walletScopeGenerator,
  steps: fc.array(executionStepGenerator, { minLength: 1, maxLength: 10 }),
  totalGasEstimateUsd: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: undefined }),
  totalValueUsd: fc.option(fc.float({ min: 0, max: 100000, noNaN: true }), { nil: undefined }),
  confidence: fc.option(fc.float({ min: 0, max: 1, noNaN: true }), { nil: undefined }),
  contractAges: fc.option(fc.dictionary(
    addressGenerator,
    fc.integer({ min: 0, max: 3650 })
  ), { nil: undefined })
}) as fc.Arbitrary<PolicyContext>;

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: unified-portfolio, Property 16: Policy Engine Enforcement', () => {
  
  test('Policy engine always returns valid status', () => {
    fc.assert(
      fc.asyncProperty(
        policyConfigGenerator,
        policyContextGenerator,
        async (config, context) => {
          const engine = new PolicyEngine(config);
          const result = await engine.checkPolicy(context);
          
          // Status must be either 'allowed' or 'blocked'
          if (!['allowed', 'blocked'].includes(result.status)) {
            return false;
          }
          
          // Violations array must be defined
          if (!Array.isArray(result.violations)) {
            return false;
          }
          
          // Applied policies array must be defined
          if (!Array.isArray(result.appliedPolicies)) {
            return false;
          }
          
          // If there are violations, status must be 'blocked'
          if (result.violations.length > 0 && result.status !== 'blocked') {
            return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Gas limit policy is enforced correctly', () => {
    fc.assert(
      fc.asyncProperty(
        fc.float({ min: 1, max: 100, noNaN: true }), // maxGasUsd
        fc.float({ min: 0, max: 200, noNaN: true }), // totalGasEstimateUsd
        policyContextGenerator,
        async (maxGasUsd, totalGasEstimateUsd, context) => {
          const config = { ...DEFAULT_POLICY_CONFIG, maxGasUsd };
          const engine = new PolicyEngine(config);
          
          const contextWithGas = {
            ...context,
            totalGasEstimateUsd
          };
          
          const result = await engine.checkPolicy(contextWithGas);
          
          if (totalGasEstimateUsd > maxGasUsd) {
            // Should be blocked if gas exceeds limit
            if (result.status !== 'blocked') {
              return false;
            }
            if (!result.violations.some(v => v.includes('GAS_LIMIT_EXCEEDED'))) {
              return false;
            }
          }
          
          // max_gas_usd policy should be applied when gas estimate is provided
          if (!result.appliedPolicies.includes('max_gas_usd')) {
            return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Confidence threshold policy is enforced correctly', () => {
    fc.assert(
      fc.asyncProperty(
        fc.float({ min: 0.50, max: 1.0, noNaN: true }), // confidenceThreshold
        fc.float({ min: 0, max: 1, noNaN: true }), // confidence
        policyContextGenerator,
        async (confidenceThreshold, confidence, context) => {
          const config = { ...DEFAULT_POLICY_CONFIG, confidenceThreshold };
          const engine = new PolicyEngine(config);
          
          const contextWithConfidence = {
            ...context,
            confidence
          };
          
          const result = await engine.checkPolicy(contextWithConfidence);
          
          if (confidence < confidenceThreshold) {
            // Should be blocked if confidence is below threshold
            if (result.status !== 'blocked') {
              return false;
            }
            if (!result.violations.some(v => v.includes('CONFIDENCE_TOO_LOW'))) {
              return false;
            }
          }
          
          // confidence_threshold policy should be applied when confidence is provided
          if (!result.appliedPolicies.includes('confidence_threshold')) {
            return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('New contract blocking policy is enforced correctly', () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 30 }), // blockNewContractsDays
        fc.integer({ min: 0, max: 60 }), // contractAge
        policyContextGenerator,
        async (blockNewContractsDays, contractAge, context) => {
          const config = { ...DEFAULT_POLICY_CONFIG, blockNewContractsDays };
          const engine = new PolicyEngine(config);
          
          const contractAddress = '0x1234567890123456789012345678901234567890';
          const contextWithContracts = {
            ...context,
            contractAges: { [contractAddress]: contractAge }
          };
          
          const result = await engine.checkPolicy(contextWithContracts);
          
          if (contractAge < blockNewContractsDays) {
            // Should be blocked if contract is too new
            if (result.status !== 'blocked') {
              return false;
            }
            if (!result.violations.some(v => v.includes('NEW_CONTRACT_BLOCKED'))) {
              return false;
            }
          }
          
          // block_new_contracts_days policy should be applied when contract ages are provided
          if (!result.appliedPolicies.includes('block_new_contracts_days')) {
            return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Policy configuration validation works correctly', () => {
    fc.assert(
      fc.property(
        policyConfigGenerator,
        (config) => {
          const validation = PolicyEngine.validateConfig(config);
          
          // Validation result must have valid boolean and errors array
          if (typeof validation.valid !== 'boolean') {
            return false;
          }
          if (!Array.isArray(validation.errors)) {
            return false;
          }
          
          // If valid is false, there must be at least one error
          if (!validation.valid && validation.errors.length === 0) {
            return false;
          }
          
          // If valid is true, there should be no errors
          if (validation.valid && validation.errors.length > 0) {
            return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Confidence threshold enforcement respects minimum bound', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: Math.fround(0.49), noNaN: true }), // Below minimum threshold
        (belowMinThreshold) => {
          const config = { ...DEFAULT_POLICY_CONFIG, confidenceThreshold: belowMinThreshold };
          const engine = new PolicyEngine(config);
          
          // Engine should enforce minimum threshold of 0.50
          const actualConfig = engine.getConfig();
          return actualConfig.confidenceThreshold >= 0.50;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Policy engine configuration is immutable from external changes', () => {
    fc.assert(
      fc.property(
        policyConfigGenerator,
        (config) => {
          const engine = new PolicyEngine(config);
          const originalConfig = engine.getConfig();
          
          // Modify the returned config object
          const returnedConfig = engine.getConfig();
          returnedConfig.maxGasUsd = 999999;
          returnedConfig.confidenceThreshold = 0.1;
          
          // Original config should remain unchanged
          const currentConfig = engine.getConfig();
          return (
            currentConfig.maxGasUsd === originalConfig.maxGasUsd &&
            currentConfig.confidenceThreshold === originalConfig.confidenceThreshold
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Applied policies list is consistent with configuration', () => {
    fc.assert(
      fc.asyncProperty(
        policyConfigGenerator,
        policyContextGenerator,
        async (config, context) => {
          const engine = new PolicyEngine(config);
          const result = await engine.checkPolicy(context);
          
          // If confidence is provided, confidence_threshold should be in applied policies
          if (context.confidence !== undefined) {
            if (!result.appliedPolicies.includes('confidence_threshold')) {
              return false;
            }
          }
          
          // If gas estimate is provided, max_gas_usd should be in applied policies
          if (context.totalGasEstimateUsd !== undefined) {
            if (!result.appliedPolicies.includes('max_gas_usd')) {
              return false;
            }
          }
          
          // If contract ages are provided, block_new_contracts_days should be in applied policies
          if (context.contractAges !== undefined) {
            if (!result.appliedPolicies.includes('block_new_contracts_days')) {
              return false;
            }
          }
          
          // block_infinite_approvals_to_unknown is applied when config is enabled and there are approval steps
          const hasApprovalSteps = context.steps.some(step => step.kind === 'approve');
          if (config.blockInfiniteApprovalsToUnknown && hasApprovalSteps) {
            if (!result.appliedPolicies.includes('block_infinite_approvals_to_unknown')) {
              return false;
            }
          }
          
          // max_daily_transaction_count is always applied regardless of context data
          if (!result.appliedPolicies.includes('max_daily_transaction_count')) {
            return false;
          }
          
          // require_simulation_for_value_over_usd is applied when totalValueUsd is provided
          if (context.totalValueUsd !== undefined) {
            if (!result.appliedPolicies.includes('require_simulation_for_value_over_usd')) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Confidence threshold check returns consistent results', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.50, max: 1.0, noNaN: true }), // threshold
        fc.float({ min: 0, max: 1, noNaN: true }), // confidence
        (threshold, confidence) => {
          const config = { ...DEFAULT_POLICY_CONFIG, confidenceThreshold: threshold };
          const engine = new PolicyEngine(config);
          
          const result = engine.checkConfidenceThreshold(confidence);
          
          // Result should have required properties
          if (typeof result.degraded !== 'boolean') {
            return false;
          }
          if (typeof result.gateRiskyActions !== 'boolean') {
            return false;
          }
          if (!Array.isArray(result.degradedReasons)) {
            return false;
          }
          
          // Degraded and gateRiskyActions should be consistent
          if (result.degraded !== result.gateRiskyActions) {
            return false;
          }
          
          // If confidence is below threshold, should be degraded
          if (confidence < threshold) {
            if (!result.degraded || result.degradedReasons.length === 0) {
              return false;
            }
          } else {
            if (result.degraded || result.degradedReasons.length > 0) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});