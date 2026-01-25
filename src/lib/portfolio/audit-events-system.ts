/**
 * Portfolio Audit Events System for Requirement 8 Compliance
 * Handles audit event emission, logging, and API endpoints
 * Requirements: 8.1, 8.4, 15.2
 */

import { auditTrailService, type AuditEvent } from './audit-trail-system';

export interface AuditEventEmissionConfig {
  enablePayloadMismatchBlock: boolean;
  enablePolicyBlock: boolean;
  enableSimulationFailover: boolean;
  enableOverrideUnsafe: boolean;
  enableMEVModeUsed: boolean;
  enableCrossWalletGuard: boolean;
}

export interface AuditEventFilter {
  user_id?: string;
  plan_id?: string;
  severity?: AuditEvent['severity'];
  event_type?: AuditEvent['event_type'];
  wallet_address?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Audit Events Emission Service
 * Emits specific audit events for portfolio operations
 */
export class AuditEventsEmissionService {
  private config: AuditEventEmissionConfig;
  private auditTrailService: typeof auditTrailService;

  constructor(
    config: Partial<AuditEventEmissionConfig> = {},
    auditTrailServiceInstance: typeof auditTrailService = auditTrailService
  ) {
    this.config = {
      enablePayloadMismatchBlock: true,
      enablePolicyBlock: true,
      enableSimulationFailover: true,
      enableOverrideUnsafe: true,
      enableMEVModeUsed: true,
      enableCrossWalletGuard: true,
      ...config,
    };
    this.auditTrailService = auditTrailServiceInstance;
  }

  /**
   * Emit payload mismatch block event
   * Requirement 8.1: Log when execution payload differs from simulation
   */
  async emitPayloadMismatchBlock(
    userId: string,
    planId: string,
    stepId: string,
    walletScope: AuditEvent['wallet_scope'],
    expectedPayload: string,
    actualPayload: string,
    mismatchDetails: {
      targetContract?: string;
      calldataClass?: string;
      assetDeltaVariance?: number;
      detectedReason: string;
    }
  ): Promise<void> {
    if (!this.config.enablePayloadMismatchBlock) return;

    await this.auditTrailService.logPayloadMismatchBlock(
      userId,
      planId,
      stepId,
      walletScope,
      expectedPayload,
      actualPayload,
      `${mismatchDetails.detectedReason}. Target: ${mismatchDetails.targetContract || 'unknown'}, Variance: ${mismatchDetails.assetDeltaVariance || 0}%`
    );
  }

  /**
   * Emit policy block event
   * Requirement 8.1: Log when policy engine blocks execution
   */
  async emitPolicyBlock(
    userId: string,
    planId: string,
    walletScope: AuditEvent['wallet_scope'],
    policyViolations: string[],
    policyDetails: {
      maxGasUsdExceeded?: boolean;
      newContractBlocked?: boolean;
      infiniteApprovalBlocked?: boolean;
      simulationRequired?: boolean;
      confidenceThresholdFailed?: boolean;
      customReason?: string;
    }
  ): Promise<void> {
    if (!this.config.enablePolicyBlock) return;

    const blockedReason = this.formatPolicyBlockReason(policyDetails);
    
    await this.auditTrailService.logPolicyBlock(
      userId,
      planId,
      walletScope,
      policyViolations,
      blockedReason
    );
  }

  /**
   * Emit simulation failover event
   * Requirement 8.1: Log when primary simulator fails and fallback is used
   */
  async emitSimulationFailover(
    userId: string,
    planId: string,
    walletScope: AuditEvent['wallet_scope'],
    failoverDetails: {
      originalSimulator: string;
      fallbackSimulator: string;
      failureReason: string;
      confidenceImpact?: number;
      retryAttempts?: number;
    }
  ): Promise<void> {
    if (!this.config.enableSimulationFailover) return;

    const reason = `${failoverDetails.failureReason}. Retries: ${failoverDetails.retryAttempts || 0}, Confidence impact: ${failoverDetails.confidenceImpact || 0}%`;
    
    await this.auditTrailService.logSimulationFailover(
      userId,
      planId,
      walletScope,
      failoverDetails.originalSimulator,
      failoverDetails.fallbackSimulator,
      reason
    );
  }

  /**
   * Emit override unsafe event
   * Requirement 8.1: Log when user overrides safety warnings
   */
  async emitOverrideUnsafe(
    userId: string,
    planId: string,
    walletScope: AuditEvent['wallet_scope'],
    overrideDetails: {
      riskLevel: 'medium' | 'high' | 'critical';
      overrideReason: string;
      warningsIgnored: string[];
      userConfirmation: boolean;
      additionalContext?: string;
    }
  ): Promise<void> {
    if (!this.config.enableOverrideUnsafe) return;

    const reason = `${overrideDetails.overrideReason}. Warnings ignored: ${overrideDetails.warningsIgnored.join(', ')}. Confirmed: ${overrideDetails.userConfirmation}. ${overrideDetails.additionalContext || ''}`;
    
    await this.auditTrailService.logUnsafeOverride(
      userId,
      planId,
      walletScope,
      reason,
      overrideDetails.riskLevel
    );
  }

  /**
   * Emit MEV mode used event
   * Requirement 8.1: Log when MEV protection is enabled
   */
  async emitMEVModeUsed(
    userId: string,
    planId: string,
    walletScope: AuditEvent['wallet_scope'],
    mevDetails: {
      protectionType: string;
      additionalCostUsd: number;
      provider?: string;
      estimatedSavingsUsd?: number;
      bundleId?: string;
    }
  ): Promise<void> {
    if (!this.config.enableMEVModeUsed) return;

    await this.auditTrailService.logMEVModeUsed(
      userId,
      planId,
      walletScope,
      `${mevDetails.protectionType} via ${mevDetails.provider || 'unknown'}. Bundle: ${mevDetails.bundleId || 'N/A'}. Estimated savings: $${mevDetails.estimatedSavingsUsd || 0}`,
      mevDetails.additionalCostUsd
    );
  }

  /**
   * Emit cross-wallet guard trigger event
   * Requirement 8.1: Log when cross-wallet security rules trigger
   */
  async emitCrossWalletGuard(
    userId: string,
    planId: string,
    walletScope: AuditEvent['wallet_scope'],
    guardDetails: {
      triggeredRule: string;
      affectedWallets: string[];
      riskAssessment: string;
      actionTaken: 'blocked' | 'warned' | 'allowed_with_conditions';
      conditions?: string[];
    }
  ): Promise<void> {
    if (!this.config.enableCrossWalletGuard) return;

    await this.auditTrailService.logCrossWalletGuard(
      userId,
      planId,
      walletScope,
      `${guardDetails.triggeredRule}. Risk: ${guardDetails.riskAssessment}. Action: ${guardDetails.actionTaken}. Conditions: ${guardDetails.conditions?.join(', ') || 'none'}`,
      guardDetails.affectedWallets
    );
  }

  private formatPolicyBlockReason(details: {
    maxGasUsdExceeded?: boolean;
    newContractBlocked?: boolean;
    infiniteApprovalBlocked?: boolean;
    simulationRequired?: boolean;
    confidenceThresholdFailed?: boolean;
    customReason?: string;
  }): string {
    const reasons: string[] = [];
    
    if (details.maxGasUsdExceeded) reasons.push('Max gas USD exceeded');
    if (details.newContractBlocked) reasons.push('New contract blocked');
    if (details.infiniteApprovalBlocked) reasons.push('Infinite approval blocked');
    if (details.simulationRequired) reasons.push('Simulation required');
    if (details.confidenceThresholdFailed) reasons.push('Confidence threshold failed');
    if (details.customReason) reasons.push(details.customReason);
    
    return reasons.length > 0 ? reasons.join('; ') : 'Policy violation';
  }
}

/**
 * Audit Event Querying Service
 * Provides filtering and querying capabilities for audit events
 */
export class AuditEventQueryService {
  /**
   * Query audit events with advanced filtering
   */
  async queryAuditEvents(
    filter: AuditEventFilter,
    pagination: {
      limit?: number;
      cursor?: string;
    } = {}
  ): Promise<{
    events: AuditEvent[];
    nextCursor?: string;
    totalCount: number;
    summary: {
      criticalCount: number;
      errorCount: number;
      warningCount: number;
      infoCount: number;
    };
  }> {
    const result = await auditTrailService.queryAuditEvents({
      ...filter,
      ...pagination,
    });

    // Calculate summary
    const summary = {
      criticalCount: result.events.filter(e => e.severity === 'critical').length,
      errorCount: result.events.filter(e => e.severity === 'error').length,
      warningCount: result.events.filter(e => e.severity === 'warning').length,
      infoCount: result.events.filter(e => e.severity === 'info').length,
    };

    return {
      ...result,
      summary,
    };
  }

  /**
   * Get audit events by severity
   */
  async getEventsBySeverity(
    userId: string,
    severity: AuditEvent['severity'],
    limit = 50
  ): Promise<AuditEvent[]> {
    const result = await auditTrailService.queryAuditEvents({
      user_id: userId,
      severity,
      limit,
    });
    
    return result.events;
  }

  /**
   * Get audit events by plan
   */
  async getEventsByPlan(planId: string): Promise<AuditEvent[]> {
    return await auditTrailService.getPlanAuditTrail(planId);
  }

  /**
   * Get recent critical events
   */
  async getRecentCriticalEvents(userId: string, hours = 24): Promise<AuditEvent[]> {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    const result = await auditTrailService.queryAuditEvents({
      user_id: userId,
      severity: 'critical',
      start_date: startDate,
      limit: 100,
    });
    
    return result.events;
  }

  /**
   * Generate audit event statistics
   */
  async generateEventStatistics(
    userId: string,
    timeRange: {
      startDate: string;
      endDate: string;
    }
  ): Promise<{
    totalEvents: number;
    eventsBySeverity: Record<string, number>;
    eventsByType: Record<string, number>;
    criticalEventTrend: Array<{
      date: string;
      count: number;
    }>;
    topPolicyViolations: Array<{
      violation: string;
      count: number;
    }>;
  }> {
    const summary = await auditTrailService.generateAuditSummary(
      userId,
      timeRange.startDate,
      timeRange.endDate
    );

    // Get all events for detailed analysis
    const result = await auditTrailService.queryAuditEvents({
      user_id: userId,
      start_date: timeRange.startDate,
      end_date: timeRange.endDate,
    });

    // Analyze critical event trend (daily)
    const criticalEvents = result.events.filter(e => e.severity === 'critical');
    const criticalEventTrend = this.calculateDailyTrend(criticalEvents, timeRange);

    // Analyze top policy violations
    const policyEvents = result.events.filter(e => e.event_type === 'policy_block');
    const topPolicyViolations = this.calculateTopPolicyViolations(policyEvents);

    return {
      totalEvents: summary.totalEvents,
      eventsBySeverity: summary.eventsBySeverity,
      eventsByType: summary.eventsByType,
      criticalEventTrend,
      topPolicyViolations,
    };
  }

  private calculateDailyTrend(
    events: AuditEvent[],
    timeRange: { startDate: string; endDate: string }
  ): Array<{ date: string; count: number }> {
    const start = new Date(timeRange.startDate);
    const end = new Date(timeRange.endDate);
    const trend: Array<{ date: string; count: number }> = [];

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const count = events.filter(e => e.created_at.startsWith(dateStr)).length;
      trend.push({ date: dateStr, count });
    }

    return trend;
  }

  private calculateTopPolicyViolations(
    policyEvents: AuditEvent[]
  ): Array<{ violation: string; count: number }> {
    const violationCounts: Record<string, number> = {};

    policyEvents.forEach(event => {
      const violations = event.metadata.policy_violations as string[] || [];
      violations.forEach(violation => {
        violationCounts[violation] = (violationCounts[violation] || 0) + 1;
      });
    });

    return Object.entries(violationCounts)
      .map(([violation, count]) => ({ violation, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}

// Singleton instances
export const auditEventsEmissionService = new AuditEventsEmissionService();
export const auditEventQueryService = new AuditEventQueryService();