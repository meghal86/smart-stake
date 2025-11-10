# Cursor Pagination Utilities

## Overview

This module provides stable, opaque cursor-based pagination for the Hunter Screen feed. Cursors encode the pagination state as base64url strings, ensuring consistent ordering and preventing duplicate items across pages.

## Requirements

Implements requirements:
- **3.7**: Stable cursor pagination with tie-breakers
- **7.9**: Infinite scroll with cursor tokens
- **7.10**: Monotonic cursors preventing duplicates

## Cursor Format

A cursor encodes a tuple of 4 values that define the pagination position:

```typescript
type CursorTuple = [
  rank_score: number,      // Primary sort (DESC)
  trust_score: number,     // Secondary sort (DESC)
  expires_at: string,      // Tertiary sort (ASC, ISO8601)
  id: string              // Final tie-breaker (ASC)
];
```

### Sort Order

The cursor implements the following sort order for feed items:
1. `rank_score` DESC (highest first)
2. `trust_score` DESC (highest first)
3. `expires_at` ASC (soonest expiry first)
4. `id` ASC (deterministic tie-breaker)

This matches the SQL query pattern:
```sql
ORDER BY rank_score DESC, trust_score DESC, expires_at ASC, id ASC
```

## API Reference

### `encodeCursor(tuple: CursorTuple): string`

Encodes a cursor tuple into a base64url string.

**Parameters:**
- `tuple`: Array of [rank_score, trust_score, expires_at, id]

**Returns:** Base64url encoded cursor string

**Throws:** Error if tuple is invalid

**Example:**
```typescript
const cursor = encodeCursor([95.5, 85, '2025-12-31T23:59:59Z', 'abc-123']);
// Returns: 'Wzk1LjUsODUsIjIwMjUtMTItMzFUMjM6NTk6NTlaIiwiYWJjLTEyMyJd'
```

### `decodeCursor(cursor: string): CursorTuple`

Decodes a base64url cursor string back into a tuple.

**Parameters:**
- `cursor`: Base64url encoded cursor string

**Returns:** Decoded cursor tuple

**Throws:** Error if cursor is invalid or malformed

**Example:**
```typescript
const tuple = decodeCursor('Wzk1LjUsODUsIjIwMjUtMTItMzFUMjM6NTk6NTlaIiwiYWJjLTEyMyJd');
// Returns: [95.5, 85, '2025-12-31T23:59:59Z', 'abc-123']
```

### `isValidCursor(cursor: string): boolean`

Validates if a cursor string is properly formatted.

**Parameters:**
- `cursor`: Cursor string to validate

**Returns:** `true` if valid, `false` otherwise

**Example:**
```typescript
if (isValidCursor(userProvidedCursor)) {
  const tuple = decodeCursor(userProvidedCursor);
  // Use tuple...
}
```

### `createCursorFromOpportunity(opportunity): CursorTuple`

Creates a cursor tuple from an opportunity object.

**Parameters:**
- `opportunity`: Object with fields:
  - `rank_score?`: number (optional, defaults to trust_score)
  - `trust_score`: number (required)
  - `expires_at`: string | null (required, null uses far future date)
  - `id`: string (required)

**Returns:** Cursor tuple ready for encoding

**Example:**
```typescript
const opportunity = {
  rank_score: 95.5,
  trust_score: 85,
  expires_at: '2025-12-31T23:59:59Z',
  id: 'abc-123'
};

const cursor = createCursorFromOpportunity(opportunity);
const encoded = encodeCursor(cursor);
```

## Usage Examples

### Basic Pagination Flow

```typescript
import { encodeCursor, decodeCursor, createCursorFromOpportunity } from '@/lib/cursor';

// Page 1: Initial request (no cursor)
const page1 = await fetchOpportunities({ limit: 12 });
const lastItem = page1.items[page1.items.length - 1];
const cursor1 = encodeCursor(createCursorFromOpportunity(lastItem));

// Page 2: Use cursor from page 1
const page2 = await fetchOpportunities({ limit: 12, cursor: cursor1 });
const lastItem2 = page2.items[page2.items.length - 1];
const cursor2 = encodeCursor(createCursorFromOpportunity(lastItem2));

// Page 3: Use cursor from page 2
const page3 = await fetchOpportunities({ limit: 12, cursor: cursor2 });
```

### API Route Handler

```typescript
// app/api/hunter/opportunities/route.ts
import { decodeCursor, encodeCursor, createCursorFromOpportunity } from '@/lib/cursor';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursorParam = searchParams.get('cursor');
  
  let whereClause = 'WHERE status = $1';
  let params: any[] = ['published'];
  
  if (cursorParam) {
    try {
      const [rankScore, trustScore, expiresAt, id] = decodeCursor(cursorParam);
      whereClause += ' AND (rank_score, trust_score, expires_at, id) < ($2, $3, $4, $5)';
      params.push(rankScore, trustScore, expiresAt, id);
    } catch (error) {
      return Response.json(
        { error: { code: 'BAD_CURSOR', message: 'Invalid cursor' } },
        { status: 400 }
      );
    }
  }
  
  const query = `
    SELECT * FROM opportunities
    ${whereClause}
    ORDER BY rank_score DESC, trust_score DESC, expires_at ASC, id ASC
    LIMIT 12
  `;
  
  const items = await db.query(query, params);
  
  const nextCursor = items.length === 12
    ? encodeCursor(createCursorFromOpportunity(items[items.length - 1]))
    : null;
  
  return Response.json({
    items,
    cursor: nextCursor,
    ts: new Date().toISOString()
  });
}
```

### React Query Integration

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

function useOpportunities(filters: FilterState) {
  return useInfiniteQuery({
    queryKey: ['opportunities', filters],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        ...filters,
        ...(pageParam && { cursor: pageParam })
      });
      
      const response = await fetch(`/api/hunter/opportunities?${params}`);
      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
    initialPageParam: undefined,
  });
}
```

## Design Decisions

### Why Base64url?

Base64url encoding (RFC 4648) is used instead of standard base64 because:
- URL-safe: No `+`, `/`, or `=` characters that need escaping
- Compact: Smaller than hex encoding
- Standard: Well-supported in Node.js and browsers

### Why Include All 4 Fields?

Including all sort fields in the cursor ensures:
- **Stability**: Same cursor always returns same results
- **No Duplicates**: Proper tie-breaking prevents items appearing twice
- **Flexibility**: Supports complex multi-field sorting

### Why Opaque Encoding?

Cursors are opaque (base64 encoded) rather than plain JSON because:
- **Security**: Users can't easily manipulate pagination
- **Flexibility**: Internal format can change without breaking clients
- **Simplicity**: Single string parameter instead of multiple fields

## Performance Considerations

### Index Requirements

For optimal performance, ensure the database has a composite index matching the sort order:

```sql
CREATE INDEX idx_opportunities_cursor ON opportunities(
  rank_score DESC,
  trust_score DESC,
  expires_at ASC,
  id ASC
) WHERE status = 'published';
```

### Cursor Size

Typical cursor size: ~60-80 bytes encoded
- Compact enough for URL parameters
- Small enough for efficient transmission
- No practical limit on pagination depth

## Error Handling

All functions throw descriptive errors for invalid inputs:

```typescript
try {
  const tuple = decodeCursor(userCursor);
  // Use tuple...
} catch (error) {
  // Handle invalid cursor
  console.error('Invalid cursor:', error.message);
  // Return 400 Bad Request or reset to page 1
}
```

## Testing

Comprehensive test coverage includes:
- Encoding/decoding round-trips
- Invalid input validation
- Cursor stability across multiple pages
- Edge cases (special characters, large numbers, etc.)
- Pagination simulation with realistic data

Run tests:
```bash
npm test -- src/__tests__/lib/cursor.test.ts
```

## Future Enhancements

Potential improvements for task 4a (snapshot watermark):
- Add `snapshot_ts` to cursor tuple for consistent scroll sessions
- Prevent mid-scroll data changes from causing duplicates
- Add hash-based tie-breaker for complete determinism

## Related Files

- `src/lib/cursor.ts` - Implementation
- `src/__tests__/lib/cursor.test.ts` - Unit tests
- `.kiro/specs/hunter-screen-feed/design.md` - Design documentation
- `.kiro/specs/hunter-screen-feed/requirements.md` - Requirements
