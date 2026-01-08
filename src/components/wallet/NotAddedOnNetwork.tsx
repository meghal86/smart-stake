/**
 * NotAddedOnNetwork Component
 * 
 * Displays when a wallet is not added on the currently selected network.
 * Provides clear UI feedback and offers "Add network" action.
 * 
 * Validates: Requirements 6.2, 6.3, 15.7
 * 
 * @see .kiro/specs/multi-chain-wallet-system/requirements.md - Requirement 15.7
 * @see .kiro/specs/multi-chain-wallet-system/design.md - HARD LOCK 5
 */

'use client';

import React from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface NotAddedOnNetworkProps {
  walletAddress: string;
  networkName: string;
  chainNamespace: string;
  onAddNetwork?: () => void;
  className?: string;
}

export function NotAddedOnNetwork({
  walletAddress,
  networkName,
  chainNamespace,
  onAddNetwork,
  className,
}: NotAddedOnNetworkProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex flex-col items-center justify-center gap-3 p-6 rounded-lg',
        'bg-amber-50 dark:bg-amber-900/20',
        'border border-amber-200 dark:border-amber-800',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`Wallet not added on ${networkName} network`}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <AlertCircle
          className="w-8 h-8 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
      </div>

      {/* Message */}
      <div className="text-center">
        <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
          Not added on {networkName}
        </h3>
        <p className="text-sm text-amber-800 dark:text-amber-200">
          This wallet is not registered on the {networkName} network.
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 font-mono">
          {walletAddress}
        </p>
      </div>

      {/* Action Button */}
      {onAddNetwork && (
        <motion.button
          onClick={onAddNetwork}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onAddNetwork();
            }
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-md',
            'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',
            'text-white font-medium text-sm',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2',
            'dark:focus:ring-offset-gray-900',
            'min-h-[44px]', // Touch-friendly minimum
            'motion-safe:hover:scale-[1.02]',
            'motion-safe:active:scale-[0.98]'
          )}
          aria-label={`Add ${walletAddress} to ${networkName} network`}
          role="button"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Add to {networkName}</span>
        </motion.button>
      )}
    </motion.div>
  );
}

export default NotAddedOnNetwork;
