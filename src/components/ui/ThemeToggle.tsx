'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Monitor } from 'lucide-react'
import { trackEvent } from '@/lib/telemetry'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    trackEvent('card_click', { id: 'theme_toggle', value: newTheme })
  }

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
        <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
      <Button
        variant={theme === 'light' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleThemeChange('light')}
        className="w-8 h-8 p-0"
        aria-label="Light theme"
      >
        <Sun className="w-4 h-4" />
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleThemeChange('dark')}
        className="w-8 h-8 p-0"
        aria-label="Dark theme"
      >
        <Moon className="w-4 h-4" />
      </Button>
      <Button
        variant={theme === 'system' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleThemeChange('system')}
        className="w-8 h-8 p-0"
        aria-label="System theme"
      >
        <Monitor className="w-4 h-4" />
      </Button>
    </div>
  )
}