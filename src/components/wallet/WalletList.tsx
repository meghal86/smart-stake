/**
 * WalletList Component
 * 
 * Displays user's registered wallets with management controls.
 * Shows active/connected wallet, trust scores, and quick actions.
 */

import { useState } from 'react'
import { Trash2, Shield, Clock, CheckCircle, Eye } from 'lucide-react'
import { useWalletRegistry, type UserWallet } from '@/hooks/useWalletRegistry'
import { useTheme } from '@/contexts/ThemeContext'
import { formatDistanceToNow } from 'date-fns'

interface WalletListProps {
  onWalletSelect?: (wallet: UserWallet) => void
  selectedAddress?: string
  showActions?: boolean
  compact?: boolean
}

export function WalletList({ 
  onWalletSelect, 
  selectedAddress, 
  showActions = true,
  compact = false 
}: WalletListProps) {
  const { actualTheme } = useTheme()
  const isDark = actualTheme === 'dark'
  const { wallets, removeWallet, isLoading, connectedAddress } = useWalletRegistry()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (walletId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to remove this wallet from your registry?')) {
      return
    }

    setDeletingId(walletId)
    try {
      await removeWallet(walletId)
    } catch (error) {
      console.error('Failed to remove wallet:', error)
      alert('Failed to remove wallet. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const getTrustScoreColor = (score?: number) => {
    if (!score) return isDark ? 'text-slate-500' : 'text-slate-400'
    if (score >= 80) return 'text-emerald-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getTrustScoreBg = (score?: number) => {
    if (!score) return isDark ? 'bg-slate-500/10' : 'bg-slate-100'
    if (score >= 80) return isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
    if (score >= 60) return isDark ? 'bg-yellow-500/10' : 'bg-yellow-50'
    return isDark ? 'bg-red-500/10' : 'bg-red-50'
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className={`p-4 rounded-xl animate-pulse ${
              isDark ? 'bg-slate-800' : 'bg-slate-100'
            }`}
          >
            <div className={`h-4 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
          </div>
        ))}
      </div>
    )
  }

  if (wallets.length === 0) {
    return (
      <div
        className={`p-8 text-center rounded-xl border-2 border-dashed ${
          isDark
            ? 'border-slate-700 bg-slate-800/30'
            : 'border-slate-300 bg-slate-50'
        }`}
      >
        <Eye
          size={48}
          className={`mx-auto mb-3 ${
            isDark ? 'text-slate-600' : 'text-slate-400'
          }`}
        />
        <p
          className={`font-medium mb-1 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          No wallets yet
        </p>
        <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          Add a wallet to start monitoring
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${compact ? 'max-h-96 overflow-y-auto' : ''}`}>
      {wallets.map((wallet) => {
        const isActive = selectedAddress?.toLowerCase() === wallet.address.toLowerCase()
        const isConnected = connectedAddress?.toLowerCase() === wallet.address.toLowerCase()
        const isDeleting = deletingId === wallet.id

        return (
          <div
            key={wallet.id}
            onClick={() => onWalletSelect?.(wallet)}
            className={`group relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
              isActive
                ? isDark
                  ? 'bg-emerald-500/10 border-emerald-500/50'
                  : 'bg-emerald-50 border-emerald-400'
                : isDark
                ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {/* Top Row: Label + Badges */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {wallet.label ? (
                    <span
                      className={`font-semibold truncate ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {wallet.label}
                    </span>
                  ) : (
                    <span
                      className={`font-mono text-sm truncate ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                    </span>
                  )}
                  
                  {isConnected && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-medium whitespace-nowrap">
                      <CheckCircle size={12} />
                      Connected
                    </span>
                  )}
                </div>
                
                {/* Address (if label exists) */}
                {wallet.label && (
                  <div
                    className={`font-mono text-xs truncate ${
                      isDark ? 'text-slate-500' : 'text-slate-500'
                    }`}
                  >
                    {wallet.address}
                  </div>
                )}
              </div>

              {/* Delete Button */}
              {showActions && (
                <button
                  onClick={(e) => handleDelete(wallet.id, e)}
                  disabled={isDeleting}
                  className={`p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                    isDark
                      ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400'
                      : 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title="Remove wallet"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Bottom Row: Trust Score + Last Scan */}
            <div className="flex items-center gap-3 text-xs">
              {/* Trust Score */}
              {wallet.trust_score !== null && wallet.trust_score !== undefined ? (
                <div className="flex items-center gap-1.5">
                  <div
                    className={`p-1 rounded ${getTrustScoreBg(wallet.trust_score)}`}
                  >
                    <Shield size={12} className={getTrustScoreColor(wallet.trust_score)} />
                  </div>
                  <span
                    className={`font-medium ${getTrustScoreColor(wallet.trust_score)}`}
                  >
                    {wallet.trust_score}% Trust
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div
                    className={`p-1 rounded ${
                      isDark ? 'bg-slate-700' : 'bg-slate-100'
                    }`}
                  >
                    <Shield
                      size={12}
                      className={isDark ? 'text-slate-500' : 'text-slate-400'}
                    />
                  </div>
                  <span
                    className={isDark ? 'text-slate-500' : 'text-slate-500'}
                  >
                    Not scanned
                  </span>
                </div>
              )}

              {/* Last Scan */}
              {wallet.last_scan && (
                <>
                  <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>
                    •
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Clock
                      size={12}
                      className={isDark ? 'text-slate-500' : 'text-slate-400'}
                    />
                    <span
                      className={isDark ? 'text-slate-500' : 'text-slate-500'}
                    >
                      {formatDistanceToNow(new Date(wallet.last_scan), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </>
              )}

              {/* Source Badge */}
              {wallet.source && (
                <>
                  <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>
                    •
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      isDark
                        ? 'bg-slate-700 text-slate-400'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {wallet.source}
                  </span>
                </>
              )}
            </div>

            {/* Risk Flags (if any) */}
            {wallet.risk_flags && Array.isArray(wallet.risk_flags) && wallet.risk_flags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {wallet.risk_flags.slice(0, 3).map((flag: unknown, idx: number) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      isDark
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : 'bg-yellow-50 text-yellow-700'
                    }`}
                  >
                    {typeof flag === 'string' ? flag : flag.type || 'Risk'}
                  </span>
                ))}
                {wallet.risk_flags.length > 3 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      isDark
                        ? 'bg-slate-700 text-slate-400'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    +{wallet.risk_flags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}




