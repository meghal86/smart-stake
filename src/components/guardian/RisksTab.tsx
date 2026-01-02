import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, FileWarning, EyeOff, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FixRiskModal } from './FixRiskModal';
import { WalletScopeHeader } from './WalletScopeHeader';
import { useWallet } from '@/contexts/WalletContext';

interface Risk {
  id: string;
  address: string;
  contract: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  details: string;
  detected_at: string;
}

interface RisksTabProps {
  walletAddress?: string;
}

export function RisksTab({ walletAddress }: RisksTabProps) {
  const [showFixModal, setShowFixModal] = useState(false);
  const { connectedWallets, activeWallet } = useWallet();

  // Get wallet label for display
  const activeWalletData = connectedWallets.find(w => w.address === activeWallet);
  const walletLabel = activeWalletData?.label || activeWalletData?.ens || activeWalletData?.lens;

  const { data: risks = [], isLoading, refetch } = useQuery({
    queryKey: ['guardian_risks', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      
      const { data, error } = await supabase
        .from('guardian_risks')
        .select('*')
        .eq('address', walletAddress)
        .order('detected_at', { ascending: false });
      
      if (error) throw error;
      return data as Risk[];
    },
    enabled: !!walletAddress,
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <ShieldAlert className="w-5 h-5 text-red-400" />;
      case 'medium': return <FileWarning className="w-5 h-5 text-yellow-400" />;
      case 'low': return <EyeOff className="w-5 h-5 text-green-400" />;
      default: return <ShieldAlert className="w-5 h-5 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const mockRiskItems = risks.map(risk => ({
    id: risk.id,
    token: risk.contract,
    tokenSymbol: 'TOKEN',
    spender: risk.contract,
    spenderName: risk.category,
    allowance: 'unlimited',
    severity: risk.severity,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C9A7]"></div>
      </div>
    );
  }

  if (risks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <ShieldAlert className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No Active Risks</h3>
        <p className="text-gray-400">Your wallet looks secure! No risks detected in the latest scan.</p>
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
          {risks.length} Active Risk{risks.length !== 1 ? 's' : ''}
        </h3>
        <button
          onClick={() => setShowFixModal(true)}
          className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] text-white text-sm font-medium hover:opacity-90 transition"
        >
          Fix All Risks
        </button>
      </div>

      <div className="grid gap-4">
        {risks.map((risk, index) => (
          <motion.div
            key={risk.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-[rgba(20,22,40,0.8)] rounded-xl p-4 border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)] transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getSeverityIcon(risk.severity)}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-white">{risk.category}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(risk.severity)}`}>
                      {risk.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{risk.details}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Contract: {risk.contract.slice(0, 6)}...{risk.contract.slice(-4)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowFixModal(true)}
                className="px-3 py-1 rounded-lg bg-[#00C9A7]/10 text-[#00C9A7] hover:bg-[#00C9A7]/20 text-sm font-medium transition"
              >
                Fix
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <FixRiskModal
        isOpen={showFixModal}
        onClose={() => setShowFixModal(false)}
        risks={mockRiskItems}
        onSuccess={() => {
          setShowFixModal(false);
          refetch();
        }}
      />
    </div>
  );
}