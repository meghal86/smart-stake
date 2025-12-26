/**
 * APIFailureFallback Empty State
 * Displayed when API requests fail with humanized, encouraging error messages
 * 
 * Requirements: Enhanced Req 16 AC1-3 (humanized errors, encouraging copy)
 * Design: Microcopy System → Error Humanization
 */

import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, WifiOff, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { humanizedErrorHandler } from '@/lib/ux/HumanizedErrorHandler';

interface APIFailureFallbackProps {
  onRetry?: () => void;
  error?: Error | string;
  errorMessage?: string;
  isRetrying?: boolean;
  className?: string;
}

export function APIFailureFallback({
  onRetry,
  error,
  errorMessage,
  isRetrying = false,
  className,
}: APIFailureFallbackProps) {
  // Get humanized error message if error object is provided
  const getHumanizedMessage = () => {
    if (error) {
      const humanizedMessage = humanizedErrorHandler.handleHumanizedError(error, 'harvest-opportunities', false);
      return humanizedMessage;
    }
    return errorMessage || 'Having trouble loading your harvest opportunities right now';
  };

  const displayMessage = getHumanizedMessage();
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
        <Heart className="w-8 h-8 text-red-400" />
      </motion.div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-white mb-2">
        We're having a moment 💫
      </h3>

      {/* Humanized Error Message */}
      <p className="text-gray-300 mb-6 max-w-md mx-auto leading-relaxed">
        {displayMessage}. Don't worry though - your data is safe and we'll get this sorted out quickly!
      </p>

      {/* Encouragement */}
      <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-blue-300 text-sm">
          🚀 <strong>Good news:</strong> These hiccups happen to everyone in DeFi. 
          Your patience helps us serve you better, and we're already working on a fix!
        </p>
      </div>

      {/* Retry Button */}
      {onRetry && (
        <motion.button
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ed8f2d] to-[#B8722E] text-white font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={!isRetrying ? { scale: 1.05 } : {}}
          whileTap={!isRetrying ? { scale: 0.98 } : {}}
        >
          <RefreshCw className={cn('w-5 h-5', isRetrying && 'animate-spin')} />
          {isRetrying ? 'Working on it...' : 'Let\'s try again'}
        </motion.button>
      )}

      {/* What was attempted checklist */}
      <div className="mt-8 pt-6 border-t border-red-500/20">
        <p className="text-sm font-semibold text-gray-300 mb-4">
          What we were trying to fetch for you:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left max-w-2xl mx-auto">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-300">Your Wallet Holdings</p>
              <p className="text-xs text-gray-500 mt-1">
                Current token balances and transaction history
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-300">Live Price Data</p>
              <p className="text-xs text-gray-500 mt-1">
                Real-time market prices for accurate calculations
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-300">Gas Estimates</p>
              <p className="text-xs text-gray-500 mt-1">
                Current network fees for cost calculations
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-300">Opportunity Analysis</p>
              <p className="text-xs text-gray-500 mt-1">
                Smart harvest opportunity detection
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting Tips */}
      <div className="mt-8 pt-6 border-t border-red-500/20">
        <p className="text-sm font-semibold text-gray-300 mb-3">
          Quick fixes to try:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left max-w-2xl mx-auto">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <WifiOff className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-300">Check Your Connection</p>
              <p className="text-xs text-gray-500 mt-1">
                Make sure you're connected to the internet
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <RefreshCw className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-300">Refresh the Page</p>
              <p className="text-xs text-gray-500 mt-1">
                Sometimes a fresh start does the trick
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-300">Wait a Moment</p>
              <p className="text-xs text-gray-500 mt-1">
                Our servers might just need a quick breather
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Link */}
      <div className="mt-6">
        <p className="text-sm text-gray-500">
          Still stuck? We're here to help!{' '}
          <a href="/support" className="text-[#ed8f2d] hover:text-[#B8722E] transition-colors">
            Contact our friendly support team
          </a>
        </p>
      </div>
    </motion.div>
  );
}
