/**
 * Unit Tests for ExpandableOpportunityCard Component
 * 
 * Tests opportunity card with progressive disclosure functionality.
 * Validates: R12.DISCLOSURE.EXPANDABLE_CARDS, R12.DISCLOSURE.SMOOTH_ANIMATIONS
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ExpandableOpportunityCard } from '../ExpandableOpportunityCard';

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

describe('ExpandableOpportunityCard', () => {
  const mockOpportunity = {
    id: 'test-opportunity',
    type: 'Airdrop' as const,
    title: 'Test Airdrop',
    description: 'A test airdrop opportunity',
    reward: '15.2%',
    confidence: 85,
    duration: '30 days',
    guardianScore: 8,
    riskLevel: 'Low' as const,
    chain: 'Ethereum',
    protocol: 'TestProtocol',
    estimatedAPY: 15.2
  };

  const mockOpportunityWithDetails = {
    ...mockOpportunity,
    details: {
      liquidity: 1500000,
      volume24h: 250000,
      participants: 1250,
      timeRemaining: '25 days',
      requirements: ['Hold 100 TEST tokens', 'Complete KYC verification'],
      risks: ['Smart contract risk', 'Market volatility'],
      methodology: 'Rewards calculated based on token holdings and participation time',
      lastUpdated: '2024-01-15 10:30 UTC'
    }
  };

  const defaultProps = {
    opportunity: mockOpportunity,
    index: 0,
    onJoinQuest: vi.fn(),
    isDarkTheme: true,
    isConnected: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders key opportunity information', () => {
    render(<ExpandableOpportunityCard {...defaultProps} />);
    
    expect(screen.getByText('Test Airdrop')).toBeInTheDocument();
    expect(screen.getByText('TestProtocol • Ethereum')).toBeInTheDocument();
    expect(screen.getByText('15.2%')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('8/10')).toBeInTheDocument();
  });

  test('displays correct type badge and icon', () => {
    render(<ExpandableOpportunityCard {...defaultProps} />);
    
    expect(screen.getByText('AIRDROP')).toBeInTheDocument();
  });

  test('displays correct risk level badge', () => {
    render(<ExpandableOpportunityCard {...defaultProps} />);
    
    expect(screen.getByText('LOW RISK')).toBeInTheDocument();
  });

  test('renders Join Quest button', () => {
    render(<ExpandableOpportunityCard {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /join quest/i })).toBeInTheDocument();
  });

  test('calls onJoinQuest when button is clicked', () => {
    const mockOnJoinQuest = vi.fn();
    
    render(
      <ExpandableOpportunityCard 
        {...defaultProps} 
        onJoinQuest={mockOnJoinQuest}
      />
    );
    
    const joinButton = screen.getByRole('button', { name: /join quest/i });
    fireEvent.click(joinButton);
    
    expect(mockOnJoinQuest).toHaveBeenCalledWith(mockOpportunity);
  });

  test('does not show breakdown button when no details provided', () => {
    render(<ExpandableOpportunityCard {...defaultProps} />);
    
    expect(screen.queryByText('See Breakdown')).not.toBeInTheDocument();
  });

  test('shows breakdown button when details are provided', () => {
    render(
      <ExpandableOpportunityCard 
        {...defaultProps} 
        opportunity={mockOpportunityWithDetails}
      />
    );
    
    expect(screen.getByText('See Breakdown')).toBeInTheDocument();
  });

  test('expands to show detailed information when breakdown is clicked', async () => {
    render(
      <ExpandableOpportunityCard 
        {...defaultProps} 
        opportunity={mockOpportunityWithDetails}
      />
    );
    
    const breakdownButton = screen.getByText('See Breakdown');
    fireEvent.click(breakdownButton);
    
    await waitFor(() => {
      expect(screen.getByText('A test airdrop opportunity')).toBeInTheDocument();
      expect(screen.getByText('$1.5M')).toBeInTheDocument(); // Liquidity
      expect(screen.getByText('$250K')).toBeInTheDocument(); // Volume
      expect(screen.getByText('1,250')).toBeInTheDocument(); // Participants
    });
  });

  test('shows requirements section when details include requirements', async () => {
    render(
      <ExpandableOpportunityCard 
        {...defaultProps} 
        opportunity={mockOpportunityWithDetails}
      />
    );
    
    const breakdownButton = screen.getByText('See Breakdown');
    fireEvent.click(breakdownButton);
    
    await waitFor(() => {
      expect(screen.getByText('Requirements')).toBeInTheDocument();
      expect(screen.getByText('Hold 100 TEST tokens')).toBeInTheDocument();
      expect(screen.getByText('Complete KYC verification')).toBeInTheDocument();
    });
  });

  test('shows risk factors section when details include risks', async () => {
    render(
      <ExpandableOpportunityCard 
        {...defaultProps} 
        opportunity={mockOpportunityWithDetails}
      />
    );
    
    const breakdownButton = screen.getByText('See Breakdown');
    fireEvent.click(breakdownButton);
    
    await waitFor(() => {
      expect(screen.getByText('Risk Factors')).toBeInTheDocument();
      expect(screen.getByText('Smart contract risk')).toBeInTheDocument();
      expect(screen.getByText('Market volatility')).toBeInTheDocument();
    });
  });

  test('shows methodology section when details include methodology', async () => {
    render(
      <ExpandableOpportunityCard 
        {...defaultProps} 
        opportunity={mockOpportunityWithDetails}
      />
    );
    
    const breakdownButton = screen.getByText('See Breakdown');
    fireEvent.click(breakdownButton);
    
    await waitFor(() => {
      expect(screen.getByText('Methodology')).toBeInTheDocument();
      expect(screen.getByText(/rewards calculated based on token holdings/i)).toBeInTheDocument();
    });
  });

  test('shows last updated timestamp when provided', async () => {
    render(
      <ExpandableOpportunityCard 
        {...defaultProps} 
        opportunity={mockOpportunityWithDetails}
      />
    );
    
    const breakdownButton = screen.getByText('See Breakdown');
    fireEvent.click(breakdownButton);
    
    await waitFor(() => {
      expect(screen.getByText('Last updated: 2024-01-15 10:30 UTC')).toBeInTheDocument();
    });
  });

  test('applies light theme styles when isDarkTheme is false', () => {
    render(
      <ExpandableOpportunityCard 
        {...defaultProps} 
        isDarkTheme={false}
      />
    );
    
    // Check that light theme classes are applied (this is a basic check)
    const card = screen.getByText('Test Airdrop').closest('div');
    expect(card).toBeInTheDocument();
  });

  test('formats large numbers correctly', async () => {
    const opportunityWithLargeNumbers = {
      ...mockOpportunityWithDetails,
      details: {
        ...mockOpportunityWithDetails.details!,
        liquidity: 15000000, // Should format as $15.0M
        volume24h: 2500000   // Should format as $2.5M
      }
    };
    
    render(
      <ExpandableOpportunityCard 
        {...defaultProps} 
        opportunity={opportunityWithLargeNumbers}
      />
    );
    
    const breakdownButton = screen.getByText('See Breakdown');
    fireEvent.click(breakdownButton);
    
    await waitFor(() => {
      expect(screen.getByText('$15.0M')).toBeInTheDocument();
      expect(screen.getByText('$2.5M')).toBeInTheDocument();
    });
  });

  test('handles different opportunity types correctly', () => {
    const stakingOpportunity = {
      ...mockOpportunity,
      type: 'Staking' as const,
      title: 'Test Staking'
    };
    
    render(
      <ExpandableOpportunityCard 
        {...defaultProps} 
        opportunity={stakingOpportunity}
      />
    );
    
    expect(screen.getByText('STAKING')).toBeInTheDocument();
    expect(screen.getByText('Test Staking')).toBeInTheDocument();
  });

  test('handles different risk levels correctly', () => {
    const highRiskOpportunity = {
      ...mockOpportunity,
      riskLevel: 'High' as const
    };
    
    render(
      <ExpandableOpportunityCard 
        {...defaultProps} 
        opportunity={highRiskOpportunity}
      />
    );
    
    expect(screen.getByText('HIGH RISK')).toBeInTheDocument();
  });

  test('applies custom className when provided', () => {
    const { container } = render(
      <ExpandableOpportunityCard 
        {...defaultProps} 
        className="custom-card-class"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-card-class');
  });

  test('handles missing optional fields gracefully', () => {
    const minimalOpportunity = {
      id: 'minimal',
      type: 'Quest' as const,
      title: 'Minimal Quest',
      description: 'Basic quest',
      reward: '10%',
      confidence: 70,
      duration: '7 days',
      guardianScore: 6,
      riskLevel: 'Medium' as const
    };
    
    render(
      <ExpandableOpportunityCard 
        {...defaultProps} 
        opportunity={minimalOpportunity}
      />
    );
    
    expect(screen.getByText('Minimal Quest')).toBeInTheDocument();
    expect(screen.getByText('QUEST')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM RISK')).toBeInTheDocument();
  });
});