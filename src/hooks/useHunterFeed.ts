import { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getFeedPage, FeedQueryParams } from '@/lib/feed/query';
import { Opportunity as NewOpportunity, OpportunityType, SortOption } from '@/types/hunter';
import { useWallet } from '@/contexts/WalletContext';
import { hunterKeys } from '@/lib/query-keys';

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
 * Handles missing/undefined properties gracefully for API compatibility
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
    'rwa': 'Staking',      // RWA opportunities are yield-like
    'strategy': 'Quest',   // Strategies are quest-like
  };

  const riskMap: Record<string, 'Low' | 'Medium' | 'High'> = {
    'green': 'Low',
    'amber': 'Medium',
    'red': 'High',
  };

  // Safe access to trust properties with fallbacks
  // Handle both undefined trust object and missing properties
  const trustScore = (opp.trust && typeof opp.trust.score === 'number') ? opp.trust.score : 80;
  const trustLevel = (opp.trust && opp.trust.level) ? opp.trust.level : 'amber';

  return {
    id: opp.id,
    type: typeMap[opp.type] || 'Quest',
    title: opp.title,
    description: opp.description || '',
    reward: formatReward(opp),
    confidence: Math.round(trustScore),
    duration: formatDuration(opp),
    guardianScore: Math.round(trustScore / 10),
    riskLevel: riskMap[trustLevel] || 'Medium',
    chain: (opp.chains && opp.chains.length > 0) ? opp.chains[0] : 'Multi-chain',
    protocol: (opp.protocol && opp.protocol.name) ? opp.protocol.name : 'Unknown',
    estimatedAPY: opp.apr,
  };
}

function formatReward(opp: NewOpportunity): string {
  const { reward, apr } = opp;
  
  if (apr) {
    return `${apr.toFixed(1)}% APY`;
  }
  
  // Safe access to reward properties with fallbacks
  if (!reward) {
    return 'TBD';
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
    return `${reward.max || 0} Points`;
  }
  
  if (reward.currency === 'NFT') {
    return 'Exclusive NFT';
  }
  
  return `${reward.max || 0} ${reward.currency || 'TBD'}`;
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
  const { activeWallet, activeNetwork, isSwitching } = useWallet();

  // Use demo mode or real API
  const useRealAPI = !props.isDemo;
  
  // Debug logging for manual testing
  useEffect(() => {
    console.log('🎯 Hunter Feed Mode:', {
      isDemo: props.isDemo,
      useRealAPI,
      activeWallet,
      filter: props.filter,
      timestamp: new Date().toISOString()
    });
    
    // Log when mode changes
    if (props.isDemo) {
      console.log('🎭 DEMO MODE ACTIVE - Using mock data');
    } else {
      console.log('🔴 LIVE MODE ACTIVE - Will fetch from API');
    }
  }, [props.isDemo, useRealAPI, activeWallet, props.filter]);

  // Build query params for real API
  const queryParams: FeedQueryParams = {
    types: mapFilterToType(props.filter),
    sort: props.sort || 'recommended', // Use ranking by default
    search: props.search,
    trustMin: props.trustMin ?? 80,
    showRisky: props.showRisky ?? false,
    limit: 12, // 12 items per page (one fold)
    walletAddress: activeWallet ?? undefined, // Include active wallet for personalization
  };

  // Use infinite query for cursor-based pagination with ranking
  // Include activeWallet, activeNetwork, isDemo, AND filter in query key to trigger refetch on changes
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: queryRefetch,
  } = useInfiniteQuery({
    queryKey: ['hunter', 'feed', activeWallet, activeNetwork, props.isDemo, props.filter] as const,
    queryFn: async ({ pageParam }) => {
      const personalizationStartTime = performance.now();
      
      if (!useRealAPI) {
        // Demo mode - return mock data
        console.log('📦 Demo Mode: Returning mock data (5 opportunities)');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          items: mockOpportunities,
          nextCursor: null,
          snapshotTs: Date.now() / 1000,
        };
      }
      
      // Live mode - fetch directly from Supabase (Vite doesn't serve Next.js API routes)
      console.log('🌐 Live Mode: Fetching from Supabase', {
        filter: props.filter,
        sort: props.sort || 'recommended',
        cursor: pageParam,
        walletAddress: activeWallet
      });
      
      // Import Supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL!,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!
      );
      
      // Build query
      let query = supabase
        .from('opportunities')
        .select('*')
        .eq('status', 'published');
      
      // Apply type filter
      if (props.filter !== 'All') {
        const typeMap: Record<string, string[]> = {
          'Airdrops': ['airdrop'],
          'Quests': ['quest', 'testnet'],
          'Yield': ['staking', 'yield'],
          'Points': ['points', 'loyalty'],
          'Staking': ['staking', 'yield', 'rwa'],
          'NFT': ['quest'], // NFT opportunities are typically quest-like
          'RWA': ['rwa'],
          'Strategies': ['strategy'],
        };
        
        const types = typeMap[props.filter];
        if (types && types.length > 0) {
          query = query.in('type', types);
        }
      }
      
      // Apply sorting
      switch (props.sort) {
        case 'ends_soon':
          query = query.order('end_date', { ascending: true, nullsFirst: false });
          break;
        case 'highest_reward':
          query = query.order('reward_max', { ascending: false, nullsFirst: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'trust':
          query = query.order('trust_score', { ascending: false });
          break;
        case 'recommended':
        default:
          // For recommended, sort by trust_score to get diverse, high-quality opportunities
          // This provides better variety than created_at which groups by seed order
          query = query.order('trust_score', { ascending: false });
          break;
      }
      
      // Apply cursor-based pagination using offset
      const offset = pageParam || 0;
      query = query.range(offset, offset + 11); // 12 items (0-11 inclusive)
      
      // Execute query
      const { data: result, error: fetchError } = await query;
      
      if (fetchError) {
        console.error('❌ Supabase error:', fetchError);
        throw new Error(fetchError.message || 'Failed to fetch opportunities');
      }
      
      console.log('✅ Supabase Response:', {
        itemCount: result?.length || 0,
        offset,
        firstItem: result?.[0],
        timestamp: new Date().toISOString()
      });
      
      // Track feed personalization analytics when wallet is connected
      if (activeWallet && !pageParam) { // Only track on first page load
        const personalizationDurationMs = Math.round(performance.now() - personalizationStartTime);
        
        // Import dynamically to avoid circular dependencies
        import('@/lib/analytics/tracker').then(({ trackFeedPersonalized }) => {
          // Check if wallet has history (has saved or completed opportunities)
          const hasWalletHistory = result?.some((item: NewOpportunity) => 
            item.eligibility_preview?.status === 'likely'
          ) || false;
          
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
      
      // Calculate next cursor (offset for next page)
      const hasMore = result && result.length === 12;
      const nextCursor = hasMore ? offset + 12 : null;
      
      return {
        items: result || [],
        nextCursor,
        snapshotTs: Date.now() / 1000,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0, // Start at offset 0
    refetchInterval: props.realTimeEnabled ? 60000 : false, // Reduced from 30s to 60s
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes (formerly cacheTime)
    enabled: true,
  });

  // Flatten pages into single array and transform to legacy format
  // This ensures opportunities are displayed in ranked order across all pages
  const opportunities = useRealAPI
    ? (data?.pages.flatMap(page => page.items.map(transformToLegacyOpportunity)) ?? [])
    : (data?.pages[0]?.items ?? []);

  // Debug logging for transformation
  useEffect(() => {
    if (data?.pages) {
      console.log('📊 Opportunities Transformation:', {
        useRealAPI,
        pagesCount: data.pages.length,
        itemsPerPage: data.pages.map(p => p.items.length),
        totalItems: data.pages.reduce((sum, p) => sum + p.items.length, 0),
        transformedCount: opportunities.length,
        firstTransformed: opportunities[0]
      });
    }
  }, [data, opportunities.length, useRealAPI]);

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
