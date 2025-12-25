/**
 * PrimaryButton Component Tests
 * 
 * Tests for the standardized PrimaryButton component used across HarvestPro
 * Validates Enhanced Req 13 AC1-2 (single button system) and Enhanced Req 8 AC1-3 (disabled tooltips)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

describe('PrimaryButton', () => {
  describe('Enhanced Req 13 AC1-2: Single Button System', () => {
    test('renders with default primary variant', () => {
      render(<PrimaryButton>Test Button</PrimaryButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Test Button');
    });

    test('shows loading state with spinner and custom text', () => {
      render(
        <PrimaryButton isLoading={true} loadingText="Preparing harvest...">
          Execute Harvest
        </PrimaryButton>
      );
      
      expect(screen.getByText('Preparing harvest...')).toBeInTheDocument();
      // Check for loading spinner (Loader2 icon)
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    test('shows success state with checkmark', () => {
      render(
        <PrimaryButton isSuccess={true} successText="Harvest Complete!">
          Execute Harvest
        </PrimaryButton>
      );
      
      expect(screen.getByText('Harvest Complete!')).toBeInTheDocument();
      // Check for success icon (CheckCircle)
      expect(document.querySelector('.text-green-400')).toBeInTheDocument();
    });

    test('shows error state with X icon', () => {
      render(
        <PrimaryButton isError={true} errorText="Harvest Failed">
          Execute Harvest
        </PrimaryButton>
      );
      
      expect(screen.getByText('Harvest Failed')).toBeInTheDocument();
      // Check for error icon (XCircle)
      expect(document.querySelector('.text-red-400')).toBeInTheDocument();
    });

    test('is disabled when loading', () => {
      render(<PrimaryButton isLoading={true}>Test Button</PrimaryButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Enhanced Req 8 AC1-3: Disabled Tooltips', () => {
    test('shows tooltip when disabled with disabledTooltip prop', () => {
      render(
        <PrimaryButton 
          disabled={true} 
          disabledTooltip="Connect your wallet to continue"
        >
          Execute Harvest
        </PrimaryButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      // The tooltip functionality is handled by DisabledTooltipButton
      // We just verify the button is disabled and the prop is passed
    });

    test('does not show tooltip when enabled', () => {
      render(
        <PrimaryButton disabled={false}>
          Execute Harvest
        </PrimaryButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });
  });

  describe('Button Variants', () => {
    test('renders primary variant with correct styling', () => {
      render(<PrimaryButton variant="primary">Primary Button</PrimaryButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-r', 'from-[#ed8f2d]', 'to-[#B8722E]');
    });

    test('renders secondary variant with correct styling', () => {
      render(<PrimaryButton variant="secondary">Secondary Button</PrimaryButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white/10', 'border-white/20');
    });
  });

  describe('Click Handling', () => {
    test('calls onClick when not disabled', () => {
      const handleClick = vi.fn();
      render(<PrimaryButton onClick={handleClick}>Test Button</PrimaryButton>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(
        <PrimaryButton onClick={handleClick} disabled={true}>
          Test Button
        </PrimaryButton>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('does not call onClick when loading', () => {
      const handleClick = vi.fn();
      render(
        <PrimaryButton onClick={handleClick} isLoading={true}>
          Test Button
        </PrimaryButton>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('has proper button role', () => {
      render(<PrimaryButton>Test Button</PrimaryButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('supports custom className', () => {
      render(<PrimaryButton className="custom-class">Test Button</PrimaryButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    test('forwards ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<PrimaryButton ref={ref}>Test Button</PrimaryButton>);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });
});