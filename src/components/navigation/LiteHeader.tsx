'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Moon, Sun, Monitor, User, Settings, LogOut, Zap } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'

interface LiteHeaderProps {
  userMode?: 'novice' | 'pro' | 'auto'
  onModeChange?: (mode: 'novice' | 'pro' | 'auto') => void
  theme?: 'light' | 'dark' | 'system'
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void
  userPlan?: 'lite' | 'pro' | 'enterprise'
  userName?: string
}

export default function LiteHeader({ 
  userMode = 'auto',
  onModeChange,
  theme = 'system',
  onThemeChange,
  userPlan = 'lite',
  userName = 'User'
}: LiteHeaderProps) {
  const { track } = useAnalytics()

  const handleModeChange = (mode: 'novice' | 'pro' | 'auto') => {
    track('cta_click', { label: `Mode Change ${mode}` })
    onModeChange?.(mode)
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    track('cta_click', { label: `Theme Change ${newTheme}` })
    onThemeChange?.(newTheme)
  }

  const handleSignOut = () => {
    track('cta_click', { label: 'Sign Out' })
  }

  const getPlanBadgeColor = () => {
    switch (userPlan) {
      case 'pro': return 'bg-blue-600'
      case 'enterprise': return 'bg-purple-600'
      default: return 'bg-gray-600'
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Motto */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🐋</span>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AlphaWhale
                </h1>
                <p className="text-meta -mt-1">
                  Learn → Act → Profit
                </p>
              </div>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
            {(['novice', 'pro', 'auto'] as const).map((mode) => (
              <Button
                key={mode}
                size="sm"
                variant={userMode === mode ? 'default' : 'ghost'}
                onClick={() => handleModeChange(mode)}
                className="text-xs px-3 py-1 h-7 rounded-xl"
                aria-label={`Switch to ${mode} mode`}
              >
                {mode === 'novice' && '🌱'}
                {mode === 'pro' && '⚡'}
                {mode === 'auto' && '🤖'}
                <span className="ml-1 capitalize">{mode}</span>
              </Button>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Change theme">
                  {theme === 'light' && <Sun className="w-4 h-4" />}
                  {theme === 'dark' && <Moon className="w-4 h-4" />}
                  {theme === 'system' && <Monitor className="w-4 h-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleThemeChange('light')}>
                  <Sun className="w-4 h-4 mr-2" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange('dark')}>
                  <Moon className="w-4 h-4 mr-2" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange('system')}>
                  <Monitor className="w-4 h-4 mr-2" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 px-2 gap-2" aria-label="User menu">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Badge className={`text-xs px-2 py-0 ${getPlanBadgeColor()} text-white`}>
                    {userPlan.toUpperCase()}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-meta">{userPlan} plan</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                {userPlan === 'lite' && (
                  <DropdownMenuItem>
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}