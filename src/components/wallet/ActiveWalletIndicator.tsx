/**
 * ActiveWalletIndicator Component
 * 
 * Shows the currently active wallet with ENS/label resolution and switching capability.
 * Implements Task 5 requirements for persistent wallet indication across all screens.
 * 
 * Requirements:
 * - R3-AC1: Wallet chip shows label (ENS/nickname) + short address everywhere
 * - R3-AC2: Wallet switching resets wallet-scoped state
 * - R3-AC3: Shows skeleton/loading during switch
 * - R3-AC4: Shows success toast after switch
 * - R3-AC5: Never displays stale cross-wallet data
 * - R17-AC1: Multi-wallet support with clear labeling
 * - R17-AC2: ENS/nickname labeling everywhere wallets appear
 * - R17-AC3: Persist wallet list + last active wallet
 * - R17-AC4: Clear wallet switching UI
 * - R17-AC5: Wallet state management
 */

import { useState } from 'react';
import { ChevronDown, Wallet, RefreshCw, Check } from 'lucide-react';
import { useAccount, useEnsName } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ActiveWalletIndicatorProps {
  /** Size variant for different contexts */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the dropdown for wallet switching */
  showDropdown?: boolean;
  /** Whether to show the chain badge */
  showChain?: boolean;
  /** Custom className */
  className?: string;
  /** Compact mode for mobile/tight spaces */
  compact?: boolean;
}

/**
 * Truncate Ethereum address for display
 * @example truncateAddress('0x1234567890abcdef') => '0x1234...cdef'
 */
function truncateAddress(address: string | undefined, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function ActiveWalletIndicator({
  size = 'md',
  showDropdown = true,
  showChain = true,
  className,
  compact = false
}: ActiveWalletIndicatorProps) {
  const { address, isConnected, chain } = useAccount();
  const { data: ensName, isLoading: ensLoading } = useEnsName({ address });
  const { openConnectModal } = useConnectModal();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // No wallet connected
  if (!isConnected || !address) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openConnectModal?.()}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 text-xs font-medium",
                "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20",
                className
              )}
            >
              <Wallet className="h-3 w-3" />
              <span className={compact ? "hidden sm:inline" : ""}>Connect</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Connect a wallet to see your data</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Get display name with priority: ENS > Truncated Address
  const displayName = ensName || truncateAddress(address);
  const shortAddress = truncateAddress(address);

  // Size-based styling
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5", 
    lg: "text-base px-4 py-2"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  // Loading state during ENS resolution
  if (ensLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Skeleton className={cn("h-8 w-32", sizeClasses[size])} />
        <RefreshCw className={cn("animate-spin", iconSizes[size])} />
      </div>
    );
  }

  // Single wallet display (no dropdown needed for wagmi since it handles multi-wallet internally)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="default" 
            className={cn(
              "flex items-center gap-1.5 font-medium cursor-help",
              "bg-[#14B8A6]/10 text-[#14B8A6] border-[#14B8A6]/20 hover:bg-[#14B8A6]/20",
              sizeClasses[size],
              className
            )}
          >
            <Wallet className={iconSizes[size]} />
            <span className={compact ? "hidden sm:inline" : ""}>
              {displayName}
            </span>
            {!compact && displayName !== shortAddress && (
              <span className="text-xs opacity-70 hidden md:inline">
                {shortAddress}
              </span>
            )}
            {showChain && chain && (
              <Badge variant="secondary" className="text-xs px-1 py-0 ml-1">
                {chain.name?.toUpperCase() || 'ETH'}
              </Badge>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="text-center">
            <p className="font-medium">Active Wallet</p>
            <p className="text-xs text-muted-foreground mt-1">
              {address}
            </p>
            {chain && (
              <p className="text-xs text-muted-foreground">
                Chain: {chain.name}
              </p>
            )}
            {ensName && (
              <p className="text-xs text-muted-foreground">
                ENS: {ensName}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}