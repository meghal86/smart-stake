import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Opportunity {
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

interface UseHunterFeedProps {
  filter: string;
  isDemo: boolean;
  copilotEnabled: boolean;
  realTimeEnabled: boolean;
}

// Mock data for demo purposes
const mockOpportunities: Opportunity[] = [
  {
    id: '1',
    type: 'Staking',
    title: 'Ethereum 2.0 Staking',
    description: 'Stake ETH and earn rewards while securing the network. Low risk, steady returns.',
    reward: '4.2% APY',
    confidence: 95,
    duration: '30+ days',
    guardianScore: 9,
    riskLevel: 'Low',
    chain: 'Ethereum',
    protocol: 'Lido',
    estimatedAPY: 4.2
  },
  {
    id: '2',
    type: 'Airdrop',
    title: 'LayerZero Airdrop',
    description: 'Potential airdrop for cross-chain protocol users. Bridge assets to qualify.',
    reward: '$500-2000',
    confidence: 78,
    duration: '7 days',
    guardianScore: 7,
    riskLevel: 'Medium',
    chain: 'Multi-chain',
    protocol: 'LayerZero'
  },
  {
    id: '3',
    type: 'Quest',
    title: 'Uniswap V4 Beta Testing',
    description: 'Test new Uniswap V4 features and earn exclusive NFT rewards.',
    reward: 'Exclusive NFT',
    confidence: 88,
    duration: '14 days',
    guardianScore: 8,
    riskLevel: 'Low',
    chain: 'Ethereum',
    protocol: 'Uniswap'
  },
  {
    id: '4',
    type: 'NFT',
    title: 'Pudgy Penguins Mint',
    description: 'Limited edition Pudgy Penguins collection mint. High demand expected.',
    reward: '0.08 ETH',
    confidence: 65,
    duration: '2 hours',
    guardianScore: 6,
    riskLevel: 'High',
    chain: 'Ethereum',
    protocol: 'OpenSea'
  },
  {
    id: '5',
    type: 'Staking',
    title: 'Solana Liquid Staking',
    description: 'Stake SOL with Marinade for liquid staking tokens and DeFi opportunities.',
    reward: '6.8% APY',
    confidence: 92,
    duration: '1+ days',
    guardianScore: 8,
    riskLevel: 'Low',
    chain: 'Solana',
    protocol: 'Marinade',
    estimatedAPY: 6.8
  }
];

const fetchOpportunities = async (props: UseHunterFeedProps): Promise<Opportunity[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (props.isDemo) {
    return mockOpportunities;
  }
  
  // In production, this would call the actual API
  // const response = await fetch('/api/hunter/opportunities', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(props)
  // });
  // return response.json();
  
  return mockOpportunities;
};

export function useHunterFeed(props: UseHunterFeedProps) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const {
    data: opportunities = [],
    isLoading,
    error,
    refetch: queryRefetch
  } = useQuery({
    queryKey: ['hunter-feed', props],
    queryFn: () => fetchOpportunities(props),
    refetchInterval: props.realTimeEnabled ? 30000 : false, // 30s if real-time enabled
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });

  const refetch = useCallback(async () => {
    setLastUpdated(new Date());
    return await queryRefetch();
  }, [queryRefetch]);

  // Update last updated time when data changes
  useEffect(() => {
    if (opportunities.length > 0) {
      setLastUpdated(new Date());
    }
  }, [opportunities]);

  return {
    opportunities,
    isLoading,
    error,
    lastUpdated,
    refetch
  };
}