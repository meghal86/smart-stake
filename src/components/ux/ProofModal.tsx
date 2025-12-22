/**
 * Proof Modal Component
 * 
 * Requirements: R10.TRUST.AUDIT_LINKS, R10.TRUST.METHODOLOGY, R10.TRUST.TIMESTAMPS
 * 
 * Standardized modal for displaying trust signal verification content
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, CheckCircle, Calendar, Shield } from 'lucide-react';
import { ProofModalConfig } from '@/lib/ux/TrustSignalVerification';

interface ProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ProofModalConfig;
  title?: string;
}

export const ProofModal = ({ isOpen, onClose, config, title }: ProofModalProps) => {
  // Handle external links
  const handleLinkClick = () => {
    if (config.type === 'external') {
      window.open(config.linkUrl, '_blank', 'noopener,noreferrer');
    } else if (config.type === 'page') {
      window.location.href = config.linkUrl;
    }
    onClose();
  };

  // Format last updated date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="
                bg-slate-900 border border-white/20 rounded-xl p-6 
                max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto
              "
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="proof-modal-title"
              aria-describedby="proof-modal-description"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3
                      id="proof-modal-title"
                      className="text-lg font-bold text-white"
                    >
                      {title || config.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Verification Details
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close proof modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div id="proof-modal-description" className="space-y-4 mb-6">
                <ul className="space-y-3">
                  {config.content.map((item, index) => (
                    <motion.li
                      key={index}
                      className="flex items-start gap-2 text-gray-300"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* Last Updated */}
                {config.lastUpdated && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-white/10">
                    <Calendar className="w-3 h-3" />
                    <span>Last updated: {formatDate(config.lastUpdated)}</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={handleLinkClick}
                className="
                  flex items-center justify-center gap-2
                  w-full py-3 px-4
                  bg-cyan-700 hover:bg-cyan-600
                  text-white font-medium text-sm
                  rounded-lg
                  transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900
                "
                aria-label={`${config.linkText} - ${config.type === 'external' ? 'Opens in new tab' : 'Navigate to page'}`}
              >
                {config.linkText}
                {config.type === 'external' && <ExternalLink className="w-4 h-4" />}
              </button>

              {/* Disclaimer for external links */}
              {config.type === 'external' && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  This link will open in a new tab
                </p>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Trust Badge Component with Proof Modal Integration
 */
interface TrustBadgeProps {
  label: string;
  description: string;
  proofConfig: ProofModalConfig;
  icon?: React.ComponentType<{ className?: string }>;
  verified?: boolean;
}

export const TrustBadge = ({ 
  label, 
  description, 
  proofConfig, 
  icon: Icon = Shield,
  verified = true 
}: TrustBadgeProps) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <>
      <motion.div
        className="
          bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-3 md:p-4
          flex flex-col items-center text-center gap-1.5 md:gap-2
          cursor-pointer
          hover:border-cyan-500/30 hover:bg-white/10
          transition-all duration-200
        "
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.05, y: -4 }}
        onClick={() => setIsModalOpen(true)}
        role="button"
        aria-label={`${label}: ${description}. Click to see proof.`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsModalOpen(true);
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
          {label}
        </p>
        
        <p className="text-xs text-gray-400">
          {description}
        </p>
        
        <div className="flex items-center gap-1 mt-1">
          {verified && <CheckCircle className="w-3 h-3 text-green-400" />}
          <p className="text-xs text-cyan-400">
            Click for proof →
          </p>
        </div>
      </motion.div>

      <ProofModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        config={proofConfig}
        title={label}
      />
    </>
  );
};