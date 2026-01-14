'use client'

import { User, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { ProfileDropdownProps } from '@/types/header'

/**
 * ProfileDropdown - User profile dropdown menu
 * 
 * Displays user avatar with dropdown menu containing:
 * - Profile action
 * - Settings action
 * - Sign Out action
 * 
 * Security features:
 * - Only displays emailMasked (never raw email)
 * - Avatar sanitization via Radix Avatar component
 * - Fallback to initials if avatar fails to load
 * 
 * Accessibility:
 * - ARIA labels on all interactive elements
 * - Full keyboard navigation support
 * - Screen reader announcements for state changes
 */
export function ProfileDropdown({
  user,
  onProfileClick,
  onSettingsClick,
  onSignOutClick,
  className,
}: ProfileDropdownProps) {
  // Generate initials from displayName or email
  const getInitials = (): string => {
    if (user.displayName) {
      const parts = user.displayName.trim().split(' ')
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return user.displayName.substring(0, 2).toUpperCase()
    }
    
    if (user.emailMasked) {
      return user.emailMasked.substring(0, 2).toUpperCase()
    }
    
    return 'U'
  }

  // Sanitize avatar URL - only allow https URLs
  const getSafeAvatarUrl = (): string | undefined => {
    if (!user.avatarUrl) return undefined
    
    try {
      const url = new URL(user.avatarUrl)
      // Only allow https protocol for security
      if (url.protocol === 'https:') {
        return user.avatarUrl
      }
    } catch {
      // Invalid URL, return undefined
    }
    
    return undefined
  }

  const safeAvatarUrl = getSafeAvatarUrl()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full',
          'transition-all duration-150 hover:ring-2 hover:ring-cyan-500/50',
          'focus:outline-none focus:ring-2 focus:ring-cyan-500',
          className
        )}
        aria-label="Open user menu"
      >
        <Avatar className="h-10 w-10">
          {safeAvatarUrl && (
            <AvatarImage
              src={safeAvatarUrl}
              alt={user.displayName || 'User avatar'}
            />
          )}
          <AvatarFallback className="bg-slate-700 text-slate-200 text-sm font-medium">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className={cn(
          'w-56 bg-slate-800 border-slate-700',
          'text-slate-200'
        )}
        sideOffset={8}
      >
        {/* User info header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            {user.displayName && (
              <p className="text-sm font-medium leading-none text-slate-100">
                {user.displayName}
              </p>
            )}
            {user.emailMasked && (
              <p className="text-xs leading-none text-slate-400">
                {user.emailMasked}
              </p>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-slate-700" />

        {/* Profile action */}
        <DropdownMenuItem
          onClick={onProfileClick}
          className={cn(
            'cursor-pointer',
            'focus:bg-slate-700 focus:text-slate-100',
            'hover:bg-slate-700 hover:text-slate-100'
          )}
          aria-label="View profile"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        {/* Settings action */}
        <DropdownMenuItem
          onClick={onSettingsClick}
          className={cn(
            'cursor-pointer',
            'focus:bg-slate-700 focus:text-slate-100',
            'hover:bg-slate-700 hover:text-slate-100'
          )}
          aria-label="Open settings"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-slate-700" />

        {/* Sign out action */}
        <DropdownMenuItem
          onClick={onSignOutClick}
          className={cn(
            'cursor-pointer text-red-400',
            'focus:bg-slate-700 focus:text-red-300',
            'hover:bg-slate-700 hover:text-red-300'
          )}
          aria-label="Sign out"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
