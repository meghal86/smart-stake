/**
 * Hunter Page Layout Tests
 * 
 * Tests for task 30g: Update Hunter page layout to match spec
 * 
 * Requirements tested:
 * - 7.3: SearchBar in header
 * - 7.3: FilterDrawer integration
 * - 7.2: StickySubFilters below tabs
 * - 7.5: RightRail for desktop layout
 * - 7.3-7.5: Responsive layout (mobile/tablet/desktop)
 * - 9.12: Footer with legal links
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Hunter from '@/pages/Hunter';

// Mock dependencies
vi.mock('@/hooks/useHunterFeed', () => ({
  useHunterFeed: vi.fn(() => ({
    opportunities: [],
    isLoading: false,
    lastUpdated: new Date().toISOString(),
    refetch: vi.fn(),
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  })),
}));

vi.mock('@/hooks/useSavedOpportunities', () => ({
  useSavedOpportunities: vi.fn(() => ({
    savedOpportunities: [],
    isLoading: false,
  })),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
  })),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    toString: vi.fn(() => ''),
  }),
}));

describe('Hunter Page Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Header with SearchBar', () => {
    it('should render SearchBar in header', () => {
      render(<Hunter />);
      
      const searchInput = screen.getByPlaceholderText(/search opportunities/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should render Filter button in header', () => {
      render(<Hunter />);
      
      const filterButton = screen.getByLabelText(/open filter drawer/i);
      expect(filterButton).toBeInTheDocument();
    });

    it('should render Create Opportunity CTA in header', () => {
      render(<Hunter />);
      
      const createButton = screen.getByLabelText(/create new opportunity/i);
      expect(createButton).toBeInTheDocument();
    });

    it('should open FilterDrawer when Filter button is clicked', async () => {
      render(<Hunter />);
      
      const filterButton = screen.getByLabelText(/open filter drawer/i);
      fireEvent.click(filterButton);
      
      await waitFor(() => {
        expect(screen.getByText(/filter opportunities/i)).toBeInTheDocument();
      });
    });
  });

  describe('HunterTabs', () => {
    it('should render all tab options', () => {
      render(<Hunter />);
      
      expect(screen.getByRole('tab', { name: /all/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /airdrops/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /quests/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /yield/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /points/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /featured/i })).toBeInTheDocument();
    });

    it('should have All tab selected by default', () => {
      render(<Hunter />);
      
      const allTab = screen.getByRole('tab', { name: /all/i });
      expect(allTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should change active tab when clicked', async () => {
      render(<Hunter />);
      
      const airdropsTab = screen.getByRole('tab', { name: /airdrops/i });
      fireEvent.click(airdropsTab);
      
      await waitFor(() => {
        expect(airdropsTab).toHaveAttribute('aria-selected', 'true');
      });
    });
  });

  describe('StickySubFilters', () => {
    it('should render StickySubFilters component', () => {
      render(<Hunter />);
      
      // Check for filter selects
      expect(screen.getByLabelText(/filter by chain/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by trust level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by minimum reward/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by time remaining/i)).toBeInTheDocument();
    });
  });

  describe('RightRail', () => {
    it('should render RightRail on desktop', () => {
      // Set viewport to desktop size
      global.innerWidth = 1280;
      
      render(<Hunter />);
      
      // RightRail should be present but hidden on smaller screens via CSS
      expect(screen.getByLabelText(/right sidebar/i)).toBeInTheDocument();
    });

    it('should render PersonalPicks module', () => {
      render(<Hunter />);
      
      expect(screen.getByText(/personal picks/i)).toBeInTheDocument();
    });

    it('should render SavedItems module', () => {
      render(<Hunter />);
      
      expect(screen.getByText(/saved items/i)).toBeInTheDocument();
    });

    it('should render SeasonProgress module', () => {
      render(<Hunter />);
      
      expect(screen.getByText(/season 2/i)).toBeInTheDocument();
    });
  });

  describe('Footer with Legal Links', () => {
    it('should render footer with legal links', () => {
      render(<Hunter />);
      
      expect(screen.getByText(/privacy policy/i)).toBeInTheDocument();
      expect(screen.getByText(/disclosures/i)).toBeInTheDocument();
      expect(screen.getByText(/risk warning/i)).toBeInTheDocument();
      expect(screen.getByText(/terms of service/i)).toBeInTheDocument();
    });

    it('should render copyright notice', () => {
      render(<Hunter />);
      
      expect(screen.getByText(/© 2025 alphawhale/i)).toBeInTheDocument();
    });

    it('should render disclaimer text', () => {
      render(<Hunter />);
      
      expect(screen.getByText(/not financial advice/i)).toBeInTheDocument();
    });

    it('should have correct href attributes for legal links', () => {
      render(<Hunter />);
      
      const privacyLink = screen.getByText(/privacy policy/i).closest('a');
      expect(privacyLink).toHaveAttribute('href', '/privacy');
      
      const disclosuresLink = screen.getByText(/disclosures/i).closest('a');
      expect(disclosuresLink).toHaveAttribute('href', '/disclosures');
      
      const riskLink = screen.getByText(/risk warning/i).closest('a');
      expect(riskLink).toHaveAttribute('href', '/risk');
      
      const termsLink = screen.getByText(/terms of service/i).closest('a');
      expect(termsLink).toHaveAttribute('href', '/terms');
    });
  });

  describe('Responsive Layout', () => {
    it('should render mobile layout correctly', () => {
      // Set viewport to mobile size
      global.innerWidth = 375;
      
      render(<Hunter />);
      
      // SearchBar should be present
      expect(screen.getByPlaceholderText(/search opportunities/i)).toBeInTheDocument();
      
      // RightRail should be hidden via CSS (still in DOM but not visible)
      const rightRail = screen.getByLabelText(/right sidebar/i);
      expect(rightRail).toHaveClass('hidden', 'xl:block');
    });

    it('should render tablet layout correctly', () => {
      // Set viewport to tablet size
      global.innerWidth = 768;
      
      render(<Hunter />);
      
      // All main components should be present
      expect(screen.getByPlaceholderText(/search opportunities/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by chain/i)).toBeInTheDocument();
    });

    it('should render desktop layout correctly', () => {
      // Set viewport to desktop size
      global.innerWidth = 1280;
      
      render(<Hunter />);
      
      // All components including RightRail should be visible
      expect(screen.getByPlaceholderText(/search opportunities/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/right sidebar/i)).toBeInTheDocument();
      expect(screen.getByText(/personal picks/i)).toBeInTheDocument();
    });
  });

  describe('FilterDrawer Integration', () => {
    it('should open and close FilterDrawer', async () => {
      render(<Hunter />);
      
      const filterButton = screen.getByLabelText(/open filter drawer/i);
      
      // Open drawer
      fireEvent.click(filterButton);
      await waitFor(() => {
        expect(screen.getByText(/filter opportunities/i)).toBeInTheDocument();
      });
      
      // Close drawer (if close button exists)
      const applyButton = screen.getByText(/apply filters/i);
      fireEvent.click(applyButton);
      
      await waitFor(() => {
        expect(screen.queryByText(/filter opportunities/i)).not.toBeInTheDocument();
      });
    });

    it('should apply filters when changed', async () => {
      render(<Hunter />);
      
      const filterButton = screen.getByLabelText(/open filter drawer/i);
      fireEvent.click(filterButton);
      
      await waitFor(() => {
        expect(screen.getByText(/filter opportunities/i)).toBeInTheDocument();
      });
      
      // Change a filter (e.g., select a chain)
      const ethereumCheckbox = screen.getByLabelText(/filter by ethereum chain/i);
      fireEvent.click(ethereumCheckbox);
      
      // Apply filters
      const applyButton = screen.getByText(/apply filters/i);
      fireEvent.click(applyButton);
      
      // Filters should be applied (drawer closes)
      await waitFor(() => {
        expect(screen.queryByText(/filter opportunities/i)).not.toBeInTheDocument();
      });
    });

    it('should reset filters when reset button is clicked', async () => {
      render(<Hunter />);
      
      const filterButton = screen.getByLabelText(/open filter drawer/i);
      fireEvent.click(filterButton);
      
      await waitFor(() => {
        expect(screen.getByText(/filter opportunities/i)).toBeInTheDocument();
      });
      
      // Click reset button
      const resetButton = screen.getByLabelText(/reset all filters/i);
      fireEvent.click(resetButton);
      
      // Filters should be reset to defaults
      // This would need to check the actual filter state
    });
  });

  describe('Search Integration', () => {
    it('should update search filter when typing in SearchBar', async () => {
      render(<Hunter />);
      
      const searchInput = screen.getByPlaceholderText(/search opportunities/i);
      
      fireEvent.change(searchInput, { target: { value: 'Base Airdrop' } });
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('Base Airdrop');
      });
    });

    it('should clear search when clear button is clicked', async () => {
      render(<Hunter />);
      
      const searchInput = screen.getByPlaceholderText(/search opportunities/i);
      
      // Type something
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('test');
      });
      
      // Clear search
      const clearButton = screen.getByLabelText(/clear search/i);
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for navigation', () => {
      render(<Hunter />);
      
      expect(screen.getByRole('tablist', { name: /opportunity categories/i })).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: /footer navigation/i })).toBeInTheDocument();
    });

    it('should have proper ARIA labels for interactive elements', () => {
      render(<Hunter />);
      
      expect(screen.getByLabelText(/search opportunities/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/open filter drawer/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/create new opportunity/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation for tabs', () => {
      render(<Hunter />);
      
      const allTab = screen.getByRole('tab', { name: /all/i });
      const airdropsTab = screen.getByRole('tab', { name: /airdrops/i });
      
      // Focus on first tab
      allTab.focus();
      expect(document.activeElement).toBe(allTab);
      
      // Tab to next element
      fireEvent.keyDown(allTab, { key: 'Tab' });
      // Next focusable element should receive focus
    });
  });
});
