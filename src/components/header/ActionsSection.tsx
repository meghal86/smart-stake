'use client'

import { cn } from '@/lib/utils'
import type { SessionState, HeaderContext } from '@/lib/header'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Monitor } from 'lucide-react'
import { getTheme, nextTheme, setTheme, type Theme } from '@/lib/theme'
import { useState, useEffect } from 'react'

export interface ActionsSectionProps {
  sessionState: SessionState
  context: HeaderContext
}

/**
 * ActionsSection - Right section of GlobalHeader
 * 
 * Renders session-state-specific actions:
 * - S0_GUEST: Sign In + Connect Wallet
 * - S1_ACCOUNT: Profile + Add Wallet + Connect Wallet
 * - S2_WALLET: WalletPill + Save Wallet + Sign In
 * - S3_BOTH: WalletPill + Profile
 * 
 * Reserved widths prevent layout shift:
 * - Wallet slot: 180px desktop / 140px mobile
 * - Profile slot: 40px
 */
export function ActionsSection({ sessionState, context }: ActionsSectionProps) {
  const [theme, setThemeState] = useState<Theme>('system')

  useEffect(() => {
    setThemeState(getTheme())
  }, [])

  const handleThemeToggle = () => {
    const nextThemeValue = nextTheme(theme)
    setTheme(nextThemeValue)
    setThemeState(nextThemeValue)
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'system':
        return <Monitor className="h-4 w-4" />
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Theme Toggle - always visible */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleThemeToggle}
        aria-label={`Switch to ${nextTheme(theme)} theme`}
        className={cn(
          'h-10 w-10 rounded-full',
          'transition-all duration-300 hover:rotate-12'
        )}
      >
        {getThemeIcon()}
      </Button>

      {/* Session-state-specific actions */}
      {sessionState === 'S0_GUEST' && (
        <>
          {/* Sign In (ghost) */}
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white"
          >
            Sign In
          </Button>

          {/* Connect Wallet (primary) */}
          <Button
            size="sm"
            className="bg-cyan-500 text-white hover:bg-cyan-600"
          >
            Connect Wallet
          </Button>
        </>
      )}

      {sessionState === 'S1_ACCOUNT' && (
        <>
          {/* Add Wallet (primary) */}
          <Button
            size="sm"
            className="bg-cyan-500 text-white hover:bg-cyan-600"
          >
            Add Wallet
          </Button>

          {/* Connect Wallet (secondary) */}
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Connect Wallet
          </Button>

          {/* Profile dropdown placeholder */}
          <div
            className="h-10 w-10 rounded-full bg-slate-700"
            style={{ width: 'var(--profile-slot-width, 40px)' }}
          />
        </>
      )}

      {sessionState === 'S2_WALLET' && (
        <>
          {/* WalletPill (non-interactive) - reserved width */}
          <div
            className={cn(
              'flex h-10 items-center gap-2 rounded-full bg-slate-800 px-3',
              'border border-slate-700'
            )}
            style={{ 
              width: 'var(--wallet-slot-width, 180px)',
              minWidth: 'var(--wallet-slot-width, 180px)'
            }}
          >
            <span className="truncate text-sm text-slate-300">
              0x1234...5678
            </span>
          </div>

          {/* Save Wallet */}
          <Button
            size="sm"
            variant="outline"
            className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
          >
            Save
          </Button>

          {/* Sign In (ghost) */}
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white"
          >
            Sign In
          </Button>
        </>
      )}

      {sessionState === 'S3_BOTH' && (
        <>
          {/* WalletPill (interactive on Portfolio) - reserved width */}
          <div
            className={cn(
              'flex h-10 items-center gap-2 rounded-full bg-slate-800 px-3',
              'border border-slate-700',
              context.enableWalletSelector && 'cursor-pointer hover:bg-slate-700'
            )}
            style={{ 
              width: 'var(--wallet-slot-width, 180px)',
              minWidth: 'var(--wallet-slot-width, 180px)'
            }}
          >
            <span className="truncate text-sm text-slate-300">
              0x1234...5678
            </span>
          </div>

          {/* Profile dropdown placeholder - reserved width */}
          <div
            className="h-10 w-10 rounded-full bg-slate-700"
            style={{ width: 'var(--profile-slot-width, 40px)' }}
          />
        </>
      )}
    </div>
  )
}
