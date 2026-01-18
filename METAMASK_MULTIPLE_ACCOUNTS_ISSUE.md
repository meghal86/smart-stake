# MetaMask Multiple Accounts Issue & Solutions

## 🔍 **Problem Identified**

**User Report**: "I can see there are 3 accounts but here I don't see accounts"

**Root Cause**: MetaMask's security model only returns accounts that have been explicitly connected to your dApp. Even if you have 3 accounts in MetaMask, the dApp might only have access to 1 account.

## 🎯 **Why This Happens**

### **MetaMask's Account Permission System**
1. **`eth_accounts`** - Only returns accounts already connected to this dApp
2. **`eth_requestAccounts`** - Prompts user to connect accounts, but might only connect the active one
3. **Account isolation** - Each dApp needs explicit permission for each account

### **Common Scenarios**
- ✅ **MetaMask has 3 accounts**: Account 1, Account 2, Account 3
- ❌ **dApp only sees 1 account**: Only the one that was initially connected
- 🔒 **Other accounts need permission**: Must be explicitly connected

## ✅ **Solutions Implemented**

### **1. Enhanced Account Fetching**

I've updated the `MultiAccountSelector` to use a comprehensive approach:

```typescript
// Method 1: Get currently connected accounts
const ethAccounts = await window.ethereum.request({ method: 'eth_accounts' });

// Method 2: If only 1 account, request more access
if (ethAccounts.length <= 1) {
  const requestedAccounts = await window.ethereum.request({ 
    method: 'eth_requestAccounts' 
  });
}

// Method 3: If still only 1, force permission request
if (accounts.length <= 1) {
  await window.ethereum.request({
    method: 'wallet_requestPermissions',
    params: [{ eth_accounts: {} }]
  });
}
```

### **2. Better User Guidance**

Added helpful messages and a refresh button:
- Explains why only 1 account is showing
- Provides steps to connect more accounts
- "🔄 Refresh Accounts" button to retry

### **3. Debug Tools**

Created comprehensive testing tools:
- `test-metamask-all-accounts.html` - Tests different account fetching methods
- `test-metamask-accounts-debug.html` - General MetaMask debugging

## 🧪 **Testing & Debugging**

### **Step 1: Run the Debug Tool**
```bash
# Open this to test account fetching methods
open test-metamask-all-accounts.html
```

This will test:
- ✅ `eth_accounts` (current connected)
- ✅ `eth_requestAccounts` (request access)  
- ✅ `wallet_requestPermissions` (force permission)
- ✅ Combined approach (what the app uses)

### **Step 2: Check MetaMask Settings**

1. **Open MetaMask**
2. **Go to Settings** → **Connected Sites**
3. **Find your dApp** (localhost:3000 or your domain)
4. **Check connected accounts** - Should show all accounts you want to use

### **Step 3: Manual Account Connection**

If the automatic methods don't work:

1. **In MetaMask**: Switch to Account 2
2. **In your dApp**: Try "Add Wallet" → "MetaMask" again
3. **MetaMask should prompt**: "Connect Account 2?"
4. **Approve the connection**
5. **Repeat for Account 3**

## 🔧 **Manual Workaround**

If the enhanced fetching still doesn't work, you can manually connect each account:

### **Method A: Switch & Connect**
1. Switch to Account 2 in MetaMask
2. Click "Add Wallet" → "MetaMask" in your app
3. Approve the connection
4. Switch to Account 3 in MetaMask  
5. Click "Add Wallet" → "MetaMask" again
6. Approve the connection

### **Method B: Use Manual Address Input**
1. Click "Add Wallet" → "Manual Address"
2. Copy Account 2 address from MetaMask
3. Paste it as a watch-only wallet
4. Repeat for Account 3

## 📊 **Expected Results**

### **Before Fix**
```
MetaMask Accounts: 3 total
dApp Access: 1 account (0x794293...f1b43e)
MultiAccountSelector Shows: 1 account ✓ Added
Result: "Add 0 Accounts" (disabled)
```

### **After Fix**
```
MetaMask Accounts: 3 total  
dApp Access: 3 accounts (after permission request)
MultiAccountSelector Shows: 
- Account 1: 0x794293...f1b43e ✓ Added
- Account 2: 0xabcdef...123456 ☐ Available
- Account 3: 0x123456...abcdef ☐ Available
Result: "Add 2 Accounts" (enabled)
```

## 🎯 **Next Steps**

1. **Test the debug tool** to see which method works for your setup
2. **Try the enhanced MultiAccountSelector** (should now request permissions automatically)
3. **Use manual connection** if automatic methods fail
4. **Check MetaMask Connected Sites** to verify permissions

## 🔍 **Verification Commands**

In browser console, you can test:

```javascript
// Check currently connected accounts
await window.ethereum.request({ method: 'eth_accounts' })

// Request access to more accounts  
await window.ethereum.request({ method: 'eth_requestAccounts' })

// Force permission request
await window.ethereum.request({
  method: 'wallet_requestPermissions',
  params: [{ eth_accounts: {} }]
})
```

## 🎉 **Expected Outcome**

After applying these fixes, you should be able to:
- ✅ See all 3 MetaMask accounts in the MultiAccountSelector
- ✅ Select multiple accounts to add
- ✅ Add "MetaMask Account 1", "MetaMask Account 2", "MetaMask Account 3"
- ✅ Have all accounts persist in your wallet registry

The key is getting MetaMask to grant your dApp permission to access all accounts, not just the initially connected one! 🔐