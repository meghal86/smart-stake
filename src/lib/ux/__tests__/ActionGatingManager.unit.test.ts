/**
 * Action Gating Manager Unit Tests
 * 
 * Tests for the Action Gating & Prerequisites System
 * Validates requirements R8.GATING.DISABLED_TOOLTIPS, R8.GATING.WALLET_REQUIRED, R8.GATING.LOADING_STATES
 * 
 * @see .kiro/specs/ux-gap-requirements/requirements.md - Requirement 8
 * @see .kiro/specs/ux-gap-requirements/design.md - Action Gating & Prerequisites System
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { ActionGatingManager } from '../ActionGatingManager';

describe('ActionGatingManager', () => {
  let manager: ActionGatingManager;

  beforeEach(() => {
    manager = new ActionGatingManager();
  });

  describe('Wallet Connection Gating', () => {
    test('should disable action when wallet is not connected', () => {
      manager.updateWalletState(false);
      
      const state = manager.evaluateAction({ requireWallet: true });
      
      expect(state.enabled).toBe(false);
      expect(state.disabledReason).toBe('Connect your wallet to continue');
    });

    test('should enable action when wallet is connected', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      
      const state = manager.evaluateAction({ requireWallet: true });
      
      expect(state.enabled).toBe(true);
      expect(state.disabledReason).toBeUndefined();
    });

    test('should show wallet connected message when wallet is connected', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      
      const state = manager.evaluateAction({ requireWallet: true });
      
      const walletPrereq = state.prerequisites.find(p => p.type === 'wallet');
      expect(walletPrereq?.met).toBe(true);
      expect(walletPrereq?.message).toBe('Wallet connected');
    });
  });

  describe('Token Approval Gating', () => {
    test('should disable action when token approval is missing', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      manager.updateTokenApprovals({ '0xTokenA': false });
      
      const state = manager.evaluateAction({ 
        requireWallet: true,
        requireApprovals: ['0xTokenA'] 
      });
      
      expect(state.enabled).toBe(false);
      expect(state.disabledReason).toBe('Approve token spend to continue');
    });

    test('should enable action when token approval is granted', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      manager.updateTokenApprovals({ '0xTokenA': true });
      
      const state = manager.evaluateAction({ 
        requireWallet: true,
        requireApprovals: ['0xTokenA'] 
      });
      
      expect(state.enabled).toBe(true);
    });

    test('should require all token approvals for multiple tokens', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      manager.updateTokenApprovals({ 
        '0xTokenA': true,
        '0xTokenB': false 
      });
      
      const state = manager.evaluateAction({ 
        requireWallet: true,
        requireApprovals: ['0xTokenA', '0xTokenB'] 
      });
      
      expect(state.enabled).toBe(false);
      
      // Update second token approval
      manager.updateTokenApprovals({ '0xTokenB': true });
      const updatedState = manager.evaluateAction({ 
        requireWallet: true,
        requireApprovals: ['0xTokenA', '0xTokenB'] 
      });
      
      expect(updatedState.enabled).toBe(true);
    });
  });

  describe('Balance Gating', () => {
    test('should disable action when balance is insufficient', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      manager.updateTokenBalances({ 'ETH': '0.05' });
      
      const state = manager.evaluateAction({ 
        requireWallet: true,
        minimumBalance: { token: 'ETH', amount: '0.1' }
      });
      
      expect(state.enabled).toBe(false);
      expect(state.disabledReason).toBe('Insufficient balance');
    });

    test('should enable action when balance is sufficient', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      manager.updateTokenBalances({ 'ETH': '0.15' });
      
      const state = manager.evaluateAction({ 
        requireWallet: true,
        minimumBalance: { token: 'ETH', amount: '0.1' }
      });
      
      expect(state.enabled).toBe(true);
    });

    test('should handle exact minimum balance', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      manager.updateTokenBalances({ 'ETH': '0.1' });
      
      const state = manager.evaluateAction({ 
        requireWallet: true,
        minimumBalance: { token: 'ETH', amount: '0.1' }
      });
      
      expect(state.enabled).toBe(true);
    });
  });

  describe('Geo Restriction Gating', () => {
    test('should disable action in restricted regions', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      manager.setUserRegion('US');
      
      const state = manager.evaluateAction({ 
        requireWallet: true,
        geoRestricted: true 
      });
      
      expect(state.enabled).toBe(false);
      expect(state.disabledReason).toBe('Not available in your region');
    });

    test('should enable action in allowed regions', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      manager.setUserRegion('EU');
      
      const state = manager.evaluateAction({ 
        requireWallet: true,
        geoRestricted: true 
      });
      
      expect(state.enabled).toBe(true);
    });
  });

  describe('Time Constraint Gating', () => {
    test('should disable action before start time', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      
      const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const state = manager.evaluateAction({ 
        requireWallet: true,
        timeConstraint: { start: futureStart }
      });
      
      expect(state.enabled).toBe(false);
      expect(state.disabledReason).toContain('Available from');
    });

    test('should disable action after end time', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      
      const pastEnd = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const state = manager.evaluateAction({ 
        requireWallet: true,
        timeConstraint: { end: pastEnd }
      });
      
      expect(state.enabled).toBe(false);
      expect(state.disabledReason).toBe('Expired');
    });

    test('should enable action within time window', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      
      const pastStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const futureEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const state = manager.evaluateAction({ 
        requireWallet: true,
        timeConstraint: { start: pastStart, end: futureEnd }
      });
      
      expect(state.enabled).toBe(true);
    });
  });

  describe('Multiple Prerequisites', () => {
    test('should require all prerequisites to be met', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      manager.updateTokenBalances({ 'ETH': '0.05' }); // Insufficient
      manager.updateTokenApprovals({ '0xTokenA': false }); // Not approved
      
      const state = manager.evaluateAction({ 
        requireWallet: true,
        minimumBalance: { token: 'ETH', amount: '0.1' },
        requireApprovals: ['0xTokenA']
      });
      
      expect(state.enabled).toBe(false);
      expect(state.prerequisites.filter(p => !p.met).length).toBeGreaterThan(1);
    });

    test('should enable when all prerequisites are met', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      manager.updateTokenBalances({ 'ETH': '0.15' });
      manager.updateTokenApprovals({ '0xTokenA': true });
      
      const state = manager.evaluateAction({ 
        requireWallet: true,
        minimumBalance: { token: 'ETH', amount: '0.1' },
        requireApprovals: ['0xTokenA']
      });
      
      expect(state.enabled).toBe(true);
      expect(state.prerequisites.every(p => p.met)).toBe(true);
    });
  });

  describe('Prerequisite Summary', () => {
    test('should return "All prerequisites met" when enabled', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      
      const state = manager.evaluateAction({ requireWallet: true });
      const summary = manager.getPrerequisiteSummary(state);
      
      expect(summary).toBe('All prerequisites met');
    });

    test('should return first unmet prerequisite message', () => {
      manager.updateWalletState(false);
      
      const state = manager.evaluateAction({ requireWallet: true });
      const summary = manager.getPrerequisiteSummary(state);
      
      expect(summary).toBe('Connect your wallet to continue');
    });

    test('should return count when multiple prerequisites are unmet', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      manager.updateTokenBalances({ 'ETH': '0.05' });
      manager.updateTokenApprovals({ '0xTokenA': false });
      
      const state = manager.evaluateAction({ 
        requireWallet: true,
        minimumBalance: { token: 'ETH', amount: '0.1' },
        requireApprovals: ['0xTokenA']
      });
      const summary = manager.getPrerequisiteSummary(state);
      
      expect(summary).toContain('requirements needed');
    });
  });

  describe('Convenience Methods', () => {
    test('createWalletGatingState should create wallet-only gating', () => {
      manager.updateWalletState(false);
      
      const state = manager.createWalletGatingState();
      
      expect(state.enabled).toBe(false);
      expect(state.prerequisites.length).toBe(1);
      expect(state.prerequisites[0].type).toBe('wallet');
    });

    test('createApprovalGatingState should create approval gating', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      manager.updateTokenApprovals({ '0xTokenA': false });
      
      const state = manager.createApprovalGatingState(['0xTokenA']);
      
      expect(state.enabled).toBe(false);
      expect(state.prerequisites.some(p => p.type === 'approval')).toBe(true);
    });

    test('createBalanceGatingState should create balance gating', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      manager.updateTokenBalances({ 'ETH': '0.05' });
      
      const state = manager.createBalanceGatingState('ETH', '0.1');
      
      expect(state.enabled).toBe(false);
      expect(state.prerequisites.some(p => p.type === 'balance')).toBe(true);
    });

    test('canExecuteAction should return boolean', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      
      const canExecute = manager.canExecuteAction({ requireWallet: true });
      
      expect(canExecute).toBe(true);
    });
  });

  describe('Custom Prerequisites', () => {
    test('should support custom prerequisites', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      
      const state = manager.evaluateAction({ 
        requireWallet: true,
        customPrerequisites: [
          {
            id: 'custom-check',
            type: 'custom',
            required: true,
            met: false,
            message: 'Custom requirement not met'
          }
        ]
      });
      
      expect(state.enabled).toBe(false);
      expect(state.disabledReason).toBe('Custom requirement not met');
    });

    test('should enable when custom prerequisites are met', () => {
      manager.updateWalletState(true, '0x1234567890abcdef');
      
      const state = manager.evaluateAction({ 
        requireWallet: true,
        customPrerequisites: [
          {
            id: 'custom-check',
            type: 'custom',
            required: true,
            met: true,
            message: 'Custom requirement met'
          }
        ]
      });
      
      expect(state.enabled).toBe(true);
    });
  });
});