import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Check } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  threshold: number;
}

export const PullToRefreshIndicator = ({
  isPulling,
  isRefreshing,
  pullDistance,
  threshold,
}: PullToRefreshIndicatorProps) => {
  const progress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;

  return (
    <AnimatePresence>
      {(isPulling || isRefreshing) && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4"
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-white/10 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 border border-white/20">
            {isRefreshing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                </motion.div>
                <span className="text-sm text-white">Refreshing...</span>
              </>
            ) : shouldTrigger ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-sm text-white">Release to refresh</span>
              </>
            ) : (
              <>
                <motion.div
                  style={{ rotate: progress * 180 }}
                >
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                </motion.div>
                <span className="text-sm text-gray-400">Pull to refresh</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
