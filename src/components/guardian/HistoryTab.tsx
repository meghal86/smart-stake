import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowUpRight, Calendar, CheckCircle2, Clock3, Shield, TrendingUp, XCircle } from 'lucide-react';
import { WalletScopeHeader } from './WalletScopeHeader';
import { useWallet } from '@/contexts/WalletContext';
import { useGuardianScan } from '@/hooks/useGuardianScan';
import { readGuardianHistory } from '@/lib/guardian/history-cache';
import { fetchGuardianRemediationOperations, fetchGuardianScanHistory } from '@/services/guardianLedgerService';

interface HistoryTabProps {
  walletAddress?: string;
}

export function HistoryTab({ walletAddress }: HistoryTabProps) {
  const { connectedWallets, activeWallet } = useWallet();
  const activeWalletData = connectedWallets.find(w => w.address === activeWallet);
  const walletLabel = activeWalletData?.label || activeWalletData?.ens || activeWalletData?.lens;

  const { data: latestScan, isLoading } = useGuardianScan({
    walletAddress,
    enabled: !!walletAddress,
    scope: 'explicit',
  });
  const { data: persistedHistory = [] } = useQuery({
    queryKey: ['guardian-scan-history', walletAddress?.toLowerCase()],
    queryFn: () => fetchGuardianScanHistory(walletAddress),
    enabled: Boolean(walletAddress),
    staleTime: 60_000,
  });
  const { data: remediationOperations = [] } = useQuery({
    queryKey: ['guardian-remediation-operations', walletAddress?.toLowerCase()],
    queryFn: () => fetchGuardianRemediationOperations(walletAddress),
    enabled: Boolean(walletAddress),
    staleTime: 30_000,
  });

  const history = useMemo(() => {
    if (persistedHistory.length > 0) {
      return persistedHistory.map((scan) => ({
        walletAddress: scan.wallet_address,
        scannedAt: scan.scanned_at,
        trustScore: scan.trust_score,
        riskCount: scan.findings_count,
        confidence: scan.confidence,
        statusLabel: scan.status_label,
      }));
    }

    const cached = readGuardianHistory(walletAddress);
    if (!latestScan) {
      return cached;
    }

    const latestEntry = {
      walletAddress: latestScan.walletAddress,
      scannedAt: latestScan.scannedAt,
      trustScore: latestScan.trustScorePercent,
      riskCount: latestScan.flags.length,
      confidence: latestScan.confidence,
      statusLabel: latestScan.statusLabel,
    };

    return [latestEntry, ...cached.filter((entry) => entry.scannedAt !== latestEntry.scannedAt)].slice(0, 30);
  }, [latestScan, persistedHistory, walletAddress]);

  const chartData = history
    .slice()
    .reverse()
    .map((scan, index) => ({
      scan: index + 1,
      score: scan.trustScore,
      date: new Date(scan.scannedAt).toLocaleDateString(),
      risks: scan.riskCount,
    }));

  const averageScore = history.length > 0
    ? Math.round(history.reduce((sum, scan) => sum + scan.trustScore, 0) / history.length)
    : 0;

  const trend = history.length >= 2
    ? history[0].trustScore - history[1].trustScore
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#efe6d6]"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-white/10 bg-[#080b14]/90 px-6 py-14 text-center shadow-[0_28px_70px_rgba(0,0,0,0.45)]"
      >
        <Calendar className="mx-auto mb-4 h-12 w-12 text-[#9aa4bf]" />
        <h3 className="mb-2 text-lg font-medium text-[#f3efe7]">No Scan History Yet</h3>
        <p className="mx-auto max-w-lg text-sm text-[#98a3b8]">
          Run a live Guardian scan and this space will start showing your score trend, scan history, and revoke receipts.
        </p>
      </motion.div>
    );
  }

  const historyPanelClass =
    'rounded-[28px] border border-white/10 bg-[#080b14]/90 shadow-[0_28px_70px_rgba(0,0,0,0.45)]';
  const statPanelClass =
    'rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,22,38,0.98),rgba(9,12,20,0.96))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)]';

  const getOperationIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4 text-[#77d6b1]" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-[#f08a86]" />;
      case 'broadcast':
        return <ArrowUpRight className="h-4 w-4 text-[#8db4ff]" />;
      default:
        return <Clock3 className="h-4 w-4 text-[#d9c486]" />;
    }
  };

  const getOperationLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'failed':
        return 'Failed';
      case 'broadcast':
        return 'Broadcast';
      case 'requested':
        return 'Ready to sign';
      default:
        return 'Prepared';
    }
  };

  return (
    <div className="space-y-6">
      <WalletScopeHeader
        walletAddress={walletAddress}
        walletLabel={walletLabel}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={statPanelClass}
        >
          <div className="mb-2 flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#efe6d6]" />
            <h4 className="font-medium text-[#f3efe7]">Average Score</h4>
          </div>
          <p className="text-3xl font-semibold tracking-tight text-[#f3efe7]">{averageScore}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8e98ad]">Last {history.length} live scans</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={statPanelClass}
        >
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#9bc0ff]" />
            <h4 className="font-medium text-[#f3efe7]">Trend</h4>
          </div>
          <p className={`text-3xl font-semibold tracking-tight ${trend >= 0 ? 'text-[#77d6b1]' : 'text-[#f08a86]'}`}>
            {trend >= 0 ? '+' : ''}{trend}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8e98ad]">Since last live scan</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={statPanelClass}
        >
          <div className="mb-2 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#d8b4ff]" />
            <h4 className="font-medium text-[#f3efe7]">Total Scans</h4>
          </div>
          <p className="text-3xl font-semibold tracking-tight text-[#f3efe7]">{history.length}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8e98ad]">Live ledger + browser cache</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`${historyPanelClass} p-6`}
      >
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#8e98ad]">Trend</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#f3efe7]">Trust Score Trend</h3>
          </div>
          <p className="text-sm text-[#98a3b8]">Each point is a live Guardian scan for this wallet.</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="scan" axisLine={false} tickLine={false} tick={{ fill: '#8e98ad', fontSize: 12 }} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#8e98ad', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(8, 11, 20, 0.98)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  color: '#f3efe7',
                }}
                labelFormatter={(value) => `Scan ${value}`}
                formatter={(value: number, name: string) => [
                  name === 'score' ? `${value}` : value,
                  name === 'score' ? 'Trust Score' : 'Risks'
                ]}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#efe6d6"
                strokeWidth={3}
                dot={{ fill: '#efe6d6', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, stroke: '#efe6d6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`${historyPanelClass} p-6`}
      >
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#8e98ad]">Archive</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#f3efe7]">Recent Scans</h3>
          </div>
          <p className="text-sm text-[#98a3b8]">Saved scan results for the wallet you are reviewing.</p>
        </div>
        <div className="space-y-3">
          {history.slice(0, 10).map((scan, index) => (
            <div
              key={`${scan.scannedAt}-${index}`}
              className="flex items-center justify-between rounded-[20px] border border-white/8 bg-[rgba(14,18,28,0.8)] px-4 py-4 last:border-b"
            >
              <div>
                <p className="text-sm text-[#f3efe7]">
                  {new Date(scan.scannedAt).toLocaleDateString()} at {new Date(scan.scannedAt).toLocaleTimeString()}
                </p>
                <p className="text-xs text-[#98a3b8]">
                  {scan.riskCount} risk{scan.riskCount !== 1 ? 's' : ''} detected
                </p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-semibold ${
                  scan.trustScore >= 80 ? 'text-[#77d6b1]' :
                  scan.trustScore >= 60 ? 'text-[#d9c486]' : 'text-[#f08a86]'
                }`}>
                  {scan.trustScore}
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-[#8e98ad]">Trust Score</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`${historyPanelClass} p-6`}
      >
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#8e98ad]">Operations</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#f3efe7]">Recent Fixes & Receipts</h3>
          </div>
          <p className="text-sm text-[#98a3b8]">Revoke actions move from prepared to confirmed as wallet receipts arrive.</p>
        </div>

        {remediationOperations.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-white/10 bg-[rgba(12,16,24,0.72)] px-4 py-6 text-sm text-[#98a3b8]">
            No remediation operations yet. Once you revoke an approval, the transaction hash and confirmation status will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {remediationOperations.map((operation) => (
              <div
                key={operation.id}
                className="flex flex-col gap-3 rounded-[20px] border border-white/8 bg-[rgba(14,18,28,0.8)] px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {getOperationIcon(operation.status)}
                    <p className="text-sm font-medium text-[#f3efe7]">
                      {operation.operation_type === 'batch_revoke' ? 'Batch revoke' : 'Approval revoke'}
                    </p>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.16em] text-[#d9c486]">
                      {getOperationLabel(operation.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#98a3b8]">
                    {operation.requested_at ? new Date(operation.requested_at).toLocaleString() : 'Just now'}
                  </p>
                  <p className="mt-2 truncate text-xs text-[#8e98ad]">
                    {operation.tx_hash ? `Tx ${operation.tx_hash.slice(0, 10)}...${operation.tx_hash.slice(-8)}` : 'Waiting for wallet signature'}
                  </p>
                  {operation.error_message ? (
                    <p className="mt-1 text-xs text-[#f08a86]">{operation.error_message}</p>
                  ) : null}
                </div>

                <div className="text-left md:text-right">
                  <p className="text-sm font-medium text-[#f3efe7]">
                    {operation.gas_estimate ? `${Number(operation.gas_estimate).toLocaleString()} gas` : 'Gas pending'}
                  </p>
                  <p className="mt-1 text-xs text-[#98a3b8]">
                    Score impact {operation.score_delta_min ?? 0} to {operation.score_delta_max ?? 0}
                  </p>
                  {operation.confirmed_at ? (
                    <p className="mt-1 text-xs text-[#77d6b1]">
                      Confirmed {new Date(operation.confirmed_at).toLocaleTimeString()}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
