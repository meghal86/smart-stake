'use client'

import { cn } from '@/lib/utils'

/**
 * HeaderSkeleton - Loading placeholder for GlobalHeader
 * 
 * Matches final header dimensions to prevent CLS:
 * - Height: 64px
 * - Reserved widths for wallet slot and profile slot
 * - Skeleton placeholders match final element sizes
 */
export function HeaderSkeleton() {
  return (
    <header
      className={cn(
        // Fixed height (64px)
        'h-16',
        // Sticky positioning
        'sticky top-0 z-50',
        // Background with blur
        'bg-slate-900/70 backdrop-blur-md',
        // Border
        'border-b border-white/10'
      )}
      role="banner"
      aria-label="Global header loading"
    >
      <div className="mx-auto h-full max-w-7xl px-4">
        {/* Three-section grid layout */}
        <div className="grid h-full grid-cols-[auto_1fr_auto] items-center gap-4">
          {/* Left: Brand skeleton */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-700" />
            {/* Wordmark (hidden on mobile) */}
            <div className="hidden h-6 w-32 animate-pulse rounded bg-slate-700 sm:block" />
          </div>

          {/* Center: Context skeleton */}
          <div className="flex flex-col gap-1">
            {/* Title */}
            <div className="h-5 w-24 animate-pulse rounded bg-slate-700" />
            {/* Subtitle (hidden on mobile) */}
            <div className="hidden h-4 w-40 animate-pulse rounded bg-slate-700 md:block" />
          </div>

          {/* Right: Actions skeleton */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <div className="h-10 w-10 animate-pulse rounded-full bg-slate-700" />
            
            {/* Wallet slot (reserved width) */}
            <div 
              className="h-10 animate-pulse rounded-full bg-slate-700"
              style={{ 
                width: 'var(--wallet-slot-width, 180px)' 
              }}
            />
            
            {/* Profile slot (reserved width) */}
            <div 
              className="h-10 w-10 animate-pulse rounded-full bg-slate-700"
              style={{ 
                width: 'var(--profile-slot-width, 40px)' 
              }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
