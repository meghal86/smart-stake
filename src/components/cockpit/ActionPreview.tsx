/**
 * Action Preview Component
 * 
 * Displays top 3 ranked executable actions with:
 * - 3-row maximum constraint
 * - Lane indicators, impact chips (max 2), provenance chips
 * - Provenance gating display (heuristic → Review only)
 * - Client MUST render in server-provided order (no re-ranking)
 * - Call POST /api/cockpit/actions/rendered after render
 * 
 * Requirements: 5.1, 5.2, 5.6, 5.7
 */

import React, { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  TrendingUp, 
  Eye, 
  Clock, 
  DollarSign, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { Action, ActionLane, CTAKind, ImpactChipKind } from '@/lib/cockpit/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// Types
// ============================================================================

interface ActionPreviewProps {
  /** Actions from server (max 3, pre-ranked) */
  actions: Action[];
  /** Whether in demo mode */
  isDemo?: boolean;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Error state */
  error?: string | null;
  /** Callback for "See all signals" */
  onSeeAllClick?: () => void;
}

// ============================================================================
// Lane Configuration
// ============================================================================

const LANE_CONFIG: Record<ActionLane, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  Protect: {
    icon: Shield,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
  Earn: {
    icon: TrendingUp,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  Watch: {
    icon: Eye,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
};

// ============================================================================
// Impact Chip Configuration
// ============================================================================

const IMPACT_CHIP_CONFIG: Record<ImpactChipKind, {
  icon: React.ComponentType<{ className?: string }>;
  format: (value: number) => string;
  color: string;
}> = {
  risk_delta: {
    icon: AlertTriangle,
    format: (value) => value > 0 ? `+${value}` : `${value}`,
    color: 'text-red-400',
  },
  gas_est_usd: {
    icon: Zap,
    format: (value) => `$${value.toFixed(2)}`,
    color: 'text-amber-400',
  },
  time_est_sec: {
    icon: Clock,
    format: (value) => {
      if (value < 60) return `${value}s`;
      if (value < 3600) return `${Math.round(value / 60)}m`;
      return `${Math.round(value / 3600)}h`;
    },
    color: 'text-blue-400',
  },
  upside_est_usd: {
    icon: DollarSign,
    format: (value) => `$${value.toLocaleString()}`,
    color: 'text-green-400',
  },
};

// ============================================================================
// Provenance Configuration
// ============================================================================

const PROVENANCE_CONFIG = {
  confirmed: {
    icon: CheckCircle,
    label: 'Confirmed',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  simulated: {
    icon: HelpCircle,
    label: 'Simulated',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  heuristic: {
    icon: AlertTriangle,
    label: 'Estimated',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
};

// ============================================================================
// CTA Configuration
// ============================================================================

const CTA_CONFIG: Record<CTAKind, {
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  color: string;
}> = {
  Fix: {
    variant: 'destructive',
    color: 'bg-red-600 hover:bg-red-700',
  },
  Execute: {
    variant: 'default',
    color: 'bg-green-600 hover:bg-green-700',
  },
  Review: {
    variant: 'outline',
    color: 'border-white/20 text-white hover:bg-white/10',
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calls the rendered endpoint to track shown actions
 */
const trackRenderedActions = async (actions: Action[]) => {
  if (actions.length === 0) return;
  
  try {
    const dedupeKeys = actions.map(action => 
      `${action.source.kind}:${action.source.ref_id}:${action.cta.kind}`
    );
    
    await fetch('/api/cockpit/actions/rendered', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dedupe_keys: dedupeKeys }),
      credentials: 'include',
    });
  } catch (error) {
    console.warn('Failed to track rendered actions:', error);
  }
};

// ============================================================================
// Sub-Components
// ============================================================================

const ActionRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4 animate-pulse">
    <div className="w-8 h-8 bg-white/10 rounded" />
    <div className="flex-1">
      <div className="w-48 h-4 bg-white/10 rounded mb-2" />
      <div className="flex gap-2">
        <div className="w-16 h-3 bg-white/10 rounded" />
        <div className="w-20 h-3 bg-white/10 rounded" />
      </div>
    </div>
    <div className="w-20 h-8 bg-white/10 rounded" />
  </div>
);

const ActionPreviewSkeleton: React.FC = () => (
  <Card className="bg-white/5 backdrop-blur-md border border-white/10 p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="w-32 h-5 bg-white/10 rounded animate-pulse" />
      <div className="w-24 h-4 bg-white/10 rounded animate-pulse" />
    </div>
    <div className="space-y-2">
      <ActionRowSkeleton />
      <ActionRowSkeleton />
      <ActionRowSkeleton />
    </div>
  </Card>
);

const ActionPreviewError: React.FC<{ error: string }> = ({ error }) => (
  <Card className="bg-red-500/10 backdrop-blur-md border border-red-500/20 p-6">
    <div className="flex items-center gap-3 mb-4">
      <AlertTriangle className="w-5 h-5 text-red-400" />
      <span className="text-sm text-red-100">Error loading actions</span>
    </div>
    <div className="text-sm text-slate-300">
      {error}
    </div>
  </Card>
);

const EmptyActionPreview: React.FC<{ onSeeAllClick?: () => void }> = ({ onSeeAllClick }) => (
  <Card className="bg-white/5 backdrop-blur-md border border-white/10 p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-white">Action Preview</h3>
    </div>
    <div className="text-center py-8">
      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
      <div className="text-white font-medium mb-2">All clear!</div>
      <div className="text-sm text-slate-300 mb-4">
        No urgent actions require your attention right now.
      </div>
      {onSeeAllClick && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSeeAllClick}
          className="border-white/20 text-white hover:bg-white/10"
        >
          Explore all signals
        </Button>
      )}
    </div>
  </Card>
);

const ImpactChip: React.FC<{ chip: Action['impact_chips'][0] }> = ({ chip }) => {
  const config = IMPACT_CHIP_CONFIG[chip.kind];
  const IconComponent = config.icon;
  
  return (
    <div className="flex items-center gap-1 text-xs">
      <IconComponent className={`w-3 h-3 ${config.color}`} />
      <span className="text-slate-300">
        {config.format(chip.value)}
      </span>
    </div>
  );
};

const ProvenanceChip: React.FC<{ provenance: Action['provenance'] }> = ({ provenance }) => {
  const config = PROVENANCE_CONFIG[provenance];
  const IconComponent = config.icon;
  
  return (
    <Badge 
      variant="outline" 
      className={`text-xs ${config.color} ${config.bgColor} border-current/20`}
    >
      <IconComponent className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};

const ActionRow: React.FC<{ 
  action: Action; 
  isDemo: boolean;
  index: number;
}> = ({ action, isDemo, index }) => {
  const laneConfig = LANE_CONFIG[action.lane];
  const ctaConfig = CTA_CONFIG[action.cta.kind];
  const LaneIcon = laneConfig.icon;
  
  // Determine if CTA should be disabled in demo mode
  const isCtaDisabled = isDemo && (action.cta.kind === 'Fix' || action.cta.kind === 'Execute');
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={`
        flex items-center gap-4 p-4 rounded-lg border transition-all duration-200
        ${laneConfig.bgColor} ${laneConfig.borderColor}
        hover:bg-white/5 hover:border-white/20
      `}
    >
      {/* Lane Indicator */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${laneConfig.bgColor} flex items-center justify-center`}>
        <LaneIcon className={`w-4 h-4 ${laneConfig.color}`} />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <div className="text-white font-medium mb-1 truncate">
          {action.title}
        </div>
        
        {/* Chips Row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Impact Chips (max 2) */}
          {action.impact_chips.slice(0, 2).map((chip, idx) => (
            <ImpactChip key={idx} chip={chip} />
          ))}
          
          {/* Provenance Chip */}
          <ProvenanceChip provenance={action.provenance} />
        </div>
      </div>
      
      {/* CTA */}
      <div className="flex-shrink-0">
        {isCtaDisabled ? (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-white/20 text-white/50 cursor-not-allowed"
            title="Demo mode - action disabled"
          >
            {action.cta.kind}
          </Button>
        ) : (
          <Button
            asChild
            variant={ctaConfig.variant}
            size="sm"
            className={action.cta.kind === 'Review' ? ctaConfig.color : ''}
          >
            <a href={action.cta.href} className="flex items-center gap-1">
              {action.cta.kind}
              <ChevronRight className="w-3 h-3" />
            </a>
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const ActionPreview: React.FC<ActionPreviewProps> = ({
  actions,
  isDemo = false,
  isLoading = false,
  error = null,
  onSeeAllClick,
}) => {
  // Track rendered actions after component mounts and actions are displayed
  const trackActions = useCallback(() => {
    if (actions.length > 0 && !isDemo) {
      trackRenderedActions(actions);
    }
  }, [actions, isDemo]);
  
  useEffect(() => {
    trackActions();
  }, [trackActions]);
  
  // Handle loading state
  if (isLoading) {
    return <ActionPreviewSkeleton />;
  }
  
  // Handle error state
  if (error) {
    return <ActionPreviewError error={error} />;
  }
  
  // Handle empty state
  if (actions.length === 0) {
    return <EmptyActionPreview onSeeAllClick={onSeeAllClick} />;
  }
  
  // Enforce 3-row maximum constraint
  const displayActions = actions.slice(0, 3);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="bg-white/5 backdrop-blur-md border border-white/10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Action Preview</h3>
          {onSeeAllClick && (
            <Button
              variant="link"
              size="sm"
              onClick={onSeeAllClick}
              className="text-cyan-400 hover:text-cyan-300 p-0 h-auto"
            >
              See all signals
            </Button>
          )}
        </div>
        
        {/* Action Rows - Client MUST render in server-provided order */}
        <div className="space-y-2">
          {displayActions.map((action, index) => (
            <ActionRow
              key={action.id}
              action={action}
              isDemo={isDemo}
              index={index}
            />
          ))}
        </div>
        
        {/* Footer note if actions were truncated */}
        {actions.length > 3 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-xs text-slate-400 text-center">
              Showing top 3 of {actions.length} actions
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default ActionPreview;