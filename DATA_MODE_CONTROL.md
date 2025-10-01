# 🎛️ Data Mode Control - Live vs Mock

## Current Status: **MOCK MODE** 📊

Right now, everything on screen shows **simulated/demo data** because:

```bash
# In .env file
NEXT_PUBLIC_DATA_MODE="mock"  # ← Currently set to mock
```

## 🔄 How to Switch to Live Data

### Option 1: Environment Variable
```bash
# Change in .env file
NEXT_PUBLIC_DATA_MODE="live"

# Then restart the app
npm run dev
```

### Option 2: Command Line
```bash
# Set for current session
export NEXT_PUBLIC_DATA_MODE=live
npm run dev
```

## 📊 What Changes When You Switch

### Mock Mode (`NEXT_PUBLIC_DATA_MODE="mock"`)
- ✅ **Spotlight**: Shows demo whale movements (~$2.5M)
- ✅ **Fear Index**: Shows demo score (~67 "Accumulation")
- ✅ **Digest**: Shows simulated events
- ✅ **Provenance Chips**: Display "Simulated"
- ✅ **Fast & Reliable**: No API dependencies

### Live Mode (`NEXT_PUBLIC_DATA_MODE="live"`)
- 🔴 **Spotlight**: Real whale movements from Alchemy (>$250k)
- 🔴 **Fear Index**: Calculated from actual blockchain data
- 🔴 **Digest**: Real whale events from last 24h
- 🔴 **Provenance Chips**: Show "Real" (if data <3min old) or "Simulated" (fallback)
- 🔴 **Requires**: API keys and data ingestion running

## 🎯 Current Implementation Status

### ✅ Ready Components
- Data ingestion function (enhanced)
- Whale spotlight function (existing)
- Fear index function (existing)
- Client adapters (updated)
- Fallback mechanisms (working)

### 🔧 To Enable Live Data
1. **Set API keys** (Alchemy, CoinGecko)
2. **Change data mode**: `NEXT_PUBLIC_DATA_MODE="live"`
3. **Trigger ingestion**: `POST /functions/v1/data-ingestion`
4. **Verify health**: `GET /functions/v1/healthz`

## 🚨 Important Notes

- **Gradual Rollout**: You can test live mode locally first
- **Instant Rollback**: Change back to `"mock"` anytime
- **Fallback Safety**: Live mode falls back to mock if APIs fail
- **No UI Changes**: Same interface, different data source

## 🎮 Try It Now

```bash
# Enable live data
echo 'NEXT_PUBLIC_DATA_MODE="live"' >> .env

# Restart app
npm run dev

# Check if data is live (look for "Real" provenance chips)
```

**Answer**: No, everything is currently showing **mock/demo data**. You need to set `NEXT_PUBLIC_DATA_MODE="live"` to see real blockchain data.