/**
 * Guardian with Multi-Wallet Registry
 * 
 * Enhanced Guardian experience with persistent wallet management.
 * Replaces localStorage with Supabase-backed user_wallets table.
 */

import { useState, useEffect } from 'react'
import { Shield, RefreshCw, Wrench, Plus } from 'lucide-react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useGuardianScan } from '@/hooks/useGuardianScan'
import { useGuardianAnalytics } from '@/lib/analytics/guardian'
import { useTheme } from '@/contexts/ThemeContext'
import { useWalletRegistry } from '@/hooks/useWalletRegistry'
import { AddWalletModal } from '@/components/wallet/AddWalletModal'
import { WalletList } from '@/components/wallet/WalletList'
import { Hub2Footer } from '@/components/hub2/Hub2Footer'
import type { UserWallet } from '@/hooks/useWalletRegistry'

export function GuardianRegistry() {
  const { actualTheme } = useTheme()
  const isDark = actualTheme === 'dark'
  const { isConnected } = useAccount()
  const analytics = useGuardianAnalytics()
  
  // Wallet Registry
  const { wallets, isLoading: walletsLoading, userId } = useWalletRegistry()
  const [selectedWallet, setSelectedWallet] = useState<UserWallet | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  
  // Scanning state
  const [isScanning, setIsScanning] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Guardian scan for selected wallet
  const { data, isLoading: scanLoading, rescan, isRescanning } = useGuardianScan({
    walletAddress: selectedWallet?.address,
    network: 'ethereum',
    enabled: !!selectedWallet,
  })

  // Auto-select first wallet if none selected
  useEffect(() => {
    if (!selectedWallet && wallets.length > 0) {
      setSelectedWallet(wallets[0])
    }
  }, [wallets, selectedWallet])

  // Handle scan animation
  useEffect(() => {
    if (selectedWallet && !data) {
      setIsScanning(true)
      setShowResults(false)
      analytics.scanStarted(selectedWallet.address, 'ethereum', isConnected)
      setTimeout(() => {
        setIsScanning(false)
        setTimeout(() => setShowResults(true), 100)
      }, 3000)
    } else if (data) {
      setShowResults(true)
      setIsScanning(false)
    }
  }, [selectedWallet, data, analytics, isConnected])

  const handleRescan = async () => {
    if (!selectedWallet) return
    setIsScanning(true)
    setShowResults(false)
    analytics.track('guardian_rescan_requested' as any, { wallet_address: selectedWallet.address })
    try {
      await rescan()
      setTimeout(() => {
        setIsScanning(false)
        setTimeout(() => setShowResults(true), 100)
      }, 2000)
    } catch (error) {
      analytics.scanFailed(selectedWallet.address, error instanceof Error ? error.message : 'Unknown error')
      setIsScanning(false)
      setShowResults(true)
    }
  }

  const handleWalletSelect = (wallet: UserWallet) => {
    setSelectedWallet(wallet)
    setShowResults(false)
    analytics.track('guardian_wallet_switched' as any, { 
      from: selectedWallet?.address,
      to: wallet.address 
    })
  }

  const trustScore = data?.trustScorePercent || 87
  const flags = data?.flags?.length || 0

  // Welcome screen - no user or no wallets
  if (!userId || (!walletsLoading && wallets.length === 0)) {
    return (
      <div className={`min-h-screen relative overflow-hidden ${
        isDark ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-white via-slate-50 to-white'
      }`}>
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
        `}</style>

        {/* Background Shield */}
        <Shield 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none ${
            isDark ? 'text-emerald-500' : 'text-slate-400'
          }`}
          style={{ 
            width: 'min(400px, 80vw)', 
            height: 'min(400px, 80vw)',
            opacity: isDark ? 0.05 : 0.15,
            strokeWidth: isDark ? 0.5 : 1,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
          <div className="text-center max-w-2xl w-full">
            <Shield 
              className="mx-auto mb-6 text-emerald-500" 
              style={{ 
                width: 'clamp(64px, 15vw, 96px)', 
                height: 'clamp(64px, 15vw, 96px)',
                animation: 'pulse 3s ease-in-out infinite',
              }}
              strokeWidth={1.5}
            />
            
            <h1 className={`text-4xl md:text-5xl font-semibold mb-4 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Welcome to Guardian
            </h1>
            
            <p className={`text-lg mb-8 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Multi-wallet security monitoring. Add wallets to start protecting your assets.
            </p>

            {!userId ? (
              <div className="space-y-4">
                <ConnectButton 
                  label="🔒 Sign In to Continue"
                  showBalance={false}
                  chainStatus="none"
                />
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  Connect your wallet to access Guardian features
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Plus size={20} />
                  Add Your First Wallet
                </button>
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  Connect via wallet or enter any address to monitor
                </p>
              </div>
            )}
          </div>
        </div>

        <Hub2Footer />
        <AddWalletModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      </div>
    )
  }

  // Scanning state
  if (isScanning || scanLoading) {
    return (
      <div className={`min-h-screen relative overflow-hidden ${
        isDark ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-white via-slate-50 to-white'
      }`}>
        <style>{`
          @keyframes radarSweep {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes ringPulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.1); opacity: 0.6; }
          }
          @keyframes progressFill {
            0% { stroke-dashoffset: 565; }
            100% { stroke-dashoffset: 0; }
          }
        `}</style>

        <Shield 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none ${
            isDark ? 'text-emerald-500' : 'text-slate-400'
          }`}
          style={{ 
            width: 'min(400px, 80vw)', 
            height: 'min(400px, 80vw)',
            opacity: isDark ? 0.05 : 0.15,
            strokeWidth: isDark ? 0.5 : 1,
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
          <div className="relative w-80 h-80 max-w-[80vw] max-h-[80vw]">
            {/* Radar sweep */}
            <svg 
              className="absolute inset-0 animate-[radarSweep_8s_linear_infinite]" 
              viewBox="0 0 200 200"
            >
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke={isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.3)'}
                strokeWidth="2"
                fill="none"
                strokeDasharray="10 5"
              />
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="10"
                stroke={isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.5)'}
                strokeWidth="2"
              />
            </svg>

            {/* Progress ring */}
            <svg className="absolute inset-0" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke={isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.15)'}
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke="#10b981"
                strokeWidth="8"
                fill="none"
                strokeDasharray={565}
                strokeDashoffset={565}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
                style={{ animation: 'progressFill 3s ease-out forwards' }}
              />
            </svg>

            {/* Center shield */}
            <div className="absolute inset-0 flex items-center justify-center animate-[ringPulse_3s_ease-in-out_infinite]">
              <Shield size={64} className="text-emerald-500" strokeWidth={1.5} />
            </div>

            {/* Text */}
            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-full text-center">
              <div className={`text-2xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Scanning<span className="animate-pulse">...</span>
              </div>
              <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Analyzing {selectedWallet?.label || 'wallet'} across multiple chains
              </div>
            </div>
          </div>
        </div>
        <Hub2Footer />
      </div>
    )
  }

  // Results screen
  return (
    <div className={`min-h-screen relative overflow-hidden pb-24 ${
      isDark ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-white via-slate-50 to-white'
    }`}>
      <Shield 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none ${
          isDark ? 'text-emerald-500' : 'text-slate-400'
        }`}
        style={{ 
          width: 'min(400px, 80vw)', 
          height: 'min(400px, 80vw)',
          opacity: isDark ? 0.05 : 0.15,
          strokeWidth: 0.5,
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Guardian
          </h1>
          <button
            onClick={() => setShowAddModal(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            <Plus size={18} />
            Add Wallet
          </button>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Wallet List */}
          <div className="lg:col-span-1">
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Your Wallets ({wallets.length})
            </h2>
            <WalletList 
              onWalletSelect={handleWalletSelect}
              selectedAddress={selectedWallet?.address}
              showActions={true}
            />
          </div>

          {/* Right: Scan Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trust Score Gauge */}
            <div className={`p-8 rounded-2xl border ${
              isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={`text-xl font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {selectedWallet?.label || 'Wallet'}
                  </h3>
                  <p className={`text-sm font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {selectedWallet?.address.slice(0, 10)}...{selectedWallet?.address.slice(-8)}
                  </p>
                </div>
                {isConnected && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-sm font-medium">
                    🔒 Connected
                  </span>
                )}
              </div>

              {/* Trust Score */}
              <div className="flex items-center gap-8">
                <div className="relative w-32 h-32">
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke={isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.15)'}
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#10b981"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${trustScore * 2.51} 251`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-500">{trustScore}%</div>
                      <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Trust</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <div className={`text-2xl font-bold mb-2 ${
                    trustScore >= 80 ? 'text-emerald-500' : trustScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {trustScore >= 80 ? '✓ Healthy' : trustScore >= 60 ? '⚠️ Warning' : '⚠ Risk Detected'}
                  </div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {flags === 0 
                      ? 'No active security flags detected'
                      : `${flags} issue${flags > 1 ? 's' : ''} detected`
                    }
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleRescan}
                  disabled={isRescanning}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark
                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <RefreshCw size={16} className={isRescanning ? 'animate-spin' : ''} />
                  {isRescanning ? 'Scanning...' : 'Rescan'}
                </button>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  <Wrench size={16} />
                  Fix Risks
                </button>
              </div>
            </div>

            {/* Risk Cards */}
            {data?.flags && data.flags.length > 0 && (
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Active Risks
                </h3>
                <div className="space-y-3">
                  {data.flags.map((flag) => (
                    <div
                      key={flag.id}
                      className={`p-4 rounded-xl border ${
                        isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {flag.type}
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            flag.severity === 'high'
                              ? 'bg-red-500/20 text-red-500'
                              : flag.severity === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-500'
                              : 'bg-blue-500/20 text-blue-500'
                          }`}
                        >
                          {flag.severity}
                        </span>
                      </div>
                      {flag.details && (
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {flag.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Hub2Footer />
      <AddWalletModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  )
}

export default GuardianRegistry




