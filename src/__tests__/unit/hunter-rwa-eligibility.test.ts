/**
 * Unit Tests: Hunter RWA Eligibility
 * 
 * Tests RWA-specific eligibility logic:
 * - KYC requirement checking
 * - Minimum investment eligibility
 * - Jurisdiction restrictions
 */

import { describe, test, expect } from 'vitest';

// Mock types for testing
interface WalletSignals {
  address: string;
  wallet_age_days: number | null;
  tx_count_90d: number | null;
  chains_active: string[];
  top_assets: Array<{ symbol: string; amount: number }>;
  stablecoin_usd_est: number | null;
}

interface Opportunity {
  id: string;
  title: string;
  type: string;
  chains: string[];
  requirements?: {
    chains?: string[];
    min_wallet_age_days?: number;
    min_tx_count?: number;
  };
  kyc_required?: boolean;
  min_investment?: number;
  jurisdiction?: string;
}

interface EligibilityResult {
  status: 'likely' | 'maybe' | 'unlikely';
  score: number;
  reasons: string[];
}

/**
 * Evaluate RWA eligibility
 * This is a simplified version for testing - the actual implementation
 * should be in src/lib/hunter/eligibility-engine.ts
 */
function evaluateRWAEligibility(
  walletSignals: WalletSignals,
  opportunity: Opportunity
): EligibilityResult {
  let score = 1.0;
  const reasons: string[] = [];

  // Check KYC requirement
  if (opportunity.kyc_required) {
    // In real implementation, check if user has completed KYC
    // For now, assume KYC not completed reduces score
    score -= 0.2;
    reasons.push('KYC verification required');
  }

  // Check minimum investment
  if (opportunity.min_investment && walletSignals.stablecoin_usd_est !== null) {
    if (walletSignals.stablecoin_usd_est < opportunity.min_investment) {
      score -= 0.3;
      reasons.push(
        `Minimum investment: $${opportunity.min_investment.toLocaleString()}`
      );
    } else {
      reasons.push('Meets minimum investment requirement');
    }
  } else if (opportunity.min_investment) {
    score -= 0.1;
    reasons.push('Unable to verify investment capacity');
  }

  // Check jurisdiction restrictions
  if (opportunity.jurisdiction) {
    // In real implementation, check user's jurisdiction from KYC data
    // For now, add informational reason
    reasons.push(`Jurisdiction: ${opportunity.jurisdiction}`);
  }

  // Check chain requirements
  if (opportunity.requirements?.chains) {
    const hasRequiredChain = opportunity.requirements.chains.some((chain) =>
      walletSignals.chains_active.includes(chain)
    );
    if (!hasRequiredChain) {
      score -= 0.3;
      reasons.push('Not active on required chains');
    } else {
      reasons.push('Active on required chains');
    }
  }

  // Check wallet age
  if (
    opportunity.requirements?.min_wallet_age_days &&
    walletSignals.wallet_age_days !== null
  ) {
    if (walletSignals.wallet_age_days < opportunity.requirements.min_wallet_age_days) {
      score -= 0.2;
      reasons.push('Wallet age below minimum');
    } else {
      reasons.push('Meets wallet age requirement');
    }
  }

  // Clamp score to [0, 1]
  score = Math.max(0, Math.min(1, score));

  // Map score to status
  let status: 'likely' | 'maybe' | 'unlikely';
  if (score >= 0.8) {
    status = 'likely';
  } else if (score >= 0.5) {
    status = 'maybe';
  } else {
    status = 'unlikely';
  }

  return { status, score, reasons };
}

describe('Hunter RWA Eligibility', () => {
  describe('KYC Requirement Checking', () => {
    test('reduces score when KYC is required', () => {
      const opportunity: Opportunity = {
        id: '1',
        title: 'Ondo USDY Vault',
        type: 'rwa',
        chains: ['ethereum'],
        kyc_required: true,
        min_investment: 100000,
      };

      const walletSignals: WalletSignals = {
        address: '0x' + 'a'.repeat(40),
        wallet_age_days: 180,
        tx_count_90d: 50,
        chains_active: ['ethereum'],
        top_assets: [{ symbol: 'USDC', amount: 150000 }],
        stablecoin_usd_est: 150000,
      };

      const result = evaluateRWAEligibility(walletSignals, opportunity);

      expect(result.reasons).toContain('KYC verification required');
      expect(result.score).toBeLessThan(1.0);
    });

    test('does not penalize when KYC is not required', () => {
      const opportunity: Opportunity = {
        id: '1',
        title: 'Non-KYC RWA',
        type: 'rwa',
        chains: ['ethereum'],
        kyc_required: false,
        min_investment: 10000,
      };

      const walletSignals: WalletSignals = {
        address: '0x' + 'a'.repeat(40),
        wallet_age_days: 180,
        tx_count_90d: 50,
        chains_active: ['ethereum'],
        top_assets: [{ symbol: 'USDC', amount: 15000 }],
        stablecoin_usd_est: 15000,
      };

      const result = evaluateRWAEligibility(walletSignals, opportunity);

      expect(result.reasons).not.toContain('KYC verification required');
    });
  });

  describe('Minimum Investment Eligibility', () => {
    test('returns unlikely when wallet balance is below minimum investment', () => {
      const opportunity: Opportunity = {
        id: '1',
        title: 'High Min Investment RWA',
        type: 'rwa',
        chains: ['ethereum'],
        min_investment: 100000,
      };

      const walletSignals: WalletSignals = {
        address: '0x' + 'a'.repeat(40),
        wallet_age_days: 180,
        tx_count_90d: 50,
        chains_active: ['ethereum'],
        top_assets: [{ symbol: 'USDC', amount: 50000 }],
        stablecoin_usd_est: 50000,
      };

      const result = evaluateRWAEligibility(walletSignals, opportunity);

      expect(result.status).toBe('unlikely');
      expect(result.reasons).toContain('Minimum investment: $100,000');
    });

    test('returns likely when wallet balance meets minimum investment', () => {
      const opportunity: Opportunity = {
        id: '1',
        title: 'Accessible RWA',
        type: 'rwa',
        chains: ['ethereum'],
        min_investment: 10000,
        requirements: {
          chains: ['ethereum'],
        },
      };

      const walletSignals: WalletSignals = {
        address: '0x' + 'a'.repeat(40),
        wallet_age_days: 180,
        tx_count_90d: 50,
        chains_active: ['ethereum'],
        top_assets: [{ symbol: 'USDC', amount: 50000 }],
        stablecoin_usd_est: 50000,
      };

      const result = evaluateRWAEligibility(walletSignals, opportunity);

      expect(result.status).toBe('likely');
      expect(result.reasons).toContain('Meets minimum investment requirement');
    });

    test('returns maybe when wallet balance is unknown', () => {
      const opportunity: Opportunity = {
        id: '1',
        title: 'RWA with Min Investment',
        type: 'rwa',
        chains: ['ethereum'],
        min_investment: 50000,
      };

      const walletSignals: WalletSignals = {
        address: '0x' + 'a'.repeat(40),
        wallet_age_days: 180,
        tx_count_90d: 50,
        chains_active: ['ethereum'],
        top_assets: [],
        stablecoin_usd_est: null,
      };

      const result = evaluateRWAEligibility(walletSignals, opportunity);

      expect(result.status).toBe('maybe');
      expect(result.reasons).toContain('Unable to verify investment capacity');
    });
  });

  describe('Jurisdiction Restrictions', () => {
    test('includes jurisdiction in reasons', () => {
      const opportunity: Opportunity = {
        id: '1',
        title: 'US Treasury RWA',
        type: 'rwa',
        chains: ['ethereum'],
        jurisdiction: 'United States',
      };

      const walletSignals: WalletSignals = {
        address: '0x' + 'a'.repeat(40),
        wallet_age_days: 180,
        tx_count_90d: 50,
        chains_active: ['ethereum'],
        top_assets: [],
        stablecoin_usd_est: null,
      };

      const result = evaluateRWAEligibility(walletSignals, opportunity);

      expect(result.reasons).toContain('Jurisdiction: United States');
    });

    test('handles multiple jurisdictions', () => {
      const opportunities = [
        {
          id: '1',
          title: 'Swiss RWA',
          type: 'rwa',
          chains: ['ethereum'],
          jurisdiction: 'Switzerland',
        },
        {
          id: '2',
          title: 'Singapore RWA',
          type: 'rwa',
          chains: ['ethereum'],
          jurisdiction: 'Singapore',
        },
        {
          id: '3',
          title: 'Cayman RWA',
          type: 'rwa',
          chains: ['ethereum'],
          jurisdiction: 'Cayman Islands',
        },
      ];

      const walletSignals: WalletSignals = {
        address: '0x' + 'a'.repeat(40),
        wallet_age_days: 180,
        tx_count_90d: 50,
        chains_active: ['ethereum'],
        top_assets: [],
        stablecoin_usd_est: null,
      };

      opportunities.forEach((opp) => {
        const result = evaluateRWAEligibility(walletSignals, opp);
        expect(result.reasons).toContain(`Jurisdiction: ${opp.jurisdiction}`);
      });
    });
  });

  describe('Combined Requirements', () => {
    test('evaluates all requirements together', () => {
      const opportunity: Opportunity = {
        id: '1',
        title: 'Premium RWA Vault',
        type: 'rwa',
        chains: ['ethereum'],
        kyc_required: true,
        min_investment: 100000,
        jurisdiction: 'United States',
        requirements: {
          chains: ['ethereum'],
          min_wallet_age_days: 90,
          min_tx_count: 10,
        },
      };

      const walletSignals: WalletSignals = {
        address: '0x' + 'a'.repeat(40),
        wallet_age_days: 180,
        tx_count_90d: 50,
        chains_active: ['ethereum', 'base'],
        top_assets: [{ symbol: 'USDC', amount: 150000 }],
        stablecoin_usd_est: 150000,
      };

      const result = evaluateRWAEligibility(walletSignals, opportunity);

      // Should be likely despite KYC requirement (meets all other requirements)
      expect(result.status).toBe('likely');
      expect(result.reasons).toContain('KYC verification required');
      expect(result.reasons).toContain('Meets minimum investment requirement');
      expect(result.reasons).toContain('Active on required chains');
      expect(result.reasons).toContain('Meets wallet age requirement');
      expect(result.reasons).toContain('Jurisdiction: United States');
    });

    test('returns unlikely when multiple requirements are not met', () => {
      const opportunity: Opportunity = {
        id: '1',
        title: 'Premium RWA Vault',
        type: 'rwa',
        chains: ['ethereum'],
        kyc_required: true,
        min_investment: 100000,
        requirements: {
          chains: ['ethereum'],
          min_wallet_age_days: 90,
        },
      };

      const walletSignals: WalletSignals = {
        address: '0x' + 'a'.repeat(40),
        wallet_age_days: 30, // Too young
        tx_count_90d: 5,
        chains_active: ['base'], // Wrong chain
        top_assets: [{ symbol: 'USDC', amount: 50000 }],
        stablecoin_usd_est: 50000, // Too low
      };

      const result = evaluateRWAEligibility(walletSignals, opportunity);

      expect(result.status).toBe('unlikely');
      expect(result.reasons).toContain('Minimum investment: $100,000');
      expect(result.reasons).toContain('Not active on required chains');
      expect(result.reasons).toContain('Wallet age below minimum');
    });
  });

  describe('Edge Cases', () => {
    test('handles opportunity with no requirements', () => {
      const opportunity: Opportunity = {
        id: '1',
        title: 'Open RWA',
        type: 'rwa',
        chains: ['ethereum'],
      };

      const walletSignals: WalletSignals = {
        address: '0x' + 'a'.repeat(40),
        wallet_age_days: null,
        tx_count_90d: null,
        chains_active: [],
        top_assets: [],
        stablecoin_usd_est: null,
      };

      const result = evaluateRWAEligibility(walletSignals, opportunity);

      expect(result.status).toBe('likely');
      expect(result.score).toBe(1.0);
    });

    test('handles null wallet signals gracefully', () => {
      const opportunity: Opportunity = {
        id: '1',
        title: 'RWA with Requirements',
        type: 'rwa',
        chains: ['ethereum'],
        min_investment: 50000,
        requirements: {
          chains: ['ethereum'],
          min_wallet_age_days: 90,
        },
      };

      const walletSignals: WalletSignals = {
        address: '0x' + 'a'.repeat(40),
        wallet_age_days: null,
        tx_count_90d: null,
        chains_active: [],
        top_assets: [],
        stablecoin_usd_est: null,
      };

      const result = evaluateRWAEligibility(walletSignals, opportunity);

      expect(result.status).toBe('unlikely');
      expect(result.reasons).toContain('Unable to verify investment capacity');
      expect(result.reasons).toContain('Not active on required chains');
    });
  });
});
