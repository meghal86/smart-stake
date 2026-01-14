'use client'

import { cn } from '@/lib/utils'
import { deriveSessionState, getRouteContext, type SessionState, type HeaderContext } from '@/lib/header'
import { useAuth } from '@/contexts/AuthContext'
import { useWallet } from '@/contexts/WalletContext'
import { usePathname } from 'next/navigation'
import { BrandSection } from './BrandSection'
import { ContextSection } from './ContextSection'
import { ActionsSection } from './ActionsSection'
import { HeaderSkeleton } from './HeaderSkeleton'

export interface GlobalHeaderProps {
  className?: string
}

/**
 * GlobalHeader - Unified header system for AlphaWhale
 * 
 * Three-section layout: Brand | Context | Actions
 * Fixed height: 64px ±4px
 * Sticky positioning with z-index above page content
 * 
 * Integrates with:
 * - AuthProvider (Supabase JWT session)
 * - WalletProvider (multi-chain wallet system v2.4.2)
 * 
 * Session States:
 * - S0_GUEST: No JWT, no wallet
 * - S1_ACCOUNT: JWT only
 * - S2_WALLET: Wallet only
 * - S3_BOTH: JWT + wallet
 */
export function GlobalHeader({ className }: GlobalHeaderProps) {
  const pathname = usePathname()
  const { user, loading: authLoading } = useAuth()
  const { activeWallet, isLoading: walletLoading } = useWallet()

  // Derive session state
  const hasJWT = !!user
  const hasWallet = !!activeWallet
  const sessionState: SessionState = deriveSessionState(hasJWT, hasWallet)

  // Compute resolving state
  const isResolvingSession = authLoading || (hasJWT && walletLoading)

  // Get route context - handle null pathname
  const context: HeaderContext = getRouteContext(pathname || '/')

  // Show skeleton while resolving
  if (isResolvingSession) {
    return <HeaderSkeleton />
  }

  return (
    <header
      className={cn(
        // Fixed height (64px ±4px)
        'h-16',
        // Sticky positioning
        'sticky top-0 z-50',
        // Background with blur
        'bg-slate-900/70 backdrop-blur-md',
        // Border
        'border-b border-white/10',
        className
      )}
      role="banner"
      aria-label="Global header"
    >
      <div className="mx-auto h-full max-w-7xl px-4">
        {/* Three-section grid layout */}
        <div className="grid h-full grid-cols-[auto_1fr_auto] items-center gap-4">
          {/* Left: Brand Section */}
          <BrandSection />

          {/* Center: Context Section */}
          <ContextSection context={context} />

          {/* Right: Actions Section */}
          <ActionsSection sessionState={sessionState} context={context} />
        </div>
      </div>
    </header>
  )
}
