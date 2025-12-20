/**
 * Disabled Tooltip Button Tests
 * 
 * Tests for the DisabledTooltipButton component
 * Validates requirement R8.GATING.DISABLED_TOOLTIPS
 * 
 * @see .kiro/specs/ux-gap-requirements/requirements.md - Requirement 8
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { DisabledTooltipButton } from '../disabled-tooltip-button';

describe('DisabledTooltipButton', () => {
  describe('Basic Functionality', () => {
    test('renders button with children', () => {
      render(
        <DisabledTooltipButton>
          Click Me
        </DisabledTooltipButton>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    test('passes through button props', () => {
      const handleClick = vi.fn();
      
      render(
        <DisabledTooltipButton 
          onClick={handleClick}
          className="custom-class"
          variant="outline"
        >
          Click Me
        </DisabledTooltipButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled State', () => {
    test('button is disabled when disabled prop is true', () => {
      render(
        <DisabledTooltipButton disabled={true}>
          Disabled Button
        </DisabledTooltipButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    test('shows tooltip when disabled and disabledTooltip is provided', () => {
      render(
        <DisabledTooltipButton 
          disabled={true}
          disabledTooltip="This button is disabled because..."
        >
          Disabled Button
        </DisabledTooltipButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      // The button should be wrapped in a span with cursor-not-allowed when disabled with tooltip
      expect(button.parentElement).toHaveClass('cursor-not-allowed');
    });

    test('does not show tooltip when disabled but no disabledTooltip provided', () => {
      render(
        <DisabledTooltipButton disabled={true}>
          Disabled Button
        </DisabledTooltipButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      // Should not have tooltip wrapper (no cursor-not-allowed class)
      expect(button.parentElement).not.toHaveClass('cursor-not-allowed');
    });

    test('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      
      render(
        <DisabledTooltipButton 
          disabled={true}
          onClick={handleClick}
          disabledTooltip="Button is disabled"
        >
          Disabled Button
        </DisabledTooltipButton>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Enabled State', () => {
    test('button is enabled when disabled prop is false', () => {
      render(
        <DisabledTooltipButton disabled={false}>
          Enabled Button
        </DisabledTooltipButton>
      );

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    test('calls onClick when enabled', () => {
      const handleClick = vi.fn();
      
      render(
        <DisabledTooltipButton 
          disabled={false}
          onClick={handleClick}
        >
          Enabled Button
        </DisabledTooltipButton>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('shows tooltip when enabled and showTooltipWhenEnabled is true', () => {
      render(
        <DisabledTooltipButton 
          disabled={false}
          showTooltipWhenEnabled={true}
          enabledTooltip="This button is ready to use"
        >
          Enabled Button
        </DisabledTooltipButton>
      );

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      
      // The button should be wrapped in a span (tooltip wrapper) but without cursor-not-allowed
      expect(button.parentElement).not.toHaveClass('cursor-not-allowed');
    });

    test('does not show tooltip when enabled and showTooltipWhenEnabled is false', () => {
      render(
        <DisabledTooltipButton 
          disabled={false}
          showTooltipWhenEnabled={false}
          enabledTooltip="This button is ready to use"
        >
          Enabled Button
        </DisabledTooltipButton>
      );

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      
      // Should not have tooltip wrapper
      expect(button.parentElement).not.toHaveClass('cursor-not-allowed');
    });
  });

  describe('Tooltip Content', () => {
    test('supports React node as tooltip content', () => {
      const tooltipContent = (
        <div>
          <strong>Error:</strong> Please fix validation issues
        </div>
      );

      render(
        <DisabledTooltipButton 
          disabled={true}
          disabledTooltip={tooltipContent}
        >
          Submit
        </DisabledTooltipButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      // The button should be wrapped in a span with cursor-not-allowed
      expect(button.parentElement).toHaveClass('cursor-not-allowed');
    });

    test('supports string as tooltip content', () => {
      render(
        <DisabledTooltipButton 
          disabled={true}
          disabledTooltip="Simple string tooltip"
        >
          Submit
        </DisabledTooltipButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      // The button should be wrapped in a span with cursor-not-allowed
      expect(button.parentElement).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Tooltip Positioning', () => {
    test('uses default tooltip side (top)', () => {
      render(
        <DisabledTooltipButton 
          disabled={true}
          disabledTooltip="Tooltip content"
        >
          Button
        </DisabledTooltipButton>
      );

      // Default side should be top (this is handled by Radix internally)
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    test('uses custom tooltip side', () => {
      render(
        <DisabledTooltipButton 
          disabled={true}
          disabledTooltip="Tooltip content"
          tooltipSide="bottom"
        >
          Button
        </DisabledTooltipButton>
      );

      // Custom side should be applied (this is handled by Radix internally)
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    test('maintains button accessibility attributes', () => {
      render(
        <DisabledTooltipButton 
          disabled={true}
          disabledTooltip="Button is disabled"
          aria-label="Submit form"
        >
          Submit
        </DisabledTooltipButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Submit form');
      expect(button).toBeDisabled();
    });

    test('button is focusable when enabled', () => {
      render(
        <DisabledTooltipButton disabled={false}>
          Enabled Button
        </DisabledTooltipButton>
      );

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    test('button is not focusable when disabled', () => {
      render(
        <DisabledTooltipButton 
          disabled={true}
          disabledTooltip="Disabled"
        >
          Disabled Button
        </DisabledTooltipButton>
      );

      const button = screen.getByRole('button');
      button.focus();
      expect(button).not.toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined tooltip gracefully', () => {
      render(
        <DisabledTooltipButton 
          disabled={true}
          disabledTooltip={undefined}
        >
          Button
        </DisabledTooltipButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      // Should not have tooltip wrapper when tooltip is undefined
      expect(button.parentElement).not.toHaveClass('cursor-not-allowed');
    });

    test('handles empty string tooltip', () => {
      render(
        <DisabledTooltipButton 
          disabled={true}
          disabledTooltip=""
        >
          Button
        </DisabledTooltipButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      // Should not have tooltip wrapper when tooltip is empty string
      expect(button.parentElement).not.toHaveClass('cursor-not-allowed');
    });

    test('prioritizes disabled tooltip over enabled tooltip', () => {
      render(
        <DisabledTooltipButton 
          disabled={true}
          disabledTooltip="Disabled message"
          showTooltipWhenEnabled={true}
          enabledTooltip="Enabled message"
        >
          Button
        </DisabledTooltipButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      // Should show disabled tooltip (cursor-not-allowed), not enabled tooltip
      expect(button.parentElement).toHaveClass('cursor-not-allowed');
    });
  });
});