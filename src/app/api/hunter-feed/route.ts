import { NextResponse } from 'next/server';
import type { Quest } from '@/types/hunter';

export async function GET() {
  try {
    // Mock data for Hunter feed - in production this would fetch from Supabase
    const quests: Quest[] = [
      {
        id: 'dxp',
        protocol: 'DeltaX Protocol',
        network: 'Base',
        rewardUSD: 1200,
        confidence: 0.8,
        guardianScore: 98,
        steps: 3,
        estimatedTime: '6 min',
        category: 'Airdrop',
        isNew: true,
        completionPercent: 0
      },
      {
        id: 'arb-staking',
        protocol: 'Arbitrum Staking',
        network: 'Arbitrum',
        rewardUSD: 850,
        confidence: 0.92,
        guardianScore: 96,
        steps: 2,
        estimatedTime: '4 min',
        category: 'Staking',
        completionPercent: 25
      },
      {
        id: 'base-farm',
        protocol: 'Base Yield Farm',
        network: 'Base',
        rewardUSD: 2100,
        confidence: 0.75,
        guardianScore: 94,
        steps: 4,
        estimatedTime: '8 min',
        category: 'Farming',
        isNew: true,
        completionPercent: 0
      },
      {
        id: 'sol-quest',
        protocol: 'Solana Quest Hub',
        network: 'Solana',
        rewardUSD: 650,
        confidence: 0.88,
        guardianScore: 99,
        steps: 2,
        estimatedTime: '3 min',
        category: 'Quest',
        completionPercent: 60
      }
    ];

    return NextResponse.json(quests);
  } catch (error) {
    console.error('Hunter feed error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hunter feed' },
      { status: 500 }
    );
  }
}