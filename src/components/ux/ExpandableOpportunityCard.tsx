/**
 * ExpandableOpportunityCard Component
 * 
 * Enhanced opportunity card with progressive disclosure.
 * Shows key info first (Title, APY, Risk) with expandable details.
 * 
 * Validates: R12.DISCLOSURE.EXPANDABLE_CARDS, R12.DISCLOSURE.SMOOTH_ANIMATIONS
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Shield, 
  Clock, 
  Zap, 
  ChevronRight,
  Star,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Brain,
  Timer,
  Activity,
  BarChart3,
  Users,
  Globe,
  Gauge
} from 'lucide-react';
import { ExpandableCard, ExpandableCardSection } from './ExpandableCard';
import { useWalletButtonTooltip } from '@/hooks/useFormButtonTooltip';
import { DisabledTooltipButton } from '@/components/ui/disabled-tooltip-button';

interface Opportunity {
  id: string;
  type: 'Airdrop' | 'Staking' | 'NFT' | 'Quest';
  title: string;
  description: string;
  reward: string;
  confidence: number;
  duration: string;
  guardianScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  chain?: string;
  protocol?: string;
  estimatedAPY?: number;
  // Extended details for progressive disclosure
  details?: {
    liquidity?: number;
    volume24h?: number;
    participants?: number;
    timeRemaining?: string;
    requirements?: string[];
    risks?: string[];
    methodology?: string;
    lastUpdated?: string;
  };
}

interface ExpandableOpportunityCardProps {
  opportunity: Opportunity;
  index: number;
  onJoinQuest: (opportunity: Opportunity) => void;
  isDarkTheme?: boolean;
  isConnected?: boolean;
  autoCollapse?: boolean;
  className?: string;
}

const typeIcons = {
  Airdrop: TrendingUp,
  Staking: Shield,
  NFT: Star,
  Quest: Zap
};

const typeColors = {
  Airdrop: 'bg-emerald-500',
  Staking: 'bg-blue-500', 
  NFT: 'bg-purple-500',
  Quest: 'bg-orange-500'
};

const riskColors = {
  Low: 'text-emerald-400 bg-emerald-400/10',
  Medium: 'text-yellow-400 bg-yellow-400/10',
  High: 'text-red-400 bg-red-400/10'
};

const riskIcons = {
  Low: CheckCircle,
  Medium: AlertTriangle,
  High: AlertTriangle
};

export function ExpandableOpportunityCard({ 
  opportunity, 
  index, 
  onJoinQuest, 
  isDarkTheme = true, 
  isConnected = true,
  autoCollapse = true,
  className
}: ExpandableOpportunityCardProps) {
  const TypeIcon = typeIcons[opportunity.type];
  const RiskIcon = riskIcons[opportunity.riskLevel];
  
  // Wallet connection tooltip
  const walletTooltip = useWalletButtonTooltip(isConnected);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  // Key information (always visible)
  const keyContent = (
    <div className="space-y-4">
      {/* Header with Icon & Badges */}
      <div className="flex items-start gap-4">
        <motion.div
          className={`p-3 rounded-xl ${typeColors[opportunity.type]} shadow-lg`}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.15 }}
        >
          <TypeIcon className="w-6 h-6 text-white" />
        </motion.div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
              isDarkTheme 
                ? `${typeColors[opportunity.type]} text-white`
                : 'bg-[#14B8A6]/10 text-[#14B8A6]'
            }`}>
              {opportunity.type.toUpperCase()}
            </span>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isDarkTheme 
                ? riskColors[opportunity.riskLevel]
                : opportunity.riskLevel === 'Low' 
                  ? 'text-emerald-600 bg-emerald-50'
                  : opportunity.riskLevel === 'Medium'
                    ? 'text-amber-600 bg-amber-50'
                    : 'text-red-600 bg-red-50'
            }`}>
              <RiskIcon className="w-3 h-3" />
              {opportunity.riskLevel.toUpperCase()} RISK
            </div>
          </div>
          
          <h3 className={`text-xl font-bold font-display leading-tight mb-1 ${
            isDarkTheme ? 'text-[#E4E8F3]' : 'text-[#0F172A]'
          }`}>
            {opportunity.title}
          </h3>
          
          {opportunity.protocol && (
            <p className={`text-sm ${
              isDarkTheme ? 'text-gray-400' : 'text-[#475569]'
            }`}>
              {opportunity.protocol} {opportunity.chain && `• ${opportunity.chain}`}
            </p>
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className={`flex items-center justify-center gap-1 mb-1 ${
            isDarkTheme ? 'text-[#00F5A0]' : 'text-[#FBBF24]'
          }`}>
            <DollarSign className="w-4 h-4" />
            <span className="font-bold">{opportunity.reward}</span>
          </div>
          <span className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-[#475569]'}`}>
            Reward
          </span>
        </div>
        
        <div className="text-center">
          <div className={`flex items-center justify-center gap-1 mb-1 ${
            isDarkTheme ? 'text-blue-400' : 'text-[#14B8A6]'
          }`}>
            <Brain className="w-4 h-4" />
            <span className="font-bold">{opportunity.confidence}%</span>
          </div>
          <span className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-[#475569]'}`}>
            Confidence
          </span>
        </div>
        
        <div className="text-center">
          <div className={`flex items-center justify-center gap-1 mb-1 ${
            isDarkTheme ? 'text-blue-400' : 'text-[#14B8A6]'
          }`}>
            <Shield className="w-4 h-4" />
            <span className="font-bold">{opportunity.guardianScore}/10</span>
          </div>
          <span className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-[#475569]'}`}>
            Guardian
          </span>
        </div>
      </div>
    </div>
  );

  // Detailed information (expandable)
  const expandedContent = opportunity.details && (
    <div className="space-y-6">
      {/* Description */}
      <ExpandableCardSection title="Description">
        <p className={`text-sm leading-relaxed ${
          isDarkTheme ? 'text-gray-300' : 'text-[#475569]'
        }`}>
          {opportunity.description}
        </p>
      </ExpandableCardSection>

      {/* Detailed Metrics */}
      <ExpandableCardSection title="Detailed Metrics">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Timer className={`w-4 h-4 ${
              isDarkTheme ? 'text-gray-400' : 'text-[#64748B]'
            }`} />
            <span className={`font-semibold ${
              isDarkTheme ? 'text-white' : 'text-[#0F172A]'
            }`}>{opportunity.duration}</span>
            <span className={isDarkTheme ? 'text-gray-500' : 'text-[#475569]'}>Duration</span>
          </div>
          
          {opportunity.details.liquidity && (
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${
                isDarkTheme ? 'text-blue-400' : 'text-[#14B8A6]'
              }`} />
              <span className={`font-semibold ${
                isDarkTheme ? 'text-white' : 'text-[#0F172A]'
              }`}>{formatValue(opportunity.details.liquidity)}</span>
              <span className={isDarkTheme ? 'text-gray-500' : 'text-[#475569]'}>Liquidity</span>
            </div>
          )}
          
          {opportunity.details.volume24h && (
            <div className="flex items-center gap-2">
              <BarChart3 className={`w-4 h-4 ${
                isDarkTheme ? 'text-green-400' : 'text-[#10B981]'
              }`} />
              <span className={`font-semibold ${
                isDarkTheme ? 'text-white' : 'text-[#0F172A]'
              }`}>{formatValue(opportunity.details.volume24h)}</span>
              <span className={isDarkTheme ? 'text-gray-500' : 'text-[#475569]'}>24h Volume</span>
            </div>
          )}
          
          {opportunity.details.participants && (
            <div className="flex items-center gap-2">
              <Users className={`w-4 h-4 ${
                isDarkTheme ? 'text-purple-400' : 'text-[#8B5CF6]'
              }`} />
              <span className={`font-semibold ${
                isDarkTheme ? 'text-white' : 'text-[#0F172A]'
              }`}>{opportunity.details.participants.toLocaleString()}</span>
              <span className={isDarkTheme ? 'text-gray-500' : 'text-[#475569]'}>Participants</span>
            </div>
          )}
        </div>
      </ExpandableCardSection>

      {/* Requirements */}
      {opportunity.details.requirements && opportunity.details.requirements.length > 0 && (
        <ExpandableCardSection title="Requirements">
          <ul className="space-y-2">
            {opportunity.details.requirements.map((req, idx) => (
              <li key={idx} className={`flex items-start gap-2 text-sm ${
                isDarkTheme ? 'text-gray-300' : 'text-[#475569]'
              }`}>
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </ExpandableCardSection>
      )}

      {/* Risks */}
      {opportunity.details.risks && opportunity.details.risks.length > 0 && (
        <ExpandableCardSection title="Risk Factors">
          <ul className="space-y-2">
            {opportunity.details.risks.map((risk, idx) => (
              <li key={idx} className={`flex items-start gap-2 text-sm ${
                isDarkTheme ? 'text-gray-300' : 'text-[#475569]'
              }`}>
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </ExpandableCardSection>
      )}

      {/* Methodology */}
      {opportunity.details.methodology && (
        <ExpandableCardSection title="Methodology">
          <p className={`text-sm leading-relaxed ${
            isDarkTheme ? 'text-gray-300' : 'text-[#475569]'
          }`}>
            {opportunity.details.methodology}
          </p>
        </ExpandableCardSection>
      )}

      {/* Last Updated */}
      {opportunity.details.lastUpdated && (
        <div className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-[#64748B]'}`}>
          Last updated: {opportunity.details.lastUpdated}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.05,
        duration: 0.6,
        ease: [0.25, 1, 0.5, 1]
      }}
      className={className}
    >
      <ExpandableCard
        id={`opportunity-${opportunity.id}`}
        autoCollapse={autoCollapse}
        duration={300}
        expandedContent={expandedContent}
        className={`backdrop-blur-lg border relative transform-gpu ${
          isDarkTheme
            ? 'bg-gradient-to-br from-slate-900/80 via-blue-950/60 to-slate-900/80 border-teal-400/20'
            : 'bg-white/90 border-gray-200/50'
        }`}
        showToggleButton={!!opportunity.details}
        toggleButton={opportunity.details && (
          <motion.button
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
              isDarkTheme
                ? 'text-teal-400 bg-teal-400/10 hover:bg-teal-400/20'
                : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>See Breakdown</span>
            <motion.div
              animate={{ rotate: 0 }}
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </motion.button>
        )}
      >
        {keyContent}
      </ExpandableCard>

      {/* CTA Button - Outside the expandable card */}
      <div className="mt-4">
        <DisabledTooltipButton
          onClick={() => onJoinQuest(opportunity)}
          disabled={walletTooltip.isDisabled}
          disabledTooltip={walletTooltip.tooltipContent}
          className={`relative w-full py-4 font-bold rounded-xl flex items-center justify-center gap-2 overflow-hidden ${
            isDarkTheme
              ? 'bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] text-white shadow-lg'
              : 'bg-gradient-to-r from-[#FBBF24] to-[#14B8A6] text-white shadow-[0_2px_8px_rgba(251,191,36,0.25)]'
          }`}
          asChild
        >
          <motion.button
            whileHover={{ 
              scale: isConnected ? 1.02 : 1, 
              y: isConnected ? -1 : 0,
              boxShadow: isConnected ? (isDarkTheme
                ? '0 8px 25px rgba(0,245,160,0.3)'
                : '0 4px 16px rgba(251,191,36,0.4)') : undefined
            }}
            whileTap={{ scale: isConnected ? 0.98 : 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25
            }}
          >
            {/* Subtle Ripple Effect */}
            <motion.div
              className={`absolute inset-0 ${
                isDarkTheme
                  ? 'bg-gradient-to-r from-white/0 via-white/10 to-white/0'
                  : 'bg-gradient-to-r from-white/0 via-white/20 to-white/0'
              }`}
              initial={{ x: '-100%' }}
              whileHover={{ x: isConnected ? '100%' : '-100%' }}
              transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            />
            <span className="relative z-10">Join Quest</span>
            <motion.div
              className="relative z-10"
              animate={{ x: isConnected ? [0, 4, 0] : 0 }}
              transition={{ repeat: isConnected ? Infinity : 0, duration: 2, ease: [0.25, 1, 0.5, 1] }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.div>
          </motion.button>
        </DisabledTooltipButton>
      </div>
    </motion.div>
  );
}