# AlphaWhale Lite - Project Structure

## Architecture Overview
AlphaWhale Lite follows a modern full-stack architecture with React frontend, Supabase backend, and edge functions for real-time data processing. The application uses a component-based architecture with clear separation of concerns.

## Directory Structure

### `/src` - Main Application Code
- **`/app`** - Next.js App Router configuration and API routes
- **`/components`** - React components organized by feature and functionality
- **`/pages`** - Main application pages and route components
- **`/hooks`** - Custom React hooks for state management and data fetching
- **`/services`** - Business logic and external API integrations
- **`/lib`** - Utility functions, configurations, and shared libraries
- **`/types`** - TypeScript type definitions
- **`/contexts`** - React context providers for global state
- **`/stores`** - Zustand stores for client-side state management
- **`/utils`** - Helper functions and utilities

### `/supabase` - Backend Infrastructure
- **`/functions`** - Edge functions for serverless backend logic
- **`/migrations`** - Database schema migrations and updates
- **`config.toml`** - Supabase configuration
- **`seed.sql`** - Database seeding scripts

### `/components` - Component Organization

#### Core UI Components
- **`/ui`** - Reusable UI components (buttons, inputs, modals)
- **`/layout`** - Layout components (headers, sidebars, navigation)
- **`/navigation`** - Navigation-specific components

#### Feature Components
- **`/hub`** - Main dashboard components
- **`/whale`** - Whale tracking and analytics components
- **`/portfolio`** - Portfolio management components
- **`/alerts`** - Alert and notification components
- **`/market`** - Market intelligence components
- **`/predictions`** - Predictive analytics components
- **`/subscription`** - Subscription and billing components

### `/pages` - Application Routes
- **`Home.tsx`** - Landing page
- **`Hub.tsx`** - Main dashboard
- **`Portfolio.tsx`** - Portfolio tracking
- **`WhaleAnalytics.tsx`** - Whale intelligence dashboard
- **`MarketIntelligenceHub.tsx`** - Market analysis hub
- **`Alerts.tsx`** - Alert management
- **`Profile.tsx`** - User profile and settings

### `/services` - Business Logic
- **`MarketIntelligenceAPI.ts`** - Market data service
- **`whaleSimulator.ts`** - Whale behavior simulation
- **`PortfolioValuationService.ts`** - Portfolio calculations
- **`PriceOracle_CoinGecko.ts`** - Price data integration
- **`circuitBreaker.ts`** - Error handling and resilience

### `/hooks` - Custom Hooks
- **Data Fetching**: `useMarketData`, `useWhaleAnalytics`, `usePortfolioData`
- **State Management**: `useSubscription`, `useUserPlan`, `useNotifications`
- **UI Interactions**: `useToast`, `useDebounce`, `useMobile`
- **Feature Logic**: `usePredictions`, `useAlerts`, `useWatchlist`

## Architectural Patterns

### Component Architecture
- **Atomic Design**: Components organized from atoms to organisms
- **Feature-based Organization**: Components grouped by business functionality
- **Separation of Concerns**: UI, logic, and data layers clearly separated

### State Management
- **React Context**: Global application state (auth, theme, subscription)
- **Zustand**: Client-side state management for complex interactions
- **TanStack Query**: Server state management and caching
- **Local State**: Component-level state with React hooks

### Data Flow
- **Supabase Client**: Real-time database connections
- **Edge Functions**: Serverless backend processing
- **API Routes**: Next.js API endpoints for server-side logic
- **Real-time Subscriptions**: Live data updates via Supabase

### Database Schema
- **`user_profiles`** - User account and plan information
- **`whale_digest`** - Whale movement events and alerts
- **`whale_index`** - Daily whale activity scores
- **`token_unlocks`** - Token unlock schedules
- **`portfolio_snapshots`** - Portfolio tracking data
- **`predictions`** - AI prediction results
- **`alerts`** - User alert configurations

## Integration Points

### External APIs
- **CoinGecko**: Price data and market information
- **Etherscan**: Blockchain transaction data
- **TokenUnlocks**: Token vesting schedules
- **Stripe**: Payment processing

### Real-time Features
- **Supabase Realtime**: Live database updates
- **WebSocket Connections**: Real-time whale alerts
- **Server-Sent Events**: Live market data streams

### Authentication & Authorization
- **Supabase Auth**: User authentication system
- **Row Level Security**: Database access control
- **Plan-based Gating**: Feature access based on subscription tier

## Deployment Architecture
- **Frontend**: Vercel deployment with edge optimization
- **Backend**: Supabase hosted database and edge functions
- **CDN**: Static asset delivery via Vercel Edge Network
- **Monitoring**: Real-time error tracking and performance monitoring