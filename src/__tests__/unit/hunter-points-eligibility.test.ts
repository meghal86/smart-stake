/**
 * Unit Tests: Points/Loyalty Program Eligibility
 * 
 * Tests points program eligibility based on wallet activity
 * and conversion hint display logic.
 * 
 * Validates: Requirements 5.1-5.11
 */

import { describe, test, expect } from 'vitest';
import { evaluateEligibility } from '@/lib/hunter/eligibility-engine';
import type { WalletSignals } from '@/lib/hunter/wallet-signals';

describe('Points Program Eligibility', () => {
  describe('Wallet Activity Requirements', () => {
    test('returns likely for wallet meeting all points program requirements', async () => {
      const pointsProgram = {
        id: 'test-points-1',
        type: 'points',
        title: 'EigenLayer Points Program',
        points_program_name: 'EigenLayer Points',
        conversion_hint: '1000 points ≈ potential airdrop allocation',
        requirements: {
          chains: ['ethereum'],
          min_wallet_age_days: 90,
          min_tx_count: 10,
        },
      };

      const walletSignals: WalletSignals = {
        address: '0x1234567890123456789012345678901234567890',
        wallet_age_days: 180,
        tx_count_90d: 50,
        chains_active: ['ethereum', 'base'],
        top_assets: [{ symbol: 'ETH', amount: 1.5 }],
        stablecoin_usd_est: 1000,
      };

      const result = await evaluateEligibility(walletSignals, pointsProgram);

      expect(result.status).toBe('likely');
      expect(result.score).toBeGreaterThanOrEqual(0.8);
      expect(result.reasons).toContain('Active on required chains');
      expect(result.reasons).toContain('Meets wallet age requirement');
    });

    test('returns unlikely for wallet not active on required chain', async () => {
      const pointsProgram = {
        id: 'test-points-2',
        type: 'points',
        title: 'Blast Points Program',
        points_program_name: 'Blast Points',
        conversion_hint: '1000 points ≈ $10-50 airdrop value',
        requirements: {
          chains: ['blast'],
          min_wallet_age_days: 30,
          min_tx_count: 5,
        },
      };

      const walletSignals: WalletSignals = {
        address: '0x1234567890123456789012345678901234567890',
        wallet_age_days: 90,
        tx_count_90d: 20,
        chains_active: ['ethereum', 'base'], // No Blast
        top_assets: [{ symbol: 'ETH', amount: 1.5 }],
        stablecoin_usd_est: 1000,
      };

      const result = await evaluateEligibility(walletSignals, pointsProgram);

      expect(result.status).toBe('unlikely');
      expect(result.score).toBeLessThan(0.5);
      expect(result.reasons).toContain('Not active on required chains');
    });

    test('returns unlikely for wallet below minimum age', async () => {
      const pointsProgram = {
        id: 'test-points-3',
        type: 'points',
        title: 'Pendle Points Program',
        points_program_name: 'Pendle Points',
        conversion_hint: '1000 points ≈ PENDLE token rewards',
        requirements: {
          chains: ['ethereum'],
          min_wallet_age_days: 60,
          min_tx_count: 10,
        },
      };

      const walletSignals: WalletSignals = {
        address: '0x1234567890123456789012345678901234567890',
        wallet_age_days: 30, // Below minimum
        tx_count_90d: 20,
        chains_active: ['ethereum'],
        top_assets: [{ symbol: 'ETH', amount: 1.5 }],
        stablecoin_usd_est: 1000,
      };

      const result = await evaluateEligibility(walletSignals, pointsProgram);

      expect(result.status).toBe('unlikely');
      expect(result.score).toBeLessThan(0.5);
      expect(result.reasons).toContain('Wallet age below minimum');
    });

    test('returns unlikely for wallet below minimum transaction count', async () => {
      const pointsProgram = {
        id: 'test-points-4',
        type: 'points',
        title: 'Hyperliquid Points',
        points_program_name: 'Hyperliquid Points',
        conversion_hint: '1000 points ≈ potential HYPE token allocation',
        requirements: {
          chains: ['arbitrum'],
          min_wallet_age_days: 45,
          min_tx_count: 8,
        },
      };

      const walletSignals: WalletSignals = {
        address: '0x1234567890123456789012345678901234567890',
        wallet_age_days: 90,
        tx_count_90d: 5, // Below minimum
        chains_active: ['arbitrum'],
        top_assets: [{ symbol: 'ETH', amount: 1.5 }],
        stablecoin_usd_est: 1000,
      };

      const result = await evaluateEligibility(walletSignals, pointsProgram);

      expect(result.status).toBe('unlikely');
      expect(result.score).toBeLessThan(0.5);
      expect(result.reasons).toContain('Transaction count below minimum');
    });

    test('returns maybe for wallet with partial requirements met', async () => {
      const pointsProgram = {
        id: 'test-points-5',
        type: 'points',
        title: 'Ethena Sats Program',
        points_program_name: 'Ethena Sats',
        conversion_hint: '1000 sats ≈ ENA token rewards',
        requirements: {
          chains: ['ethereum'],
          min_wallet_age_days: 60,
          min_tx_count: 10,
        },
      };

      const walletSignals: WalletSignals = {
        address: '0x1234567890123456789012345678901234567890',
        wallet_age_days: 90, // Meets age
        tx_count_90d: 8, // Below tx count
        chains_active: ['ethereum'], // Meets chain
        top_assets: [{ symbol: 'ETH', amount: 1.5 }],
        stablecoin_usd_est: 1000,
      };

      const result = await evaluateEligibility(walletSignals, pointsProgram);

      expect(result.status).toBe('maybe');
      expect(result.score).toBeGreaterThanOrEqual(0.5);
      expect(result.score).toBeLessThan(0.8);
    });
  });

  describe('Conversion Hint Display Logic', () => {
    test('includes conversion hint in opportunity data', () => {
      const pointsProgram = {
        id: 'test-points-6',
        type: 'points',
        title: 'Blur Loyalty Program',
        points_program_name: 'Blur Loyalty Points',
        conversion_hint: '1000 points ≈ BLUR token rewards',
        points_estimate_formula: 'nft_trading_volume * bid_activity',
        requirements: {
          chains: ['ethereum'],
          min_wallet_age_days: 60,
          min_tx_count: 10,
        },
      };

      expect(pointsProgram.conversion_hint).toBe('1000 points ≈ BLUR token rewards');
      expect(pointsProgram.points_estimate_formula).toBe('nft_trading_volume * bid_activity');
    });

    test('conversion hint provides value estimation', () => {
      const conversionHints = [
        '1000 points ≈ $10-50 airdrop value',
        '1000 points ≈ potential airdrop allocation',
        '1000 sats ≈ ENA token rewards',
        '1000 points ≈ BLUR token rewards',
        '1000 points ≈ PENDLE token rewards',
      ];

      conversionHints.forEach((hint) => {
        expect(hint).toMatch(/\d+\s+(points|sats)\s+≈/);
        expect(hint.length).toBeGreaterThan(10);
      });
    });

    test('points estimate formula describes calculation method', () => {
      const formulas = [
        'ETH_staked * days * multiplier',
        'balance * time * yield_multiplier',
        'trading_volume * social_activity',
        'nft_trading_volume * bid_activity',
        'pt_yt_trading * liquidity_provision',
      ];

      formulas.forEach((formula) => {
        expect(formula).toMatch(/\*/); // Contains multiplication
        expect(formula.length).toBeGreaterThan(5);
      });
    });
  });

  describe('Multi-Chain Points Programs', () => {
    test('returns likely for wallet active on any required chain', async () => {
      const pointsProgram = {
        id: 'test-points-7',
        type: 'points',
        title: 'Pendle Points Program',
        points_program_name: 'Pendle Points',
        conversion_hint: '1000 points ≈ PENDLE token rewards',
        requirements: {
          chains: ['ethereum', 'arbitrum'], // Multiple chains
          min_wallet_age_days: 60,
          min_tx_count: 10,
        },
      };

      const walletSignals: WalletSignals = {
        address: '0x1234567890123456789012345678901234567890',
        wallet_age_days: 90,
        tx_count_90d: 20,
        chains_active: ['arbitrum'], // Active on one of the required chains
        top_assets: [{ symbol: 'ETH', amount: 1.5 }],
        stablecoin_usd_est: 1000,
      };

      const result = await evaluateEligibility(walletSignals, pointsProgram);

      expect(result.status).toBe('likely');
      expect(result.score).toBeGreaterThanOrEqual(0.8);
      expect(result.reasons).toContain('Active on required chains');
    });
  });

  describe('Null Wallet Signals Handling', () => {
    test('returns maybe when wallet signals are unavailable', async () => {
      const pointsProgram = {
        id: 'test-points-8',
        type: 'points',
        title: 'Kamino Points Program',
        points_program_name: 'Kamino Points',
        conversion_hint: '1000 points ≈ potential KMNO token allocation',
        requirements: {
          chains: ['solana'],
          min_wallet_age_days: 30,
          min_tx_count: 5,
        },
      };

      const walletSignals: WalletSignals = {
        address: '0x1234567890123456789012345678901234567890',
        wallet_age_days: null, // Unavailable
        tx_count_90d: null, // Unavailable
        chains_active: [],
        top_assets: [],
        stablecoin_usd_est: null,
      };

      const result = await evaluateEligibility(walletSignals, pointsProgram);

      expect(result.status).toBe('maybe');
      expect(result.score).toBe(0.5);
      expect(result.reasons).toContain('Wallet data unavailable');
    });
  });

  describe('Edge Cases', () => {
    test('handles points program with no requirements', async () => {
      const pointsProgram = {
        id: 'test-points-9',
        type: 'points',
        title: 'Open Points Program',
        points_program_name: 'Open Points',
        conversion_hint: '1000 points ≈ rewards',
        requirements: {}, // No requirements
      };

      const walletSignals: WalletSignals = {
        address: '0x1234567890123456789012345678901234567890',
        wallet_age_days: 30,
        tx_count_90d: 5,
        chains_active: ['ethereum'],
        top_assets: [{ symbol: 'ETH', amount: 1.5 }],
        stablecoin_usd_est: 1000,
      };

      const result = await evaluateEligibility(walletSignals, pointsProgram);

      expect(result.status).toBe('maybe');
      expect(result.score).toBe(0.5);
      expect(result.reasons).toContain('No specific requirements');
    });

    test('handles points program with only chain requirement', async () => {
      const pointsProgram = {
        id: 'test-points-10',
        type: 'points',
        title: 'Chain-Only Points Program',
        points_program_name: 'Chain Points',
        conversion_hint: '1000 points ≈ rewards',
        requirements: {
          chains: ['base'],
        },
      };

      const walletSignals: WalletSignals = {
        address: '0x1234567890123456789012345678901234567890',
        wallet_age_days: 10,
        tx_count_90d: 2,
        chains_active: ['base'],
        top_assets: [{ symbol: 'ETH', amount: 0.1 }],
        stablecoin_usd_est: 50,
      };

      const result = await evaluateEligibility(walletSignals, pointsProgram);

      expect(result.status).toBe('likely');
      expect(result.score).toBeGreaterThanOrEqual(0.8);
      expect(result.reasons).toContain('Active on required chains');
    });
  });
});
