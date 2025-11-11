# Multi-Wallet Selection Enhancement

## 🎯 Overview

**Status**: NEW REQUIREMENT  
**Priority**: HIGH  
**Impact**: Personalization & User Experience

### Problem Statement

Users can connect multiple wallets to AlphaWhale, but the Hunter Screen currently:
- ❌ Doesn't show which wallet is active
- ❌ Doesn't allow switching between connected wallets
- ❌ Doesn't personalize opportunities based on selected wallet
- ❌ Doesn't show eligibility for the correct wallet

### Proposed Solution

Add a **Wallet Selector** in the Hunter Screen header (similar to Guardian Enhanced screen) that:
- ✅ Shows all connected wallets
- ✅ Allows switching between wallets
- ✅ Personalizes feed based on selected wallet
- ✅ Shows eligibility for selected wallet
- ✅ Persists selection across sessions

---

## 📋 New Requirements

### Requirement 18: Multi-Wallet Management

**User Story:** As a DeFi user with multiple wallets, I want to select which wallet to use for Hunter Screen so that I see personalized opportunities and eligibility for the correct wallet.

#### Acceptance Criteria

1. WHEN the Hunter Screen loads AND user has connected wallets THEN a wallet selector SHALL be displayed in the header
2. WHEN the wallet selector is clicked THEN a dropdown SHALL show all connected wallets with labels and truncated addresses
3. WHEN a wallet is selected THEN it SHALL become the active wallet for the session
4. WHEN the active wallet changes THEN the feed SHALL refresh with personalized ranking for that wallet
5. WHEN the active wallet changes THEN eligibility previews SHALL update for the new wallet
6. WHEN no wallet is selected THEN the feed SHALL show default (non-personalized) opportunities
7. WHEN a wallet is selected THEN the selection SHALL persist in localStorage
8. WHEN the page reloads THEN the last selected wallet SHALL be restored if still connected
9. WHEN the wallet selector is displayed THEN it SHALL show: wallet label (if set), truncated address (0x1234...5678), and chain icon
10. WHEN hovering over a wallet in the dropdown THEN the full address SHALL be shown in a tooltip
11. WHEN a wallet is disconnected THEN it SHALL be removed from the selector and selection SHALL fall back to first available wallet
12. WHEN the active wallet is displayed THEN it SHALL have a visual indicator (checkmark or highlight)
13. WHEN switching wallets THEN a loading state SHALL be shown while feed refreshes
14. WHEN the wallet selector is on mobile THEN it SHALL be responsive and touch-friendly
15. WHEN a user has no connected wallets THEN a "Connect Wallet" button SHALL be shown instead of the selector

---

## 🎨 Design Specifications

### Header Layout

```
┌────────────────────────────────────────────────────────────┐
│  Hunter  [Search Bar]  [Wallet Selector ▼]  [Theme] [Menu] │
└────────────────────────────────────────────────────────────┘
```

### Wallet Selector Component

```typescript
interface WalletSelectorProps {
  wallets: ConnectedWallet[];
  activeWallet: string | null;
  onWalletChange: (address: string) => void;
  onConnectWallet: () => void;
}

interface ConnectedWallet {
  address: string;
  label?: string;
  chain: string;
  balance?: string;
  ens?: string;
}
```

### Visual Design

**Closed State**:
```
┌─────────────────────────────────┐
│ 🦊 My Main Wallet  0x1234...5678 ▼│
└─────────────────────────────────┘
```

**Open State**:
```
┌─────────────────────────────────┐
│ ✓ 🦊 My Main Wallet             │
│      0x1234...5678              │
├─────────────────────────────────┤
│   🔷 Trading Wallet             │
│      0xABCD...EFGH              │
├─────────────────────────────────┤
│   🟣 DeFi Wallet                │
│      0x9876...5432              │
├─────────────────────────────────┤
│ + Connect New Wallet            │
└─────────────────────────────────┘
```

### Styling

```css
/* Light Theme */
.wallet-selector {
  background: rgba(255,255,255,0.9);
  border: 1px solid rgba(229,231,235,0.5);
  border-radius: 12px;
  padding: 8px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.wallet-selector:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

/* Dark Theme */
.wallet-selector-dark {
  background: rgba(15,23,42,0.9);
  border: 1px solid rgba(148,163,184,0.2);
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
```

---

## 🔧 Technical Implementation

### 1. Wallet Context Provider

```typescript
// src/contexts/WalletContext.tsx

interface WalletContextValue {
  connectedWallets: ConnectedWallet[];
  activeWallet: string | null;
  setActiveWallet: (address: string) => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: (address: string) => Promise<void>;
}

export const WalletProvider: React.FC = ({ children }) => {
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallet[]>([]);
  const [activeWallet, setActiveWallet] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('activeWallet');
    if (saved && connectedWallets.some(w => w.address === saved)) {
      setActiveWallet(saved);
    }
  }, [connectedWallets]);

  // Save to localStorage on change
  useEffect(() => {
    if (activeWallet) {
      localStorage.setItem('activeWallet', activeWallet);
    }
  }, [activeWallet]);

  return (
    <WalletContext.Provider value={{ ... }}>
      {children}
    </WalletContext.Provider>
  );
};
```

### 2. Wallet Selector Component

```typescript
// src/components/hunter/WalletSelector.tsx

export function WalletSelector() {
  const { connectedWallets, activeWallet, setActiveWallet, connectWallet } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  const handleWalletChange = (address: string) => {
    setActiveWallet(address);
    setIsOpen(false);
    // Trigger feed refresh
    queryClient.invalidateQueries(['hunter-feed']);
  };

  if (connectedWallets.length === 0) {
    return (
      <button onClick={connectWallet} className="connect-wallet-btn">
        Connect Wallet
      </button>
    );
  }

  const active = connectedWallets.find(w => w.address === activeWallet);

  return (
    <div className="wallet-selector">
      <button onClick={() => setIsOpen(!isOpen)}>
        <WalletIcon chain={active?.chain} />
        <span>{active?.label || truncateAddress(active?.address)}</span>
        <ChevronDown />
      </button>

      {isOpen && (
        <div className="wallet-dropdown">
          {connectedWallets.map(wallet => (
            <button
              key={wallet.address}
              onClick={() => handleWalletChange(wallet.address)}
              className={wallet.address === activeWallet ? 'active' : ''}
            >
              {wallet.address === activeWallet && <Check />}
              <WalletIcon chain={wallet.chain} />
              <div>
                <div>{wallet.label || 'Wallet'}</div>
                <div className="address">{truncateAddress(wallet.address)}</div>
              </div>
            </button>
          ))}
          <button onClick={connectWallet} className="connect-new">
            <Plus /> Connect New Wallet
          </button>
        </div>
      )}
    </div>
  );
}
```

### 3. Feed Integration

```typescript
// src/hooks/useHunterFeed.ts

export function useHunterFeed(props: UseHunterFeedProps) {
  const { activeWallet } = useWallet();

  // Include active wallet in query key for automatic refetch
  const queryKey = ['hunter-feed', queryParams, useRealAPI, activeWallet];

  const queryFn = async ({ pageParam }) => {
    // Pass active wallet to API for personalized ranking
    const result = await getFeedPage({
      ...queryParams,
      cursor: pageParam as string | undefined,
      walletAddress: activeWallet || undefined, // NEW
    });

    return result;
  };

  // ... rest of implementation
}
```

### 4. API Updates

```typescript
// src/lib/feed/query.ts

export interface FeedQueryParams {
  // ... existing params
  walletAddress?: string; // NEW - for personalized ranking
}

export async function getFeedPage(params: FeedQueryParams) {
  const { walletAddress, ...rest } = params;

  // If wallet provided, use personalized ranking
  if (walletAddress) {
    // Fetch wallet history for relevance scoring
    const walletHistory = await getWalletHistory(walletAddress);
    
    // Adjust ranking weights based on wallet activity
    // ... personalization logic
  }

  // ... rest of implementation
}
```

### 5. Eligibility Integration

```typescript
// src/components/hunter/OpportunityCard.tsx

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const { activeWallet } = useWallet();

  // Fetch eligibility for active wallet
  const { data: eligibility } = useQuery({
    queryKey: ['eligibility', opportunity.id, activeWallet],
    queryFn: () => getEligibilityPreview(activeWallet!, opportunity.id, opportunity.chains[0]),
    enabled: !!activeWallet,
  });

  return (
    <div className="opportunity-card">
      {/* ... card content */}
      
      {activeWallet && eligibility && (
        <EligibilityBadge status={eligibility.status} />
      )}
    </div>
  );
}
```

---

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  MULTI-WALLET FLOW                           │
└─────────────────────────────────────────────────────────────┘

1. User connects multiple wallets
   ├─→ Wallet 1: 0x1234...5678 (Main)
   ├─→ Wallet 2: 0xABCD...EFGH (Trading)
   └─→ Wallet 3: 0x9876...5432 (DeFi)

2. User visits /hunter
   ├─→ WalletSelector shows all 3 wallets
   ├─→ Last selected wallet restored from localStorage
   └─→ If none, defaults to first wallet

3. User selects "Trading Wallet"
   ├─→ activeWallet = 0xABCD...EFGH
   ├─→ Saved to localStorage
   ├─→ Feed query invalidated
   └─→ Feed refetches with new wallet

4. Feed API receives wallet address
   ├─→ Fetches wallet history (chains, completions, saves)
   ├─→ Adjusts relevance scoring (60% weight)
   ├─→ Returns personalized opportunities
   └─→ Ranked for Trading Wallet specifically

5. Eligibility checks use active wallet
   ├─→ Each card checks: 0xABCD...EFGH
   ├─→ Shows "Likely Eligible" for Trading Wallet
   └─→ Updates when wallet changes

6. User switches to "DeFi Wallet"
   ├─→ activeWallet = 0x9876...5432
   ├─→ Feed refreshes with loading state
   ├─→ Eligibility badges update
   └─→ Personalized for DeFi Wallet
```

---

## 🧪 Testing Requirements

### Unit Tests

```typescript
describe('WalletSelector', () => {
  it('should display all connected wallets', () => {});
  it('should highlight active wallet', () => {});
  it('should switch active wallet on click', () => {});
  it('should persist selection to localStorage', () => {});
  it('should restore selection on mount', () => {});
  it('should show Connect Wallet when no wallets', () => {});
  it('should truncate long addresses', () => {});
  it('should show full address on hover', () => {});
});

describe('useHunterFeed with wallet', () => {
  it('should include wallet in query key', () => {});
  it('should refetch when wallet changes', () => {});
  it('should pass wallet to API', () => {});
  it('should work without wallet (anonymous)', () => {});
});

describe('Eligibility with wallet selector', () => {
  it('should check eligibility for active wallet', () => {});
  it('should update when wallet changes', () => {});
  it('should cache per wallet', () => {});
});
```

### Integration Tests

```typescript
describe('Multi-wallet Hunter flow', () => {
  it('should show personalized feed for Wallet 1', async () => {
    // Connect Wallet 1
    // Verify feed shows opportunities relevant to Wallet 1
  });

  it('should update feed when switching to Wallet 2', async () => {
    // Switch to Wallet 2
    // Verify feed refreshes
    // Verify opportunities change
  });

  it('should show correct eligibility for each wallet', async () => {
    // Check eligibility for Wallet 1
    // Switch to Wallet 2
    // Verify eligibility updates
  });
});
```

### E2E Tests

```typescript
test('Multi-wallet selection flow', async ({ page }) => {
  // Connect 2 wallets
  await page.goto('/hunter');
  
  // Verify wallet selector shows both
  await expect(page.locator('.wallet-selector')).toBeVisible();
  
  // Click selector
  await page.click('.wallet-selector');
  
  // Verify dropdown shows 2 wallets
  await expect(page.locator('.wallet-dropdown button')).toHaveCount(3); // 2 wallets + connect
  
  // Select second wallet
  await page.click('.wallet-dropdown button:nth-child(2)');
  
  // Verify feed refreshes
  await expect(page.locator('.loading-indicator')).toBeVisible();
  await expect(page.locator('.opportunity-card')).toHaveCount(12);
  
  // Verify eligibility updates
  await expect(page.locator('.eligibility-badge')).toContainText('Likely Eligible');
});
```

---

## 📝 Documentation Updates

### User Guide

```markdown
## Using Multiple Wallets

AlphaWhale allows you to connect multiple wallets and switch between them to see personalized opportunities for each wallet.

### Connecting Wallets

1. Click "Connect Wallet" in the header
2. Select your wallet provider (MetaMask, WalletConnect, etc.)
3. Approve the connection
4. Repeat to connect additional wallets

### Switching Wallets

1. Click the wallet selector in the Hunter Screen header
2. Select the wallet you want to use
3. The feed will refresh with opportunities personalized for that wallet
4. Eligibility badges will update to show your eligibility with the selected wallet

### Wallet Labels

You can set custom labels for your wallets in Settings:
- "Main Wallet" for your primary wallet
- "Trading Wallet" for active trading
- "DeFi Wallet" for yield farming
```

---

## 🚀 Implementation Plan

### Phase 1: Foundation (Week 1)
- [ ] Create WalletContext provider
- [ ] Implement wallet storage in localStorage
- [ ] Add wallet management hooks
- [ ] Write unit tests

### Phase 2: UI Components (Week 1-2)
- [ ] Create WalletSelector component
- [ ] Design dropdown UI (light + dark themes)
- [ ] Add wallet icons and truncation
- [ ] Implement responsive design
- [ ] Write component tests

### Phase 3: Feed Integration (Week 2)
- [ ] Update useHunterFeed to accept wallet
- [ ] Modify getFeedPage API to use wallet
- [ ] Implement personalized ranking logic
- [ ] Add loading states
- [ ] Write integration tests

### Phase 4: Eligibility Integration (Week 2-3)
- [ ] Update eligibility checks to use active wallet
- [ ] Implement cache per wallet
- [ ] Add eligibility refresh on wallet change
- [ ] Write eligibility tests

### Phase 5: Testing & Polish (Week 3)
- [ ] E2E tests for multi-wallet flow
- [ ] Accessibility audit
- [ ] Performance testing
- [ ] Documentation
- [ ] User acceptance testing

---

## ✅ Acceptance Criteria Summary

- [ ] Wallet selector visible in Hunter header
- [ ] All connected wallets shown in dropdown
- [ ] Active wallet highlighted with checkmark
- [ ] Wallet selection persists across sessions
- [ ] Feed refreshes when wallet changes
- [ ] Eligibility updates for selected wallet
- [ ] Works on mobile and desktop
- [ ] Accessible via keyboard navigation
- [ ] Loading states during wallet switch
- [ ] "Connect Wallet" shown when no wallets
- [ ] Wallet labels and addresses displayed
- [ ] Full address shown on hover
- [ ] Smooth animations and transitions
- [ ] No performance degradation
- [ ] All tests passing

---

**Status**: Specification Complete  
**Next Step**: Update requirements.md, design.md, and tasks.md  
**Estimated Effort**: 2-3 weeks (1 developer)  
**Priority**: HIGH - Critical for multi-wallet users
