'use client'

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { trackEvent } from '@/lib/telemetry'
import { getTheme, setTheme, nextTheme, type Theme } from '@/lib/theme'
import PlanBadge, { type PlanTier } from '@/components/ui/PlanBadge'
import { IconButton } from '@/components/ui/IconButton'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import { HeaderMotto } from './HeaderMotto'
import { Bell, Sun, Moon, Monitor, User, Wallet } from 'lucide-react'

interface UserProfile {
  plan_tier: PlanTier
  avatar_url?: string
  ui_mode?: string
}

export default function LiteGlobalHeader() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [prevUnreadCount, setPrevUnreadCount] = useState<number>(0)
  const [theme, setThemeState] = useState<Theme>('system')
  const [isLoading, setIsLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const planColor: Record<PlanTier, string> = {
    lite: '#22d3ee',
    pro: '#10b981', 
    premium: '#0ea5e9',
    institutional: '#a78bfa'
  }

  useEffect(() => {
    let mounted = true
    
    const initializeHeader = async () => {
      try {
        // Get current theme
        const currentTheme = getTheme()
        setThemeState(currentTheme)

        // Get authenticated user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (!mounted) return
        
        if (authError) {
          console.warn('Auth error:', authError)
          setIsLoading(false)
          return
        }

        setUser(authUser)

        if (authUser) {
          // Fetch user profile
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('plan_tier, avatar_url, ui_mode')
            .eq('user_id', authUser.id)
            .single()

          if (!profileError && userProfile) {
            setProfile({
              plan_tier: userProfile.plan_tier || 'lite',
              avatar_url: userProfile.avatar_url || authUser.user_metadata?.avatar_url,
              ui_mode: userProfile.ui_mode
            })
          } else {
            // Fallback to default profile
            setProfile({
              plan_tier: 'lite',
              avatar_url: authUser.user_metadata?.avatar_url
            })
          }

          // Fetch unread alerts count
          try {
            const { count, error: alertsError } = await supabase
              .from('entitlement_events')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', authUser.id)
              .is('read_at', null)

            if (!alertsError && count !== null) {
              setPrevUnreadCount(unreadCount)
              setUnreadCount(count)
            }
          } catch (alertsError) {
            console.warn('Could not fetch alerts count:', alertsError)
          }
        }

        // Track header view
        trackEvent('header_view', { 
          plan: profile?.plan_tier || 'lite', 
          theme: currentTheme, 
          source: 'global_header' 
        })

      } catch (error) {
        console.error('Header initialization error:', error)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    initializeHeader()

    return () => {
      mounted = false
    }
  }, [])

  const handleThemeToggle = () => {
    const nextThemeValue = nextTheme(theme)
    setTheme(nextThemeValue)
    setThemeState(nextThemeValue)
    
    trackEvent('header_click', { 
      item: 'theme_toggle',
      plan: profile?.plan_tier || 'lite', 
      theme: nextThemeValue, 
      source: 'global_header' 
    })
  }

  const handleLogoClick = () => {
    trackEvent('header_click', { 
      item: 'logo',
      plan: profile?.plan_tier || 'lite', 
      theme, 
      source: 'global_header' 
    })
  }

  const handlePlanBadgeClick = () => {
    setShowUpgradeModal(true)
    trackEvent('header_click', { 
      item: 'plan_badge',
      plan: profile?.plan_tier || 'lite', 
      theme, 
      source: 'global_header' 
    })
  }

  const handleNotificationsClick = () => {
    trackEvent('header_click', { 
      item: 'notifications',
      plan: profile?.plan_tier || 'lite', 
      theme, 
      unread_count: unreadCount,
      source: 'global_header' 
    })
  }

  const handleProfileClick = () => {
    trackEvent('header_click', { 
      item: 'profile',
      plan: profile?.plan_tier || 'lite', 
      theme, 
      source: 'global_header' 
    })
  }

  const device = typeof window !== "undefined" && window.innerWidth < 640 ? "mobile" : "web"
  const hasNewNotifications = unreadCount > prevUnreadCount && unreadCount > 0
  const currentPlan = profile?.plan_tier || 'lite'
  const currentPlanColor = planColor[currentPlan]

  if (isLoading) {
    return (
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm rounded-b-xl">
        <div className="mx-auto max-w-7xl px-3 sm:px-4">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3 h-12">
            <div className="flex items-center min-w-0">
              <div className="h-6 w-6 animate-pulse rounded-full bg-slate-700" />
              <div className="h-6 w-20 animate-pulse rounded bg-slate-700 ml-3" />
            </div>
            <div />
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="h-6 w-12 animate-pulse rounded-full bg-slate-700" />
              <div className="h-8 w-8 animate-pulse rounded-full bg-slate-700" />
              <div className="h-8 w-8 animate-pulse rounded-full bg-slate-700" />
              <div className="h-8 w-8 animate-pulse rounded-full bg-slate-700" />
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm rounded-b-xl">
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3 h-12">
          <div className="flex items-center min-w-0">
            <Link 
              to="/" 
              onClick={handleLogoClick}
              aria-label="AlphaWhale Home"
              className="flex items-center transition-transform hover:scale-105"
            >
              <div className="relative h-6 w-6">
                <div 
                  className="absolute inset-0 rounded-full opacity-90 transition-all duration-300" 
                  style={{ background: currentPlanColor }} 
                />
                <div 
                  className="absolute inset-0 animate-pulse rounded-full opacity-30" 
                  style={{ background: currentPlanColor }} 
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs animate-pulse">🐋</span>
              </div>
            </Link>
            <HeaderMotto plan={currentPlan} mode={profile?.ui_mode || "novice"} device={device} />
          </div>
          <div />
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Plan Badge */}
            <button
              onClick={handlePlanBadgeClick}
              className="rounded-full px-2 py-1 text-xs font-medium transition-all hover:scale-105 cursor-pointer"
              style={{ 
                backgroundColor: `${currentPlanColor}22`, 
                color: currentPlanColor, 
                border: `1px solid ${currentPlanColor}55` 
              }}
              aria-label="Upgrade plan"
            >
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </button>

            {/* Theme Toggle */}
            <IconButton
              onClick={handleThemeToggle}
              aria-label={`Switch to ${nextTheme(theme)} theme`}
              className="transition-all duration-300 hover:rotate-12"
            >
              {theme === 'light' && <Sun className="h-4 w-4 transition-transform duration-300" />}
              {theme === 'dark' && <Moon className="h-4 w-4 transition-transform duration-300" />}
              {theme === 'system' && <Monitor className="h-4 w-4 transition-transform duration-300" />}
            </IconButton>

            {/* Notifications */}
            <Link 
              to="/alerts" 
              onClick={handleNotificationsClick}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              className="relative"
            >
              <IconButton className={hasNewNotifications ? 'animate-bounce' : ''}>
                <Bell className="h-4 w-4 transition-transform duration-200" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </IconButton>
            </Link>

            {/* Avatar / Sign In */}
            {user ? (
              <Link 
                to="/settings" 
                onClick={handleProfileClick}
                aria-label="Profile settings"
                className="h-8 w-8 overflow-hidden rounded-full ring-1 ring-slate-700 transition-all duration-200 hover:scale-105 hover:ring-2"
                style={{ ringColor: `${currentPlanColor}55` }}
              >
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className="h-full w-full object-cover transition-transform duration-200 hover:scale-110"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-slate-700 text-slate-300 transition-colors duration-200 hover:bg-slate-600">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </Link>
            ) : (
              <Link 
                to="/sign-in" 
                onClick={() => trackEvent('header_click', { item: 'sign_in', plan: 'lite' })}
                className="flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 transition-all duration-200 hover:bg-slate-700 hover:scale-105"
              >
                <Wallet className="h-3 w-3" />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="plan_upgrade"
        currentTier={currentPlan}
        targetTier={currentPlan === 'lite' ? 'pro' : 'premium'}
      />
    </header>
  )
}