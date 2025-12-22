/**
 * Proof Page Component
 * 
 * Requirements: R10.TRUST.AUDIT_LINKS, R10.TRUST.METHODOLOGY, R10.TRUST.TIMESTAMPS
 * 
 * Standardized page layout for displaying detailed trust signal verification content
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Calendar, Shield, CheckCircle, FileText } from 'lucide-react';
import { ProofModalConfig } from '@/lib/ux/TrustSignalVerification';

interface ProofPageProps {
  config: ProofModalConfig;
  onBack?: () => void;
  showBackButton?: boolean;
}

export const ProofPage = ({ config, onBack, showBackButton = true }: ProofPageProps) => {
  // Format last updated date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="
                  flex items-center gap-2 text-gray-400 hover:text-white 
                  transition-colors p-2 rounded-lg hover:bg-white/5
                "
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {config.title}
                </h1>
                <p className="text-sm text-gray-400">
                  Verification Documentation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {/* Last Updated */}
          {config.lastUpdated && (
            <div className="flex items-center gap-2 text-sm text-gray-400 pb-4 border-b border-white/10">
              <Calendar className="w-4 h-4" />
              <span>Last updated: {formatDate(config.lastUpdated)}</span>
            </div>
          )}

          {/* Main Content */}
          <div className="prose prose-invert max-w-none">
            <div className="space-y-6">
              {config.content.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="
                    bg-white/5 backdrop-blur-sm border border-white/10 
                    rounded-lg p-6 flex items-start gap-4
                  "
                >
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-300 leading-relaxed">
                      {item}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Action Section */}
          <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-semibold text-white">
                    Additional Documentation
                  </h3>
                  <p className="text-sm text-gray-400">
                    Access detailed technical documentation and reports
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  if (config.type === 'external') {
                    window.open(config.linkUrl, '_blank', 'noopener,noreferrer');
                  } else {
                    window.location.href = config.linkUrl;
                  }
                }}
                className="
                  flex items-center gap-2 px-4 py-2
                  bg-cyan-700 hover:bg-cyan-600
                  text-white font-medium text-sm
                  rounded-lg transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-950
                "
                aria-label={`${config.linkText} - ${config.type === 'external' ? 'Opens in new tab' : 'Navigate to page'}`}
              >
                {config.linkText}
                {config.type === 'external' && <ExternalLink className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-gray-500 text-center space-y-2">
            <p>
              This verification information is provided for transparency and trust building purposes.
            </p>
            {config.type === 'external' && (
              <p>
                External links will open in a new tab and may be subject to third-party terms of service.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/**
 * Proof Page Route Component
 * 
 * For use in Next.js pages or routing systems
 */
interface ProofPageRouteProps {
  proofType: string;
}

export const ProofPageRoute = ({ proofType }: ProofPageRouteProps) => {
  // Get proof configuration based on route parameter
  const getProofConfigByType = (type: string): ProofModalConfig | null => {
    const configs: Record<string, ProofModalConfig> = {
      'guardian-methodology': {
        title: 'Guardian Risk Score Methodology',
        content: [
          'Multi-factor risk assessment combining 15+ security indicators including approval risks, transaction patterns, and reputation scores',
          'Machine learning models trained on over 100,000 historical security incidents and exploit patterns',
          'Real-time threat intelligence integration from Chainalysis, TRM Labs, and other leading security providers',
          'Weighted scoring algorithm: 40% on-chain behavior analysis, 35% approval and permission risks, 25% wallet reputation',
          'Continuous model updates based on new threat vectors and community feedback',
          'Scores updated every 10 minutes with new transaction data and threat intelligence'
        ],
        linkText: 'View Technical Documentation',
        linkUrl: 'https://docs.alphawhale.com/guardian/methodology',
        lastUpdated: new Date('2024-12-01'),
        type: 'external'
      },
      'assets-protected': {
        title: 'Assets Protected Calculation Methodology',
        content: [
          'Total USD value aggregated from all wallets actively monitored by Guardian security system',
          'Real-time price feeds from CoinGecko Pro API with 30-second update intervals',
          'Includes DeFi positions (Uniswap, Aave, Compound), token holdings, and staked assets across 15+ blockchains',
          'Deduplication logic prevents double-counting of assets across multiple wallet connections',
          'Excludes dust amounts below $1 USD equivalent to prevent spam inflation of metrics',
          'Historical data retention for trend analysis and verification purposes'
        ],
        linkText: 'View Data Sources',
        linkUrl: '/api/proof/assets-protected-sources',
        lastUpdated: new Date('2024-12-15'),
        type: 'external'
      },
      'security-partners': {
        title: 'Security Partner Verification',
        content: [
          'Verified partnerships with leading blockchain security firms including CertiK, ConsenSys Diligence, and Trail of Bits',
          'Active collaboration agreements for threat intelligence sharing and incident response',
          'Regular security reviews and penetration testing conducted quarterly',
          'Joint research initiatives on emerging DeFi security threats and mitigation strategies',
          'Shared bug bounty programs with coordinated disclosure processes',
          'Partnership agreements publicly verifiable through on-chain signatures and attestations'
        ],
        linkText: 'Verify Partnership Attestations',
        linkUrl: 'https://etherscan.io/address/0x...',
        lastUpdated: new Date('2024-11-30'),
        type: 'external'
      }
    };

    return configs[type] || null;
  };

  const config = getProofConfigByType(proofType);

  if (!config) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Proof Not Found</h1>
          <p className="text-gray-400 mb-6">
            The requested verification documentation could not be found.
          </p>
          <button
            onClick={() => window.history.back()}
            className="
              px-4 py-2 bg-cyan-700 hover:bg-cyan-600 
              text-white rounded-lg transition-colors
            "
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProofPage
      config={config}
      onBack={() => window.history.back()}
      showBackButton={true}
    />
  );
};