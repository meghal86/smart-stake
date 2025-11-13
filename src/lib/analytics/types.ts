/**
 * Analytics Types for Hunter Screen
 * 
 * Defines all event types and their payloads for analytics tracking.
 * Requirements: 10.1-10.14
 */

export type AnalyticsEventType =
  | 'feed_view'
  | 'filter_change'
  | 'card_impression'
  | 'card_click'
  | 'save'
  | 'report'
  | 'cta_click'
  | 'scroll_depth'
  | 'wallet_connected'
  | 'wallet_switched'
  | 'wallet_disconnected'
  | 'feed_personalized';

export interface BaseEventPayload {
  timestamp: string;
  session_id: string;
  user_id_hash?: string; // Salted hash, never plain wallet
}

export interface FeedViewEvent extends BaseEventPayload {
  event: 'feed_view';
  properties: {
    tab?: string;
    has_wallet: boolean;
    filter_count: number;
  };
}

export interface FilterChangeEvent extends BaseEventPayload {
  event: 'filter_change';
  properties: {
    filter_type: string;
    filter_value: string | string[] | number | boolean;
    active_filters: Record<string, any>;
  };
}

export interface CardImpressionEvent extends BaseEventPayload {
  event: 'card_impression';
  properties: {
    opportunity_id: string;
    opportunity_type: string;
    trust_level: string;
    position: number;
    is_sponsored: boolean;
    is_featured: boolean;
  };
}

export interface CardClickEvent extends BaseEventPayload {
  event: 'card_click';
  properties: {
    opportunity_id: string;
    opportunity_type: string;
    trust_level: string;
    position: number;
    is_sponsored: boolean;
    is_featured: boolean;
  };
}

export interface SaveEvent extends BaseEventPayload {
  event: 'save';
  properties: {
    opportunity_id: string;
    opportunity_type: string;
    action: 'save' | 'unsave';
  };
}

export interface ReportEvent extends BaseEventPayload {
  event: 'report';
  properties: {
    opportunity_id: string;
    report_category: string;
  };
}

export interface CTAClickEvent extends BaseEventPayload {
  event: 'cta_click';
  properties: {
    opportunity_id: string;
    opportunity_type: string;
    cta_action: string;
    trust_level: string;
  };
}

export interface ScrollDepthEvent extends BaseEventPayload {
  event: 'scroll_depth';
  properties: {
    depth_percent: number;
    page_height: number;
    viewport_height: number;
  };
}

export interface WalletConnectedEvent extends BaseEventPayload {
  event: 'wallet_connected';
  properties: {
    wallet_count: number;
    is_first_wallet: boolean;
    chain: string;
  };
}

export interface WalletSwitchedEvent extends BaseEventPayload {
  event: 'wallet_switched';
  properties: {
    wallet_count: number;
    wallet_switch_duration_ms: number;
    from_wallet_hash?: string;
    to_wallet_hash: string;
  };
}

export interface WalletDisconnectedEvent extends BaseEventPayload {
  event: 'wallet_disconnected';
  properties: {
    wallet_count: number;
    had_active_wallet: boolean;
  };
}

export interface FeedPersonalizedEvent extends BaseEventPayload {
  event: 'feed_personalized';
  properties: {
    wallet_count: number;
    personalization_duration_ms: number;
    has_wallet_history: boolean;
  };
}

export type AnalyticsEvent =
  | FeedViewEvent
  | FilterChangeEvent
  | CardImpressionEvent
  | CardClickEvent
  | SaveEvent
  | ReportEvent
  | CTAClickEvent
  | ScrollDepthEvent
  | WalletConnectedEvent
  | WalletSwitchedEvent
  | WalletDisconnectedEvent
  | FeedPersonalizedEvent;

export interface AnalyticsConfig {
  enabled: boolean;
  apiKey?: string;
  apiHost?: string;
  debug?: boolean;
  respectDNT?: boolean;
  sessionReplay?: boolean;
  capturePageview?: boolean;
}

export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}
