/**
 * Analytics Event Tracker
 * 
 * High-level API for tracking specific events in the Hunter Screen.
 * Requirements: 10.1-10.11
 */

import { analytics } from './client';
import { hashWalletAddress } from './hash';
import type {
  FeedViewEvent,
  FilterChangeEvent,
  CardImpressionEvent,
  CardClickEvent,
  SaveEvent,
  ReportEvent,
  CTAClickEvent,
  ScrollDepthEvent,
} from './types';

/**
 * Generate a session ID (stored in sessionStorage)
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  const SESSION_ID_KEY = 'alphawhale_session_id';
  
  try {
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }

    return sessionId;
  } catch (error) {
    console.error('Failed to get session ID:', error);
    return `session_${Date.now()}`;
  }
}

/**
 * Get current user ID hash (if wallet connected)
 */
async function getUserIdHash(walletAddress?: string): Promise<string | undefined> {
  if (!walletAddress) return undefined;
  return await hashWalletAddress(walletAddress);
}

/**
 * Track feed view event
 * Requirement: 10.1
 */
export async function trackFeedView(params: {
  tab?: string;
  hasWallet: boolean;
  filterCount: number;
  walletAddress?: string;
}): Promise<void> {
  const event: FeedViewEvent = {
    event: 'feed_view',
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id_hash: await getUserIdHash(params.walletAddress),
    properties: {
      tab: params.tab,
      has_wallet: params.hasWallet,
      filter_count: params.filterCount,
    },
  };

  await analytics.track(event);
}

/**
 * Track filter change event
 * Requirement: 10.2
 */
export async function trackFilterChange(params: {
  filterType: string;
  filterValue: string | string[] | number | boolean;
  activeFilters: Record<string, any>;
  walletAddress?: string;
}): Promise<void> {
  const event: FilterChangeEvent = {
    event: 'filter_change',
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id_hash: await getUserIdHash(params.walletAddress),
    properties: {
      filter_type: params.filterType,
      filter_value: params.filterValue,
      active_filters: params.activeFilters,
    },
  };

  await analytics.track(event);
}

/**
 * Track card impression event (with 0.1% sampling)
 * Requirement: 10.3
 */
export async function trackCardImpression(params: {
  opportunityId: string;
  opportunityType: string;
  trustLevel: string;
  position: number;
  isSponsored: boolean;
  isFeatured: boolean;
  walletAddress?: string;
}): Promise<void> {
  // Apply 0.1% sampling
  if (Math.random() > 0.001) return;

  const event: CardImpressionEvent = {
    event: 'card_impression',
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id_hash: await getUserIdHash(params.walletAddress),
    properties: {
      opportunity_id: params.opportunityId,
      opportunity_type: params.opportunityType,
      trust_level: params.trustLevel,
      position: params.position,
      is_sponsored: params.isSponsored,
      is_featured: params.isFeatured,
    },
  };

  await analytics.track(event);
}

/**
 * Track card click event (100% sampling)
 * Requirement: 10.4
 */
export async function trackCardClick(params: {
  opportunityId: string;
  opportunityType: string;
  trustLevel: string;
  position: number;
  isSponsored: boolean;
  isFeatured: boolean;
  walletAddress?: string;
}): Promise<void> {
  const event: CardClickEvent = {
    event: 'card_click',
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id_hash: await getUserIdHash(params.walletAddress),
    properties: {
      opportunity_id: params.opportunityId,
      opportunity_type: params.opportunityType,
      trust_level: params.trustLevel,
      position: params.position,
      is_sponsored: params.isSponsored,
      is_featured: params.isFeatured,
    },
  };

  await analytics.track(event);
}

/**
 * Track save event
 * Requirement: 10.5
 */
export async function trackSave(params: {
  opportunityId: string;
  opportunityType: string;
  action: 'save' | 'unsave';
  walletAddress?: string;
}): Promise<void> {
  const event: SaveEvent = {
    event: 'save',
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id_hash: await getUserIdHash(params.walletAddress),
    properties: {
      opportunity_id: params.opportunityId,
      opportunity_type: params.opportunityType,
      action: params.action,
    },
  };

  await analytics.track(event);
}

/**
 * Track report event
 * Requirement: 10.6
 */
export async function trackReport(params: {
  opportunityId: string;
  reportCategory: string;
  walletAddress?: string;
}): Promise<void> {
  const event: ReportEvent = {
    event: 'report',
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id_hash: await getUserIdHash(params.walletAddress),
    properties: {
      opportunity_id: params.opportunityId,
      report_category: params.reportCategory,
    },
  };

  await analytics.track(event);
}

/**
 * Track CTA click event
 * Requirement: 10.7
 */
export async function trackCTAClick(params: {
  opportunityId: string;
  opportunityType: string;
  ctaAction: string;
  trustLevel: string;
  walletAddress?: string;
}): Promise<void> {
  const event: CTAClickEvent = {
    event: 'cta_click',
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id_hash: await getUserIdHash(params.walletAddress),
    properties: {
      opportunity_id: params.opportunityId,
      opportunity_type: params.opportunityType,
      cta_action: params.ctaAction,
      trust_level: params.trustLevel,
    },
  };

  await analytics.track(event);
}

/**
 * Track scroll depth event
 * Requirement: 10.8
 */
export async function trackScrollDepth(params: {
  depthPercent: number;
  pageHeight: number;
  viewportHeight: number;
  walletAddress?: string;
}): Promise<void> {
  const event: ScrollDepthEvent = {
    event: 'scroll_depth',
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id_hash: await getUserIdHash(params.walletAddress),
    properties: {
      depth_percent: params.depthPercent,
      page_height: params.pageHeight,
      viewport_height: params.viewportHeight,
    },
  };

  await analytics.track(event);
}
