/**
 * HumanizedErrorDisplay Component
 * 
 * Displays humanized, encouraging error messages for HarvestPro
 * with contextual help and recovery suggestions.
 * 
 * Requirements: Enhanced Req 16 AC1-3 (humanized errors, encouraging copy)
 * Design: Microcopy System → Error Humanization
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, RefreshCw, HelpCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getHarvestProErrorMessage } from '@/lib/harvestpro/humanized-errors';
import { Button } from '@/components/ui/button';

interface HumanizedErrorDisplayProps {
  error: Error | string;
  context?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  showRecoveryTips?: boolean;
  className?: string;
}

export function HumanizedErrorDisplay({
  error,
  context,
  onRetry,
  isRetrying = false,
  showRecoveryTips = true,
  className
}: HumanizedErrorDisplayProps) {
  const humanizedMessage = getHarvestProErrorMessage(error, context);

  return (
    <motion.div
      className={cn(
        'rounded-xl border p-6 text-center',
        'bg-gradient-to-br from-red-500/10 to-red-500/5',
        'border-red-500/20 backdrop-blur-sm',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Error Icon */}
      <motion.div
        className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      >
        <Heart className="w-6 h-6 text-red-400" />
      </motion.div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-white mb-2">
        {humanizedMessage.title}
      </h3>

      {/* Main Message */}
      <p className="text-gray-300 mb-4 leading-relaxed">
        {humanizedMessage.message}
      </p>

      {/* Encouragement */}
      <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-blue-300 text-sm">
          💙 {humanizedMessage.encouragement}
        </p>
      </div>

      {/* Action Suggestion */}
      <p className="text-gray-400 text-sm mb-6">
        <strong>What to try:</strong> {humanizedMessage.action}
      </p>

      {/* Retry Button */}
      {onRetry && (
        <div className="mb-6">
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', isRetrying && 'animate-spin')} />
            {isRetrying ? 'Working on it...' : 'Let\'s try again'}
          </Button>
        </div>
      )}

      {/* Recovery Tips */}
      {showRecoveryTips && (
        <div className="pt-4 border-t border-red-500/20">
          <div className="flex items-center justify-center gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Recovery Tips</span>
          </div>
          
          <div className="text-left bg-white/5 rounded-lg p-4">
            <p className="text-sm text-gray-400 leading-relaxed">
              {humanizedMessage.recovery}
            </p>
            
            {/* Context-specific tips */}
            {context === 'wallet' && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-gray-500">
                  💡 <strong>Wallet tip:</strong> Make sure your wallet extension is unlocked and you're on the right network.
                </p>
              </div>
            )}
            
            {context === 'gas-price' && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-gray-500">
                  ⛽ <strong>Gas tip:</strong> Network congestion affects gas prices. Try again in a few minutes for better rates.
                </p>
              </div>
            )}
            
            {context === 'harvest-opportunities' && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-gray-500">
                  🌾 <strong>Harvest tip:</strong> Opportunities change with market conditions. Check back regularly for new ones!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Support Link */}
      <div className="mt-4 pt-4 border-t border-red-500/20">
        <p className="text-xs text-gray-500">
          Still need help? Our{' '}
          <a 
            href="/support" 
            className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
          >
            support team
            <ExternalLink className="w-3 h-3" />
          </a>
          {' '}is here for you!
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Inline Error Message Component
 * For smaller, inline error displays
 */
interface InlineHumanizedErrorProps {
  error: Error | string;
  context?: string;
  className?: string;
}

export function InlineHumanizedError({
  error,
  context,
  className
}: InlineHumanizedErrorProps) {
  const humanizedMessage = getHarvestProErrorMessage(error, context);

  return (
    <div className={cn(
      'flex items-start gap-2 p-3 rounded-lg',
      'bg-red-500/10 border border-red-500/20',
      className
    )}>
      <Heart className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-300 mb-1">
          {humanizedMessage.title}
        </p>
        <p className="text-xs text-red-200/80">
          {humanizedMessage.message}
        </p>
      </div>
    </div>
  );
}

/**
 * Toast-style Error Message Component
 * For temporary error notifications
 */
interface ToastHumanizedErrorProps {
  error: Error | string;
  context?: string;
  onDismiss?: () => void;
  className?: string;
}

export function ToastHumanizedError({
  error,
  context,
  onDismiss,
  className
}: ToastHumanizedErrorProps) {
  const humanizedMessage = getHarvestProErrorMessage(error, context);

  return (
    <motion.div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg shadow-lg',
        'bg-red-500/10 backdrop-blur-md border border-red-500/20',
        'max-w-md',
        className
      )}
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
    >
      <Heart className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-300 mb-1">
          {humanizedMessage.title}
        </p>
        <p className="text-xs text-red-200/80 mb-2">
          {humanizedMessage.message}
        </p>
        <p className="text-xs text-blue-300">
          💡 {humanizedMessage.encouragement}
        </p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <Heart className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}