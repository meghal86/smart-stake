/**
 * Form Validation Example Component
 * 
 * Demonstrates how to use the comprehensive form validation system
 * Requirements: R6.VALIDATION.IMMEDIATE, R6.VALIDATION.CLEAR_MESSAGES, R6.VALIDATION.SAVE_STATES
 */

import React from 'react';
import { z } from 'zod';
import { 
  useFormValidation, 
  commonValidationSchemas, 
  formValidationUtils,
  formatCharacterCounter 
} from '@/lib/ux/FormValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Example form schema
const exampleFormSchema = z.object({
  email: commonValidationSchemas.email,
  name: commonValidationSchemas.name,
  bio: z.string()
    .max(200, 'Bio must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  website: commonValidationSchemas.url.optional().or(z.literal('')),
});

type ExampleFormData = z.infer<typeof exampleFormSchema>;

export const FormValidationExample: React.FC = () => {
  const form = useFormValidation<ExampleFormData>({
    schema: exampleFormSchema,
    mode: 'onBlur', // Validate on blur for immediate feedback
    reValidateMode: 'onChange', // Re-validate on change after first validation
    defaultValues: {
      email: '',
      name: '',
      bio: '',
      website: '',
    },
  });

  const handleSave = async (data: ExampleFormData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Saved data:', data);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Form Validation Example</CardTitle>
        <CardDescription>
          Demonstrates immediate validation, character counters, and save state management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...form.register('email')}
            className={
              formValidationUtils.shouldShowError(form.getFieldState('email'))
                ? 'border-red-500'
                : ''
            }
          />
          {formValidationUtils.shouldShowError(form.getFieldState('email')) && (
            <p className="text-sm text-red-500">
              {formValidationUtils.formatError(form.getFieldState('email').error)}
            </p>
          )}
        </div>

        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your name"
            {...form.register('name')}
            className={
              formValidationUtils.shouldShowError(form.getFieldState('name'))
                ? 'border-red-500'
                : ''
            }
          />
          {formValidationUtils.shouldShowError(form.getFieldState('name')) && (
            <p className="text-sm text-red-500">
              {formValidationUtils.formatError(form.getFieldState('name').error)}
            </p>
          )}
        </div>

        {/* Bio Field with Character Counter */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            placeholder="Tell us about yourself"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            {...form.register('bio')}
          />
          <div className="flex justify-between items-center">
            {formValidationUtils.shouldShowError(form.getFieldState('bio')) && (
              <p className="text-sm text-red-500">
                {formValidationUtils.formatError(form.getFieldState('bio').error)}
              </p>
            )}
            <div className="ml-auto">
              {(() => {
                const counter = formatCharacterCounter(
                  form.getCharacterCount('bio'),
                  200
                );
                return (
                  <span className={`text-sm ${counter.className}`}>
                    {counter.text}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Website Field */}
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            placeholder="https://example.com"
            {...form.register('website')}
            className={
              formValidationUtils.shouldShowError(form.getFieldState('website'))
                ? 'border-red-500'
                : ''
            }
          />
          {formValidationUtils.shouldShowError(form.getFieldState('website')) && (
            <p className="text-sm text-red-500">
              {formValidationUtils.formatError(form.getFieldState('website').error)}
            </p>
          )}
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <Button
            type="button"
            onClick={() => form.handleSaveWithToast(handleSave)}
            {...formValidationUtils.getSaveButtonProps({
              isValid: form.validationState.isValid,
              isDirty: form.validationState.isDirty,
              isSubmitting: form.validationState.isSubmitting,
            })}
            className="w-full"
          >
            {form.validationState.isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Form State Debug Info */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Form State:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Valid: {form.validationState.isValid ? '✓' : '✗'}</div>
            <div>Dirty: {form.validationState.isDirty ? '✓' : '✗'}</div>
            <div>Can Save: {form.validationState.canSave ? '✓' : '✗'}</div>
            <div>Has Errors: {form.validationState.hasErrors ? '✓' : '✗'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};