# WalletSelector Component

Multi-wallet selector component for the Hunter Screen that allows users to switch between connected wallets and connect new wallets.

## Features

- ✅ **Multi-Wallet Support**: Display and switch between multiple connected wallets
- ✅ **Wallet Icons**: Show provider-specific icons (MetaMask, WalletConnect, Coinbase, etc.)
- ✅ **Chain Indicators**: Display chain badges for each wallet
- ✅ **ENS Support**: Show ENS names when available, fallback to labels or truncated addresses
- ✅ **Active Wallet Indicator**: Checkmark on the currently active wallet
- ✅ **Tooltips**: Full address and balance on hover
- ✅ **Connect New Wallet**: Button to add additional wallets
- ✅ **Animations**: Smooth fade + slide animations for wallet icons
- ✅ **Responsive**: Icon-only mode on mobile, full display on desktop
- ✅ **Theme Support**: Light and dark theme variants
- ✅ **Accessibility**: Keyboard navigation, ARIA labels, screen reader support
- ✅ **Touch-Friendly**: Minimum 44px touch targets

## Usage

### Basic Usage

```tsx
import { WalletSelector } from '@/components/hunter/WalletSelector';

function Header() {
  return (
    <header>
      <WalletSelector />
    </header>
  );
}
```

### With Custom Styling

```tsx
<WalletSelector 
  className="ml-auto"
  showLabel={true}
  variant="default"
/>
```

### Compact Variant (Mobile)

```tsx
<WalletSelector 
  showLabel={false}
  variant="compact"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `undefined` | Additional CSS classes |
| `showLabel` | `boolean` | `true` | Show wallet label/ENS/address |
| `variant` | `'default' \| 'compact'` | `'default'` | Size variant |

## Component Structure

```
WalletSelector
├── Connect Button (no wallets)
│   └── "Connect Wallet" text
└── Dropdown Menu (with wallets)
    ├── Trigger Button
    │   ├── WalletIcon
    │   ├── Label/ENS/Address
    │   ├── Chain Badge
    │   └── Chevron Icon
    └── Dropdown Content
        ├── Wallet List
        │   └── Wallet Items
        │       ├── WalletIcon
        │       ├── Label/ENS
        │       ├── Truncated Address
        │       ├── Chain Badge
        │       └── Check Icon (active)
        └── Connect New Wallet Button
```

## Wallet Display Priority

The component displays wallet information in the following priority:

1. **ENS Name** (if available) - e.g., "vitalik.eth"
2. **Custom Label** (if set) - e.g., "Main Wallet"
3. **Truncated Address** - e.g., "0x1234...5678"

## Chain Badges

Supported chains with color-coded badges:

- **Ethereum**: Blue
- **Polygon**: Purple
- **Arbitrum**: Cyan
- **Optimism**: Red
- **Base**: Blue
- **BSC**: Yellow
- **Avalanche**: Red
- **Fantom**: Blue

## Tooltips

### Trigger Button Tooltip
Shows on hover over the wallet selector button:
- Wallet label/ENS
- Full wallet address

### Dropdown Item Tooltip
Shows on hover over wallet items in dropdown:
- Full wallet address
- Balance (if available)

## Animations

### Wallet Icon Entry
- **Initial**: `opacity: 0, x: -10`
- **Animate**: `opacity: 1, x: 0`
- **Duration**: 300ms
- **Easing**: ease-out

### Button Interactions
- **Hover**: `scale: 1.01-1.02`
- **Active**: `scale: 0.98-0.99`

### Chevron Rotation
- **Closed**: `rotate: 0deg`
- **Open**: `rotate: 180deg`

## Accessibility

### ARIA Attributes
- `aria-label="Select wallet"` on trigger button
- `aria-expanded` reflects dropdown state
- `aria-haspopup="menu"` indicates dropdown menu
- `role="menuitem"` on wallet items

### Keyboard Navigation
- **Tab**: Focus trigger button
- **Enter/Space**: Open dropdown
- **Arrow Keys**: Navigate wallet items
- **Escape**: Close dropdown
- **Enter**: Select wallet

### Screen Reader Support
- Wallet labels are announced
- Active wallet state is announced
- Chain information is announced
- All interactive elements have proper labels

## Responsive Behavior

### Desktop (≥1024px)
- Full wallet display with label, address, and chain
- Hover states and tooltips
- Larger touch targets

### Tablet (768px - 1023px)
- Compact display with smaller text
- Touch-friendly targets (44px minimum)

### Mobile (<768px)
- Icon-only mode (when `showLabel={false}`)
- Bottom sheet dropdown
- Large touch targets

## Theme Support

### Light Theme
- White background
- Gray borders
- Dark text
- Subtle hover states

### Dark Theme
- Dark gray background
- Lighter borders
- Light text
- Brighter hover states

## Integration with WalletContext

The component uses the `WalletContext` for state management:

```tsx
const {
  connectedWallets,    // Array of connected wallets
  activeWallet,        // Currently active wallet address
  setActiveWallet,     // Function to switch active wallet
  connectWallet,       // Function to connect new wallet
  disconnectWallet,    // Function to disconnect wallet
  isLoading,           // Loading state
} = useWallet();
```

## State Persistence

- Active wallet selection persists in `localStorage`
- Connected wallets list persists in `localStorage`
- State is restored on page reload
- Invalid state is cleared automatically

## Events

### Custom Events
The component emits a `walletConnected` event when a wallet is selected:

```typescript
window.addEventListener('walletConnected', (event) => {
  console.log('Wallet connected:', event.detail.address);
});
```

### Query Invalidation
When switching wallets, the following queries are invalidated:
- `hunter-feed` - Triggers feed refresh with new wallet
- `eligibility` - Triggers eligibility recalculation

## Error Handling

### No Ethereum Provider
Shows error message: "No Ethereum wallet detected. Please install MetaMask or another Web3 wallet."

### Connection Rejected
Logs error to console and maintains previous state.

### Network Errors
Gracefully handles network errors and maintains cached state.

## Testing

Comprehensive test coverage includes:
- Rendering with no wallets
- Rendering with connected wallets
- Wallet selection and switching
- Active wallet indicator
- Dropdown interactions
- Tooltips
- Connect new wallet functionality
- Responsive behavior
- Accessibility (keyboard navigation, ARIA)
- Theme support
- Animations
- Error handling

Run tests:
```bash
npm test -- src/__tests__/components/hunter/WalletSelector.test.tsx
```

## Requirements Satisfied

This component satisfies the following requirements from the Hunter Screen spec:

### Requirement 18: Multi-Wallet Selection & Switching
- ✅ 18.1: Wallet selector displayed in header
- ✅ 18.2: Dropdown shows all connected wallets
- ✅ 18.3: Wallet selection changes active wallet
- ✅ 18.9: Wallet label/ENS/address display
- ✅ 18.10: Full address tooltip on hover
- ✅ 18.11: Wallet removed from selector when disconnected
- ✅ 18.14: Responsive and touch-friendly
- ✅ 18.18: ENS name display priority
- ✅ 18.19: ENS fallback to label/address
- ✅ 18.20: Smooth transitions without flickering

## Related Components

- `WalletIcon` - Provider-specific wallet icons
- `WalletContext` - Wallet state management
- `ChainBadge` - Chain indicator badges (internal)
- `WalletDisplay` - Wallet information display (internal)

## Dependencies

- `@radix-ui/react-dropdown-menu` - Dropdown menu primitive
- `@radix-ui/react-tooltip` - Tooltip primitive
- `framer-motion` - Animations
- `lucide-react` - Icons
- `@tanstack/react-query` - Query invalidation

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

## Performance

- Lazy loading of dropdown content
- Memoized wallet display components
- Optimized re-renders with React Query
- Efficient localStorage operations

## Future Enhancements

- [ ] Wallet balance fetching and display
- [ ] Wallet nickname editing
- [ ] Wallet disconnection from dropdown
- [ ] Multi-chain balance aggregation
- [ ] Wallet activity indicators
- [ ] Custom wallet icons upload
- [ ] Wallet grouping/categorization

## License

Part of the AlphaWhale Hunter Screen feature.

## See Also

- [Requirements Document](.kiro/specs/hunter-screen-feed/requirements.md)
- [Design Document](.kiro/specs/hunter-screen-feed/design.md)
- [Tasks Document](.kiro/specs/hunter-screen-feed/tasks.md)
- [WalletContext Documentation](../../contexts/WalletContext.tsx)
