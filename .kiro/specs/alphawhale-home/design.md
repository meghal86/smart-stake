# Design Document: AlphaWhale Home

## Overview

The AlphaWhale Home screen is the platform's primary entry point, designed to communicate value, showcase features, and guide users toward engagement. The design follows a "Trinity Bridge" layout that connects Guardian, Hunter, and HarvestPro through a unified visual language while maintaining each feature's distinct identity.

The architecture prioritizes:
- **Fast initial load**: Critical content renders within 3 seconds
- **Live data integration**: Real-time metrics from each feature
- **Progressive enhancement**: Core content works without JavaScript
- **Accessibility-first**: WCAG AA compliance throughout
- **Mobile-optimized**: Touch-friendly, responsive design

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                     Home Screen                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Hero Section                          │  │
│  │  - Headline, Subheading, Animated Background      │  │
│  │  - Primary CTA                                    │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Feature Cards (3-column)                │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐          │  │
│  │  │Guardian │  │ Hunter  │  │Harvest  │          │  │
│  │  │  Card   │  │  Card   │  │Pro Card │          │  │
│  │  └─────────┘  └─────────┘  └─────────┘          │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Trust Builders Section                  │  │
│  │  - Badges (Non-custodial, No KYC, etc.)         │  │
│  │  - Statistics (Wallets Protected, Tax Savings)   │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │          Onboarding Section                       │  │
│  │  - Step 1: Connect Wallet                        │  │
│  │  - Step 2: Run Guardian Scan                     │  │
│  │  - Step 3: Browse Hunter                         │  │
│  │  - CTAs: Start Onboarding / Skip                 │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │          Footer Navigation                        │  │
│  │  [Guardian] [Hunter] [HarvestPro] [Settings]    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Browser
    ↓
Next.js Page Component (/src/pages/Home.tsx)
    ↓
React Query Hook (useHomeMetrics)
    ↓
Next.js API Route (/api/home-metrics)
    ↓
Supabase Database (aggregate queries)
    ↓
Response: HomeMetrics JSON
    ↓
UI Components (HeroSection, FeatureCard, etc.)
```

### Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **UI Components**: React 18+ with TypeScript
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: React Query for server state
- **Animations**: Framer Motion (respecting prefers-reduced-motion)
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)

## Authentication Context & Provider

### Setup: `src/lib/context/AuthContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

interface AuthContextType {
  isAuthenticated: boolean;
  walletAddress: string | null;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if JWT exists in cookie on mount
  useEffect(() => {
    const checkAuth = async () => {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        // JWT is valid, user is authenticated
      } else {
        // JWT expired or missing, clear auth
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      }
    };
    
    checkAuth();
  }, []);
  
  const connectWallet = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // WalletConnect modal will open automatically via wagmi hook
      // After user connects, signing happens via useSignMessage
      // JWT is created and stored in httpOnly cookie
    } catch (err) {
      setError('Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };
  
  const disconnectWallet = () => {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    // Additional disconnect logic
  };
  
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isConnected && !!address,
        walletAddress: address || null,
        isLoading,
        error,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### App Layout Setup: `src/app/layout.tsx`

```typescript
import { AuthProvider } from '@/lib/context/AuthContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

## useHomeMetrics Hook Implementation

### File: `src/hooks/useHomeMetrics.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/context/AuthContext';
import { getDemoMetrics } from '@/lib/services/demoDataService';

interface UseHomeMetricsOptions {
  enabled?: boolean;
}

export const useHomeMetrics = (options?: UseHomeMetricsOptions) => {
  const { isAuthenticated } = useAuth();
  
  const { data, isLoading, error, refetch } = useQuery(
    {
      queryKey: ['homeMetrics', isAuthenticated],
      queryFn: async () => {
        // Demo mode: return instantly
        if (!isAuthenticated) {
          return getDemoMetrics();
        }
        
        // Live mode: fetch from API with retry
        try {
          const response = await fetch('/api/home-metrics', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Include httpOnly cookies
          });
          
          if (response.status === 401) {
            // JWT expired, clear auth and return demo
            document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
            return getDemoMetrics();
          }
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const { data } = await response.json();
          return data;
        } catch (err) {
          console.error('Failed to fetch live metrics:', err);
          throw err;
        }
      },
      enabled: options?.enabled !== false,
      staleTime: isAuthenticated ? 60 * 1000 : Infinity, // 60s for live, infinite for demo
      refetchInterval: isAuthenticated ? 30 * 1000 : false, // 30s polling for live, no polling for demo
      retry: (failureCount, error) => {
        // Retry up to 3 times with exponential backoff
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => {
        return Math.min(1000 * 2 ** attemptIndex, 30000); // 1s, 2s, 4s, etc.
      },
    }
  );
  
  return {
    metrics: data,
    isLoading,
    error,
    refetch,
    isDemo: data?.isDemo ?? true,
  };
};
```

## Error Messages & User Feedback

### File: `src/lib/constants/errorMessages.ts`

```typescript
export const ERROR_MESSAGES = {
  // API Errors
  API_FAILED: 'Unable to load metrics. Please refresh the page.',
  API_TIMEOUT: 'Request took too long. Please try again.',
  API_UNAUTHORIZED: 'Session expired. Please reconnect your wallet.',
  API_RATE_LIMITED: 'Too many requests. Please wait a moment.',
  
  // Wallet Errors
  WALLET_CONNECTION_FAILED: 'Failed to connect wallet. Please try again.',
  WALLET_NOT_INSTALLED: 'Please install a Web3 wallet (MetaMask, etc.)',
  WALLET_WRONG_NETWORK: 'Please switch to Ethereum Mainnet.',
  WALLET_SIGNATURE_REJECTED: 'You declined the signature request.',
  WALLET_USER_CANCELLED: 'Connection cancelled.',
  
  // Component Errors
  COMPONENT_ERROR: 'Something went wrong. Please refresh the page.',
  NAVIGATION_ERROR: 'Navigation failed. Please try again.',
  
  // Network Errors
  NETWORK_OFFLINE: 'You appear to be offline. Showing cached data.',
  NETWORK_SLOW: 'Your connection is slow. Data may be outdated.',
};

export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully!',
  METRICS_REFRESHED: 'Data refreshed.',
};

export const INFO_MESSAGES = {
  LOADING_METRICS: 'Loading your data...',
  DEMO_MODE: 'Explore with sample data. Connect wallet for personalized results.',
  DATA_STALE: 'Data is outdated. Refreshing...',
  DATA_CACHED: 'Using cached data. Last updated 2 minutes ago.',
};
```

## Components and Interfaces

### 1. Home Page Component

**Location**: `src/pages/Home.tsx`

**Responsibilities**:
- Orchestrate layout of all sections
- Manage loading and error states
- Coordinate data fetching via React Query

**Props**: None (top-level page)

### 2. HeroSection Component

**Location**: `src/components/home/HeroSection.tsx`

**Props**:
```typescript
interface HeroSectionProps {
  onCtaClick: () => void;
}
```

**Responsibilities**:
- Render headline and subheading
- Display animated background
- Handle primary CTA interaction
- Ensure WCAG AA contrast

### 3. FeatureCard Component

**Location**: `src/components/home/FeatureCard.tsx`

**Props**:
```typescript
interface FeatureCardProps {
  feature: 'guardian' | 'hunter' | 'harvestpro';
  icon: LucideIcon;
  title: string;
  tagline: string;
  previewLabel: string;
  previewValue: string | number;
  previewDescription: string;
  primaryRoute: string;
  demoRoute?: string;
  isLoading?: boolean;
}
```

**Responsibilities**:
- Display feature information and live metric
- Handle hover animations (scale 1.02)
- Provide primary and secondary CTAs
- Apply glassmorphism styling

### 4. TrustBuilders Component

**Location**: `src/components/home/TrustBuilders.tsx`

**Props**:
```typescript
interface TrustBuildersProps {
  metrics: {
    totalWalletsProtected: number;
    totalYieldOptimizedUsd: number;
    averageGuardianScore: number;
  };
  isLoading?: boolean;
}
```

**Responsibilities**:
- Display trust badges
- Show platform statistics
- Handle loading states with skeletons

### 5. OnboardingSection Component

**Location**: `src/components/home/OnboardingSection.tsx`

**Props**:
```typescript
interface OnboardingSectionProps {
  onStartOnboarding: () => void;
  onSkip: () => void;
}
```

**Responsibilities**:
- Display onboarding steps
- Handle CTA interactions
- Responsive step layout

### 6. FooterNav Component

**Location**: `src/components/layout/FooterNav.tsx`

**Props**:
```typescript
interface FooterNavProps {
  currentRoute: string;
}
```

**Responsibilities**:
- Display navigation icons
- Highlight active route
- Handle navigation
- Fixed positioning on mobile

## Demo Mode Architecture

### Demo Data Service

**Location**: `src/lib/services/demoDataService.ts`

**Purpose**: Provide realistic sample metrics for unauthenticated users

**Implementation**:
- No API calls (instant load)
- Hardcoded sample values
- Deterministic (same values every time for consistency)

```typescript
export const getDemoMetrics = (): HomeMetrics => {
  return {
    guardianScore: 89,
    hunterOpportunities: 42,
    hunterAvgApy: 18.5,
    hunterConfidence: 92,
    harvestEstimateUsd: 12400,
    harvestEligibleTokens: 7,
    harvestGasEfficiency: 'High',
    totalWalletsProtected: 50000,
    totalYieldOptimizedUsd: 12400000,
    averageGuardianScore: 85,
    lastUpdated: new Date().toISOString(),
    isDemo: true,
    demoMode: true,
  };
};
```

### Data Flow: Demo vs Live

**Unauthenticated User**:
```
Home Component
    ↓
useHomeMetrics hook checks auth
    ↓
Auth = false → getDemoMetrics()
    ↓
Return demo metrics instantly (no API call)
    ↓
Show metrics with "Demo Mode" badge
```

**Authenticated User**:
```
Home Component
    ↓
useHomeMetrics hook checks auth
    ↓
Auth = true → fetch /api/home-metrics
    ↓
API returns user's real metrics
    ↓
Show metrics without badge
```

### Component Awareness

Components receive flag indicating demo mode:

```typescript
<FeatureCard 
  isDemo={metrics.isDemo} 
  {...otherProps} 
/>

// Component uses flag:
{isDemo && <Badge>Demo Mode</Badge>}
```

### Transition: Demo → Live

When user connects wallet:
1. WalletConnect modal opens → user signs → JWT created
2. Home re-renders → auth context updates
3. useHomeMetrics hook detects auth change
4. Fetches live metrics via `/api/home-metrics`
5. Skeleton shows during fetch (200-1000ms)
6. Real metrics fade in, demo badge disappears
7. All feature cards update live metrics

**Implementation**:
```typescript
const useHomeMetrics = () => {
  const { isAuthenticated, walletAddress } = useAuth();
  
  const { data, isLoading } = useQuery(
    ['homeMetrics', walletAddress],
    async () => {
      if (!isAuthenticated) {
        return getDemoMetrics(); // Instant, no API
      }
      
      const response = await fetch('/api/home-metrics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.json();
    },
    {
      enabled: true,  // Always run (demo or live)
      staleTime: isAuthenticated ? 60000 : Infinity,  // Cache demo forever
      refetchInterval: isAuthenticated ? 30000 : false,  // Poll live data
    }
  );
  
  return { data, isLoading };
};
```

## WalletConnect v2 Integration

### Hero Section: Connect Wallet Button

**Location**: `src/components/home/HeroSection.tsx`

**Responsibility**: Trigger wallet connection modal

**Implementation**:
```typescript
import { createWeb3Modal, useWeb3Modal } from '@web3modal/wagmi/react';

const HeroSection = ({ onCtaClick }: HeroSectionProps) => {
  const { isOpen, open } = useWeb3Modal();
  const { isConnected } = useAccount();
  
  if (isConnected) {
    return <button onClick={() => router.push('/guardian')}>Start Protecting</button>;
  }
  
  return (
    <button 
      onClick={() => open()} 
      className="bg-cyan-500 text-white px-6 py-3 rounded-lg"
    >
      Connect Wallet
    </button>
  );
};
```

### Modal Configuration

**File**: `src/config/wagmi.ts`

```typescript
import { http, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    }),
    coinbaseWallet(),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});
```

### Post-Connection Flow

1. User signs message (EIP-191)
2. Signature sent to `/api/auth/verify`
3. Backend validates signature & creates JWT
4. JWT stored in httpOnly cookie
5. Auth context updates
6. Home page re-renders with live data

## Backend API Specification

### Endpoint: GET /api/home-metrics

**File**: `src/app/api/home-metrics/route.ts`

**Authentication**: Required (JWT in httpOnly cookie)

**Request**:
```http
GET /api/home-metrics
Cookie: auth_token=eyJhbGciOiJIUzI1NiIs...
```

**Response (200 OK)**:
```json
{
  "data": {
    "guardianScore": 87,
    "hunterOpportunities": 28,
    "hunterAvgApy": 16.8,
    "hunterConfidence": 88,
    "harvestEstimateUsd": 3800,
    "harvestEligibleTokens": 5,
    "harvestGasEfficiency": "High",
    "totalWalletsProtected": 50000,
    "totalYieldOptimizedUsd": 12400000,
    "averageGuardianScore": 85,
    "lastUpdated": "2025-11-28T20:30:00Z",
    "isDemo": false,
    "demoMode": false
  },
  "ts": "2025-11-28T20:30:15Z"
}
```

**Response (401 Unauthorized)**:
```json
{
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Please authenticate to access this resource"
  }
}
```

**Response (500 Server Error)**:
```json
{
  "error": {
    "code": "METRICS_FETCH_FAILED",
    "message": "Unable to calculate metrics. Please try again."
  }
}
```

**Cache Headers**:
```http
Cache-Control: public, max-age=60, must-revalidate
ETag: "abc123def456"
```

### Backend Implementation

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { getGuardianMetrics, getHunterMetrics, getHarvestProMetrics } from '@/lib/metrics';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authenticate first' } },
        { status: 401 }
      );
    }
    
    // 2. Decode JWT
    let walletAddress: string;
    try {
      const decoded = verifyJWT(token);
      walletAddress = decoded.walletAddress;
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_TOKEN', message: 'Session expired' } },
        { status: 401 }
      );
    }
    
    // 3. Fetch metrics in parallel
    const [guardianData, hunterData, harvestData] = await Promise.all([
      getGuardianMetrics(walletAddress),
      getHunterMetrics(walletAddress),
      getHarvestProMetrics(walletAddress),
    ]);
    
    // 4. Fetch platform stats
    const stats = await getPlatformStats();
    
    // 5. Assemble response
    const response = {
      data: {
        guardianScore: guardianData.score,
        hunterOpportunities: hunterData.count,
        hunterAvgApy: hunterData.avgApy,
        hunterConfidence: hunterData.confidence,
        harvestEstimateUsd: harvestData.estimate,
        harvestEligibleTokens: harvestData.eligibleCount,
        harvestGasEfficiency: harvestData.gasEfficiency,
        totalWalletsProtected: stats.walletsProtected,
        totalYieldOptimizedUsd: stats.yieldOptimized,
        averageGuardianScore: stats.avgScore,
        lastUpdated: new Date().toISOString(),
        isDemo: false,
        demoMode: false,
      },
      ts: new Date().toISOString(),
    };
    
    // 6. Return with cache headers
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=60, must-revalidate',
        'ETag': generateETag(response),
      },
    });
  } catch (error) {
    console.error('Metrics endpoint error:', error);
    return NextResponse.json(
      { error: { code: 'METRICS_FETCH_FAILED', message: 'Try again later' } },
      { status: 500 }
    );
  }
}
```

## Component State Machine

### FeatureCard States

```
┌──────────────┐
│     IDLE     │
└──────┬───────┘
       │
       ├─→ LOADING (skeleton showing)
       │
       ↓
       ├─→ SUCCESS (show metric)
       │
       └─→ ERROR (show fallback)
           │
           ├─→ RETRY (auto-retry or manual)
           │
           └─→ TIMEOUT (after 3s)
```

### Home Page State Machine

```
Initial Load
    ↓
[Check Auth]
    ├─ No Auth → DEMO_LOADING
    │              ↓
    │          DEMO_READY (show demo metrics immediately)
    │
    └─ Auth → LIVE_LOADING
                 ↓
         Fetch /api/home-metrics
                 ├─ Success → LIVE_READY (show live metrics)
                 │
                 └─ Error → ERROR_STATE
                              ├─ Retry (exponential backoff)
                              │
                              └─ Timeout → STALE_DATA
```

### Error Recovery Flow

```
API Fails
    ↓
Show Cached Data
    ↓
Auto-Retry every 10s
    ↓
(Success) → Update metrics
(Still Failing after 2 min) → Show error banner
```

## Component Data Contracts

### FeatureCard Data States

**State 1: Loading**
```typescript
<FeatureCard
  isLoading={true}
  previewValue="—"  // Skeleton showing
  isDemo={false}
/>

// Renders:
// ┌─────────────┐
// │   Shield    │
// │  Guardian   │
// │ Secure...   │
// │ [Skeleton]  │ ← Pulsing gray bar
// │  [Button]   │
// └─────────────┘
```

**State 2: Success (Demo)**
```typescript
<FeatureCard
  isLoading={false}
  previewValue={89}
  isDemo={true}
/>

// Renders:
// ┌──────────────────┐
// │     Shield       │
// │    Guardian      │
// │  Secure wallet   │
// │  Score: 89 [🎭]  │ ← [🎭] = Demo badge
// │ [Primary] [Demo] │
// └──────────────────┘
```

**State 3: Success (Live)**
```typescript
<FeatureCard
  isLoading={false}
  previewValue={87}
  isDemo={false}
/>

// Renders:
// ┌──────────────┐
// │   Shield     │
// │  Guardian    │
// │ Secure...    │
// │  Score: 87   │ ← No badge
// │  [Primary]   │
// └──────────────┘
```

**State 4: Error**
```typescript
<FeatureCard
  isLoading={false}
  previewValue={null}  // or "—"
  error="Failed to load"
  isDemo={false}
/>

// Renders:
// ┌──────────────┐
// │   Shield     │
// │  Guardian    │
// │ Secure...    │
// │  Score: —    │ ← Placeholder
// │   [Retry]    │ ← Can click retry
// └──────────────┘
```

## Data Models

### HomeMetrics Interface

```typescript
interface HomeMetrics {
  // Guardian metrics
  guardianScore: number;              // 0-100, user's current Guardian score
  
  // Hunter metrics
  hunterOpportunities: number;        // Count of available opportunities
  hunterAvgApy: number;               // Average APY across opportunities
  hunterConfidence: number;           // 0-100, confidence score
  
  // HarvestPro metrics
  harvestEstimateUsd: number;         // Estimated tax benefit in USD
  harvestEligibleTokens: number;      // Count of eligible tokens
  harvestGasEfficiency: string;       // "High" | "Medium" | "Low"
  
  // Trust metrics
  totalWalletsProtected: number;      // Platform-wide count
  totalYieldOptimizedUsd: number;     // Platform-wide total
  averageGuardianScore: number;       // Platform-wide average
  
  // Metadata
  lastUpdated: string;                // ISO 8601 timestamp
  isDemo: boolean;                    // Flag indicating demo mode
  demoMode: boolean;                  // Alias for isDemo (for clarity)
}
```

### API Response Format

```typescript
interface HomeMetricsResponse {
  data: HomeMetrics;
  ts: string;  // ISO 8601 UTC timestamp
}

interface HomeMetricsError {
  error: {
    code: string;
    message: string;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Feature Card Completeness
*For any* feature card rendered on the home screen, the card must contain all required elements: icon, title, tagline, preview metric, and action buttons.
**Validates: Requirements 2.2**

### Property 2: Navigation Route Mapping
*For any* feature card primary button click, the system must navigate to the correct feature route (Guardian → /guardian, Hunter → /hunter, HarvestPro → /harvestpro).
**Validates: Requirements 3.2**

### Property 3: Demo Availability
*For any* feature card with a secondary button, clicking that button must trigger a demo or preview display.
**Validates: Requirements 3.3**

### Property 4: Keyboard Accessibility
*For all* interactive buttons on the home screen, each button must be keyboard-focusable and display a visible focus state.
**Validates: Requirements 3.4**

### Property 5: Graceful Degradation
*For any* API failure (metrics, trust stats, or feature data), the system must display fallback values without breaking the layout or throwing errors.
**Validates: Requirements 4.5, 7.4**

### Property 6: Footer Navigation Mapping
*For any* footer navigation icon click, the system must navigate to the corresponding route based on the icon (Guardian → /guardian, Hunter → /hunter, HarvestPro → /harvestpro, Settings → /settings).
**Validates: Requirements 6.2**

### Property 7: Active Route Highlighting
*For any* current route, the corresponding footer navigation item must be highlighted with cyan color to indicate active state.
**Validates: Requirements 6.3**

### Property 8: Touch Target Compliance
*For all* footer navigation icons, the touch target height must be at least 44px to meet mobile accessibility standards.
**Validates: Requirements 6.5**

### Property 9: Data Freshness
*For any* metrics response from /api/home-metrics, the lastUpdated timestamp must be less than 5 minutes old from the current time.
**Validates: Requirements 7.2**

### Property 10: Link Validity
*For all* links rendered on the home screen, each link must point to a valid, defined route within the application.
**Validates: Requirements 7.5**

### Property 11: ARIA Label Completeness
*For all* interactive elements on the home screen, each element must have a proper ARIA label or accessible name.
**Validates: Requirements 8.1**

### Property 12: Contrast Compliance
*For all* text elements displayed on the home screen, the contrast ratio between text and background must meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text).
**Validates: Requirements 1.4, 8.3**

### Property 13: Motion Preference Respect
*For any* animation on the home screen, when the user's prefers-reduced-motion setting is enabled, animations must be disabled or reduced to minimal motion.
**Validates: Requirements 8.4**



## Error Handling

### API Failures

**Scenario**: /api/home-metrics endpoint fails or times out

**Handling**:
1. Display fallback values for all metrics
2. Show subtle indicator that data is stale
3. Retry with exponential backoff (1s, 2s, 4s)
4. Log error to monitoring service
5. Maintain functional UI without breaking layout

**Fallback Values**:
```typescript
const FALLBACK_METRICS: HomeMetrics = {
  guardianScore: 0,
  hunterOpportunities: 0,
  hunterAvgApy: 0,
  hunterConfidence: 0,
  harvestEstimateUsd: 0,
  harvestEligibleTokens: 0,
  harvestGasEfficiency: 'Unknown',
  totalWalletsProtected: 10000,
  totalYieldOptimizedUsd: 5000000,
  averageGuardianScore: 85,
  lastUpdated: new Date().toISOString()
};
```

### Navigation Failures

**Scenario**: Route navigation fails or route doesn't exist

**Handling**:
1. Catch navigation errors
2. Display toast notification: "Navigation failed. Please try again."
3. Log error with route details
4. Remain on current page
5. Ensure all links are validated at build time

### Component Errors

**Scenario**: React component throws error during render

**Handling**:
1. Implement Error Boundary around each major section
2. Display fallback UI for failed section
3. Allow other sections to render normally
4. Log error with component stack trace
5. Provide "Retry" button to attempt re-render

### Accessibility Failures

**Scenario**: ARIA labels missing or contrast ratios insufficient

**Handling**:
1. Validate ARIA labels at build time with eslint-plugin-jsx-a11y
2. Test contrast ratios in CI with axe-core
3. Fail build if accessibility violations detected
4. Provide clear error messages for developers
5. Document accessibility requirements in component README

## Testing Strategy

### Unit Tests

**Framework**: Vitest

**Coverage**:
- Component rendering with various props
- Button click handlers and navigation
- Fallback value display on error states
- ARIA label presence
- Contrast ratio calculations

**Example Tests**:
```typescript
describe('FeatureCard', () => {
  test('renders all required elements', () => {
    const { getByText, getByRole } = render(
      <FeatureCard
        feature="guardian"
        icon={Shield}
        title="Guardian"
        tagline="Secure your wallet"
        previewLabel="Guardian Score"
        previewValue={89}
        previewDescription="Your security rating"
        primaryRoute="/guardian"
      />
    );
    
    expect(getByText('Guardian')).toBeInTheDocument();
    expect(getByText('Secure your wallet')).toBeInTheDocument();
    expect(getByText('89')).toBeInTheDocument();
    expect(getByRole('button')).toBeInTheDocument();
  });
  
  test('navigates to correct route on primary button click', () => {
    const mockNavigate = vi.fn();
    const { getByRole } = render(
      <FeatureCard {...props} />
    );
    
    fireEvent.click(getByRole('button', { name: /view guardian/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/guardian');
  });
});
```

### Property-Based Tests

**Framework**: fast-check

**Properties to Test**:
1. Feature Card Completeness (Property 1)
2. Navigation Route Mapping (Property 2, 6)
3. Keyboard Accessibility (Property 4)
4. Graceful Degradation (Property 5)
5. Touch Target Compliance (Property 8)
6. Data Freshness (Property 9)
7. Link Validity (Property 10)
8. ARIA Label Completeness (Property 11)
9. Contrast Compliance (Property 12)

**Example Property Test**:
```typescript
import * as fc from 'fast-check';

describe('Property: Navigation Route Mapping', () => {
  test('all feature cards navigate to correct routes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('guardian', 'hunter', 'harvestpro'),
        (feature) => {
          const expectedRoute = `/${feature}`;
          const card = renderFeatureCard(feature);
          const route = card.getPrimaryButtonRoute();
          
          expect(route).toBe(expectedRoute);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property: Contrast Compliance', () => {
  test('all text meets WCAG AA contrast standards', () => {
    fc.assert(
      fc.property(
        fc.record({
          textColor: fc.hexaString({ minLength: 6, maxLength: 6 }),
          backgroundColor: fc.hexaString({ minLength: 6, maxLength: 6 }),
          fontSize: fc.integer({ min: 12, max: 48 })
        }),
        ({ textColor, backgroundColor, fontSize }) => {
          const ratio = calculateContrastRatio(textColor, backgroundColor);
          const isLargeText = fontSize >= 18;
          const minRatio = isLargeText ? 3 : 4.5;
          
          // If we use these colors in production, they must meet standards
          if (isUsedInProduction(textColor, backgroundColor)) {
            expect(ratio).toBeGreaterThanOrEqual(minRatio);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Tests

**Framework**: Playwright

**Scenarios**:
1. Full page load with metrics fetching
2. Navigation flow through all CTAs
3. Error state handling (API failures)
4. Responsive layout at different breakpoints
5. Keyboard navigation through all interactive elements

**Example Integration Test**:
```typescript
test('complete home screen user journey', async ({ page }) => {
  // Navigate to home
  await page.goto('/');
  
  // Verify hero section loads
  await expect(page.locator('h1')).toContainText('Master Your DeFi Risk & Yield');
  
  // Verify feature cards load with metrics
  await expect(page.locator('[data-testid="guardian-card"]')).toBeVisible();
  await expect(page.locator('[data-testid="guardian-score"]')).toContainText(/\d+/);
  
  // Click Guardian card
  await page.click('[data-testid="guardian-card-primary-btn"]');
  await expect(page).toHaveURL('/guardian');
  
  // Navigate back
  await page.goBack();
  
  // Test footer navigation
  await page.click('[data-testid="footer-nav-hunter"]');
  await expect(page).toHaveURL('/hunter');
});
```

### E2E Tests

**Framework**: Playwright

**Critical Flows**:
1. First-time visitor → Onboarding → Feature usage
2. Returning user → Direct feature access
3. Mobile user → Touch navigation
4. Keyboard-only user → Full navigation

### Accessibility Tests

**Framework**: axe-core + Playwright

**Checks**:
- ARIA labels on all interactive elements
- Contrast ratios meet WCAG AA
- Keyboard navigation order is logical
- Focus indicators are visible
- Touch targets meet minimum size
- Screen reader compatibility

**Example Accessibility Test**:
```typescript
test('home screen meets WCAG AA standards', async ({ page }) => {
  await page.goto('/');
  
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  
  expect(results.violations).toHaveLength(0);
});
```

## Performance Considerations

### Initial Load Optimization

1. **Critical CSS**: Inline critical styles for above-the-fold content
2. **Code Splitting**: Lazy load non-critical components (animations, demos)
3. **Image Optimization**: Use Next.js Image component with proper sizing
4. **Font Loading**: Use font-display: swap for web fonts
5. **Prefetching**: Prefetch feature routes on card hover

### Data Fetching Strategy

1. **React Query**: Cache metrics for 5 minutes
2. **Stale-While-Revalidate**: Show cached data while fetching fresh data
3. **Parallel Requests**: Fetch all metrics concurrently
4. **Request Deduplication**: Prevent duplicate API calls
5. **Optimistic Updates**: Show loading states immediately

### Bundle Size

- Target: < 200KB initial bundle (gzipped)
- Lazy load: Framer Motion animations
- Tree shake: Remove unused Lucide icons
- Minimize: Tailwind CSS with PurgeCSS

### Metrics

- **Time to First Byte (TTFB)**: < 600ms
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.0s
- **Cumulative Layout Shift (CLS)**: < 0.1

## Security Considerations

### Data Exposure

- **Public Metrics**: Trust stats are public (no user-specific data)
- **User Metrics**: Guardian score, Hunter opportunities, HarvestPro estimates require authentication
- **API Keys**: Never expose API keys in client-side code
- **Rate Limiting**: Implement rate limiting on /api/home-metrics (60 req/min per IP)

### XSS Prevention

- **React**: Automatic escaping of user content
- **Sanitization**: Sanitize any dynamic content from API
- **CSP Headers**: Implement Content Security Policy
- **HTTPS Only**: Enforce HTTPS in production

### Authentication

- **Optional Auth**: Home screen accessible without login
- **Conditional Content**: Show personalized metrics only when authenticated
- **Session Management**: Use Supabase Auth for session handling
- **Token Refresh**: Automatic token refresh for authenticated users

## Deployment Considerations

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional (for enhanced features)
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### Build Process

1. Run TypeScript type checking
2. Run ESLint with accessibility rules
3. Run unit tests (Vitest)
4. Run property tests (fast-check)
5. Build Next.js production bundle
6. Run Lighthouse CI for performance/accessibility
7. Deploy to Vercel/hosting platform

### Monitoring

- **Error Tracking**: Sentry for runtime errors
- **Performance**: Vercel Analytics or Google Analytics
- **Uptime**: Pingdom or UptimeRobot for /api/home-metrics
- **User Behavior**: PostHog or Mixpanel for feature usage

### Rollback Strategy

1. Keep previous deployment active
2. Monitor error rates for 15 minutes post-deploy
3. If error rate > 5%, automatic rollback
4. Manual rollback available via Vercel dashboard
5. Feature flags for gradual rollout of new features

## Future Enhancements

### Phase 2: Personalization

- User-specific recommendations based on wallet activity
- Customizable dashboard layout
- Saved preferences for metric display
- Notification preferences

### Phase 3: Advanced Analytics

- Historical trend charts for metrics
- Comparative analysis (user vs. platform average)
- Predictive insights for opportunities
- Custom alerts and notifications

### Phase 4: Social Features

- Share achievements on social media
- Referral program integration
- Community leaderboards
- User testimonials and reviews

### Phase 5: Mobile App

- Native iOS/Android apps
- Push notifications
- Biometric authentication
- Offline mode with sync
