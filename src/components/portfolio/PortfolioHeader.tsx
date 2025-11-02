import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Settings, 
  Activity, 
  Sun, 
  Moon, 
  ChevronDown,
  Wallet,
  TrendingUp
} from 'lucide-react';
import { GlassNav, GlassButton } from '@/components/guardian/GlassUI';

interface TimeRange {
  label: string;
  value: string;
}

interface Wallet {
  id: string;
  alias: string;
  address: string;
  trustScore: number;
}

interface PortfolioHeaderProps {
  title: string;
  subtitle: string;
  isDemo: boolean;
  setIsDemo: (value: boolean) => void;
  timeRange: string;
  setTimeRange: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  isDarkTheme: boolean;
  setIsDarkTheme: (value: boolean) => void;
  userMode: 'novice' | 'pro' | 'sim';
  setUserMode: (mode: 'novice' | 'pro' | 'sim') => void;
  wallets?: Wallet[];
  activeWallet?: string;
  setActiveWallet?: (walletId: string) => void;
  aggregatedValue?: number;
  aggregatedRisk?: number;
  lastUpdated?: Date;
}

const timeRanges: TimeRange[] = [
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' }
];

export function PortfolioHeader({
  title,
  subtitle,
  isDemo,
  setIsDemo,
  timeRange,
  setTimeRange,
  searchQuery,
  setSearchQuery,
  isDarkTheme,
  setIsDarkTheme,
  userMode,
  setUserMode,
  wallets = [],
  activeWallet,
  setActiveWallet,
  aggregatedValue,
  aggregatedRisk,
  lastUpdated
}: PortfolioHeaderProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);

  const currentWallet = wallets.find(w => w.id === activeWallet);
  const hasMultipleWallets = wallets.length > 1;

  return (
    <GlassNav className="px-4 py-3">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col gap-3">
          {/* Top Row */}
          <div className="flex items-center justify-between">
            {/* Left: Title & Wallet Switcher */}
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                  {title}
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  >
                    <TrendingUp className="w-4 h-4 text-[#00C9A7]" />
                  </motion.div>
                </h1>
                <p className="text-sm text-gray-400">{subtitle}</p>
              </div>

              {/* Multi-wallet Switcher */}
              {hasMultipleWallets && currentWallet && (
                <div className="relative">
                  <button
                    onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <Wallet className="w-4 h-4 text-[#00C9A7]" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">{currentWallet.alias}</div>
                      <div className="text-xs text-gray-400">Trust: {currentWallet.trustScore}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {/* Wallet Dropdown */}
                  {showWalletDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl z-50"
                    >
                      <div className="p-2">
                        {wallets.map((wallet) => (
                          <button
                            key={wallet.id}
                            onClick={() => {
                              setActiveWallet?.(wallet.id);
                              setShowWalletDropdown(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                              wallet.id === activeWallet
                                ? 'bg-[#00C9A7]/10 text-[#00C9A7]'
                                : 'hover:bg-white/5 text-white'
                            }`}
                          >
                            <Wallet className="w-4 h-4" />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{wallet.alias}</div>
                              <div className="text-xs text-gray-400">
                                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                              </div>
                            </div>
                            <div className="text-xs">Trust: {wallet.trustScore}</div>
                          </button>
                        ))}
                      </div>
                      
                      {/* Aggregated Metrics */}
                      {(aggregatedValue || aggregatedRisk) && (
                        <div className="border-t border-white/10 p-3">
                          <div className="text-xs text-gray-400 mb-2">Aggregated Portfolio</div>
                          <div className="flex justify-between text-sm">
                            {aggregatedValue && (
                              <div>
                                <span className="text-gray-400">Value: </span>
                                <span className="text-white font-medium">
                                  ${aggregatedValue.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {aggregatedRisk && (
                              <div>
                                <span className="text-gray-400">Risk: </span>
                                <span className="text-white font-medium">
                                  {aggregatedRisk.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-3">
              {/* Last Updated */}
              {lastUpdated && (
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Updated {Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago
                </div>
              )}

              {/* Theme Toggle */}
              <button
                onClick={() => setIsDarkTheme(!isDarkTheme)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Demo/Live Toggle */}
              <div className="flex gap-1 text-sm">
                <button
                  onClick={() => setIsDemo(true)}
                  className={`px-3 py-1 rounded-lg border transition-all ${
                    isDemo
                      ? 'bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] text-white border-transparent'
                      : 'border-white/10 text-gray-300 hover:bg-white/5'
                  }`}
                >
                  Demo
                </button>
                <button
                  onClick={() => setIsDemo(false)}
                  className={`px-3 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                    !isDemo
                      ? 'bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] text-white border-transparent'
                      : 'border-white/10 text-gray-300 hover:bg-white/5'
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

              {/* Settings */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* Settings Dropdown */}
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl z-50"
                  >
                    <div className="p-3">
                      <div className="text-xs text-gray-400 mb-2">User Mode</div>
                      <div className="space-y-1">
                        {(['novice', 'pro', 'sim'] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => {
                              setUserMode(mode);
                              setShowSettings(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              userMode === mode
                                ? 'bg-[#00C9A7]/10 text-[#00C9A7]'
                                : 'hover:bg-white/5 text-white'
                            }`}
                          >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Time Range & Search */}
          <div className="flex items-center justify-between">
            {/* Time Range Buttons */}
            <div className="flex gap-1">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${
                    timeRange === range.value
                      ? 'bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  style={
                    timeRange === range.value
                      ? { boxShadow: '0 0 20px rgba(0, 201, 167, 0.4)' }
                      : {}
                  }
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search portfolio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#00C9A7]/50 focus:ring-2 focus:ring-[#00C9A7]/20 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </GlassNav>
  );
}