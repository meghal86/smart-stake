/**
 * Heartbeat Dot - Living pulse indicator for live data
 */

import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/telemetry';
import { useEffect } from 'react';

interface HeartbeatDotProps {
  isLive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HeartbeatDot({ isLive = true, size = 'sm', className = '' }: HeartbeatDotProps) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3', 
    lg: 'w-4 h-4'
  };

  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        trackEvent('heartbeat_pulsed', { timestamp: Date.now() });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  if (!isLive) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-slate-400 ${className}`} />
    );
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} rounded-full bg-emerald-500 ${className}`}
      animate={!reducedMotion ? {
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7]
      } : {}}
      transition={!reducedMotion ? {
        duration: 1,
        repeat: Infinity,
        ease: [0.4, 0, 0.2, 1]
      } : { duration: 0 }}
    />
  );
}