# Resilience Testing & Chaos Engineering

This document covers AlphaWhale's resilience testing capabilities, including performance testing, chaos engineering, and failure recovery procedures.

## 🚀 Performance Testing

### k6 Load Tests

We use k6 for comprehensive performance testing with two main scenarios:

#### Soak Test (30 minutes)
```bash
# Run locally
k6 run tools/perf/soak.js

# With custom base URL
BASE_URL=https://staging.alphawhale.com k6 run tools/perf/soak.js
```

**Specifications:**
- Duration: 30 minutes at 40 VUs
- Endpoints: `/api/healthz`, `/api/prices`, `/status`
- Thresholds: P95 < 400ms, Error rate < 0.5%

#### Burst Test (60 seconds)
```bash
# Run locally
k6 run tools/perf/burst.js

# With custom configuration
BASE_URL=https://staging.alphawhale.com k6 run tools/perf/burst.js
```

**Specifications:**
- Duration: 60 seconds ramping to 200 RPS
- Mixed endpoint testing with realistic weights
- Thresholds: P95 < 400ms, Error rate < 0.5%, Min 180 RPS

### CI/CD Integration

Performance tests run automatically:
- **Nightly**: Full soak + burst tests at 2 AM UTC
- **On-demand**: Manual trigger via GitHub Actions
- **Non-blocking**: Tests don't fail deployments

## 🔥 Chaos Engineering

### Local Chaos Testing

Chaos engineering is **LOCAL ONLY** and never deployed to production.

#### Environment Variables

```bash
# Provider failure simulation (percentage)
export CHAOS_ALCHEMY_FAIL=20        # 20% of Alchemy calls fail
export CHAOS_ETHERSCAN_FAIL=10      # 10% of Etherscan calls fail

# Latency injection (milliseconds)
export CHAOS_COINGECKO_LATENCY=500  # Add 500ms delay to CoinGecko
export CHAOS_ALCHEMY_LATENCY=1000   # Add 1s delay to Alchemy
```

#### Testing Scenarios

1. **Provider Failures**
   ```bash
   # Test Alchemy failures
   export CHAOS_ALCHEMY_FAIL=50
   npm run dev
   # Visit app - should show "Simulated" badges
   ```

2. **High Latency**
   ```bash
   # Test slow responses
   export CHAOS_COINGECKO_LATENCY=2000
   npm run dev
   # App should remain responsive with fallbacks
   ```

3. **Combined Chaos**
   ```bash
   # Test multiple failure modes
   export CHAOS_ALCHEMY_FAIL=30
   export CHAOS_COINGECKO_LATENCY=1500
   npm run dev
   ```

### Verification Checklist

When chaos is enabled, verify:

- ✅ Brownout banner appears at top of page
- ✅ Cards show "Simulated" badges with tooltips
- ✅ `/api/healthz` returns 206 status
- ✅ No JavaScript console errors
- ✅ App remains fully functional
- ✅ Status page shows degraded providers

## 🚨 Brownout Handling

### Automatic Detection

The system automatically detects provider degradation:

```typescript
// Health check determines mode
const health = await fetch('/api/healthz');
const { mode } = await health.json();

// Possible modes:
// - 'live': All providers healthy
// - 'cached': Some providers degraded, using cache
// - 'simulated': Providers down, using simulated data
```

### User Experience

When providers are degraded:

1. **Banner**: Top-of-page notification with dismiss option
2. **Badges**: "Simulated" indicators on affected cards
3. **Tooltips**: Explanation of data source limitations
4. **Links**: Direct access to status page for details

### Recovery

The system automatically recovers when providers return:

- Health checks run every 60 seconds
- Banner disappears when mode returns to 'live'
- Badges update to show real data
- No user action required

## 📊 Performance Metrics

### Key Thresholds

| Metric | Threshold | Purpose |
|--------|-----------|---------|
| P95 Response Time | < 400ms | User experience |
| Error Rate | < 0.5% | Reliability |
| Peak RPS | > 180 | Scalability |
| Availability | > 99.5% | SLA compliance |

### Monitoring

Performance is monitored via:

- **k6 reports**: JSON output with detailed metrics
- **GitHub Actions**: Automated test results
- **Status page**: Real-time health indicators
- **Ops dashboard**: Internal metrics and trends

## 🔄 Rollback Procedures

### Emergency Rollback

If performance degrades in production:

1. **Immediate**: Toggle feature flags to disable new features
   ```bash
   node scripts/flags.ts set ui.v2 false
   ```

2. **Quick**: Revert to previous deployment
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Full**: Database rollback (if schema changes)
   ```bash
   supabase db reset --linked
   ```

### Gradual Recovery

After fixing issues:

1. **Staging**: Deploy to staging environment
2. **Smoke test**: Run burst test against staging
3. **Canary**: Enable for 10% of users
4. **Monitor**: Watch metrics for 30 minutes
5. **Full rollout**: Gradually increase to 100%

## 🧪 Testing Commands

```bash
# Performance testing
npm run test:perf:soak     # 30-minute soak test
npm run test:perf:burst    # 60-second burst test
npm run test:perf:all      # Both tests

# Chaos testing (local only)
npm run test:chaos         # Enable chaos mode
npm run test:chaos:reset   # Disable chaos mode

# Resilience testing
npm run test:resilience    # Full resilience test suite
```

## 📋 Troubleshooting

### Common Issues

1. **High P95 times**
   - Check database query performance
   - Verify provider API response times
   - Review caching effectiveness

2. **High error rates**
   - Check provider API status
   - Verify timeout configurations
   - Review circuit breaker settings

3. **Low RPS achievement**
   - Check server resource limits
   - Verify database connection pool
   - Review rate limiting settings

### Debug Commands

```bash
# Check current health
curl http://localhost:3000/api/healthz | jq

# Test with chaos enabled
CHAOS_ALCHEMY_FAIL=100 npm run dev

# Monitor performance
k6 run --duration 30s --vus 10 tools/perf/burst.js
```

---

**⚠️ Important**: Chaos engineering features are for local testing only and are automatically disabled in production environments.