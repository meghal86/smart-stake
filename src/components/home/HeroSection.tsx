import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useHomeAuth } from '@/lib/context/HomeAuthContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface HeroSectionProps {
  onCtaClick?: () => void;
}

export const HeroSection = ({ onCtaClick }: HeroSectionProps) => {
  const navigate = useNavigate();
  const { openConnectModal } = useConnectModal();
  const { isAuthenticated, isLoading } = useHomeAuth();
  const { data: networkStatus } = useNetworkStatus();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const handleCtaClick = () => {
    if (onCtaClick) {
      onCtaClick();
      return;
    }

    if (!isAuthenticated) {
      openConnectModal?.();
    } else {
      navigate('/guardian');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCtaClick();
    }
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <section
      className="relative min-h-[70vh] flex items-center justify-center px-4 py-12 md:py-20"
      aria-label="Hero section"
    >
      {/* Minimal Background */}
      <div className="absolute inset-0 z-0 bg-[#0A0F1F]" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="text-center">
          {/* Live Network Status */}
          <motion.div
            className="inline-flex items-center gap-3 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {networkStatus ? (
              <>
                {/* Status Dot */}
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: 
                        networkStatus.status === 'optimal' ? '#10b981' :
                        networkStatus.status === 'normal' ? '#f59e0b' :
                        '#ef4444'
                    }}
                  />
                  <span className="text-sm text-gray-400">
                    Network {networkStatus.status}
                  </span>
                </div>
                
                {/* Divider */}
                <div className="w-px h-4 bg-gray-700" />
                
                {/* Gas Price */}
                <span className="text-sm text-gray-400">
                  Gas: {networkStatus.gasPrice} gwei
                </span>
              </>
            ) : (
              /* Loading State */
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-600 animate-pulse" />
                <span className="text-sm text-gray-500">
                  Loading network status...
                </span>
              </div>
            )}
          </motion.div>

          {/* Headline - Clean Typography */}
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-6 leading-tight tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Institutional-Grade
            <br />
            DeFi Risk Management
          </motion.h1>

          {/* Subheading - Understated */}
          <motion.p
            className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl mx-auto font-light"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Real-time security monitoring, alpha discovery, and tax optimization for digital assets.
          </motion.p>

          {/* Divider Line */}
          <motion.div
            className="w-16 h-px bg-gray-700 mx-auto mb-8"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          />

          {/* CTA Button - Gradient */}
          <motion.button
            onClick={handleCtaClick}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="
              bg-gradient-to-r from-[#00F5A0] to-[#7B61FF]
              hover:from-[#00E094] hover:to-[#6B51EF]
              active:from-[#00D088] active:to-[#5B41DF]
              text-white font-medium
              px-8 py-3 rounded-lg
              shadow-lg shadow-[#00F5A0]/20
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-[#00F5A0] focus:ring-offset-2 focus:ring-offset-[#0A0F1F]
              text-base
            "
            aria-label={isAuthenticated ? 'Access dashboard' : 'Connect wallet to get started'}
            tabIndex={0}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? 'Loading...' : isAuthenticated ? 'Access Dashboard' : 'Connect Wallet'}
          </motion.button>

          {/* Social Proof - Minimal */}
          <motion.p
            className="text-sm text-gray-500 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            Trusted by institutional investors and DeFi traders
          </motion.p>
        </div>
      </div>
    </section>
  );
};
