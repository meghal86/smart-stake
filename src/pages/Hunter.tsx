'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/hunter/Header';
import { OpportunityCard } from '@/components/hunter/OpportunityCard';
import { EmptyState } from '@/components/hunter/EmptyState';
import { ExecuteQuestModal } from '@/components/hunter/ExecuteQuestModal';
import { CopilotPanel } from '@/components/hunter/CopilotPanel';
import { FooterNav } from '@/components/layout/FooterNav';
import { useHunterFeed } from '@/hooks/useHunterFeed';

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

const filterOptions = ['All', 'Staking', 'NFT', 'Airdrops', 'Quests'];

export default function Hunter() {
  const [activeFilter, setActiveFilter] = useState('All');
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
  
  const { opportunities, isLoading, lastUpdated, refetch } = useHunterFeed({
    filter: activeFilter,
    isDemo,
    copilotEnabled,
    realTimeEnabled
  });

  const filteredOpportunities = opportunities.filter(opp => 
    activeFilter === 'All' || opp.type === activeFilter
  );

  const handleJoinQuest = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setIsModalOpen(true);
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${
      isDarkTheme 
        ? 'bg-gradient-to-br from-[#0A0E1A] to-[#111827]' 
        : 'bg-gradient-to-b from-[#FFFFFF] to-[#F9FAFB] text-[#1B1F29]'
    }`}>
      {/* Whale Pulse Background Animation */}
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
            'radial-gradient(circle at 30% 40%, rgba(0,245,160,0.03) 0%, transparent 50%)',
            'radial-gradient(circle at 70% 60%, rgba(123,97,255,0.02) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 30%, rgba(0,245,160,0.02) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 70%, rgba(123,97,255,0.03) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 40%, rgba(0,245,160,0.03) 0%, transparent 50%)'
          ]
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      {/* Background Texture */}
      <div className={`absolute inset-0 pointer-events-none ${
        isDarkTheme 
          ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(0,245,160,0.03),transparent_50%)]'
          : 'bg-[radial-gradient(circle_at_50%_50%,rgba(0,245,160,0.01),transparent_50%)]'
      }`}></div>
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

      <main className="px-4 pt-32 pb-28 max-w-2xl mx-auto">
        {/* Content */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3 flex-1">
                      <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-700 rounded w-16"></div>
                        <div className="h-6 bg-gray-700 rounded w-20"></div>
                      </div>
                    </div>
                    <div className="h-10 bg-gray-700 rounded-lg w-24"></div>
                  </div>
                </div>
              ))}
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
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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