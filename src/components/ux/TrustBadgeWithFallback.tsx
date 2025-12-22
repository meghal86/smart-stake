/**
 * Trust Badge with Fallback Component
 * 
 * Requirements: R10.TRUST.AUDIT_LINKS, R10.TRUST.METHODOLOGY, R10.TRUST.TIMESTAMPS
 * 
 * Ensures trust badges never dead-end by providing fallback states
 * when proof destinations are unavailable.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { TrustBadge } from '@/components/ux/ProofModal';
import { ProofModalConfig, TrustSignal, TrustSignalVerificationManager } from '@/lib/ux/TrustSignalVerification';

interface TrustBadgeWithFallbackProps {
  trustSignal: TrustSignal;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

/**
 * Trust Badge that never dead-ends
 * 
 * This component ensures that clicking on any trust badge always results in
 * a meaningful action - either showing proof content or an honest unavailable state.
 */
export const TrustBadgeWithFallback = ({ 
  trustSignal, 
  icon: Icon = Shield,
  className = ""
}: TrustBadgeWithFallbackProps) => {
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'unavailable' | 'error'>('loading');
  const [proofConfig, setProofConfig] = useState<ProofModalConfig | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const verificationManager = TrustSignalVerificationManager.getInstance();

  useEffect(() => {
    const verifyTrustSignal = async () => {
      try {
        const result = await verificationManager.verifyTrustSignal(trustSignal);
        
        if (result.isValid && result.hasVerificationContent) {
          const config = verificationManager.getProofConfig(trustSignal.proofUrl);
          if (config) {
            setProofConfig(config);
            // Use TrustBadge directly for verified content
            return;
          } else {
            setVerificationStatus('unavailable');
            setErrorMessage('Proof content is temporarily unavailable');
          }
        } else {
          setVerificationStatus('unavailable');
          setErrorMessage(result.errorMessage || 'Verification content not available');
        }
      } catch (error) {
        setVerificationStatus('error');
        setErrorMessage('Unable to verify trust signal');
      }
    };

    verifyTrustSignal();
  }, [trustSignal, verificationManager]);

  // If verification is successful and we have proof config, use the standard TrustBadge
  if (proofConfig) {
    return (
      <TrustBadge
        label={trustSignal.label}
        description={trustSignal.description}
        proofConfig={proofConfig}
        icon={Icon}
        verified={true}
      />
    );
  }

  // For unavailable or error states, show fallback badge with honest messaging
  return (
    <TrustBadgeUnavailable
      label={trustSignal.label}
      description={trustSignal.description}
      status={verificationStatus}
      errorMessage={errorMessage}
      icon={Icon}
      className={className}
    />
  );
};

/**
 * Fallback Trust Badge for unavailable proof content
 * 
 * Shows honest unavailable state instead of dead-end links
 */
interface TrustBadgeUnavailableProps {
  label: string;
  description: string;
  status: 'loading' | 'unavailable' | 'error';
  errorMessage: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}

const TrustBadgeUnavailable = ({ 
  label, 
  description, 
  status, 
  errorMessage,
  icon: Icon,
  className 
}: TrustBadgeUnavailableProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Clock className="w-3 h-3 text-yellow-400 animate-pulse" />;
      case 'unavailable':
        return <AlertTriangle className="w-3 h-3 text-yellow-400" />;
      case 'error':
        return <AlertTriangle className="w-3 h-3 text-red-400" />;
      default:
        return <CheckCircle className="w-3 h-3 text-green-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'loading':
        return 'Verifying...';
      case 'unavailable':
        return 'Proof temporarily unavailable';
      case 'error':
        return 'Verification failed';
      default:
        return 'Click for proof →';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-yellow-400';
      case 'unavailable':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-cyan-400';
    }
  };

  return (
    <>
      <motion.div
        className={`
          bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-3 md:p-4
          flex flex-col items-center text-center gap-1.5 md:gap-2
          cursor-pointer
          hover:border-yellow-500/30 hover:bg-white/10
          transition-all duration-200
          ${className}
        `}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        onClick={() => setShowDetails(true)}
        role="button"
        aria-label={`${label}: ${description}. ${getStatusText()}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowDetails(true);
          }
        }}
      >
        <div
          className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center"
          aria-hidden="true"
        >
          <Icon className="w-5 h-5 text-yellow-400" />
        </div>
        
        <p className="text-sm font-semibold text-white">
          {label}
        </p>
        
        <p className="text-xs text-gray-400">
          {description}
        </p>
        
        <div className="flex items-center gap-1 mt-1">
          {getStatusIcon()}
          <p className={`text-xs ${getStatusColor()}`}>
            {getStatusText()}
          </p>
        </div>
      </motion.div>

      {/* Unavailable State Modal */}
      {showDetails && (
        <UnavailableProofModal
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          label={label}
          description={description}
          status={status}
          errorMessage={errorMessage}
        />
      )}
    </>
  );
};

/**
 * Modal for unavailable proof content
 * 
 * Provides honest explanation when proof is not available
 */
interface UnavailableProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  label: string;
  description: string;
  status: 'loading' | 'unavailable' | 'error';
  errorMessage: string;
}

const UnavailableProofModal = ({ 
  isOpen, 
  onClose, 
  label, 
  description, 
  status, 
  errorMessage 
}: UnavailableProofModalProps) => {
  if (!isOpen) return null;

  const getModalContent = () => {
    switch (status) {
      case 'loading':
        return {
          title: 'Verifying Trust Signal',
          content: [
            'We are currently verifying the proof content for this trust signal.',
            'This process ensures that all verification links lead to actual content.',
            'Please check back in a few moments.'
          ],
          actionText: 'Try Again',
          actionColor: 'bg-yellow-700 hover:bg-yellow-600'
        };
      case 'unavailable':
        return {
          title: 'Proof Temporarily Unavailable',
          content: [
            'The verification documentation for this trust signal is temporarily unavailable.',
            'This may be due to maintenance on external verification systems.',
            'We maintain transparency by showing this honest status rather than broken links.',
            'Our team is working to restore access to this verification content.'
          ],
          actionText: 'Check Status',
          actionColor: 'bg-yellow-700 hover:bg-yellow-600'
        };
      case 'error':
        return {
          title: 'Verification Error',
          content: [
            'We encountered an error while trying to verify this trust signal.',
            'This could be due to network issues or temporary service disruptions.',
            'We prioritize transparency and show this honest error state.',
            'Please try again later or contact support if the issue persists.'
          ],
          actionText: 'Retry Verification',
          actionColor: 'bg-red-700 hover:bg-red-600'
        };
      default:
        return {
          title: 'Unknown Status',
          content: ['An unknown error occurred.'],
          actionText: 'Close',
          actionColor: 'bg-gray-700 hover:bg-gray-600'
        };
    }
  };

  const modalContent = getModalContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <motion.div
        className="
          bg-slate-900 border border-white/20 rounded-xl p-6 
          max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto
          relative z-10
        "
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unavailable-modal-title"
        aria-describedby="unavailable-modal-description"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3
                id="unavailable-modal-title"
                className="text-lg font-bold text-white"
              >
                {modalContent.title}
              </h3>
              <p className="text-sm text-gray-400">
                {label} - {description}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div id="unavailable-modal-description" className="space-y-4 mb-6">
          <ul className="space-y-3">
            {modalContent.content.map((item, index) => (
              <motion.li
                key={index}
                className="flex items-start gap-2 text-gray-300"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{item}</span>
              </motion.li>
            ))}
          </ul>

          {/* Error Details */}
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-300">
                <strong>Technical Details:</strong> {errorMessage}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="
              flex-1 py-3 px-4
              bg-gray-700 hover:bg-gray-600
              text-white font-medium text-sm
              rounded-lg
              transition-colors duration-150
            "
          >
            Close
          </button>
          <button
            onClick={() => {
              // Trigger a retry or status check
              window.location.reload();
            }}
            className={`
              flex-1 py-3 px-4
              ${modalContent.actionColor}
              text-white font-medium text-sm
              rounded-lg
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-slate-900
            `}
          >
            {modalContent.actionText}
          </button>
        </div>

        {/* Transparency Note */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>
            We believe in transparency. Rather than showing broken links, 
            we provide honest status updates about verification availability.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default TrustBadgeWithFallback;