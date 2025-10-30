/**
 * AddWalletModal Component
 * 
 * Multi-method wallet addition:
 * 1. Connect via RainbowKit (full wallet features)
 * 2. Manual address entry (watch-only mode)
 * 3. Import from file (future: CSV/JSON support)
 */

import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useDisconnect } from 'wagmi'
import { X, Wallet, FileText, Link as LinkIcon } from 'lucide-react'
import { useWalletRegistry } from '@/hooks/useWalletRegistry'
import { useTheme } from '@/contexts/ThemeContext'

interface AddWalletModalProps {
  isOpen: boolean
  onClose: () => void
}

type AddMode = 'choose' | 'manual' | 'connect' | 'import'

export function AddWalletModal({ isOpen, onClose }: AddWalletModalProps) {
  const { actualTheme } = useTheme()
  const isDark = actualTheme === 'dark'
  const { addWallet, isAdding, isConnected } = useWalletRegistry()
  const { disconnect } = useDisconnect()

  const [mode, setMode] = useState<AddMode>('choose')
  const [manualAddress, setManualAddress] = useState('')
  const [manualLabel, setManualLabel] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleManualSubmit = async () => {
    setError('')

    // Validate Ethereum address
    if (!manualAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Invalid Ethereum address format')
      return
    }

    try {
      await addWallet({
        address: manualAddress,
        label: manualLabel.trim() || undefined,
        chain: 'ethereum',
        source: 'manual',
      })

      // Success - reset and close
      setManualAddress('')
      setManualLabel('')
      setMode('choose')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to add wallet')
    }
  }

  const handleConnectClick = () => {
    // If already connected, temporarily disconnect to allow selecting a new wallet
    if (isConnected) {
      disconnect()
    }
    onClose() // Close modal - RainbowKit modal will open
  }

  const handleClose = () => {
    setManualAddress('')
    setManualLabel('')
    setMode('choose')
    setError('')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl ${
          isDark
            ? 'bg-slate-800/95 border border-slate-700'
            : 'bg-white/95 border border-slate-200'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className={`text-xl font-semibold ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {mode === 'choose' && 'Add Wallet'}
            {mode === 'manual' && 'Enter Address'}
            {mode === 'import' && 'Import Wallets'}
          </h2>
          <button
            onClick={handleClose}
            className={`p-1 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-slate-700 text-slate-400 hover:text-white'
                : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode: Choose */}
        {mode === 'choose' && (
          <div className="space-y-3">
            <p
              className={`text-sm mb-4 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Choose how you'd like to add a wallet to your registry
            </p>

            {/* Option 1: Connect Wallet */}
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={() => {
                    if (openConnectModal) {
                      openConnectModal()
                    }
                    handleConnectClick()
                  }}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    isDark
                      ? 'bg-emerald-500/10 border-emerald-500/40 hover:bg-emerald-500/20 hover:border-emerald-500/60'
                      : 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <LinkIcon size={20} className="text-emerald-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <div
                        className={`font-semibold mb-1 ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        Connect Wallet
                      </div>
                      <div
                        className={`text-sm ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        MetaMask, WalletConnect, Coinbase & more
                      </div>
                    </div>
                  </div>
                </button>
              )}
            </ConnectButton.Custom>

            {/* Option 2: Manual Entry */}
            <button
              onClick={() => setMode('manual')}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                isDark
                  ? 'bg-blue-500/10 border-blue-500/40 hover:bg-blue-500/20 hover:border-blue-500/60'
                  : 'bg-blue-50 border-blue-300 hover:bg-blue-100 hover:border-blue-400'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Wallet size={20} className="text-blue-500" />
                </div>
                <div className="flex-1 text-left">
                  <div
                    className={`font-semibold mb-1 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Enter Address Manually
                  </div>
                  <div
                    className={`text-sm ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Watch any wallet (read-only mode)
                  </div>
                </div>
              </div>
            </button>

            {/* Option 3: Import (Future) */}
            <button
              onClick={() => setMode('import')}
              disabled
              className={`w-full p-4 rounded-xl border-2 transition-all opacity-50 cursor-not-allowed ${
                isDark
                  ? 'bg-purple-500/10 border-purple-500/40'
                  : 'bg-purple-50 border-purple-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <FileText size={20} className="text-purple-500" />
                </div>
                <div className="flex-1 text-left">
                  <div
                    className={`font-semibold mb-1 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Import from File
                    <span className="ml-2 text-xs bg-purple-500/20 text-purple-500 px-2 py-0.5 rounded">
                      Coming Soon
                    </span>
                  </div>
                  <div
                    className={`text-sm ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Bulk import from CSV or JSON
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Mode: Manual Entry */}
        {mode === 'manual' && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setMode('choose')
                setError('')
              }}
              className={`text-sm ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ← Back to options
            </button>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Label (Optional)
              </label>
              <input
                type="text"
                value={manualLabel}
                onChange={(e) => setManualLabel(e.target.value)}
                placeholder="e.g., Trading Wallet"
                className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                  isDark
                    ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Wallet Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={manualAddress}
                onChange={(e) => {
                  setManualAddress(e.target.value)
                  setError('')
                }}
                placeholder="0x..."
                className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors font-mono text-sm ${
                  isDark
                    ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                }`}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleManualSubmit}
                disabled={!manualAddress || isAdding}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  isDark
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-700 disabled:text-slate-500'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white disabled:bg-slate-200 disabled:text-slate-400'
                } disabled:cursor-not-allowed`}
              >
                {isAdding ? 'Adding...' : 'Add Wallet'}
              </button>
              <button
                onClick={() => {
                  setMode('choose')
                  setManualAddress('')
                  setManualLabel('')
                  setError('')
                }}
                className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                  isDark
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                }`}
              >
                Cancel
              </button>
            </div>

            <div
              className={`text-xs text-center pt-2 ${
                isDark ? 'text-slate-500' : 'text-slate-500'
              }`}
            >
              Watch-only wallets can't sign transactions but will be monitored by Guardian
            </div>
          </div>
        )}

        {/* Mode: Import (Placeholder) */}
        {mode === 'import' && (
          <div className="text-center py-8">
            <FileText
              size={48}
              className={`mx-auto mb-4 ${
                isDark ? 'text-slate-600' : 'text-slate-400'
              }`}
            />
            <p
              className={`mb-4 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Bulk wallet import coming soon
            </p>
            <button
              onClick={() => setMode('choose')}
              className="text-emerald-500 hover:text-emerald-400 font-medium"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}



