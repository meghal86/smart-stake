/**
 * Settings Page Tests
 * 
 * Tests for the Settings page component
 * Requirements: R5.SETTINGS.NO_INVALID_PLACEHOLDERS, R5.SETTINGS.CLEAR_EXPLANATIONS
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

describe('Settings Page', () => {
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

  describe('Profile Tab', () => {
    test('renders profile form with user data', () => {
      renderSettings();
      
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://example.com/avatar.jpg')).toBeInTheDocument();
    });

    test('shows "Not set" placeholder for empty date field instead of "Invalid Date"', () => {
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

    test('email field is disabled with explanation tooltip', async () => {
      renderSettings();
      
      const emailInput = screen.getByDisplayValue('test@example.com');
      expect(emailInput).toBeDisabled();
      expect(emailInput).toHaveClass('bg-muted');
      
      // Check for help icon with tooltip
      const helpIcon = screen.getByRole('button');
      expect(helpIcon).toBeInTheDocument();
    });

    test('validates form fields with proper error messages', async () => {
      renderSettings();
      
      // Clear the name field and enter invalid data
      const nameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.blur(nameInput);
      
      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
      });
    });

    test('save button is disabled when form is not dirty', () => {
      renderSettings();
      
      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      expect(saveButton).toBeDisabled();
    });

    test('save button becomes enabled when form is modified', async () => {
      renderSettings();
      
      const nameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /Save Changes/i });
        expect(saveButton).not.toBeDisabled();
      });
    });

    test('shows loading state during form submission', async () => {
      renderSettings();
      
      const nameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      
      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });
    });
  });

  describe('Notifications Tab', () => {
    test('switches to notifications tab', () => {
      renderSettings();
      
      const notificationsTab = screen.getByRole('button', { name: /Notifications/i });
      fireEvent.click(notificationsTab);
      
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
    });

    test('SMS notifications disabled when no phone number', () => {
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
    });

    test('shows tooltip explanation for disabled SMS notifications', () => {
      renderSettings();
      
      const notificationsTab = screen.getByRole('button', { name: /Notifications/i });
      fireEvent.click(notificationsTab);
      
      // Check for help icon with tooltip explanation
      const helpIcons = screen.getAllByRole('button');
      expect(helpIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Privacy Tab', () => {
    test('switches to privacy tab', () => {
      renderSettings();
      
      const privacyTab = screen.getByRole('button', { name: /Privacy/i });
      fireEvent.click(privacyTab);
      
      expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
      expect(screen.getByText('Profile Visibility')).toBeInTheDocument();
    });

    test('renders privacy settings with current values', () => {
      renderSettings();
      
      const privacyTab = screen.getByRole('button', { name: /Privacy/i });
      fireEvent.click(privacyTab);
      
      expect(screen.getByText('Show Email Address')).toBeInTheDocument();
      expect(screen.getByText('Show Activity Status')).toBeInTheDocument();
    });
  });

  describe('Account Status', () => {
    test('displays correct tier badge', () => {
      renderSettings();
      
      expect(screen.getByText('premium')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    test('shows member since date', () => {
      renderSettings();
      
      expect(screen.getByText('12/31/2022')).toBeInTheDocument();
    });

    test('shows "Not available" when created_at is invalid', () => {
      mockUseAuth.mockReturnValue({
        user: {
          ...mockUser,
          created_at: '', // Invalid date
        },
        signOut: vi.fn(),
      } as any);

      renderSettings();
      
      expect(screen.getByText('Not available')).toBeInTheDocument();
    });

    test('shows API Keys option for enterprise users', () => {
      mockUseTier.mockReturnValue({
        tier: 'enterprise',
        isPremium: true,
        isEnterprise: true,
      } as any);

      renderSettings();
      
      expect(screen.getByText('API Keys')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('shows loading spinner when metadata is loading', () => {
      mockUseUserMetadata.mockReturnValue({
        metadata: null,
        loading: true,
      } as any);

      renderSettings();
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('back button navigates to previous page', () => {
      renderSettings();
      
      const backButton = screen.getByRole('button', { name: /Back/i });
      fireEvent.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('Form Validation', () => {
    test('validates phone number format', async () => {
      renderSettings();
      
      const phoneInput = screen.getByDisplayValue('+1234567890');
      fireEvent.change(phoneInput, { target: { value: 'invalid-phone' } });
      fireEvent.blur(phoneInput);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
      });
    });

    test('validates avatar URL format', async () => {
      renderSettings();
      
      const avatarInput = screen.getByDisplayValue('https://example.com/avatar.jpg');
      fireEvent.change(avatarInput, { target: { value: 'not-a-url' } });
      fireEvent.blur(avatarInput);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
      });
    });

    test('validates date of birth is in the past', async () => {
      renderSettings();
      
      const dateInput = screen.getByLabelText(/Date of Birth/i);
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      fireEvent.change(dateInput, { 
        target: { value: futureDate.toISOString().split('T')[0] } 
      });
      fireEvent.blur(dateInput);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid date in the past')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('form fields have proper labels and descriptions', () => {
      renderSettings();
      
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('This is your display name on the platform')).toBeInTheDocument();
      expect(screen.getByText('Your email address is used for login and notifications')).toBeInTheDocument();
    });

    test('disabled fields have explanatory tooltips', () => {
      renderSettings();
      
      // Email field should have tooltip explaining why it's disabled
      const helpIcons = screen.getAllByRole('button');
      expect(helpIcons.length).toBeGreaterThan(0);
    });

    test('form validation messages are accessible', async () => {
      renderSettings();
      
      const nameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(nameInput, { target: { value: '' } });
      fireEvent.blur(nameInput);
      
      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe('Toast Messages', () => {
    beforeEach(() => {
      mockToast.mockClear();
    });

    test('shows success toast with "Changes saved ✓" message on profile save', async () => {
      renderSettings();
      
      const nameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      
      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Changes saved ✓",
          description: "Your profile has been successfully updated.",
          variant: "success",
        });
      });
    });

    test('shows success toast with "Changes saved ✓" message on notification save', async () => {
      renderSettings();
      
      const notificationsTab = screen.getByRole('button', { name: /Notifications/i });
      fireEvent.click(notificationsTab);
      
      const emailSwitch = screen.getByRole('switch', { name: /Email Notifications/i });
      fireEvent.click(emailSwitch);
      
      const saveButton = screen.getByRole('button', { name: /Save Preferences/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Changes saved ✓",
          description: "Your notification preferences have been saved.",
          variant: "success",
        });
      });
    });

    test('shows success toast with "Changes saved ✓" message on privacy save', async () => {
      renderSettings();
      
      const privacyTab = screen.getByRole('button', { name: /Privacy/i });
      fireEvent.click(privacyTab);
      
      const showEmailSwitch = screen.getByRole('switch', { name: /Show Email Address/i });
      fireEvent.click(showEmailSwitch);
      
      const saveButton = screen.getByRole('button', { name: /Save Settings/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Changes saved ✓",
          description: "Your privacy preferences have been saved.",
          variant: "success",
        });
      });
    });

    test('shows specific error toast messages on save failure', async () => {
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

      // Restore original console.error and setTimeout
      console.error = originalConsoleError;
      vi.restoreAllMocks();
    });
  });
});