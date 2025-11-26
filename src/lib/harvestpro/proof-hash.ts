/**
 * HarvestPro Proof Hash Generation
 * Generates cryptographic proof hashes for harvest sessions
 * 
 * Requirements: 16.5
 */

import crypto from 'crypto';
import type { ProofOfHarvest } from '@/types/harvestpro';

/**
 * Generate a deterministic SHA-256 hash for proof of harvest
 * 
 * Property 16: Hash Function Determinism
 * For any harvest session data, generating the proof hash twice with identical input
 * SHALL produce identical hash values.
 * 
 * Requirement 16.5: Use a cryptographic hash function that produces identical output for identical input
 */
export function generateProofHash(data: ProofOfHarvest): string {
  // Create deterministic string representation by sorting keys
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  
  // Generate SHA-256 hash
  return crypto
    .createHash('sha256')
    .update(canonical)
    .digest('hex');
}

/**
 * Verify a proof hash against the original data
 */
export function verifyProofHash(data: ProofOfHarvest, hash: string): boolean {
  const computed = generateProofHash(data);
  return computed === hash;
}
