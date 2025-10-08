# 🐋 Whale Persistence Deployment Guide

## 1. Run Database Migration
```bash
npx supabase db reset
# or for production:
npx supabase db push
```

## 2. Deploy Edge Functions
```bash
npx supabase functions deploy whale-alerts
npx supabase functions deploy cleanup-whale-signals
```

## 3. Set Up Cron Job (Supabase Dashboard)
- Go to Database > Extensions
- Enable `pg_cron` extension
- Run this SQL in SQL Editor:

```sql
-- Schedule cleanup every day at 2 AM UTC
SELECT cron.schedule(
  'cleanup-whale-signals',
  '0 2 * * *',
  'SELECT net.http_post(
    url := ''https://your-project.supabase.co/functions/v1/cleanup-whale-signals'',
    headers := ''{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}''::jsonb
  );'
);
```

## 4. Verify Setup
```bash
# Test whale alerts function
curl -X POST https://your-project.supabase.co/functions/v1/whale-alerts

# Check stored signals
npx supabase sql --db-url="your-db-url" -c "SELECT COUNT(*) FROM whale_signals;"
```

## 5. Update Frontend
The PatternAnalysisService is ready to use historical data:

```typescript
import { PatternAnalysisService } from '@/services/PatternAnalysisService'

const analysis = await PatternAnalysisService.analyzePattern('BTC', '24h')
```

## Cost Optimization
- 30-day retention = ~45,000 records max (1,500/day × 30)
- Storage: ~5MB total
- Cleanup runs daily automatically
- Scales incrementally with usage