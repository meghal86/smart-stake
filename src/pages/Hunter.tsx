'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/hunter/Header';
import { OpportunityCard } from '@/components/hunter/OpportunityCard';
import { OpportunityGridSkeleton } from '@/components/hunter/OpportunityCardSkeleton';
import { EmptyState } from '@/components/hunter/EmptyState';
import { ExecuteQuestModal } from '@/components/hunter/ExecuteQuestModal';
import { CopilotPanel } from '@/components/hunter/CopilotPanel';
import { RightRail } from '@/components/hunter/RightRail';
import { FooterNav } from '@/components/layout/FooterNav';
import { useHunterFeed } from '@/hooks/useHunterFeed';
import { TabType } from '@/components/hunter/HunterTabs';

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
  const [isDemo, setIsDemo] = useState(true);
  const [copilotEnabled, setCopilotEnabled] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [showCopilotToast, setShowCopilotToast] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  // Show Copilot toast occasionally
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setShowCopilotToast(true);
        setTimeout(() => setShowCopilotToast(false), 4000);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);
  
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
    copilotEnabled,
    realTimeEnabled,
    sort: 'recommended', // Use ranking by default
  });

  const filteredOpportunities = opportunities.filter((opp: Opportunity) => {
    if (activeFilter === 'All') return true;
    
    // Map plural filter names to singular opportunity types
    const filterMap: Record<string, string> = {
      'Airdrops': 'Airdrop',
      'Quests': 'Quest',
      'Staking': 'Staking',
      'NFT': 'NFT'
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
      <Header
        isDemo={isDemo}
        setIsDemo={setIsDemo}
        copilotEnabled={copilotEnabled}
        setCopilotEnabled={setCopilotEnabled}
        lastUpdated={lastUpdated}
        onRefresh={refetch}
        isDarkTheme={isDarkTheme}
        setIsDarkTheme={setIsDarkTheme}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
      />

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
              {filteredOpportunities.map((opportunity, index) => (
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
      />
      
      <CopilotPanel
        isOpen={copilotEnabled}
        onClose={() => setCopilotEnabled(false)}
      />
      
      {/* Copilot Toast */}
      <AnimatePresence>
        {showCopilotToast && (
          <motion.div
            className="fixed top-20 right-4 bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-2xl z-40 max-w-sm"
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="p-2 bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] rounded-lg"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(0, 245, 160, 0.4)',
                    '0 0 30px rgba(123, 97, 255, 0.6)',
                    '0 0 20px rgba(0, 245, 160, 0.4)'
                  ]
                }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <span className="text-sm">🤖</span>
              </motion.div>
              <div>
                <p className="text-sm font-medium text-[#E4E8F3] mb-1">
                  Copilot found 2 new opportunities
                </p>
                <button 
                  onClick={() => setCopilotEnabled(true)}
                  className="text-xs text-[#00F5A0] hover:text-[#7B61FF] transition-colors"
                >
                  View Digest →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}