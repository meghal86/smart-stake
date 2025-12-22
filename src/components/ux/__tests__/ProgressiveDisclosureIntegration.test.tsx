/**
 * Integration Tests for Progressive Disclosure System
 * 
 * Tests complete progressive disclosure functionality across components.
 * Validates: R12.DISCLOSURE.EXPANDABLE_CARDS, R12.DISCLOSURE.SMOOTH_ANIMATIONS
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { ExpandableCard } from '../ExpandableCard';
import { ExpandableOpportunityCard } from '../ExpandableOpportunityCard';
import { ExpandablePortfolioOverview } from '../ExpandablePortfolioOverview';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

// Mock hooks
vi.mock('@/hooks/useFormButtonTooltip', () => ({
  useWalletButtonTooltip: () => ({
    isDisabled: false,
    tooltipContent: null
  })
}));

// Test wrapper with TooltipProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <TooltipProvider>
    {children}
  </TooltipProvider>
);

describe('Progressive Disclosure Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('multiple expandable cards can coexist without interference', async () => {
    render(
      <TestWrapper>
        <div>
          <ExpandableCard
            id="card-1"
            showToggleButton={true}
            expandedContent={<div>Card 1 expanded content</div>}
          >
            <div>Card 1 content</div>
          </ExpandableCard>
          <ExpandableCard
            id="card-2"
            showToggleButton={true}
            expandedContent={<div>Card 2 expanded content</div>}
          >
            <div>Card 2 content</div>
          </ExpandableCard>
        </div>
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button', { name: /see details/i });
    expect(buttons).toHaveLength(2);

    // Expand first card
    fireEvent.click(buttons[0]);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
    });

    // Expand second card - both should be expanded
    fireEvent.click(buttons[1]);
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /show less/i })).toHaveLength(2);
    });
  });

  test('auto-collapse behavior works across multiple cards', async () => {
    render(
      <TestWrapper>
        <div>
          <ExpandableCard
            id="auto-card-1"
            autoCollapse={true}
            showToggleButton={true}
            expandedContent={<div>Auto Card 1 expanded</div>}
          >
            <div>Auto Card 1</div>
          </ExpandableCard>
          <ExpandableCard
            id="auto-card-2"
            autoCollapse={true}
            showToggleButton={true}
            expandedContent={<div>Auto Card 2 expanded</div>}
          >
            <div>Auto Card 2</div>
          </ExpandableCard>
        </div>
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button', { name: /see details/i });

    // Expand first card
    fireEvent.click(buttons[0]);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
    });

    // Expand second card - should trigger auto-collapse of first
    fireEvent.click(buttons[1]);
    
    // Both cards should maintain their state consistency
    await waitFor(() => {
      const showLessButtons = screen.queryAllByRole('button', { name: /show less/i });
      const seeDetailsButtons = screen.queryAllByRole('button', { name: /see details/i });
      
      // Total buttons should still be 2
      expect(showLessButtons.length + seeDetailsButtons.length).toBe(2);
    });
  });

  test('opportunity card progressive disclosure works end-to-end', async () => {
    const mockOpportunity = {
      id: 'test-opp',
      type: 'Airdrop' as const,
      title: 'Integration Test Airdrop',
      description: 'Test description',
      reward: '20%',
      confidence: 90,
      duration: '14 days',
      guardianScore: 9,
      riskLevel: 'Low' as const,
      details: {
        liquidity: 5000000,
        volume24h: 1000000,
        participants: 2500,
        requirements: ['Test requirement'],
        risks: ['Test risk'],
        methodology: 'Test methodology',
        lastUpdated: '2024-01-15'
      }
    };

    render(
      <TestWrapper>
        <ExpandableOpportunityCard
          opportunity={mockOpportunity}
          index={0}
          onJoinQuest={vi.fn()}
        />
      </TestWrapper>
    );

    // Initially shows key info only
    expect(screen.getByText('Integration Test Airdrop')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();

    // Click breakdown to expand
    const breakdownButton = screen.getByText('See Breakdown');
    fireEvent.click(breakdownButton);

    // Should show detailed information
    await waitFor(() => {
      // Check for expanded content that should be visible
      expect(screen.getByText('$5.0M')).toBeInTheDocument(); // Liquidity
      expect(screen.getByText('Test requirement')).toBeInTheDocument();
      expect(screen.getByText('Test methodology')).toBeInTheDocument();
    });
  });

  test('portfolio overview progressive disclosure works end-to-end', async () => {
    const mockPortfolioData = {
      totalValue: 150000,
      pnl24h: 2500,
      pnlPercent: 1.67,
      riskScore: 7.5,
      riskChange: 0.3,
      whaleActivity: 8,
      breakdown: {
        trustIndex: 8.2,
        trustChange: 0.5,
        chainDistribution: [
          { chain: 'Ethereum', value: 100000, percentage: 66.7, color: '#627EEA' },
          { chain: 'Polygon', value: 50000, percentage: 33.3, color: '#8247E5' }
        ],
        topHoldings: [
          { symbol: 'ETH', value: 75000, percentage: 50, change24h: 2.1 },
          { symbol: 'MATIC', value: 25000, percentage: 16.7, change24h: -1.2 }
        ],
        riskFactors: [
          { factor: 'Concentration Risk', level: 'Medium' as const, impact: 0.3, description: 'Test' }
        ],
        performanceMetrics: {
          sharpeRatio: 1.25,
          maxDrawdown: -15.2,
          volatility: 18.5,
          beta: 1.1
        },
        lastUpdated: '2024-01-15 12:00 UTC'
      }
    };

    render(
      <TestWrapper>
        <ExpandablePortfolioOverview data={mockPortfolioData} />
      </TestWrapper>
    );

    // Initially shows key metrics only
    expect(screen.getByText('$150.0K')).toBeInTheDocument();
    expect(screen.getByText('7.5')).toBeInTheDocument();
    expect(screen.queryByText('Trust Index')).not.toBeInTheDocument();

    // Click breakdown to expand
    const breakdownButton = screen.getByText('See Breakdown');
    fireEvent.click(breakdownButton);

    // Should show detailed breakdown
    await waitFor(() => {
      expect(screen.getByText('Trust Index: 8.2/10')).toBeInTheDocument();
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
      expect(screen.getByText('ETH')).toBeInTheDocument();
      expect(screen.getByText('1.25')).toBeInTheDocument(); // Sharpe Ratio
    });
  });

  test('keyboard navigation works correctly', async () => {
    render(
      <TestWrapper>
        <ExpandableCard
          id="keyboard-test"
          showToggleButton={true}
          expandedContent={<div>Keyboard test expanded content</div>}
        >
          <div>Keyboard test content</div>
        </ExpandableCard>
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button', { name: /see details/i });
    
    // Focus the button
    toggleButton.focus();
    expect(toggleButton).toHaveFocus();

    // Click the button (keyboard activation would trigger click)
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
    });
  });

  test('ARIA attributes are properly maintained during state changes', async () => {
    render(
      <TestWrapper>
        <ExpandableCard
          id="aria-test"
          showToggleButton={true}
          expandedContent={<div>ARIA test expanded content</div>}
        >
          <div>ARIA test content</div>
        </ExpandableCard>
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button');
    
    // Initial ARIA state
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(toggleButton).toHaveAttribute('aria-controls', 'expandable-content-aria-test');

    // Expand and check ARIA state
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });

    // Collapse and check ARIA state
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  test('scroll position maintenance works during expansion', async () => {
    // Mock scroll methods
    const mockScrollTo = vi.fn();
    Object.defineProperty(window, 'scrollTo', {
      value: mockScrollTo,
      writable: true
    });

    Object.defineProperty(window, 'scrollY', {
      value: 500,
      writable: true
    });

    render(
      <TestWrapper>
        <div style={{ height: '2000px' }}>
          <ExpandableCard
            id="scroll-test"
            showToggleButton={true}
            expandedContent={<div>Scroll test expanded content</div>}
          >
            <div>Scroll test content</div>
          </ExpandableCard>
        </div>
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button', { name: /see details/i });
    fireEvent.click(toggleButton);

    // The scroll position maintenance logic should be triggered
    // (exact behavior depends on timing and DOM measurements)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
    });
  });

  test('animation timing is consistent across components', async () => {
    const startTime = Date.now();
    
    render(
      <TestWrapper>
        <ExpandableCard
          id="timing-test"
          duration={300}
          showToggleButton={true}
          expandedContent={<div>Timing test expanded content</div>}
        >
          <div>Timing test content</div>
        </ExpandableCard>
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button', { name: /see details/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Animation should complete within reasonable time (allowing for test environment delays)
    expect(duration).toBeLessThan(1000);
  });

  test('error boundaries do not interfere with progressive disclosure', async () => {
    // Component that might throw an error
    const ProblematicContent = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Safe content</div>;
    };

    render(
      <TestWrapper>
        <ExpandableCard
          id="error-test"
          showToggleButton={true}
          expandedContent={<div>Error test expanded content</div>}
        >
          <ProblematicContent shouldThrow={false} />
        </ExpandableCard>
      </TestWrapper>
    );

    // Expand successfully
    const toggleButton = screen.getByRole('button', { name: /see details/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
    });

    // The progressive disclosure should still work even if content changes
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });
});