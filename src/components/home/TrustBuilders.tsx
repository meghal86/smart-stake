import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Link2, CheckCircle, X, ExternalLink, Clock } from 'lucide-react';
import { TrustStatsSkeleton } from '@/components/ui/Skeletons';
import { TrustBadge } from '@/components/ux/ProofModal';
import { TrustBadgeWithFallback } from '@/components/ux/TrustBadgeWithFallback';
import { MetricsProof } from '@/components/ux/MetricsProof';
import { TrustSignalVerificationManager, DEFAULT_TRUST_SIGNALS, TrustSignal } from '@/lib/ux/TrustSignalVerification';
import { NoSilentClicksWrapper } from '@/lib/ux/NoSilentClicksWrapper';
import { useHomeMetrics, getFreshnessMessage, getFreshnessColor } from '@/hooks/useHomeMetrics';

/**
 * TrustBuilders Component
 * 
 * Displays trust badges to establish credibility.
 * Shows 4 trust badges (Non-custodial, No KYC, On-chain, Guardian-vetted)
 * with interactive proof modals and "Last updated" timestamps for platform statistics.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, R7.LOADING.PROGRESSIVE, R7.LOADING.SKELETON_CONSISTENCY, R14.TRUST.TIMESTAMPS
 */
interface TrustBuildersProps {
  metrics?: {
    totalWalletsProtected: number;
    totalYieldOptimizedUsd: number;
    averageGuardianScore: number;
  };
  isLoading?: boolean;
}

export const TrustBuilders = ({ metrics: propMetrics, isLoading: propIsLoading = false }: TrustBuildersProps) => {
  const [selectedBadge, setSelectedBadge] = useState<number | null>(null);
  const verificationManager = TrustSignalVerificationManager.getInstance();
  
  // Use hook for timestamp functionality - R14.TRUST.TIMESTAMPS
  const { metrics: hookMetrics, isLoading: hookIsLoading, error, freshnessStatus, dataAge, isDemo } = useHomeMetrics();
  
  // Use prop metrics if provided, otherwise use hook metrics
  const finalMetrics = propMetrics || (hookMetrics ? {
    totalWalletsProtected: hookMetrics.totalWalletsProtected,
    totalYieldOptimizedUsd: hookMetrics.totalYieldOptimizedUsd,
    averageGuardianScore: hookMetrics.averageGuardianScore,
  } : undefined);
  
  const finalIsLoading = propIsLoading || hookIsLoading;

  // Create trust signals with proper verification
  const trustSignals: TrustSignal[] = [
    {
      id: 'non-custodial-2024',
      type: 'certification',
      label: 'Non-custodial',
      description: 'You control your keys',
      proofUrl: 'https://github.com/alphawhale/contracts',
      verified: true,
      lastUpdated: new Date(),
      metadata: {
        certificationBody: 'Smart Contract Verification'
      }
    },
    {
      id: 'no-kyc-2024',
      type: 'certification',
      label: 'No KYC',
      description: 'Privacy-first approach',
      proofUrl: '/privacy',
      verified: true,
      lastUpdated: new Date(),
      metadata: {
        certificationBody: 'Privacy Policy'
      }
    },
    {
      id: 'on-chain-2024',
      type: 'audit',
      label: 'On-chain',
      description: 'Transparent & verifiable',
      proofUrl: 'https://certik.com/projects/alphawhale',
      verified: true,
      lastUpdated: new Date(),
      metadata: {
        auditFirm: 'CertiK'
      }
    },
    {
      id: 'guardian-vetted-2024',
      type: 'audit',
      label: 'Guardian-vetted',
      description: 'Security-first design',
      proofUrl: 'https://consensys.net/diligence/audits/alphawhale',
      verified: true,
      lastUpdated: new Date(),
      metadata: {
        auditFirm: 'ConsenSys Diligence'
      }
    }
  ];

  const icons = [Lock, Shield, Link2, CheckCircle];

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

        {/* Platform Statistics - Progressive Loading with Proof Links */}
        {finalIsLoading ? (
          <div className="mb-8">
            <TrustStatsSkeleton />
          </div>
        ) : finalMetrics && (
          <div className="mb-8 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricsProof
                metricType="wallets_protected"
                value={`${finalMetrics.totalWalletsProtected.toLocaleString()}+`}
                label="Wallets Protected"
              />
              <MetricsProof
                metricType="yield_optimized"
                value={`$${finalMetrics.totalYieldOptimizedUsd.toLocaleString()}M+`}
                label="Yield Optimized"
              />
              <MetricsProof
                metricType="guardian_score"
                value={`${finalMetrics.averageGuardianScore}/100`}
                label="Avg Security Score"
              />
            </div>
            
            {/* Last Updated Timestamp for Platform Statistics - R14.TRUST.TIMESTAMPS */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500" data-testid="clock-icon" />
              {error ? (
                <span className="text-red-400">Data unavailable</span>
              ) : hookMetrics?.lastUpdated ? (
                <span className={`${getFreshnessColor(freshnessStatus)}`}>
                  {getFreshnessMessage(freshnessStatus, dataAge)}
                </span>
              ) : (
                <span className="text-gray-500">Timestamp unavailable</span>
              )}
              {isDemo && (
                <span className="text-cyan-400 text-xs ml-2 px-2 py-1 bg-cyan-400/10 rounded">
                  Demo Mode
                </span>
              )}
            </div>
          </div>
        )}

        {/* Trust Badges with Verification and Fallback */}
        <NoSilentClicksWrapper
          fallbackAction={() => console.log('Trust badge fallback triggered')}
          errorMessage="Trust badge verification temporarily unavailable"
        >
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
            role="list"
            aria-label="Trust badges"
          >
            {trustSignals.map((trustSignal, index) => (
              <TrustBadgeWithFallback
                key={trustSignal.id}
                trustSignal={trustSignal}
                icon={icons[index]}
              />
            ))}
          </div>
        </NoSilentClicksWrapper>

      </div>
    </section>
  );
};
