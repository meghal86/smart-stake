'use client'

import { useEffect, useState } from 'react'
import DigestCard from '@/components/hub/DigestCard'
import IndexDialCard from '@/components/hub/IndexDialCard'
import UnlockTeaserCard from '@/components/hub/UnlockTeaserCard'
import StreakCard from '@/components/hub/StreakCard'
import UpgradeBanner from '@/components/hub/UpgradeBanner'
import { MobileFooterNav } from '@/components/navigation/MobileFooterNav'
import { DesktopSidebarNav } from '@/components/navigation/DesktopSidebarNav'

interface DigestEvent {
  id: number
  event_time: string
  asset: string
  summary: string
  severity: number
  source: string
}

interface WhaleIndex {
  score: number
  label: string
}

interface TokenUnlock {
  id: number
  token: string
  chain: string
  unlock_time: string
  amount_usd: number
  source: string
}

interface StreakData {
  streak_count: number
  last_seen_date: string
}

export default function HubPage() {
  const [digest, setDigest] = useState<DigestEvent[]>([])
  const [whaleIndex, setWhaleIndex] = useState<WhaleIndex | null>(null)
  const [unlock, setUnlock] = useState<TokenUnlock | null>(null)
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [userPlan, setUserPlan] = useState<'LITE' | 'PRO' | 'ENTERPRISE'>('LITE')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch digest
        const digestRes = await fetch('/api/digest?limit=6')
        const digestData = await digestRes.json()
        setDigest(digestData.digest || [])

        // Fetch whale index
        const indexRes = await fetch('/api/whale-index')
        const indexData = await indexRes.json()
        setWhaleIndex(indexData.whaleIndex)

        // Fetch next unlock
        const unlockRes = await fetch('/api/unlocks?limit=1')
        const unlockData = await unlockRes.json()
        setUnlock(unlockData.unlocks?.[0] || null)

        // Fetch streak
        const streakRes = await fetch('/api/streak')
        const streakData = await streakRes.json()
        setStreak(streakData.streak)

        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DesktopSidebarNav currentPath="/hub" />
        <div className="md:pl-64">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading AlphaWhale...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebarNav currentPath="/hub" />
      
      <div className="md:pl-64">
        <main className="p-4 pb-20 md:pb-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Whale Hub</h1>
              <p className="text-muted-foreground mt-2">
                Your daily dose of whale intelligence and market insights
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <DigestCard digest={digest} userPlan={userPlan} />
              <IndexDialCard whaleIndex={whaleIndex} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {unlock && <UnlockTeaserCard unlock={unlock} userPlan={userPlan} />}
              {streak && <StreakCard streak={streak} />}
            </div>

            <UpgradeBanner userPlan={userPlan} />
          </div>
        </main>
      </div>

      <MobileFooterNav currentPath="/hub" />
    </div>
  )
}
