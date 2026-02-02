'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OverviewTab } from './tabs/OverviewTab';
import { PositionsTab } from './tabs/PositionsTab';
import { AuditTab } from './tabs/AuditTab';
import { StressTestTab } from './tabs/StressTestTab';
import { CopilotChatDrawer } from './CopilotChatDrawer';
import { GlobalHeader } from '@/components/header/GlobalHeader';
import { FooterNav } from '@/components/layout/FooterNav';
import { WalletScope, FreshnessConfidence } from '@/types/portfolio';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator';
import { useTheme } from '@/contexts/ThemeContext';
import { useWalletSwitching } from '@/hooks/useWalletSwitching';
import { usePortfolioIntegration } from '@/hooks/portfolio/usePortfolioIntegration';
import { useUserAddresses } from '@/hooks/useUserAddresses';
import { 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Bell, 
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Activity,
  Loader2
} from 'lucide-react';

export function PortfolioRouteShell() {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'audit' | 'stress'>('overview');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Wallet management
  const { addresses, loading: addressesLoading } = useUserAddresses();
  const { 
    activeWallet, 
    switchWallet, 
    isLoading: walletSwitchLoading 
  } = useWalletSwitching();

  // Determine current wallet scope
  const walletScope = useMemo<WalletScope>(() => {
    if (activeWallet) {
      const wallet = addresses.find(addr => addr.id === activeWallet);
      if (wallet) {
        return { mode: 'active_wallet', address: wallet.address as `0x${string}` };
      }
    }
    return { mode: 'all_wallets' };
  }, [activeWallet, addresses]);

  // Integrate with portfolio APIs - THIS IS THE KEY CHANGE
  const {
    snapshot,
    actions,
    approvals,
    isLoading: portfolioLoading,
    invalidateAll,
    isDemo
  } = usePortfolioIntegration({
    scope: walletScope,
    enableSnapshot: true,
    enableActions: true,
    enableApprovals: true,
  });

  // Extract data from snapshot or use defaults
  const portfolioData = useMemo(() => {
    return {
      netWorth: snapshot?.netWorth || 0,
      delta24h: snapshot?.delta24h || 0,
      freshness: snapshot?.freshness || {
        freshnessSec: 0,
        confidence: 0.70,
        confidenceThreshold: 0.70,
        degraded: false
      } as FreshnessConfidence,
      trustRiskSummary: {
        trustScore: snapshot?.trustScore || 0,
        riskScore: snapshot?.riskScore || 0,
        criticalIssues: snapshot?.criticalIssues || 0,
        highRiskApprovals: approvals.filter(a => a.severity === 'high' || a.severity === 'critical').length
      },
      alertsCount: actions.filter(a => a.severity === 'critical' || a.severity === 'high').length
    };
  }, [snapshot, actions, approvals]);

  // Pull-to-refresh with real data invalidation
  const handleRefresh = useCallback(async () => {
    await invalidateAll();
  }, [invalidateAll]);

  const { isPulling, isRefreshing, pullDistance, threshold } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    disabled: isCopilotOpen,
  });

  const handleWalletScopeChange = useCallback((scope: WalletScope) => {
    // When scope changes, find the wallet and switch to it
    if (scope.mode === 'active_wallet') {
      const wallet = addresses.find(addr => addr.address.toLowerCase() === scope.address.toLowerCase());
      if (wallet) {
        switchWallet(wallet.id);
      }
    }
  }, [addresses, switchWallet]);

  const handleWalletSwitch = useCallback((walletId: string) => {
    switchWallet(walletId);
  }, [switchWallet]);

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
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{ 
        background: isDark 
          ? 'linear-gradient(135deg, #0A0F1F 0%, #0D1B3A 100%)' 
          : 'linear-gradient(135deg, #F0F6FF 0%, #E0EFFF 100%)'
      }}
    >
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        threshold={threshold}
      />

      {/* Background Effects - Same as Hunter */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: isDark ? [
            'linear-gradient(45deg, transparent 30%, rgba(28, 169, 255, 0.05) 50%, transparent 70%)',
            'linear-gradient(45deg, transparent 20%, rgba(28, 169, 255, 0.08) 50%, transparent 80%)',
            'linear-gradient(45deg, transparent 30%, rgba(28, 169, 255, 0.05) 50%, transparent 70%)'
          ] : [
            'linear-gradient(45deg, transparent 30%, rgba(28, 169, 255, 0.03) 50%, transparent 70%)',
            'linear-gradient(45deg, transparent 20%, rgba(28, 169, 255, 0.05) 50%, transparent 80%)',
            'linear-gradient(45deg, transparent 30%, rgba(28, 169, 255, 0.03) 50%, transparent 70%)'
          ]
        }}
        style={{
          backgroundSize: '200% 200%'
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut'
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
              background: isDark ? 'rgba(28, 169, 255, 0.3)' : 'rgba(28, 169, 255, 0.4)',
              left: `${15 + i * 12}%`,
              top: `${10 + (i % 3) * 25}%`,
              boxShadow: isDark ? '0 0 20px rgba(28, 169, 255, 0.3)' : '0 0 20px rgba(28, 169, 255, 0.4)'
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

      {/* Demo Mode Banner */}
      {isDemo && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed ${addresses.length > 0 ? 'top-36' : 'top-20'} left-0 right-0 z-40 py-2 px-4 text-center text-sm font-medium shadow-lg ${
            isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Demo Mode — Data is simulated for demonstration purposes</span>
          </div>
        </motion.div>
      )}

      {/* Wallet Switcher - Added for real-time updates */}
      {addresses.length > 0 && (
        <div className={`fixed top-20 left-4 right-4 z-40 backdrop-blur-md border rounded-2xl p-4 ${
          isDark ? 'bg-white/10 border-[rgba(28,169,255,0.2)]' : 'bg-white/60 border-[rgba(28,169,255,0.3)]'
        }`}>
          <div className="flex items-center gap-3">
            <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Active Wallet:
            </label>
            <select
              value={activeWallet || ''}
              onChange={(e) => handleWalletSwitch(e.target.value)}
              disabled={addressesLoading || walletSwitchLoading || portfolioLoading || isDemo}
              className={`flex-1 px-4 py-2 rounded-xl font-medium transition-colors ${
                isDark 
                  ? 'bg-gray-800 border border-gray-600 text-white' 
                  : 'bg-white border border-gray-300 text-gray-900'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="">All Wallets</option>
              {addresses.map((addr) => (
                <option key={addr.id} value={addr.id}>
                  {addr.label || `${addr.address.slice(0, 6)}...${addr.address.slice(-4)}`}
                </option>
              ))}
            </select>
            {(walletSwitchLoading || portfolioLoading) && !isDemo && (
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            )}
            {isDemo && (
              <span className={`text-xs px-2 py-1 rounded-lg ${
                isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-500/30 text-blue-700'
              }`}>
                Demo
              </span>
            )}
          </div>
        </div>
      )}

      {/* Degraded Mode Banner */}
      {portfolioData.freshness.degraded && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed ${addresses.length > 0 ? 'top-36' : 'top-20'} left-0 right-0 z-40 py-2 px-4 text-center text-sm font-medium shadow-lg ${
            isDark ? 'bg-yellow-600 text-white' : 'bg-yellow-500 text-gray-900'
          }`}
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

        {/* AI Hub Button Row */}
        <div className="flex items-center justify-end mb-6 relative z-10">
          {/* AI Hub Button - Optimized */}
          <motion.button
            onClick={() => setIsCopilotOpen(true)}
            className={`flex items-center gap-3 bg-gradient-to-r border px-6 py-3 rounded-2xl font-medium transition-colors duration-200 will-change-transform ${
              isDark 
                ? 'from-[#1CA9FF]/20 to-[#7B61FF]/20 border-[#1CA9FF]/30 text-white hover:from-[#1CA9FF]/30 hover:to-[#7B61FF]/30' 
                : 'from-[#1CA9FF]/30 to-[#7B61FF]/30 border-[#1CA9FF]/40 text-gray-900 hover:from-[#1CA9FF]/40 hover:to-[#7B61FF]/40'
            }`}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Sparkles className="w-5 h-5" />
            <span className="hidden sm:inline">AI Copilot</span>
          </motion.button>
        </div>

        {/* Net Worth Hero Card - Now with real-time data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`backdrop-blur-md border rounded-3xl p-8 mb-6 ${
            isDark 
              ? 'bg-white/10 border-[rgba(28,169,255,0.2)] shadow-[0_8px_32px_rgba(0,0,0,0.3)]' 
              : 'bg-white/60 border-[rgba(28,169,255,0.3)] shadow-[0_8px_32px_rgba(28,169,255,0.1)]'
          }`}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          key={`hero-${activeWallet}-${isDemo}`}
        >
          {portfolioLoading && !isDemo ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <span className={`ml-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Loading portfolio data...
              </span>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Total Net Worth
                    </p>
                    {isDemo && (
                      <span className={`text-xs px-2 py-0.5 rounded-md ${
                        isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-500/30 text-blue-700'
                      }`}>
                        Demo Data
                      </span>
                    )}
                  </div>
                  <motion.h2 
                    className={`text-3xl sm:text-4xl md:text-5xl font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}
                    style={{ textShadow: isDark ? '0 0 30px rgba(240, 246, 255, 0.5)' : '0 0 30px rgba(28, 169, 255, 0.3)' }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={`networth-${portfolioData.netWorth}`}
                  >
                    {formatCurrency(portfolioData.netWorth)}
                  </motion.h2>
                </div>
                <motion.div
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl self-start sm:self-auto ${
                    portfolioData.delta24h >= 0 
                      ? isDark 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-green-500/30 text-green-700 border border-green-500/40'
                      : isDark 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                        : 'bg-red-500/30 text-red-700 border border-red-500/40'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  key={`delta-${portfolioData.delta24h}`}
                >
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-base sm:text-lg font-semibold">
                    {formatCurrency(portfolioData.delta24h)}
                  </span>
                  <span className="text-xs sm:text-sm font-medium">24h</span>
                </motion.div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Freshness */}
                <div className={`backdrop-blur-sm border rounded-xl p-3 sm:p-4 ${
                  isDark ? 'bg-white/5 border-[rgba(28,169,255,0.1)]' : 'bg-white/40 border-[rgba(28,169,255,0.2)]'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
                    <span className={`text-[10px] sm:text-xs uppercase tracking-wide font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Freshness</span>
                  </div>
                  <p className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{portfolioData.freshness.freshnessSec}s</p>
                  <p className={`text-[10px] sm:text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {Math.round(portfolioData.freshness.confidence * 100)}% confidence
                  </p>
                </div>

                {/* Trust Score */}
                <div className={`backdrop-blur-sm border rounded-xl p-3 sm:p-4 ${
                  isDark ? 'bg-white/5 border-[rgba(28,169,255,0.1)]' : 'bg-white/40 border-[rgba(28,169,255,0.2)]'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1CA9FF]" />
                    <span className={`text-[10px] sm:text-xs uppercase tracking-wide font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Trust</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-[#1CA9FF]">{portfolioData.trustRiskSummary.trustScore}</p>
                  <p className={`text-[10px] sm:text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Guardian verified</p>
                </div>

                {/* Risk Score */}
                <div className={`backdrop-blur-sm border rounded-xl p-3 sm:p-4 ${
                  isDark ? 'bg-white/5 border-[rgba(28,169,255,0.1)]' : 'bg-white/40 border-[rgba(28,169,255,0.2)]'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
                    <span className={`text-[10px] sm:text-xs uppercase tracking-wide font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Risk</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-400">
                    {Math.round(portfolioData.trustRiskSummary.riskScore * 100)}%
                  </p>
                  <p className={`text-[10px] sm:text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {portfolioData.trustRiskSummary.highRiskApprovals} high-risk approvals
                  </p>
                </div>

                {/* Alerts */}
                <div className={`backdrop-blur-sm border rounded-xl p-3 sm:p-4 ${
                  isDark ? 'bg-white/5 border-[rgba(28,169,255,0.1)]' : 'bg-white/40 border-[rgba(28,169,255,0.2)]'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                    <span className={`text-[10px] sm:text-xs uppercase tracking-wide font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Alerts</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-red-400">{portfolioData.alertsCount}</p>
                  <p className={`text-[10px] sm:text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Requires attention</p>
                </div>
              </div>
            </>
          )}
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
                      ? isDark 
                        ? 'bg-gradient-to-r from-[#1CA9FF]/30 to-[#7B61FF]/30 border border-[#1CA9FF]/50 text-white shadow-lg shadow-[#1CA9FF]/20'
                        : 'bg-gradient-to-r from-[#1CA9FF]/40 to-[#7B61FF]/40 border border-[#1CA9FF]/60 text-gray-900 shadow-lg shadow-[#1CA9FF]/30'
                      : isDark 
                        ? 'bg-white/10 border border-[rgba(28,169,255,0.2)] text-gray-300 hover:text-white hover:bg-white/15'
                        : 'bg-white/40 border border-[rgba(28,169,255,0.3)] text-gray-700 hover:text-gray-900 hover:bg-white/60'
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
                freshness={portfolioData.freshness}
                onWalletScopeChange={handleWalletScopeChange}
                snapshot={snapshot}
                actions={actions}
                approvals={approvals}
                isLoading={portfolioLoading}
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
