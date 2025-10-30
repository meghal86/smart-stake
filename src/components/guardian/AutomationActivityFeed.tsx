import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ExternalLink, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AutomationLog {
  id: string;
  action_type: string;
  trigger_reason: string;
  tx_hash?: string;
  contract_address?: string;
  token_address?: string;
  trust_score_before?: number;
  trust_score_after?: number;
  gas_cost_wei?: string;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed' | 'reverted';
  error_message?: string;
  created_at: string;
  confirmed_at?: string;
}

export function AutomationActivityFeed() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  const fetchLogs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('guardian_automation_logs')
        .select(`
          *,
          guardian_automations!inner(user_id)
        `)
        .eq('guardian_automations.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching automation logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'reverted':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
      case 'submitted':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'failed':
      case 'reverted': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'pending':
      case 'submitted': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const formatGasCost = (gasCostWei?: string) => {
    if (!gasCostWei) return 'N/A';
    const ethAmount = parseFloat(gasCostWei) / 1e18;
    return `${ethAmount.toFixed(6)} ETH`;
  };

  const formatAddress = (address?: string) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No automation activity yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Guardian automation actions will appear here once they start executing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Automation Activity</h3>
        <button
          onClick={fetchLogs}
          className="text-sm text-blue-600 hover:underline"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {logs.map((log, index) => (
          <motion.div
            key={log.id}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getStatusIcon(log.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {log.action_type === 'revoke' ? 'Token Approval Revoked' : log.action_type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {log.trigger_reason}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                    <div>
                      <span className="font-medium">Contract:</span> {formatAddress(log.contract_address)}
                    </div>
                    <div>
                      <span className="font-medium">Token:</span> {formatAddress(log.token_address)}
                    </div>
                    {log.trust_score_before && (
                      <div>
                        <span className="font-medium">Trust Score:</span> {log.trust_score_before.toFixed(1)}
                        {log.trust_score_after && ` → ${log.trust_score_after.toFixed(1)}`}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Gas Cost:</span> {formatGasCost(log.gas_cost_wei)}
                    </div>
                  </div>

                  {log.error_message && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600">
                      {log.error_message}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right text-xs text-gray-500">
                <div>{new Date(log.created_at).toLocaleDateString()}</div>
                <div>{new Date(log.created_at).toLocaleTimeString()}</div>
                {log.tx_hash && (
                  <a
                    href={`https://etherscan.io/tx/${log.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Tx
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}