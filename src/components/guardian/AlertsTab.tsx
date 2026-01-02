import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Bell, ExternalLink, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { WalletScopeHeader } from './WalletScopeHeader';
import { useWallet } from '@/contexts/WalletContext';

interface Alert {
  id: string;
  address: string;
  event_type: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  tx_hash?: string;
  created_at: string;
}

interface AlertsTabProps {
  walletAddress?: string;
}

export function AlertsTab({ walletAddress }: AlertsTabProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { connectedWallets, activeWallet } = useWallet();

  // Get wallet label for display
  const activeWalletData = connectedWallets.find(w => w.address === activeWallet);
  const walletLabel = activeWalletData?.label || activeWalletData?.ens || activeWalletData?.lens;

  const { data: initialAlerts = [], isLoading } = useQuery({
    queryKey: ['guardian_alerts', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      
      const { data, error } = await supabase
        .from('guardian_alerts')
        .select('*')
        .eq('address', walletAddress)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Alert[];
    },
    enabled: !!walletAddress,
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!walletAddress) return;

    setAlerts(initialAlerts);

    const channel = supabase
      .channel('guardian_alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guardian_alerts',
          filter: `address=eq.${walletAddress}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAlerts(prev => [payload.new as Alert, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [walletAddress, initialAlerts]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'medium': return <Bell className="w-5 h-5 text-yellow-400" />;
      case 'low': return <Clock className="w-5 h-5 text-green-400" />;
      default: return <Bell className="w-5 h-5 text-gray-400" />;
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
        <p className="text-gray-400">We'll notify you here when new security events are detected.</p>
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
          Live monitoring
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
                  <h4 className="font-medium text-white">{alert.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-2">{alert.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{formatTime(alert.created_at)}</span>
                  {alert.tx_hash && (
                    <a
                      href={`https://etherscan.io/tx/${alert.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-[#00C9A7] hover:text-[#00D3C7] transition-colors"
                    >
                      View on Etherscan
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}