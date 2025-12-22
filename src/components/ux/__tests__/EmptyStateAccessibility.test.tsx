import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ActionableEmptyState } from '../ActionableEmptyState';
import { GuardianEmptyState } from '../GuardianEmptyState';
import { HunterEmptyState } from '../HunterEmptyState';
import { PortfolioEmptyState } from '../PortfolioEmptyState';
import { SearchEmptyState } from '../SearchEmptyState';
import { SettingsEmptyState } from '../SettingsEmptyState';
import { HarvestProEmptyState } from '../HarvestProEmptyState';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('Empty State Accessibility Compliance', () => {
  describe('WCAG AA Compliance', () => {
    it('ActionableEmptyState has no accessibility violations', async () => {
      const { container } = render(
        <ActionableEmptyState
          type="no-risks-detected"
          actions={[
            { label: 'Test Action', onClick: vi.fn() },
            { label: 'External Link', onClick: vi.fn(), external: true }
          ]}
          scanChecklist={[
            { item: 'Test item 1', checked: true },
            { item: 'Test item 2', checked: false }
          ]}
          showRefresh={true}
          onRefresh={vi.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('GuardianEmptyState has no accessibility violations', async () => {
      const { container } = render(
        <GuardianEmptyState
          walletAddress="0x1234567890123456789012345678901234567890"
          onLearnMore={vi.fn()}
          onAdjustSettings={vi.fn()}
          onRescan={vi.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('HunterEmptyState has no accessibility violations', async () => {
      const { container } = render(
        <HunterEmptyState
          activeFilter="staking"
          onClearFilters={vi.fn()}
          onAdjustFilters={vi.fn()}
          onViewAll={vi.fn()}
          onRefresh={vi.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('PortfolioEmptyState has no accessibility violations', async () => {
      const { container } = render(
        <PortfolioEmptyState
          hasWalletConnected={false}
          onConnectWallet={vi.fn()}
          onAddAddress={vi.fn()}
          onRefresh={vi.fn()}
          onLearnMore={vi.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('SearchEmptyState has no accessibility violations', async () => {
      const { container } = render(
        <SearchEmptyState
          searchQuery="test query"
          searchCategory="opportunities"
          onClearSearch={vi.fn()}
          onBrowseAll={vi.fn()}
          onAdjustFilters={vi.fn()}
          suggestedTerms={['term1', 'term2', 'term3']}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('SettingsEmptyState has no accessibility violations', async () => {
      const { container } = render(
        <SettingsEmptyState
          settingsType="profile"
          onSetupProfile={vi.fn()}
          onRefresh={vi.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('HarvestProEmptyState has no accessibility violations', async () => {
      const { container } = render(
        <HarvestProEmptyState
          hasWalletConnected={false}
          onConnectWallet={vi.fn()}
          onLearnMore={vi.fn()}
          onRefresh={vi.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('all interactive elements are keyboard accessible', () => {
      render(
        <ActionableEmptyState
          type="no-opportunities"
          actions={[
            { label: 'Primary Action', onClick: vi.fn() },
            { label: 'Secondary Action', onClick: vi.fn() }
          ]}
          showRefresh={true}
          onRefresh={vi.fn()}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Buttons are keyboard accessible by default, tabIndex may not be explicitly set
        expect(button.tabIndex).toBeGreaterThanOrEqual(0);
      });
    });

    it('maintains logical tab order', () => {
      render(
        <ActionableEmptyState
          type="no-opportunities"
          actions={[
            { label: 'First Action', onClick: vi.fn() },
            { label: 'Second Action', onClick: vi.fn() }
          ]}
          showRefresh={true}
          onRefresh={vi.fn()}
        />
      );

      const buttons = screen.getAllByRole('button');
      const tabIndices = buttons.map(button => button.tabIndex);
      
      // All buttons should have tabIndex 0 (natural tab order)
      tabIndices.forEach(tabIndex => {
        expect(tabIndex).toBe(0);
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('provides proper ARIA labels for all interactive elements', () => {
      render(
        <ActionableEmptyState
          type="no-risks-detected"
          actions={[
            { label: 'Learn More', onClick: vi.fn() },
            { label: 'Adjust Settings', onClick: vi.fn() }
          ]}
          showRefresh={true}
          onRefresh={vi.fn()}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        const ariaLabel = button.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel!.length).toBeGreaterThan(0);
      });
    });

    it('provides proper status indicators for checklist items', () => {
      render(
        <ActionableEmptyState
          type="no-risks-detected"
          scanChecklist={[
            { item: 'Completed item', checked: true },
            { item: 'Incomplete item', checked: false }
          ]}
        />
      );

      const completedIcon = screen.getByLabelText('Completed');
      const incompleteIcon = screen.getByLabelText('Not completed');
      
      expect(completedIcon).toBeInTheDocument();
      expect(incompleteIcon).toBeInTheDocument();
    });

    it('maintains proper heading hierarchy', () => {
      render(
        <ActionableEmptyState
          type="no-risks-detected"
          scanChecklist={[
            { item: 'Test item', checked: true }
          ]}
        />
      );

      const mainHeading = screen.getByRole('heading', { level: 2 });
      const subHeading = screen.getByRole('heading', { level: 3 });
      
      expect(mainHeading).toBeInTheDocument();
      expect(subHeading).toBeInTheDocument();
      expect(mainHeading.textContent).toBeTruthy();
      expect(subHeading.textContent).toBeTruthy();
    });
  });

  describe('Color Contrast Compliance', () => {
    it('uses proper contrast classes for text elements', () => {
      render(
        <ActionableEmptyState
          type="no-risks-detected"
          scanChecklist={[
            { item: 'Test item', checked: true, description: 'Test description' }
          ]}
        />
      );

      // Main title should use high contrast
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toHaveClass('text-foreground');

      // Description should use medium contrast but still WCAG AA compliant
      const description = screen.getByText(/Your wallet appears secure/);
      expect(description).toHaveClass('text-muted-foreground');
    });

    it('uses appropriate icon colors for different states', () => {
      const { rerender } = render(
        <ActionableEmptyState type="no-risks-detected" />
      );

      // Test different empty state types render without errors
      // (Color contrast is handled by CSS classes which are tested above)
      rerender(<ActionableEmptyState type="no-opportunities" />);
      rerender(<ActionableEmptyState type="temporary-unavailable" />);
      rerender(<ActionableEmptyState type="no-data-available" />);

      // Each should render successfully with proper heading
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('maintains focus visibility on interactive elements', () => {
      render(
        <ActionableEmptyState
          type="no-opportunities"
          actions={[
            { label: 'Test Action', onClick: vi.fn() }
          ]}
        />
      );

      const button = screen.getByRole('button');
      button.focus();
      
      expect(document.activeElement).toBe(button);
    });

    it('handles disabled state properly for refresh button', () => {
      render(
        <ActionableEmptyState
          type="no-data-available"
          showRefresh={true}
          onRefresh={vi.fn()}
          isRefreshing={true}
        />
      );

      const refreshButton = screen.getByText('Refreshing...');
      expect(refreshButton).toBeDisabled();
      expect(refreshButton).toHaveAttribute('disabled');
    });
  });

  describe('Responsive Design Accessibility', () => {
    it('maintains accessibility across different viewport sizes', () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { rerender } = render(
        <ActionableEmptyState
          type="no-opportunities"
          actions={[
            { label: 'Action 1', onClick: vi.fn() },
            { label: 'Action 2', onClick: vi.fn() }
          ]}
        />
      );

      // Buttons should still be accessible on mobile
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });

      // Test desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      rerender(
        <ActionableEmptyState
          type="no-opportunities"
          actions={[
            { label: 'Action 1', onClick: vi.fn() },
            { label: 'Action 2', onClick: vi.fn() }
          ]}
        />
      );

      // Accessibility should be maintained on desktop
      const desktopButtons = screen.getAllByRole('button');
      desktopButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Error State Accessibility', () => {
    it('provides accessible error messaging', () => {
      render(
        <ActionableEmptyState
          type="temporary-unavailable"
          actions={[
            { label: 'Try Again', onClick: vi.fn() }
          ]}
        />
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Temporarily Unavailable');
      
      const tryAgainButton = screen.getByLabelText('Try Again');
      expect(tryAgainButton).toBeInTheDocument();
    });
  });
});