/**
 * StickySubFilters Component Tests
 * 
 * Tests for the sticky quick filters component
 * Requirements: 7.2
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StickySubFilters } from '@/components/hunter/StickySubFilters';
import { FilterState } from '@/types/hunter';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: unknown) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: unknown) => <>{children}</>,
}));

describe('StickySubFilters', () => {
  const mockOnFilterChange = vi.fn();

  const defaultFilters: FilterState = {
    search: '',
    types: [],
    chains: [],
    trustMin: 80,
    rewardMin: 0,
    rewardMax: 1000000,
    urgency: [],
    eligibleOnly: false,
    difficulty: [],
    sort: 'recommended',
    showRisky: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset scroll position
    window.scrollY = 0;
  });

  describe('Rendering', () => {
    it('should render all quick filter dropdowns', () => {
      render(
        <StickySubFilters
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByLabelText('Filter by chain')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by trust level')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by minimum reward')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by time remaining')).toBeInTheDocument();
    });

    it('should render with dark theme by default', () => {
      const { container } = render(
        <StickySubFilters
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      const trigger = screen.getByLabelText('Filter by chain');
      expect(trigger).toHaveClass('bg-white/5');
    });

    it('should render with light theme when specified', () => {
      const { container } = render(
        <StickySubFilters
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          isDarkTheme={false}
        />
      );

      const trigger = screen.getByLabelText('Filter by chain');
      expect(trigger).toHaveClass('bg-gray-50');
    });

    it('should not show active filter badge when no filters are active', () => {
      render(
        <StickySubFilters
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.queryByText(/active/)).not.toBeInTheDocument();
    });

    it('should show active filter count when filters are applied', () => {
      const filtersWithActive: FilterState = {
        ...defaultFilters,
        chains: ['ethereum'],
        rewardMin: 100,
      };

      render(
        <StickySubFilters
          filters={filtersWithActive}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('2 active')).toBeInTheDocument();
    });

    it('should show clear button when filters are active', () => {
      const filtersWithActive: FilterState = {
        ...defaultFilters,
        chains: ['ethereum'],
      };

      render(
        <StickySubFilters
          filters={filtersWithActive}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByLabelText('Clear all quick filters')).toBeInTheDocument();
    });
  });

  describe('Chain Filter', () => {
    it('should display chain filter trigger', () => {
      render(
        <StickySubFilters
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      const chainSelect = screen.getByLabelText('Filter by chain');
      expect(chainSelect).toBeInTheDocument();
    });

    it('should display selected chain in filter', () => {
      const filtersWithChain: FilterState = {
        ...defaultFilters,
        chains: ['ethereum'],
      };

      render(
        <StickySubFilters
          filters={filtersWithChain}
          onFilterChange={mockOnFilterChange}
        />
      );

      // Check that the filter shows the selected chain
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
    });
  });

  describe('Trust Filter', () => {
    it('should display trust filter trigger', () => {
      render(
        <StickySubFilters
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      const trustSelect = screen.getByLabelText('Filter by trust level');
      expect(trustSelect).toBeInTheDocument();
    });

    it('should display current trust level', () => {
      const filtersWithTrust: FilterState = {
        ...defaultFilters,
        trustMin: 60,
      };

      render(
        <StickySubFilters
          filters={filtersWithTrust}
          onFilterChange={mockOnFilterChange}
        />
      );

      // Check that the filter shows Amber trust level
      expect(screen.getByText('Amber (≥60)')).toBeInTheDocument();
    });
  });

  describe('Reward Filter', () => {
    it('should display reward filter trigger', () => {
      render(
        <StickySubFilters
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      const rewardSelect = screen.getByLabelText('Filter by minimum reward');
      expect(rewardSelect).toBeInTheDocument();
    });

    it('should display current reward minimum', () => {
      const filtersWithReward: FilterState = {
        ...defaultFilters,
        rewardMin: 500,
      };

      render(
        <StickySubFilters
          filters={filtersWithReward}
          onFilterChange={mockOnFilterChange}
        />
      );

      // Check that the filter shows the reward minimum
      expect(screen.getByText('$500+')).toBeInTheDocument();
    });
  });

  describe('Time Left Filter', () => {
    it('should display time filter trigger', () => {
      render(
        <StickySubFilters
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      const timeSelect = screen.getByLabelText('Filter by time remaining');
      expect(timeSelect).toBeInTheDocument();
    });

    it('should display urgency filter when set to new', () => {
      const filtersWithUrgency: FilterState = {
        ...defaultFilters,
        urgency: ['new'],
      };

      render(
        <StickySubFilters
          filters={filtersWithUrgency}
          onFilterChange={mockOnFilterChange}
        />
      );

      // Check that the filter shows the urgency
      expect(screen.getByText('<24 hours')).toBeInTheDocument();
    });

    it('should display urgency filter when set to ending_soon', () => {
      const filtersWithUrgency: FilterState = {
        ...defaultFilters,
        urgency: ['ending_soon'],
      };

      render(
        <StickySubFilters
          filters={filtersWithUrgency}
          onFilterChange={mockOnFilterChange}
        />
      );

      // Check that the filter shows the urgency
      expect(screen.getByText('<48 hours')).toBeInTheDocument();
    });
  });

  describe('Clear All Functionality', () => {
    it('should clear all quick filters when clear button is clicked', async () => {
      const filtersWithMultiple: FilterState = {
        ...defaultFilters,
        chains: ['ethereum', 'base'],
        trustMin: 60,
        rewardMin: 100,
        urgency: ['new'],
      };

      render(
        <StickySubFilters
          filters={filtersWithMultiple}
          onFilterChange={mockOnFilterChange}
        />
      );

      const clearButton = screen.getByLabelText('Clear all quick filters');
      fireEvent.click(clearButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        chains: [],
        trustMin: 80,
        rewardMin: 0,
        urgency: [],
      });
    });
  });

  describe('Sticky Behavior', () => {
    it('should add sticky class when scrolled past threshold', async () => {
      const { container } = render(
        <StickySubFilters
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      // Simulate scroll
      Object.defineProperty(window, 'scrollY', { value: 200, writable: true });
      fireEvent.scroll(window);

      await waitFor(() => {
        const stickyElement = container.querySelector('.fixed');
        expect(stickyElement).toBeInTheDocument();
      });
    });

    it('should render spacer when sticky to prevent content jump', async () => {
      const { container } = render(
        <StickySubFilters
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      // Simulate scroll to make it sticky
      Object.defineProperty(window, 'scrollY', { value: 200, writable: true });
      fireEvent.scroll(window);

      await waitFor(() => {
        const spacer = container.querySelector('[aria-hidden="true"]');
        expect(spacer).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels for all filters', () => {
      render(
        <StickySubFilters
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByLabelText('Filter by chain')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by trust level')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by minimum reward')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by time remaining')).toBeInTheDocument();
    });

    it('should have aria-label for clear button when visible', () => {
      const filtersWithActive: FilterState = {
        ...defaultFilters,
        chains: ['ethereum'],
      };

      render(
        <StickySubFilters
          filters={filtersWithActive}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByLabelText('Clear all quick filters')).toBeInTheDocument();
    });

    it('should hide spacer from screen readers', async () => {
      const { container } = render(
        <StickySubFilters
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      // Make it sticky
      Object.defineProperty(window, 'scrollY', { value: 200, writable: true });
      fireEvent.scroll(window);

      await waitFor(() => {
        const spacer = container.querySelector('[aria-hidden="true"]');
        expect(spacer).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Active Filter Count', () => {
    it('should count chain filters correctly', () => {
      const filters: FilterState = {
        ...defaultFilters,
        chains: ['ethereum', 'base'],
      };

      render(
        <StickySubFilters
          filters={filters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('2 active')).toBeInTheDocument();
    });

    it('should count trust filter when not default', () => {
      const filters: FilterState = {
        ...defaultFilters,
        trustMin: 60,
      };

      render(
        <StickySubFilters
          filters={filters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('1 active')).toBeInTheDocument();
    });

    it('should not count trust filter when at default (80)', () => {
      const filters: FilterState = {
        ...defaultFilters,
        trustMin: 80,
      };

      render(
        <StickySubFilters
          filters={filters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.queryByText(/active/)).not.toBeInTheDocument();
    });

    it('should count reward filter when greater than 0', () => {
      const filters: FilterState = {
        ...defaultFilters,
        rewardMin: 100,
      };

      render(
        <StickySubFilters
          filters={filters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('1 active')).toBeInTheDocument();
    });

    it('should count urgency filters correctly', () => {
      const filters: FilterState = {
        ...defaultFilters,
        urgency: ['new', 'hot'],
      };

      render(
        <StickySubFilters
          filters={filters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('2 active')).toBeInTheDocument();
    });

    it('should count all active filters together', () => {
      const filters: FilterState = {
        ...defaultFilters,
        chains: ['ethereum'],
        trustMin: 60,
        rewardMin: 100,
        urgency: ['new'],
      };

      render(
        <StickySubFilters
          filters={filters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('4 active')).toBeInTheDocument();
    });
  });
});
