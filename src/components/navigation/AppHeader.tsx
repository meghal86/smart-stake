'use client'

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { trackEvent } from '@/lib/telemetry'
import { useAuth } from '@/contexts/AuthContext'
import { useTier } from '@/hooks/useTier'

type UiMode = 'novice' | 'pro' | 'auto'

export function AppHeader() {
  const { user } = useAuth()
  const { tier } = useTier()
  const [uiMode, setUiMode] = useState<UiMode>('novice')

  useEffect(() => {
    const stored = localStorage.getItem('ui_mode') as UiMode
    if (stored) setUiMode(stored)
  }, [])

  const handleModeChange = (mode: UiMode) => {
    setUiMode(mode)
    localStorage.setItem('ui_mode', mode)
    trackEvent('card_click', { id: 'mode_toggle', value: mode })
  }

  const isPro = tier === 'pro' || tier === 'premium' || tier === 'institutional'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/40 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🐋</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-lg">ALPHAWHALE</span>
              <span className="text-xs text-slate-500 dark:text-slate-500 hidden sm:block">Learn → Act → Profit</span>
            </div>
          </div>

          {/* Center: Motto (mobile stacks) */}
          <div className="hidden md:block">
            <span className="text-sm text-slate-600 dark:text-slate-400">Learn → Act → Profit</span>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Button
                variant={uiMode === 'novice' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleModeChange('novice')}
                className="text-xs px-2 py-1"
              >
                Novice
              </Button>
              <Button
                variant={uiMode === 'pro' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleModeChange('pro')}
                className="text-xs px-2 py-1"
              >
                Pro
              </Button>
              <Button
                variant={uiMode === 'auto' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleModeChange('auto')}
                className="text-xs px-2 py-1"
              >
                Auto
              </Button>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Pro/Upgrade Button */}
            {isPro ? (
              <Button asChild size="sm" variant="outline">
                <Link to="/hub2">Go to Pro</Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white">
                <Link to="/plans?from=lite_home">
                  <Badge variant="secondary" className="mr-1 bg-amber-100 text-amber-800">
                    Upgrade
                  </Badge>
                </Link>
              </Button>
            )}

            {/* Profile */}
            <Button asChild variant="ghost" size="sm" className="p-1">
              <Link to="/profile">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-cyan-100 text-cyan-700 text-xs">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}