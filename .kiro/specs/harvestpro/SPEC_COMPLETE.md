# HarvestPro Specification Complete ✅

## Overview

The complete HarvestPro specification has been created with v1 (core), v2 (institutional), and v3 (enterprise) features. All documents are aligned and ready for implementation.

## What's Been Created

### 1. Requirements Document ✅
**Location:** `.kiro/specs/harvestpro/requirements.md`

**Contents:**
- Version History (v1, v2, v3)
- Extended Glossary (core, institutional, enterprise terms)
- Enhanced Data Models with v2/v3 fields
- Requirements 1-29:
  - **v1 (1-20)**: Core retail features
  - **v2 (21-25)**: Institutional features (MEV, economic substance, proxy assets, guardrails, audit-grade proof)
  - **v3 (26-29)**: Enterprise features (custody, maker/checker, sanctions, TWAP)

### 2. Design Document ✅
**Location:** `.kiro/specs/harvestpro/design.md`

**Contents:**
- Execution Architecture table (Next.js API vs Supabase Edge Functions)
- Updated architecture diagram with v2/v3 services
- Enhanced state machine with `awaiting_approval` status
- Correctness Properties 1-37 (v1: 1-20, v2: 21-29, v3: 30-37)
- Comprehensive v2/v3 implementation details
- Updated database schema with v3 tables
- Complete API specifications

### 3. Tasks Document ✅
**Location:** `.kiro/specs/harvestpro/tasks.md`

**Contents:**
- v1 Core Tasks (1-35) - Already completed
- v2 Institutional Tasks (36-42):
  - Task 36: v3 database schema migration
  - Task 37: MEV protection and private RPC
  - Task 38: Economic substance validation
  - Task 39: Proxy asset selection
  - Task 40: Institutional guardrails
  - Task 41: Enhanced Proof-of-Harvest
  - Task 42: v2 checkpoint
- v3 Enterprise Tasks (43-49):
  - Task 43: Custody integration
  - Task 44: Maker/checker governance
  - Task 45: Sanctions screening
  - Task 46: TWAP order routing
  - Task 47: UI updates for v2/v3
  - Task 48: v3 checkpoint
  - Task 49: v2/v3 documentation

### 4. Database Migration ✅
**Location:** `supabase/migrations/20250201000001_harvestpro_v3_schema.sql`

**Contents:**
- Extends `harvest_sessions` with v3 fields
- Extends `harvest_user_settings` with guardrails and custody config
- Creates `approval_requests` table (maker/checker)
- Creates `sanctions_screening_logs` table (KYT/AML)
- All indexes and RLS policies

### 5. Kiro Steering Files ✅
**Location:** `.kiro/steering/`

**Files Created:**
- `harvestpro-architecture.md` - Enforces "UI is Presentation Only" rule
- `harvestpro-stack.md` - Defines technology stack and standards
- `harvestpro-testing.md` - Defines property-based testing approach

## Architecture Enforcement

### The Golden Rule
**UI is Presentation Only. ALL business logic MUST be in Supabase Edge Functions.**

### Required Edge Functions

**v1 Core:**
- `harvest-sync-wallets` - Wallet sync
- `harvest-sync-cex` - CEX sync
- `harvest-recompute-opportunities` - Opportunity detection
- `harvest-notify` - Notifications (scheduled)

**v2 Institutional:**
- `harvest-economic-substance` - Economic substance validation
- `harvest-mev-protection` - Private RPC routing

**v3 Enterprise:**
- `harvest-kyt-screen` - Sanctions screening
- `webhook-fireblocks` - Custody webhooks
- `webhook-copper` - Custody webhooks
- `harvest-twap-worker` - TWAP execution (scheduled)

### Next.js API Routes (Thin Layer Only)
- Read from database with filters/pagination
- Validate auth/RLS
- Return JSON responses
- Orchestrate calls to Edge Functions
- Handle file downloads

## Implementation Roadmap

### Phase 0: Setup (Day 0)
✅ Kiro Steering files created
✅ Architecture rules defined
✅ Testing standards defined

### Phase 1: v1 Core (Days 1-16)
✅ Tasks 1-35 completed
- Database schema
- FIFO engine
- Opportunity detection
- Net benefit calculation
- Dashboard UI
- Execution flow
- CSV export
- Proof-of-Harvest

### Phase 2: v2 Institutional (Days 17-20)
🔲 Tasks 36-42 to implement
- MEV protection
- Economic substance validation
- Proxy assets
- Institutional guardrails
- Enhanced proof

### Phase 3: v3 Enterprise (Days 21-25)
🔲 Tasks 43-49 to implement
- Custody integration
- Maker/checker governance
- Sanctions screening
- TWAP order routing

## Current Status

### ✅ Complete
- Requirements document (v1, v2, v3)
- Design document (v1, v2, v3)
- Tasks document (v1, v2, v3)
- Database schema (v1, v3 migration)
- Kiro Steering files
- v1 implementation (Tasks 1-35)

### 🔲 To Implement
- v2 features (Tasks 36-42)
- v3 features (Tasks 43-49)
- Supabase Edge Functions (refactor from Next.js API routes)

## Next Steps

### Option A: Implement v2/v3 Features
Start with Task 36 (v3 database schema migration) and proceed through Tasks 36-49.

**Pros:**
- Adds institutional and enterprise capabilities
- Positions for high-value customers
- Demonstrates advanced features

**Cons:**
- More complex
- Requires external integrations (Fireblocks, TRM Labs, etc.)

### Option B: Refactor v1 to Edge Functions
Move heavy business logic from Next.js API routes to Supabase Edge Functions.

**Pros:**
- Aligns with architecture rules
- Better performance
- Easier to test
- Positions for OaaS model

**Cons:**
- Refactoring existing code
- No new features

### Option C: Verify v1 and Fix Gaps
Review v1 implementation (Tasks 1-35) and ensure everything works correctly.

**Pros:**
- Ensures solid foundation
- Catches any issues early
- Lower risk

**Cons:**
- No new features
- May be redundant if v1 is already working

## Recommended Approach (Updated)

### 1. Lock in Architecture for new work
- All new v2/v3 features MUST be implemented in Supabase Edge Functions from day one (no business logic in Next.js API routes or UI).

### 2. Implement v2/v3 Features (Tasks 36–49)
- MEV protection, economic substance, guardrails, custody, maker/checker, KYT, TWAP, with property tests for Properties 21–37.

### 3. Refactor any remaining v1 logic into Edge Functions
- If any heavy business logic still lives in Next.js API routes, move it into `supabase/functions/harvest-*` and keep routes thin.

**Why this order:**
- v1 is already complete and working
- v2/v3 features are high-value institutional/enterprise capabilities
- Architecture rules ensure all new code follows "UI = presentation only" from day one
- Refactoring can happen incrementally as needed

**Implementation Order:**
1. Run v3 database migration (Task 36)
2. Implement v2 features (Tasks 37-42)
3. Implement v3 features (Tasks 43-49)
4. Optionally refactor v1 to Edge Functions

## How to Use This Spec

### For Implementation
1. Open `.kiro/specs/harvestpro/tasks.md`
2. Start with Task 36 (v3 database schema migration)
3. Follow tasks in order
4. Reference `requirements.md` and `design.md` as needed
5. Adhere to steering files in `.kiro/steering/`

### For Kiro Agent
The Kiro agent will automatically:
- Read steering files to understand architecture rules
- Reference requirements and design documents
- Follow task list in order
- Enforce "UI is Presentation Only" rule
- Write property-based tests for all correctness properties

### For Code Review
Check that:
- No business logic in UI components
- All heavy logic is in Edge Functions
- All correctness properties have property tests
- All tests pass
- Architecture rules are followed

## Success Criteria

### v2 Institutional Complete When:
- ✅ All Tasks 36-42 marked complete
- ✅ All v2 property tests (21-29) passing
- ✅ MEV protection working
- ✅ Economic substance validation working
- ✅ Proxy assets working
- ✅ Guardrails enforced
- ✅ Enhanced proof includes v2 fields

### v3 Enterprise Complete When:
- ✅ All Tasks 43-49 marked complete
- ✅ All v3 property tests (30-37) passing
- ✅ Custody integration working (Fireblocks/Copper)
- ✅ Maker/checker workflows working
- ✅ Sanctions screening working
- ✅ TWAP execution working
- ✅ All v2/v3 UI updates complete

## Documentation

### For Developers
- `requirements.md` - What to build
- `design.md` - How to build it
- `tasks.md` - Step-by-step implementation
- `.kiro/steering/` - Architecture rules

### For Users
- API documentation in `docs/api/`
- User guides (to be created in Task 49)
- Custody integration guide (to be created in Task 49)
- Maker/checker workflow guide (to be created in Task 49)

## Support

### Questions About Spec
- Review `requirements.md` for "what"
- Review `design.md` for "how"
- Review `tasks.md` for "steps"

### Questions About Architecture
- Review `.kiro/steering/harvestpro-architecture.md`
- Key rule: UI is presentation only

### Questions About Testing
- Review `.kiro/steering/harvestpro-testing.md`
- Key rule: Property tests for all correctness properties

## Summary

The HarvestPro specification is **complete and ready for implementation**. All documents are aligned, steering files enforce architecture, and the task list provides a clear roadmap from v1 → v2 → v3.

**Start implementing v2/v3 features by opening `.kiro/specs/harvestpro/tasks.md` and beginning with Task 36.**

---

**Specification Version:** 3.0  
**Last Updated:** January 2025  
**Status:** ✅ Complete - Ready for Implementation
