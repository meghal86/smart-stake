/**
 * HarvestPro Header Component
 * Matches Hunter header styling with HarvestPro branding
 */

import { motion } from 'framer-motion';
import { Leaf, Activity, RefreshCw } from 'lucide-react';
import { WalletSelector } from '@/components/hunter/WalletSelector';

interface HarvestProHeaderProps {
  isDemo: boolean;
  setIsDemo: (value: boolean) => void;
  lastUpdated?: Date;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function HarvestProHeader({
  isDemo,
  setIsDemo,
  lastUpdated,
  onRefresh,
  isRefreshing = false,
}: HarvestProHeaderProps) {
  return (
    <motion.header
      className="sticky top-0 z-50 backdrop-blur-md border-b bg-[rgba(16,18,30,0.75)] border-[rgba(255,255,255,0.08)]"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="max-w-screen-xl mx-auto px-4 py-3">
        {/* Top Row */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <img src="/header.png" alt="AlphaWhale Logo" className="w-8 h-8" />
              Harvest
            </h1>
            <p className="text-gray-400 text-sm mt-1">Optimize your tax strategy for maximum savings</p>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <p className="text-xs text-gray-400">
                Updated {Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago
              </p>
            )}

            <div className="flex items-center gap-3">
              {/* WalletSelector */}
              <WalletSelector
                showLabel={true}
                variant="default"
                className="hidden sm:flex"
              />

              {/* Refresh Button */}
              <motion.button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/15 transition-all duration-200 disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </motion.button>

              {/* Demo/Live Toggle */}
              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => setIsDemo(true)}
                  className={`px-3 py-1 rounded-lg border transition-all duration-300 ${
                    isDemo
                      ? 'bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] text-white font-medium shadow-sm'
                      : 'border-[rgba(255,255,255,0.1)] text-gray-300 hover:bg-[rgba(255,255,255,0.05)]'
                  }`}
                >
                  Demo
                </button>
                <button
                  onClick={() => setIsDemo(false)}
                  className={`px-3 py-1 rounded-lg border transition-all duration-300 flex items-center gap-1 ${
                    !isDemo
                      ? 'bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] text-white font-medium shadow-sm'
                      : 'border-[rgba(255,255,255,0.1)] text-gray-300 hover:bg-[rgba(255,255,255,0.05)]'
                  }`}
                >
                  Live
                  {!isDemo && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Activity className="w-3 h-3" />
                    </motion.div>
                  )}
                </button>
              </div>

              {/* AI Digest Button */}
              <motion.button
                className="px-3 py-1 bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] text-white font-medium rounded-lg shadow-sm text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                AI Digest
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
