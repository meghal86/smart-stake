import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHunterFeed } from '@/hooks/useHunterFeed';
import { useHunterXP } from '@/hooks/useHunterXP';
import { useHunterAlerts } from '@/hooks/useHunterAlerts';
import type { Quest, ActionSummary } from '@/types/hunter';
import { Hub2Footer } from '@/components/hub2/Hub2Footer';

// Premium Hunter Components
import HunterPremiumHeader from '@/components/hunter/HunterPremiumHeader';
import HunterAIDigest from '@/components/hunter/HunterAIDigest';
import HunterFilterChips, { FilterOption } from '@/components/hunter/HunterFilterChips';
import HunterOpportunityCard from '@/components/hunter/HunterOpportunityCard';
import HunterAIExplainability from '@/components/hunter/HunterAIExplainability';
import HunterAchievementsModal from '@/components/hunter/HunterAchievementsModal';
import HunterLaunchAnimation, { triggerConfetti, triggerLevelUpConfetti } from '@/components/hunter/HunterLaunchAnimation';

// UI Components
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ArrowRight, RefreshCw, Sparkles } from 'lucide-react';

// Styles
import '@/styles/hunter-premium.css';

export default function Hunter() {
  // State
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [actionSummary, setActionSummary] = useState<ActionSummary | null>(null);
  const [isActionModalOpen, setActionModalOpen] = useState(false);
  const [isExecuting, setExecuting] = useState(false);
  const [isExplainabilityOpen, setExplainabilityOpen] = useState(false);
  const [isAchievementsOpen, setAchievementsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showLaunchAnimation, setShowLaunchAnimation] = useState(true);
  const [isPullToRefresh, setIsPullToRefresh] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);

  // Hooks
  const { data: quests = [], isLoading, refetch } = useHunterFeed();
  const { xpData, addXP } = useHunterXP();
  const { createAlert } = useHunterAlerts();

  // Filter definitions
  const filterOptions: FilterOption[] = [
    { id: 'all', label: 'All', icon: '🎯', count: quests.length },
    { id: 'staking', label: 'Staking', icon: '💎', count: quests.filter(q => q.category === 'Staking').length },
    { id: 'nft', label: 'NFT', icon: '🖼️', count: quests.filter(q => q.category === 'NFT').length },
    { id: 'airdrop', label: 'Airdrops', icon: '🪂', count: quests.filter(q => q.category === 'Airdrop').length },
    { id: 'quest', label: 'Quests', icon: '⚡', count: quests.filter(q => q.category === 'Quest').length }
  ];

  // Filter quests
  const filteredQuests = quests.filter(quest => {
    // Filter by category
    if (selectedFilter !== 'all' && quest.category.toLowerCase() !== selectedFilter) {
      return false;
    }
    
    // Filter by search
    if (searchQuery && !quest.protocol.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Calculate AI Digest metrics
  const topOpportunitiesCount = quests.filter(q => q.guardianScore >= 90).length;
  const averageRiskScore = quests.length > 0
    ? quests.reduce((sum, q) => sum + q.guardianScore, 0) / quests.length
    : 0;
  const riskLevel: 'low' | 'medium' | 'high' = averageRiskScore >= 80 ? 'low' : averageRiskScore >= 60 ? 'medium' : 'high';
  const weeklyGoalProgress = Math.min((xpData.weeklyXP / 100) * 100, 100);

  // Handlers
  const handleGetQuest = async (quest: Quest) => {
    setSelectedQuest(quest);
    
    const summary: ActionSummary = {
      questId: quest.id,
      steps: [
        `Connect to ${quest.network} network`,
        'Review quest requirements',
        'Execute quest actions',
        'Claim rewards'
      ],
      fees: Math.round((quest.rewardUSD * 0.02) * 100) / 100,
      guardianVerified: quest.guardianScore >= 90,
      estimatedTime: quest.estimatedTime
    };
    
    setActionSummary(summary);
    setActionModalOpen(true);
  };

  const handleExecuteQuest = async () => {
    if (!selectedQuest) return;
    
    setExecuting(true);
    
    // Simulate quest execution
    setTimeout(async () => {
      // Add XP
      const xpReward = 25;
      const result = await addXP(xpReward, 'quest_completed');
      
      // Create alert
      await createAlert(
        'reward_ready',
        'Quest Completed! 🎉',
        `You earned ${xpReward} XP from ${selectedQuest.protocol}`,
        {
          questId: selectedQuest.id,
          priority: 'high',
          actionLabel: 'View Rewards',
          actionUrl: '/hunter'
        }
      );
      
      // Trigger confetti
      if (result?.leveledUp) {
        triggerLevelUpConfetti();
        setAchievementsOpen(true);
      } else {
        triggerConfetti();
      }
      
      setExecuting(false);
      setActionModalOpen(false);
      setSelectedQuest(null);
      setActionSummary(null);
    }, 2000);
  };

  const handleExplainability = (quest: Quest) => {
    setSelectedQuest(quest);
    setExplainabilityOpen(true);
  };

  const handleToggleFavorite = (questId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(questId)) {
        newFavorites.delete(questId);
      } else {
        newFavorites.add(questId);
      }
      return newFavorites;
    });
  };

  const handleRefresh = async () => {
    setIsPullToRefresh(true);
    await refetch();
    setTimeout(() => setIsPullToRefresh(false), 500);
  };

  // Pull to refresh (mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY > 0) {
      const distance = e.touches[0].clientY - pullStartY;
      if (distance > 0 && distance < 100) {
        setPullDistance(distance);
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      handleRefresh();
    }
    setPullStartY(0);
    setPullDistance(0);
  };

  return (
    <>
      {/* Launch Animation */}
      {showLaunchAnimation && (
        <HunterLaunchAnimation onComplete={() => setShowLaunchAnimation(false)} />
      )}

      {/* Main Container */}
      <div
        className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 hunter-smooth-scroll"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull to Refresh Indicator */}
        <AnimatePresence>
          {pullDistance > 0 && (
            <motion.div
              className="hunter-pull-to-refresh"
              initial={{ y: -60 }}
              animate={{ y: 0 }}
              exit={{ y: -60 }}
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${pullDistance > 60 ? 'animate-spin' : ''}`} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium Header */}
        <HunterPremiumHeader
          onSearch={setSearchQuery}
          onMenuClick={() => setAchievementsOpen(true)}
        />

        {/* Main Content */}
        <main className="container mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8">
          {/* AI Digest */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6"
          >
            <HunterAIDigest
              topOpportunitiesCount={topOpportunitiesCount}
              riskLevel={riskLevel}
              weeklyGoalProgress={weeklyGoalProgress}
            />
          </motion.div>

          {/* Filter Chips */}
          <HunterFilterChips
            filters={filterOptions}
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            className="mb-6"
          />

          {/* Opportunities Grid */}
          {isLoading || isPullToRefresh ? (
            <div className="hunter-grid">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-96 rounded-2xl hunter-skeleton"
                />
              ))}
            </div>
          ) : filteredQuests.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-20 h-20 rounded-2xl bg-slate-800/30 flex items-center justify-center mb-4">
                <Sparkles className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-300 mb-2">
                No opportunities found
              </h3>
              <p className="text-sm text-slate-500 text-center max-w-md">
                {searchQuery
                  ? `No results for "${searchQuery}". Try a different search.`
                  : 'Check back soon for new opportunities.'}
              </p>
              {searchQuery && (
                <Button
                  onClick={() => setSearchQuery('')}
                  className="mt-4"
                  variant="outline"
                >
                  Clear search
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              className="hunter-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {filteredQuests.map((quest, index) => (
                <motion.div
                  key={quest.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <HunterOpportunityCard
                    quest={quest}
                    onClaim={handleGetQuest}
                    onExplainability={handleExplainability}
                    isFavorite={favorites.has(quest.id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Load More (if needed) */}
          {filteredQuests.length > 0 && filteredQuests.length % 6 === 0 && (
            <motion.div
              className="mt-8 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Button
                variant="outline"
                className="hunter-glass-button"
                onClick={handleRefresh}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Load More Opportunities
              </Button>
            </motion.div>
          )}
        </main>

        {/* Action Modal */}
        <Dialog open={isActionModalOpen} onOpenChange={setActionModalOpen}>
          <DialogContent className="max-w-md hunter-glass-card border-slate-700/50">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-100">
                Execute Quest
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-400">
                Review and confirm quest execution
              </DialogDescription>
            </DialogHeader>

            {actionSummary && selectedQuest && (
              <div className="space-y-4">
                {/* Quest Info */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-700/50">
                  <h4 className="font-semibold text-slate-200 mb-2">
                    {selectedQuest.protocol}
                  </h4>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Reward</span>
                    <span className="font-bold text-emerald-400">
                      ${selectedQuest.rewardUSD.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Execution Steps */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">
                    Execution Steps:
                  </h4>
                  <div className="space-y-2">
                    {actionSummary.steps.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/40 border border-slate-700/50"
                      >
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-sm text-slate-300">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fees & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-700/50">
                    <div className="text-xs text-slate-400 mb-1">Est. Fees</div>
                    <div className="text-sm font-bold text-slate-200">
                      ${actionSummary.fees}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-700/50">
                    <div className="text-xs text-slate-400 mb-1">Time</div>
                    <div className="text-sm font-bold text-slate-200">
                      {actionSummary.estimatedTime}
                    </div>
                  </div>
                </div>

                {/* Execute Button */}
                <Button
                  onClick={handleExecuteQuest}
                  disabled={isExecuting}
                  className="w-full h-12 hunter-gradient-emerald hover:opacity-90 transition-opacity"
                >
                  {isExecuting ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Executing Quest...
                    </>
                  ) : (
                    <>
                      Execute Quest
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* AI Explainability Modal */}
        <HunterAIExplainability
          quest={selectedQuest}
          isOpen={isExplainabilityOpen}
          onClose={() => {
            setExplainabilityOpen(false);
            setSelectedQuest(null);
          }}
        />

        {/* Achievements Modal */}
        <HunterAchievementsModal
          isOpen={isAchievementsOpen}
          onClose={() => setAchievementsOpen(false)}
        />

        {/* Hub2 Footer - Same footer across all pages */}
        <Hub2Footer />
      </div>
    </>
  );
}
