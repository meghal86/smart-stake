# Personalized Airdrops API Testing Guide

## Overview

This guide provides comprehensive manual testing procedures for the personalized airdrops feed endpoint:

```
GET /api/hunter/airdrops?wallet=<address>
```

## Prerequisites

1. **Development server running**: `npm run dev`
2. **Database seeded**: Run `npm run seed:airdrops` to populate test data
3. **Environment variables configured**: Ensure `.env` has required keys
4. **Test wallet address**: Use `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb` or your own

## Test Scenarios

### 1. Basic Personalized Request

**Test**: Verify endpoint returns personalized results with wallet parameter

```bash
curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

**Expected Response**:
```json
{
  "items": [
    {
      "id": "...",
      "slug": "...",
      "title": "...",
      "type": "airdrop",
      "status": "published",
      "eligibility_preview": {
        "status": "likely" | "maybe" | "unlikely",
        "score": 0.85,
        "reasons": [
          "Active on required chains",
          "Meets wallet age requirement",
          "..."
        ]
      },
      "ranking": {
        "overall": 0.78,
        "relevance": 0.82,
        "freshness": 0.65
      },
      "...": "..."
    }
  ],
  "cursor": null,
  "ts": "2026-01-29T10:00:00.000Z"
}
```

**Validation Checklist**:
- [ ] Response status is 200 OK
- [ ] Response includes `items`, `cursor`, `ts` fields
- [ ] Each item has `eligibility_preview` object
- [ ] Each item has `ranking` object
- [ ] `eligibility_preview.status` is one of: `likely`, `maybe`, `unlikely`
- [ ] `eligibility_preview.score` is between 0 and 1
- [ ] `eligibility_preview.reasons` array has 2-5 items
- [ ] `ranking.overall` is between 0 and 1
- [ ] `ranking.relevance` is between 0 and 1
- [ ] `ranking.freshness` is between 0 and 1
- [ ] Items are sorted by `ranking.overall` descending

---

### 2. Eligibility Status Distribution

**Test**: Verify eligibility status matches score thresholds

**Validation Logic**:
- `score >= 0.8` → `status = "likely"`
- `0.5 <= score < 0.8` → `status = "maybe"`
- `score < 0.5` → `status = "unlikely"`

**Manual Check**:
```bash
curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" | jq '.items[] | {score: .eligibility_preview.score, status: .eligibility_preview.status}'
```

**Expected**: All items follow the threshold rules above

---

### 3. Ranking Formula Validation

**Test**: Verify overall score follows formula

**Formula**: `overall = 0.60 × relevance + 0.25 × (trust_score/100) + 0.15 × freshness`

**Manual Check**:
```bash
curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" | jq '.items[0] | {overall: .ranking.overall, relevance: .ranking.relevance, trust: .trust_score, freshness: .ranking.freshness, calculated: (0.60 * .ranking.relevance + 0.25 * (.trust_score / 100) + 0.15 * .ranking.freshness)}'
```

**Expected**: `overall` ≈ `calculated` (within 0.01 tolerance for floating point)

---

### 4. Score Clamping

**Test**: Verify all scores are clamped between 0 and 1

**Manual Check**:
```bash
curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" | jq '.items[] | {overall: .ranking.overall, relevance: .ranking.relevance, freshness: .ranking.freshness, eligibility: .eligibility_preview.score} | to_entries[] | select(.value < 0 or .value > 1)'
```

**Expected**: No output (all scores within 0-1 range)

---

### 5. Wallet Address Validation

**Test**: Invalid wallet address handling

```bash
# Invalid format
curl "http://localhost:3000/api/hunter/airdrops?wallet=not-a-valid-address"

# Zero address
curl "http://localhost:3000/api/hunter/airdrops?wallet=0x0000000000000000000000000000000000000000"

# Mixed case
curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742D35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

**Expected**:
- Invalid format: Either 200 with fallback or 400 with error
- Zero address: 200 OK (may have limited personalization)
- Mixed case: 200 OK (should handle case-insensitively)

---

### 6. Personalization Fallback

**Test**: Verify graceful degradation on personalization error

**Scenario**: If wallet signals or eligibility engine fails, should return non-personalized results

**Manual Check**:
```bash
curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" | jq '{warning: .warning, has_eligibility: (.items[0] | has("eligibility_preview"))}'
```

**Expected**:
- If `warning` exists: `has_eligibility` should be `false`
- If no `warning`: `has_eligibility` should be `true`

---

### 7. Top 50 Eligibility Limit

**Test**: Verify at most 50 opportunities have eligibility evaluation

```bash
curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" | jq '[.items[] | select(has("eligibility_preview"))] | length'
```

**Expected**: Output ≤ 50

---

### 8. Comparison: Personalized vs Non-Personalized

**Test**: Verify personalized results differ from non-personalized

```bash
# Non-personalized
curl "http://localhost:3000/api/hunter/airdrops" > non-personalized.json

# Personalized
curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" > personalized.json

# Compare
jq '.items[0] | has("eligibility_preview")' non-personalized.json
jq '.items[0] | has("eligibility_preview")' personalized.json
```

**Expected**:
- Non-personalized: `false`
- Personalized: `true` (unless fallback occurred)

---

### 9. Snapshot-Based Historical Eligibility

**Test**: Airdrops with `snapshot_date` include historical eligibility check

```bash
curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" | jq '.items[] | select(.snapshot_date != null) | {title, snapshot_date, eligibility_status: .eligibility_preview.status, reasons: .eligibility_preview.reasons}'
```

**Expected**:
- Items with `snapshot_date` should have eligibility evaluation
- Reasons may mention "snapshot" or "before" if relevant

---

### 10. Performance

**Test**: Response time within acceptable limits

```bash
time curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" > /dev/null
```

**Expected**: Total time < 5 seconds

---

### 11. Concurrent Requests

**Test**: Handle multiple simultaneous personalized requests

```bash
for i in {1..5}; do
  curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" > response_$i.json &
done
wait

# Verify all succeeded
for i in {1..5}; do
  echo "Response $i:"
  jq '.items | length' response_$i.json
done
```

**Expected**: All 5 requests return valid responses

---

### 12. Deterministic Results

**Test**: Same wallet returns same results

```bash
curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" > result1.json
sleep 1
curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" > result2.json

# Compare first item IDs
jq '.items[0].id' result1.json
jq '.items[0].id' result2.json
```

**Expected**: Both IDs should match (assuming no DB changes)

---

### 13. Edge Cases

**Test**: Empty wallet parameter

```bash
curl "http://localhost:3000/api/hunter/airdrops?wallet="
```

**Expected**: Treated as non-personalized (no `eligibility_preview` or `ranking`)

---

**Test**: Multiple wallet parameters

```bash
curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&wallet=0x0000000000000000000000000000000000000000"
```

**Expected**: Uses first wallet parameter

---

### 14. Airdrop-Specific Personalization

**Test**: Claim window affects eligibility and ranking

```bash
curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" | jq '.items[] | select(.claim_start != null and .claim_end != null) | {title, claim_start, claim_end, freshness: .ranking.freshness}'
```

**Expected**: Items with claim windows should have freshness scores reflecting urgency

---

**Test**: Airdrop category preserved

```bash
curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" | jq '.items[] | select(.airdrop_category != null) | {title, airdrop_category}'
```

**Expected**: All airdrop categories are preserved in personalized results

---

## Automated Test Execution

Once the development server is running, execute the integration tests:

```bash
# Start dev server in background
npm run dev &
DEV_PID=$!

# Wait for server to be ready
sleep 5

# Run integration tests
npm test -- src/__tests__/integration/hunter-airdrops-personalized-api.integration.test.ts --run

# Stop dev server
kill $DEV_PID
```

---

## Success Criteria

All tests pass when:

1. ✅ Personalized endpoint returns 200 OK with valid wallet
2. ✅ Response includes `eligibility_preview` and `ranking` for each item
3. ✅ Eligibility status matches score thresholds
4. ✅ Ranking formula is correct (0.60 relevance + 0.25 trust + 0.15 freshness)
5. ✅ All scores clamped between 0 and 1
6. ✅ Invalid wallet addresses handled gracefully
7. ✅ Personalization fallback works on errors
8. ✅ At most 50 opportunities have eligibility evaluation
9. ✅ Personalized results differ from non-personalized
10. ✅ Snapshot-based historical eligibility works
11. ✅ Response time < 5 seconds
12. ✅ Concurrent requests handled correctly
13. ✅ Results are deterministic for same wallet
14. ✅ Edge cases handled properly
15. ✅ Airdrop-specific personalization works

---

## Troubleshooting

### Issue: All eligibility scores are 0.5 with status "maybe"

**Cause**: Wallet signals service returning null values (Alchemy API not configured)

**Solution**: Configure `ALCHEMY_ETH_RPC_URL` and `ALCHEMY_TRANSFERS_API_KEY` in `.env`

---

### Issue: Personalization fallback always triggered

**Cause**: Error in wallet signals or eligibility engine

**Solution**: Check server logs for errors, verify environment variables

---

### Issue: Response time > 5 seconds

**Cause**: Too many eligibility evaluations or slow RPC calls

**Solution**: Verify top 50 limit is enforced, check RPC provider performance

---

### Issue: Ranking scores don't follow formula

**Cause**: Clamping not applied or formula implementation error

**Solution**: Review `src/lib/hunter/ranking-engine.ts` implementation

---

## Next Steps

After manual testing confirms all scenarios work:

1. Mark task as complete in `tasks.md`
2. Update `TASK_4_TESTING_STATUS.md` with Phase 3 completion
3. Proceed to Phase 4: Integration Tests
4. Document any issues found during testing

---

**Last Updated**: 2026-01-29
**Status**: Ready for Manual Testing
