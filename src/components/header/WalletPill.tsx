'use client'

import { cn } from '@/lib/utils'
import type { WalletPillProps } from '@/lib/header'
import { Button } from '@/components/ui/button'
import { Copy, ChevronDown, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/**
 * WalletPill Component
 * 
 * Displays the active wallet address and network with optional interactivity.
 * 
 * Features:
 * - Always shows Active wallet + activeNetwork (CAIP-2)
 * - Shows mismatch indicator when signerNetwork !== activeNetwork
 * - Tooltip shows signer info only when differs from active
 * - Copy defaults to active wallet address (activeAddressChecksum)
 * - Interactive only on Portfolio page in S3 state
 * 
 * S2 fallback (locked):
 * - active = signer
 * - isSavedToRegistry = false
 * - canSignForActive = true
 */
export function WalletPill({
  wallet,
  onCopy,
  onSelectorOpen,
  onNetworkSwitch,
  onConnectActiveSigner,
  onSaveWallet,
  className,
}: WalletPillProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (onCopy) {
      onCopy()
    } else {
      // Default copy behavior: copy active wallet address
      navigator.clipboard.writeText(wallet.activeAddressChecksum)
    }
    
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClick = () => {
    if (wallet.isInteractive && onSelectorOpen) {
      onSelectorOpen()
    }
  }

  // Build tooltip content
  const getTooltipContent = () => {
    const lines: string[] = []
    
    // Active wallet info
    lines.push(`Active: ${wallet.activeAddressChecksum}`)
    lines.push(`Network: ${wallet.activeChainName}`)
    
    if (wallet.activeEnsName) {
      lines.push(`ENS: ${wallet.activeEnsName}`)
    }
    
    // Signer info (only if different from active)
    if (wallet.signerAddressChecksum && !wallet.canSignForActive) {
      lines.push('')
      lines.push(`Signer: ${wallet.signerAddressChecksum}`)
      if (wallet.signerNetwork) {
        lines.push(`Signer Network: Chain ${wallet.signerNetwork}`)
      }
    }
    
    // Registry status
    if (!wallet.isSavedToRegistry) {
      lines.push('')
      lines.push('Not saved to registry')
    }
    
    return lines.join('\n')
  }

  // Build mismatch indicator text
  const getMismatchText = () => {
    if (!wallet.showMismatchIndicator || !wallet.signerNetwork) {
      return null
    }
    
    const signerChainName = getChainName(wallet.signerNetwork)
    return `Viewing ${wallet.activeChainName} • Signer on ${signerChainName}`
  }

  const mismatchText = getMismatchText()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex h-10 items-center gap-2 rounded-full bg-slate-800 px-3',
              'border border-slate-700',
              'transition-colors duration-150',
              wallet.isInteractive && 'cursor-pointer hover:bg-slate-700',
              !wallet.isInteractive && 'cursor-default',
              className
            )}
            onClick={handleClick}
            role={wallet.isInteractive ? 'button' : undefined}
            tabIndex={wallet.isInteractive ? 0 : undefined}
            onKeyDown={(e) => {
              if (wallet.isInteractive && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                handleClick()
              }
            }}
            aria-label={
              wallet.isInteractive
                ? 'Open wallet selector'
                : `Active wallet: ${wallet.activeAddressShort}`
            }
          >
            {/* Chain icon placeholder */}
            {wallet.activeChainIconKey && (
              <div
                className="h-5 w-5 rounded-full bg-slate-700"
                aria-hidden="true"
              />
            )}

            {/* Address */}
            <span className="truncate text-sm text-slate-300">
              {wallet.activeAddressShort}
            </span>

            {/* Mismatch indicator */}
            {wallet.showMismatchIndicator && (
              <AlertCircle
                className="h-4 w-4 text-amber-500"
                aria-label="Network mismatch"
              />
            )}

            {/* Copy button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-slate-700"
              onClick={(e) => {
                e.stopPropagation()
                handleCopy()
              }}
              aria-label={copied ? 'Copied!' : 'Copy address'}
            >
              <Copy className={cn('h-3 w-3', copied && 'text-green-500')} />
            </Button>

            {/* Dropdown indicator (only if interactive) */}
            {wallet.isInteractive && (
              <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="max-w-xs whitespace-pre-wrap break-all"
        >
          <div className="space-y-1 text-xs">
            {mismatchText && (
              <div className="mb-2 flex items-center gap-2 text-amber-500">
                <AlertCircle className="h-4 w-4" />
                <span>{mismatchText}</span>
              </div>
            )}
            <pre className="font-mono text-xs">{getTooltipContent()}</pre>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Get human-readable chain name from chainId
 */
function getChainName(chainId: number): string {
  const chainNames: Record<number, string> = {
    1: 'Ethereum',
    10: 'Optimism',
    56: 'BNB Chain',
    137: 'Polygon',
    8453: 'Base',
    42161: 'Arbitrum',
    43114: 'Avalanche',
  }
  return chainNames[chainId] || `Chain ${chainId}`
}
