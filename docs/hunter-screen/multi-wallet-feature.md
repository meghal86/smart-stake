# Multi-Wallet Feature User Guide

## Overview

The Multi-Wallet feature allows you to connect and manage multiple cryptocurrency wallets within AlphaWhale Hunter Screen. This enables you to:

- View personalized opportunities for different wallets
- Switch between wallets seamlessly
- See eligibility previews for each wallet
- Manage custom labels for easy identification
- Track opportunities across your entire portfolio

## Getting Started

### Connecting Your First Wallet

1. Navigate to the Hunter Screen
2. Click the **"Connect Wallet"** button in the header
3. Select your preferred wallet provider:
   - MetaMask
   - WalletConnect
   - Coinbase Wallet
   - Other supported providers
4. Approve the connection in your wallet
5. Your wallet is now connected and active

### Connecting Additional Wallets

1. Click the **Wallet Selector** dropdown in the header (shows your current wallet)
2. Click **"Add Wallet"** at the bottom of the dropdown
3. Select a different wallet provider or account
4. Approve the connection
5. The new wallet is added to your list

**Note:** You can connect up to 10 wallets simultaneously.

## Using the Wallet Selector

### Wallet Selector Location

The Wallet Selector is located in the top-right corner of the Hunter Screen header, next to the user menu.

### Wallet Display Format

Each wallet in the selector shows:
- **ENS Name** (if available) - e.g., "vitalik.eth"
- **Custom Label** (if set) - e.g., "Trading Wallet"
- **Truncated Address** - e.g., "0x1234...5678"
- **Chain Icon** - Visual indicator of the primary chain

### Switching Between Wallets

1. Click the **Wallet Selector** dropdown
2. Browse your connected wallets
3. Click on the wallet you want to use
4. The feed automatically refreshes with personalized opportunities for that wallet
5. Eligibility previews update to reflect the selected wallet's status

**Keyboard Navigation:**
- Press `Tab` to focus the Wallet Selector
- Press `Enter` or `Space` to open the dropdown
- Use `Arrow Up/Down` to navigate wallets
- Press `Enter` to select a wallet
- Press `Escape` to close the dropdown

### Visual Indicators

- **Active Wallet:** Marked with a checkmark (✓) in the dropdown
- **Loading State:** Spinner shown while switching wallets
- **Hover State:** Full address displayed in tooltip

## Managing Wallet Labels

### Setting a Custom Label

1. Open the Wallet Selector dropdown
2. Hover over a wallet entry
3. Click the **Edit** icon (pencil) next to the wallet
4. Enter a custom label (e.g., "DeFi Wallet", "NFT Wallet", "Trading")
5. Press `Enter` or click **Save**
6. The label is saved locally and persists across sessions

### Label Best Practices

- Use descriptive names that help you identify the wallet's purpose
- Keep labels short (max 20 characters recommended)
- Examples:
  - "Main Wallet"
  - "Trading"
  - "DeFi Only"
  - "Cold Storage"
  - "Airdrop Hunter"

### Removing a Label

1. Open the Wallet Selector dropdown
2. Click the **Edit** icon next to the wallet
3. Clear the label text
4. Press `Enter` or click **Save**
5. The wallet will display its ENS name or truncated address

## ENS Name Resolution

### Automatic ENS Resolution

If your wallet has an associated ENS (Ethereum Name Service) name, it will be automatically resolved and displayed in the Wallet Selector.

**Display Priority:**
1. Custom Label (if set)
2. ENS Name (if available)
3. Truncated Address (fallback)

### ENS Name Benefits

- Easier wallet identification
- Professional appearance
- No need to set custom labels
- Automatically updates if ENS changes

## Personalized Feed Experience

### How Personalization Works

When you select a wallet, the Hunter Screen personalizes the opportunity feed based on:

- **Chain History:** Chains you've used with this wallet
- **Transaction Patterns:** Your activity level and preferences
- **Holdings:** Tokens and NFTs in the wallet
- **Completed Opportunities:** Past activities and claims
- **Saved Opportunities:** Items you've bookmarked

### Ranking Algorithm

Opportunities are ranked using:
- **60% Relevance:** Match to your wallet's profile
- **25% Trust Score:** Guardian security rating
- **15% Freshness/Urgency:** Time-sensitive opportunities

### Eligibility Previews

Each opportunity card shows your eligibility status:
- **Likely Eligible** (≥70% score): Green indicator
- **Maybe Eligible** (40-69% score): Yellow indicator
- **Unlikely Eligible** (<40% score): Red indicator
- **Unknown:** Unable to determine (no blockchain data)

**Eligibility Factors:**
- Wallet age (25% weight)
- Transaction count (20% weight)
- Holdings (15% weight)
- Chain presence (40% weight)
- Allowlist proofs (bonus)

## Wallet Switching Behavior

### What Happens When You Switch

1. **Feed Refresh:** Opportunities are re-ranked for the new wallet
2. **Eligibility Update:** All eligibility previews recalculate
3. **Saved Items:** Your saved opportunities remain accessible
4. **Filter Persistence:** Active filters are maintained
5. **Scroll Position:** Resets to top of feed

### Performance Optimization

- **Caching:** Wallet data is cached for 20 minutes
- **Prefetching:** Next wallet's data may be prefetched
- **Smooth Transitions:** Loading states prevent UI flicker
- **Fast Switching:** Typically completes in <500ms

## Mobile Experience

### Touch-Friendly Design

- **Minimum Touch Targets:** 44px for all interactive elements
- **Responsive Dropdown:** Adapts to screen size
- **Swipe Gestures:** Supported for closing dropdown
- **Bottom Sheet:** On small screens, dropdown opens as bottom sheet

### Mobile-Specific Features

- **Compact Display:** Optimized for small screens
- **Full Address on Tap:** Tap wallet to see full address
- **Quick Switch:** Swipe between wallets (coming soon)

## Troubleshooting

### Wallet Not Appearing in Selector

**Problem:** Connected wallet doesn't show in the dropdown

**Solutions:**
1. Refresh the page
2. Disconnect and reconnect the wallet
3. Check if wallet is still connected in your browser extension
4. Clear browser cache and reconnect
5. Try a different browser

### Eligibility Not Updating

**Problem:** Eligibility preview shows old data after switching wallets

**Solutions:**
1. Wait 5-10 seconds for cache to refresh
2. Scroll down and back up to trigger re-render
3. Refresh the page
4. Check if wallet is on the correct network

### ENS Name Not Showing

**Problem:** ENS name doesn't appear in Wallet Selector

**Solutions:**
1. Verify ENS is set correctly on Ethereum mainnet
2. Wait 1-2 minutes for resolution to complete
3. Refresh the page
4. Set a custom label as a workaround

### Wallet Selector Not Opening

**Problem:** Clicking the selector doesn't open the dropdown

**Solutions:**
1. Check if you have any wallets connected
2. Disable browser extensions that might interfere
3. Try keyboard navigation (Tab + Enter)
4. Refresh the page
5. Check browser console for errors

### Slow Wallet Switching

**Problem:** Switching wallets takes >5 seconds

**Solutions:**
1. Check your internet connection
2. Wait for blockchain data to sync
3. Clear browser cache
4. Reduce number of connected wallets
5. Try during off-peak hours

### Labels Not Saving

**Problem:** Custom labels disappear after refresh

**Solutions:**
1. Check if localStorage is enabled in your browser
2. Disable private/incognito mode
3. Check browser storage quota
4. Try a different browser
5. Contact support if issue persists

## Security & Privacy

### Data Storage

- **Wallet Addresses:** Hashed before storage (never stored in plain text)
- **Custom Labels:** Stored locally in your browser only
- **ENS Names:** Resolved on-demand, not stored
- **Session Data:** Cleared when you disconnect

### Privacy Protections

- **No Server Storage:** Labels never leave your device
- **Hashed Analytics:** Wallet addresses are salted and hashed
- **No Tracking:** We don't track which wallets you own
- **Local First:** All preferences stored in localStorage

### Security Best Practices

1. **Never Share Seeds:** We never ask for seed phrases or private keys
2. **Verify Connections:** Always check the connection prompt in your wallet
3. **Use Hardware Wallets:** For high-value wallets, use hardware security
4. **Regular Audits:** Review connected wallets periodically
5. **Disconnect Unused:** Remove wallets you no longer use

### What We Store

| Data Type | Storage Location | Encrypted | Retention |
|-----------|------------------|-----------|-----------|
| Wallet Address (hashed) | Server | Yes | Session only |
| Custom Labels | Browser localStorage | No | Until cleared |
| ENS Names | Not stored | N/A | Resolved on-demand |
| Active Wallet | Browser sessionStorage | No | Session only |
| Wallet Order | Browser localStorage | No | Until cleared |

### What We Don't Store

- ❌ Private keys or seed phrases
- ❌ Plain text wallet addresses (server-side)
- ❌ Transaction history
- ❌ Wallet balances
- ❌ Personal information linked to wallets

## Advanced Features

### Wallet Ordering

Wallets are displayed in the order you connected them. To reorder:
1. Disconnect wallets in the order you want
2. Reconnect them in your preferred order
3. The new order is saved automatically

### Bulk Actions (Coming Soon)

- Check eligibility across all wallets
- Compare opportunities side-by-side
- Export wallet comparison report

### Wallet Groups (Coming Soon)

- Create groups (e.g., "DeFi", "NFTs", "Trading")
- Assign wallets to groups
- Filter opportunities by group

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + W` | Open Wallet Selector |
| `Tab` | Navigate between wallets |
| `Enter` | Select highlighted wallet |
| `Escape` | Close Wallet Selector |
| `Arrow Up/Down` | Navigate wallet list |
| `1-9` | Quick switch to wallet by number |

## FAQ

### How many wallets can I connect?

You can connect up to 10 wallets simultaneously.

### Do I need to connect all my wallets?

No, only connect wallets you want to use for discovering opportunities.

### Can I use the same wallet on multiple devices?

Yes, but labels are stored locally per device.

### Will my labels sync across devices?

Not currently. Labels are stored in your browser's localStorage.

### Can I disconnect a wallet?

Yes, click the disconnect icon in the Wallet Selector dropdown.

### Does switching wallets cost gas?

No, switching wallets is free and doesn't require any blockchain transactions.

### Can I see opportunities for all wallets at once?

Not yet, but this feature is coming soon.

### What happens if I disconnect my active wallet?

The selector automatically switches to the first available wallet.

### Can I rename a wallet after connecting?

Yes, use the Edit icon in the Wallet Selector to set a custom label.

### Are my wallet addresses visible to other users?

No, wallet addresses are private and never shared with other users.

## Support

### Getting Help

- **Documentation:** [docs.alphawhale.com](https://docs.alphawhale.com)
- **Discord:** [discord.gg/alphawhale](https://discord.gg/alphawhale)
- **Email:** support@alphawhale.com
- **Twitter:** [@AlphaWhale](https://twitter.com/alphawhale)

### Reporting Issues

If you encounter a bug:
1. Check the troubleshooting section above
2. Clear browser cache and try again
3. Take a screenshot of the issue
4. Report via Discord or email with:
   - Browser and version
   - Steps to reproduce
   - Expected vs actual behavior
   - Console errors (if any)

## Changelog

### Version 1.0 (Current)
- Initial multi-wallet support
- Wallet Selector component
- Custom label management
- ENS name resolution
- Personalized feed per wallet
- Eligibility preview per wallet
- Keyboard navigation
- Mobile responsive design

### Coming Soon
- Wallet groups
- Bulk eligibility checks
- Wallet comparison view
- Cross-wallet analytics
- Label sync across devices
