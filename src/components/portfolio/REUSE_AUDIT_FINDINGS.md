# Portfolio Infrastructure Reuse Audit Findings

## Existing Portfolio Components (src/components/portfolio/**)

**FOUND**: Extensive portfolio component library with 40+ components including:

### Core Components (REUSABLE):
- `PortfolioContainer.tsx` - Main container with tab navigation and mode switching
- `PortfolioOverview.tsx` - Overview screen component
- `PortfolioHeader.tsx` - Header component with navigation
- `PortfolioSummary.tsx` - Summary display component
- `PortfolioTabs.tsx` - Tab navigation component
- `RiskAnalysis.tsx` - Risk analysis screen

### Specialized Components (REUSABLE):
- `ChainBreakdownChart.tsx` - Chain distribution visualization
- `TokenHoldingsBreakdown.tsx` - Asset breakdown display
- `BenchmarkComparison.tsx` - Performance metrics comparison
- `RiskIntelligenceCard.tsx` - Risk summary display
- `WhaleInteractionLog.tsx` - Activity timeline component
- `GuardianWidget.tsx` - Guardian integration component

### Live Data Components (REUSABLE):
- `LiveChainDistribution.tsx` - Real-time chain data
- `LiveConcentrationRisk.tsx` - Live risk metrics
- `LiveWhaleActivity.tsx` - Live activity feed
- `LiveDataIndicator.tsx` - Freshness indicator

**REUSE OPPORTUNITIES**: 
- Extend PortfolioContainer with unified 3-tab spine (Overview, Positions, Audit)
- Leverage existing risk and activity components for new requirements
- Reuse live data patterns for freshness/confidence display

## Existing Portfolio Hooks (src/hooks/**)

**FOUND**: Multiple portfolio-related hooks:

### Core Hooks (REUSABLE):
- `useUserAddresses.ts` - Multi-wallet address management with DB persistence
- `useEnhancedPortfolio.ts` - Portfolio data aggregation with Guardian/Hunter integration
- `useAggregatedPortfolio.ts` - Multi-wallet portfolio aggregation
- `usePortfolioSummary.ts` - Portfolio summary data fetching

**REUSE OPPORTUNITIES**:
- Extend useUserAddresses for wallet switching functionality
- Leverage useEnhancedPortfolio for unified data aggregation
- Build on useAggregatedPortfolio for multi-wallet scope support

## Existing Portfolio Services (src/services/**)

**FOUND**: Portfolio-related services:

### Core Services (REUSABLE):
- `PortfolioValuationService.ts` - Portfolio valuation and risk scoring
- `MarketIntelligenceAPI.ts` - Portfolio tracking APIs
- `MetricsService.ts` - Portfolio metrics tracking

**REUSE OPPORTUNITIES**:
- Extend PortfolioValuationService for confidence scoring
- Leverage existing API patterns for new endpoints
- Build on MetricsService for telemetry requirements

## Gaps Requiring New Components

### Missing Components (CREATE NEW):
- **ApprovalRiskCard** - VAR display and severity indicators (no existing approval risk UI)
- **IntentPlanExecutor** - Transaction planning and execution UI (no existing execution flow)
- **CopilotChatDrawer** - AI assistant integration (no existing copilot UI)

### Missing Hooks (CREATE NEW):
- **useWalletSwitching** - Wallet scope validation and switching logic
- **useRecommendedActions** - Action scoring and prioritization
- **useApprovalRisks** - Approval risk calculation and management

### Missing Services (CREATE NEW):
- **ActionEngine** - Intent planning and execution service
- **PolicyEngine** - Policy validation service
- **SimulationService** - Transaction simulation service

## Reuse Strategy Summary

**EXTEND EXISTING** (80% reuse):
- PortfolioContainer → Add 3-tab spine and AI Hub
- Portfolio components → Add freshness/confidence display
- useUserAddresses → Add wallet switching validation
- PortfolioValuationService → Add confidence aggregation

**CREATE NEW** (20% new):
- Approval risk components and hooks
- Intent planning and execution system
- Copilot integration components
- Policy and simulation services