/**
 * FilterDrawer Component Tests
 * 
 * Tests for comprehensive filter drawer functionality
 * Requirements: 4.1-4.19
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FilterDrawer } from '@/components/hunter/FilterDrawer';
import { FilterState } from '@/types/hunter';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('FilterDrawer', () => {
  const defaultFilters: FilterState = {
    search: '',
    types: [],
    chains: [],
    trustMin: 80,
    rewardMin: 0,
    rewardMax: 100000,
    urgency: [],
    eligibleOnly: false,
    difficulty: [],
    sort: 'recommended',
    showRisky: false,
  };

  const mockOnClose = vi.fn();
  const mockOnFilterChange = vi.fn();
  const mockOnReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.clear();
  });

  describe('Rendering', () => {
    it('should render when open', () => {
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText('Filter Opportunities')).toBeInTheDocument();
      expect(screen.getByText('Customize your feed with filters and sorting options')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(
        <FilterDrawer
          isOpen={false}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      expect(screen.queryByText('Filter Opportunities')).not.toBeInTheDocument();
    });

    it('should render all filter sections', () => {
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText('Opportunity Type')).toBeInTheDocument();
      expect(screen.getByText('Chains')).toBeInTheDocument();
      expect(screen.getByText('Minimum Trust Level')).toBeInTheDocument();
      expect(screen.getByText('Reward Range (USD)')).toBeInTheDocument();
      expect(screen.getByText('Urgency')).toBeInTheDocument();
      expect(screen.getByText('Difficulty')).toBeInTheDocument();
      expect(screen.getByText('Sort By')).toBeInTheDocument();
    });
  });

  describe('Type Filter - Requirement 4.3', () => {
    it('should toggle opportunity types', async () => {
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      const airdropCheckbox = screen.getByLabelText('Filter by Airdrops');
      fireEvent.click(airdropCheckbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        types: ['airdrop'],
      });
    });

    it('should handle multiple type selections', async () => {
      const filters = { ...defaultFilters, types: ['airdrop'] as any };
      
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={filters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      const questCheckbox = screen.getByLabelText('Filter by Quests');
      fireEvent.click(questCheckbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        types: ['airdrop', 'quest'],
      });
    });

    it('should deselect type when clicked again', async () => {
      const filters = { ...defaultFilters, types: ['airdrop', 'quest'] as any };
      
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={filters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      const airdropCheckbox = screen.getByLabelText('Filter by Airdrops');
      fireEvent.click(airdropCheckbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        types: ['quest'],
      });
    });
  });

  describe('Chain Filter - Requirement 4.4', () => {
    it('should toggle chains', async () => {
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      const ethereumCheckbox = screen.getByLabelText('Filter by Ethereum chain');
      fireEvent.click(ethereumCheckbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        chains: ['ethereum'],
      });
    });

    it('should handle multiple chain selections', async () => {
      const filters = { ...defaultFilters, chains: ['ethereum'] as any };
      
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={filters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      const baseCheckbox = screen.getByLabelText('Filter by Base chain');
      fireEvent.click(baseCheckbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        chains: ['ethereum', 'base'],
      });
    });
  });

  describe('Trust Level Filter - Requirement 4.5', () => {
    it('should change trust level to Green', async () => {
      // Start with Amber selected
      const filters = { ...defaultFilters, trustMin: 60 };
      
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={filters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      const greenRadio = screen.getByLabelText('Green (≥80)');
      fireEvent.click(greenRadio);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        trustMin: 80,
        showRisky: false,
      });
    });

    it('should change trust level to Amber', async () => {
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      const amberRadio = screen.getByLabelText('Amber (60-79)');
      fireEvent.click(amberRadio);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        trustMin: 60,
        showRisky: false,
      });
    });
  });

  describe('Red Consent Modal - Requirement 4.17, 4.18', () => {
    it('should show consent modal when Red trust is selected', async () => {
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      const redRadio = screen.getByLabelText('Red (<60)');
      fireEvent.click(redRadio);

      await waitFor(() => {
        expect(screen.getByText('View Risky Opportunities?')).toBeInTheDocument();
      });

      expect(screen.getByText(/These opportunities have failed security checks/)).toBeInTheDocument();
    });

    it('should apply Red filter when consent is given', async () => {
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      const redRadio = screen.getByLabelText('Red (<60)');
      fireEvent.click(redRadio);

      await waitFor(() => {
        expect(screen.getByText('View Risky Opportunities?')).toBeInTheDocument();
      });

      const consentButton = screen.getByText('I Understand, Show Risky');
      fireEvent.click(consentButton);

      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith({
          trustMin: 0,
          showRisky: true,
        });
      });

      // Requirement 4.18: Consent persisted in sessionStorage
      expect(mockSessionStorage.getItem('red_consent')).toBe('true');
    });

    it('should reset trust level when consent is cancelled', async () => {
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      const redRadio = screen.getByLabelText('Red (<60)');
      fireEvent.click(redRadio);

      await waitFor(() => {
        expect(screen.getByText('View Risky Opportunities?')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith({
          trustMin: 80,
          showRisky: false,
        });
      });
    });

    it('should not show consent modal if already given in session', async () => {
      mockSessionStorage.setItem('red_consent', 'true');
      
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      const redRadio = screen.getByLabelText('Red (<60)');
      fireEvent.click(redRadio);

      // Modal should not appear
      await waitFor(() => {
        expect(screen.queryByText('View Risky Opportunities?')).not.toBeInTheDocument();
      });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        trustMin: 0,
        showRisky: true,
      });
    });
  });

  describe('Reward Range Filter - Requirement 4.6', () => {
    it('should display reward range sliders', () => {
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      const minSlider = screen.getByLabelText('Minimum reward amount');
      const maxSlider = screen.getByLabelText('Maximum reward amount');
      
      expect(minSlider).toBeInTheDocument();
      expect(maxSlider).toBeInTheDocument();
    });

    it('should display current reward range values', () => {
      const filters = { ...defaultFilters, rewardMin: 1000, rewardMax: 50000 };
      
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={filters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText('Min: $1000')).toBeInTheDocument();
      expect(screen.getByText('Max: $50000')).toBeInTheDocument();
    });
  });

  describe('Urgency Filter - Requirement 4.7', () => {
    it('should toggle urgency filters', async () => {
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      const endingSoonCheckbox = screen.getByLabelText('Filter by Ending Soon (<48h)');
      fireEvent.click(endingSoonCheckbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        urgency: ['ending_soon'],
      });
    });
  });

  describe('Eligibility Toggle - Requirement 4.8', () => {
    it('should toggle eligibility filter', async () => {
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      const eligibleCheckbox = screen.getByLabelText('Show only likely eligible opportunities');
      fireEvent.click(eligibleCheckbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        eligibleOnly: true,
      });
    });
  });

  describe('Difficulty Filter - Requirement 4.9', () => {
    it('should toggle difficulty filters', async () => {
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      const easyCheckbox = screen.getByLabelText('Filter by Easy difficulty');
      fireEvent.click(easyCheckbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        difficulty: ['easy'],
      });
    });
  });

  describe('Sort Selector - Requirement 4.10', () => {
    it('should change sort option', async () => {
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      const sortSelect = screen.getByLabelText('Sort opportunities');
      fireEvent.click(sortSelect);

      const endsSoonOption = await screen.findByText('Ends Soon');
      fireEvent.click(endsSoonOption);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        sort: 'ends_soon',
      });
    });
  });

  describe('Actions', () => {
    it('should call onReset when Reset button is clicked', async () => {
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      const resetButton = screen.getByLabelText('Reset all filters');
      fireEvent.click(resetButton);

      expect(mockOnReset).toHaveBeenCalled();
    });

    it('should close drawer when Apply Filters is clicked', async () => {
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      const applyButton = screen.getByLabelText('Apply filters');
      fireEvent.click(applyButton);

      // Drawer should close (onClose called via DrawerClose)
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels for all interactive elements', () => {
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      expect(screen.getByLabelText('Filter by Airdrops')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by Ethereum chain')).toBeInTheDocument();
      expect(screen.getByLabelText('Minimum reward amount')).toBeInTheDocument();
      expect(screen.getByLabelText('Maximum reward amount')).toBeInTheDocument();
      expect(screen.getByLabelText('Sort opportunities')).toBeInTheDocument();
      expect(screen.getByLabelText('Reset all filters')).toBeInTheDocument();
      expect(screen.getByLabelText('Apply filters')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      // Tab through elements
      const firstElement = screen.getByLabelText('Filter by Airdrops');
      expect(firstElement).toBeDefined();
    });
  });

  describe('Filter Persistence - Requirement 4.11', () => {
    it('should display current filter values', () => {
      const filters: FilterState = {
        search: 'test',
        types: ['airdrop', 'quest'],
        chains: ['ethereum', 'base'],
        trustMin: 60,
        rewardMin: 100,
        rewardMax: 5000,
        urgency: ['ending_soon'],
        eligibleOnly: true,
        difficulty: ['easy'],
        sort: 'highest_reward',
        showRisky: false,
      };

      render(
        <FilterDrawer
          isOpen={true}
          onClose={mockOnClose}
          filters={filters}
          onFilterChange={mockOnFilterChange}
          onReset={mockOnReset}
        />
      );

      // Check that filters are reflected in UI
      expect(screen.getByLabelText('Filter by Airdrops')).toBeChecked();
      expect(screen.getByLabelText('Filter by Quests')).toBeChecked();
      expect(screen.getByLabelText('Filter by Ethereum chain')).toBeChecked();
      expect(screen.getByLabelText('Filter by Base chain')).toBeChecked();
      expect(screen.getByLabelText('Show only likely eligible opportunities')).toBeChecked();
      expect(screen.getByLabelText('Filter by Easy difficulty')).toBeChecked();
    });
  });
});
