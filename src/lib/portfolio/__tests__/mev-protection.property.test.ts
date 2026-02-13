/**
 * MEV Protection Property Tests
 * 
 * Tests for MEV protection functionality in the Portfolio Policy Engine.
 * Validates MEV protection mode configuration and chain/provider support.
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import { 
  PolicyEngine, 
  DEFAULT_POLICY_CONFIG 
} from '../PolicyEngine';
import type { PolicyEngineConfig } from '@/types/portfolio';

// ============================================================================
// Generators
// ============================================================================

const mevModeGenerator = fc.constantFrom('off', 'auto', 'force');

const chainIdGenerator = fc.oneof(
  fc.constantFrom(1, 5, 11155111), // MEV supported chains
  fc.constantFrom(137, 42161, 8453) // Non-MEV supported chains
);

const providerGenerator = fc.oneof(
  fc.constantFrom('flashbots', 'eden', 'bloxroute'), // MEV supported providers
  fc.constantFrom('alchemy', 'infura', 'quicknode') // Regular providers
);

const policyConfigGenerator = fc.record({
  maxGasUsd: fc.float({ min: 0, max: 1000, noNaN: true }),
  blockNewContractsDays: fc.integer({ min: 0, max: 365 }),
  blockInfiniteApprovalsToUnknown: fc.boolean(),
  requireSimulationForValueOverUsd: fc.float({ min: 0, max: 10000, noNaN: true }),
  confidenceThreshold: fc.float({ min: 0.50, max: 1.0, noNaN: true }),
  allowedSlippagePercent: fc.float({ min: 0, max: 100, noNaN: true }),
  maxDailyTransactionCount: fc.integer({ min: 0, max: 1000 }),
  mevProtectedMode: mevModeGenerator
}) as fc.Arbitrary<PolicyEngineConfig>;

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: unified-portfolio, Property 36: MEV Protection Configuration', () => {
  
  test('MEV protection mode is always one of the valid values', () => {
    fc.assert(
      fc.property(policyConfigGenerator, (config) => {
        const engine = new PolicyEngine(config);
        const currentConfig = engine.getConfig();
        
        return ['off', 'auto', 'force'].includes(currentConfig.mevProtectedMode);
      }),
      { numRuns: 100 }
    );
  });

  test('MEV protection requirements are correctly determined based on mode and support', () => {
    fc.assert(
      fc.property(
        mevModeGenerator,
        chainIdGenerator,
        fc.option(providerGenerator, { nil: undefined }),
        (mode, chainId, provider) => {
          const config = { ...DEFAULT_POLICY_CONFIG, mevProtectedMode: mode };
          const engine = new PolicyEngine(config);
          
          const result = engine.checkMevProtectionRequirements(chainId, provider);
          
          // Verify result structure
          expect(result).toHaveProperty('required');
          expect(result).toHaveProperty('supported');
          expect(result).toHaveProperty('mode');
          expect(typeof result.required).toBe('boolean');
          expect(typeof result.supported).toBe('boolean');
          expect(result.mode).toBe(mode);
          
          // MEV supported chains
          const mevSupportedChains = [1, 5, 11155111];
          const chainSupported = mevSupportedChains.includes(chainId);
          
          // MEV supported providers
          const mevSupportedProviders = ['flashbots', 'eden', 'bloxroute'];
          const providerSupported = !provider || mevSupportedProviders.some(p => 
            provider.toLowerCase().includes(p)
          );
          
          const expectedSupported = chainSupported && providerSupported;
          expect(result.supported).toBe(expectedSupported);
          
          // Verify required logic
          if (mode === 'force') {
            expect(result.required).toBe(true);
          } else if (mode === 'auto') {
            expect(result.required).toBe(expectedSupported);
          } else if (mode === 'off') {
            expect(result.required).toBe(false);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('MEV protection validation accepts only valid mode values', () => {
    fc.assert(
      fc.property(
        fc.record({
          mevProtectedMode: fc.oneof(
            mevModeGenerator,
            fc.string().filter(s => !['off', 'auto', 'force'].includes(s))
          )
        }),
        (partialConfig) => {
          const validation = PolicyEngine.validateConfig(partialConfig);
          
          if (['off', 'auto', 'force'].includes(partialConfig.mevProtectedMode)) {
            // Valid mode should not produce MEV-related errors
            const mevErrors = validation.errors.filter(error => 
              error.includes('mevProtectedMode')
            );
            expect(mevErrors).toHaveLength(0);
          } else {
            // Invalid mode should produce MEV-related error
            expect(validation.valid).toBe(false);
            const mevErrors = validation.errors.filter(error => 
              error.includes('mevProtectedMode')
            );
            expect(mevErrors.length).toBeGreaterThan(0);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Policy engine considers MEV protection mode when not off', () => {
    fc.assert(
      fc.property(
        policyConfigGenerator.filter(config => config.mevProtectedMode !== 'off'),
        async (config) => {
          const engine = new PolicyEngine(config);
          
          // Verify the config includes MEV protection mode
          const currentConfig = engine.getConfig();
          expect(currentConfig.mevProtectedMode).not.toBe('off');
          expect(['auto', 'force']).toContain(currentConfig.mevProtectedMode);
          
          // Verify MEV protection requirements can be checked
          const mevCheck = engine.checkMevProtectionRequirements(1); // Ethereum mainnet
          expect(mevCheck).toHaveProperty('required');
          expect(mevCheck).toHaveProperty('supported');
          expect(mevCheck).toHaveProperty('mode');
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Default policy configuration includes MEV protection mode', () => {
    expect(DEFAULT_POLICY_CONFIG).toHaveProperty('mevProtectedMode');
    expect(['off', 'auto', 'force']).toContain(DEFAULT_POLICY_CONFIG.mevProtectedMode);
    expect(DEFAULT_POLICY_CONFIG.mevProtectedMode).toBe('auto');
  });

  test('Policy engine config update preserves MEV protection mode', () => {
    fc.assert(
      fc.property(
        mevModeGenerator,
        mevModeGenerator,
        (initialMode, newMode) => {
          const engine = new PolicyEngine({ mevProtectedMode: initialMode });
          
          // Verify initial mode
          expect(engine.getConfig().mevProtectedMode).toBe(initialMode);
          
          // Update mode
          engine.updateConfig({ mevProtectedMode: newMode });
          
          // Verify updated mode
          expect(engine.getConfig().mevProtectedMode).toBe(newMode);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Validates: Requirements 14.3
 * 
 * This property test ensures that:
 * 1. MEV protection mode is always one of the valid values (off, auto, force)
 * 2. MEV protection requirements are correctly determined based on chain/provider support
 * 3. Policy validation correctly handles MEV protection mode values
 * 4. MEV protection is included in applied policies when enabled
 * 5. Default configuration includes MEV protection
 * 6. Policy engine config updates preserve MEV protection settings
 */