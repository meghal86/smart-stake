# Manual MetaMask Multi-Account Connection Guide

## 🚨 **Current Issue**

You have 3 accounts in MetaMask, but the app is only showing 1 account even after refreshing. This is because **MetaMask only shares accounts that have been explicitly connected to each dApp**.

## 🎯 **The Solution: Manual Connection**

Since the automatic methods aren't working, we'll connect each account manually. This is actually the most reliable method.

## 📋 **Step-by-Step Instructions**

### **Step 1: Connect Account 2**

1. **Open MetaMask extension** (click the fox icon)
2. **Click the account circle** (top right) 
3. **Select "Account 2"** (switch to your second account)
4. **Go back to your app**
5. **Click "Add Wallet" → "MetaMask"**
6. **MetaMask will prompt**: "Connect Account 2 to this site?"
7. **Click "Connect"**
8. **The app should now show Account 2 as available to add**

### **Step 2: Connect Account 3**

1. **In MetaMask, switch to "Account 3"**
2. **Go back to your app**
3. **Click "Add Wallet" → "MetaMask"** again
4. **MetaMask will prompt**: "Connect Account 3 to this site?"
5. **Click "Connect"**
6. **The app should now show Account 3 as available to add**

### **Step 3: Verify All Accounts**

After connecting all accounts manually:

1. **Click "Add Wallet" → "MetaMask"**
2. **You should now see**:
   ```
   ☐ 0x794293...f1b43e - MetaMask Account 1 - ✓ Added
   ☑ 0xabcdef...123456 - MetaMask Account 2 - 1.234 ETH
   ☑ 0x123456...abcdef - MetaMask Account 3 - 0.567 ETH
   
   [Cancel] [Add 2 Accounts] ← Now enabled!
   ```

## 🔍 **Why This Happens**

### **MetaMask's Security Model**
- Each website/dApp needs **explicit permission** for each account
- By default, MetaMask only connects the **currently active account**
- Other accounts remain **private** until you explicitly connect them

### **This is Normal Behavior**
- ✅ **Security feature**: Prevents websites from seeing all your accounts
- ✅ **Privacy protection**: You control which accounts each site can access
- ✅ **Standard practice**: Most dApps require manual connection of multiple accounts

## 🛠️ **Alternative: Check MetaMask Settings**

If manual connection doesn't work, check your MetaMask settings:

### **Method 1: Connected Sites**
1. **Open MetaMask** → **Settings** → **Connected Sites**
2. **Find your app** (localhost:3000 or your domain)
3. **Click on it** to see connected accounts
4. **If only 1 account is listed**, that's why the app only sees 1 account

### **Method 2: Site Permissions**
1. **While on your app**, click the **MetaMask extension**
2. **Click the 3 dots** (top right) → **Connected Sites**
3. **See which accounts are connected**
4. **Manually connect more accounts** if needed

## 🎯 **Expected Result**

After manually connecting all accounts, you should have:

### **In MetaMask Connected Sites:**
```
Your App (localhost:3000)
Connected Accounts: 3
- Account 1 (0x794293...)
- Account 2 (0xabcdef...)  
- Account 3 (0x123456...)
```

### **In Your App:**
```
Connected Wallets: 4 total
- MetaMask Account 1 (0x794293...)
- MetaMask Account 2 (0xabcdef...)
- MetaMask Account 3 (0x123456...)
- [Any other wallets you've added]
```

## 🚀 **Quick Test**

To verify it's working:

1. **Switch between accounts in MetaMask**
2. **Each account should be recognized by your app**
3. **You should be able to select any account as active**
4. **All accounts should persist after sign-out/sign-in**

## 💡 **Pro Tips**

### **Faster Manual Connection**
- Keep MetaMask extension **pinned** to your browser toolbar
- **Switch accounts quickly** using the account dropdown
- **Connect accounts in order** (Account 1, 2, 3) for better organization

### **Verify Connection**
- After connecting each account, **check the wallet list** in your app
- **Each account should appear** with proper labeling
- **Balances should load** for each account

## 🎉 **Success Indicators**

You'll know it's working when:
- ✅ **MultiAccountSelector shows multiple accounts**
- ✅ **"Add X Accounts" button is enabled**
- ✅ **All accounts appear in your wallet list**
- ✅ **You can switch between accounts**
- ✅ **Accounts persist across sessions**

This manual method is actually **more reliable** than automatic detection and gives you **full control** over which accounts each dApp can access! 🔐