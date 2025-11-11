/**
 * Protocol Logo Component
 * 
 * Displays protocol logo with fallback to initials avatar.
 * Optimized with lazy loading and image proxy (Requirement 1.1-1.6)
 * 
 * Requirements:
 * - 5.16: Logo fallback with initials avatar
 * - 9.1: AA contrast standards
 * - 1.6: Image optimization with lazy loading
 */

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ProtocolLogoProps {
  name: string;
  logo: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Memoized for performance
export const ProtocolLogo = React.memo(function ProtocolLogo({
  name,
  logo,
  size = 'md',
  className,
}: ProtocolLogoProps) {
  const [imageError, setImageError] = useState(false);

  // Generate initials from protocol name
  const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  // Generate deterministic color from name
  const getAvatarColor = (name: string): string => {
    const colors = [
      'bg-emerald-500 text-white',
      'bg-blue-500 text-white',
      'bg-purple-500 text-white',
      'bg-pink-500 text-white',
      'bg-orange-500 text-white',
      'bg-cyan-500 text-white',
      'bg-indigo-500 text-white',
      'bg-rose-500 text-white',
    ];
    
    // Simple hash function for deterministic color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const sizePixels = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  const initials = getInitials(name);
  const avatarColor = getAvatarColor(name);

  // Use image proxy for optimization (Requirement 1.6)
  const optimizedLogo = logo.startsWith('http')
    ? `/api/img?src=${encodeURIComponent(logo)}&w=${sizePixels[size]}&h=${sizePixels[size]}&fit=cover&format=webp`
    : logo;

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {!imageError && (
        <AvatarImage
          src={optimizedLogo}
          alt={`${name} logo`}
          onError={() => setImageError(true)}
          loading="lazy"
          width={sizePixels[size]}
          height={sizePixels[size]}
        />
      )}
      <AvatarFallback
        className={cn(
          'font-semibold',
          avatarColor
        )}
        aria-label={`${name} initials: ${initials}`}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
});
