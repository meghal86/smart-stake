# Hunter Architecture Audit v1 – Critical Fixes (November 2025)

> **⚠️ A++++ STANDARD ENFORCEMENT**  
> This document encodes the results of the AlphaWhale Hunter Architectural Audit.  
> **All engineers, agents, and tools (Cursor, Amazon Q, Kiro) MUST treat these as hard constraints.**

## Audit Status

**Date:** November 2025  
**Status:** CRITICAL - Architecture Rule Enforcement  
**Compliance Level:** A++++ (Production-Ready)

---

## 1. Sentinel Engine = Queue–Worker Fan-Out (NO Monolithic Polling)

### ❌ FORBIDDEN Pattern

Hunter **MUST NOT** implement long-running or heavy blockchain monitoring directly inside a single Supabase Edge Function.

```typescript
// ❌ WRONG: Monolithic polling in one function
Deno.serve(async () => {
  // This will timeout and fail
  const logs = await fetch(rpcUrl, { /* get 8MB of logs */ });
  const parsed = JSON.parse(logs); // CPU intensive
  for (const event of parsed) { // thousands of events
    await processEvent(event);
  }
});
```

### ✅ REQUIRED Pattern

**Queue–Worker Fan-Out Architecture:**

- A lightweight **scheduler** function enqueues small jobs
- A fleet of **workers** processes micro-batches
- High-volume contracts are backed by an external indexer

#### Scheduler Function

**Location:** `supabase/functions/sentinel-scheduler/index.ts`

```typescript
// EDGE FUNCTION: supabase/functions/sentinel-scheduler/index.ts
// Triggered by cron (e.g. every 12s block / 30s / 60s)
// NO blockchain RPC calls - only decides what to check

import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Decide which contracts/opportunities need checking
  //    Keep this query LIGHT (no heavy joins, no large JSON columns)
  const { data: targets, error } = await supabase
    .from("sentinel_targets")
    .select("id, contract_address, chain, tier, last_checked_at")
    .eq("enabled", true)
    .limit(500);

  if (error) {
    console.error("sentinel-scheduler error", error);
    return new Response("error", { status: 500 });
  }

  // 2. Enqueue tiny jobs into Supabase Queue / pgmq
  //    Each job = 1–5 targets max
  for (let i = 0; i < targets.length; i += 5) {
    const batch = targets.slice(i, i + 5);
    await supabase.from("sentinel_jobs").insert({
      targets: batch,
      tier: batch[0].tier,
      created_at: new Date().toISOString(),
    });
  }

  return new Response(JSON.stringify({ queued: targets.length }));
});
```

#### Worker Function

**Location:** `supabase/functions/sentinel-worker/index.ts`

```typescript
// EDGE FUNCTION: supabase/functions/sentinel-worker/index.ts
// Triggered by queue messages
// Handles 1–5 contracts/opportunities per run

import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const job = await req.json(); // { targets: [...], tier: 'hot' | 'warm' | 'cold' }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Fetch data from appropriate source based on tier
  let data;
  switch (job.tier) {
    case "hot":
      // High-TVL / critical protocols → use dedicated indexer
      data = await fetchFromIndexer(job.targets);
      break;
    case "warm":
      // Moderate-volume → use webhooks or small RPC calls
      data = await fetchFromWebhook(job.targets);
      break;
    case "cold":
      // Low-priority → simple polling at large intervals
      data = await fetchFromRPC(job.targets);
      break;
  }

  // 2. Run Guardian / Sentinel rules
  for (const target of job.targets) {
    const result = await evaluateSentinelRules(target, data);
    
    // 3. Write results back to Postgres
    await supabase.from("sentinel_executions").insert({
      rule_id: target.rule_id,
      triggered_by: result.trigger,
      status: result.status,
      created_at: new Date().toISOString(),
    });
  }

  // IMPORTANT: keep per-job CPU work < ~2s: tiny batches only
  return new Response(JSON.stringify({ processed: job.targets.length }));
});
```

### Hot / Warm / Cold Tiers

- **Hot:** High-TVL / critical protocols → use dedicated indexer (Goldsky/Substreams/custom Rust indexer). Worker reads filtered data, not raw chain logs.
- **Warm:** Wallet and moderate-volume contracts → use webhooks (Alchemy Notify, etc.) that enqueue to `sentinel_jobs`.
- **Cold:** Low-priority checks → simple polling at large intervals with small response sets.

### Forbidden Patterns

- ❌ A single Edge Function doing: `fetch -> JSON.parse(8MB logs) -> loop thousands of events`
- ❌ Running Sentinel logic purely via cron-polling in one function
- ❌ Assuming "400s wall-clock" also means "unlimited CPU time"

---

## 2. Intent Engine – Protocol-Level Surplus Sharing

### Overview

AlphaWhale Hunter **MUST** treat "execution surplus" as a **first-class protocol primitive**, not an accidental side-effect.

### Definitions

```typescript
// Surplus calculation
const minOutput = userSignedMinimum;      // User-signed minimum acceptable output
const actualOutput = receivedFromSolver;  // Amount actually received after execution
const surplus = Math.max(actualOutput - minOutput, 0);
```

### Required Implementation

**Surplus MUST be split at the smart contract layer** using a configurable ratio:

```solidity
// contracts/IntentSettlement.sol
/// @notice AlphaWhale Intent Settlement
/// @dev Enforces protocol-level surplus split.
///      Surplus = max(actualOutput - minOutput, 0).
///      Shares are configurable (user / protocol / solver).

struct SurplusConfig {
    uint256 userPercent;      // e.g. 50%
    uint256 protocolPercent;  // e.g. 30%
    uint256 solverPercent;    // e.g. 20%
}

// IMPORTANT: This split ratio is the single source of truth for surplus sharing.
// Edge Functions (hunter-intent-execute) MUST NOT bypass or re-implement this split off-chain.

function settleSurplus(
    uint256 minOutput,
    uint256 actualOutput,
    address user,
    address solver
) internal {
    uint256 surplus = actualOutput > minOutput ? actualOutput - minOutput : 0;
    
    if (surplus > 0) {
        uint256 userShare = (surplus * config.userPercent) / 100;
        uint256 protocolShare = (surplus * config.protocolPercent) / 100;
        uint256 solverShare = (surplus * config.solverPercent) / 100;
        
        // Distribute shares
        token.transfer(user, minOutput + userShare);
        token.transfer(protocolTreasury, protocolShare);
        token.transfer(solver, solverShare);
        
        emit SurplusDistributed(user, solver, surplus, userShare, protocolShare, solverShare);
    }
}
```

### Edge Function Integration

**Location:** `supabase/functions/hunter-intent-execute/index.ts`

```typescript
// EDGE FUNCTION: supabase/functions/hunter-intent-execute/index.ts
// Orchestrates intent execution, surplus calculation, and logging.
// It DOES NOT bypass the on-chain surplus split logic.

import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ExecuteIntentBody {
  intentId: string;
  solverId: string;
}

serve(async (req) => {
  const body = (await req.json()) as ExecuteIntentBody;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Load intent + user-signed minOutput
  const { data: intent } = await supabase
    .from("intent_orders")
    .select("*")
    .eq("id", body.intentId)
    .single();

  // 2. Call solver / solver network
  const solverResult = await callSolver(body.solverId, intent);

  // 3. Submit transaction via settlement contract (which enforces surplus split)
  const txHash = await submitToSettlementContract({
    minOutput: intent.min_output,
    actualOutput: solverResult.output,
    user: intent.user_id,
    solver: body.solverId,
  });

  // 4. Read actualOutput from chain or logs
  const receipt = await waitForReceipt(txHash);
  const actualOutput = parseActualOutput(receipt);

  // 5. Compute surplus + log in surplus_events
  const surplus = Math.max(actualOutput - intent.min_output, 0);
  
  await supabase.from("surplus_events").insert({
    intent_id: body.intentId,
    solver: body.solverId,
    user_address: intent.user_id,
    total_surplus: surplus,
    user_share: surplus * 0.5,
    protocol_share: surplus * 0.3,
    solver_share: surplus * 0.2,
    executed_at: new Date().toISOString(),
  });

  // 6. Update solver reputation
  await updateSolverReputation(body.solverId, surplus);

  return new Response(JSON.stringify({ ok: true, txHash }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### Forbidden Patterns

- ❌ Designs where solvers silently keep 100% of surplus
- ❌ Surplus logic implemented only in frontend or only in off-chain code
- ❌ Edge Functions bypassing on-chain surplus split

---

## 3. Mobile ZK – Mopro/Rust, Not Browser JS

### Overview

For **mobile devices**, Zero-Knowledge proofs **MUST** be implemented with **native Rust provers** (via Mopro or equivalent), not via heavy JS/WASM in a webview.

### Phase 1 (Shipping)

Complex ZK proofs **SHOULD** be generated **server-side** (Edge Functions / dedicated prover service).

**Mobile client:**
- Signs messages
- Passes inputs
- Receives proof or eligibility verdict

```typescript
// CLIENT: Mobile app
const eligibilityRequest = {
  opportunityId: "abc123",
  walletAddress: userWallet,
  // No heavy computation on mobile
};

const { data } = await supabase.functions.invoke('zk-eligibility-verify', {
  body: eligibilityRequest
});

// Server generates proof and returns result
```

### Phase 2+ (Native Proving)

Integrate **Mopro** for on-device proving:

- **iOS:** Swift ↔ Rust (FFI)
- **Android:** Kotlin ↔ Rust (FFI)

Use **Groth16** for mobile circuits:
- Small proving keys
- Minimal proof size
- Fast on-chain verification

Heavy circuits **MUST** be split and/or aggregated server-side (recursive SNARKs).

### Forbidden Patterns

- ❌ `snarkjs.fullProve` running inside React Native or mobile webviews for heavy circuits
- ❌ Any long-running proof generation on the JS main thread
- ❌ Large WASM bundles (>5MB) loaded in mobile webviews

---

## 4. Paymaster – Volatility Guardrails

### Overview

The ERC-4337 Paymaster design **MUST** defend against oracle lag and gas volatility.

### Smart Contract Requirements

**Location:** `contracts/AlphaWhalePaymaster.sol`

```solidity
/// @notice AlphaWhale Paymaster
/// @dev Gas paid in tokens with:
///  - oracle-based pricing,
///  - configurable riskPremiumBps (e.g. +10–15%),
///  - panic mode when gas/volatility exceeds thresholds.
/// This contract MUST NOT sponsor userOps if:
///  - oracle price is too stale,
///  - or panic mode is active.

contract AlphaWhalePaymaster {
    uint256 public riskPremiumBps = 1200; // 12%
    uint256 public maxOracleStaleness = 300; // 5 minutes
    uint256 public panicGasThreshold = 500 gwei;
    bool public panicMode;

    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external returns (bytes memory context, uint256 validationData) {
        // 1. Read price from oracle
        (uint256 price, uint256 timestamp) = oracle.getPrice(token, nativeToken);
        
        // 2. Check staleness
        require(block.timestamp - timestamp < maxOracleStaleness, "Oracle too stale");
        
        // 3. Check panic mode
        require(!panicMode, "Panic mode active");
        require(tx.gasprice < panicGasThreshold, "Gas too high");
        
        // 4. Apply risk premium
        uint256 adjustedPrice = (price * (10000 + riskPremiumBps)) / 10000;
        
        // 5. Calculate token amount needed
        uint256 tokenAmount = (maxCost * adjustedPrice) / 1e18;
        
        // ... rest of validation
    }
}
```

### Edge Function Integration

**Location:** `supabase/functions/paymaster-orchestrator/index.ts`

```typescript
// EDGE FUNCTION: supabase/functions/paymaster-orchestrator/index.ts
// Computes safe quotes for token-gas payments, with risk premium and panic mode.

import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";

interface PaymasterQuoteBody {
  chainId: number;
  token: string;      // e.g. USDC
  nativeToken: string; // e.g. ETH
  estimatedGas: string;
}

serve(async (req) => {
  const body = (await req.json()) as PaymasterQuoteBody;

  // 1. Read on-chain oracle price (nativeToken/token)
  const onChainPrice = await readOraclePrice(body.chainId, body.token, body.nativeToken);

  // 2. Cross-check with off-chain price feed if needed
  const offChainPrice = await getOffChainPrice(body.token, body.nativeToken);
  const deviation = Math.abs(onChainPrice - offChainPrice) / onChainPrice;

  // 3. Apply risk premium (e.g. +10-15%)
  const riskPremiumBps = 1200; // 12%
  const adjustedPrice = onChainPrice * (1 + riskPremiumBps / 10000);

  // 4. If gas / volatility beyond threshold, mark panicMode = true
  const currentGasPrice = await getCurrentGasPrice(body.chainId);
  const panicMode = currentGasPrice > 500e9 || deviation > 0.05; // 5% deviation

  const tokenGasAmount = (BigInt(body.estimatedGas) * BigInt(Math.floor(adjustedPrice * 1e18))) / BigInt(1e18);

  return new Response(
    JSON.stringify({
      panicMode,
      tokenGasAmount: tokenGasAmount.toString(),
      riskPremiumBps: 1200,
      currentGasPrice: currentGasPrice.toString(),
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

### Required Behavior

On-chain Paymaster **MUST:**
- Read price from a reliable oracle
- Apply a configurable **risk premium** (e.g. +10–15%)
- Reject sponsorship when:
  - The oracle price is too old
  - Gas price exceeds a configured ceiling ("panic mode")

Edge Function **SHOULD:**
- Cross-check on-chain oracle price with an off-chain signed quote
- Refuse to sponsor when deviation is too large

### Forbidden Patterns

- ❌ Accepting token gas payments at stale oracle prices without a premium
- ❌ Sponsoring during extreme gas spikes without a panic/circuit-breaker

---

## 5. EigenLayer / AVS – Phased Adoption

### Overview

EigenLayer integration is a **roadmap**, not a blocker.

### Phase Breakdown

#### Phase 1 – Whitelist Solvers (v1 Launch)
- Admin-managed allowlist
- No slashing
- Simple reputation scoring

#### Phase 2 – Optimistic Bonds (v2)
- On-chain bonds
- Challenge period
- Security Council multisig resolves disputes

#### Phase 3 – AVS (v3+)
- Full EigenLayer restaking
- Programmable slashing conditions
- Decentralized operator set

### Documentation Interpretation

All references to AVS/slashing in design docs **MUST** be interpreted as **future phases**, not v1 launch requirements.

**Example:**
```typescript
// design.md mentions "AVS slashing"
// Interpret as: Phase 3 feature, not v1 blocker
```

---

## Compliance Checklist

Before merging any Hunter code, verify:

- [ ] Sentinel uses Queue–Worker pattern (no monolithic polling)
- [ ] Worker functions handle only 1–5 contracts per run
- [ ] Surplus split happens at contract level (not bypassed in Edge Functions)
- [ ] Mobile ZK uses server-side proving or native Rust (no heavy JS)
- [ ] Paymaster has risk premium and panic mode
- [ ] AVS references are marked as Phase 3 (not v1 blockers)

---

## Tool Integration

### For Cursor / Amazon Q / Kiro

When generating code:

1. **Check tier:** Is this hot/warm/cold data?
2. **Check location:** Does this belong in Edge Function or UI?
3. **Check surplus:** Is this bypassing on-chain split?
4. **Check mobile:** Is this too heavy for JS?
5. **Check paymaster:** Does this have risk premium?

### Auto-Rejection Patterns

AI tools should **reject** code that:
- Implements Sentinel polling in a single function
- Calculates surplus off-chain without contract enforcement
- Runs heavy ZK proofs in mobile JS
- Sponsors gas without risk premium

---

**Status:** ✅ Audit Complete  
**Compliance Level:** A++++ (Production-Ready)  
**Next Review:** After v1 launch
