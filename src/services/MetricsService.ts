import { supabase } from '@/integrations/supabase/client';

export interface MetricEvent {
  eventType: string;
  eventData?: Record<string, unknown>;
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

  // Portfolio-specific metrics (Requirements: 16.1, 16.2 - minimal V1)
  async trackPortfolioSnapshotLoaded(
    cacheHit: boolean,
    latencyMs: number,
    walletScope: 'active_wallet' | 'all_wallets',
    correlationId?: string
  ) {
    await this.track('portfolio_snapshot_loaded', {
      cache_hit: cacheHit,
      latency_ms: latencyMs,
      wallet_scope: walletScope,
      correlation_id: correlationId || this.sessionId
    });
  }

  async trackPlanCreated(
    planId: string,
    intent: string,
    walletScope: 'active_wallet' | 'all_wallets',
    correlationId?: string
  ) {
    await this.track('plan_created', {
      plan_id: planId,
      intent,
      wallet_scope: walletScope,
      correlation_id: correlationId || this.sessionId
    });
  }

  async trackPlanSimulated(
    planId: string,
    receiptId: string,
    status: 'pass' | 'warn' | 'block',
    latencyMs: number,
    correlationId?: string
  ) {
    await this.track('plan_simulated', {
      plan_id: planId,
      receipt_id: receiptId,
      status,
      latency_ms: latencyMs,
      correlation_id: correlationId || this.sessionId
    });
  }

  async trackStepConfirmed(
    planId: string,
    stepId: string,
    chainId: number,
    txHash?: string,
    correlationId?: string
  ) {
    await this.track('step_confirmed', {
      plan_id: planId,
      step_id: stepId,
      chain_id: chainId,
      tx_hash: txHash,
      correlation_id: correlationId || this.sessionId
    });
  }

  async trackStepFailed(
    planId: string,
    stepId: string,
    chainId: number,
    errorReason: string,
    correlationId?: string
  ) {
    await this.track('step_failed', {
      plan_id: planId,
      step_id: stepId,
      chain_id: chainId,
      error_reason: errorReason,
      correlation_id: correlationId || this.sessionId
    });
  }

  // SSE connection stability tracking
  async trackSSEReconnect(
    reason: string,
    reconnectCount: number,
    correlationId?: string
  ) {
    await this.track('sse_reconnect', {
      reason,
      reconnect_count: reconnectCount,
      correlation_id: correlationId || this.sessionId
    });
  }

  // V2 Deeper Telemetry Methods (Requirements: 16.3, 16.4, 16.5)

  /**
   * Track MTTS (Mean Time To Safety) metric
   * Records when a security issue is detected and resolved
   */
  async trackMTTSIssue(
    issueId: string,
    severity: 'critical' | 'high' | 'medium' | 'low',
    issueType: 'approval_risk' | 'policy_violation' | 'simulation_failure' | 'security_warning',
    detectedAt: Date,
    resolvedAt?: Date
  ) {
    const timeToSafetyMs = resolvedAt ? resolvedAt.getTime() - detectedAt.getTime() : null;

    await this.track('mtts_issue', {
      issue_id: issueId,
      severity,
      issue_type: issueType,
      detected_at: detectedAt.toISOString(),
      resolved_at: resolvedAt?.toISOString() || null,
      time_to_safety_ms: timeToSafetyMs
    });

    // Also insert into dedicated MTTS metrics table
    try {
      await supabase.from('portfolio_mtts_metrics').insert({
        issue_id: issueId,
        user_id: this.userId,
        severity,
        issue_type: issueType,
        detected_at: detectedAt.toISOString(),
        resolved_at: resolvedAt?.toISOString() || null,
        time_to_safety_ms: timeToSafetyMs
      });
    } catch (error) {
      console.error('Failed to insert MTTS metric:', error);
    }
  }

  /**
   * Track prevented loss metric
   * Records dollar value of losses prevented by security features
   */
  async trackPreventedLoss(
    actionId: string,
    actionType: 'revoke_approval' | 'reject_transaction' | 'policy_block' | 'simulation_block',
    preventedLossUsd: number,
    confidence: number,
    severity: 'critical' | 'high' | 'medium' | 'low'
  ) {
    await this.track('prevented_loss', {
      action_id: actionId,
      action_type: actionType,
      prevented_loss_usd: preventedLossUsd,
      confidence,
      severity
    });

    // Also insert into dedicated prevented loss metrics table
    try {
      await supabase.from('portfolio_prevented_loss_metrics').insert({
        user_id: this.userId,
        action_id: actionId,
        action_type: actionType,
        prevented_loss_usd: preventedLossUsd,
        confidence,
        severity,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to insert prevented loss metric:', error);
    }
  }

  /**
   * Track fix rate metric
   * Records whether recommended actions are completed or dismissed
   */
  async trackActionFixRate(
    actionId: string,
    actionType: string,
    severity: 'critical' | 'high' | 'medium' | 'low',
    presented: boolean,
    completed: boolean,
    dismissed: boolean
  ) {
    await this.track('action_fix_rate', {
      action_id: actionId,
      action_type: actionType,
      severity,
      presented,
      completed,
      dismissed
    });

    // Also insert into dedicated fix rate metrics table
    try {
      await supabase.from('portfolio_fix_rate_metrics').insert({
        user_id: this.userId,
        action_id: actionId,
        action_type: actionType,
        severity,
        presented,
        completed,
        dismissed,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to insert fix rate metric:', error);
    }
  }

  /**
   * Track false positive metric
   * Records when users dismiss or override critical alerts
   */
  async trackFalsePositive(
    issueId: string,
    issueType: string,
    severity: 'critical' | 'high' | 'medium' | 'low',
    dismissed: boolean,
    overridden: boolean,
    feedback?: string
  ) {
    await this.track('false_positive', {
      issue_id: issueId,
      issue_type: issueType,
      severity,
      dismissed,
      overridden,
      feedback: feedback || null
    });

    // Also insert into dedicated false positive metrics table
    try {
      await supabase.from('portfolio_false_positive_metrics').insert({
        user_id: this.userId,
        issue_id: issueId,
        issue_type: issueType,
        severity,
        dismissed,
        overridden,
        feedback: feedback || null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to insert false positive metric:', error);
    }
  }

  /**
   * Track action funnel stage
   * Records user progression through action execution flow
   */
  async trackActionFunnelStage(
    actionId: string,
    stage: 'card_viewed' | 'plan_created' | 'simulated' | 'signing' | 'submitted' | 'confirmed' | 'failed',
    correlationId?: string,
    metadata?: Record<string, unknown>
  ) {
    await this.track('action_funnel_stage', {
      action_id: actionId,
      stage,
      correlation_id: correlationId || this.sessionId,
      metadata: metadata || {}
    });

    // Also insert into dedicated action funnel metrics table
    try {
      await supabase.from('portfolio_action_funnel_metrics').insert({
        user_id: this.userId,
        action_id: actionId,
        correlation_id: correlationId || this.sessionId,
        stage,
        timestamp: new Date().toISOString(),
        metadata: metadata || {}
      });
    } catch (error) {
      console.error('Failed to insert action funnel metric:', error);
    }
  }

  /**
   * Track action card viewed (funnel entry point)
   */
  async trackActionCardViewed(actionId: string, severity: string, correlationId?: string) {
    await this.trackActionFunnelStage(actionId, 'card_viewed', correlationId, { severity });
  }

  /**
   * Track plan execute clicked (funnel progression)
   */
  async trackPlanExecuteClicked(planId: string, correlationId?: string) {
    await this.track('plan_execute_clicked', {
      plan_id: planId,
      correlation_id: correlationId || this.sessionId
    });
  }

  /**
   * Track override unsafe clicked (false positive indicator)
   */
  async trackOverrideUnsafeClicked(reasonCode: string, issueId: string, correlationId?: string) {
    await this.track('override_unsafe_clicked', {
      reason_code: reasonCode,
      issue_id: issueId,
      correlation_id: correlationId || this.sessionId
    });
  }

  // Private methods
  private async track(eventType: string, eventData?: Record<string, unknown>) {
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