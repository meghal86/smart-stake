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
import { Activity, Shield, Sparkles } from 'lucide-react';
import { GlobalHeader } from '@/components/header/GlobalHeader';
import {
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
import { HarvestProErrorBoundary } from '@/components/harvestpro/HarvestProErrorBoundary';
import { FooterNav } from '@/components/layout/FooterNav';
import { useHarvestFilters } from '@/hooks/useHarvestFilters';
import { useHarvestOpportunities } from '@/hooks/useHarvestOpportunities';
import { useWallet } from '@/contexts/WalletContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator';
import { useDemoMode } from '@/lib/ux/DemoModeManager';
import { serviceAvailability, HarvestProService } from '@/lib/harvestpro/service-availability';
import { harvestProPerformanceMonitor } from '@/lib/harvestpro/performance-monitor';
import type { OpportunitiesResponse, OpportunitiesSummary, HarvestOpportunity, HarvestSession } from '@/types/harvestpro';

type ViewState = 'loading' | 'no-wallet' | 'no-opportunities' | 'all-harvested' | 'error' | 'normal';

export default function HarvestPro() {
  // Use centralized demo mode management
  const { isDemo, setDemoMode } = useDemoMode();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('normal');
  
  // Wallet connection status - read from authenticated WalletContext
  const { connectedWallets, activeWallet, isAuthenticated } = useWallet();
  const isConnected = connectedWallets.length > 0 && !!activeWallet;
  
  // When in demo mode, always show demo data regardless of authentication
  const shouldUseDemoMode = isDemo;
  
  // Modal and flow state
  const [selectedOpportunity, setSelectedOpportunity] = useState<HarvestOpportunity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completedSession, setCompletedSession] = useState<HarvestSession | null>(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  // Initialize service monitoring
  useEffect(() => {
    serviceAvailability.startMonitoringAll();
    
    return () => {
      serviceAvailability.cleanup();
    };
  }, []);

  // Handle demo mode when services are unavailable
  const handleServiceDegradation = () => {
    const health = serviceAvailability.getHealthSummary();
    if (health.overallHealth === 'critical' && !isDemo) {
      setDemoMode(true);
    }
  };

  // Pull-to-refresh
  const handlePullRefresh = async () => {
    await handleRefresh();
  };

  const { isPulling, isRefreshing: isPullRefreshing, pullDistance, threshold } = usePullToRefresh({
    onRefresh: handlePullRefresh,
    threshold: 80,
    disabled: isModalOpen || showSuccessScreen,
  });

  // Fetch real opportunities from API (disabled only when in demo mode AND not authenticated)
  const {
    data: opportunitiesData,
    isLoading,
    isError,
    refetch,
  } = useHarvestOpportunities({
    enabled: !shouldUseDemoMode, // Fetch when authenticated or not in demo mode
  });

  // Refetch when switching from demo to live mode
  useEffect(() => {
    if (!shouldUseDemoMode && !isLoading) {
      refetch();
    }
  }, [shouldUseDemoMode, isLoading, refetch]);

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

  // Default empty response for when data is not available
  const emptyResponse: OpportunitiesResponse = {
    items: [],
    cursor: null,
    ts: new Date().toISOString(),
    summary: {
      totalHarvestableLoss: 0,
      estimatedNetBenefit: 0,
      eligibleTokensCount: 0,
      gasEfficiencyScore: 'C' as const,
    },
  };

  // Use real data when not in demo mode, mock data otherwise
  let currentData: OpportunitiesResponse;
  
  if (shouldUseDemoMode) {
    currentData = {
      items: mockOpportunities,
      cursor: null,
      ts: new Date().toISOString(),
      summary: mockSummary,
    };
  } else if (opportunitiesData) {
    currentData = opportunitiesData as OpportunitiesResponse;
  } else {
    currentData = emptyResponse;
  }

  const opportunities = currentData.items;
  const summary = currentData.summary;

  // Use the filtering hook
  const { filteredOpportunities, isFiltered, activeFilterCount } = useHarvestFilters(opportunities);

  // Update view state based on API response with performance monitoring
  useEffect(() => {
    harvestProPerformanceMonitor.measureLoadingState('view_state_update', () => {
      if (shouldUseDemoMode) {
        // In demo mode, always show normal view with mock data
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
    });
  }, [shouldUseDemoMode, isLoading, isError, opportunities.length]);

  const handleRefresh = () => {
    harvestProPerformanceMonitor.measureInteraction('refresh', () => {
      setIsRefreshing(true);
      if (shouldUseDemoMode) {
        // In demo mode, just simulate refresh
        setTimeout(() => {
          setIsRefreshing(false);
          setLastUpdated(new Date());
        }, 1000);
      } else {
        // In live mode, refetch from API
        refetch().finally(() => {
          setIsRefreshing(false);
          setLastUpdated(new Date());
        });
      }
    }, { mode: shouldUseDemoMode ? 'demo' : 'live' });
  };

  // Handle opening detail modal with performance monitoring
  const handleStartHarvest = (opportunityId: string) => {
    harvestProPerformanceMonitor.measureInteraction('modal_open', () => {
      console.log('🚀 Start Harvest clicked! Opportunity ID:', opportunityId);
      // Search in the actual opportunities array (not mockOpportunities)
      const opportunity = opportunities.find((opp: HarvestOpportunity) => opp.id === opportunityId);
      console.log('📦 Found opportunity:', opportunity);
      if (opportunity) {
        setSelectedOpportunity(opportunity);
        setIsModalOpen(true);
        console.log('✅ Modal should open now');
      } else {
        console.error('❌ Opportunity not found!');
      }
    }, { opportunityId, opportunityCount: opportunities.length });
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

  // Handle CSV download - client-side generation with performance monitoring
  // Enhanced Req 30 AC5: Demo export watermark for demo data
  const handleDownloadCSV = (sessionId: string) => {
    if (!completedSession) return;
    
    harvestProPerformanceMonitor.measureCSVGeneration('download_trigger', () => {
      // Import the CSV generation function
      import('@/lib/harvestpro/csv-export').then(({ generateForm8949CSV }) => {
        harvestProPerformanceMonitor.measureCSVGeneration('generation', () => {
          // Enhanced Req 30 AC5: Pass demo mode to CSV generation for watermarking
          const csv = generateForm8949CSV(completedSession, shouldUseDemoMode);
          
          // Create blob and download
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          
          // Enhanced Req 30 AC5: Add demo prefix to filename for demo exports
          const filename = shouldUseDemoMode 
            ? `DEMO-harvest-session-${sessionId}.csv`
            : `harvest-session-${sessionId}.csv`;
          
          link.setAttribute('href', url);
          link.setAttribute('download', filename);
          link.style.visibility = 'hidden';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          URL.revokeObjectURL(url);
          console.log(`✅ CSV downloaded successfully${shouldUseDemoMode ? ' (DEMO MODE)' : ''}`);
          
          return csv;
        }, {
          sessionId,
          opportunityCount: completedSession.opportunitiesSelected.length,
          totalBenefit: completedSession.netBenefitTotal,
        });
      }).catch(error => {
        console.error('❌ Failed to generate CSV:', error);
        harvestProPerformanceMonitor.recordMetric(
          'csv:import_error',
          Date.now(),
          0,
          { error: error.message, sessionId }
        );
      });
    }, { sessionId });
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
          <HarvestProErrorBoundary
            component="loading-state"
            enableRecovery={false}
          >
            <SummaryCardSkeleton className="mb-6" />
            <OpportunityCardSkeletonGrid count={3} />
          </HarvestProErrorBoundary>
        );

      case 'no-wallet':
        return (
          <HarvestProErrorBoundary
            component="no-wallet-state"
            enableRecovery={false}
          >
            <NoWalletsConnected
              onConnectWallet={() => console.log('Connect wallet')}
            />
          </HarvestProErrorBoundary>
        );

      case 'no-opportunities':
        return (
          <HarvestProErrorBoundary
            component="no-opportunities-state"
            enableDemoMode={true}
            onEnterDemoMode={handleServiceDegradation}
          >
            <NoOpportunitiesDetected />
          </HarvestProErrorBoundary>
        );

      case 'all-harvested':
        return (
          <HarvestProErrorBoundary
            component="all-harvested-state"
            enableRecovery={true}
          >
            <AllOpportunitiesHarvested
              onDownloadCSV={() => console.log('Download CSV')}
              onViewProof={() => console.log('View proof')}
            />
          </HarvestProErrorBoundary>
        );

      case 'error':
        return (
          <HarvestProErrorBoundary
            component="error-fallback"
            enableDemoMode={true}
            onEnterDemoMode={handleServiceDegradation}
          >
            <APIFailureFallback
              onRetry={handleRefresh}
              isRetrying={isRefreshing}
            />
          </HarvestProErrorBoundary>
        );

      case 'normal':
      default:
        return (
          <>
            {/* Summary Card */}
            <HarvestProErrorBoundary
              component="summary-card"
              enableDemoMode={true}
              onEnterDemoMode={handleServiceDegradation}
              cacheKey="harvestpro-summary"
            >
              <HarvestSummaryCard
                summary={summary}
                hasHighRiskOpportunities={true}
                className="mb-6"
              />
            </HarvestProErrorBoundary>

            {/* Opportunities Feed */}
            <HarvestProErrorBoundary
              component="opportunities-feed"
              enableDemoMode={true}
              onEnterDemoMode={handleServiceDegradation}
              cacheKey="harvestpro-opportunities-list"
            >
              <div className="space-y-4">
                {filteredOpportunities.length > 0 ? (
                  filteredOpportunities.map((opportunity, index) => (
                    <HarvestProErrorBoundary
                      key={opportunity.id}
                      component="opportunity-card"
                      enableRecovery={true}
                    >
                      <HarvestOpportunityCard
                        opportunity={opportunity}
                        index={index}
                        onStartHarvest={handleStartHarvest}
                        onSave={(id) => console.log('Save:', id)}
                        onShare={(id) => console.log('Share:', id)}
                        onReport={(id) => console.log('Report:', id)}
                        isConnected={isConnected}
                        isDemo={shouldUseDemoMode}
                      />
                    </HarvestProErrorBoundary>
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
            </HarvestProErrorBoundary>

            {/* Demo State Switcher */}
            <div className="mt-8 rounded-[28px] border border-white/8 bg-[#0b0b0c] py-6 text-center text-[#9c978f] shadow-[0_22px_80px_rgba(0,0,0,0.28)]">
              <p className="text-sm mb-4">Demo State Switcher</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setViewState('loading')}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-[#cfc8bd] transition-colors hover:bg-white/[0.08]"
                >
                  Show Loading
                </button>
                <button
                  onClick={() => setViewState('no-wallet')}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-[#cfc8bd] transition-colors hover:bg-white/[0.08]"
                >
                  Show No Wallet
                </button>
                <button
                  onClick={() => setViewState('no-opportunities')}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-[#cfc8bd] transition-colors hover:bg-white/[0.08]"
                >
                  Show No Opportunities
                </button>
                <button
                  onClick={() => setViewState('all-harvested')}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-[#cfc8bd] transition-colors hover:bg-white/[0.08]"
                >
                  Show All Harvested
                </button>
                <button
                  onClick={() => setViewState('error')}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-[#cfc8bd] transition-colors hover:bg-white/[0.08]"
                >
                  Show Error
                </button>
                <button
                  onClick={() => setViewState('normal')}
                  className="rounded-lg bg-[#f6f2ea] px-3 py-1 text-xs text-black transition-colors hover:bg-white"
                >
                  Reset
                </button>
              </div>
            </div>
          </>
        );
    }
  };

  const totalLoss = summary?.totalHarvestableLoss ?? 0;
  const netBenefit = summary?.estimatedNetBenefit ?? 0;
  const eligibleCount = summary?.eligibleTokensCount ?? 0;

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050505] text-[#f6f2ea]">
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isPullRefreshing}
        pullDistance={pullDistance}
        threshold={threshold}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(circle at top right, rgba(126,163,242,0.16), transparent 28%), radial-gradient(circle at bottom left, rgba(255,255,255,0.04), transparent 35%)',
            'radial-gradient(circle at top right, rgba(208,163,92,0.14), transparent 30%), radial-gradient(circle at bottom left, rgba(255,255,255,0.05), transparent 38%)',
            'radial-gradient(circle at top right, rgba(126,163,242,0.16), transparent 28%), radial-gradient(circle at bottom left, rgba(255,255,255,0.04), transparent 35%)',
          ],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: [0.25, 1, 0.5, 1],
        }}
        aria-hidden="true"
      />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header role="banner">
        <HarvestProErrorBoundary
          component="header"
          enableDemoMode={true}
          onEnterDemoMode={handleServiceDegradation}
          cacheKey="harvestpro-header"
        >
          <GlobalHeader className="border-white/8 bg-[#050505]/94" />
        </HarvestProErrorBoundary>
      </header>

      <div className="relative mx-auto max-w-[1600px] px-4 pb-28 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#d6c08d]">
              <Sparkles className="h-3.5 w-3.5" />
              HarvestPro
            </div>
            <h1 className="text-3xl tracking-tight text-[#f6f2ea] sm:text-4xl">Tax-aware exits, without noise.</h1>
            <p className="mt-2 max-w-3xl text-sm text-[#9c978f] sm:text-base">
              Review live harvesting opportunities, compare net benefit, and move through execution from one quieter surface.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <main
            id="main-content"
            role="main"
            className="min-w-0"
            aria-label="HarvestPro tax-loss harvesting opportunities"
          >
            <h1 className="sr-only">HarvestPro - Tax-Loss Harvesting Opportunities</h1>

            <section aria-labelledby="filters-heading">
              <h2 id="filters-heading" className="sr-only">Filter Opportunities</h2>
              <HarvestProErrorBoundary
                component="filters"
                enableDemoMode={true}
                onEnterDemoMode={handleServiceDegradation}
              >
                <FilterChipRow className="mb-6" />
              </HarvestProErrorBoundary>
            </section>

            <section aria-labelledby="opportunities-heading">
              <h2 id="opportunities-heading" className="sr-only">Harvest Opportunities</h2>
              <HarvestProErrorBoundary
                component="main-content"
                enableDemoMode={true}
                onEnterDemoMode={handleServiceDegradation}
                cacheKey="harvestpro-opportunities"
              >
                <div>
                  {renderContent()}
                </div>
              </HarvestProErrorBoundary>
            </section>
          </main>

          <aside className="space-y-6">
            <section className="rounded-[30px] border border-white/8 bg-[#0b0b0c] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.28)]">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Opportunity read</p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between border-b border-white/8 pb-4">
                  <span className="text-sm text-[#9c978f]">Harvestable loss</span>
                  <span className="text-sm text-[#f6f2ea]">${totalLoss.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/8 pb-4">
                  <span className="text-sm text-[#9c978f]">Net benefit</span>
                  <span className="text-sm text-[#f6f2ea]">${netBenefit.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9c978f]">Eligible lots</span>
                  <span className="text-sm text-[#f6f2ea]">{eligibleCount}</span>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(208,163,92,0.16),rgba(255,255,255,0.02))] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.28)]">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-[#e4c998]">
                <Shield className="h-3.5 w-3.5" />
                Mode
              </div>
              <p
                className="mt-4 text-3xl text-[#f6f2ea]"
                style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
              >
                {shouldUseDemoMode ? 'Demo' : 'Live'}
              </p>
              <p className="mt-3 text-sm leading-6 text-[#b8b2a7]">
                {shouldUseDemoMode
                  ? 'Showing simulated opportunities for walkthrough and review.'
                  : 'Using the authenticated harvesting dataset for the active wallet scope.'}
              </p>
            </section>

            <section className="rounded-[30px] border border-white/8 bg-[#0b0b0c] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.28)]">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">
                <Activity className="h-3.5 w-3.5" />
                Last refresh
              </div>
              <p className="mt-4 text-lg text-[#f6f2ea]">{lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
              <p className="mt-2 text-sm leading-6 text-[#9c978f]">
                Refresh stays manual here to avoid noisy polling during execution review.
              </p>
            </section>
          </aside>
        </div>
      </div>

      {/* Footer Navigation */}
      <footer role="contentinfo">
        <HarvestProErrorBoundary
          component="footer"
          enableRecovery={false}
        >
          <FooterNav currentRoute="/harvestpro" />
        </HarvestProErrorBoundary>
      </footer>

      {/* Detail Modal */}
      <HarvestProErrorBoundary
        component="detail-modal"
        enableDemoMode={true}
        onEnterDemoMode={handleServiceDegradation}
      >
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
      </HarvestProErrorBoundary>

      {/* Success Screen */}
      {completedSession && showSuccessScreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <HarvestProErrorBoundary
            component="success-screen"
            enableRecovery={true}
          >
            <HarvestSuccessScreen
              session={completedSession}
              onDownloadCSV={handleDownloadCSV}
              onViewProof={handleViewProof}
              onClose={handleCloseSuccess}
            />
          </HarvestProErrorBoundary>
        </div>
      )}
    </div>
  );
}
