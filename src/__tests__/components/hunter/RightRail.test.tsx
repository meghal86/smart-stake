/**
 * RightRail Component Tests
 * 
 * Tests for the desktop-only sidebar component showing PersonalPicks,
 * SavedItems, and SeasonProgress modules.
 * 
 * Requirements:
 * - 7.5: Right rail for desktop (≥1280px) with Personal picks, Saved items, Season progress
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RightRail } from '@/components/hunter/RightRail';
import { useSavedOpportunities } from '@/hooks/useSavedOpportunities';
import { useAuth } from '@/hooks/useAuth';

// Mock hooks
vi.mock('@/hooks/useSavedOpportunities');
vi.mock('@/hooks/useAuth');

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const mockUseSavedOpportunities = useSavedOpportunities as ReturnType<typeof vi.fn>;
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('RightRail Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(mockUseAuth).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1', email: 'test@example.com' },
    } as any);

    vi.mocked(mockUseSavedOpportunities).mockReturnValue({
      savedOpportunities: [],
      savedIds: new Set(),
      isLoading: false,
      error: null,
      isSaved: vi.fn(),
      addToSaved: vi.fn(),
      removeFromSaved: vi.fn(),
      refresh: vi.fn(),
    });
  });

  describe('Responsive Behavior', () => {
    it('should have hidden class for mobile/tablet', () => {
      const { container } = render(<RightRail />);
      const aside = container.querySelector('aside');
      
      expect(aside).toHaveClass('hidden');
      expect(aside).toHaveClass('xl:block');
    });

    it('should render with correct width for desktop', () => {
      const { container } = render(<RightRail />);
      const aside = container.querySelector('aside');
      
      expect(aside).toHaveClass('w-80');
    });

    it('should accept custom className', () => {
      const { container } = render(<RightRail className="custom-class" />);
      const aside = container.querySelector('aside');
      
      expect(aside).toHaveClass('custom-class');
    });
  });

  describe('PersonalPicks Module', () => {
    it('should render PersonalPicks section', () => {
      render(<RightRail />);
      
      expect(screen.getByText('Personal Picks')).toBeInTheDocument();
    });

    it('should display 3 personal pick items', () => {
      render(<RightRail />);
      
      expect(screen.getByText('Base Airdrop Season 2')).toBeInTheDocument();
      expect(screen.getByText('Arbitrum Odyssey')).toBeInTheDocument();
      expect(screen.getByText('Optimism Quests')).toBeInTheDocument();
    });

    it('should show protocol names', () => {
      render(<RightRail />);
      
      expect(screen.getByText('Base')).toBeInTheDocument();
      expect(screen.getByText('Arbitrum')).toBeInTheDocument();
      expect(screen.getByText('Optimism')).toBeInTheDocument();
    });

    it('should display reward ranges', () => {
      render(<RightRail />);
      
      expect(screen.getByText('$500-2,000')).toBeInTheDocument();
      expect(screen.getByText('$200-800')).toBeInTheDocument();
      expect(screen.getByText('$100-500')).toBeInTheDocument();
    });

    it('should show trust scores', () => {
      render(<RightRail />);
      
      expect(screen.getByText('95')).toBeInTheDocument();
      expect(screen.getByText('92')).toBeInTheDocument();
      expect(screen.getByText('88')).toBeInTheDocument();
    });

    it('should render "View all picks" button', () => {
      render(<RightRail />);
      
      expect(screen.getByText('View all picks →')).toBeInTheDocument();
    });
  });

  describe('SavedItems Module - Authenticated', () => {
    it('should render SavedItems section when authenticated', () => {
      render(<RightRail />);
      
      expect(screen.getByText('Saved Items')).toBeInTheDocument();
    });

    it('should not render SavedItems when not authenticated', () => {
      vi.mocked(mockUseAuth).mockReturnValue({
        isAuthenticated: false,
        user: null,
      } as any);

      render(<RightRail />);
      
      expect(screen.queryByText('Saved Items')).not.toBeInTheDocument();
    });

    it('should show loading state', () => {
      vi.mocked(mockUseSavedOpportunities).mockReturnValue({
        savedOpportunities: [],
        savedIds: new Set(),
        isLoading: true,
        error: null,
        isSaved: vi.fn(),
        addToSaved: vi.fn(),
        removeFromSaved: vi.fn(),
        refresh: vi.fn(),
      });

      const { container } = render(<RightRail />);
      
      // Check for loading skeleton
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show empty state when no saved items', () => {
      render(<RightRail />);
      
      expect(screen.getByText('No saved items yet')).toBeInTheDocument();
      expect(screen.getByText('Save opportunities to access them later')).toBeInTheDocument();
    });

    it('should display saved opportunities', () => {
      const mockSavedOpportunities = [
        {
          id: 'saved-1',
          opportunity_id: 'opp-1',
          saved_at: '2025-01-01T00:00:00Z',
          opportunity: {
            id: 'opp-1',
            slug: 'test-opp-1',
            title: 'Test Opportunity 1',
            protocol_name: 'Test Protocol',
            protocol_logo: 'https://example.com/logo.png',
            type: 'airdrop',
            trust_score: 85,
            trust_level: 'green',
          },
        },
        {
          id: 'saved-2',
          opportunity_id: 'opp-2',
          saved_at: '2025-01-02T00:00:00Z',
          opportunity: {
            id: 'opp-2',
            slug: 'test-opp-2',
            title: 'Test Opportunity 2',
            protocol_name: 'Another Protocol',
            protocol_logo: 'https://example.com/logo2.png',
            type: 'quest',
            trust_score: 72,
            trust_level: 'amber',
          },
        },
      ];

      vi.mocked(mockUseSavedOpportunities).mockReturnValue({
        savedOpportunities: mockSavedOpportunities,
        savedIds: new Set(['opp-1', 'opp-2']),
        isLoading: false,
        error: null,
        isSaved: vi.fn(),
        addToSaved: vi.fn(),
        removeFromSaved: vi.fn(),
        refresh: vi.fn(),
      });

      render(<RightRail />);
      
      expect(screen.getByText('Test Opportunity 1')).toBeInTheDocument();
      expect(screen.getByText('Test Protocol')).toBeInTheDocument();
      expect(screen.getByText('Test Opportunity 2')).toBeInTheDocument();
      expect(screen.getByText('Another Protocol')).toBeInTheDocument();
    });

    it('should show count badge', () => {
      const mockSavedOpportunities = Array.from({ length: 7 }, (_, i) => ({
        id: `saved-${i}`,
        opportunity_id: `opp-${i}`,
        saved_at: '2025-01-01T00:00:00Z',
        opportunity: {
          id: `opp-${i}`,
          slug: `test-opp-${i}`,
          title: `Test Opportunity ${i}`,
          protocol_name: 'Test Protocol',
          type: 'airdrop',
          trust_score: 85,
          trust_level: 'green',
        },
      }));

      vi.mocked(mockUseSavedOpportunities).mockReturnValue({
        savedOpportunities: mockSavedOpportunities,
        savedIds: new Set(mockSavedOpportunities.map(o => o.opportunity_id)),
        isLoading: false,
        error: null,
        isSaved: vi.fn(),
        addToSaved: vi.fn(),
        removeFromSaved: vi.fn(),
        refresh: vi.fn(),
      });

      render(<RightRail />);
      
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('should show "View all saved" button when more than 5 items', () => {
      const mockSavedOpportunities = Array.from({ length: 7 }, (_, i) => ({
        id: `saved-${i}`,
        opportunity_id: `opp-${i}`,
        saved_at: '2025-01-01T00:00:00Z',
        opportunity: {
          id: `opp-${i}`,
          slug: `test-opp-${i}`,
          title: `Test Opportunity ${i}`,
          protocol_name: 'Test Protocol',
          type: 'airdrop',
          trust_score: 85,
          trust_level: 'green',
        },
      }));

      vi.mocked(mockUseSavedOpportunities).mockReturnValue({
        savedOpportunities: mockSavedOpportunities,
        savedIds: new Set(mockSavedOpportunities.map(o => o.opportunity_id)),
        isLoading: false,
        error: null,
        isSaved: vi.fn(),
        addToSaved: vi.fn(),
        removeFromSaved: vi.fn(),
        refresh: vi.fn(),
      });

      render(<RightRail />);
      
      expect(screen.getByText('View all saved (7) →')).toBeInTheDocument();
    });

    it('should display trust level indicators correctly', () => {
      const mockSavedOpportunities = [
        {
          id: 'saved-1',
          opportunity_id: 'opp-1',
          saved_at: '2025-01-01T00:00:00Z',
          opportunity: {
            id: 'opp-1',
            slug: 'test-opp-1',
            title: 'Green Trust',
            protocol_name: 'Test',
            type: 'airdrop',
            trust_score: 85,
            trust_level: 'green',
          },
        },
        {
          id: 'saved-2',
          opportunity_id: 'opp-2',
          saved_at: '2025-01-02T00:00:00Z',
          opportunity: {
            id: 'opp-2',
            slug: 'test-opp-2',
            title: 'Amber Trust',
            protocol_name: 'Test',
            type: 'quest',
            trust_score: 72,
            trust_level: 'amber',
          },
        },
        {
          id: 'saved-3',
          opportunity_id: 'opp-3',
          saved_at: '2025-01-03T00:00:00Z',
          opportunity: {
            id: 'opp-3',
            slug: 'test-opp-3',
            title: 'Red Trust',
            protocol_name: 'Test',
            type: 'yield',
            trust_score: 45,
            trust_level: 'red',
          },
        },
      ];

      vi.mocked(mockUseSavedOpportunities).mockReturnValue({
        savedOpportunities: mockSavedOpportunities,
        savedIds: new Set(['opp-1', 'opp-2', 'opp-3']),
        isLoading: false,
        error: null,
        isSaved: vi.fn(),
        addToSaved: vi.fn(),
        removeFromSaved: vi.fn(),
        refresh: vi.fn(),
      });

      const { container } = render(<RightRail />);
      
      // Check for trust level indicators
      const greenIndicator = container.querySelector('.bg-green-500');
      const amberIndicator = container.querySelector('.bg-amber-500');
      const redIndicator = container.querySelector('.bg-red-500');
      
      expect(greenIndicator).toBeInTheDocument();
      expect(amberIndicator).toBeInTheDocument();
      expect(redIndicator).toBeInTheDocument();
    });
  });

  describe('SeasonProgress Module', () => {
    it('should render SeasonProgress section', () => {
      render(<RightRail />);
      
      expect(screen.getByText('Season 2')).toBeInTheDocument();
    });

    it('should display progress percentage', () => {
      render(<RightRail />);
      
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
    });

    it('should show rank information', () => {
      render(<RightRail />);
      
      expect(screen.getByText('Your Rank')).toBeInTheDocument();
      expect(screen.getByText('#1,247')).toBeInTheDocument();
      expect(screen.getByText('of 15,000')).toBeInTheDocument();
    });

    it('should display points earned', () => {
      render(<RightRail />);
      
      expect(screen.getByText('Points')).toBeInTheDocument();
      expect(screen.getByText('3,250')).toBeInTheDocument();
      expect(screen.getByText('1750 to next')).toBeInTheDocument();
    });

    it('should show milestones', () => {
      render(<RightRail />);
      
      expect(screen.getByText('Milestones')).toBeInTheDocument();
      expect(screen.getByText('Bronze Badge')).toBeInTheDocument();
      expect(screen.getByText('Silver Badge')).toBeInTheDocument();
      expect(screen.getByText('Gold Badge')).toBeInTheDocument();
      expect(screen.getByText('Platinum Badge')).toBeInTheDocument();
    });

    it('should mark completed milestones', () => {
      const { container } = render(<RightRail />);
      
      // Check for checkmarks on completed milestones
      const checkmarks = container.querySelectorAll('.bg-\\[\\#00F5A0\\]');
      expect(checkmarks.length).toBeGreaterThan(0);
    });

    it('should show time remaining', () => {
      render(<RightRail />);
      
      expect(screen.getByText('Season ends in')).toBeInTheDocument();
      expect(screen.getByText('12 days')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label', () => {
      const { container } = render(<RightRail />);
      const aside = container.querySelector('aside');
      
      expect(aside).toHaveAttribute('aria-label', 'Right sidebar');
    });

    it('should render semantic HTML', () => {
      const { container } = render(<RightRail />);
      
      expect(container.querySelector('aside')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should have correct spacing classes', () => {
      const { container } = render(<RightRail />);
      const aside = container.querySelector('aside');
      
      expect(aside).toHaveClass('space-y-6');
    });

    it('should be flex-shrink-0', () => {
      const { container } = render(<RightRail />);
      const aside = container.querySelector('aside');
      
      expect(aside).toHaveClass('flex-shrink-0');
    });
  });
});
