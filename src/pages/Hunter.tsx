'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Brain, Shield, Sparkles } from 'lucide-react';
import { GlobalHeader } from '@/components/header/GlobalHeader';
import { OpportunityCard } from '@/components/hunter/OpportunityCard';
import { OpportunityGridSkeleton } from '@/components/hunter/OpportunityCardSkeleton';
import { EmptyState } from '@/components/hunter/EmptyState';
import { ExecuteQuestModal } from '@/components/hunter/ExecuteQuestModal';
import { RightRail } from '@/components/hunter/RightRail';
import { FooterNav } from '@/components/layout/FooterNav';
import { useHunterFeed } from '@/hooks/useHunterFeed';
import { useWallet } from '@/contexts/WalletContext';
import { useDemoMode } from '@/lib/ux/DemoModeManager';
import { HunterTabs, TabType } from '@/components/hunter/HunterTabs';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator';
import { useTheme } from '@/contexts/ThemeContext';

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
  protocol?: string | { name: string; logo?: string };
  estimatedAPY?: number;
}

export default function Hunter() {
  const [activeFilter, setActiveFilter] = useState<TabType>('All');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const { actualTheme } = useTheme();
  const isDarkTheme = actualTheme === 'dark';

  // Wallet connection status
  const { connectedWallets, activeWallet } = useWallet();
  const isConnected = connectedWallets.length > 0 && !!activeWallet;

  // Use centralized demo mode management
  const { isDemo, setDemoMode } = useDemoMode();
  
  // Debug logging for manual testing
  useEffect(() => {
    console.log('🎭 Hunter Page State:', {
      isDemo,
      isConnected,
      activeWallet,
      connectedWalletsCount: connectedWallets.length,
      activeFilter,
      timestamp: new Date().toISOString()
    });
  }, [isDemo, isConnected, activeWallet, connectedWallets.length, activeFilter]);

  // Pull-to-refresh
  const handleRefresh = async () => {
    await refetch();
  };

  const { isPulling, isRefreshing, pullDistance, threshold } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    disabled: isModalOpen,
  });

  const { 
    opportunities, 
    isLoading, 
    lastUpdated, 
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useHunterFeed({
    filter: activeFilter,
    isDemo,
    copilotEnabled: false,
    realTimeEnabled,
    sort: 'recommended',
  });

  // Debug logging for filtering
  useEffect(() => {
    console.log('🔍 Hunter Filtering:', {
      totalOpportunities: opportunities.length,
      activeFilter,
      opportunityTypes: opportunities.map(o => o.type),
      firstOpportunity: opportunities[0]
    });
  }, [opportunities, activeFilter]);

  // Debug logging for render state
  useEffect(() => {
    console.log('🎨 Hunter Render State:', {
      isLoading,
      opportunityCount: opportunities.length,
      willShowEmptyState: !isLoading && opportunities.length === 0,
      willShowCards: !isLoading && opportunities.length > 0,
      willShowLoading: isLoading
    });
  }, [isLoading, opportunities.length]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!hasNextPage || isFetchingNextPage) return;
      
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight * 0.7; // 70% scroll
      
      if (scrollPosition >= threshold) {
        fetchNextPage();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleJoinQuest = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050505] text-[#f6f2ea]">
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        threshold={threshold}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(circle at top right, rgba(126,163,242,0.16), transparent 28%), radial-gradient(circle at bottom left, rgba(255,255,255,0.04), transparent 35%)',
            'radial-gradient(circle at top right, rgba(88,185,163,0.12), transparent 30%), radial-gradient(circle at bottom left, rgba(255,255,255,0.05), transparent 38%)',
            'radial-gradient(circle at top right, rgba(126,163,242,0.16), transparent 28%), radial-gradient(circle at bottom left, rgba(255,255,255,0.04), transparent 35%)'
          ]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: [0.25, 1, 0.5, 1]
        }}
      />
      <GlobalHeader className="border-white/8 bg-[#050505]/94" />

      {/* Demo Mode Banner */}
      {isDemo && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed left-4 right-4 top-20 z-40 rounded-2xl border border-[#7ea3f2]/30 bg-[#7ea3f2]/18 py-2 px-4 text-center text-sm font-medium text-[#f6f2ea] shadow-lg lg:left-8 lg:right-8"
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span>Demo Mode — Showing simulated opportunities</span>
          </div>
        </motion.div>
      )}

      <div className="relative mx-auto max-w-[1600px] px-4 pb-28 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#a7c0ff]">
              <Sparkles className="h-3.5 w-3.5" />
              Hunter
            </div>
            <h1 className="text-3xl tracking-tight text-[#f6f2ea] sm:text-4xl">Find the next wallet-ready move.</h1>
            <p className="mt-2 max-w-3xl text-sm text-[#9c978f] sm:text-base">
              Review filtered opportunities, guardian-aware trust, and saved picks from one cleaner surface.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <main className="min-w-0">
            <div className="mb-6">
              <HunterTabs
                activeTab={activeFilter}
                onTabChange={setActiveFilter}
                isDarkTheme={isDarkTheme}
              />
            </div>

            <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <OpportunityGridSkeleton 
                  count={3} 
                  isDarkTheme={isDarkTheme}
                />
              </motion.div>
            ) : opportunities.length === 0 ? (
              <EmptyState filter={activeFilter} />
            ) : (
              <motion.div
                key="opportunities"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-6"
              >
                {opportunities.map((opportunity: Opportunity, index: number) => (
                <motion.div
                  key={opportunity.id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                >
                  <OpportunityCard
                    opportunity={opportunity}
                    index={index}
                    onJoinQuest={handleJoinQuest}
                    isDarkTheme={isDarkTheme}
                    isConnected={isConnected}
                  />
                </motion.div>
              ))}
              
              {/* Infinite scroll loading indicator */}
                {isFetchingNextPage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-8 text-center"
                  >
                    <div className="inline-flex items-center gap-2 text-sm text-[#9c978f]">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-[#7ea3f2]" />
                      Loading more opportunities...
                    </div>
                  </motion.div>
                )}
              
              {/* End of results indicator */}
                {!hasNextPage && opportunities.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-8 text-center text-sm text-[#8f8a82]"
                  >
                    You've reached the end of the feed
                  </motion.div>
                )}
              
              {/* AI Digestion Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center py-8"
                >
                  <motion.button
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 font-medium text-[#f6f2ea] transition-all duration-300 hover:bg-white/[0.08]"
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      console.log('AI Digestion clicked');
                    }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <Brain className="h-5 w-5 text-[#a7c0ff]" />
                    </motion.div>
                    <span>Ask Hunter AI</span>
                    <div className="rounded-full bg-[#7ea3f2]/18 px-2 py-1 text-xs font-bold text-[#d8e4ff]">
                      Beta
                    </div>
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
            </AnimatePresence>
          </main>

          <div className="space-y-6">
            <section className="rounded-[30px] border border-white/8 bg-[#0b0b0c] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.28)] xl:hidden">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">Feed read</p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between border-b border-white/8 pb-4">
                  <span className="text-sm text-[#9c978f]">Current filter</span>
                  <span className="text-sm text-[#f6f2ea]">{activeFilter}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/8 pb-4">
                  <span className="text-sm text-[#9c978f]">Opportunity count</span>
                  <span className="text-sm text-[#f6f2ea]">{opportunities.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9c978f]">Mode</span>
                  <span className="text-sm text-[#f6f2ea]">{isDemo ? 'Demo' : 'Live'}</span>
                </div>
              </div>
            </section>

            <RightRail />

            <section className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(126,163,242,0.16),rgba(255,255,255,0.02))] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.28)]">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-[#b7c8f0]">
                <Shield className="h-3.5 w-3.5" />
                Mode
              </div>
              <p
                className="mt-4 text-3xl text-[#f6f2ea]"
                style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
              >
                {isDemo ? 'Demo' : 'Live'}
              </p>
              <p className="mt-3 text-sm leading-6 text-[#b8b2a7]">
                {isDemo
                  ? 'Showing simulated opportunities for walkthrough and discovery.'
                  : 'Using the authenticated wallet-aware feed and saved state.'}
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-[#9c978f]">
                <Activity className="h-4 w-4" />
                Updated {lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'just now'}
              </div>
            </section>
          </div>
        </div>
      </div>

      <FooterNav currentRoute="/hunter" />

      <ExecuteQuestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        opportunity={selectedOpportunity}
        isConnected={isConnected}
      />
    </div>
  );
}
