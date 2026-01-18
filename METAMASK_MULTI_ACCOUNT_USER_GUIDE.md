# 🦊 MetaMask Multi-Account User Guide

## 🎯 Your Issue: "I have 3 accounts but only see 1"

**You're experiencing this because:** MetaMask only shares accounts that have been explicitly connected to AlphaWhale. Even though you have 3 accounts in MetaMask, AlphaWhale can only see the accounts you've given permission to.

**This is normal and by design** - it's a MetaMask security feature to protect your privacy.

## ✅ Solution: Manual Connection Process

### Step 1: Connect Account 2

1. **Open MetaMask extension** (click the fox icon in your browser)
2. **Click the account dropdown** at the top of MetaMask
3. **Select "Account 2"** from the list
4. **In AlphaWhale:** Click your profile picture → "Add Wallet" → "MetaMask"
5. **Approve the connection** in the MetaMask popup
6. **Account 2 is now added!** ✅

### Step 2: Connect Account 3

1. **In MetaMask:** Switch to "Account 3"
2. **In AlphaWhale:** Click your profile picture → "Add Wallet" → "MetaMask"
3. **Approve the connection** in the MetaMask popup
4. **Account 3 is now added!** ✅

### Step 3: Verify All Accounts

1. **Click your profile picture** in AlphaWhale
2. **You should now see all 3 accounts** in the dropdown:
   - 🦊 MetaMask Account 1
   - 🦊 MetaMask Account 2  
   - 🦊 MetaMask Account 3
3. **Click any account** to switch between them

## 🧪 Test Your Setup

**Open this test file in your browser:** `test-metamask-multi-account-final.html`

The test will:
- ✅ Detect your MetaMask accounts
- ✅ Show you the connection process
- ✅ Verify all accounts are working

## ❓ Troubleshooting

### "I only see 1 account in the Add Wallet modal"

**This is expected!** The modal will show educational instructions:

```
🔒 MetaMask is only sharing 1 account with this app

📋 Manual Solution:
1. Switch to Account 2 in MetaMask extension
2. Close this modal and click "Add Wallet" → "MetaMask" again  
3. Approve the connection for Account 2
4. Repeat for Account 3
```

### "Manual switching in MetaMask doesn't work"

**Correct!** Just switching accounts in MetaMask doesn't automatically add them to AlphaWhale. You need to:
1. Switch in MetaMask
2. Use "Add Wallet" → "MetaMask" in AlphaWhale
3. Approve the new connection

### "I get an error when adding accounts"

**Check these:**
- ✅ MetaMask is unlocked
- ✅ You're on the correct account in MetaMask
- ✅ You approve the connection popup
- ✅ You have the latest MetaMask version

## 🎉 Final Result

After following the process, you'll have:

```
Your Wallet Registry:
├── 🦊 MetaMask Account 1: 0x7942...b43E
├── 🦊 MetaMask Account 2: 0xD65f...8c2  
└── 🦊 MetaMask Account 3: 0x[your third account]

✅ All accounts persist between sessions
✅ You can switch between accounts in AlphaWhale
✅ Each account works independently
```

## 💡 Why This Approach?

**MetaMask Security Model:**
- MetaMask only shares accounts you explicitly connect
- This prevents websites from seeing all your accounts
- **This is intentional** and cannot be bypassed
- **Manual connection is the correct approach**

**Alternative wallets like Rainbow** may show multiple accounts automatically because they have different security models.

## 🚀 You're All Set!

Once you complete the manual connection process:
- ✅ All 3 MetaMask accounts will be available
- ✅ You can switch between them easily
- ✅ They'll persist in your AlphaWhale profile
- ✅ Each account works independently for Guardian, Hunter, etc.

**The implementation is working correctly** - the "limitation" is actually MetaMask's security feature protecting your privacy! 🔒