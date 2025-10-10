import { useState, useEffect } from 'react'
import { isFeatureEnabled, FeatureFlag } from '@/lib/featureFlags'

const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  lite_home_default: true,
  signals_on_home: true,
  ai_copilot_card: true,
  watchlist_v2: false,
  lite_header_rotate_motto: false
}

let flagCache: Record<FeatureFlag, boolean> = {}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<FeatureFlag, boolean>>(DEFAULT_FLAGS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFlags = async () => {
      const flagKeys: FeatureFlag[] = ['lite_home_default', 'signals_on_home', 'ai_copilot_card', 'watchlist_v2', 'lite_header_rotate_motto']
      const loadedFlags: Record<FeatureFlag, boolean> = { ...DEFAULT_FLAGS }
      
      for (const key of flagKeys) {
        if (flagCache[key] !== undefined) {
          loadedFlags[key] = flagCache[key]
        } else {
          try {
            const enabled = await isFeatureEnabled(key)
            loadedFlags[key] = enabled
            flagCache[key] = enabled
          } catch {
            loadedFlags[key] = DEFAULT_FLAGS[key]
          }
        }
      }
      
      setFlags(loadedFlags)
      setIsLoading(false)
    }

    loadFlags()
  }, [])

  const isEnabled = (flagKey: FeatureFlag): boolean => {
    if (flagKey === 'lite_home_default') return true
    return flags[flagKey] ?? DEFAULT_FLAGS[flagKey]
  }

  return {
    flags,
    isEnabled,
    isLoading
  }
}