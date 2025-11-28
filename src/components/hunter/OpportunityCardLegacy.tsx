/**
 * Legacy OpportunityCard Wrapper
 * 
 * Temporary compatibility layer for the old Hunter page.
 * This will be removed once Task 30g updates the Hunter page.
 * 
 * DO NOT USE THIS IN NEW CODE - Use OpportunityCard directly with proper types.
 */

import React from 'react';
import { OpportunityCard } from './OpportunityCard';
import type { Opportunity as NewOpportunity, CTAAction } from '@/types/hunter';

// Old opportunity type from Hunter.tsx
interface LegacyOpportunity {
  id: string;
  type: 'Airdrop' | 'Staking' | 'NFT' | 'Quest';
  title: string;
  description: string;
  reward: string;
  confidence: number;
  duration: string;
  guardianScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  chain?: string;
  protocol?: string;
  estimatedAPY?: number;
}

interface LegacyOpportunityCardProps {
  opportunity: LegacyOpportunity;
  index: number;
  onJoinQuest: (opportunity: LegacyOpportunity) => void;
  isDarkTheme?: boolean;
}

// Transform legacy opportunity to new format
function transformLegacyOpportunity(legacy: LegacyOpportunity): NewOpportunity {
  // Parse reward string to extract min/max values
  const parseReward = (rewardStr: string): { min: number; max: number; currency: unknown} => {
    // Handle ranges like "$500-2000"
    const rangeMatch = rewardStr.match(/\$?(\d+(?:,\d+)?)-(\d+(?:,\d+)?)/);
    if (rangeMatch) {
      return {
        min: parseFloat(rangeMatch[1].replace(/,/g, '')),
        max: parseFloat(rangeMatch[2].replace(/,/g, '')),
        currency: 'USD',
      };
    }

    // Handle APY like "4.2% APY"
    const apyMatch = rewardStr.match(/([\d.]+)%\s*APY/i);
    if (apyMatch) {
      const value = parseFloat(apyMatch[1]);
      return {
        min: value,
        max: value,
        currency: 'APY',
      };
    }

    // Handle ETH amounts like "0.08 ETH"
    const ethMatch = rewardStr.match(/([\d.]+)\s*ETH/i);
    if (ethMatch) {
      const value = parseFloat(ethMatch[1]);
      return {
        min: value,
        max: value,
        currency: 'TOKEN',
      };
    }

    // Handle single USD values like "$500"
    const usdMatch = rewardStr.match(/\$(\d+(?:,\d+)?)/);
    if (usdMatch) {
      const value = parseFloat(usdMatch[1].replace(/,/g, ''));
      return {
        min: value,
        max: value,
        currency: 'USD',
      };
    }

    // Default for NFTs or unknown
    return {
      min: 0,
      max: 0,
      currency: 'NFT',
    };
  };

  const reward = parseReward(legacy.reward);

  // Map legacy type to new type
  const typeMap: Record<string, unknown> = {
    'Airdrop': 'airdrop',
    'Staking': 'staking',
    'NFT': 'points', // Map NFT to points for now
    'Quest': 'quest',
  };

  // Map risk level to trust level
  const trustLevelMap: Record<string, unknown> = {
    'Low': 'green',
    'Medium': 'amber',
    'High': 'red',
  };

  return {
    id: legacy.id,
    slug: legacy.title.toLowerCase().replace(/\s+/g, '-'),
    title: legacy.title,
    description: legacy.description,
    protocol: {
      name: legacy.protocol || 'Unknown Protocol',
      logo: 'https://via.placeholder.com/40', // Placeholder logo
    },
    type: typeMap[legacy.type] || 'quest',
    chains: legacy.chain ? [legacy.chain.toLowerCase() as unknown] : [],
    reward: {
      min: reward.min,
      max: reward.max,
      currency: reward.currency,
      confidence: 'estimated',
    },
    apr: legacy.estimatedAPY,
    trust: {
      score: legacy.guardianScore,
      level: trustLevelMap[legacy.riskLevel] || 'amber',
      last_scanned_ts: new Date().toISOString(),
      issues: [],
    },
    difficulty: 'easy',
    featured: false,
    sponsored: false,
    badges: [],
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function OpportunityCardLegacy({
  opportunity,
  index,
  onJoinQuest,
  isDarkTheme,
}: LegacyOpportunityCardProps) {
  const transformedOpportunity = transformLegacyOpportunity(opportunity);

  const handleCTAClick = (id: string, action: CTAAction) => {
    // Find the original opportunity and call the legacy handler
    onJoinQuest(opportunity);
  };

  return (
    <OpportunityCard
      opportunity={transformedOpportunity}
      onSave={() => console.log('Save not implemented in legacy mode')}
      onShare={() => console.log('Share not implemented in legacy mode')}
      onReport={() => console.log('Report not implemented in legacy mode')}
      onCTAClick={handleCTAClick}
      isConnected={false}
    />
  );
}
