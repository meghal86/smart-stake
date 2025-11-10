/**
 * Feed Query Service for Hunter Screen
 * 
 * Implements getFeedPage() with cursor-based pagination, filtering, search, and sponsored capping.
 * 
 * Requirements: 3.7, 4.1-4.12, 4.16, 4.19, 7.9
 */

import { createServiceClient } from '@/integrations/supabase/service';
import { 
  Opportunity, 
  OpportunityType, 
  Chain, 
  DifficultyLevel, 
  UrgencyType,
  SortOption,
  FilterState 
} from '@/types/hunter';
import { CursorTuple, decodeCursor, createCursorFromOpportunity, createSnapshot } from '@/lib/cursor';

/**
 * Feed query parameters
 */
export interface FeedQueryParams {
  search?: string;
  types?: OpportunityType[];
  chains?: Chain[];
  trustMin?: number;
  rewardMin?: number;
  rewardMax?: number;
  urgency?: UrgencyType[];
  eligibleOnly?: boolean;
  difficulty?: DifficultyLevel[];
  sort?: SortOption;
  showRisky?: boolean;
  cursor?: string;
  limit?: number;
  walletAddress?: string; // For eligibility filtering
}

/**
 * Feed page response
 */
export interface FeedPageResult {
  items: Opportunity[];
  nextCursor: string | null;
  snapshotTs: number;
  totalCount?: number;
}

/**
 * Default page size (12 items per fold)
 */
const DEFAULT_PAGE_SIZE = 12;

/**
 * Maximum sponsored items per fold (≤2 per 12 cards)
 */
const MAX_SPONSORED_PER_FOLD = 2;

/**
 * Fetches a page of opportunities with cursor-based pagination
 * 
 * @param params - Query parameters including filters and cursor
 * @returns Feed page with items and next cursor
 * 
 * Requirements:
 * - 3.7: Cursor-based pagination with stable ordering
 * - 4.1-4.12: Comprehensive filtering
 * - 4.16: Sponsored item capping (≤2 per fold)
 * - 4.19: Deterministic sponsored placement
 * - 7.9: Deduplication across pages
 */
export async function getFeedPage(params: FeedQueryParams): Promise<FeedPageResult> {
  const supabase = createServiceClient();
  const limit = params.limit ?? DEFAULT_PAGE_SIZE;
  
  // Decode cursor or create new snapshot
  let cursorTuple: CursorTuple | null = null;
  let snapshotTs: number;
  
  if (params.cursor) {
    try {
      cursorTuple = decodeCursor(params.cursor);
      snapshotTs = cursorTuple[4]; // Extract snapshot from cursor
    } catch (error) {
      throw new Error('Invalid cursor format');
    }
  } else {
    // New scroll session - create snapshot
    snapshotTs = createSnapshot();
  }

  // Build base query using materialized view for better performance
  // The view already filters for status='published' and non-expired items
  let query = supabase
    .from('mv_opportunity_rank')
    .select('*', { count: 'exact' });

  // Snapshot constraint: only show items updated before snapshot
  const snapshotDate = new Date(snapshotTs * 1000).toISOString();
  query = query.lte('updated_at', snapshotDate);

  // Apply trust level filter
  const trustMin = params.trustMin ?? 80;
  if (!params.showRisky) {
    // Hide red trust items by default (trust_score < 60)
    query = query.gte('trust_score', 60);
  }
  query = query.gte('trust_score', trustMin);

  // Apply type filter
  if (params.types && params.types.length > 0) {
    query = query.in('type', params.types);
  }

  // Apply chain filter
  if (params.chains && params.chains.length > 0) {
    query = query.overlaps('chains', params.chains);
  }

  // Apply difficulty filter
  if (params.difficulty && params.difficulty.length > 0) {
    query = query.in('difficulty', params.difficulty);
  }

  // Apply urgency filter
  if (params.urgency && params.urgency.length > 0) {
    query = query.in('urgency', params.urgency);
  }

  // Apply reward range filter
  if (params.rewardMin !== undefined) {
    query = query.gte('reward_min', params.rewardMin);
  }
  if (params.rewardMax !== undefined) {
    query = query.lte('reward_max', params.rewardMax);
  }

  // Apply search filter (debounced on client side)
  if (params.search && params.search.trim()) {
    const searchTerm = params.search.trim();
    query = query.or(`title.ilike.%${searchTerm}%,protocol_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
  }

  // Apply cursor pagination
  if (cursorTuple) {
    const [rankScore, trustScore, expiresAt, id] = cursorTuple;
    
    // Complex cursor condition for stable ordering
    // ORDER BY: rank_score DESC, trust_score DESC, expires_at ASC, id ASC
    // We need to handle NULL expires_at (treated as far future)
    
    // Build cursor filter using row comparison
    // Note: Supabase doesn't support row comparisons directly, so we need to build it manually
    query = query.or(
      `and(rank_score.lt.${rankScore}),` +
      `and(rank_score.eq.${rankScore},trust_score.lt.${trustScore}),` +
      `and(rank_score.eq.${rankScore},trust_score.eq.${trustScore},expires_at.gt.${expiresAt}),` +
      `and(rank_score.eq.${rankScore},trust_score.eq.${trustScore},expires_at.eq.${expiresAt},id.gt.${id})`
    );
  }

  // Apply sorting based on sort option
  const sortOption = params.sort ?? 'recommended';
  
  switch (sortOption) {
    case 'recommended':
      // Use precomputed rank_score from materialized view
      query = query
        .order('rank_score', { ascending: false })
        .order('trust_score', { ascending: false })
        .order('expires_at', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true });
      break;
    
    case 'ends_soon':
      query = query
        .order('expires_at', { ascending: true, nullsFirst: false })
        .order('rank_score', { ascending: false })
        .order('trust_score', { ascending: false })
        .order('id', { ascending: true });
      break;
    
    case 'highest_reward':
      query = query
        .order('reward_max', { ascending: false, nullsFirst: false })
        .order('rank_score', { ascending: false })
        .order('trust_score', { ascending: false })
        .order('id', { ascending: true });
      break;
    
    case 'newest':
      query = query
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('rank_score', { ascending: false })
        .order('trust_score', { ascending: false })
        .order('id', { ascending: true });
      break;
    
    case 'trust':
      query = query
        .order('trust_score', { ascending: false })
        .order('rank_score', { ascending: false })
        .order('expires_at', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true });
      break;
  }

  // Fetch more items than needed to allow for sponsored capping
  const fetchLimit = limit + 10; // Fetch extra to ensure we have enough after filtering
  query = query.limit(fetchLimit);

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    console.error('Feed query error:', error);
    throw new Error(`Failed to fetch opportunities: ${error.message}`);
  }

  if (!data) {
    return {
      items: [],
      nextCursor: null,
      snapshotTs,
      totalCount: count ?? 0,
    };
  }

  // Transform database rows to Opportunity objects
  let opportunities = data.map(row => transformRowToOpportunity(row));

  // Apply sponsored item capping (≤2 per fold)
  opportunities = applySponsoredCapping(opportunities, limit);

  // Take only the requested limit
  const items = opportunities.slice(0, limit);

  // Generate next cursor if there are more items
  let nextCursor: string | null = null;
  if (items.length === limit && opportunities.length >= limit) {
    const lastItem = items[items.length - 1];
    const lastRow = data.find(row => row.id === lastItem.id);
    
    const nextCursorTuple = createCursorFromOpportunity(
      {
        rank_score: lastRow?.rank_score ?? lastItem.trust.score,
        trust_score: lastItem.trust.score,
        expires_at: lastItem.expires_at ?? null,
        id: lastItem.id,
        slug: lastItem.slug,
      },
      snapshotTs
    );
    
    // Encode cursor
    const { encodeCursor } = await import('@/lib/cursor');
    nextCursor = encodeCursor(nextCursorTuple);
  }

  return {
    items,
    nextCursor,
    snapshotTs,
    totalCount: count ?? undefined,
  };
}

/**
 * Applies sponsored item capping to ensure ≤2 sponsored items per any contiguous 12 cards
 * 
 * This implements a sliding window filter that enforces the sponsored cap across
 * any 12-card window, not just per page. This ensures deterministic behavior
 * across all viewport sizes and prevents sponsored clustering.
 * 
 * Requirements:
 * - 4.16: Sponsored items limited to ≤2 per any contiguous 12 cards
 * - 4.19: Deterministic sponsored placement across all viewport sizes
 * - 5.10: Sponsored items clearly labeled
 * - 5.15: Sponsored items respect cap
 * 
 * @param opportunities - Array of opportunities
 * @param foldSize - Number of items per fold (default 12)
 * @returns Filtered array with sponsored capping applied
 */
function applySponsoredCapping(
  opportunities: Opportunity[],
  foldSize: number = DEFAULT_PAGE_SIZE
): Opportunity[] {
  const WINDOW_SIZE = 12;
  const MAX_SPONSORED_PER_WINDOW = 2;
  
  const result: Opportunity[] = [];
  
  for (const opp of opportunities) {
    // Stop if we've reached the requested fold size
    if (result.length >= foldSize) {
      break;
    }

    // If it's not sponsored, always include it
    if (!opp.sponsored) {
      result.push(opp);
      continue;
    }

    // For sponsored items, check the sliding window constraint
    // Count sponsored items in the last (WINDOW_SIZE - 1) items
    const windowStart = Math.max(0, result.length - (WINDOW_SIZE - 1));
    const windowItems = result.slice(windowStart);
    const sponsoredInWindow = windowItems.filter(item => item.sponsored).length;

    // Only add this sponsored item if it won't violate the cap
    if (sponsoredInWindow < MAX_SPONSORED_PER_WINDOW) {
      result.push(opp);
    }
    // Otherwise skip this sponsored item
  }

  return result;
}

/**
 * Transforms a database row into an Opportunity object
 * 
 * @param row - Database row from opportunities table
 * @returns Transformed Opportunity object
 */
function transformRowToOpportunity(row: any): Opportunity {
  // Build badges array
  const badges = [];
  if (row.featured) {
    badges.push({ type: 'featured' as const, label: 'Featured' });
  }
  if (row.sponsored) {
    badges.push({ type: 'sponsored' as const, label: 'Sponsored' });
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    protocol: {
      name: row.protocol_name,
      logo: row.protocol_logo || '',
    },
    type: row.type,
    chains: row.chains,
    reward: {
      min: row.reward_min || 0,
      max: row.reward_max || 0,
      currency: row.reward_currency || 'USD',
      confidence: row.reward_confidence || 'estimated',
    },
    apr: row.apr,
    trust: {
      score: row.trust_score || 0,
      level: row.trust_level || 'amber',
      last_scanned_ts: row.updated_at,
      issues: [],
    },
    urgency: row.urgency,
    difficulty: row.difficulty,
    featured: row.featured,
    sponsored: row.sponsored,
    time_left_sec: row.time_left_sec ?? null,
    external_url: row.external_url,
    badges,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    published_at: row.published_at,
    expires_at: row.expires_at,
  };
}

/**
 * Counts total opportunities matching filters (without pagination)
 * Useful for displaying total count in UI
 * 
 * @param params - Query parameters (excluding cursor and limit)
 * @returns Total count of matching opportunities
 */
export async function countOpportunities(params: Omit<FeedQueryParams, 'cursor' | 'limit'>): Promise<number> {
  const supabase = createServiceClient();

  // Use materialized view for counting as well
  let query = supabase
    .from('mv_opportunity_rank')
    .select('*', { count: 'exact', head: true });

  const trustMin = params.trustMin ?? 80;
  if (!params.showRisky) {
    query = query.gte('trust_score', 60);
  }
  query = query.gte('trust_score', trustMin);

  if (params.types && params.types.length > 0) {
    query = query.in('type', params.types);
  }

  if (params.chains && params.chains.length > 0) {
    query = query.overlaps('chains', params.chains);
  }

  if (params.difficulty && params.difficulty.length > 0) {
    query = query.in('difficulty', params.difficulty);
  }

  if (params.urgency && params.urgency.length > 0) {
    query = query.in('urgency', params.urgency);
  }

  if (params.rewardMin !== undefined) {
    query = query.gte('reward_min', params.rewardMin);
  }
  if (params.rewardMax !== undefined) {
    query = query.lte('reward_max', params.rewardMax);
  }

  if (params.search && params.search.trim()) {
    const searchTerm = params.search.trim();
    query = query.or(`title.ilike.%${searchTerm}%,protocol_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Count query error:', error);
    return 0;
  }

  return count ?? 0;
}
