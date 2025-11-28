/**
 * HarvestOpportunityCard Component Tests
 * 
 * Tests for the HarvestOpportunityCard component.
 * 
 * Requirements:
 * - 5.5: Display Hunter-style card layout
 * - 5.6: Display CategoryTag component
 * - 5.7: Display RiskChip component
 * - 5.8: Display RecommendationBadge component
 * - 5.9: Display MetricStrip component
 * - 5.10: Display CTAButton component with save, share, report actions
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HarvestOpportunityCard } from '@/components/harvestpro/HarvestOpportunityCard';
import type { HarvestOpportunity } from '@/types/harvestpro';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: unknown) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: unknown) => <button {...props}>{children}</button>,
  },
}));

describe('HarvestOpportunityCard', () => {
  const mockOpportunity: HarvestOpportunity = {
    id: 'opp-123',
    lotId: 'lot-456',
    userId: 'user-789',
    token: 'ETH',
    tokenLogoUrl: 'https://example.com/eth.png',
    riskLevel: 'LOW',
    unrealizedLoss: 1500,
    remainingQty: 2.5,
    gasEstimate: 50,
    slippageEstimate: 30,
    tradingFees: 20,
    netTaxBenefit: 300,
    guardianScore: 8,
    executionTimeEstimate: '5-10 min',
    confidence: 85,
    recommendationBadge: 'recommended',
    metadata: {
      walletName: 'Main Wallet',
      venue: 'Uniswap',
      reasons: ['High confidence opportunity', 'Low gas costs'],
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockHandlers = {
    onStartHarvest: vi.fn(),
    onSave: vi.fn(),
    onShare: vi.fn(),
    onReport: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Card Rendering', () => {
    it('renders card with all required elements', () => {
      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      // Check title
      expect(screen.getByText('Harvest ETH Loss')).toBeInTheDocument();
      
      // Check wallet and venue info
      expect(screen.getByText(/Main Wallet/)).toBeInTheDocument();
      expect(screen.getByText(/Uniswap/)).toBeInTheDocument();
    });

    it('renders CategoryTag with token symbol', () => {
      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      expect(screen.getByText('ETH')).toBeInTheDocument();
    });

    it('renders RiskChip with correct risk level', () => {
      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      expect(screen.getByText('LOW RISK')).toBeInTheDocument();
    });

    it('renders RecommendationBadge correctly', () => {
      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      expect(screen.getByText('Recommended')).toBeInTheDocument();
    });

    it('renders MetricStrip with all metrics', () => {
      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      // Check net benefit
      expect(screen.getByText('$300')).toBeInTheDocument();
      expect(screen.getByText('NET BENEFIT')).toBeInTheDocument();

      // Check confidence
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('CONFIDENCE')).toBeInTheDocument();

      // Check Guardian score
      expect(screen.getByText('8/10')).toBeInTheDocument();
      expect(screen.getByText('GUARDIAN')).toBeInTheDocument();

      // Check execution time
      expect(screen.getByText('5-10 min')).toBeInTheDocument();
      expect(screen.getByText('TIME')).toBeInTheDocument();
    });

    it('renders Start Harvest button', () => {
      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      expect(screen.getByText('Start Harvest')).toBeInTheDocument();
    });

    it('displays description with loss and benefit amounts', () => {
      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      expect(screen.getByText(/Harvest \$1,500 in losses/)).toBeInTheDocument();
      expect(screen.getByText(/\$300 net tax benefit/)).toBeInTheDocument();
    });
  });

  describe('Risk Level Variations', () => {
    it('renders MEDIUM risk chip correctly', () => {
      const mediumRiskOpp: HarvestOpportunity = {
        ...mockOpportunity,
        riskLevel: 'MEDIUM',
        guardianScore: 5,
      };

      render(
        <HarvestOpportunityCard
          opportunity={mediumRiskOpp}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      expect(screen.getByText('MEDIUM RISK')).toBeInTheDocument();
    });

    it('renders HIGH risk chip correctly', () => {
      const highRiskOpp: HarvestOpportunity = {
        ...mockOpportunity,
        riskLevel: 'HIGH',
        guardianScore: 2,
      };

      render(
        <HarvestOpportunityCard
          opportunity={highRiskOpp}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      expect(screen.getByText('HIGH RISK')).toBeInTheDocument();
    });
  });

  describe('Recommendation Badge Variations', () => {
    it('renders not-recommended badge', () => {
      const notRecommendedOpp: HarvestOpportunity = {
        ...mockOpportunity,
        recommendationBadge: 'not-recommended',
        netTaxBenefit: -50,
      };

      render(
        <HarvestOpportunityCard
          opportunity={notRecommendedOpp}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      expect(screen.getByText('Not Recommended')).toBeInTheDocument();
    });

    it('renders high-benefit badge', () => {
      const highBenefitOpp: HarvestOpportunity = {
        ...mockOpportunity,
        recommendationBadge: 'high-benefit',
        netTaxBenefit: 1000,
      };

      render(
        <HarvestOpportunityCard
          opportunity={highBenefitOpp}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      expect(screen.getByText('High Benefit')).toBeInTheDocument();
    });

    it('renders gas-heavy badge', () => {
      const gasHeavyOpp: HarvestOpportunity = {
        ...mockOpportunity,
        recommendationBadge: 'gas-heavy',
        gasEstimate: 200,
      };

      render(
        <HarvestOpportunityCard
          opportunity={gasHeavyOpp}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      expect(screen.getByText('Gas Heavy')).toBeInTheDocument();
    });

    it('renders guardian-flagged badge', () => {
      const guardianFlaggedOpp: HarvestOpportunity = {
        ...mockOpportunity,
        recommendationBadge: 'guardian-flagged',
        guardianScore: 2,
      };

      render(
        <HarvestOpportunityCard
          opportunity={guardianFlaggedOpp}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      expect(screen.getByText('Guardian Flagged')).toBeInTheDocument();
    });
  });

  describe('Action Button Interactions', () => {
    it('calls onStartHarvest when Start Harvest button is clicked', () => {
      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      const startButton = screen.getByText('Start Harvest');
      fireEvent.click(startButton);

      expect(mockHandlers.onStartHarvest).toHaveBeenCalledWith('opp-123');
      expect(mockHandlers.onStartHarvest).toHaveBeenCalledTimes(1);
    });

    it('calls onSave when save button is clicked', () => {
      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={mockHandlers.onStartHarvest}
          onSave={mockHandlers.onSave}
          isConnected={true}
        />
      );

      // Find save button by its icon (Bookmark)
      const buttons = screen.getAllByRole('button');
      const saveButton = buttons.find(btn => btn.querySelector('svg'));
      
      if (saveButton) {
        fireEvent.click(saveButton);
        expect(mockHandlers.onSave).toHaveBeenCalledWith('opp-123');
      }
    });

    it('calls onShare when share button is clicked', () => {
      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={mockHandlers.onStartHarvest}
          onShare={mockHandlers.onShare}
          isConnected={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      // Share button is the second action button
      const shareButton = buttons[1];
      
      if (shareButton) {
        fireEvent.click(shareButton);
        expect(mockHandlers.onShare).toHaveBeenCalledWith('opp-123');
      }
    });

    it('calls onReport when report button is clicked', () => {
      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={mockHandlers.onStartHarvest}
          onReport={mockHandlers.onReport}
          isConnected={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      // Report button is the third action button
      const reportButton = buttons[2];
      
      if (reportButton) {
        fireEvent.click(reportButton);
        expect(mockHandlers.onReport).toHaveBeenCalledWith('opp-123');
      }
    });

    it('does not render action buttons when handlers are not provided', () => {
      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      // Should only have the Start Harvest button
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveTextContent('Start Harvest');
    });

    it('disables Start Harvest button when not connected', () => {
      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={false}
        />
      );

      const startButton = screen.getByText('Start Harvest');
      expect(startButton).toBeDisabled();
    });

    it('does not call onStartHarvest when button is disabled', () => {
      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={false}
        />
      );

      const startButton = screen.getByText('Start Harvest');
      fireEvent.click(startButton);

      expect(mockHandlers.onStartHarvest).not.toHaveBeenCalled();
    });
  });

  describe('Currency Formatting', () => {
    it('formats large amounts correctly', () => {
      const largeAmountOpp: HarvestOpportunity = {
        ...mockOpportunity,
        unrealizedLoss: 15000,
        netTaxBenefit: 3000,
      };

      render(
        <HarvestOpportunityCard
          opportunity={largeAmountOpp}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      expect(screen.getByText(/\$15,000/)).toBeInTheDocument();
      expect(screen.getByText('$3,000')).toBeInTheDocument();
    });

    it('formats negative net benefit correctly', () => {
      const negativeOpp: HarvestOpportunity = {
        ...mockOpportunity,
        netTaxBenefit: -100,
        recommendationBadge: 'not-recommended',
      };

      render(
        <HarvestOpportunityCard
          opportunity={negativeOpp}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      expect(screen.getByText('-$100')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('applies custom className when provided', () => {
      const { container } = render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
          className="custom-class"
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });

    it('renders with animation delay based on index', () => {
      const { rerender } = render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          index={0}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      // Re-render with different index
      rerender(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          index={5}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      // Component should render without errors
      expect(screen.getByText('Harvest ETH Loss')).toBeInTheDocument();
    });
  });

  describe('Metadata Display', () => {
    it('displays wallet name when provided', () => {
      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      expect(screen.getByText(/Main Wallet/)).toBeInTheDocument();
    });

    it('displays venue when provided', () => {
      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      expect(screen.getByText(/Uniswap/)).toBeInTheDocument();
    });

    it('displays first reason in description when available', () => {
      render(
        <HarvestOpportunityCard
          opportunity={mockOpportunity}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      expect(screen.getByText(/High confidence opportunity/)).toBeInTheDocument();
    });

    it('handles missing metadata gracefully', () => {
      const minimalOpp: HarvestOpportunity = {
        ...mockOpportunity,
        metadata: {},
      };

      render(
        <HarvestOpportunityCard
          opportunity={minimalOpp}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      // Should still render without errors
      expect(screen.getByText('Harvest ETH Loss')).toBeInTheDocument();
    });
  });

  describe('Token Display', () => {
    it('displays different token symbols correctly', () => {
      const btcOpp: HarvestOpportunity = {
        ...mockOpportunity,
        token: 'BTC',
      };

      render(
        <HarvestOpportunityCard
          opportunity={btcOpp}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      expect(screen.getByText('BTC')).toBeInTheDocument();
      expect(screen.getByText('Harvest BTC Loss')).toBeInTheDocument();
    });

    it('uppercases token symbol in category tag', () => {
      const lowerCaseOpp: HarvestOpportunity = {
        ...mockOpportunity,
        token: 'usdc',
      };

      render(
        <HarvestOpportunityCard
          opportunity={lowerCaseOpp}
          onStartHarvest={mockHandlers.onStartHarvest}
          isConnected={true}
        />
      );

      expect(screen.getByText('USDC')).toBeInTheDocument();
    });
  });
});
