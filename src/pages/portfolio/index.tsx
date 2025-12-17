import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePortfolioSummary } from '@/hooks/portfolio/usePortfolioSummary';
import { useRisk } from '@/hooks/portfolio/useRisk';
import { useGuardian } from '@/hooks/portfolio/useGuardian';
import { useUIMode } from '@/store/uiMode';
import { DollarSign, Shield, TrendingUp, Droplets, Target, Link2 } from 'lucide-react';
import { FooterNav } from '@/components/layout/FooterNav';
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { PortfolioHeroCard } from '@/components/portfolio/PortfolioHeroCard';
import { RiskSnapshotCard } from '@/components/portfolio/RiskSnapshotCard';
import { GuardianInsightCard } from '@/components/portfolio/GuardianInsightCard';
import { PortfolioTabs } from '@/components/portfolio/PortfolioTabs';
import { PortfolioTabContent } from '@/components/portfolio/PortfolioTabContent';
import { GlassCard } from '@/components/guardian/GlassUI';
import { NavigationRouter } from '@/lib/navigation/NavigationRouter';

// Mock wallet data for multi-wallet support
const mockWallets = [
  { id: '1', alias: 'Main Wallet', address: '0x1234...5678', trustScore: 85 },
  { id: '2', alias: 'Trading Wallet', address: '0xabcd...efgh', trustScore: 72 },
  { id: '3', alias: 'DeFi Wallet', address: '0x9876...4321', trustScore: 91 }
];

export default function Overview() {
  const navigate = useNavigate();
  const { data: summary, isLoading: summaryLoading } = usePortfolioSummary();
  const { metrics, isLoading: riskLoading } = useRisk();
  const { data: guardian, isLoading: guardianLoading } = useGuardian();
  const uiMode = useUIMode();
  const mode = uiMode?.mode ?? 'novice';
  // Simple string constants instead of i18n for now
  const strings = {
    title: 'Portfolio',
    subtitle: 'Overview',
    portfolioValue: 'Portfolio Value',
    riskScore: 'Risk Score',
    trustIndex: 'Trust Index',
    portfolioValueTooltip: 'Total USD value of all your crypto holdings across connected wallets',
    riskScoreTooltip: 'Risk assessment from 0-10 based on portfolio concentration, volatility, and market exposure',
    trustIndexTooltip: 'Confidence score based on Guardian security analysis and data quality'
  };

  // Header state
  const [isDemo, setIsDemo] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [userMode, setUserMode] = useState<'novice' | 'pro' | 'sim'>(mode as unknown);
  const [activeWallet, setActiveWallet] = useState('1');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'pro');
    if (isDarkTheme) document.documentElement.classList.add('dark');
    if (userMode === 'pro') document.documentElement.classList.add('pro');
  }, [isDarkTheme, userMode]);

  // Aggregated metrics for multi-wallet
  const aggregatedValue = useMemo(() => {
    return mockWallets.reduce((acc, wallet) => acc + (summary?.totalValue || 0), 0);
  }, [summary?.totalValue]);

  const aggregatedRisk = useMemo(() => {
    return mockWallets.reduce((acc, wallet) => acc + (summary?.riskScore || 0), 0) / mockWallets.length;
  }, [summary?.riskScore]);

  const riskSnapshot = useMemo(
    () => [
      {
        label: 'Liquidity',
        score: metrics?.liquidity ?? 0,
        icon: Droplets,
        color: '#00C9A7'
      },
      {
        label: 'Concentration',
        score: metrics?.concentration ?? 0,
        icon: Target,
        color: '#FFD166'
      },
      {
        label: 'Correlation',
        score: metrics?.correlation ?? 0,
        icon: Link2,
        color: '#7C5CFF'
      }
    ],
    [metrics]
  );

  const handleViewGuardian = () => {
    NavigationRouter.navigateToCanonical('guardian', navigate);
  };

  const renderLoading = () => (
    <div className="min-h-screen bg-gradient-to-br from-[#080B14] via-[#101524] to-[#060812]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,201,167,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(124,92,255,0.1),transparent_50%)]" />
      <div className="relative z-10 pb-24">
        <PortfolioHeader
          title="Portfolio"
          subtitle="Overview"
          isDemo={isDemo}
          setIsDemo={setIsDemo}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isDarkTheme={isDarkTheme}
          setIsDarkTheme={setIsDarkTheme}
          userMode={userMode}
          setUserMode={setUserMode}
          wallets={mockWallets}
          activeWallet={activeWallet}
          setActiveWallet={setActiveWallet}
          aggregatedValue={aggregatedValue}
          aggregatedRisk={aggregatedRisk}
        />
        <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-8">
          <div className="h-12 rounded-2xl bg-white/5 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      <FooterNav />
    </div>
  );

  if (summaryLoading) {
    return renderLoading();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#080B14] via-[#101524] to-[#060812]">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,201,167,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(124,92,255,0.1),transparent_50%)]" />
      
      <div className="relative z-10 pb-24">
        {/* Unified Header */}
        <PortfolioHeader
          title={strings.title}
          subtitle={strings.subtitle}
          isDemo={isDemo}
          setIsDemo={setIsDemo}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isDarkTheme={isDarkTheme}
          setIsDarkTheme={setIsDarkTheme}
          userMode={userMode}
          setUserMode={setUserMode}
          wallets={mockWallets}
          activeWallet={activeWallet}
          setActiveWallet={setActiveWallet}
          aggregatedValue={aggregatedValue}
          aggregatedRisk={aggregatedRisk}
          lastUpdated={summary?.updatedAt ? new Date(summary.updatedAt) : undefined}
        />

        <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-8">
          {/* Navigation Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <PortfolioTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          </motion.div>

          {/* Tab Content */}
          <PortfolioTabContent 
            activeTab={activeTab}
            riskData={metrics}
            guardianData={guardian}
            summaryData={summary}
            isLoading={summaryLoading || riskLoading || guardianLoading}
          />
        </div>
      </div>

      {/* Unified Footer */}
      <FooterNav />
    </div>
  );
}
