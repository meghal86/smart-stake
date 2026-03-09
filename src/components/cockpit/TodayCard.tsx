/**
 * Today Card Component
 * 
 * Implements deterministic state rendering based on server-provided kind.
 * Displays exactly 1 anchor metric, 1 context line, 1 primary CTA.
 * Header chrome (demo pill, insights icon) does NOT count as anchor/context/CTA.
 * 
 * Performance optimizations:
 * - Memoized to prevent unnecessary re-renders
 * - Optimized animations for 60fps
 * - Lazy loading of non-critical elements
 * - Reduced DOM complexity
 * 
 * Requirements: 3.1, 3.2, 3.6, 14.1, 14.2, 14.3
 */

import React, { memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Settings, AlertTriangle, Shield, CheckCircle, Calendar, TrendingUp } from 'lucide-react';
import { TodayCard as TodayCardType, TodayCardKind } from '@/lib/cockpit/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRenderPerformance, useFirstMeaningfulPaint } from '@/lib/cockpit/performance';

// ============================================================================
// Types
// ============================================================================

interface TodayCardProps {
  /** Today Card data from server */
  todayCard: TodayCardType;
  /** Whether in demo mode */
  isDemo?: boolean;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Error state */
  error?: string | null;
  /** Callback for insights icon click */
  onInsightsClick?: () => void;
  /** Whether insights launcher should be shown (fallback if chrome unavailable) */
  showInsightsLauncher?: boolean;
}

// ============================================================================
// Icon Mapping
// ============================================================================

const KIND_ICONS: Record<TodayCardKind, React.ComponentType<{ className?: string }>> = {
  onboarding: Shield,
  scan_required: AlertTriangle,
  critical_risk: AlertTriangle,
  pending_actions: Calendar,
  daily_pulse: TrendingUp,
  portfolio_anchor: CheckCircle,
};

// ============================================================================
// Color Mapping
// ============================================================================

const KIND_COLORS: Record<TodayCardKind, {
  bg: string;
  border: string;
  icon: string;
  text: string;
}> = {
  onboarding: {
    bg: 'bg-[#7ea3f2]/10',
    border: 'border-[#7ea3f2]/20',
    icon: 'text-[#bfd0ff]',
    text: 'text-[#f6f2ea]',
  },
  scan_required: {
    bg: 'bg-[#d0a35c]/10',
    border: 'border-[#d0a35c]/20',
    icon: 'text-[#e4c998]',
    text: 'text-[#f6f2ea]',
  },
  critical_risk: {
    bg: 'bg-[#d48080]/10',
    border: 'border-[#d48080]/20',
    icon: 'text-[#e7b0b0]',
    text: 'text-[#f6f2ea]',
  },
  pending_actions: {
    bg: 'bg-[#9b8bd5]/10',
    border: 'border-[#9b8bd5]/20',
    icon: 'text-[#cec3ef]',
    text: 'text-[#f6f2ea]',
  },
  daily_pulse: {
    bg: 'bg-[#88b9d8]/10',
    border: 'border-[#88b9d8]/20',
    icon: 'text-[#c7dce9]',
    text: 'text-[#f6f2ea]',
  },
  portfolio_anchor: {
    bg: 'bg-[#8eb79a]/10',
    border: 'border-[#8eb79a]/20',
    icon: 'text-[#d1e4d6]',
    text: 'text-[#f6f2ea]',
  },
};

// ============================================================================
// Optimized Skeleton Component
// ============================================================================

const TodayCardSkeleton: React.FC = memo(() => (
  <Card className="relative overflow-hidden rounded-[30px] border border-white/8 bg-[#0b0b0c] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.28)]">
    <div className="animate-pulse">
      {/* Header chrome skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-16 h-4 bg-white/10 rounded" />
        <div className="w-6 h-6 bg-white/10 rounded" />
      </div>
      
      {/* Anchor metric skeleton */}
      <div className="w-32 h-8 bg-white/10 rounded mb-2" />
      
      {/* Context line skeleton */}
      <div className="w-48 h-4 bg-white/10 rounded mb-6" />
      
      {/* Primary CTA skeleton */}
      <div className="w-28 h-10 bg-white/10 rounded" />
    </div>
  </Card>
));

TodayCardSkeleton.displayName = 'TodayCardSkeleton';

// ============================================================================
// Optimized Error Component
// ============================================================================

const TodayCardError: React.FC<{ error: string; onRetry?: () => void }> = memo(({ error, onRetry }) => (
  <Card className="relative overflow-hidden rounded-[30px] border border-red-400/20 bg-[#0b0b0c] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.28)]">
    <div className="flex items-center gap-3 mb-4">
      <AlertTriangle className="w-5 h-5 text-red-400" />
      <span className="text-sm text-red-100">Error loading dashboard</span>
    </div>
    
    <div className="text-2xl font-semibold text-white mb-2">
      Unable to load
    </div>
    
    <div className="text-sm text-slate-300 mb-6">
      {error}
    </div>
    
    {onRetry && (
      <Button
        onClick={onRetry}
        variant="outline"
        size="sm"
        className="border-red-500/30 text-red-100 hover:bg-red-500/20"
      >
        Retry
      </Button>
    )}
  </Card>
));

TodayCardError.displayName = 'TodayCardError';

// ============================================================================
// Optimized Main Component
// ============================================================================

export const TodayCard: React.FC<TodayCardProps> = memo(({
  todayCard,
  isDemo = false,
  isLoading = false,
  error = null,
  onInsightsClick,
  showInsightsLauncher = false,
}) => {
  // Performance tracking
  useRenderPerformance('TodayCard');
  useFirstMeaningfulPaint();
  
  // Memoized values for performance
  const colors = useMemo(() => KIND_COLORS[todayCard?.kind || 'daily_pulse'], [todayCard?.kind]);
  const IconComponent = useMemo(() => KIND_ICONS[todayCard?.kind || 'daily_pulse'], [todayCard?.kind]);
  
  // Optimized navigation handlers
  const handlePrimaryClick = useCallback((e?: React.MouseEvent) => {
    // Prevent default link behavior if event is provided
    e?.preventDefault();
    
    if (!todayCard?.primary_cta?.href) {
      console.warn('[TodayCard] No href provided for primary CTA');
      return;
    }
    
    const href = todayCard.primary_cta.href;
    console.log('[TodayCard] Primary CTA clicked, href:', href);
    
    // Check if it's a hash-only navigation (starts with # or ends with #something)
    if (href.startsWith('#')) {
      // Pure hash navigation (e.g., #pulse)
      const hash = href.substring(1);
      console.log('[TodayCard] Setting hash to:', hash);
      
      // Use a more direct approach - set hash and manually trigger event
      const newUrl = `${window.location.pathname}${window.location.search}#${hash}`;
      window.history.pushState(null, '', newUrl);
      
      // Manually dispatch hashchange event
      window.dispatchEvent(new Event('hashchange'));
    } else if (href.includes('#')) {
      // URL with hash (e.g., /cockpit#pulse)
      const [path, hash] = href.split('#');
      const currentPath = window.location.pathname;
      
      console.log('[TodayCard] Path:', path, 'Hash:', hash, 'Current path:', currentPath);
      
      // If we're already on the target path, just change the hash
      if (path === currentPath || path === '') {
        console.log('[TodayCard] Already on target path, setting hash to:', hash);
        
        // Use pushState to set the hash without page reload
        const newUrl = `${window.location.pathname}${window.location.search}#${hash}`;
        window.history.pushState(null, '', newUrl);
        
        // Manually dispatch hashchange event
        window.dispatchEvent(new Event('hashchange'));
      } else {
        // Navigate to different path with hash
        console.log('[TodayCard] Navigating to:', href);
        window.location.href = href;
      }
    } else {
      // Handle regular navigation
      console.log('[TodayCard] Regular navigation to:', href);
      window.location.href = href;
    }
  }, [todayCard?.primary_cta?.href]);
  
  const handleSecondaryClick = useCallback(() => {
    if (!todayCard?.secondary_cta?.href) return;
    
    const href = todayCard.secondary_cta.href;
    if (href.startsWith('#')) {
      const hash = href.substring(1);
      window.location.hash = hash;
      
      window.dispatchEvent(new CustomEvent('hashchange', { 
        detail: { hash, source: 'today-card-secondary' }
      }));
    } else {
      window.location.href = href;
    }
  }, [todayCard?.secondary_cta?.href]);
  
  const handleInsightsClick = useCallback(() => {
    console.log('[TodayCard] Insights button clicked');
    onInsightsClick?.();
  }, [onInsightsClick]);
  
  // Optimized animation variants
  const cardVariants = useMemo(() => ({
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.2, // Reduced from 0.3 for faster animation
        ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smoother animation
      }
    }
  }), []);
  
  // Handle loading state
  if (isLoading) {
    return <TodayCardSkeleton />;
  }
  
  // Handle error state
  if (error) {
    return <TodayCardError error={error} />;
  }
  
  // Early return if no data
  if (!todayCard) {
    return <TodayCardSkeleton />;
  }
  
  const { kind, anchor_metric, context_line, primary_cta, secondary_cta } = todayCard;
  
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      // Disable layout animations for better performance
      layout={false}
    >
      <Card className={`
        relative overflow-hidden rounded-[30px] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.28)]
        bg-[#0b0b0c] border
        ${colors.bg} ${colors.border}
        transition-transform duration-150 hover:scale-[1.01]
        will-change-transform
      `}>
        {/* Header Chrome - Does NOT count as anchor/context/CTA */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Demo Mode Pill - Only render if needed */}
            {isDemo && (
              <Badge 
                variant="outline" 
                className="text-xs border-white/10 text-[#cfc8bd] bg-white/[0.03]"
              >
                Demo Mode
              </Badge>
            )}
          </div>
          
          {/* Insights Icon (fallback launcher) - Only render if needed */}
          {showInsightsLauncher && onInsightsClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleInsightsClick}
              className="w-8 h-8 p-0 hover:bg-white/[0.06] transition-colors duration-150 relative z-10"
              aria-label="Open insights and settings"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-[#cfc8bd]" />
            </Button>
          )}
        </div>
        
        {/* Icon and Anchor Metric */}
        <div className="flex items-center gap-3 mb-2">
          <IconComponent className={`w-6 h-6 ${colors.icon}`} />
          <div className="text-2xl font-semibold text-[#f6f2ea]">
            {anchor_metric}
          </div>
        </div>
        
        {/* Context Line */}
        <div className="text-sm text-[#9c978f] mb-6">
          {context_line}
        </div>
        
        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Primary CTA */}
          <Button
            onClick={handlePrimaryClick}
            className="bg-[#f6f2ea] hover:bg-white text-black transition-colors duration-150"
          >
            {primary_cta.label}
          </Button>
          
          {/* Secondary CTA (optional, text link only) - Only render if exists */}
          {secondary_cta && (
            <Button
              onClick={handleSecondaryClick}
              variant="link"
              className="text-[#cfc8bd] hover:text-[#f6f2ea] p-0 h-auto font-normal cursor-pointer transition-colors duration-150"
            >
              {secondary_cta.label}
            </Button>
          )}
        </div>

        {(primary_cta.label === "Open today's pulse" || secondary_cta?.label === 'Explore Hunter') && (
          <div className="mt-4 flex flex-col gap-2 text-xs text-[#8f8a82] sm:flex-row sm:items-center sm:gap-4">
            {primary_cta.label === "Open today's pulse" ? (
              <span>Daily AI briefing · about 30 seconds</span>
            ) : null}
            {secondary_cta?.label === 'Explore Hunter' ? (
              <span>Explore Hunter · find new opportunities</span>
            ) : null}
          </div>
        )}
        
        {/* Background decoration - Optimized with transform3d for GPU acceleration */}
        <div 
          className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none"
          style={{ transform: 'translate3d(0, 0, 0)' }}
        >
          <IconComponent className="w-full h-full" />
        </div>
      </Card>
    </motion.div>
  );
});

TodayCard.displayName = 'TodayCard';

export default TodayCard;
