import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Link2, CheckCircle, X, ExternalLink } from 'lucide-react';

/**
 * TrustBuilders Component
 * 
 * Displays trust badges to establish credibility.
 * Shows 4 trust badges (Non-custodial, No KYC, On-chain, Guardian-vetted)
 * with interactive proof modals.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export const TrustBuilders = () => {
  const [selectedBadge, setSelectedBadge] = useState<number | null>(null);

  // Trust badges configuration with proof
  const badges = [
    {
      icon: Lock,
      label: 'Non-custodial',
      description: 'You control your keys',
      proof: {
        title: 'Your Keys, Your Crypto',
        details: [
          'We never store your private keys',
          'All transactions signed locally in your wallet',
          'Smart contracts are non-upgradeable',
        ],
        link: 'https://github.com/alphawhale/contracts',
        linkText: 'View smart contracts',
      },
    },
    {
      icon: Shield,
      label: 'No KYC',
      description: 'Privacy-first approach',
      proof: {
        title: 'Zero Data Collection',
        details: [
          'No email, phone, or personal info required',
          'Wallet addresses are pseudonymous',
          'No tracking cookies or analytics',
        ],
        link: '/privacy',
        linkText: 'Read privacy policy',
      },
    },
    {
      icon: Link2,
      label: 'On-chain',
      description: 'Transparent & verifiable',
      proof: {
        title: 'Fully Transparent',
        details: [
          'All transactions visible on blockchain',
          'Smart contracts are open source',
          'Audited by CertiK and Trail of Bits',
        ],
        link: 'https://etherscan.io',
        linkText: 'Verify on Etherscan',
      },
    },
    {
      icon: CheckCircle,
      label: 'Guardian-vetted',
      description: 'Security-first design',
      proof: {
        title: 'Security Audits',
        details: [
          'Passed 3 independent security audits',
          'Real-time threat detection active',
          'Bug bounty program: up to $100K',
        ],
        link: '/security',
        linkText: 'View audit reports',
      },
    },
  ];

  return (
    <section
      className="w-full py-8 md:py-12 container mx-auto px-4 border-t border-white/10"
      aria-labelledby="trust-builders-heading"
      role="region"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading - Hidden on mobile to save space */}
        <h2
          id="trust-builders-heading"
          className="hidden md:block text-2xl md:text-3xl font-bold text-white text-center mb-8"
        >
          Trusted by the DeFi Community
        </h2>

        {/* Trust Badges */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
          role="list"
          aria-label="Trust badges"
        >
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.label}
                className="
                  bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-3 md:p-4
                  flex flex-col items-center text-center gap-1.5 md:gap-2
                  cursor-pointer
                  hover:border-cyan-500/30 hover:bg-white/10
                  transition-all duration-200
                "
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -4 }}
                onClick={() => setSelectedBadge(index)}
                role="button"
                aria-label={`${badge.label}: ${badge.description}. Click to see proof.`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedBadge(index);
                  }
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <Icon className="w-5 h-5 text-cyan-400" />
                </div>
                <p className="text-sm font-semibold text-white">
                  {badge.label}
                </p>
                <p className="text-xs text-gray-400">
                  {badge.description}
                </p>
                <p className="text-xs text-cyan-400 mt-1">
                  Click for proof →
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Proof Modal */}
        <AnimatePresence>
          {selectedBadge !== null && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedBadge(null)}
              />

              {/* Modal */}
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedBadge(null)}
              >
                <motion.div
                  className="bg-slate-900 border border-white/20 rounded-xl p-6 max-w-md w-full shadow-2xl"
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="proof-modal-title"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        {React.createElement(badges[selectedBadge].icon, {
                          className: 'w-6 h-6 text-cyan-400',
                        })}
                      </div>
                      <div>
                        <h3
                          id="proof-modal-title"
                          className="text-lg font-bold text-white"
                        >
                          {badges[selectedBadge].proof.title}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {badges[selectedBadge].label}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedBadge(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                      aria-label="Close proof modal"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Details */}
                  <ul className="space-y-3 mb-6">
                    {badges[selectedBadge].proof.details.map((detail, i) => (
                      <motion.li
                        key={i}
                        className="flex items-start gap-2 text-gray-300"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{detail}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* Link */}
                  <a
                    href={badges[selectedBadge].proof.link}
                    className="
                      flex items-center justify-center gap-2
                      w-full py-3 px-4
                      bg-cyan-700 hover:bg-cyan-600
                      text-white font-medium text-sm
                      rounded-lg
                      transition-colors duration-150
                    "
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {badges[selectedBadge].proof.linkText}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
