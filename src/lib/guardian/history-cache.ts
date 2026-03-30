import type { GuardianScanResult } from '@/services/guardianService';

export interface GuardianHistoryEntry {
  walletAddress: string;
  scannedAt: string;
  trustScore: number;
  riskCount: number;
  confidence?: number;
  statusLabel: string;
}

const HISTORY_STORAGE_PREFIX = 'guardian_scan_history:';
const MAX_HISTORY_ENTRIES = 30;

function getHistoryKey(walletAddress: string) {
  return `${HISTORY_STORAGE_PREFIX}${walletAddress.toLowerCase()}`;
}

export function appendGuardianHistoryEntry(scan: GuardianScanResult) {
  if (typeof window === 'undefined' || !scan.walletAddress) return;

  const key = getHistoryKey(scan.walletAddress);
  const existing = readGuardianHistory(scan.walletAddress);
  const nextEntry: GuardianHistoryEntry = {
    walletAddress: scan.walletAddress,
    scannedAt: scan.scannedAt,
    trustScore: scan.trustScorePercent,
    riskCount: scan.flags.length,
    confidence: scan.confidence,
    statusLabel: scan.statusLabel,
  };

  const merged = [nextEntry, ...existing.filter((entry) => entry.scannedAt !== nextEntry.scannedAt)]
    .slice(0, MAX_HISTORY_ENTRIES);

  window.localStorage.setItem(key, JSON.stringify(merged));
}

export function readGuardianHistory(walletAddress?: string): GuardianHistoryEntry[] {
  if (typeof window === 'undefined' || !walletAddress) return [];

  try {
    const raw = window.localStorage.getItem(getHistoryKey(walletAddress));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
