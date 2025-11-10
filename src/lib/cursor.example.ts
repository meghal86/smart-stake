/**
 * Example usage of cursor pagination utilities
 * 
 * This file demonstrates how to use the cursor utilities in various scenarios.
 * These examples can be used as reference when implementing the feed API.
 */

import {
  encodeCursor,
  decodeCursor,
  createCursorFromOpportunity,
  isValidCursor,
  type CursorTuple,
} from './cursor';

// ============================================================================
// Example 1: Basic Encoding and Decoding
// ============================================================================

function example1_basicUsage() {
  // Create a cursor tuple
  const tuple: CursorTuple = [95.5, 85, '2025-12-31T23:59:59Z', 'abc-123'];
  
  // Encode to base64url string
  const encoded = encodeCursor(tuple);
  console.log('Encoded cursor:', encoded);
  // Output: 'Wzk1LjUsODUsIjIwMjUtMTItMzFUMjM6NTk6NTlaIiwiYWJjLTEyMyJd'
  
  // Decode back to tuple
  const decoded = decodeCursor(encoded);
  console.log('Decoded tuple:', decoded);
  // Output: [95.5, 85, '2025-12-31T23:59:59Z', 'abc-123']
}

// ============================================================================
// Example 2: Creating Cursor from Opportunity
// ============================================================================

function example2_fromOpportunity() {
  // Opportunity from database
  const opportunity = {
    id: 'opp-123',
    rank_score: 95.5,
    trust_score: 85,
    expires_at: '2025-12-31T23:59:59Z',
    title: 'Example Airdrop',
    // ... other fields
  };
  
  // Create cursor tuple
  const tuple = createCursorFromOpportunity(opportunity);
  
  // Encode for API response
  const cursor = encodeCursor(tuple);
  
  return cursor;
}

// ============================================================================
// Example 3: API Route Handler (Next.js)
// ============================================================================

async function example3_apiHandler(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursorParam = searchParams.get('cursor');
  
  // Build WHERE clause
  let whereClause = 'WHERE status = $1';
  let params: any[] = ['published'];
  
  // If cursor provided, decode and add to WHERE clause
  if (cursorParam) {
    if (!isValidCursor(cursorParam)) {
      return Response.json(
        { error: { code: 'BAD_CURSOR', message: 'Invalid cursor format' } },
        { status: 400 }
      );
    }
    
    try {
      const [rankScore, trustScore, expiresAt, id] = decodeCursor(cursorParam);
      
      // Add cursor condition for pagination
      whereClause += ' AND (rank_score, trust_score, expires_at, id) < ($2, $3, $4, $5)';
      params.push(rankScore, trustScore, expiresAt, id);
    } catch (error) {
      return Response.json(
        { error: { code: 'BAD_CURSOR', message: 'Failed to decode cursor' } },
        { status: 400 }
      );
    }
  }
  
  // Execute query
  const query = `
    SELECT 
      id,
      rank_score,
      trust_score,
      expires_at,
      title,
      protocol_name,
      type,
      chains
    FROM opportunities
    ${whereClause}
    ORDER BY rank_score DESC, trust_score DESC, expires_at ASC, id ASC
    LIMIT 12
  `;
  
  // Mock database query (replace with actual DB call)
  const items = await mockDbQuery(query, params);
  
  // Create cursor for next page
  const nextCursor = items.length === 12
    ? encodeCursor(createCursorFromOpportunity(items[items.length - 1]))
    : null;
  
  return Response.json({
    items,
    cursor: nextCursor,
    ts: new Date().toISOString(),
  });
}

// ============================================================================
// Example 4: React Query Integration
// ============================================================================

function example4_reactQuery() {
  // This would be in a React component
  const useOpportunities = (filters: any) => {
    // Using @tanstack/react-query
    return {
      queryKey: ['opportunities', filters],
      queryFn: async ({ pageParam }: { pageParam?: string }) => {
        const params = new URLSearchParams({
          ...filters,
          ...(pageParam && { cursor: pageParam }),
        });
        
        const response = await fetch(`/api/hunter/opportunities?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch opportunities');
        }
        
        return response.json();
      },
      getNextPageParam: (lastPage: any) => lastPage.cursor ?? undefined,
      initialPageParam: undefined,
    };
  };
  
  return useOpportunities;
}

// ============================================================================
// Example 5: Handling Missing Fields
// ============================================================================

function example5_missingFields() {
  // Opportunity without rank_score (uses trust_score as fallback)
  const opportunity1 = {
    id: 'opp-456',
    trust_score: 85,
    expires_at: '2025-12-31T23:59:59Z',
  };
  
  const cursor1 = encodeCursor(createCursorFromOpportunity(opportunity1));
  console.log('Cursor without rank_score:', cursor1);
  
  // Opportunity without expires_at (uses far future date)
  const opportunity2 = {
    id: 'opp-789',
    rank_score: 95.5,
    trust_score: 85,
    expires_at: null,
  };
  
  const cursor2 = encodeCursor(createCursorFromOpportunity(opportunity2));
  console.log('Cursor without expires_at:', cursor2);
}

// ============================================================================
// Example 6: Validation Before Use
// ============================================================================

function example6_validation(userProvidedCursor: string) {
  // Always validate user input
  if (!isValidCursor(userProvidedCursor)) {
    console.error('Invalid cursor provided by user');
    return { error: 'Invalid cursor' };
  }
  
  // Safe to decode
  const tuple = decodeCursor(userProvidedCursor);
  
  // Use tuple for database query
  return { tuple };
}

// ============================================================================
// Example 7: Multi-Page Pagination Flow
// ============================================================================

async function example7_multiPageFlow() {
  // Page 1: Initial request (no cursor)
  const page1Response = await fetch('/api/hunter/opportunities?limit=12');
  const page1 = await page1Response.json();
  
  console.log('Page 1:', page1.items.length, 'items');
  console.log('Next cursor:', page1.cursor);
  
  // Page 2: Use cursor from page 1
  if (page1.cursor) {
    const page2Response = await fetch(
      `/api/hunter/opportunities?limit=12&cursor=${page1.cursor}`
    );
    const page2 = await page2Response.json();
    
    console.log('Page 2:', page2.items.length, 'items');
    console.log('Next cursor:', page2.cursor);
    
    // Page 3: Use cursor from page 2
    if (page2.cursor) {
      const page3Response = await fetch(
        `/api/hunter/opportunities?limit=12&cursor=${page2.cursor}`
      );
      const page3 = await page3Response.json();
      
      console.log('Page 3:', page3.items.length, 'items');
      console.log('Next cursor:', page3.cursor);
    }
  }
}

// ============================================================================
// Example 8: Error Handling
// ============================================================================

function example8_errorHandling(cursor: string) {
  try {
    // Attempt to decode cursor
    const tuple = decodeCursor(cursor);
    
    // Use tuple...
    return { success: true, tuple };
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('Invalid cursor structure')) {
        return { success: false, error: 'Malformed cursor' };
      }
      if (error.message.includes('Invalid rank score')) {
        return { success: false, error: 'Invalid rank score in cursor' };
      }
      // Generic error
      return { success: false, error: 'Failed to decode cursor' };
    }
    
    return { success: false, error: 'Unknown error' };
  }
}

// ============================================================================
// Mock Database Query (for example purposes)
// ============================================================================

async function mockDbQuery(query: string, params: any[]) {
  // This would be replaced with actual database call
  // e.g., using Supabase, Prisma, or pg
  return [
    {
      id: 'opp-1',
      rank_score: 95.5,
      trust_score: 85,
      expires_at: '2025-12-31T23:59:59Z',
      title: 'Example Opportunity 1',
      protocol_name: 'Protocol A',
      type: 'airdrop',
      chains: ['ethereum', 'base'],
    },
    // ... more items
  ];
}

// Export examples for reference
export {
  example1_basicUsage,
  example2_fromOpportunity,
  example3_apiHandler,
  example4_reactQuery,
  example5_missingFields,
  example6_validation,
  example7_multiPageFlow,
  example8_errorHandling,
};
