'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

type Streak = { 
  streak_count: number
  last_seen_date?: string
}

export default function StreakCard() {
  const [streak, setStreak] = useState<Streak | null>(null)

  useEffect(() => {
    async function loadStreak() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setStreak({ streak_count: 0 })
        return
      }
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('streak_count')
        .eq('id', session.user.id)
        .single()
      setStreak(profile as Streak || { streak_count: 0 })
    }
    loadStreak()
  }, [])

  if (!streak) return null

  const getStreakMessage = (count: number) => {
    if (count === 0) return "Start your streak today!"
    if (count === 1) return "Great start! Keep it going!"
    if (count < 7) return "Building momentum!"
    if (count < 30) return "You're on fire!"
    return "Legendary streak!"
  }

  const getStreakColor = (count: number) => {
    if (count >= 30) return "bg-gradient-to-r from-yellow-400 to-yellow-600"
    if (count >= 7) return "bg-gradient-to-r from-blue-400 to-blue-600"
    if (count >= 3) return "bg-gradient-to-r from-orange-400 to-orange-600"
    return "bg-gradient-to-r from-slate-400 to-slate-600"
  }

  return (
    <div className="rounded-2xl bg-slate-900 p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">🔥 Daily Streak</h2>
          <p className="text-slate-400 text-sm">{getStreakMessage(streak.streak_count)}</p>
        </div>
        <div className={`w-16 h-16 rounded-full ${getStreakColor(streak.streak_count)} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
          {streak.streak_count}
        </div>
      </div>
      <div className="mt-4 text-center">
        <div className="text-sm text-slate-400">
          Day {streak.streak_count} of your Whale Streak
        </div>
      </div>
    </div>
  )
}