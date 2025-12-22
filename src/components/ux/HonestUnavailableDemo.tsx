/**
 * Honest Unavailable State Demo Component
 * 
 * Requirements: R10.TRUST.AUDIT_LINKS, R10.TRUST.METHODOLOGY, R14.TRUST.METRICS_PROOF
 * 
 * Demonstrates how the system shows honest unavailable states instead of fake links
 * when proof destinations don't exist.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { TrustBadgeWithFallback } from './TrustBadgeWithFallback';
import { MetricsProof } from './MetricsProof';
import { TrustSignal } from '@/lib/ux/TrustSignalVerification';

export const HonestUnavailableDemo = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Example trust signals with different availability states
  const trustSignals: TrustSignal[] = [
    {
      id: 'working-audit',
      type: 'audit',
      label: 'Working Audit',
      description: 'This audit link works correctly',
      proofUrl: 'https://certik.com/projects/alphawhale',
      verified: true,
      lastUpdated: new Date(),
      metadata: { auditFirm: 'CertiK' }
    },
    {
      id: 'broken-audit',
      type: 'audit', 
      label: 'Broken Audit',
      description: 'This audit link is broken',
      proofUrl: 'https://example.com/nonexistent-audit',
      verified: false,
      lastUpdated: new Date(),
      metadata: { auditFirm: 'Fake Firm' }
    },
    {
      id: 'planned-methodology',
      type: 'methodology',
      label: 'Planned Docs',
      description: 'Documentation being prepared',
      proofUrl: '/proof/planned-but-not-ready',
      verified: false,
      lastUpdated: new Date(),
      metadata: { methodology: 'In development' }
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-white">
            Honest Unavailable State Demo
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            This demo shows how AlphaWhale handles proof links that don't exist. 
            Instead of showing broken links or fake "Click for proof" buttons, 
            we show honest unavailable states with clear explanations.
          </p>
          
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="
              flex items-center gap-2 mx-auto px-4 py-2
              bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg
              transition-colors duration-150
            "
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Demo
          </button>
        </div>

        {/* Trust Badges Section */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Trust Badge Examples
            </h2>
            <p className="text-gray-400">
              Compare working vs unavailable trust badges
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" key={`badges-${refreshKey}`}>
            {trustSignals.map((signal) => (
              <div key={signal.id} className="space-y-2">
                <TrustBadgeWithFallback trustSignal={signal} />
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    {signal.proofUrl.includes('certik') ? '✅ Working link' : 
                     signal.proofUrl.includes('example') ? '❌ Broken external link' :
                     '⏳ Planned but not ready'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Metrics Proof Section */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Metrics Proof Examples
            </h2>
            <p className="text-gray-400">
              "How it's calculated" links with availability checking
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" key={`metrics-${refreshKey}`}>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6">
              <MetricsProof
                metricType="assets_protected"
                value="$142M"
                label="Assets Protected"
              />
              <p className="text-xs text-gray-500 mt-2">
                ⏳ Documentation being prepared
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6">
              <MetricsProof
                metricType="guardian_score"
                value="89"
                label="Guardian Score"
              />
              <p className="text-xs text-gray-500 mt-2">
                ✅ Working methodology link
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6">
              <MetricsProof
                metricType="scans_run"
                value="25,847"
                label="Scans Completed"
              />
              <p className="text-xs text-gray-500 mt-2">
                ⏳ Documentation in development
              </p>
            </div>
          </div>
        </section>

        {/* Principles Section */}
        <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            Honest UX Principles
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                What We Do
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Show "Documentation unavailable" when links don't work</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Provide clear explanations in unavailable modals</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Verify proof URLs before showing "Click for proof"</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Use visual indicators (yellow warning icons)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Maintain transparency about documentation status</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                What We Don't Do
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Show "Click for proof →" when proof doesn't exist</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Create fake links that lead to 404 pages</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Hide the fact that documentation is missing</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Use generic error messages without explanation</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Leave users with dead-end interactions</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Implementation Details */}
        <section className="bg-slate-900/50 border border-white/10 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            Implementation Details
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-3">
                URL Verification Process
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-300 ml-4">
                <li>Component mounts and starts URL verification</li>
                <li>System checks if URL exists (HEAD request for external, route check for internal)</li>
                <li>Result is cached for 5 minutes to avoid repeated checks</li>
                <li>UI updates based on verification result</li>
                <li>User sees honest state: working link or unavailable notice</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-3">
                Fallback Strategies
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li><strong>Planned routes:</strong> "Documentation is being prepared"</li>
                <li><strong>Network errors:</strong> "Unable to verify due to network issues"</li>
                <li><strong>404 errors:</strong> "Documentation is currently being updated"</li>
                <li><strong>Generic errors:</strong> "Documentation temporarily unavailable"</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-3">
                User Experience Benefits
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>No frustrating dead-end clicks</li>
                <li>Clear expectations about what's available</li>
                <li>Transparency builds trust</li>
                <li>Consistent experience across all proof links</li>
                <li>Accessibility-friendly with proper ARIA labels</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HonestUnavailableDemo;