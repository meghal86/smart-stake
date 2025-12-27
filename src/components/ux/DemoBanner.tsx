/**
 * Demo Banner Component
 * 
 * Persistent banner that appears across all pages when in demo mode.
 * Provides clear indication of demo mode and CTA to connect wallet for live data.
 * 
 * Requirements: R3.DEMO.BANNER_PERSISTENT, R3.DEMO.AUTO_SWITCHING
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X } from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useDemoMode } from '@/lib/ux/DemoModeManager';
import { toast } from 'sonner';

export interface DemoBannerProps {
  /**
   * Whether to allow dismissing the banner temporarily
   * @default false
   */
  dismissible?: boolean;
  
  /**
   * Position of the banner
   * @default 'top'
   */
  position?: 'top' | 'bottom';
  
  /**
   * Custom className for styling
   */
  className?: string;
  
  /**
   * Callback when user exits demo mode
   */
  onExitDemo?: () => void;
}

/**
 * Demo Banner Component
 * 
 * Shows a persistent banner when in demo mode with a CTA to connect wallet.
 * Automatically appears/disappears based on demo mode state.
 */
export const DemoBanner: React.FC<DemoBannerProps> = ({
  dismissible = false,
  position = 'top',
  className = ''
}) => {
  const { 
    isDemo, 
    bannerVisible, 
    bannerMessage, 
    bannerCTA, 
    reason,
    refreshDataSources 
  } = useDemoMode();
  const { openConnectModal } = useConnectModal();
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Reset dismissed state when demo mode changes
  React.useEffect(() => {
    if (!isDemo) {
      setIsDismissed(false);
    }
  }, [isDemo]);

  const handleCTAClick = async () => {
    if (reason === 'wallet_not_connected') {
      // Open wallet connection modal
      if (openConnectModal) {
        openConnectModal();
      } else {
        toast.error('Wallet connection not available');
      }
    } else if (reason === 'data_sources_unavailable') {
      // Retry data source validation
      toast.info('Checking live data availability...');
      await refreshDataSources();
      toast.success('Data sources refreshed');
    } else {
      // User preference - just refresh
      await refreshDataSources();
    }
  };

  const handleDismiss = () => {
    if (dismissible) {
      setIsDismissed(true);
      toast.info('Demo banner hidden. Refresh page to show again.');
    }
  };

  // Don't show banner if not in demo mode, not visible, or dismissed
  const shouldShow = isDemo && bannerVisible && !isDismissed;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: position === 'top' ? -50 : 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === 'top' ? -50 : 50 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`
            fixed ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 z-50
            bg-gradient-to-r from-blue-600 to-cyan-600
            border-b ${position === 'top' ? 'border-blue-500/20' : 'border-t border-blue-500/20'}
            shadow-lg
            ${className}
          `}
          role="banner"
          aria-label="Demo mode notification"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Icon + Message */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Info 
                  className="w-5 h-5 text-white flex-shrink-0" 
                  aria-hidden="true"
                />
                <p className="text-white text-sm md:text-base font-medium truncate">
                  {bannerMessage}
                </p>
              </div>

              {/* Right: CTA + Dismiss */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* CTA Button */}
                <button
                  onClick={handleCTAClick}
                  className="
                    px-4 py-2
                    bg-white text-blue-600
                    rounded-lg
                    text-sm font-semibold
                    hover:bg-blue-50
                    active:scale-98
                    transition-all duration-150
                    focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600
                    whitespace-nowrap
                  "
                  aria-label={bannerCTA}
                >
                  {bannerCTA}
                </button>

                {/* Dismiss Button (if dismissible) */}
                {dismissible && (
                  <button
                    onClick={handleDismiss}
                    className="
                      p-2
                      text-white/80 hover:text-white
                      rounded-lg
                      hover:bg-white/10
                      active:scale-95
                      transition-all duration-150
                      focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600
                    "
                    aria-label="Dismiss demo banner"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Demo Banner Spacer
 * 
 * Adds spacing to prevent content from being hidden behind the fixed banner.
 * Use this at the top of your page content when the banner is positioned at the top.
 */
export const DemoBannerSpacer: React.FC<{ position?: 'top' | 'bottom' }> = ({ 
  position = 'top' 
}) => {
  const { isDemo, bannerVisible } = useDemoMode();
  const shouldShow = isDemo && bannerVisible;

  if (!shouldShow) {
    return null;
  }

  return (
    <div 
      className={position === 'top' ? 'h-14' : 'h-14'}
      aria-hidden="true"
    />
  );
};