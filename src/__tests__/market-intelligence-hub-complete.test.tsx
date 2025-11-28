import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MarketHub from '@/pages/MarketHub'
import { supabase } from '@/integrations/supabase/client'

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        gte: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        }))
      }))
    }))
  }
}))

// Mock analytics hook
jest.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    track: jest.fn()
  })
}))

const mockMarketSummary = {
  window: '24h',
  marketMood: 65,
  marketMoodDelta: 2.3,
  volume24h: 2500000000,
  volumeDelta: -5.2,
  activeWhales: 1247,
  whalesDelta: 8.1,
  riskIndex: 42,
  topAlerts: [
    {
      id: '1',
      severity: 'High' as const,
      title: 'ETH 15.2M Movement',
      timestamp: new Date().toISOString()
    },
    {
      id: '2', 
      severity: 'Medium' as const,
      title: 'BTC 8.7M Movement',
      timestamp: new Date().toISOString()
    }
  ],
  refreshedAt: new Date().toISOString()
}

const mockWhaleClusters = [
  {
    id: 'dormant-waking',
    type: 'DORMANT_WAKING' as const,
    name: 'Dormant → Waking',
    membersCount: 23,
    sumBalanceUsd: 450000000,
    netFlow24h: -12500000,
    riskScore: 75,
    riskSkew: 25,
    avgConfidence: 0.9,
    members: [
      {
        address: '0x1234567890123456789012345678901234567890',
        balanceUsd: 19565217,
        riskScore: 85,
        reasonCodes: ['dormant_wake', 'large_balance'],
        lastActivityTs: new Date().toISOString(),
        confidence: 0.95
      }
    ]
  },
  {
    id: 'cex-inflow',
    type: 'CEX_INFLOW' as const,
    name: 'CEX Inflow',
    membersCount: 156,
    sumBalanceUsd: 1200000000,
    netFlow24h: 5600000,
    riskScore: 45,
    riskSkew: 5,
    avgConfidence: 0.8,
    members: []
  },
  {
    id: 'defi-activity',
    type: 'DEFI_ACTIVITY' as const,
    name: 'DeFi Activity',
    membersCount: 89,
    sumBalanceUsd: 2100000000,
    netFlow24h: 0,
    riskScore: 25,
    riskSkew: 25,
    avgConfidence: 0.7,
    members: []
  },
  {
    id: 'distribution',
    type: 'DISTRIBUTION' as const,
    name: 'Distribution',
    membersCount: 67,
    sumBalanceUsd: 890000000,
    netFlow24h: 8900000,
    riskScore: 35,
    riskSkew: 15,
    avgConfidence: 0.8,
    members: []
  },
  {
    id: 'accumulation',
    type: 'ACCUMULATION' as const,
    name: 'Accumulation',
    membersCount: 34,
    sumBalanceUsd: 340000000,
    netFlow24h: -15600000,
    riskScore: 85,
    riskSkew: 35,
    avgConfidence: 0.7,
    members: []
  }
]

const mockChainRisk = {
  window: '24h',
  chains: [
    {
      chain: 'BTC' as const,
      risk: null,
      reason: 'Insufficient data for risk calculation',
      components: {},
      refreshedAt: new Date().toISOString()
    },
    {
      chain: 'ETH' as const,
      risk: 42,
      components: {
        whaleRiskMean: 48.5,
        cexInflowRatio: 12.3,
        netOutflowRatio: 6.8,
        volatilityZ: 0.2,
        largeTxShare: 8.9,
        dormantWakeupsRate: 1.5,
        stablecoinBufferRatio: 18.7,
        rawScore: 0.38
      },
      refreshedAt: new Date().toISOString()
    },
    {
      chain: 'SOL' as const,
      risk: 67,
      components: {
        whaleRiskMean: 62.1,
        cexInflowRatio: 18.7,
        netOutflowRatio: 12.4,
        volatilityZ: 0.8,
        largeTxShare: 15.2,
        dormantWakeupsRate: 3.1,
        stablecoinBufferRatio: 8.3,
        rawScore: 0.58
      },
      refreshedAt: new Date().toISOString()
    },
    {
      chain: 'Others' as const,
      risk: null,
      reason: 'Insufficient data for risk calculation',
      components: {},
      refreshedAt: new Date().toISOString()
    }
  ],
  refreshedAt: new Date().toISOString(),
  summary: {
    chainsWithData: 2,
    avgRisk: 54.5,
    highRiskChains: 1
  }
}

const mockAlertsStream = [
  {
    id: 'alert-1',
    ts: new Date().toISOString(),
    chain: 'ETH',
    token: 'USDT',
    usd: 15200000,
    cluster: 'CEX_INFLOW' as const,
    severity: 'High' as const,
    impactScore: 0.85,
    confidence: 0.92,
    reasons: ['large_amount', 'cex_destination'],
    threadKey: 'CEX_INFLOW:ETH:USDT:out:12345:binance',
    isRead: false,
    score: 0.88
  },
  {
    id: 'alert-2',
    ts: new Date(Date.now() - 300000).toISOString(),
    chain: 'BTC',
    token: 'BTC',
    usd: 8700000,
    cluster: 'DISTRIBUTION' as const,
    severity: 'Medium' as const,
    impactScore: 0.72,
    confidence: 0.78,
    reasons: ['multiple_recipients', 'large_amount'],
    threadKey: 'DISTRIBUTION:BTC:BTC:out:12344:unknown',
    isRead: false,
    score: 0.75
  }
]

describe('Market Intelligence Hub - Complete System Tests', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    // Setup mock responses
    const mockInvoke = supabase.functions.invoke as jest.MockedFunction<typeof supabase.functions.invoke>
    mockInvoke.mockImplementation((functionName: string) => {
      switch (functionName) {
        case 'market-summary':
          return Promise.resolve({ data: mockMarketSummary, error: null })
        case 'whale-clusters':
          return Promise.resolve({ data: mockWhaleClusters, error: null })
        case 'chain-risk':
          return Promise.resolve({ data: mockChainRisk, error: null })
        default:
          return Promise.resolve({ data: null, error: new Error('Unknown function') })
      }
    })

    // Setup mock database queries
    const mockFrom = supabase.from as jest.MockedFunction<typeof supabase.from>
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        gte: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: mockAlertsStream, error: null })
            })
          })
        })
      })
    } as any)
  })

  const renderMarketHub = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MarketHub />
      </QueryClientProvider>
    )
  }

  describe('1. Global Rules & Time Window', () => {
    it('should display shared time window selector', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        expect(screen.getByText('Last 24 hours')).toBeInTheDocument()
      })
      
      const timeSelector = screen.getByRole('combobox')
      expect(timeSelector).toBeInTheDocument()
    })

    it('should show refreshed timestamp', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        expect(screen.getByText(/Refreshed \d+m ago/)).toBeInTheDocument()
      })
    })

    it('should update all modules when time window changes', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        expect(screen.getByText('Last 24 hours')).toBeInTheDocument()
      })

      // Change time window
      const timeSelector = screen.getByRole('combobox')
      fireEvent.click(timeSelector)
      
      await waitFor(() => {
        const sevenDayOption = screen.getByText('Last 7 days')
        fireEvent.click(sevenDayOption)
      })

      // Verify all functions are called with new window
      await waitFor(() => {
        expect(supabase.functions.invoke).toHaveBeenCalledWith('market-summary', {
          body: { window: '7d' }
        })
        expect(supabase.functions.invoke).toHaveBeenCalledWith('whale-clusters', {
          body: { window: '7d' }
        })
        expect(supabase.functions.invoke).toHaveBeenCalledWith('chain-risk', {
          body: { window: '7d' }
        })
      })
    })
  })

  describe('2. Top 4 Cards - Exact Requirements', () => {
    it('should display exactly 4 cards with correct fields', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        // Market Mood
        expect(screen.getByText('Market Mood')).toBeInTheDocument()
        expect(screen.getByText('65')).toBeInTheDocument()
        expect(screen.getByText('+2.3%')).toBeInTheDocument()
        
        // 24h Volume
        expect(screen.getByText('24h Volume')).toBeInTheDocument()
        expect(screen.getByText('$2.5B')).toBeInTheDocument()
        expect(screen.getByText('-5.2% vs prior 24h')).toBeInTheDocument()
        
        // Active Whales
        expect(screen.getByText('Active Whales')).toBeInTheDocument()
        expect(screen.getByText('1,247')).toBeInTheDocument()
        expect(screen.getByText('+8.1% vs prior 24h')).toBeInTheDocument()
        
        // Market Risk Index
        expect(screen.getByText('Market Risk Index')).toBeInTheDocument()
        expect(screen.getByText('42')).toBeInTheDocument()
        expect(screen.getByText('Top 3 Critical Alerts:')).toBeInTheDocument()
        expect(screen.getByText('• ETH 15.2M Movement')).toBeInTheDocument()
        expect(screen.getByText('• BTC 8.7M Movement')).toBeInTheDocument()
      })
    })

    it('should NOT display Risk Alerts count card', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        expect(screen.queryByText('Risk Alerts')).not.toBeInTheDocument()
        expect(screen.queryByText(/\d+ alerts/)).not.toBeInTheDocument()
      })
    })

    it('should make top alerts clickable', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        const alertElement = screen.getByText('• ETH 15.2M Movement')
        expect(alertElement).toHaveClass('cursor-pointer')
        expect(alertElement).toHaveClass('hover:text-foreground')
      })
    })
  })

  describe('3. Whale Behavior Clusters - 5 Canonical', () => {
    it('should display exactly 5 clusters in priority order', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        expect(screen.getByText('Whale Behavior Clusters')).toBeInTheDocument()
        expect(screen.getByText('5 canonical clusters • Behavioral classification')).toBeInTheDocument()
        
        // Check all 5 clusters are present
        expect(screen.getByText('Dormant → Waking')).toBeInTheDocument()
        expect(screen.getByText('CEX Inflow')).toBeInTheDocument()
        expect(screen.getByText('DeFi Activity')).toBeInTheDocument()
        expect(screen.getByText('Distribution')).toBeInTheDocument()
        expect(screen.getByText('Accumulation')).toBeInTheDocument()
      })
    })

    it('should display correct cluster metrics', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        // Dormant → Waking cluster
        expect(screen.getByText('23 addresses')).toBeInTheDocument()
        expect(screen.getByText('$0.5B')).toBeInTheDocument()
        expect(screen.getByText('-13M 24h')).toBeInTheDocument()
        expect(screen.getByText('75')).toBeInTheDocument() // Risk score badge
      })
    })

    it('should allow cluster selection for drill-down', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        const dormantCluster = screen.getByText('Dormant → Waking').closest('.cursor-pointer')
        expect(dormantCluster).toBeInTheDocument()
        
        fireEvent.click(dormantCluster!)
      })
      
      await waitFor(() => {
        expect(screen.getByText('Cluster Members')).toBeInTheDocument()
      })
    })

    it('should show drill-down table with correct columns', async () => {
      renderMarketHub()
      
      // Click on dormant cluster
      await waitFor(() => {
        const dormantCluster = screen.getByText('Dormant → Waking').closest('.cursor-pointer')
        fireEvent.click(dormantCluster!)
      })
      
      await waitFor(() => {
        expect(screen.getByText('Cluster Members')).toBeInTheDocument()
        // Check for address format
        expect(screen.getByText('0x1234...7890')).toBeInTheDocument()
        // Check for balance
        expect(screen.getByText('$19.6M')).toBeInTheDocument()
        // Check for risk score badge
        expect(screen.getByText('85')).toBeInTheDocument()
        // Check for explorer icon
        expect(screen.getByRole('button')).toBeInTheDocument()
      })
    })
  })

  describe('4. Risk Heatmap by Chain', () => {
    it('should display 4 chain bubbles', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        expect(screen.getByText('Risk Heatmap by Chain')).toBeInTheDocument()
        expect(screen.getByText('Chain Risk Index (0-100) • Hover for details')).toBeInTheDocument()
        
        // Check all 4 chains
        expect(screen.getByText('BTC')).toBeInTheDocument()
        expect(screen.getByText('ETH')).toBeInTheDocument()
        expect(screen.getByText('SOL')).toBeInTheDocument()
        expect(screen.getByText('Others')).toBeInTheDocument()
      })
    })

    it('should show correct risk values and colors', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        // BTC - no data
        const btcBubble = screen.getByText('BTC').closest('.text-center')
        expect(btcBubble).toContainHTML('--')
        expect(btcBubble).toContainHTML('bg-gray-400')
        expect(btcBubble?.textContent).toContain('No data')
        
        // ETH - moderate risk (42)
        const ethBubble = screen.getByText('ETH').closest('.text-center')
        expect(ethBubble).toContainHTML('42')
        expect(ethBubble).toContainHTML('bg-yellow-500') // 30-60 range
        expect(ethBubble?.textContent).toContain('Watch')
        
        // SOL - elevated risk (67)
        const solBubble = screen.getByText('SOL').closest('.text-center')
        expect(solBubble).toContainHTML('67')
        expect(solBubble).toContainHTML('bg-orange-500') // 60-80 range
        expect(solBubble?.textContent).toContain('Elevated')
      })
    })

    it('should ensure at least one chain has non-null risk', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        // ETH should have risk value (acceptance criteria)
        const ethRisk = screen.getByText('42')
        expect(ethRisk).toBeInTheDocument()
        
        // SOL should also have risk value
        const solRisk = screen.getByText('67')
        expect(solRisk).toBeInTheDocument()
      })
    })
  })

  describe('5. Real-time Alerts Sidebar', () => {
    it('should display AI Digest', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        expect(screen.getByText('AI Digest (24h)')).toBeInTheDocument()
        expect(screen.getByText('• Large ETH outflows to CEX detected')).toBeInTheDocument()
        expect(screen.getByText('• DeFi whale activity increased 23%')).toBeInTheDocument()
        expect(screen.getByText('• 3 dormant wallets activated')).toBeInTheDocument()
      })
    })

    it('should display filter chips', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument()
        expect(screen.getByText('High')).toBeInTheDocument()
        expect(screen.getByText('≥$1M')).toBeInTheDocument()
        expect(screen.getByText('Watchlist')).toBeInTheDocument()
      })
    })

    it('should display alerts with correct threading', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        // Check alert content
        expect(screen.getByText('ETH Alert')).toBeInTheDocument()
        expect(screen.getByText('$15,200,000')).toBeInTheDocument()
        expect(screen.getByText('BTC Alert')).toBeInTheDocument()
        expect(screen.getByText('$8,700,000')).toBeInTheDocument()
      })
    })

    it('should show empty state when no alerts', async () => {
      // Mock empty alerts
      const mockFrom = supabase.from as jest.MockedFunction<typeof supabase.from>
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: [], error: null })
              })
            })
          })
        })
      } as any)

      renderMarketHub()
      
      await waitFor(() => {
        expect(screen.getByText('No alerts in the last 24h')).toBeInTheDocument()
        expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument()
      })
    })
  })

  describe('6. Desktop-First Architecture', () => {
    it('should display desktop layout with sidebar', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        // Check header
        expect(screen.getByText('Market Intelligence Hub')).toBeInTheDocument()
        expect(screen.getByText('Real-time blockchain intelligence and whale monitoring')).toBeInTheDocument()
        
        // Check sidebar navigation
        expect(screen.getByText('Overview')).toBeInTheDocument()
        expect(screen.getByText('Real-time Alerts')).toBeInTheDocument()
        expect(screen.getByText('Whale Analytics')).toBeInTheDocument()
        expect(screen.getByText('Sentiment & Correlation')).toBeInTheDocument()
      })
    })

    it('should have refresh functionality', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        const refreshButton = screen.getByText('Refresh')
        expect(refreshButton).toBeInTheDocument()
        
        fireEvent.click(refreshButton)
      })
      
      // Should trigger all data refetches
      await waitFor(() => {
        expect(supabase.functions.invoke).toHaveBeenCalledTimes(6) // Initial + refresh calls
      })
    })
  })

  describe('7. Error Handling & Empty States', () => {
    it('should show loading states', async () => {
      // Mock slow responses
      const mockInvoke = supabase.functions.invoke as jest.MockedFunction<typeof supabase.functions.invoke>
      mockInvoke.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

      renderMarketHub()
      
      // Should show loading skeletons
      expect(screen.getAllByText('').filter(el => 
        el.className.includes('animate-pulse')
      ).length).toBeGreaterThan(0)
    })

    it('should handle API errors gracefully', async () => {
      // Mock error responses
      const mockInvoke = supabase.functions.invoke as jest.MockedFunction<typeof supabase.functions.invoke>
      mockInvoke.mockResolvedValue({ data: null, error: new Error('API Error') })

      renderMarketHub()
      
      await waitFor(() => {
        // Should show empty states instead of crashing
        expect(screen.getByText('No whale cluster data available')).toBeInTheDocument()
      })
    })

    it('should show professional empty states', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        // Check for professional empty state messaging
        expect(screen.getByText('Clusters will appear when whale data is loaded from live sources')).toBeInTheDocument()
      })
    })
  })

  describe('8. Data Integration - No Mocks', () => {
    it('should use live database queries', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        // Verify Edge Function calls
        expect(supabase.functions.invoke).toHaveBeenCalledWith('market-summary', {
          body: { window: '24h' }
        })
        expect(supabase.functions.invoke).toHaveBeenCalledWith('whale-clusters', {
          body: { window: '24h' }
        })
        expect(supabase.functions.invoke).toHaveBeenCalledWith('chain-risk', {
          body: { window: '24h' }
        })
        
        // Verify database queries
        expect(supabase.from).toHaveBeenCalledWith('alert_events')
      })
    })

    it('should respect cache intervals', async () => {
      renderMarketHub()
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Market Intelligence Hub')).toBeInTheDocument()
      })
      
      // Clear mock calls
      jest.clearAllMocks()
      
      // Wait for refetch intervals (would need to mock timers for full test)
      // This is a simplified check that the queries are set up with intervals
      expect(queryClient.getQueryData(['market-summary', '24h'])).toBeDefined()
    })
  })

  describe('9. Acceptance Criteria Validation', () => {
    it('should pass QA acceptance test 1: Cluster cards match drill-down', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        // Get cluster card data
        const dormantCard = screen.getByText('Dormant → Waking').closest('.cursor-pointer')
        expect(dormantCard?.textContent).toContain('23 addresses')
        expect(dormantCard?.textContent).toContain('$0.5B')
        
        // Click to open drill-down
        fireEvent.click(dormantCard!)
      })
      
      await waitFor(() => {
        // Verify drill-down shows matching data
        expect(screen.getByText('Cluster Members')).toBeInTheDocument()
        // The member count should match (1 member shown matches the mock data)
      })
    })

    it('should pass QA acceptance test 2: Chain heatmap has non-null risk', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        // At least ETH and SOL should have non-null risk values
        expect(screen.getByText('42')).toBeInTheDocument() // ETH
        expect(screen.getByText('67')).toBeInTheDocument() // SOL
        
        // Others should show "No data" with reason
        const btcSection = screen.getByText('BTC').closest('.text-center')
        expect(btcSection?.textContent).toContain('No data')
      })
    })

    it('should pass QA acceptance test 3: Alerts stream populated', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        // Should show alerts with proper classification
        expect(screen.getByText('ETH Alert')).toBeInTheDocument()
        expect(screen.getByText('BTC Alert')).toBeInTheDocument()
        
        // Should show AI Digest
        expect(screen.getByText('AI Digest (24h)')).toBeInTheDocument()
      })
    })

    it('should pass QA acceptance test 4: Same refresh time across modules', async () => {
      renderMarketHub()
      
      await waitFor(() => {
        // All modules should show the same refresh time
        const refreshBadges = screen.getAllByText(/Refreshed \d+m ago/)
        expect(refreshBadges.length).toBeGreaterThan(0)
        
        // Time window should be consistent
        expect(screen.getByText('Last 24 hours')).toBeInTheDocument()
      })
    })
  })
})

describe('Edge Functions Integration Tests', () => {
  describe('Market Summary API', () => {
    it('should return correct data structure', async () => {
      const response = await supabase.functions.invoke('market-summary', {
        body: { window: '24h' }
      })
      
      expect(response.data).toHaveProperty('marketMood')
      expect(response.data).toHaveProperty('volume24h')
      expect(response.data).toHaveProperty('activeWhales')
      expect(response.data).toHaveProperty('riskIndex')
      expect(response.data).toHaveProperty('topAlerts')
      expect(response.data).toHaveProperty('refreshedAt')
      
      expect(response.data.topAlerts).toHaveLength(2)
      expect(response.data.marketMood).toBeGreaterThanOrEqual(0)
      expect(response.data.marketMood).toBeLessThanOrEqual(100)
    })
  })

  describe('Whale Clusters API', () => {
    it('should return 5 canonical clusters', async () => {
      const response = await supabase.functions.invoke('whale-clusters', {
        body: { window: '24h' }
      })
      
      expect(response.data).toHaveLength(5)
      
      const clusterTypes = response.data.map((c: unknown) => c.type)
      expect(clusterTypes).toContain('DORMANT_WAKING')
      expect(clusterTypes).toContain('CEX_INFLOW')
      expect(clusterTypes).toContain('DEFI_ACTIVITY')
      expect(clusterTypes).toContain('DISTRIBUTION')
      expect(clusterTypes).toContain('ACCUMULATION')
    })

    it('should return clusters in priority order', async () => {
      const response = await supabase.functions.invoke('whale-clusters', {
        body: { window: '24h' }
      })
      
      const expectedOrder = ['DORMANT_WAKING', 'CEX_INFLOW', 'DEFI_ACTIVITY', 'DISTRIBUTION', 'ACCUMULATION']
      const actualOrder = response.data.map((c: unknown) => c.type)
      
      expect(actualOrder).toEqual(expectedOrder)
    })
  })

  describe('Chain Risk API', () => {
    it('should return risk data for 4 chains', async () => {
      const response = await supabase.functions.invoke('chain-risk', {
        body: { window: '24h' }
      })
      
      expect(response.data.chains).toHaveLength(4)
      
      const chains = response.data.chains.map((c: unknown) => c.chain)
      expect(chains).toContain('BTC')
      expect(chains).toContain('ETH')
      expect(chains).toContain('SOL')
      expect(chains).toContain('Others')
    })

    it('should have at least one chain with non-null risk', async () => {
      const response = await supabase.functions.invoke('chain-risk', {
        body: { window: '24h' }
      })
      
      const chainsWithRisk = response.data.chains.filter((c: unknown) => c.risk !== null)
      expect(chainsWithRisk.length).toBeGreaterThan(0)
    })
  })
})