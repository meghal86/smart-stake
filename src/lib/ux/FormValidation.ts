/**
 * Comprehensive Form Validation System
 * 
 * Real-time validation using Zod schemas with React Hook Form integration
 * Requirements: R6.VALIDATION.IMMEDIATE, R6.VALIDATION.CLEAR_MESSAGES, R6.VALIDATION.SAVE_STATES
 */

import { z } from 'zod';
import { useForm, UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

/**
 * Form validation configuration
 */
export interface FormValidationConfig<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues?: Partial<T>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  shouldFocusError?: boolean;
  delayError?: number;
}

/**
 * Character counter configuration
 */
export interface CharacterCounterConfig {
  maxLength: number;
  showCounter?: boolean;
  warningThreshold?: number; // Show warning when approaching limit (e.g., 0.8 = 80%)
}

/**
 * Field validation state
 */
export interface FieldValidationState {
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  error?: string;
  characterCount?: number;
  maxLength?: number;
  isNearLimit?: boolean;
}

/**
 * Form validation state
 */
export interface FormValidationState {
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  hasErrors: boolean;
  canSave: boolean;
  fieldStates: Record<string, FieldValidationState>;
}

/**
 * Enhanced form hook with comprehensive validation
 */
export function useFormValidation<T extends FieldValues>(
  config: FormValidationConfig<T>
): UseFormReturn<T> & {
  validationState: FormValidationState;
  getFieldState: (fieldName: Path<T>) => FieldValidationState;
  getCharacterCount: (fieldName: Path<T>) => number;
  isFieldNearLimit: (fieldName: Path<T>, threshold?: number) => boolean;
  handleSaveWithToast: (onSave: (data: T) => Promise<void>) => Promise<void>;
} {
  const { toast } = useToast();
  
  const form = useForm<T>({
    resolver: zodResolver(config.schema),
    defaultValues: config.defaultValues as any,
    mode: config.mode || 'onBlur',
    reValidateMode: config.reValidateMode || 'onChange',
    shouldFocusError: config.shouldFocusError ?? true,
    delayError: config.delayError || 0,
  });

  const {
    formState: { errors, isDirty, isValid, isSubmitting, touchedFields, dirtyFields },
    watch,
    getValues,
  } = form;

  // Watch all form values for real-time validation
  const watchedValues = watch();

  // Calculate validation state
  const validationState: FormValidationState = {
    isValid,
    isDirty,
    isSubmitting,
    hasErrors: Object.keys(errors).length > 0,
    canSave: isValid && isDirty && !isSubmitting,
    fieldStates: {},
  };

  // Calculate field states
  Object.keys(watchedValues || {}).forEach((fieldName) => {
    const fieldPath = fieldName as Path<T>;
    const fieldError = errors[fieldPath];
    const fieldValue = getValues(fieldPath);
    const isTouched = !!(touchedFields as any)[fieldPath];
    const isFieldDirty = !!(dirtyFields as any)[fieldPath];

    validationState.fieldStates[fieldName] = {
      isValid: !fieldError,
      isDirty: !!isFieldDirty,
      isTouched: !!isTouched,
      error: fieldError?.message as string | undefined,
      characterCount: typeof fieldValue === 'string' ? fieldValue.length : 0,
    };
  });

  /**
   * Get validation state for a specific field
   */
  const getFieldState = useCallback((fieldName: Path<T>): FieldValidationState => {
    return validationState.fieldStates[fieldName] || {
      isValid: true,
      isDirty: false,
      isTouched: false,
    };
  }, [validationState.fieldStates]);

  /**
   * Get character count for a field
   */
  const getCharacterCount = useCallback((fieldName: Path<T>): number => {
    const value = getValues(fieldName);
    return typeof value === 'string' ? value.length : 0;
  }, [getValues]);

  /**
   * Check if field is near character limit
   */
  const isFieldNearLimit = useCallback((fieldName: Path<T>, threshold = 0.8): boolean => {
    const characterCount = getCharacterCount(fieldName);
    
    // Get max length from schema if available
    const fieldSchema = (config.schema as any).shape?.[fieldName];
    let maxLength: number | undefined;
    
    // Try to extract max length from Zod schema
    if (fieldSchema && '_def' in fieldSchema) {
      const def = (fieldSchema as any)._def;
      if (def.checks) {
        const maxCheck = def.checks.find((check: any) => check.kind === 'max');
        if (maxCheck) {
          maxLength = maxCheck.value;
        }
      }
    }
    
    if (!maxLength) return false;
    
    const ratio = characterCount / maxLength;
    return ratio >= threshold;
  }, [getCharacterCount, config.schema]);

  /**
   * Handle form submission with toast notifications
   */
  const handleSaveWithToast = useCallback(async (onSave: (data: T) => Promise<void>) => {
    if (!validationState.canSave) {
      toast({
        title: "Cannot Save",
        description: "Please fix validation errors before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = getValues();
      await onSave(data);
      
      toast({
        title: "Changes saved ✓",
        description: "Your settings have been updated successfully.",
        variant: "default",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [validationState.canSave, getValues, toast]);

  return {
    ...form,
    validationState,
    getFieldState,
    getCharacterCount,
    isFieldNearLimit,
    handleSaveWithToast,
  };
}

/**
 * Character counter component props
 */
export interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
  warningThreshold?: number;
}

/**
 * Utility function to create character counter display
 */
export function formatCharacterCounter(
  current: number,
  max: number,
  warningThreshold = 0.8
): {
  text: string;
  isNearLimit: boolean;
  isOverLimit: boolean;
  className: string;
} {
  const ratio = current / max;
  const isNearLimit = ratio >= warningThreshold;
  const isOverLimit = current > max;

  return {
    text: `${current}/${max}`,
    isNearLimit,
    isOverLimit,
    className: isOverLimit 
      ? 'text-red-500' 
      : isNearLimit 
        ? 'text-yellow-500' 
        : 'text-gray-500',
  };
}

/**
 * Common validation schemas for reuse
 */
export const commonValidationSchemas = {
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email must be less than 254 characters'),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  walletAddress: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Please enter a valid wallet address (0x...)'),

  url: z.string()
    .url('Please enter a valid URL')
    .max(2048, 'URL must be less than 2048 characters'),

  phoneNumber: z.string()
    .regex(/^(\+\d{1,3}[- ]?)?[\d\s-]{7,15}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),

  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),

  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),

  positiveNumber: z.number()
    .positive('Must be a positive number')
    .finite('Must be a valid number'),

  percentage: z.number()
    .min(0, 'Percentage must be at least 0')
    .max(100, 'Percentage must be at most 100'),

  date: z.string()
    .refine(
      (val) => {
        if (!val) return false;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      'Please enter a valid date'
    ),

  pastDate: z.string()
    .refine(
      (val) => {
        if (!val) return false;
        const date = new Date(val);
        return !isNaN(date.getTime()) && date < new Date();
      },
      'Please enter a valid date in the past'
    ),

  futureDate: z.string()
    .refine(
      (val) => {
        if (!val) return false;
        const date = new Date(val);
        return !isNaN(date.getTime()) && date > new Date();
      },
      'Please enter a valid date in the future'
    ),
};

/**
 * Validation error messages for consistent UX
 */
export const validationMessages = {
  required: 'This field is required',
  invalid: 'Please enter a valid value',
  tooShort: (min: number) => `Must be at least ${min} characters`,
  tooLong: (max: number) => `Must be less than ${max} characters`,
  invalidFormat: 'Invalid format',
  mustMatch: 'Values must match',
  mustBeUnique: 'This value is already taken',
  networkError: 'Network error - please try again',
  serverError: 'Server error - please try again later',
};

/**
 * Utility to create field validation with character limits
 */
export function createFieldValidation(
  baseSchema: z.ZodString,
  maxLength: number,
  fieldName: string
) {
  return baseSchema
    .max(maxLength, `${fieldName} must be less than ${maxLength} characters`);
}

/**
 * Utility to create optional field validation
 */
export function createOptionalField<T>(schema: z.ZodSchema<T>) {
  return schema.optional().or(z.literal(''));
}

/**
 * Form validation utilities for common patterns
 */
export const formValidationUtils = {
  /**
   * Check if form can be saved (valid + dirty + not submitting)
   */
  canSave: (formState: { isValid: boolean; isDirty: boolean; isSubmitting: boolean }) => {
    return formState.isValid && formState.isDirty && !formState.isSubmitting;
  },

  /**
   * Get save button props based on form state
   */
  getSaveButtonProps: (formState: { isValid: boolean; isDirty: boolean; isSubmitting: boolean }) => ({
    disabled: !formValidationUtils.canSave(formState),
    children: formState.isSubmitting ? 'Saving...' : 'Save Changes',
  }),

  /**
   * Format validation error for display
   */
  formatError: (error: string | undefined) => {
    if (!error) return null;
    
    // Capitalize first letter and ensure proper punctuation
    const formatted = error.charAt(0).toUpperCase() + error.slice(1);
    return formatted.endsWith('.') ? formatted : `${formatted}.`;
  },

  /**
   * Check if field should show error (touched and has error)
   */
  shouldShowError: (fieldState: FieldValidationState) => {
    return fieldState.isTouched && !fieldState.isValid && !!fieldState.error;
  },
};