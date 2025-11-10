/**
 * Test helpers for feed query service
 * Exports internal functions for testing
 */

import { Opportunity } from '@/types/hunter';

const DEFAULT_PAGE_SIZE = 12;
const MAX_SPONSORED_PER_FOLD = 2;

/**
 * Applies sponsored item capping to ensure ≤2 sponsored items per fold
 */
export function applySponsoredCapping(
  opportunities: Opportunity[],
  foldSize: number = DEFAULT_PAGE_SIZE
): Opportunity[] {
  const result: Opportunity[] = [];
  let sponsoredCount = 0;

  for (const opp of opportunities) {
    // Check if we've reached the fold size
    if (result.length >= foldSize) {
      break;
    }

    // If it's sponsored, check if we've hit the cap
    if (opp.sponsored) {
      if (sponsoredCount < MAX_SPONSORED_PER_FOLD) {
        result.push(opp);
        sponsoredCount++;
      }
      // Skip this sponsored item if we've hit the cap
    } else {
      // Non-sponsored items always included
      result.push(opp);
    }
  }

  return result;
}

/**
 * Transforms a database row into an Opportunity object
 */
export function transformRowToOpportunity(row: any): Opportunity {
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
    time_left_sec: row.time_left_sec,
    external_url: row.external_url,
    badges,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    published_at: row.published_at,
    expires_at: row.expires_at,
  };
}
