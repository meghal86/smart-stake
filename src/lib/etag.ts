/**
 * ETag Utilities
 * 
 * Provides ETag generation for HTTP caching support (304 Not Modified)
 * 
 * Requirements:
 * - 1.9: ETag generation for cache validation
 * - 1.10: 304 Not Modified support
 */

import { createHash } from 'crypto';

/**
 * Generate an ETag hash from data
 * 
 * @param data - Data to hash (will be JSON stringified)
 * @returns ETag string (quoted hash)
 */
export function hashETag(data: any): string {
  const json = JSON.stringify(data);
  // Handle undefined which JSON.stringify returns as undefined (not a string)
  const jsonStr = json === undefined ? 'undefined' : json;
  const hash = createHash('sha256').update(jsonStr).digest('hex');
  // ETags should be quoted according to HTTP spec
  return `"${hash.substring(0, 32)}"`;
}

/**
 * Compare ETags for equality
 * 
 * @param etag1 - First ETag
 * @param etag2 - Second ETag
 * @returns Whether ETags match
 */
export function compareETags(etag1: string | null, etag2: string | null): boolean {
  // Handle null/undefined/empty cases
  if (etag1 === null || etag2 === null) return false;
  if (etag1 === undefined || etag2 === undefined) return false;
  
  // Empty strings are considered equal
  if (etag1 === '' && etag2 === '') return true;
  if (etag1 === '' || etag2 === '') return false;
  
  // Remove quotes if present for comparison
  const clean1 = etag1.replace(/^"|"$/g, '');
  const clean2 = etag2.replace(/^"|"$/g, '');
  
  return clean1 === clean2;
}

/**
 * Generate weak ETag (prefixed with W/)
 * Useful for responses that are semantically equivalent but not byte-identical
 * 
 * @param data - Data to hash
 * @returns Weak ETag string
 */
export function hashWeakETag(data: any): string {
  const etag = hashETag(data);
  return `W/${etag}`;
}
