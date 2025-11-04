# 🎯 Guardian Multi-Wallet Management Feature

## Overview
The Guardian now supports managing and monitoring **multiple wallets simultaneously**. Users can save wallet addresses, label them, and easily switch between them for scanning.

## ✨ Key Features

### 1. **Save Multiple Wallets**
- Add unlimited wallet addresses with optional custom labels
- Stored locally in browser localStorage
- Persist across sessions

### 2. **Quick Wallet Switching**
- Click any saved wallet to instantly switch and rescan
- Visual indicator shows which wallet is currently active
- No need to reconnect wallet each time

### 3. **Wallet Labels**
- Add friendly names like "Main Wallet", "Trading Account", "Cold Storage"
- Labels appear alongside addresses for easy identification
- Optional feature - works fine without labels

### 4. **Mix Connected & Saved Wallets**
- Connect your MetaMask wallet for signing capabilities
- Add other wallets for read-only monitoring
- Priority: Selected > Connected > First Saved

### 5. **Easy Management**
- Remove wallets with a single click
- Clean, organized list interface
- Scrollable list for many wallets

## 🎨 UI Components

### Active Wallet Display
```
┌─────────────────────────────────┐
│  ACTIVE WALLET • My Main Wallet │
│  0x1234...5678                  │
└─────────────────────────────────┘
```

### Saved Wallets List
```
┌─────────────────────────────────┐
│ SAVED WALLETS (3)               │
├─────────────────────────────────┤
│ 💙 Trading Account        ✕     │
│    0xabcd...ef01                │
├─────────────────────────────────┤
│ 💙 Cold Storage          ✕     │
│    0x9876...5432                │
└─────────────────────────────────┘
```

### Add Wallet Form
```
┌─────────────────────────────────┐
│ Add New Wallet                  │
├─────────────────────────────────┤
│ Label (optional)                │
│ [My Trading Wallet]             │
│                                 │
│ 0x... wallet address            │
│ [0xabcdef...]                   │
│                                 │
│ [  Save  ] [ Cancel ]           │
└─────────────────────────────────┘
```

## 🚀 Usage Guide

### Adding a Wallet

1. **Click "➕ Add Wallet"** button
2. **Enter optional label** (e.g., "Trading Account")
3. **Paste wallet address** (must start with 0x and be 42 characters)
4. **Click "Save"**
5. **Wallet is automatically selected** and scanned

### Switching Wallets

1. **View your saved wallets** in the list
2. **Click any wallet card** to switch to it
3. **Active wallet is highlighted** with primary color
4. **Guardian automatically rescans** the selected wallet

### Connecting Your Wallet

1. **Click "🔗 Connect"** button
2. **Select MetaMask** (or other wallet) from RainbowKit modal
3. **Connected wallet takes priority** over saved selections
4. **"✕ Disconnect" button** appears when connected

### Removing a Wallet

1. **Find the wallet** in your saved list
2. **Click the "✕" button** on the right side
3. **Wallet is removed** from storage
4. **If active, switches to next available wallet**

## 💾 Data Storage

### LocalStorage Schema
```typescript
interface SavedWallet {
  address: string;        // Ethereum address (0x...)
  label?: string;         // Optional friendly name
  addedAt: number;        // Timestamp in ms
}
```

### Storage Key
```
guardian_saved_wallets
```

### Data Persistence
- ✅ Survives browser refresh
- ✅ Survives browser restart
- ❌ Cleared if browser data is cleared
- ❌ Not synced across devices (local only)

## 🎯 Priority System

The Guardian determines which wallet to scan using this priority:

1. **Selected Wallet** (from saved list) - highest priority
2. **Connected Wallet** (MetaMask/WalletConnect)
3. **First Saved Wallet** (if nothing else selected)
4. **None** (shows connect prompt)

## 🎨 Visual Features

### Active Wallet Indicator
- **Primary color border** (2px solid)
- **Background tint** matching primary color
- **"Active Wallet" label** with optional name

### Wallet Cards
- **Hover effects** - subtle background change
- **Click to select** - instant visual feedback
- **Monospace font** for addresses
- **Remove button** appears on hover
- **Label displayed** above address if set

### Buttons
- **➕ Add Wallet** - Primary color, opens form
- **🔗 Connect** - Green, opens RainbowKit
- **✕ Disconnect** - Red, disconnects wallet
- **All buttons** have smooth hover animations

### Responsive Design
- **Desktop**: Wide layout with all controls visible
- **Mobile**: Stacked layout, optimized for touch
- **Max-width**: 90vw to prevent overflow
- **Scrollable list**: For many saved wallets

## 🔒 Security Notes

### Read-Only Access
- Saved wallets are **read-only** by default
- Can view balances, approvals, and risks
- **Cannot sign transactions** unless connected

### No Private Keys
- System **never stores** private keys
- Only public addresses saved
- Safe to add any wallet address

### Local Storage Only
- Wallets stored in **browser localStorage**
- **Not sent to servers**
- **Privacy-preserving** design

## 📱 Mobile Experience

### Touch-Optimized
- Large touch targets (44px minimum)
- Smooth scroll for wallet list
- Responsive text sizing

### Mobile Layout
```
┌──────────────────────┐
│  🔒 Wallet Connected │
├──────────────────────┤
│ ACTIVE WALLET        │
│ 0x1234...5678        │
├──────────────────────┤
│ SAVED WALLETS (2)    │
│ • Trading ✕          │
│ • Cold Storage ✕     │
├──────────────────────┤
│ [➕ Add Wallet]      │
│ [🔗 Connect]         │
└──────────────────────┘
```

## 🎓 Use Cases

### Portfolio Manager
```
Save all client wallets
Switch between them quickly
Monitor risks across portfolio
```

### Multi-Account User
```
Personal wallet
Trading account
DeFi farming wallet
NFT collection wallet
```

### Team/DAO
```
Treasury wallet
Operations wallet
Marketing wallet
Development wallet
```

### Security Auditor
```
Watch list of risky wallets
Monitor for suspicious activity
Track token approvals
```

## 🐛 Error Handling

### Invalid Address Format
```
alert('Invalid wallet address format')
```
- Must start with 0x
- Must be exactly 42 characters
- Must be hexadecimal

### Duplicate Wallet
```
alert('This wallet is already saved')
```
- Prevents adding same address twice
- Case-insensitive comparison

### Empty Address
```
(disabled state on Save button)
```
- Form validation prevents empty submissions

## 🔄 State Management

### React State
```typescript
const [savedWallets, setSavedWallets] = useState<SavedWallet[]>([]);
const [selectedWalletAddress, setSelectedWalletAddress] = useState<string | null>(null);
const [showWalletManager, setShowWalletManager] = useState(false);
const [newWalletAddress, setNewWalletAddress] = useState('');
const [newWalletLabel, setNewWalletLabel] = useState('');
```

### Effects
- **Auto-save to localStorage** when savedWallets changes
- **Auto-load from localStorage** on component mount
- **Auto-scan** when selectedWalletAddress changes

## 🎯 Future Enhancements (Potential)

### Cloud Sync
- Sync wallets across devices
- Requires backend integration
- Optional user accounts

### Import/Export
- Export wallet list as JSON
- Import from file
- Share with team members

### Wallet Groups
- Organize wallets into folders
- Tag wallets by category
- Filter by tags

### Historical Tracking
- Track trust score over time
- Alert on score changes
- Compare wallet risk levels

### Bulk Operations
- Scan all wallets at once
- Export combined report
- Batch alerts

## 📚 Technical Implementation

### Files Modified
- `src/pages/GuardianUX2Pure.tsx` - Main component with multi-wallet logic

### Key Functions
```typescript
addWallet()           // Add new wallet to saved list
removeWallet(address) // Remove wallet from list
setSelectedWalletAddress(address) // Switch active wallet
```

### Storage Operations
```typescript
// Save to localStorage
localStorage.setItem('guardian_saved_wallets', JSON.stringify(savedWallets));

// Load from localStorage
const saved = localStorage.getItem('guardian_saved_wallets');
const wallets = saved ? JSON.parse(saved) : [];
```

### Address Priority Logic
```typescript
const address = selectedWalletAddress || connectedAddress || savedWallets[0]?.address || null;
```

## ✅ Testing Checklist

- [ ] Add wallet with label
- [ ] Add wallet without label
- [ ] Switch between saved wallets
- [ ] Remove wallet from list
- [ ] Connect MetaMask wallet
- [ ] Disconnect wallet
- [ ] Refresh page (persistence test)
- [ ] Add duplicate wallet (error handling)
- [ ] Add invalid address (validation)
- [ ] Add many wallets (scroll test)
- [ ] Mobile responsive test
- [ ] Dark/light theme test

## 🎉 Success Indicators

✅ Users can manage multiple wallets
✅ Quick switching between wallets
✅ Persistent across sessions
✅ Beautiful, intuitive UI
✅ Mobile-friendly design
✅ Secure read-only access
✅ No backend required
✅ Privacy-preserving

---

**Feature Status**: ✅ **COMPLETE**

**Created**: October 25, 2025
**Version**: 1.0
**Component**: Guardian Multi-Wallet Manager




