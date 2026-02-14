/**
 * Telemetry Analytics Service
 * 
 * Provides advanced analytics for V2 deeper telemetry:
 * - MTTS (Mean Time To Safety) calculations
 * - Prevented loss modeling with p50/p95 percentiles
 * - Fix rate and false positive rate tracking
 * - Action funnel analytics
 * 
 * Requirements: 16.3, 16.4, 16.5
 */

import { supabase } from '@/integrations/supabase/client';

export interface MTTSMetrics {
  overall: {
    mean: number;
    median: number;
    p95: number;
    p99: number;
  };
  bySeverity: Record<'critical' | 'high' | 'medium' | 'low', {
    mean: number;
    median: number;
    count: number;
  }>;
  byIssueType: Record<string, {
    mean: number;
    median: number;
    count: number;
  }>;
  unresolvedCount: number;
  totalIssues: number;
}

export interface PreventedLossMetrics {
  total: number;
  p50: number;
  p95: number;
  p99: number;
  byActionType: Record<string, {
    total: number;
    count: number;
    avgConfidence: number;
  }>;
  bySeverity: Record<'critical' | 'high' | 'medium' | 'low', {
    total: number;
    count: number;
  }>;
  timeline: Array<{
    date: string;
    amount: number;
    count: number;
  }>;
}

export interface FixRateMetrics {
  overall: {
    presented: number;
    completed: number;
    dismissed: number;
    fixRate: number;
  };
  bySeverity: Record<'critical' | 'high' | 'medium' | 'low', {
    presented: number;
    completed: number;
    dismissed: number;
    fixRate: number;
  }>;
  byActionType: Record<string, {
    presented: number;
    completed: number;
    fixRate: number;
  }>;
}

export interface FalsePositiveMetrics {
  overall: {
    total: number;
    dismissed: number;
    overridden: number;
    fpRate: number;
  };
  bySeverity: Record<'critical' | 'high' | 'medium' | 'low', {
    total: number;
    dismissed: number;
    overridden: number;
    fpRate: number;
  }>;
  byIssueType: Record<string, {
    total: number;
    dismissed: number;
    fpRate: number;
  }>;
  criticalOverrides: number;
}

export interface ActionFunnelMetrics {
  stages: Record<string, number>;
  conversionRates: Record<string, number>;
  dropoffPoints: Array<{
    from: string;
    to: string;
    rate: number;
  }>;
  avgTimePerStage: Record<string, number>;
  completionRate: number;
}

export interface DashboardMetrics {
  mtts: MTTSMetrics;
  preventedLoss: PreventedLossMetrics;
  fixRate: FixRateMetrics;
  falsePositive: FalsePositiveMetrics;
  actionFunnel: ActionFunnelMetrics;
  period: {
    start: Date;
    end: Date;
    days: number;
  };
}

class TelemetryAnalyticsService {
  /**
   * Calculate MTTS (Mean Time To Safety) metrics
   */
  async calculateMTTS(userId: string, days: number = 30): Promise<MTTSMetrics> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('portfolio_mtts_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('detected_at', startDate.toISOString())
      .order('detected_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch MTTS metrics:', error);
      throw error;
    }

    const resolvedIssues = data.filter(issue => issue.resolved_at && issue.time_to_safety_ms);
    const times = resolvedIssues.map(issue => issue.time_to_safety_ms).sort((a, b) => a - b);

    // Calculate overall metrics
    const overall = {
      mean: times.length > 0 ? times.reduce((sum, t) => sum + t, 0) / times.length : 0,
      median: times.length > 0 ? times[Math.floor(times.length / 2)] : 0,
      p95: times.length > 0 ? times[Math.floor(times.length * 0.95)] : 0,
      p99: times.length > 0 ? times[Math.floor(times.length * 0.99)] : 0,
    };

    // Calculate by severity
    const bySeverity: Record<string, any> = {};
    ['critical', 'high', 'medium', 'low'].forEach(severity => {
      const severityIssues = resolvedIssues.filter(i => i.severity === severity);
      const severityTimes = severityIssues.map(i => i.time_to_safety_ms).sort((a, b) => a - b);
      
      bySeverity[severity] = {
        mean: severityTimes.length > 0 ? severityTimes.reduce((sum, t) => sum + t, 0) / severityTimes.length : 0,
        median: severityTimes.length > 0 ? severityTimes[Math.floor(severityTimes.length / 2)] : 0,
        count: severityIssues.length,
      };
    });

    // Calculate by issue type
    const byIssueType: Record<string, any> = {};
    const issueTypes = [...new Set(resolvedIssues.map(i => i.issue_type))];
    issueTypes.forEach(type => {
      const typeIssues = resolvedIssues.filter(i => i.issue_type === type);
      const typeTimes = typeIssues.map(i => i.time_to_safety_ms).sort((a, b) => a - b);
      
      byIssueType[type] = {
        mean: typeTimes.length > 0 ? typeTimes.reduce((sum, t) => sum + t, 0) / typeTimes.length : 0,
        median: typeTimes.length > 0 ? typeTimes[Math.floor(typeTimes.length / 2)] : 0,
        count: typeIssues.length,
      };
    });

    return {
      overall,
      bySeverity: bySeverity as any,
      byIssueType,
      unresolvedCount: data.length - resolvedIssues.length,
      totalIssues: data.length,
    };
  }

  /**
   * Calculate prevented loss metrics with p50/p95 percentiles
   */
  async calculatePreventedLoss(userId: string, days: number = 30): Promise<PreventedLossMetrics> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('portfolio_prevented_loss_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Failed to fetch prevented loss metrics:', error);
      throw error;
    }

    const amounts = data.map(d => parseFloat(d.prevented_loss_usd.toString())).sort((a, b) => a - b);
    const total = amounts.reduce((sum, a) => sum + a, 0);

    // Calculate percentiles
    const p50 = amounts.length > 0 ? amounts[Math.floor(amounts.length * 0.5)] : 0;
    const p95 = amounts.length > 0 ? amounts[Math.floor(amounts.length * 0.95)] : 0;
    const p99 = amounts.length > 0 ? amounts[Math.floor(amounts.length * 0.99)] : 0;

    // Calculate by action type
    const byActionType: Record<string, any> = {};
    const actionTypes = [...new Set(data.map(d => d.action_type))];
    actionTypes.forEach(type => {
      const typeData = data.filter(d => d.action_type === type);
      const typeTotal = typeData.reduce((sum, d) => sum + parseFloat(d.prevented_loss_usd.toString()), 0);
      const avgConfidence = typeData.reduce((sum, d) => sum + parseFloat(d.confidence.toString()), 0) / typeData.length;
      
      byActionType[type] = {
        total: typeTotal,
        count: typeData.length,
        avgConfidence,
      };
    });

    // Calculate by severity
    const bySeverity: Record<string, any> = {};
    ['critical', 'high', 'medium', 'low'].forEach(severity => {
      const severityData = data.filter(d => d.severity === severity);
      const severityTotal = severityData.reduce((sum, d) => sum + parseFloat(d.prevented_loss_usd.toString()), 0);
      
      bySeverity[severity] = {
        total: severityTotal,
        count: severityData.length,
      };
    });

    // Calculate timeline (daily aggregates)
    const timeline: Array<{ date: string; amount: number; count: number }> = [];
    const dateMap = new Map<string, { amount: number; count: number }>();
    
    data.forEach(d => {
      const date = new Date(d.timestamp).toISOString().split('T')[0];
      const existing = dateMap.get(date) || { amount: 0, count: 0 };
      dateMap.set(date, {
        amount: existing.amount + parseFloat(d.prevented_loss_usd.toString()),
        count: existing.count + 1,
      });
    });

    dateMap.forEach((value, date) => {
      timeline.push({ date, ...value });
    });
    timeline.sort((a, b) => a.date.localeCompare(b.date));

    return {
      total,
      p50,
      p95,
      p99,
      byActionType,
      bySeverity: bySeverity as any,
      timeline,
    };
  }

  /**
   * Calculate fix rate metrics
   */
  async calculateFixRate(userId: string, days: number = 30): Promise<FixRateMetrics> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('portfolio_fix_rate_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString());

    if (error) {
      console.error('Failed to fetch fix rate metrics:', error);
      throw error;
    }

    // Calculate overall metrics
    const presented = data.filter(d => d.presented).length;
    const completed = data.filter(d => d.completed).length;
    const dismissed = data.filter(d => d.dismissed).length;
    const fixRate = presented > 0 ? (completed / presented) * 100 : 0;

    const overall = {
      presented,
      completed,
      dismissed,
      fixRate,
    };

    // Calculate by severity
    const bySeverity: Record<string, any> = {};
    ['critical', 'high', 'medium', 'low'].forEach(severity => {
      const severityData = data.filter(d => d.severity === severity);
      const severityPresented = severityData.filter(d => d.presented).length;
      const severityCompleted = severityData.filter(d => d.completed).length;
      const severityDismissed = severityData.filter(d => d.dismissed).length;
      const severityFixRate = severityPresented > 0 ? (severityCompleted / severityPresented) * 100 : 0;
      
      bySeverity[severity] = {
        presented: severityPresented,
        completed: severityCompleted,
        dismissed: severityDismissed,
        fixRate: severityFixRate,
      };
    });

    // Calculate by action type
    const byActionType: Record<string, any> = {};
    const actionTypes = [...new Set(data.map(d => d.action_type))];
    actionTypes.forEach(type => {
      const typeData = data.filter(d => d.action_type === type);
      const typePresented = typeData.filter(d => d.presented).length;
      const typeCompleted = typeData.filter(d => d.completed).length;
      const typeFixRate = typePresented > 0 ? (typeCompleted / typePresented) * 100 : 0;
      
      byActionType[type] = {
        presented: typePresented,
        completed: typeCompleted,
        fixRate: typeFixRate,
      };
    });

    return {
      overall,
      bySeverity: bySeverity as any,
      byActionType,
    };
  }

  /**
   * Calculate false positive metrics
   */
  async calculateFalsePositiveRate(userId: string, days: number = 30): Promise<FalsePositiveMetrics> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('portfolio_false_positive_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString());

    if (error) {
      console.error('Failed to fetch false positive metrics:', error);
      throw error;
    }

    // Calculate overall metrics
    const total = data.length;
    const dismissed = data.filter(d => d.dismissed).length;
    const overridden = data.filter(d => d.overridden).length;
    const fpRate = total > 0 ? ((dismissed + overridden) / total) * 100 : 0;

    const overall = {
      total,
      dismissed,
      overridden,
      fpRate,
    };

    // Calculate by severity
    const bySeverity: Record<string, any> = {};
    ['critical', 'high', 'medium', 'low'].forEach(severity => {
      const severityData = data.filter(d => d.severity === severity);
      const severityTotal = severityData.length;
      const severityDismissed = severityData.filter(d => d.dismissed).length;
      const severityOverridden = severityData.filter(d => d.overridden).length;
      const severityFpRate = severityTotal > 0 ? ((severityDismissed + severityOverridden) / severityTotal) * 100 : 0;
      
      bySeverity[severity] = {
        total: severityTotal,
        dismissed: severityDismissed,
        overridden: severityOverridden,
        fpRate: severityFpRate,
      };
    });

    // Calculate by issue type
    const byIssueType: Record<string, any> = {};
    const issueTypes = [...new Set(data.map(d => d.issue_type))];
    issueTypes.forEach(type => {
      const typeData = data.filter(d => d.issue_type === type);
      const typeTotal = typeData.length;
      const typeDismissed = typeData.filter(d => d.dismissed).length;
      const typeFpRate = typeTotal > 0 ? (typeDismissed / typeTotal) * 100 : 0;
      
      byIssueType[type] = {
        total: typeTotal,
        dismissed: typeDismissed,
        fpRate: typeFpRate,
      };
    });

    // Count critical overrides (high-risk indicator)
    const criticalOverrides = data.filter(d => d.severity === 'critical' && d.overridden).length;

    return {
      overall,
      bySeverity: bySeverity as any,
      byIssueType,
      criticalOverrides,
    };
  }

  /**
   * Calculate action funnel metrics
   */
  async calculateActionFunnel(userId: string, days: number = 30): Promise<ActionFunnelMetrics> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('portfolio_action_funnel_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Failed to fetch action funnel metrics:', error);
      throw error;
    }

    // Count stages
    const stages: Record<string, number> = {
      card_viewed: 0,
      plan_created: 0,
      simulated: 0,
      signing: 0,
      submitted: 0,
      confirmed: 0,
      failed: 0,
    };

    data.forEach(d => {
      stages[d.stage] = (stages[d.stage] || 0) + 1;
    });

    // Calculate conversion rates between stages
    const stageOrder = ['card_viewed', 'plan_created', 'simulated', 'signing', 'submitted', 'confirmed'];
    const conversionRates: Record<string, number> = {};
    const dropoffPoints: Array<{ from: string; to: string; rate: number }> = [];

    for (let i = 0; i < stageOrder.length - 1; i++) {
      const from = stageOrder[i];
      const to = stageOrder[i + 1];
      const fromCount = stages[from] || 0;
      const toCount = stages[to] || 0;
      
      const rate = fromCount > 0 ? (toCount / fromCount) * 100 : 0;
      conversionRates[`${from}_to_${to}`] = rate;
      
      // Track significant dropoffs (>30% drop)
      if (rate < 70 && fromCount > 0) {
        dropoffPoints.push({ from, to, rate: 100 - rate });
      }
    }

    // Calculate average time per stage
    const avgTimePerStage: Record<string, number> = {};
    const stageTimestamps = new Map<string, Date[]>();
    
    data.forEach(d => {
      const existing = stageTimestamps.get(d.correlation_id) || [];
      existing.push(new Date(d.timestamp));
      stageTimestamps.set(d.correlation_id, existing);
    });

    // Calculate completion rate
    const completionRate = stages.card_viewed > 0 ? (stages.confirmed / stages.card_viewed) * 100 : 0;

    return {
      stages,
      conversionRates,
      dropoffPoints,
      avgTimePerStage,
      completionRate,
    };
  }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(userId: string, days: number = 30): Promise<DashboardMetrics> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const [mtts, preventedLoss, fixRate, falsePositive, actionFunnel] = await Promise.all([
      this.calculateMTTS(userId, days),
      this.calculatePreventedLoss(userId, days),
      this.calculateFixRate(userId, days),
      this.calculateFalsePositiveRate(userId, days),
      this.calculateActionFunnel(userId, days),
    ]);

    return {
      mtts,
      preventedLoss,
      fixRate,
      falsePositive,
      actionFunnel,
      period: {
        start: startDate,
        end: endDate,
        days,
      },
    };
  }
}

export const telemetryAnalytics = new TelemetryAnalyticsService();
