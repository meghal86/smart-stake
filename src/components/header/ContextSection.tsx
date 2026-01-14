'use client'

import { cn } from '@/lib/utils'
import type { HeaderContext } from '@/lib/header'

export interface ContextSectionProps {
  context: HeaderContext
}

/**
 * ContextSection - Center section of GlobalHeader
 * 
 * Displays page-specific title and subtitle
 * Subtitle hidden on mobile
 * Title truncates rather than pushing action buttons
 */
export function ContextSection({ context }: ContextSectionProps) {
  return (
    <div className="flex min-w-0 flex-col justify-center">
      {/* Title - truncates if too long */}
      <h1
        className={cn(
          'truncate text-base font-semibold text-white',
          'md:text-lg'
        )}
      >
        {context.title}
      </h1>

      {/* Subtitle - hidden on mobile */}
      {context.subtitle && (
        <p
          className={cn(
            'hidden truncate text-sm text-slate-400',
            'md:block'
          )}
        >
          {context.subtitle}
        </p>
      )}
    </div>
  )
}
