# CoinGecko Free API - Quick Reference Card

## ✅ What Changed

**Before:** Required paid CoinGecko API key ($129-$499/month)  
**After:** Uses free public API ($0/month, no key required)

## 🚀 Quick Facts

- ✅ **Cost:** $0/month
- ✅ **Setup Time:** 0 minutes
- ✅ **API Key:** Not required
- ✅ **Signup:** Not required
- ✅ **Rate Limit:** 10-50 calls/minute
- ✅ **Caching:** 1 minute TTL (reduces calls by 60x)

## 📝 What You Need to Do

**Nothing!** It works out of the box.

## 🧪 Test It

```bash
curl "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
```

## 📊 Rate Limits

| Metric | Value |
|--------|-------|
| Calls/minute | 10-50 |
| Calls/month | ~30k-150k |
| Cache TTL | 1 minute |
| Effective calls/min | ~1 (with caching) |

## ✅ Sufficient For

- Development & testing
- Small production (<100 users)
- 1-5 minute price updates

## ⚠️ When to Add Fallback

- Medium production (100-1000 users)
- High availability requirements
- <1 minute price updates

## 💰 Cost Savings

| Tier | Annual Savings |
|------|----------------|
| Development | $1,548/year |
| Startup | $3,588/year |
| Business | $5,988/year |

## 📚 Documentation

- **Setup Guide:** `.kiro/specs/harvestpro/FREE_PRICE_ORACLE_SETUP.md`
- **Technical Details:** `.kiro/specs/harvestpro/COINGECKO_FREE_API_UPDATE.md`
- **Completion Guide:** `.kiro/specs/harvestpro/PRICE_ORACLE_FREE_SETUP_COMPLETE.md`

## 🔧 Optional: Add Fallback

If you need higher reliability, add CoinMarketCap:

```bash
# Get free API key: https://coinmarketcap.com/api/
COINMARKETCAP_API_KEY=your_key_here
supabase secrets set COINMARKETCAP_API_KEY=your_key_here
```

## ✅ Status

**Price oracle is configured and working!**

No action required. Move on to next setup step.

