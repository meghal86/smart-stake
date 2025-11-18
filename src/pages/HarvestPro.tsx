/**
 * HarvestPro Dashboard Page
 * Tax-Loss Harvesting Module
 * 
 * Responsive Layout:
 * - Mobile (≤768px): Single column, full-width cards, stacked layout
 * - Tablet (768-1279px): Single column with wider cards
 * - Desktop (≥1280px): Single column with max-width constraint
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HarvestProHeader,
  FilterChipRow,
  FilterChipType,
  HarvestSummaryCard,
  HarvestOpportunityCard,
  SummaryCardSkeleton,
  OpportunityCardSkeletonGrid,
  NoWalletsConnected,
  NoOpportunitiesDetected,
  AllOpportunitiesHarvested,
  APIFailureFallback,
} from '@/components/harvestpro';
import { FooterNav } from '@/components/layout/FooterNav';
import type { OpportunitiesSummary, HarvestOpportunity } from '@/types/harvestpro';

type ViewState = 'loading' | 'no-wallet' | 'no-opportunities' | 'all-harvested' | 'error' | 'normal';

export default function HarvestPro() {
  const [isDemo, setIsDemo] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterChipType>('All');
  const [lastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('normal');

  // Mock summary data
  const mockSummary: OpportunitiesSummary = {
    totalHarvestableLoss: 12450,
    estimatedNetBenefit: 2988,
    eligibleTokensCount: 8,
    gasEfficiencyScore: 'B',
  };

  // Mock opportunities data
  const mockOpportunities: HarvestOpportunity[] = [
    {
      id: '1',
      lotId: 'lot-1',
      userId: 'user-1',
      token: 'ETH',
      tokenLogoUrl: null,
      riskLevel: 'LOW',
      unrealizedLoss: 4500,
      remainingQty: 2.5,
      gasEstimate: 45,
      slippageEstimate: 22,
      tradingFees: 15,
      netTaxBenefit: 1080,
      guardianScore: 8.5,
      executionTimeEstimate: '5-8 min',
      confidence: 92,
      recommendationBadge: 'recommended',
      metadata: {
        walletName: 'Main Wallet',
        venue: 'Uniswap',
        reasons: ['High liquidity', 'Low gas cost'],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      lotId: 'lot-2',
      userId: 'user-1',
      token: 'MATIC',
      tokenLogoUrl: null,
      riskLevel: 'MEDIUM',
      unrealizedLoss: 2800,
      remainingQty: 5000,
      gasEstimate: 35,
      slippageEstimate: 45,
      tradingFees: 12,
      netTaxBenefit: 672,
      guardianScore: 6.2,
      executionTimeEstimate: '8-12 min',
      confidence: 78,
      recommendationBadge: 'high-benefit',
      metadata: {
        walletName: 'Trading Wallet',
        venue: 'QuickSwap',
        reasons: ['Moderate slippage expected'],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      lotId: 'lot-3',
      userId: 'user-1',
      token: 'LINK',
      tokenLogoUrl: null,
      riskLevel: 'HIGH',
      unrealizedLoss: 1850,
      remainingQty: 150,
      gasEstimate: 55,
      slippageEstimate: 85,
      tradingFees: 18,
      netTaxBenefit: 444,
      guardianScore: 4.1,
      executionTimeEstimate: '10-15 min',
      confidence: 65,
      recommendationBadge: 'guardian-flagged',
      metadata: {
        walletName: 'Cold Wallet',
        venue: 'SushiSwap',
        reasons: ['Low liquidity pool', 'High slippage risk'],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const renderContent = () => {
    switch (viewState) {
      case 'loading':
        return (
          <>
            <SummaryCardSkeleton className="mb-6" />
            <OpportunityCardSkeletonGrid count={3} />
          </>
        );

      case 'no-wallet':
        return (
          <NoWalletsConnected
            onConnectWallet={() => console.log('Connect wallet')}
          />
        );

      case 'no-opportunities':
        return <NoOpportunitiesDetected />;

      case 'all-harvested':
        return (
          <AllOpportunitiesHarvested
            onDownloadCSV={() => console.log('Download CSV')}
            onViewProof={() => console.log('View proof')}
          />
        );

      case 'error':
        return (
          <APIFailureFallback
            onRetry={handleRefresh}
            isRetrying={isRefreshing}
          />
        );

      case 'normal':
      default:
        return (
          <>
            {/* Summary Card */}
            <HarvestSummaryCard
              summary={mockSummary}
              hasHighRiskOpportunities={true}
              className="mb-6"
            />

            {/* Opportunities Feed */}
            <div className="space-y-4">
              {mockOpportunities.map((opportunity, index) => (
                <HarvestOpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  index={index}
                  onStartHarvest={(id) => console.log('Start harvest:', id)}
                  onSave={(id) => console.log('Save:', id)}
                  onShare={(id) => console.log('Share:', id)}
                  onReport={(id) => console.log('Report:', id)}
                  isConnected={true}
                />
              ))}
            </div>

            {/* Demo State Switcher */}
            <div className="mt-8 text-center py-6 text-gray-400 rounded-2xl border border-white/10 bg-white/5">
              <p className="text-sm mb-4">Demo State Switcher</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setViewState('loading')}
                  className="px-3 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
                >
                  Show Loading
                </button>
                <button
                  onClick={() => setViewState('no-wallet')}
                  className="px-3 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
                >
                  Show No Wallet
                </button>
                <button
                  onClick={() => setViewState('no-opportunities')}
                  className="px-3 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
                >
                  Show No Opportunities
                </button>
                <button
                  onClick={() => setViewState('all-harvested')}
                  className="px-3 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
                >
                  Show All Harvested
                </button>
                <button
                  onClick={() => setViewState('error')}
                  className="px-3 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
                >
                  Show Error
                </button>
                <button
                  onClick={() => setViewState('normal')}
                  className="px-3 py-1 text-xs rounded-lg bg-[#ed8f2d] hover:bg-[#B8722E] transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0A0E1A] to-[#111827]">
      {/* Background Effects */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(ellipse 80% 50% at 80% 20%, rgba(237,143,45,0.12) 0%, transparent 70%)',
            'radial-gradient(ellipse 60% 40% at 20% 80%, rgba(20,184,166,0.08) 0%, transparent 70%)',
            'radial-gradient(ellipse 70% 45% at 50% 50%, rgba(237,143,45,0.10) 0%, transparent 70%)',
            'radial-gradient(ellipse 80% 50% at 80% 20%, rgba(237,143,45,0.12) 0%, transparent 70%)',
          ],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: [0.25, 1, 0.5, 1],
        }}
      />

      {/* Header */}
      <HarvestProHeader
        isDemo={isDemo}
        setIsDemo={setIsDemo}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Content - Responsive Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28">
        {/* Filter Chips - Horizontally scrollable on mobile */}
        <FilterChipRow
          selectedFilter={activeFilter}
          onFilterChange={setActiveFilter}
          className="mb-6"
        />

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={viewState}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <FooterNav />
    </div>
  );
}
