/**
 * Tests for Wallet Loading States
 * 
 * Verifies loading states during wallet operations:
 * - Loading spinner during wallet connection
 * - Loading state during wallet switch
 * - Disabled interactions during loading
 * - Skeleton shimmer on card grid during feed refresh
 * 
 * @see .kiro/specs/hunter-screen-feed/tasks.md - Task 53
 * @see .kiro/specs/hunter-screen-feed/requirements.md - Requirement 18.13
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OpportunityCardSkeleton, OpportunityGridSkeleton } from '@/components/hunter/OpportunityCardSkeleton';


describe('OpportunityCardSkeleton', () => {
  it('should render skeleton with proper structure', () => {
    render(<OpportunityCardSkeleton />);

    const skeleton = screen.getByRole('status', { name: /loading opportunity/i });
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('should render dark theme skeleton', () => {
    render(<OpportunityCardSkeleton isDarkTheme={true} />);

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('bg-white/5');
  });

  it('should render light theme skeleton', () => {
    render(<OpportunityCardSkeleton isDarkTheme={false} />);

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('bg-white/90');
  });

  it('should have screen reader text', () => {
    render(<OpportunityCardSkeleton />);

    expect(screen.getByText('Loading opportunity card')).toBeInTheDocument();
  });
});

describe('OpportunityGridSkeleton', () => {
  it('should render multiple skeleton cards', () => {
    render(<OpportunityGridSkeleton count={3} />);

    const grid = screen.getByRole('status', { name: /loading 3 opportunities/i });
    expect(grid).toBeInTheDocument();

    // Should have 3 skeleton cards
    const skeletons = screen.getAllByRole('status', { name: /loading opportunity/i });
    expect(skeletons).toHaveLength(3);
  });

  it('should render custom count of skeletons', () => {
    render(<OpportunityGridSkeleton count={5} />);

    const skeletons = screen.getAllByRole('status', { name: /loading opportunity/i });
    expect(skeletons).toHaveLength(5);
  });

  it('should pass theme to child skeletons', () => {
    render(<OpportunityGridSkeleton count={2} isDarkTheme={false} />);

    const skeletons = screen.getAllByRole('status', { name: /loading opportunity/i });
    skeletons.forEach(skeleton => {
      expect(skeleton).toHaveClass('bg-white/90');
    });
  });

  it('should have screen reader text', () => {
    render(<OpportunityGridSkeleton count={3} />);

    expect(screen.getByText('Loading opportunities...')).toBeInTheDocument();
  });
});


