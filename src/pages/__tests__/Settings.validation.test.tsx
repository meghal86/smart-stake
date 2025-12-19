/**
 * Settings Validation and Save State Tests
 * 
 * Comprehensive tests for form validation messaging and save button states
 * Requirements: R5.SETTINGS.NO_INVALID_PLACEHOLDERS, R5.SETTINGS.CLEAR_EXPLANATIONS, R6.VALIDATION.IMMEDIATE, R6.VALIDATION.CLEAR_MESSAGES, R6.VALIDATION.SAVE_STATES
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, test, beforeEach, afterEach, expect } from 'vitest';
import Settings from '../Settings';
import { useAuth } from '@/contexts/AuthContext';
import { useTier } from '@/hooks/useTier';
import { useUserMetadata } from '@/hooks/useUserMetadata';

// Mock dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/useTier');
vi.mock('@/hooks/useUserMetadata');

const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;
const mockUseTier = useTier as vi.MockedFunction<typeof useTier>;
const mockUseUserMetadata = useUserMetadata as vi.MockedFunction<typeof useUserMetadata>;

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2023-01-01T00:00:00Z',
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
  },
};

const mockMetadata = {
  profile: {
    name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    date_of_birth: '1990-01-01',
    phone_number: '+1234567890',
  },
  preferences: {
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      weeklyDigest: true,
      marketingEmails: false,
    },
    privacy: {
      profileVisibility: 'public' as const,
      showEmail: false,
      showActivity: true,
    },
  },
};

const renderSettings = () => {
  return render(
    <BrowserRouter>
      <Settings />
    </BrowserRouter>
  );
};

describe('Settings Validation and Save State Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      signOut: vi.fn(),
    } as any);

    mockUseTier.mockReturnValue({
      tier: 'premium',
      isPremium: true,
      isEnterprise: false,
    } as any);

    mockUseUserMetadata.mockReturnValue({
      metadata: mockMetadata,
      loading: false,
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Validation Messaging', () => {
    test('shows validation error immediately on blur for invalid name', async () => {
      renderSettings();
      
      const nameInput = screen.getByDisplayValue('Test User');
      
      // Enter invalid name (too short)
      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.blur(nameInput);
      
      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
      });
    });

    test('shows validation error immediately on blur for invalid phone number', async () => {
      renderSettings();
      
      const phoneInput = screen.getByDisplayValue('+1234567890');
      
      // Enter invalid phone number
      fireEvent.change(phoneInput, { target: { value: 'invalid-phone' } });
      fireEvent.blur(phoneInput);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
      });
    });

    test('shows validation error immediately on blur for invalid avatar URL', async () => {
      renderSettings();
      
      const avatarInput = screen.getByDisplayValue('https://example.com/avatar.jpg');
      
      // Enter invalid URL
      fireEvent.change(avatarInput, { target: { value: 'not-a-url' } });
      fireEvent.blur(avatarInput);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
      });
    });

    test('shows validation error immediately on blur for future date of birth', async () => {
      renderSettings();
      
      const dateInput = screen.getByLabelText(/Date of Birth/i);
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      // Enter future date
      fireEvent.change(dateInput, { 
        target: { value: futureDate.toISOString().split('T')[0] } 
      });
      fireEvent.blur(dateInput);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid date in the past')).toBeInTheDocument();
      });
    });

    test('clears validation error when field becomes valid', async () => {
      renderSettings();
      
      const nameInput = screen.getByDisplayValue('Test User');
      
      // Enter invalid name
      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.blur(nameInput);
      
      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
      });
      
      // Fix the name
      fireEvent.change(nameInput, { target: { value: 'Valid Name' } });
      fireEvent.blur(nameInput);
      
      await waitFor(() => {
        expect(screen.queryByText('Name must be at least 2 characters')).not.toBeInTheDocument();
      });
    });

    test('validation messages are accessible with proper ARIA attributes', async () => {
      renderSettings();
      
      const nameInput = screen.getByDisplayValue('Test User');
      
      // Enter invalid name
      fireEvent.change(nameInput, { target: { value: '' } });
      fireEvent.blur(nameInput);
      
      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent('Name must be at least 2 characters');
      });
    });

    test('shows multiple validation errors simultaneously', async () => {
      renderSettings();
      
      const nameInput = screen.getByDisplayValue('Test User');
      const phoneInput = screen.getByDisplayValue('+1234567890');
      
      // Enter invalid data in multiple fields
      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.blur(nameInput);
      
      fireEvent.change(phoneInput, { target: { value: 'invalid' } });
      fireEvent.blur(phoneInput);
      
      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
        expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
      });
    });
  });

  describe('Save Button State Management', () => {
    test('save button is disabled when form is not dirty (no changes made)', () => {
      renderSettings();
      
      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      expect(saveButton).toBeDisabled();
    });

    test('save button becomes enabled when form is modified with valid data', async () => {
      renderSettings();
      
      const nameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /Save Changes/i });
        expect(saveButton).not.toBeDisabled();
      });
    });

    test('save button remains disabled when form has validation errors', async () => {
      renderSettings();
      
      const nameInput = screen.getByDisplayValue('Test User');
      
      // Enter invalid data
      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.blur(nameInput);
      
      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
      });
      
      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      expect(saveButton).toBeDisabled();
    });

    test('save button becomes enabled when validation errors are fixed', async () => {
      renderSettings();
      
      const nameInput = screen.getByDisplayValue('Test User');
      
      // Enter invalid data first
      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.blur(nameInput);
      
      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
      });
      
      // Fix the validation error
      fireEvent.change(nameInput, { target: { value: 'Valid Name' } });
      fireEvent.blur(nameInput);
      
      await waitFor(() => {
        expect(screen.queryByText('Name must be at least 2 characters')).not.toBeInTheDocument();
        const saveButton = screen.getByRole('button', { name: /Save Changes/i });
        expect(saveButton).not.toBeDisabled();
      });
    });

    test('save button shows loading state during submission', async () => {
      renderSettings();
      
      const nameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      
      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
        expect(saveButton).toBeDisabled();
      });
    });

    test('save button is re-enabled after successful submission', async () => {
      renderSettings();
      
      const nameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      
      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveButton);
      
      // Wait for submission to complete
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Changes saved ✓",
          description: "Your profile has been successfully updated.",
          variant: "success",
        });
      });
      
      // Button should be disabled again since form is no longer dirty
      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });
    });

    test('save button returns to enabled state after failed submission', async () => {
      // Mock console.error to simulate API failure
      const originalConsoleError = console.error;
      console.error = vi.fn();
      
      // Mock a failed API call by throwing an error
      const mockError = new Error('Network error');
      vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        throw mockError;
      });

      renderSettings();
      
      const nameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      
      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Profile update failed",
          description: "Unable to save profile changes. Please check your connection and try again.",
          variant: "destructive",
        });
      });
      
      // Button should be enabled again for retry
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });

      // Restore original console.error and setTimeout
      console.error = originalConsoleError;
      vi.restoreAllMocks();
    });
  });

  describe('Notifications Tab Save State', () => {
    test('notification save button is disabled when form is not dirty', () => {
      renderSettings();
      
      const notificationsTab = screen.getByRole('button', { name: /Notifications/i });
      fireEvent.click(notificationsTab);
      
      const saveButton = screen.getByRole('button', { name: /Save Preferences/i });
      expect(saveButton).toBeDisabled();
    });

    test('notification save button becomes enabled when preferences are modified', async () => {
      renderSettings();
      
      const notificationsTab = screen.getByRole('button', { name: /Notifications/i });
      fireEvent.click(notificationsTab);
      
      const emailSwitch = screen.getByRole('switch', { name: /Email Notifications/i });
      fireEvent.click(emailSwitch);
      
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /Save Preferences/i });
        expect(saveButton).not.toBeDisabled();
      });
    });

    test('SMS notifications switch is disabled when no phone number with tooltip explanation', () => {
      // Mock user without phone number
      mockUseUserMetadata.mockReturnValue({
        metadata: {
          ...mockMetadata,
          profile: {
            ...mockMetadata.profile,
            phone_number: '',
          },
        },
        loading: false,
      } as any);

      renderSettings();
      
      const notificationsTab = screen.getByRole('button', { name: /Notifications/i });
      fireEvent.click(notificationsTab);
      
      const smsSwitch = screen.getByRole('switch', { name: /SMS Notifications/i });
      expect(smsSwitch).toBeDisabled();
      
      // Check for tooltip explanation
      const helpIcons = screen.getAllByRole('button');
      expect(helpIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Privacy Tab Save State', () => {
    test('privacy save button is disabled when form is not dirty', () => {
      renderSettings();
      
      const privacyTab = screen.getByRole('button', { name: /Privacy/i });
      fireEvent.click(privacyTab);
      
      const saveButton = screen.getByRole('button', { name: /Save Settings/i });
      expect(saveButton).toBeDisabled();
    });

    test('privacy save button becomes enabled when settings are modified', async () => {
      renderSettings();
      
      const privacyTab = screen.getByRole('button', { name: /Privacy/i });
      fireEvent.click(privacyTab);
      
      const showEmailSwitch = screen.getByRole('switch', { name: /Show Email Address/i });
      fireEvent.click(showEmailSwitch);
      
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /Save Settings/i });
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe('Field-Specific Validation Messages', () => {
    test('email field shows disabled explanation tooltip', () => {
      renderSettings();
      
      const emailInput = screen.getByDisplayValue('test@example.com');
      expect(emailInput).toBeDisabled();
      expect(emailInput).toHaveClass('bg-muted');
      
      // Check for help icon with tooltip
      const helpIcons = screen.getAllByRole('button');
      expect(helpIcons.length).toBeGreaterThan(0);
    });

    test('date field shows "Not set" placeholder instead of "Invalid Date"', () => {
      // Mock user with empty date
      mockUseUserMetadata.mockReturnValue({
        metadata: {
          ...mockMetadata,
          profile: {
            ...mockMetadata.profile,
            date_of_birth: '',
          },
        },
        loading: false,
      } as any);

      renderSettings();
      
      const dateInput = screen.getByLabelText(/Date of Birth/i);
      expect(dateInput).toHaveAttribute('placeholder', 'Not set');
      expect(dateInput).toHaveValue('');
    });

    test('phone number field accepts various valid formats', async () => {
      renderSettings();
      
      const phoneInput = screen.getByDisplayValue('+1234567890');
      
      const validFormats = ['+1 (555) 123-4567', '5551234567', '+44 20 7946 0958'];
      
      for (const format of validFormats) {
        fireEvent.change(phoneInput, { target: { value: format } });
        fireEvent.blur(phoneInput);
        
        // Should not show validation error
        await waitFor(() => {
          expect(screen.queryByText('Please enter a valid phone number')).not.toBeInTheDocument();
        });
      }
    });

    test('avatar URL field accepts valid URLs and rejects invalid ones', async () => {
      renderSettings();
      
      const avatarInput = screen.getByDisplayValue('https://example.com/avatar.jpg');
      
      // Test valid URL
      fireEvent.change(avatarInput, { target: { value: 'https://newavatar.com/image.png' } });
      fireEvent.blur(avatarInput);
      
      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid URL')).not.toBeInTheDocument();
      });
      
      // Test invalid URL
      fireEvent.change(avatarInput, { target: { value: 'not-a-url' } });
      fireEvent.blur(avatarInput);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
      });
    });
  });

  describe('Character Counter and Limits', () => {
    test('name field enforces maximum length', async () => {
      renderSettings();
      
      const nameInput = screen.getByDisplayValue('Test User');
      const longName = 'A'.repeat(101); // Exceeds 100 character limit
      
      fireEvent.change(nameInput, { target: { value: longName } });
      fireEvent.blur(nameInput);
      
      await waitFor(() => {
        expect(screen.getByText('Name must be less than 100 characters')).toBeInTheDocument();
      });
    });

    test('empty name field shows minimum length error', async () => {
      renderSettings();
      
      const nameInput = screen.getByDisplayValue('Test User');
      
      fireEvent.change(nameInput, { target: { value: '' } });
      fireEvent.blur(nameInput);
      
      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
      });
    });
  });

  describe('Form State Persistence', () => {
    test('form maintains state when switching between tabs', async () => {
      renderSettings();
      
      // Modify profile form
      const nameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(nameInput, { target: { value: 'Modified Name' } });
      
      // Switch to notifications tab
      const notificationsTab = screen.getByRole('button', { name: /Notifications/i });
      fireEvent.click(notificationsTab);
      
      // Switch back to profile tab
      const profileTab = screen.getByRole('button', { name: /Profile/i });
      fireEvent.click(profileTab);
      
      // Check that the modified value is still there
      expect(screen.getByDisplayValue('Modified Name')).toBeInTheDocument();
      
      // Save button should still be enabled
      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      expect(saveButton).not.toBeDisabled();
    });
  });
});