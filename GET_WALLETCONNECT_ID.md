# 🔑 Get WalletConnect Project ID (2 minutes)

## Why You Need It
- `demo-project-id` is rejected by WalletConnect servers
- Causes 403/400 errors in console
- Prevents QR code scanning for mobile wallets
- **Free for unlimited usage!**

---

## 📝 Steps to Get Real Project ID

### 1. Go to WalletConnect Cloud
**URL:** https://cloud.walletconnect.com

### 2. Sign Up / Log In
- Use GitHub, Google, or Email
- Free account (no credit card needed)

### 3. Create New Project
- Click **"+ New Project"**
- **Name:** AlphaWhale Guardian
- **Description:** DeFi wallet security scanner
- Click **"Create"**

### 4. Copy Project ID
- On your project dashboard
- Look for **"Project ID"**
- Click copy icon
- Should look like: `abc123def456...` (32 characters)

### 5. Update Your `.env`
Replace in `/Users/meghalparikh/Downloads/Whalepulse/smart-stake/.env`:

```bash
# Before
VITE_WALLETCONNECT_PROJECT_ID=demo-project-id

# After
VITE_WALLETCONNECT_PROJECT_ID=your-actual-project-id-here
```

### 6. Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## ✅ After Update

**Console should be clean:**
- ✅ No more 403/400 errors
- ✅ WalletConnect QR code works
- ✅ Mobile wallets can connect
- ✅ All warnings gone

---

## 🚀 Already Works Without It

**These still work perfectly right now:**
- ✅ MetaMask
- ✅ Coinbase Wallet  
- ✅ Brave Wallet
- ✅ Any injected wallet

**Only broken:**
- ❌ WalletConnect QR code scanning

---

**Time Required:** 2 minutes  
**Cost:** Free forever  
**Worth It:** Yes! ✨


