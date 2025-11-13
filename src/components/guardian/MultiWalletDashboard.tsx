import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scan, RefreshCw, Trash2, Eye, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet as useWalletContext } from '@/contexts/WalletContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface MultiWalletDashboardProps {
  onScanWallet: (address: string) => Promise<void>;
  onScanAll: () => Promise<void>;
  isScanning?: boolean;
}

export default function MultiWalletDashboard({ 
  onScanWallet, 
  onScanAll, 
  isScanning = false 
}: MultiWalletDashboardProps) {
  const { wallets, activeWallet, setActiveWallet, removeWallet } = useWalletContext();
  const { toast } = useToast();
  const [scanningWallet, setScanningWallet] = useState<string | null>(null);

  const handleScanWallet = async (address: string) => {
    setScanningWallet(address);
    try {
      await onScanWallet(address);
      toast({
        title: "Scan Complete",
        description: `Updated security analysis for ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "Unable to complete security scan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setScanningWallet(null);
    }
  };

  const handleRemoveWallet = async (address: string) => {
    try {
      await removeWallet(address);
      toast({
        title: "Wallet Removed",
        description: `Removed ${address.slice(0, 6)}...${address.slice(-4)} from Guardian`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove wallet",
        variant: "destructive"
      });
    }
  };

  const getTrustScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-[#00C9A7]';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrustScoreBadge = (score?: number) => {
    if (!score) return { label: '--', variant: 'secondary' as const };
    if (score >= 80) return { label: score.toString(), variant: 'default' as const };
    if (score >= 60) return { label: score.toString(), variant: 'secondary' as const };
    return { label: score.toString(), variant: 'destructive' as const };
  };

  // Calculate portfolio average
  const validScores = wallets.filter(w => w.trust_score).map(w => w.trust_score!);
  const avgTrust = validScores.length > 0 
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : null;

  if (wallets.length === 0) {
    return (
      <div className="mt-6 p-8 text-center rounded-2xl bg-white/5 border border-gray-700/50">
        <Eye className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-300 mb-2">No Wallets Added</h3>
        <p className="text-sm text-gray-500">
          Add your first wallet to start monitoring security risks
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Header with Portfolio Average */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
            🧭 Your Wallets at a Glance
          </h3>
          {avgTrust && (
            <p className="text-sm text-gray-400 mt-1">
              Portfolio Average: <span className={getTrustScoreColor(avgTrust)}>{avgTrust}</span>
            </p>
          )}
        </div>
        <Button
          onClick={onScanAll}
          disabled={isScanning}
          variant="secondary"
          className="text-[#7B61FF] hover:bg-[#7B61FF]/10"
        >
          {isScanning ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Scan className="w-4 h-4 mr-2" />
              Scan All Wallets
            </>
          )}
        </Button>
      </div>

      {/* Wallets Table */}
      <div className="overflow-x-auto rounded-2xl bg-white/5 border border-gray-700/50">
        <table className="min-w-full text-sm">
          <thead className="text-gray-400 border-b border-gray-700/50">
            <tr>
              <th className="text-left py-3 px-4 font-medium">Wallet</th>
              <th className="text-left py-3 px-4 font-medium">Trust Score</th>
              <th className="text-left py-3 px-4 font-medium">Risks</th>
              <th className="text-left py-3 px-4 font-medium">Last Scan</th>
              <th className="text-right py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {wallets.map((wallet, index) => {
              const isActive = activeWallet?.address === wallet.address;
              const isCurrentlyScanning = scanningWallet === wallet.address;
              const trustBadge = getTrustScoreBadge(wallet.trust_score);

              return (
                <motion.tr
                  key={wallet.address}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "border-t border-gray-700/40 hover:bg-white/5 transition-colors",
                    isActive && "bg-[#00C9A7]/5 border-l-2 border-l-[#00C9A7]"
                  )}
                  onClick={() => setActiveWallet(wallet.address)}
                >
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-mono font-medium text-gray-200">
                        {wallet.alias || wallet.short}
                      </span>
                      {wallet.alias && (
                        <span className="text-xs text-gray-500 font-mono">
                          {wallet.short}
                        </span>
                      )}
                      {isActive && (
                        <Badge variant="outline" className="w-fit mt-1 text-xs border-[#00C9A7] text-[#00C9A7]">
                          Active
                        </Badge>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <Badge variant={trustBadge.variant} className="font-semibold">
                      {trustBadge.label}
                    </Badge>
                  </td>
                  
                  <td className="py-3 px-4">
                    <span className={cn(
                      "font-semibold",
                      wallet.risk_count === 0 ? "text-[#00C9A7]" : 
                      (wallet.risk_count || 0) > 5 ? "text-red-400" : "text-yellow-400"
                    )}>
                      {wallet.risk_count ?? '--'}
                    </span>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">
                        {wallet.last_scan ? dayjs(wallet.last_scan).fromNow() : 'Never'}
                      </span>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScanWallet(wallet.address);
                        }}
                        disabled={isCurrentlyScanning}
                        className="bg-[#00C9A7]/10 hover:bg-[#00C9A7]/20 text-[#00C9A7] border border-[#00C9A7]/30"
                      >
                        {isCurrentlyScanning ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Scan className="w-3 h-3 mr-1" />
                            Scan
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveWallet(wallet.address);
                        }}
                        className="text-red-400 hover:bg-red-400/10 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}