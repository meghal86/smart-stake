/**
 * Action Gating Property-Based Tests
 * 
 * Property-based tests for the Action Gating & Prerequisites System
 * Validates requirements R8.GATING.DISABLED_TOOLTIPS, R8.GATING.WALLET_REQUIRED, R8.GATING.LOADING_STATES
 * 
 * Feature: ux-gap-requirements, Property 13: Action Gating Completeness
 * Validates: R8.GATING.DISABLED_TOOLTIPS, R8.GATING.WALLET_REQUIRED, R8.GATING.LOADING_STATES
 * 
 * @see .kiro/specs/ux-gap-requirements/requirements.md - Requirement 8
 * @see .kiro/specs/ux-gap-requirements/design.md - Action Gating & Prerequisites System
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { ActionGatingManager, type ActionGatingConfig } from '../ActionGatingManager';

describe('Feature: ux-gap-requirements, Property 13: Action Gating Completeness', () => {
  // Generator for wallet addresses
  const walletAddressArb = fc.constantFrom(
    '0x1234567890abcdef1234567890abcdef12345678',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    '0x9876543210fedcba9876543210fedcba98765432'
  );

  // Generator for token balances
  const tokenBalanceArb = fc.record({
    token: fc.constantFrom('ETH', 'USDC', 'DAI', 'WETH'),
    amount: fc.float({ min: 0, max: 1000 }).map(n => n.toString()),
  });

  // Generator for token approvals
  const tokenApprovalArb = fc.record({
    address: walletAddressArb,
    approved: fc.boolean(),
  });

  // Generator for gating configurations
  const gatingConfigArb = fc.record({
    requireWallet: fc.boolean(),
    requireApprovals: fc.array(walletAddressArb, { maxLength: 2 }),
    minimumBalance: fc.option(tokenBalanceArb),
    geoRestricted: fc.boolean(),
  });

  test('wallet connection requirement is always enforced when configured', () => {
    fc.assert(
      fc.property(
        gatingConfigArb.filter(config => config.requireWallet),
        fc.boolean(),
        fc.option(walletAddressArb),
        (config, walletConnected, walletAddress) => {
          const manager = new ActionGatingManager();
          manager.updateWalletState(walletConnected, walletAddress);
          
          const state = manager.evaluateAction(config);
          
          // Property: If wallet is required, action should only be enabled when wallet is connected
          if (config.requireWallet) {
            const walletPrereq = state.prerequisites.find(p => p.type === 'wallet');
            expect(walletPrereq).toBeDefined();
            expect(walletPrereq!.required).toBe(true);
            expect(walletPrereq!.met).toBe(walletConnected);
            
            // If wallet is not connected, action should be disabled
            if (!walletConnected) {
              expect(state.enabled).toBe(false);
              expect(state.disabledReason).toContain('wallet');
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('token approval requirements are correctly validated', () => {
    fc.assert(
      fc.property(
        fc.array(walletAddressArb, { minLength: 1, maxLength: 2 }),
        fc.array(tokenApprovalArb),
        (requiredTokens, approvals) => {
          const manager = new ActionGatingManager();
          manager.updateWalletState(true, '0x1234567890abcdef1234567890abcdef12345678');
          
          // Set up approvals
          const approvalMap: Record<string, boolean> = {};
          approvals.forEach(approval => {
            approvalMap[approval.address] = approval.approved;
          });
          manager.updateTokenApprovals(approvalMap);
          
          const config: ActionGatingConfig = {
            requireWallet: true,
            requireApprovals: requiredTokens,
          };
          
          const state = manager.evaluateAction(config);
          
          // Property: All required tokens must be approved for action to be enabled
          const approvalPrereqs = state.prerequisites.filter(p => p.type === 'approval');
          expect(approvalPrereqs.length).toBe(requiredTokens.length);
          
          const allApproved = requiredTokens.every(token => approvalMap[token] === true);
          const hasUnmetApproval = approvalPrereqs.some(p => !p.met);
          
          if (!allApproved) {
            expect(hasUnmetApproval).toBe(true);
            expect(state.enabled).toBe(false);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('balance requirements are correctly enforced', () => {
    fc.assert(
      fc.property(
        tokenBalanceArb,
        fc.float({ min: 0, max: 1000 }),
        (requiredBalance, actualBalance) => {
          const manager = new ActionGatingManager();
          manager.updateWalletState(true, '0x1234567890abcdef1234567890abcdef12345678');
          manager.updateTokenBalances({ [requiredBalance.token]: actualBalance.toString() });
          
          const config: ActionGatingConfig = {
            requireWallet: true,
            minimumBalance: requiredBalance,
          };
          
          const state = manager.evaluateAction(config);
          
          // Property: Action should only be enabled if actual balance >= required balance
          const balancePrereq = state.prerequisites.find(p => p.type === 'balance');
          expect(balancePrereq).toBeDefined();
          
          const hasEnoughBalance = actualBalance >= parseFloat(requiredBalance.amount);
          expect(balancePrereq!.met).toBe(hasEnoughBalance);
          
          if (!hasEnoughBalance) {
            expect(state.enabled).toBe(false);
            expect(state.disabledReason).toContain('balance');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('geo restrictions are properly applied', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('US', 'CN', 'KP', 'EU', 'UK', 'CA', 'JP'),
        (region) => {
          const manager = new ActionGatingManager();
          manager.updateWalletState(true, '0x1234567890abcdef1234567890abcdef12345678');
          manager.setUserRegion(region);
          
          const config: ActionGatingConfig = {
            requireWallet: true,
            geoRestricted: true,
          };
          
          const state = manager.evaluateAction(config);
          
          // Property: Restricted regions should disable the action
          const restrictedRegions = ['US', 'CN', 'KP'];
          const isRestricted = restrictedRegions.includes(region);
          
          const geoPrereq = state.prerequisites.find(p => p.type === 'geo');
          expect(geoPrereq).toBeDefined();
          expect(geoPrereq!.met).toBe(!isRestricted);
          
          if (isRestricted) {
            expect(state.enabled).toBe(false);
            expect(state.disabledReason).toContain('region');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('time constraints are correctly validated', () => {
    fc.assert(
      fc.property(
        fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })),
        fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })),
        (startDate, endDate) => {
          // Ensure start is before end if both are provided
          if (startDate && endDate && startDate > endDate) {
            [startDate, endDate] = [endDate, startDate];
          }
          
          const manager = new ActionGatingManager();
          manager.updateWalletState(true, '0x1234567890abcdef1234567890abcdef12345678');
          
          const config: ActionGatingConfig = {
            requireWallet: true,
            timeConstraint: {
              start: startDate || undefined,
              end: endDate || undefined,
            },
          };
          
          const state = manager.evaluateAction(config);
          
          // Property: Action should only be enabled within the time window
          if (startDate || endDate) {
            const timePrereq = state.prerequisites.find(p => p.type === 'time');
            expect(timePrereq).toBeDefined();
            
            const now = new Date();
            let withinTimeWindow = true;
            
            if (startDate && now < startDate) {
              withinTimeWindow = false;
            }
            if (endDate && now > endDate) {
              withinTimeWindow = false;
            }
            
            expect(timePrereq!.met).toBe(withinTimeWindow);
            
            if (!withinTimeWindow) {
              expect(state.enabled).toBe(false);
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('multiple prerequisites must all be met for action to be enabled', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // wallet connected
        fc.array(tokenApprovalArb, { maxLength: 2 }), // approvals
        tokenBalanceArb, // balance requirement
        fc.float({ min: 0, max: 1000 }), // actual balance
        (walletConnected, approvals, balanceReq, actualBalance) => {
          const manager = new ActionGatingManager();
          manager.updateWalletState(walletConnected, walletConnected ? '0x1234567890abcdef1234567890abcdef12345678' : undefined);
          
          // Set up approvals
          const approvalMap: Record<string, boolean> = {};
          const requiredTokens: string[] = [];
          approvals.forEach((approval, index) => {
            const tokenAddr = `0x${index.toString().padStart(40, '0')}`;
            approvalMap[tokenAddr] = approval.approved;
            requiredTokens.push(tokenAddr);
          });
          manager.updateTokenApprovals(approvalMap);
          manager.updateTokenBalances({ [balanceReq.token]: actualBalance.toString() });
          
          const config: ActionGatingConfig = {
            requireWallet: true,
            requireApprovals: requiredTokens,
            minimumBalance: balanceReq,
          };
          
          const state = manager.evaluateAction(config);
          
          // Property: Action is enabled only if ALL prerequisites are met
          const allRequiredPrereqs = state.prerequisites.filter(p => p.required);
          const allMet = allRequiredPrereqs.every(p => p.met);
          
          expect(state.enabled).toBe(allMet);
          
          if (!allMet) {
            expect(state.disabledReason).toBeDefined();
            expect(state.disabledReason!.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('prerequisite summary is always meaningful and non-empty', () => {
    fc.assert(
      fc.property(
        gatingConfigArb,
        fc.boolean(),
        fc.option(walletAddressArb),
        (config, walletConnected, walletAddress) => {
          const manager = new ActionGatingManager();
          manager.updateWalletState(walletConnected, walletAddress);
          
          const state = manager.evaluateAction(config);
          const summary = manager.getPrerequisiteSummary(state);
          
          // Property: Summary should always be a non-empty string
          expect(summary).toBeDefined();
          expect(typeof summary).toBe('string');
          expect(summary.length).toBeGreaterThan(0);
          
          // Property: Summary should reflect the actual state
          if (state.enabled) {
            expect(summary).toBe('All prerequisites met');
          } else {
            expect(summary).not.toBe('All prerequisites met');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('disabled reason is provided when action is disabled', () => {
    fc.assert(
      fc.property(
        gatingConfigArb.filter(config => 
          config.requireWallet || 
          (config.requireApprovals && config.requireApprovals.length > 0) ||
          config.minimumBalance ||
          config.geoRestricted
        ),
        (config) => {
          const manager = new ActionGatingManager();
          // Intentionally set up a state where some prerequisite will fail
          manager.updateWalletState(false); // No wallet connected
          
          const state = manager.evaluateAction(config);
          
          // Property: If action is disabled, there must be a clear reason
          if (!state.enabled) {
            expect(state.disabledReason).toBeDefined();
            expect(typeof state.disabledReason).toBe('string');
            expect(state.disabledReason!.length).toBeGreaterThan(0);
            
            // Reason should be user-friendly (not technical)
            expect(state.disabledReason).not.toContain('undefined');
            expect(state.disabledReason).not.toContain('null');
            expect(state.disabledReason).not.toContain('error');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('action gating state is deterministic for same inputs', () => {
    fc.assert(
      fc.property(
        gatingConfigArb,
        fc.boolean(),
        fc.option(walletAddressArb),
        fc.record({
          balances: fc.dictionary(fc.string(), fc.string()),
          approvals: fc.dictionary(fc.string(), fc.boolean()),
        }),
        (config, walletConnected, walletAddress, state) => {
          // Create two managers with identical state
          const manager1 = new ActionGatingManager();
          const manager2 = new ActionGatingManager();
          
          // Set identical state
          [manager1, manager2].forEach(manager => {
            manager.updateWalletState(walletConnected, walletAddress);
            manager.updateTokenBalances(state.balances);
            manager.updateTokenApprovals(state.approvals);
          });
          
          // Evaluate with same config
          const result1 = manager1.evaluateAction(config);
          const result2 = manager2.evaluateAction(config);
          
          // Property: Results should be identical
          expect(result1.enabled).toBe(result2.enabled);
          expect(result1.disabledReason).toBe(result2.disabledReason);
          expect(result1.prerequisites.length).toBe(result2.prerequisites.length);
          
          // Check each prerequisite
          result1.prerequisites.forEach((prereq1, index) => {
            const prereq2 = result2.prerequisites[index];
            expect(prereq1.met).toBe(prereq2.met);
            expect(prereq1.required).toBe(prereq2.required);
            expect(prereq1.type).toBe(prereq2.type);
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});