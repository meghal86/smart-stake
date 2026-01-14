'use client';

import { useEffect, useState, useRef } from 'react';
import { X, Calendar, Clock, TrendingUp, Shield, Zap, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PulsePayload, PulseRow, PulseCategory } from '@/lib/cockpit/pulse-generator';

// ============================================================================
// Types
// ============================================================================

interface PulseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  pulseData: PulsePayload | null;
  isLoading?: boolean;
  error?: string | null;
  isDemo?: boolean;
}

// ============================================================================
// Category Icons and Colors
// ============================================================================

const getCategoryIcon = (category: PulseCategory) => {
  switch (category) {
    case 'expiring_opportunity':
      return Clock;
    case 'new_opportunity':
    case 'updated_opportunity':
      return TrendingUp;
    case 'portfolio_delta':
      return Zap;
    case 'guardian_delta':
      return Shield;
    case 'proof_receipt':
      return FileText;
    default:
      return Calendar;
  }
};

const getCategoryColor = (category: PulseCategory) => {
  switch (category) {
    case 'expiring_opportunity':
      return 'text-red-400';
    case 'new_opportunity':
      return 'text-green-400';
    case 'updated_opportunity':
      return 'text-blue-400';
    case 'portfolio_delta':
      return 'text-yellow-400';
    case 'guardian_delta':
      return 'text-purple-400';
    case 'proof_receipt':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
};

// ============================================================================
// Demo Data
// ============================================================================

const getDemoPulseData = (): PulsePayload => ({
  pulse_date: new Date().toISOString().split('T')[0],
  timezone: 'America/New_York',
  rows: [
    {
      kind: 'expiring_opportunity',
      title: 'Arbitrum quest ends in 8h',
      chip: '8h left',
      cta: { label: 'Open', href: '#demo' },
      provenance: 'confirmed',
      event_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      priority: -8,
    },
    {
      kind: 'new_opportunity',
      title: 'New DeFi yield opportunity detected',
      chip: 'New',
      cta: { label: 'View', href: '#demo' },
      provenance: 'simulated',
      event_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      priority: Date.now() - 1 * 60 * 60 * 1000,
    },
    {
      kind: 'portfolio_delta',
      title: 'ETH position increased by 15%',
      cta: { label: 'View', href: '#demo' },
      provenance: 'confirmed',
      event_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      priority: 2,
    },
    {
      kind: 'guardian_delta',
      title: 'New approval detected: Uniswap V3',
      chip: 'High',
      cta: { label: 'Review', href: '#demo' },
      provenance: 'confirmed',
      event_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      priority: 2,
    },
  ],
  generated_at: new Date().toISOString(),
});

// ============================================================================
// Pulse Row Component
// ============================================================================

interface PulseRowComponentProps {
  row: PulseRow;
  isDemo?: boolean;
  onClick: () => void;
}

const PulseRowComponent = ({ row, isDemo, onClick }: PulseRowComponentProps) => {
  const Icon = getCategoryIcon(row.kind);
  const iconColor = getCategoryColor(row.kind);
  
  const formatEventTime = (eventTime: string) => {
    const date = new Date(eventTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return 'Just now';
    }
  };

  const handleClick = () => {
    if (isDemo) {
      // In demo mode, show tooltip or do nothing
      return;
    }
    onClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <motion.div
      className={`
        group relative p-4 rounded-lg border border-white/10 
        bg-white/5 backdrop-blur-sm hover:bg-white/10 
        transition-all duration-200 cursor-pointer
        ${isDemo ? 'opacity-75' : ''}
      `}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${row.title} - ${row.cta.label}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${iconColor}`}>
          <Icon size={20} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-white font-medium text-sm leading-tight">
              {row.title}
            </h3>
            
            {/* Chip */}
            {row.chip && (
              <span className={`
                flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full
                ${row.kind === 'expiring_opportunity' 
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : row.kind === 'new_opportunity'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }
              `}>
                {row.chip}
              </span>
            )}
          </div>
          
          {/* Metadata */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span>{formatEventTime(row.event_time)}</span>
            <span className="capitalize">{row.provenance}</span>
          </div>
        </div>
      </div>
      
      {/* Demo overlay */}
      {isDemo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-white bg-black/60 px-2 py-1 rounded">
            Demo
          </span>
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const PulseSheet = ({ 
  isOpen, 
  onClose, 
  pulseData, 
  isLoading = false, 
  error = null,
  isDemo = false 
}: PulseSheetProps) => {
  const [focusedElementBeforeOpen, setFocusedElementBeforeOpen] = useState<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Store focus before opening and restore on close
  useEffect(() => {
    if (isOpen) {
      setFocusedElementBeforeOpen(document.activeElement as HTMLElement);
      // Focus the close button when sheet opens
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    } else if (focusedElementBeforeOpen) {
      // Restore focus to the element that opened the sheet
      focusedElementBeforeOpen.focus();
      setFocusedElementBeforeOpen(null);
    }
  }, [isOpen, focusedElementBeforeOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !sheetRef.current) return;

    const sheet = sheetRef.current;
    const focusableElements = sheet.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  // Handle swipe down on mobile (simplified)
  useEffect(() => {
    if (!isOpen || !sheetRef.current) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      isDragging = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      
      // Only allow downward swipes and only if at the top of the sheet
      if (deltaY > 0 && sheetRef.current?.scrollTop === 0) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      
      const deltaY = currentY - startY;
      // Close if swiped down more than 100px
      if (deltaY > 100) {
        onClose();
      }
    };

    const sheet = sheetRef.current;
    sheet.addEventListener('touchstart', handleTouchStart, { passive: false });
    sheet.addEventListener('touchmove', handleTouchMove, { passive: false });
    sheet.addEventListener('touchend', handleTouchEnd);

    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart);
      sheet.removeEventListener('touchmove', handleTouchMove);
      sheet.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, onClose]);

  // Get pulse data (demo or real)
  const displayData = isDemo ? getDemoPulseData() : pulseData;

  const handleRowClick = (row: PulseRow) => {
    if (isDemo) return;
    
    // Navigate to the row's href
    if (row.cta.href.startsWith('#')) {
      // Handle hash navigation
      window.location.hash = row.cta.href.substring(1);
    } else {
      // Handle regular navigation
      window.location.href = row.cta.href;
    }
  };

  const formatPulseDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pulse-sheet-title"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-white/10">
              <div className="flex items-center justify-between p-4">
                <div>
                  <h1 id="pulse-sheet-title" className="text-xl font-semibold text-white">
                    Daily Pulse
                  </h1>
                  {displayData && (
                    <p className="text-sm text-gray-400 mt-1">
                      {formatPulseDate(displayData.pulse_date)}
                    </p>
                  )}
                </div>
                
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Close pulse sheet"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 pb-8">
              {/* Demo Mode Banner */}
              {isDemo && (
                <div className="mb-6 p-3 rounded-lg bg-blue-500/20 border border-blue-500/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm text-blue-300 font-medium">Demo Mode</span>
                  </div>
                  <p className="text-xs text-blue-200 mt-1">
                    This is sample pulse data. Connect your wallet to see real insights.
                  </p>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-white/5 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div className="text-center py-8">
                  <div className="text-red-400 mb-2">Failed to load pulse data</div>
                  <div className="text-sm text-gray-400">{error}</div>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && displayData && displayData.rows.length === 0 && (
                <div className="text-center py-12">
                  <Calendar size={48} className="text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Quiet Day</h3>
                  <p className="text-gray-400 mb-6">
                    No new activity since your last visit. Check back later for updates.
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => !isDemo && (window.location.href = '/hunter')}
                      className="block w-full px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      disabled={isDemo}
                    >
                      Explore Hunter opportunities
                    </button>
                    <button
                      onClick={() => !isDemo && (window.location.href = '/alerts')}
                      className="block w-full px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      disabled={isDemo}
                    >
                      Create alert rules
                    </button>
                  </div>
                </div>
              )}

              {/* Pulse Rows */}
              {!isLoading && !error && displayData && displayData.rows.length > 0 && (
                <div className="space-y-3">
                  {displayData.rows.map((row, index) => (
                    <PulseRowComponent
                      key={`${row.kind}-${index}`}
                      row={row}
                      isDemo={isDemo}
                      onClick={() => handleRowClick(row)}
                    />
                  ))}
                </div>
              )}

              {/* Footer */}
              {displayData && displayData.rows.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-xs text-gray-500 text-center">
                    Generated at {new Date(displayData.generated_at).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};