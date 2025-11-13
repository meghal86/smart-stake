/**
 * Tests for WalletLabelEditor component
 * 
 * @see src/components/hunter/WalletLabelEditor.tsx
 * @see .kiro/specs/hunter-screen-feed/tasks.md - Task 51
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletLabelEditor } from '@/components/hunter/WalletLabelEditor';
import { useWalletLabels } from '@/hooks/useWalletLabels';

// Mock useWalletLabels hook
vi.mock('@/hooks/useWalletLabels');

describe('WalletLabelEditor', () => {
  let queryClient: QueryClient;
  const mockSetLabel = vi.fn();
  const mockRemoveLabel = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    (useWalletLabels as any).mockReturnValue({
      setLabel: mockSetLabel,
      removeLabel: mockRemoveLabel,
      isSettingLabel: false,
      isRemovingLabel: false,
    });

    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';

  describe('Display', () => {
    it('should show "Add Label" button when no label exists', () => {
      render(
        <WalletLabelEditor address={mockAddress} />,
        { wrapper }
      );

      expect(screen.getByText('Add Label')).toBeInTheDocument();
    });

    it('should show "Edit Label" button when label exists', () => {
      render(
        <WalletLabelEditor address={mockAddress} currentLabel="My Wallet" />,
        { wrapper }
      );

      expect(screen.getByText('Edit Label')).toBeInTheDocument();
    });

    it('should have proper aria-label for add button', () => {
      render(
        <WalletLabelEditor address={mockAddress} />,
        { wrapper }
      );

      const button = screen.getByRole('button', { name: /add label for wallet/i });
      expect(button).toBeInTheDocument();
    });

    it('should have proper aria-label for edit button', () => {
      render(
        <WalletLabelEditor address={mockAddress} currentLabel="My Wallet" />,
        { wrapper }
      );

      const button = screen.getByRole('button', { name: /edit label for wallet/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Editing mode', () => {
    it('should enter editing mode when button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <WalletLabelEditor address={mockAddress} />,
        { wrapper }
      );

      const button = screen.getByText('Add Label');
      await user.click(button);

      expect(screen.getByPlaceholderText('Wallet label...')).toBeInTheDocument();
    });

    it('should show current label in input when editing', async () => {
      const user = userEvent.setup();
      
      render(
        <WalletLabelEditor address={mockAddress} currentLabel="My Wallet" />,
        { wrapper }
      );

      const button = screen.getByText('Edit Label');
      await user.click(button);

      const input = screen.getByDisplayValue('My Wallet');
      expect(input).toBeInTheDocument();
    });

    it('should focus and select input when entering edit mode', async () => {
      const user = userEvent.setup();
      
      render(
        <WalletLabelEditor address={mockAddress} currentLabel="My Wallet" />,
        { wrapper }
      );

      const button = screen.getByText('Edit Label');
      await user.click(button);

      const input = screen.getByDisplayValue('My Wallet') as HTMLInputElement;
      expect(input).toHaveFocus();
    });

    it('should show save and cancel buttons in edit mode', async () => {
      const user = userEvent.setup();
      
      render(
        <WalletLabelEditor address={mockAddress} />,
        { wrapper }
      );

      const button = screen.getByText('Add Label');
      await user.click(button);

      expect(screen.getByRole('button', { name: /save label/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Saving label', () => {
    it('should call setLabel when save button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <WalletLabelEditor address={mockAddress} />,
        { wrapper }
      );

      // Enter edit mode
      await user.click(screen.getByText('Add Label'));

      // Type label
      const input = screen.getByPlaceholderText('Wallet label...');
      await user.type(input, 'New Wallet');

      // Click save
      await user.click(screen.getByRole('button', { name: /save label/i }));

      expect(mockSetLabel).toHaveBeenCalledWith(mockAddress, 'New Wallet');
    });

    it('should call setLabel when Enter key is pressed', async () => {
      const user = userEvent.setup();
      
      render(
        <WalletLabelEditor address={mockAddress} />,
        { wrapper }
      );

      // Enter edit mode
      await user.click(screen.getByText('Add Label'));

      // Type label and press Enter
      const input = screen.getByPlaceholderText('Wallet label...');
      await user.type(input, 'New Wallet{Enter}');

      expect(mockSetLabel).toHaveBeenCalledWith(mockAddress, 'New Wallet');
    });

    it('should trim whitespace from label before saving', async () => {
      const user = userEvent.setup();
      
      render(
        <WalletLabelEditor address={mockAddress} />,
        { wrapper }
      );

      // Enter edit mode
      await user.click(screen.getByText('Add Label'));

      // Type label with whitespace
      const input = screen.getByPlaceholderText('Wallet label...');
      await user.type(input, '  New Wallet  ');

      // Click save
      await user.click(screen.getByRole('button', { name: /save label/i }));

      expect(mockSetLabel).toHaveBeenCalledWith(mockAddress, 'New Wallet');
    });

    it('should call removeLabel when saving empty label with existing label', async () => {
      const user = userEvent.setup();
      
      render(
        <WalletLabelEditor address={mockAddress} currentLabel="My Wallet" />,
        { wrapper }
      );

      // Enter edit mode
      await user.click(screen.getByText('Edit Label'));

      // Clear input
      const input = screen.getByDisplayValue('My Wallet');
      await user.clear(input);

      // Click save
      await user.click(screen.getByRole('button', { name: /save label/i }));

      expect(mockRemoveLabel).toHaveBeenCalledWith(mockAddress);
    });

    it('should call onSave callback after saving', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      
      render(
        <WalletLabelEditor address={mockAddress} onSave={onSave} />,
        { wrapper }
      );

      // Enter edit mode
      await user.click(screen.getByText('Add Label'));

      // Type and save
      const input = screen.getByPlaceholderText('Wallet label...');
      await user.type(input, 'New Wallet');
      await user.click(screen.getByRole('button', { name: /save label/i }));

      expect(onSave).toHaveBeenCalled();
    });

    it('should exit edit mode after saving', async () => {
      const user = userEvent.setup();
      
      render(
        <WalletLabelEditor address={mockAddress} />,
        { wrapper }
      );

      // Enter edit mode
      await user.click(screen.getByText('Add Label'));

      // Type and save
      const input = screen.getByPlaceholderText('Wallet label...');
      await user.type(input, 'New Wallet');
      await user.click(screen.getByRole('button', { name: /save label/i }));

      // Should exit edit mode
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Wallet label...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Canceling edit', () => {
    it('should exit edit mode when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <WalletLabelEditor address={mockAddress} />,
        { wrapper }
      );

      // Enter edit mode
      await user.click(screen.getByText('Add Label'));

      // Click cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Should exit edit mode
      expect(screen.queryByPlaceholderText('Wallet label...')).not.toBeInTheDocument();
    });

    it('should exit edit mode when Escape key is pressed', async () => {
      const user = userEvent.setup();
      
      render(
        <WalletLabelEditor address={mockAddress} />,
        { wrapper }
      );

      // Enter edit mode
      await user.click(screen.getByText('Add Label'));

      // Press Escape
      const input = screen.getByPlaceholderText('Wallet label...');
      fireEvent.keyDown(input, { key: 'Escape' });

      // Should exit edit mode
      expect(screen.queryByPlaceholderText('Wallet label...')).not.toBeInTheDocument();
    });

    it('should restore original label when canceling', async () => {
      const user = userEvent.setup();
      
      render(
        <WalletLabelEditor address={mockAddress} currentLabel="My Wallet" />,
        { wrapper }
      );

      // Enter edit mode
      await user.click(screen.getByText('Edit Label'));

      // Change label
      const input = screen.getByDisplayValue('My Wallet');
      await user.clear(input);
      await user.type(input, 'Different Wallet');

      // Cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Enter edit mode again
      await user.click(screen.getByText('Edit Label'));

      // Should show original label
      expect(screen.getByDisplayValue('My Wallet')).toBeInTheDocument();
    });

    it('should call onCancel callback when canceling', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();
      
      render(
        <WalletLabelEditor address={mockAddress} onCancel={onCancel} />,
        { wrapper }
      );

      // Enter edit mode
      await user.click(screen.getByText('Add Label'));

      // Cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onCancel).toHaveBeenCalled();
    });

    it('should not call setLabel when canceling', async () => {
      const user = userEvent.setup();
      
      render(
        <WalletLabelEditor address={mockAddress} />,
        { wrapper }
      );

      // Enter edit mode
      await user.click(screen.getByText('Add Label'));

      // Type label
      const input = screen.getByPlaceholderText('Wallet label...');
      await user.type(input, 'New Wallet');

      // Cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockSetLabel).not.toHaveBeenCalled();
    });
  });

  describe('Loading state', () => {
    it('should disable input when saving', () => {
      (useWalletLabels as any).mockReturnValue({
        setLabel: mockSetLabel,
        removeLabel: mockRemoveLabel,
        isSettingLabel: true,
        isRemovingLabel: false,
      });

      render(
        <WalletLabelEditor address={mockAddress} />,
        { wrapper }
      );

      // Manually enter edit mode by clicking button first
      const button = screen.getByText('Add Label');
      fireEvent.click(button);

      const input = screen.getByPlaceholderText('Wallet label...');
      expect(input).toBeDisabled();
    });

    it('should disable buttons when saving', () => {
      (useWalletLabels as any).mockReturnValue({
        setLabel: mockSetLabel,
        removeLabel: mockRemoveLabel,
        isSettingLabel: true,
        isRemovingLabel: false,
      });

      render(
        <WalletLabelEditor address={mockAddress} />,
        { wrapper }
      );

      // Manually enter edit mode
      const button = screen.getByText('Add Label');
      fireEvent.click(button);

      const saveButton = screen.getByRole('button', { name: /save label/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      expect(saveButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels on all buttons', async () => {
      const user = userEvent.setup();
      
      render(
        <WalletLabelEditor address={mockAddress} />,
        { wrapper }
      );

      // Check edit button
      expect(screen.getByRole('button', { name: /add label for wallet/i })).toBeInTheDocument();

      // Enter edit mode
      await user.click(screen.getByText('Add Label'));

      // Check save and cancel buttons
      expect(screen.getByRole('button', { name: /save label/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should have proper aria-label on input', async () => {
      const user = userEvent.setup();
      
      render(
        <WalletLabelEditor address={mockAddress} />,
        { wrapper }
      );

      // Enter edit mode
      await user.click(screen.getByText('Add Label'));

      const input = screen.getByLabelText('Wallet label');
      expect(input).toBeInTheDocument();
    });

    it('should stop event propagation on click', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      
      render(
        <div onClick={onClick}>
          <WalletLabelEditor address={mockAddress} />
        </div>,
        { wrapper }
      );

      // Enter edit mode
      await user.click(screen.getByText('Add Label'));

      // Click inside editor
      const input = screen.getByPlaceholderText('Wallet label...');
      await user.click(input);

      // Parent onClick should not be called
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Input validation', () => {
    it('should limit input to 50 characters', async () => {
      const user = userEvent.setup();
      
      render(
        <WalletLabelEditor address={mockAddress} />,
        { wrapper }
      );

      // Enter edit mode
      await user.click(screen.getByText('Add Label'));

      const input = screen.getByPlaceholderText('Wallet label...') as HTMLInputElement;
      expect(input).toHaveAttribute('maxLength', '50');
    });
  });
});

