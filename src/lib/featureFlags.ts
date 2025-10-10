import { supabase } from '@/integrations/supabase/client'

export type FeatureFlag = 
  | 'lite_home_default'
  | 'signals_on_home' 
  | 'ai_copilot_card'
  | 'watchlist_v2'
  | 'lite_header_rotate_motto'
  | 'custom_kpi_cards'
  | 'oneClickTrade'
  | 'mobile_widgets'

// Client-safe defaults
const getEnvFlag = (key: string, defaultValue: boolean): boolean => {
  if (typeof window !== 'undefined') {
    return defaultValue // Use defaults on client
  }
  return process.env[key] === 'true'
}

const envFlags: Record<FeatureFlag, boolean> = {
  lite_home_default: getEnvFlag('NEXT_PUBLIC_FF_LITE_HOME_DEFAULT', true),
  signals_on_home: getEnvFlag('NEXT_PUBLIC_FF_SIGNALS_ON_HOME', true),
  ai_copilot_card: getEnvFlag('NEXT_PUBLIC_FF_AI_COPILOT_CARD', true), 
  watchlist_v2: getEnvFlag('NEXT_PUBLIC_FF_WATCHLIST_V2', false),
  lite_header_rotate_motto: getEnvFlag('NEXT_PUBLIC_FF_LITE_HEADER_ROTATE_MOTTO', false),
  custom_kpi_cards: getEnvFlag('NEXT_PUBLIC_FF_CUSTOM_KPI_CARDS', false),
  oneClickTrade: getEnvFlag('NEXT_PUBLIC_FF_ONE_CLICK_TRADE', false),
  mobile_widgets: getEnvFlag('NEXT_PUBLIC_FF_MOBILE_WIDGETS', false),
}

let flagCache: Record<string, boolean> = {}

export async function isFeatureEnabled(flag: FeatureFlag): Promise<boolean> {
  if (flagCache[flag] !== undefined) {
    return flagCache[flag]
  }
  
  try {
    const { data } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('key', flag)
      .single()
    
    const enabled = data?.enabled ?? envFlags[flag]
    flagCache[flag] = enabled
    return enabled
  } catch {
    return envFlags[flag]
  }
}

export function getFeatureFlag(key: string): Promise<boolean> {
  return isFeatureEnabled(key as FeatureFlag)
}

export type Plan = 'free' | 'pro' | 'premium' | 'enterprise' | 'LITE'

export type PlanTier = 'free' | 'pro' | 'premium' | 'enterprise'