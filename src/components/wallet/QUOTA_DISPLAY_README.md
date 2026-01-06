# Wallet Quota Display Feature

## Overview

The Wallet Quota Display feature provides users with a clear, visual representation of their wallet quota usage. It displays:
- **Used Addresses**: Number of unique wallet addresses (case-insensitive)
- **Used Rows**: Total number of wallet rows (address + network combinations)
- **Total Quota**: Maximum quota limit for the user's plan
- **Plan**: User's current plan (free, pro, enterprise)

## Requirement

**Requirement 7.7**: The UI SHALL display quota usage (used_addresses, used_rows, total)

## Components

### 1. QuotaDisplay Component
**File**: `src/components/wallet/QuotaDisplay.tsx`

The core component that renders the quota information with visual indicators.

**Props**:
```typescript
interface QuotaDisplayProps {
  usedAddresses: number      // Number of unique addresses used
  usedRows: number           // Total number of wallet rows
  total: number              // Total quota limit
  plan: string               // User's plan (free, pro, enterprise)
  className?: string         // Optional CSS class
  onQuotaReached?: () => void // Callback when quota is reached
}
```

**Features**:
- Progress bar showing quota usage percentage
- Color-coded indicators (green → yellow → red)
- Warning alerts when quota is nearly full (80%+)
- Error alert when quota is reached (100%)
- Responsive design for mobile and desktop

### 2. WalletQuotaSection Component
**File**: `src/components/wallet/WalletQuotaSection.tsx`

A wrapper component that integrates the `QuotaDisplay` with the `useWalletQuota` hook.

**Props**:
```typescript
interface WalletQuotaSectionProps {
  className?: string         // Optional CSS class
  onQuotaReached?: () => void // Callback when quota is reached
  showSkeleton?: boolean      // Show loading skeleton (default: true)
}
```

**Features**:
- Automatic data fetching from the server
- Loading skeleton while fetching
- Error state display
- Responsive loading and error states

### 3. useWalletQuota Hook
**File**: `src/hooks/useWalletQuota.ts`

A React Query hook that fetches quota information from the wallets-list Edge Function.

**Returns**:
```typescript
interface UseWalletQuotaResult {
  quota: WalletQuotaData | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<any>
}
```

**Features**:
- Automatic caching with React Query
- 1-minute stale time
- 5-minute refetch interval
- Error handling
- Manual refetch capability

## Usage

### Basic Usage

```tsx
import { WalletQuotaSection } from '@/components/wallet/WalletQuotaSection'

export function MyPage() {
  return (
    <div>
      <h1>Wallet Management</h1>
      <WalletQuotaSection />
    </div>
  )
}
```

### With Callback

```tsx
import { WalletQuotaSection } from '@/components/wallet/WalletQuotaSection'

export function MyPage() {
  const handleQuotaReached = () => {
    // Show upgrade modal or notification
    console.log('User has reached their quota limit')
  }

  return (
    <div>
      <h1>Wallet Management</h1>
      <WalletQuotaSection onQuotaReached={handleQuotaReached} />
    </div>
  )
}
```

### With Custom Styling

```tsx
import { WalletQuotaSection } from '@/components/wallet/WalletQuotaSection'

export function MyPage() {
  return (
    <div>
      <h1>Wallet Management</h1>
      <WalletQuotaSection className="bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
    </div>
  )
}
```

### Direct QuotaDisplay Usage

```tsx
import { QuotaDisplay } from '@/components/wallet/QuotaDisplay'

export function MyPage() {
  return (
    <div>
      <QuotaDisplay
        usedAddresses={2}
        usedRows={4}
        total={5}
        plan="free"
        onQuotaReached={() => console.log('Quota reached')}
      />
    </div>
  )
}
```

## Quota Semantics

### Unique Address Counting
- Quota counts **unique wallet addresses** (case-insensitive), not rows
- Example: Adding address `0xabc` on Ethereum + Polygon = **1 quota unit** (not 2)
- Example: Adding address `0xdef` on Ethereum = **2 quota units** (new address)

### Plan-Based Limits
- **Free Plan**: 5 unique addresses
- **Pro Plan**: 20 unique addresses
- **Enterprise Plan**: 1000 unique addresses

### Adding Wallets
- Adding a **new address** checks quota before insertion
- Adding an **existing address** on a new network does NOT consume quota
- Returns 409 QUOTA_EXCEEDED when limit is reached

## Data Flow

```
User Component
    ↓
WalletQuotaSection (wrapper)
    ↓
useWalletQuota (hook)
    ↓
React Query (caching)
    ↓
Edge Function: GET /functions/v1/wallets-list
    ↓
Supabase Database
    ↓
Returns: { wallets, quota, active_hint }
    ↓
QuotaDisplay (renders)
```

## Visual States

### Normal State (Under Quota)
- Green progress bar
- Shows remaining quota
- No alerts

### Warning State (80%+ Used)
- Yellow/orange progress bar
- Shows warning alert
- Suggests upgrading plan

### Error State (100% Used)
- Red progress bar
- Shows error alert
- Prevents adding new addresses

### Loading State
- Skeleton loader
- Animated pulse effect
- Shows while fetching data

### Error State (Fetch Failed)
- Error message displayed
- Shows error details
- Allows retry

## Testing

### Unit Tests
**File**: `src/lib/__tests__/quota.test.ts`

Tests the quota calculation logic:
- Unique address counting (case-insensitive)
- Quota limit retrieval
- Quota enforcement
- Address existence checking

### Hook Tests
**File**: `src/hooks/__tests__/useWalletQuota.test.tsx`

Tests the useWalletQuota hook:
- Successful data fetching
- Error handling
- Authorization header inclusion
- Refetch functionality

### Component Tests
**File**: `src/components/wallet/__tests__/WalletQuotaSection.test.tsx`

Tests the WalletQuotaSection component:
- Loading skeleton rendering
- Quota display rendering
- Error state display
- Callback invocation
- Custom styling

## Performance

- **Stale Time**: 1 minute (data is considered fresh for 1 minute)
- **Refetch Interval**: 5 minutes (automatically refetch every 5 minutes)
- **Caching**: React Query handles automatic caching
- **Network**: Only fetches when component mounts or session changes

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- High contrast colors (WCAG AA compliant)
- Semantic HTML structure
- Clear error messages

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Integration Points

### Guardian Page
```tsx
import { WalletQuotaSection } from '@/components/wallet/WalletQuotaSection'

export function GuardianPage() {
  return (
    <div>
      <h1>Guardian</h1>
      <WalletQuotaSection />
      {/* Rest of Guardian UI */}
    </div>
  )
}
```

### Wallet Management Modal
```tsx
import { WalletQuotaSection } from '@/components/wallet/WalletQuotaSection'

export function AddWalletModal() {
  return (
    <div>
      <h2>Add Wallet</h2>
      <WalletQuotaSection />
      {/* Add wallet form */}
    </div>
  )
}
```

### Settings Page
```tsx
import { WalletQuotaSection } from '@/components/wallet/WalletQuotaSection'

export function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <section>
        <h2>Wallet Quota</h2>
        <WalletQuotaSection />
      </section>
    </div>
  )
}
```

## Troubleshooting

### Quota Not Updating
- Check that the user is authenticated
- Verify the Edge Function is deployed
- Check browser console for errors
- Try manual refetch: `refetch()`

### Incorrect Quota Count
- Verify addresses are being normalized to lowercase
- Check that unique address counting is working
- Review database for duplicate addresses

### Loading State Stuck
- Check network tab for failed requests
- Verify authorization header is correct
- Check Edge Function logs

## Future Enhancements

- [ ] Quota upgrade flow
- [ ] Plan comparison modal
- [ ] Quota usage analytics
- [ ] Quota alerts/notifications
- [ ] Bulk wallet import with quota check
- [ ] Quota history/timeline

## Related Files

- `src/lib/quota.ts` - Quota calculation utilities
- `src/lib/__tests__/quota.test.ts` - Quota tests
- `supabase/functions/wallets-list/index.ts` - Edge Function
- `src/hooks/useWalletQuota.ts` - React Query hook
- `src/components/wallet/QuotaDisplay.tsx` - Core component
- `src/components/wallet/WalletQuotaSection.tsx` - Wrapper component

