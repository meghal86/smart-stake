# Next Steps After Guardian Audit

## Summary

After auditing your existing implementation, here's what we found:

### ✅ Already Built
1. **Hunter Screen UI** - Complete at `http://localhost:8080/hunter`
2. **Guardian UI** - Complete at `http://localhost:8080/guardian`
3. **Guardian Service Layer** - Full implementation with API client
4. **Ranking System** - Materialized view with auto-refresh

### 🔄 What Needs Integration

The main work remaining is **connecting existing systems together**, not building new UI.

## Recommended Task Order

### Phase 1: Complete Ranking System (Quick Wins)
**Estimated Time: 1-2 hours**

1. **Task 9c** - Complete rank observability
   - Document debug view usage (already created in 9a)
   - Add usage examples for A/B testing
   - Quick documentation task

2. **Task 16a** - Integrate UI with ranking API
   - Verify Hunter Screen UI calls `getFeedPage()`
   - Test opportunities display in ranked order
   - Verify filters work with materialized view
   - Test cursor pagination

### Phase 2: Guardian Integration (Core Feature)
**Estimated Time: 3-4 days**

3. **Task 10** - Integrate Guardian with Hunter Screen
   - Create `getGuardianSummary()` for batch fetching
   - Add Redis caching (1 hour TTL)
   - Connect GuardianTrustChip to opportunity cards
   - Create `listStaleOpportunities()` function
   - Create `queueRescan()` function

4. **Task 13** - Create batch Guardian summary endpoint
   - `GET /api/guardian/summary`
   - Accept array of opportunity IDs
   - Return trust scores and top issues
   - Leverage existing Guardian service

### Phase 3: Eligibility & APIs (Backend Services)
**Estimated Time: 2-3 days**

5. **Task 11** - Implement eligibility preview service
   - Create `getEligibilityPreview()` function
   - Fetch wallet signals
   - Cache results (60 min TTL)

6. **Task 12** - Create feed API endpoint
   - `GET /api/hunter/opportunities`
   - Query parameter validation
   - Rate limiting
   - ETag support

### Phase 4: Security & Optimization
**Estimated Time: 2-3 days**

7. **Task 15** - CSP and security headers
8. **Task 26** - Analytics tracking
9. **Task 28** - Guardian staleness cron job
10. **Task 34** - Performance optimization

## Detailed Next Steps

### Step 1: Task 9c (15 minutes)
```bash
# Just documentation - the debug view already exists
# Add usage examples to RANKING_VIEW.md
```

**What to do:**
- Document how to use `vw_opportunity_rank_debug` for A/B testing
- Add example queries for analyzing ranking components
- Create guide for tuning ranking weights

### Step 2: Task 16a (1-2 hours)
```bash
# Verify UI integration with ranking API
```

**What to check:**
1. Does Hunter Screen call `getFeedPage()` from `src/lib/feed/query.ts`?
2. Are opportunities displayed in ranked order?
3. Do filters work correctly?
4. Does infinite scroll maintain ranking?
5. Is cursor pagination working?

**If issues found:**
- Update UI components to use `getFeedPage()`
- Connect filters to API parameters
- Test with the 3 test opportunities we created

### Step 3: Task 10 (2-3 days)
```bash
# Create Guardian integration services
```

**Files to create:**
1. `src/lib/guardian/batch.ts` - Batch fetching logic
2. `src/lib/guardian/cache.ts` - Redis caching layer
3. `src/lib/guardian/stale.ts` - Stale opportunity detection
4. `src/lib/guardian/queue.ts` - Rescan queue management

**Integration points:**
- Connect `GuardianWidget` to opportunity cards
- Show trust chip on each card
- Batch fetch Guardian data for visible opportunities
- Cache results to reduce API calls

### Step 4: Task 13 (1 day)
```bash
# Create batch Guardian summary API endpoint
```

**File to create:**
- `src/app/api/guardian/summary/route.ts`

**Endpoint spec:**
```typescript
GET /api/guardian/summary?ids=uuid1,uuid2,uuid3

Response:
{
  summaries: [
    {
      opportunityId: "uuid1",
      trustScore: 85,
      trustLevel: "green",
      topIssues: ["mixer", "suspicious"],
      lastScan: "2025-01-06T12:00:00Z"
    }
  ]
}
```

## Priority Matrix

| Task | Priority | Effort | Impact | Dependencies |
|------|----------|--------|--------|--------------|
| 9c | High | Low | Medium | None |
| 16a | High | Medium | High | 9c |
| 10 | High | High | High | 16a |
| 13 | High | Medium | High | 10 |
| 11 | Medium | High | Medium | 10 |
| 12 | High | Medium | High | 10, 11 |
| 15 | Medium | Low | High | None |
| 26 | Low | Medium | Medium | 12 |
| 28 | Medium | Low | Medium | 10, 13 |
| 34 | Low | High | High | All above |

## Success Criteria

### Phase 1 Complete When:
- [ ] Debug view documented
- [ ] Hunter Screen displays ranked opportunities
- [ ] Filters work correctly
- [ ] Pagination maintains order

### Phase 2 Complete When:
- [ ] Guardian trust chips show on opportunity cards
- [ ] Batch fetching reduces API calls
- [ ] Trust scores cached in Redis
- [ ] Stale opportunities detected and queued

### Phase 3 Complete When:
- [ ] Eligibility preview works
- [ ] Feed API endpoint operational
- [ ] Rate limiting enforced
- [ ] ETag caching works

### Phase 4 Complete When:
- [ ] Security headers configured
- [ ] Analytics tracking implemented
- [ ] Cron jobs running
- [ ] Performance targets met (P95 < 200ms)

## Quick Start

To begin immediately:

```bash
# 1. Complete Task 9c (documentation)
# Edit: src/lib/feed/RANKING_VIEW.md
# Add: A/B testing examples and usage guide

# 2. Test Hunter Screen integration
# Visit: http://localhost:8080/hunter
# Verify: Opportunities display in ranked order
# Check: Filters and pagination work

# 3. Start Guardian integration
# Create: src/lib/guardian/batch.ts
# Implement: getGuardianSummary(opportunityIds[])
```

## Questions to Answer

Before proceeding, verify:

1. **Does Hunter Screen UI already call the feed API?**
   - Check if it uses `getFeedPage()` from `src/lib/feed/query.ts`
   - Or does it need to be connected?

2. **Are there existing API routes?**
   - Check for `/api/hunter/opportunities`
   - Check for `/api/guardian/summary`

3. **Is Redis configured?**
   - Check for Redis/Upstash configuration
   - Verify caching utilities exist

4. **What's the deployment target?**
   - Vercel? (use Vercel Cron)
   - Self-hosted? (use pg_cron)

## Conclusion

You're in great shape! Most of the heavy lifting is done:
- ✅ UI is built
- ✅ Guardian is built
- ✅ Ranking system is built
- ✅ Database schema is ready

The remaining work is primarily **integration and optimization**, not new feature development.

**Recommended Start:** Task 9c → Task 16a → Task 10

This gives you quick wins (documentation) followed by high-impact integration work.
