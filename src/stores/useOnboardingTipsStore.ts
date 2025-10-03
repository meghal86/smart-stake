import { create } from 'zustand'
import { supabase } from '@/integrations/supabase/client'

type State = { 
  copilotTipDismissed: boolean
  hydrated: boolean
  celebrateGraduation: boolean
}

type Actions = {
  hydrateFromStorage: (userId?: string) => Promise<void>
  dismissCopilotTip: (userId?: string) => Promise<void>
  resetCopilotTip: (userId?: string) => Promise<void>
}

const LS_KEY = 'aw.tips.copilot.dismissed'

export const useOnboardingTipsStore = create<State & Actions>((set, get) => ({
  copilotTipDismissed: false,
  hydrated: false,
  celebrateGraduation: false,

  hydrateFromStorage: async (userId) => {
    // Local storage first
    const ls = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null
    let dismissed = ls === 'true'

    // Try server if user logged in
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('ui_mode')
          .eq('user_id', userId)
          .single()
        
        if (!error && data?.ui_mode) {
          const userMeta = typeof data.ui_mode === 'string' ? JSON.parse(data.ui_mode) : data.ui_mode
          if (userMeta?.copilot_tip_dismissed !== undefined) {
            dismissed = !!userMeta.copilot_tip_dismissed
          }
        }
      } catch (error) {
        console.warn('Failed to fetch user meta:', error)
      }
    }

    set({ copilotTipDismissed: dismissed, hydrated: true })
  },

  dismissCopilotTip: async (userId) => {
    // Check if this is first-time dismissal
    const isFirstTime = localStorage.getItem(LS_KEY) !== 'true'
    
    localStorage.setItem(LS_KEY, 'true')
    set({ copilotTipDismissed: true, celebrateGraduation: isFirstTime })
    
    // Reset celebration after animation
    if (isFirstTime) {
      setTimeout(() => set({ celebrateGraduation: false }), 1200)
    }

    if (userId) {
      try {
        // Get current ui_mode and update it
        const { data } = await supabase
          .from('user_profiles')
          .select('ui_mode')
          .eq('user_id', userId)
          .single()
        
        const currentMeta = data?.ui_mode ? (typeof data.ui_mode === 'string' ? JSON.parse(data.ui_mode) : data.ui_mode) : {}
        const updatedMeta = { ...currentMeta, copilot_tip_dismissed: true }
        
        await supabase
          .from('user_profiles')
          .update({ ui_mode: JSON.stringify(updatedMeta) })
          .eq('user_id', userId)
      } catch (error) {
        console.warn('Failed to update user meta:', error)
      }
    }
  },

  resetCopilotTip: async (userId) => {
    localStorage.setItem(LS_KEY, 'false')
    set({ copilotTipDismissed: false })

    if (userId) {
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('ui_mode')
          .eq('user_id', userId)
          .single()
        
        const currentMeta = data?.ui_mode ? (typeof data.ui_mode === 'string' ? JSON.parse(data.ui_mode) : data.ui_mode) : {}
        const updatedMeta = { ...currentMeta, copilot_tip_dismissed: false }
        
        await supabase
          .from('user_profiles')
          .update({ ui_mode: JSON.stringify(updatedMeta) })
          .eq('user_id', userId)
      } catch (error) {
        console.warn('Failed to update user meta:', error)
      }
    }
  },
}))