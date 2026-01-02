# Guardian Multi-Wallet Functionality Documentation

## Overview

The Guardian page implements a comprehensive multi-wallet management system that allows users to monitor multiple Ethereum wallets simultaneously. This system provides security scanning, risk assessment, and wallet switching capabilities with a seamless user experience.

## Architecture Overview

The multi-wallet functionality is built using a modern React architecture with the following key components:

### Frontend Stack
- **React 18+** with TypeScript
- **Framer Motion** for animations and transitions
- **wagmi** for Web3 wallet connections
- **RainbowKit** for wallet connection UI
- **React Query (TanStack Query)** for data fetching and caching
- **Zustand** for local state management

### Backend Stack
- **Supabase** for database and authentication
- **Supabase Edge Functions** (Deno runtime) for serverless backend logic
- **PostgreSQL** for persistent wallet storage
- **Guardian API** for security scanning

## Core Components

### 1. WalletContext (`src/contexts/WalletContext.tsx`)

The central context provider that manages multi-wallet state across the application.

**Key Features:**
- Persistent wallet storage in localStorage
- Automatic wallet synchronization
- ENS/Lens/Unstoppable Domains name resolution
- Analytics tracking for wallet operations
- Rate limiting and error handling

**Interface:**
```typescript
export interface ConnectedWallet {
  address: string;           // Ethereum address
  label?: string;            // User-defined label
  ens?: string;              // ENS name if available
  lens?: string;             // Lens Protocol handle
  unstoppable?: string;      // Unstoppable Domains name
  resolvedName?: ResolvedName; // Full resolved name data
  chain: string;             // Primary chain (ethereum, polygon, etc.)
  balance?: string;          // Optional balance display
  lastUsed?: Date;           // Last time this wallet was active
}

export interface WalletContextValue {
  connectedWallets: ConnectedWallet[];
  activeWallet: string | null;
  setActiveWallet: (address: string) => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: (address: string) => Promise<void>;
  isLoading: boolean;
  isSwitching: boolean;
}
```

**Key Methods:**
- `setActiveWallet()` - Switches between wallets with React 18 transitions
- `connectWallet()` - Connects new wallets via window.ethereum
- `disconnectWallet()` - Removes wallets from registry
- `resolveWalletName()` - Background ENS/domain resolution

### 2. GuardianEnhanced Page (`src/pages/GuardianEnhanced.tsx`)

The main Guardian interface with multi-wallet support.

**Key Features:**
- Multi-wallet dropdown selector
- Portfolio overview for multiple wallets
- Individual wallet scanning
- Bulk wallet operations
- Demo mode support

**Multi-Wallet UI Elements:**
```typescript
// Wallet Dropdown in Header
<DisabledTooltipButton
  onClick={() => setShowWalletDropdown(!showWalletDropdown)}
  className="flex items-center gap-2 px-3 py-1 rounded-lg border"
>
  <Wallet className="w-3 h-3" />
  <span className="text-xs font-mono">
    {activeAddress?.slice(0, 6)}...{activeAddress?.slice(-4)}
  </span>
  {activeWallet?.trustScore && (
    <span className={`w-2 h-2 rounded-full ${
      activeWallet.trustScore >= 80 ? 'bg-[#00C9A7]' :
      activeWallet.trustScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'
    }`} />
  )}
  <ChevronDown className="w-3 h-3" />
</DisabledTooltipButton>
```

**Portfolio Overview:**
- Displays all wallets with trust scores and risk counts
- Shows average portfolio trust score
- Provides individual wallet scan buttons
- Supports bulk "Scan All Wallets" operation

### 3. AddWalletModal (`src/components/guardian/AddWalletModal.tsx`)

Modal component for adding new wallets to the registry.

**Supported Wallet Types:**
- **Browser Wallets**: MetaMask, Coinbase, Brave (via RainbowKit)
- **Mobile Wallets**: Trust, Rainbow, Phantom (coming soon)
- **Hardware Wallets**: Ledger, Trezor, GridPlus (coming soon)
- **Exchange Wallets**: Binance, Coinbase, OKX (coming soon)
- **Smart Wallets**: Safe, Argent, UniPass (coming soon)
- **Social Wallets**: Privy, Web3Auth (coming soon)
- **Read-Only**: Manual address input for monitoring

**Flow States:**
```typescript
type FlowState = 'main' | 'success' | 'scanning';
```

**Key Features:**
- Auto-detection of connected wallets
- ENS name resolution during addition
- Duplicate prevention with 30-second cooldown
- Alias/label assignment
- Real-time scanning feedback

### 4. WalletScopeHeader (`src/components/guardian/WalletScopeHeader.tsx`)

Header component that clearly displays which wallet is being analyzed.

**Requirements Compliance:**
- R10-AC3: Wallet scope explicit everywhere in Guardian
- R10-AC4: Clear wallet identification in all views

```typescript
interface WalletScopeHeaderProps {
  walletAddress?: string;
  walletLabel?: string;
  className?: string;
}
```

### 5. useWalletRegistry Hook (`src/hooks/useWalletRegistry.ts`)

React hook for persistent multi-wallet management with Supabase integration.

**Key Features:**
- Automatic sync with Supabase `user_wallets` table
- Auto-sync connected wallets from RainbowKit/wagmi
- CRUD operations for wallet management
- Real-time updates with React Query
- Chain-specific wallet filtering

**Database Schema:**
```sql
CREATE TABLE user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  label TEXT,
  chain TEXT DEFAULT 'ethereum',
  source TEXT DEFAULT 'manual',
  verified BOOLEAN DEFAULT false,
  last_scan TIMESTAMPTZ,
  trust_score INTEGER,
  risk_flags JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. useGuardianScan Hook (`src/hooks/useGuardianScan.ts`)

React hook for wallet security scanning with caching and state management.

**Features:**
- Per-wallet scan caching with React Query
- Real-time scan status tracking
- Automatic refetch on wallet switch
- Status accent colors based on risk level
- Mutation support for manual rescans

```typescript
export interface UseGuardianScanResult {
  data?: GuardianScanResult;
  isLoading: boolean;
  isRefetching: boolean;
  error: unknown;
  refetch: () => Promise<GuardianScanResult>;
  rescan: () => Promise<GuardianScanResult>;
  isRescanning: boolean;
  statusAccent: string;
  scoreGlow: string;
}
```

## Backend Edge Functions

### 1. Guardian Scan (`supabase/functions/guardian-scan/index.ts`)

Serverless function for individual wallet security analysis.

**Features:**
- Rate limiting (10 requests per minute per IP)
- Comprehensive risk factor analysis
- Trust score calculation (0-100)
- Risk categorization (Low/Medium/High)
- CORS support for web clients

**API Endpoint:**
```
POST /functions/v1/guardian-scan
Content-Type: application/json

{
  "wallet_address": "0x...",
  "network": "ethereum"
}
```

**Response Format:**
```json
{
  "trust_score": 0.87,
  "risk_score": 1.3,
  "risk_level": "Low",
  "flags": [
    {
      "id": 1,
      "type": "Approvals",
      "severity": "medium",
      "details": "2 unlimited approvals detected",
      "timestamp": "2025-01-02T..."
    }
  ],
  "wallet_address": "0x...",
  "network": "Ethereum Mainnet",
  "last_scan": "2025-01-02T...",
  "guardian_scan_id": "uuid"
}
```

### 2. Wallet Registry Scan (`supabase/functions/wallet-registry-scan/index.ts`)

Scheduled job for batch scanning of all registered wallets.

**Features:**
- Batch processing with configurable size (default: 50)
- User-specific scanning support
- Automatic trust score updates
- Error handling and retry logic
- Progress tracking and reporting

**Trigger Methods:**
- Supabase cron job (pg_cron)
- Manual HTTP POST
- On-demand from client applications

**API Endpoint:**
```
POST /functions/v1/wallet-registry-scan
Content-Type: application/json

{
  "batch_size": 50,
  "user_id": "uuid",
  "wallet_ids": ["uuid1", "uuid2"]
}
```

## User Experience Flow

### 1. Initial Setup
1. User visits Guardian page
2. Connects wallet via RainbowKit
3. Wallet automatically added to registry
4. Initial security scan triggered
5. Results displayed with trust score

### 2. Adding Additional Wallets
1. Click "Add Wallet" button in header
2. Choose wallet type (Browser/Mobile/Hardware/etc.)
3. Connect via RainbowKit or enter address manually
4. Assign optional alias/label
5. Automatic scan initiated
6. Wallet added to dropdown selector

### 3. Wallet Switching
1. Click wallet dropdown in header
2. View all wallets with trust scores
3. Click desired wallet to switch
4. UI updates with React 18 transitions
5. Scan data loads for selected wallet
6. Portfolio view updates automatically

### 4. Portfolio Management
1. View multi-wallet overview card
2. See aggregated statistics (avg trust score, total risks)
3. Individual wallet scan buttons
4. "Scan All Wallets" bulk operation
5. Real-time status updates

## State Management

### Local State (React)
- Active wallet selection
- UI state (modals, dropdowns, loading)
- Form inputs and validation
- Animation states

### Context State (WalletContext)
- Connected wallets list
- Active wallet address
- Loading and switching states
- Resolved names (ENS/Lens/UD)

### Server State (React Query)
- Scan results per wallet
- Wallet registry from Supabase
- User preferences and labels
- Background sync operations

### Persistent State (localStorage)
- Active wallet selection
- Connected wallets list
- User preferences
- Session data

## Security Considerations

### Data Privacy
- No private keys stored or transmitted
- Read-only wallet monitoring
- User-controlled data retention
- Secure ENS resolution

### Rate Limiting
- 10 scans per minute per IP
- Duplicate prevention (30-second cooldown)
- Batch processing limits
- API key protection

### Authentication
- Supabase Auth integration
- Row Level Security (RLS) policies
- User-scoped wallet access
- Secure session management

## Performance Optimizations

### Caching Strategy
- React Query for scan results (60-second stale time)
- localStorage for wallet list persistence
- Background name resolution
- Optimistic UI updates

### Lazy Loading
- Modal components loaded on demand
- Background wallet scanning
- Progressive data enhancement
- Skeleton loading states

### Animations
- React 18 transitions for smooth switching
- Framer Motion for micro-interactions
- Reduced motion support
- Performance-conscious animations

## Analytics & Monitoring

### Tracked Events
- Wallet connections and disconnections
- Wallet switching with duration metrics
- Scan completions and failures
- Modal interactions and conversions

### Error Handling
- Comprehensive error boundaries
- Graceful degradation
- User-friendly error messages
- Automatic retry mechanisms

## Future Enhancements

### Planned Features
- Multi-chain support (Polygon, Arbitrum, etc.)
- Hardware wallet integration
- Exchange wallet monitoring
- Smart contract wallet support
- Social recovery wallets
- Batch operations UI
- Advanced filtering and sorting
- Export functionality

### Technical Improvements
- WebSocket real-time updates
- Progressive Web App (PWA) support
- Offline mode capabilities
- Enhanced caching strategies
- Performance monitoring
- A/B testing framework

## Development Guidelines

### Code Standards
- TypeScript strict mode
- ESLint + Prettier formatting
- Comprehensive error handling
- Accessibility compliance (WCAG AA)
- Mobile-responsive design

### Testing Strategy
- Unit tests for hooks and utilities
- Integration tests for wallet flows
- E2E tests for critical paths
- Property-based testing for edge cases
- Performance testing for large wallet lists

### Deployment
- Supabase Edge Functions for backend
- Vercel for frontend hosting
- Environment-based configuration
- Automated CI/CD pipeline
- Monitoring and alerting

## Conclusion

The Guardian multi-wallet functionality provides a comprehensive, user-friendly system for managing and monitoring multiple Ethereum wallets. The architecture emphasizes performance, security, and user experience while maintaining scalability for future enhancements.

The system successfully implements:
- Seamless wallet switching with React 18 transitions
- Persistent multi-wallet management with Supabase
- Real-time security scanning with caching
- Comprehensive error handling and rate limiting
- Mobile-responsive design with accessibility support
- Analytics tracking for continuous improvement

This implementation serves as a foundation for expanding Guardian's capabilities to support additional chains, wallet types, and advanced security features.