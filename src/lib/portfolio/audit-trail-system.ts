/**
 * Portfolio Audit Trail System
 * Handles audit logging, event tracking, and trail querying
 * Requirements: 8.4
 */

export interface AuditEvent {
  id: string;
  user_id: string;
  wallet_scope: {
    mode: 'active_wallet' | 'all_wallets';
    address?: string;
  };
  event_type: 'plan_created' | 'plan_executed' | 'step_executed' | 'policy_block' | 'simulation_failover' | 'override_unsafe' | 'mev_mode_used' | 'cross_wallet_guard' | 'payload_mismatch_block';
  severity: 'info' | 'warning' | 'error' | 'critical';
  plan_id?: string;
  step_id?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SimulationReceipt {
  id: string;
  plan_id: string;
  simulation_status: 'pass' | 'warn' | 'block';
  asset_deltas: Array<{
    token: string;
    amount: number;
    valueUsd?: number;
  }>;
  permission_deltas: Array<{
    type: 'approve' | 'revoke';
    token: string;
    spender: string;
    amount: string;
  }>;
  gas_estimate_usd: number;
  warnings: string[];
  confidence: number;
  created_at: string;
}

export interface PlannedVsExecutedReceipt {
  plan_id: string;
  planned_simulation: SimulationReceipt;
  executed_results: Array<{
    step_id: string;
    transaction_hash?: string;
    block_number?: number;
    gas_used?: number;
    status: 'confirmed' | 'failed';
    actual_deltas?: any;
  }>;
  variance_analysis: {
    gas_variance_percent: number;
    asset_delta_variance: Array<{
      token: string;
      planned_amount: number;
      actual_amount: number;
      variance_percent: number;
    }>;
    unexpected_effects: string[];
  };
  created_at: string;
}

export interface AuditQueryOptions {
  user_id?: string;
  plan_id?: string;
  severity?: AuditEvent['severity'];
  event_type?: AuditEvent['event_type'];
  wallet_address?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  cursor?: string;
}

/**
 * Audit Trail Service
 */
export class AuditTrailService {
  private events: AuditEvent[] = [];
  private receipts: PlannedVsExecutedReceipt[] = [];

  /**
   * Log a plan creation event
   */
  async logPlanCreation(
    userId: string,
    planId: string,
    walletScope: AuditEvent['wallet_scope'],
    intent: string,
    stepCount: number
  ): Promise<void> {
    const event: AuditEvent = {
      id: this.generateId(),
      user_id: userId,
      wallet_scope: walletScope,
      event_type: 'plan_created',
      severity: 'info',
      plan_id: planId,
      metadata: {
        intent,
        step_count: stepCount,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    };

    this.events.push(event);
  }

  /**
   * Log a plan execution event
   */
  async logPlanExecution(
    userId: string,
    planId: string,
    walletScope: AuditEvent['wallet_scope'],
    executionStatus: 'started' | 'completed' | 'failed' | 'partial',
    executedSteps: number,
    totalSteps: number
  ): Promise<void> {
    const severity = executionStatus === 'failed' ? 'error' : 
                    executionStatus === 'partial' ? 'warning' : 'info';

    const event: AuditEvent = {
      id: this.generateId(),
      user_id: userId,
      wallet_scope: walletScope,
      event_type: 'plan_executed',
      severity,
      plan_id: planId,
      metadata: {
        execution_status: executionStatus,
        executed_steps: executedSteps,
        total_steps: totalSteps,
        completion_rate: totalSteps > 0 ? (executedSteps / totalSteps) * 100 : 0,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    };

    this.events.push(event);
  }

  /**
   * Log a step execution event
   */
  async logStepExecution(
    userId: string,
    planId: string,
    stepId: string,
    walletScope: AuditEvent['wallet_scope'],
    stepStatus: 'started' | 'completed' | 'failed',
    transactionHash?: string,
    gasUsed?: number,
    errorMessage?: string
  ): Promise<void> {
    const severity = stepStatus === 'failed' ? 'error' : 'info';

    const event: AuditEvent = {
      id: this.generateId(),
      user_id: userId,
      wallet_scope: walletScope,
      event_type: 'step_executed',
      severity,
      plan_id: planId,
      step_id: stepId,
      metadata: {
        step_status: stepStatus,
        transaction_hash: transactionHash,
        gas_used: gasUsed,
        error_message: errorMessage,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    };

    this.events.push(event);
  }

  /**
   * Log a policy block event
   */
  async logPolicyBlock(
    userId: string,
    planId: string,
    walletScope: AuditEvent['wallet_scope'],
    policyViolations: string[],
    blockedReason: string
  ): Promise<void> {
    const event: AuditEvent = {
      id: this.generateId(),
      user_id: userId,
      wallet_scope: walletScope,
      event_type: 'policy_block',
      severity: 'warning',
      plan_id: planId,
      metadata: {
        policy_violations: policyViolations,
        blocked_reason: blockedReason,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    };

    this.events.push(event);
  }

  /**
   * Log a simulation failover event
   */
  async logSimulationFailover(
    userId: string,
    planId: string,
    walletScope: AuditEvent['wallet_scope'],
    originalSimulator: string,
    fallbackSimulator: string,
    reason: string
  ): Promise<void> {
    const event: AuditEvent = {
      id: this.generateId(),
      user_id: userId,
      wallet_scope: walletScope,
      event_type: 'simulation_failover',
      severity: 'warning',
      plan_id: planId,
      metadata: {
        original_simulator: originalSimulator,
        fallback_simulator: fallbackSimulator,
        failover_reason: reason,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    };

    this.events.push(event);
  }

  /**
   * Log an unsafe override event
   */
  async logUnsafeOverride(
    userId: string,
    planId: string,
    walletScope: AuditEvent['wallet_scope'],
    overrideReason: string,
    riskLevel: 'medium' | 'high' | 'critical'
  ): Promise<void> {
    const event: AuditEvent = {
      id: this.generateId(),
      user_id: userId,
      wallet_scope: walletScope,
      event_type: 'override_unsafe',
      severity: riskLevel === 'critical' ? 'critical' : 'error',
      plan_id: planId,
      metadata: {
        override_reason: overrideReason,
        risk_level: riskLevel,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    };

    this.events.push(event);
  }

  /**
   * Log MEV mode usage
   */
  async logMEVModeUsed(
    userId: string,
    planId: string,
    walletScope: AuditEvent['wallet_scope'],
    mevProtectionType: string,
    additionalCostUsd: number
  ): Promise<void> {
    const event: AuditEvent = {
      id: this.generateId(),
      user_id: userId,
      wallet_scope: walletScope,
      event_type: 'mev_mode_used',
      severity: 'info',
      plan_id: planId,
      metadata: {
        mev_protection_type: mevProtectionType,
        additional_cost_usd: additionalCostUsd,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    };

    this.events.push(event);
  }

  /**
   * Log cross-wallet guard trigger
   */
  async logCrossWalletGuard(
    userId: string,
    planId: string,
    walletScope: AuditEvent['wallet_scope'],
    triggeredRule: string,
    affectedWallets: string[]
  ): Promise<void> {
    const event: AuditEvent = {
      id: this.generateId(),
      user_id: userId,
      wallet_scope: walletScope,
      event_type: 'cross_wallet_guard',
      severity: 'warning',
      plan_id: planId,
      metadata: {
        triggered_rule: triggeredRule,
        affected_wallets: affectedWallets,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    };

    this.events.push(event);
  }

  /**
   * Log payload mismatch block
   */
  async logPayloadMismatchBlock(
    userId: string,
    planId: string,
    stepId: string,
    walletScope: AuditEvent['wallet_scope'],
    expectedPayload: string,
    actualPayload: string,
    mismatchReason: string
  ): Promise<void> {
    const event: AuditEvent = {
      id: this.generateId(),
      user_id: userId,
      wallet_scope: walletScope,
      event_type: 'payload_mismatch_block',
      severity: 'critical',
      plan_id: planId,
      step_id: stepId,
      metadata: {
        expected_payload: expectedPayload,
        actual_payload: actualPayload,
        mismatch_reason: mismatchReason,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    };

    this.events.push(event);
  }

  /**
   * Store planned vs executed receipt
   */
  async storePlannedVsExecutedReceipt(receipt: PlannedVsExecutedReceipt): Promise<void> {
    this.receipts.push(receipt);
  }

  /**
   * Query audit events with filtering
   */
  async queryAuditEvents(options: AuditQueryOptions = {}): Promise<{
    events: AuditEvent[];
    nextCursor?: string;
    totalCount: number;
  }> {
    let filteredEvents = [...this.events];

    // Apply filters
    if (options.user_id) {
      filteredEvents = filteredEvents.filter(e => e.user_id === options.user_id);
    }

    if (options.plan_id) {
      filteredEvents = filteredEvents.filter(e => e.plan_id === options.plan_id);
    }

    if (options.severity) {
      filteredEvents = filteredEvents.filter(e => e.severity === options.severity);
    }

    if (options.event_type) {
      filteredEvents = filteredEvents.filter(e => e.event_type === options.event_type);
    }

    if (options.wallet_address) {
      filteredEvents = filteredEvents.filter(e => 
        e.wallet_scope.mode === 'active_wallet' && 
        e.wallet_scope.address === options.wallet_address
      );
    }

    if (options.start_date) {
      filteredEvents = filteredEvents.filter(e => e.created_at >= options.start_date!);
    }

    if (options.end_date) {
      filteredEvents = filteredEvents.filter(e => e.created_at <= options.end_date!);
    }

    // Sort by created_at descending (newest first)
    filteredEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const totalCount = filteredEvents.length;
    const limit = options.limit || 50;
    
    // Handle cursor pagination
    let startIndex = 0;
    if (options.cursor) {
      const cursorIndex = filteredEvents.findIndex(e => e.id === options.cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedEvents = filteredEvents.slice(startIndex, startIndex + limit);
    const nextCursor = paginatedEvents.length === limit && startIndex + limit < totalCount
      ? paginatedEvents[paginatedEvents.length - 1].id
      : undefined;

    return {
      events: paginatedEvents,
      nextCursor,
      totalCount,
    };
  }

  /**
   * Get planned vs executed receipts for a plan
   */
  async getPlannedVsExecutedReceipts(planId: string): Promise<PlannedVsExecutedReceipt[]> {
    return this.receipts.filter(r => r.plan_id === planId);
  }

  /**
   * Get audit events for a specific plan
   */
  async getPlanAuditTrail(planId: string): Promise<AuditEvent[]> {
    const result = await this.queryAuditEvents({ plan_id: planId });
    return result.events;
  }

  /**
   * Get critical audit events (security-related)
   */
  async getCriticalAuditEvents(userId: string, limit = 10): Promise<AuditEvent[]> {
    const result = await this.queryAuditEvents({
      user_id: userId,
      severity: 'critical',
      limit,
    });
    return result.events;
  }

  /**
   * Generate audit summary for a time period
   */
  async generateAuditSummary(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalEvents: number;
    eventsBySeverity: Record<string, number>;
    eventsByType: Record<string, number>;
    plansCreated: number;
    plansExecuted: number;
    criticalIssues: number;
  }> {
    const result = await this.queryAuditEvents({
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
    });

    const events = result.events;
    const eventsBySeverity: Record<string, number> = {};
    const eventsByType: Record<string, number> = {};

    events.forEach(event => {
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
    });

    return {
      totalEvents: events.length,
      eventsBySeverity,
      eventsByType,
      plansCreated: eventsByType['plan_created'] || 0,
      plansExecuted: eventsByType['plan_executed'] || 0,
      criticalIssues: eventsBySeverity['critical'] || 0,
    };
  }

  /**
   * Clear audit events (for testing)
   */
  async clearAuditEvents(): Promise<void> {
    this.events = [];
    this.receipts = [];
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const auditTrailService = new AuditTrailService();