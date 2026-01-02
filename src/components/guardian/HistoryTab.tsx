import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Calendar, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { WalletScopeHeader } from './WalletScopeHeader';
import { useWallet } from '@/contexts/WalletContext';

interface ScanHistory {
  id: string;
  address: string;
  trust_score: number;
  risk_count: number;
  created_at: string;
}

interface HistoryTabProps {
  walletAddress?: string;
}

export function HistoryTab({ walletAddress }: HistoryTabProps) {
  const { connectedWallets, activeWallet } = useWallet();

  // Get wallet label for display
  const activeWalletData = connectedWallets.find(w => w.address === activeWallet);
  const walletLabel = activeWalletData?.label || activeWalletData?.ens || activeWalletData?.lens;
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['guardian_history', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      
      const { data, error } = await supabase
        .from('guardian_scans')
        .select('id, address, trust_score, risk_count, created_at')
        .eq('address', walletAddress)
        .order('created_at', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return data as ScanHistory[];
    },
    enabled: !!walletAddress,
  });

  const chartData = history
    .slice()
    .reverse()
    .map((scan, index) => ({
      scan: index + 1,
      score: scan.trust_score,
      date: new Date(scan.created_at).toLocaleDateString(),
      risks: scan.risk_count,
    }));

  const averageScore = history.length > 0 
    ? Math.round(history.reduce((sum, scan) => sum + scan.trust_score, 0) / history.length)
    : 0;

  const trend = history.length >= 2 
    ? history[0].trust_score - history[1].trust_score
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C9A7]"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No Scan History</h3>
        <p className="text-gray-400">Your scan history will appear here after your first security check.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <WalletScopeHeader 
        walletAddress={walletAddress} 
        walletLabel={walletLabel}
      />
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[rgba(20,22,40,0.8)] rounded-xl p-4 border border-[rgba(255,255,255,0.08)]"
        >
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-[#00C9A7]" />
            <h4 className="font-medium text-white">Average Score</h4>
          </div>
          <p className="text-2xl font-bold text-[#00C9A7]">{averageScore}</p>
          <p className="text-xs text-gray-400">Last {history.length} scans</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[rgba(20,22,40,0.8)] rounded-xl p-4 border border-[rgba(255,255,255,0.08)]"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h4 className="font-medium text-white">Trend</h4>
          </div>
          <p className={`text-2xl font-bold ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend}
          </p>
          <p className="text-xs text-gray-400">Since last scan</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[rgba(20,22,40,0.8)] rounded-xl p-4 border border-[rgba(255,255,255,0.08)]"
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            <h4 className="font-medium text-white">Total Scans</h4>
          </div>
          <p className="text-2xl font-bold text-white">{history.length}</p>
          <p className="text-xs text-gray-400">All time</p>
        </motion.div>
      </div>

      {/* Trust Score Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[rgba(20,22,40,0.8)] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Trust Score Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis 
                dataKey="scan" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(20,22,40,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
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
                stroke="#00C9A7"
                strokeWidth={3}
                dot={{ fill: '#00C9A7', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#00C9A7', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Scans List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-[rgba(20,22,40,0.8)] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Recent Scans</h3>
        <div className="space-y-3">
          {history.slice(0, 10).map((scan, index) => (
            <div
              key={scan.id}
              className="flex items-center justify-between py-2 border-b border-gray-700/40 last:border-b-0"
            >
              <div>
                <p className="text-sm text-white">
                  {new Date(scan.created_at).toLocaleDateString()} at{' '}
                  {new Date(scan.created_at).toLocaleTimeString()}
                </p>
                <p className="text-xs text-gray-400">
                  {scan.risk_count} risk{scan.risk_count !== 1 ? 's' : ''} detected
                </p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-semibold ${
                  scan.trust_score >= 80 ? 'text-green-400' : 
                  scan.trust_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {scan.trust_score}
                </p>
                <p className="text-xs text-gray-400">Trust Score</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}