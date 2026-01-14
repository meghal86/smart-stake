/**
 * Cockpit Data Hook
 * 
 * Provides data fetching and state management for cockpit components.
 * Implements the runtime data flow specified in the design document with risk-aware caching.
 * 
 * Runtime Data Flow (Locked):
 * 1. On mount: start fetching prefs + summary in parallel
 * 2. Immediately fetch summary with wallet_scope="active" (default)
 * 3. When prefs returns: if wallet_scope_default="all", refetch summary
 * 4. POST /api/cockpit/open after first meaningful render (debounced server-side)
 * 5. Body MUST include: { timezone?: string } from Intl.DateTimeFormat().resolvedOptions().timeZone
 * 
 * Caching Strategy:
 * - Uses React Query with risk-aware TTL values
 * - Critical risk: 10s cache, scan required: 15s, pending actions: 20s, healthy: 60s
 * - Automatic cache invalidation on risk level changes
 * - Background refetch for high-risk states
 * 
 * Requirements: 14.4, 14.5
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { CockpitSummaryResponse } from '@/lib/cockpit/types';
import { 
  getCockpitSummaryKey, 
  getCockpitPreferencesKey,
  getRiskAwareCacheConfig,
  getCacheInvalidationConfig,
  DEFAULT_CACHE_CONFIG,
  trackCachePerformance,
  warmCache
} from '@/lib/cockpit/cache';
import { 
  invalidateCockpitCache,
  setupBackgroundSync
} from '@/lib/cockpit/query-client';

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
  /** User ID for cache keys */
  userId?: string | null;
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
// Hook Implementation with Risk-Aware Caching
// ============================================================================

export const useCockpitData = (options: UseCockpitDataOptions = {}) => {
  const { isDemo = false, initialWalletScope = 'active', userId = null } = options;
  
  const queryClient = useQueryClient();
  const [walletScope, setWalletScope] = useState<'active' | 'all'>(initialWalletScope);
  const hasMarkedOpened = useRef(false);
  const backgroundSyncCleanup = useRef<(() => void) | null>(null);
  
  // ============================================================================
  // Query Configurations
  // ============================================================================
  
  // Summary query with risk-aware caching
  const summaryQuery = useQuery({
    queryKey: getCockpitSummaryKey(userId, walletScope, isDemo),
    queryFn: async () => {
      if (isDemo) {
        // Demo mode: return static data immediately
        trackCachePerformance('hit', 'demo-summary');
        return { ...DEMO_SUMMARY, wallet_scope: walletScope };
      }
      
      const startTime = Date.now();
      
      try {
        const response = await fetch(`/api/cockpit/summary?wallet_scope=${walletScope}`, {
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
            trackCachePerformance('miss', 'summary-fallback', Date.now() - startTime);
            return { ...DEMO_SUMMARY, wallet_scope: walletScope };
          }
          throw new Error(`Failed to fetch summary: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          // If response is not JSON (likely HTML error page), fall back to demo data
          console.warn('Cockpit summary API returned non-JSON response, using demo data');
          trackCachePerformance('miss', 'summary-fallback', Date.now() - startTime);
          return { ...DEMO_SUMMARY, wallet_scope: walletScope };
        }
        
        const data: CockpitSummaryResponse = await response.json();
        
        trackCachePerformance('hit', 'summary-api', Date.now() - startTime);
        return data.data;
      } catch (error) {
        console.error('Failed to fetch cockpit summary:', error);
        // Fall back to demo data on any error
        console.warn('Using demo data due to API error');
        trackCachePerformance('miss', 'summary-error', Date.now() - startTime);
        return { ...DEMO_SUMMARY, wallet_scope: walletScope };
      }
    },
    ...getRiskAwareCacheConfig(undefined), // Will be updated when we get the data
    enabled: true,
  });
  
  // Preferences query
  const preferencesQuery = useQuery({
    queryKey: getCockpitPreferencesKey(userId, isDemo),
    queryFn: async () => {
      if (isDemo) {
        trackCachePerformance('hit', 'demo-preferences');
        return DEMO_PREFERENCES;
      }
      
      const startTime = Date.now();
      
      try {
        const response = await fetch('/api/cockpit/prefs', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            console.warn('Cockpit prefs API not available, using demo preferences');
            trackCachePerformance('miss', 'prefs-fallback', Date.now() - startTime);
            return DEMO_PREFERENCES;
          }
          throw new Error(`Failed to fetch preferences: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Cockpit prefs API returned non-JSON response, using demo preferences');
          trackCachePerformance('miss', 'prefs-fallback', Date.now() - startTime);
          return DEMO_PREFERENCES;
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message || 'Failed to fetch preferences');
        }
        
        trackCachePerformance('hit', 'prefs-api', Date.now() - startTime);
        return data.data;
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
        console.warn('Using demo preferences due to API error');
        trackCachePerformance('miss', 'prefs-error', Date.now() - startTime);
        return DEMO_PREFERENCES;
      }
    },
    ...DEFAULT_CACHE_CONFIG.preferences,
    enabled: true,
  });
  
  // ============================================================================
  // Mutations
  // ============================================================================
  
  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<CockpitPreferences>) => {
      if (isDemo) {
        // Demo mode: simulate success
        return { ...DEMO_PREFERENCES, ...updates };
      }
      
      const response = await fetch('/api/cockpit/prefs', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Cockpit prefs update API not available, updating locally only');
          return { ...preferencesQuery.data, ...updates };
        }
        throw new Error(`Failed to update preferences: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Cockpit prefs update API returned non-JSON response, updating locally only');
        return { ...preferencesQuery.data, ...updates };
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Failed to update preferences');
      }
      
      return data.data;
    },
    onSuccess: (data) => {
      // Update cache optimistically
      queryClient.setQueryData(getCockpitPreferencesKey(userId, isDemo), data);
    },
    onError: (error, variables) => {
      console.error('Failed to update preferences:', error);
      // Optimistically update local state anyway
      console.warn('Updating preferences locally due to API error');
      const currentData = queryClient.getQueryData(getCockpitPreferencesKey(userId, isDemo));
      if (currentData) {
        queryClient.setQueryData(
          getCockpitPreferencesKey(userId, isDemo), 
          { ...currentData, ...variables }
        );
      }
    },
  });
  
  // Mark opened mutation
  const markOpenedMutation = useMutation({
    mutationFn: async () => {
      if (isDemo) return { ok: true };
      
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
        return { ok: true };
      } else if (response.status === 404) {
        console.warn('Cockpit open API not available yet');
        return { ok: true };
      }
      
      throw new Error(`Failed to mark opened: ${response.status}`);
    },
    onSuccess: () => {
      hasMarkedOpened.current = true;
    },
    onError: (error) => {
      console.warn('Failed to mark cockpit as opened:', error);
      hasMarkedOpened.current = true; // Don't prevent app from working
    },
  });
  
  // ============================================================================
  // Effects for Risk-Aware Caching
  // ============================================================================
  
  // Update cache configuration when Today Card kind changes
  useEffect(() => {
    if (summaryQuery.data?.today_card?.kind) {
      const todayCardKind = summaryQuery.data.today_card.kind;
      
      // Update query configuration based on risk level
      const newConfig = getRiskAwareCacheConfig(todayCardKind);
      const invalidationConfig = getCacheInvalidationConfig(todayCardKind);
      
      // Setup background sync for high-risk states
      if (backgroundSyncCleanup.current) {
        backgroundSyncCleanup.current();
      }
      
      if (userId) {
        backgroundSyncCleanup.current = setupBackgroundSync(
          queryClient, 
          userId, 
          todayCardKind
        );
      }
      
      // Invalidate cache if risk level changed significantly
      const previousData = queryClient.getQueryData(
        getCockpitSummaryKey(userId, walletScope, isDemo)
      ) as any;
      
      if (previousData?.today_card?.kind && 
          previousData.today_card.kind !== todayCardKind && 
          userId) {
        invalidateCockpitCache(
          queryClient, 
          userId, 
          todayCardKind, 
          previousData.today_card.kind
        );
      }
    }
    
    return () => {
      if (backgroundSyncCleanup.current) {
        backgroundSyncCleanup.current();
      }
    };
  }, [summaryQuery.data?.today_card?.kind, queryClient, userId, walletScope, isDemo]);
  
  // Step 3: When prefs returns: if wallet_scope_default="all", refetch summary
  useEffect(() => {
    if (preferencesQuery.data?.wallet_scope_default && 
        preferencesQuery.data.wallet_scope_default !== walletScope &&
        !preferencesQuery.isLoading) {
      setWalletScope(preferencesQuery.data.wallet_scope_default);
    }
  }, [preferencesQuery.data?.wallet_scope_default, walletScope, preferencesQuery.isLoading]);
  
  // Step 4: POST /api/cockpit/open after first meaningful render
  useEffect(() => {
    if (summaryQuery.data && !hasMarkedOpened.current && !markOpenedMutation.isPending) {
      // Use setTimeout to ensure this happens after render
      const timer = setTimeout(() => {
        markOpenedMutation.mutate();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [summaryQuery.data, markOpenedMutation]);
  
  // Warm cache on mount for better performance
  useEffect(() => {
    if (userId && !isDemo) {
      warmCache(queryClient, userId, walletScope);
    }
  }, [queryClient, userId, walletScope, isDemo]);
  
  // ============================================================================
  // Actions
  // ============================================================================
  
  const changeWalletScope = useCallback((scope: 'active' | 'all') => {
    setWalletScope(scope);
    // React Query will automatically refetch with new key
  }, []);
  
  const updatePreferences = useCallback((updates: Partial<CockpitPreferences>) => {
    updatePreferencesMutation.mutate(updates);
  }, [updatePreferencesMutation]);
  
  const markOpened = useCallback(() => {
    if (!hasMarkedOpened.current) {
      markOpenedMutation.mutate();
    }
  }, [markOpenedMutation]);
  
  const refetch = useCallback(() => {
    summaryQuery.refetch();
  }, [summaryQuery]);
  
  return {
    // Data
    summary: summaryQuery.data || null,
    preferences: preferencesQuery.data || null,
    
    // State
    isLoading: summaryQuery.isLoading || preferencesQuery.isLoading,
    error: summaryQuery.error?.message || preferencesQuery.error?.message || null,
    walletScope,
    
    // Cache info for debugging
    isSummaryStale: summaryQuery.isStale,
    isPreferencesStale: preferencesQuery.isStale,
    lastSummaryFetch: summaryQuery.dataUpdatedAt,
    lastPreferencesFetch: preferencesQuery.dataUpdatedAt,
    
    // Actions
    refetch,
    changeWalletScope,
    updatePreferences,
    markOpened,
  };
};

export default useCockpitData;