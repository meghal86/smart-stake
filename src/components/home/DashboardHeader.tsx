import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useHomeAuth } from '@/lib/context/HomeAuthContext';

/**
 * Dashboard Header Component
 * 
 * Simplified header for the Dashboard/Home page.
 * Shows logo, wallet connection, and maintains consistency with Hunter/Guardian.
 */
export function DashboardHeader() {
  const navigate = useNavigate();
  const { openConnectModal } = useConnectModal();
  const { isAuthenticated, address } = useHomeAuth();

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleWalletClick = () => {
    if (!isAuthenticated) {
      openConnectModal?.();
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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

        {/* Right Side - Wallet Connection */}
        <div className="flex items-center gap-3">
          {isAuthenticated && address ? (
            /* Connected State */
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-[#00F5A0]" />
              <span className="text-sm text-white hidden sm:inline">
                {truncateAddress(address)}
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
