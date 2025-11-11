import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HunterTabs, TabType } from '@/components/hunter/HunterTabs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock React Router navigation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useSearchParams: vi.fn(),
  };
});

describe('HunterTabs', () => {
  const mockNavigate = vi.fn();
  const mockOnTabChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as Mock).mockReturnValue(mockNavigate);
    (useSearchParams as Mock).mockReturnValue([new URLSearchParams(), vi.fn()]);
  });

  describe('Rendering', () => {
    it('should render all required tabs', () => {
      render(
        <HunterTabs activeTab="All" onTabChange={mockOnTabChange} />
      );

      // Requirement 7.1: tabs SHALL display: All / Airdrops / Quests / Yield / Points / Featured
      expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Airdrops' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Quests' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Yield' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Points' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Featured' })).toBeInTheDocument();
    });

    it('should mark active tab with aria-selected', () => {
      render(
        <HunterTabs activeTab="Airdrops" onTabChange={mockOnTabChange} />
      );

      const airdropsTab = screen.getByRole('tab', { name: 'Airdrops' });
      expect(airdropsTab).toHaveAttribute('aria-selected', 'true');

      const allTab = screen.getByRole('tab', { name: 'All' });
      expect(allTab).toHaveAttribute('aria-selected', 'false');
    });

    it('should apply correct styling to active tab', () => {
      render(
        <HunterTabs activeTab="Quests" onTabChange={mockOnTabChange} />
      );

      const questsTab = screen.getByRole('tab', { name: 'Quests' });
      expect(questsTab).toHaveClass('font-medium');
    });

    it('should render with dark theme by default', () => {
      const { container } = render(
        <HunterTabs activeTab="All" onTabChange={mockOnTabChange} />
      );

      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('text-gray-300');
    });

    it('should render with light theme when specified', () => {
      const { container } = render(
        <HunterTabs activeTab="All" onTabChange={mockOnTabChange} isDarkTheme={false} />
      );

      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('text-[#444C56]');
    });
  });

  describe('Tab Navigation', () => {
    it('should call onTabChange when tab is clicked', () => {
      render(
        <HunterTabs activeTab="All" onTabChange={mockOnTabChange} />
      );

      const airdropsTab = screen.getByRole('tab', { name: 'Airdrops' });
      fireEvent.click(airdropsTab);

      expect(mockOnTabChange).toHaveBeenCalledWith('Airdrops');
    });

    it('should update URL query parameter when tab is clicked', () => {
      render(
        <HunterTabs activeTab="All" onTabChange={mockOnTabChange} />
      );

      const yieldsTab = screen.getByRole('tab', { name: 'Yield' });
      fireEvent.click(yieldsTab);

      expect(mockNavigate).toHaveBeenCalledWith('?tab=Yield', { replace: true });
    });

    it('should remove tab parameter when All tab is clicked', () => {
      (useSearchParams as Mock).mockReturnValue([new URLSearchParams('tab=Airdrops'), vi.fn()]);

      render(
        <HunterTabs activeTab="Airdrops" onTabChange={mockOnTabChange} />
      );

      const allTab = screen.getByRole('tab', { name: 'All' });
      fireEvent.click(allTab);

      // Should navigate to base path without query params
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^[^?]*$/), { replace: true });
    });

    it('should preserve other query parameters when changing tabs', () => {
      (useSearchParams as Mock).mockReturnValue([new URLSearchParams('search=test&sort=newest'), vi.fn()]);

      render(
        <HunterTabs activeTab="All" onTabChange={mockOnTabChange} />
      );

      const pointsTab = screen.getByRole('tab', { name: 'Points' });
      fireEvent.click(pointsTab);

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('search=test'),
        { replace: true }
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('sort=newest'),
        { replace: true }
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('tab=Points'),
        { replace: true }
      );
    });
  });

  describe('URL Synchronization', () => {
    it('should sync active tab from URL on mount', async () => {
      (useSearchParams as Mock).mockReturnValue([new URLSearchParams('tab=Featured'), vi.fn()]);

      render(
        <HunterTabs activeTab="All" onTabChange={mockOnTabChange} />
      );

      await waitFor(() => {
        expect(mockOnTabChange).toHaveBeenCalledWith('Featured');
      });
    });

    it('should not sync if URL tab matches active tab', () => {
      (useSearchParams as Mock).mockReturnValue([new URLSearchParams('tab=Quests'), vi.fn()]);

      render(
        <HunterTabs activeTab="Quests" onTabChange={mockOnTabChange} />
      );

      expect(mockOnTabChange).not.toHaveBeenCalled();
    });

    it('should ignore invalid tab values in URL', () => {
      (useSearchParams as Mock).mockReturnValue([new URLSearchParams('tab=InvalidTab'), vi.fn()]);

      render(
        <HunterTabs activeTab="All" onTabChange={mockOnTabChange} />
      );

      expect(mockOnTabChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = render(
        <HunterTabs activeTab="All" onTabChange={mockOnTabChange} />
      );

      const nav = container.querySelector('nav');
      expect(nav).toHaveAttribute('role', 'tablist');
      expect(nav).toHaveAttribute('aria-label', 'Opportunity categories');
    });

    it('should have aria-controls for each tab', () => {
      render(
        <HunterTabs activeTab="All" onTabChange={mockOnTabChange} />
      );

      const allTab = screen.getByRole('tab', { name: 'All' });
      expect(allTab).toHaveAttribute('aria-controls', 'all-panel');

      const airdropsTab = screen.getByRole('tab', { name: 'Airdrops' });
      expect(airdropsTab).toHaveAttribute('aria-controls', 'airdrops-panel');
    });

    it('should be keyboard navigable', () => {
      render(
        <HunterTabs activeTab="All" onTabChange={mockOnTabChange} />
      );

      const airdropsTab = screen.getByRole('tab', { name: 'Airdrops' });
      airdropsTab.focus();
      
      expect(document.activeElement).toBe(airdropsTab);
    });
  });

  describe('All Tab Types', () => {
    const tabs: TabType[] = ['All', 'Airdrops', 'Quests', 'Yield', 'Points', 'Featured'];

    tabs.forEach((tab) => {
      it(`should handle ${tab} tab correctly`, () => {
        render(
          <HunterTabs activeTab={tab} onTabChange={mockOnTabChange} />
        );

        const tabElement = screen.getByRole('tab', { name: tab });
        expect(tabElement).toHaveAttribute('aria-selected', 'true');
      });
    });
  });
});
