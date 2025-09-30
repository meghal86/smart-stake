import { supabase } from '@/integrations/supabase/client';

export interface MetricEvent {
  eventType: string;
  eventData?: Record<string, any>;
  sessionId?: string;
}

class MetricsService {
  private sessionId: string;
  private userId: string | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeUser();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initializeUser() {
    const { data: { user } } = await supabase.auth.getUser();
    this.userId = user?.id || null;
  }

  // Core business metrics
  async trackActivation(addressCount: number, viewedRiskTab: boolean) {
    await this.track('activation', {
      addresses_added: addressCount,
      viewed_risk_tab: viewedRiskTab,
      is_activated: addressCount >= 2 && viewedRiskTab
    });
  }

  async trackAlertCreated(triggerType: string, isFirstAlert: boolean) {
    await this.track('alert_created', {
      trigger_type: triggerType,
      is_first_alert: isFirstAlert
    });
  }

  async trackAlertTriggered(alertId: string, triggerType: string) {
    await this.track('alert_triggered', {
      alert_id: alertId,
      trigger_type: triggerType
    });
  }

  async trackAlertOpened(alertId: string, triggerType: string) {
    await this.track('alert_opened', {
      alert_id: alertId,
      trigger_type: triggerType
    });
  }

  async trackDrilldownClick(chainName: string, fromComponent: string) {
    await this.track('drilldown_click', {
      chain_name: chainName,
      from_component: fromComponent
    });
  }

  async trackStressTestRun(scenario: string, portfolioValue: number, impact: number) {
    await this.track('stress_test_run', {
      scenario,
      portfolio_value: portfolioValue,
      impact_percent: impact
    });
  }

  async trackProvenancePanelOpen() {
    await this.track('provenance_panel_open');
  }

  async trackUpgradeClick(fromComponent: string, currentTier: string) {
    await this.track('upgrade_click', {
      from_component: fromComponent,
      current_tier: currentTier
    });
  }

  async trackPageLoad(page: string, loadTime: number) {
    await this.track('page_load', {
      page,
      load_time_ms: loadTime,
      is_mobile: this.isMobile()
    });
  }

  async trackAlertQuotaHit(currentUsage: number, limit: number) {
    await this.track('alert_quota_hit', {
      current_usage: currentUsage,
      limit,
      indicates_pro_demand: true
    });
  }

  // Performance metrics
  async trackApiLatency(endpoint: string, latency: number, cacheHit: boolean) {
    await this.track('api_latency', {
      endpoint,
      latency_ms: latency,
      cache_hit: cacheHit
    });
  }

  async trackCircuitBreakerOpen(provider: string) {
    await this.track('circuit_breaker_open', {
      provider
    });
  }

  // Engagement metrics
  async trackTimeOnPage(page: string, timeSpent: number) {
    await this.track('time_on_page', {
      page,
      time_spent_seconds: timeSpent
    });
  }

  async trackFeatureUsage(feature: string, usageCount: number) {
    await this.track('feature_usage', {
      feature,
      usage_count: usageCount
    });
  }

  // Private methods
  private async track(eventType: string, eventData?: Record<string, any>) {
    try {
      if (!this.userId) {
        await this.initializeUser();
      }

      const { error } = await supabase
        .from('product_metrics')
        .insert({
          user_id: this.userId,
          event_type: eventType,
          event_data: eventData || {},
          session_id: this.sessionId
        });

      if (error) {
        console.error('Metrics tracking error:', error);
      }
    } catch (error) {
      console.error('Failed to track metric:', error);
    }
  }

  private isMobile(): boolean {
    return window.innerWidth < 768;
  }

  // Business KPI calculations
  async getActivationRate(days: number = 7): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('product_metrics')
        .select('user_id, event_data')
        .eq('event_type', 'activation')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const activatedUsers = data?.filter(m => m.event_data?.is_activated === true).length || 0;
      const totalUsers = new Set(data?.map(m => m.user_id)).size || 1;

      return (activatedUsers / totalUsers) * 100;
    } catch (error) {
      console.error('Failed to calculate activation rate:', error);
      return 0;
    }
  }

  async getAlertOpenRate(days: number = 7): Promise<number> {
    try {
      const { data: triggered } = await supabase
        .from('product_metrics')
        .select('event_data')
        .eq('event_type', 'alert_triggered')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

      const { data: opened } = await supabase
        .from('product_metrics')
        .select('event_data')
        .eq('event_type', 'alert_opened')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

      const triggeredCount = triggered?.length || 0;
      const openedCount = opened?.length || 0;

      return triggeredCount > 0 ? (openedCount / triggeredCount) * 100 : 0;
    } catch (error) {
      console.error('Failed to calculate alert open rate:', error);
      return 0;
    }
  }

  async getDrilldownClickRate(days: number = 7): Promise<number> {
    try {
      const { data: pageViews } = await supabase
        .from('product_metrics')
        .select('user_id')
        .eq('event_type', 'page_load')
        .eq('event_data->page', 'portfolio')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

      const { data: drilldowns } = await supabase
        .from('product_metrics')
        .select('user_id')
        .eq('event_type', 'drilldown_click')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

      const viewCount = pageViews?.length || 0;
      const drilldownCount = drilldowns?.length || 0;

      return viewCount > 0 ? (drilldownCount / viewCount) * 100 : 0;
    } catch (error) {
      console.error('Failed to calculate drilldown click rate:', error);
      return 0;
    }
  }
}

export const metricsService = new MetricsService();