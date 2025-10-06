'use client'

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { trackEvent } from '@/lib/telemetry'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Flame, Trophy, TrendingUp } from 'lucide-react'
import { getMotionClass } from '@/components/ui/motion'

interface ProgressStreakProps {
  userStreak: number
  userRank: number | null
  userRankPercentile?: number
  onStreakAdvanced?: boolean
}

export default function ProgressStreak({ userStreak, userRank, userRankPercentile, onStreakAdvanced }: ProgressStreakProps) {
  const maxStreak = 30
  const progress = Math.min((userStreak / maxStreak) * 100, 100)
  const isAuthenticated = userStreak > 0
  const [celebrating, setCelebrating] = useState(false)
  const [milestoneGlow, setMilestoneGlow] = useState(false)
  const [progressUpdated, setProgressUpdated] = useState(false)
  
  const isMilestone = [5, 10, 20, 30].includes(userStreak)
  
  useEffect(() => {
    if (onStreakAdvanced) {
      setCelebrating(true)
      setProgressUpdated(true)
      
      if (isMilestone) {
        setMilestoneGlow(true)
        setTimeout(() => setMilestoneGlow(false), 2000)
      }
      
      trackEvent('streak_celebrate', { day: userStreak, milestone: isMilestone })
      setTimeout(() => {
        setCelebrating(false)
        setProgressUpdated(false)
      }, 1200)
    }
  }, [onStreakAdvanced, userStreak, isMilestone])

  const handleLeaderboardClick = () => {
    trackEvent('cta_click', { label: 'view_leaderboard', plan: 'lite', streak: userStreak })
  }

  return (
    <Card className={`aw-card aw-shadow bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-700/50 relative ${celebrating ? 'motion-safe:animate-streak-celebrate' : ''} ${milestoneGlow ? 'motion-safe:animate-milestone-glow' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
              <Flame className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                {isAuthenticated ? `Your streak: ${userStreak} days` : 'Join the competition'}
              </h3>
              {isAuthenticated && userRank ? (
                <div className="flex items-center gap-2">
                  <p className="text-meta flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-yellow-500" />
                    Rank #{userRank}
                  </p>
                  {userRankPercentile && (
                    <Badge variant="secondary" className={`text-xs px-2 py-0.5 transition-all duration-300 ${progressUpdated ? 'motion-safe:animate-pulse' : ''}`}>
                      Top {userRankPercentile}%
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-meta">
                  Start your learning journey →
                </p>
              )}
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            onClick={handleLeaderboardClick}
            className="text-orange-600 hover:text-orange-700 dark:text-orange-400"
            aria-label="View leaderboard"
          >
            <Link to="/leaderboard">
              View leaderboard
            </Link>
          </Button>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-progress">Progress to next milestone</span>
            <span className="text-kpi">{userStreak}/{maxStreak} days</span>
          </div>
          <div className="aw-progress">
            <div 
              className={`aw-progress-fill transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,138,76,0.5)] dark:shadow-[0_0_10px_rgba(255,138,76,0.5)] ${getMotionClass('slideIn')}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Confetti Effect for Milestones */}
        {milestoneGlow && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-orange-400 rounded-full motion-safe:animate-confetti"
                style={{
                  left: `${20 + i * 12}%`,
                  top: '50%',
                  animationDelay: `${i * 100}ms`
                }}
              />
            ))}
          </div>
        )}

        {/* Streak Stats */}
        <div className="flex justify-between mt-3 text-xs">
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <TrendingUp className="h-3 w-3" />
            <span>+{Math.floor(userStreak * 1.2)}% this week</span>
          </div>
          <div className={`text-progress transition-all duration-300 ${progressUpdated ? 'motion-safe:animate-pulse' : ''}`}>
            Next: {maxStreak - userStreak} days to milestone
          </div>
        </div>
      </CardContent>
    </Card>
  )
}