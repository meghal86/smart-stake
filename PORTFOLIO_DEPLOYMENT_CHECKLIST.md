# Portfolio Real-Time Data - Deployment Checklist

Use this checklist to ensure proper deployment of the portfolio real-time data implementation.

## Pre-Deployment

### Environment Setup

- [ ] `.env.local` file created
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `COINGECKO_API_KEY` set (optional but recommended)
- [ ] `COINMARKETCAP_API_KEY` set (optional but recommended)

### Database Setup

- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Supabase project linked (`supabase link`)
- [ ] Migration file exists: `supabase/migrations/20240215000000_create_user_portfolio_addresses.sql`
- [ ] Migration applied (`supabase db push`)
- [ ] Table `user_portfolio_addresses` created
- [ ] RLS policies enabled and working
- [ ] Indexes created

### Code Review

- [ ] All new files created:
  - [ ] `src/lib/auth/serverAuth.ts`
  - [ ] `src/services/priceOracleService.ts`
  - [ ] `supabase/migrations/20240215000000_create_user_portfolio_addresses.sql`
- [ ] All files updated:
  - [ ] `src/app/api/v1/portfolio/snapshot/route.ts`
  - [ ] `src/services/guardianService.ts`
  - [ ] `src/services/hunterService.ts`
  - [ ] `src/services/harvestService.ts`
  - [ ] `src/services/PortfolioValuationService.ts`
  - [ ] `src/services/PortfolioSnapshotService.ts`
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)

### Testing

- [ ] Unit tests pass (`npm test`)
- [ ] Integration tests pass
- [ ] Manual testing completed:
  - [ ] Demo mode works
  - [ ] Authentication works
  - [ ] Single wallet mode works
  - [ ] All wallets mode works
  - [ ] Price oracle fetches real prices
  - [ ] Guardian data loads
  - [ ] Hunter data loads
  - [ ] Harvest data loads
  - [ ] Error states handled gracefully
  - [ ] Fallback to mock data works

## Edge Functions

### Deployment

- [ ] `guardian-scan-v2` deployed
  ```bash
  supabase functions deploy guardian-scan-v2
  ```
- [ ] `hunter-opportunities` deployed
  ```bash
  supabase functions deploy hunter-opportunities
  ```
- [ ] `harvest-recompute-opportunities` deployed
  ```bash
  supabase functions deploy harvest-recompute-opportunities
  ```
- [ ] `portfolio-tracker-live` deployed
  ```bash
  supabase functions deploy portfolio-tracker-live
  ```

### Verification

- [ ] Edge functions respond to test requests
- [ ] Edge function logs show no errors
- [ ] Edge function environment variables set

## Production Deployment

### Pre-Deploy

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped

### Deploy Steps

- [ ] Deploy to staging environment
- [ ] Test on staging:
  - [ ] Authentication works
  - [ ] Real-time data loads
  - [ ] Performance acceptable
  - [ ] No console errors
- [ ] Deploy to production
- [ ] Verify production deployment:
  - [ ] Health check passes
  - [ ] Real-time data loads
  - [ ] No errors in logs

### Post-Deploy

- [ ] Monitor error rates
- [ ] Monitor API response times
- [ ] Monitor edge function success rates
- [ ] Monitor price oracle hit rates
- [ ] Check user feedback
- [ ] Verify analytics tracking

## Monitoring Setup

### Logging

- [ ] Error logging configured (Sentry/similar)
- [ ] Log aggregation set up
- [ ] Alert rules configured:
  - [ ] High error rate
  - [ ] Slow API responses
  - [ ] Edge function failures
  - [ ] Price oracle failures

### Metrics

- [ ] API response time tracking
- [ ] Edge function success rate tracking
- [ ] Cache hit/miss ratio tracking
- [ ] Authentication failure tracking
- [ ] Price oracle performance tracking

### Dashboards

- [ ] Portfolio API dashboard created
- [ ] Edge function dashboard created
- [ ] Price oracle dashboard created
- [ ] User activity dashboard updated

## Documentation

- [ ] README updated
- [ ] API documentation updated
- [ ] Architecture diagrams updated
- [ ] Deployment guide created
- [ ] Troubleshooting guide created
- [ ] Quick reference card created

## Rollback Plan

### Preparation

- [ ] Previous version tagged in git
- [ ] Rollback procedure documented
- [ ] Database migration rollback tested
- [ ] Edge function rollback tested

### Rollback Steps (if needed)

1. [ ] Revert code deployment
2. [ ] Rollback database migration
3. [ ] Redeploy previous edge functions
4. [ ] Verify rollback successful
5. [ ] Notify team
6. [ ] Document issues

## Communication

### Internal

- [ ] Team notified of deployment
- [ ] Deployment notes shared
- [ ] Known issues documented
- [ ] Support team briefed

### External

- [ ] Release notes published
- [ ] User documentation updated
- [ ] API changelog updated
- [ ] Status page updated (if applicable)

## Performance Benchmarks

### Before Deployment

- [ ] Baseline metrics recorded:
  - [ ] API response time: _____ ms
  - [ ] Page load time: _____ ms
  - [ ] Error rate: _____ %

### After Deployment

- [ ] New metrics recorded:
  - [ ] API response time: _____ ms
  - [ ] Page load time: _____ ms
  - [ ] Error rate: _____ %
- [ ] Performance acceptable
- [ ] No regressions detected

## Security

- [ ] Environment variables secured
- [ ] API keys rotated (if needed)
- [ ] RLS policies tested
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] Rate limiting configured
- [ ] CORS configured correctly
- [ ] Security headers set

## Compliance

- [ ] Data privacy requirements met
- [ ] User consent obtained (if needed)
- [ ] Data retention policies followed
- [ ] Audit logging enabled
- [ ] Compliance documentation updated

## Final Checks

- [ ] All checklist items completed
- [ ] No critical issues outstanding
- [ ] Team sign-off obtained
- [ ] Deployment approved
- [ ] Go-live scheduled

## Post-Deployment Monitoring (First 24 Hours)

### Hour 1
- [ ] Check error logs
- [ ] Verify real-time data loading
- [ ] Monitor API response times
- [ ] Check user activity

### Hour 4
- [ ] Review error rates
- [ ] Check edge function performance
- [ ] Verify price oracle working
- [ ] Monitor cache performance

### Hour 12
- [ ] Review all metrics
- [ ] Check for any patterns
- [ ] Verify no degradation
- [ ] Review user feedback

### Hour 24
- [ ] Full metrics review
- [ ] Performance analysis
- [ ] Error analysis
- [ ] User satisfaction check
- [ ] Document lessons learned

## Success Criteria

- [ ] Real-time data loading successfully
- [ ] Error rate < 1%
- [ ] API response time < 500ms (P95)
- [ ] Edge function success rate > 95%
- [ ] Price oracle hit rate > 80%
- [ ] No critical bugs reported
- [ ] User feedback positive

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | __________ | ______ | __________ |
| Tech Lead | __________ | ______ | __________ |
| QA | __________ | ______ | __________ |
| DevOps | __________ | ______ | __________ |
| Product Owner | __________ | ______ | __________ |

---

**Deployment Date**: __________
**Version**: 1.0.0
**Status**: ☐ Pending ☐ In Progress ☐ Complete ☐ Rolled Back
