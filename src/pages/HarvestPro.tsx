/**
 * HarvestPro Dashboard Page
 * Tax-Loss Harvesting Module
 * 
 * Responsive Layout:
 * - Mobile (≤768px): Single column, full-width cards, stacked layout
 * - Tablet (768-1279px): Single column with wider cards
 * - Desktop (≥1280px): Single column with max-width constraint
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HarvestProHeader,
  FilterChipRow,
  HarvestSummaryCard,
  HarvestOpportunityCard,
  HarvestDetailModal,
  HarvestSuccessScreen,
  SummaryCardSkeleton,
  OpportunityCardSkeletonGrid,
  NoWalletsConnected,
  NoOpportunitiesDetected,
  AllOpportunitiesHarvested,
  APIFailureFallback,
} from '@/components/harvestpro';
import { FooterNav } from '@/components/layout/FooterNav';
import { useHarvestFilters } from '@/hooks/useHarvestFilters';
import { useHarvestOpportunities } from '@/hooks/useHarvestOpportunities';
import { useWallet } from '@/contexts/WalletContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator';
import type { OpportunitiesSummary, HarvestOpportunity, HarvestSession } from '@/types/harvestpro';

type ViewState = 'loading' | 'no-wallet' | 'no-opportunities' | 'all-harvested' | 'error' | 'normal';

export default function HarvestPro() {
  const [isDemo, setIsDemo] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('normal');
  
  // Wallet connection status
  const { connectedWallets, activeWallet } = useWallet();
  const isConnected = connectedWallets.length > 0 && !!activeWallet;
  
  // Modal and flow state
  const [selectedOpportunity, setSelectedOpportunity] = useState<HarvestOpportunity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completedSession, setCompletedSession] = useState<HarvestSession | null>(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  // Pull-to-refresh
  const handlePullRefresh = async () => {
    await handleRefresh();
  };

  const { isPulling, isRefreshing: isPullRefreshing, pullDistance, threshold } = usePullToRefresh({
    onRefresh: handlePullRefresh,
    threshold: 80,
    disabled: isModalOpen || showSuccessScreen,
  });

  // Fetch real opportunities from API (disabled in demo mode)
  const {
    data: opportunitiesData,
    isLoading,
    isError,
    refetch,
  } = useHarvestOpportunities({
    enabled: !isDemo, // Only fetch when not in demo mode
  });

  // Mock data for demo mode
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

  // Use real data when not in demo mode, mock data otherwise
  const opportunities = isDemo 
    ? mockOpportunities 
    : (opportunitiesData?.items || []);

  const summary = isDemo
    ? mockSummary
    : (opportunitiesData?.summary || {
        totalHarvestableLoss: 0,
        estimatedNetBenefit: 0,
        eligibleTokensCount: 0,
        gasEfficiencyScore: 'C' as const,
      });

  // Use the filtering hook
  const { filteredOpportunities, isFiltered, activeFilterCount } = useHarvestFilters(opportunities);

  // Update view state based on API response
  useEffect(() => {
    if (isDemo) {
      // In demo mode, always show normal view
      setViewState('normal');
    } else if (isLoading) {
      setViewState('loading');
    } else if (isError) {
      setViewState('error');
    } else if (opportunities.length === 0) {
      setViewState('no-opportunities');
    } else {
      setViewState('normal');
    }
  }, [isDemo, isLoading, isError, opportunities.length]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (isDemo) {
      // In demo mode, just simulate refresh
      setTimeout(() => {
        setIsRefreshing(false);
        setLastUpdated(new Date());
      }, 1000);
    } else {
      // In real mode, refetch from API
      refetch().finally(() => {
        setIsRefreshing(false);
        setLastUpdated(new Date());
      });
    }
  };

  // Handle opening detail modal
  const handleStartHarvest = (opportunityId: string) => {
    console.log('🚀 Start Harvest clicked! Opportunity ID:', opportunityId);
    // Search in the actual opportunities array (not mockOpportunities)
    const opportunity = opportunities.find(opp => opp.id === opportunityId);
    console.log('📦 Found opportunity:', opportunity);
    if (opportunity) {
      setSelectedOpportunity(opportunity);
      setIsModalOpen(true);
      console.log('✅ Modal should open now');
    } else {
      console.error('❌ Opportunity not found!');
    }
  };

  // Handle harvest execution
  const handleExecute = (opportunityId: string) => {
    console.log('Executing harvest for opportunity:', opportunityId);
    
    // Simulate execution and create a mock completed session
    setTimeout(() => {
      const mockSession: HarvestSession = {
        sessionId: `session-${Date.now()}`,
        userId: 'user-1',
        createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        updatedAt: new Date().toISOString(),
        status: 'completed',
        opportunitiesSelected: selectedOpportunity ? [selectedOpportunity] : [],
        realizedLossesTotal: selectedOpportunity?.unrealizedLoss || 0,
        netBenefitTotal: selectedOpportunity?.netTaxBenefit || 0,
        executionSteps: [
          {
            id: 'step-1',
            sessionId: `session-${Date.now()}`,
            stepNumber: 1,
            description: 'Approve token swap',
            type: 'on-chain',
            status: 'completed',
            transactionHash: '0x1234...5678',
            errorMessage: null,
            guardianScore: selectedOpportunity?.guardianScore || 8,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
          {
            id: 'step-2',
            sessionId: `session-${Date.now()}`,
            stepNumber: 2,
            description: 'Execute swap',
            type: 'on-chain',
            status: 'completed',
            transactionHash: '0xabcd...efgh',
            errorMessage: null,
            guardianScore: selectedOpportunity?.guardianScore || 8,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
        ],
        exportUrl: null,
        proofHash: null,
      };
      
      setIsModalOpen(false);
      setCompletedSession(mockSession);
      setShowSuccessScreen(true);
    }, 2000); // Simulate 2 second execution
  };

  // Handle CSV download - client-side generation
  const handleDownloadCSV = (sessionId: string) => {
    if (!completedSession) return;
    
    // Import the CSV generation function
    import('@/lib/harvestpro/csv-export').then(({ generateForm8949CSV }) => {
      const csv = generateForm8949CSV(completedSession);
      
      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `harvest-session-${sessionId}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      console.log('✅ CSV downloaded successfully');
    }).catch(error => {
      console.error('❌ Failed to generate CSV:', error);
    });
  };

  // Handle view proof
  const handleViewProof = (sessionId: string) => {
    console.log('View proof for session:', sessionId);
    // This will be implemented in Task 20
  };

  // Handle closing success screen
  const handleCloseSuccess = () => {
    setShowSuccessScreen(false);
    setCompletedSession(null);
    setSelectedOpportunity(null);
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
              summary={summary}
              hasHighRiskOpportunities={true}
              className="mb-6"
            />

            {/* Opportunities Feed */}
            <div className="space-y-4">
              {filteredOpportunities.length > 0 ? (
                filteredOpportunities.map((opportunity, index) => (
                  <HarvestOpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    index={index}
                    onStartHarvest={handleStartHarvest}
                    onSave={(id) => console.log('Save:', id)}
                    onShare={(id) => console.log('Share:', id)}
                    onReport={(id) => console.log('Report:', id)}
                    isConnected={isConnected}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-lg mb-2">No opportunities match your filters</p>
                  <p className="text-sm">
                    {isFiltered && `${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active`}
                  </p>
                </div>
              )}
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
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isPullRefreshing}
        pullDistance={pullDistance}
        threshold={threshold}
      />
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
        <FilterChipRow className="mb-6" />

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

      {/* Detail Modal */}
      <HarvestDetailModal
        opportunity={selectedOpportunity}
        isOpen={isModalOpen}
        onClose={() => {
          console.log('🚪 Modal closing');
          setIsModalOpen(false);
          setSelectedOpportunity(null);
        }}
        onExecute={handleExecute}
        isConnected={isConnected}
      />

      {/* Success Screen */}
      {completedSession && showSuccessScreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <HarvestSuccessScreen
            session={completedSession}
            onDownloadCSV={handleDownloadCSV}
            onViewProof={handleViewProof}
            onClose={handleCloseSuccess}
          />
        </div>
      )}
    </div>
  );
}
