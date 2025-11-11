# OpportunityCard Migration Guide

## Overview

The OpportunityCard component has been refactored to match the spec requirements. This guide helps migrate existing code to use the new component.

## Breaking Changes

### 1. Props Interface

**Old Props:**
```typescript
interface OpportunityCardProps {
  opportunity: Opportunity; // Old type
  index: number;
  onJoinQuest: (opportunity: Opportunity) => void;
  isDarkTheme?: boolean;
}
```

**New Props:**
```typescript
interface OpportunityCardProps {
  opportunity: Opportunity; // New type from src/types/hunter.ts
  onSave: (id: string) => void;
  onShare: (id: string) => void;
  onReport: (id: string) => void;
  onCTAClick: (id: string, action: CTAAction) => void;
  isConnected: boolean;
  userWallet?: string;
}
```

### 2. Opportunity Type

**Old Type (src/pages/Hunter.tsx):**
```typescript
interface Opportunity {
  id: string;
  type: 'Airdrop' | 'Staking' | 'NFT' | 'Quest';
  title: string;
  description: string;
  reward: string;
  confidence: number;
  duration: string;
  guardianScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  chain?: string;
  protocol?: string;
  estimatedAPY?: number;
}
```

**New Type (src/types/hunter.ts):**
```typescript
interface Opportunity {
  id: string;
  slug: string;
  title: string;
  description?: string;
  protocol: Protocol;
  type: OpportunityType;
  chains: Chain[];
  reward: Reward;
  apr?: number;
  trust: Trust;
  urgency?: UrgencyType;
  difficulty: DifficultyLevel;
  eligibility_preview?: EligibilityPreview;
  featured: boolean;
  sponsored: boolean;
  time_left_sec?: number;
  external_url?: string;
  badges: Badge[];
  status: OpportunityStatus;
  created_at: string;
  updated_at: string;
  published_at?: string;
  expires_at?: string;
}
```

## Migration Steps for Hunter Page

### Step 1: Update Imports

```typescript
// Remove old local type
// interface Opportunity { ... }

// Import new types
import type { Opportunity, CTAAction } from '@/types/hunter';
import { useAuth } from '@/hooks/useAuth';
```

### Step 2: Update useHunterFeed Hook

The `useHunterFeed` hook should return opportunities in the new format. If it doesn't, update it to fetch from `/api/hunter/opportunities` which returns the correct format.

### Step 3: Implement Action Handlers

```typescript
const { user, isAuthenticated } = useAuth();
const { address: walletAddress } = useAccount(); // from wagmi

const handleSave = (id: string) => {
  // Implement save logic or use useSavedOpportunities hook
  console.log('Save opportunity:', id);
};

const handleShare = (id: string) => {
  // Implement share logic
  console.log('Share opportunity:', id);
};

const handleReport = (id: string) => {
  // Implement report logic
  console.log('Report opportunity:', id);
};

const handleCTAClick = (id: string, action: CTAAction) => {
  // Handle CTA based on action type
  switch (action) {
    case 'claim':
      // Navigate to claim page
      break;
    case 'start_quest':
      // Open quest modal
      break;
    case 'stake':
      // Navigate to staking page
      break;
    case 'view':
      // Navigate to details page
      break;
  }
};
```

### Step 4: Update OpportunityCard Usage

**Old Usage:**
```tsx
<OpportunityCard
  opportunity={opportunity}
  index={index}
  onJoinQuest={handleJoinQuest}
  isDarkTheme={isDarkTheme}
/>
```

**New Usage:**
```tsx
<OpportunityCard
  opportunity={opportunity}
  onSave={handleSave}
  onShare={handleShare}
  onReport={handleReport}
  onCTAClick={handleCTAClick}
  isConnected={isAuthenticated}
  userWallet={walletAddress}
/>
```

### Step 5: Remove Unused Props

- Remove `index` prop (animation handled internally)
- Remove `isDarkTheme` prop (uses Tailwind dark mode)
- Remove `onJoinQuest` prop (replaced by `onCTAClick`)

## Data Transformation

If you need to transform old data to new format temporarily:

```typescript
function transformOldToNew(oldOpp: OldOpportunity): Opportunity {
  return {
    id: oldOpp.id,
    slug: oldOpp.title.toLowerCase().replace(/\s+/g, '-'),
    title: oldOpp.title,
    description: oldOpp.description,
    protocol: {
      name: oldOpp.protocol || 'Unknown',
      logo: 'https://via.placeholder.com/40',
    },
    type: oldOpp.type.toLowerCase() as OpportunityType,
    chains: oldOpp.chain ? [oldOpp.chain.toLowerCase() as Chain] : [],
    reward: {
      min: parseFloat(oldOpp.reward) || 0,
      max: parseFloat(oldOpp.reward) || 0,
      currency: 'USD',
      confidence: 'estimated',
    },
    trust: {
      score: oldOpp.guardianScore,
      level: oldOpp.riskLevel === 'Low' ? 'green' : oldOpp.riskLevel === 'Medium' ? 'amber' : 'red',
      last_scanned_ts: new Date().toISOString(),
    },
    difficulty: 'easy',
    featured: false,
    sponsored: false,
    badges: [],
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
```

## Testing

After migration, test:
1. Card renders correctly with all elements
2. Action buttons work (save, share, report)
3. CTA button triggers correct action
4. Eligibility preview shows when wallet connected
5. Guardian trust chip displays correctly
6. Reward formatting is correct
7. Badges display properly

## Rollback Plan

If issues occur, the old OpportunityCard is backed up at:
- `src/components/hunter/OpportunityCard.old.tsx` (if created)

Or revert the commit that introduced the refactored component.

## Support

For questions or issues, refer to:
- `.kiro/specs/hunter-screen-feed/TASK_30A_COMPLETION.md`
- `src/components/hunter/README.md`
- `src/types/hunter.ts` for type definitions
