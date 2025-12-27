/**
 * Form Button Tooltip Hook
 * 
 * Generates appropriate tooltip messages for form save buttons based on form state.
 * Implements requirement R8.GATING.DISABLED_TOOLTIPS
 * 
 * @see .kiro/specs/ux-gap-requirements/requirements.md - Requirement 8
 */

import { useMemo } from 'react';

export interface FormState {
  isSubmitting?: boolean;
  isDirty?: boolean;
  isValid?: boolean;
  errors?: Record<string, { message?: string }>;
}

export interface UseFormButtonTooltipOptions {
  formState: FormState;
  customMessages?: {
    notDirty?: string;
    invalid?: string;
    submitting?: string;
  };
}

export function useFormButtonTooltip({
  formState,
  customMessages = {}
}: UseFormButtonTooltipOptions) {
  const {
    isSubmitting = false,
    isDirty = false,
    isValid = true,
    errors = {}
  } = formState;

  const defaultMessages = {
    notDirty: 'Make changes to enable save',
    invalid: 'Fix validation errors to save',
    submitting: 'Saving changes...',
  };

  const messages = { ...defaultMessages, ...customMessages };

  const { isDisabled, tooltipContent } = useMemo(() => {
    // Button is disabled if submitting, not dirty, or invalid
    const disabled = isSubmitting || !isDirty || !isValid;

    let tooltip: string | null = null;

    if (isSubmitting) {
      tooltip = messages.submitting;
    } else if (!isDirty) {
      tooltip = messages.notDirty;
    } else if (!isValid) {
      // Try to get specific error message
      const errorKeys = Object.keys(errors);
      if (errorKeys.length > 0) {
        const firstError = errors[errorKeys[0]];
        if (firstError?.message) {
          tooltip = `Fix error: ${firstError.message}`;
        } else {
          tooltip = messages.invalid;
        }
      } else {
        tooltip = messages.invalid;
      }
    }

    return {
      isDisabled: disabled,
      tooltipContent: tooltip,
    };
  }, [isSubmitting, isDirty, isValid, errors, messages]);

  return {
    isDisabled,
    tooltipContent,
  };
}

/**
 * Convenience hook for wallet connection buttons
 */
export function useWalletButtonTooltip(isConnected: boolean, customMessage?: string) {
  return useMemo(() => ({
    isDisabled: !isConnected,
    tooltipContent: isConnected ? null : (customMessage || 'Connect your wallet to continue'),
  }), [isConnected, customMessage]);
}

/**
 * Convenience hook for balance requirement buttons
 */
export function useBalanceButtonTooltip(
  hasEnoughBalance: boolean, 
  requiredAmount?: string,
  tokenSymbol?: string
) {
  return useMemo(() => {
    let tooltip: string | null = null;
    
    if (!hasEnoughBalance) {
      if (requiredAmount && tokenSymbol) {
        tooltip = `Insufficient balance. Need at least ${requiredAmount} ${tokenSymbol}`;
      } else {
        tooltip = 'Insufficient balance';
      }
    }

    return {
      isDisabled: !hasEnoughBalance,
      tooltipContent: tooltip,
    };
  }, [hasEnoughBalance, requiredAmount, tokenSymbol]);
}

/**
 * Convenience hook for approval requirement buttons
 */
export function useApprovalButtonTooltip(isApproved: boolean, tokenSymbol?: string) {
  return useMemo(() => {
    let tooltip: string | null = null;
    
    if (!isApproved) {
      tooltip = tokenSymbol 
        ? `Approve ${tokenSymbol} spend to continue`
        : 'Approve token spend to continue';
    }

    return {
      isDisabled: !isApproved,
      tooltipContent: tooltip,
    };
  }, [isApproved, tokenSymbol]);
}