# Demo Mode Wallet Display - Visual Comparison

## Problem: User Confusion

When demo mode was toggled ON, the wallet chip still showed the user's real wallet address, making it unclear whether they were viewing real or simulated data.

## Solution: Demo Wallet Display

The wallet chip now displays a demo wallet with clear visual indicators when demo mode is active.

---

## Visual Comparison

### Live Mode (Demo Toggle OFF)

```
┌─────────────────────────────────────┐
│  Profile Menu                       │
├─────────────────────────────────────┤
│  👤 Profile                         │
│  ⚙️  Settings                       │
│  💳 Subscription                    │
│  ─────────────────────────────────  │
│  🧪 Demo Mode            [  OFF  ]  │  ← Toggle OFF
│  ─────────────────────────────────  │
│  🚪 Sign out                        │
└─────────────────────────────────────┘

Header displays:
┌──────────────────────────────┐
│ 💳 MetaMask 0x1234        ▼  │  ← Real wallet
│    0x1234...5678             │     Gray styling
└──────────────────────────────┘
```

**Characteristics:**
- Gray background (#f1f5f9)
- Gray border (#e2e8f0)
- Wallet icon (💳)
- Real wallet address
- Dropdown chevron (if multiple wallets)
- ARIA: "Switch active wallet"

---

### Demo Mode (Demo Toggle ON)

```
┌─────────────────────────────────────┐
│  Profile Menu                       │
├─────────────────────────────────────┤
│  👤 Profile                         │
│  ⚙️  Settings                       │
│  💳 Subscription                    │
│  ─────────────────────────────────  │
│  🧪 Demo Mode            [  ON   ]  │  ← Toggle ON
│  ─────────────────────────────────  │
│  🚪 Sign out                        │
└─────────────────────────────────────┘

Header displays:
┌──────────────────────────────┐
│ 🧪 Demo Wallet      [DEMO]   │  ← Demo wallet
│    0xd8dA...6045             │     Blue styling
└──────────────────────────────┘
```

**Characteristics:**
- Blue background (#eff6ff)
- Blue border (#bfdbfe)
- TestTube2 icon (🧪)
- Demo wallet address (Vitalik's)
- "DEMO" badge (blue)
- No dropdown chevron
- ARIA: "Demo wallet (simulated data)"

---

## Side-by-Side Comparison

| Feature | Live Mode | Demo Mode |
|---------|-----------|-----------|
| **Background** | Gray (#f1f5f9) | Blue (#eff6ff) |
| **Border** | Gray (#e2e8f0) | Blue (#bfdbfe) |
| **Icon** | 💳 Wallet | 🧪 TestTube2 |
| **Label** | "MetaMask 0x1234" | "Demo Wallet" |
| **Address** | Real (0x1234...5678) | Demo (0xd8dA...6045) |
| **Badge** | None | "DEMO" |
| **Chevron** | Yes (if multiple) | No |
| **ARIA** | "Switch active wallet" | "Demo wallet (simulated data)" |

---

## User Flow

### Scenario 1: Entering Demo Mode

1. User clicks profile menu
2. User toggles "Demo Mode" ON
3. **Wallet chip immediately updates:**
   - Background changes to blue
   - Icon changes to test tube
   - Label changes to "Demo Wallet"
   - Address changes to 0xd8dA...6045
   - "DEMO" badge appears
4. User sees clear visual feedback

### Scenario 2: Exiting Demo Mode

1. User clicks profile menu
2. User toggles "Demo Mode" OFF
3. **Wallet chip immediately updates:**
   - Background changes to gray
   - Icon changes to wallet
   - Label changes to real wallet name
   - Address changes to real address
   - "DEMO" badge disappears
4. User sees they're back in live mode

---

## Color Palette

### Live Mode Colors
```css
Background:     #f1f5f9  (slate-100)
Border:         #e2e8f0  (slate-200)
Text:           #0f172a  (slate-900)
Secondary Text: #64748b  (slate-500)
Icon:           #475569  (slate-600)
```

### Demo Mode Colors
```css
Background:     #eff6ff  (blue-50)
Border:         #bfdbfe  (blue-200)
Text:           #1e3a8a  (blue-900)
Secondary Text: #2563eb  (blue-600)
Icon:           #2563eb  (blue-600)
Badge BG:       #2563eb  (blue-600)
Badge Text:     #ffffff  (white)
```

---

## Dark Mode Support

### Live Mode (Dark)
```
┌──────────────────────────────┐
│ 💳 MetaMask 0x1234        ▼  │
│    0x1234...5678             │
└──────────────────────────────┘
```
- Background: #1e293b (slate-800)
- Border: #334155 (slate-700)
- Text: #ffffff (white)

### Demo Mode (Dark)
```
┌──────────────────────────────┐
│ 🧪 Demo Wallet      [DEMO]   │
│    0xd8dA...6045             │
└──────────────────────────────┘
```
- Background: #1e3a8a20 (blue-900/20)
- Border: #1e40af (blue-800)
- Text: #dbeafe (blue-100)

---

## Accessibility Features

### Visual Indicators
1. **Color**: Blue vs gray (not sole indicator)
2. **Icon**: Different icons (test tube vs wallet)
3. **Text**: "Demo Wallet" label
4. **Badge**: "DEMO" text badge

### Screen Reader Support
- Live mode: "Switch active wallet"
- Demo mode: "Demo wallet (simulated data)"

### Keyboard Navigation
- Tab to focus wallet chip
- Enter/Space to activate
- Same behavior in both modes

---

## Implementation Details

### Demo Wallet Constant
```typescript
const DEMO_WALLET = {
  address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  label: 'Demo Wallet',
  provider: 'Demo'
};
```

### Mode Detection
```typescript
const { isDemo } = useDemoMode();
const activeWalletData = isDemo 
  ? DEMO_WALLET 
  : connectedWallets.find(w => w.address === activeWallet);
```

### Conditional Rendering
```typescript
{isDemo ? (
  <TestTube2 className="w-4 h-4 text-blue-600" />
) : (
  <Wallet className="w-4 h-4 text-slate-600" />
)}
```

---

## Benefits

✅ **Prevents Confusion**
- Users immediately know they're in demo mode
- No ambiguity about data source

✅ **Clear Visual Feedback**
- Blue theme is distinct and recognizable
- Multiple visual cues (color, icon, badge, text)

✅ **Consistent UX**
- Demo mode affects all data displays
- Wallet display matches overall app state

✅ **Accessible**
- Works for color-blind users (multiple indicators)
- Screen reader friendly
- High contrast

✅ **Professional**
- Polished appearance
- Smooth transitions
- Attention to detail

---

## Testing Checklist

- [ ] Toggle demo mode ON → wallet shows demo data
- [ ] Toggle demo mode OFF → wallet shows real data
- [ ] Blue styling visible in demo mode
- [ ] "DEMO" badge visible in demo mode
- [ ] Test tube icon visible in demo mode
- [ ] No dropdown chevron in demo mode
- [ ] ARIA label correct in both modes
- [ ] Dark mode styling correct
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly

---

## Conclusion

The wallet chip now provides clear, unambiguous visual feedback about demo mode state, preventing user confusion and improving the overall UX.
