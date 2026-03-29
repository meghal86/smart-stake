# 🚀 AlphaWhale — Launch Roadmap
## Vercel Web · Apple App Store · Google Play Store

**Goal:** Ship a production-grade DeFi intelligence app across all three platforms
**Start date:** March 28, 2026
**Target launch:** 6 weeks

---

## ✅ Already Fixed (March 28, 2026)

These were completed during the initial code hardening session:

- [x] **Admin routes protected** — `/admin/*` now requires auth + admin email via `AdminRouteWrapper`
- [x] **Debug/test routes gated** — `/debug`, `/premium-test`, `/subscription-test`, `/signup-test`, etc. only render in `DEV` mode
- [x] **Hardcoded Supabase key removed** — now reads from `VITE_SUPABASE_PROJECT_REF` env var
- [x] **RainbowKit polling interval removed** — replaced 2-second DOM polling with one-time mount fix
- [x] **PWA manifest upgraded** — added app shortcuts (Portfolio, Guardian, Signals), maskable icons
- [x] **Service worker improved** — added offline caching, push notifications, cache cleanup
- [x] **Capacitor config created** — `capacitor.config.ts` ready for iOS & Android builds
- [x] **Next.js config deprecated** — `next.config.js` marked as unused; safe to delete
- [x] **`.env.example` updated** — added `VITE_ADMIN_EMAILS`, `VITE_SUPABASE_PROJECT_REF`, cleaned up legacy keys

---

## 📅 Week 1 — Security & Foundation
**Theme:** Make the app safe to ship to strangers

### Daily Tasks

**Day 1 (Mon)** — Environment & Secrets
- [ ] Copy `.env.example` to `.env.local` and fill in all values
- [ ] Add `VITE_ADMIN_EMAILS=your@email.com` with your email
- [ ] Add `VITE_SUPABASE_PROJECT_REF` (find it: Supabase → Project Settings → General)
- [ ] Confirm Stripe is in **live mode** (not test mode) in your Stripe dashboard
- [ ] Verify `CRON_SECRET` is set — generate with: `openssl rand -base64 32`

**Day 2 (Tue)** — TypeScript Cleanup
- [ ] Run `npx tsc --noEmit 2>&1 | head -50` and review the first 50 errors
- [ ] Fix the top 10 most critical errors (focus on `any` casts in auth and wallet contexts)
- [ ] In `vite.config.ts`, remove `tsconfigRaw: {}` from `optimizeDeps.esbuildOptions`
- [ ] Run `npm run build` and confirm it still succeeds

**Day 3 (Wed)** — ESLint Reduction
- [ ] Run `npm run lint 2>&1 | grep "error" | wc -l` — count actual errors (not warnings)
- [ ] Fix all **errors** (not warnings) first — these are the dangerous ones
- [ ] Focus on: missing `useEffect` dependencies, undefined variable access
- [ ] Goal: zero errors, warnings can wait

**Day 4 (Thu)** — Remove Dead Code
- [ ] Delete or archive these unused page files:
  - `src/pages/Signup.tsx` (replaced by SignupNew)
  - `src/pages/GuardianUX2.tsx`, `src/pages/GuardianMobile.tsx` (replaced by GuardianEnhanced)
  - `src/pages/PortfolioEnhanced.tsx`, `src/pages/PortfolioIntelligence.tsx` (replaced by PortfolioUnified)
  - `src/pages/Hub5Page.tsx`, `src/pages/Hub2Plus.tsx` (replaced by PulsePage)
- [ ] Remove their imports from `App.tsx`
- [ ] Run `npm run build` to confirm nothing breaks

**Day 5 (Fri)** — Repository Cleanup
- [ ] Create a folder: `docs/archive/`
- [ ] Move all `*_FIX.md`, `*_COMPLETE.md`, `*_STATUS.md` files to `docs/archive/`
- [ ] Move all `test-*.html` and `debug-*.html` files to `docs/archive/html-tests/`
- [ ] Move all `.sql` files from root to `supabase/migrations/` (if not already there)
- [ ] Commit: `git add -p && git commit -m "chore: archive dev docs and test files"`

---

## 📅 Week 2 — Performance & Bundle Optimization
**Theme:** Make the app fast enough that users don't bounce

### Daily Tasks

**Day 6 (Mon)** — Lazy Loading Core Modules
- [ ] Wrap Guardian import in React.lazy: `const Guardian = React.lazy(() => import('./pages/GuardianEnhanced'))`
- [ ] Wrap Hunter: `React.lazy(() => import('./pages/Hunter'))`
- [ ] Wrap HarvestPro: `React.lazy(() => import('./pages/HarvestPro'))`
- [ ] Wrap Admin pages: `React.lazy(() => import('./pages/AdminBI'))`
- [ ] Add `<Suspense fallback={<LoadingSpinner />}>` around lazy routes

**Day 7 (Tue)** — Bundle Analysis
- [ ] Install: `npm install --save-dev rollup-plugin-visualizer`
- [ ] Add to vite.config.ts, run `npm run build`
- [ ] Open `dist/stats.html` — identify the 3 largest chunks
- [ ] Move the largest dependencies to their own manual chunks in `rollupOptions`

**Day 8 (Wed)** — Image Optimization
- [ ] Audit all images in `public/` — remove duplicates (hero_logo_1024.png vs hero_logo_1024_1.png)
- [ ] Convert large PNGs to WebP using: `npx @squoosh/cli --webp '{}' public/*.png`
- [ ] Update any hardcoded `.png` references to `.webp`

**Day 9 (Thu)** — Lighthouse Audit
- [ ] Run: `npm run lighthouse` or `npx lighthouse http://localhost:8080 --view`
- [ ] Target scores: Performance >75, Accessibility >85, Best Practices >90, SEO >90
- [ ] Fix the top 3 performance issues reported

**Day 10 (Fri)** — Load Testing
- [ ] Run: `npm run test:k6:api-load`
- [ ] Confirm API endpoints handle 100 concurrent users without errors
- [ ] Fix any timeout or memory issues found

---

## 📅 Week 3 — Vercel Production Deployment
**Theme:** Go live on the web

### Daily Tasks

**Day 11 (Mon)** — Vercel Setup
- [ ] Create account at vercel.com if not already done
- [ ] Connect your GitHub repository to Vercel
- [ ] Set all environment variables in Vercel dashboard (copy from `.env.local`)
- [ ] Set `NODE_ENV=production`
- [ ] Trigger first deploy and confirm it builds successfully

**Day 12 (Tue)** — Custom Domain
- [ ] Purchase domain (suggestions: `alphawhale.app`, `alphawhale.io`, `whalepulse.app`)
  - Namecheap or Cloudflare Domains (~$12-20/year)
- [ ] Add domain to Vercel: Project Settings → Domains
- [ ] Update DNS records as instructed by Vercel
- [ ] Wait for SSL certificate (auto-provisioned, usually 5 minutes)
- [ ] Update `VITE_SITE_URL` in Vercel env vars to your new domain

**Day 13 (Wed)** — Stripe Production Switch
- [ ] Go to Stripe Dashboard → switch from Test Mode to Live Mode
- [ ] Copy Live Mode API keys to Vercel env vars (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
- [ ] Re-register the Stripe webhook for your production URL
- [ ] Do a real test purchase with a real card
- [ ] Verify webhook fires and subscription updates in Supabase

**Day 14 (Thu)** — Supabase Production Setup
- [ ] In Supabase: Project Settings → Authentication → set Site URL to your production domain
- [ ] Add production URL to Supabase Auth Redirect URLs
- [ ] Enable Supabase email templates with your branding
- [ ] Run all pending migrations: `supabase db push`
- [ ] Deploy all Edge Functions: `supabase functions deploy --all`

**Day 15 (Fri)** — Production Smoke Test
- [ ] Test complete user journey: signup → connect wallet → view portfolio
- [ ] Test Guardian scan on a real wallet
- [ ] Test Stripe subscription purchase (use a real card)
- [ ] Test on iPhone Safari and Android Chrome
- [ ] Monitor Vercel logs for any errors in the first 24 hours

---

## 📅 Week 4 — Android (Google Play Store)
**Theme:** Ship to Android first — easier approval than iOS**

### Daily Tasks

**Day 16 (Mon)** — Install Capacitor
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android @capacitor/splash-screen @capacitor/status-bar @capacitor/push-notifications @capacitor/keyboard
npx cap init
npx cap add android
```
- [ ] Confirm `capacitor.config.ts` matches your `appId` and `appName`
- [ ] Run `npm run build && npx cap sync android`

**Day 17 (Tue)** — Android Studio Build
- [ ] Install Android Studio from: https://developer.android.com/studio
- [ ] Run: `npx cap open android`
- [ ] In Android Studio: Build → Generate Signed Bundle/APK → Android App Bundle
- [ ] Create a new keystore (save the password somewhere safe — you can NEVER lose this)
- [ ] Build the release `.aab` file

**Day 18 (Wed)** — Google Play Console Setup
- [ ] Create Google Play Console account at play.google.com/console ($25 one-time fee)
- [ ] Create new app: `AlphaWhale`
- [ ] Fill in Store Listing:
  - App name: AlphaWhale — DeFi Intelligence
  - Short description (80 chars): Track whales, protect your wallet, hunt airdrops
  - Full description (4000 chars): Use the text from this file's App Store section below
  - Category: Finance
- [ ] Upload screenshots (at least 2 phone screenshots required)

**Day 19 (Thu)** — Play Store Assets & Compliance
- [ ] Upload app icon (`whaleplus-appstore-1024x1024.png` — already in `/public/`)
- [ ] Upload feature graphic (1024×500) — create in Canva
- [ ] Add Privacy Policy URL (your `/legal/privacy` page)
- [ ] Fill in Content Rating questionnaire (select "Finance" type app)
- [ ] Fill in Data Safety section (wallets, financial data — be accurate)

**Day 20 (Fri)** — Submit to Google Play
- [ ] Upload `.aab` to Internal Testing track first
- [ ] Test on a real Android device from the Internal Testing link
- [ ] Fix any crashes or issues
- [ ] Promote to Production track
- [ ] Submit for review (Google Play reviews typically take 1-3 days)

---

## 📅 Week 5 — iOS (Apple App Store)
**Theme:** Apple is strict — take your time here

### Daily Tasks

**Day 21 (Mon)** — Apple Developer Setup
- [ ] Sign up for Apple Developer Program at developer.apple.com ($99/year)
- [ ] Wait for approval (usually same day, sometimes 24-48 hours)
- [ ] Create App ID in developer.apple.com → Identifiers → App IDs
  - Bundle ID: `com.alphawhale.app`
- [ ] Add Capacitor iOS: `npx cap add ios`
- [ ] Run `npx cap sync ios`

**Day 22 (Tue)** — Xcode Setup (requires Mac)
- [ ] Install Xcode from Mac App Store (free, ~12GB)
- [ ] Run: `npx cap open ios`
- [ ] In Xcode: set your Team (your Apple Developer account)
- [ ] Set Bundle Identifier to `com.alphawhale.app`
- [ ] Set Version to `1.0.0` and Build to `1`

**Day 23 (Wed)** — iOS Build & TestFlight
- [ ] In Xcode: Product → Archive
- [ ] Upload to App Store Connect via Xcode Organizer
- [ ] In App Store Connect (appstoreconnect.apple.com):
  - Create new app
  - Add to TestFlight for internal testing
- [ ] Install on your iPhone via TestFlight
- [ ] Test all core features on real device

**Day 24 (Thu)** — App Store Listing
- [ ] App name: AlphaWhale — DeFi Intelligence
- [ ] Subtitle (30 chars): Track Whales & Protect Wallet
- [ ] Description: See template below
- [ ] Keywords: DeFi, crypto, whale, portfolio, token, guardian, airdrop, blockchain, wallet
- [ ] Upload screenshots for iPhone 6.5" and iPhone 5.5"
- [ ] Privacy Policy URL, Support URL

**Day 25 (Fri)** — Submit for App Store Review
- [ ] Complete App Privacy section in App Store Connect
  - Declare: Financial info (wallet addresses), Usage data, Identifiers
- [ ] Answer the export compliance question (encryption: Yes, uses standard HTTPS)
- [ ] Submit for Review
- [ ] Apple reviews typically take 24-48 hours for new apps

---

## 📅 Week 6 — Launch & First Users
**Theme:** Get real people using it

### Daily Tasks

**Day 26 (Mon)** — Beta User Recruitment
- [ ] Post in r/DeFi, r/CryptoTechnology on Reddit
- [ ] Join 3 DeFi Discord servers and share in #tools or #resources channels
- [ ] Tweet/post on X with your wallet connect demo video (record with Loom)
- [ ] Goal: 10 beta users by end of week

**Day 27 (Tue)** — Monitoring Setup
- [ ] Set up Sentry for error monitoring: `npm install @sentry/react`
- [ ] Configure Sentry DSN in `.env.local`
- [ ] Set up Sentry alerts for any new errors
- [ ] Review PostHog dashboard — confirm events are flowing from production

**Day 28 (Wed)** — User Feedback Loop
- [ ] Add a simple in-app feedback button (Tawk.to is already in your index.html — enable it)
- [ ] Set up a Typeform or Google Form for beta user feedback
- [ ] Schedule 3 user interviews with beta users

**Day 29 (Thu)** — First Iteration
- [ ] Review feedback from beta users
- [ ] Identify the #1 friction point reported
- [ ] Fix it and push an update

**Day 30 (Fri)** — Launch Post
- [ ] Write a launch post for Product Hunt (schedule for Tuesday — best day to launch)
- [ ] Create a 60-second demo video for Product Hunt / Twitter
- [ ] Prepare email announcement for any early signups

---

## 📱 App Store Description Templates

### Short Description (80 chars for Google Play)
```
Track whale wallets, protect tokens with Guardian & hunt airdrops in DeFi
```

### Full Description
```
AlphaWhale is your DeFi intelligence command center — built for crypto users
who want to stay ahead of the market without drowning in noise.

🐋 WHALE INTELLIGENCE
See what the biggest wallets in crypto are doing in real time. Track wallet
movements, spot accumulation patterns, and get alerts when whales move.

🛡️ GUARDIAN — PROTECT YOUR WALLET
Automatically revoke risky token approvals before they get exploited. Guardian
scans your wallet for dangerous permissions and removes them safely.

🎯 HUNTER — CATCH AIRDROPS
Never miss another airdrop. Hunter tracks upcoming opportunities across 20+
protocols and helps you qualify for rewards before deadlines close.

📊 PORTFOLIO DASHBOARD
Connect multiple wallets and see your complete DeFi portfolio across all
chains — balances, positions, P&L, and risk score — in one clean view.

🔍 RISK SCANNER
Get a risk score for any wallet address. See if a wallet has interacted with
sanctioned addresses, mixers, or known exploits.

FEATURES:
• Multi-wallet support (Ethereum, Base, Polygon, Arbitrum, and more)
• Real-time whale movement alerts
• Automated token approval revocation
• Airdrop opportunity tracking and qualification
• Portfolio stress testing
• Dark and light mode
• No seed phrase required — read-only by default

AlphaWhale is for informational purposes only and does not constitute
financial advice. Always do your own research.
```

---

## 🏗️ Startup Track (Parallel Path)

While shipping the app, run these in parallel if you want to build a company:

**Month 1:**
- [ ] Register company — Delaware C-Corp via Stripe Atlas ($500)
- [ ] Open business bank account (Mercury — free for startups)
- [ ] Set up accounting (Pilot.com or Bench for bookkeeping)

**Month 2:**
- [ ] Reach 100 Monthly Active Users
- [ ] Measure: signup → paid conversion rate
- [ ] Identify your best-fit user (most engaged, most willing to pay)

**Month 3:**
- [ ] Apply to YC (applications open twice a year)
- [ ] Apply to a16z crypto (rolling applications)
- [ ] Build a one-pager: problem, solution, traction, team, ask

**Funding ask (Seed):**
- Valuation: $3-5M (typical for DeFi tools pre-revenue)
- Ask: $500K-1.5M
- Use of funds: 2 engineers × 12 months + marketing

---

## 🔑 Key Commands Reference

```bash
# Development
npm run dev                    # Start local dev server (port 8080)

# Testing
npm run test                   # Unit tests
npm run test:e2e               # Playwright E2E tests
npm run lighthouse             # Lighthouse performance audit

# Building & Deploying
npm run build                  # Build for production
npx cap sync                   # Sync web build to native apps
npx cap open ios               # Open iOS in Xcode
npx cap open android           # Open Android in Android Studio

# Database
supabase db push               # Push migrations to Supabase
supabase functions deploy --all # Deploy all Edge Functions

# Seeding
npm run seed:all               # Seed all data (airdrops, quests, etc.)
```

---

## 🆘 Common Issues & Fixes

**Build fails with memory error:**
The build command already has `NODE_OPTIONS='--max-old-space-size=4096'`. If it still fails, add lazy loading to reduce bundle size (see Week 2).

**RainbowKit modal not clickable:**
Fixed in this session — the 2-second polling interval was replaced with a one-time mount fix. If the issue recurs, check for any CSS `pointer-events: none` on a parent element.

**Admin routes accessible without auth:**
Fixed in this session — all `/admin/*` routes now use `AdminRouteWrapper`. Add your email to `VITE_ADMIN_EMAILS` in `.env.local`.

**Stripe webhooks not firing in production:**
Make sure the webhook endpoint URL in Stripe Dashboard is set to `https://your-domain.com/api/stripe/webhook` and the `STRIPE_WEBHOOK_SECRET` matches the one from the Stripe dashboard for that specific webhook.

**App Store rejection for crypto apps:**
Apple may ask about wallet connection. Clarify it's read-only portfolio tracking and security tooling (Guardian), not a wallet or exchange. Include the disclaimer about not being financial advice.
