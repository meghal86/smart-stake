/**
 * ExpandableCard Component
 * 
 * Reusable card component with progressive disclosure functionality.
 * Shows key information first with expandable details on demand.
 * 
 * Validates: R12.DISCLOSURE.EXPANDABLE_CARDS, R12.DISCLOSURE.SMOOTH_ANIMATIONS
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgressiveDisclosure } from '@/lib/ux/ProgressiveDisclosure';

export interface ExpandableCardProps {
  /** Unique identifier for the card */
  id: string;
  /** Content always visible (key information) */
  children: React.ReactNode;
  /** Content shown when expanded (detailed information) */
  expandedContent: React.ReactNode;
  /** Optional header content */
  header?: React.ReactNode;
  /** Whether to show expand/collapse button */
  showToggleButton?: boolean;
  /** Custom toggle button content */
  toggleButton?: React.ReactNode;
  /** Whether to auto-collapse other cards when this expands */
  autoCollapse?: boolean;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Additional CSS classes */
  className?: string;
  /** Callback when expansion state changes */
  onStateChange?: (isExpanded: boolean) => void;
  /** Whether the card is initially expanded */
  defaultExpanded?: boolean;
}

export function ExpandableCard({
  id,
  children,
  expandedContent,
  header,
  showToggleButton = true,
  toggleButton,
  autoCollapse = false,
  duration = 300,
  className,
  onStateChange,
  defaultExpanded = false
}: ExpandableCardProps) {
  const disclosure = useProgressiveDisclosure(id, {
    duration,
    autoCollapse,
    maintainScrollPosition: true,
    onStateChange
  });

  // Set initial state if defaultExpanded
  React.useEffect(() => {
    if (defaultExpanded && !disclosure.state.isExpanded) {
      disclosure.expand();
    }
  }, [defaultExpanded, disclosure]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    disclosure.toggle();
  };

  return (
    <motion.div
      ref={disclosure.contentRef}
      className={cn(
        'bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700',
        'shadow-sm hover:shadow-md transition-shadow duration-200',
        className
      )}
      layout
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Header */}
      {header && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          {header}
        </div>
      )}

      {/* Main Content */}
      <div className="px-6 py-4">
        {/* Always visible content */}
        <div className="space-y-4">
          {children}
          
          {/* Toggle Button */}
          {showToggleButton && (
            <div className="flex justify-center pt-2">
              {toggleButton ? (
                React.cloneElement(toggleButton as React.ReactElement, {
                  onClick: handleToggle,
                  'aria-expanded': disclosure.state.isExpanded,
                  'aria-controls': `expandable-content-${id}`
                })
              ) : (
                <motion.button
                  onClick={handleToggle}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium',
                    'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300',
                    'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30',
                    'rounded-lg transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  aria-expanded={disclosure.state.isExpanded}
                  aria-controls={`expandable-content-${id}`}
                >
                  <span>
                    {disclosure.state.isExpanded ? 'Show Less' : 'See Details'}
                  </span>
                  <motion.div
                    animate={{ rotate: disclosure.state.isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </motion.button>
              )}
            </div>
          )}
        </div>

        {/* Expandable Content */}
        <AnimatePresence mode="wait">
          {disclosure.state.isExpanded && (
            <motion.div
              id={`expandable-content-${id}`}
              ref={disclosure.expandableRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ 
                height: 'auto', 
                opacity: 1,
                transition: {
                  height: { duration: duration / 1000, ease: 'easeOut' },
                  opacity: { duration: (duration * 0.8) / 1000, delay: (duration * 0.2) / 1000, ease: 'easeOut' }
                }
              }}
              exit={{ 
                height: 0, 
                opacity: 0,
                transition: {
                  height: { duration: duration / 1000, ease: 'easeOut' },
                  opacity: { duration: (duration * 0.6) / 1000, ease: 'easeOut' }
                }
              }}
              className="overflow-hidden"
            >
              <div className="pt-6 border-t border-gray-200 dark:border-slate-700 mt-4">
                {expandedContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/**
 * Expandable Card Section
 * 
 * A section within an expandable card for organizing content
 */
export interface ExpandableCardSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function ExpandableCardSection({
  title,
  children,
  className
}: ExpandableCardSectionProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {title && (
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h4>
      )}
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

/**
 * Expandable Card Grid
 * 
 * Container for multiple expandable cards with auto-collapse behavior
 */
export interface ExpandableCardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ExpandableCardGrid({
  children,
  columns = 1,
  gap = 'md',
  className
}: ExpandableCardGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  };

  const gridGap = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  };

  return (
    <div className={cn(
      'grid',
      gridCols[columns],
      gridGap[gap],
      className
    )}>
      {children}
    </div>
  );
}