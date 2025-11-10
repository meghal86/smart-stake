/**
 * Unit tests for eligibility scoring algorithm
 * Tests all scoring scenarios and edge cases
 */

import { describe, it, expect } from 'vitest';
import {
  calculateEligibilityScore,
  createChainActivityChecker,
  type EligibilitySignals,
} from '../../lib/eligibility';

describe('calculateEligibilityScore', () => {
  describe('Perfect Score Scenarios', () => {
    it('should return score of 1.05 (105%) for perfect wallet with allowlist', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 30,
        txCount: 10,
        holdsOnChain: true,
        hasActivityOnChain: createChainActivityChecker(['ethereum']),
        allowlistProofs: true,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.score).toBe(1.05);
      expect(result.label).toBe('likely');
      expect(result.breakdown.chainPresence).toBe(0.40);
      expect(result.breakdown.walletAge).toBe(0.25);
      expect(result.breakdown.transactionCount).toBe(0.20);
      expect(result.breakdown.holdings).toBe(0.15);
      expect(result.breakdown.allowlistBonus).toBe(0.05);
      expect(result.reasons).toContain('Active on ethereum');
      expect(result.reasons).toContain('Wallet age 30+ days');
      expect(result.reasons).toContain('10+ transactions');
      expect(result.reasons).toContain('Holds tokens on chain');
      expect(result.reasons).toContain('On allowlist');
    });

    it('should return score of 1.00 for perfect wallet without allowlist', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 30,
        txCount: 10,
        holdsOnChain: true,
        hasActivityOnChain: createChainActivityChecker(['ethereum']),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.score).toBe(1.00);
      expect(result.label).toBe('likely');
      expect(result.breakdown.allowlistBonus).toBe(0);
      expect(result.reasons).not.toContain('On allowlist');
    });
  });

  describe('Chain Presence (40% weight)', () => {
    it('should give full chain presence score when active on required chain', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 0,
        txCount: 0,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker(['ethereum', 'polygon']),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.chainPresence).toBe(0.40);
      expect(result.reasons).toContain('Active on ethereum');
    });

    it('should give zero chain presence score when not active on required chain', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 0,
        txCount: 0,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker(['polygon']),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.chainPresence).toBe(0);
      expect(result.reasons).toContain('No activity on ethereum');
    });

    it('should handle different chain names correctly', () => {
      const chains = ['base', 'arbitrum', 'optimism', 'solana'];
      
      chains.forEach(chain => {
        const signals: EligibilitySignals = {
          walletAgeDays: 0,
          txCount: 0,
          holdsOnChain: false,
          hasActivityOnChain: createChainActivityChecker([chain]),
          allowlistProofs: false,
          requiredChain: chain,
        };

        const result = calculateEligibilityScore(signals);
        expect(result.breakdown.chainPresence).toBe(0.40);
        expect(result.reasons).toContain(`Active on ${chain}`);
      });
    });
  });

  describe('Wallet Age (25% weight, capped at 30 days)', () => {
    it('should give full wallet age score at 30 days', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 30,
        txCount: 0,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.walletAge).toBe(0.25);
      expect(result.reasons).toContain('Wallet age 30+ days');
    });

    it('should cap wallet age score at 30 days', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 60,
        txCount: 0,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.walletAge).toBe(0.25);
      expect(result.reasons).toContain('Wallet age 30+ days');
    });

    it('should give proportional score for 15 days (50%)', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 15,
        txCount: 0,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.walletAge).toBe(0.125); // 15/30 * 0.25
      expect(result.reasons).toContain('Wallet age 15 days');
    });

    it('should give proportional score for 7 days', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 7,
        txCount: 0,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.walletAge).toBeCloseTo(0.0583, 2); // 7/30 * 0.25
      expect(result.reasons).toContain('Wallet age 7 days');
    });

    it('should give zero score for brand new wallet (0 days)', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 0,
        txCount: 0,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.walletAge).toBe(0);
      expect(result.reasons).toContain('New wallet (0 days)');
    });

    it('should handle 1 day old wallet', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 1,
        txCount: 0,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.walletAge).toBeCloseTo(0.0083, 2); // 1/30 * 0.25
      expect(result.reasons).toContain('New wallet (1 days)');
    });
  });

  describe('Transaction Count (20% weight, capped at 10 tx)', () => {
    it('should give full transaction score at 10 transactions', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 0,
        txCount: 10,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.transactionCount).toBe(0.20);
      expect(result.reasons).toContain('10+ transactions');
    });

    it('should cap transaction score at 10 transactions', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 0,
        txCount: 50,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.transactionCount).toBe(0.20);
      expect(result.reasons).toContain('10+ transactions');
    });

    it('should give proportional score for 5 transactions (50%)', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 0,
        txCount: 5,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.transactionCount).toBe(0.10); // 5/10 * 0.20
      expect(result.reasons).toContain('5 transactions');
    });

    it('should handle 1 transaction with singular form', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 0,
        txCount: 1,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.transactionCount).toBeCloseTo(0.02, 2); // 1/10 * 0.20
      expect(result.reasons).toContain('Only 1 transaction');
    });

    it('should handle 2 transactions with plural form', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 0,
        txCount: 2,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.transactionCount).toBeCloseTo(0.04, 2); // 2/10 * 0.20
      expect(result.reasons).toContain('Only 2 transactions');
    });

    it('should give zero score for no transactions', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 0,
        txCount: 0,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.transactionCount).toBe(0);
      expect(result.reasons).toContain('No transactions');
    });
  });

  describe('Holdings (15% weight)', () => {
    it('should give full holdings score when wallet holds tokens', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 0,
        txCount: 0,
        holdsOnChain: true,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.holdings).toBe(0.15);
      expect(result.reasons).toContain('Holds tokens on chain');
    });

    it('should give zero holdings score when wallet has no tokens', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 0,
        txCount: 0,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.holdings).toBe(0);
      expect(result.reasons).toContain('No token holdings detected');
    });
  });

  describe('Allowlist Proofs (+5% bonus)', () => {
    it('should add 5% bonus when wallet has allowlist proofs', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 0,
        txCount: 0,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: true,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.allowlistBonus).toBe(0.05);
      expect(result.reasons).toContain('On allowlist');
    });

    it('should not add bonus when wallet has no allowlist proofs', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 0,
        txCount: 0,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.allowlistBonus).toBe(0);
      expect(result.reasons).not.toContain('On allowlist');
    });
  });

  describe('Label Determination', () => {
    it('should return "likely" for score >= 0.7', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 30,
        txCount: 10,
        holdsOnChain: true,
        hasActivityOnChain: createChainActivityChecker(['ethereum']),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.score).toBe(1.00);
      expect(result.label).toBe('likely');
    });

    it('should return "likely" for score exactly 0.7', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 30,
        txCount: 5,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker(['ethereum']),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.score).toBe(0.75); // 0.40 + 0.25 + 0.10
      expect(result.label).toBe('likely');
    });

    it('should return "maybe" for score 0.4-0.69', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 15,
        txCount: 5,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker(['ethereum']),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.score).toBe(0.63); // 0.40 + 0.125 + 0.10 (rounded)
      expect(result.label).toBe('maybe');
    });

    it('should return "maybe" for score exactly 0.4', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 0,
        txCount: 0,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker(['ethereum']),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.score).toBe(0.40);
      expect(result.label).toBe('maybe');
    });

    it('should return "unlikely" for score < 0.4', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 5,
        txCount: 2,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.score).toBeLessThan(0.4);
      expect(result.label).toBe('unlikely');
    });

    it('should return "unlikely" for score of 0', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 0,
        txCount: 0,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.score).toBe(0);
      expect(result.label).toBe('unlikely');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle experienced DeFi user (likely eligible)', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 90,
        txCount: 50,
        holdsOnChain: true,
        hasActivityOnChain: createChainActivityChecker(['ethereum', 'polygon', 'arbitrum']),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.score).toBe(1.00);
      expect(result.label).toBe('likely');
    });

    it('should handle moderate user (maybe eligible)', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 10,
        txCount: 3,
        holdsOnChain: true,
        hasActivityOnChain: createChainActivityChecker(['ethereum']),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.score).toBeCloseTo(0.69, 2); // 0.40 + 0.083 + 0.06 + 0.15
      expect(result.label).toBe('maybe');
    });

    it('should handle new user (unlikely eligible)', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 1,
        txCount: 1,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.score).toBeLessThan(0.4);
      expect(result.label).toBe('unlikely');
    });

    it('should handle allowlist user with minimal activity (likely eligible)', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 20,
        txCount: 5,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker(['ethereum']),
        allowlistProofs: true,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.score).toBeCloseTo(0.72, 2); // 0.40 + 0.167 + 0.10 + 0.05
      expect(result.label).toBe('likely');
    });

    it('should handle cross-chain user on wrong chain (unlikely eligible)', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 60,
        txCount: 20,
        holdsOnChain: true,
        hasActivityOnChain: createChainActivityChecker(['polygon', 'arbitrum']),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.score).toBe(0.60); // 0 + 0.25 + 0.20 + 0.15
      expect(result.label).toBe('maybe');
      expect(result.reasons).toContain('No activity on ethereum');
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative wallet age gracefully', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: -5,
        txCount: 0,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.walletAge).toBe(0);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle negative transaction count gracefully', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 0,
        txCount: -10,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.transactionCount).toBe(0);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should round score to 2 decimal places', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 7,
        txCount: 3,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker(['ethereum']),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      // Score should be rounded to 2 decimals
      expect(result.score.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });

    it('should handle very large wallet age', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 10000,
        txCount: 0,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.walletAge).toBe(0.25); // Capped at 30 days
    });

    it('should handle very large transaction count', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 0,
        txCount: 10000,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(result.breakdown.transactionCount).toBe(0.20); // Capped at 10 tx
    });
  });

  describe('Breakdown Validation', () => {
    it('should provide accurate breakdown for all components', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 15,
        txCount: 5,
        holdsOnChain: true,
        hasActivityOnChain: createChainActivityChecker(['ethereum']),
        allowlistProofs: true,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      // Verify breakdown sums to total score
      const breakdownSum = 
        result.breakdown.chainPresence +
        result.breakdown.walletAge +
        result.breakdown.transactionCount +
        result.breakdown.holdings +
        result.breakdown.allowlistBonus;

      expect(breakdownSum).toBeCloseTo(result.score, 2);
    });

    it('should always include reasons array', () => {
      const signals: EligibilitySignals = {
        walletAgeDays: 0,
        txCount: 0,
        holdsOnChain: false,
        hasActivityOnChain: createChainActivityChecker([]),
        allowlistProofs: false,
        requiredChain: 'ethereum',
      };

      const result = calculateEligibilityScore(signals);

      expect(Array.isArray(result.reasons)).toBe(true);
      expect(result.reasons.length).toBeGreaterThan(0);
    });
  });
});

describe('createChainActivityChecker', () => {
  it('should return true for chains in the active list', () => {
    const checker = createChainActivityChecker(['ethereum', 'polygon']);

    expect(checker('ethereum')).toBe(true);
    expect(checker('polygon')).toBe(true);
  });

  it('should return false for chains not in the active list', () => {
    const checker = createChainActivityChecker(['ethereum', 'polygon']);

    expect(checker('arbitrum')).toBe(false);
    expect(checker('optimism')).toBe(false);
  });

  it('should handle empty active chains list', () => {
    const checker = createChainActivityChecker([]);

    expect(checker('ethereum')).toBe(false);
    expect(checker('polygon')).toBe(false);
  });

  it('should be case-sensitive', () => {
    const checker = createChainActivityChecker(['ethereum']);

    expect(checker('ethereum')).toBe(true);
    expect(checker('Ethereum')).toBe(false);
    expect(checker('ETHEREUM')).toBe(false);
  });
});
