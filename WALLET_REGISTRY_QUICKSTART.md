# Multi-Wallet Registry — Quick Start

> ⚡ Get up and running with the multi-wallet system in 5 minutes

## 🚀 One-Command Setup

```bash
chmod +x setup-wallet-registry.sh
./setup-wallet-registry.sh
```

This will:
- ✅ Apply database migrations
- ✅ Deploy edge function
- ✅ Set up cron jobs
- ✅ Verify installation

---

## 🎯 Immediate Integration

### Step 1: Update Your Guardian Route

```tsx
// In App.tsx or your router file
import GuardianRegistry from '@/pages/GuardianRegistry'

// Replace old Guardian with:
<Route path="/guardian" element={<GuardianRegistry />} />
```

### Step 2: Add Wallet Management to Any Page

```tsx
import { useWalletRegistry } from '@/hooks/useWalletRegistry'
import { AddWalletModal } from '@/components/wallet/AddWalletModal'
import { WalletList } from '@/components/wallet/WalletList'

function YourPage() {
  const { wallets } = useWalletRegistry()
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      <button onClick={() => setShowModal(true)}>
        ➕ Add Wallet
      </button>
      
      <WalletList />
      
      <AddWalletModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  )
}
```

### Step 3: Test It!

1. **Go to Guardian page**
2. **Click "Add Wallet"**
3. **Choose "Connect Wallet" or "Enter Address"**
4. **Wallet appears in list** ✅
5. **Refresh page** — wallet still there! ✅

---

## 🧩 Key Hooks

### `useWalletRegistry()` — Manage wallets
```tsx
const { wallets, addWallet, removeWallet } = useWalletRegistry()
```

### `useAggregatedPortfolio()` — Portfolio data
```tsx
const { portfolio } = useAggregatedPortfolio()
// portfolio.totalBalanceUSD, portfolio.topTokens, etc.
```

---

## 🔧 Manual Migration (if needed)

If you have existing localStorage wallets:

```tsx
useEffect(() => {
  const saved = localStorage.getItem('guardian_saved_wallets')
  if (saved) {
    const oldWallets = JSON.parse(saved)
    for (const wallet of oldWallets) {
      addWallet({ 
        address: wallet.address, 
        label: wallet.label 
      })
    }
    localStorage.removeItem('guardian_saved_wallets')
  }
}, [])
```

---

## 📊 Verify Cron Jobs

```sql
-- Check scheduled scans
SELECT * FROM cron.job WHERE jobname LIKE 'wallet-registry%';

-- View recent scan runs
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

---

## 🐛 Quick Fixes

### Wallets not showing?
```tsx
// Check auth state
const { data: { user } } = await supabase.auth.getUser()
console.log('User:', user?.id)

// Check wallets
const { data } = await supabase.from('user_wallets').select('*')
console.log('Wallets:', data)
```

### Edge function not working?
```bash
# Check logs
supabase functions logs wallet-registry-scan --tail

# Test locally
supabase functions serve wallet-registry-scan
```

---

## 🎉 What You Get

✅ **Persistent wallets** — survive browser clears  
✅ **Auto-scanning** — every hour + on-demand  
✅ **Multi-wallet Guardian** — monitor all at once  
✅ **Portfolio aggregation** — unified balance view  
✅ **Watch-only mode** — no wallet connection needed  

---

## 📖 Full Documentation

For advanced usage, see:
- **`MULTI_WALLET_REGISTRY_GUIDE.md`** — Complete reference
- **`GUARDIAN_COMPLETION_ROADMAP.md`** — System architecture

---

**Built with ❤️ for AlphaWhale**  
October 2025



