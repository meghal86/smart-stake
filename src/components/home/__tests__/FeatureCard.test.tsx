import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Shield } from 'lucide-react';
import { FeatureCard } from '../FeatureCard';

// Mock next/router
const mockPush = vi.fn();
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('FeatureCard', () => {
  const defaultProps = {
    feature: 'guardian' as const,
    icon: Shield,
    title: 'Guardian',
    tagline: 'Secure your wallet',
    previewLabel: 'Guardian Score',
    previewValue: 89,
    previewDescription: 'Your security rating',
    primaryRoute: '/guardian',
    demoRoute: '/guardian/demo',
  };

  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('Rendering', () => {
    test('renders all required elements', () => {
      render(<FeatureCard {...defaultProps} />);

      // Check title
      expect(screen.getByText('Guardian')).toBeInTheDocument();

      // Check tagline
      expect(screen.getByText('Secure your wallet')).toBeInTheDocument();

      // Check preview label
      expect(screen.getByText('Guardian Score')).toBeInTheDocument();

      // Check preview value
      expect(screen.getByText('89')).toBeInTheDocument();

      // Check preview description
      expect(screen.getByText('Your security rating')).toBeInTheDocument();

      // Check primary button
      expect(screen.getByRole('button', { name: 'View Guardian' })).toBeInTheDocument();

      // Check secondary button
      expect(screen.getByRole('button', { name: 'View Guardian demo' })).toBeInTheDocument();
    });

    test('renders icon correctly', () => {
      const { container } = render(<FeatureCard {...defaultProps} />);

      // Check that icon container exists
      const iconContainer = container.querySelector('.w-12.h-12');
      expect(iconContainer).toBeInTheDocument();
    });

    test('applies correct data-testid', () => {
      render(<FeatureCard {...defaultProps} />);

      expect(screen.getByTestId('guardian-card')).toBeInTheDocument();
      expect(screen.getByTestId('guardian-preview-value')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('shows skeleton when isLoading is true', () => {
      render(<FeatureCard {...defaultProps} isLoading={true} />);

      // Skeleton should be shown
      expect(screen.getByRole('status', { name: /loading feature card/i })).toBeInTheDocument();

      // Content should not be shown
      expect(screen.queryByText('Guardian')).not.toBeInTheDocument();
    });
  });

  describe('Demo Mode', () => {
    test('shows demo badge when isDemo is true', () => {
      render(<FeatureCard {...defaultProps} isDemo={true} />);

      const demoBadge = screen.getByTestId('demo-badge');
      expect(demoBadge).toBeInTheDocument();
      expect(demoBadge).toHaveTextContent('Demo');
    });

    test('does not show demo badge when isDemo is false', () => {
      render(<FeatureCard {...defaultProps} isDemo={false} />);

      expect(screen.queryByTestId('demo-badge')).not.toBeInTheDocument();
    });

    test('does not show demo badge when error exists', () => {
      render(<FeatureCard {...defaultProps} isDemo={true} error="Failed to load" />);

      expect(screen.queryByTestId('demo-badge')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    test('shows fallback value when error exists', () => {
      render(<FeatureCard {...defaultProps} error="Failed to load data" />);

      // Should show "—" instead of actual value
      expect(screen.getByTestId('guardian-preview-value')).toHaveTextContent('—');
    });

    test('shows error message instead of description', () => {
      const errorMessage = 'Failed to load data';
      render(<FeatureCard {...defaultProps} error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.queryByText('Your security rating')).not.toBeInTheDocument();
    });

    test('shows retry button when error exists', () => {
      render(<FeatureCard {...defaultProps} error="Failed to load" />);

      expect(screen.getByRole('button', { name: /retry loading data/i })).toBeInTheDocument();
    });

    test('does not show demo button when error exists', () => {
      render(<FeatureCard {...defaultProps} error="Failed to load" />);

      expect(screen.queryByRole('button', { name: /view guardian demo/i })).not.toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    test('primary button navigates to correct route', () => {
      render(<FeatureCard {...defaultProps} />);

      const primaryButton = screen.getByRole('button', { name: 'View Guardian' });
      fireEvent.click(primaryButton);

      expect(mockPush).toHaveBeenCalledWith('/guardian');
    });

    test('secondary button navigates to demo route', () => {
      render(<FeatureCard {...defaultProps} />);

      const secondaryButton = screen.getByRole('button', { name: 'View Guardian demo' });
      fireEvent.click(secondaryButton);

      expect(mockPush).toHaveBeenCalledWith('/guardian/demo');
    });

    test('retry button navigates to primary route', () => {
      render(<FeatureCard {...defaultProps} error="Failed to load" />);

      const retryButton = screen.getByRole('button', { name: 'Retry loading data' });
      fireEvent.click(retryButton);

      expect(mockPush).toHaveBeenCalledWith('/guardian');
    });

    test('does not show secondary button when demoRoute is not provided', () => {
      const propsWithoutDemo = { ...defaultProps, demoRoute: undefined };
      render(<FeatureCard {...propsWithoutDemo} />);

      expect(screen.queryByRole('button', { name: /demo/i })).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    test('primary button responds to Enter key', () => {
      render(<FeatureCard {...defaultProps} />);

      const primaryButton = screen.getByRole('button', { name: 'View Guardian' });
      fireEvent.keyDown(primaryButton, { key: 'Enter' });

      expect(mockPush).toHaveBeenCalledWith('/guardian');
    });

    test('primary button responds to Space key', () => {
      render(<FeatureCard {...defaultProps} />);

      const primaryButton = screen.getByRole('button', { name: 'View Guardian' });
      fireEvent.keyDown(primaryButton, { key: ' ' });

      expect(mockPush).toHaveBeenCalledWith('/guardian');
    });

    test('secondary button responds to Enter key', () => {
      render(<FeatureCard {...defaultProps} />);

      const secondaryButton = screen.getByRole('button', { name: 'View Guardian demo' });
      fireEvent.keyDown(secondaryButton, { key: 'Enter' });

      expect(mockPush).toHaveBeenCalledWith('/guardian/demo');
    });

    test('secondary button responds to Space key', () => {
      render(<FeatureCard {...defaultProps} />);

      const secondaryButton = screen.getByRole('button', { name: 'View Guardian demo' });
      fireEvent.keyDown(secondaryButton, { key: ' ' });

      expect(mockPush).toHaveBeenCalledWith('/guardian/demo');
    });

    test('buttons have correct tabIndex', () => {
      render(<FeatureCard {...defaultProps} />);

      const primaryButton = screen.getByRole('button', { name: 'View Guardian' });
      const secondaryButton = screen.getByRole('button', { name: 'View Guardian demo' });

      expect(primaryButton).toHaveAttribute('tabIndex', '0');
      expect(secondaryButton).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      render(<FeatureCard {...defaultProps} />);

      expect(screen.getByRole('article', { name: /guardian feature card/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View Guardian' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View Guardian demo' })).toBeInTheDocument();
    });

    test('demo badge has ARIA label', () => {
      render(<FeatureCard {...defaultProps} isDemo={true} />);

      const demoBadge = screen.getByTestId('demo-badge');
      expect(demoBadge).toHaveAttribute('aria-label', 'Demo mode');
    });

    test('touch targets meet minimum height requirement', () => {
      const { container } = render(<FeatureCard {...defaultProps} />);

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        // Check that buttons have min-h-[44px] class
        expect(button.className).toContain('min-h-[44px]');
      });
    });
  });

  describe('Different Feature Types', () => {
    test('renders Hunter feature correctly', () => {
      const hunterProps = {
        ...defaultProps,
        feature: 'hunter' as const,
        title: 'Hunter',
        tagline: 'Hunt alpha opportunities',
        previewLabel: 'Opportunities',
        previewValue: 42,
        previewDescription: 'Available opportunities',
        primaryRoute: '/hunter',
      };

      render(<FeatureCard {...hunterProps} />);

      expect(screen.getByText('Hunter')).toBeInTheDocument();
      expect(screen.getByText('Hunt alpha opportunities')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    test('renders HarvestPro feature correctly', () => {
      const harvestProps = {
        ...defaultProps,
        feature: 'harvestpro' as const,
        title: 'HarvestPro',
        tagline: 'Harvest tax losses',
        previewLabel: 'Tax Benefit',
        previewValue: '$12,400',
        previewDescription: 'Estimated savings',
        primaryRoute: '/harvestpro',
      };

      render(<FeatureCard {...harvestProps} />);

      expect(screen.getByText('HarvestPro')).toBeInTheDocument();
      expect(screen.getByText('Harvest tax losses')).toBeInTheDocument();
      expect(screen.getByText('$12,400')).toBeInTheDocument();
    });
  });

  describe('Value Types', () => {
    test('renders numeric values correctly', () => {
      render(<FeatureCard {...defaultProps} previewValue={89} />);

      expect(screen.getByTestId('guardian-preview-value')).toHaveTextContent('89');
    });

    test('renders string values correctly', () => {
      render(<FeatureCard {...defaultProps} previewValue="$12,400" />);

      expect(screen.getByTestId('guardian-preview-value')).toHaveTextContent('$12,400');
    });
  });
});
