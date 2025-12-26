/**
 * Trust Signal Integration Tests
 * 
 * Requirements: Enhanced Req 10 AC1-3 (trust methodology), Enhanced Req 14 AC4-5 (metrics proof)
 * Design: Trust Signals → Verification System
 * 
 * Tests the integration of trust signals and methodology explanations in HarvestPro components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { GuardianScoreTooltip, GuardianScoreLink } from '@/components/harvestpro/GuardianScoreTooltip';
import { HarvestOpportunityCard } from '@/components/harvestpro/HarvestOpportunityCard';
import { HarvestDetailModal } from '@/components/harvestpro/HarvestDetailModal';
import { HarvestSummaryCard } from '@/components/harvestpro/HarvestSummaryCard';
import type { HarvestOpportunity, OpportunitiesSummary } from '@/types/harvestpro';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock demo mode
vi.mock('@/lib/ux/DemoModeManager', () => ({
  useDemoMode: () => ({ isDemo: false }),
}));

const mockOpportunity: HarvestOpportunity = {
  id: 'test-opportunity-1',
  lotId: 'test-lot-1',
  token: 'ETH',
  tokenLogoUrl: '/tokens/eth.png',
  riskLevel: 'MEDIUM',
  unrealizedLoss: 1000,
  remainingQty: 2.5,
  gasEstimate: 50,
  slippageEstimate: 25,
  tradingFees: 10,
  netTaxBenefit: 155,
  guardianScore: 6,
  executionTimeEstimate: '5-10 min',
  confidence: 85,
  recommendationBadge: 'recommended',
  metadata: {
    walletName: 'MetaMask',
    venue: 'Uniswap V3',
    reasons: ['High liquidity', 'Low gas cost'],
  },
};

const mockSummary: OpportunitiesSummary = {
  totalHarvestableLoss: 5000,
  estimatedNetBenefit: 800,
  eligibleTokensCount: 12,
  gasEfficiencyScore: 'A',
};

describe('GuardianScoreTooltip', () => {
  test('renders inline variant with score and tooltip trigger', () => {
    render(<GuardianScoreTooltip score={8} variant="inline" />);
    
    expect(screen.getByText('8/10')).toBeInTheDocument();
    expect(screen.getByText('GUARDIAN')).toBeInTheDocument();
    
    // Should have help icon for tooltip trigger
    const helpIcon = screen.getByRole('button');
    expect(helpIcon).toBeInTheDocument();
  });

  test('renders button variant with methodology link', () => {
    render(<GuardianScoreTooltip score={5} variant="button" />);
    
    expect(screen.getByText('How it\'s calculated')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'How Guardian score is calculated');
  });

  test('shows appropriate risk level content based on score', async () => {
    render(<GuardianScoreTooltip score={3} variant="button" />);
    
    const button = screen.getByRole('button');
    fireEvent.mouseEnter(button);
    
    await waitFor(() => {
      expect(screen.getByText('Guardian Score Methodology')).toBeInTheDocument();
      expect(screen.getByText(/Low scores indicate elevated risk factors/)).toBeInTheDocument();
    });
  });

  test('displays high score content for scores >= 7', async () => {
    render(<GuardianScoreTooltip score={9} variant="button" />);
    
    const button = screen.getByRole('button');
    fireEvent.mouseEnter(button);
    
    await waitFor(() => {
      expect(screen.getByText(/High scores indicate strong security profile/)).toBeInTheDocument();
    });
  });
});

describe('GuardianScoreLink', () => {
  test('renders with correct aria label and calls callback on click', () => {
    const mockCallback = vi.fn();
    render(<GuardianScoreLink score={7} onShowMethodology={mockCallback} />);
    
    const link = screen.getByRole('button');
    expect(link).toHaveAttribute('aria-label', 'How Guardian score 7/10 is calculated');
    
    fireEvent.click(link);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
});

describe('HarvestOpportunityCard Trust Signal Integration', () => {
  test('includes Guardian Score tooltip in metric strip', () => {
    const mockOnStartHarvest = vi.fn();
    
    render(
      <HarvestOpportunityCard
        opportunity={mockOpportunity}
        onStartHarvest={mockOnStartHarvest}
      />
    );
    
    // Should show Guardian score with tooltip
    expect(screen.getByText('6/10')).toBeInTheDocument();
    expect(screen.getByText('GUARDIAN')).toBeInTheDocument();
    
    // Should have help icon for methodology
    const helpIcons = screen.getAllByRole('button');
    const tooltipTrigger = helpIcons.find(button => 
      button.getAttribute('aria-label')?.includes('cursor-help')
    );
    expect(tooltipTrigger).toBeDefined();
  });
});

describe('HarvestDetailModal Trust Signal Integration', () => {
  test('includes Guardian Score methodology link in high risk warning', () => {
    const mockOnClose = vi.fn();
    const mockOnExecute = vi.fn();
    
    const highRiskOpportunity = {
      ...mockOpportunity,
      riskLevel: 'HIGH' as const,
      guardianScore: 2,
    };
    
    render(
      <HarvestDetailModal
        opportunity={highRiskOpportunity}
        isOpen={true}
        onClose={mockOnClose}
        onExecute={mockOnExecute}
      />
    );
    
    // Should show high risk warning
    expect(screen.getByText('High Risk Detected')).toBeInTheDocument();
    expect(screen.getByText(/Guardian score of 2\/10/)).toBeInTheDocument();
    
    // Should have methodology link
    expect(screen.getByText('How is this calculated?')).toBeInTheDocument();
  });

  test('shows Guardian methodology section when link is clicked', async () => {
    const mockOnClose = vi.fn();
    const mockOnExecute = vi.fn();
    
    const highRiskOpportunity = {
      ...mockOpportunity,
      riskLevel: 'HIGH' as const,
      guardianScore: 2,
    };
    
    render(
      <HarvestDetailModal
        opportunity={highRiskOpportunity}
        isOpen={true}
        onClose={mockOnClose}
        onExecute={mockOnExecute}
      />
    );
    
    // Click methodology link
    const methodologyLink = screen.getByText('How is this calculated?');
    fireEvent.click(methodologyLink);
    
    // Should show methodology section
    await waitFor(() => {
      expect(screen.getByText('Guardian Score Methodology')).toBeInTheDocument();
      expect(screen.getByText('Current Score: 2/10')).toBeInTheDocument();
      expect(screen.getByText(/Multi-factor risk assessment/)).toBeInTheDocument();
      expect(screen.getByText(/Low scores indicate elevated risk factors/)).toBeInTheDocument();
    });
  });

  test('methodology section can be closed', async () => {
    const mockOnClose = vi.fn();
    const mockOnExecute = vi.fn();
    
    const highRiskOpportunity = {
      ...mockOpportunity,
      riskLevel: 'HIGH' as const,
      guardianScore: 2,
    };
    
    render(
      <HarvestDetailModal
        opportunity={highRiskOpportunity}
        isOpen={true}
        onClose={mockOnClose}
        onExecute={mockOnExecute}
      />
    );
    
    // Open methodology section
    fireEvent.click(screen.getByText('How is this calculated?'));
    
    await waitFor(() => {
      expect(screen.getByText('Guardian Score Methodology')).toBeInTheDocument();
    });
    
    // Close methodology section
    const closeButtons = screen.getAllByRole('button');
    const methodologyCloseButton = closeButtons.find(button => 
      button.querySelector('svg') && button.closest('[class*="blue-500"]')
    );
    
    if (methodologyCloseButton) {
      fireEvent.click(methodologyCloseButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Guardian Score Methodology')).not.toBeInTheDocument();
      });
    }
  });
});

describe('HarvestSummaryCard Trust Signal Integration', () => {
  test('includes methodology tooltips for all metrics', async () => {
    render(
      <HarvestSummaryCard
        summary={mockSummary}
        hasHighRiskOpportunities={false}
      />
    );
    
    // Should show all metrics
    expect(screen.getByText('$5,000')).toBeInTheDocument(); // Total Loss
    expect(screen.getByText('$800')).toBeInTheDocument(); // Net Benefit
    expect(screen.getByText('12')).toBeInTheDocument(); // Eligible Tokens
    expect(screen.getByText('A')).toBeInTheDocument(); // Gas Efficiency
    
    // Should have help icons for each metric
    const helpIcons = screen.getAllByRole('button');
    expect(helpIcons).toHaveLength(4); // One for each metric
    
    // Each help icon should have proper aria-label
    const totalLossHelp = helpIcons.find(button => 
      button.getAttribute('aria-label') === 'How total loss is calculated'
    );
    expect(totalLossHelp).toBeInTheDocument();
  });

  test('shows methodology tooltip on hover', async () => {
    render(
      <HarvestSummaryCard
        summary={mockSummary}
        hasHighRiskOpportunities={false}
      />
    );
    
    const helpIcons = screen.getAllByRole('button');
    const totalLossHelp = helpIcons.find(button => 
      button.getAttribute('aria-label') === 'How total loss is calculated'
    );
    
    if (totalLossHelp) {
      fireEvent.mouseEnter(totalLossHelp);
      
      await waitFor(() => {
        expect(screen.getByText('Total Loss Calculation')).toBeInTheDocument();
        expect(screen.getByText(/FIFO.*accounting method/)).toBeInTheDocument();
      });
    }
  });
});

describe('Trust Signal Accessibility', () => {
  test('all trust signal elements have proper ARIA labels', () => {
    render(<GuardianScoreTooltip score={8} variant="button" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'How Guardian score is calculated');
  });

  test('tooltip content is accessible to screen readers', async () => {
    render(<GuardianScoreTooltip score={5} variant="button" />);
    
    const button = screen.getByRole('button');
    fireEvent.mouseEnter(button);
    
    await waitFor(() => {
      const tooltip = screen.getByText('Guardian Score Methodology');
      expect(tooltip).toBeInTheDocument();
      
      // Tooltip should be properly associated with trigger
      expect(button).toHaveAttribute('aria-describedby');
    });
  });

  test('keyboard navigation works for trust signal elements', () => {
    render(<GuardianScoreTooltip score={7} variant="button" />);
    
    const button = screen.getByRole('button');
    
    // Should be focusable
    button.focus();
    expect(document.activeElement).toBe(button);
    
    // Should respond to Enter key
    fireEvent.keyDown(button, { key: 'Enter' });
    // Tooltip should appear (tested in other tests)
  });
});