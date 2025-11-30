# Guardian Components Guide

## Complete UI Component Documentation

---

## Component Hierarchy

```
GuardianEnhanced (Main Page)
├── Header
│   ├── Logo
│   ├── WalletDropdown (Multi-wallet selector)
│   ├── UserModeToggle (Beginner/Expert)
│   ├── NotificationCenter
│   └── ConnectButton (Wagmi)
├── ScoreCard (Hero Section)
│   ├── TrustGauge (Animated circular gauge)
│   ├── Grade Badge (A-F)
│   ├── Confidence Indicator
│   ├── Flag Count
│   └── Action Buttons (Rescan, Fix Risks)
├── Tabs
│   ├── RisksTab (Active Risks)
│   │   ├── RiskCard (Mixer Exposure)
│   │   ├── RiskCard (Contract Risks)
│   │   ├── RiskCard (Unlimited Approvals)
│   │   └── RiskCard (Address Reputation)
│   ├── AlertsTab (Notifications)
│   │   └── NotificationCenter
│   └── HistoryTab (Scan History)
│       └── WalletTimeline
├── Modals
│   ├── RevokeModal (Approval revocation)
│   ├── AddWalletModal (Multi-wallet)
│   └── FixRiskModal (Risk remediation)
└── FooterNav (Mobile Navigation)
```

---

## Core Components

### 1. TrustGauge

**Location:** `src/components/guardian/TrustGauge.tsx`

**Purpose:** Animated circular progress indicator for trust score

**Props:**
```typescript
interface TrustGaugeProps {
  score: number;           // 0-100
  confidence: number;      // 0.0-1.0
  isScanning?: boolean;    // Show loading animation
}
```

**Usage:**
```tsx
<TrustGauge 
  score={87} 
  confidence={0.85} 
  isScanning={false} 
/>
```

**Features:**
- Smooth animation with Framer Motion
- Color-coded by score (green/yellow/red)
- Confidence ring overlay
- Pulsing effect during scan
- Respects `prefers-reduced-motion`

---

### 2. ScoreCard

**Location:** `src/components/guardian/ScoreCard.tsx`

**Purpose:** Main trust score display with actions

**Props:**
```typescript
interface ScoreCardProps {
  score: number;                    // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  flags: number;                    // Total flag count
  critical: number;                 // Critical flag count
  lastScan: string;                 // Relative time (e.g., "2m ago")
  chains: string[];                 // Network codes
  autoRefreshEnabled: boolean;
  onRescan: () => void;
  onFixRisks: () => void;
  isRescanning?: boolean;
}
```

**Usage:**
```tsx
<ScoreCard
  score={87}
  grade="B"
  flags={2}
  critical={0}
  lastScan="2m ago"
  chains={['ethereum']}
  autoRefreshEnabled={false}
  onRescan={handleRescan}
  onFixRisks={() => setShowFixModal(true)}
  isRescanning={isRescanning}
/>
```

---

### 3. RiskCard

**Location:** `src/components/guardian/RiskCard.tsx`

**Purpose:** Display individual risk category

**Props:**
```typescript
interface RiskCardProps {
  title: string;
  severity: 'good' | 'ok' | 'medium' | 'high';
  lines: string[];              // Description lines
  cta?: {
    label: string;
    onClick: () => void;
  };
  sideBadge?: string;           // Optional badge text
}
```

**Usage:**
```tsx
<RiskCard
  title="Mixer Exposure"
  severity="medium"
  lines={[
    "Counterparty mixed funds in last 30d",
    "Score impact: −8"
  ]}
  cta={{
    label: "View tx",
    onClick: () => window.open(txUrl, '_blank')
  }}
/>
```

**Severity Colors:**
- `good`: Green (#00C9A7)
- `ok`: Blue (#3B82F6)
- `medium`: Amber (#F9B040)
- `high`: Red (#F95A5A)

---

### 4. RevokeModal

**Location:** `src/components/guardian/RevokeModal.tsx`

**Purpose:** Approval revocation interface with gas estimation

**Props:**
```typescript
interface RevokeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  approvals: Array<{
    token: string;
    spender: string;
    symbol?: string;
  }>;
  onRevoke: (selectedApprovals: typeof approvals) => Promise<void>;
  walletAddress?: string;
  currentTrustScore?: number;
}
```

**Usage:**
```tsx
<RevokeModal
  open={showRevokeModal}
  onOpenChange={setShowRevokeModal}
  approvals={riskyApprovals}
  onRevoke={handleRevoke}
  walletAddress={address}
  currentTrustScore={87}
/>
```

**Features:**
- Checkbox selection for approvals
- Real-time gas estimation (dry_run API call)
- Trust score delta preview (+X points)
- Batch revoke capability
- Loading states
- Success/error feedback

---

### 5. AddWalletModal

**Location:** `src/components/guardian/AddWalletModal.tsx`

**Purpose:** Add new wallet to multi-wallet registry

**Props:**
```typescript
interface AddWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWalletAdded: (wallet: GuardianWallet) => void;
}
```

**Usage:**
```tsx
<AddWalletModal
  open={showAddWalletModal}
  onOpenChange={setShowAddWalletModal}
  onWalletAdded={(wallet) => {
    console.log('Wallet added:', wallet);
    refetchWallets();
  }}
/>
```

**Features:**
- Address input with validation
- ENS name resolution
- Network selector
- Custom label/alias
- API integration
- Error handling

---

### 6. NotificationCenter

**Location:** `src/components/guardian/NotificationCenter.tsx`

**Purpose:** Real-time notification system

**Props:**
```typescript
interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}
```

**Hook:**
```typescript
const {
  notifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  dismiss,
  clearAll,
} = useNotifications();
```

**Usage:**
```tsx
// Add notification
addNotification({
  title: 'Security Alert',
  message: 'Found 2 potential risks',
  priority: 'important',
  category: 'security',
  actionLabel: 'View Details',
  onAction: () => navigate('/guardian/risks'),
});

// Render component
<NotificationCenter
  notifications={notifications}
  onMarkAsRead={markAsRead}
  onMarkAllAsRead={markAllAsRead}
  onDismiss={dismiss}
  onClearAll={clearAll}
/>
```

**Categories:**
- `security`: Red badge, high priority
- `activity`: Blue badge, normal priority
- `achievement`: Purple badge, celebration
- `info`: Gray badge, low priority

---

### 7. WalletTimeline

**Location:** `src/components/guardian/WalletTimeline.tsx`

**Purpose:** Transaction history with AI insights

**Props:**
```typescript
interface WalletTimelineProps {
  transactions: Transaction[];
  walletAddress: string;
  onExport?: () => void;
  showAIInsights?: boolean;
}
```

**Usage:**
```tsx
<WalletTimeline
  transactions={txHistory}
  walletAddress={address}
  onExport={handleExportCSV}
  showAIInsights={true}
/>
```

**Features:**
- Search and filter
- Date grouping
- AI insights summary
- Expandable details
- Export to CSV
- Infinite scroll

---

### 8. AchievementSystem

**Location:** `src/components/guardian/AchievementSystem.tsx`

**Purpose:** Gamification with badges and XP

**Props:**
```typescript
interface AchievementSystemProps {
  achievements: Achievement[];
  userLevel: number;
  userXP: number;
  nextLevelXP: number;
  onAchievementClick?: (achievement: Achievement) => void;
}
```

**Usage:**
```tsx
<AchievementSystem
  achievements={userAchievements}
  userLevel={5}
  userXP={450}
  nextLevelXP={500}
  onAchievementClick={(achievement) => {
    console.log('Clicked:', achievement.name);
  }}
/>
```

**Default Achievements:**
- First Scan (10 XP)
- Perfect Score (50 XP)
- Revoke Master (100 XP)
- Security Streak (75 XP)
- Multi-Wallet Pro (50 XP)
- Guardian Expert (200 XP)

---

## Utility Components

### 9. AIExplainerTooltip

**Location:** `src/components/guardian/AIExplainerTooltip.tsx`

**Purpose:** Contextual help tooltips

**Props:**
```typescript
interface AIExplainerTooltipProps {
  concept: string;
  simpleExplanation: string;
  technicalExplanation?: string;
  analogy?: string;
  learnMoreUrl?: string;
  showTechnical?: boolean;
}
```

**Usage:**
```tsx
<div className="flex items-center gap-2">
  <span>Trust Score</span>
  <AIExplainerTooltip
    concept="Trust Score"
    simpleExplanation="Your wallet's security rating from 0-100"
    technicalExplanation="Calculated using weighted risk factors..."
    analogy="Like a credit score for your wallet"
    learnMoreUrl="/docs/trust-score"
  />
</div>
```

---

### 10. ScanDialog

**Location:** `src/components/guardian/ScanDialog.tsx`

**Purpose:** Scanning progress modal

**Props:**
```typescript
interface ScanDialogProps {
  open: boolean;
}
```

**Usage:**
```tsx
<ScanDialog open={isScanning && !data} />
```

**Features:**
- Animated scanning indicator
- Progress messages
- Auto-closes on completion
- Glassmorphism styling

---

## Animation Components

### 11. AnimationLibrary

**Location:** `src/components/guardian/AnimationLibrary.tsx`

**Exports:**
- `FadeIn` - Fade in animation
- `SlideIn` - Slide in from direction
- `ScaleIn` - Scale up animation
- `CountUp` - Animated number counter
- `Pulse` - Pulsing effect
- `Shake` - Shake animation
- `Shimmer` - Loading skeleton
- `ProgressCircle` - Circular progress
- `Toast` - Toast notification
- `Ripple` - Ripple effect

**Usage:**
```tsx
import { FadeIn, CountUp, ProgressCircle } from '@/components/guardian/AnimationLibrary';

<FadeIn>
  <div className="card">
    <ProgressCircle percentage={87} />
    <h2><CountUp to={87} suffix="%" /></h2>
  </div>
</FadeIn>
```

---

## Layout Components

### 12. ResponsiveLayout

**Location:** `src/components/guardian/ResponsiveLayout.tsx`

**Exports:**
- `MobileHeader` - Mobile-optimized header
- `BottomNav` - Mobile bottom navigation
- `MobileDrawer` - Slide-out drawer
- `FAB` - Floating action button
- `ResponsiveGrid` - Responsive grid layout
- `Container` - Max-width container
- `PullToRefresh` - Pull-to-refresh gesture

**Usage:**
```tsx
<>
  <MobileHeader
    title="Guardian"
    onMenuClick={() => setDrawerOpen(true)}
  />
  
  <Container>
    {/* Content */}
  </Container>
  
  <BottomNav
    items={[
      { icon: Home, label: 'Home', href: '/' },
      { icon: Shield, label: 'Scan', href: '/guardian' },
    ]}
  />
</>
```

---

## Styling Guidelines

### Glassmorphism

```tsx
<div className="guardian-glass-card p-6">
  {/* Content */}
</div>
```

### Color Classes

```tsx
// Trust score colors
<span className="text-emerald-400">87%</span>  // Good (80-100)
<span className="text-yellow-400">65%</span>   // Warning (60-79)
<span className="text-red-400">45%</span>      // Danger (0-59)
```

### Animations

```tsx
// Hover effects
<button className="transition-all hover:scale-105">
  Rescan
</button>

// Loading states
<div className="animate-pulse">
  Loading...
</div>
```

---

## Best Practices

1. **Always use hooks for data fetching** - Never fetch in components
2. **Respect prefers-reduced-motion** - All animations should check
3. **Add ARIA labels** - For accessibility
4. **Use semantic HTML** - `<article>`, `<section>`, etc.
5. **Handle loading states** - Show skeletons or spinners
6. **Handle error states** - Display user-friendly messages
7. **Optimize re-renders** - Use `memo` and `useMemo` where appropriate
8. **Test on mobile** - Ensure touch targets are ≥44px
