/**
 * Unit Test: WalletPill Mismatch Indicator
 * 
 * Validates: Requirements 2.1.3, 2.1.4
 * 
 * Tests that the mismatch indicator correctly displays when the signer
 * is on a different network than the active wallet.
 */

import { describe, test, expect } from 'vitest'
import { buildWalletPillModel, chainIdToCaip2 } from '@/lib/header'

describe('WalletPill Mismatch Indicator', () => {
  test('shows mismatch indicator when active is Arbitrum and signer is Ethereum', () => {
    const model = buildWalletPillModel({
      sessionState: 'S3_BOTH',
      enableWalletSelector: true,
      activeWalletFromRegistry: {
        address: '0x1234567890123456789012345678901234567890',
        network: 'eip155:42161', // Arbitrum
        chainName: 'Arbitrum',
        chainIconKey: 'arb',
      },
      signerAddress: '0x1234567890123456789012345678901234567890', // Same address
      signerChainId: 1, // Ethereum
    })

    expect(model).not.toBeNull()
    if (!model) return

    // Should show mismatch indicator
    expect(model.showMismatchIndicator).toBe(true)

    // Should indicate signer is on different chain
    expect(model.signerNetwork).toBe(1)
    expect(model.activeNetwork).toBe('eip155:42161')

    // Can sign for active (same address) but on wrong chain
    expect(model.canSignForActive).toBe(true)
  })

  test('does not show mismatch indicator when chains match', () => {
    const model = buildWalletPillModel({
      sessionState: 'S3_BOTH',
      enableWalletSelector: true,
      activeWalletFromRegistry: {
        address: '0x1234567890123456789012345678901234567890',
        network: 'eip155:1', // Ethereum
        chainName: 'Ethereum',
        chainIconKey: 'eth',
      },
      signerAddress: '0x1234567890123456789012345678901234567890',
      signerChainId: 1, // Ethereum
    })

    expect(model).not.toBeNull()
    if (!model) return

    // Should NOT show mismatch indicator
    expect(model.showMismatchIndicator).toBe(false)

    // Both on same chain
    expect(model.signerNetwork).toBe(1)
    expect(model.activeNetwork).toBe('eip155:1')

    // Can sign for active
    expect(model.canSignForActive).toBe(true)
  })

  test('shows mismatch indicator for Polygon active and Base signer', () => {
    const model = buildWalletPillModel({
      sessionState: 'S3_BOTH',
      enableWalletSelector: false,
      activeWalletFromRegistry: {
        address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        network: 'eip155:137', // Polygon
        chainName: 'Polygon',
        chainIconKey: 'matic',
      },
      signerAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      signerChainId: 8453, // Base
    })

    expect(model).not.toBeNull()
    if (!model) return

    // Should show mismatch indicator
    expect(model.showMismatchIndicator).toBe(true)

    // Different chains
    expect(model.signerNetwork).toBe(8453)
    expect(model.activeNetwork).toBe('eip155:137')

    // Can sign for active (same address)
    expect(model.canSignForActive).toBe(true)
  })

  test('does not show mismatch indicator in S2 state (signer = active)', () => {
    const model = buildWalletPillModel({
      sessionState: 'S2_WALLET',
      enableWalletSelector: false,
      signerAddress: '0x1234567890123456789012345678901234567890',
      signerChainId: 1,
    })

    expect(model).not.toBeNull()
    if (!model) return

    // Should NOT show mismatch indicator in S2 (signer = active)
    expect(model.showMismatchIndicator).toBe(false)

    // Active is signer in S2
    expect(model.activeNetwork).toBe(chainIdToCaip2(1))
    expect(model.canSignForActive).toBe(true)
  })

  test('shows mismatch indicator when signer address differs from active', () => {
    const model = buildWalletPillModel({
      sessionState: 'S3_BOTH',
      enableWalletSelector: true,
      activeWalletFromRegistry: {
        address: '0x1111111111111111111111111111111111111111',
        network: 'eip155:1', // Ethereum
        chainName: 'Ethereum',
        chainIconKey: 'eth',
      },
      signerAddress: '0x2222222222222222222222222222222222222222', // Different address
      signerChainId: 42161, // Arbitrum
    })

    expect(model).not.toBeNull()
    if (!model) return

    // Should show mismatch indicator (different chain)
    expect(model.showMismatchIndicator).toBe(true)

    // Cannot sign for active (different address)
    expect(model.canSignForActive).toBe(false)

    // Signer info should be shown
    expect(model.signerAddressShort).toBeDefined()
    expect(model.signerAddressChecksum).toBe('0x2222222222222222222222222222222222222222')
  })

  test('does not show mismatch when no signer connected', () => {
    const model = buildWalletPillModel({
      sessionState: 'S3_BOTH',
      enableWalletSelector: true,
      activeWalletFromRegistry: {
        address: '0x1234567890123456789012345678901234567890',
        network: 'eip155:1',
        chainName: 'Ethereum',
      },
      // No signer
    })

    expect(model).not.toBeNull()
    if (!model) return

    // Should NOT show mismatch indicator (no signer to mismatch)
    expect(model.showMismatchIndicator).toBe(false)

    // Cannot sign for active (no signer)
    expect(model.canSignForActive).toBe(false)
  })

  test('mismatch indicator text format', () => {
    // This test verifies the expected format for the mismatch indicator text
    // The actual text is built in the WalletPill component, but we verify
    // the model provides the necessary data

    const model = buildWalletPillModel({
      sessionState: 'S3_BOTH',
      enableWalletSelector: true,
      activeWalletFromRegistry: {
        address: '0x1234567890123456789012345678901234567890',
        network: 'eip155:42161', // Arbitrum
        chainName: 'Arbitrum',
      },
      signerAddress: '0x1234567890123456789012345678901234567890',
      signerChainId: 1, // Ethereum
    })

    expect(model).not.toBeNull()
    if (!model) return

    // Model should provide all data needed for:
    // "Viewing Arbitrum • Signer on Ethereum"
    expect(model.showMismatchIndicator).toBe(true)
    expect(model.activeChainName).toBe('Arbitrum')
    expect(model.signerNetwork).toBe(1)

    // The component would format this as:
    // `Viewing ${activeChainName} • Signer on ${getChainName(signerNetwork)}`
    // = "Viewing Arbitrum • Signer on Ethereum"
  })
})
