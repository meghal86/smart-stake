/**
 * HarvestOpportunityCard Component
 * Hunter-style card for displaying tax-loss harvesting opportunities
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingDown,
  Shield,
  Clock,
  Zap,
  ChevronRight,
  Bookmark,
  Share2,
  Flag,
  DollarSign,
  Coins,
  AlertTriangle,
  CheckCircle,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HarvestOpportunity } from '@/types/harvestpro';

interface HarvestOpportunityCardProps {
  opportunity: HarvestOpportunity;
  index?: number;
  onStartHarvest: (id: string) => void;
  onSave?: (id: string) => void;
  onShare?: (id: string) => void;
  onReport?: (id: string) => void;
  isConnected?: boolean;
  userWallet?: string;
  className?: string;
}

// Category Tag Component
function CategoryTag({ token }: { token: string }) {
  return (
    <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#ed8f2d] text-white">
      {token.toUpperCase()}
    </span>
  );
}

// Risk Chip Component
function RiskChip({ riskLevel }: { riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  const config = {
    LOW: {
      icon: CheckCircle,
      color: 'text-green-400 bg-green-400/10',
      label: 'LOW RISK',
    },
    MEDIUM: {
      icon: AlertTriangle,
      color: 'text-yellow-400 bg-yellow-400/10',
      label: 'MEDIUM RISK',
    },
    HIGH: {
      icon: AlertTriangle,
      color: 'text-red-400 bg-red-400/10',
      label: 'HIGH RISK',
    },
  };

  const { icon: Icon, color, label } = config[riskLevel];

  return (
    <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', color)}>
      <Icon className="w-3 h-3" />
      {label}
    </div>
  );
}

// Recommendation Badge Component
function RecommendationBadge({
  badge,
}: {
  badge: 'recommended' | 'not-recommended' | 'high-benefit' | 'gas-heavy' | 'guardian-flagged';
}) {
  const config = {
    recommended: {
      icon: CheckCircle,
      color: 'text-green-400 bg-green-400/10 border-green-400/20',
      label: 'Recommended',
    },
    'not-recommended': {
      icon: AlertTriangle,
      color: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
      label: 'Not Recommended',
    },
    'high-benefit': {
      icon: Flame,
      color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
      label: 'High Benefit',
    },
    'gas-heavy': {
      icon: Zap,
      color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      label: 'Gas Heavy',
    },
    'guardian-flagged': {
      icon: Shield,
      color: 'text-red-400 bg-red-400/10 border-red-400/20',
      label: 'Guardian Flagged',
    },
  };

  const { icon: Icon, color, label } = config[badge];

  return (
    <div className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border', color)}>
      <Icon className="w-3 h-3" />
      {label}
    </div>
  );
}

// Metric Strip Component
function MetricStrip({ opportunity }: { opportunity: HarvestOpportunity }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
      {/* Net Benefit */}
      <div className="flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-green-400" />
        <span className="font-bold text-green-400">{formatCurrency(opportunity.netTaxBenefit)}</span>
        <span className="text-gray-500 uppercase text-xs">Net Benefit</span>
      </div>

      {/* Confidence */}
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-blue-400" />
        <span className="font-semibold text-white">{opportunity.confidence}%</span>
        <span className="text-gray-500 uppercase text-xs">Confidence</span>
      </div>

      {/* Guardian Score */}
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-blue-400" />
        <span className="font-semibold text-blue-400">{opportunity.guardianScore}/10</span>
        <span className="text-gray-500 uppercase text-xs">Guardian</span>
      </div>

      {/* Execution Time */}
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-gray-400" />
        <span className="font-semibold text-white">{opportunity.executionTimeEstimate || '5-10 min'}</span>
        <span className="text-gray-500 uppercase text-xs">Time</span>
      </div>
    </div>
  );
}

// Main Card Component
export function HarvestOpportunityCard({
  opportunity,
  index = 0,
  onStartHarvest,
  onSave,
  onShare,
  onReport,
  isConnected = true,
  className,
}: HarvestOpportunityCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <motion.div
      className={cn(
        'backdrop-blur-lg rounded-[20px] py-10 px-8 cursor-pointer group transition-all duration-700 border relative transform-gpu',
        'bg-gradient-to-br from-slate-900/80 via-blue-950/60 to-slate-900/80 border-teal-400/20',
        className
      )}
      style={{
        boxShadow:
          '0 20px 60px -12px rgba(0,0,0,0.6), 0 8px 32px -8px rgba(237,143,45,0.1), 0 2px 0 0 rgba(255,255,255,0.08) inset, 0 -2px 0 0 rgba(237,143,45,0.1) inset',
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.7,
        ease: [0.25, 1, 0.5, 1],
      }}
      whileHover={{
        scale: 1.015,
        y: -4,
        boxShadow: '0 30px 80px -12px rgba(0,0,0,0.75), 0 0 0 1px rgba(237,143,45,0.35)',
      }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#ed8f2d]/0 via-[#14b8a6]/0 to-[#ed8f2d]/0 group-hover:from-[#ed8f2d]/8 group-hover:via-[#14b8a6]/6 group-hover:to-[#ed8f2d]/8 transition-all duration-700 rounded-[20px]" />
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent rounded-[20px] pointer-events-none"
        whileHover={{ scale: 1.02, rotateX: 2 }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      />

      <div className="flex flex-col space-y-4 relative z-10">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Token Logo */}
          <motion.div
            className="p-3 rounded-xl bg-[#ed8f2d] shadow-lg flex-shrink-0"
            whileHover={{ scale: 1.05 }}
          >
            <Coins className="w-6 h-6 text-white" />
          </motion.div>

          {/* Title & Badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <CategoryTag token={opportunity.token} />
              <RiskChip riskLevel={opportunity.riskLevel} />
              <RecommendationBadge badge={opportunity.recommendationBadge} />
            </div>

            <h3 className="text-xl font-bold font-display leading-tight mb-1 text-white">
              Harvest {opportunity.token} Loss
            </h3>

            <p className="text-sm text-gray-500">
              {opportunity.metadata.walletName || 'Wallet'} • {opportunity.metadata.venue || 'DEX'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {onSave && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onSave(opportunity.id);
                }}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bookmark className="w-4 h-4 text-gray-400" />
              </motion.button>
            )}
            {onShare && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(opportunity.id);
                }}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Share2 className="w-4 h-4 text-gray-400" />
              </motion.button>
            )}
            {onReport && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onReport(opportunity.id);
                }}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Flag className="w-4 h-4 text-gray-400" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm line-clamp-2 mb-6 leading-relaxed text-gray-400">
          Harvest <span className="text-white font-semibold">{formatCurrency(opportunity.unrealizedLoss)}</span> in losses for{' '}
          <span className="text-green-400 font-semibold">{formatCurrency(opportunity.netTaxBenefit)}</span> net tax benefit after gas and fees.
          {opportunity.metadata.reasons && opportunity.metadata.reasons.length > 0 && (
            <span className="text-gray-500"> {opportunity.metadata.reasons[0]}</span>
          )}
        </p>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

        {/* Metric Strip */}
        <MetricStrip opportunity={opportunity} />

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/8 to-transparent my-6" />

        {/* CTA Button */}
        <motion.button
          onClick={() => onStartHarvest(opportunity.id)}
          className={cn(
            'relative w-full py-4 font-bold rounded-xl flex items-center justify-center gap-2 overflow-hidden',
            'bg-gradient-to-r from-[#ed8f2d] to-[#B8722E] text-white shadow-lg'
          )}
          whileHover={{
            scale: 1.02,
            y: -1,
            boxShadow: '0 8px 25px rgba(237,143,45,0.3)',
          }}
          whileTap={{ scale: 0.98 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25,
          }}
        >
          {/* Ripple Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          />
          <span className="relative z-10">Start Harvest</span>
          <motion.div
            className="relative z-10"
            animate={{ x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: [0.25, 1, 0.5, 1] }}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.div>
        </motion.button>
      </div>
    </motion.div>
  );
}
