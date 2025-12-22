import React from 'react';
import { ActionableEmptyState, type EmptyStateAction, type ScanChecklist } from './ActionableEmptyState';
import { Shield, BookOpen, Settings } from 'lucide-react';

interface GuardianEmptyStateProps {
  walletAddress?: string;
  scanDuration?: number;
  onLearnMore?: () => void;
  onAdjustSettings?: () => void;
  onRescan?: () => void;
  isRescanning?: boolean;
  className?: string;
}

export function GuardianEmptyState({
  walletAddress,
  scanDuration,
  onLearnMore,
  onAdjustSettings,
  onRescan,
  isRescanning = false,
  className
}: GuardianEmptyStateProps) {
  const actions: EmptyStateAction[] = [
    {
      label: 'Learn how Guardian protects you',
      onClick: onLearnMore || (() => window.open('/guardian/methodology', '_blank')),
      variant: 'outline',
      icon: BookOpen,
      external: true
    }
  ];

  if (onAdjustSettings) {
    actions.push({
      label: 'Adjust scan settings',
      onClick: onAdjustSettings,
      variant: 'ghost',
      icon: Settings
    });
  }

  const scanChecklist: ScanChecklist[] = [
    { 
      item: 'Transaction patterns analyzed', 
      checked: true,
      description: 'Last 1,000 transactions'
    },
    { 
      item: 'Smart contract interactions reviewed', 
      checked: true,
      description: 'All contract calls verified'
    },
    { 
      item: 'Known risk addresses checked', 
      checked: true,
      description: 'Against 50,000+ risk database'
    },
    { 
      item: 'Suspicious activity patterns scanned', 
      checked: true,
      description: 'MEV, sandwich attacks, etc.'
    },
    { 
      item: 'Token approval risks assessed', 
      checked: true,
      description: 'Unlimited approvals flagged'
    },
    { 
      item: 'Cross-chain activity monitored', 
      checked: true,
      description: 'Ethereum, Polygon, BSC, Arbitrum'
    }
  ];

  const description = walletAddress 
    ? `Comprehensive security analysis completed for ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}. Your wallet shows no active security risks.`
    : 'Your wallet appears secure based on our comprehensive analysis. No active risks or suspicious patterns detected.';

  const enhancedDescription = scanDuration 
    ? `${description} Scan completed in ${scanDuration}s.`
    : description;

  return (
    <ActionableEmptyState
      type="no-risks-detected"
      description={enhancedDescription}
      actions={actions}
      scanChecklist={scanChecklist}
      showRefresh={!!onRescan}
      onRefresh={onRescan}
      isRefreshing={isRescanning}
      className={className}
    />
  );
}