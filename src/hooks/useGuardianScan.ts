import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requestGuardianScan, GuardianScanResult } from '@/services/guardianService';
import { useWallet } from '@/contexts/WalletContext';
import { guardianKeys } from '@/lib/query-keys';

export interface UseGuardianScanOptions {
  walletAddress?: string;
  network?: string;
  enabled?: boolean;
}

export interface UseGuardianScanResult {
  data?: GuardianScanResult;
  isLoading: boolean;
  isRefetching: boolean;
  error: unknown;
  refetch: () => Promise<GuardianScanResult>;
  rescan: () => Promise<GuardianScanResult>;
  isRescanning: boolean;
  statusAccent: string;
  scoreGlow: string;
}

function getStatusAccent(tone: GuardianScanResult['statusTone']) {
  switch (tone) {
    case 'trusted':
      return 'from-emerald-400 via-teal-300 to-cyan-300';
    case 'warning':
      return 'from-amber-400 via-orange-400 to-amber-300';
    case 'danger':
      return 'from-rose-500 via-red-500 to-orange-400';
    default:
      return 'from-slate-400 via-slate-500 to-slate-600';
  }
}

function getScoreGlow(tone: GuardianScanResult['statusTone']) {
  switch (tone) {
    case 'trusted':
      return 'shadow-[0_0_45px_rgba(36,224,195,0.45)]';
    case 'warning':
      return 'shadow-[0_0_45px_rgba(249,176,64,0.45)]';
    case 'danger':
      return 'shadow-[0_0_45px_rgba(249,90,90,0.45)]';
    default:
      return 'shadow-[0_0_30px_rgba(148,163,184,0.35)]';
  }
}

export function useGuardianScan({
  walletAddress = '0xA6bF1D4E9c34d12BfC5e8A946f912e7cC42D2D9C',
  network = 'ethereum',
  enabled = true
}: UseGuardianScanOptions = {}): UseGuardianScanResult {
  const queryClient = useQueryClient();
  const { activeWallet, activeNetwork, isAuthenticated } = useWallet();
  
  // When authenticated, ALWAYS use WalletContext values (never independent wallet state)
  // This ensures all modules read from the same source of truth
  const effectiveWalletAddress = isAuthenticated && activeWallet ? activeWallet : walletAddress;
  const effectiveNetwork = isAuthenticated ? activeNetwork : network;
  
  const queryKey = useMemo(
    () => guardianKeys.scan(effectiveWalletAddress, effectiveNetwork),
    [effectiveWalletAddress, effectiveNetwork]
  );

  const query = useQuery({
    queryKey,
    enabled: enabled && Boolean(effectiveWalletAddress),
    queryFn: () => requestGuardianScan({ walletAddress: effectiveWalletAddress, network: effectiveNetwork }),
    staleTime: 60_000
  });

  const mutation = useMutation<GuardianScanResult>({
    mutationFn: () => requestGuardianScan({ walletAddress: effectiveWalletAddress, network: effectiveNetwork }),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKey, result);
    }
  });

  const statusAccent = useMemo(() => {
    if (!query.data) return getStatusAccent('trusted');
    return getStatusAccent(query.data.statusTone);
  }, [query.data]);

  const scoreGlow = useMemo(() => {
    if (!query.data) return getScoreGlow('trusted');
    return getScoreGlow(query.data.statusTone);
  }, [query.data]);

  const refetch = async () => {
    const result = await queryClient.fetchQuery({
      queryKey,
      queryFn: () => requestGuardianScan({ walletAddress: effectiveWalletAddress, network: effectiveNetwork })
    });
    return result;
  };

  return {
    data: query.data,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch,
    rescan: () => mutation.mutateAsync(),
    isRescanning: mutation.isPending,
    statusAccent,
    scoreGlow
  };
}
