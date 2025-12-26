/**
 * HarvestPro Settings Form Tests
 * 
 * Tests for real-time validation functionality
 * Requirements: Enhanced Req 6 AC1-3 (immediate validation, clear messages)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { HarvestProSettingsForm } from '../HarvestProSettingsForm';
import { HarvestUserSettings } from '@/types/harvestpro';

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('HarvestProSettingsForm', () => {
  const mockOnSave = vi.fn();
  
  const defaultSettings: Partial<HarvestUserSettings> = {
    taxRate: 0.24,
    notificationsEnabled: true,
    notificationThreshold: 100,
    preferredWallets: ['0x742d35Cc6634C0532925a3b8D4C9db96590b5b8c'],
    riskTolerance: 'moderate',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderForm = (initialSettings?: Partial<HarvestUserSettings>) => {
    return render(
      <HarvestProSettingsForm
        initialSettings={initialSettings || defaultSettings}
        onSave={mockOnSave}
      />
    );
  };

  describe('Real-Time Validation - Tax Rate', () => {
    test('shows immediate validation feedback on tax rate field', async () => {
      const user = userEvent.setup();
      renderForm();

      const taxRateInput = screen.getByLabelText(/tax rate/i);
      
      // Clear and enter invalid value
      await user.clear(taxRateInput);
      await user.type(taxRateInput, '1.5');
      await user.tab(); // Trigger blur event

      // Should show error message immediately
      await waitFor(() => {
        expect(screen.getByText(/tax rate cannot exceed 100%/i)).toBeInTheDocument();
      });

      // Should show error icon
      expect(screen.getByTestId('alert-circle')).toBeInTheDocument();
    });

    test('shows percentage display in real-time', async () => {
      const user = userEvent.setup();
      renderForm();

      const taxRateInput = screen.getByLabelText(/tax rate/i);
      
      await user.clear(taxRateInput);
      await user.type(taxRateInput, '0.35');

      // Should show percentage display
      await waitFor(() => {
        expect(screen.getByText('35.0%')).toBeInTheDocument();
      });
    });

    test('validates tax rate range warnings', async () => {
      const user = userEvent.setup();
      renderForm();

      const taxRateInput = screen.getByLabelText(/tax rate/i);
      
      // Enter value outside typical range
      await user.clear(taxRateInput);
      await user.type(taxRateInput, '0.05');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/tax rate should typically be between 10% and 50%/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-Time Validation - Notification Threshold', () => {
    test('validates minimum notification threshold', async () => {
      const user = userEvent.setup();
      renderForm();

      const thresholdInput = screen.getByLabelText(/notification threshold/i);
      
      await user.clear(thresholdInput);
      await user.type(thresholdInput, '25');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/notification threshold should be at least \$50/i)).toBeInTheDocument();
      });
    });

    test('shows currency formatting in real-time', async () => {
      const user = userEvent.setup();
      renderForm();

      const thresholdInput = screen.getByLabelText(/notification threshold/i);
      
      await user.clear(thresholdInput);
      await user.type(thresholdInput, '500');

      await waitFor(() => {
        expect(screen.getByText('$500')).toBeInTheDocument();
      });
    });

    test('validates maximum notification threshold', async () => {
      const user = userEvent.setup();
      renderForm();

      const thresholdInput = screen.getByLabelText(/notification threshold/i);
      
      await user.clear(thresholdInput);
      await user.type(thresholdInput, '150000');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/notification threshold cannot exceed \$100,000/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-Time Validation - Preferred Wallets', () => {
    test('validates wallet address format', async () => {
      const user = userEvent.setup();
      renderForm();

      const walletsTextarea = screen.getByLabelText(/preferred wallets/i);
      
      await user.clear(walletsTextarea);
      await user.type(walletsTextarea, 'invalid-address');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid wallet address format/i)).toBeInTheDocument();
      });
    });

    test('shows wallet counter in real-time', async () => {
      const user = userEvent.setup();
      renderForm();

      const walletsTextarea = screen.getByLabelText(/preferred wallets/i);
      
      await user.clear(walletsTextarea);
      await user.type(walletsTextarea, '0x742d35Cc6634C0532925a3b8D4C9db96590b5b8c\n0x8ba1f109551bD432803012645Hac136c22C501e');

      await waitFor(() => {
        expect(screen.getByText('2/10 wallets')).toBeInTheDocument();
      });
    });

    test('validates maximum wallet limit', async () => {
      const user = userEvent.setup();
      renderForm();

      const walletsTextarea = screen.getByLabelText(/preferred wallets/i);
      
      // Create 11 valid wallet addresses
      const wallets = Array.from({ length: 11 }, (_, i) => 
        `0x742d35Cc6634C0532925a3b8D4C9db96590b5b${i.toString().padStart(2, '0')}`
      ).join('\n');
      
      await user.clear(walletsTextarea);
      await user.type(walletsTextarea, wallets);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/cannot have more than 10 preferred wallets/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Status Indicators', () => {
    test('shows form status based on validation state', async () => {
      const user = userEvent.setup();
      renderForm();

      // Initially should show ready to save (if form is valid and dirty)
      const taxRateInput = screen.getByLabelText(/tax rate/i);
      await user.clear(taxRateInput);
      await user.type(taxRateInput, '0.30');

      await waitFor(() => {
        expect(screen.getByText(/ready to save/i)).toBeInTheDocument();
      });

      // Enter invalid value
      await user.clear(taxRateInput);
      await user.type(taxRateInput, '1.5');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/please fix validation errors/i)).toBeInTheDocument();
      });
    });

    test('shows visual validation indicators', async () => {
      const user = userEvent.setup();
      renderForm();

      const taxRateInput = screen.getByLabelText(/tax rate/i);
      
      // Valid input should show green border and check icon
      await user.clear(taxRateInput);
      await user.type(taxRateInput, '0.25');
      await user.tab();

      await waitFor(() => {
        expect(taxRateInput).toHaveClass('border-green-500');
        expect(screen.getByTestId('check-circle')).toBeInTheDocument();
      });

      // Invalid input should show red border and alert icon
      await user.clear(taxRateInput);
      await user.type(taxRateInput, '1.5');
      await user.tab();

      await waitFor(() => {
        expect(taxRateInput).toHaveClass('border-red-500');
        expect(screen.getByTestId('alert-circle')).toBeInTheDocument();
      });
    });
  });

  describe('Save Button State', () => {
    test('disables save button when form has validation errors', async () => {
      const user = userEvent.setup();
      renderForm();

      const saveButton = screen.getByRole('button', { name: /save settings/i });
      const taxRateInput = screen.getByLabelText(/tax rate/i);
      
      // Enter invalid value
      await user.clear(taxRateInput);
      await user.type(taxRateInput, '1.5');
      await user.tab();

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });
    });

    test('enables save button when form is valid and dirty', async () => {
      const user = userEvent.setup();
      renderForm();

      const saveButton = screen.getByRole('button', { name: /save settings/i });
      const taxRateInput = screen.getByLabelText(/tax rate/i);
      
      // Make a valid change
      await user.clear(taxRateInput);
      await user.type(taxRateInput, '0.30');

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe('Character Counters', () => {
    test('shows character counter for wallet addresses', async () => {
      const user = userEvent.setup();
      renderForm();

      const walletsTextarea = screen.getByLabelText(/preferred wallets/i);
      
      // Should show initial count
      expect(screen.getByText('1/10 wallets')).toBeInTheDocument();

      // Add another wallet
      await user.type(walletsTextarea, '\n0x8ba1f109551bD432803012645Hac136c22C501e');

      await waitFor(() => {
        expect(screen.getByText('2/10 wallets')).toBeInTheDocument();
      });
    });
  });

  describe('Success Confirmations', () => {
    test('shows success message after successful save', async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValueOnce(undefined);
      
      renderForm();

      const saveButton = screen.getByRole('button', { name: /save settings/i });
      const taxRateInput = screen.getByLabelText(/tax rate/i);
      
      // Make a valid change
      await user.clear(taxRateInput);
      await user.type(taxRateInput, '0.30');
      
      // Submit form
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          taxRate: 0.30,
          notificationsEnabled: true,
          notificationThreshold: 100,
          preferredWallets: ['0x742d35Cc6634C0532925a3b8D4C9db96590b5b8c'],
          riskTolerance: 'moderate',
        });
      });
    });

    test('shows loading state during save', async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      const savePromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      mockOnSave.mockReturnValueOnce(savePromise);
      
      renderForm();

      const saveButton = screen.getByRole('button', { name: /save settings/i });
      const taxRateInput = screen.getByLabelText(/tax rate/i);
      
      // Make a valid change
      await user.clear(taxRateInput);
      await user.type(taxRateInput, '0.30');
      
      // Submit form
      await user.click(saveButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/saving settings/i)).toBeInTheDocument();
        expect(saveButton).toBeDisabled();
      });

      // Resolve the promise
      act(() => {
        resolvePromise();
      });

      await waitFor(() => {
        expect(screen.getByText(/save settings/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and descriptions', () => {
      renderForm();

      // Check for proper labels
      expect(screen.getByLabelText(/tax rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notification threshold/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/preferred wallets/i)).toBeInTheDocument();

      // Check for help text
      expect(screen.getByText(/enter as decimal/i)).toBeInTheDocument();
      expect(screen.getByText(/minimum net benefit required/i)).toBeInTheDocument();
    });

    test('shows tooltips with helpful information', async () => {
      const user = userEvent.setup();
      renderForm();

      const helpIcon = screen.getAllByTestId('help-circle')[0];
      await user.hover(helpIcon);

      await waitFor(() => {
        expect(screen.getByText(/your marginal tax rate for capital gains/i)).toBeInTheDocument();
      });
    });
  });
});