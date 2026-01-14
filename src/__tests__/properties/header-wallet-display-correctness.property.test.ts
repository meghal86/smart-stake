/**
 * Property Test: Wallet Display Correctness
 * 
 * Feature: unified-header-system, Property 7: Wallet Display Correctness
 * Validates: Requirements 2.6, 2.7, 2.8, 2.9, 2.10, 2.1.2, 2.1.7
 * 
 * This property test verifies that the WalletPill displays the correct
 * truncated address, chain icon, and interactivity state based on the
 * session state and page context.
 * 
 * Key properties:
 * 1. In S2_WALLET, active wallet = signer wallet (fallback)
 * 2. In S3_BOTH, active wallet comes from registry
 * 3. isInteractive only when S3 + enableWalletSelector
 * 4. showMismatchIndicator when signerNetwork !== activeNetwork
 * 5. Copy defaults to activeAddressChecksum
 * 6. isSavedToRegistry = false in S2, true in S3
 */

import { describe, test, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  buildWalletPillModel,
  caip2ToChainId,
  chainIdToCaip2,
  type SessionState,
} from '@/lib/header'

// Generator for Ethereum addresses (40 hex characters)
const addressGenerator = fc
  .array(fc.integer({ min: 0, max: 15 }), { minLength: 40, maxLength: 40 })
  .map(arr => `0x${arr.map(n => n.toString(16)).join('')}`)

describe('Feature: unified-header-system, Property 7: Wallet Display Correctness', () => {
  test('S2_WALLET uses signer as active wallet with correct fallback properties', () => {
    fc.assert(
      fc.property(
        // Generate valid Ethereum addresses
        addressGenerator,
        // Generate valid chain IDs
        fc.constantFrom(1, 10, 56, 137, 8453, 42161, 43114),
        (signerAddress, signerChainId) => {
          const model = buildWalletPillModel({
            sessionState: 'S2_WALLET',
            enableWalletSelector: false,
            signerAddress,
            signerChainId,
          })

          // Property 1: Model should exist in S2 with signer
          expect(model).not.toBeNull()
          if (!model) return

          // Property 2: Active wallet should be signer wallet
          expect(model.activeAddressChecksum).toBe(signerAddress)
          expect(model.activeAddressShort).toMatch(/^0x[a-fA-F0-9]{4}…[a-fA-F0-9]{4}$/)

          // Property 3: Active network should match signer chain
          expect(model.activeNetwork).toBe(chainIdToCaip2(signerChainId))
          expect(caip2ToChainId(model.activeNetwork)).toBe(signerChainId)

          // Property 4: S2 fallback properties
          expect(model.canSignForActive).toBe(true)
          expect(model.isInteractive).toBe(false)
          expect(model.showMismatchIndicator).toBe(false)
          expect(model.isSavedToRegistry).toBe(false)

          // Property 5: No signer info shown (signer = active)
          expect(model.signerAddressShort).toBeUndefined()
          expect(model.signerAddressChecksum).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  test('S3_BOTH uses registry active wallet with correct properties', () => {
    fc.assert(
      fc.property(
        // Generate registry wallet
        fc.record({
          address: addressGenerator,
          network: fc.constantFrom(1, 10, 56, 137, 8453, 42161, 43114).map(chainIdToCaip2),
          chainName: fc.constantFrom('Ethereum', 'Optimism', 'BNB Chain', 'Polygon', 'Base', 'Arbitrum', 'Avalanche'),
          ensName: fc.option(fc.string({ minLength: 3, maxLength: 20 }).map(s => `${s}.eth`), { nil: undefined }),
        }),
        // Generate signer (may or may not match registry)
        fc.option(
          fc.record({
            address: addressGenerator,
            chainId: fc.constantFrom(1, 10, 56, 137, 8453, 42161, 43114),
          }),
          { nil: undefined }
        ),
        // Generate enableWalletSelector flag
        fc.boolean(),
        (registryWallet, signer, enableWalletSelector) => {
          const model = buildWalletPillModel({
            sessionState: 'S3_BOTH',
            enableWalletSelector,
            activeWalletFromRegistry: registryWallet,
            signerAddress: signer?.address,
            signerChainId: signer?.chainId,
          })

          // Property 1: Model should exist in S3 with registry wallet
          expect(model).not.toBeNull()
          if (!model) return

          // Property 2: Active wallet should be from registry
          expect(model.activeAddressChecksum).toBe(registryWallet.address)
          expect(model.activeAddressShort).toMatch(/^0x[a-fA-F0-9]{4}…[a-fA-F0-9]{4}$/)
          expect(model.activeNetwork).toBe(registryWallet.network)
          expect(model.activeChainName).toBe(registryWallet.chainName)

          // Property 3: ENS name preserved if present
          if (registryWallet.ensName) {
            expect(model.activeEnsName).toBe(registryWallet.ensName)
          }

          // Property 4: isSavedToRegistry always true in S3
          expect(model.isSavedToRegistry).toBe(true)

          // Property 5: isInteractive only when enableWalletSelector
          expect(model.isInteractive).toBe(enableWalletSelector)

          // Property 6: canSignForActive when signer matches active
          if (signer) {
            const signerMatchesActive = signer.address.toLowerCase() === registryWallet.address.toLowerCase()
            expect(model.canSignForActive).toBe(signerMatchesActive)

            // Property 7: Signer info shown only when different from active
            if (!signerMatchesActive) {
              expect(model.signerAddressShort).toBeDefined()
              expect(model.signerAddressChecksum).toBe(signer.address)
            } else {
              expect(model.signerAddressShort).toBeUndefined()
              expect(model.signerAddressChecksum).toBeUndefined()
            }

            // Property 8: Mismatch indicator when chains differ
            const activeChainId = caip2ToChainId(registryWallet.network)
            const chainMismatch = activeChainId !== null && signer.chainId !== activeChainId
            expect(model.showMismatchIndicator).toBe(chainMismatch)
          } else {
            // No signer connected
            expect(model.canSignForActive).toBe(false)
            expect(model.showMismatchIndicator).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  test('address truncation is consistent and reversible', () => {
    fc.assert(
      fc.property(
        addressGenerator,
        fc.constantFrom(1, 10, 56, 137, 8453, 42161, 43114),
        (address, chainId) => {
          const model = buildWalletPillModel({
            sessionState: 'S2_WALLET',
            enableWalletSelector: false,
            signerAddress: address,
            signerChainId: chainId,
          })

          if (!model) return

          // Property: Truncated address preserves first 6 and last 4 chars
          const expectedShort = `${address.slice(0, 6)}…${address.slice(-4)}`
          expect(model.activeAddressShort).toBe(expectedShort)

          // Property: Full address is always available for copy
          expect(model.activeAddressChecksum).toBe(address)
          expect(model.activeAddressChecksum.length).toBe(42) // 0x + 40 hex chars
        }
      ),
      { numRuns: 100 }
    )
  })

  test('CAIP-2 conversion is bidirectional', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(1, 10, 56, 137, 8453, 42161, 43114),
        (chainId) => {
          const caip2 = chainIdToCaip2(chainId)
          const backToChainId = caip2ToChainId(caip2)

          // Property: Round-trip conversion preserves chainId
          expect(backToChainId).toBe(chainId)

          // Property: CAIP-2 format is correct
          expect(caip2).toMatch(/^eip155:\d+$/)
          expect(caip2).toBe(`eip155:${chainId}`)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('mismatch indicator only shows when chains actually differ', () => {
    fc.assert(
      fc.property(
        addressGenerator,
        fc.constantFrom(1, 10, 56, 137, 8453, 42161, 43114),
        fc.constantFrom(1, 10, 56, 137, 8453, 42161, 43114),
        (address, activeChainId, signerChainId) => {
          const model = buildWalletPillModel({
            sessionState: 'S3_BOTH',
            enableWalletSelector: false,
            activeWalletFromRegistry: {
              address,
              network: chainIdToCaip2(activeChainId),
              chainName: 'Test Chain',
            },
            signerAddress: address, // Same address
            signerChainId,
          })

          if (!model) return

          // Property: Mismatch indicator only when chains differ
          const shouldShowMismatch = activeChainId !== signerChainId
          expect(model.showMismatchIndicator).toBe(shouldShowMismatch)

          // Property: canSignForActive true when address matches (regardless of chain)
          expect(model.canSignForActive).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('model returns null for invalid states', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<SessionState>('S0_GUEST', 'S1_ACCOUNT', 'S2_WALLET', 'S3_BOTH'),
        (sessionState) => {
          // Test with no wallet data
          const model = buildWalletPillModel({
            sessionState,
            enableWalletSelector: false,
          })

          // Property: Model should be null when required data is missing
          if (sessionState === 'S2_WALLET' || sessionState === 'S3_BOTH') {
            expect(model).toBeNull()
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  test('interactivity is only enabled on Portfolio in S3', () => {
    fc.assert(
      fc.property(
        addressGenerator,
        fc.constantFrom(1, 10, 56, 137, 8453, 42161, 43114),
        fc.boolean(),
        fc.constantFrom<SessionState>('S2_WALLET', 'S3_BOTH'),
        (address, chainId, enableWalletSelector, sessionState) => {
          const model = buildWalletPillModel({
            sessionState,
            enableWalletSelector,
            activeWalletFromRegistry: sessionState === 'S3_BOTH' ? {
              address,
              network: chainIdToCaip2(chainId),
              chainName: 'Test Chain',
            } : undefined,
            signerAddress: address,
            signerChainId: chainId,
          })

          if (!model) return

          // Property: Interactive only in S3 with enableWalletSelector
          const shouldBeInteractive = sessionState === 'S3_BOTH' && enableWalletSelector
          expect(model.isInteractive).toBe(shouldBeInteractive)

          // Property: Never interactive in S2
          if (sessionState === 'S2_WALLET') {
            expect(model.isInteractive).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
