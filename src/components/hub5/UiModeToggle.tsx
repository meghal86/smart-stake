'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

type UiMode = 'novice' | 'pro' | 'auto'

export function useResolvedUiMode(): UiMode {
  const [mode, setMode] = useState<UiMode>('novice')

  useEffect(() => {
    const stored = localStorage.getItem('ui_mode') as UiMode
    if (stored) {
      setMode(stored)
    }
  }, [])

  return mode
}

export default function UiModeToggle() {
  const [mode, setMode] = useState<UiMode>('novice')

  useEffect(() => {
    const stored = localStorage.getItem('ui_mode') as UiMode
    if (stored) {
      setMode(stored)
    }
  }, [])

  const handleModeChange = (newMode: UiMode) => {
    setMode(newMode)
    localStorage.setItem('ui_mode', newMode)
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <Button
        size="sm"
        variant={mode === 'novice' ? 'default' : 'ghost'}
        onClick={() => handleModeChange('novice')}
        className="text-xs"
      >
        Novice
      </Button>
      <Button
        size="sm"
        variant={mode === 'pro' ? 'default' : 'ghost'}
        onClick={() => handleModeChange('pro')}
        className="text-xs"
      >
        Pro
      </Button>
      <Button
        size="sm"
        variant={mode === 'auto' ? 'default' : 'ghost'}
        onClick={() => handleModeChange('auto')}
        className="text-xs"
      >
        Auto
      </Button>
    </div>
  )
}