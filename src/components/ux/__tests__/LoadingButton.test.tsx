/**
 * LoadingButton Component Tests
 * 
 * Tests for the LoadingButton component to ensure it shows "Executing..." text for button actions
 * Validates requirement R8.GATING.LOADING_STATES
 * 
 * @see .kiro/specs/ux-gap-requirements/requirements.md - Requirement 8.5
 * @see .kiro/specs/ux-gap-requirements/design.md - Action Gating & Prerequisites System
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { LoadingButton } from '../LoadingSystem';

describe('LoadingButton', () => {
  describe('R8.GATING.LOADING_STATES: Loading states show "Executing..." text', () => {
    test('should show "Executing..." as default loading text', () => {
      render(
        <LoadingButton isLoading={true}>
          Submit Action
        </LoadingButton>
      );

      expect(screen.getByText('Executing...')).toBeInTheDocument();
    });

    test('should show custom loading text when provided', () => {
      render(
        <LoadingButton isLoading={true} loadingText="Processing...">
          Submit Action
        </LoadingButton>
      );

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    test('should show loading spinner when loading', () => {
      render(
        <LoadingButton isLoading={true}>
          Submit Action
        </LoadingButton>
      );

      // Check for loading spinner (Loader2 icon with animate-spin class)
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    test('should be disabled when loading', () => {
      render(
        <LoadingButton isLoading={true}>
          Submit Action
        </LoadingButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    test('should show original content when not loading', () => {
      render(
        <LoadingButton isLoading={false}>
          Submit Action
        </LoadingButton>
      );

      expect(screen.getByText('Submit Action')).toBeInTheDocument();
      expect(screen.queryByText('Executing...')).not.toBeInTheDocument();
    });

    test('should handle click events when not loading', () => {
      const mockOnClick = vi.fn();
      
      render(
        <LoadingButton isLoading={false} onClick={mockOnClick}>
          Submit Action
        </LoadingButton>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    test('should not handle click events when loading', () => {
      const mockOnClick = vi.fn();
      
      render(
        <LoadingButton isLoading={true} onClick={mockOnClick}>
          Submit Action
        </LoadingButton>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Success and Error States', () => {
    test('should show success state with checkmark', () => {
      render(
        <LoadingButton isSuccess={true} successText="Completed!">
          Submit Action
        </LoadingButton>
      );

      expect(screen.getByText('Completed!')).toBeInTheDocument();
      expect(document.querySelector('.text-green-600')).toBeInTheDocument();
    });

    test('should show error state with X icon', () => {
      render(
        <LoadingButton isError={true} errorText="Failed!">
          Submit Action
        </LoadingButton>
      );

      expect(screen.getByText('Failed!')).toBeInTheDocument();
      expect(document.querySelector('.text-red-600')).toBeInTheDocument();
    });

    test('should use default success text when not provided', () => {
      render(
        <LoadingButton isSuccess={true}>
          Submit Action
        </LoadingButton>
      );

      expect(screen.getByText('Success!')).toBeInTheDocument();
    });

    test('should use default error text when not provided', () => {
      render(
        <LoadingButton isError={true}>
          Submit Action
        </LoadingButton>
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper button role', () => {
      render(
        <LoadingButton>
          Submit Action
        </LoadingButton>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('should be focusable when not disabled', () => {
      render(
        <LoadingButton>
          Submit Action
        </LoadingButton>
      );

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    test('should not be focusable when loading', () => {
      render(
        <LoadingButton isLoading={true}>
          Submit Action
        </LoadingButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Animation', () => {
    test('should have smooth transition classes', () => {
      render(
        <LoadingButton>
          Submit Action
        </LoadingButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-colors');
    });
  });
});