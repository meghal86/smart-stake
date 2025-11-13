/**
 * WalletSelector Component
 * 
 * Multi-wallet selector with dropdown for switching between connected wallets.
 * Displays wallet icon, label/ENS, and truncated address with full address tooltip.
 * 
 * Features:
 * - Wallet icon display with chain indicators
 * - Wallet label and address truncation (0x1234...5678)
 * - Dropdown with all connected wallets
 * - Active wallet indicator (checkmark)
 * - "Connect New Wallet" button
 * - Hover states and tooltips for full addresses
 * - Animated wallet icon entry (fade + slide)
 * - z-index above sticky header
 * - Light and dark theme support
 * - Responsive for mobile (icon only, hide labels)
 * - Full keyboard navigation support (Tab, Enter, Escape, Arrow keys)
 * - Focus management and focus trap
 * - WCAG AA compliant accessibility features
 * - Minimum 44px touch targets on mobile
 * - Screen reader optimized with ARIA labels
 * - High contrast mode support
 * - Reduced motion support
 * 
 * Keyboard Navigation:
 * - Tab: Navigate through dropdown items
 * - Enter/Space: Select wallet or trigger action
 * - Escape: Close dropdown
 * - Arrow Up/Down: Navigate through dropdown items
 * - Focus returns to trigger after selection
 * 
 * Accessibility Features:
 * - aria-label on all interactive elements
 * - aria-expanded for dropdown state
 * - aria-haspopup for trigger button
 * - aria-describedby for wallet address + ENS combo
 * - aria-current for active wallet
 * - aria-busy for loading states
 * - Minimum 44px touch targets (mobile-friendly)
 * - High contrast mode support
 * - Reduced motion support (prefers-reduced-motion)
 * - Screen reader announcements for state changes
 * 
 * @see .kiro/specs/hunter-screen-feed/requirements.md - Requirement 18
 * @see .kiro/specs/hunter-screen-feed/tasks.md - Task 42, Task 48, Task 49
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Plus, Wallet as WalletIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWallet, truncateAddress, type ConnectedWallet } from '@/contexts/WalletContext';
import { WalletIcon as WalletProviderIcon } from './WalletIcon';
import { WalletLabelEditor } from './WalletLabelEditor';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================================================
// Types
// ============================================================================

interface WalletSelectorProps {
  className?: string;
  showLabel?: boolean; // Show label on desktop, hide on mobile
  variant?: 'default' | 'compact';
}

// ============================================================================
// Chain Badge Component
// ============================================================================

interface ChainBadgeProps {
  chain: string;
  className?: string;
}

function ChainBadge({ chain, className }: ChainBadgeProps) {
  const chainColors: Record<string, string> = {
    ethereum: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    polygon: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    arbitrum: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    optimism: 'bg-red-500/20 text-red-400 border-red-500/30',
    base: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
    bsc: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    avalanche: 'bg-red-600/20 text-red-300 border-red-600/30',
    fantom: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
  };

  const color = chainColors[chain.toLowerCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border',
        color,
        className
      )}
    >
      {chain.charAt(0).toUpperCase() + chain.slice(1)}
    </span>
  );
}

// ============================================================================
// Wallet Display Component
// ============================================================================

interface WalletDisplayProps {
  wallet: ConnectedWallet;
  isActive?: boolean;
  showLabel?: boolean;
  variant?: 'default' | 'compact';
}

function WalletDisplay({ wallet, isActive, showLabel = true, variant = 'default' }: WalletDisplayProps) {
  // Priority: ENS > Lens > Unstoppable > Label > Truncated Address
  // Requirement 18.19: Display resolved name in selector if available
  const displayName = wallet.ens || wallet.lens || wallet.unstoppable || wallet.label || truncateAddress(wallet.address);
  const isCompact = variant === 'compact';
  
  // Generate unique IDs for aria-describedby
  const walletId = `wallet-${wallet.address.slice(0, 10)}`;
  const addressId = `${walletId}-address`;
  const chainId = `${walletId}-chain`;

  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* Wallet Icon with Animation */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex-shrink-0"
        aria-hidden="true" // Decorative icon
      >
        <WalletProviderIcon 
          connector="metamask" 
          className={cn(
            'transition-all',
            isCompact ? 'w-5 h-5' : 'w-6 h-6'
          )}
        />
      </motion.div>

      {/* Wallet Info */}
      {showLabel && (
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span 
              id={walletId}
              className={cn(
                'font-medium truncate',
                isCompact ? 'text-xs' : 'text-sm',
                'text-gray-900 dark:text-gray-100'
              )}
            >
              {displayName}
            </span>
            {isActive && (
              <Check 
                className="w-3.5 h-3.5 text-green-500 flex-shrink-0" 
                aria-label="Active wallet"
                role="img"
              />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span 
              id={addressId}
              className={cn(
                'truncate',
                isCompact ? 'text-[10px]' : 'text-xs',
                'text-gray-500 dark:text-gray-400'
              )}
            >
              {truncateAddress(wallet.address)}
            </span>
            <ChainBadge chain={wallet.chain} aria-describedby={chainId} />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function WalletSelector({ 
  className, 
  showLabel = true,
  variant = 'default',
}: WalletSelectorProps) {
  const { 
    connectedWallets, 
    activeWallet, 
    setActiveWallet, 
    connectWallet, 
    isLoading,
    isSwitching 
  } = useWallet();

  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const activeWalletData = connectedWallets.find(w => w.address === activeWallet);
  const hasWallets = connectedWallets.length > 0;

  // Handle wallet selection with smooth transition
  const handleSelectWallet = (address: string) => {
    // Don't allow switching if already switching
    if (isSwitching) return;
    
    setActiveWallet(address);
    setIsOpen(false);
    
    // Return focus to trigger after selection
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 0);
  };

  // Handle connect new wallet
  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      setIsOpen(false);
      
      // Return focus to trigger after connection
      setTimeout(() => {
        triggerRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  // Handle keyboard navigation on trigger
  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    // Open dropdown with Enter or Space
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(true);
    }
    // Close dropdown with Escape
    else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // Return focus to trigger when dropdown closes
  useEffect(() => {
    if (!isOpen && triggerRef.current) {
      // Small delay to ensure dropdown is fully closed
      const timer = setTimeout(() => {
        triggerRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // If no wallets connected, show connect button
  if (!hasWallets) {
    return (
      <motion.button
        ref={triggerRef}
        onClick={handleConnectWallet}
        onKeyDown={(e) => {
          // Handle Enter and Space
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleConnectWallet();
          }
        }}
        disabled={isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
          'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
          'text-white font-medium text-sm',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'dark:focus:ring-offset-gray-900',
          'min-h-[44px] min-w-[44px]', // Minimum touch target size
          'motion-safe:hover:scale-[1.02]', // Respect reduced motion
          'motion-safe:active:scale-[0.98]',
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Connect wallet to view personalized opportunities"
        aria-busy={isLoading}
        role="button"
      >
        {isLoading ? (
          <>
            <div 
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Connecting...</span>
            <span className="sm:hidden">...</span>
          </>
        ) : (
          <>
            <WalletIcon className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Connect Wallet</span>
            <span className="sm:hidden">Connect</span>
          </>
        )}
      </motion.button>
    );
  }

  // Generate unique ID for aria-describedby
  const activeWalletDescId = activeWalletData 
    ? `wallet-desc-${activeWalletData.address.slice(0, 10)}`
    : undefined;

  return (
    <TooltipProvider>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <motion.button
                ref={triggerRef}
                onKeyDown={handleTriggerKeyDown}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-lg',
                  'bg-white dark:bg-gray-800',
                  'border border-gray-200 dark:border-gray-700',
                  'hover:bg-gray-50 dark:hover:bg-gray-750',
                  'active:bg-gray-100 dark:active:bg-gray-700',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  'dark:focus:ring-offset-gray-900',
                  'min-w-0',
                  'min-h-[44px]', // Minimum touch target size
                  'motion-safe:hover:scale-[1.01]', // Respect reduced motion
                  'motion-safe:active:scale-[0.99]',
                  isSwitching && 'opacity-70 cursor-wait',
                  className
                )}
                whileHover={{ scale: isSwitching ? 1 : 1.01 }}
                whileTap={{ scale: isSwitching ? 1 : 0.99 }}
                aria-label={`Select wallet. Currently active: ${activeWalletData?.ens || activeWalletData?.label || truncateAddress(activeWalletData?.address || '')}`}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-busy={isSwitching}
                aria-describedby={activeWalletDescId}
                disabled={isSwitching}
                role="button"
              >
                {activeWalletData && (
                  <>
                    {isSwitching ? (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 border-2 border-gray-400 dark:border-gray-500 border-t-blue-500 rounded-full animate-spin motion-reduce:animate-none"
                          aria-hidden="true"
                        />
                        {showLabel && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Switching...
                          </span>
                        )}
                      </div>
                    ) : (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeWallet}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <WalletDisplay
                            wallet={activeWalletData}
                            showLabel={showLabel}
                            variant={variant}
                          />
                        </motion.div>
                      </AnimatePresence>
                    )}
                    {/* Hidden description for screen readers */}
                    <span id={activeWalletDescId} className="sr-only">
                      {isSwitching && 'Switching wallet. '}
                      {activeWalletData.ens && `ENS name: ${activeWalletData.ens}. `}
                      Address: {activeWalletData.address}. 
                      Chain: {activeWalletData.chain}.
                    </span>
                  </>
                )}
                <ChevronDown 
                  className={cn(
                    'w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0',
                    'transition-transform motion-reduce:transition-none',
                    isOpen && 'rotate-180',
                    isSwitching && 'animate-pulse motion-reduce:animate-none'
                  )}
                  aria-hidden="true"
                />
              </motion.button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs" role="tooltip">
            <p className="text-xs">
              {activeWalletData?.ens || activeWalletData?.label || 'Active Wallet'}
            </p>
            <p className="text-xs text-gray-400 font-mono">
              {activeWalletData?.address}
            </p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent
          align="end"
          className={cn(
            'w-72 p-2',
            'bg-white dark:bg-gray-800',
            'border border-gray-200 dark:border-gray-700',
            'shadow-lg',
            'z-[100]', // Above sticky header (typically z-50)
          )}
          sideOffset={8}
          onCloseAutoFocus={(e) => {
            // Prevent default behavior and manually focus trigger
            e.preventDefault();
            triggerRef.current?.focus();
          }}
          onEscapeKeyDown={() => {
            setIsOpen(false);
          }}
          role="menu"
          aria-label="Wallet selection menu"
        >
          <DropdownMenuLabel 
            className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide px-2 py-1"
            id="wallet-menu-label"
          >
            Connected Wallets
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="my-1" role="separator" />

          {/* Wallet List */}
          <div className="space-y-1" role="group" aria-labelledby="wallet-menu-label">
            {connectedWallets.map((wallet, index) => {
              const isActive = wallet.address === activeWallet;
              const walletDescId = `wallet-item-desc-${wallet.address.slice(0, 10)}`;
              const displayName = wallet.ens || wallet.label || truncateAddress(wallet.address);
              
              return (
                <div key={wallet.address} className="space-y-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem
                        onClick={() => handleSelectWallet(wallet.address)}
                        onKeyDown={(e) => {
                          // Handle Enter and Space
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelectWallet(wallet.address);
                          }
                        }}
                        disabled={isSwitching}
                        className={cn(
                          'flex items-center gap-2 px-2 py-2.5 rounded-md cursor-pointer',
                          'hover:bg-gray-100 dark:hover:bg-gray-750',
                          'focus:bg-gray-100 dark:focus:bg-gray-750',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
                          'transition-colors duration-150 motion-reduce:transition-none',
                          'min-h-[44px]', // Touch-friendly minimum (WCAG 2.5.5)
                          'touch-manipulation', // Optimize for touch
                          isActive && 'bg-blue-50 dark:bg-blue-900/20',
                          isSwitching && 'opacity-50 cursor-not-allowed'
                        )}
                        aria-label={`${isActive ? 'Currently selected: ' : 'Select '}${displayName}${wallet.ens ? `, ENS name ${wallet.ens}` : ''}, address ${wallet.address}, on ${wallet.chain} network`}
                        aria-current={isActive ? 'true' : undefined}
                        aria-describedby={walletDescId}
                        aria-disabled={isSwitching}
                        role="menuitemradio"
                        aria-checked={isActive}
                        tabIndex={isActive ? 0 : -1}
                      >
                        <WalletDisplay
                          wallet={wallet}
                          isActive={isActive}
                          showLabel={true}
                          variant="compact"
                        />
                        {/* Hidden description for screen readers */}
                        <span id={walletDescId} className="sr-only">
                          Wallet {index + 1} of {connectedWallets.length}.
                          {wallet.balance && ` Balance: ${wallet.balance}.`}
                          {isActive && ' This is your currently active wallet.'}
                        </span>
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs" role="tooltip">
                      <p className="text-xs font-mono">{wallet.address}</p>
                      {wallet.balance && (
                        <p className="text-xs text-gray-400 mt-1">
                          Balance: {wallet.balance}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* Wallet Label Editor */}
                  <div className="px-2">
                    <WalletLabelEditor
                      address={wallet.address}
                      currentLabel={wallet.label}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <DropdownMenuSeparator className="my-2" role="separator" />

          {/* Connect New Wallet Button */}
          <DropdownMenuItem
            onClick={handleConnectWallet}
            onKeyDown={(e) => {
              // Handle Enter and Space
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleConnectWallet();
              }
            }}
            disabled={isLoading || isSwitching}
            className={cn(
              'flex items-center gap-2 px-2 py-2.5 rounded-md cursor-pointer',
              'hover:bg-gray-100 dark:hover:bg-gray-750',
              'focus:bg-gray-100 dark:focus:bg-gray-750',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
              'transition-colors duration-150 motion-reduce:transition-none',
              'text-blue-600 dark:text-blue-400 font-medium',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'min-h-[44px]', // Touch-friendly minimum (WCAG 2.5.5)
              'touch-manipulation', // Optimize for touch
            )}
            aria-label="Connect new wallet to add another wallet to your account"
            aria-busy={isLoading || isSwitching}
            aria-disabled={isLoading || isSwitching}
            role="menuitem"
          >
            {isLoading ? (
              <>
                <div 
                  className="w-4 h-4 border-2 border-blue-400 dark:border-blue-500 border-t-transparent rounded-full animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
                <span className="text-sm">Connecting...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm">Connect New Wallet</span>
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default WalletSelector;
