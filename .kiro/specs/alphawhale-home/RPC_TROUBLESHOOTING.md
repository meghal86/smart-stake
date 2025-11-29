# RPC & Wallet Connection Troubleshooting

## Understanding the 204 Response

**The 204 status code you're seeing is NORMAL and EXPECTED.**

When you see:
```
Request URL: https://eth.llamarpc.com/
Request Method: OPTIONS
Status Code: 204 No Content
```

This is a **CORS preflight request** - it's the browser checking if the RPC endpoint allows cross-origin requests. A 204 response means **the CORS check passed successfully**.

## Why You're Seeing LlamaRPC

By default, wagmi uses public RPC endpoints like LlamaRPC when no custom RPC is configured. This is fine for development but has limitations:

- **Rate limiting**: Public RPCs limit requests per IP
- **Slower response times**: Shared infrastructure
- **Less reliable**: Can go down or throttle during high traffic

## Solution: Add Your Own RPC Provider

### Option 1: Alchemy (Recommended)

1. Sign up at https://www.alchemy.com/
2. Create a new app for Ethereum Mainnet
3. Copy your API key
4. Add to `.env`:

```bash
VITE_ALCHEMY_API_KEY=your_alchemy_key_here
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key_here
```

**Free tier**: 300M compute units/month (plenty for development)

### Option 2: Infura

1. Sign up at https://www.infura.io/
2. Create a new project
3. Copy your API key
4. Add to `.env`:

```bash
VITE_INFURA_API_KEY=your_infura_key_here
NEXT_PUBLIC_INFURA_API_KEY=your_infura_key_here
```

**Free tier**: 100k requests/day

### Option 3: Continue with Public RPCs

If you don't want to sign up for an API key, the current setup will work fine for development. The code automatically falls back to public RPCs.

## How the Fallback Works

The updated `homeWagmi.ts` config now uses this priority:

1. **Alchemy** (if `VITE_ALCHEMY_API_KEY` is set)
2. **Infura** (if `VITE_INFURA_API_KEY` is set)
3. **Public RPC** (LlamaRPC, etc. - wagmi's default)

## Common Issues & Fixes

### Issue: "Failed to connect wallet"

**Cause**: Rate limiting from public RPC

**Fix**: Add Alchemy or Infura API key (see above)

### Issue: "Network error"

**Cause**: Public RPC is down or throttling

**Fix**: 
1. Wait a few minutes and try again
2. Or add a custom RPC provider

### Issue: "Unsupported chain"

**Cause**: Wallet is connected to wrong network

**Fix**: 
1. Open MetaMask/wallet
2. Switch to Ethereum Mainnet or Sepolia testnet
3. Try connecting again

### Issue: Slow wallet connection

**Cause**: Public RPC latency

**Fix**: Add Alchemy API key for faster response times

## Testing Your Setup

After adding an RPC provider, restart your dev server:

```bash
npm run dev
```

Then check the browser console. You should see:
- No rate limit errors
- Faster connection times
- More reliable wallet interactions

## Verifying RPC Configuration

To check which RPC is being used, open browser DevTools → Network tab:

- **With Alchemy**: Requests go to `eth-mainnet.g.alchemy.com`
- **With Infura**: Requests go to `mainnet.infura.io`
- **Without custom RPC**: Requests go to public RPCs like `eth.llamarpc.com`

All are valid - custom RPCs just provide better performance and reliability.

## Summary

- ✅ **204 response is normal** - CORS is working
- ✅ **Public RPCs work** - fine for development
- ⚡ **Custom RPCs are faster** - recommended for production
- 🆓 **Free tiers available** - Alchemy and Infura both have generous free plans

No action required unless you're experiencing rate limiting or slow performance.
