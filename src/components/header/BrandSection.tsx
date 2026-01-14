'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * BrandSection - Left section of GlobalHeader
 * 
 * Displays AlphaWhale logo + wordmark
 * Navigates to canonical home route (/) on click
 * Wordmark hidden on mobile (≤430px)
 * Minimum 44px touch target
 * Respects prefers-reduced-motion for hover animations
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
export function BrandSection() {
  return (
    <Link
      href="/"
      className={cn(
        // Flex layout
        'flex items-center gap-3',
        // Minimum touch target (44px height)
        'min-h-[44px] py-2',
        // Hover effect with reduced-motion support
        'transition-transform duration-150 ease-out',
        'hover:scale-105',
        'motion-reduce:transition-none motion-reduce:hover:scale-100',
        // Focus ring
        'rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900'
      )}
      aria-label="Navigate to AlphaWhale home"
    >
      {/* Logo */}
      <img
        src="/hero_logo_512.png"
        alt="AlphaWhale logo"
        className="h-8 w-8"
        width={32}
        height={32}
      />

      {/* Wordmark - hidden on mobile ≤430px */}
      <span
        className={cn(
          'text-lg font-semibold text-white',
          // Hide on mobile (≤430px) - using custom breakpoint
          'hidden min-[431px]:inline'
        )}
        aria-hidden="true"
      >
        AlphaWhale
      </span>
    </Link>
  )
}
