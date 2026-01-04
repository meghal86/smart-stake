/**
 * Tests for wallet validation utilities
 * 
 * These tests verify that wallet input validation correctly:
 * - Rejects private key patterns
 * - Rejects seed phrase patterns
 * - Accepts valid Ethereum addresses
 * - Accepts valid ENS names
 * - Validates CAIP-2 chain namespaces
 */

import { describe, test, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  validateChainNamespace,
  isPrivateKeyPattern,
  isSeedPhrasePattern,
  isValidEthereumAddress,
  isENSName,
  normalizeAddress,
  validateWalletInput,
  isSupportedNetwork,
  getNetworkName,
  SUPPORTED_NETWORKS,
} from '../wallet-validation'

describe('Wallet Validation', () => {
  describe('validateChainNamespace', () => {
    test('accepts valid CAIP-2 format', () => {
      expect(validateChainNamespace('eip155:1')).toBe(true)
      expect(validateChainNamespace('eip155:137')).toBe(true)
      expect(validateChainNamespace('eip155:42161')).toBe(true)
      expect(validateChainNamespace('eip155:10')).toBe(true)
      expect(validateChainNamespace('eip155:8453')).toBe(true)
    })

    test('rejects invalid CAIP-2 format', () => {
      expect(validateChainNamespace('ethereum')).toBe(false)
      expect(validateChainNamespace('eip155')).toBe(false)
      expect(validateChainNamespace('eip155:')).toBe(false)
      expect(validateChainNamespace('eip155:abc')).toBe(false)
      expect(validateChainNamespace('polygon')).toBe(false)
      expect(validateChainNamespace('')).toBe(false)
    })

    // Property test: CAIP-2 format consistency
    test('Property 1: CAIP-2 format consistency - all valid namespaces follow eip155:chainId pattern', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constantFrom('eip155:1', 'eip155:137', 'eip155:42161', 'eip155:10', 'eip155:8453'),
            fc.tuple(fc.constant('eip155:'), fc.integer({ min: 1, max: 999999 })).map(
              ([prefix, chainId]) => `${prefix}${chainId}`
            )
          ),
          (namespace) => {
            const result = validateChainNamespace(namespace)
            expect(result).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('isPrivateKeyPattern', () => {
    test('detects private key patterns (64 hex chars)', () => {
      // Valid private key patterns
      expect(isPrivateKeyPattern('0x' + 'a'.repeat(64))).toBe(true)
      expect(isPrivateKeyPattern('0x' + 'f'.repeat(64))).toBe(true)
      expect(isPrivateKeyPattern('0x' + '0'.repeat(64))).toBe(true)
      expect(isPrivateKeyPattern('a'.repeat(64))).toBe(true)
      expect(isPrivateKeyPattern('f'.repeat(64))).toBe(true)
    })

    test('rejects non-private-key patterns', () => {
      expect(isPrivateKeyPattern('0x' + 'a'.repeat(63))).toBe(false) // 63 chars
      expect(isPrivateKeyPattern('0x' + 'a'.repeat(65))).toBe(false) // 65 chars
      expect(isPrivateKeyPattern('0x1234567890123456789012345678901234567890')).toBe(false) // address
      expect(isPrivateKeyPattern('not a key')).toBe(false)
      expect(isPrivateKeyPattern('')).toBe(false)
    })

    // Property test: Private key detection
    test('Property 8: Input validation security - private key patterns are always detected', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.boolean(),
            fc.string({ minLength: 64, maxLength: 64 }).map(s => 
              s.split('').map(() => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')
            )
          ),
          ([hasPrefix, hexString]) => {
            const input = hasPrefix ? '0x' + hexString : hexString
            const result = isPrivateKeyPattern(input)
            expect(result).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('isSeedPhrasePattern', () => {
    test('detects seed phrase patterns (12+ words)', () => {
      const seedPhrase12 = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12'
      const seedPhrase24 = seedPhrase12 + ' word13 word14 word15 word16 word17 word18 word19 word20 word21 word22 word23 word24'

      expect(isSeedPhrasePattern(seedPhrase12)).toBe(true)
      expect(isSeedPhrasePattern(seedPhrase24)).toBe(true)
    })

    test('rejects non-seed-phrase patterns', () => {
      expect(isSeedPhrasePattern('word1 word2 word3')).toBe(false) // 3 words
      expect(isSeedPhrasePattern('word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11')).toBe(false) // 11 words
      expect(isSeedPhrasePattern('0x1234567890123456789012345678901234567890')).toBe(false)
      expect(isSeedPhrasePattern('')).toBe(false)
    })

    // Property test: Seed phrase detection
    test('Property 8: Input validation security - seed phrase patterns (12+ words) are always detected', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), {
            minLength: 12,
            maxLength: 24,
          }),
          (words) => {
            const seedPhrase = words.join(' ')
            const result = isSeedPhrasePattern(seedPhrase)
            expect(result).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('isValidEthereumAddress', () => {
    test('accepts valid Ethereum addresses', () => {
      expect(isValidEthereumAddress('0x1234567890123456789012345678901234567890')).toBe(true)
      expect(isValidEthereumAddress('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')).toBe(true)
      expect(isValidEthereumAddress('0x0000000000000000000000000000000000000000')).toBe(true)
      expect(isValidEthereumAddress('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')).toBe(true)
    })

    test('rejects invalid Ethereum addresses', () => {
      expect(isValidEthereumAddress('1234567890123456789012345678901234567890')).toBe(false) // no 0x
      expect(isValidEthereumAddress('0x123456789012345678901234567890123456789')).toBe(false) // 39 chars
      expect(isValidEthereumAddress('0x12345678901234567890123456789012345678901')).toBe(false) // 41 chars
      expect(isValidEthereumAddress('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG')).toBe(false) // invalid hex
      expect(isValidEthereumAddress('vitalik.eth')).toBe(false)
      expect(isValidEthereumAddress('')).toBe(false)
    })
  })

  describe('isENSName', () => {
    test('detects ENS names', () => {
      expect(isENSName('vitalik.eth')).toBe(true)
      expect(isENSName('alice.eth')).toBe(true)
      expect(isENSName('a.eth')).toBe(true)
      expect(isENSName('test123.eth')).toBe(true)
    })

    test('rejects non-ENS names', () => {
      expect(isENSName('vitalik')).toBe(false)
      expect(isENSName('vitalik.com')).toBe(false)
      expect(isENSName('0x1234567890123456789012345678901234567890')).toBe(false)
      expect(isENSName('.eth')).toBe(false)
      expect(isENSName('')).toBe(false)
    })
  })

  describe('normalizeAddress', () => {
    test('converts addresses to lowercase', () => {
      expect(normalizeAddress('0x1234567890123456789012345678901234567890')).toBe(
        '0x1234567890123456789012345678901234567890'
      )
      expect(normalizeAddress('0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD')).toBe(
        '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
      )
      expect(normalizeAddress('0xAbCdEfAbCdEfAbCdEfAbCdEfAbCdEfAbCdEfAbCd')).toBe(
        '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
      )
    })

    // Property test: Address normalization
    test('Property 2: Wallet registry source of truth - address normalization is consistent', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 40, maxLength: 40 }).map(s => 
            s.split('').map(() => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')
          ),
          (hexString) => {
            const address = '0x' + hexString
            const normalized = normalizeAddress(address)
            // Normalizing twice should give same result (idempotent)
            expect(normalizeAddress(normalized)).toBe(normalized)
            // Result should be lowercase
            expect(normalized).toBe(normalized.toLowerCase())
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('validateWalletInput', () => {
    test('accepts valid Ethereum addresses', () => {
      const result = validateWalletInput('0x1234567890123456789012345678901234567890')
      expect(result.valid).toBe(true)
      expect(result.type).toBe('address')
      expect(result.error).toBeUndefined()
    })

    test('accepts valid ENS names', () => {
      const result = validateWalletInput('vitalik.eth')
      expect(result.valid).toBe(true)
      expect(result.type).toBe('ens')
      expect(result.error).toBeUndefined()
    })

    test('rejects private key patterns', () => {
      const result = validateWalletInput('0x' + 'a'.repeat(64))
      expect(result.valid).toBe(false)
      expect(result.error?.code).toBe('PRIVATE_KEY_DETECTED')
    })

    test('rejects seed phrase patterns', () => {
      const seedPhrase = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12'
      const result = validateWalletInput(seedPhrase)
      expect(result.valid).toBe(false)
      expect(result.error?.code).toBe('SEED_PHRASE_DETECTED')
    })

    test('rejects invalid addresses', () => {
      const result = validateWalletInput('0x123')
      expect(result.valid).toBe(false)
      expect(result.error?.code).toBe('INVALID_ADDRESS')
    })

    // Property test: Input validation security
    test('Property 8: Input validation security - all invalid inputs are rejected', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Private key patterns
            fc.tuple(
              fc.boolean(),
              fc.string({ minLength: 64, maxLength: 64 }).map(s => 
                s.split('').map(() => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')
              )
            ).map(([hasPrefix, hex]) => (hasPrefix ? '0x' + hex : hex)),
            // Seed phrases
            fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 12, maxLength: 24 }).map(
              (words) => words.join(' ')
            ),
            // Invalid addresses
            fc.string({ minLength: 1, maxLength: 100 }).filter(
              (s) =>
                !s.match(/^0x[a-fA-F0-9]{40}$/) &&
                !(s.endsWith('.eth') && s.length > 4) &&
                !s.match(/^(0x)?[a-fA-F0-9]{64}$/) &&
                s.split(/\s+/).length < 12
            ),
          ),
          (input) => {
            const result = validateWalletInput(input)
            expect(result.valid).toBe(false)
            expect(result.error).toBeDefined()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('isSupportedNetwork', () => {
    test('accepts supported networks', () => {
      expect(isSupportedNetwork('eip155:1')).toBe(true)
      expect(isSupportedNetwork('eip155:137')).toBe(true)
      expect(isSupportedNetwork('eip155:42161')).toBe(true)
      expect(isSupportedNetwork('eip155:10')).toBe(true)
      expect(isSupportedNetwork('eip155:8453')).toBe(true)
    })

    test('rejects unsupported networks', () => {
      expect(isSupportedNetwork('eip155:999')).toBe(false)
      expect(isSupportedNetwork('ethereum')).toBe(false)
      expect(isSupportedNetwork('')).toBe(false)
    })
  })

  describe('getNetworkName', () => {
    test('returns network names for supported networks', () => {
      expect(getNetworkName('eip155:1')).toBe('Ethereum Mainnet')
      expect(getNetworkName('eip155:137')).toBe('Polygon')
      expect(getNetworkName('eip155:42161')).toBe('Arbitrum One')
      expect(getNetworkName('eip155:10')).toBe('Optimism')
      expect(getNetworkName('eip155:8453')).toBe('Base')
    })

    test('returns null for unsupported networks', () => {
      expect(getNetworkName('eip155:999')).toBeNull()
      expect(getNetworkName('ethereum')).toBeNull()
      expect(getNetworkName('')).toBeNull()
    })
  })

  describe('SUPPORTED_NETWORKS constant', () => {
    test('contains all required networks', () => {
      expect(SUPPORTED_NETWORKS['eip155:1']).toBeDefined()
      expect(SUPPORTED_NETWORKS['eip155:137']).toBeDefined()
      expect(SUPPORTED_NETWORKS['eip155:42161']).toBeDefined()
      expect(SUPPORTED_NETWORKS['eip155:10']).toBeDefined()
      expect(SUPPORTED_NETWORKS['eip155:8453']).toBeDefined()
    })

    test('has correct chain IDs', () => {
      expect(SUPPORTED_NETWORKS['eip155:1'].chainId).toBe(1)
      expect(SUPPORTED_NETWORKS['eip155:137'].chainId).toBe(137)
      expect(SUPPORTED_NETWORKS['eip155:42161'].chainId).toBe(42161)
      expect(SUPPORTED_NETWORKS['eip155:10'].chainId).toBe(10)
      expect(SUPPORTED_NETWORKS['eip155:8453'].chainId).toBe(8453)
    })
  })
})
