/**
 * RightRail Component
 * 
 * Desktop-only sidebar showing PersonalPicks, SavedItems, and SeasonProgress.
 * Hidden on mobile/tablet (<1280px).
 * 
 * Requirements:
 * - 7.5: Right rail for desktop (≥1280px) with Personal picks, Saved items, Season progress
 * 
 * @module components/hunter/RightRail
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useSavedOpportunities } from '@/hooks/useSavedOpportunities';
import { useAuth } from '@/hooks/useAuth';
import { Bookmark, TrendingUp, Trophy, ExternalLink, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RightRailProps {
  className?: string;
}

/**
 * RightRail component for desktop layout
 * Shows PersonalPicks, SavedItems, and SeasonProgress
 * Memoized for performance (Requirement 1.1-1.6)
 */
export const RightRail = React.memo(function RightRail({ className }: RightRailProps) {
  const { isAuthenticated } = useAuth();
  const { savedOpportunities, isLoading } = useSavedOpportunities();

  return (
    <aside
      className={cn(
        // Hidden on mobile/tablet, visible on desktop (≥1280px)
        'hidden xl:block',
        'w-80 flex-shrink-0',
        'space-y-6',
        className
      )}
      aria-label="Right sidebar"
    >
      {/* Personal Picks Module */}
      <PersonalPicks />

      {/* Saved Items Module */}
      {isAuthenticated && (
        <SavedItems 
          savedOpportunities={savedOpportunities} 
          isLoading={isLoading}
        />
      )}

      {/* Season Progress Module */}
      <SeasonProgress />
    </aside>
  );
});

/**
 * PersonalPicks Module - "My Alpha Picks"
 * Cinematic horizontal carousel with chain-branded glows
 */
function PersonalPicks() {
  const [scrollIndex, setScrollIndex] = React.useState(0);

  const personalPicks = [
    {
      id: '1',
      title: 'Base Airdrop Season 2',
      protocol: 'Base',
      reward: '$500-2,000',
      apy: '45%',
      trustScore: 95,
      type: 'airdrop' as const,
      chainColor: '#3B82F6', // Base blue
      isLive: true,
    },
    {
      id: '2',
      title: 'Arbitrum Odyssey',
      protocol: 'Arbitrum',
      reward: '$200-800',
      apy: '32%',
      trustScore: 92,
      type: 'quest' as const,
      chainColor: '#7C3AED', // Arbitrum violet
      isLive: true,
    },
    {
      id: '3',
      title: 'Optimism Quests',
      protocol: 'Optimism',
      reward: '$100-500',
      apy: '28%',
      trustScore: 88,
      type: 'quest' as const,
      chainColor: '#EF4444', // Optimism red
      isLive: false,
    },
  ];

  // Auto-scroll every 6s
  React.useEffect(() => {
    const interval = setInterval(() => {
      setScrollIndex((prev) => (prev + 1) % personalPicks.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [personalPicks.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative bg-gradient-to-br from-slate-900/80 via-blue-950/40 to-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-teal-400/20 overflow-hidden"
      style={{
        boxShadow: '0 20px 60px -12px rgba(0,0,0,0.6), 0 8px 32px -8px rgba(20,184,166,0.1)'
      }}
    >
      {/* Gradient Header */}
      <div className="flex items-center gap-2 mb-5">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-5 h-5 text-amber-400" />
        </motion.div>
        <h3 
          className="text-lg font-bold bg-gradient-to-r from-amber-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent"
          style={{ letterSpacing: '-0.02em' }}
        >
          🔥 Personal Picks This Season
        </h3>
      </div>

      {/* Horizontal Carousel */}
      <div className="relative overflow-hidden">
        <motion.div
          className="flex gap-4"
          animate={{ x: -scrollIndex * 280 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {personalPicks.map((pick, index) => (
            <motion.div
              key={pick.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="group cursor-pointer flex-shrink-0 w-64"
              whileHover={{ 
                y: -4,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
            >
              {/* Floating Glass Card with Chain Glow */}
              <div 
                className="relative p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-2xl border transition-all duration-500"
                style={{
                  borderColor: `${pick.chainColor}40`,
                  boxShadow: `0 8px 32px -8px ${pick.chainColor}20, 0 4px 16px -4px rgba(0,0,0,0.4)`
                }}
              >
                {/* Chain Glow Aura */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                  style={{ background: `radial-gradient(circle at center, ${pick.chainColor}30, transparent 70%)` }}
                />

                {/* LIVE Badge */}
                {pick.isLive && (
                  <motion.div
                    className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 border border-red-400/30"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-xs font-bold text-red-300">LIVE 🔥</span>
                  </motion.div>
                )}

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white mb-1 group-hover:text-teal-300 transition-colors">
                        {pick.title}
                      </h4>
                      <p className="text-xs text-gray-400">{pick.protocol}</p>
                    </div>
                  </div>

                  {/* APY & Reward */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Est. Reward</p>
                      <p 
                        className="text-base font-bold font-mono"
                        style={{ color: pick.chainColor, letterSpacing: '-0.03em' }}
                      >
                        {pick.reward}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">APY</p>
                      <p className="text-base font-bold text-amber-400">{pick.apy}</p>
                    </div>
                  </div>

                  {/* Guardian Trust with Halo Pulse */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 capitalize">{pick.type}</span>
                    <motion.div 
                      className="relative flex items-center gap-1.5 px-2 py-1 rounded-full bg-teal-500/10 border border-teal-400/30"
                      whileHover={{ scale: 1.05 }}
                    >
                      {/* Guardian Halo */}
                      <motion.div
                        className="absolute inset-0 rounded-full bg-teal-400/20"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <div className="w-2 h-2 rounded-full bg-teal-400 shadow-lg shadow-teal-400/50" />
                      <span className="text-xs font-bold text-teal-300">{pick.trustScore}</span>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Carousel Indicators */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {personalPicks.map((_, index) => (
          <button
            key={index}
            onClick={() => setScrollIndex(index)}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              scrollIndex === index ? 'w-8 bg-teal-400' : 'w-1.5 bg-gray-600'
            )}
            aria-label={`Go to pick ${index + 1}`}
          />
        ))}
      </div>

      <button className="w-full mt-4 py-2 text-sm font-medium text-gray-400 hover:text-teal-400 transition-colors">
        View all picks →
      </button>
    </motion.div>
  );
}

/**
 * SavedItems Module
 * Shows user's saved opportunities
 */
interface SavedItemsProps {
  savedOpportunities: any[];
  isLoading: boolean;
}

function SavedItems({ savedOpportunities, isLoading }: SavedItemsProps) {
  const displayItems = savedOpportunities.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-[#7B61FF]" />
          <h3 className="text-lg font-semibold text-white">Saved Items</h3>
        </div>
        <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">
          {savedOpportunities.length}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-3 rounded-xl bg-white/5 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-8">
          <Bookmark className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-1">No saved items yet</p>
          <p className="text-xs text-gray-500">
            Save opportunities to access them later
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-[#7B61FF]/20">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate group-hover:text-[#7B61FF] transition-colors">
                      {item.opportunity?.title || 'Untitled'}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.opportunity?.protocol_name || 'Unknown'}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#7B61FF] transition-colors flex-shrink-0" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 capitalize">
                    {item.opportunity?.type || 'opportunity'}
                  </span>
                  {item.opportunity?.trust_score && (
                    <div className="flex items-center gap-1">
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        item.opportunity.trust_level === 'green' ? 'bg-green-500' :
                        item.opportunity.trust_level === 'amber' ? 'bg-amber-500' :
                        'bg-red-500'
                      )} />
                      <span className="text-xs text-gray-400">
                        {item.opportunity.trust_score}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {savedOpportunities.length > 5 && (
        <button className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-[#7B61FF] transition-colors">
          View all saved ({savedOpportunities.length}) →
        </button>
      )}
    </motion.div>
  );
}

/**
 * SeasonProgress Module - "Your Alpha Journey"
 * Animated circular ring with metallic achievement badges
 */
function SeasonProgress() {
  const [animatedRank, setAnimatedRank] = React.useState(0);
  const [animatedPoints, setAnimatedPoints] = React.useState(0);

  const seasonData = {
    currentSeason: 'Season 2',
    progress: 65,
    rank: 1247,
    totalUsers: 15000,
    pointsEarned: 3250,
    nextMilestone: 5000,
    daysLeft: 12,
  };

  const milestones = [
    { 
      points: 1000, 
      reward: 'Bronze Badge', 
      completed: true,
      color: '#CD7F32',
      icon: '🥉',
      tooltip: '+150 pts earned'
    },
    { 
      points: 2500, 
      reward: 'Silver Badge', 
      completed: true,
      color: '#C0C0C0',
      icon: '🥈',
      tooltip: '+250 pts earned'
    },
    { 
      points: 5000, 
      reward: 'Gold Badge', 
      completed: false,
      color: '#FFD700',
      icon: '🥇',
      tooltip: '+250 pts to unlock'
    },
    { 
      points: 10000, 
      reward: 'Platinum Badge', 
      completed: false,
      color: '#E5E4E2',
      icon: '💎',
      tooltip: '+5,250 pts to unlock'
    },
  ];

  // Animate rank counter on mount
  React.useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = seasonData.rank / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= seasonData.rank) {
        setAnimatedRank(seasonData.rank);
        clearInterval(timer);
      } else {
        setAnimatedRank(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [seasonData.rank]);

  // Animate points counter
  React.useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = seasonData.pointsEarned / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= seasonData.pointsEarned) {
        setAnimatedPoints(seasonData.pointsEarned);
        clearInterval(timer);
      } else {
        setAnimatedPoints(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [seasonData.pointsEarned]);

  // Circular progress calculation
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (seasonData.progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative bg-gradient-to-br from-violet-950/40 via-slate-900/80 to-teal-950/40 backdrop-blur-xl rounded-3xl p-6 border border-violet-400/20 overflow-hidden"
      style={{
        boxShadow: '0 20px 60px -12px rgba(0,0,0,0.6), 0 8px 32px -8px rgba(124,58,237,0.1)'
      }}
    >
      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-amber-400/30 rounded-full"
            animate={{
              y: [0, -60, 0],
              x: [0, Math.sin(i) * 20, 0],
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3
            }}
            style={{
              left: `${15 + i * 12}%`,
              top: `${30 + (i % 2) * 40}%`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-2 mb-6">
        <motion.div
          animate={{ 
            rotateY: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotateY: { duration: 3, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity }
          }}
        >
          <Trophy className="w-6 h-6 text-amber-400" />
        </motion.div>
        <h3 className="text-lg font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
          Your Alpha Journey
        </h3>
      </div>

      {/* Circular Progress Ring */}
      <div className="relative flex items-center justify-center mb-6">
        <svg className="w-32 h-32 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <motion.circle
            cx="64"
            cy="64"
            r="45"
            stroke="url(#progressGradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              strokeDasharray: circumference,
              filter: 'drop-shadow(0 0 8px rgba(124,58,237,0.5))'
            }}
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7B61FF" />
              <stop offset="50%" stopColor="#14B8A6" />
              <stop offset="100%" stopColor="#00F5A0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Icon with Pulse */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="relative">
            <div className="text-4xl">🐋</div>
            {/* Guardian Shield Pulse */}
            <motion.div
              className="absolute inset-0 rounded-full bg-teal-400/20"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* Progress Percentage */}
        <div className="absolute bottom-2 text-center">
          <motion.p 
            className="text-2xl font-bold text-teal-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {seasonData.progress}%
          </motion.p>
        </div>
      </div>

      {/* Rank Counter with Easing */}
      <div className="relative z-10 text-center mb-6">
        <p className="text-xs text-gray-400 mb-1">Your Rank</p>
        <motion.p 
          className="text-3xl font-bold text-white mb-1"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          #{animatedRank.toLocaleString()}
        </motion.p>
        <p className="text-xs text-gray-500">
          of {seasonData.totalUsers.toLocaleString()} hunters
        </p>
      </div>

      {/* Points Display */}
      <div className="relative z-10 flex items-center justify-between p-4 bg-gradient-to-r from-teal-500/10 to-violet-500/10 rounded-2xl mb-6 border border-teal-400/20">
        <div>
          <p className="text-xs text-gray-400 mb-1">Alpha Points</p>
          <motion.p 
            className="text-2xl font-bold text-teal-400"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {animatedPoints.toLocaleString()}
          </motion.p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 mb-1">Next Milestone</p>
          <p className="text-lg font-bold text-amber-400">
            {(seasonData.nextMilestone - seasonData.pointsEarned).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Metallic Achievement Badges in Arc */}
      <div className="relative z-10 mb-6">
        <p className="text-xs text-gray-400 mb-3">Achievement Badges</p>
        <div className="flex items-center justify-between">
          {milestones.map((milestone, index) => (
            <motion.div
              key={index}
              className="group relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileHover={{ scale: 1.15, y: -4 }}
            >
              {/* Badge */}
              <div
                className={cn(
                  'relative w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-300',
                  milestone.completed 
                    ? 'bg-gradient-to-br shadow-lg' 
                    : 'bg-slate-800/50 grayscale opacity-40'
                )}
                style={milestone.completed ? {
                  backgroundImage: `linear-gradient(135deg, ${milestone.color}40, ${milestone.color}20)`,
                  boxShadow: `0 4px 16px ${milestone.color}40`,
                  border: `2px solid ${milestone.color}60`
                } : {}}
              >
                {milestone.icon}
                
                {/* Shimmer Effect for Unlocked */}
                {milestone.completed && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${milestone.color}40, transparent)`
                    }}
                    animate={{ x: [-100, 100] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                )}
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap border border-white/10">
                  {milestone.reward}
                  <div className="text-teal-400 text-xs mt-1">{milestone.tooltip}</div>
                </div>
              </div>

              {/* Badge Label */}
              <p className="text-xs text-gray-500 text-center mt-2">
                {milestone.points >= 1000 ? `${milestone.points / 1000}k` : milestone.points}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Season Timer */}
      <motion.div 
        className="relative z-10 flex items-center justify-between p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-400/20"
        animate={{ 
          boxShadow: [
            '0 0 20px rgba(251,191,36,0.1)',
            '0 0 30px rgba(251,191,36,0.2)',
            '0 0 20px rgba(251,191,36,0.1)'
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-xs text-gray-300">Season ends in</span>
        <div className="flex items-center gap-2">
          <motion.span 
            className="text-lg font-bold text-amber-400"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {seasonData.daysLeft}
          </motion.span>
          <span className="text-xs text-amber-400">days</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
