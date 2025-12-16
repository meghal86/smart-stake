# PR Checklist — AlphaWhale UX Gap Improvements (SCOPE LOCK)

## 🔥 HARD GATES (Reviewer must check ALL)

| Gate | Pass? | Evidence |
|------|-------|----------|
| **Scope Lock** (no new pages/features/APIs/data) | [ ] | Diff + file list |
| **Traceability** (Req + Design for every change) | [ ] | PR description + code headers |
| **Tests pass** (unit/integration/e2e as applicable) | [ ] | CI link + logs |
| **No Silent Clicks** respected | [ ] | tests or runtime validation |
| **No new deps / no backend changes** | [ ] | lockfile + API/supabase untouched |

**If any Hard Gate fails → DO NOT MERGE.**

---

## 0) PR Summary (Required)

**What UX gap is fixed?** (1–3 bullets)
- 
- 
- 

**Requirement IDs covered:** R?.?.? (must list)

**Design references:** Design → ... (must list)

**Screens impacted:** (check all that apply)
- [ ] Home Dashboard (`/`)
- [ ] Guardian (`/guardian`)
- [ ] Hunter (`/hunter`)
- [ ] HarvestPro (`/harvestpro`)
- [ ] Portfolio (`/portfolio`)
- [ ] Settings (`/settings`)

**Required labels:**
- [ ] `ux-gap` label added to PR
- [ ] (Optional) `needs-evidence` label removed before merge

---

## 1) Scope Lock Compliance (Hard Gate)

**This PR must be UX-only.**

- [ ] ✅ No new pages/screens/routes were created
- [ ] ✅ No new product features/flows were introduced
- [ ] ✅ No new data models, tables, migrations, or schema changes
- [ ] ✅ No new backend APIs / Edge Functions / server endpoints
- [ ] ✅ No new dashboards/widgets/analytics UI sections
- [ ] ✅ No renaming/restructuring of existing product concepts
- [ ] ✅ No new demo data added (only labeling existing demo states)
- [ ] ✅ No new dependencies added (see Section 14)

**If ANY box above is false → PR must be split or rejected.**

---

## 2) Traceability (Hard Gate)

**Every changed file must trace to requirements + design.**

- [ ] PR description includes Requirement IDs + Design sections (explicit mapping)
- [ ] Each commit message includes ≥1 Requirement ID (ex: `R3.GAS.NONZERO`)
- [ ] Each changed module/file includes a short comment header:
  ```typescript
  // Req: R?.?.?
  // Design: Design → <section>
  ```
- [ ] No "nice-to-have" edits without explicit Requirement + Design mapping

**Traceability Map (Required):**
A short table is present in the PR description:

| File | Change | Requirement | Design |
|------|--------|-------------|--------|
|      |        |             |        |

---

## 3) Routing & Navigation Integrity (R1 + R9)

- [ ] Bottom nav routes exactly to canonical paths:
  - Home → `/`
  - Guardian → `/guardian`
  - Hunter → `/hunter`
  - HarvestPro → `/harvestpro`
  - Portfolio → `/portfolio`
  - Settings → `/settings`
- [ ] Deep links restore deterministically (back/forward works)
- [ ] Invalid tabs canonicalize with user feedback (toast), no crashes
- [ ] Active nav state updates immediately and persists across refresh

**Mechanical "Route Diff Proof" (Required if nav touched):**
Paste the exact git diff snippet showing updated `href`/router calls for nav items in PR description

**Evidence required:**
- [ ] Screenshot/GIF (or Playwright video) showing each nav click landing correctly
- [ ] Test(s) asserting URL + active state (observable behavior)

---

## 4) Loading / Skeleton / Async Feedback (R2 + R7)

- [ ] Any async action shows feedback within 100ms (button loading, skeleton, or descriptive loader)
- [ ] AppShell persists (no white flash; header + bottom nav stay mounted)
- [ ] Timeout behavior >8s shows error state + Retry
- [ ] Skeleton dimensions match final layout (no layout shift)

**Evidence required:**
- [ ] Video/GIF showing navigation with shell persistent
- [ ] Test(s) checking loading UI appears quickly (observable behavior)

---

## 5) Demo Mode & Data Integrity (R3)

- [ ] Demo banner appears when wallet not connected: "Demo Mode — Data is simulated"
- [ ] Live mode only when readiness conditions satisfied (no guessing)
- [ ] Gas never displays "0 gwei"
- [ ] On gas failure, shows "Gas unavailable" + telemetry event
- [ ] Timestamps avoid "0s ago" (use "Just now" under 1s)

**Evidence required:**
- [ ] Screenshot of Demo banner + CTA
- [ ] Screenshot of gas fallback state
- [ ] Test(s) that assert display text never equals "0 gwei"

---

## 6) Motion & Interaction Quality (R4 + R13 No Silent Clicks)

- [ ] Primary buttons: press scale to 0.98 (~120ms) and return smoothly
- [ ] Cards: hover lift ~4px with smooth shadow transition (~200ms)
- [ ] Reduced motion preference respected (animations reduced/disabled)
- [ ] **No Silent Clicks**: every clickable element results in navigation/modal/toast/tooltip/loading/disabled explanation

**Evidence required:**
- [ ] Short GIF showing press + hover micro-interactions
- [ ] Runtime validation in dev OR tests proving no dead clicks

---

## 7) Forms & Settings Quality (R5 + R6)

- [ ] No "Invalid Date" placeholders anywhere
- [ ] Disabled fields have explanations (tooltip/help text)
- [ ] Validation on blur with clear messages
- [ ] Save button disabled until valid + modified
- [ ] Save success toast: "Changes saved ✓" / error toast with specific message

**Evidence required:**
- [ ] Screenshot showing "Not set" instead of invalid placeholder
- [ ] Test(s) for validation messaging + disabled/enabled Save state

---

## 8) Trust Signals & Proof (R10 + R14)

- [ ] "Click for proof" / trust badges never dead-end
- [ ] If proof destination doesn't exist, UI shows honest unavailable state (not fake links)
- [ ] Metrics show "How it's calculated" or methodology modal (only if element already exists)
- [ ] Any external proof link opens in new tab (preserve context)
- [ ] "Last updated" timestamp present when applicable (or clearly unavailable)

**Evidence required:**
- [ ] Screenshot of proof interaction (modal/open tab/fallback)
- [ ] Test(s) verifying proof element triggers observable result

---

## 9) Error Handling & Resilience (R15 + R16)

- [ ] API failures show human-friendly messages + Retry
- [ ] Error boundaries prevent whole-app crash
- [ ] Rate limit / network errors have actionable copy
- [ ] Telemetry logs errors without sensitive data

**Evidence required:**
- [ ] Screenshot of error state with Retry
- [ ] Test(s) simulating failure + asserting recovery UI shows

---

## 10) Tests & Quality Gates (Hard Gate)

- [ ] Unit tests pass
- [ ] Integration tests pass (if applicable)
- [ ] E2E tests pass for critical paths (nav, wallet connect UI state, settings save)
- [ ] Property-based tests (if included) run with ≥100 iterations
- [ ] Accessibility: axe checks pass (WCAG AA)
- [ ] Performance: Lighthouse ≥90 performance, ≥95 accessibility (or baseline deltas documented)

**Attach CI links / screenshots:**
- [ ] CI run link: 
- [ ] Lighthouse report screenshot or output
- [ ] Playwright report/video (if used)

---

## 11) File Change Review (Hard Gate)

**Allowlist-only file patterns**

✅ **ALLOWED:**
- `src/components/**/*.tsx`
- `src/pages/**/*.tsx`
- `src/app/**/*.tsx`
- `src/hooks/**/*.ts`
- `src/lib/**/*.ts` (UX utilities only; no business logic)
- `src/styles/**/*.css`
- `src/__tests__/**/*`
- `tests/e2e/**/*`
- `*.md`

❌ **FORBIDDEN:**
- `src/app/api/**/*`
- `supabase/functions/**/*`
- `supabase/migrations/**/*`
- `*.sql`
- `src/schemas/**/*` (unless strictly UI validation, no new domain models)
- `package.json`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json` (see Section 14)

**Unexpected files changed (must justify):**
- File: _______ Reason: ______________________
- File: _______ Reason: ______________________

**Reviewer must explicitly confirm:**
- [ ] No files changed outside allowlist (or justified above)
- [ ] No backend changes (routes/schema/API)
- [ ] PR is minimal: no sweeping formatting-only diffs

---

## 12) Component Standardization Check (R13)

**If PR touches buttons/skeletons/toasts:**

- [ ] Uses single `PrimaryButton` (no ad-hoc primary `<button>`)
- [ ] Uses unified `Skeleton` system
- [ ] Uses standardized `Toast` system
- [ ] Uses CSS custom props (`--aw-primary`, `--aw-secondary`) not hardcoded hex

---

## 13) AlphaWhale-Specific Checks

- [ ] Navigation uses Next.js primitives only (no new routing framework)
- [ ] Supabase: no new queries/clients unless replacing existing call sites (UX-only)
- [ ] No new "live data wiring" that requires new backend infrastructure (fallback states instead)

---

## 14) Dependency & Bundle Guard (Hard Gate)

- [ ] No new dependencies added
- [ ] No lockfile changes (unless explicitly approved for UX tooling)
- [ ] No new heavy UI libs (animation frameworks, charting libs, state mgmt frameworks)
- [ ] Any new dependency MUST map to a Requirement ID and be justified in PR description

**If lockfile changed, list why:**
- Lockfile changed because: ___________________________
- Requirement ID: ___________________________

---

## 15) Reviewer Sign-off (Required)

- [ ] I verified scope lock compliance
- [ ] I verified traceability (Req + Design) for all changed modules
- [ ] I verified observable UX behavior matches requirements
- [ ] I verified tests + a11y + perf gates passed
- [ ] I tested locally OR reviewed sufficient evidence

**Reviewer name:** _______________

---

## Evidence Attachments

**Required attachments:**
1. **Navigation Evidence:** Screenshot/GIF of navigation flows
2. **Loading States:** Video of loading feedback timing
3. **Demo Mode:** Screenshot of demo banner and fallback states
4. **Micro-interactions:** GIF of button press and card hover animations
5. **Error States:** Screenshot of error handling with retry options
6. **Test Results:** CI pipeline results and test coverage

**Upload evidence here or link to external hosting:**
- 
- 
- 

---

**🚨 HARD GATES: This PR cannot be merged unless ALL hard gate sections are complete and verified.**

**📋 SCOPE LOCK: Any changes outside UX improvements must be justified or moved to separate PR.**

**🔍 TRACEABILITY: Every change must map to specific Requirement ID + Design section.**