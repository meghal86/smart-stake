/**
 * AddWalletModal Component Tests
 * 
 * Tests for user-friendly error messages in the wallet addition flow
 */

import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddWalletModal } from '../AddWalletModal'
import { ERROR_MESSAGES } from '@/lib/constants/errorMessages'

// Mock dependencies
vi.mock('@/hooks/useWalletRegistry', () => ({
  useWalletRegistry: () => ({
    addWallet: vi.fn(),
    isAdding: false,
    isConnected: false,
  }),
}))

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    actualTheme: 'dark',
  }),
}))

vi.mock('wagmi', () => ({
  useDisconnect: () => ({
    disconnect: vi.fn(),
  }),
}))

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({ children }: any) => children({ openConnectModal: vi.fn() }),
  },
}))

describe('AddWalletModal - Error Messages', () => {
  test('displays user-friendly error for private key pattern', async () => {
    const user = userEvent.setup()
    render(<AddWalletModal isOpen={true} onClose={vi.fn()} />)

    // Navigate to manual entry mode
    const manualButton = screen.getByText('Enter Address Manually')
    await user.click(manualButton)

    // Enter a private key pattern
    const addressInput = screen.getByPlaceholderText('0x... or vitalik.eth')
    await user.type(addressInput, '0x' + 'a'.repeat(64))

    // Submit
    const addButton = screen.getByText('Add Wallet')
    await user.click(addButton)

    // Check for user-friendly error message
    await waitFor(() => {
      expect(screen.getByText(ERROR_MESSAGES.PRIVATE_KEY_DETECTED)).toBeInTheDocument()
    })
  })

  test('displays user-friendly error for seed phrase pattern', async () => {
    const user = userEvent.setup()
    render(<AddWalletModal isOpen={true} onClose={vi.fn()} />)

    // Navigate to manual entry mode
    const manualButton = screen.getByText('Enter Address Manually')
    await user.click(manualButton)

    // Enter a seed phrase pattern (12+ words)
    const addressInput = screen.getByPlaceholderText('0x... or vitalik.eth')
    const seedPhrase = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12'
    await user.type(addressInput, seedPhrase)

    // Submit
    const addButton = screen.getByText('Add Wallet')
    await user.click(addButton)

    // Check for user-friendly error message
    await waitFor(() => {
      expect(screen.getByText(ERROR_MESSAGES.SEED_PHRASE_DETECTED)).toBeInTheDocument()
    })
  })

  test('displays user-friendly error for invalid address format', async () => {
    const user = userEvent.setup()
    render(<AddWalletModal isOpen={true} onClose={vi.fn()} />)

    // Navigate to manual entry mode
    const manualButton = screen.getByText('Enter Address Manually')
    await user.click(manualButton)

    // Enter an invalid address
    const addressInput = screen.getByPlaceholderText('0x... or vitalik.eth')
    await user.type(addressInput, 'invalid-address')

    // Submit
    const addButton = screen.getByText('Add Wallet')
    await user.click(addButton)

    // Check for user-friendly error message
    await waitFor(() => {
      expect(screen.getByText(ERROR_MESSAGES.INVALID_ADDRESS)).toBeInTheDocument()
    })
  })

  test('error message is cleared when user modifies input', async () => {
    const user = userEvent.setup()
    render(<AddWalletModal isOpen={true} onClose={vi.fn()} />)

    // Navigate to manual entry mode
    const manualButton = screen.getByText('Enter Address Manually')
    await user.click(manualButton)

    // Enter an invalid address
    const addressInput = screen.getByPlaceholderText('0x... or vitalik.eth')
    await user.type(addressInput, 'invalid')

    // Submit to trigger error
    const addButton = screen.getByText('Add Wallet')
    await user.click(addButton)

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(ERROR_MESSAGES.INVALID_ADDRESS)).toBeInTheDocument()
    })

    // Clear input and type new value
    await user.clear(addressInput)
    await user.type(addressInput, '0x')

    // Error should be cleared
    expect(screen.queryByText(ERROR_MESSAGES.INVALID_ADDRESS)).not.toBeInTheDocument()
  })

  test('error message displays with alert icon', async () => {
    const user = userEvent.setup()
    render(<AddWalletModal isOpen={true} onClose={vi.fn()} />)

    // Navigate to manual entry mode
    const manualButton = screen.getByText('Enter Address Manually')
    await user.click(manualButton)

    // Enter an invalid address
    const addressInput = screen.getByPlaceholderText('0x... or vitalik.eth')
    await user.type(addressInput, 'invalid')

    // Submit
    const addButton = screen.getByText('Add Wallet')
    await user.click(addButton)

    // Check for error container with proper styling
    await waitFor(() => {
      const errorContainer = screen.getByText(ERROR_MESSAGES.INVALID_ADDRESS).closest('div')
      expect(errorContainer).toHaveClass('p-4', 'rounded-lg', 'border', 'flex', 'gap-3')
    })
  })

  test('displays helper text for address input', async () => {
    const user = userEvent.setup()
    render(<AddWalletModal isOpen={true} onClose={vi.fn()} />)

    // Navigate to manual entry mode
    const manualButton = screen.getByText('Enter Address Manually')
    await user.click(manualButton)

    // Check for helper text
    expect(screen.getByText(/Enter a 42-character Ethereum address/)).toBeInTheDocument()
  })

  test('modal closes and resets error state on cancel', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<AddWalletModal isOpen={true} onClose={onClose} />)

    // Navigate to manual entry mode
    const manualButton = screen.getByText('Enter Address Manually')
    await user.click(manualButton)

    // Enter an invalid address
    const addressInput = screen.getByPlaceholderText('0x... or vitalik.eth')
    await user.type(addressInput, 'invalid')

    // Submit to trigger error
    const addButton = screen.getByText('Add Wallet')
    await user.click(addButton)

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText(ERROR_MESSAGES.INVALID_ADDRESS)).toBeInTheDocument()
    })

    // Click cancel
    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    // Should go back to choose mode
    expect(screen.getByText('Add Wallet')).toBeInTheDocument()
    expect(screen.queryByText(ERROR_MESSAGES.INVALID_ADDRESS)).not.toBeInTheDocument()
  })
})
