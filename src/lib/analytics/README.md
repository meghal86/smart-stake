# Analytics Module

Privacy-focused analytics tracking for the Hunter Screen using PostHog.

## Features

- ✅ Cookie consent management with DNT (Do Not Track) support
- ✅ Wallet address hashing with per-session salt
- ✅ Event sampling (0.1% for impressions, 100% for clicks)
- ✅ Automatic sanitization to prevent plain wallet addresses in logs
- ✅ React hooks for easy integration
- ✅ TypeScript types for all events

## Requirements

Implements requirements 10.1-10.14 from the Hunter Screen specification:
- Track feed_view, filter_change, card_impression, card_click, save, report, cta_click, scroll_depth events
- Hash wallet identifiers with per-session salt
- Respect cookie consent gates and DNT header
- Never log wallet addresses in plain text

## Setup

### 1. Install Dependencies

```bash
npm install posthog-js
```

### 2. Initialize Analytics

Add to your app initialization (e.g., `App.tsx` or `_app.tsx`):

```typescript
import { analytics } from '@/lib/analytics';

// Initialize on app load
analytics.initialize({
  enabled: true,
  apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  apiHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  debug: process.env.NODE_ENV === 'development',
  respectDNT: true,
  sessionReplay: false,
  capturePageview: false,
});
```

### 3. Environment Variables

Add to `.env`:

```bash
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## Usage

### Using React Hooks (Recommended)

```typescript
import {
  useFeedViewTracking,
  useFilterChangeTracking,
  useCardClickTracking,
  useSaveTracking,
  useScrollDepthTracking,
} from '@/lib/analytics';

function HunterScreen() {
  const walletAddress = useWallet();
  
  // Track feed view on mount
  useFeedViewTracking({
    tab: 'all',
    hasWallet: !!walletAddress,
    filterCount: 3,
    walletAddress,
  });
  
  // Track scroll depth
  useScrollDepthTracking(walletAddress);
  
  // Track filter changes
  const trackFilter = useFilterChangeTracking(walletAddress);
  
  const handleFilterChange = (type: string, value: any) => {
    trackFilter(type, value, activeFilters);
  };
  
  // Track card clicks
  const trackClick = useCardClickTracking(walletAddress);
  
  const handleCardClick = (opportunity) => {
    trackClick({
      opportunityId: opportunity.id,
      opportunityType: opportunity.type,
      trustLevel: opportunity.trust.level,
      position: index,
      isSponsored: opportunity.sponsored,
      isFeatured: opportunity.featured,
    });
  };
  
  return <div>...</div>;
}
```

### Using Tracker Functions Directly

```typescript
import {
  trackFeedView,
  trackCardClick,
  trackSave,
  trackCTAClick,
} from '@/lib/analytics';

// Track feed view
await trackFeedView({
  tab: 'airdrops',
  hasWallet: true,
  filterCount: 2,
  walletAddress: '0x...',
});

// Track card click
await trackCardClick({
  opportunityId: 'opp_123',
  opportunityType: 'airdrop',
  trustLevel: 'green',
  position: 0,
  isSponsored: false,
  isFeatured: true,
  walletAddress: '0x...',
});

// Track save action
await trackSave({
  opportunityId: 'opp_123',
  opportunityType: 'airdrop',
  action: 'save',
  walletAddress: '0x...',
});
```

### Card Impression Tracking with Intersection Observer

```typescript
import { useCardImpressionTracking } from '@/lib/analytics';

function OpportunityCard({ opportunity, position, walletAddress }) {
  const cardRef = useCardImpressionTracking({
    opportunityId: opportunity.id,
    opportunityType: opportunity.type,
    trustLevel: opportunity.trust.level,
    position,
    isSponsored: opportunity.sponsored,
    isFeatured: opportunity.featured,
    walletAddress,
  });
  
  return (
    <div ref={cardRef}>
      {/* Card content */}
    </div>
  );
}
```

## Consent Management

### Check Consent Status

```typescript
import { isAnalyticsAllowed, getConsent } from '@/lib/analytics';

if (isAnalyticsAllowed()) {
  // Analytics is allowed
}

const consent = getConsent();
// Returns: { analytics: boolean, marketing: boolean, functional: boolean } | null
```

### Set Consent

```typescript
import { setConsent } from '@/lib/analytics';

setConsent({
  analytics: true,
  marketing: false,
  functional: true,
});
```

### Consent Banner Component

```typescript
import { useState, useEffect } from 'react';
import { shouldShowConsentBanner, setConsent, analytics } from '@/lib/analytics';

function ConsentBanner() {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    setShow(shouldShowConsentBanner());
  }, []);
  
  const handleAccept = () => {
    setConsent({ analytics: true, marketing: false, functional: true });
    analytics.optIn();
    setShow(false);
  };
  
  const handleDecline = () => {
    setConsent({ analytics: false, marketing: false, functional: false });
    analytics.optOut();
    setShow(false);
  };
  
  if (!show) return null;
  
  return (
    <div className="consent-banner">
      <p>We use analytics to improve your experience.</p>
      <button onClick={handleAccept}>Accept</button>
      <button onClick={handleDecline}>Decline</button>
    </div>
  );
}
```

## Privacy & Security

### Wallet Address Hashing

All wallet addresses are automatically hashed with a per-session salt before being sent to analytics:

```typescript
import { hashWalletAddress } from '@/lib/analytics';

const hash = await hashWalletAddress('0x1234...');
// Returns: 'a3f5b2c1...' (SHA-256 hash with session salt)
```

### Automatic Sanitization

All event properties are automatically sanitized to prevent plain wallet addresses:

```typescript
import { sanitizeEventProperties } from '@/lib/analytics';

const sanitized = sanitizeEventProperties({
  userId: '0x1234...', // Will be redacted
  opportunityId: 'opp_123', // Safe
});
// Returns: { userId: '[REDACTED]', opportunityId: 'opp_123' }
```

### DNT (Do Not Track) Support

Analytics automatically respects the browser's Do Not Track setting:

```typescript
// If navigator.doNotTrack === '1', analytics will not initialize
```

## Event Types

### Feed View Event
```typescript
{
  event: 'feed_view',
  properties: {
    tab: 'airdrops',
    has_wallet: true,
    filter_count: 3,
  }
}
```

### Filter Change Event
```typescript
{
  event: 'filter_change',
  properties: {
    filter_type: 'chains',
    filter_value: ['ethereum', 'base'],
    active_filters: { ... },
  }
}
```

### Card Impression Event (0.1% sampling)
```typescript
{
  event: 'card_impression',
  properties: {
    opportunity_id: 'opp_123',
    opportunity_type: 'airdrop',
    trust_level: 'green',
    position: 0,
    is_sponsored: false,
    is_featured: true,
  }
}
```

### Card Click Event (100% sampling)
```typescript
{
  event: 'card_click',
  properties: {
    opportunity_id: 'opp_123',
    opportunity_type: 'airdrop',
    trust_level: 'green',
    position: 0,
    is_sponsored: false,
    is_featured: true,
  }
}
```

### Save Event
```typescript
{
  event: 'save',
  properties: {
    opportunity_id: 'opp_123',
    opportunity_type: 'airdrop',
    action: 'save', // or 'unsave'
  }
}
```

### Report Event
```typescript
{
  event: 'report',
  properties: {
    opportunity_id: 'opp_123',
    report_category: 'phishing',
  }
}
```

### CTA Click Event
```typescript
{
  event: 'cta_click',
  properties: {
    opportunity_id: 'opp_123',
    opportunity_type: 'airdrop',
    cta_action: 'claim',
    trust_level: 'green',
  }
}
```

### Scroll Depth Event
```typescript
{
  event: 'scroll_depth',
  properties: {
    depth_percent: 50, // 25, 50, 75, or 100
    page_height: 3000,
    viewport_height: 800,
  }
}
```

## Testing

### Unit Tests

```bash
npm test src/lib/analytics
```

### Test Wallet Address Sanitization

```typescript
import { isPlainWalletAddress, sanitizeEventProperties } from '@/lib/analytics';

// Test detection
expect(isPlainWalletAddress('0x1234567890123456789012345678901234567890')).toBe(true);
expect(isPlainWalletAddress('hashed_value')).toBe(false);

// Test sanitization
const result = sanitizeEventProperties({
  wallet: '0x1234567890123456789012345678901234567890',
  id: 'opp_123',
});
expect(result.wallet).toBe('[REDACTED]');
expect(result.id).toBe('opp_123');
```

## Debugging

Enable debug mode to see analytics events in the console:

```typescript
analytics.initialize({
  enabled: true,
  apiKey: 'your_key',
  debug: true, // Enable debug logging
});
```

## Best Practices

1. **Always pass wallet address through tracking functions** - Never log it directly
2. **Use hooks in components** - Easier to manage and test
3. **Respect user consent** - Check consent before tracking
4. **Test sanitization** - Ensure no plain addresses in logs
5. **Use sampling for high-volume events** - Card impressions use 0.1% sampling
6. **Track meaningful events** - Focus on user actions and conversions

## Troubleshooting

### Analytics not tracking

1. Check if consent is given: `isAnalyticsAllowed()`
2. Check if DNT is enabled: `navigator.doNotTrack`
3. Check if API key is set: `process.env.NEXT_PUBLIC_POSTHOG_KEY`
4. Enable debug mode to see console logs

### Wallet addresses in logs

This should never happen. If you see plain wallet addresses:
1. Check the sanitization function is working
2. Verify hashing is applied before tracking
3. Run tests to ensure no regression

## Related Files

- `src/lib/analytics/client.ts` - PostHog client wrapper
- `src/lib/analytics/tracker.ts` - Event tracking functions
- `src/lib/analytics/hooks.ts` - React hooks
- `src/lib/analytics/consent.ts` - Consent management
- `src/lib/analytics/hash.ts` - Wallet hashing utilities
- `src/lib/analytics/types.ts` - TypeScript types
