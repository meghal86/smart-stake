/**
 * Today Card Component
 * 
 * Implements deterministic state rendering based on server-provided kind.
 * Displays exactly 1 anchor metric, 1 context line, 1 primary CTA.
 * Header chrome (demo pill, insights icon) does NOT count as anchor/context/CTA.
 * 
 * Requirements: 3.1, 3.2, 3.6
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Settings, AlertTriangle, Shield, CheckCircle, Calendar, TrendingUp } from 'lucide-react';
import { TodayCard as TodayCardType, TodayCardKind } from '@/lib/cockpit/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: 'text-blue-400',
    text: 'text-blue-100',
  },
  scan_required: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: 'text-amber-400',
    text: 'text-amber-100',
  },
  critical_risk: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: 'text-red-400',
    text: 'text-red-100',
  },
  pending_actions: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    icon: 'text-purple-400',
    text: 'text-purple-100',
  },
  daily_pulse: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    icon: 'text-cyan-400',
    text: 'text-cyan-100',
  },
  portfolio_anchor: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    icon: 'text-green-400',
    text: 'text-green-100',
  },
};

// ============================================================================
// Skeleton Component
// ============================================================================

const TodayCardSkeleton: React.FC = () => (
  <Card className="relative overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 p-6">
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
);

// ============================================================================
// Error Component
// ============================================================================

const TodayCardError: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => (
  <Card className="relative overflow-hidden bg-red-500/10 backdrop-blur-md border border-red-500/20 p-6">
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
);

// ============================================================================
// Main Component
// ============================================================================

export const TodayCard: React.FC<TodayCardProps> = ({
  todayCard,
  isDemo = false,
  isLoading = false,
  error = null,
  onInsightsClick,
  showInsightsLauncher = false,
}) => {
  // Handle loading state
  if (isLoading) {
    return <TodayCardSkeleton />;
  }
  
  // Handle error state
  if (error) {
    return <TodayCardError error={error} />;
  }
  
  const { kind, anchor_metric, context_line, primary_cta, secondary_cta } = todayCard;
  const colors = KIND_COLORS[kind];
  const IconComponent = KIND_ICONS[kind];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`
        relative overflow-hidden backdrop-blur-md p-6
        ${colors.bg} ${colors.border}
        transition-all duration-200 hover:scale-[1.01]
      `}>
        {/* Header Chrome - Does NOT count as anchor/context/CTA */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Demo Mode Pill */}
            {isDemo && (
              <Badge 
                variant="outline" 
                className="text-xs border-white/20 text-white/70 bg-white/5"
              >
                Demo Mode
              </Badge>
            )}
          </div>
          
          {/* Insights Icon (fallback launcher) */}
          {showInsightsLauncher && onInsightsClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onInsightsClick}
              className="w-8 h-8 p-0 hover:bg-white/10"
              aria-label="Open insights and settings"
            >
              <Settings className="w-4 h-4 text-white/70" />
            </Button>
          )}
        </div>
        
        {/* Icon and Anchor Metric */}
        <div className="flex items-center gap-3 mb-2">
          <IconComponent className={`w-6 h-6 ${colors.icon}`} />
          <div className="text-2xl font-semibold text-white">
            {anchor_metric}
          </div>
        </div>
        
        {/* Context Line */}
        <div className="text-sm text-slate-300 mb-6">
          {context_line}
        </div>
        
        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Primary CTA */}
          <Button
            asChild
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <a href={primary_cta.href}>
              {primary_cta.label}
            </a>
          </Button>
          
          {/* Secondary CTA (optional, text link only) */}
          {secondary_cta && (
            <Button
              asChild
              variant="link"
              className="text-white/70 hover:text-white p-0 h-auto font-normal"
            >
              <a href={secondary_cta.href}>
                {secondary_cta.label}
              </a>
            </Button>
          )}
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
          <IconComponent className="w-full h-full" />
        </div>
      </Card>
    </motion.div>
  );
};

export default TodayCard;