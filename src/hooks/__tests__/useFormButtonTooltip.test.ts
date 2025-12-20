/**
 * Form Button Tooltip Hook Tests
 * 
 * Tests for the useFormButtonTooltip hook
 * Validates requirement R8.GATING.DISABLED_TOOLTIPS
 * 
 * @see .kiro/specs/ux-gap-requirements/requirements.md - Requirement 8
 */

import { renderHook } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { 
  useFormButtonTooltip, 
  useWalletButtonTooltip, 
  useBalanceButtonTooltip,
  useApprovalButtonTooltip 
} from '../useFormButtonTooltip';

describe('useFormButtonTooltip', () => {
  describe('Form State Handling', () => {
    test('button is enabled when form is dirty and valid', () => {
      const { result } = renderHook(() =>
        useFormButtonTooltip({
          formState: {
            isDirty: true,
            isValid: true,
            isSubmitting: false,
          }
        })
      );

      expect(result.current.isDisabled).toBe(false);
      expect(result.current.tooltipContent).toBe(null);
    });

    test('button is disabled when form is not dirty', () => {
      const { result } = renderHook(() =>
        useFormButtonTooltip({
          formState: {
            isDirty: false,
            isValid: true,
            isSubmitting: false,
          }
        })
      );

      expect(result.current.isDisabled).toBe(true);
      expect(result.current.tooltipContent).toBe('Make changes to enable save');
    });

    test('button is disabled when form is invalid', () => {
      const { result } = renderHook(() =>
        useFormButtonTooltip({
          formState: {
            isDirty: true,
            isValid: false,
            isSubmitting: false,
          }
        })
      );

      expect(result.current.isDisabled).toBe(true);
      expect(result.current.tooltipContent).toBe('Fix validation errors to save');
    });

    test('button is disabled when form is submitting', () => {
      const { result } = renderHook(() =>
        useFormButtonTooltip({
          formState: {
            isDirty: true,
            isValid: true,
            isSubmitting: true,
          }
        })
      );

      expect(result.current.isDisabled).toBe(true);
      expect(result.current.tooltipContent).toBe('Saving changes...');
    });
  });

  describe('Custom Messages', () => {
    test('uses custom message for not dirty state', () => {
      const { result } = renderHook(() =>
        useFormButtonTooltip({
          formState: {
            isDirty: false,
            isValid: true,
            isSubmitting: false,
          },
          customMessages: {
            notDirty: 'Please modify the form first'
          }
        })
      );

      expect(result.current.isDisabled).toBe(true);
      expect(result.current.tooltipContent).toBe('Please modify the form first');
    });

    test('uses custom message for invalid state', () => {
      const { result } = renderHook(() =>
        useFormButtonTooltip({
          formState: {
            isDirty: true,
            isValid: false,
            isSubmitting: false,
          },
          customMessages: {
            invalid: 'Please correct the errors above'
          }
        })
      );

      expect(result.current.isDisabled).toBe(true);
      expect(result.current.tooltipContent).toBe('Please correct the errors above');
    });

    test('uses custom message for submitting state', () => {
      const { result } = renderHook(() =>
        useFormButtonTooltip({
          formState: {
            isDirty: true,
            isValid: true,
            isSubmitting: true,
          },
          customMessages: {
            submitting: 'Processing your request...'
          }
        })
      );

      expect(result.current.isDisabled).toBe(true);
      expect(result.current.tooltipContent).toBe('Processing your request...');
    });
  });

  describe('Error Handling', () => {
    test('shows specific error message when available', () => {
      const { result } = renderHook(() =>
        useFormButtonTooltip({
          formState: {
            isDirty: true,
            isValid: false,
            isSubmitting: false,
            errors: {
              email: { message: 'Invalid email format' }
            }
          }
        })
      );

      expect(result.current.isDisabled).toBe(true);
      expect(result.current.tooltipContent).toBe('Fix error: Invalid email format');
    });

    test('falls back to generic message when error has no message', () => {
      const { result } = renderHook(() =>
        useFormButtonTooltip({
          formState: {
            isDirty: true,
            isValid: false,
            isSubmitting: false,
            errors: {
              email: { type: 'required' }
            }
          }
        })
      );

      expect(result.current.isDisabled).toBe(true);
      expect(result.current.tooltipContent).toBe('Fix validation errors to save');
    });
  });

  describe('Priority Handling', () => {
    test('submitting state takes priority over other states', () => {
      const { result } = renderHook(() =>
        useFormButtonTooltip({
          formState: {
            isDirty: false,
            isValid: false,
            isSubmitting: true,
          }
        })
      );

      expect(result.current.isDisabled).toBe(true);
      expect(result.current.tooltipContent).toBe('Saving changes...');
    });

    test('not dirty takes priority over invalid when not submitting', () => {
      const { result } = renderHook(() =>
        useFormButtonTooltip({
          formState: {
            isDirty: false,
            isValid: false,
            isSubmitting: false,
          }
        })
      );

      expect(result.current.isDisabled).toBe(true);
      expect(result.current.tooltipContent).toBe('Make changes to enable save');
    });
  });
});

describe('useWalletButtonTooltip', () => {
  test('button is enabled when wallet is connected', () => {
    const { result } = renderHook(() =>
      useWalletButtonTooltip(true)
    );

    expect(result.current.isDisabled).toBe(false);
    expect(result.current.tooltipContent).toBe(null);
  });

  test('button is disabled when wallet is not connected', () => {
    const { result } = renderHook(() =>
      useWalletButtonTooltip(false)
    );

    expect(result.current.isDisabled).toBe(true);
    expect(result.current.tooltipContent).toBe('Connect your wallet to continue');
  });

  test('uses custom message when provided', () => {
    const { result } = renderHook(() =>
      useWalletButtonTooltip(false, 'Please connect MetaMask to proceed')
    );

    expect(result.current.isDisabled).toBe(true);
    expect(result.current.tooltipContent).toBe('Please connect MetaMask to proceed');
  });
});

describe('useBalanceButtonTooltip', () => {
  test('button is enabled when balance is sufficient', () => {
    const { result } = renderHook(() =>
      useBalanceButtonTooltip(true)
    );

    expect(result.current.isDisabled).toBe(false);
    expect(result.current.tooltipContent).toBe(null);
  });

  test('button is disabled when balance is insufficient', () => {
    const { result } = renderHook(() =>
      useBalanceButtonTooltip(false)
    );

    expect(result.current.isDisabled).toBe(true);
    expect(result.current.tooltipContent).toBe('Insufficient balance');
  });

  test('shows detailed message with amount and token', () => {
    const { result } = renderHook(() =>
      useBalanceButtonTooltip(false, '0.1', 'ETH')
    );

    expect(result.current.isDisabled).toBe(true);
    expect(result.current.tooltipContent).toBe('Insufficient balance. Need at least 0.1 ETH');
  });
});

describe('useApprovalButtonTooltip', () => {
  test('button is enabled when token is approved', () => {
    const { result } = renderHook(() =>
      useApprovalButtonTooltip(true)
    );

    expect(result.current.isDisabled).toBe(false);
    expect(result.current.tooltipContent).toBe(null);
  });

  test('button is disabled when token is not approved', () => {
    const { result } = renderHook(() =>
      useApprovalButtonTooltip(false)
    );

    expect(result.current.isDisabled).toBe(true);
    expect(result.current.tooltipContent).toBe('Approve token spend to continue');
  });

  test('shows token-specific message when token symbol provided', () => {
    const { result } = renderHook(() =>
      useApprovalButtonTooltip(false, 'USDC')
    );

    expect(result.current.isDisabled).toBe(true);
    expect(result.current.tooltipContent).toBe('Approve USDC spend to continue');
  });
});