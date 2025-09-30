'use client'

import { useEffect, useState } from 'react'
import DigestCard from '@/components/hub/DigestCard'
import IndexDialCard from '@/components/hub/IndexDialCard'
import UnlockTeaserCard from '@/components/hub/UnlockTeaserCard'
import StreakCard from '@/components/hub/StreakCard'
import UpgradeBanner from '@/components/hub/UpgradeBanner'

export default function LiteHubPage() {
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false)

  useEffect(() => {
    // Check if user was redirected from upgrade
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('upgraded') === 'true') {
      setShowUpgradeSuccess(true)
      // Remove the parameter from URL
      window.history.replaceState({}, '', '/lite/hub')
    }
  }, [])

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">🐋 AlphaWhale Lite</h1>
        <p className="text-slate-400 mt-2">
          Your daily dose of whale intelligence
        </p>
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
