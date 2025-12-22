/**
 * Executing Text Demo Test
 * 
 * Demonstrates that button loading states show "Executing..." text for button actions
 * Validates requirement R8.GATING.LOADING_STATES
 * 
 * @see .kiro/specs/ux-gap-requirements/requirements.md - Requirement 8.5
 * @see .kiro/specs/ux-gap-requirements/tasks.md - Task: Loading states show "Executing..." text for button actions
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { LoadingButton } from '../LoadingSystem';
import { GatedButton } from '../GatedButton';

describe('R8.GATING.LOADING_STATES: Loading states show "Executing..." text for button actions', () => {
  test('LoadingButton shows "Executing..." by default when loading', () => {
    render(
      <LoadingButton isLoading={true}>
        Submit Action
      </LoadingButton>
    );

    expect(screen.getByText('Executing...')).toBeInTheDocument();
  });

  test('GatedButton shows "Executing..." by default when loading', () => {
    render(
      <GatedButton loading={true}>
        Execute Action
      </GatedButton>
    );

    expect(screen.getByText('Executing...')).toBeInTheDocument();
  });

  test('Both components show spinner with "Executing..." text', () => {
    const { rerender } = render(
      <LoadingButton isLoading={true}>
        Action Button
      </LoadingButton>
    );

    // Check LoadingButton
    expect(screen.getByText('Executing...')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    // Check GatedButton
    rerender(
      <GatedButton loading={true}>
        Action Button
      </GatedButton>
    );

    expect(screen.getByText('Executing...')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  test('Custom loading text can override default "Executing..." text', () => {
    render(
      <LoadingButton isLoading={true} loadingText="Processing payment...">
        Pay Now
      </LoadingButton>
    );

    expect(screen.getByText('Processing payment...')).toBeInTheDocument();
    expect(screen.queryByText('Executing...')).not.toBeInTheDocument();
  });
});