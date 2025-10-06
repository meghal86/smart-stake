# Live Data Inventory - API & Integration Mapping

## Checklist (Definition of Done)
- [ ] All 9 deliverables committed to `docs/live-data-inventory/`
- [ ] Staging smoke tests run successfully (outputs pasted below)
- [ ] Frontend → API mapping completed with no missing endpoints
- [ ] Live endpoints can be integrated into UI with no code rewrite

## Deliverables Completed
- [ ] `api-inventory.md` - Complete API route inventory
- [ ] `vendor-inventory.md` - External vendor/upstream integrations
- [ ] `frontend-data-map.md` - Frontend hooks → endpoint mapping
- [ ] `supabase-samples.sql` - DB tables with sample data
- [ ] `openapi-specs/` - API specs or curl examples
- [ ] `telemetry-events.md` - Logging and analytics pointers
- [ ] `local-testing.md` - How to run/test locally
- [ ] `security-credentials.md` - Required env vars and secrets
- [ ] `staging-endpoints.md` - Smoke test results

## Staging Smoke Test Results

### KPI Endpoint
```bash
curl -s -H "Accept: application/json" "<STAGING_BASE>/api/kpi" | jq .
```
**Output (first 300 chars):**
```
[PASTE OUTPUT HERE]
```

### Digest Endpoint
```bash
curl -s -H "Accept: application/json" "<STAGING_BASE>/api/digest/today" | jq .
```
**Output (first 300 chars):**
```
[PASTE OUTPUT HERE]
```

### Top Signals Endpoint
```bash
curl -s -H "Accept: application/json" "<STAGING_BASE>/api/signals/top" | jq .
```
**Output (first 300 chars):**
```
[PASTE OUTPUT HERE]
```

## Priority Questions Answered
1. **Server-side vs client-facing endpoints:** [LIST PATHS]
2. **Pull-based ingestion jobs:** [LIST JOB NAMES & SCHEDULES]
3. **API gateway/caching layer:** [PROVIDE TTLS]
4. **Credential storage:** [ENV VAR NAMES]
5. **Feature flags:** [FLAGS + DEFAULT VALUES]

## Command Outputs
```bash
# API routes discovery
rg --hidden --line-number --no-ignore-vcs "src/app/api|pages/api" | sed -n '1,200p'
[PASTE OUTPUT]

# Data fetching patterns
rg --hidden --line-number --no-ignore-vcs "fetch\(|axios\.|useSWR|useQuery\(|createClient\(|coingecko|alchemy|infura|quicknode|supabase" | sed -n '1,500p'
[PASTE OUTPUT]

# Docs folder structure
ls -1 docs || true
[PASTE OUTPUT]
```

## Notes
[Any additional context or blockers encountered]