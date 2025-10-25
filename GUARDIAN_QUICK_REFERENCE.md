# Guardian UX Quick Reference Card
## 🚀 Component Cheat Sheet for Developers

**Version**: 2.0.0  
**Last Updated**: October 25, 2025

---

## 📦 Installation

```bash
npm install framer-motion canvas-confetti lucide-react \
  @radix-ui/react-tooltip @radix-ui/react-dialog \
  @radix-ui/react-popover @radix-ui/react-scroll-area
```

---

## 🎨 Design System

### CSS Import
```tsx
import '@/styles/guardian-design-system.css';
```

### CSS Variables (Most Common)
```css
/* Colors */
--guardian-accent-trust: #10B981
--guardian-accent-tech: #3B82F6
--guardian-accent-warning: #F59E0B
--guardian-accent-danger: #EF4444

/* Spacing */
--guardian-space-2: 0.5rem    /* 8px */
--guardian-space-4: 1rem      /* 16px */
--guardian-space-6: 1.5rem    /* 24px */

/* Radius */
--guardian-radius-md: 12px
--guardian-radius-lg: 16px

/* Durations */
--guardian-duration-fast: 0.2s
--guardian-duration-normal: 0.3s
```

---

## 🧩 Component Quick Start

### 1. Glass UI Components

```tsx
import {
  GlassCard,
  GlassButton,
  GlassInput,
  GlassBadge,
  GlassProgress,
} from '@/components/guardian/GlassUI';

// Basic card
<GlassCard variant="hover" className="p-6">
  <h2>Trust Score</h2>
</GlassCard>

// Button variants
<GlassButton variant="primary" size="lg">
  Scan Wallet
</GlassButton>

// Input field
<GlassInput 
  type="text" 
  placeholder="0x... wallet address" 
/>

// Badge
<GlassBadge variant="success">Verified</GlassBadge>

// Progress bar
<GlassProgress value={75} variant="success" />
```

### 2. AI Explainer

```tsx
import { 
  AIExplainerTooltip, 
  GUARDIAN_EXPLAINERS 
} from '@/components/guardian/AIExplainerTooltip';

// Using preset explainer
<div className="flex items-center gap-2">
  <span>Trust Score: 87%</span>
  <AIExplainerTooltip {...GUARDIAN_EXPLAINERS.trustScore} />
</div>

// Custom explainer
<AIExplainerTooltip
  concept="Gas Fees"
  simpleExplanation="The cost to process your transaction"
  technicalExplanation="Gas = Gas Used × Gas Price (in Gwei)"
  analogy="Like paying for postage on a letter"
  learnMoreUrl="https://ethereum.org/en/developers/docs/gas/"
/>
```

**Available Presets**: `trustScore`, `tokenApproval`, `mixerExposure`, `contractRisk`, `walletAge`

### 3. Notifications

```tsx
import { 
  NotificationCenter, 
  useNotifications 
} from '@/components/guardian/NotificationCenter';

function App() {
  const notifications = useNotifications();

  // Add notification
  notifications.addNotification({
    title: 'Security Alert',
    message: 'New approval detected',
    priority: 'critical',
    category: 'security',
    actionLabel: 'View',
    onAction: () => navigate('/risks'),
  });

  return (
    <header>
      <NotificationCenter {...notifications} />
    </header>
  );
}
```

**Priorities**: `critical`, `important`, `info`, `achievement`  
**Categories**: `security`, `activity`, `achievement`, `tip`

### 4. Wallet Timeline

```tsx
import { 
  WalletTimeline,
  Transaction 
} from '@/components/guardian/WalletTimeline';

const transactions: Transaction[] = [
  {
    id: '1',
    hash: '0xabc...',
    type: 'sent',
    status: 'success',
    timestamp: new Date(),
    from: '0x...',
    to: '0x...',
    amount: '0.5',
    token: 'ETH',
    usdValue: '1250',
    description: 'Sent 0.5 ETH to Uniswap',
    network: 'ethereum',
    explorerUrl: 'https://etherscan.io/tx/0xabc...',
  },
];

<WalletTimeline
  transactions={transactions}
  walletAddress="0x..."
  onExport={() => exportToCSV()}
  showAIInsights={true}
/>
```

**Transaction Types**: `sent`, `received`, `swap`, `approval`, `contract`, `mint`, `burn`  
**Statuses**: `success`, `pending`, `failed`

### 5. Achievement System

```tsx
import { 
  AchievementSystem,
  DEFAULT_ACHIEVEMENTS 
} from '@/components/guardian/AchievementSystem';

const [achievements, setAchievements] = useState(() =>
  DEFAULT_ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: false,
    progress: 0,
  }))
);

<AchievementSystem
  achievements={achievements}
  userLevel={5}
  userXP={450}
  nextLevelXP={500}
  onAchievementClick={(a) => console.log(a)}
/>
```

**Rarities**: `common`, `uncommon`, `rare`, `epic`, `legendary`  
**Categories**: `security`, `activity`, `social`, `mastery`

### 6. User Mode Toggle

```tsx
import { 
  UserModeToggle, 
  useUserMode 
} from '@/components/guardian/UserModeToggle';

function App() {
  const { mode, setMode } = useUserMode();

  return (
    <header>
      <UserModeToggle mode={mode} onModeChange={setMode} />
      
      {mode === 'beginner' ? (
        <BeginnerDashboard />
      ) : (
        <ExpertDashboard />
      )}
    </header>
  );
}
```

**Modes**: `beginner`, `expert`

### 7. Animations

```tsx
import {
  FadeIn,
  SlideIn,
  ScaleIn,
  CountUp,
  Pulse,
  Shimmer,
  ProgressCircle,
} from '@/components/guardian/AnimationLibrary';

// Fade in
<FadeIn delay={0.2}>
  <GlassCard>Content</GlassCard>
</FadeIn>

// Slide in
<SlideIn direction="up" duration={0.3}>
  <p>Animated text</p>
</SlideIn>

// Count up number
<CountUp to={87} decimals={0} suffix="%" />

// Progress circle
<ProgressCircle 
  percentage={75} 
  size={120} 
  color="#10B981" 
/>

// Loading shimmer
<Shimmer width="100%" height="40px" />
```

**Directions**: `up`, `down`, `left`, `right`  
**All animations respect `prefers-reduced-motion`**

### 8. Responsive Layout

```tsx
import {
  MobileHeader,
  BottomNav,
  MobileDrawer,
  FAB,
  Container,
  Stack,
  useResponsive,
} from '@/components/guardian/ResponsiveLayout';

function App() {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <MobileHeader
        title="Guardian"
        onMenuClick={() => setDrawerOpen(true)}
      />

      {/* Main content */}
      <Container size="lg">
        <Stack direction="responsive" gap={6}>
          <GlassCard>Card 1</GlassCard>
          <GlassCard>Card 2</GlassCard>
        </Stack>
      </Container>

      {/* Bottom navigation */}
      <BottomNav
        items={[
          { icon: Home, label: 'Home', href: '/', active: true },
          { icon: Shield, label: 'Scan', href: '/scan' },
        ]}
      />

      {/* Drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        position="left"
      >
        <nav>Navigation items</nav>
      </MobileDrawer>

      {/* Floating action button */}
      <FAB icon={Plus} label="Scan" onClick={handleScan} />
    </>
  );
}
```

---

## 🎨 Common Patterns

### Pattern 1: Dashboard Card with Explainer
```tsx
<GlassCard variant="hover" className="p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-semibold">Trust Score</h2>
    <AIExplainerTooltip {...GUARDIAN_EXPLAINERS.trustScore} />
  </div>
  
  <div className="text-center">
    <CountUp to={trustScore} suffix="%" className="text-5xl font-bold" />
  </div>
</GlassCard>
```

### Pattern 2: Notification on Action
```tsx
const { addNotification } = useNotifications();

const handleScan = async () => {
  const result = await scanWallet();
  
  addNotification({
    title: result.flags.length === 0 ? 'All Clear!' : 'Risks Found',
    message: result.flags.length === 0 
      ? 'Your wallet is secure'
      : `Found ${result.flags.length} potential risks`,
    priority: result.flags.length === 0 ? 'info' : 'important',
    category: 'security',
  });
};
```

### Pattern 3: Achievement Unlock
```tsx
const checkAchievements = (scanCount: number) => {
  if (scanCount === 1) {
    unlockAchievement('first_scan');
    awardXP(50);
    addNotification({
      title: '🎉 Achievement Unlocked!',
      message: 'Guardian Initiate - First scan complete',
      priority: 'achievement',
      category: 'achievement',
    });
  }
};
```

### Pattern 4: Responsive Layout
```tsx
const { isMobile } = useResponsive();

return (
  <div className="min-h-screen">
    {isMobile ? (
      <>
        <MobileHeader title="Guardian" />
        <BottomNav items={navItems} />
      </>
    ) : (
      <GlassNav>
        <nav className="flex items-center gap-6">
          <Link to="/">Home</Link>
          <Link to="/scan">Scan</Link>
        </nav>
      </GlassNav>
    )}
  </div>
);
```

---

## 🎯 Mode-Specific Features

### Beginner Mode
```tsx
{mode === 'beginner' && (
  <>
    {/* More tooltips */}
    <AIExplainerTooltip {...} />
    
    {/* Confirmation dialogs */}
    <ConfirmDialog
      title="Are you sure?"
      message="This will revoke the approval"
      onConfirm={handleRevoke}
    />
    
    {/* AI insights */}
    <WalletTimeline showAIInsights={true} />
  </>
)}
```

### Expert Mode
```tsx
{mode === 'expert' && (
  <>
    {/* Bulk actions */}
    <GlassButton onClick={revokeAll}>
      Revoke All ({selected.length})
    </GlassButton>
    
    {/* Technical details */}
    <pre className="text-xs">
      {JSON.stringify(scanResult, null, 2)}
    </pre>
    
    {/* Keyboard shortcuts hint */}
    <p className="text-xs text-slate-500">
      Press ? for shortcuts
    </p>
  </>
)}
```

---

## 🔧 Utilities

### CSS Classes
```css
/* Glass effects */
.guardian-glass-card          /* Pre-styled glass card */
.guardian-backdrop-blur       /* Backdrop blur utility */

/* Buttons */
.guardian-btn-primary         /* Primary button with gradient */
.guardian-btn-outline         /* Outline button */

/* Text */
.guardian-text-gradient       /* Gradient text effect */
.guardian-glow-text           /* Text with glow */

/* Focus */
.guardian-focus-ring          /* Accessible focus ring */
```

### Hooks
```tsx
// User mode
const { mode, setMode } = useUserMode();

// Notifications
const notifications = useNotifications();

// Responsive
const { isMobile, isTablet, isDesktop } = useResponsive();

// Reduced motion
const shouldReduceMotion = usePrefersReducedMotion();
```

---

## 🎨 Color Usage Guide

| Color | Use Case | Variable |
|-------|----------|----------|
| 🟢 Trust (#10B981) | Success, verified, safe | `--guardian-accent-trust` |
| 🔵 Tech (#3B82F6) | Primary actions, links | `--guardian-accent-tech` |
| 🟡 Warning (#F59E0B) | Caution, medium risk | `--guardian-accent-warning` |
| 🔴 Danger (#EF4444) | Critical, high risk | `--guardian-accent-danger` |
| ⚪ Slate | Text, borders, backgrounds | `--guardian-text-*` |

---

## 📱 Responsive Breakpoints

```tsx
/* Mobile: 0 - 639px */
className="text-sm sm:text-base"

/* Tablet: 640px - 1023px */
className="sm:grid-cols-2"

/* Desktop: 1024px+ */
className="lg:grid-cols-3"
```

---

## ⌨️ Keyboard Shortcuts (Expert Mode)

| Key | Action |
|-----|--------|
| `R` | Rescan wallet |
| `X` | Revoke selected |
| `N` | New notification |
| `/` | Search |
| `T` | Toggle theme |
| `M` | Toggle mode |
| `?` | Show shortcuts |
| `ESC` | Close modal |

---

## 🐛 Common Issues

### Animations not working
```tsx
// ✅ Solution: Install framer-motion
npm install framer-motion

// ✅ Check prefers-reduced-motion
console.log(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
```

### Tooltips not appearing
```tsx
// ✅ Solution: Wrap with TooltipProvider
import { TooltipProvider } from '@/components/ui/tooltip';

<TooltipProvider delayDuration={300}>
  <App />
</TooltipProvider>
```

### Glass effect not visible
```css
/* ✅ Solution: Ensure dark background */
.bg-slate-900 { background: #0F172A; }

/* And proper backdrop-blur support */
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
```

---

## 📚 Full Documentation

- [Complete Roadmap](./GUARDIAN_UX_REDESIGN_ROADMAP.md)
- [Implementation Guide](./GUARDIAN_IMPLEMENTATION_GUIDE.md)
- [Complete Summary](./GUARDIAN_UX_COMPLETE_SUMMARY.md)

---

**Quick Start**: Copy a pattern above → Customize → Ship! 🚀

**Last Updated**: October 25, 2025  
**Maintained by**: Guardian UX Team

