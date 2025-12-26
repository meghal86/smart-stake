/**
 * HarvestPro Settings Form Integration Tests
 * 
 * End-to-end tests for real-time validation user experience
 * Requirements: Enhanced Req 6 AC1-3 (immediate validation, clear messages)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { HarvestProSettingsForm } from '../HarvestProSettingsForm';
import { HarvestUserSettings } from '@/types/harvestpro';

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('HarvestPro Settings Form Integration Tests', () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderForm = (initialSettings?: Partial<HarvestUserSettings>) => {
    return render(
      <HarvestProSettingsForm
        initialSettings={initialSettings}
        onSave={mockOnSave}
      />
    );
  };

  describe('Complete User Journey - Valid Input Flow', () => {
    test('user can successfully configure all settings with real-time feedback', async () => {
      const user = userEvent.setup();
      renderForm();

      // Step 1: Configure tax rate with real-time percentage display
      const taxRateInput = screen.getByLabelText(/tax rate/i);
      await user.clear(taxRateInput);
      await user.type(taxRateInput, '0.32');

      // Should show percentage immediately
      await waitFor(() => {
        expect(screen.getByText('32.0%')).toBeInTheDocument();
      });

      // Step 2: Configure notification threshold with currency formatting
      const thresholdInput = screen.getByLabelText(/notification threshold/i);
      await user.clear(thresholdInput);
      await user.type(thresholdInput, '250');

      // Should show currency formatting
      await waitFor(() => {
        expect(screen.getByText('$250')).toBeInTheDocument();
      });

      // Step 3: Configure risk tolerance
      const riskSelect = screen.getByRole('combobox');
      await user.click(riskSelect);
      await user.click(screen.getByText('Conservative'));

      // Step 4: Add preferred wallets with counter
      const walletsTextarea = screen.getByLabelText(/preferred wallets/i);
      await user.clear(walletsTextarea);
      await user.type(walletsTextarea, '0x742d35Cc6634C0532925a3b8D4C9db96590b5b8c\n0x8ba1f109551bD432803012645Hac136c22C501e');

      // Should show wallet counter
      await waitFor(() => {
        expect(screen.getByText('2/10 wallets')).toBeInTheDocument();
      });

      // Step 5: Form should be ready to save
      await waitFor(() => {
        expect(screen.getByText(/ready to save/i)).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save settings/i });
      expect(saveButton).not.toBeDisabled();

      // Step 6: Submit form
      mockOnSave.mockResolvedValueOnce(undefined);
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          taxRate: 0.32,
          notificationsEnabled: true,
          notificationThreshold: 250,
          preferredWallets: [
            '0x742d35Cc6634C0532925a3b8D4C9db96590b5b8c',
            '0x8ba1f109551bD432803012645Hac136c22C501e'
          ],
          riskTolerance: 'conservative',
        });
      });
    });
  });

  describe('Complete User Journey - Error Recovery Flow', () => {
    test('user can recover from validation errors with clear guidance', async () => {
      const user = userEvent.setup();
      renderForm();

      // Step 1: Enter invalid tax rate
      const taxRateInput = screen.getByLabelText(/tax rate/i);
      await user.clear(taxRateInput);
      await user.type(taxRateInput, '1.5');
      await user.tab(); // Trigger validation

      // Should show error immediately
      await waitFor(() => {
        expect(screen.getByText(/tax rate cannot exceed 100%/i)).toBeInTheDocument();
        expect(taxRateInput).toHaveClass('border-red-500');
      });

      // Step 2: Form should show error state
      await waitFor(() => {
        expect(screen.getByText(/please fix validation errors/i)).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save settings/i });
      expect(saveButton).toBeDisabled();

      // Step 3: Fix the error
      await user.clear(taxRateInput);
      await user.type(taxRateInput, '0.28');
      await user.tab();

      // Should show success state
      await waitFor(() => {
        expect(taxRateInput).toHaveClass('border-green-500');
        expect(screen.getByText('28.0%')).toBeInTheDocument();
      });

      // Step 4: Add invalid notification threshold
      const thresholdInput = screen.getByLabelText(/notification threshold/i);
      await user.clear(thresholdInput);
      await user.type(thresholdInput, '25');
      await user.tab();

      // Should show threshold error
      await waitFor(() => {
        expect(screen.getByText(/notification threshold should be at least \$50/i)).toBeInTheDocument();
        expect(thresholdInput).toHaveClass('border-red-500');
      });

      // Step 5: Fix threshold error
      await user.clear(thresholdInput);
      await user.type(thresholdInput, '150');
      await user.tab();

      // Should show success
      await waitFor(() => {
        expect(thresholdInput).toHaveClass('border-green-500');
        expect(screen.getByText('$150')).toBeInTheDocument();
      });

      // Step 6: Form should now be ready to save
      await waitFor(() => {
        expect(screen.getByText(/ready to save/i)).toBeInTheDocument();
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe('Real-Time Character Counting', () => {
    test('wallet counter updates in real-time as user types', async () => {
      const user = userEvent.setup();
      renderForm();

      const walletsTextarea = screen.getByLabelText(/preferred wallets/i);
      
      // Start with empty
      await user.clear(walletsTextarea);
      expect(screen.getByText('0/10 wallets')).toBeInTheDocument();

      // Add first wallet
      await user.type(walletsTextarea, '0x742d35Cc6634C0532925a3b8D4C9db96590b5b8c');
      await waitFor(() => {
        expect(screen.getByText('1/10 wallets')).toBeInTheDocument();
      });

      // Add second wallet
      await user.type(walletsTextarea, '\n0x8ba1f109551bD432803012645Hac136c22C501e');
      await waitFor(() => {
        expect(screen.getByText('2/10 wallets')).toBeInTheDocument();
      });

      // Add third wallet
      await user.type(walletsTextarea, '\n0x1234567890123456789012345678901234567890');
      await waitFor(() => {
        expect(screen.getByText('3/10 wallets')).toBeInTheDocument();
      });
    });

    test('shows warning when approaching wallet limit', async () => {
      const user = userEvent.setup();
      renderForm();

      const walletsTextarea = screen.getByLabelText(/preferred wallets/i);
      
      // Add 9 wallets (approaching limit)
      const wallets = Array.from({ length: 9 }, (_, i) => 
        `0x742d35Cc6634C0532925a3b8D4C9db96590b5b${i.toString().padStart(2, '0')}`
      ).join('\n');
      
      await user.clear(walletsTextarea);
      await user.type(walletsTextarea, wallets);

      await waitFor(() => {
        expect(screen.getByText('9/10 wallets')).toBeInTheDocument();
      });

      // Add 10th wallet (at limit)
      await user.type(walletsTextarea, '\n0x742d35Cc6634C0532925a3b8D4C9db96590b5b99');

      await waitFor(() => {
        expect(screen.getByText('10/10 wallets')).toBeInTheDocument();
      });

      // Try to add 11th wallet (over limit)
      await user.type(walletsTextarea, '\n0x742d35Cc6634C0532925a3b8D4C9db96590b5bAA');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/cannot have more than 10 preferred wallets/i)).toBeInTheDocument();
      });
    });
  });

  describe('Visual Feedback Indicators', () => {
    test('shows appropriate visual indicators for field states', async () => {
      const user = userEvent.setup();
      renderForm();

      const taxRateInput = screen.getByLabelText(/tax rate/i);

      // Test valid input visual feedback
      await user.clear(taxRateInput);
      await user.type(taxRateInput, '0.25');
      await user.tab();

      await waitFor(() => {
        expect(taxRateInput).toHaveClass('border-green-500');
        // Check for success icon (using data-testid or class)
        const successIcon = screen.getByTestId('check-circle') || screen.querySelector('[data-lucide="check-circle-2"]');
        expect(successIcon).toBeInTheDocument();
      });

      // Test invalid input visual feedback
      await user.clear(taxRateInput);
      await user.type(taxRateInput, '1.5');
      await user.tab();

      await waitFor(() => {
        expect(taxRateInput).toHaveClass('border-red-500');
        // Check for error icon
        const errorIcon = screen.getByTestId('alert-circle') || screen.querySelector('[data-lucide="alert-circle"]');
        expect(errorIcon).toBeInTheDocument();
      });
    });
  });

  describe('Form State Management', () => {
    test('manages dirty state correctly across multiple field changes', async () => {
      const user = userEvent.setup();
      renderForm({
        taxRate: 0.24,
        notificationThreshold: 100,
        notificationsEnabled: true,
        riskTolerance: 'moderate',
        preferredWallets: [],
      });

      // Initially should show no changes
      expect(screen.getByText(/make changes to enable save/i)).toBeInTheDocument();

      // Make a change
      const taxRateInput = screen.getByLabelText(/tax rate/i);
      await user.clear(taxRateInput);
      await user.type(taxRateInput, '0.30');

      // Should show ready to save
      await waitFor(() => {
        expect(screen.getByText(/ready to save/i)).toBeInTheDocument();
      });

      // Make another change
      const thresholdInput = screen.getByLabelText(/notification threshold/i);
      await user.clear(thresholdInput);
      await user.type(thresholdInput, '200');

      // Should still show ready to save
      await waitFor(() => {
        expect(screen.getByText(/ready to save/i)).toBeInTheDocument();
      });

      // Revert to original values
      await user.clear(taxRateInput);
      await user.type(taxRateInput, '0.24');
      await user.clear(thresholdInput);
      await user.type(thresholdInput, '100');

      // Should show no changes again
      await waitFor(() => {
        expect(screen.getByText(/make changes to enable save/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and User Experience', () => {
    test('provides clear error messages and recovery guidance', async () => {
      const user = userEvent.setup();
      renderForm();

      // Test tax rate error message clarity
      const taxRateInput = screen.getByLabelText(/tax rate/i);
      await user.clear(taxRateInput);
      await user.type(taxRateInput, '-0.1');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/tax rate cannot be negative/i)).toBeInTheDocument();
      });

      // Test notification threshold error message clarity
      const thresholdInput = screen.getByLabelText(/notification threshold/i);
      await user.clear(thresholdInput);
      await user.type(thresholdInput, '150000');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/notification threshold cannot exceed \$100,000/i)).toBeInTheDocument();
      });

      // Test wallet address error message clarity
      const walletsTextarea = screen.getByLabelText(/preferred wallets/i);
      await user.clear(walletsTextarea);
      await user.type(walletsTextarea, 'not-a-wallet-address');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid wallet address format/i)).toBeInTheDocument();
      });
    });

    test('maintains focus management during validation', async () => {
      const user = userEvent.setup();
      renderForm();

      const taxRateInput = screen.getByLabelText(/tax rate/i);
      const thresholdInput = screen.getByLabelText(/notification threshold/i);

      // Focus should move naturally between fields
      await user.click(taxRateInput);
      expect(taxRateInput).toHaveFocus();

      await user.tab();
      expect(thresholdInput).toHaveFocus();

      // Validation errors shouldn't interfere with focus
      await user.clear(thresholdInput);
      await user.type(thresholdInput, '25');
      await user.tab();

      // Focus should still move to next field despite validation error
      const nextField = screen.getByRole('switch'); // notifications toggle
      expect(nextField).toHaveFocus();
    });
  });
});