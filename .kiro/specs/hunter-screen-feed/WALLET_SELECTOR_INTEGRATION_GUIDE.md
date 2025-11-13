# WalletSelector Integration Verification Guide

## Quick Visual Check

### Desktop View (≥640px)
Open the Hunter page and verify:

1. **Header Layout**
   ```
   [Logo] Hunter 🧠 ... [WalletSelector] [Theme Toggle] [Demo/Live] [AI Digest]
   ```
   - WalletSelector should be visible between the left content and theme toggle
   - Proper spacing (gap-3) between all elements
   - No layout shifts or overlapping

2. **WalletSelector States**
   
   **No Wallets Connected:**
   ```
   [Connect Wallet] button displayed
   ```
   
   **Wallet Connected:**
   ```
   [Wallet Icon] [Label/ENS] [0x1234...5678] [▼]
   ```

3. **Dropdown Behavior**
   - Click WalletSelector to open dropdown
   - Dropdown should appear ABOVE header (z-100 > z-50)
   - No clipping of dropdown content
   - Dropdown should align to the right edge of the button

### Mobile View (<640px)
Open DevTools and set viewport to mobile:

1. **Header Layout**
   ```
   [Logo] Hunter 🧠 ... [Theme Toggle] [Demo/Live] [AI Digest]
   ```
   - WalletSelector should be HIDDEN
   - All other controls visible and functional
   - No layout shifts

## Detailed Testing Steps

### 1. Initial Load (No Wallet)
- [ ] Open `/hunter` page
- [ ] Verify "Connect Wallet" button visible on desktop
- [ ] Verify button hidden on mobile (<640px)
- [ ] Click "Connect Wallet" button
- [ ] Verify wallet connection modal opens

### 2. Single Wallet Connected
- [ ] Connect a wallet
- [ ] Verify WalletSelector shows:
  - Wallet icon (MetaMask/WalletConnect/etc.)
  - Wallet label or ENS name
  - Truncated address (0x1234...5678)
  - Dropdown chevron
- [ ] Verify proper spacing maintained
- [ ] Verify no layout shift occurred

### 3. Dropdown Interaction
- [ ] Click WalletSelector
- [ ] Verify dropdown opens smoothly
- [ ] Verify dropdown appears above header
- [ ] Verify dropdown content:
  - "Connected Wallets" label
  - Active wallet with checkmark
  - "Connect New Wallet" button
- [ ] Click outside dropdown
- [ ] Verify dropdown closes
- [ ] Press ESC key
- [ ] Verify dropdown closes

### 4. Multiple Wallets
- [ ] Connect second wallet
- [ ] Open dropdown
- [ ] Verify both wallets listed
- [ ] Verify active wallet has checkmark
- [ ] Click inactive wallet
- [ ] Verify smooth transition to new wallet
- [ ] Verify feed refreshes with new wallet data

### 5. Theme Switching
- [ ] With WalletSelector visible, click theme toggle
- [ ] Verify WalletSelector theme updates smoothly
- [ ] Verify dropdown theme updates (if open)
- [ ] Test both light and dark themes

### 6. Responsive Behavior
- [ ] Start at desktop width (≥640px)
- [ ] Verify WalletSelector visible
- [ ] Slowly resize to mobile (<640px)
- [ ] Verify WalletSelector disappears at breakpoint
- [ ] Verify no layout shift or jumping
- [ ] Resize back to desktop
- [ ] Verify WalletSelector reappears smoothly

### 7. Z-Index Layering
- [ ] Open WalletSelector dropdown
- [ ] Scroll page down
- [ ] Verify header stays sticky (z-50)
- [ ] Verify dropdown stays above header (z-100)
- [ ] Open another modal/drawer
- [ ] Verify proper layering hierarchy

### 8. Keyboard Navigation
- [ ] Tab to WalletSelector
- [ ] Verify focus ring visible
- [ ] Press Enter/Space
- [ ] Verify dropdown opens
- [ ] Tab through dropdown items
- [ ] Verify focus moves correctly
- [ ] Press ESC
- [ ] Verify dropdown closes and focus returns

### 9. Touch Interaction (Mobile)
- [ ] On mobile device or touch emulation
- [ ] Verify WalletSelector hidden
- [ ] Switch to desktop view
- [ ] Tap WalletSelector
- [ ] Verify dropdown opens
- [ ] Verify touch targets ≥44px
- [ ] Tap outside to close
- [ ] Verify dropdown closes

### 10. Edge Cases
- [ ] Very long ENS name
  - Verify truncation works
  - Verify no overflow
- [ ] Many connected wallets (5+)
  - Verify dropdown scrolls
  - Verify no layout issues
- [ ] Slow network
  - Verify loading states
  - Verify no layout shift
- [ ] Wallet disconnection
  - Verify smooth transition to "Connect Wallet"
  - Verify no errors

## Common Issues to Check

### Layout Issues
- ❌ WalletSelector overlapping other elements
- ❌ Inconsistent spacing between header elements
- ❌ Layout shift when dropdown opens
- ❌ Dropdown clipped by header or viewport

### Z-Index Issues
- ❌ Dropdown appearing behind header
- ❌ Dropdown appearing behind other modals
- ❌ Header not staying sticky

### Responsive Issues
- ❌ WalletSelector visible on mobile
- ❌ Layout breaking at breakpoints
- ❌ Horizontal scroll appearing

### Theme Issues
- ❌ WalletSelector not updating with theme
- ❌ Dropdown theme mismatch
- ❌ Poor contrast in light/dark mode

## Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS/iOS)
- [ ] Mobile browsers (iOS Safari, Chrome Android)

## Performance Check

- [ ] No console errors
- [ ] No console warnings
- [ ] Smooth animations (60fps)
- [ ] No layout thrashing
- [ ] Fast dropdown open/close

## Accessibility Check

- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader announces correctly
- [ ] ARIA labels present
- [ ] Touch targets ≥44px
- [ ] Color contrast meets AA standards

## Success Criteria

All checkboxes above should be checked ✅

If any issues found:
1. Document the issue
2. Note browser/device
3. Include screenshots
4. Report to development team

## Quick Fix Reference

### WalletSelector Not Visible
- Check `hidden sm:flex` classes applied
- Verify viewport width ≥640px
- Check WalletContext provider wrapping

### Dropdown Behind Header
- Verify dropdown has `z-[100]` class
- Verify header has `z-50` class
- Check no parent elements with lower z-index

### Layout Shift
- Verify fixed widths where needed
- Check flex-shrink-0 on icons
- Verify min-w-0 on truncating elements

### Theme Not Updating
- Verify WalletSelector receives theme context
- Check dark: classes in component
- Verify theme toggle updates state

## Contact

For issues or questions:
- Check `.kiro/specs/hunter-screen-feed/TASK_44_COMPLETION.md`
- Review `src/components/hunter/WalletSelector.README.md`
- See `src/components/hunter/WalletSelector.example.tsx`
