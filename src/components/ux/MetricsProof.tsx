/**
 * Metrics Proof Component
 * 
 * Requirements: R14.TRUST.METRICS_PROOF, R10.TRUST.METHODOLOGY
 * 
 * Provides "How it's calculated" links for platform metrics with verification.
 * Shows honest unavailable states when proof destinations don't exist.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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

// Move these outside the component so they don't recreate on every render
function getProofConfig(type: 'assets_protected' | 'wallets_protected' | 'yield_optimized' | 'guardian_score' | 'scans_run'): ProofModalConfig {
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

function getIcon(type: 'assets_protected' | 'wallets_protected' | 'yield_optimized' | 'guardian_score' | 'scans_run') {
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
}

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
    linkUrl: '#',
    lastUpdated: new Date(),
    type: 'modal'
  };
}

export const MetricsProof = ({ metricType, value, label, className = '' }: MetricsProofProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [verificationResult, setVerificationResult] = useState<ProofUrlVerificationResult | null>(null);
  
  const { verifyUrl } = useProofUrlVerification();
  const verifyUrlRef = useRef(verifyUrl);
  useEffect(() => {
    verifyUrlRef.current = verifyUrl;
  }, [verifyUrl]);

  // Get config and icon
  const proofConfig = useMemo(() => getProofConfig(metricType), [metricType]);
  const Icon = useMemo(() => getIcon(metricType), [metricType]);
  const linkUrl = useMemo(() => proofConfig.linkUrl, [proofConfig.linkUrl]);

  // Verify proof URL when linkUrl changes
  useEffect(() => {
    let mounted = true;
    
    const verify = async () => {
      try {
        const result = await verifyUrlRef.current(linkUrl);
        if (mounted) {
          setVerificationResult(result);
        }
      } catch (error) {
        if (mounted) {
          setVerificationResult({
            isAvailable: false,
            status: {
              url: linkUrl,
              exists: false,
              lastChecked: new Date(),
              errorMessage: 'Verification failed'
            },
            fallbackMessage: 'Unable to verify documentation availability'
          });
        }
      }
    };

    verify();
    return () => {
      mounted = false;
    };
  }, [linkUrl]);

  // Determine button state and styling
  const isLoading = !verificationResult;
  const isAvailable = verificationResult?.isAvailable ?? false;

  const handleClick = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const getButtonProps = useCallback(() => {
    if (isLoading) {
      return {
        text: 'Documentation coming soon',
        className: 'text-gray-400 hover:text-gray-300',
        icon: HelpCircle,
        disabled: false
      };
    }

    if (isAvailable) {
      return {
        text: 'How it\'s calculated',
        className: 'text-cyan-400 hover:text-cyan-300',
        icon: HelpCircle,
        disabled: false
      };
    }

    return {
      text: 'Documentation coming soon',
      className: 'text-gray-400 hover:text-gray-300',
      icon: AlertTriangle,
      disabled: false
    };
  }, [isLoading, isAvailable]);

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
            isLoading
              ? 'Verifying documentation availability'
              : isAvailable
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
        config={isAvailable ? proofConfig : getUnavailableConfig(proofConfig, verificationResult)}
      />
    </>
  );
};

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
  
  const { verifyUrl } = useProofUrlVerification();
  const verifyUrlRef = useRef(verifyUrl);
  useEffect(() => {
    verifyUrlRef.current = verifyUrl;
  }, [verifyUrl]);

  const proofConfig = useMemo(() => getProofConfig(metricType), [metricType]);
  const linkUrl = useMemo(() => proofConfig.linkUrl, [proofConfig.linkUrl]);

  // Verify proof URL when linkUrl changes
  useEffect(() => {
    let mounted = true;
    
    const verify = async () => {
      try {
        const result = await verifyUrlRef.current(linkUrl);
        if (mounted) {
          setVerificationResult(result);
        }
      } catch (error) {
        if (mounted) {
          setVerificationResult({
            isAvailable: false,
            status: {
              url: linkUrl,
              exists: false,
              lastChecked: new Date(),
              errorMessage: 'Verification failed'
            },
            fallbackMessage: 'Unable to verify documentation availability'
          });
        }
      }
    };

    verify();
    return () => {
      mounted = false;
    };
  }, [linkUrl]);

  // Determine state
  const isLoading = !verificationResult;
  const isAvailable = verificationResult?.isAvailable ?? false;

  const getButtonClassName = useCallback(() => {
    const baseClasses = `
      inline-flex items-center gap-1 transition-colors underline decoration-dotted underline-offset-2
      focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900
      rounded px-1 py-0.5 ${className}
    `;

    if (isLoading) {
      return `${baseClasses} text-yellow-400 hover:text-yellow-300`;
    }

    if (isAvailable) {
      return `${baseClasses} text-cyan-400 hover:text-cyan-300`;
    }

    return `${baseClasses} text-yellow-400 hover:text-yellow-300`;
  }, [className, isLoading, isAvailable]);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={getButtonClassName()}
        aria-label={
          isLoading 
            ? 'Verifying documentation availability'
            : isAvailable
              ? `How ${children} is calculated`
              : 'Documentation temporarily unavailable'
        }
      >
        {children}
        {isLoading ? (
          <HelpCircle className="w-3 h-3" />
        ) : isAvailable ? (
          <HelpCircle className="w-3 h-3" />
        ) : (
          <AlertTriangle className="w-3 h-3" />
        )}
      </button>

      <ProofModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        config={isAvailable ? proofConfig : getUnavailableConfig(proofConfig, verificationResult)}
      />
    </>
  );
};
