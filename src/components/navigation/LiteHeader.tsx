'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Moon, Sun, Monitor, Settings } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface LiteHeaderProps {
  userPlan?: 'lite' | 'pro' | 'enterprise'
  userName?: string
}

export default function LiteHeader({ 
  userPlan = 'lite',
  userName = 'User'
}: LiteHeaderProps) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200/40 dark:border-slate-800">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Motto */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🐋</span>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                AlphaWhale
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 -mt-1">
                Learn → Act → Profit
              </p>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-2">
            <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 text-xs">
              {userPlan.toUpperCase()}
            </Badge>
            
            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {theme === 'light' && <Sun className="w-4 h-4" />}
                  {theme === 'dark' && <Moon className="w-4 h-4" />}
                  {theme === 'system' && <Monitor className="w-4 h-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="w-4 h-4 mr-2" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="w-4 h-4 mr-2" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <Monitor className="w-4 h-4 mr-2" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}