/**
 * HarvestSuccessScreen Example Usage
 * Demonstrates how to use the HarvestSuccessScreen component
 */

import { useState } from 'react';
import { HarvestSuccessScreen } from './HarvestSuccessScreen';
import type { HarvestSession } from '@/types/harvestpro';

export function HarvestSuccessExample() {
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Mock session data
  const mockSession: HarvestSession = {
    sessionId: 'session-123',
    userId: 'user-456',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    updatedAt: new Date().toISOString(),
    status: 'completed',
    realizedLossesTotal: 12450,
    netBenefitTotal: 2988,
    opportunitiesSelected: [
      {
        id: '1',
        lotId: 'lot-1',
        userId: 'user-456',
        token: 'ETH',
        tokenLogoUrl: null,
        riskLevel: 'LOW',
        unrealizedLoss: 4500,
        remainingQty: 2.5,
        gasEstimate: 45,
        slippageEstimate: 22,
        tradingFees: 15,
        netTaxBenefit: 1080,
        guardianScore: 8.5,
        executionTimeEstimate: '5-8 min',
        confidence: 92,
        recommendationBadge: 'recommended',
        metadata: {
          walletName: 'Main Wallet',
          venue: 'Uniswap',
          reasons: ['High liquidity', 'Low gas cost'],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        lotId: 'lot-2',
        userId: 'user-456',
        token: 'MATIC',
        tokenLogoUrl: null,
        riskLevel: 'MEDIUM',
        unrealizedLoss: 2800,
        remainingQty: 5000,
        gasEstimate: 35,
        slippageEstimate: 45,
        tradingFees: 12,
        netTaxBenefit: 672,
        guardianScore: 6.2,
        executionTimeEstimate: '8-12 min',
        confidence: 78,
        recommendationBadge: 'high-benefit',
        metadata: {
          walletName: 'Trading Wallet',
          venue: 'QuickSwap',
          reasons: ['Moderate slippage expected'],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        lotId: 'lot-3',
        userId: 'user-456',
        token: 'LINK',
        tokenLogoUrl: null,
        riskLevel: 'HIGH',
        unrealizedLoss: 1850,
        remainingQty: 150,
        gasEstimate: 55,
        slippageEstimate: 85,
        tradingFees: 18,
        netTaxBenefit: 444,
        guardianScore: 4.1,
        executionTimeEstimate: '10-15 min',
        confidence: 65,
        recommendationBadge: 'guardian-flagged',
        metadata: {
          walletName: 'Cold Wallet',
          venue: 'SushiSwap',
          reasons: ['Low liquidity pool', 'High slippage risk'],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    executionSteps: [
      {
        id: 'step-1',
        sessionId: 'session-123',
        stepNumber: 1,
        description: 'Connect wallet',
        type: 'on-chain',
        status: 'completed',
        transactionHash: '0x123...',
        errorMessage: null,
        guardianScore: 8.5,
        timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: 'step-2',
        sessionId: 'session-123',
        stepNumber: 2,
        description: 'Approve ETH',
        type: 'on-chain',
        status: 'completed',
        transactionHash: '0x456...',
        errorMessage: null,
        guardianScore: 8.5,
        timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: 'step-3',
        sessionId: 'session-123',
        stepNumber: 3,
        description: 'Prepare swap',
        type: 'on-chain',
        status: 'completed',
        transactionHash: '0x789...',
        errorMessage: null,
        guardianScore: 8.5,
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
    ],
    exportUrl: null,
    proofHash: null,
  };
  
  const handleDownloadCSV = (sessionId: string) => {
    console.log('Downloading CSV for session:', sessionId);
    setIsDownloading(true);
    
    // Simulate download
    setTimeout(() => {
      setIsDownloading(false);
      alert('CSV download would start here');
    }, 2000);
  };
  
  const handleViewProof = (sessionId: string) => {
    console.log('Viewing proof for session:', sessionId);
    alert('Navigate to proof page');
  };
  
  const handleClose = () => {
    console.log('Closing success screen');
    alert('Return to dashboard');
  };
  
  return (
    <HarvestSuccessScreen
      session={mockSession}
      onDownloadCSV={handleDownloadCSV}
      onViewProof={handleViewProof}
      onClose={handleClose}
      isDownloading={isDownloading}
    />
  );
}
