/**
 * Guardian state management with Zustand
 */
import { create } from 'zustand';
import type { TrustScoreResult } from '@/lib/guardian/trust-score';
import type { ApprovalRisk } from '@/lib/guardian/approvals';

export interface GuardianState {
  // Scan state
  scanning: boolean;
  result: GuardianScanResult | null;
  lastError: string | null;

  // Auto-scan trigger
  autoScanEnabled: boolean;
  lastScannedAddress: string | null;

  // Actions
  setScanning: (scanning: boolean) => void;
  setResult: (result: GuardianScanResult) => void;
  setError: (error: string) => void;
  clearError: () => void;
  reset: () => void;
  setAutoScanEnabled: (enabled: boolean) => void;
  setLastScannedAddress: (address: string | null) => void;
}

export interface GuardianScanResult extends TrustScoreResult {
  chains: string[];
  lastScanAt: number;
  approvals: ApprovalRisk[];
  targetAddress: string;
  scanId?: string;
}

const initialState = {
  scanning: false,
  result: null,
  lastError: null,
  autoScanEnabled: true,
  lastScannedAddress: null,
};

export const useGuardianStore = create<GuardianState>((set) => ({
  ...initialState,

  setScanning: (scanning) => set({ scanning }),

  setResult: (result) =>
    set({
      result,
      scanning: false,
      lastError: null,
      lastScannedAddress: result.targetAddress,
    }),

  setError: (error) =>
    set({
      lastError: error,
      scanning: false,
    }),

  clearError: () => set({ lastError: null }),

  reset: () => set(initialState),

  setAutoScanEnabled: (enabled) => set({ autoScanEnabled: enabled }),

  setLastScannedAddress: (address) => set({ lastScannedAddress: address }),
}));

/**
 * Helper hook to check if auto-scan should trigger
 */
export function useAutoScanTrigger() {
  const { autoScanEnabled, lastScannedAddress } = useGuardianStore();

  return (newAddress: string | null) => {
    if (!newAddress) return false;
    if (!autoScanEnabled) return false;
    if (lastScannedAddress === newAddress.toLowerCase()) return false;
    return true;
  };
}

/**
 * Selector hooks for specific state slices
 */
export const useGuardianScanning = () =>
  useGuardianStore((state) => state.scanning);

export const useGuardianResult = () =>
  useGuardianStore((state) => state.result);

export const useGuardianError = () =>
  useGuardianStore((state) => state.lastError);

export const useGuardianAutoScan = () =>
  useGuardianStore((state) => state.autoScanEnabled);

