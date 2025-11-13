# WalletSelector Visual Guide

## Overview

This guide provides visual references and descriptions for the WalletSelector component and multi-wallet feature UI.

> **Note:** This document describes the visual design and layout. Actual screenshots should be added during documentation finalization.

## Component States

### 1. No Wallet Connected

**Location:** Top-right corner of Hunter Screen header

**Visual Elements:**
- Button with text "Connect Wallet"
- Wallet icon (outline style)
- Primary button styling (blue background)
- Hover state: Slightly darker blue

**Dimensions:**
- Desktop: 140px width, 40px height
- Mobile: Full width, 44px height (touch-friendly)

**Screenshot Placeholder:**
```
┌─────────────────────────────────────────────────────┐
│  AlphaWhale Hunter                    [Connect Wallet] │
└─────────────────────────────────────────────────────┘
```

**Description:**
When no wallet is connected, users see a prominent "Connect Wallet" button in the header. Clicking this button opens the wallet connection modal with provider options.

---

### 2. Single Wallet Connected

**Location:** Top-right corner of Hunter Screen header

**Visual Elements:**
- Wallet icon (filled style)
- Wallet label or ENS name or truncated address
- Dropdown chevron icon
- Border with subtle shadow
- Active state indicator

**Display Priority:**
1. Custom label (if set) - e.g., "Trading Wallet"
2. ENS name (if available) - e.g., "vitalik.eth"
3. Truncated address - e.g., "0x1234...5678"

**Screenshot Placeholder:**
```
┌─────────────────────────────────────────────────────┐
│  AlphaWhale Hunter          [👛 Trading Wallet ▼] │
└─────────────────────────────────────────────────────┘
```

**Description:**
With one wallet connected, the selector displays the wallet's label, ENS name, or truncated address. The dropdown chevron indicates more options are available.

---

### 3. Wallet Selector Dropdown (Closed)

**Visual Elements:**
- Compact button appearance
- Wallet icon on left
- Text in center (label/ENS/address)
- Chevron down icon on right
- Subtle border and shadow
- Hover effect: Background lightens

**Dimensions:**
- Min width: 180px
- Max width: 280px
- Height: 40px
- Border radius: 8px

**Screenshot Placeholder:**
```
┌──────────────────────────┐
│ 👛 Trading Wallet    ▼  │
└──────────────────────────┘
```

---

### 4. Wallet Selector Dropdown (Open)

**Location:** Dropdown appears below the selector button

**Visual Elements:**
- White background (light mode) / Dark gray (dark mode)
- Shadow for depth
- Rounded corners (12px)
- Max height: 400px (scrollable if more wallets)
- Divider between wallets
- "Add Wallet" button at bottom

**Dropdown Structure:**
```
┌────────────────────────────────────────┐
│  Connected Wallets                     │
├────────────────────────────────────────┤
│  ✓ 👛 Trading Wallet                  │
│     0x1234...5678                      │
│     [Edit] [Disconnect]                │
├────────────────────────────────────────┤
│    👛 vitalik.eth                      │
│     0xabcd...ef01                      │
│     [Edit] [Disconnect]                │
├────────────────────────────────────────┤
│    👛 0x9876...5432                    │
│     [Edit] [Disconnect]                │
├────────────────────────────────────────┤
│  [+ Add Wallet]                        │
└────────────────────────────────────────┘
```

**Screenshot Placeholder:**
```
┌──────────────────────────┐
│ 👛 Trading Wallet    ▲  │
└──────────────────────────┘
        │
        ▼
┌────────────────────────────────────────┐
│  Connected Wallets                     │
├────────────────────────────────────────┤
│  ✓ 👛 Trading Wallet              ✏️ ⚡│
│     0x1234...5678                      │
├────────────────────────────────────────┤
│    👛 vitalik.eth                 ✏️ ⚡│
│     0xabcd...ef01                      │
├────────────────────────────────────────┤
│    👛 0x9876...5432               ✏️ ⚡│
├────────────────────────────────────────┤
│  [+ Add Wallet]                        │
└────────────────────────────────────────┘
```

**Description:**
The dropdown shows all connected wallets with:
- Checkmark (✓) on active wallet
- Wallet icon, label/ENS/address
- Edit icon (✏️) to set custom label
- Disconnect icon (⚡) to remove wallet
- "Add Wallet" button at bottom

---

### 5. Active Wallet Indicator

**Visual Elements:**
- Green checkmark icon (✓)
- Slightly bolder text
- Subtle background highlight
- Cannot be disconnected (must switch first)

**Screenshot Placeholder:**
```
┌────────────────────────────────────────┐
│  ✓ 👛 Trading Wallet              ✏️  │
│     0x1234...5678                      │
│     [Active - Switch to disconnect]    │
└────────────────────────────────────────┘
```

**Description:**
The active wallet is visually distinguished with a checkmark and cannot be disconnected directly. Users must switch to another wallet first.

---

### 6. Wallet Label Editor

**Trigger:** Click edit icon (✏️) next to any wallet

**Visual Elements:**
- Inline text input
- Placeholder: "Enter wallet label..."
- Max length: 30 characters
- Save button (checkmark icon)
- Cancel button (X icon)
- Auto-focus on input

**Screenshot Placeholder:**
```
┌────────────────────────────────────────┐
│  👛 [Trading Wallet____________] ✓ ✗  │
│     0x1234...5678                      │
└────────────────────────────────────────┘
```

**Description:**
Clicking the edit icon transforms the wallet entry into an editable field. Users can type a custom label and save or cancel.

---

### 7. Loading State (Connecting)

**Visual Elements:**
- Spinner animation
- "Connecting..." text
- Disabled state (no interaction)
- Semi-transparent overlay

**Screenshot Placeholder:**
```
┌──────────────────────────┐
│ ⟳ Connecting...         │
└──────────────────────────┘
```

**Description:**
While connecting a new wallet, the selector shows a loading spinner and "Connecting..." text.

---

### 8. Loading State (Switching)

**Visual Elements:**
- Spinner animation
- "Switching..." text
- Dropdown remains open
- Selected wallet highlighted

**Screenshot Placeholder:**
```
┌────────────────────────────────────────┐
│  ✓ 👛 Trading Wallet              ✏️ ⚡│
│     0x1234...5678                      │
├────────────────────────────────────────┤
│  ⟳ 👛 vitalik.eth                     │
│     Switching...                       │
└────────────────────────────────────────┘
```

**Description:**
When switching wallets, a spinner appears next to the target wallet with "Switching..." text.

---

### 9. ENS Resolution Loading

**Visual Elements:**
- Skeleton loader for ENS name
- Truncated address shown as fallback
- Resolves to ENS name when available

**Screenshot Placeholder:**
```
┌────────────────────────────────────────┐
│  👛 ▓▓▓▓▓▓▓▓▓▓▓▓                  ✏️ ⚡│
│     0xabcd...ef01                      │
└────────────────────────────────────────┘
        ↓ (after resolution)
┌────────────────────────────────────────┐
│  👛 vitalik.eth                   ✏️ ⚡│
│     0xabcd...ef01                      │
└────────────────────────────────────────┘
```

**Description:**
While ENS name is being resolved, a skeleton loader appears. Once resolved, the ENS name replaces the loader.

---

### 10. Error State

**Visual Elements:**
- Red border on selector
- Error icon (⚠️)
- Error message tooltip
- Retry button

**Screenshot Placeholder:**
```
┌──────────────────────────┐
│ ⚠️ Connection Failed  ↻  │
└──────────────────────────┘
```

**Description:**
If wallet connection fails, the selector shows an error state with a retry button.

---

### 11. Mobile View (Portrait)

**Visual Elements:**
- Full-width selector button
- Larger touch targets (44px min)
- Bottom sheet instead of dropdown
- Swipe-to-dismiss gesture

**Screenshot Placeholder:**
```
┌─────────────────────────┐
│  AlphaWhale Hunter      │
├─────────────────────────┤
│                         │
│  [👛 Trading Wallet ▼] │
│                         │
└─────────────────────────┘
```

**Bottom Sheet:**
```
┌─────────────────────────┐
│  ─────                  │ ← Drag handle
├─────────────────────────┤
│  Connected Wallets      │
├─────────────────────────┤
│  ✓ 👛 Trading Wallet   │
│     0x1234...5678       │
│     [Edit] [Disconnect] │
├─────────────────────────┤
│    👛 vitalik.eth       │
│     0xabcd...ef01       │
│     [Edit] [Disconnect] │
├─────────────────────────┤
│  [+ Add Wallet]         │
└─────────────────────────┘
```

**Description:**
On mobile, the dropdown becomes a bottom sheet that slides up from the bottom of the screen.

---

### 12. Mobile View (Landscape)

**Visual Elements:**
- Compact selector in header
- Standard dropdown (not bottom sheet)
- Optimized for horizontal space

**Screenshot Placeholder:**
```
┌────────────────────────────────────────────────────┐
│  AlphaWhale Hunter        [👛 Trading Wallet ▼]  │
└────────────────────────────────────────────────────┘
```

---

### 13. Tablet View

**Visual Elements:**
- Medium-sized selector
- Standard dropdown
- Responsive to screen width

**Screenshot Placeholder:**
```
┌──────────────────────────────────────────┐
│  AlphaWhale Hunter  [👛 Trading Wallet ▼]│
└──────────────────────────────────────────┘
```

---

### 14. Dark Mode

**Visual Elements:**
- Dark background (#1a1a1a)
- Light text (#ffffff)
- Subtle borders (#333333)
- Adjusted shadows
- Same layout as light mode

**Screenshot Placeholder:**
```
┌────────────────────────────────────────┐
│  Connected Wallets                     │ (Dark bg)
├────────────────────────────────────────┤
│  ✓ 👛 Trading Wallet              ✏️ ⚡│ (Light text)
│     0x1234...5678                      │
└────────────────────────────────────────┘
```

---

### 15. Hover States

**Selector Button Hover:**
- Background: Slightly lighter/darker
- Cursor: Pointer
- Subtle scale animation (1.02x)

**Wallet Entry Hover:**
- Background: Light gray (light mode) / Darker gray (dark mode)
- Edit/Disconnect icons appear
- Cursor: Pointer

**Add Wallet Button Hover:**
- Background: Primary color (blue)
- Text: White
- Cursor: Pointer

---

### 16. Focus States (Keyboard Navigation)

**Visual Elements:**
- Blue outline (2px solid)
- Offset: 2px
- Visible focus indicator
- Matches WCAG AA standards

**Screenshot Placeholder:**
```
┌────────────────────────────────────────┐
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ ✓ 👛 Trading Wallet          ✏️ ⚡┃  │ ← Blue outline
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│     0x1234...5678                      │
└────────────────────────────────────────┘
```

---

### 17. Disabled State

**Visual Elements:**
- Grayed out appearance
- Reduced opacity (0.5)
- No hover effects
- Cursor: not-allowed

**Screenshot Placeholder:**
```
┌──────────────────────────┐
│ 👛 Trading Wallet    ▼  │ (Grayed out)
└──────────────────────────┘
```

**Description:**
Selector is disabled during critical operations or when no wallets are available.

---

### 18. Tooltip on Hover

**Visual Elements:**
- Dark background
- White text
- Rounded corners
- Arrow pointing to element
- Appears after 500ms hover

**Screenshot Placeholder:**
```
┌────────────────────────────────────────┐
│  👛 Trading Wallet                ✏️ ⚡│
│     0x1234...5678                      │
└────────────────────────────────────────┘
              ▲
    ┌─────────────────────┐
    │ Full address:       │
    │ 0x1234567890abcdef  │
    └─────────────────────┘
```

**Description:**
Hovering over a truncated address shows the full address in a tooltip.

---

### 19. Empty State (No Wallets)

**Visual Elements:**
- Empty state illustration
- "No wallets connected" message
- "Connect Wallet" CTA button
- Helpful text

**Screenshot Placeholder:**
```
┌────────────────────────────────────────┐
│           👛                           │
│                                        │
│     No wallets connected               │
│                                        │
│  Connect a wallet to see personalized  │
│  opportunities and eligibility         │
│                                        │
│     [Connect Wallet]                   │
└────────────────────────────────────────┘
```

---

### 20. Maximum Wallets Reached

**Visual Elements:**
- "Add Wallet" button disabled
- Tooltip: "Maximum 10 wallets"
- Suggestion to disconnect unused wallets

**Screenshot Placeholder:**
```
┌────────────────────────────────────────┐
│  [+ Add Wallet] (disabled)             │
│     ▲                                  │
│     └─ Maximum 10 wallets reached     │
└────────────────────────────────────────┘
```

---

## Interaction Flows

### Flow 1: Connecting First Wallet

```
1. [Connect Wallet] button
   ↓ Click
2. Wallet connection modal
   ↓ Select provider
3. Wallet extension popup
   ↓ Approve
4. [👛 0x1234...5678 ▼] selector appears
```

### Flow 2: Adding Second Wallet

```
1. [👛 Trading Wallet ▼] selector
   ↓ Click
2. Dropdown opens
   ↓ Click [+ Add Wallet]
3. Wallet connection modal
   ↓ Select different provider
4. Wallet extension popup
   ↓ Approve
5. New wallet appears in dropdown
```

### Flow 3: Switching Wallets

```
1. [👛 Trading Wallet ▼] selector
   ↓ Click
2. Dropdown opens
   ↓ Click different wallet
3. Loading spinner appears
   ↓ Wait ~500ms
4. Feed refreshes with new wallet
5. Eligibility updates
6. Dropdown closes
```

### Flow 4: Setting Custom Label

```
1. [👛 0x1234...5678 ▼] selector
   ↓ Click
2. Dropdown opens
   ↓ Click edit icon (✏️)
3. Inline text input appears
   ↓ Type "Trading Wallet"
4. Click save (✓)
   ↓ Label saved
5. [👛 Trading Wallet ▼] selector updates
```

### Flow 5: Disconnecting Wallet

```
1. [👛 Trading Wallet ▼] selector
   ↓ Click
2. Dropdown opens
   ↓ Click disconnect icon (⚡) on non-active wallet
3. Confirmation modal
   ↓ Confirm
4. Wallet removed from list
5. Dropdown updates
```

## Accessibility Features

### Screen Reader Announcements

- "Wallet selector button, Trading Wallet, 0x1234...5678"
- "Dropdown menu, 3 wallets connected"
- "Active wallet: Trading Wallet"
- "Edit label for Trading Wallet"
- "Disconnect wallet 0x1234...5678"

### Keyboard Navigation

- `Tab`: Focus selector
- `Enter/Space`: Open dropdown
- `Arrow Up/Down`: Navigate wallets
- `Enter`: Select wallet
- `Escape`: Close dropdown
- `Tab`: Navigate to edit/disconnect buttons

### ARIA Labels

```html
<button
  aria-label="Wallet selector, Trading Wallet selected"
  aria-expanded="false"
  aria-haspopup="listbox"
>
  <span aria-hidden="true">👛 Trading Wallet ▼</span>
</button>

<div role="listbox" aria-label="Connected wallets">
  <div
    role="option"
    aria-selected="true"
    aria-label="Trading Wallet, 0x1234...5678, active"
  >
    ✓ 👛 Trading Wallet
  </div>
</div>
```

## Color Palette

### Light Mode

- Background: `#ffffff`
- Text: `#1a1a1a`
- Border: `#e5e5e5`
- Hover: `#f5f5f5`
- Active: `#e0f2fe`
- Primary: `#0ea5e9`

### Dark Mode

- Background: `#1a1a1a`
- Text: `#ffffff`
- Border: `#333333`
- Hover: `#2a2a2a`
- Active: `#1e3a5f`
- Primary: `#38bdf8`

## Typography

- Font Family: Inter, system-ui, sans-serif
- Selector Button: 14px, 500 weight
- Wallet Label: 14px, 500 weight
- Wallet Address: 12px, 400 weight
- Dropdown Header: 12px, 600 weight, uppercase

## Spacing

- Selector padding: 12px 16px
- Dropdown padding: 16px
- Wallet entry padding: 12px 16px
- Gap between wallets: 8px
- Icon spacing: 8px

## Animation

- Dropdown open/close: 200ms ease-in-out
- Hover effects: 150ms ease
- Loading spinner: 1s linear infinite
- Wallet switch: 300ms ease

## Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1279px
- Desktop: ≥ 1280px

## Screenshot Checklist

When adding actual screenshots, capture:

- [ ] No wallet connected state
- [ ] Single wallet connected
- [ ] Dropdown with multiple wallets
- [ ] Active wallet indicator
- [ ] Label editor in action
- [ ] Loading state (connecting)
- [ ] Loading state (switching)
- [ ] ENS name displayed
- [ ] Error state
- [ ] Mobile view (portrait)
- [ ] Mobile view (landscape)
- [ ] Tablet view
- [ ] Dark mode
- [ ] Hover states
- [ ] Focus states (keyboard)
- [ ] Empty state
- [ ] Maximum wallets reached
- [ ] Tooltip on hover
- [ ] Full interaction flow (video/GIF)

## Notes for Screenshot Creation

1. Use consistent browser (Chrome recommended)
2. Set viewport to standard sizes (1920x1080, 768x1024, 375x667)
3. Use demo wallets with recognizable addresses
4. Include both light and dark mode versions
5. Annotate screenshots with arrows and labels
6. Create animated GIFs for interaction flows
7. Ensure high resolution (2x for retina displays)
8. Compress images for web (WebP format)
9. Add alt text for accessibility
10. Store in `/docs/images/wallet-selector/` directory
