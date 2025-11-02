import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePortfolioSummary } from '@/hooks/portfolio/usePortfolioSummary';
import { useRisk } from '@/hooks/portfolio/useRisk';
import { useUIMode } from '@/store/uiMode';
import { AlertTriangle, TrendingUp, TrendingDown, Shield, Target, Droplets, Link2, HelpCircle, ArrowLeft } from 'lucide-react';
import { FooterNav } from '@/components/layout/FooterNav';
import { GlassCard } from '@/components/guardian/GlassUI';

export default function Risk() {
  const navigate = useNavigate();
  const { data: summary } = usePortfolioSummary();
  const { metrics, isLoading } = useRisk();
  const { mode } = useUIMode() || { mode: 'novice' };
  
  // Header state
  const [isDemo, setIsDemo] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [userMode, setUserMode] = useState<'novice' | 'pro' | 'sim'>(mode as any);
  const [activeWallet, setActiveWallet] = useState('1');

  // Mock wallet data
  const mockWallets = [
    { id: '1', alias: 'Main Wallet', address: '0x1234...5678', trustScore: 85 },
    { id: '2', alias: 'Trading Wallet', address: '0xabcd...efgh', trustScore: 72 }
  ];

  const aggregatedValue = mockWallets.reduce((acc, wallet) => acc + (summary?.totalValue || 0), 0);
  const aggregatedRisk = mockWallets.reduce((acc, wallet) => acc + (summary?.riskScore || 0), 0) / mockWallets.length;
  
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'pro');
    if (isDarkTheme) document.documentElement.classList.add('dark');
    if (userMode === 'pro') document.documentElement.classList.add('pro');
  }, [isDarkTheme, userMode]);

  const getHealthColor = (score: number) => {
    const percentage = score * 10;
    if (percentage >= 70) return '#00C9A7'; // Green
    if (percentage >= 40) return '#FFD166'; // Amber
    return '#EF476F'; // Red
  };

  const getHealthLabel = (score: number) => {
    const percentage = score * 10;
    if (percentage >= 70) return 'LOW RISK';
    if (percentage >= 40) return 'MEDIUM RISK';
    return 'HIGH RISK';
  };

  const riskFactors = [
    {
      title: 'Concentration Risk',
      score: metrics?.concentration ?? 6.5,
      description: 'Measures portfolio diversification across assets',
      tooltip: 'Lower scores indicate better diversification. High concentration means too much exposure to few assets.',
      icon: Target,
      color: '#FFD166'
    },
    {
      title: 'Liquidity Risk',
      score: metrics?.liquidity ?? 8.2,
      description: 'Assesses ease of converting assets to cash',
      tooltip: 'Higher scores mean assets can be sold quickly without major price impact.',
      icon: Droplets,
      color: '#00C9A7'
    },
    {
      title: 'Market Correlation',
      score: metrics?.correlation ?? 7.1,
      description: 'Shows how assets move together in price',
      tooltip: 'Lower correlation provides better risk diversification during market volatility.',
      icon: Link2,
      color: '#7C5CFF'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#080B14] via-[#101524] to-[#060812]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,201,167,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(124,92,255,0.1),transparent_50%)]" />
        <div className="relative z-10 pb-24">
          <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <FooterNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#080B14] via-[#101524] to-[#060812]">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,201,167,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(124,92,255,0.1),transparent_50%)]" />
      
      <div className="relative z-10 pb-24">
        {/* Navigation Header */}
        <div className="backdrop-blur-xl bg-slate-900/80 border-b border-white/10 sticky top-0 z-40">
          <div className="max-w-screen-xl mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/portfolio')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Portfolio
              </button>
              <div>
                <h1 className="text-xl font-semibold text-white">Risk Analysis</h1>
                <p className="text-sm text-gray-400">Portfolio Risk Assessment</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-8">
          {/* Quick Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex gap-2 flex-wrap"
          >
            <button
              onClick={() => navigate('/portfolio')}
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-sm"
            >
              Overview
            </button>
            <button
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] text-white text-sm"
            >
              Risk Analysis
            </button>
            <button
              onClick={() => navigate('/portfolio/stress')}
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-sm"
            >
              Stress Test
            </button>
            <button
              onClick={() => navigate('/portfolio/guardian')}
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-sm"
            >
              Guardian
            </button>
            <button
              onClick={() => navigate('/portfolio/results')}
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-sm"
            >
              Results
            </button>
            <button
              onClick={() => navigate('/portfolio/addresses')}
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-sm"
            >
              Addresses
            </button>
          </motion.div>
          {/* Hero Metrics */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard className="p-6 hover:bg-white/10 transition-all duration-300">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-[#FFD166]/20 to-[#EF476F]/20 border border-white/10">
                      <AlertTriangle className="w-6 h-6 text-[#FFD166]" />
                    </div>
                    <div className="flex items-center gap-1">
                      <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">
                        Overall Risk Score
                      </h3>
                      {userMode === 'novice' && (
                        <HelpCircle className="w-3 h-3 text-gray-400 hover:text-[#00C9A7] transition-colors cursor-help" />
                      )}
                    </div>
                  </div>
                  <motion.div
                    key={summary?.riskScore}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl font-bold text-white tabular-nums"
                  >
                    {summary?.riskScore?.toFixed(1) ?? '6.2'}
                    <span className="text-base text-gray-500"> / 10</span>
                  </motion.div>
                  <p className="text-sm text-gray-400">
                    Comprehensive risk assessment based on multiple factors
                  </p>
                </div>
              </GlassCard>

              <GlassCard className="p-6 hover:bg-white/10 transition-all duration-300">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-[#00C9A7]/20 to-[#7B61FF]/20 border border-white/10">
                      <Shield className="w-6 h-6 text-[#00C9A7]" />
                    </div>
                    <div className="flex items-center gap-1">
                      <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">
                        Trust Index
                      </h3>
                      {userMode === 'novice' && (
                        <HelpCircle className="w-3 h-3 text-gray-400 hover:text-[#00C9A7] transition-colors cursor-help" />
                      )}
                    </div>
                  </div>
                  <motion.div
                    key={summary?.trustIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl font-bold text-white tabular-nums"
                  >
                    {summary?.trustIndex ?? '87'}
                    <span className="text-base text-gray-500">%</span>
                  </motion.div>
                  <p className="text-sm text-gray-400">
                    Confidence score based on Guardian security analysis
                  </p>
                </div>
              </GlassCard>
            </div>
          </motion.section>

          {/* Risk Factor Cards */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wider">
                Risk Factor Analysis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {riskFactors.map((factor, index) => {
                  const Icon = factor.icon;
                  const healthPercentage = Math.min(factor.score * 10, 100);
                  const healthColor = getHealthColor(factor.score);
                  const healthLabel = getHealthLabel(factor.score);
                  
                  return (
                    <motion.div
                      key={factor.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                    >
                      <GlassCard className="p-6 hover:bg-white/10 transition-all duration-300">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-center gap-3">
                            <div 
                              className="p-2 rounded-xl border"
                              style={{
                                backgroundColor: `${factor.color}20`,
                                borderColor: `${factor.color}40`
                              }}
                            >
                              <Icon className="w-6 h-6" style={{ color: factor.color }} />
                            </div>
                            <div className="flex items-center gap-1">
                              <h3 className="text-lg font-semibold text-white">{factor.title}</h3>
                              {userMode === 'novice' && (
                                <HelpCircle className="w-3 h-3 text-gray-400 hover:text-[#00C9A7] transition-colors cursor-help" />
                              )}
                            </div>
                          </div>

                          {/* Score */}
                          <div className="flex items-center justify-between">
                            <motion.div
                              key={factor.score}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.5 }}
                              className="text-2xl font-bold text-white tabular-nums"
                            >
                              {factor.score.toFixed(1)}
                              <span className="text-sm text-gray-400 font-normal"> / 10</span>
                            </motion.div>
                            
                            <div 
                              className="px-3 py-1 rounded-full text-xs font-medium border"
                              style={{
                                backgroundColor: `${healthColor}20`,
                                borderColor: `${healthColor}40`,
                                color: healthColor
                              }}
                            >
                              {healthLabel}
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-gray-400">{factor.description}</p>

                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Health Score</span>
                              <span style={{ color: healthColor }}>
                                {Math.round(healthPercentage)}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: healthColor }}
                                initial={{ width: 0 }}
                                animate={{ width: `${healthPercentage}%` }}
                                transition={{ duration: 1, delay: 0.4 + index * 0.1, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.section>
        </div>
      </div>

      {/* Unified Footer */}
      <FooterNav />
    </div>
  );
}