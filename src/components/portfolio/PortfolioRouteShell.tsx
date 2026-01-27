'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OverviewTab } from './tabs/OverviewTab';
import { PositionsTab } from './tabs/PositionsTab';
import { AuditTab } from './tabs/AuditTab';
import { StressTestTab } from './tabs/StressTestTab';
import { CopilotChatDrawer } from './CopilotChatDrawer';
import { GlobalHeader } from '@/components/header/GlobalHeader';
import { FooterNav } from '@/components/layout/FooterNav';
import { useUserAddresses } from '@/hooks/useUserAddresses';
import { useWalletSwitching } from '@/hooks/useWalletSwitching';
import { WalletScope, FreshnessConfidence } from '@/types/portfolio';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator';
import { 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Bell, 
  Sparkles,
  ChevronDown,
  Wallet,
  RefreshCw,
  AlertTriangle,
  Activity
} from 'lucide-react';

export function PortfolioRouteShell() {
  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'audit' | 'stress'>('overview');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [walletScope, setWalletScope] = useState<WalletScope>({ mode: 'all_wallets' });

  // Use existing hooks
  const { addresses, loading: addressesLoading } = useUserAddresses();
  const { 
    activeWallet, 
    switchWallet, 
    getCurrentWalletScope,
    isLoading: walletSwitchLoading 
  } = useWalletSwitching();

  // Pull-to-refresh
  const handleRefresh = async () => {
    // Refetch portfolio data
    console.log('Refreshing portfolio data...');
  };

  const { isPulling, isRefreshing, pullDistance, threshold } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    disabled: isCopilotOpen,
  });

  // Mock data - will be replaced with real API integration
  const [mockData] = useState({
    netWorth: 2450000,
    delta24h: 125000,
    freshness: {
      freshnessSec: 45,
      confidence: 0.85,
      confidenceThreshold: 0.70,
      degraded: false
    } as FreshnessConfidence,
    trustRiskSummary: {
      trustScore: 89,
      riskScore: 0.23,
      criticalIssues: 0,
      highRiskApprovals: 2
    },
    alertsCount: 3
  });

  const handleWalletScopeChange = useCallback((scope: WalletScope) => {
    setWalletScope(scope);
  }, []);

  const handleWalletSwitch = useCallback((walletId: string) => {
    switchWallet(walletId);
    const newScope = getCurrentWalletScope();
    setWalletScope(newScope);
  }, [switchWallet, getCurrentWalletScope]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Tab configuration
  const tabs = [
    { 
      id: 'overview' as const, 
      label: 'Overview', 
      component: OverviewTab,
      icon: DollarSign 
    },
    { 
      id: 'positions' as const, 
      label: 'Positions', 
      component: PositionsTab,
      icon: TrendingUp 
    },
    { 
      id: 'audit' as const, 
      label: 'Audit', 
      component: AuditTab,
      icon: Shield 
    },
    { 
      id: 'stress' as const, 
      label: 'Stress Test', 
      component: StressTestTab,
      icon: Activity 
    },
  ];

  const CurrentTabComponent = tabs.find(tab => tab.id === activeTab)?.component || OverviewTab;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#0A0E1A] dark:to-[#111827]">
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        threshold={threshold}
      />

      {/* Background Effects - Same as Hunter/Harvest */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(circle at 30% 40%, rgba(0,245,160,0.08) 0%, transparent 50%)',
            'radial-gradient(circle at 70% 60%, rgba(123,97,255,0.06) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 30%, rgba(0,245,160,0.04) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 70%, rgba(123,97,255,0.08) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 40%, rgba(0,245,160,0.08) 0%, transparent 50%)'
          ]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: [0.25, 1, 0.5, 1]
        }}
        aria-hidden="true"
      />

      {/* Ambient Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: i % 2 === 0 ? 'rgba(0,245,160,0.15)' : 'rgba(123,97,255,0.12)',
              left: `${15 + i * 12}%`,
              top: `${10 + (i % 3) * 25}%`
            }}
            animate={{
              y: [0, -80, 0],
              x: [0, Math.sin(i) * 30, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.3, 1]
            }}
            transition={{
              duration: 12 + i * 2,
              repeat: Infinity,
              ease: [0.25, 1, 0.5, 1],
              delay: i * 1.5
            }}
          />
        ))}
      </div>

      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>

      {/* Header - Same as Hunter/Harvest */}
      <header role="banner">
        <GlobalHeader />
      </header>

      {/* Degraded Mode Banner */}
      {mockData.freshness.degraded && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-16 left-0 right-0 z-40 bg-yellow-600 text-white py-2 px-4 text-center text-sm font-medium shadow-lg"
        >
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Limited Preview Mode — Confidence below threshold. Some actions may be restricted.</span>
          </div>
        </motion.div>
      )}

      {/* Main Content - Same structure as Hunter/Harvest */}
      <main 
        id="main-content"
        role="main"
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28"
        aria-label="Portfolio management dashboard"
      >
        {/* Page Title for Screen Readers */}
        <h1 className="sr-only">Portfolio - Unified Wealth Management</h1>

        {/* Wallet Selector & AI Hub Row */}
        <div className="flex items-center justify-between mb-6">
          {/* Wallet Switching */}
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-3 bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 hover:bg-white/90 dark:hover:bg-white/10 transition-all duration-300">
              <Wallet className="w-5 h-5 text-[#00F5A0]" />
              <select
                value={activeWallet || ''}
                onChange={(e) => handleWalletSwitch(e.target.value)}
                disabled={addressesLoading || walletSwitchLoading}
                className="bg-transparent border-none text-slate-900 dark:text-white text-sm font-medium focus:outline-none cursor-pointer min-w-[140px]"
              >
                <option value="" className="bg-white dark:bg-[#1a1f2e] text-slate-900 dark:text-white">All Wallets</option>
                {addresses.map((addr) => (
                  <option key={addr.id} value={addr.id} className="bg-white dark:bg-[#1a1f2e] text-slate-900 dark:text-white">
                    {addr.label || `${addr.address.slice(0, 6)}...${addr.address.slice(-4)}`}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-600 dark:text-gray-400" />
            </div>
          </motion.div>

          {/* AI Hub Button - Optimized */}
          <motion.button
            onClick={() => setIsCopilotOpen(true)}
            className="flex items-center gap-3 bg-gradient-to-r from-[#00F5A0]/20 to-[#7B61FF]/20 border border-[#00F5A0]/30 text-slate-900 dark:text-white px-6 py-3 rounded-2xl font-medium hover:from-[#00F5A0]/30 hover:to-[#7B61FF]/30 transition-colors duration-200 will-change-transform"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Sparkles className="w-5 h-5" />
            <span className="hidden sm:inline">AI Copilot</span>
          </motion.button>
        </div>

        {/* Net Worth Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl p-8 mb-6"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex-1">
              <p className="text-gray-300 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Total Net Worth</p>
              <motion.h2 
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {formatCurrency(mockData.netWorth)}
              </motion.h2>
            </div>
            <motion.div
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl self-start sm:self-auto ${
                mockData.delta24h >= 0 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-base sm:text-lg font-semibold">
                {formatCurrency(mockData.delta24h)}
              </span>
              <span className="text-xs sm:text-sm font-medium">24h</span>
            </motion.div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Freshness */}
            <div className="bg-white/80 dark:bg-white/5 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-gray-300" />
                <span className="text-[10px] sm:text-xs text-slate-600 dark:text-gray-300 uppercase tracking-wide font-medium">Freshness</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{mockData.freshness.freshnessSec}s</p>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-gray-400 mt-1">
                {Math.round(mockData.freshness.confidence * 100)}% confidence
              </p>
            </div>

            {/* Trust Score */}
            <div className="bg-white/80 dark:bg-white/5 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00F5A0]" />
                <span className="text-[10px] sm:text-xs text-slate-600 dark:text-gray-300 uppercase tracking-wide font-medium">Trust</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[#00F5A0]">{mockData.trustRiskSummary.trustScore}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-gray-400 mt-1">Guardian verified</p>
            </div>

            {/* Risk Score */}
            <div className="bg-white/80 dark:bg-white/5 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-[10px] sm:text-xs text-slate-600 dark:text-gray-300 uppercase tracking-wide font-medium">Risk</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {Math.round(mockData.trustRiskSummary.riskScore * 100)}%
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-gray-400 mt-1">
                {mockData.trustRiskSummary.highRiskApprovals} high-risk approvals
              </p>
            </div>

            {/* Alerts */}
            <div className="bg-white/80 dark:bg-white/5 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 dark:text-red-400" />
                <span className="text-[10px] sm:text-xs text-slate-600 dark:text-gray-300 uppercase tracking-wide font-medium">Alerts</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{mockData.alertsCount}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-gray-400 mt-1">Requires attention</p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <section aria-labelledby="tabs-heading">
          <h2 id="tabs-heading" className="sr-only">Portfolio Sections</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-medium whitespace-nowrap transition-all duration-300 text-sm sm:text-base ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#00F5A0]/20 to-[#7B61FF]/20 border border-[#00F5A0]/30 text-slate-900 dark:text-white shadow-lg'
                      : 'bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/90 dark:hover:bg-white/10'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Tab Content */}
        <section aria-labelledby="content-heading">
          <h2 id="content-heading" className="sr-only">{activeTab} Content</h2>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentTabComponent 
                walletScope={walletScope}
                freshness={mockData.freshness}
                onWalletScopeChange={handleWalletScopeChange}
              />
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      {/* Footer Navigation */}
      <footer role="contentinfo">
        <FooterNav />
      </footer>

      {/* Copilot Chat Drawer - Only render when open */}
      {isCopilotOpen && (
        <CopilotChatDrawer
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          walletScope={walletScope}
        />
      )}
    </div>
  );
}
