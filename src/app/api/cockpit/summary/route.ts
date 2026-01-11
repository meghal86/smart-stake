/**
 * GET /api/cockpit/summary
 * 
 * Returns the cockpit summary including Today Card state, action preview,
 * counters, and provider status.
 * 
 * Implements Today Card state machine logic (priority order):
 * 1. onboarding
 * 2. scan_required
 * 3. critical_risk
 * 4. pending_actions
 * 5. daily_pulse
 * 6. portfolio_anchor
 * 
 * Requirements: 3.3, 3.4, 6.1, 6.9, 16.1, 16.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { z } from 'zod';
import {
  Action,
  ActionDraft,
  AdapterContext,
  CockpitCounters,
  CockpitSummaryResponse,
  ProviderStatus,
  TodayCard,
  TodayCardKind,
  GuardianFindingInput,
  HunterOpportunityInput,
  ActionCenterItemInput,
} from '@/lib/cockpit/types';
import {
  adaptGuardianFindings,
  adaptHunterOpportunities,
  adaptActionCenterItems,
  countPendingActions,
} from '@/lib/cockpit/adapters';
import { rankActions } from '@/lib/cockpit/scoring';

// ============================================================================
// Request Validation
// ============================================================================

const SummaryQuerySchema = z.object({
  wallet_scope: z.enum(['active', 'all']).default('active'),
});

// ============================================================================
// Today Card State Machine Types
// ============================================================================

interface TodayCardInputs {
  onboarding_needed: boolean;
  scan_state: 'fresh' | 'stale' | 'missing';
  critical_risk_count: number;
  pending_actions_count: number;
  daily_pulse_available: boolean;
  degraded_mode: boolean;
}

// ============================================================================
// Staleness Thresholds (per chain)
// ============================================================================

const STALENESS_THRESHOLDS_MS: Record<string, number> = {
  base: 15 * 60 * 1000,      // 15 minutes
  arbitrum: 15 * 60 * 1000,  // 15 minutes
  ethereum: 30 * 60 * 1000,  // 30 minutes
  default: 30 * 60 * 1000,   // 30 minutes fallback
};

// ============================================================================
// Today Card State Machine (Locked Priority Order)
// ============================================================================

/**
 * Determines the Today Card state based on inputs.
 * Evaluates conditions in exact order and selects first true.
 * 
 * Priority order (Locked):
 * 1. onboarding
 * 2. scan_required
 * 3. critical_risk
 * 4. pending_actions
 * 5. daily_pulse
 * 6. portfolio_anchor (fallback)
 */
export function determineTodayCardKind(inputs: TodayCardInputs): TodayCardKind {
  // 1. Onboarding
  if (inputs.onboarding_needed) {
    return 'onboarding';
  }
  
  // 2. Scan required
  if (inputs.scan_state === 'missing' || inputs.scan_state === 'stale') {
    return 'scan_required';
  }
  
  // 3. Critical risk
  if (inputs.critical_risk_count > 0) {
    return 'critical_risk';
  }
  
  // 4. Pending actions
  if (inputs.pending_actions_count > 0) {
    return 'pending_actions';
  }
  
  // 5. Daily pulse
  if (inputs.daily_pulse_available) {
    return 'daily_pulse';
  }
  
  // 6. Portfolio anchor (fallback)
  return 'portfolio_anchor';
}

/**
 * Builds the Today Card content based on the determined kind.
 */
function buildTodayCard(
  kind: TodayCardKind,
  inputs: TodayCardInputs,
  counters: CockpitCounters
): TodayCard {
  switch (kind) {
    case 'onboarding':
      return {
        kind: 'onboarding',
        anchor_metric: 'Get Started',
        context_line: 'Complete setup to unlock your dashboard',
        primary_cta: { label: 'Start Setup', href: '/onboarding' },
        secondary_cta: { label: 'Explore Demo', href: '/cockpit?demo=1' },
      };
    
    case 'scan_required':
      return {
        kind: 'scan_required',
        anchor_metric: 'Scan Needed',
        context_line: inputs.scan_state === 'missing' 
          ? 'Run your first security scan'
          : 'Your scan data is outdated',
        primary_cta: { label: 'Run Scan', href: '/guardian?action=scan' },
        secondary_cta: { label: 'View Last Results', href: '/guardian' },
      };
    
    case 'critical_risk':
      return {
        kind: 'critical_risk',
        anchor_metric: `${inputs.critical_risk_count} Critical`,
        context_line: inputs.critical_risk_count === 1 
          ? 'Critical security issue requires attention'
          : 'Critical security issues require attention',
        primary_cta: { label: 'Review Now', href: '/guardian?severity=critical' },
      };
    
    case 'pending_actions':
      return {
        kind: 'pending_actions',
        anchor_metric: `${inputs.pending_actions_count} Pending`,
        context_line: inputs.pending_actions_count === 1
          ? 'Action awaiting your review'
          : 'Actions awaiting your review',
        primary_cta: { label: 'View Actions', href: '/action-center' },
      };
    
    case 'daily_pulse':
      const newCount = counters.new_since_last;
      const expiringCount = counters.expiring_soon;
      let anchorMetric = '';
      
      if (newCount > 0 && expiringCount > 0) {
        anchorMetric = `${newCount} new · ${expiringCount} expiring`;
      } else if (newCount > 0) {
        anchorMetric = `${newCount} new`;
      } else if (expiringCount > 0) {
        anchorMetric = `${expiringCount} expiring`;
      } else {
        anchorMetric = 'Quiet day';
      }
      
      return {
        kind: 'daily_pulse',
        anchor_metric: anchorMetric,
        context_line: 'Since your last open',
        primary_cta: { label: "Open today's pulse", href: '/cockpit#pulse' },
        secondary_cta: { label: 'Explore Hunter', href: '/hunter' },
      };
    
    case 'portfolio_anchor':
    default:
      return {
        kind: 'portfolio_anchor',
        anchor_metric: 'All Clear',
        context_line: 'Your portfolio is healthy',
        primary_cta: { label: 'View Portfolio', href: '/portfolio' },
        secondary_cta: { label: 'Explore Opportunities', href: '/hunter' },
      };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determines scan state based on last scan timestamp.
 */
function determineScanState(
  lastScanAt: string | null,
  chain: string = 'default',
  now: number = Date.now()
): 'fresh' | 'stale' | 'missing' {
  if (!lastScanAt) {
    return 'missing';
  }
  
  const lastScanMs = new Date(lastScanAt).getTime();
  if (isNaN(lastScanMs)) {
    return 'missing';
  }
  
  const threshold = STALENESS_THRESHOLDS_MS[chain.toLowerCase()] || STALENESS_THRESHOLDS_MS.default;
  const timeSinceScan = now - lastScanMs;
  
  return timeSinceScan > threshold ? 'stale' : 'fresh';
}

/**
 * Checks if onboarding is needed based on user state.
 */
function checkOnboardingNeeded(params: {
  walletCount: number;
  hasCompletedScan: boolean;
  hasAlertRules: boolean;
  hasSavedItems: boolean;
  dailyPulseEmpty: boolean;
  notificationsEnabled: boolean;
  meaningfulSessionCount: number;
}): boolean {
  const {
    walletCount,
    hasCompletedScan,
    hasAlertRules,
    hasSavedItems,
    dailyPulseEmpty,
    notificationsEnabled,
    meaningfulSessionCount,
  } = params;
  
  // Rule 4.1: 0 wallets linked
  if (walletCount === 0) {
    return true;
  }
  
  // Rule 4.2: Never completed first scan
  if (!hasCompletedScan) {
    return true;
  }
  
  // Rule 4.3: No alert rules AND no saved items AND Daily Pulse would be empty
  if (!hasAlertRules && !hasSavedItems && dailyPulseEmpty) {
    return true;
  }
  
  // Rule 4.4: Not enabled notifications AND completed 2+ meaningful sessions
  if (!notificationsEnabled && meaningfulSessionCount >= 2) {
    return true;
  }
  
  return false;
}

/**
 * Determines provider status based on system health.
 */
function determineProviderStatus(): { status: ProviderStatus; degraded_mode: boolean } {
  // TODO: Implement actual provider health checks
  // For now, return online status
  return {
    status: {
      state: 'online',
      detail: null,
    },
    degraded_mode: false,
  };
}

/**
 * Fetches recently shown dedupe keys for duplicate detection.
 */
async function fetchRecentlyShownKeys(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<Set<string>> {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('shown_actions')
    .select('dedupe_key')
    .eq('user_id', userId)
    .gt('shown_at', twoHoursAgo);
  
  if (error || !data) {
    return new Set();
  }
  
  return new Set(data.map((row: { dedupe_key: string }) => row.dedupe_key));
}

/**
 * Builds adapter context from user data.
 */
function buildAdapterContext(params: {
  lastOpenedAt: string | null;
  degradedMode: boolean;
  savedRefIds: string[];
  walletRoles: Array<{ ref_id: string; payload: { role?: string } | null }>;
  alertTags: string[];
}): AdapterContext {
  const walletRolesMap = new Map<string, string>();
  for (const item of params.walletRoles) {
    if (item.payload?.role) {
      walletRolesMap.set(item.ref_id.toLowerCase(), item.payload.role);
    }
  }
  
  return {
    last_opened_at: params.lastOpenedAt,
    degraded_mode: params.degradedMode,
    saved_ref_ids: new Set(params.savedRefIds),
    wallet_roles: walletRolesMap,
    alert_tags: new Set(params.alertTags.map(t => t.toLowerCase())),
  };
}

// ============================================================================
// Main Handler
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const validation = SummaryQuerySchema.safeParse({
      wallet_scope: searchParams.get('wallet_scope') || 'active',
    });
    
    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validation.error.issues,
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    const { wallet_scope } = validation.data;
    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    // Fetch user's cockpit state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cockpitState } = await (supabase as any)
      .from('cockpit_state')
      .select('last_opened_at, prefs')
      .eq('user_id', user.id)
      .single();

    const lastOpenedAt = cockpitState?.last_opened_at || null;

    // Fetch user's wallets
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: wallets } = await (supabase as any)
      .from('wallets')
      .select('address, chain, is_active')
      .eq('user_id', user.id);

    const walletCount = wallets?.length || 0;
    const activeWallet = wallets?.find((w: { is_active: boolean }) => w.is_active);

    // Validate wallet_scope=active
    if (wallet_scope === 'active' && walletCount > 0 && !activeWallet) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No active wallet found',
          },
          meta: { ts: nowIso },
        },
        { status: 400 }
      );
    }

    // Fetch Guardian findings (critical risks)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let guardianQuery = (supabase as any)
      .from('guardian_findings')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'open');
    
    if (wallet_scope === 'active' && activeWallet) {
      guardianQuery = guardianQuery.eq('wallet_address', activeWallet.address);
    }
    
    const { data: guardianFindings } = await guardianQuery;
    
    const criticalRiskCount = (guardianFindings || []).filter(
      (f: { severity: string }) => f.severity === 'critical'
    ).length;

    // Fetch last scan timestamp
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scanQuery = (supabase as any)
      .from('guardian_scans')
      .select('completed_at, chain')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1);
    
    if (wallet_scope === 'active' && activeWallet) {
      scanQuery = scanQuery.eq('wallet_address', activeWallet.address);
    }
    
    const { data: lastScan } = await scanQuery;
    const lastScanAt = lastScan?.[0]?.completed_at || null;
    const scanChain = lastScan?.[0]?.chain || 'default';
    const scanState = determineScanState(lastScanAt, scanChain, now);
    const hasCompletedScan = lastScanAt !== null;

    // Fetch Action Center items (pending actions)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let actionCenterQuery = (supabase as any)
      .from('action_center_items')
      .select('*')
      .eq('user_id', user.id)
      .in('state', ['pending_user', 'ready_to_execute', 'needs_review']);
    
    if (wallet_scope === 'active' && activeWallet) {
      actionCenterQuery = actionCenterQuery.eq('wallet_address', activeWallet.address);
    }
    
    const { data: actionCenterItems } = await actionCenterQuery;
    const pendingActionsCount = actionCenterItems?.length || 0;

    // Fetch user investments (saved items)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userInvestments } = await (supabase as any)
      .from('user_investments')
      .select('kind, ref_id, payload')
      .eq('user_id', user.id);

    const savedItems = (userInvestments || []).filter(
      (i: { kind: string }) => i.kind === 'save' || i.kind === 'bookmark'
    );
    const hasSavedItems = savedItems.length > 0;
    const savedRefIds = savedItems.map((i: { ref_id: string }) => i.ref_id);
    
    const walletRoleItems = (userInvestments || []).filter(
      (i: { kind: string }) => i.kind === 'wallet_role'
    );

    // Fetch alert rules
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: alertRules } = await (supabase as any)
      .from('cockpit_alert_rules')
      .select('rule, is_enabled')
      .eq('user_id', user.id)
      .eq('is_enabled', true);

    const hasAlertRules = (alertRules?.length || 0) > 0;
    const alertTags = (alertRules || [])
      .flatMap((r: { rule: { tags?: string[] } }) => r.rule?.tags || []);

    // Check for daily pulse availability
    const today = new Date(now).toISOString().split('T')[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dailyPulse } = await (supabase as any)
      .from('daily_pulse')
      .select('payload')
      .eq('user_id', user.id)
      .eq('pulse_date', today)
      .single();

    const dailyPulseAvailable = dailyPulse?.payload?.rows?.length > 0;
    const dailyPulseEmpty = !dailyPulseAvailable;

    // Check notification subscription
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pushSubs } = await (supabase as any)
      .from('web_push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    const notificationsEnabled = (pushSubs?.length || 0) > 0;

    // Get meaningful session count (from cockpit_state prefs or default)
    const meaningfulSessionCount = (cockpitState?.prefs?.meaningful_sessions as number) || 0;

    // Determine provider status
    const { status: providerStatus, degraded_mode } = determineProviderStatus();

    // Check onboarding needed
    const onboardingNeeded = checkOnboardingNeeded({
      walletCount,
      hasCompletedScan,
      hasAlertRules,
      hasSavedItems,
      dailyPulseEmpty,
      notificationsEnabled,
      meaningfulSessionCount,
    });

    // Build Today Card inputs
    const todayCardInputs: TodayCardInputs = {
      onboarding_needed: onboardingNeeded,
      scan_state: scanState,
      critical_risk_count: criticalRiskCount,
      pending_actions_count: pendingActionsCount,
      daily_pulse_available: dailyPulseAvailable,
      degraded_mode,
    };

    // Determine Today Card kind
    const todayCardKind = determineTodayCardKind(todayCardInputs);

    // Fetch recently shown keys for duplicate detection
    const recentlyShownKeys = await fetchRecentlyShownKeys(supabase, user.id);

    // Build adapter context
    const adapterContext = buildAdapterContext({
      lastOpenedAt,
      degradedMode: degraded_mode,
      savedRefIds,
      walletRoles: walletRoleItems,
      alertTags,
    });

    // Adapt source data to action drafts
    const actionDrafts: ActionDraft[] = [];

    // Guardian findings
    if (guardianFindings) {
      const guardianInputs: GuardianFindingInput[] = guardianFindings.map((f: Record<string, unknown>) => ({
        id: f.id as string,
        finding_type: f.finding_type as string,
        severity: f.severity as 'critical' | 'high' | 'medium' | 'low',
        title: f.title as string,
        description: f.description as string | undefined,
        status: f.status as 'open' | 'dismissed' | 'resolved',
        wallet_address: f.wallet_address as string,
        chain: f.chain as string,
        risk_delta: f.risk_delta as number | undefined,
        gas_estimate_usd: f.gas_estimate_usd as number | undefined,
        created_at: f.created_at as string,
        updated_at: f.updated_at as string | undefined,
        from_completed_scan: true,
        has_fix_flow: (f.has_fix_flow as boolean) || false,
      }));
      actionDrafts.push(...adaptGuardianFindings(guardianInputs, adapterContext));
    }

    // Hunter opportunities (fetch separately)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: hunterOpportunities } = await (supabase as any)
      .from('hunter_opportunities')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (hunterOpportunities) {
      const hunterInputs: HunterOpportunityInput[] = hunterOpportunities.map((o: Record<string, unknown>) => ({
        id: o.id as string,
        slug: o.slug as string,
        title: o.title as string,
        protocol_name: o.protocol_name as string,
        type: o.type as 'airdrop' | 'quest' | 'staking' | 'yield' | 'points' | 'loyalty' | 'testnet',
        chains: (o.chains as string[]) || [],
        reward_min: o.reward_min as number | undefined,
        reward_max: o.reward_max as number | undefined,
        reward_currency: (o.reward_currency as string) || 'USD',
        trust_score: (o.trust_score as number) || 50,
        trust_level: (o.trust_level as 'green' | 'amber' | 'red') || 'amber',
        upside_estimate_usd: o.upside_estimate_usd as number | undefined,
        time_estimate_sec: o.time_estimate_sec as number | undefined,
        expires_at: o.expires_at as string | undefined,
        created_at: o.created_at as string,
        updated_at: o.updated_at as string | undefined,
        eligibility_confirmed: (o.eligibility_confirmed as boolean) || false,
      }));
      actionDrafts.push(...adaptHunterOpportunities(hunterInputs, adapterContext));
    }

    // Action Center items
    if (actionCenterItems) {
      const actionCenterInputs: ActionCenterItemInput[] = actionCenterItems.map((i: Record<string, unknown>) => ({
        id: i.id as string,
        intent_type: i.intent_type as string,
        title: i.title as string,
        state: i.state as 'pending_user' | 'ready_to_execute' | 'needs_review' | 'completed' | 'failed',
        lane: i.lane as 'Protect' | 'Earn' | 'Watch' | undefined,
        severity: i.severity as 'critical' | 'high' | 'med' | 'low' | undefined,
        gas_estimate_usd: i.gas_estimate_usd as number | undefined,
        risk_delta: i.risk_delta as number | undefined,
        created_at: i.created_at as string,
        updated_at: i.updated_at as string | undefined,
        href: `/action-center?intent=${i.id}`,
      }));
      actionDrafts.push(...adaptActionCenterItems(actionCenterInputs, adapterContext));
    }

    // Rank actions and get top 3
    const rankedActions = rankActions(actionDrafts, adapterContext, {
      limit: 3,
      recentlyShownKeys,
    });

    // Calculate counters
    const newSinceLastCount = actionDrafts.filter(
      a => a.event_time && lastOpenedAt && new Date(a.event_time) > new Date(lastOpenedAt)
    ).length;
    
    const expiringSoonCount = actionDrafts.filter(a => {
      if (!a.expires_at) return false;
      const expiresMs = new Date(a.expires_at).getTime();
      const timeRemaining = expiresMs - now;
      return timeRemaining > 0 && timeRemaining < 72 * 60 * 60 * 1000;
    }).length;

    const counters: CockpitCounters = {
      new_since_last: Math.min(newSinceLastCount, 99), // Cap at 99+
      expiring_soon: expiringSoonCount,
      critical_risk: criticalRiskCount,
      pending_actions: pendingActionsCount,
    };

    // Build Today Card
    const todayCard = buildTodayCard(todayCardKind, todayCardInputs, counters);

    // Build response
    const response: CockpitSummaryResponse = {
      data: {
        wallet_scope,
        today_card: todayCard,
        action_preview: rankedActions,
        counters,
        provider_status: providerStatus,
        degraded_mode,
      },
      error: null,
      meta: { ts: nowIso },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Cockpit summary endpoint error:', error);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        meta: { ts: new Date().toISOString() },
      },
      { status: 500 }
    );
  }
}
