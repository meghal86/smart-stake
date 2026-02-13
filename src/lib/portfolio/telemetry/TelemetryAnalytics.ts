/**
 * V2 Deeper Telemetry Analytics
 * 
 * Implements advanced telemetry metrics for portfolio system:
 * - MTTS (Mean Time To Safety) calculation
 * - Prevented loss modeling at p50/p95 percentiles
 * - Fix rate and false positive rate tracking
 * - Action funnel analytics
 * 
 * Requirements: 16.3, 16.4, 16.5
 */

import { supabase } from '@/integrations/supabase/client';

export interface MTTSMetric {
  issueId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  detectedAt: Date;
  resolvedAt: Date | null;
  timeToSafetyMs: number | null;
  userId: string;
  issueType: 'approval_risk' | 'policy_violation' | 'simulation_failure' | 'security_warning';
}

export interface PreventedLossMetric {
  userId: string;
  actionId: string;
  actionType: 'revoke_approval' | 'reject_transaction' | 'policy_block' | 'simulation_block';
  preventedLossUsd: number;
  confidence: number;
  timestamp: Date;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface FixRateMetric {
  userId: string;
  actionId: string;
  actionType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  presented: boolean;
  completed: boolean;
  dismissed: boolean;
  timestamp: Date;
}

export interface FalsePositiveMetric {
  userId: string;
  issueId: string;
  issueType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  dismissed: boolean;
  overridden: boolean;
  feedback: string | null;
  timestamp: Date;
}

export interface ActionFunnelMetric {
  userId: string;
  actionId: string;
  correlationId: string;
  stage: 'card_viewed' | 'plan_created' | 'simulated' | 'signing' | 'submitted' | 'confirmed' | 'failed';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface TelemetryStats {
  mtts: {
    overall: number;
    bySeverity: Record<string, number>;
    byIssueType: Record<string, number>;
  };
  preventedLoss: {
    p50: number;
    p95: number;
    total: number;
    byActionType: Record<string, { p50: number; p95: number; total: number }>;
  };
  fixRate: {
    overall: number;
    bySeverity: Record<string, number>;
    byActionType: Record<string, number>;
  };
  falsePositiveRate: {
    overall: number;
    bySeverity: Record<string, number>;
    byIssueType: Record<string, number>;
  };
  actionFunnel: {
    stages: Record<string, number>;
    conversionRates: Record<string, number>;
    dropoffPoints: Array<{ from: string; to: string; rate: number }>;
  };
}

export class TelemetryAnalytics {
  /**
   * Calculate Mean Time To Safety (MTTS) for critical issues
   * 
   * MTTS measures how quickly users resolve security issues after detection.
   * Lower MTTS indicates better user responsiveness to security threats.
   */
  async calculateMTTS(
    userId?: string,
    timeRangeDays: number = 30,
    severity?: 'critical' | 'high' | 'medium' | 'low'
  ): Promise<{ overall: number; bySeverity: Record<string, number>; byIssueType: Record<string, number> }> {
    try {
      const startDate = new Date(Date.now() - timeRangeDays * 24 * 60 * 60 * 1000);

      let query = supabase
        .from('portfolio_mtts_metrics')
        .select('*')
        .gte('detected_at', startDate.toISOString())
        .not('resolved_at', 'is', null);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (severity) {
        query = query.eq('severity', severity);
      }

      const { data, error } = await query;

      if (error) throw error;

      const metrics = (data || []) as MTTSMetric[];

      // Calculate overall MTTS
      const timeToSafetyValues = metrics
        .filter(m => m.timeToSafetyMs !== null)
        .map(m => m.timeToSafetyMs as number);

      const overall = timeToSafetyValues.length > 0
        ? timeToSafetyValues.reduce((sum, val) => sum + val, 0) / timeToSafetyValues.length
        : 0;

      // Calculate MTTS by severity
      const bySeverity: Record<string, number> = {};
      ['critical', 'high', 'medium', 'low'].forEach(sev => {
        const severityMetrics = metrics.filter(m => m.severity === sev && m.timeToSafetyMs !== null);
        const severityValues = severityMetrics.map(m => m.timeToSafetyMs as number);
        bySeverity[sev] = severityValues.length > 0
          ? severityValues.reduce((sum, val) => sum + val, 0) / severityValues.length
          : 0;
      });

      // Calculate MTTS by issue type
      const byIssueType: Record<string, number> = {};
      const issueTypes = [...new Set(metrics.map(m => m.issueType))];
      issueTypes.forEach(type => {
        const typeMetrics = metrics.filter(m => m.issueType === type && m.timeToSafetyMs !== null);
        const typeValues = typeMetrics.map(m => m.timeToSafetyMs as number);
        byIssueType[type] = typeValues.length > 0
          ? typeValues.reduce((sum, val) => sum + val, 0) / typeValues.length
          : 0;
      });

      return { overall, bySeverity, byIssueType };
    } catch (error) {
      console.error('Failed to calculate MTTS:', error);
      return { overall: 0, bySeverity: {}, byIssueType: {} };
    }
  }

  /**
   * Track prevented loss at p50 and p95 percentiles
   * 
   * Measures the dollar value of losses prevented by the system's security features.
   * Provides statistical distribution to understand typical vs extreme prevented losses.
   */
  async calculatePreventedLoss(
    userId?: string,
    timeRangeDays: number = 30
  ): Promise<{
    p50: number;
    p95: number;
    total: number;
    byActionType: Record<string, { p50: number; p95: number; total: number }>;
  }> {
    try {
      const startDate = new Date(Date.now() - timeRangeDays * 24 * 60 * 60 * 1000);

      let query = supabase
        .from('portfolio_prevented_loss_metrics')
        .select('*')
        .gte('timestamp', startDate.toISOString());

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const metrics = (data || []) as PreventedLossMetric[];

      // Calculate overall percentiles
      const lossValues = metrics.map(m => m.preventedLossUsd).sort((a, b) => a - b);
      const p50 = this.calculatePercentile(lossValues, 50);
      const p95 = this.calculatePercentile(lossValues, 95);
      const total = lossValues.reduce((sum, val) => sum + val, 0);

      // Calculate by action type
      const byActionType: Record<string, { p50: number; p95: number; total: number }> = {};
      const actionTypes = [...new Set(metrics.map(m => m.actionType))];

      actionTypes.forEach(type => {
        const typeMetrics = metrics.filter(m => m.actionType === type);
        const typeValues = typeMetrics.map(m => m.preventedLossUsd).sort((a, b) => a - b);
        byActionType[type] = {
          p50: this.calculatePercentile(typeValues, 50),
          p95: this.calculatePercentile(typeValues, 95),
          total: typeValues.reduce((sum, val) => sum + val, 0)
        };
      });

      return { p50, p95, total, byActionType };
    } catch (error) {
      console.error('Failed to calculate prevented loss:', error);
      return { p50: 0, p95: 0, total: 0, byActionType: {} };
    }
  }

  /**
   * Calculate fix rate (actions completed) and false positive rate
   * 
   * Fix rate: percentage of recommended actions that users complete
   * False positive rate: percentage of critical alerts that users dismiss/override
   */
  async calculateFixAndFPRates(
    userId?: string,
    timeRangeDays: number = 30
  ): Promise<{
    fixRate: { overall: number; bySeverity: Record<string, number>; byActionType: Record<string, number> };
    falsePositiveRate: { overall: number; bySeverity: Record<string, number>; byIssueType: Record<string, number> };
  }> {
    try {
      const startDate = new Date(Date.now() - timeRangeDays * 24 * 60 * 60 * 1000);

      // Calculate fix rate
      let fixQuery = supabase
        .from('portfolio_fix_rate_metrics')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .eq('presented', true);

      if (userId) {
        fixQuery = fixQuery.eq('user_id', userId);
      }

      const { data: fixData, error: fixError } = await fixQuery;
      if (fixError) throw fixError;

      const fixMetrics = (fixData || []) as FixRateMetric[];

      const completedCount = fixMetrics.filter(m => m.completed).length;
      const presentedCount = fixMetrics.length;
      const overallFixRate = presentedCount > 0 ? (completedCount / presentedCount) * 100 : 0;

      // Fix rate by severity
      const fixRateBySeverity: Record<string, number> = {};
      ['critical', 'high', 'medium', 'low'].forEach(sev => {
        const sevMetrics = fixMetrics.filter(m => m.severity === sev);
        const sevCompleted = sevMetrics.filter(m => m.completed).length;
        fixRateBySeverity[sev] = sevMetrics.length > 0 ? (sevCompleted / sevMetrics.length) * 100 : 0;
      });

      // Fix rate by action type
      const fixRateByActionType: Record<string, number> = {};
      const actionTypes = [...new Set(fixMetrics.map(m => m.actionType))];
      actionTypes.forEach(type => {
        const typeMetrics = fixMetrics.filter(m => m.actionType === type);
        const typeCompleted = typeMetrics.filter(m => m.completed).length;
        fixRateByActionType[type] = typeMetrics.length > 0 ? (typeCompleted / typeMetrics.length) * 100 : 0;
      });

      // Calculate false positive rate
      let fpQuery = supabase
        .from('portfolio_false_positive_metrics')
        .select('*')
        .gte('timestamp', startDate.toISOString());

      if (userId) {
        fpQuery = fpQuery.eq('user_id', userId);
      }

      const { data: fpData, error: fpError } = await fpQuery;
      if (fpError) throw fpError;

      const fpMetrics = (fpData || []) as FalsePositiveMetric[];

      const criticalMetrics = fpMetrics.filter(m => m.severity === 'critical');
      const dismissedOrOverridden = criticalMetrics.filter(m => m.dismissed || m.overridden).length;
      const overallFPRate = criticalMetrics.length > 0 ? (dismissedOrOverridden / criticalMetrics.length) * 100 : 0;

      // FP rate by severity
      const fpRateBySeverity: Record<string, number> = {};
      ['critical', 'high', 'medium', 'low'].forEach(sev => {
        const sevMetrics = fpMetrics.filter(m => m.severity === sev);
        const sevDismissed = sevMetrics.filter(m => m.dismissed || m.overridden).length;
        fpRateBySeverity[sev] = sevMetrics.length > 0 ? (sevDismissed / sevMetrics.length) * 100 : 0;
      });

      // FP rate by issue type
      const fpRateByIssueType: Record<string, number> = {};
      const issueTypes = [...new Set(fpMetrics.map(m => m.issueType))];
      issueTypes.forEach(type => {
        const typeMetrics = fpMetrics.filter(m => m.issueType === type);
        const typeDismissed = typeMetrics.filter(m => m.dismissed || m.overridden).length;
        fpRateByIssueType[type] = typeMetrics.length > 0 ? (typeDismissed / typeMetrics.length) * 100 : 0;
      });

      return {
        fixRate: {
          overall: overallFixRate,
          bySeverity: fixRateBySeverity,
          byActionType: fixRateByActionType
        },
        falsePositiveRate: {
          overall: overallFPRate,
          bySeverity: fpRateBySeverity,
          byIssueType: fpRateByIssueType
        }
      };
    } catch (error) {
      console.error('Failed to calculate fix and FP rates:', error);
      return {
        fixRate: { overall: 0, bySeverity: {}, byActionType: {} },
        falsePositiveRate: { overall: 0, bySeverity: {}, byIssueType: {} }
      };
    }
  }

  /**
   * Track action funnel from card → plan → simulate → sign → confirm
   * 
   * Analyzes user journey through the action execution flow to identify
   * drop-off points and optimize conversion rates.
   */
  async calculateActionFunnel(
    userId?: string,
    timeRangeDays: number = 30
  ): Promise<{
    stages: Record<string, number>;
    conversionRates: Record<string, number>;
    dropoffPoints: Array<{ from: string; to: string; rate: number }>;
  }> {
    try {
      const startDate = new Date(Date.now() - timeRangeDays * 24 * 60 * 60 * 1000);

      let query = supabase
        .from('portfolio_action_funnel_metrics')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: true });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const metrics = (data || []) as ActionFunnelMetric[];

      // Count events by stage
      const stages: Record<string, number> = {
        card_viewed: 0,
        plan_created: 0,
        simulated: 0,
        signing: 0,
        submitted: 0,
        confirmed: 0,
        failed: 0
      };

      metrics.forEach(m => {
        if (stages[m.stage] !== undefined) {
          stages[m.stage]++;
        }
      });

      // Calculate conversion rates between stages
      const stageOrder = ['card_viewed', 'plan_created', 'simulated', 'signing', 'submitted', 'confirmed'];
      const conversionRates: Record<string, number> = {};
      const dropoffPoints: Array<{ from: string; to: string; rate: number }> = [];

      for (let i = 0; i < stageOrder.length - 1; i++) {
        const fromStage = stageOrder[i];
        const toStage = stageOrder[i + 1];
        const fromCount = stages[fromStage];
        const toCount = stages[toStage];

        if (fromCount > 0) {
          const conversionRate = (toCount / fromCount) * 100;
          const dropoffRate = 100 - conversionRate;
          conversionRates[`${fromStage}_to_${toStage}`] = conversionRate;

          if (dropoffRate > 20) { // Significant drop-off threshold
            dropoffPoints.push({
              from: fromStage,
              to: toStage,
              rate: dropoffRate
            });
          }
        }
      }

      return { stages, conversionRates, dropoffPoints };
    } catch (error) {
      console.error('Failed to calculate action funnel:', error);
      return { stages: {}, conversionRates: {}, dropoffPoints: [] };
    }
  }

  /**
   * Get comprehensive telemetry statistics
   */
  async getComprehensiveStats(
    userId?: string,
    timeRangeDays: number = 30
  ): Promise<TelemetryStats> {
    const [mtts, preventedLoss, { fixRate, falsePositiveRate }, actionFunnel] = await Promise.all([
      this.calculateMTTS(userId, timeRangeDays),
      this.calculatePreventedLoss(userId, timeRangeDays),
      this.calculateFixAndFPRates(userId, timeRangeDays),
      this.calculateActionFunnel(userId, timeRangeDays)
    ]);

    return {
      mtts,
      preventedLoss,
      fixRate,
      falsePositiveRate,
      actionFunnel
    };
  }

  /**
   * Helper: Calculate percentile from sorted array
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    if (sortedValues.length === 1) return sortedValues[0];

    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }
}

export const telemetryAnalytics = new TelemetryAnalytics();
