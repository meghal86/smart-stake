# 01 - Environment Setup

## Server Environment Variables

Add these to your Supabase project settings and `.env`:

```bash
# Data Providers
ALCHEMY_API_KEY=your_alchemy_key
ETHERSCAN_API_KEY=your_etherscan_key
COINGECKO_BASE=https://api.coingecko.com/api/v3

# Supabase
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Monitoring
SLACK_WEBHOOK_URL=your_slack_webhook
SENTRY_DSN=your_sentry_dsn
```

## Public Environment Variables

Add to `.env.local` and Vercel:

```bash
# Data Mode Control
NEXT_PUBLIC_DATA_MODE=live  # 'live' | 'mock'
```

## Feature Flags

Update `feature_flags.json`:

```json
{
  "flags": {
    "data": {
      "live": true
    }
  }
}
```

## Environment-Specific Defaults

- **Development**: `NEXT_PUBLIC_DATA_MODE=mock`
- **Staging**: `NEXT_PUBLIC_DATA_MODE=live`
- **Production**: `NEXT_PUBLIC_DATA_MODE=live`

## Validation Script

```bash
# Check environment setup
node -e "
console.log('Data Mode:', process.env.NEXT_PUBLIC_DATA_MODE);
console.log('Alchemy:', !!process.env.ALCHEMY_API_KEY);
console.log('Etherscan:', !!process.env.ETHERSCAN_API_KEY);
"
```

---

**Next**: [Database Schema](./02-database-schema.md)