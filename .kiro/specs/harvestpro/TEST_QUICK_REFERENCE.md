# HarvestPro Test Quick Reference

## Run All Tests

```bash
./test-harvestpro.sh
```

**This runs everything:**
- ✅ 11 client-side tests (Vitest)
- ✅ 14 server-side unit tests (Deno)
- ✅ 2 property-based tests (Deno - 1,850+ runs)
- ✅ **Total: 27 test files**

## Run Specific Test Suites

### Client-Side Only (Vitest)
```bash
npm test -- src/lib/harvestpro/__tests__/ --run
```

### Server-Side Only (Deno)
```bash
./supabase/functions/_shared/harvestpro/__tests__/run-all-tests.sh
```

### Property Tests Only (Deno)
```bash
deno test supabase/functions/_shared/harvestpro/__tests__/*.property.test.ts --allow-all
```

## Run Individual Test Files

### Client-Side
```bash
npm test -- src/lib/harvestpro/__tests__/fifo.test.ts --run
```

### Server-Side
```bash
deno test supabase/functions/_shared/harvestpro/__tests__/fifo.test.ts --allow-all
```

## Test Coverage

| Category | Files | What It Tests |
|----------|-------|---------------|
| **Client-Side** | 11 | UI logic, session management, CSV export, proof hashing |
| **Server Unit** | 14 | Edge Function business logic, API integrations |
| **Server Property** | 2 | Mathematical correctness (1,850+ random test runs) |
| **TOTAL** | **27** | **Complete HarvestPro functionality** |

## Expected Execution Time

- Client-side: ~3-8 seconds
- Server-side unit: ~2-5 seconds
- Server-side property: ~10-20 seconds
- **Total: ~15-35 seconds**

## What Gets Tested

### Tax Calculations ✅
- FIFO cost basis (unit + property tests)
- Net benefit calculations (unit + property tests)
- Unrealized PnL calculations

### Eligibility & Filtering ✅
- Loss threshold filtering
- Guardian score checks
- Liquidity score checks
- Gas cost validation

### Data Management ✅
- Wallet connection
- CEX integration
- Data aggregation
- Multi-chain support

### Security & Compliance ✅
- Credential encryption
- Proof of harvest hashing
- Session state transitions

### User Features ✅
- CSV export
- Price oracle
- Gas estimation
- Slippage estimation
- Risk classification

## Property Tests (Mathematical Proof)

### FIFO Properties (6)
1. Chronological ordering
2. Quantity conservation
3. Positive quantities
4. Valid cost basis
5. Empty input handling
6. Determinism

### Net Benefit Properties (6)
1. Formula correctness
2. Loss monotonicity
3. Tax rate sensitivity
4. Cost impact
5. Boundary conditions
6. Determinism

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run HarvestPro Tests
  run: ./test-harvestpro.sh
```

## Troubleshooting

### Tests timeout?
```bash
deno test --timeout=120000 supabase/functions/_shared/harvestpro/__tests__/
```

### Permission errors?
```bash
deno test --allow-all supabase/functions/_shared/harvestpro/__tests__/
```

### Need coverage report?
```bash
npm test -- src/lib/harvestpro/__tests__/ --run --coverage
```

## Documentation

Full guide: `.kiro/specs/harvestpro/TESTING_GUIDE.md`

---

**Quick Start: `./test-harvestpro.sh`**
