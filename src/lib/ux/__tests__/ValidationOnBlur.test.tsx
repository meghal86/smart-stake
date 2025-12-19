/**
 * Validation on Blur with Clear Messages Test
 * 
 * Demonstrates that form validation triggers on blur and shows clear error messages
 * Requirements: R6.VALIDATION.IMMEDIATE, R6.VALIDATION.CLEAR_MESSAGES
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Test schema with validation rules
const testSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z.string()
    .regex(/^(\+\d{1,3}[- ]?)?\d{7,15}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
});

type TestFormData = z.infer<typeof testSchema>;

// Test component that demonstrates validation on blur
function TestFormComponent() {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    mode: 'onBlur', // This is the key setting for validation on blur
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  const onSubmit = (data: TestFormData) => {
    console.log('Form submitted:', data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (Optional)</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="Enter your phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={form.formState.isSubmitting || !form.formState.isDirty || !form.formState.isValid}
        >
          {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  );
}

describe('Validation on Blur with Clear Messages', () => {
  test('shows validation error immediately on blur for invalid name', async () => {
    render(<TestFormComponent />);
    
    const nameInput = screen.getByPlaceholderText('Enter your name');
    
    // Enter invalid name (too short)
    fireEvent.change(nameInput, { target: { value: 'A' } });
    fireEvent.blur(nameInput);
    
    // Validation error should appear immediately on blur
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });
  });

  test('shows validation error immediately on blur for invalid email', async () => {
    render(<TestFormComponent />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    
    // Enter invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    
    // Validation error should appear immediately on blur
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  test('shows validation error immediately on blur for invalid phone', async () => {
    render(<TestFormComponent />);
    
    const phoneInput = screen.getByPlaceholderText('Enter your phone number');
    
    // Enter invalid phone number
    fireEvent.change(phoneInput, { target: { value: 'invalid-phone' } });
    fireEvent.blur(phoneInput);
    
    // Validation error should appear immediately on blur
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    });
  });

  test('clears validation error when field becomes valid', async () => {
    render(<TestFormComponent />);
    
    const nameInput = screen.getByPlaceholderText('Enter your name');
    
    // Enter invalid name first
    fireEvent.change(nameInput, { target: { value: 'A' } });
    fireEvent.blur(nameInput);
    
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });
    
    // Fix the name
    fireEvent.change(nameInput, { target: { value: 'Valid Name' } });
    fireEvent.blur(nameInput);
    
    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Name must be at least 2 characters')).not.toBeInTheDocument();
    });
  });

  test('save button is disabled when form has validation errors', async () => {
    render(<TestFormComponent />);
    
    const nameInput = screen.getByPlaceholderText('Enter your name');
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    
    // Initially disabled (not dirty)
    expect(saveButton).toBeDisabled();
    
    // Enter invalid data
    fireEvent.change(nameInput, { target: { value: 'A' } });
    fireEvent.blur(nameInput);
    
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });
    
    // Button should remain disabled due to validation error
    expect(saveButton).toBeDisabled();
  });

  test('save button becomes enabled when all fields are valid and form is dirty', async () => {
    render(<TestFormComponent />);
    
    const nameInput = screen.getByPlaceholderText('Enter your name');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    
    // Enter valid data
    fireEvent.change(nameInput, { target: { value: 'Valid Name' } });
    fireEvent.blur(nameInput);
    
    fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
    fireEvent.blur(emailInput);
    
    // Button should become enabled
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });

  test('error messages are clear and user-friendly', async () => {
    render(<TestFormComponent />);
    
    const nameInput = screen.getByPlaceholderText('Enter your name');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    
    // Test various validation scenarios
    const testCases = [
      {
        input: nameInput,
        value: '',
        expectedError: 'Name must be at least 2 characters',
      },
      {
        input: nameInput,
        value: 'A'.repeat(51),
        expectedError: 'Name must be less than 50 characters',
      },
      {
        input: emailInput,
        value: '',
        expectedError: 'Email is required',
      },
      {
        input: emailInput,
        value: 'invalid-email',
        expectedError: 'Please enter a valid email address',
      },
    ];

    for (const testCase of testCases) {
      fireEvent.change(testCase.input, { target: { value: testCase.value } });
      fireEvent.blur(testCase.input);
      
      await waitFor(() => {
        expect(screen.getByText(testCase.expectedError)).toBeInTheDocument();
      });
      
      // Clear the field for next test
      fireEvent.change(testCase.input, { target: { value: '' } });
    }
  });

  test('validation messages have proper accessibility attributes', async () => {
    render(<TestFormComponent />);
    
    const nameInput = screen.getByPlaceholderText('Enter your name');
    
    // Enter invalid name
    fireEvent.change(nameInput, { target: { value: 'A' } });
    fireEvent.blur(nameInput);
    
    await waitFor(() => {
      const errorMessage = screen.getByText('Name must be at least 2 characters');
      expect(errorMessage).toBeInTheDocument();
      
      // Check that the error message has proper ARIA attributes
      // The input should have aria-invalid="true" and aria-describedby pointing to the error message
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(nameInput).toHaveAttribute('aria-describedby');
      
      // The error message should have an ID that matches the aria-describedby
      expect(errorMessage).toHaveAttribute('id');
      const errorId = errorMessage.getAttribute('id');
      const ariaDescribedBy = nameInput.getAttribute('aria-describedby');
      expect(ariaDescribedBy).toContain(errorId);
    });
  });

  test('multiple validation errors can be shown simultaneously', async () => {
    render(<TestFormComponent />);
    
    const nameInput = screen.getByPlaceholderText('Enter your name');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const phoneInput = screen.getByPlaceholderText('Enter your phone number');
    
    // Enter invalid data in multiple fields
    fireEvent.change(nameInput, { target: { value: 'A' } });
    fireEvent.blur(nameInput);
    
    fireEvent.change(emailInput, { target: { value: 'invalid' } });
    fireEvent.blur(emailInput);
    
    fireEvent.change(phoneInput, { target: { value: 'invalid' } });
    fireEvent.blur(phoneInput);
    
    // All errors should be visible simultaneously
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    });
  });
});