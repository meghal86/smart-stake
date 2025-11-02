import React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { GlassCard } from '@/components/guardian/GlassUI';

interface GuardianFlag {
  type: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
}

interface GuardianInsightCardProps {
  trustScore: number;
  flags: GuardianFlag[];
  lastScan?: Date;
  isLoading?: boolean;
  onViewGuardian?: () => void;
}

export function GuardianInsightCard({
  trustScore,
  flags,
  lastScan,
  isLoading = false,
  onViewGuardian
}: GuardianInsightCardProps) {
  const totalFlags = flags.reduce((acc, flag) => acc + flag.count, 0);
  
  const severityColors = {
    low: '#00C9A7',
    medium: '#FFD166', 
    high: '#EF476F'
  };

  const severityClasses = {
    low: 'bg-[#00C9A7]/10 text-[#00C9A7] border-[#00C9A7]/20',
    medium: 'bg-[#FFD166]/10 text-[#FFD166] border-[#FFD166]/20',
    high: 'bg-[#EF476F]/10 text-[#EF476F] border-[#EF476F]/20'
  };

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="space-y-4">
          <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-white/10 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-white/10 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <GlassCard className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">
              Guardian Intelligence Snapshot
            </h3>
            {onViewGuardian && (
              <button
                onClick={onViewGuardian}
                className="flex items-center gap-1 text-xs text-[#00C9A7] hover:text-[#00C9A7]/80 transition-colors"
              >
                View Guardian
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Trust Score & Summary */}
          <div className="flex items-center gap-6">
            {/* Trust Score Circle */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-[#00C9A7]/20 flex items-center justify-center bg-[#00C9A7]/10">
                <motion.span
                  key={trustScore}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-2xl font-bold text-[#00C9A7] tabular-nums"
                >
                  {trustScore.toFixed(0)}
                </motion.span>
              </div>
              {/* Animated border */}
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-[#00C9A7]"
                style={{
                  background: `conic-gradient(from 0deg, #00C9A7 ${trustScore * 3.6}deg, transparent ${trustScore * 3.6}deg)`
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>

            {/* Summary Info */}
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-sm font-medium text-white">Trust Score</p>
                <p className="text-xs text-gray-400">
                  {lastScan ? `Last scan ${lastScan.toLocaleTimeString()}` : 'No recent scan'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>Total flags: {totalFlags}</span>
                {totalFlags === 0 && (
                  <div className="flex items-center gap-1 text-[#00C9A7]">
                    <CheckCircle className="w-3 h-3" />
                    All clear
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Flags List */}
          <div className="space-y-3">
            {flags.length === 0 ? (
              <div className="rounded-xl border border-[#00C9A7]/20 bg-[#00C9A7]/10 px-4 py-3 text-sm text-[#00C9A7] flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                No active security flags detected
              </div>
            ) : (
              flags.slice(0, 3).map((flag, index) => (
                <motion.div
                  key={flag.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle 
                      className="w-4 h-4" 
                      style={{ color: severityColors[flag.severity] }}
                    />
                    <div>
                      <p className="text-sm text-white capitalize font-medium">
                        {flag.type.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {flag.count} occurrence{flag.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <span 
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${severityClasses[flag.severity]}`}
                  >
                    {flag.severity}
                  </span>
                </motion.div>
              ))
            )}
            
            {flags.length > 3 && (
              <button
                onClick={onViewGuardian}
                className="w-full text-center text-xs text-gray-400 hover:text-white transition-colors py-2"
              >
                View {flags.length - 3} more flags in Guardian
              </button>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}