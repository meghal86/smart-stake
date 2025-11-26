/**
 * HarvestPro Proof-of-Harvest Page
 * Displays cryptographically verifiable proof of completed harvest
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import React from 'react';
import { Download, Share2, Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { ProofOfHarvest } from '@/types/harvestpro';

interface ProofOfHarvestPageProps {
  proof: ProofOfHarvest;
  onDownloadPDF?: () => void;
  onShare?: () => void;
}

export function ProofOfHarvestPage({
  proof,
  onDownloadPDF,
  onShare,
}: ProofOfHarvestPageProps) {
  const [copiedHash, setCopiedHash] = React.useState(false);

  const handleCopyHash = async () => {
    try {
      await navigator.clipboard.writeText(proof.proofHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch (error) {
      console.error('Failed to copy hash:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(value));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header - Requirement 12.1 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Proof of Harvest
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Cryptographically verified record of your tax-loss harvest
          </p>
        </div>

        {/* Summary Section - Requirement 12.2 */}
        <Card className="p-6 mb-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Harvest Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                Total Losses Harvested
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(proof.totalLoss)}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                Net Tax Benefit
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(proof.netBenefit)}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                Execution Time
              </div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white">
                {formatDate(new Date(proof.executedAt))}
              </div>
            </div>
          </div>
        </Card>

        {/* Executed Steps - Requirement 12.3 */}
        <Card className="p-6 mb-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Harvested Lots ({proof.lots.length})
          </h2>
          <div className="space-y-3">
            {proof.lots.map((lot, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {lot.quantity.toFixed(8)} {lot.token}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Loss: {formatCurrency(lot.gainLoss)}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Acquired: {lot.dateAcquired.toISOString().split('T')[0]} →
                    Sold: {lot.dateSold.toISOString().split('T')[0]}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Cost Basis
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(lot.costBasis)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Cryptographic Proof - Requirement 12.4 */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Cryptographic Proof Hash
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            This SHA-256 hash uniquely identifies your harvest and can be used to
            verify its authenticity.
          </p>
          <div className="flex items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-800">
            <code className="flex-1 text-sm font-mono text-slate-900 dark:text-white break-all">
              {proof.proofHash}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyHash}
              className="shrink-0"
            >
              {copiedHash ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </Card>

        {/* Session Details */}
        <Card className="p-6 mb-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Session Details
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">
                Session ID
              </span>
              <code className="font-mono text-slate-900 dark:text-white">
                {proof.sessionId}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">User ID</span>
              <code className="font-mono text-slate-900 dark:text-white">
                {proof.userId}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">
                Lots Harvested
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {proof.lots.length}
              </span>
            </div>
          </div>
        </Card>

        {/* Export Buttons - Requirement 12.5 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onDownloadPDF}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!onDownloadPDF}
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button
            onClick={onShare}
            variant="outline"
            className="flex-1"
            disabled={!onShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Link
          </Button>
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            <strong>Note:</strong> This proof is for your records. Please consult
            with a tax professional before filing your tax return. AlphaWhale does
            not provide tax advice.
          </p>
        </div>
      </div>
    </div>
  );
}
