# Frontend Data Hooks Mapping

| component path | hook used | API endpoint |
|----------------|-----------|--------------|
| src/components/hub/DigestCard.tsx | fetch (useEffect) | /api/lite/digest |
| src/components/hub/IndexDialCard.tsx | fetch (useEffect) | /api/lite/whale-index |
| src/components/hub/StreakCard.tsx | fetch (useEffect) | /api/lite/streak |
| src/components/hub/UnlockTeaserCard.tsx | fetch (useEffect) | /api/lite/unlocks |
| src/components/hub5/DigestCard.tsx | fetch (useEffect) | /api/lite5/digest |
| src/components/hub2/SummaryKpis.tsx | useQuery (@tanstack/react-query) | supabase.functions.invoke('whale-alerts', 'market-summary-enhanced') |
| src/components/market/MarketIntelligenceHub.tsx | useEnhancedMarketData, useMarketSummary, useWhaleClusters, useAlertsStream | Multiple Supabase Edge Functions |
| src/components/portfolio/PortfolioSummary.tsx | Props-based (no direct API calls) | N/A |
| src/components/predictions/ProductionPredictionsPage.tsx | supabase.functions.invoke | supabase.functions.invoke('whale-predictions') |
| src/hooks/useMarketData.ts | useQuery (@tanstack/react-query) | supabase.functions.invoke('prices', 'whale-alerts') |
| src/hooks/usePortfolioData.ts | useState + useEffect | supabase.functions.invoke('portfolio-tracker') |
| src/hooks/usePredictions.ts | useState + useEffect | supabase.functions.invoke('whale-predictions') |
| src/integrations/api/hub2.ts | Direct Supabase calls | supabase.functions.invoke('whale-alerts', 'market-summary-enhanced', 'watchlist') |

## Data Flow Analysis
- **Component → Hook → Endpoint mapping completed**
- **Missing links identified:** 
  - Some components use direct fetch() calls instead of centralized hooks
  - Mixed patterns: some use @tanstack/react-query, others use useState/useEffect
  - Hub2 components use different API integration patterns than main hub components
- **Client-side vs server-side calls:** 
  - **Client-side:** All data fetching is client-side using fetch() or Supabase client
  - **API patterns:** 
    - Legacy components: Direct fetch() to `/api/lite/*` endpoints
    - Modern components: Supabase Edge Functions via `supabase.functions.invoke()`
    - Hub2 components: @tanstack/react-query with Supabase Edge Functions
  - **No server-side rendering:** All data fetching happens after component mount