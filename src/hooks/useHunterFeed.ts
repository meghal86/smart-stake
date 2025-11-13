import { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getFeedPage, FeedQueryParams } from '@/lib/feed/query';
import { Opportunity as NewOpportunity, OpportunityType, SortOption } from '@/types/hunter';
import { useWallet } from '@/contexts/WalletContext';
import { hashWalletAddress } from '@/lib/analytics/hash';

// Legacy opportunity interface for backward compatibility with existing UI
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

interface UseHunterFeedProps {
  filter: string;
  isDemo: boolean;
  copilotEnabled: boolean;
  realTimeEnabled: boolean;
  sort?: SortOption;
  search?: string;
  trustMin?: number;
  showRisky?: boolean;
}

// Mock data for demo purposes
const mockOpportunities: LegacyOpportunity[] = [
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

/**
 * Map tab filter to OpportunityType
 * Requirements: 7.1 - Support All / Airdrops / Quests / Yield / Points / Featured tabs
 */
function mapFilterToType(filter: string): OpportunityType[] | undefined {
  const filterMap: Record<string, OpportunityType[]> = {
    'All': [],
    'Airdrops': ['airdrop'],
    'Quests': ['quest', 'testnet'],
    'Yield': ['staking', 'yield'],
    'Points': ['points', 'loyalty'],
    'Featured': [], // Featured is handled by featured flag, not type filter
    // Legacy support
    'Staking': ['staking', 'yield'],
    'NFT': ['quest'],
  };
  
  const types = filterMap[filter];
  return types && types.length > 0 ? types : undefined;
}

/**
 * Transform new Opportunity format to legacy format for backward compatibility
 */
function transformToLegacyOpportunity(opp: NewOpportunity): LegacyOpportunity {
  // Map type to legacy format
  const typeMap: Record<string, 'Airdrop' | 'Staking' | 'NFT' | 'Quest'> = {
    'airdrop': 'Airdrop',
    'staking': 'Staking',
    'yield': 'Staking',
    'quest': 'Quest',
    'points': 'Quest',
    'loyalty': 'Quest',
    'testnet': 'Quest',
  };

  const riskMap: Record<string, 'Low' | 'Medium' | 'High'> = {
    'green': 'Low',
    'amber': 'Medium',
    'red': 'High',
  };

  return {
    id: opp.id,
    type: typeMap[opp.type] || 'Quest',
    title: opp.title,
    description: opp.description || '',
    reward: formatReward(opp),
    confidence: Math.round(opp.trust.score),
    duration: formatDuration(opp),
    guardianScore: Math.round(opp.trust.score / 10),
    riskLevel: riskMap[opp.trust.level] || 'Medium',
    chain: opp.chains[0] || 'Multi-chain',
    protocol: opp.protocol.name,
    estimatedAPY: opp.apr,
  };
}

function formatReward(opp: NewOpportunity): string {
  const { reward, apr } = opp;
  
  if (apr) {
    return `${apr.toFixed(1)}% APY`;
  }
  
  if (reward.currency === 'USD') {
    const min = reward.min > 0 ? `$${reward.min}` : '';
    const max = reward.max > 0 ? `$${reward.max}` : '';
    if (min && max) {
      return `${min}-${max}`;
    }
    return max || min || 'TBD';
  }
  
  if (reward.currency === 'POINTS') {
    return `${reward.max} Points`;
  }
  
  if (reward.currency === 'NFT') {
    return 'Exclusive NFT';
  }
  
  return `${reward.max} ${reward.currency}`;
}

function formatDuration(opp: NewOpportunity): string {
  if (opp.time_left_sec) {
    const days = Math.floor(opp.time_left_sec / 86400);
    const hours = Math.floor((opp.time_left_sec % 86400) / 3600);
    
    if (days > 0) {
      return `${days} days`;
    }
    if (hours > 0) {
      return `${hours} hours`;
    }
    return '< 1 hour';
  }
  
  // Default based on difficulty
  const durationMap: Record<string, string> = {
    'easy': '1-7 days',
    'medium': '7-14 days',
    'advanced': '14+ days',
  };
  
  return durationMap[opp.difficulty] || '7-14 days';
}

/**
 * Hook for fetching Hunter feed with ranking API integration
 * 
 * Integrates with getFeedPage() to provide:
 * - Cursor-based pagination with ranking
 * - Infinite scroll support
 * - Filter and sort options
 * - Real-time updates
 * - Wallet-aware personalization
 * 
 * Requirements: 3.1-3.7, 7.3-7.10, 18.4-18.8
 */
export function useHunterFeed(props: UseHunterFeedProps) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { activeWallet, isSwitching } = useWallet();

  // Use demo mode or real API
  const useRealAPI = !props.isDemo;

  // Build query params for real API
  const queryParams: FeedQueryParams = {
    types: mapFilterToType(props.filter),
    sort: props.sort || 'recommended', // Use ranking by default
    search: props.search,
    trustMin: props.trustMin ?? 80,
    showRisky: props.showRisky ?? false,
    featured: props.filter === 'Featured' ? true : undefined, // Filter by featured flag for Featured tab
    limit: 12, // 12 items per page (one fold)
    walletAddress: activeWallet ?? undefined, // Include active wallet for personalization
  };

  // Use infinite query for cursor-based pagination with ranking
  // Include activeWallet in query key to trigger refetch on wallet change (Requirement 18.4)
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: queryRefetch,
  } = useInfiniteQuery({
    queryKey: ['hunter-feed', queryParams, useRealAPI, activeWallet],
    queryFn: async ({ pageParam }) => {
      const personalizationStartTime = performance.now();
      
      if (!useRealAPI) {
        // Demo mode - return mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          items: mockOpportunities,
          nextCursor: null,
          snapshotTs: Date.now() / 1000,
        };
      }
      
      // Real API call with ranking from materialized view
      // This uses the mv_opportunity_rank view which includes rank_score
      // Pass wallet address in query params for personalized ranking
      const result = await getFeedPage({
        ...queryParams,
        cursor: pageParam as string | undefined,
        walletAddress: activeWallet ?? undefined,
      });
      
      // Track feed personalization analytics when wallet is connected
      if (activeWallet && !pageParam) { // Only track on first page load
        const personalizationDurationMs = Math.round(performance.now() - personalizationStartTime);
        
        // Import dynamically to avoid circular dependencies
        import('@/lib/analytics/tracker').then(({ trackFeedPersonalized }) => {
          // Check if wallet has history (has saved or completed opportunities)
          const hasWalletHistory = result.items.some(item => 
            item.eligibility_preview?.status === 'likely'
          );
          
          trackFeedPersonalized({
            walletAddress: activeWallet,
            walletCount: 1, // Will be updated by WalletContext
            personalizationDurationMs,
            hasWalletHistory,
          }).catch(err => {
            console.debug('Failed to track feed personalization:', err);
          });
        }).catch(err => {
          console.debug('Failed to load analytics tracker:', err);
        });
      }
      
      return {
        items: result.items,
        nextCursor: result.nextCursor,
        snapshotTs: result.snapshotTs,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    refetchInterval: props.realTimeEnabled ? 30000 : false, // 30s if real-time enabled
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes (formerly cacheTime)
    enabled: true,
  });

  // Flatten pages into single array and transform to legacy format
  // This ensures opportunities are displayed in ranked order across all pages
  const opportunities = useRealAPI
    ? (data?.pages.flatMap(page => page.items.map(transformToLegacyOpportunity)) ?? [])
    : (data?.pages[0]?.items ?? []);

  const refetch = useCallback(async () => {
    setLastUpdated(new Date());
    return await queryRefetch();
  }, [queryRefetch]);

  // Update last updated time when data changes (only on initial load)
  useEffect(() => {
    if (opportunities.length > 0 && !isLoading) {
      setLastUpdated(new Date());
    }
  }, [isLoading]); // Only depend on isLoading to avoid infinite loop

  return {
    opportunities,
    isLoading: isLoading || isSwitching, // Show loading during wallet switch (Requirement 18.13)
    error,
    lastUpdated,
    refetch,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
  };
}
