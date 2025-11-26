# HarvestPro Deployment Checklist

**Last Updated:** 2025-01-27  
**Status:** 3/5 Complete - Ready for Final Steps

## Completed ✅

### 1. React Query Setup ✅
- [x] Installed `@tanstack/react-query`
- [x] Created `QueryClientProvider` in `src/providers/ClientProviders.tsx`
- [x] Configured retry logic (3 attempts with exponential backoff)
- [x] Set stale time (2 minutes)
- [x] Disabled refetch on window focus

**Verification:** Check `src/providers/ClientProviders.tsx`

### 2. Edge Functions Deployed ✅
- [x] `harvest-sync-wallets` - Version 3 (ACTIVE)
- [x] `harvest-sync-cex` - Version 4 (ACTIVE)
- [x] `harvest-recompute-opportunities` - Version 5 (ACTIVE)
- [x] `harvest-notify` - Version 4 (ACTIVE)

**Dashboard:** https://supabase.com/dashboard/project/rebeznxivaxgserswhbn/functions

### 3. Database Migrations ✅
- [x] All 11 tables created
- [x] All 40+ indexes created
- [x] All 15 foreign key constraints applied
- [x] All 11 RLS policies enabled
- [x] All 6 triggers created

**Verification Summary:**
```
Total Tables: 11 (Expected: 11) ✅
RLS Enabled: 11 tables ✅
Total Indexes: 40 (Expected: 30+) ✅
Foreign Keys: 15 constraints ✅
```

**Dashboard:** https://supabase.com/dashboard/project/rebeznxivaxgserswhbn/editor

## Remaining Tasks 🔄

### 4. Set Environment Variables (2 minutes)

You need to configure the following environment variables:

#### Required for v1 Core:
```bash
# Supabase (should already be set)
NEXT_PUBLIC_SUPABASE_URL=https://rebeznxivaxgserswhbn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Price Oracles
COINGECKO_API_KEY=<your-coingecko-key>
COINMARKETCAP_API_KEY=<your-coinmarketcap-key>

# Guardian API
GUARDIAN_API_KEY=<your-guardian-key>

# Encryption (for CEX credentials)
ENCRYPTION_KEY=<32-byte-hex-string>  # Generate with: openssl rand -hex 32
```

#### Optional for v2 Institutional:
```bash
# Private RPC (MEV Protection)
FLASHBOTS_API_KEY=<your-flashbots-key>
EDEN_API_KEY=<your-eden-key>
BLOXROUTE_API_KEY=<your-bloxroute-key>
```

#### Optional for v3 Enterprise:
```bash
# Custody Providers
FIREBLOCKS_API_KEY=<your-fireblocks-key>
FIREBLOCKS_API_SECRET=<your-fireblocks-secret>
COPPER_API_KEY=<your-copper-key>
COPPER_API_SECRET=<your-copper-secret>

# Sanctions Screening
TRM_LABS_API_KEY=<your-trm-key>
CHAINALYSIS_API_KEY=<your-chainalysis-key>
```

**Where to set:**
- Local: `.env.local` file
- Vercel: Project Settings → Environment Variables
- Supabase: Project Settings → Edge Functions → Secrets

**Generate encryption key:**
```bash
openssl rand -hex 32
```

### 5. Test the System (3 minutes)

Once environment variables are set:

```bash
# Start development server
npm run dev

# Open browser
open http://localhost:3000/harvest
```

**Test Checklist:**
- [ ] Page loads without errors
- [ ] Header displays correctly
- [ ] Summary card shows placeholder data
- [ ] Filter chips are interactive
- [ ] Toggle demo mode OFF
- [ ] Check Network tab for API calls
- [ ] Verify API calls to `/api/harvest/opportunities`
- [ ] Check for any console errors
- [ ] Test wallet connection (if available)
- [ ] Test opportunity card interactions

**Expected Behavior:**
- With demo mode ON: Shows mock data
- With demo mode OFF: Calls real API (may return empty if no wallets connected)
- No console errors
- API calls return 200 status
- Loading states work correctly

## Deployment to Production 🚀

Once testing is complete:

### Vercel Deployment
```bash
# Deploy to production
vercel --prod

# Or push to main branch (if auto-deploy is enabled)
git push origin main
```

### Post-Deployment Verification
1. Visit production URL
2. Check HarvestPro page loads
3. Verify Edge Functions are called
4. Check database queries work
5. Monitor for errors in Vercel logs
6. Monitor for errors in Supabase logs

## Monitoring

### Vercel Logs
https://vercel.com/dashboard → Your Project → Logs

### Supabase Logs
```bash
# Edge Function logs
supabase functions logs harvest-sync-wallets
supabase functions logs harvest-sync-cex
supabase functions logs harvest-recompute-opportunities
supabase functions logs harvest-notify
```

### Database Queries
https://supabase.com/dashboard/project/rebeznxivaxgserswhbn/logs/postgres-logs

## Troubleshooting

### If API calls fail:
1. Check environment variables are set
2. Check Edge Functions are deployed
3. Check database tables exist
4. Check RLS policies allow access
5. Check Supabase service role key is correct

### If database queries fail:
1. Verify tables exist in Supabase dashboard
2. Check RLS policies are enabled
3. Verify user is authenticated
4. Check foreign key constraints

### If Edge Functions fail:
1. Check function logs: `supabase functions logs <function-name>`
2. Verify environment variables in Supabase dashboard
3. Check function is deployed and active
4. Verify database connection works

## Success Criteria

HarvestPro is ready for production when:
- [x] React Query is configured
- [x] Edge Functions are deployed
- [x] Database migrations are applied
- [ ] Environment variables are set
- [ ] Local testing passes
- [ ] No console errors
- [ ] API calls return 200
- [ ] Database queries work
- [ ] Production deployment succeeds

## Timeline

- **Completed:** 3/5 major tasks (60%)
- **Remaining:** 2 tasks (~5 minutes)
- **Total Time:** ~5 minutes to production-ready

## Next Action

**Set environment variables** (2 minutes):
1. Generate encryption key: `openssl rand -hex 32`
2. Add to `.env.local` file
3. Add to Vercel project settings
4. Add to Supabase Edge Functions secrets

Then proceed to testing!

---

**Status:** 🟡 Almost Ready - Just environment variables and testing left!
**Progress:** 3/5 Complete (60%)
**Time to Production:** ~5 minutes
