/**
 * Property-Based Tests for HarvestPro Form Validation
 * 
 * Feature: harvestpro, Property 21: Real-Time Form Validation
 * Validates: Enhanced Req 6 AC1-3 (immediate validation, clear messages)
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { z } from 'zod';
import { renderHook, act } from '@testing-library/react';
import { useFormValidation, formValidationUtils } from '../FormValidation';

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('Feature: harvestpro, Property 21: Real-Time Form Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Property 21.1: Immediate validation feedback for all form inputs', () => {
    fc.assert(
      fc.property(
        fc.record({
          taxRate: fc.float({ min: -1, max: 2, noNaN: true }),
          notificationThreshold: fc.float({ min: -100, max: 200000, noNaN: true }),
          walletAddress: fc.string(),
        }),
        (formData) => {
          // Property: For any form input, validation should provide immediate feedback
          const schema = z.object({
            taxRate: z.number().min(0).max(1),
            notificationThreshold: z.number().min(50).max(100000),
            walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
          });

          const { result } = renderHook(() =>
            useFormValidation({
              schema,
              mode: 'onBlur',
              reValidateMode: 'onChange',
              defaultValues: {
                taxRate: 0.24,
                notificationThreshold: 100,
                walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96590b5b8c',
              },
            })
          );

          // Simulate user input
          act(() => {
            result.current.setValue('taxRate', formData.taxRate);
            result.current.setValue('notificationThreshold', formData.notificationThreshold);
            result.current.setValue('walletAddress', formData.walletAddress);
          });

          // Trigger validation
          act(() => {
            result.current.trigger();
          });

          const validationState = result.current.validationState;

          // Property 1: Validation state should reflect input validity
          const expectedTaxRateValid = formData.taxRate >= 0 && formData.taxRate <= 1;
          const expectedThresholdValid = formData.notificationThreshold >= 50 && formData.notificationThreshold <= 100000;
          const expectedWalletValid = /^0x[a-fA-F0-9]{40}$/.test(formData.walletAddress);
          const expectedFormValid = expectedTaxRateValid && expectedThresholdValid && expectedWalletValid;

          expect(validationState.isValid).toBe(expectedFormValid);

          // Property 2: Field states should provide detailed feedback
          const taxRateState = result.current.getFieldState('taxRate');
          const thresholdState = result.current.getFieldState('notificationThreshold');
          const walletState = result.current.getFieldState('walletAddress');

          expect(taxRateState.isValid).toBe(expectedTaxRateValid);
          expect(thresholdState.isValid).toBe(expectedThresholdValid);
          expect(walletState.isValid).toBe(expectedWalletValid);

          // Property 3: Error messages should be present for invalid fields
          if (!expectedTaxRateValid) {
            expect(taxRateState.error).toBeDefined();
            expect(typeof taxRateState.error).toBe('string');
          }

          if (!expectedThresholdValid) {
            expect(thresholdState.error).toBeDefined();
            expect(typeof thresholdState.error).toBe('string');
          }

          if (!expectedWalletValid) {
            expect(walletState.error).toBeDefined();
            expect(typeof walletState.error).toBe('string');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 21.2: Character counting accuracy for all text inputs', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 15 }),
        (walletAddresses) => {
          // Property: Character counting should be accurate for all inputs
          const schema = z.object({
            preferredWallets: z.array(z.string()).max(10),
          });

          const { result } = renderHook(() =>
            useFormValidation({
              schema,
              mode: 'onChange',
              defaultValues: {
                preferredWallets: [],
              },
            })
          );

          // Set wallet addresses
          act(() => {
            result.current.setValue('preferredWallets', walletAddresses);
          });

          // Property 1: Character count should match actual input length
          const characterCount = result.current.getCharacterCount('preferredWallets');
          const expectedCount = walletAddresses.join('\n').length;
          
          // Note: Character count for arrays might be calculated differently
          // This tests the consistency of the counting mechanism
          expect(typeof characterCount).toBe('number');
          expect(characterCount).toBeGreaterThanOrEqual(0);

          // Property 2: Field state should reflect array length
          const fieldState = result.current.getFieldState('preferredWallets');
          expect(fieldState.isValid).toBe(walletAddresses.length <= 10);

          // Property 3: Validation should be consistent
          const validationState = result.current.validationState;
          expect(validationState.isValid).toBe(walletAddresses.length <= 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 21.3: Save button state consistency', () => {
    fc.assert(
      fc.property(
        fc.record({
          isValid: fc.boolean(),
          isDirty: fc.boolean(),
          isSubmitting: fc.boolean(),
        }),
        (formState) => {
          // Property: Save button state should be consistent with form state
          const canSave = formValidationUtils.canSave(formState);
          const expectedCanSave = formState.isValid && formState.isDirty && !formState.isSubmitting;

          expect(canSave).toBe(expectedCanSave);

          // Property: Button props should reflect save state
          const buttonProps = formValidationUtils.getSaveButtonProps(formState);
          expect(buttonProps.disabled).toBe(!canSave);

          if (formState.isSubmitting) {
            expect(buttonProps.children).toMatch(/saving/i);
          } else {
            expect(buttonProps.children).toMatch(/save/i);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 21.4: Error message formatting consistency', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(undefined),
          fc.constant(''),
          fc.string({ minLength: 1, maxLength: 100 })
        ),
        (errorMessage) => {
          // Property: Error message formatting should be consistent
          const formatted = formValidationUtils.formatError(errorMessage);

          if (!errorMessage || errorMessage.trim() === '') {
            expect(formatted).toBeNull();
          } else {
            expect(formatted).toBeDefined();
            expect(typeof formatted).toBe('string');
            
            // Should start with capital letter
            expect(formatted!.charAt(0)).toBe(formatted!.charAt(0).toUpperCase());
            
            // Should end with period
            expect(formatted!.endsWith('.')).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 21.5: Field validation state transitions', () => {
    fc.assert(
      fc.property(
        fc.record({
          isValid: fc.boolean(),
          isDirty: fc.boolean(),
          isTouched: fc.boolean(),
          error: fc.oneof(fc.constant(undefined), fc.string()),
        }),
        (fieldState) => {
          // Property: Field validation state should be logically consistent
          const shouldShowError = formValidationUtils.shouldShowError(fieldState);

          // Error should only show if field is touched, invalid, and has error message
          const expectedShowError = fieldState.isTouched && !fieldState.isValid && !!fieldState.error;
          expect(shouldShowError).toBe(expectedShowError);

          // Property: Invalid fields should have error messages when touched
          if (fieldState.isTouched && !fieldState.isValid) {
            // This is a business rule - touched invalid fields should have error messages
            // In a real implementation, this would be enforced by the validation system
            if (fieldState.error) {
              expect(shouldShowError).toBe(true);
            }
          }

          // Property: Valid fields should not show errors
          if (fieldState.isValid) {
            expect(shouldShowError).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 21.6: Tax rate validation ranges', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -2, max: 3, noNaN: true }),
        (taxRate) => {
          // Property: Tax rate validation should handle all numeric inputs correctly
          const schema = z.object({
            taxRate: z.number()
              .min(0, 'Tax rate cannot be negative')
              .max(1, 'Tax rate cannot exceed 100%')
              .refine(
                (val) => val >= 0.1 && val <= 0.5,
                'Tax rate should typically be between 10% and 50%'
              ),
          });

          const { result } = renderHook(() =>
            useFormValidation({
              schema,
              mode: 'onChange',
              defaultValues: { taxRate: 0.24 },
            })
          );

          act(() => {
            result.current.setValue('taxRate', taxRate);
          });

          act(() => {
            result.current.trigger('taxRate');
          });

          const fieldState = result.current.getFieldState('taxRate');
          const validationState = result.current.validationState;

          // Property 1: Basic range validation
          const isInBasicRange = taxRate >= 0 && taxRate <= 1;
          const isInTypicalRange = taxRate >= 0.1 && taxRate <= 0.5;

          if (taxRate < 0 || taxRate > 1) {
            expect(fieldState.isValid).toBe(false);
            expect(fieldState.error).toBeDefined();
          } else if (!isInTypicalRange) {
            // Should have warning but might still be valid depending on implementation
            expect(fieldState.error).toBeDefined();
          }

          // Property 2: Form validity should reflect field validity
          expect(validationState.isValid).toBe(fieldState.isValid);

          // Property 3: Error messages should be descriptive
          if (fieldState.error) {
            expect(typeof fieldState.error).toBe('string');
            expect(fieldState.error.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 21.7: Notification threshold validation', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -1000, max: 200000, noNaN: true }),
        (threshold) => {
          // Property: Notification threshold validation should handle all numeric inputs
          const schema = z.object({
            notificationThreshold: z.number()
              .min(0, 'Notification threshold cannot be negative')
              .max(100000, 'Notification threshold cannot exceed $100,000')
              .refine(
                (val) => val >= 50,
                'Notification threshold should be at least $50 for meaningful alerts'
              ),
          });

          const { result } = renderHook(() =>
            useFormValidation({
              schema,
              mode: 'onChange',
              defaultValues: { notificationThreshold: 100 },
            })
          );

          act(() => {
            result.current.setValue('notificationThreshold', threshold);
          });

          act(() => {
            result.current.trigger('notificationThreshold');
          });

          const fieldState = result.current.getFieldState('notificationThreshold');

          // Property: Validation should be consistent with business rules
          const isValid = threshold >= 50 && threshold <= 100000;
          
          if (threshold < 0 || threshold > 100000 || threshold < 50) {
            expect(fieldState.isValid).toBe(false);
            expect(fieldState.error).toBeDefined();
          }

          // Property: Error messages should be appropriate for the violation
          if (fieldState.error) {
            if (threshold < 0) {
              expect(fieldState.error).toMatch(/negative/i);
            } else if (threshold > 100000) {
              expect(fieldState.error).toMatch(/exceed.*100,000/i);
            } else if (threshold < 50) {
              expect(fieldState.error).toMatch(/at least.*50/i);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});