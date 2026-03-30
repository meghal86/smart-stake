# 🐋 AlphaWhale — Master Weekly Roadmap
## Complete daily tasks with exact Claude Code prompts

**Project:** AlphaWhale DeFi Intelligence Platform
**Target:** Vercel (Web) · Google Play (Android) · Apple App Store (iOS)
**Timeline:** 6 Weeks from March 28, 2026

---

## HOW TO USE THIS DOCUMENT

Each day has:
1. **Goal** — what gets done today
2. **Claude Code Prompt** — exact prompt to paste into Claude Code (or Cowork) to execute it
3. **Verify** — how to confirm the task is done

Copy the prompt, paste it into Claude, let it run. Do not modify the code manually unless instructed.

---

# ✅ WEEK 1 — Security & Foundation
**Already completed March 28, 2026:**
- AdminRouteWrapper created — all /admin/* routes protected
- Debug/test routes gated to DEV mode only
- Hardcoded Supabase key removed from App.tsx
- RainbowKit polling interval removed
- PWA manifest.json upgraded with shortcuts and maskable icons
- Service worker upgraded with offline caching
- capacitor.config.ts created for iOS/Android builds
- next.config.js deprecated
- .env.example updated with all new variables

---

# 📅 WEEK 2 — TypeScript, ESLint & Dead Code
**Theme:** Stop shipping bugs silently. Clean the codebase.

---

## Day 6 — TypeScript: Restore Type Checking

**Goal:** Re-enable TypeScript so build catches type errors before users do.

**Claude Code Prompt:**
```
In the file /smart-stake/vite.config.ts, the TypeScript checking is currently bypassed with empty tsconfigRaw objects.

Please do the following:
1. Read vite.config.ts
2. Remove the `tsconfigRaw: {}` from the `optimizeDeps.esbuildOptions` section
3. Keep the `esbuild.tsconfigRaw` with just `{ compilerOptions: { jsx: 'react-jsx', useDefineForClassFields: true } }` — this is valid
4. Read tsconfig.app.json and tsconfig.json to understand current compiler settings
5. Run: cd /smart-stake && npx tsc --noEmit 2>&1 | head -100
6. From the TypeScript errors, identify the top 10 most critical ones (focus on: variables used before defined, missing required props, incorrect return types in hooks)
7. Fix those top 10 errors by editing the relevant source files
8. Run tsc --noEmit again and show me the remaining error count
9. Run npm run build to confirm the build still succeeds
```

**Verify:** `npx tsc --noEmit` error count reduced, `npm run build` succeeds.

---

## Day 7 — ESLint: Fix All Errors (Not Warnings)

**Goal:** Zero ESLint errors. Warnings can wait, errors cannot.

**Claude Code Prompt:**
```
The AlphaWhale project at /smart-stake currently runs ESLint with --max-warnings 1500 which silences many problems.

Please do the following:
1. Run: cd /smart-stake && npm run lint 2>&1 | grep " error " | head -60
2. Identify all ERRORS (not warnings) across the codebase
3. Fix every error. Priority order:
   a. React hooks rules violations (missing deps, conditional hooks)
   b. Undefined variables being accessed
   c. Import errors (missing modules)
   d. TypeScript `any` in security-sensitive code (auth, wallet, payments)
4. After fixing, run: npm run lint 2>&1 | grep " error " | wc -l
5. Confirm zero errors remain
6. Also search for and remove all orphaned `console.log` statements in src/contexts/ and src/services/ (keep console.error/warn)
7. Run npm run build to confirm it succeeds
```

**Verify:** `npm run lint` shows 0 errors (warnings OK for now).

---

## Day 8 — Remove Duplicate Pages

**Goal:** One version of each page. Remove all the legacy duplicates.

**Claude Code Prompt:**
```
The AlphaWhale project at /smart-stake has multiple duplicate versions of the same pages that need to be consolidated.

Please do the following:
1. Read /smart-stake/src/App.tsx fully to understand current routing
2. Remove these duplicate/legacy page FILES (delete their content and replace with a redirect to canonical version):
   - src/pages/Signup.tsx → canonical is SignupNew.tsx (route /signup)
   - src/pages/GuardianUX2.tsx → canonical is GuardianEnhanced.tsx (route /guardian)
   - src/pages/GuardianMobile.tsx → canonical is GuardianEnhanced.tsx
   - src/pages/PortfolioEnhanced.tsx → canonical is PortfolioUnified.tsx (route /portfolio)
   - src/pages/PortfolioIntelligence.tsx → canonical is PortfolioUnified.tsx
   - src/pages/Hub5Page.tsx → canonical is PulsePage (route /hub2/pulse)
   - src/pages/Hub2Plus.tsx → canonical is PulsePage
   - src/pages/LiteHub.tsx → canonical is Index.tsx (route /lite)

   For each file: replace its content with: export { default } from './[CanonicalPage]';

3. In App.tsx:
   - Keep /guardian-ux2 and /guardian-enhanced routes but point them to GuardianEnhanced
   - Keep /portfolio-intelligence route but point it to PortfolioUnified
   - Remove /lite/hub and /lite/hub5 routes (redirect to /hub)
   - Remove /hub2-plus route (redirect to /hub2/pulse)

4. Remove these unused imports from App.tsx:
   - GuardianUX2, GuardianMobile (if imported)
   - Hub2Plus, Hub5Page, LiteHub (if imported)
   - PortfolioEnhanced, PortfolioIntelligence (if imported)

5. Run npm run build to confirm everything still compiles
6. Report: how many KB was removed from the bundle estimate
```

**Verify:** `npm run build` succeeds, `dist/` is smaller than before.

---

## Day 9 — Lazy Loading: Split the Bundle

**Goal:** Users load only what they need. Reduce initial JS bundle by 40%+.

**Claude Code Prompt:**
```
The AlphaWhale project at /smart-stake has a large JavaScript bundle. All pages load upfront even if users never visit them.

Please do the following:
1. Read /smart-stake/src/App.tsx
2. Convert these heavy page imports to React.lazy() — they are only needed when user navigates there:
   - GuardianEnhanced → const GuardianEnhanced = React.lazy(() => import('./pages/GuardianEnhanced'))
   - Hunter → const Hunter = React.lazy(() => import('./pages/Hunter'))
   - HarvestPro → const HarvestPro = React.lazy(() => import('./pages/HarvestPro'))
   - AnomalyDetection → const AnomalyDetection = React.lazy(() => import('./pages/AnomalyDetection'))
   - AdminBI → const AdminBI = React.lazy(() => import('./pages/AdminBI'))
   - AdminOps → const AdminOps = React.lazy(() => import('./pages/AdminOps'))
   - ReportsExports → const ReportsExports = React.lazy(() => import('./pages/ReportsExports'))
   - WalletAnalysis → const WalletAnalysis = React.lazy(() => import('./pages/WalletAnalysis'))
   - WhaleAnalyticsDashboard → const WhaleAnalyticsDashboard = React.lazy(() => import('./pages/WhaleAnalytics'))
   - PredictionsScenarios → const PredictionsScenarios = React.lazy(() => import('./pages/PredictionsScenarios'))

3. Add React.Suspense wrapper around the <Routes> block with a centered spinner fallback:
   ```tsx
   import React, { Suspense } from 'react';
   const PageLoader = () => (
     <div className="flex items-center justify-center min-h-screen bg-background">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
     </div>
   );
   // Wrap <Routes>...</Routes> with <Suspense fallback={<PageLoader />}>
   ```

4. Keep these as eager imports (they load on every page):
   - AlphaWhaleHome, Login, Signup, Signin, NotFound, PortfolioUnified, Cockpit

5. Run npm run build and report the size of the main chunk before vs after

6. Also update vite.config.ts manualChunks to add:
   - 'guardian-chunk': ['src/pages/GuardianEnhanced']  (approximate)
   - 'hunter-chunk': for Hunter and HarvestPro related pages
```

**Verify:** `npm run build` shows smaller main chunk. Guardian/Hunter pages are separate chunks.

---

## Day 10 — Repository Cleanup

**Goal:** A clean repo that investors and reviewers can actually navigate.

**Claude Code Prompt:**
```
The AlphaWhale project at /smart-stake has ~350 markdown files and ~200 test HTML files cluttering the root directory. This needs to be organized before any App Store submission or investor review.

Please do the following:

1. Create directory structure:
   - /smart-stake/docs/archive/fix-logs/     (for all *_FIX.md, *_COMPLETE.md, *_STATUS.md files)
   - /smart-stake/docs/archive/html-tests/   (for all test-*.html, debug-*.html files)
   - /smart-stake/docs/archive/sql-scripts/  (for loose .sql files in root)
   - /smart-stake/docs/guides/               (for important guides to KEEP accessible)

2. Move to docs/guides/ (keep these visible):
   - LAUNCH_ROADMAP.md
   - MASTER_ROADMAP_WITH_PROMPTS.md
   - ALPHAWHALE_COMPLETE_REVIEW.md
   - DEPLOYMENT_GUIDE.md
   - README.md (stays in root)

3. Move to docs/archive/fix-logs/ — all files matching patterns:
   *_FIX*.md, *_COMPLETE.md, *_STATUS.md, *_SUMMARY.md, *_GUIDE.md (except DEPLOYMENT_GUIDE),
   TASK_*.md, PHASE_*.md, GUARDIAN_*.md, PORTFOLIO_*.md, WALLET_*.md, HUNTER_*.md

4. Move to docs/archive/html-tests/ — all files matching:
   test-*.html, debug-*.html, *.html (in root only, not in src/)

5. Move to docs/archive/sql-scripts/ — all *.sql files in root

6. Update README.md root section to point to docs/guides/LAUNCH_ROADMAP.md

7. Run: ls /smart-stake/*.md | wc -l  (should be 1 — just README.md)
8. Run: ls /smart-stake/*.html | wc -l (should be 0 — index.html is not in root)
9. Run: npm run build to confirm nothing broke
```

**Verify:** Root directory contains only config files + README. `npm run build` passes.

---

# 📅 WEEK 3 — Performance & Quality Gates
**Theme:** Measure everything before shipping.

---

## Day 11 — Lighthouse Performance Audit

**Goal:** Achieve Lighthouse scores: Performance >75, Accessibility >85, SEO >90.

**Claude Code Prompt:**
```
Run a Lighthouse audit on the AlphaWhale project at /smart-stake and fix the top issues.

Please do the following:
1. Start the dev server: cd /smart-stake && npm run dev &
2. Wait 5 seconds for it to start
3. Run Lighthouse: npx lighthouse http://localhost:8080 --output=json --output-path=/smart-stake/lighthouse-report.json --chrome-flags="--headless --no-sandbox"
4. Read the JSON report and extract:
   - Performance score
   - Accessibility score
   - Best Practices score
   - SEO score
   - Top 5 performance opportunities (with estimated savings)
   - All accessibility failures

5. Fix the following common issues:
   a. If images missing alt text → add alt attributes
   b. If buttons missing accessible names → add aria-label
   c. If color contrast failures → update text colors in Tailwind classes
   d. If missing meta description → check index.html (already has it, verify it)
   e. If render-blocking resources → move non-critical CSS to async

6. Re-run Lighthouse after fixes and report final scores
7. Save a summary to /smart-stake/docs/guides/LIGHTHOUSE_SCORES.md
```

**Verify:** Lighthouse scores documented. Accessibility score >85.

---

## Day 12 — Add Error Monitoring (Sentry)

**Goal:** Know about production errors before users report them.

**Claude Code Prompt:**
```
Add Sentry error monitoring to the AlphaWhale project at /smart-stake.

Please do the following:
1. Install: cd /smart-stake && npm install @sentry/react @sentry/vite-plugin
2. Create /smart-stake/src/lib/sentry.ts:
```typescript
import * as Sentry from '@sentry/react';

export function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) return;

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: false }),
    ],
    // Don't send errors from browser extensions
    ignoreErrors: [
      'chrome-extension://',
      'moz-extension://',
      'ResizeObserver loop',
    ],
    beforeSend(event) {
      // Remove sensitive wallet addresses from error data
      if (event.request?.data) {
        const str = JSON.stringify(event.request.data);
        if (str.includes('0x') && str.length > 100) {
          event.request.data = '[wallet data redacted]';
        }
      }
      return event;
    },
  });
}
```

3. In /smart-stake/src/main.tsx: import and call initSentry() before rendering
4. In /smart-stake/src/components/ErrorBoundary.tsx: integrate Sentry.ErrorBoundary if not already
5. Add to .env.example: VITE_SENTRY_DSN=your_sentry_dsn
6. Add to vite.config.ts: import sentryVitePlugin and add to plugins array (conditional on VITE_SENTRY_DSN being set)
7. Run npm run build to confirm no errors
```

**Verify:** Build succeeds. Sentry initializes when DSN is set.

---

## Day 13 — Add Rate Limiting to API Routes

**Goal:** Prevent abuse of your Supabase edge functions.

**Claude Code Prompt:**
```
Review and harden the API routes in the AlphaWhale project at /smart-stake/src/api/ and /smart-stake/supabase/functions/.

Please do the following:
1. List all files in /smart-stake/src/api/ and read the first 3 most important ones
2. List all Supabase edge functions in /smart-stake/supabase/functions/
3. Check if Upstash Redis rate limiting is already set up (look for @upstash/ratelimit usage)
4. For any API routes in src/api/ that don't have rate limiting:
   - Add a simple in-memory rate limiter using a Map (for Vercel edge)
   - Limit to 30 requests per minute per IP
   - Return 429 with Retry-After header when exceeded

5. Create /smart-stake/src/api/middleware/rateLimit.ts with a reusable rate limiter
6. Apply it to the most sensitive endpoints (stripe, auth-related, wallet scan)
7. Run npm run build to confirm no errors
8. Document which endpoints are rate-limited in /smart-stake/docs/guides/API_SECURITY.md
```

**Verify:** Rate limiting documented. Build passes.

---

## Day 14 — Mobile Testing & Touch Fixes

**Goal:** App works perfectly on real iOS Safari and Android Chrome.

**Claude Code Prompt:**
```
Audit and fix mobile-specific issues in the AlphaWhale project at /smart-stake.

Please do the following:
1. Search for these common mobile issues in src/components/ and src/pages/:
   a. Any fixed pixel widths > 375px that don't have responsive breakpoints
   b. Click targets smaller than 44x44px (Apple's minimum touch target)
   c. Input zoom on iOS: inputs with font-size < 16px trigger auto-zoom on iOS Safari
   d. Missing touch-action CSS properties on draggable/scrollable elements
   e. Horizontal overflow causing layout shift

2. Fix all discovered issues:
   - Minimum touch targets: ensure all buttons/links have min-h-[44px] min-w-[44px]
   - Input font sizes: ensure all <input> elements have text-base (16px) or larger
   - Add touch-action: pan-y to vertical scroll containers

3. In src/App.tsx, check that the viewport meta tag (already in index.html) is correct:
   `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />`

4. Check the portfolio page (/portfolio) and cockpit page (/cockpit) for:
   - Table overflow on small screens (needs overflow-x-auto wrapper)
   - Chart containers that don't resize on mobile

5. Create /smart-stake/docs/guides/MOBILE_CHECKLIST.md with what was fixed

6. Run npm run build to confirm no errors
```

**Verify:** No horizontal scroll on mobile viewport. All touch targets ≥44px.

---

## Day 15 — Security Headers & CSP

**Goal:** Pass security scanner checks. Required for App Store compliance.

**Claude Code Prompt:**
```
Add security headers to the AlphaWhale project at /smart-stake for production deployment.

Please do the following:
1. Read /smart-stake/vercel.json
2. Add comprehensive security headers to vercel.json for all routes:
```json
{
  "key": "X-Content-Type-Options",
  "value": "nosniff"
},
{
  "key": "X-Frame-Options",
  "value": "DENY"
},
{
  "key": "X-XSS-Protection",
  "value": "1; mode=block"
},
{
  "key": "Referrer-Policy",
  "value": "strict-origin-when-cross-origin"
},
{
  "key": "Permissions-Policy",
  "value": "camera=(), microphone=(), geolocation=(), payment=(self)"
},
{
  "key": "Strict-Transport-Security",
  "value": "max-age=63072000; includeSubDomains; preload"
}
```

3. Add a Content-Security-Policy header that:
   - Allows self for scripts/styles
   - Allows Supabase domain for connect-src
   - Allows Stripe for payment iframe
   - Allows WalletConnect/RainbowKit CDN resources
   - Blocks inline scripts except those already in index.html (use nonce or hash approach)

4. Update the robots.txt in /smart-stake/public/robots.txt to:
   - Allow all crawlers on public pages
   - Disallow /admin/, /api/, /debug, /health

5. Run npm run build to confirm headers don't break anything
6. Save the security configuration summary to /smart-stake/docs/guides/SECURITY_HEADERS.md
```

**Verify:** `vercel.json` has all security headers. `robots.txt` blocks admin routes.

---

# 📅 WEEK 4 — Vercel Production Deployment
**Theme:** Go live. Real users. Real domain.

---

## Day 16 — Production Environment Setup

**Goal:** All environment variables configured for production Vercel deployment.

**Claude Code Prompt:**
```
Prepare the AlphaWhale project at /smart-stake for Vercel production deployment.

Please do the following:
1. Read /smart-stake/.env.example to get the full list of required variables
2. Create /smart-stake/docs/guides/VERCEL_ENV_SETUP.md with:
   - Complete checklist of every environment variable needed
   - Where to find each value (Supabase dashboard, Stripe dashboard, etc.)
   - Which are REQUIRED vs OPTIONAL
   - Production values vs development values
   - Common mistakes to avoid

3. Create /smart-stake/docs/guides/DEPLOYMENT_CHECKLIST.md with ordered steps:
   Step 1: Verify all env vars are set in Vercel dashboard
   Step 2: Confirm Supabase project is on a paid plan (free tier has limits)
   Step 3: Verify Stripe is in live mode
   Step 4: Run supabase db push for all migrations
   Step 5: Deploy all edge functions
   Step 6: Test complete user journey (signup → portfolio → subscribe)
   Step 7: Test Guardian scan on mainnet
   Step 8: Monitor Vercel logs for 1 hour

4. Update /smart-stake/vercel.json to add production-specific configuration:
   - Add framework: "vite"
   - Ensure all NEXT_PUBLIC_ env vars are mapped to VITE_ equivalents in build config

5. Create a /smart-stake/scripts/pre-deploy-check.sh that:
   - Checks all required env vars are set
   - Runs npm run build
   - Runs npm run lint (fail on errors)
   - Prints "✅ Ready to deploy" or lists what's missing

6. Make the script executable and test it
```

**Verify:** `pre-deploy-check.sh` runs and reports environment status clearly.

---

## Day 17 — Stripe Production Wiring

**Goal:** Real money flows. Subscription system verified end-to-end.

**Claude Code Prompt:**
```
Audit and complete the Stripe subscription system in the AlphaWhale project at /smart-stake.

Please do the following:
1. Read all files in /smart-stake/supabase/functions/create-checkout-session/
2. Read /smart-stake/supabase/functions/create-subscription/ if it exists
3. Look for the Stripe webhook handler (search for 'stripe-webhook' in supabase/functions/)
4. Audit the complete subscription flow:
   a. User clicks "Upgrade to Pro"
   b. Checkout session created
   c. User pays on Stripe
   d. Webhook fires → user plan updated in Supabase
   e. User sees Pro features immediately

5. Check for these common issues:
   - Webhook signature verification (must use constructEvent with webhook secret)
   - Idempotency (webhook fires multiple times — should only update once)
   - User plan field in profiles table matches subscription status
   - Subscription cancellation flow

6. Fix any issues found

7. Create /smart-stake/docs/guides/STRIPE_PRODUCTION_GUIDE.md with:
   - Step-by-step: switch from test to live mode
   - How to register production webhook URL
   - How to test a real payment
   - How to handle failed payments / dunning

8. Run npm run build to confirm no errors
```

**Verify:** Subscription flow documented. Webhook handler has signature verification.

---

## Day 18 — Database Production Hardening

**Goal:** Supabase ready for real users. RLS verified. Backups enabled.

**Claude Code Prompt:**
```
Audit the Supabase database configuration for the AlphaWhale project at /smart-stake.

Please do the following:
1. Read all migration files in /smart-stake/supabase/migrations/
2. List all SQL files in /smart-stake/supabase/ directory
3. Audit Row Level Security (RLS):
   - Search all migration files for "ALTER TABLE ... ENABLE ROW LEVEL SECURITY"
   - List which tables have RLS enabled
   - List which tables are missing RLS (these are vulnerable)
   - For any table storing user data without RLS, create a migration file to add it

4. Check for these security issues:
   - Any tables with public SELECT access that shouldn't be public
   - service_role key usage in frontend code (search src/ for 'service_role')
   - Any SQL functions with SECURITY DEFINER that don't have proper permissions

5. Create /smart-stake/supabase/migrations/[timestamp]_security_hardening.sql with:
   - RLS policies for any tables missing them
   - Comment explaining each policy

6. Create /smart-stake/docs/guides/DATABASE_SECURITY.md documenting:
   - All tables and their RLS status
   - Backup strategy (enable in Supabase dashboard → Settings → Backups)
   - Connection pooling settings for production scale

7. Create a consolidated /smart-stake/supabase/migrations/000_master_schema.sql that represents the complete current state
```

**Verify:** All user-data tables have RLS. No service_role key in frontend.

---

## Day 19 — PWA Registration & Offline Mode

**Goal:** App installs on iOS and Android from browser. Works offline.

**Claude Code Prompt:**
```
Complete the PWA (Progressive Web App) setup for the AlphaWhale project at /smart-stake so users can install it from their browser without the App Store.

Please do the following:
1. Read /smart-stake/public/manifest.json (already upgraded)
2. Read /smart-stake/public/sw.js (already upgraded)
3. Find where the service worker is registered (search src/ for 'serviceWorker' or 'sw.js')
4. If no registration exists, add it to /smart-stake/src/main.tsx:
```typescript
// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.warn('SW registration failed:', err));
  });
}
```

5. Add an "Install App" prompt component at /smart-stake/src/components/InstallPrompt.tsx:
   - Shows a subtle banner when app is installable (beforeinstallprompt event)
   - "Install AlphaWhale for faster access" with Install/Dismiss buttons
   - Dismisses permanently if user says no (store in localStorage)
   - Shows on mobile only

6. Add InstallPrompt to App.tsx (inside ClientProviders, outside Router)

7. Verify the manifest.json has all required fields for iOS:
   - apple-touch-icon in index.html (already exists)
   - apple-mobile-web-app-capable (already exists)
   - apple-mobile-web-app-status-bar-style (already exists)

8. Create /smart-stake/docs/guides/PWA_INSTALL_GUIDE.md explaining how users install

9. Run npm run build and verify the sw.js is copied to dist/
```

**Verify:** Service worker registers on load. Install prompt appears on mobile.

---

## Day 20 — Full E2E Test Suite

**Goal:** Every critical user flow tested before going live.

**Claude Code Prompt:**
```
Create and run a complete E2E test suite for the AlphaWhale project at /smart-stake covering all critical user flows.

Please do the following:
1. Read /smart-stake/playwright.config.ts and existing tests in /smart-stake/tests/
2. Check what E2E tests already exist
3. Create /smart-stake/tests/e2e/critical-flows.spec.ts with tests for:

   Test 1: Landing page loads
   - Visit /
   - Expect: Page title contains "AlphaWhale" or "WhalePulse"
   - Expect: "Connect Wallet" or "Sign Up" button visible
   - Expect: No console errors

   Test 2: Demo mode works without wallet
   - Visit /cockpit or /portfolio
   - If redirected to login, that's expected — test that login page loads
   - Verify no white screen (body has visible content)

   Test 3: Sign up page renders
   - Visit /signup
   - Expect: Email input visible
   - Expect: Password input visible
   - Expect: Submit button visible

   Test 4: Legal pages load
   - Visit /legal/privacy
   - Expect: "Privacy Policy" heading
   - Visit /legal/terms
   - Expect: "Terms" heading

   Test 5: 404 page works
   - Visit /this-route-does-not-exist-xyz
   - Expect: Not Found text or 404 content
   - Expect: No white screen

   Test 6: Admin routes are protected
   - Visit /admin/bi without auth
   - Expect: Redirected to /login (not a 403 or white screen)

4. Run the tests: cd /smart-stake && npm run test:e2e
5. Fix any failing tests
6. Document results in /smart-stake/docs/guides/E2E_TEST_RESULTS.md
```

**Verify:** All 6 critical flow tests pass. Admin route redirects correctly.

---

# 📅 WEEK 5 — Android (Google Play Store)
**Theme:** Build the Android app and submit to Google Play.

---

## Day 21 — Install Capacitor & Android Build

**Goal:** Native Android app built from existing web code.

**Claude Code Prompt:**
```
Set up Capacitor for Android build in the AlphaWhale project at /smart-stake.

Please do the following:
1. Read /smart-stake/capacitor.config.ts (already created)
2. Install Capacitor packages:
   cd /smart-stake && npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/splash-screen @capacitor/status-bar @capacitor/keyboard @capacitor/push-notifications

3. Initialize Capacitor (if not already done):
   npx cap init "AlphaWhale" "com.alphawhale.app" --web-dir=dist

4. Add Android platform:
   npx cap add android

5. Build the web app first:
   npm run build

6. Sync to Android:
   npx cap sync android

7. Update /smart-stake/android/app/src/main/res/values/strings.xml with:
   - app_name: AlphaWhale

8. Create /smart-stake/docs/guides/ANDROID_BUILD_GUIDE.md with:
   - Prerequisites: Android Studio download link
   - Step-by-step build instructions
   - How to generate release keystore
   - How to create signed AAB for Google Play
   - How to test on physical device
   - Common errors and fixes

9. Create /smart-stake/.gitignore additions for Android:
   /android/
   /ios/
   (These are generated — should not be in git)

10. Run: ls /smart-stake/android/ to confirm Android project was created
```

**Verify:** `/android/` folder created. `capacitor.config.ts` is correct.

---

## Day 22 — Android Store Listing Assets

**Goal:** All assets ready for Google Play Console submission.

**Claude Code Prompt:**
```
Prepare all Google Play Store assets for the AlphaWhale app at /smart-stake.

Please do the following:
1. Check what app icons exist in /smart-stake/public/ and /smart-stake/app-icons/
2. Create /smart-stake/store-assets/ directory
3. Create /smart-stake/store-assets/GOOGLE_PLAY_LISTING.md with ready-to-copy content:

   APP NAME: AlphaWhale — DeFi Intelligence

   SHORT DESCRIPTION (80 chars max):
   Track whales, protect your wallet & hunt airdrops in DeFi

   FULL DESCRIPTION (4000 chars max):
   [Use the description from LAUNCH_ROADMAP.md, expand to 4000 chars covering all features]

   CATEGORY: Finance
   CONTENT RATING: Everyone (no violence, no adult content)

   KEYWORDS: DeFi, crypto wallet, whale tracker, portfolio tracker, airdrop hunter,
   token approval, blockchain, ethereum, web3, guardian

   PRIVACY POLICY URL: https://[your-domain]/legal/privacy
   SUPPORT EMAIL: support@[your-domain]

4. Create /smart-stake/store-assets/APP_STORE_LISTING.md with equivalent Apple App Store content:
   - App Name (30 chars): AlphaWhale
   - Subtitle (30 chars): DeFi Intelligence & Guardian
   - Keywords (100 chars): DeFi,crypto,whale,portfolio,guardian,airdrop,token,blockchain,ethereum,wallet
   - Description (4000 chars): [expanded description]

5. Create /smart-stake/store-assets/SCREENSHOT_GUIDE.md explaining:
   - Required screenshot sizes for both stores
   - Which screens to screenshot (Home, Portfolio, Guardian, Signals, Hunter)
   - How to take them (browser dev tools device simulation)

6. Create /smart-stake/store-assets/DATA_SAFETY.md documenting:
   - What data is collected (wallet addresses, email, usage analytics)
   - What is shared (nothing sold to third parties)
   - Required for both Google Play Data Safety and Apple Privacy section
```

**Verify:** All store listing files created in `/store-assets/`.

---

## Day 23 — iOS Capacitor Setup

**Goal:** iOS project ready for Xcode build.

**Claude Code Prompt:**
```
Set up iOS Capacitor build for the AlphaWhale project at /smart-stake.

Please do the following:
1. Read /smart-stake/capacitor.config.ts
2. Add iOS platform (if not already added):
   cd /smart-stake && npx cap add ios

3. Sync web build to iOS:
   npm run build && npx cap sync ios

4. Create /smart-stake/docs/guides/IOS_BUILD_GUIDE.md with complete instructions:

   PREREQUISITES:
   - Mac with macOS 13+
   - Xcode 15+ (download from Mac App Store — free, ~12GB)
   - Apple Developer Account ($99/year at developer.apple.com)

   STEP 1: Open in Xcode
   npx cap open ios

   STEP 2: Configure signing
   - Xcode → Your Target → Signing & Capabilities
   - Team: Select your Apple Developer account
   - Bundle Identifier: com.alphawhale.app

   STEP 3: Set version
   - Version: 1.0.0
   - Build: 1

   STEP 4: Build for device
   - Connect iPhone via USB
   - Trust the developer certificate on iPhone
   - Product → Run

   STEP 5: Archive for App Store
   - Product → Archive
   - Window → Organizer → Distribute App
   - Upload to App Store Connect

   COMMON ISSUES:
   - "No signing certificate" → Create in Xcode automatically or via developer.apple.com
   - "App Transport Security" → Already handled in capacitor.config.ts
   - "WKWebView whitelist" → Add domains to NSAppTransportSecurity in Info.plist

5. Create /smart-stake/ios-privacy-strings.md listing all Info.plist privacy keys needed:
   - NSCameraUsageDescription (if any camera feature)
   - NSFaceIDUsageDescription (if biometric auth)
   - Note: Wallet connection does NOT require special permissions
```

**Verify:** iOS guide created. `/ios/` folder exists after `npx cap add ios`.

---

## Day 24 — App Compliance & Legal

**Goal:** Pass App Store review. No rejection for missing legal requirements.

**Claude Code Prompt:**
```
Audit and complete all legal compliance requirements for the AlphaWhale app at /smart-stake.

Please do the following:
1. Read /smart-stake/src/pages/legal/Terms.tsx and /smart-stake/src/pages/legal/Privacy.tsx
2. Check that the Privacy Policy covers:
   - What data is collected (wallet addresses, email, usage data)
   - How data is used (portfolio display, security scanning)
   - Third party services used (Supabase, PostHog, Stripe, Alchemy, RainbowKit)
   - Data deletion process
   - Cookie usage
   If any of these are missing, add them to the Privacy.tsx component

3. Check that Terms of Service covers:
   - Financial disclaimer (NOT financial advice)
   - Age requirement (18+)
   - Prohibited uses (illegal activity, sanctions evasion)
   - Limitation of liability for crypto losses
   - Governing law
   If any of these are missing, add them to Terms.tsx

4. Create a legal disclosure modal component at /smart-stake/src/components/LegalDisclosureModal.tsx:
   - Shows once to new users on first visit
   - "By using AlphaWhale you agree to our Terms and Privacy Policy"
   - "AlphaWhale provides information only, not financial advice"
   - Store acceptance in localStorage ('legal_accepted')
   - Links to /legal/terms and /legal/privacy

5. Add LegalDisclosureModal to App.tsx (shown to unauthenticated users on first visit)

6. Create /smart-stake/store-assets/COMPLIANCE_CHECKLIST.md:
   Google Play requirements checklist
   Apple App Store requirements checklist
   GDPR/CCPA requirements checklist

7. Run npm run build to confirm no errors
```

**Verify:** Legal pages cover all required topics. Modal shows on first visit.

---

## Day 25 — Performance Benchmarks

**Goal:** App loads in < 3 seconds on 3G. Documented proof for App Store.

**Claude Code Prompt:**
```
Run complete performance benchmarks for the AlphaWhale project at /smart-stake and optimize.

Please do the following:
1. Build the project: cd /smart-stake && npm run build
2. Check bundle sizes: ls -la /smart-stake/dist/assets/*.js | sort -k5 -rn | head -20
3. Identify any chunk larger than 500KB that should be split further
4. Run the k6 load test: npm run test:k6:api-load (if k6 is installed, otherwise skip)

5. Optimize the vite.config.ts build settings:
   - Set build.minify: 'terser' for better compression
   - Add terserOptions to remove console.log in production:
     terserOptions: { compress: { drop_console: ['log', 'debug', 'info'] } }
   - Ensure treeshaking is enabled (it is by default in Rollup/Vite)

6. Check for any synchronous heavy imports that block the main thread:
   Search for: import ... from 'ethers' (large library — should be lazy)
   Search for: import ... from 'jspdf' (large library — should be lazy)
   If found in eagerly-loaded files, move them to lazy-loaded pages

7. Create /smart-stake/docs/guides/PERFORMANCE_REPORT.md with:
   - Bundle size breakdown (main chunk, vendor chunks, feature chunks)
   - Estimated load time on 4G (use: bundle_size_kb / 1500 * 1000 = ms)
   - List of optimizations applied

8. Run npm run build one final time and capture final bundle sizes
```

**Verify:** Main chunk < 500KB. Performance report saved.

---

# 📅 WEEK 6 — iOS App Store Submission
**Theme:** Apple review. Ship to 1.3 billion iOS users.

---

## Day 26 — App Store Connect Setup

**Goal:** App Store listing created and ready for submission.

**Claude Code Prompt:**
```
Prepare the App Store Connect listing documentation for AlphaWhale at /smart-stake.

Please do the following:
1. Read /smart-stake/store-assets/APP_STORE_LISTING.md
2. Create /smart-stake/docs/guides/APP_STORE_CONNECT_GUIDE.md with exact steps:

   STEP 1: Go to appstoreconnect.apple.com
   STEP 2: My Apps → + → New App
   - Platform: iOS
   - Name: AlphaWhale
   - Primary Language: English (U.S.)
   - Bundle ID: com.alphawhale.app (must match Xcode)
   - SKU: alphawhale-ios-v1

   STEP 3: App Information
   - Category: Finance
   - Secondary Category: Productivity
   - Content Rights: does not contain third-party content

   STEP 4: Pricing
   - App itself: Free
   - In-App Purchases: set up Pro subscription ($19.99/month)

   STEP 5: App Privacy
   - Data collected: Email, Wallet Addresses (user ID), Usage Data (analytics)
   - Data NOT linked to user: Crash data
   - Data NOT collected: Location, Contacts, Photos

   STEP 6: Age Rating
   - Complete questionnaire
   - Select: No Restricted Content, No Gambling, No Real Money Trading
   - Result should be: 4+ or 12+

   STEP 7: Review Notes (IMPORTANT for crypto apps)
   "AlphaWhale is a portfolio viewer and security tool. It does NOT:
   - Facilitate cryptocurrency purchases or trades
   - Store private keys or seed phrases
   - Send transactions on behalf of users
   It reads wallet data via read-only RPC connections for display purposes only.
   Guardian feature signs transactions only for token APPROVAL REVOCATION (security feature)."

3. Create /smart-stake/store-assets/REVIEW_NOTES.txt with the above explanation
4. Document the In-App Purchase setup for Stripe + Apple Pay:
   Note: Apple requires IAP for subscriptions on iOS. Stripe alone is NOT allowed.
   Create guide: /smart-stake/docs/guides/APPLE_IAP_GUIDE.md
```

**Verify:** All App Store Connect documentation ready.

---

## Day 27 — Apple IAP Integration Planning

**Goal:** Understand Apple's requirements for subscription payments on iOS.

**Claude Code Prompt:**
```
Create an Apple In-App Purchase integration plan for the AlphaWhale project at /smart-stake.

IMPORTANT CONTEXT: Apple requires that subscription payments for iOS apps use Apple's
In-App Purchase system (which gives Apple 15-30% commission). The current Stripe integration
works for web but NOT for iOS App Store submissions.

Please do the following:
1. Read /smart-stake/src/pages/Subscription.tsx and /smart-stake/src/contexts/SubscriptionContext.tsx
2. Audit how the current Stripe subscription works
3. Create /smart-stake/docs/guides/APPLE_IAP_GUIDE.md with:

   OPTION A: Implement Apple IAP (Required for App Store, Apple takes 15-30%)
   - Use Capacitor plugin: @capacitor/purchases or RevenueCat SDK
   - RevenueCat bridges both Apple IAP and Google Play Billing in one SDK
   - Cost: RevenueCat free up to $2,500 MRR, then 1% of revenue
   - Implementation: 1 week

   OPTION B: Web-only purchases (Approved workaround)
   - Remove all subscription UI from iOS app
   - Replace with: "Subscribe at alphawhale.app" button
   - This is ALLOWED by Apple as long as you don't link directly to payment page
   - This is used by Spotify, Netflix on iOS
   - No commission to Apple
   - Implementation: 2 days

   RECOMMENDED: Start with Option B (faster, no Apple commission)
   When revenue grows, add RevenueCat for Option A

4. Implement Option B changes:
   - Create a component: /smart-stake/src/components/IosSubscriptionRedirect.tsx
     Shows when: navigator.standalone is true OR running in Capacitor
     Content: "To subscribe to Pro, visit alphawhale.app on your browser"
   - In Subscription.tsx: conditionally show IosSubscriptionRedirect vs Stripe checkout
   - Check: import { Capacitor } from '@capacitor/core'; if (Capacitor.isNativePlatform()) ...

5. Run npm run build to confirm
```

**Verify:** iOS shows redirect message instead of Stripe checkout. Build passes.

---

## Day 28 — Final Pre-Launch Code Freeze

**Goal:** Code is frozen. All tests pass. Zero known critical bugs.

**Claude Code Prompt:**
```
Run the complete test suite and generate a final pre-launch status report for the AlphaWhale project at /smart-stake.

Please do the following:
1. Run all tests: cd /smart-stake && npm run test -- --run 2>&1 | tail -30
2. Run E2E tests: npm run test:e2e 2>&1 | tail -30
3. Run lint check: npm run lint 2>&1 | grep "error" | wc -l (must be 0)
4. Run build: npm run build 2>&1 | tail -20
5. Run TypeScript check: npx tsc --noEmit 2>&1 | wc -l

6. For any failing tests:
   - If unit test: read the test file and fix the underlying component
   - If E2E test: read the spec and fix the issue in the component
   - Re-run until passing

7. Create /smart-stake/docs/guides/PRE_LAUNCH_STATUS.md with:
   - Date: [today]
   - Unit tests: X passed / Y failed
   - E2E tests: X passed / Y failed
   - ESLint errors: 0
   - TypeScript errors: X (document any remaining)
   - Build: ✅ SUCCESS / ❌ FAILED
   - Bundle size main chunk: X KB
   - Known issues: [list any non-critical issues]
   - Launch decision: READY / NOT READY + reason

8. If all critical tests pass, create the final git commit message:
   "feat: production-ready release v1.0.0"
   List all changes made over the 6-week period
```

**Verify:** Test report saved. Build succeeds. ESLint errors = 0.

---

## Day 29 — Launch Day: Web + Android

**Goal:** AlphaWhale is live on Vercel and submitted to Google Play.

**Claude Code Prompt:**
```
Prepare and execute the production launch for the AlphaWhale project at /smart-stake.

Please do the following:
1. Read /smart-stake/docs/guides/DEPLOYMENT_CHECKLIST.md
2. Verify all items are checked off

3. Create the production launch commit:
   cd /smart-stake && git add -A
   git commit -m "release: v1.0.0 production launch

   - Security: AdminRouteWrapper, debug routes gated, secrets cleaned
   - Performance: lazy loading, bundle splitting, service worker caching
   - PWA: manifest, installable, offline support
   - Mobile: touch targets, input zoom fixes, iOS safari fixes
   - Legal: privacy policy, terms, disclosure modal
   - Store: Capacitor config, Android build, App Store assets
   - Monitoring: Sentry integration, rate limiting
   - Testing: E2E critical flows, Lighthouse >75"

4. Create /smart-stake/docs/guides/LAUNCH_ANNOUNCEMENT.md with:
   - Twitter/X thread (5 tweets) announcing AlphaWhale
   - Reddit post for r/DeFi
   - Product Hunt listing copy
   - Discord server announcement template
   - Email template for early access list

5. Create /smart-stake/docs/guides/POST_LAUNCH_MONITORING.md:
   - Check Vercel dashboard every day for first week
   - Watch Sentry for any new errors
   - Check PostHog for user flow dropoffs
   - Monitor Supabase database size
   - Check Stripe for payment failures
   - Response time SLA: critical bugs fixed within 24 hours

6. Create a CHANGELOG.md in the root with v1.0.0 release notes
```

**Verify:** Release commit created. Launch announcement templates ready.

---

## Day 30 — Launch Day: iOS Submission

**Goal:** iOS app submitted to Apple for review.

**Claude Code Prompt:**
```
Prepare the final iOS App Store submission checklist for AlphaWhale at /smart-stake.

Please do the following:
1. Read all files in /smart-stake/docs/guides/ related to iOS and App Store
2. Create /smart-stake/docs/guides/IOS_SUBMISSION_FINAL.md with final submission checklist:

   PRE-SUBMISSION:
   [ ] Xcode build succeeds with no errors
   [ ] App tested on physical iPhone (not just simulator)
   [ ] All features work: Portfolio, Guardian, Signals, Hunter
   [ ] No crashes on startup, navigation, or wallet connect
   [ ] Demo mode works without any wallet connected
   [ ] Login/signup flow complete
   [ ] Subscription shows "visit alphawhale.app" (not Stripe checkout)

   APP STORE CONNECT:
   [ ] All metadata filled (name, subtitle, description, keywords)
   [ ] Screenshots uploaded (6.5" and 5.5" phone required)
   [ ] App icon uploaded (1024x1024 PNG, no alpha)
   [ ] Privacy policy URL working
   [ ] Age rating completed
   [ ] Data privacy section completed
   [ ] In-app purchase not required (using web redirect)

   REVIEW NOTES (add to "Notes for Reviewer"):
   "AlphaWhale is a DeFi portfolio viewer and security tool.
   Demo Mode: You can test all features without a real wallet.
   Use 'Try Demo Mode' button on the home screen.
   Guardian feature: Scans for risky token approvals (read-only scan, user confirms before any action).
   No seed phrases or private keys are ever collected or stored."

   COMMON REJECTION REASONS + FIXES:
   1. "App crashes on launch" → Test on oldest supported iOS (iOS 15)
   2. "Guideline 2.1 App Completeness" → Ensure demo mode works fully
   3. "Guideline 3.1.1 In-App Purchase" → Already handled with web redirect
   4. "Guideline 4.3 Spam" → Explain unique Guardian + whale intelligence feature

3. After iOS approval (typically 24-48 hours), post "Now on iOS!" announcement
4. Update the LAUNCH_ANNOUNCEMENT.md with iOS availability
```

**Verify:** iOS submission checklist complete. Review notes written.

---

# 📊 Summary Dashboard

| Week | Focus | Deliverable |
|------|-------|-------------|
| Week 1 | Security (Done ✅) | Admin protection, debug gating, key cleanup |
| Week 2 | Code quality | TypeScript, ESLint, dead code, lazy loading |
| Week 3 | Performance | Lighthouse >75, Sentry, rate limiting, mobile fixes |
| Week 4 | Vercel launch | Live production URL, Stripe live, database hardened |
| Week 5 | Android | Google Play submission |
| Week 6 | iOS | App Store submission |

---

# 🔑 Quick Reference Commands

```bash
# Daily development
npm run dev                          # Start dev server

# Quality checks (run before every commit)
npm run lint                         # ESLint check
npx tsc --noEmit                     # TypeScript check
npm run build                        # Production build

# Testing
npm run test -- --run                # All unit tests (once)
npm run test:e2e                     # Playwright E2E tests
npm run lighthouse                   # Performance audit

# Capacitor (native app builds)
npm run build && npx cap sync        # Sync web to native
npx cap open android                 # Open Android Studio
npx cap open ios                     # Open Xcode (Mac only)

# Database
supabase db push                     # Push migrations
supabase functions deploy --all      # Deploy edge functions

# Seeding
npm run seed:all                     # Seed all data
```

---

*This roadmap is a living document. Each task builds on the previous one.
Complete in order. Never skip a week.*
