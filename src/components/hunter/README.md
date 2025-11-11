# Hunter Screen Components

This directory contains all components for the AlphaWhale Hunter Screen (Feed) feature.

## Core Components

### OpportunityCard
**File:** `OpportunityCard.tsx`

The main card component that displays opportunity information with Guardian trust, rewards, eligibility, and actions.

**Props:**
```typescript
interface OpportunityCardProps {
  opportunity: Opportunity;
  onSave: (id: string) => void;
  onShare: (id: string) => void;
  onReport: (id: string) => void;
  onCTAClick: (id: string, action: CTAAction) => void;
  isConnected: boolean;
  userWallet?: string;
}
```

**Usage:**
```tsx
<OpportunityCard
  opportunity={opportunity}
  onSave={handleSave}
  onShare={handleShare}
  onReport={handleReport}
  onCTAClick={handleCTAClick}
  isConnected={isWalletConnected}
  userWallet={walletAddress}
/>
```

### GuardianTrustChip
**File:** `GuardianTrustChip.tsx`

Displays Guardian trust score with color-coded chip and interactive tooltip.

**Props:**
```typescript
interface GuardianTrustChipProps {
  score: number;
  level: TrustLevel;
  lastScannedTs: string;
  issues?: string[];
  onClick?: () => void;
  className?: string;
}
```

**Features:**
- Color-coded trust levels (green ≥80, amber 60-79, red <60)
- Text labels for accessibility
- Tooltip with top 3 issues
- Time ago display
- Click handler for full report

### RewardDisplay
**File:** `RewardDisplay.tsx`

Displays reward information with proper formatting and confidence level.

**Props:**
```typescript
interface RewardDisplayProps {
  min: number;
  max: number;
  currency: RewardUnit;
  confidence: RewardConfidence;
  apr?: number;
  className?: string;
}
```

**Features:**
- Min-max range display
- Confidence badges (Confirmed/Estimated)
- APR/APY normalization
- Intl.NumberFormat for amounts
- Compact notation for large numbers
- Support for USD, APY, POINTS, NFT, TOKEN

### EligibilityPreview
**File:** `EligibilityPreview.tsx`

Shows eligibility status and reasons for wallet-connected users.

**Props:**
```typescript
interface EligibilityPreviewProps {
  status: EligibilityStatus;
  reasons: string[];
  className?: string;
}
```

**Features:**
- Status-based styling (likely/maybe/unlikely/unknown)
- Icon indicators
- 1-2 reason bullets
- Proper ARIA labels

### ProtocolLogo
**File:** `ProtocolLogo.tsx`

Displays protocol logo with fallback to initials avatar.

**Props:**
```typescript
interface ProtocolLogoProps {
  name: string;
  logo: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Features:**
- Image with error handling
- Deterministic initials avatar fallback
- AA contrast compliance
- Multiple size options

### OpportunityActions
**File:** `OpportunityActions.tsx`

Action buttons for save, share, and report functionality.

**Props:**
```typescript
interface OpportunityActionsProps {
  opportunityId: string;
  opportunityTitle: string;
  opportunitySlug: string;
  isSaved?: boolean;
  onSaveToggle?: (saved: boolean) => void;
  compact?: boolean;
}
```

**Features:**
- Save/unsave with authentication check
- Share with native API fallback to clipboard
- Report modal integration
- Compact mode for card display

### ReportModal
**File:** `ReportModal.tsx`

Modal for reporting opportunities with abuse prevention.

**Props:**
```typescript
interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId: string;
  opportunityTitle: string;
}
```

**Features:**
- Report categories (phishing, impersonation, reward not paid)
- Idempotency support
- Rate limiting
- Auto-quarantine on multiple reports

## Hooks

### useHunterFeed
**File:** `../../hooks/useHunterFeed.ts`

React Query hook for fetching and managing opportunity feed data.

**Usage:**
```tsx
const {
  data,
  isLoading,
  error,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useHunterFeed(filters);
```

### useSavedOpportunities
**File:** `../../hooks/useSavedOpportunities.ts`

Hook for managing saved opportunities.

**Usage:**
```tsx
const {
  savedOpportunities,
  isSaved,
  toggleSave,
  isLoading,
} = useSavedOpportunities();
```

## Types

All types are defined in `src/types/hunter.ts`:
- `Opportunity` - Main opportunity interface
- `OpportunityType` - Type enum (airdrop, quest, staking, etc.)
- `RewardUnit` - Currency enum (USD, APY, POINTS, etc.)
- `TrustLevel` - Trust level enum (green, amber, red)
- `EligibilityStatus` - Eligibility enum (likely, maybe, unlikely, unknown)
- `CTAAction` - CTA action enum (claim, start_quest, stake, view)

## Schemas

Zod schemas for runtime validation are in `src/schemas/hunter.ts`:
- `OpportunitySchema` - Validates opportunity data
- `OpportunitiesResponseSchema` - Validates API responses
- `FilterStateSchema` - Validates filter state

## Testing

All components have comprehensive test coverage in `src/__tests__/components/hunter/`:
- `OpportunityCard.test.tsx` - 19 test cases
- `OpportunityActions.test.tsx` - Action functionality tests

Run tests:
```bash
npm test -- src/__tests__/components/hunter/
```

## Accessibility

All components follow WCAG AA standards:
- Proper ARIA labels
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Text alternatives for visual information

## Requirements

Components implement requirements from:
- `requirements.md` - Feature requirements
- `design.md` - Technical design
- `tasks.md` - Implementation tasks

See `.kiro/specs/hunter-screen-feed/` for full documentation.
