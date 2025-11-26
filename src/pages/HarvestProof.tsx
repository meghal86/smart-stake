/**
 * HarvestPro Proof Page Route
 * Displays proof-of-harvest for a completed session
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProofOfHarvestPage } from '@/components/harvestpro/ProofOfHarvestPage';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProofOfHarvest } from '@/types/harvestpro';

export function HarvestProof() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const {
    data: proof,
    isLoading,
    error,
  } = useQuery<ProofOfHarvest>({
    queryKey: ['harvest-proof', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/harvest/sessions/${sessionId}/proof`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to load proof');
      }
      
      return response.json();
    },
    enabled: !!sessionId,
    staleTime: 60000, // 1 minute
    cacheTime: 3600000, // 1 hour
  });

  const handleDownloadPDF = async () => {
    // TODO: Implement PDF generation
    console.log('Download PDF not yet implemented');
    alert('PDF download will be available soon');
  };

  const handleShare = async () => {
    if (!sessionId) return;
    
    const shareUrl = `${window.location.origin}/harvest/proof/${sessionId}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Proof of Harvest',
          text: 'View my tax-loss harvest proof',
          url: shareUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Loading proof of harvest...
          </p>
        </div>
      </div>
    );
  }

  if (error || !proof) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Failed to Load Proof
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <Button onClick={() => navigate('/harvest')}>
            Return to HarvestPro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProofOfHarvestPage
      proof={proof}
      onDownloadPDF={handleDownloadPDF}
      onShare={handleShare}
    />
  );
}
