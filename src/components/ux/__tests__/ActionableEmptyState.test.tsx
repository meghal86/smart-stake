import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActionableEmptyState, type EmptyStateAction, type ScanChecklist } from '../ActionableEmptyState';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('ActionableEmptyState', () => {
  const mockActions: EmptyStateAction[] = [
    {
      label: 'Primary Action',
      onClick: vi.fn(),
      variant: 'default'
    },
    {
      label: 'Secondary Action',
      onClick: vi.fn(),
      variant: 'outline'
    }
  ];

  const mockChecklist: ScanChecklist[] = [
    { item: 'First item', checked: true, description: 'Completed' },
    { item: 'Second item', checked: true },
    { item: 'Third item', checked: false }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default no-risks-detected type', () => {
      render(<ActionableEmptyState type="no-risks-detected" />);
      
      expect(screen.getByText('No Active Risks Detected')).toBeInTheDocument();
      expect(screen.getByText(/Your wallet appears secure/)).toBeInTheDocument();
    });

    it('renders with custom title and description', () => {
      render(
        <ActionableEmptyState
          type="no-opportunities"
          title="Custom Title"
          description="Custom description text"
        />
      );
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom description text')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ActionableEmptyState
          type="no-data-available"
          className="custom-class"
        />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Empty State Types', () => {
    it('renders no-opportunities type correctly', () => {
      render(<ActionableEmptyState type="no-opportunities" />);
      
      expect(screen.getByText('No Opportunities Available')).toBeInTheDocument();
      expect(screen.getByText(/AI Copilot is continuously scanning/)).toBeInTheDocument();
    });

    it('renders no-search-results type correctly', () => {
      render(<ActionableEmptyState type="no-search-results" />);
      
      expect(screen.getByText('No Results Found')).toBeInTheDocument();
      expect(screen.getByText(/Try adjusting your search terms/)).toBeInTheDocument();
    });

    it('renders scanning-in-progress type correctly', () => {
      render(<ActionableEmptyState type="scanning-in-progress" />);
      
      expect(screen.getByText('Scanning in Progress')).toBeInTheDocument();
      expect(screen.getByText(/AI Copilot is analyzing/)).toBeInTheDocument();
    });

    it('renders temporary-unavailable type correctly', () => {
      render(<ActionableEmptyState type="temporary-unavailable" />);
      
      expect(screen.getByText('Temporarily Unavailable')).toBeInTheDocument();
      expect(screen.getByText(/temporarily unavailable/)).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('renders action buttons correctly', () => {
      render(
        <ActionableEmptyState
          type="no-data-available"
          actions={mockActions}
        />
      );
      
      expect(screen.getByText('Primary Action')).toBeInTheDocument();
      expect(screen.getByText('Secondary Action')).toBeInTheDocument();
    });

    it('calls action onClick when button is clicked', () => {
      render(
        <ActionableEmptyState
          type="no-data-available"
          actions={mockActions}
        />
      );
      
      fireEvent.click(screen.getByText('Primary Action'));
      expect(mockActions[0].onClick).toHaveBeenCalledTimes(1);
    });

    it('handles external links correctly', () => {
      const mockOpen = vi.fn();
      Object.defineProperty(window, 'open', { value: mockOpen });

      const externalAction: EmptyStateAction = {
        label: 'External Link',
        onClick: vi.fn(),
        href: 'https://example.com',
        external: true
      };

      render(
        <ActionableEmptyState
          type="no-data-available"
          actions={[externalAction]}
        />
      );
      
      fireEvent.click(screen.getByText('External Link'));
      expect(mockOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    });
  });

  describe('Scan Checklist', () => {
    it('renders scan checklist when provided', () => {
      render(
        <ActionableEmptyState
          type="no-risks-detected"
          scanChecklist={mockChecklist}
        />
      );
      
      expect(screen.getByText('Items Scanned:')).toBeInTheDocument();
      expect(screen.getByText('First item')).toBeInTheDocument();
      expect(screen.getByText('Second item')).toBeInTheDocument();
      expect(screen.getByText('Third item')).toBeInTheDocument();
      expect(screen.getByText('(Completed)')).toBeInTheDocument();
    });

    it('shows correct check icons for completed/incomplete items', () => {
      render(
        <ActionableEmptyState
          type="no-risks-detected"
          scanChecklist={mockChecklist}
        />
      );
      
      const checkIcons = screen.getAllByLabelText(/Completed|Not completed/);
      expect(checkIcons).toHaveLength(3);
      expect(checkIcons[0]).toHaveAttribute('aria-label', 'Completed');
      expect(checkIcons[1]).toHaveAttribute('aria-label', 'Completed');
      expect(checkIcons[2]).toHaveAttribute('aria-label', 'Not completed');
    });

    it('renders default checklist for no-risks-detected type', () => {
      render(<ActionableEmptyState type="no-risks-detected" />);
      
      expect(screen.getByText('Items Scanned:')).toBeInTheDocument();
      expect(screen.getByText('Transaction patterns analyzed')).toBeInTheDocument();
      expect(screen.getByText('Smart contract interactions reviewed')).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('renders refresh button when showRefresh is true', () => {
      const mockRefresh = vi.fn();
      render(
        <ActionableEmptyState
          type="no-data-available"
          showRefresh={true}
          onRefresh={mockRefresh}
        />
      );
      
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('calls onRefresh when refresh button is clicked', () => {
      const mockRefresh = vi.fn();
      render(
        <ActionableEmptyState
          type="no-data-available"
          showRefresh={true}
          onRefresh={mockRefresh}
        />
      );
      
      fireEvent.click(screen.getByText('Refresh'));
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('shows refreshing state correctly', () => {
      const mockRefresh = vi.fn();
      render(
        <ActionableEmptyState
          type="no-data-available"
          showRefresh={true}
          onRefresh={mockRefresh}
          isRefreshing={true}
        />
      );
      
      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
      expect(screen.getByText('Refreshing...')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on buttons', () => {
      render(
        <ActionableEmptyState
          type="no-data-available"
          actions={mockActions}
          showRefresh={true}
          onRefresh={vi.fn()}
        />
      );
      
      expect(screen.getByLabelText('Primary Action')).toBeInTheDocument();
      expect(screen.getByLabelText('Secondary Action')).toBeInTheDocument();
      expect(screen.getByLabelText('Refresh data')).toBeInTheDocument();
    });

    it('has proper ARIA labels on checklist icons', () => {
      render(
        <ActionableEmptyState
          type="no-risks-detected"
          scanChecklist={mockChecklist}
        />
      );
      
      const completedIcons = screen.getAllByLabelText('Completed');
      const notCompletedIcons = screen.getAllByLabelText('Not completed');
      
      expect(completedIcons).toHaveLength(2);
      expect(notCompletedIcons).toHaveLength(1);
    });

    it('maintains proper heading hierarchy', () => {
      render(
        <ActionableEmptyState
          type="no-risks-detected"
          scanChecklist={mockChecklist}
        />
      );
      
      const mainHeading = screen.getByRole('heading', { level: 2 });
      const subHeading = screen.getByRole('heading', { level: 3 });
      
      expect(mainHeading).toHaveTextContent('No Active Risks Detected');
      expect(subHeading).toHaveTextContent('Items Scanned:');
    });
  });

  describe('WCAG AA Contrast Compliance', () => {
    it('uses appropriate color classes for text contrast', () => {
      render(<ActionableEmptyState type="no-risks-detected" />);
      
      // Check that text uses proper contrast classes
      const title = screen.getByText('No Active Risks Detected');
      const description = screen.getByText(/Your wallet appears secure/);
      
      expect(title).toHaveClass('text-foreground');
      expect(description).toHaveClass('text-muted-foreground');
    });
  });
});