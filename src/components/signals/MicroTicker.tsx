/**
 * MicroTicker - Live status updates under header
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Wifi, AlertTriangle } from 'lucide-react';
import { trackEvent } from '@/lib/telemetry';

interface MicroTickerProps {
  lastUpdate: Date;
  activeWallets: number;
  failedFeeds: number;
}

export function MicroTicker({ lastUpdate, activeWallets, failedFeeds }: MicroTickerProps) {
  const [timeAgo, setTimeAgo] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  useEffect(() => {
    const updateTimeAgo = () => {
      const diff = Date.now() - lastUpdate.getTime();
      const seconds = Math.floor(diff / 1000);
      
      if (seconds < 60) {
        setTimeAgo(`${seconds}s ago`);
      } else {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`${minutes}m ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  useEffect(() => {
    trackEvent('microticker_refreshed', {
      activeWallets,
      failedFeeds,
      lastUpdateMs: Date.now() - lastUpdate.getTime()
    });
  }, [lastUpdate, activeWallets, failedFeeds]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200/40 dark:border-slate-800 py-2"
        >
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Last update {timeAgo}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  <span>{activeWallets} wallets</span>
                </div>
                <span>•</span>
                <div className="text-slate-400">
                  {timezone}
                </div>
                {failedFeeds > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1 text-amber-500">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{failedFeeds} failed feeds</span>
                    </div>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setIsVisible(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}