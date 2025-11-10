/**
 * Cursor Pagination Utilities for Hunter Screen Feed
 * 
 * Implements stable, opaque cursor encoding for infinite scroll pagination.
 * Cursor format: [rank_score(desc), trust_score(desc), expires_at(asc), id(asc), snapshot_ts(unix), slug_hash]
 * 
 * The snapshot_ts ensures all pages in a scroll session see a consistent view of the data,
 * preventing duplicates/flicker when trust scores or expiry dates change mid-scroll.
 * 
 * The slug_hash provides a final tiebreaker for items with identical sort values.
 * 
 * Requirements: 3.7, 7.9, 7.10
 */

import crypto from 'crypto';

/**
 * Cursor tuple representing pagination state
 * [rank_score, trust_score, expires_at (ISO8601), id, snapshot_ts (UNIX seconds), slug_hash]
 */
export type CursorTuple = [number, number, string, string, number, number];

/**
 * Hashes a slug to create a numeric tiebreaker
 * Uses first 8 bytes of SHA-256 hash as a 32-bit integer
 * 
 * @param slug - The opportunity slug to hash
 * @returns 32-bit integer hash value
 */
export function hashSlug(slug: string): number {
  const hash = crypto.createHash('sha256').update(slug).digest();
  // Use first 4 bytes as unsigned 32-bit integer
  return hash.readUInt32BE(0);
}

/**
 * Encodes a cursor tuple into a base64url string
 * 
 * @param tuple - The cursor tuple to encode
 * @returns Base64url encoded cursor string
 * 
 * @example
 * const cursor = encodeCursor([95.5, 85, '2025-12-31T23:59:59Z', 'abc-123', 1704067200, 123456789]);
 * // Returns: base64url encoded string
 */
export function encodeCursor(tuple: CursorTuple): string {
  if (!Array.isArray(tuple) || tuple.length !== 6) {
    throw new Error('Cursor tuple must be an array of 6 elements');
  }

  const [rankScore, trustScore, expiresAt, id, snapshotTs, slugHash] = tuple;

  // Validate tuple elements
  if (typeof rankScore !== 'number' || isNaN(rankScore)) {
    throw new Error('Rank score must be a valid number');
  }
  if (typeof trustScore !== 'number' || isNaN(trustScore)) {
    throw new Error('Trust score must be a valid number');
  }
  if (typeof expiresAt !== 'string' || !expiresAt) {
    throw new Error('Expires at must be a non-empty string');
  }
  if (typeof id !== 'string' || !id) {
    throw new Error('ID must be a non-empty string');
  }
  if (typeof snapshotTs !== 'number' || isNaN(snapshotTs) || snapshotTs < 0) {
    throw new Error('Snapshot timestamp must be a valid positive number');
  }
  if (typeof slugHash !== 'number' || isNaN(slugHash)) {
    throw new Error('Slug hash must be a valid number');
  }

  // Encode as JSON then base64url
  const json = JSON.stringify(tuple);
  const base64 = Buffer.from(json, 'utf-8').toString('base64url');
  
  return base64;
}

/**
 * Decodes a base64url cursor string into a cursor tuple
 * 
 * @param cursor - The base64url encoded cursor string
 * @returns Decoded cursor tuple
 * @throws Error if cursor is invalid or malformed
 * 
 * @example
 * const tuple = decodeCursor('encoded-cursor-string');
 * // Returns: [95.5, 85, '2025-12-31T23:59:59Z', 'abc-123', 1704067200, 123456789]
 */
export function decodeCursor(cursor: string): CursorTuple {
  if (!cursor || typeof cursor !== 'string') {
    throw new Error('Cursor must be a non-empty string');
  }

  try {
    // Decode from base64url to JSON
    const json = Buffer.from(cursor, 'base64url').toString('utf-8');
    const parsed = JSON.parse(json);

    // Validate structure
    if (!Array.isArray(parsed) || parsed.length !== 6) {
      throw new Error('Invalid cursor structure');
    }

    const [rankScore, trustScore, expiresAt, id, snapshotTs, slugHash] = parsed;

    // Validate types
    if (typeof rankScore !== 'number' || isNaN(rankScore)) {
      throw new Error('Invalid rank score in cursor');
    }
    if (typeof trustScore !== 'number' || isNaN(trustScore)) {
      throw new Error('Invalid trust score in cursor');
    }
    if (typeof expiresAt !== 'string' || !expiresAt) {
      throw new Error('Invalid expires_at in cursor');
    }
    if (typeof id !== 'string' || !id) {
      throw new Error('Invalid id in cursor');
    }
    if (typeof snapshotTs !== 'number' || isNaN(snapshotTs) || snapshotTs < 0) {
      throw new Error('Invalid snapshot timestamp in cursor');
    }
    if (typeof slugHash !== 'number' || isNaN(slugHash)) {
      throw new Error('Invalid slug hash in cursor');
    }

    return parsed as CursorTuple;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to decode cursor: ${error.message}`);
    }
    throw new Error('Failed to decode cursor: Unknown error');
  }
}

/**
 * Validates if a cursor string is properly formatted
 * 
 * @param cursor - The cursor string to validate
 * @returns true if valid, false otherwise
 */
export function isValidCursor(cursor: string): boolean {
  try {
    decodeCursor(cursor);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a cursor tuple from opportunity data
 * 
 * @param opportunity - Opportunity object with required fields
 * @param snapshotTs - Optional snapshot timestamp (UNIX seconds). If not provided, uses current time.
 * @returns Cursor tuple
 */
export function createCursorFromOpportunity(
  opportunity: {
    rank_score?: number;
    trust_score: number;
    expires_at: string | null;
    id: string;
    slug: string;
  },
  snapshotTs?: number
): CursorTuple {
  // Use rank_score if available, otherwise default to trust_score
  const rankScore = opportunity.rank_score ?? opportunity.trust_score;
  
  // Use expires_at if available, otherwise use far future date for stable sorting
  const expiresAt = opportunity.expires_at ?? '9999-12-31T23:59:59Z';
  
  // Use provided snapshot or current time (in UNIX seconds)
  const snapshot = snapshotTs ?? Math.floor(Date.now() / 1000);
  
  // Hash the slug for final tiebreaker
  const slugHash = hashSlug(opportunity.slug);
  
  return [rankScore, opportunity.trust_score, expiresAt, opportunity.id, snapshot, slugHash];
}

/**
 * Extracts the snapshot timestamp from a cursor
 * 
 * @param cursor - Encoded cursor string
 * @returns Snapshot timestamp in UNIX seconds
 */
export function getSnapshotFromCursor(cursor: string): number {
  const tuple = decodeCursor(cursor);
  return tuple[4];
}

/**
 * Creates a new cursor with an updated snapshot timestamp
 * Useful for starting a new scroll session
 * 
 * @param snapshotTs - Snapshot timestamp in UNIX seconds (defaults to current time)
 * @returns Snapshot timestamp that can be used for cursor creation
 */
export function createSnapshot(snapshotTs?: number): number {
  return snapshotTs ?? Math.floor(Date.now() / 1000);
}
