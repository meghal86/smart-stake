import { useTier } from './useTier'
import { useState } from 'react'

type Feature = 'alerts_advanced' | 'watchlist' | 'reports_export' | 'api_access' | 'portfolio_tracking'

const featureRequirements: Record<Feature, string[]> = {
  alerts_advanced: ['pro', 'premium', 'institutional'],
  watchlist: ['pro', 'premium', 'institutional'],
  reports_export: ['premium', 'institutional'],
  api_access: ['premium', 'institutional'],
  portfolio_tracking: ['pro', 'premium', 'institutional']
}

export function useGate() {
  const { tier } = useTier()
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; feature?: Feature }>({ open: false })

  const canAccess = (feature: Feature): boolean => {
    const requiredTiers = featureRequirements[feature] || []
    return requiredTiers.includes(tier || 'free')
  }

  const showUpgrade = (feature: Feature) => {
    setUpgradeModal({ open: true, feature })
  }

  const closeUpgrade = () => {
    setUpgradeModal({ open: false })
  }

  return {
    canAccess,
    showUpgrade,
    closeUpgrade,
    upgradeModal
  }
}