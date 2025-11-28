'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Users, TrendingUp, Flame } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'

interface FOMOLeaderboardProps {
  isLoggedIn?: boolean
  userStreak?: number
  userRank?: number
}

export default function FOMOLeaderboard({ isLoggedIn = false, userStreak = 0, userRank }: FOMOLeaderboardProps) {
  const { track } = useAnalytics()

  const handleClick = () => {
    track('card_click', { card: 'fomo_leaderboard', action: 'view_leaderboard' })
  }

  const handleJoinClick = () => {
    track('cta_click', { label: 'Join Competition' })
  }

  return (
    <Card 
      className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 cursor-pointer hover:shadow-md transition-all duration-200"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-yellow-600 animate-bounce" />
            <div>
              <div className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                {isLoggedIn ? 'Your Progress' : "Today's Top Copilot User"}
              </div>
              <div className="text-sm text-meta">
                {isLoggedIn ? (
                  <div className="flex items-center gap-2">
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span>Your streak: {userStreak} days!</span>
                    {userRank && <span className="text-xs">• Rank #{userRank}</span>}
                  </div>
                ) : (
                  '@whale_hunter_pro • +$12.4K profit'
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-purple-600 dark:text-purple-300">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>2,847 active</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>+23% today</span>
            </div>
          </div>
        </div>
        
        <div className="mt-3 flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-xs text-white font-bold animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              {i + 1}
            </div>
          ))}
          <div 
            className="text-xs text-purple-600 dark:text-purple-300 self-center ml-2 cursor-pointer hover:text-purple-800 transition-colors"
            onClick={handleJoinClick}
            role="button"
            tabIndex={0}
            aria-label="Join the competition"
          >
            {isLoggedIn ? 'View leaderboard →' : 'Join the competition →'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}