/**
 * HarvestPro Proof-of-Harvest Example
 * Demo component for testing the proof page
 */

import React from 'react';
import { ProofOfHarvestPage } from './ProofOfHarvestPage';
import type { ProofOfHarvest } from '@/types/harvestpro';

export function ProofOfHarvestExample() {
  const mockProof: ProofOfHarvest = {
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    executedAt: new Date().toISOString(),
    lots: [
      {
        token: 'ETH',
        dateAcquired: new Date('2023-01-15'),
        dateSold: new Date('2024-11-21'),
        quantity: 2.5,
        costBasis: 5000,
        proceeds: 4200,
        gainLoss: -800,
      },
      {
        token: 'BTC',
        dateAcquired: new Date('2023-03-20'),
        dateSold: new Date('2024-11-21'),
        quantity: 0.15,
        costBasis: 6000,
        proceeds: 5400,
        gainLoss: -600,
      },
      {
        token: 'SOL',
        dateAcquired: new Date('2023-06-10'),
        dateSold: new Date('2024-11-21'),
        quantity: 50,
        costBasis: 2500,
        proceeds: 2100,
        gainLoss: -400,
      },
    ],
    totalLoss: -1800,
    netBenefit: 432,
    proofHash:
      'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
  };

  const handleDownloadPDF = () => {
    console.log('Download PDF clicked');
    alert('PDF download functionality will be implemented in a future update');
  };

  const handleShare = () => {
    console.log('Share clicked');
    alert('Share functionality will be implemented in a future update');
  };

  return (
    <div>
      <div className="bg-amber-100 dark:bg-amber-900 border-l-4 border-amber-500 p-4 mb-4">
        <p className="text-sm text-amber-900 dark:text-amber-100">
          <strong>Demo Mode:</strong> This is a demonstration of the Proof-of-Harvest
          page with mock data.
        </p>
      </div>
      <ProofOfHarvestPage
        proof={mockProof}
        onDownloadPDF={handleDownloadPDF}
        onShare={handleShare}
      />
    </div>
  );
}
