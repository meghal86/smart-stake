'use client'

import { cn } from '@/lib/utils'
import type { SessionState, HeaderContext, UserProfile } from '@/lib/header'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Monitor } from 'lucide-react'
import { getTheme, nextTheme, setTheme, type Theme } from '@/lib/theme'
import { useState, useEffect } from 'react'
import { ProfileDropdown } from './ProfileDropdown'
import { WalletPill } from './WalletPill'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { handleSignOut } from '@/lib/header'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAuth } from '@/contexts/AuthContext'

export interface ActionsSectionProps {
  sessionState: SessionState
  context: HeaderContext
  user?: UserProfile
}

/**
 * ActionsSection - Right section of GlobalHeader
 * 
 * Renders session-state-specific actions:
 * - S0_GUEST: Sign In (ghost) + Connect Wallet (primary)
 * - S1_ACCOUNT: Profile + Add Wallet + Connect Wallet
 * - S2_WALLET: WalletPill (non-interactive) + Save Wallet + Sign In
 * - S3_BOTH: WalletPill + Profile
 * 
 * Reserved widths prevent layout shift:
 * - Wallet slot: 180px desktop / 140px mobile
 * - Profile slot: 40px
 */
export function ActionsSection({ sessionState, context, user }: ActionsSectionProps) {
  const [theme, setThemeState] = useState<Theme>('system')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { address: activeWallet } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { user: authUser } = useAuth()

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

  const handleProfileClick = () => {
    navigate('/profile')
  }

  const handleSettingsClick = () => {
    navigate('/settings')
  }

  const handleSignOutClick = async () => {
    try {
      await handleSignOut(queryClient)
      navigate('/')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const handleConnectWallet = () => {
    // Open RainbowKit wallet connection modal
    if (openConnectModal) {
      openConnectModal()
    } else {
      console.error('RainbowKit connect modal not available')
    }
  }

  const handleSignIn = () => {
    navigate('/auth/signin')
  }

  const handleAddWallet = () => {
    // Open RainbowKit wallet connection modal
    if (openConnectModal) {
      openConnectModal()
    } else {
      console.error('RainbowKit connect modal not available')
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignIn}
            className="text-slate-300 hover:text-white"
          >
            Sign In
          </Button>
          <Button
            size="sm"
            onClick={handleConnectWallet}
            className="bg-cyan-500 text-white hover:bg-cyan-600"
          >
            Connect Wallet
          </Button>
        </>
      )}

      {sessionState === 'S1_ACCOUNT' && (
        <>
          <Button
            size="sm"
            onClick={handleAddWallet}
            className="bg-cyan-500 text-white hover:bg-cyan-600"
          >
            Add Wallet
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleConnectWallet}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Connect Wallet
          </Button>
          {(user || authUser) && (
            <ProfileDropdown
              user={user || { email: authUser?.email || '', name: authUser?.user_metadata?.name }}
              onProfileClick={handleProfileClick}
              onSettingsClick={handleSettingsClick}
              onSignOutClick={handleSignOutClick}
            />
          )}
        </>
      )}

      {sessionState === 'S2_WALLET' && activeWallet && (
        <>
          <WalletPill
            wallet={{
              activeAddressShort: `${activeWallet.slice(0, 6)}...${activeWallet.slice(-4)}`,
              activeAddressChecksum: activeWallet,
              activeNetwork: 'eip155:1',
              activeChainName: 'Ethereum',
              canSignForActive: true,
              isInteractive: false,
              showMismatchIndicator: false,
              isSavedToRegistry: false,
            }}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleSignIn}
            className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
          >
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignIn}
            className="text-slate-300 hover:text-white"
          >
            Sign In
          </Button>
        </>
      )}

      {sessionState === 'S3_BOTH' && activeWallet && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddWallet}
            className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
          >
            Add Wallet
          </Button>
          <WalletPill
            wallet={{
              activeAddressShort: `${activeWallet.slice(0, 6)}...${activeWallet.slice(-4)}`,
              activeAddressChecksum: activeWallet,
              activeNetwork: 'eip155:1',
              activeChainName: 'Ethereum',
              canSignForActive: true,
              isInteractive: context.enableWalletSelector || false,
              showMismatchIndicator: false,
              isSavedToRegistry: true,
            }}
          />
          {(user || authUser) && (
            <ProfileDropdown
              user={user || { email: authUser?.email || '', name: authUser?.user_metadata?.name }}
              onProfileClick={handleProfileClick}
              onSettingsClick={handleSettingsClick}
              onSignOutClick={handleSignOutClick}
            />
          )}
        </>
      )}
    </div>
  )
}
