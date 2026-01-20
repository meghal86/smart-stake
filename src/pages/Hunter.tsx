'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
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
import { TabType } from '@/components/hunter/HunterTabs';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator';

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
}

export default function Hunter() {
  const [activeFilter, setActiveFilter] = useState<TabType>('All');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);

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

  const filteredOpportunities = opportunities.filter((opp: Opportunity) => {
    if (activeFilter === 'All') return true;
    
    // Map plural filter names to singular opportunity types
    const filterMap: Record<string, string> = {
      'Airdrops': 'Airdrop',
      'Quests': 'Quest',
      'Staking': 'Staking',
      'NFT': 'NFT',
      'Points': 'Points'
    };
    
    const mappedFilter = filterMap[activeFilter] || activeFilter;
    return opp.type === mappedFilter;
  });

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
    <div className={`min-h-screen relative overflow-hidden transition-all duration-700 ${
      isDarkTheme 
        ? 'bg-gradient-to-br from-[#0A0E1A] to-[#111827]' 
        : 'bg-gradient-to-b from-[#F8FAFC] via-[#FFFFFF] to-[#F8FAFC]'
    }`}>
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        threshold={threshold}
      />
      {/* Serene Light Theme Background - Top Glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: isDarkTheme ? [
            'radial-gradient(circle at 30% 40%, rgba(0,245,160,0.08) 0%, transparent 50%)',
            'radial-gradient(circle at 70% 60%, rgba(123,97,255,0.06) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 30%, rgba(0,245,160,0.04) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 70%, rgba(123,97,255,0.08) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 40%, rgba(0,245,160,0.08) 0%, transparent 50%)'
          ] : [
            'radial-gradient(ellipse at 50% 0%, rgba(224,242,254,0.4) 0%, transparent 70%)',
            'radial-gradient(ellipse at 30% 20%, rgba(251,191,36,0.08) 0%, transparent 60%)',
            'radial-gradient(ellipse at 70% 30%, rgba(20,184,166,0.06) 0%, transparent 65%)',
            'radial-gradient(ellipse at 50% 0%, rgba(224,242,254,0.35) 0%, transparent 70%)',
            'radial-gradient(ellipse at 50% 0%, rgba(224,242,254,0.4) 0%, transparent 70%)'
          ]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: [0.25, 1, 0.5, 1]
        }}
      />
      {/* Subtle Ambient Particles */}
      {!isDarkTheme && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: i % 2 === 0 ? 'rgba(251,191,36,0.15)' : 'rgba(20,184,166,0.12)',
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
      )}
      <GlobalHeader />

      {/* Demo Mode Banner */}
      {isDemo && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-16 left-0 right-0 z-40 bg-blue-600 text-white py-2 px-4 text-center text-sm font-medium shadow-lg"
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span>Demo Mode — Showing simulated opportunities</span>
          </div>
        </motion.div>
      )}

      {/* Main Content with RightRail - Three-Column "Alpha Sidecar" Layout */}
      <div className="flex flex-1 w-full max-w-7xl mx-auto gap-6 px-4 md:px-6 pt-32 pb-28">
        {/* Main Feed - Center Column */}
        <main className="flex-1 min-w-0">
          {/* Content */}
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
          ) : filteredOpportunities.length === 0 ? (
            <EmptyState filter={activeFilter} />
          ) : (
            <motion.div
              key="opportunities"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-6"
            >
              {filteredOpportunities.map((opportunity: Opportunity, index: number) => (
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
                  <div className={`inline-flex items-center gap-2 text-sm ${
                    isDarkTheme ? 'text-gray-400' : 'text-[#475569]'
                  }`}>
                    <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
                      isDarkTheme ? 'border-[#00F5A0]' : 'border-[#14B8A6]'
                    }`} />
                    Loading more opportunities...
                  </div>
                </motion.div>
              )}
              
              {/* End of results indicator */}
              {!hasNextPage && filteredOpportunities.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`py-8 text-center text-sm ${
                    isDarkTheme ? 'text-gray-500' : 'text-[#64748B]'
                  }`}
                >
                  You've reached the end of the feed
                </motion.div>
              )}
              
              {/* AI Digestion Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-8 flex justify-center"
              >
                <motion.button
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-medium transition-all duration-300 ${
                    isDarkTheme 
                      ? 'bg-gradient-to-r from-[#00F5A0]/20 to-[#7B61FF]/20 border border-[#00F5A0]/30 text-white hover:from-[#00F5A0]/30 hover:to-[#7B61FF]/30' 
                      : 'bg-gradient-to-r from-[#14B8A6]/20 to-[#7B61FF]/20 border border-[#14B8A6]/30 text-[#1E293B] hover:from-[#14B8A6]/30 hover:to-[#7B61FF]/30'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Handle AI digestion action
                    console.log('AI Digestion clicked');
                  }}
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  <span>AI Digestion</span>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                    isDarkTheme ? 'bg-[#00F5A0]/20 text-[#00F5A0]' : 'bg-[#14B8A6]/20 text-[#14B8A6]'
                  }`}>
                    Beta
                  </div>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Right Rail - "Alpha Sidecar" with Rewards & Progress */}
      <RightRail />
    </div>

      <FooterNav />

      <ExecuteQuestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        opportunity={selectedOpportunity}
        isConnected={isConnected}
      />
    </div>
  );
}