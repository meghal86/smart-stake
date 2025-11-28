import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Shield, Activity } from 'lucide-react';
import { GlassCard } from '@/components/guardian/GlassUI';
import { SimpleTooltip } from './SimpleTooltip';

interface PortfolioHeroCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<unknown>;
  change?: number;
  lastSync?: Date;
  isLoading?: boolean;
  variant?: 'currency' | 'score' | 'percentage';
  tooltip?: string;
  userMode?: 'novice' | 'pro' | 'sim';
}

export function PortfolioHeroCard({
  title,
  value,
  icon: Icon,
  change,
  lastSync,
  isLoading = false,
  variant = 'currency',
  tooltip,
  userMode = 'novice'
}: PortfolioHeroCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    
    switch (variant) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: val >= 100000 ? 0 : 2
        }).format(val);
      case 'score':
        return `${val.toFixed(1)}/10`;
      case 'percentage':
        return `${val.toFixed(0)}%`;
      default:
        return val.toString();
    }
  };

  const formatChange = (changeVal: number) => {
    const sign = changeVal >= 0 ? '+' : '';
    return `${sign}${changeVal.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
            <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-12 w-32 bg-white/10 rounded animate-pulse" />
          <div className="h-6 w-20 bg-white/10 rounded animate-pulse" />
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
      <GlassCard className="p-6 hover:bg-white/10 transition-all duration-300">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#00C9A7]/20 to-[#7B61FF]/20 border border-white/10">
              <Icon className="w-6 h-6 text-[#00C9A7]" />
            </div>
            <SimpleTooltip
              content={tooltip || `${title} represents your current ${title.toLowerCase()}`}
              userMode={userMode}
            >
              <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">
                {title}
              </h3>
            </SimpleTooltip>
          </div>

          {/* Value */}
          <motion.div
            key={value}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-white tabular-nums"
          >
            {formatValue(value)}
          </motion.div>

          {/* Change & Last Sync */}
          <div className="flex items-center justify-between">
            {change !== undefined && (
              <motion.div
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  change >= 0
                    ? 'bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/20'
                    : 'bg-[#EF476F]/10 text-[#EF476F] border border-[#EF476F]/20'
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {change >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {formatChange(change)}
              </motion.div>
            )}
            
            {lastSync && (
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {lastSync.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}