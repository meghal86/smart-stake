'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sun, Moon, Monitor, User, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/contexts/AuthContext'
import { useTier } from '@/hooks/useTier'

export function Header() {
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const { tier } = useTier()
  const [showProfile, setShowProfile] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Motto */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🐋</span>
              </div>
              <span className="font-bold text-white text-lg">AlphaWhale</span>
            </div>
            <div className="hidden md:block text-sm text-slate-400 italic">
              Learn → Act → Profit
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg">
              <Button
                variant={theme === 'light' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTheme('light')}
                className="w-8 h-8 p-0"
              >
                <Sun className="w-4 h-4" />
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="w-8 h-8 p-0"
              >
                <Moon className="w-4 h-4" />
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTheme('system')}
                className="w-8 h-8 p-0"
              >
                <Monitor className="w-4 h-4" />
              </Button>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-cyan-100 text-cyan-700 text-xs">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-slate-400 capitalize">{tier}</span>
              </Button>

              {showProfile && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700 py-2">
                  <div className="px-3 py-2 border-b border-slate-700">
                    <p className="text-sm text-white">{user?.email}</p>
                    <p className="text-xs text-slate-400 capitalize">{tier} Plan</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start px-3 py-2 text-slate-300 hover:text-white"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className="w-full justify-start px-3 py-2 text-slate-300 hover:text-white"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}