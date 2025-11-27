# Hunter Screen (Feed) - Complete Specification

## Overview

The Hunter Screen is AlphaWhale's high-performance, personalized discovery feed for DeFi opportunities. This directory contains the complete specification including requirements, design, architecture rules, and audit compliance.

## Document Index

### 📋 Core Specification

1. **[requirements.md](./requirements.md)**
   - User stories and acceptance criteria
   - EARS-compliant requirements
   - Covers v1, v2, and v3 features

2. **[design.md](./design.md)**
   - Technical architecture
   - Component structure
   - Data models
   - Implementation examples
   - **Includes Audit v1 compliance notes**

3. **[tasks.md](./tasks.md)** ⭐ **IMPLEMENTATION GUIDE**
   - 80 implementation tasks (58 v1 + 22 v2 audit)
   - Organized by feature and audit section
   - Includes estimates and dependencies
   - References requirements and audit sections
   - **See:** [TASKS_UPDATED.md](./TASKS_UPDATED.md) for update summary

### 🏗️ Architecture Documentation

3. **[ARCHITECTURE_CLARIFICATION.md](./ARCHITECTURE_CLARIFICATION.md)** ⭐ **START HERE**
   - **The Golden Rule:** All business logic in Edge Functions
   - Correct vs incorrect folder structures
   - Client data flow examples
   - **Highest priority document**

4. **[ARCHITECTURE_AUDIT_V1.md](./ARCHITECTURE_AUDIT_V1.md)** ⭐ **CRITICAL**
   - A++++ production-ready patterns
   - 5 critical architectural fixes:
     1. Sentinel Queue–Worker pattern
     2. Protocol-level surplus sharing
     3. Mobile ZK with native Rust
     4. Paymaster volatility guardrails
     5. EigenLayer phased adoption
   - Complete code examples
   - Compliance checklist

5. **[ARCHITECTURE_COMPLETE.md](./ARCHITECTURE_COMPLETE.md)**
   - Summary of architecture alignment
   - Location mapping table
   - Implementation patterns
   - Success criteria

6. **[QUICK_ARCHITECTURE_REFERENCE.md](./QUICK_ARCHITECTURE_REFERENCE.md)**
   - One-page cheat sheet
   - Decision tree for code placement
   - Common mistakes and fixes
   - Code pattern templates

### ✅ Status & Integration

7. **[DESIGN_ARCHITECTURE_ALIGNMENT.md](./DESIGN_ARCHITECTURE_ALIGNMENT.md)**
   - Documents design.md updates
   - Before/after code examples
   - Implementation checklist

8. **[AUDIT_INTEGRATION_COMPLETE.md](./AUDIT_INTEGRATION_COMPLETE.md)**
   - Audit integration summary
   - Verification checklists
   - AI tool integration guide

9. **[TASKS_UPDATED.md](./TASKS_UPDATED.md)**
   - Tasks.md update summary
   - 22 new audit tasks added
   - Milestone breakdown
   - Implementation guide

## Quick Start

### For New Developers

1. **Read first:** [ARCHITECTURE_CLARIFICATION.md](./ARCHITECTURE_CLARIFICATION.md)
2. **Then read:** [ARCHITECTURE_AUDIT_V1.md](./ARCHITECTURE_AUDIT_V1.md)
3. **Reference:** [QUICK_ARCHITECTURE_REFERENCE.md](./QUICK_ARCHITECTURE_REFERENCE.md)
4. **Implement:** Follow patterns in [design.md](./design.md)

### For AI Tools (Cursor / Amazon Q / Kiro)

When generating Hunter code:

1. **Check:** [ARCHITECTURE_CLARIFICATION.md](./ARCHITECTURE_CLARIFICATION.md) for location rules
2. **Check:** [ARCHITECTURE_AUDIT_V1.md](./ARCHITECTURE_AUDIT_V1.md) for pattern constraints
3. **Reference:** Code examples in audit document
4. **Verify:** Compliance checklist before generating

## The Golden Rule

```
🧠 SMART CODE → supabase/functions/*
🎨 DUMB CODE → src/app/* and src/components/*
```

**All business logic MUST live in Supabase Edge Functions.**

## Document Priority

When documents conflict, follow this hierarchy:

```
1. ARCHITECTURE_AUDIT_V1.md        ← CRITICAL CONSTRAINTS
2. ARCHITECTURE_CLARIFICATION.md   ← GOLDEN RULE
3. design.md (with audit notes)    ← WHAT TO BUILD
4. requirements.md                 ← WHY TO BUILD
5. QUICK_ARCHITECTURE_REFERENCE.md ← QUICK LOOKUP
```

## Key Architectural Patterns

### Sentinel Monitoring
```
✅ Queue–Worker Fan-Out
❌ Monolithic Polling
```

**Location:**
- `supabase/functions/sentinel-scheduler/` (cron)
- `supabase/functions/sentinel-worker/` (queue consumer)

### Intent Execution
```
✅ On-Chain Surplus Split
❌ Off-Chain Surplus Bypass
```

**Location:**
- `contracts/IntentSettlement.sol` (smart contract)
- `supabase/functions/hunter-intent-execute/` (orchestrator)

### Mobile ZK
```
✅ Server-Side or Native Rust
❌ Heavy JS in Webview
```

**Location:**
- `supabase/functions/zk-eligibility-verify/` (server-side)
- Native Mopro integration (Phase 2+)

### Paymaster
```
✅ Risk Premium + Panic Mode
❌ Stale Oracle Prices
```

**Location:**
- `contracts/AlphaWhalePaymaster.sol` (smart contract)
- `supabase/functions/paymaster-orchestrator/` (quote service)

## Feature Phases

### Phase 1 (v1 Launch)
- Feed ranking and filtering
- Eligibility preview
- Guardian trust integration
- Basic intent execution
- Whitelist solvers
- Server-side ZK

### Phase 2 (v2)
- Ranking safety mode
- Regulatory policy engine
- Guardian liability
- Optimistic bonds
- Native mobile ZK
- Threat monitoring

### Phase 3 (v3)
- Sentinel agents
- Full AVS integration
- Advanced ZK circuits
- Decentralized solver network

## Compliance Checklist

Before merging any Hunter code:

- [ ] All business logic in `supabase/functions/*`
- [ ] Sentinel uses Queue–Worker pattern
- [ ] Worker functions handle only 1–5 contracts
- [ ] Surplus split at contract level
- [ ] Mobile ZK server-side or native Rust
- [ ] Paymaster has risk premium and panic mode
- [ ] AVS references marked as Phase 3
- [ ] No calculations in React components
- [ ] No external API calls from Next.js
- [ ] API routes are < 50 lines (if they exist)

## File Structure

```
.kiro/specs/hunter-screen-feed/
├── README.md                              ← You are here
├── requirements.md                        ← What to build
├── design.md                              ← How to build (with audit notes)
├── ARCHITECTURE_CLARIFICATION.md          ← Where to build (Golden Rule)
├── ARCHITECTURE_AUDIT_V1.md               ← Critical patterns (A++++)
├── ARCHITECTURE_COMPLETE.md               ← Alignment summary
├── QUICK_ARCHITECTURE_REFERENCE.md        ← Quick lookup
├── DESIGN_ARCHITECTURE_ALIGNMENT.md       ← Design updates
└── AUDIT_INTEGRATION_COMPLETE.md          ← Audit integration
```

## Implementation Workflow

```
1. Read requirements.md
   ↓
2. Read ARCHITECTURE_CLARIFICATION.md
   ↓
3. Read ARCHITECTURE_AUDIT_V1.md
   ↓
4. Implement Edge Functions (business logic)
   ↓
5. Implement Next.js routes (thin proxies)
   ↓
6. Implement React components (presentation)
   ↓
7. Verify compliance checklist
   ↓
8. Deploy
```

## Testing Strategy

- **Edge Functions:** Unit tests + Property tests
- **Next.js Routes:** Integration tests (thin, so minimal)
- **React Components:** E2E tests (Playwright)
- **Smart Contracts:** Foundry tests

## Deployment

- **Edge Functions:** Deploy independently to Supabase
- **Next.js App:** Deploy to Vercel
- **Database:** Supabase (migrations)
- **Smart Contracts:** Deploy to target chains

## Support

### Questions?

1. Check [QUICK_ARCHITECTURE_REFERENCE.md](./QUICK_ARCHITECTURE_REFERENCE.md)
2. Check [ARCHITECTURE_AUDIT_V1.md](./ARCHITECTURE_AUDIT_V1.md)
3. Check [ARCHITECTURE_CLARIFICATION.md](./ARCHITECTURE_CLARIFICATION.md)
4. Ask: "Is this business logic?" → Yes = Edge Function

### Common Issues

**Q: Where does this code go?**  
A: Check the decision tree in [QUICK_ARCHITECTURE_REFERENCE.md](./QUICK_ARCHITECTURE_REFERENCE.md)

**Q: Can I put this in Next.js?**  
A: Only if it's presentation, validation, or a thin proxy. See [ARCHITECTURE_CLARIFICATION.md](./ARCHITECTURE_CLARIFICATION.md)

**Q: How do I implement Sentinels?**  
A: Use Queue–Worker pattern from [ARCHITECTURE_AUDIT_V1.md](./ARCHITECTURE_AUDIT_V1.md) Section 1

**Q: How do I handle surplus?**  
A: On-chain split only. See [ARCHITECTURE_AUDIT_V1.md](./ARCHITECTURE_AUDIT_V1.md) Section 2

## Status

- ✅ Requirements complete (v1, v2, v3)
- ✅ Design complete (with audit notes)
- ✅ Architecture rules defined
- ✅ Audit compliance documented
- ✅ Code examples provided
- ✅ AI tool integration ready
- ✅ Compliance checklists created
- ✅ **Tasks updated with 22 audit implementation tasks**

**Current Phase:** v1 Production Polish (7 tasks remaining)  
**Next Phase:** v2 Audit Compliance (17 tasks)  
**Total Tasks:** 80 (56 complete, 24 remaining)

---

**Last Updated:** 2025-01-09  
**Compliance Level:** A++++ (Production-Ready)  
**Status:** Complete and Ready for Implementation 🚀
