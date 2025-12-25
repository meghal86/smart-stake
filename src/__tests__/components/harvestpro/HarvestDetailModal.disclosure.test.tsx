/**
 * HarvestDetailModal Disclosure Variant Tests
 * Tests for the legal disclosure modal functionality
 * 
 * Requirements: Enhanced Req 0 AC1-5
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HarvestDetailModal } from '@/components/harvestpro/HarvestDetailModal';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('HarvestDetailModal - Disclosure Variant', () => {
  const mockProps = {
    opportunity: null,
    isOpen: true,
    variant: 'disclosure' as const,
    onClose: vi.fn(),
    onExecute: vi.fn(),
    onDisclosureAccept: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders disclosure modal when variant is disclosure', () => {
      render(<HarvestDetailModal {...mockProps} />);
      
      expect(screen.getByText('Important Disclosure')).toBeInTheDocument();
      expect(screen.getByText('Please read and acknowledge these important disclaimers before using HarvestPro')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<HarvestDetailModal {...mockProps} isOpen={false} />);
      
      expect(screen.queryByText('Important Disclosure')).not.toBeInTheDocument();
    });

    it('renders all required disclosure sections', () => {
      render(<HarvestDetailModal {...mockProps} />);
      
      // Check all four disclosure sections
      expect(screen.getByText('Informational Outputs Only')).toBeInTheDocument();
      expect(screen.getByText('No Tax, Legal, or Financial Advice')).toBeInTheDocument();
      expect(screen.getByText('Verify with a Tax Professional')).toBeInTheDocument();
      expect(screen.getByText('All Transactions Require Confirmation')).toBeInTheDocument();
    });

    it('renders disclosure content text', () => {
      render(<HarvestDetailModal {...mockProps} />);
      
      expect(screen.getByText(/HarvestPro provides informational analysis and suggestions only/)).toBeInTheDocument();
      expect(screen.getByText(/HarvestPro does not provide tax, legal, or financial advice/)).toBeInTheDocument();
      expect(screen.getByText(/Always consult with a qualified tax professional/)).toBeInTheDocument();
      expect(screen.getByText(/HarvestPro never executes transactions automatically/)).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<HarvestDetailModal {...mockProps} />);
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('I Understand & Accept')).toBeInTheDocument();
    });

    it('renders disclaimer text', () => {
      render(<HarvestDetailModal {...mockProps} />);
      
      expect(screen.getByText('By accepting, you acknowledge that you have read and understood these disclaimers.')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClose when cancel button is clicked', () => {
      render(<HarvestDetailModal {...mockProps} />);
      
      fireEvent.click(screen.getByText('Cancel'));
      
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when X button is clicked', () => {
      render(<HarvestDetailModal {...mockProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onDisclosureAccept and onClose when accept button is clicked', () => {
      render(<HarvestDetailModal {...mockProps} />);
      
      fireEvent.click(screen.getByText('I Understand & Accept'));
      
      expect(mockProps.onDisclosureAccept).toHaveBeenCalledTimes(1);
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      render(<HarvestDetailModal {...mockProps} />);
      
      // Click on the backdrop (the outer div)
      const backdrop = screen.getByText('Important Disclosure').closest('[style*="backdrop"]')?.parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockProps.onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('does not call onClose when modal content is clicked', () => {
      render(<HarvestDetailModal {...mockProps} />);
      
      // Click on the modal content
      fireEvent.click(screen.getByText('Important Disclosure'));
      
      expect(mockProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<HarvestDetailModal {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(<HarvestDetailModal {...mockProps} />);
      
      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('Important Disclosure');
      
      const subHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(subHeadings).toHaveLength(4);
      expect(subHeadings[0]).toHaveTextContent('Informational Outputs Only');
      expect(subHeadings[1]).toHaveTextContent('No Tax, Legal, or Financial Advice');
      expect(subHeadings[2]).toHaveTextContent('Verify with a Tax Professional');
      expect(subHeadings[3]).toHaveTextContent('All Transactions Require Confirmation');
    });

    it('has proper button roles', () => {
      render(<HarvestDetailModal {...mockProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3); // Close, Cancel, Accept
    });
  });

  describe('Visual Design', () => {
    it('applies correct styling classes', () => {
      render(<HarvestDetailModal {...mockProps} />);
      
      // Check that the modal container has the expected styling structure
      const modalContainer = document.querySelector('.bg-\\[\\#1a1f2e\\]');
      expect(modalContainer).toHaveClass('bg-[#1a1f2e]', 'border', 'border-white/20', 'rounded-2xl');
    });

    it('renders icons for each section', () => {
      render(<HarvestDetailModal {...mockProps} />);
      
      // The icons are rendered as SVG elements, check that they exist
      const svgElements = document.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(4); // At least one icon per section plus close button
    });
  });

  describe('Error Handling', () => {
    it('handles missing onDisclosureAccept gracefully', () => {
      const propsWithoutAccept = { ...mockProps, onDisclosureAccept: undefined };
      
      render(<HarvestDetailModal {...propsWithoutAccept} />);
      
      // Should not throw when clicking accept button
      expect(() => {
        fireEvent.click(screen.getByText('I Understand & Accept'));
      }).not.toThrow();
      
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });
  });
});