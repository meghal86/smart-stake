import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HunterEmptyState } from '../HunterEmptyState';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('HunterEmptyState', () => {
  const mockProps = {
    activeFilter: 'staking',
    searchQuery: 'ethereum',
    onClearFilters: vi.fn(),
    onAdjustFilters: vi.fn(),
    onViewAll: vi.fn(),
    onRefresh: vi.fn(),
    isRefreshing: false,
    totalProtocolsScanned: 1250
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with no filters or search', () => {
      render(<HunterEmptyState />);
      
      expect(screen.getByText('No opportunities available right now')).toBeInTheDocument();
      expect(screen.getByText(/AI Copilot is continuously scanning/)).toBeInTheDocument();
    });

    it('renders with active filter', () => {
      render(<HunterEmptyState activeFilter="staking" />);
      
      expect(screen.getByText('No staking opportunities available')).toBeInTheDocument();
      expect(screen.getByText(/No staking opportunities match your criteria/)).toBeInTheDocument();
    });

    it('renders with search query', () => {
      render(<HunterEmptyState searchQuery="ethereum" />);
      
      expect(screen.getByText('No results for "ethereum"')).toBeInTheDocument();
      expect(screen.getByText(/Try adjusting your search terms/)).toBeInTheDocument();
    });

    it('renders with both filter and search query (search takes precedence)', () => {
      render(
        <HunterEmptyState 
          activeFilter="staking"
          searchQuery="ethereum"
        />
      );
      
      expect(screen.getByText('No results for "ethereum"')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('renders clear filters action for active filter', () => {
      render(
        <HunterEmptyState 
          activeFilter="staking"
          onClearFilters={mockProps.onClearFilters}
        />
      );
      
      expect(screen.getByText('Clear filters')).toBeInTheDocument();
    });

    it('renders clear search action for search query', () => {
      render(
        <HunterEmptyState 
          searchQuery="ethereum"
          onClearFilters={mockProps.onClearFilters}
        />
      );
      
      expect(screen.getByText('Clear search')).toBeInTheDocument();
    });

    it('calls onClearFilters when clear button is clicked', () => {
      render(
        <HunterEmptyState 
          activeFilter="staking"
          onClearFilters={mockProps.onClearFilters}
        />
      );
      
      fireEvent.click(screen.getByText('Clear filters'));
      expect(mockProps.onClearFilters).toHaveBeenCalledTimes(1);
    });

    it('renders adjust filters action when provided', () => {
      render(<HunterEmptyState onAdjustFilters={mockProps.onAdjustFilters} />);
      
      expect(screen.getByText('Adjust filters')).toBeInTheDocument();
    });

    it('calls onAdjustFilters when adjust filters button is clicked', () => {
      render(<HunterEmptyState onAdjustFilters={mockProps.onAdjustFilters} />);
      
      fireEvent.click(screen.getByText('Adjust filters'));
      expect(mockProps.onAdjustFilters).toHaveBeenCalledTimes(1);
    });

    it('renders view all action when provided', () => {
      render(<HunterEmptyState onViewAll={mockProps.onViewAll} />);
      
      expect(screen.getByText('View all opportunities')).toBeInTheDocument();
    });

    it('calls onViewAll when view all button is clicked', () => {
      render(<HunterEmptyState onViewAll={mockProps.onViewAll} />);
      
      fireEvent.click(screen.getByText('View all opportunities'));
      expect(mockProps.onViewAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('Refresh Functionality', () => {
    it('shows refresh button when onRefresh is provided', () => {
      render(<HunterEmptyState onRefresh={mockProps.onRefresh} />);
      
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('calls onRefresh when refresh button is clicked', () => {
      render(<HunterEmptyState onRefresh={mockProps.onRefresh} />);
      
      fireEvent.click(screen.getByText('Refresh'));
      expect(mockProps.onRefresh).toHaveBeenCalledTimes(1);
    });

    it('shows refreshing state correctly', () => {
      render(
        <HunterEmptyState 
          onRefresh={mockProps.onRefresh}
          isRefreshing={true}
        />
      );
      
      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
      expect(screen.getByText('Refreshing...')).toBeDisabled();
    });
  });

  describe('Scan Checklist', () => {
    it('renders base scan checklist', () => {
      render(<HunterEmptyState />);
      
      expect(screen.getByText('Items Scanned:')).toBeInTheDocument();
      expect(screen.getByText('DeFi protocols scanned')).toBeInTheDocument();
      expect(screen.getByText('Yield farming opportunities checked')).toBeInTheDocument();
      expect(screen.getByText('Staking rewards analyzed')).toBeInTheDocument();
      expect(screen.getByText('Liquidity mining programs reviewed')).toBeInTheDocument();
      expect(screen.getByText('New token launches monitored')).toBeInTheDocument();
    });

    it('shows custom protocol count when provided', () => {
      render(<HunterEmptyState totalProtocolsScanned={1250} />);
      
      expect(screen.getByText('(1,250 protocols)')).toBeInTheDocument();
    });

    it('adds filter-specific checklist items for staking filter', () => {
      render(<HunterEmptyState activeFilter="staking" />);
      
      expect(screen.getByText('Staking protocols filtered')).toBeInTheDocument();
      expect(screen.getByText('(Ethereum, Cardano, Solana, etc.)')).toBeInTheDocument();
    });

    it('adds filter-specific checklist items for airdrops filter', () => {
      render(<HunterEmptyState activeFilter="airdrops" />);
      
      expect(screen.getByText('Airdrop eligibility checked')).toBeInTheDocument();
      expect(screen.getByText('(Based on wallet activity)')).toBeInTheDocument();
    });

    it('adds filter-specific checklist items for nft filter', () => {
      render(<HunterEmptyState activeFilter="nft" />);
      
      expect(screen.getByText('NFT opportunities scanned')).toBeInTheDocument();
      expect(screen.getByText('(Mints, drops, whitelist spots)')).toBeInTheDocument();
    });

    it('adds filter-specific checklist items for quests filter', () => {
      render(<HunterEmptyState activeFilter="quests" />);
      
      expect(screen.getByText('Protocol quests reviewed')).toBeInTheDocument();
      expect(screen.getByText('(Galxe, Layer3, QuestN, etc.)')).toBeInTheDocument();
    });

    it('marks all base checklist items as completed', () => {
      render(<HunterEmptyState />);
      
      const completedIcons = screen.getAllByLabelText('Completed');
      expect(completedIcons.length).toBeGreaterThanOrEqual(5); // At least 5 base items
    });
  });

  describe('Empty State Types', () => {
    it('uses no-search-results type for search queries', () => {
      render(<HunterEmptyState searchQuery="test" />);
      
      // Should show search-specific messaging
      expect(screen.getByText(/No results for "test"/)).toBeInTheDocument();
    });

    it('uses filters-no-match type for active filters', () => {
      render(<HunterEmptyState activeFilter="staking" />);
      
      // Should show filter-specific messaging
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/No staking opportunities/);
    });

    it('uses no-opportunities type for no filters or search', () => {
      render(<HunterEmptyState />);
      
      // Should show general messaging
      expect(screen.getByText(/No opportunities available right now/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on action buttons', () => {
      render(
        <HunterEmptyState 
          activeFilter="staking"  // Add active filter to trigger clear filters button
          onClearFilters={mockProps.onClearFilters}
          onAdjustFilters={mockProps.onAdjustFilters}
          onViewAll={mockProps.onViewAll}
          onRefresh={mockProps.onRefresh}
        />
      );
      
      expect(screen.getByLabelText('Clear filters')).toBeInTheDocument();
      expect(screen.getByLabelText('Adjust filters')).toBeInTheDocument();
      expect(screen.getByLabelText('View all opportunities')).toBeInTheDocument();
      expect(screen.getByLabelText('Refresh data')).toBeInTheDocument();
    });

    it('maintains proper heading structure', () => {
      render(<HunterEmptyState />);
      
      const mainHeading = screen.getByRole('heading', { level: 2 });
      const subHeading = screen.getByRole('heading', { level: 3 });
      
      expect(mainHeading).toHaveTextContent('No opportunities available right now');
      expect(subHeading).toHaveTextContent('Items Scanned:');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <HunterEmptyState className="custom-hunter-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-hunter-class');
    });
  });
});