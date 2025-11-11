/**
 * OpportunityCard Component Tests
 * 
 * Tests for the refactored OpportunityCard component.
 * 
 * Requirements:
 * - 5.1-5.21: Opportunity card display
 * - 9.1-9.12: Accessibility compliance
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpportunityCard } from '@/components/hunter/OpportunityCard';
import type { Opportunity } from '@/types/hunter';

// Mock the auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { access_token: 'test-token' },
    isAuthenticated: true,
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    article: ({ children, ...props }: any) => <article {...props}>{children}</article>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('OpportunityCard', () => {
  const mockOpportunity: Opportunity = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    slug: 'test-airdrop',
    title: 'Test Airdrop Opportunity',
    description: 'A test airdrop opportunity',
    protocol: {
      name: 'Test Protocol',
      logo: 'https://example.com/logo.png',
    },
    type: 'airdrop',
    chains: ['ethereum', 'base'],
    reward: {
      min: 100,
      max: 500,
      currency: 'USD',
      confidence: 'confirmed',
    },
    trust: {
      score: 85,
      level: 'green',
      last_scanned_ts: new Date().toISOString(),
      issues: ['Minor issue 1', 'Minor issue 2'],
    },
    urgency: 'new',
    difficulty: 'easy',
    featured: false,
    sponsored: false,
    time_left_sec: 86400, // 1 day
    badges: [],
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
  };

  const mockHandlers = {
    onSave: vi.fn(),
    onShare: vi.fn(),
    onReport: vi.fn(),
    onCTAClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders opportunity card with all required elements', () => {
    render(
      <OpportunityCard
        opportunity={mockOpportunity}
        isConnected={false}
        {...mockHandlers}
      />
    );

    // Check title
    expect(screen.getByText('Test Airdrop Opportunity')).toBeInTheDocument();
    
    // Check protocol name
    expect(screen.getByText('Test Protocol')).toBeInTheDocument();
    
    // Check type badge
    expect(screen.getByText('Airdrop')).toBeInTheDocument();
    
    // Check chains
    expect(screen.getByText(/ethereum, base/i)).toBeInTheDocument();
  });

  it('displays Guardian trust chip with correct level', () => {
    render(
      <OpportunityCard
        opportunity={mockOpportunity}
        isConnected={false}
        {...mockHandlers}
      />
    );

    // Check trust score
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('High Trust')).toBeInTheDocument();
  });

  it('displays reward information correctly', () => {
    render(
      <OpportunityCard
        opportunity={mockOpportunity}
        isConnected={false}
        {...mockHandlers}
      />
    );

    // Check reward range
    expect(screen.getByText(/\$100/)).toBeInTheDocument();
    expect(screen.getByText(/\$500/)).toBeInTheDocument();
    
    // Check confidence badge
    expect(screen.getByText('✓ Confirmed')).toBeInTheDocument();
  });

  it('displays time left correctly', () => {
    render(
      <OpportunityCard
        opportunity={mockOpportunity}
        isConnected={false}
        {...mockHandlers}
      />
    );

    // 86400 seconds = 1 day
    expect(screen.getByText('1d 0h left')).toBeInTheDocument();
  });

  it('displays difficulty badge', () => {
    render(
      <OpportunityCard
        opportunity={mockOpportunity}
        isConnected={false}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Easy')).toBeInTheDocument();
  });

  it('shows eligibility preview when wallet is connected', () => {
    const opportunityWithEligibility: Opportunity = {
      ...mockOpportunity,
      eligibility_preview: {
        status: 'likely',
        score: 0.85,
        reasons: ['Wallet age > 30 days', 'Active on Ethereum'],
      },
    };

    render(
      <OpportunityCard
        opportunity={opportunityWithEligibility}
        isConnected={true}
        userWallet="0x1234567890123456789012345678901234567890"
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Likely Eligible')).toBeInTheDocument();
    expect(screen.getByText('Wallet age > 30 days')).toBeInTheDocument();
  });

  it('does not show eligibility preview when wallet is not connected', () => {
    const opportunityWithEligibility: Opportunity = {
      ...mockOpportunity,
      eligibility_preview: {
        status: 'likely',
        score: 0.85,
        reasons: ['Wallet age > 30 days'],
      },
    };

    render(
      <OpportunityCard
        opportunity={opportunityWithEligibility}
        isConnected={false}
        {...mockHandlers}
      />
    );

    expect(screen.queryByText('Likely Eligible')).not.toBeInTheDocument();
  });

  it('displays featured badge when opportunity is featured', () => {
    const featuredOpportunity: Opportunity = {
      ...mockOpportunity,
      featured: true,
    };

    render(
      <OpportunityCard
        opportunity={featuredOpportunity}
        isConnected={false}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('displays sponsored badge when opportunity is sponsored', () => {
    const sponsoredOpportunity: Opportunity = {
      ...mockOpportunity,
      sponsored: true,
    };

    render(
      <OpportunityCard
        opportunity={sponsoredOpportunity}
        isConnected={false}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Sponsored')).toBeInTheDocument();
  });

  it('displays custom badges', () => {
    const opportunityWithBadges: Opportunity = {
      ...mockOpportunity,
      badges: [
        { type: 'season_bonus', label: 'Season Bonus' },
        { type: 'retroactive', label: 'Retroactive' },
      ],
    };

    render(
      <OpportunityCard
        opportunity={opportunityWithBadges}
        isConnected={false}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Season Bonus')).toBeInTheDocument();
    expect(screen.getByText('Retroactive')).toBeInTheDocument();
  });

  it('calls onCTAClick with correct action when CTA button is clicked', () => {
    render(
      <OpportunityCard
        opportunity={mockOpportunity}
        isConnected={false}
        {...mockHandlers}
      />
    );

    const ctaButton = screen.getByRole('button', { name: /claim airdrop/i });
    fireEvent.click(ctaButton);

    expect(mockHandlers.onCTAClick).toHaveBeenCalledWith(mockOpportunity.id, 'claim');
  });

  it('displays correct CTA label for different opportunity types', () => {
    const questOpportunity: Opportunity = {
      ...mockOpportunity,
      type: 'quest',
    };

    const { rerender } = render(
      <OpportunityCard
        opportunity={questOpportunity}
        isConnected={false}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Start Quest')).toBeInTheDocument();

    const stakingOpportunity: Opportunity = {
      ...mockOpportunity,
      type: 'staking',
    };

    rerender(
      <OpportunityCard
        opportunity={stakingOpportunity}
        isConnected={false}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Stake Now')).toBeInTheDocument();
  });

  it('displays yield disclaimer for yield and staking opportunities', () => {
    const yieldOpportunity: Opportunity = {
      ...mockOpportunity,
      type: 'yield',
    };

    render(
      <OpportunityCard
        opportunity={yieldOpportunity}
        isConnected={false}
        {...mockHandlers}
      />
    );

    expect(screen.getByText(/not financial advice/i)).toBeInTheDocument();
    expect(screen.getByText(/disclosures/i)).toBeInTheDocument();
  });

  it('has proper aria-labels for accessibility', () => {
    render(
      <OpportunityCard
        opportunity={mockOpportunity}
        isConnected={false}
        {...mockHandlers}
      />
    );

    // Check article has aria-label
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-label', expect.stringContaining('opportunity card'));

    // Check CTA button has aria-label
    const ctaButton = screen.getByRole('button', { name: /claim airdrop for test airdrop opportunity/i });
    expect(ctaButton).toBeInTheDocument();
  });

  it('displays amber trust level correctly', () => {
    const amberOpportunity: Opportunity = {
      ...mockOpportunity,
      trust: {
        score: 70,
        level: 'amber',
        last_scanned_ts: new Date().toISOString(),
        issues: ['Some concern'],
      },
    };

    render(
      <OpportunityCard
        opportunity={amberOpportunity}
        isConnected={false}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('70')).toBeInTheDocument();
    expect(screen.getByText('Medium Trust')).toBeInTheDocument();
  });

  it('displays red trust level correctly', () => {
    const redOpportunity: Opportunity = {
      ...mockOpportunity,
      trust: {
        score: 45,
        level: 'red',
        last_scanned_ts: new Date().toISOString(),
        issues: ['Major security concern'],
      },
    };

    render(
      <OpportunityCard
        opportunity={redOpportunity}
        isConnected={false}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('Low Trust')).toBeInTheDocument();
  });

  it('formats large USD amounts with compact notation', () => {
    const largeRewardOpportunity: Opportunity = {
      ...mockOpportunity,
      reward: {
        min: 10000,
        max: 50000,
        currency: 'USD',
        confidence: 'estimated',
      },
    };

    render(
      <OpportunityCard
        opportunity={largeRewardOpportunity}
        isConnected={false}
        {...mockHandlers}
      />
    );

    // Should use compact notation (10K, 50K)
    expect(screen.getByText(/\$10K/)).toBeInTheDocument();
    expect(screen.getByText(/\$50K/)).toBeInTheDocument();
  });

  it('displays APY correctly', () => {
    const apyOpportunity: Opportunity = {
      ...mockOpportunity,
      reward: {
        min: 5.5,
        max: 12.3,
        currency: 'APY',
        confidence: 'confirmed',
      },
    };

    render(
      <OpportunityCard
        opportunity={apyOpportunity}
        isConnected={false}
        {...mockHandlers}
      />
    );

    // Text is split across elements, use regex matcher
    expect(screen.getByText(/5\.5%/)).toBeInTheDocument();
    expect(screen.getByText(/12\.3%/)).toBeInTheDocument();
  });

  it('displays POINTS reward correctly', () => {
    const pointsOpportunity: Opportunity = {
      ...mockOpportunity,
      reward: {
        min: 1000,
        max: 5000,
        currency: 'POINTS',
        confidence: 'estimated',
      },
    };

    render(
      <OpportunityCard
        opportunity={pointsOpportunity}
        isConnected={false}
        {...mockHandlers}
      />
    );

    // Text is split across elements, use regex matcher
    expect(screen.getByText(/1,000/)).toBeInTheDocument();
    expect(screen.getByText(/5,000/)).toBeInTheDocument();
    expect(screen.getByText('Points')).toBeInTheDocument();
  });
});
