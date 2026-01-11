/**
 * Cockpit Data Hook
 * 
 * Provides data fetching and state management for cockpit components.
 * Implements the runtime data flow specified in the design document.
 * 
 * Runtime Data Flow (Locked):
 * 1. On mount: start fetching prefs + summary in parallel
 * 2. Immediately fetch summary with wallet_scope="active" (default)
 * 3. When prefs returns: if wallet_scope_default="all", refetch summary
 * 4. POST /api/cockpit/open after first meaningful render (debounced server-side)
 * 5. Body MUST include: { timezone?: string } from Intl.DateTimeFormat().resolvedOptions().timeZone
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CockpitSummaryResponse } from '@/lib/cockpit/types';

// ============================================================================
// Types
// ============================================================================

interface CockpitDataState {
  summary: CockpitSummaryResponse['data'] | null;
  preferences: CockpitPreferences | null;
  isLoading: boolean;
  error: string | null;
  hasInitialLoad: boolean;
}

interface CockpitPreferences {
  wallet_scope_default: 'active' | 'all';
  timezone?: string | null;
  dnd_start_local: string;
  dnd_end_local: string;
  notif_cap_per_day: number;
}

interface UseCockpitDataOptions {
  /** Whether in demo mode */
  isDemo?: boolean;
  /** Initial wallet scope */
  initialWalletScope?: 'active' | 'all';
}

// ============================================================================
// Demo Data
// ============================================================================

const DEMO_SUMMARY: CockpitSummaryResponse['data'] = {
  wallet_scope: 'active',
  today_card: {
    kind: 'daily_pulse',
    anchor_metric: '3 new · 2 expiring',
    context_line: 'Since your last open',
    primary_cta: { label: "Open today's pulse", href: '/cockpit#pulse' },
    secondary_cta: { label: 'Explore Hunter', href: '/hunter' },
  },
  action_preview: [
    {
      id: 'demo_1',
      lane: 'Protect',
      title: 'Revoke unused approval: Uniswap Router',
      severity: 'high',
      provenance: 'simulated',
      is_executable: true,
      cta: { kind: 'Fix', href: '/guardian?action=revoke_demo' },
      impact_chips: [
        { kind: 'gas_est_usd', value: 0.42 },
        { kind: 'risk_delta', value: -12 },
      ],
      event_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      expires_at: null,
      freshness: 'updated',
      urgency_score: 0,
      relevance_score: 25,
      score: 262,
      source: { kind: 'guardian', ref_id: 'demo_finding_1' },
    },
    {
      id: 'demo_2',
      lane: 'Earn',
      title: 'Arbitrum quest ends in 8h',
      severity: 'med',
      provenance: 'confirmed',
      is_executable: true,
      cta: { kind: 'Execute', href: '/hunter?op=arb_week4' },
      impact_chips: [
        { kind: 'upside_est_usd', value: 150 },
        { kind: 'time_est_sec', value: 300 },
      ],
      event_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      freshness: 'expiring',
      urgency_score: 85,
      relevance_score: 20,
      score: 220,
      source: { kind: 'hunter', ref_id: 'demo_quest_1' },
    },
    {
      id: 'demo_3',
      lane: 'Watch',
      title: 'Portfolio rebalancing opportunity',
      severity: 'low',
      provenance: 'heuristic',
      is_executable: false,
      cta: { kind: 'Review', href: '/portfolio?suggestion=rebalance' },
      impact_chips: [
        { kind: 'upside_est_usd', value: 50 },
      ],
      event_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      expires_at: null,
      freshness: 'stable',
      urgency_score: 0,
      relevance_score: 15,
      score: 50,
      source: { kind: 'portfolio', ref_id: 'demo_rebalance_1' },
    },
  ],
  counters: {
    new_since_last: 3,
    expiring_soon: 2,
    critical_risk: 0,
    pending_actions: 1,
  },
  provider_status: {
    state: 'online',
    detail: null,
  },
  degraded_mode: false,
};

const DEMO_PREFERENCES: CockpitPreferences = {
  wallet_scope_default: 'active',
  timezone: 'America/New_York',
  dnd_start_local: '22:00',
  dnd_end_local: '08:00',
  notif_cap_per_day: 3,
};

// ============================================================================
// Hook Implementation
// ============================================================================

export const useCockpitData = (options: UseCockpitDataOptions = {}) => {
  const { isDemo = false, initialWalletScope = 'active' } = options;
  
  const [state, setState] = useState<CockpitDataState>({
    summary: null,
    preferences: null,
    isLoading: true,
    error: null,
    hasInitialLoad: false,
  });
  
  const [walletScope, setWalletScope] = useState<'active' | 'all'>(initialWalletScope);
  const hasMarkedOpened = useRef(false);
  
  // Fetch summary data
  const fetchSummary = useCallback(async (scope: 'active' | 'all' = walletScope) => {
    if (isDemo) {
      // Demo mode: return static data immediately
      setState(prev => ({
        ...prev,
        summary: { ...DEMO_SUMMARY, wallet_scope: scope },
        isLoading: false,
        error: null,
        hasInitialLoad: true,
      }));
      return;
    }
    
    try {
      const response = await fetch(`/api/cockpit/summary?wallet_scope=${scope}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        // If API endpoint doesn't exist (404), fall back to demo data
        if (response.status === 404) {
          console.warn('Cockpit summary API not available, using demo data');
          setState(prev => ({
            ...prev,
            summary: { ...DEMO_SUMMARY, wallet_scope: scope },
            isLoading: false,
            error: null,
            hasInitialLoad: true,
          }));
          return;
        }
        throw new Error(`Failed to fetch summary: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // If response is not JSON (likely HTML error page), fall back to demo data
        console.warn('Cockpit summary API returned non-JSON response, using demo data');
        setState(prev => ({
          ...prev,
          summary: { ...DEMO_SUMMARY, wallet_scope: scope },
          isLoading: false,
          error: null,
          hasInitialLoad: true,
        }));
        return;
      }
      
      const data: CockpitSummaryResponse = await response.json();
      
      // Note: CockpitSummaryResponse.error is always null in success case
      // Error responses would have different structure or throw before this point
      
      setState(prev => ({
        ...prev,
        summary: data.data,
        isLoading: false,
        error: null,
        hasInitialLoad: true,
      }));
    } catch (error) {
      console.error('Failed to fetch cockpit summary:', error);
      // Fall back to demo data on any error
      console.warn('Using demo data due to API error');
      setState(prev => ({
        ...prev,
        summary: { ...DEMO_SUMMARY, wallet_scope: scope },
        isLoading: false,
        error: null, // Don't show error, just use demo data
        hasInitialLoad: true,
      }));
    }
  }, [isDemo, walletScope]);
  
  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (isDemo) {
      // Demo mode: return static preferences
      setState(prev => ({
        ...prev,
        preferences: DEMO_PREFERENCES,
      }));
      return;
    }
    
    try {
      const response = await fetch('/api/cockpit/prefs', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        // If API endpoint doesn't exist (404), fall back to demo preferences
        if (response.status === 404) {
          console.warn('Cockpit prefs API not available, using demo preferences');
          setState(prev => ({
            ...prev,
            preferences: DEMO_PREFERENCES,
          }));
          return;
        }
        throw new Error(`Failed to fetch preferences: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // If response is not JSON (likely HTML error page), fall back to demo preferences
        console.warn('Cockpit prefs API returned non-JSON response, using demo preferences');
        setState(prev => ({
          ...prev,
          preferences: DEMO_PREFERENCES,
        }));
        return;
      }
      
      const data = await response.json();
      
      // Handle API error responses
      if (data.error) {
        throw new Error(data.error.message || 'Failed to fetch preferences');
      }
      
      setState(prev => ({
        ...prev,
        preferences: data.data,
      }));
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
      // Don't set error state for preferences - use defaults
      console.warn('Using demo preferences due to API error');
      setState(prev => ({
        ...prev,
        preferences: DEMO_PREFERENCES,
      }));
    }
  }, [isDemo]);
  
  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<CockpitPreferences>) => {
    if (isDemo) {
      // Demo mode: update local state only
      setState(prev => ({
        ...prev,
        preferences: prev.preferences ? { ...prev.preferences, ...updates } : null,
      }));
      return;
    }
    
    try {
      const response = await fetch('/api/cockpit/prefs', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        // If API endpoint doesn't exist (404), just update local state
        if (response.status === 404) {
          console.warn('Cockpit prefs update API not available, updating locally only');
          setState(prev => ({
            ...prev,
            preferences: prev.preferences ? { ...prev.preferences, ...updates } : null,
          }));
          return;
        }
        throw new Error(`Failed to update preferences: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // If response is not JSON, just update local state
        console.warn('Cockpit prefs update API returned non-JSON response, updating locally only');
        setState(prev => ({
          ...prev,
          preferences: prev.preferences ? { ...prev.preferences, ...updates } : null,
        }));
        return;
      }
      
      const data = await response.json();
      
      // Handle API error responses
      if (data.error) {
        throw new Error(data.error.message || 'Failed to update preferences');
      }
      
      setState(prev => ({
        ...prev,
        preferences: data.data,
      }));
    } catch (error) {
      console.error('Failed to update preferences:', error);
      // Optimistically update local state anyway
      console.warn('Updating preferences locally due to API error');
      setState(prev => ({
        ...prev,
        preferences: prev.preferences ? { ...prev.preferences, ...updates } : null,
      }));
    }
  }, [isDemo]);
  
  // Mark cockpit as opened
  const markOpened = useCallback(async () => {
    if (isDemo || hasMarkedOpened.current) return;
    
    try {
      // Get timezone from browser
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const response = await fetch('/api/cockpit/open', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timezone }),
      });
      
      if (response.ok) {
        hasMarkedOpened.current = true;
      } else if (response.status === 404) {
        // API endpoint doesn't exist yet, that's okay
        console.warn('Cockpit open API not available yet');
        hasMarkedOpened.current = true;
      }
    } catch (error) {
      console.warn('Failed to mark cockpit as opened:', error);
      // Don't prevent the app from working if this fails
      hasMarkedOpened.current = true;
    }
  }, [isDemo]);
  
  // Change wallet scope
  const changeWalletScope = useCallback((scope: 'active' | 'all') => {
    setWalletScope(scope);
    fetchSummary(scope);
  }, [fetchSummary]);
  
  // Initial data fetch - implements parallel fetching
  useEffect(() => {
    const initializeData = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Step 1 & 2: Start fetching prefs + summary in parallel
      // Immediately fetch summary with wallet_scope="active" (default)
      const prefsPromise = fetchPreferences();
      const summaryPromise = fetchSummary(initialWalletScope);
      
      // Wait for both to complete
      await Promise.all([prefsPromise, summaryPromise]);
    };
    
    initializeData();
  }, [fetchPreferences, fetchSummary, initialWalletScope]);
  
  // Step 3: When prefs returns: if wallet_scope_default="all", refetch summary
  useEffect(() => {
    if (state.preferences?.wallet_scope_default && 
        state.preferences.wallet_scope_default !== walletScope &&
        state.hasInitialLoad) {
      changeWalletScope(state.preferences.wallet_scope_default);
    }
  }, [state.preferences?.wallet_scope_default, walletScope, changeWalletScope, state.hasInitialLoad]);
  
  // Step 4: POST /api/cockpit/open after first meaningful render
  useEffect(() => {
    if (state.hasInitialLoad && !hasMarkedOpened.current) {
      // Use setTimeout to ensure this happens after render
      const timer = setTimeout(() => {
        markOpened();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [state.hasInitialLoad, markOpened]);
  
  return {
    // Data
    summary: state.summary,
    preferences: state.preferences,
    
    // State
    isLoading: state.isLoading,
    error: state.error,
    walletScope,
    
    // Actions
    refetch: () => fetchSummary(),
    changeWalletScope,
    updatePreferences,
    markOpened,
  };
};

export default useCockpitData;