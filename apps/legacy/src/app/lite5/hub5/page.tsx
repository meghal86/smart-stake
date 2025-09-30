'use client'

import { useEffect, useState } from 'react'
import DigestCard from '@/components/hub5/DigestCard'
import IndexDialCard from '@/components/hub5/IndexDialCard'
import UnlockTeaserCard from '@/components/hub5/UnlockTeaserCard'
import StreakCard from '@/components/hub5/StreakCard'
import UpgradeBanner from '@/components/hub5/UpgradeBanner'

export default function Lite5Hub5Page() {
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false)

  useEffect(() => {
    // Check if user was redirected from upgrade
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('upgraded') === 'true') {
      setShowUpgradeSuccess(true)
      // Remove the parameter from URL
      window.history.replaceState({}, '', '/lite5/hub5')
    }
  }, [])

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">⚡ AlphaWhale Lite</h1>
        <p className="text-slate-400 mt-2">
          Lightweight whale intelligence for quick insights
        </p>
        <div className="mt-2 px-3 py-1 bg-blue-600/20 text-blue-400 text-sm rounded-full inline-block">
          🚀 Lite Version - Simplified Interface
        </div>
      </div>

      {showUpgradeSuccess && (
        <div className="rounded-2xl bg-gradient-to-r from-green-600 to-teal-600 p-4 shadow">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🎉</div>
            <div>
              <h3 className="font-semibold text-white">Upgrade Successful!</h3>
              <p className="text-green-100 text-sm">You now have access to Pro features</p>
            </div>
            <button 
              onClick={() => setShowUpgradeSuccess(false)}
              className="ml-auto text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <DigestCard />
      <IndexDialCard />
      <UnlockTeaserCard />
      <StreakCard />
      <UpgradeBanner />
    </div>
  )
}
