import { motion } from 'framer-motion';
import { Bell, Clock, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { WalletScopeHeader } from './WalletScopeHeader';
import { useWallet } from '@/contexts/WalletContext';
import { useGuardianScan } from '@/hooks/useGuardianScan';
import { fetchGuardianAlerts } from '@/services/guardianLedgerService';

interface AlertsTabProps {
  walletAddress?: string;
}

interface LiveAlert {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  createdAt: string;
}

export function AlertsTab({ walletAddress }: AlertsTabProps) {
  const { connectedWallets, activeWallet } = useWallet();
  const activeWalletData = connectedWallets.find(w => w.address === activeWallet);
  const walletLabel = activeWalletData?.label || activeWalletData?.ens || activeWalletData?.lens;

  const { data: scanResult, isLoading } = useGuardianScan({
    walletAddress,
    enabled: !!walletAddress,
    scope: 'explicit',
  });
  const { data: persistedAlerts = [] } = useQuery({
    queryKey: ['guardian-alert-events', walletAddress?.toLowerCase()],
    queryFn: () => fetchGuardianAlerts(walletAddress),
    enabled: Boolean(walletAddress),
    staleTime: 60_000,
  });

  const liveAlerts: LiveAlert[] = [
    ...(scanResult?.flags || []).map((finding, index) => ({
      id: `finding-${index}`,
      title: finding.type.replaceAll('_', ' '),
      description: finding.description,
      severity: finding.severity === 'critical' || finding.severity === 'high'
        ? 'high'
        : finding.severity === 'medium'
          ? 'medium'
          : 'low',
      createdAt: scanResult?.scannedAt || new Date().toISOString(),
    })),
    ...(scanResult?.approvals || [])
      .filter((approval) => approval.riskLevel === 'critical' || approval.riskLevel === 'high')
      .map((approval, index) => ({
        id: `approval-${index}`,
        title: `Approval risk: ${approval.token}`,
        description: `${approval.spenderName || approval.spender || 'An app'} still has ${approval.isUnlimited ? 'unlimited' : 'active'} permission to move this token.`,
        severity: approval.riskLevel === 'critical' || approval.riskLevel === 'high' ? 'high' : 'medium',
        createdAt: approval.approvedAt,
      })),
  ];
  const alerts: LiveAlert[] = persistedAlerts.length > 0
    ? persistedAlerts.map((alert) => ({
        id: alert.id,
        title: alert.title,
        description: alert.body,
        severity: alert.severity === 'critical' ? 'high' : alert.severity,
        createdAt: alert.created_at,
      }))
    : liveAlerts;

  const getSeverityIcon = (severity: LiveAlert['severity']) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'medium': return <Bell className="w-5 h-5 text-yellow-400" />;
      case 'low': return <Clock className="w-5 h-5 text-green-400" />;
    }
  };

  const getSeverityColor = (severity: LiveAlert['severity']) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C9A7]"></div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No Recent Alerts</h3>
        <p className="text-gray-400">Guardian did not surface any live alerts in the latest wallet scan.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <WalletScopeHeader
        walletAddress={walletAddress}
        walletLabel={walletLabel}
      />

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Recent Alerts ({alerts.length})
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-2 h-2 bg-[#00C9A7] rounded-full animate-pulse"></div>
          Latest live scan
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-[rgba(20,22,40,0.8)] rounded-xl p-4 border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)] transition-colors"
          >
            <div className="flex items-start gap-3">
              {getSeverityIcon(alert.severity)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-white capitalize">{alert.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-2">{alert.description}</p>
                <span className="text-xs text-gray-500">{formatTime(alert.createdAt)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
