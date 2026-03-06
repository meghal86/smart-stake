/**
 * HarvestOpportunityCard Component
 * Hunter-style card for displaying tax-loss harvesting opportunities
 * Enhanced with performance monitoring
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
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
import { GuardianScoreTooltip } from './GuardianScoreTooltip';
import { useHarvestProPerformance } from '@/hooks/useHarvestProPerformance';

interface HarvestOpportunityCardProps {
  opportunity: HarvestOpportunity;
  index?: number;
  onStartHarvest: (id: string) => void;
  onSave?: (id: string) => void;
  onShare?: (id: string) => void;
  onReport?: (id: string) => void;
  isConnected?: boolean;
  isDemo?: boolean;
  userWallet?: string;
  className?: string;
}

// Category Tag Component
function CategoryTag({ token }: { token: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-[#f6f2ea]">
      {token.toUpperCase()}
    </span>
  );
}

// Risk Chip Component
function RiskChip({ riskLevel }: { riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  const config = {
    LOW: {
      icon: CheckCircle,
      color: 'text-[#bcd7c5] bg-white/[0.04] border border-white/10',
      label: 'LOW RISK',
    },
    MEDIUM: {
      icon: AlertTriangle,
      color: 'text-[#d6c08d] bg-white/[0.04] border border-white/10',
      label: 'MEDIUM RISK',
    },
    HIGH: {
      icon: AlertTriangle,
      color: 'text-[#e0b4b4] bg-white/[0.04] border border-white/10',
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
      color: 'text-[#bcd7c5] bg-white/[0.04] border-white/10',
      label: 'Recommended',
    },
    'not-recommended': {
      icon: AlertTriangle,
      color: 'text-[#8f8a82] bg-white/[0.04] border-white/10',
      label: 'Not Recommended',
    },
    'high-benefit': {
      icon: Flame,
      color: 'text-[#d6c08d] bg-white/[0.04] border-white/10',
      label: 'High Benefit',
    },
    'gas-heavy': {
      icon: Zap,
      color: 'text-[#d6c08d] bg-white/[0.04] border-white/10',
      label: 'Gas Heavy',
    },
    'guardian-flagged': {
      icon: Shield,
      color: 'text-[#e0b4b4] bg-white/[0.04] border-white/10',
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

// Main Card Component
export function HarvestOpportunityCard({
  opportunity,
  index = 0,
  onStartHarvest,
  onSave,
  onShare,
  onReport,
  isConnected = true,
  isDemo = false,
  className,
}: HarvestOpportunityCardProps) {
  // Performance monitoring
  const { measureInteraction, recordMetric } = useHarvestProPerformance({
    componentName: 'HarvestOpportunityCard',
    metadata: {
      opportunityId: opportunity.id,
      token: opportunity.token,
      riskLevel: opportunity.riskLevel,
      netBenefit: opportunity.netTaxBenefit,
      isDemo,
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Measure button interactions
  const handleStartHarvest = () => {
    measureInteraction('start_harvest_click', () => {
      if (isConnected || isDemo) {
        onStartHarvest(opportunity.id);
      }
    }, { 
      opportunityId: opportunity.id,
      isConnected,
      isDemo,
      netBenefit: opportunity.netTaxBenefit,
    });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    measureInteraction('save_click', () => {
      onSave?.(opportunity.id);
    }, { opportunityId: opportunity.id });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    measureInteraction('share_click', () => {
      onShare?.(opportunity.id);
    }, { opportunityId: opportunity.id });
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    measureInteraction('report_click', () => {
      onReport?.(opportunity.id);
    }, { opportunityId: opportunity.id });
  };

  return (
    <motion.article
      className={cn(
        'relative cursor-pointer rounded-[30px] border border-white/8 bg-[#0b0b0c] px-6 py-8 shadow-2xl transition-all duration-500',
        className
      )}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.7,
        ease: [0.25, 1, 0.5, 1],
      }}
      whileHover={{
        scale: 1.01,
        y: -3,
      }}
      whileTap={{ scale: 0.99 }}
      role="article"
      aria-labelledby={`opportunity-title-${opportunity.id}`}
      aria-describedby={`opportunity-description-${opportunity.id}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartHarvest();
        }
      }}
    >
      <div className="absolute inset-0 rounded-[30px] bg-[radial-gradient(circle_at_top_right,rgba(214,192,141,0.12),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.03),transparent_34%)] opacity-70" />
      <motion.div
        className="absolute inset-0 rounded-[30px] border border-white/6 pointer-events-none"
        whileHover={{ scale: 1.005 }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      />

      {/* Demo Mode Badge */}
      {isDemo && (
        <div className="absolute top-4 right-4 z-20">
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-[#f6f2ea]">
            Demo Mode
          </div>
        </div>
      )}

      <div className="flex flex-col relative z-10">
        {/* Primary Information - Most Important First */}
        <div className="flex items-start gap-4 mb-6">
          {/* Token Logo */}
          <motion.div
            className="flex-shrink-0 rounded-2xl border border-white/10 bg-[#141414] p-3 text-[#d6c08d]"
            whileHover={{ scale: 1.05 }}
          >
            <Coins className="h-6 w-6" />
          </motion.div>

          {/* Title & Key Metrics */}
          <div className="flex-1 min-w-0">
            {/* Title - Most Important */}
            <h3 
              id={`opportunity-title-${opportunity.id}`}
              className="text-xl font-bold font-display leading-tight mb-2 text-white"
            >
              Harvest {opportunity.token} Loss
            </h3>

            {/* Key Financial Info - Second Most Important */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#d6c08d]" aria-hidden="true" />
                <span className="text-lg font-bold text-[#f6f2ea]" aria-label={`Net benefit: ${formatCurrency(opportunity.netTaxBenefit)}`}>
                  {formatCurrency(opportunity.netTaxBenefit)}
                </span>
                <span className="text-sm text-[#8f8a82]">Net Benefit</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#a7c0ff]" aria-hidden="true" />
                <span className="font-semibold text-[#f6f2ea]" aria-label={`Confidence: ${opportunity.confidence} percent`}>
                  {opportunity.confidence}%
                </span>
                <span className="text-sm text-[#8f8a82]">Confidence</span>
              </div>
            </div>

            {/* Risk & Status Badges - Third Most Important */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <RiskChip riskLevel={opportunity.riskLevel} />
              <RecommendationBadge badge={opportunity.recommendationBadge} />
              <CategoryTag token={opportunity.token} />
            </div>

            {/* Subtitle - Context Information */}
            <p className="text-sm text-[#8f8a82]">
              {opportunity.metadata.walletName || 'Wallet'} • {opportunity.metadata.venue || 'DEX'}
            </p>
          </div>

          {/* Action Buttons - Compact */}
          <div className="flex items-center gap-1 flex-shrink-0" role="group" aria-label="Opportunity actions">
            {onSave && (
              <motion.button
                onClick={handleSave}
                className="rounded-lg border border-white/8 bg-white/[0.03] p-2 transition-colors hover:bg-white/[0.06]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Save ${opportunity.token} harvest opportunity`}
                title={`Save ${opportunity.token} harvest opportunity`}
              >
                <Bookmark className="w-4 h-4 text-[#8f8a82]" aria-hidden="true" />
              </motion.button>
            )}
            {onShare && (
              <motion.button
                onClick={handleShare}
                className="rounded-lg border border-white/8 bg-white/[0.03] p-2 transition-colors hover:bg-white/[0.06]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Share ${opportunity.token} harvest opportunity`}
                title={`Share ${opportunity.token} harvest opportunity`}
              >
                <Share2 className="w-4 h-4 text-[#8f8a82]" aria-hidden="true" />
              </motion.button>
            )}
            {onReport && (
              <motion.button
                onClick={handleReport}
                className="rounded-lg border border-white/8 bg-white/[0.03] p-2 transition-colors hover:bg-white/[0.06]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Report issue with ${opportunity.token} harvest opportunity`}
                title={`Report issue with ${opportunity.token} harvest opportunity`}
              >
                <Flag className="w-4 h-4 text-[#8f8a82]" aria-hidden="true" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Secondary Information - Supporting Details */}
        <div className="space-y-4">
          {/* Condensed Description */}
          <p 
            id={`opportunity-description-${opportunity.id}`}
            className="text-sm leading-relaxed text-[#b8b2a7]"
          >
            Harvest <span className="font-semibold text-[#f6f2ea]">{formatCurrency(opportunity.unrealizedLoss)}</span> in losses
            {opportunity.metadata.reasons && opportunity.metadata.reasons.length > 0 && (
              <span className="text-[#8f8a82]"> • {opportunity.metadata.reasons[0]}</span>
            )}
          </p>

          {/* Supporting Metrics - Condensed */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <GuardianScoreTooltip 
                score={opportunity.guardianScore} 
                variant="inline"
                className="flex items-center gap-2"
              />
            </div>
            <div className="flex items-center gap-2 text-[#8f8a82]">
              <Clock className="w-4 h-4" />
              <span>{opportunity.executionTimeEstimate || '5-10 min'}</span>
            </div>
          </div>
        </div>

        {/* CTA Button - Prominent */}
        <motion.button
          onClick={handleStartHarvest}
          disabled={!isConnected && !isDemo}
          className={cn(
            'relative w-full py-4 font-bold rounded-xl flex items-center justify-center gap-2 overflow-hidden mt-6',
            'border border-white/10 bg-[#f6f2ea] text-black',
            (!isConnected && !isDemo) && 'opacity-50 cursor-not-allowed'
          )}
          whileHover={(isConnected || isDemo) ? {
            scale: 1.02,
            y: -1,
          } : {}}
          whileTap={(isConnected || isDemo) ? { scale: 0.98 } : {}}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25,
          }}
          aria-label={`Start harvest for ${opportunity.token} with ${formatCurrency(opportunity.netTaxBenefit)} net benefit`}
          aria-describedby={`opportunity-description-${opportunity.id}`}
          title={(!isConnected && !isDemo) ? 'Connect wallet to start harvest' : `Start harvest for ${opportunity.token}`}
        >
          {/* Ripple Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-black/0 via-black/10 to-black/0"
            initial={{ x: '-100%' }}
            whileHover={(isConnected || isDemo) ? { x: '100%' } : {}}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          />
          <span className="relative z-10">Start Harvest</span>
          <motion.div
            className="relative z-10"
            animate={{ x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: [0.25, 1, 0.5, 1] }}
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </motion.div>
        </motion.button>
      </div>
    </motion.article>
  );
}
