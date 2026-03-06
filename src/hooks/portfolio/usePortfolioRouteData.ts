import { useEffect, useMemo, useState } from 'react';
import { usePortfolioIntegration } from '@/hooks/portfolio/usePortfolioIntegration';
import { useUserAddresses } from '@/hooks/useUserAddresses';
import { FreshnessConfidence, WalletScope } from '@/types/portfolio';

const defaultFreshness: FreshnessConfidence = {
  freshnessSec: 0,
  confidence: 0.7,
  confidenceThreshold: 0.7,
  degraded: false,
};

export function usePortfolioRouteData() {
  const { addresses, loading: addressesLoading, refetch: refetchAddresses } = useUserAddresses();
  const [activeWalletId, setActiveWalletId] = useState<string | null>(null);

  useEffect(() => {
    if (activeWalletId && !addresses.some((address) => address.id === activeWalletId)) {
      setActiveWalletId(null);
    }
  }, [activeWalletId, addresses]);

  const walletScope = useMemo<WalletScope>(() => {
    if (!activeWalletId) {
      return { mode: 'all_wallets' };
    }

    const wallet = addresses.find((address) => address.id === activeWalletId);
    if (!wallet) {
      return { mode: 'all_wallets' };
    }

    return {
      mode: 'active_wallet',
      address: wallet.address as `0x${string}`,
    };
  }, [activeWalletId, addresses]);

  const integration = usePortfolioIntegration({
    scope: walletScope,
    enableSnapshot: true,
    enableActions: true,
    enableApprovals: true,
  });

  const snapshot = integration.snapshot;
  const actions = integration.actions;
  const approvals = integration.approvals;
  const freshness = snapshot?.freshness ?? defaultFreshness;
  const totalValue = snapshot?.netWorth ?? 0;
  const dailyDelta = snapshot?.delta24h ?? 0;
  const overallRiskScore = snapshot?.riskSummary?.overallScore ?? 0;
  const trustIndex = Math.max(0, Math.round((1 - overallRiskScore) * 100));
  const criticalActions = actions.filter((action) => action.severity === 'critical').length;
  const highRiskApprovals = approvals.filter(
    (approval) => approval.severity === 'critical' || approval.severity === 'high'
  ).length;
  const activeWallet = activeWalletId
    ? addresses.find((address) => address.id === activeWalletId) ?? null
    : null;
  const walletScopeLabel = activeWallet
    ? activeWallet.label || `${activeWallet.address.slice(0, 6)}...${activeWallet.address.slice(-4)}`
    : 'All wallets';

  const chainExposure = useMemo(() => {
    const exposure = snapshot?.riskSummary?.exposureByChain ?? {};
    return Object.entries(exposure)
      .map(([chain, value]) => ({ chain, value }))
      .sort((left, right) => right.value - left.value);
  }, [snapshot?.riskSummary?.exposureByChain]);

  const topPositions = useMemo(
    () => [...(snapshot?.positions ?? [])].sort((left, right) => right.valueUsd - left.valueUsd).slice(0, 6),
    [snapshot?.positions]
  );

  return {
    addresses,
    addressesLoading,
    refetchAddresses,
    activeWalletId,
    setActiveWalletId,
    activeWallet,
    walletScopeLabel,
    walletScope,
    snapshot,
    actions,
    approvals,
    freshness,
    totalValue,
    dailyDelta,
    overallRiskScore,
    trustIndex,
    criticalActions,
    highRiskApprovals,
    chainExposure,
    topPositions,
    isDemo: integration.isDemo,
    isLoading: addressesLoading || integration.isLoading,
    isError: integration.isError,
    error: integration.error,
    invalidateAll: integration.invalidateAll,
  };
}
