/**
 * Basic Settings Page Tests
 * 
 * Basic tests for the Settings page component
 * Requirements: R5.SETTINGS.NO_INVALID_PLACEHOLDERS, R5.SETTINGS.CLEAR_EXPLANATIONS
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, test, beforeEach, expect } from 'vitest';
import Settings from '../Settings';

// Mock all dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      created_at: '2023-01-01T00:00:00Z',
      user_metadata: {
        full_name: 'Test User',
      },
    },
    signOut: vi.fn(),
  }),
}));

vi.mock('@/hooks/useTier', () => ({
  useTier: () => ({
    tier: 'premium',
    isPremium: true,
    isEnterprise: false,
  }),
}));

vi.mock('@/hooks/useUserMetadata', () => ({
  useUserMetadata: () => ({
    metadata: {
      profile: {
        name: 'Test User',
        avatar_url: '',
        date_of_birth: '',
        phone_number: '',
      },
    },
    loading: false,
  }),
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const renderSettings = () => {
  return render(
    <BrowserRouter>
      <Settings />
    </BrowserRouter>
  );
};

describe('Settings Page - Basic Tests', () => {
  test('renders settings page without crashing', () => {
    renderSettings();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('shows profile tab by default', () => {
    renderSettings();
    expect(screen.getByText('Profile Information')).toBeInTheDocument();
  });

  test('email field is disabled', () => {
    renderSettings();
    const emailInput = screen.getByDisplayValue('test@example.com');
    expect(emailInput).toBeDisabled();
  });

  test('date field shows proper placeholder when empty', () => {
    renderSettings();
    const dateInput = screen.getByLabelText(/Date of Birth/i);
    expect(dateInput).toHaveAttribute('placeholder', 'Not set');
  });

  test('save button exists', () => {
    renderSettings();
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
  });
});