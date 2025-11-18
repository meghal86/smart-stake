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
        HarvestPro will analyze your holdings and identify potential tax savings.
      </p>

      {/* Connect Wallet Button */}
      {onConnectWallet && (
        <motion.button
          onClick={onConnectWallet}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ed8f2d] to-[#B8722E] text-white font-semibold shadow-lg hover:shadow-xl transition-shadow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Wallet className="w-5 h-5" />
          Connect Wallet
        </motion.button>
      )}

      {/* Additional Info */}
      <div className="mt-6 pt-6 border-t border-[rgba(245,158,11,0.2)]">
        <p className="text-sm text-gray-500">
          Your wallet data is analyzed locally and securely. We never store your private keys.
        </p>
      </div>
    </motion.div>
  );
}
