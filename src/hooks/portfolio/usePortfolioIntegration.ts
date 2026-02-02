/**
 * Portfolio Integration Hook
 * 
 * Wires together all portfolio components with their respective API endpoints.
 * Follows reuse-first architecture by extending existing hooks and patterns.
 * 
 * Task 18.1: Wire portfolio components together
 * Requirements: 1.6
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { WalletScope, PortfolioSnapshot, RecommendedAction, ApprovalRisk, IntentPlan } from '@/types/portfolio';
import { useDemoMode } from '@/lib/ux/DemoModeManager';
import { 
  getDemoPortfolioSnapshot, 
  getDemoRecommendedActions, 
  getDemoApprovalRisks 
} from '@/lib/services/portfolioDemoDataService';

// ============================================================================
// Query Keys
// ============================================================================

export const portfolioKeys = {
  all: ['portfolio'] as const,
  snapshot: (scope: WalletScope) => [...portfolioKeys.all, 'snapshot', scope] as const,
  actions: (scope: WalletScope) => [...portfolioKeys.all, 'actions', scope] as const,
  approvals: (scope: WalletScope, cursor?: string) => [...portfolioKeys.all, 'approvals', scope, cursor] as const,
  positions: (scope: WalletScope, cursor?: string) => [...portfolioKeys.all, 'positions', scope, cursor] as const,
  plan: (planId: string) => [...portfolioKeys.all, 'plan', planId] as const,
  planSteps: (planId: string) => [...portfolioKeys.all, 'plan', planId, 'steps'] as const,
};

// ============================================================================
// API Client Functions
// ============================================================================

async function fetchPortfolioSnapshot(scope: WalletScope, isDemo: boolean): Promise<PortfolioSnapshot> {
  // Return demo data immediately if in demo mode
  if (isDemo) {
    return getDemoPortfolioSnapshot();
  }

  const params = new URLSearchParams();
  params.set('scope', scope.mode);
  if (scope.mode === 'active_wallet') {
    params.set('wallet', scope.address);
  }

  const response = await fetch(`/api/v1/portfolio/snapshot?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch portfolio snapshot: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Validate API version
  if (data.apiVersion !== 'v1') {
    console.warn('API version mismatch:', data.apiVersion);
  }

  return data;
}

async function fetchRecommendedActions(scope: WalletScope, isDemo: boolean): Promise<{ items: RecommendedAction[] }> {
  // Return demo data immediately if in demo mode
  if (isDemo) {
    return { items: getDemoRecommendedActions() };
  }

  const params = new URLSearchParams();
  params.set('scope', scope.mode);
  if (scope.mode === 'active_wallet') {
    params.set('wallet', scope.address);
  }

  const response = await fetch(`/api/v1/portfolio/actions?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch recommended actions: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Validate API version
  if (data.apiVersion !== 'v1') {
    console.warn('API version mismatch:', data.apiVersion);
  }

  return data;
}

async function fetchApprovalRisks(
  scope: WalletScope,
  isDemo: boolean,
  cursor?: string
): Promise<{ items: ApprovalRisk[]; nextCursor?: string }> {
  // Return demo data immediately if in demo mode
  if (isDemo) {
    return { items: getDemoApprovalRisks() };
  }

  const params = new URLSearchParams();
  params.set('scope', scope.mode);
  if (scope.mode === 'active_wallet') {
    params.set('wallet', scope.address);
  }
  if (cursor) {
    params.set('cursor', cursor);
  }

  const response = await fetch(`/api/v1/portfolio/approvals?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch approval risks: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Validate API version
  if (data.apiVersion !== 'v1') {
    console.warn('API version mismatch:', data.apiVersion);
  }

  return data;
}

async function fetchIntentPlan(planId: string): Promise<IntentPlan> {
  const response = await fetch(`/api/v1/portfolio/plans/${planId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch intent plan: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Validate API version
  if (data.apiVersion !== 'v1') {
    console.warn('API version mismatch:', data.apiVersion);
  }

  return data;
}

// ============================================================================
// Portfolio Snapshot Hook
// ============================================================================

export interface UsePortfolioSnapshotOptions {
  scope: WalletScope;
  enabled?: boolean;
}

export function usePortfolioSnapshot({ scope, enabled = true }: UsePortfolioSnapshotOptions) {
  const queryClient = useQueryClient();
  const { isDemo } = useDemoMode();

  const query = useQuery({
    queryKey: [...portfolioKeys.snapshot(scope), isDemo],
    queryFn: () => fetchPortfolioSnapshot(scope, isDemo),
    enabled,
    staleTime: isDemo ? Infinity : 60_000, // Demo data never stales
    refetchInterval: isDemo ? false : 30_000, // No auto-refetch in demo mode
    retry: isDemo ? 0 : 2, // No retries in demo mode
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: portfolioKeys.snapshot(scope) });
  }, [queryClient, scope]);

  return {
    ...query,
    snapshot: query.data,
    invalidate,
  };
}

// ============================================================================
// Recommended Actions Hook
// ============================================================================

export interface UseRecommendedActionsOptions {
  scope: WalletScope;
  enabled?: boolean;
}

export function useRecommendedActions({ scope, enabled = true }: UseRecommendedActionsOptions) {
  const queryClient = useQueryClient();
  const { isDemo } = useDemoMode();

  const query = useQuery({
    queryKey: [...portfolioKeys.actions(scope), isDemo],
    queryFn: () => fetchRecommendedActions(scope, isDemo),
    enabled,
    staleTime: isDemo ? Infinity : 60_000, // Demo data never stales
    refetchInterval: isDemo ? false : 30_000, // No auto-refetch in demo mode
    retry: isDemo ? 0 : 2, // No retries in demo mode
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: portfolioKeys.actions(scope) });
  }, [queryClient, scope]);

  return {
    ...query,
    actions: query.data?.items || [],
    invalidate,
  };
}

// ============================================================================
// Approval Risks Hook
// ============================================================================

export interface UseApprovalRisksOptions {
  scope: WalletScope;
  cursor?: string;
  enabled?: boolean;
}

export function useApprovalRisks({ scope, cursor, enabled = true }: UseApprovalRisksOptions) {
  const queryClient = useQueryClient();
  const { isDemo } = useDemoMode();

  const query = useQuery({
    queryKey: [...portfolioKeys.approvals(scope, cursor), isDemo],
    queryFn: () => fetchApprovalRisks(scope, isDemo, cursor),
    enabled,
    staleTime: isDemo ? Infinity : 60_000, // Demo data never stales
    retry: isDemo ? 0 : 2, // No retries in demo mode
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: portfolioKeys.approvals(scope) });
  }, [queryClient, scope]);

  return {
    ...query,
    approvals: query.data?.items || [],
    nextCursor: query.data?.nextCursor,
    invalidate,
  };
}

// ============================================================================
// Intent Plan Hook
// ============================================================================

export interface UseIntentPlanOptions {
  planId: string;
  enabled?: boolean;
}

export function useIntentPlan({ planId, enabled = true }: UseIntentPlanOptions) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: portfolioKeys.plan(planId),
    queryFn: () => fetchIntentPlan(planId),
    enabled: enabled && !!planId,
    staleTime: 10_000, // 10 seconds (plans change frequently)
    retry: 2,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: portfolioKeys.plan(planId) });
  }, [queryClient, planId]);

  return {
    ...query,
    plan: query.data,
    invalidate,
  };
}

// ============================================================================
// Unified Portfolio Integration Hook
// ============================================================================

export interface UsePortfolioIntegrationOptions {
  scope: WalletScope;
  enableSnapshot?: boolean;
  enableActions?: boolean;
  enableApprovals?: boolean;
}

/**
 * Unified hook that integrates all portfolio data sources.
 * Use this for components that need multiple portfolio data types.
 */
export function usePortfolioIntegration({
  scope,
  enableSnapshot = true,
  enableActions = true,
  enableApprovals = true,
}: UsePortfolioIntegrationOptions) {
  const queryClient = useQueryClient();
  const { isDemo } = useDemoMode();
  const snapshot = usePortfolioSnapshot({ scope, enabled: enableSnapshot });
  const actions = useRecommendedActions({ scope, enabled: enableActions });
  const approvals = useApprovalRisks({ scope, enabled: enableApprovals });

  const isLoading = snapshot.isLoading || actions.isLoading || approvals.isLoading;
  const isError = snapshot.isError || actions.isError || approvals.isError;
  const error = snapshot.error || actions.error || approvals.error;

  const invalidateAll = useCallback(() => {
    snapshot.invalidate();
    actions.invalidate();
    approvals.invalidate();
  }, [snapshot, actions, approvals]);

  // Invalidate all queries when wallet scope OR demo mode changes
  // This ensures fresh data when switching wallets or toggling demo mode
  useEffect(() => {
    // Clear all portfolio queries for the previous scope
    queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    
    // Refetch immediately with new scope (unless in demo mode)
    if (!isDemo) {
      if (enableSnapshot) snapshot.refetch();
      if (enableActions) actions.refetch();
      if (enableApprovals) approvals.refetch();
    }
  }, [scope.mode, scope.mode === 'active_wallet' ? scope.address : null, isDemo]);

  return {
    snapshot: snapshot.snapshot,
    actions: actions.actions,
    approvals: approvals.approvals,
    isLoading,
    isError,
    error,
    invalidateAll,
    isDemo, // Expose demo mode state
    // Individual query states for granular control
    snapshotQuery: snapshot,
    actionsQuery: actions,
    approvalsQuery: approvals,
  };
}
