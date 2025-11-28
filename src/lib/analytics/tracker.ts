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
  WalletConnectedEvent,
  WalletSwitchedEvent,
  WalletDisconnectedEvent,
  FeedPersonalizedEvent,
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
 * Requirement: 10.1, 18.4 (wallet correlation)
 */
export async function trackFeedView(params: {
  tab?: string;
  hasWallet: boolean;
  filterCount: number;
  walletAddress?: string;
}): Promise<void> {
  const walletIdHash = await getUserIdHash(params.walletAddress);
  
  const event: FeedViewEvent = {
    event: 'feed_view',
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id_hash: walletIdHash,
    properties: {
      tab: params.tab,
      has_wallet: params.hasWallet,
      filter_count: params.filterCount,
      wallet_id_hash: walletIdHash, // Include hashed wallet_id for analytics correlation
    },
  };

  await analytics.track(event);
}

/**
 * Track filter change event
 * Requirement: 10.2, 18.4 (wallet correlation)
 */
export async function trackFilterChange(params: {
  filterType: string;
  filterValue: string | string[] | number | boolean;
  activeFilters: Record<string, unknown>;
  walletAddress?: string;
}): Promise<void> {
  const walletIdHash = await getUserIdHash(params.walletAddress);
  
  const event: FilterChangeEvent = {
    event: 'filter_change',
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id_hash: walletIdHash,
    properties: {
      filter_type: params.filterType,
      filter_value: params.filterValue,
      active_filters: params.activeFilters,
      wallet_id_hash: walletIdHash, // Include hashed wallet_id for analytics correlation
    },
  };

  await analytics.track(event);
}

/**
 * Track card impression event (with 0.1% sampling)
 * Requirement: 10.3, 18.4 (wallet correlation)
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

  const walletIdHash = await getUserIdHash(params.walletAddress);
  
  const event: CardImpressionEvent = {
    event: 'card_impression',
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id_hash: walletIdHash,
    properties: {
      opportunity_id: params.opportunityId,
      opportunity_type: params.opportunityType,
      trust_level: params.trustLevel,
      position: params.position,
      is_sponsored: params.isSponsored,
      is_featured: params.isFeatured,
      wallet_id_hash: walletIdHash, // Include hashed wallet_id for analytics correlation
    },
  };

  await analytics.track(event);
}

/**
 * Track card click event (100% sampling)
 * Requirement: 10.4, 18.4 (wallet correlation)
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
  const walletIdHash = await getUserIdHash(params.walletAddress);
  
  const event: CardClickEvent = {
    event: 'card_click',
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id_hash: walletIdHash,
    properties: {
      opportunity_id: params.opportunityId,
      opportunity_type: params.opportunityType,
      trust_level: params.trustLevel,
      position: params.position,
      is_sponsored: params.isSponsored,
      is_featured: params.isFeatured,
      wallet_id_hash: walletIdHash, // Include hashed wallet_id for analytics correlation
    },
  };

  await analytics.track(event);
}

/**
 * Track save event
 * Requirement: 10.5, 18.4 (wallet correlation)
 */
export async function trackSave(params: {
  opportunityId: string;
  opportunityType: string;
  action: 'save' | 'unsave';
  walletAddress?: string;
}): Promise<void> {
  const walletIdHash = await getUserIdHash(params.walletAddress);
  
  const event: SaveEvent = {
    event: 'save',
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id_hash: walletIdHash,
    properties: {
      opportunity_id: params.opportunityId,
      opportunity_type: params.opportunityType,
      action: params.action,
      wallet_id_hash: walletIdHash, // Include hashed wallet_id for analytics correlation
    },
  };

  await analytics.track(event);
}

/**
 * Track report event
 * Requirement: 10.6, 18.4 (wallet correlation)
 */
export async function trackReport(params: {
  opportunityId: string;
  reportCategory: string;
  walletAddress?: string;
}): Promise<void> {
  const walletIdHash = await getUserIdHash(params.walletAddress);
  
  const event: ReportEvent = {
    event: 'report',
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id_hash: walletIdHash,
    properties: {
      opportunity_id: params.opportunityId,
      report_category: params.reportCategory,
      wallet_id_hash: walletIdHash, // Include hashed wallet_id for analytics correlation
    },
  };

  await analytics.track(event);
}

/**
 * Track CTA click event
 * Requirement: 10.7, 18.4 (wallet correlation)
 */
export async function trackCTAClick(params: {
  opportunityId: string;
  opportunityType: string;
  ctaAction: string;
  trustLevel: string;
  walletAddress?: string;
}): Promise<void> {
  const walletIdHash = await getUserIdHash(params.walletAddress);
  
  const event: CTAClickEvent = {
    event: 'cta_click',
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id_hash: walletIdHash,
    properties: {
      opportunity_id: params.opportunityId,
      opportunity_type: params.opportunityType,
      cta_action: params.ctaAction,
      trust_level: params.trustLevel,
      wallet_id_hash: walletIdHash, // Include hashed wallet_id for analytics correlation
    },
  };

  await analytics.track(event);
}

/**
 * Track scroll depth event
 * Requirement: 10.8, 18.4 (wallet correlation)
 */
export async function trackScrollDepth(params: {
  depthPercent: number;
  pageHeight: number;
  viewportHeight: number;
  walletAddress?: string;
}): Promise<void> {
  const walletIdHash = await getUserIdHash(params.walletAddress);
  
  const event: ScrollDepthEvent = {
    event: 'scroll_depth',
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id_hash: walletIdHash,
    properties: {
      depth_percent: params.depthPercent,
      page_height: params.pageHeight,
      viewport_height: params.viewportHeight,
      wallet_id_hash: walletIdHash, // Include hashed wallet_id for analytics correlation
    },
  };

  await analytics.track(event);
}

/**
 * Track wallet connected event
 * Requirement: 10.1-10.14, Task 57
 */
export async function trackWalletConnected(params: {
  walletAddress: string;
  walletCount: number;
  isFirstWallet: boolean;
  chain: string;
}): Promise<void> {
  const walletIdHash = await getUserIdHash(params.walletAddress);
  
  const event: WalletConnectedEvent = {
    event: 'wallet_connected',
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id_hash: walletIdHash,
    properties: {
      wallet_count: params.walletCount,
      is_first_wallet: params.isFirstWallet,
      chain: params.chain,
    },
  };

  await analytics.track(event);
}

/**
 * Track wallet switched event
 * Requirement: 10.1-10.14, Task 57
 */
export async function trackWalletSwitched(params: {
  fromWalletAddress?: string;
  toWalletAddress: string;
  walletCount: number;
  switchDurationMs: number;
}): Promise<void> {
  const fromWalletHash = params.fromWalletAddress 
    ? await getUserIdHash(params.fromWalletAddress)
    : undefined;
  const toWalletHash = await getUserIdHash(params.toWalletAddress);
  
  const event: WalletSwitchedEvent = {
    event: 'wallet_switched',
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id_hash: toWalletHash,
    properties: {
      wallet_count: params.walletCount,
      wallet_switch_duration_ms: params.switchDurationMs,
      from_wallet_hash: fromWalletHash,
      to_wallet_hash: toWalletHash!,
    },
  };

  await analytics.track(event);
}

/**
 * Track wallet disconnected event
 * Requirement: 10.1-10.14, Task 57
 */
export async function trackWalletDisconnected(params: {
  walletAddress: string;
  walletCount: number;
  hadActiveWallet: boolean;
}): Promise<void> {
  const walletIdHash = await getUserIdHash(params.walletAddress);
  
  const event: WalletDisconnectedEvent = {
    event: 'wallet_disconnected',
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id_hash: walletIdHash,
    properties: {
      wallet_count: params.walletCount,
      had_active_wallet: params.hadActiveWallet,
    },
  };

  await analytics.track(event);
}

/**
 * Track feed personalized event
 * Requirement: 10.1-10.14, Task 57
 */
export async function trackFeedPersonalized(params: {
  walletAddress: string;
  walletCount: number;
  personalizationDurationMs: number;
  hasWalletHistory: boolean;
}): Promise<void> {
  const walletIdHash = await getUserIdHash(params.walletAddress);
  
  const event: FeedPersonalizedEvent = {
    event: 'feed_personalized',
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    user_id_hash: walletIdHash,
    properties: {
      wallet_count: params.walletCount,
      personalization_duration_ms: params.personalizationDurationMs,
      has_wallet_history: params.hasWalletHistory,
    },
  };

  await analytics.track(event);
}
