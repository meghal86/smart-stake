/**
 * Phase D Telemetry - Production metrics for Energy & Emotion features
 */

import { trackEvent } from './telemetry';

export interface FeedHeartbeatEvent {
  interval: number;
  latency_ms: number;
  status: 'live' | 'cached' | 'delayed';
}

export interface NarrativeRenderedEvent {
  bias: 'buy' | 'sell';
  inflows: number;
  outflows: number;
  window: string;
}

export interface GroupExpandedEvent {
  asset: string;
  direction: 'inflow' | 'outflow';
  count: number;
  totalUsd: number;
}

export interface QuickActionEvent {
  action: 'create_alert' | 'view_pattern' | 'explain';
  asset: string;
  context: 'card_action_row' | 'top_flow' | 'all_signals';
}

export interface ExplainOpenedEvent {
  asset: string;
  amountUsd: number;
  confidence: number;
}

export interface RawExportEvent {
  format: 'csv' | 'json';
  rows: number;
}

export class PhaseDTelemetry {
  static trackFeedHeartbeat(data: FeedHeartbeatEvent) {
    trackEvent('feed_heartbeat_pulsed', data);
  }

  static trackNarrativeRendered(data: NarrativeRenderedEvent) {
    trackEvent('narrative_rendered', data);
  }

  static trackGroupExpanded(data: GroupExpandedEvent) {
    trackEvent('group_expanded', data);
  }

  static trackQuickAction(data: QuickActionEvent) {
    trackEvent('quick_action_clicked', data);
  }

  static trackExplainOpened(data: ExplainOpenedEvent) {
    trackEvent('explain_opened', data);
  }

  static trackRawExport(data: RawExportEvent) {
    trackEvent('raw_export', data);
  }

  // Auto-pause interaction tracking
  static trackInteractionPause(duration: number) {
    trackEvent('updates_paused', { duration_ms: duration });
  }

  // Confidence bar animation completion
  static trackConfidenceAnimated(value: number, duration: number) {
    trackEvent('confidence_animated', { value, duration_ms: duration });
  }

  // Sparkline rendering performance
  static trackSparklineRendered(dataPoints: number, renderTime: number) {
    trackEvent('sparkline_rendered', { data_points: dataPoints, render_time_ms: renderTime });
  }

  // Card state persistence
  static trackCardStateChanged(signalId: string, expanded: boolean, persistTime: number) {
    trackEvent('card_state_changed', { 
      signal_id: signalId, 
      expanded, 
      persist_time_ms: persistTime 
    });
  }

  // Motion safety compliance
  static trackMotionPreference(reducedMotion: boolean) {
    trackEvent('motion_preference_detected', { reduced_motion: reducedMotion });
  }
}