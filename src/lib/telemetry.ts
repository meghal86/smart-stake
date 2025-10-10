/**
 * Telemetry & Analytics Events
 */

export type TelemetryEvent =
  // Feed events
  | 'feed_stream_connected'
  | 'feed_stream_error'
  | 'feed_page_loaded'
  | 'feed_grouped'
  | 'feed_sorted'
  // Signal events
  | 'signal_rendered'
  | 'signal_hovered'
  | 'signal_explain_clicked'
  | 'signal_alert_clicked'
  | 'signal_details_clicked'
  | 'signal_explain_opened'
  | 'signal_expanded'
  | 'signal_do_next_clicked'
  | 'signal_follow_pattern_clicked'
  | 'signal_muted'
  | 'signal_unmuted'
  | 'signal_filters_cleared'
  | 'signal_feedback_given'
  | 'signal_dismissed'
  // Phase C events
  | 'narrative_rendered'
  | 'alert_created'
  | 'explain_modal_opened'
  | 'nav_signals_tab_changed'
  | 'nav_back_to_dashboard'
  | 'fab_create_alert_clicked'
  // Must-fix events
  | 'feed_filter_applied'
  | 'autoscroll_paused'
  | 'new_items_seen'
  | 'explain_tab_viewed'
  | 'alert_prefill_changed'
  | 'alert_created_success'
  | 'row_source_tooltip_opened'
  | 'row_group_expanded'
  | 'raw_data_copied'
  | 'raw_row_expanded'
  // World-class UX events
  | 'tab_switch'
  | 'sort_applied'
  | 'card_hover'
  | 'explain_preview'
  | 'dark_mode_toggle'
  | 'search_applied'
  // Tesla-level events
  | 'narrative_rendered'
  | 'narrative_refresh_clicked'
  | 'feed_filter_applied'
  | 'new_batch_arrived'
  | 'new_items_applied'
  | 'card_expanded'
  | 'card_action_clicked'
  | 'explain_modal_opened'
  | 'do_next_clicked'
  | 'raw_group_changed'
  | 'raw_export_clicked'
  // Phase D: Energy & Emotion events
  | 'heartbeat_pulsed'
  | 'signal_expanded'
  | 'action_row_clicked'
  | 'microticker_refreshed'
  | 'tab_switch'
  // Discovery & ROI events
  | 'card_click'
  | 'tip_shown'
  | 'tip_dismissed'
  | 'digest_toggle'
  | 'digest_confidence_view'
  | 'cta_click'
  | 'streak_celebrate'
  | 'cta_micro_pulse'
  | 'upgrade_click'
  | 'create_alert'
  | 'follow_asset'
  | 'portfolio_toggle'
  | 'kpis_trend_rendered'
  | 'kpi_delta_noise_filtered'
  | 'kpis_source_type'
  | 'kpi_cache_hit'
  | 'kpi_manual_refresh'
  | 'kpis_hover_detail'
  | 'kpi_action'
  | 'header_view'
  | 'header_click'
  | 'nav_floating_back'
  | 'tooltip_open'
  | 'header_motto_rendered'
  | 'signal_pattern_clicked'
  | 'signals_back_clicked'
  | 'signals_create_alert_clicked'
  | 'signals_tab_changed'
  | 'execute_roi_query';

export interface TelemetryProperties {
  [key: string]: string | number | boolean | undefined;
}

export function trackEvent(event: TelemetryEvent, properties?: TelemetryProperties) {
  // Mask sensitive data
  const sanitized = properties ? { ...properties } : {};
  delete sanitized.txHash;
  delete sanitized.from;
  delete sanitized.to;

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Telemetry]', event, sanitized);
  }

  // Send to analytics service
  try {
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track(event, {
        ...sanitized,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      });
    }
  } catch (error) {
    console.error('Telemetry error:', error);
  }
}
