/**
 * APIFailureFallback Empty State
 * Displayed when API requests fail
 */

import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface APIFailureFallbackProps {
  onRetry?: () => void;
  errorMessage?: string;
  isRetrying?: boolean;
  className?: string;
}

export function APIFailureFallback({
  onRetry,
  errorMessage = 'Unable to load harvest opportunities',
  isRetrying = false,
  className,
}: APIFailureFallbackProps) {
  return (
    <motion.div
      className={cn(
        'rounded-2xl border-2 p-8 text-center',
        'bg-gradient-to-br from-[rgba(239,68,68,0.1)] to-[rgba(239,68,68,0.05)]',
        'border-[rgba(239,68,68,0.3)]',
        'backdrop-blur-md',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Error Icon */}
      <motion.div
        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(239,68,68,0.2)] mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      >
        <AlertCircle className="w-8 h-8 text-red-400" />
      </motion.div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-white mb-2">
        Connection Error
      </h3>

      {/* Error Message */}
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        {errorMessage}. Please check your connection and try again.
      </p>

      {/* Retry Button */}
      {onRetry && (
        <motion.button
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ed8f2d] to-[#B8722E] text-white font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={!isRetrying ? { scale: 1.05 } : {}}
          whileTap={!isRetrying ? { scale: 0.95 } : {}}
        >
          <RefreshCw className={cn('w-5 h-5', isRetrying && 'animate-spin')} />
          {isRetrying ? 'Retrying...' : 'Retry'}
        </motion.button>
      )}

      {/* Troubleshooting Tips */}
      <div className="mt-8 pt-6 border-t border-red-500/20">
        <p className="text-sm font-semibold text-gray-300 mb-3">
          Troubleshooting Tips:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left max-w-2xl mx-auto">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <WifiOff className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-300">Check Connection</p>
              <p className="text-xs text-gray-500 mt-1">
                Ensure you have a stable internet connection
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <RefreshCw className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-300">Refresh Page</p>
              <p className="text-xs text-gray-500 mt-1">
                Try refreshing your browser
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-300">Service Status</p>
              <p className="text-xs text-gray-500 mt-1">
                Check if services are operational
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Link */}
      <div className="mt-6">
        <p className="text-sm text-gray-500">
          Still having issues?{' '}
          <a href="/support" className="text-[#ed8f2d] hover:text-[#B8722E] transition-colors">
            Contact Support
          </a>
        </p>
      </div>
    </motion.div>
  );
}
