import { motion } from 'framer-motion';
import { ShieldAlert, FileWarning, EyeOff, Shield } from 'lucide-react';
import { WalletScopeHeader } from './WalletScopeHeader';
import { useWallet } from '@/contexts/WalletContext';
import { useGuardianScan } from '@/hooks/useGuardianScan';

interface RisksTabProps {
  walletAddress?: string;
}

interface LiveRiskItem {
  id: string;
  title: string;
  details: string;
  severity: 'high' | 'medium' | 'low';
  category: 'Finding' | 'Approval';
}

export function RisksTab({ walletAddress }: RisksTabProps) {
  const { connectedWallets, activeWallet } = useWallet();
  const activeWalletData = connectedWallets.find(w => w.address === activeWallet);
  const walletLabel = activeWalletData?.label || activeWalletData?.ens || activeWalletData?.lens;

  const { data: scanResult, isLoading } = useGuardianScan({
    walletAddress,
    enabled: !!walletAddress,
    scope: 'explicit',
  });

  const liveRisks: LiveRiskItem[] = [
    ...(scanResult?.flags || []).map((risk, index) => ({
      id: `finding-${index}`,
      title: risk.type.replaceAll('_', ' '),
      details: risk.description,
      severity: risk.severity === 'critical' || risk.severity === 'high'
        ? 'high'
        : risk.severity === 'medium'
          ? 'medium'
          : 'low',
      category: 'Finding' as const,
    })),
    ...(scanResult?.approvals || [])
      .filter((approval) => approval.riskLevel === 'critical' || approval.riskLevel === 'high' || approval.riskLevel === 'medium')
      .map((approval, index) => ({
        id: `approval-${index}`,
        title: approval.spenderName || approval.spender || 'Token approval',
        details: `${approval.token} approval is still active${approval.isUnlimited ? ' with unlimited access' : ''}.`,
        severity: approval.riskLevel === 'critical' || approval.riskLevel === 'high'
          ? 'high'
          : approval.riskLevel === 'medium'
            ? 'medium'
            : 'low',
        category: 'Approval' as const,
      })),
  ];

  const getSeverityIcon = (severity: LiveRiskItem['severity']) => {
    switch (severity) {
      case 'high': return <ShieldAlert className="w-5 h-5 text-red-400" />;
      case 'medium': return <FileWarning className="w-5 h-5 text-yellow-400" />;
      case 'low': return <EyeOff className="w-5 h-5 text-green-400" />;
    }
  };

  const getSeverityColor = (severity: LiveRiskItem['severity']) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C9A7]"></div>
      </div>
    );
  }

  if (liveRisks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No Active Risks</h3>
        <p className="text-gray-400">Guardian did not find any active wallet risks in the latest live scan.</p>
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
          {liveRisks.length} Active Risk{liveRisks.length !== 1 ? 's' : ''}
        </h3>
        <div className="text-sm text-gray-400">Live from latest Guardian scan</div>
      </div>

      <div className="grid gap-4">
        {liveRisks.map((risk, index) => (
          <motion.div
            key={risk.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="bg-[rgba(20,22,40,0.8)] rounded-xl p-4 border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)] transition-colors"
          >
            <div className="flex items-start gap-3">
              {getSeverityIcon(risk.severity)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-white capitalize">{risk.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(risk.severity)}`}>
                    {risk.severity}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/5 text-gray-300">
                    {risk.category}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{risk.details}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
