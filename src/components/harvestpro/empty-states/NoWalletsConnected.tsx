/**
 * NoWalletsConnected Empty State
 * Guardian-style warning when no wallets are connected
 */

import { motion } from 'framer-motion';
import { Wallet, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoWalletsConnectedProps {
  onConnectWallet?: () => void;
  className?: string;
}

export function NoWalletsConnected({ onConnectWallet, className }: NoWalletsConnectedProps) {
  return (
    <motion.div
      className={cn(
        'rounded-2xl border-2 p-8 text-center',
        'bg-gradient-to-br from-[rgba(245,158,11,0.1)] to-[rgba(245,158,11,0.05)]',
        'border-[rgba(245,158,11,0.3)]',
        'backdrop-blur-md',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Warning Icon */}
      <motion.div
        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(245,158,11,0.2)] mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      >
        <AlertTriangle className="w-8 h-8 text-yellow-500" />
      </motion.div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-white mb-2">
        No Wallets Connected
      </h3>

      {/* Description */}
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        Connect your wallet to start discovering tax-loss harvesting opportunities.
        Harvest will analyze your holdings and identify potential tax savings.
      </p>

      {/* Connect Wallet Button */}
      {onConnectWallet && (
        <motion.button
          onClick={onConnectWallet}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ed8f2d] to-[#B8722E] text-white font-semibold shadow-lg hover:shadow-xl transition-shadow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <Wallet className="w-5 h-5" />
          Connect Wallet
        </motion.button>
      )}

      {/* Checklist of what will be scanned */}
      <div className="mt-8 pt-6 border-t border-[rgba(245,158,11,0.2)]">
        <p className="text-sm font-semibold text-gray-300 mb-4">
          What we'll scan when you connect:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left max-w-2xl mx-auto">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <div className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-300">Transaction History</p>
              <p className="text-xs text-gray-500 mt-1">
                All buy/sell transactions for FIFO cost basis
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <div className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-300">Current Holdings</p>
              <p className="text-xs text-gray-500 mt-1">
                Token balances and current market prices
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <div className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-300">Unrealized Losses</p>
              <p className="text-xs text-gray-500 mt-1">
                Positions with potential tax benefits
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <div className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-300">Gas & Fees</p>
              <p className="text-xs text-gray-500 mt-1">
                Execution costs and net benefit analysis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Info */}
      <div className="mt-6 pt-4 border-t border-[rgba(245,158,11,0.1)]">
        <p className="text-sm text-gray-500">
          Your wallet data is analyzed locally and securely. We never store your private keys.
        </p>
      </div>
    </motion.div>
  );
}
