/**
 * Metrics Proof Component
 * 
 * Requirements: R14.TRUST.METRICS_PROOF, R10.TRUST.METHODOLOGY
 * 
 * Provides "How it's calculated" links for platform metrics with verification.
 * Shows honest unavailable states when proof destinations don't exist.
 */

import React, { useState, useEffect } from 'react';
import { HelpCircle, Calculator, TrendingUp, Shield, Users, AlertTriangle } from 'lucide-react';
import { ProofModal } from './ProofModal';
import { ProofModalConfig } from '@/lib/ux/TrustSignalVerification';
import { useProofUrlVerification, ProofUrlVerificationResult } from '@/lib/ux/ProofUrlVerification';

interface MetricsProofProps {
  metricType: 'assets_protected' | 'wallets_protected' | 'yield_optimized' | 'guardian_score' | 'scans_run';
  value: string | number;
  label: string;
  className?: string;
}

export const MetricsProof = ({ metricType, value, label, className = '' }: MetricsProofProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [verificationResult, setVerificationResult] = useState<ProofUrlVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  
  const { verifyUrl } = useProofUrlVerification();

  // Get proof configuration for each metric type
  const getProofConfig = (type: MetricsProofProps['metricType']): ProofModalConfig => {
    switch (type) {
      case 'assets_protected':
        return {
          title: 'Assets Protected Calculation',
          content: [
            'Total USD value of all wallets actively monitored by Guardian',
            'Aggregated across all connected wallet addresses in real-time',
            'Includes DeFi positions, token holdings, and staked assets',
            'Updated every 30 seconds using live price feeds from CoinGecko',
            'Excludes dust amounts below $1 to prevent spam inflation'
          ],
          linkText: 'View Data Sources',
          linkUrl: '/proof/assets-protected-sources',
          lastUpdated: new Date('2024-12-15'),
          type: 'page'
        };

      case 'wallets_protected':
        return {
          title: 'Wallets Protected Count',
          content: [
            'Total number of unique wallet addresses monitored by Guardian',
            'Includes both actively connected and previously scanned wallets',
            'Deduplicated to prevent double-counting across multiple users',
            'Only counts wallets with at least one successful security scan',
            'Updated in real-time as new wallets are added'
          ],
          linkText: 'View Methodology',
          linkUrl: '/proof/wallets-protected-methodology',
          lastUpdated: new Date('2024-12-10'),
          type: 'page'
        };

      case 'yield_optimized':
        return {
          title: 'Yield Optimized Calculation',
          content: [
            'Total USD value of yield-generating positions optimized through Hunter',
            'Includes successful opportunity executions and ongoing positions',
            'Calculated based on initial position size at time of optimization',
            'Excludes failed transactions and positions closed within 24 hours',
            'Updated daily with position value changes'
          ],
          linkText: 'View Calculation Details',
          linkUrl: '/proof/yield-optimized-calculation',
          lastUpdated: new Date('2024-12-12'),
          type: 'page'
        };

      case 'guardian_score':
        return {
          title: 'Guardian Score Methodology',
          content: [
            'Multi-factor risk assessment combining 15+ security indicators',
            'Machine learning model trained on 100,000+ security incidents',
            'Real-time threat intelligence from Chainalysis and TRM Labs',
            'Weighted scoring: 40% on-chain behavior, 35% approvals, 25% reputation',
            'Scores updated every 10 minutes with new transaction data'
          ],
          linkText: 'View Full Methodology',
          linkUrl: '/proof/guardian-score-methodology',
          lastUpdated: new Date('2024-12-01'),
          type: 'page'
        };

      case 'scans_run':
        return {
          title: 'Security Scans Count',
          content: [
            'Total number of comprehensive security scans completed by Guardian',
            'Includes both manual user-initiated scans and automated rescans',
            'Each scan analyzes 15+ risk factors across multiple blockchains',
            'Excludes partial scans that failed due to network issues',
            'Counter increments only after successful scan completion'
          ],
          linkText: 'View Scan Details',
          linkUrl: '/proof/security-scans-details',
          lastUpdated: new Date('2024-12-14'),
          type: 'page'
        };

      default:
        return {
          title: 'Metric Calculation',
          content: [
            'This metric is calculated using verified data sources',
            'Updated regularly to ensure accuracy',
            'Methodology available for transparency'
          ],
          linkText: 'Learn More',
          linkUrl: '/proof/general-methodology',
          lastUpdated: new Date(),
          type: 'page'
        };
    }
  };

  const getIcon = (type: MetricsProofProps['metricType']) => {
    switch (type) {
      case 'assets_protected':
        return Shield;
      case 'wallets_protected':
        return Users;
      case 'yield_optimized':
        return TrendingUp;
      case 'guardian_score':
        return Shield;
      case 'scans_run':
        return Calculator;
      default:
        return HelpCircle;
    }
  };

  const proofConfig = getProofConfig(metricType);
  const Icon = getIcon(metricType);

  // Verify proof URL on component mount
  useEffect(() => {
    const verifyProofUrl = async () => {
      setIsVerifying(true);
      try {
        const result = await verifyUrl(proofConfig.linkUrl);
        setVerificationResult(result);
      } catch (error) {
        setVerificationResult({
          isAvailable: false,
          status: {
            url: proofConfig.linkUrl,
            exists: false,
            lastChecked: new Date(),
            errorMessage: 'Verification failed'
          },
          fallbackMessage: 'Unable to verify documentation availability'
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyProofUrl();
  }, [metricType, proofConfig.linkUrl, verifyUrl]);

  // Handle click based on verification result
  const handleClick = () => {
    if (verificationResult?.isAvailable) {
      setIsModalOpen(true);
    } else {
      // Show unavailable modal instead of dead-end link
      setIsModalOpen(true);
    }
  };

  // Get button text and styling based on verification status
  const getButtonProps = () => {
    if (isVerifying) {
      return {
        text: 'Verifying...',
        className: 'text-yellow-400 hover:text-yellow-300',
        icon: HelpCircle,
        disabled: false
      };
    }

    if (verificationResult?.isAvailable) {
      return {
        text: 'How it\'s calculated',
        className: 'text-cyan-400 hover:text-cyan-300',
        icon: HelpCircle,
        disabled: false
      };
    }

    return {
      text: 'Documentation unavailable',
      className: 'text-yellow-400 hover:text-yellow-300',
      icon: AlertTriangle,
      disabled: false
    };
  };

  const buttonProps = getButtonProps();

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl md:text-3xl font-bold text-white">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            <p className="text-sm text-gray-400">{label}</p>
          </div>
          <Icon className="w-6 h-6 text-cyan-400" />
        </div>
        
        <button
          onClick={handleClick}
          disabled={buttonProps.disabled}
          className={`
            flex items-center gap-1 text-xs transition-colors
            focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900
            rounded px-1 py-0.5 ${buttonProps.className}
            ${buttonProps.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          `}
          aria-label={
            isVerifying 
              ? 'Verifying documentation availability'
              : verificationResult?.isAvailable 
                ? `How ${label.toLowerCase()} is calculated`
                : 'Documentation temporarily unavailable'
          }
        >
          <buttonProps.icon className="w-3 h-3" />
          {buttonProps.text}
        </button>
      </div>

      <ProofModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        config={verificationResult?.isAvailable ? proofConfig : getUnavailableConfig(proofConfig, verificationResult)}
      />
    </>
  );
};

/**
 * Create unavailable proof config when destination doesn't exist
 */
function getUnavailableConfig(originalConfig: ProofModalConfig, verificationResult: ProofUrlVerificationResult | null): ProofModalConfig {
  const fallbackMessage = verificationResult?.fallbackMessage || 'Documentation temporarily unavailable';
  
  return {
    title: `${originalConfig.title} - Unavailable`,
    content: [
      fallbackMessage,
      'We maintain transparency by showing this honest status rather than broken links.',
      'Our team is working to make this documentation available.',
      'Please check back later or contact support if you need immediate assistance.'
    ],
    linkText: 'Check Status',
    linkUrl: '#', // Safe fallback that won't navigate
    lastUpdated: new Date(),
    type: 'modal'
  };
}

/**
 * Inline Metrics Proof Link
 * 
 * For use within text or smaller components
 */
interface InlineMetricsProofProps {
  metricType: MetricsProofProps['metricType'];
  children: React.ReactNode;
  className?: string;
}

export const InlineMetricsProof = ({ metricType, children, className = '' }: InlineMetricsProofProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [verificationResult, setVerificationResult] = useState<ProofUrlVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  
  const { verifyUrl } = useProofUrlVerification();
  const proofConfig = getProofConfig(metricType);

  // Verify proof URL on component mount
  useEffect(() => {
    const verifyProofUrl = async () => {
      setIsVerifying(true);
      try {
        const result = await verifyUrl(proofConfig.linkUrl);
        setVerificationResult(result);
      } catch (error) {
        setVerificationResult({
          isAvailable: false,
          status: {
            url: proofConfig.linkUrl,
            exists: false,
            lastChecked: new Date(),
            errorMessage: 'Verification failed'
          },
          fallbackMessage: 'Unable to verify documentation availability'
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyProofUrl();
  }, [metricType, proofConfig.linkUrl, verifyUrl]);

  // Get styling based on verification status
  const getButtonClassName = () => {
    const baseClasses = `
      inline-flex items-center gap-1 transition-colors underline decoration-dotted underline-offset-2
      focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900
      rounded px-1 py-0.5 ${className}
    `;

    if (isVerifying) {
      return `${baseClasses} text-yellow-400 hover:text-yellow-300`;
    }

    if (verificationResult?.isAvailable) {
      return `${baseClasses} text-cyan-400 hover:text-cyan-300`;
    }

    return `${baseClasses} text-yellow-400 hover:text-yellow-300`;
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={getButtonClassName()}
        aria-label={
          isVerifying 
            ? 'Verifying documentation availability'
            : verificationResult?.isAvailable 
              ? 'Click to see how this is calculated'
              : 'Documentation temporarily unavailable'
        }
      >
        {children}
        {isVerifying ? (
          <HelpCircle className="w-3 h-3 animate-pulse" />
        ) : verificationResult?.isAvailable ? (
          <HelpCircle className="w-3 h-3" />
        ) : (
          <AlertTriangle className="w-3 h-3" />
        )}
      </button>

      <ProofModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        config={verificationResult?.isAvailable ? proofConfig : getUnavailableConfig(proofConfig, verificationResult)}
      />
    </>
  );
};

// Helper function (duplicated from above for standalone usage)
function getProofConfig(type: MetricsProofProps['metricType']): ProofModalConfig {
  switch (type) {
    case 'assets_protected':
      return {
        title: 'Assets Protected Calculation',
        content: [
          'Total USD value of all wallets actively monitored by Guardian',
          'Aggregated across all connected wallet addresses in real-time',
          'Includes DeFi positions, token holdings, and staked assets',
          'Updated every 30 seconds using live price feeds from CoinGecko',
          'Excludes dust amounts below $1 to prevent spam inflation'
        ],
        linkText: 'View Data Sources',
        linkUrl: '/proof/assets-protected-sources',
        lastUpdated: new Date('2024-12-15'),
        type: 'page'
      };

    case 'wallets_protected':
      return {
        title: 'Wallets Protected Count',
        content: [
          'Total number of unique wallet addresses monitored by Guardian',
          'Includes both actively connected and previously scanned wallets',
          'Deduplicated to prevent double-counting across multiple users',
          'Only counts wallets with at least one successful security scan',
          'Updated in real-time as new wallets are added'
        ],
        linkText: 'View Methodology',
        linkUrl: '/proof/wallets-protected-methodology',
        lastUpdated: new Date('2024-12-10'),
        type: 'page'
      };

    case 'yield_optimized':
      return {
        title: 'Yield Optimized Calculation',
        content: [
          'Total USD value of yield-generating positions optimized through Hunter',
          'Includes successful opportunity executions and ongoing positions',
          'Calculated based on initial position size at time of optimization',
          'Excludes failed transactions and positions closed within 24 hours',
          'Updated daily with position value changes'
        ],
        linkText: 'View Calculation Details',
        linkUrl: '/proof/yield-optimized-calculation',
        lastUpdated: new Date('2024-12-12'),
        type: 'page'
      };

    case 'guardian_score':
      return {
        title: 'Guardian Score Methodology',
        content: [
          'Multi-factor risk assessment combining 15+ security indicators',
          'Machine learning model trained on 100,000+ security incidents',
          'Real-time threat intelligence from Chainalysis and TRM Labs',
          'Weighted scoring: 40% on-chain behavior, 35% approvals, 25% reputation',
          'Scores updated every 10 minutes with new transaction data'
        ],
        linkText: 'View Full Methodology',
        linkUrl: '/proof/guardian-score-methodology',
        lastUpdated: new Date('2024-12-01'),
        type: 'page'
      };

    case 'scans_run':
      return {
        title: 'Security Scans Count',
        content: [
          'Total number of comprehensive security scans completed by Guardian',
          'Includes both manual user-initiated scans and automated rescans',
          'Each scan analyzes 15+ risk factors across multiple blockchains',
          'Excludes partial scans that failed due to network issues',
          'Counter increments only after successful scan completion'
        ],
        linkText: 'View Scan Details',
        linkUrl: '/proof/security-scans-details',
        lastUpdated: new Date('2024-12-14'),
        type: 'page'
      };

    default:
      return {
        title: 'Metric Calculation',
        content: [
          'This metric is calculated using verified data sources',
          'Updated regularly to ensure accuracy',
          'Methodology available for transparency'
        ],
        linkText: 'Learn More',
        linkUrl: '/proof/general-methodology',
        lastUpdated: new Date(),
        type: 'page'
      };
  }
}