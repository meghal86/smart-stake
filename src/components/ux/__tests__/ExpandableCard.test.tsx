/**
 * Unit Tests for ExpandableCard Component
 * 
 * Tests expandable card functionality, animations, and accessibility.
 * Validates: R12.DISCLOSURE.EXPANDABLE_CARDS, R12.DISCLOSURE.SMOOTH_ANIMATIONS
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ExpandableCard, ExpandableCardSection, ExpandableCardGrid } from '../ExpandableCard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>
}));

describe('ExpandableCard', () => {
  const defaultProps = {
    id: 'test-card',
    children: <div>Main content</div>,
    expandedContent: <div>Expanded content</div>
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders main content by default', () => {
    render(<ExpandableCard {...defaultProps} />);
    
    expect(screen.getByText('Main content')).toBeInTheDocument();
    expect(screen.queryByText('Expanded content')).not.toBeInTheDocument();
  });

  test('shows toggle button when showToggleButton is true', () => {
    render(<ExpandableCard {...defaultProps} showToggleButton={true} />);
    
    expect(screen.getByRole('button', { name: /see details/i })).toBeInTheDocument();
  });

  test('hides toggle button when showToggleButton is false', () => {
    render(<ExpandableCard {...defaultProps} showToggleButton={false} />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('expands content when toggle button is clicked', async () => {
    render(<ExpandableCard {...defaultProps} showToggleButton={true} />);
    
    const toggleButton = screen.getByRole('button', { name: /see details/i });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByText('Expanded content')).toBeInTheDocument();
    });
  });

  test('changes button text when expanded', async () => {
    render(<ExpandableCard {...defaultProps} showToggleButton={true} />);
    
    const toggleButton = screen.getByRole('button', { name: /see details/i });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
    });
  });

  test('collapses content when toggle button is clicked again', async () => {
    render(<ExpandableCard {...defaultProps} showToggleButton={true} />);
    
    const toggleButton = screen.getByRole('button', { name: /see details/i });
    
    // Expand
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(screen.getByText('Expanded content')).toBeInTheDocument();
    });
    
    // Collapse
    const collapseButton = screen.getByRole('button', { name: /show less/i });
    fireEvent.click(collapseButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Expanded content')).not.toBeInTheDocument();
    });
  });

  test('renders custom toggle button when provided', () => {
    const customToggle = <button>Custom Toggle</button>;
    
    render(
      <ExpandableCard 
        {...defaultProps} 
        showToggleButton={true}
        toggleButton={customToggle}
      />
    );
    
    expect(screen.getByRole('button', { name: /custom toggle/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /see details/i })).not.toBeInTheDocument();
  });

  test('renders header when provided', () => {
    const header = <h2>Card Header</h2>;
    
    render(<ExpandableCard {...defaultProps} header={header} />);
    
    expect(screen.getByText('Card Header')).toBeInTheDocument();
  });

  test('calls onStateChange callback when expanded/collapsed', async () => {
    const mockCallback = vi.fn();
    
    render(
      <ExpandableCard 
        {...defaultProps} 
        showToggleButton={true}
        onStateChange={mockCallback}
      />
    );
    
    const toggleButton = screen.getByRole('button', { name: /see details/i });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(true);
    });
  });

  test('starts expanded when defaultExpanded is true', () => {
    render(
      <ExpandableCard 
        {...defaultProps} 
        defaultExpanded={true}
      />
    );
    
    expect(screen.getByText('Expanded content')).toBeInTheDocument();
  });

  test('applies custom className', () => {
    const { container } = render(
      <ExpandableCard {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  test('has proper ARIA attributes', () => {
    render(<ExpandableCard {...defaultProps} showToggleButton={true} />);
    
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(toggleButton).toHaveAttribute('aria-controls', 'expandable-content-test-card');
  });

  test('updates ARIA attributes when expanded', async () => {
    render(<ExpandableCard {...defaultProps} showToggleButton={true} />);
    
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  test('prevents event propagation on toggle button click', () => {
    const mockParentClick = vi.fn();
    
    render(
      <div onClick={mockParentClick}>
        <ExpandableCard {...defaultProps} showToggleButton={true} />
      </div>
    );
    
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    expect(mockParentClick).not.toHaveBeenCalled();
  });
});

describe('ExpandableCardSection', () => {
  test('renders children', () => {
    render(
      <ExpandableCardSection>
        <div>Section content</div>
      </ExpandableCardSection>
    );
    
    expect(screen.getByText('Section content')).toBeInTheDocument();
  });

  test('renders title when provided', () => {
    render(
      <ExpandableCardSection title="Section Title">
        <div>Section content</div>
      </ExpandableCardSection>
    );
    
    expect(screen.getByText('Section Title')).toBeInTheDocument();
  });

  test('applies custom className', () => {
    const { container } = render(
      <ExpandableCardSection className="custom-section">
        <div>Content</div>
      </ExpandableCardSection>
    );
    
    expect(container.firstChild).toHaveClass('custom-section');
  });
});

describe('ExpandableCardGrid', () => {
  test('renders children in grid layout', () => {
    render(
      <ExpandableCardGrid>
        <div>Card 1</div>
        <div>Card 2</div>
      </ExpandableCardGrid>
    );
    
    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
  });

  test('applies correct grid columns class', () => {
    const { container } = render(
      <ExpandableCardGrid columns={2}>
        <div>Card 1</div>
      </ExpandableCardGrid>
    );
    
    expect(container.firstChild).toHaveClass('grid-cols-1', 'md:grid-cols-2');
  });

  test('applies correct gap class', () => {
    const { container } = render(
      <ExpandableCardGrid gap="lg">
        <div>Card 1</div>
      </ExpandableCardGrid>
    );
    
    expect(container.firstChild).toHaveClass('gap-8');
  });

  test('applies custom className', () => {
    const { container } = render(
      <ExpandableCardGrid className="custom-grid">
        <div>Card 1</div>
      </ExpandableCardGrid>
    );
    
    expect(container.firstChild).toHaveClass('custom-grid');
  });
});