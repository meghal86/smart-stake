import { useState } from 'react';
import { motion } from 'framer-motion';
import { WalletScope, FreshnessConfidence, PortfolioSnapshot, RecommendedAction, ApprovalRisk } from '@/types/portfolio';
import { NetWorthCard } from '../NetWorthCard';
import { RecommendedActionsFeed } from '../RecommendedActionsFeed';
import { RiskSummaryCard } from '../RiskSummaryCard';
import { WhaleInteractionLog } from '../WhaleInteractionLog';
import { TrendingUp, Shield, Activity, Zap, AlertTriangle, Clock } from 'lucide-react';

interface OverviewTabProps {
  walletScope: WalletScope;
  freshness: FreshnessConfidence;
  onWalletScopeChange?: (scope: WalletScope) => void;
  snapshot?: PortfolioSnapshot;
  actions: RecommendedAction[];
  approvals: ApprovalRisk[];
  isLoading: boolean;
}

export function OverviewTab({ 
  walletScope, 
  freshness, 
  snapshot, 
  actions, 
  approvals,
  isLoading 
}: OverviewTabProps) {
  console.log('📊 OverviewTab rendering with real data:', {
    hasSnapshot: !!snapshot,
    actionsCount: actions.length,
    approvalsCount: approvals.length,
    isLoading
  });

  // Use real data from props (passed from PortfolioRouteShell)
  const realActions = actions.map(action => ({
    id: action.id,
    title: action.title,
    severity: action.severity,
    why: action.why || [],
    impactPreview: action.impactPreview || {
      riskDelta: 0,
      preventedLossP50Usd: 0,
      expectedGainUsd: 0,
      gasEstimateUsd: 0,
      timeEstimateSec: 0,
      confidence: 0
    },
    actionScore: action.actionScore || 0,
    cta: action.cta || { label: 'View Details', intent: 'view_details', params: {} },
    walletScope
  }));

  // Calculate real risk summary from approvals
  const realRiskSummary = {
    overallScore: snapshot?.riskScore || 0,
    criticalIssues: approvals.filter(a => a.severity === 'critical').length,
    highRiskApprovals: approvals.filter(a => a.severity === 'high').length,
    mediumRiskApprovals: approvals.filter(a => a.severity === 'medium').length,
    lowRiskApprovals: approvals.filter(a => a.severity === 'low').length,
    riskFactors: [
      { 
        name: 'Unlimited Approvals', 
        score: approvals.filter(a => a.riskReasons?.includes('UNLIMITED_ALLOWANCE')).length / Math.max(approvals.length, 1), 
        trend: 'stable' as const
      },
      { 
        name: 'High Value Exposure', 
        score: approvals.filter(a => a.valueAtRisk > 10000).length / Math.max(approvals.length, 1), 
        trend: 'improving' as const
      },
      { 
        name: 'Contract Risk', 
        score: approvals.filter(a => a.riskScore > 0.5).length / Math.max(approvals.length, 1), 
        trend: 'worsening' as const
      }
    ]
  };

  // Whale interactions from snapshot (real data when available)
  const whaleInteractions = snapshot?.whaleInteractions || [];

  const [actionsFilter, setActionsFilter] = useState('all');
  const [whaleFilter, setWhaleFilter] = useState('all');

  console.log('🐋 Whale interactions:', {
    hasSnapshot: !!snapshot,
    whaleInteractionsCount: whaleInteractions.length
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  return (
    <motion.div 
      className="space-y-4 sm:space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Quick Stats Grid - New Interactive Cards */}
      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
        variants={cardVariants}
      >
        {/* Actions Count Card */}
        <motion.div
          className="group relative overflow-hidden bg-gradient-to-br from-[#00F5A0]/10 to-[#00D9F5]/10 dark:from-[#00F5A0]/5 dark:to-[#00D9F5]/5 backdrop-blur-md border border-[#00F5A0]/20 dark:border-[#00F5A0]/10 rounded-2xl p-4 cursor-pointer"
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#00F5A0]/0 to-[#00D9F5]/0 group-hover:from-[#00F5A0]/10 group-hover:to-[#00D9F5]/10 transition-all duration-300" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-5 h-5 text-[#00F5A0]" />
              {isLoading && (
                <div className="w-3 h-3 border-2 border-[#00F5A0]/30 border-t-[#00F5A0] rounded-full animate-spin" />
              )}
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {realActions.length}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
              Actions Available
            </p>
          </div>
        </motion.div>

        {/* Risk Score Card */}
        <motion.div
          className="group relative overflow-hidden bg-gradient-to-br from-yellow-500/10 to-orange-500/10 dark:from-yellow-500/5 dark:to-orange-500/5 backdrop-blur-md border border-yellow-500/20 dark:border-yellow-500/10 rounded-2xl p-4 cursor-pointer"
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-orange-500/0 group-hover:from-yellow-500/10 group-hover:to-orange-500/10 transition-all duration-300" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              {isLoading && (
                <div className="w-3 h-3 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
              )}
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {Math.round(realRiskSummary.overallScore * 100)}%
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
              Risk Score
            </p>
          </div>
        </motion.div>

        {/* Critical Issues Card */}
        <motion.div
          className="group relative overflow-hidden bg-gradient-to-br from-red-500/10 to-pink-500/10 dark:from-red-500/5 dark:to-pink-500/5 backdrop-blur-md border border-red-500/20 dark:border-red-500/10 rounded-2xl p-4 cursor-pointer col-span-2 lg:col-span-1"
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-pink-500/0 group-hover:from-red-500/10 group-hover:to-pink-500/10 transition-all duration-300" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-5 h-5 text-red-500" />
              {isLoading && (
                <div className="w-3 h-3 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
              )}
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {realRiskSummary.criticalIssues}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
              Critical Issues
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Recommended Actions Feed - Enhanced Design */}
      <motion.div 
        className="group relative overflow-hidden bg-white/90 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 hover:border-[#00F5A0]/30 dark:hover:border-[#00F5A0]/20 transition-all duration-300"
        variants={cardVariants}
        whileHover={{ y: -2 }}
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00F5A0]/0 via-transparent to-[#00D9F5]/0 group-hover:from-[#00F5A0]/5 group-hover:to-[#00D9F5]/5 transition-all duration-500 rounded-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#00F5A0]/20 to-[#00D9F5]/20 rounded-xl">
                <Zap className="w-5 h-5 text-[#00F5A0]" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Recommended Actions
                </h3>
                <p className="text-xs text-slate-600 dark:text-gray-400">
                  Optimize your portfolio performance
                </p>
              </div>
            </div>
            {isLoading && (
              <div className="w-5 h-5 border-2 border-[#00F5A0]/30 border-t-[#00F5A0] rounded-full animate-spin" />
            )}
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <motion.div 
                  key={i} 
                  className="h-24 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-xl"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  style={{
                    backgroundSize: '200% 100%'
                  }}
                />
              ))}
            </div>
          ) : realActions.length > 0 ? (
            <RecommendedActionsFeed
              actions={realActions}
              freshness={freshness}
              currentFilter={actionsFilter}
              onFilterChange={setActionsFilter}
              showTopN={5}
            />
          ) : (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#00F5A0]/20 to-[#00D9F5]/20 rounded-full mb-4">
                <Zap className="w-8 h-8 text-[#00F5A0]" />
              </div>
              <p className="text-slate-900 dark:text-white font-medium mb-1">All Clear!</p>
              <p className="text-sm text-slate-600 dark:text-gray-400">
                No recommended actions at this time. Your portfolio looks good!
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Risk Summary Card - Enhanced Design */}
      <motion.div 
        className="group relative overflow-hidden bg-white/90 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 hover:border-yellow-500/30 dark:hover:border-yellow-500/20 transition-all duration-300"
        variants={cardVariants}
        whileHover={{ y: -2 }}
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 via-transparent to-orange-500/0 group-hover:from-yellow-500/5 group-hover:to-orange-500/5 transition-all duration-500 rounded-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl">
                <Shield className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Risk Summary
                </h3>
                <p className="text-xs text-slate-600 dark:text-gray-400">
                  Security analysis and threat detection
                </p>
              </div>
            </div>
            {isLoading && (
              <div className="w-5 h-5 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
            )}
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              <motion.div 
                className="h-32 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-xl"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear'
                }}
                style={{
                  backgroundSize: '200% 100%'
                }}
              />
            </div>
          ) : (
            <RiskSummaryCard
              riskSummary={realRiskSummary}
              freshness={freshness}
              walletScope={walletScope}
            />
          )}
        </div>
      </motion.div>

      {/* Recent Activity Timeline - Enhanced Design */}
      <motion.div 
        className="group relative overflow-hidden bg-white/90 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 hover:border-blue-500/30 dark:hover:border-blue-500/20 transition-all duration-300"
        variants={cardVariants}
        whileHover={{ y: -2 }}
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-cyan-500/0 group-hover:from-blue-500/5 group-hover:to-cyan-500/5 transition-all duration-500 rounded-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Recent Activity
                </h3>
                <p className="text-xs text-slate-600 dark:text-gray-400">
                  Whale interactions and portfolio events
                </p>
              </div>
            </div>
            {isLoading && (
              <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            )}
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <motion.div 
                  key={i} 
                  className="h-20 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-xl"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: i * 0.2
                  }}
                  style={{
                    backgroundSize: '200% 100%'
                  }}
                />
              ))}
            </div>
          ) : whaleInteractions.length > 0 ? (
            <WhaleInteractionLog
              interactions={whaleInteractions}
              currentFilter={whaleFilter}
              onFilterChange={setWhaleFilter}
            />
          ) : (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full mb-4">
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-slate-900 dark:text-white font-medium mb-1">No Activity Yet</p>
              <p className="text-sm text-slate-600 dark:text-gray-400">
                Your wallet hasn't interacted with any whale addresses recently
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}