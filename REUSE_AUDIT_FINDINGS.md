# Portfolio Infrastructure Reuse Audit Findings

## Search Results Summary

### 1. Existing Portfolio Components (src/components/portfolio/**)

**FOUND**: Extensive portfolio component library with 50+ components including:

**Core Components:**
- `PortfolioContainer.tsx` - Main container component
- `PortfolioHeader.tsx` - Header with navigation
- `PortfolioOverview.tsx` - Overview display
- `PortfolioTabs.tsx` - Tab navigation system
- `PortfolioSummary.tsx` - Summary card

**Specialized Components:**
- `PortfolioOverviewCard.tsx` - Overview metrics card
- `ChainBreakdownChart.tsx` - Chain distribution visualization
- `RiskAnalysisPanel.tsx` - Risk analysis display
- `GuardianWidget.tsx` - Guardian integration widget
- `LiveDataIndicator.tsx` - Data freshness indicator

**Reuse Opportunities:**
- Extend `PortfolioContainer` for unified hub functionality
- Leverage `PortfolioTabs` for 3-tab spine (Overview, Positions, Audit)
- Reuse `LiveDataIndicator` for freshness display

### 2. Portfolio-Related Hooks (src/hooks/**)

**FOUND**: Multiple portfolio hooks available:

**Core Hooks:**
- `useEnhancedPortfolio.ts` - Enhanced portfolio data fetching
- `useAggregatedPortfolio.ts` - Multi-wallet aggregation
- `usePortfolioSummary.ts` - Portfolio summary data
- `useUserAddresses.ts` - User wallet addresses management

**Missing Hooks:**
- `useWalletSwitching` - Not found, needs creation

**Reuse Opportunities:**
- Extend `useUserAddresses` for wallet switching functionality
- Leverage `useAggregatedPortfolio` for multi-wallet support
- Build on `useEnhancedPortfolio` for unified data fetching

### 3. Portfolio Services (src/services/**)

**FOUND**: Portfolio service infrastructure:

**Core Services:**
- `PortfolioValuationService.ts` - Portfolio valuation and risk scoring
- `MarketIntelligenceAPI.ts` - Portfolio tracker APIs
- `MetricsService.ts` - Portfolio metrics tracking

**Reuse Opportunities:**
- Extend `PortfolioValuationService` for risk assessment
- Leverage existing API patterns in `MarketIntelligenceAPI`
- Use `MetricsService` for portfolio event tracking

### 4. Existing Routes (src/pages/** and src/app/**)

**FOUND**: Portfolio routing infrastructure:

**Existing Routes:**
- `/portfolio-hunter` - Portfolio hunter page (uses `PortfolioContainer`)
- `/portfolio` - Referenced in navigation but no dedicated page found
- Navigation configured for `/portfolio` route in multiple places

**Route Infrastructure:**
- Navigation items configured in `AppFooterNav.tsx`, `MobileFooterNav.tsx`
- Route context defined in header system
- Canonical routing system supports `/portfolio`

**Reuse Opportunities:**
- Create `/portfolio` route as alias to existing infrastructure
- Extend existing navigation patterns
- Leverage route context system for header integration

## Reuse Strategy Recommendations

### High Priority Reuse (Extend Existing)
1. **PortfolioContainer** - Extend for unified hub with 3-tab spine
2. **useUserAddresses** - Extend for wallet switching functionality  
3. **PortfolioTabs** - Extend for Overview/Positions/Audit tabs
4. **LiveDataIndicator** - Reuse for freshness display

### Medium Priority Reuse (Integrate With)
1. **PortfolioValuationService** - Integrate for risk scoring
2. **useAggregatedPortfolio** - Integrate for multi-wallet support
3. **Navigation system** - Extend existing route patterns

### New Components Needed (No Existing Equivalent)
1. **useWalletSwitching** hook - Create new
2. **Copilot chat drawer** - Create new
3. **AI Hub component** - Create new
4. **Graph-Lite visualizer** - Create new

## Implementation Approach

1. **Extend existing components** rather than create duplicates
2. **Add new props/features** to existing components where possible
3. **Create new components** only when no suitable existing component found
4. **Follow existing patterns** for consistency