/**
 * Cockpit Service
 * 
 * Client-side service for interacting with cockpit edge functions.
 * Provides methods for fetching cockpit summary, recording rendered actions,
 * and managing cockpit state.
 * 
 * Requirements: 3.3, 3.4, 6.1, 6.9, 16.1, 16.2
 */

import { supabase } from '@/integrations/supabase/client';

// Types
export type TodayCardKind = 
  | 'onboarding'
  | 'scan_required'
  | 'critical_risk'
  | 'pending_actions'
  | 'daily_pulse'
  | 'portfolio_anchor';

export type ActionLane = 'Protect' | 'Earn' | 'Watch';
export type ActionSeverity = 'critical' | 'high' | 'med' | 'low';
export type ActionFreshness = 'new' | 'updated' | 'expiring' | 'stable';
export type CTAKind = 'Fix' | 'Execute' | 'Review';

export interface TodayCard {
  kind: TodayCardKind;
  anchor_metric: string;
  context_line: string;
  primary_cta: { label: string; href: string };
  secondary_cta?: { label: string; href: string };
}

export interface CockpitCounters {
  new_since_last: number;
  expiring_soon: number;
  critical_risk: number;
  pending_actions: number;
}

export interface Action {
  id: string;
  lane: ActionLane;
  title: string;
  severity: ActionSeverity;
  provenance: 'confirmed' | 'simulated' | 'heuristic';
  is_executable: boolean;
  cta: { kind: CTAKind; href: string };
  impact_chips: Array<{ kind: string; value: number }>;
  event_time: string;
  expires_at: string | null;
  freshness: ActionFreshness;
  urgency_score: number;
  relevance_score: number;
  score: number;
  source: { kind: string; ref_id: string };
}


export interface ProviderStatus {
  state: 'online' | 'degraded' | 'offline';
  detail: string | null;
}

export interface CockpitSummaryData {
  wallet_scope: 'active' | 'all';
  today_card: TodayCard;
  action_preview: Action[];
  counters: CockpitCounters;
  provider_status: ProviderStatus;
  degraded_mode: boolean;
}

export interface CockpitSummaryResponse {
  data: CockpitSummaryData | null;
  error: { code: string; message: string } | null;
  meta: { ts: string };
}

export interface RenderedResponse {
  data: { ok: boolean; updated_count: number; total_count: number } | null;
  error: { code: string; message: string } | null;
  meta: { ts: string };
}

/**
 * Cockpit Service class for interacting with cockpit edge functions
 */
export class CockpitService {
  /**
   * Fetch cockpit summary including Today Card, action preview, and counters
   */
  static async getSummary(walletScope: 'active' | 'all' = 'active'): Promise<CockpitSummaryResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('cockpit-summary', {
        body: {},
        headers: {},
      });

      // The edge function uses query params, but invoke uses body
      // We need to pass wallet_scope as a query param via the URL
      // For now, let's use the direct approach
      if (error) {
        return {
          data: null,
          error: { code: 'FUNCTION_ERROR', message: error.message },
          meta: { ts: new Date().toISOString() },
        };
      }

      return data as CockpitSummaryResponse;
    } catch (err) {
      console.error('CockpitService.getSummary error:', err);
      return {
        data: null,
        error: { code: 'NETWORK_ERROR', message: 'Failed to fetch cockpit summary' },
        meta: { ts: new Date().toISOString() },
      };
    }
  }

  /**
   * Record which actions were rendered in the Action Preview
   * Used for duplicate detection - actions shown recently get a -30 penalty
   */
  static async recordRenderedActions(dedupeKeys: string[]): Promise<RenderedResponse> {
    if (dedupeKeys.length === 0 || dedupeKeys.length > 3) {
      return {
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'dedupe_keys must be 1-3 items' },
        meta: { ts: new Date().toISOString() },
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke('cockpit-actions-rendered', {
        body: { dedupe_keys: dedupeKeys },
      });

      if (error) {
        return {
          data: null,
          error: { code: 'FUNCTION_ERROR', message: error.message },
          meta: { ts: new Date().toISOString() },
        };
      }

      return data as RenderedResponse;
    } catch (err) {
      console.error('CockpitService.recordRenderedActions error:', err);
      return {
        data: null,
        error: { code: 'NETWORK_ERROR', message: 'Failed to record rendered actions' },
        meta: { ts: new Date().toISOString() },
      };
    }
  }

  /**
   * Get dedupe keys from a list of actions
   */
  static getDedupeKeys(actions: Action[]): string[] {
    return actions.map(action => 
      `${action.source.kind}:${action.source.ref_id}:${action.cta.kind}`
    );
  }
}

export default CockpitService;
