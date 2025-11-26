/**
 * Property-Based Tests for Proof Hash Generation
 * 
 * Feature: harvestpro, Property 16: Hash Function Determinism
 * Validates: Requirements 16.5
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generateProofHash, verifyProofHash } from '../proof-hash';
import type { ProofOfHarvest, HarvestedLot } from '@/types/harvestpro';

// Arbitrary for valid dates (use timestamps to avoid invalid dates)
const validDateArbitrary = fc.integer({ 
  min: new Date('2020-01-01').getTime(), 
  max: new Date('2030-12-31').getTime() 
}).map(timestamp => new Date(timestamp));

// Arbitrary for HarvestedLot
const harvestedLotArbitrary = fc.record({
  token: fc.string({ minLength: 1, maxLength: 10 }),
  dateAcquired: validDateArbitrary,
  dateSold: validDateArbitrary,
  quantity: fc.double({ min: 0.00000001, max: 1000000, noNaN: true }),
  costBasis: fc.double({ min: 0, max: 1000000, noNaN: true }),
  proceeds: fc.double({ min: 0, max: 1000000, noNaN: true }),
  gainLoss: fc.double({ min: -1000000, max: 0, noNaN: true }), // Losses are negative
});

// Arbitrary for ProofOfHarvest
const proofOfHarvestArbitrary = fc.record({
  sessionId: fc.uuid(),
  userId: fc.uuid(),
  executedAt: validDateArbitrary.map(d => d.toISOString()),
  lots: fc.array(harvestedLotArbitrary, { minLength: 1, maxLength: 10 }),
  totalLoss: fc.double({ min: -1000000, max: 0, noNaN: true }),
  netBenefit: fc.double({ min: 0, max: 100000, noNaN: true }),
  proofHash: fc.constant(''), // Will be generated
});

describe('Proof Hash Generation - Property-Based Tests', () => {
  /**
   * Property 16: Hash Function Determinism
   * For any harvest session data, generating the proof hash twice with identical input
   * SHALL produce identical hash values.
   */
  it('Property 16: generates identical hashes for identical input', () => {
    fc.assert(
      fc.property(proofOfHarvestArbitrary, (proofData) => {
        // Generate hash twice with the same input
        const hash1 = generateProofHash(proofData);
        const hash2 = generateProofHash(proofData);
        
        // Hashes must be identical
        expect(hash1).toBe(hash2);
        
        // Hash should be a valid SHA-256 hex string (64 characters)
        expect(hash1).toMatch(/^[a-f0-9]{64}$/);
        
        return hash1 === hash2;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Different inputs produce different hashes
   * For any two different proof data objects, the hashes should be different
   */
  it('generates different hashes for different inputs', () => {
    fc.assert(
      fc.property(
        proofOfHarvestArbitrary,
        proofOfHarvestArbitrary,
        (proof1, proof2) => {
          // Skip if the proofs are identical
          if (JSON.stringify(proof1) === JSON.stringify(proof2)) {
            return true;
          }
          
          const hash1 = generateProofHash(proof1);
          const hash2 = generateProofHash(proof2);
          
          // Different inputs should produce different hashes
          return hash1 !== hash2;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Hash verification works correctly
   * For any proof data, verifying the generated hash should return true
   */
  it('verifies generated hashes correctly', () => {
    fc.assert(
      fc.property(proofOfHarvestArbitrary, (proofData) => {
        const hash = generateProofHash(proofData);
        const isValid = verifyProofHash(proofData, hash);
        
        expect(isValid).toBe(true);
        
        return isValid;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Hash verification rejects incorrect hashes
   * For any proof data and a different hash, verification should return false
   */
  it('rejects incorrect hashes', () => {
    // Generate a 64-character hex string using hexa (0-9a-f)
    const hexCharArbitrary = fc.constantFrom(
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
      'a', 'b', 'c', 'd', 'e', 'f'
    );
    const hexStringArbitrary = fc.array(hexCharArbitrary, { 
      minLength: 64, 
      maxLength: 64 
    }).map(arr => arr.join(''));
    
    fc.assert(
      fc.property(
        proofOfHarvestArbitrary,
        hexStringArbitrary,
        (proofData, wrongHash) => {
          const correctHash = generateProofHash(proofData);
          
          // Skip if the random hash happens to be correct
          if (wrongHash === correctHash) {
            return true;
          }
          
          const isValid = verifyProofHash(proofData, wrongHash);
          
          expect(isValid).toBe(false);
          
          return !isValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Order independence of object keys
   * The hash should be the same regardless of the order of keys in the object
   */
  it('produces same hash regardless of key order', () => {
    fc.assert(
      fc.property(proofOfHarvestArbitrary, (proofData) => {
        // Create a copy with keys in different order
        const reordered: ProofOfHarvest = {
          proofHash: proofData.proofHash,
          netBenefit: proofData.netBenefit,
          totalLoss: proofData.totalLoss,
          lots: proofData.lots,
          executedAt: proofData.executedAt,
          userId: proofData.userId,
          sessionId: proofData.sessionId,
        };
        
        const hash1 = generateProofHash(proofData);
        const hash2 = generateProofHash(reordered);
        
        expect(hash1).toBe(hash2);
        
        return hash1 === hash2;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Small changes produce different hashes (avalanche effect)
   * Changing even a single character should produce a completely different hash
   */
  it('produces different hash for small changes in data', () => {
    fc.assert(
      fc.property(proofOfHarvestArbitrary, (proofData) => {
        const originalHash = generateProofHash(proofData);
        
        // Make a small change: increment totalLoss by 0.01
        const modifiedData = {
          ...proofData,
          totalLoss: proofData.totalLoss + 0.01,
        };
        
        const modifiedHash = generateProofHash(modifiedData);
        
        // Hashes should be completely different
        expect(originalHash).not.toBe(modifiedHash);
        
        return originalHash !== modifiedHash;
      }),
      { numRuns: 100 }
    );
  });
});
