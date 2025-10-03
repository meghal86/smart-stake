export type TelemetryEventName = 
  | 'home_view'
  | 'card_click' 
  | 'create_alert'
  | 'follow_asset'
  | 'upgrade_click'
  | 'trial_start'
  | 'gated_feature_shown'
  | 'gated_feature_clicked'
  | 'upgrade_success'
  | 'share_click'
  | 'demo_mode_shown'
  | 'wallet_connect_click'
  | 'leaderboard_click'
  | 'pro_preview_shown'
  | 'cta_click'
  | 'novice_tip_shown'
  | 'novice_tip_dismissed'
  | 'header_click'
  | 'header_view'
  | 'header_motto_rendered'
  | 'tip_dismissed'
  | 'tip_reenabled'
  | 'tip_shown'

interface TelemetryEvent {
  event: string
  properties?: Record<string, any>
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  const payload: TelemetryEvent = {
    event,
    properties: {
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      ...properties
    }
  }

  // Log to console for debugging
  console.log('Telemetry:', payload)

  // In production, this would send to your analytics service
  // For now, just store in sessionStorage for debugging
  if (typeof window !== 'undefined') {
    const events = JSON.parse(sessionStorage.getItem('telemetry_events') || '[]')
    events.push(payload)
    sessionStorage.setItem('telemetry_events', JSON.stringify(events.slice(-100))) // Keep last 100 events
  }
}