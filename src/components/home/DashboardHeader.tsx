import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useEnsName } from 'wagmi';
import { UserCheck, UserX } from 'lucide-react';
import { ActiveWalletIndicator } from '@/components/wallet/ActiveWalletIndicator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Dashboard Header Component
 * 
 * Simplified header for the Dashboard/Home page.
 * Shows logo, wallet connection, and maintains consistency with Hunter/Guardian.
 */
export function DashboardHeader() {
  const navigate = useNavigate();
  const { openConnectModal } = useConnectModal();
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address });

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleWalletClick = () => {
    if (!isConnected) {
      openConnectModal?.();
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Identity Indicator Component for Home page
  const IdentityIndicator = () => {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={isConnected ? "default" : "secondary"} 
              className={`
                flex items-center gap-1.5 px-2 py-1 text-xs font-medium cursor-help
                ${isConnected 
                  ? 'bg-[#00F5A0]/10 text-[#00F5A0] border-[#00F5A0]/20 hover:bg-[#00F5A0]/20' 
                  : 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20'
                }
              `}
            >
              {isConnected ? (
                <>
                  <UserCheck className="h-3 w-3" />
                  <span className="hidden sm:inline">Connected</span>
                  <span className="sm:hidden">Auth</span>
                </>
              ) : (
                <>
                  <UserX className="h-3 w-3" />
                  <span className="hidden sm:inline">Guest</span>
                  <span className="sm:hidden">Guest</span>
                </>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="text-center">
              {isConnected ? (
                <div>
                  <p className="font-medium">Wallet Connected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your wallet is connected and data is personalized
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">Guest Mode</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Connect a wallet to see personalized data and save settings
                  </p>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <motion.header
      className="sticky top-0 z-50 backdrop-blur-md border-b bg-[rgba(16,18,30,0.75)] border-[rgba(255,255,255,0.08)]"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
            aria-label="Go to home"
          >
            <img src="/header.png" alt="AlphaWhale Logo" className="w-8 h-8" />
            <h1 className="text-lg md:text-xl font-semibold text-white">
              AlphaWhale
            </h1>
          </button>
          
          {/* Identity Indicator */}
          <IdentityIndicator />
        </div>

        {/* Right Side - Wallet Connection */}
        <div className="flex items-center gap-3">
          {/* Active Wallet Indicator */}
          <ActiveWalletIndicator size="sm" compact />
          
          {isConnected && address ? (
            /* Connected State */
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-[#00F5A0]" />
              <span className="text-sm text-white hidden sm:inline">
                {ensName || truncateAddress(address)}
              </span>
              <span className="text-sm text-white sm:hidden">
                Connected
              </span>
            </div>
          ) : (
            /* Connect Wallet Button */
            <motion.button
              onClick={handleWalletClick}
              className="
                px-4 py-1.5
                bg-gradient-to-r from-[#00F5A0] to-[#7B61FF]
                hover:from-[#00E094] hover:to-[#6B51EF]
                text-white font-medium text-sm
                rounded-lg
                shadow-md shadow-[#00F5A0]/20
                transition-all duration-200
              "
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Connect wallet"
            >
              <span className="hidden sm:inline">Connect Wallet</span>
              <span className="sm:hidden">Connect</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
