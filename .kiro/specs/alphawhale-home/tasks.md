# Implementation Plan: AlphaWhale Home

## Overview

This implementation plan breaks down the AlphaWhale Home page development into discrete, manageable tasks. Each task builds incrementally on previous work, with checkpoints to ensure quality and correctness.

## Task List

- [x] 0. Backend prerequisites (Backend team - parallel with Tasks 1-2)
  - Backend APIs must be ready before frontend integration
  - _Requirements: System Req 13.5, System Req 16.1, 7.1, System Req 14.1-14.4_

- [x] 0.1 Implement /api/auth/verify endpoint
  - POST /api/auth/verify
  - Takes signature + wallet address
  - Validates signature (EIP-191)
  - Creates JWT
  - Stores in httpOnly cookie
  - Returns { success: true, walletAddress: "0x..." }
  - _Requirements: System Req 13.5_

- [x] 0.2 Implement /api/auth/me endpoint
  - GET /api/auth/me
  - Validates JWT from cookie
  - Returns { authenticated: true, walletAddress: "0x..." }
  - Returns 401 if JWT invalid/expired
  - _Requirements: System Req 16.1_

- [x] 0.3 Implement /api/home-metrics endpoint (backend creates it)
  - See Task 11.1 for frontend integration
  - _Requirements: 7.1, System Req 14.1-14.4_

- [x] 1. Set up project structure and core infrastructure
  - Create directory structure for home page components
  - Set up TypeScript types and interfaces
  - Configure React Query provider
  - Set up error boundaries
  - _Requirements: All requirements (foundation)_

- [x] 1.1 Create TypeScript types and interfaces
  - Define `HomeMetrics` interface in `src/types/home.ts`
  - Define component prop interfaces
  - Export all types via barrel file
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1_

- [x] 1.2 Set up demo data service
  - Create `src/lib/services/demoDataService.ts`
  - Implement `getDemoMetrics()` function with hardcoded values
  - Ensure instant return (< 200ms)
  - _Requirements: System Req 12.1, 12.6, 12.7_

- [x] 1.3 Create error messages constants
  - Create `src/lib/constants/errorMessages.ts`
  - Define ERROR_MESSAGES, SUCCESS_MESSAGES, INFO_MESSAGES
  - Export all message constants
  - _Requirements: System Req 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.10_

- [x] 1.4 Create Error Boundary component
  - Create `src/components/ui/ErrorBoundary.tsx`
  - Implements React Error Boundary pattern
  - Shows fallback UI on error
  - Logs to Sentry
  - Has "Retry" button
  - Wraps: HeroSection, FeatureCardGrid, TrustBuilders, OnboardingSection
  - _Requirements: System Req 17.7, 17.8, 17.9_

- [x] 2. Implement authentication system
  - Create Auth Context and Provider
  - Implement WalletConnect v2 integration
  - Set up JWT cookie handling
  - Create useAuth hook
  - _Requirements: System Req 13.1-13.10, System Req 16.1-16.8_

- [x] 2.1 Create Auth Context
  - Implement `src/lib/context/AuthContext.tsx`
  - Define AuthContextType interface
  - Implement AuthProvider component
  - Create useAuth hook
  - Handle JWT validation on mount
  - _Requirements: System Req 13.1, 13.8, 13.9, 13.10, System Req 16.1, 16.2, 16.3_

- [x] 2.2 Configure WalletConnect v2
  - Create `src/config/wagmi.ts`
  - Configure wagmi with mainnet and sepolia chains
  - Set up connectors (injected, walletConnect, coinbaseWallet)
  - Add WalletConnect project ID from env
  - _Requirements: System Req 13.2, 13.3_

- [x] 2.3 Implement wallet connection flow
  - Add connectWallet function to AuthContext
  - Implement EIP-191 message signing
  - Call `/api/auth/verify` endpoint
  - Store JWT in httpOnly cookie
  - Handle connection errors
  - _Requirements: System Req 13.4, 13.5, 13.6, 13.7_

- [x] 2.4 Write unit tests for Auth Context
  - Test initial auth state
  - Test wallet connection flow
  - Test JWT validation
  - Test disconnect functionality
  - Test error handling
  - _Requirements: System Req 13.1-13.10_

- [x] 2.5 Wire AuthProvider to app layout
  - Update `src/app/layout.tsx`
  - Wrap children with AuthProvider
  - Wrap with WagmiConfig (from wagmi.ts)
  - Wrap with Web3Modal (from @web3modal/wagmi)
  - Add React Query Provider
  - Verify all three providers are properly nested
  - _Requirements: System Req 16.1_

- [x] 3. Create data fetching layer
  - Implement useHomeMetrics hook
  - Set up React Query configuration
  - Handle demo vs live data switching
  - Implement error recovery and retry logic
  - _Requirements: 7.1, 7.2, 7.4, System Req 14.1-14.10, System Req 18.1-18.10_

- [x] 3.1 Implement useHomeMetrics hook
  - Create `src/hooks/useHomeMetrics.ts`
  - Implement demo mode logic (instant return)
  - Implement live mode logic (API fetch)
  - Configure React Query options (staleTime, refetchInterval)
  - Add retry logic with exponential backoff
  - Handle 401 errors (JWT expiration)
  - _Requirements: 7.1, 7.2, System Req 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.8_

- [x] 3.2 Implement data freshness indicators
  - Add timestamp comparison logic
  - Return freshness status (current, stale, outdated)
  - Implement manual refresh functionality
  - _Requirements: System Req 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_

- [x] 3.3 Write unit tests for useHomeMetrics
  - Test demo mode returns instant data
  - Test live mode fetches from API
  - Test demo → live transition
  - Test error recovery with cached data
  - Test retry logic
  - Test JWT expiration handling
  - _Requirements: 7.1, 7.2, 7.4, System Req 14.1-14.10_

- [x] 4. Build Hero Section component
  - Create HeroSection component
  - Implement headline and subheading
  - Add animated background
  - Implement Connect Wallet button
  - Handle demo vs live mode CTAs
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, System Req 13.1_

- [x] 4.1 Create HeroSection component
  - Create `src/components/home/HeroSection.tsx`
  - Implement component structure with props
  - Add headline: "Master Your DeFi Risk & Yield – In Real Time"
  - Add subheading: "Secure your wallet. Hunt alpha. Harvest taxes."
  - Implement responsive layout (stacked on mobile)
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 4.2 Add animated background
  - Implement subtle geometric/whale-themed animation
  - Use Framer Motion for animations
  - Respect prefers-reduced-motion
  - Ensure WCAG AA contrast compliance
  - _Requirements: 1.3, 1.4, 8.4_

- [x] 4.3 Implement CTA button logic
  - Show "Connect Wallet" when not authenticated
  - Show "Start Protecting" when authenticated
  - Trigger WalletConnect modal on click (demo mode)
  - Navigate to /guardian on click (live mode)
  - Add keyboard accessibility
  - _Requirements: System Req 13.1, 3.4_

- [x] 4.5 Create reusable skeleton loaders
  - Create `src/components/ui/Skeletons.tsx`
  - FeatureCardSkeleton (shows pulse animation)
  - TrustStatsSkeleton
  - OnboardingStepsSkeleton
  - Use Tailwind animate-pulse
  - Match exact dimensions of real content
  - Respect prefers-reduced-motion
  - _Requirements: System Req 15.1, 15.2, 15.3_

- [x] 4.4 Write unit tests for HeroSection
  - Test headline and subheading render
  - Test CTA button shows correct text based on auth state
  - Test CTA button click behavior
  - Test keyboard navigation
  - Test contrast ratios
  - _Requirements: 1.1, 1.2, 1.4, 3.4, 8.3_

- [x] 5. Build FeatureCard component
  - Create FeatureCard component with all states
  - Implement loading state with skeleton
  - Implement demo mode badge
  - Implement live mode display
  - Implement error state
  - Add hover animations
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, System Req 12.2, System Req 15.1-15.7_

- [x] 5.1 Create FeatureCard component structure
  - Create `src/components/home/FeatureCard.tsx`
  - Define FeatureCardProps interface
  - Implement component with icon, title, tagline
  - Add preview metric display area
  - Add primary and secondary buttons
  - Apply glassmorphism styling
  - _Requirements: 2.2, 10.1_

- [x] 5.2 Implement FeatureCard states
  - Implement loading state with skeleton loader
  - Implement success state (demo and live)
  - Implement error state with fallback value
  - Add demo mode badge when isDemo=true
  - Implement smooth transitions between states (200ms fade)
  - _Requirements: System Req 12.2, System Req 15.1, 15.2, 15.3, 15.4_

- [x] 5.3 Add FeatureCard interactions
  - Implement hover animation (scale 1.02, 150ms ease)
  - Add primary button click handler (navigate to feature)
  - Add secondary button click handler (show demo)
  - Ensure keyboard accessibility
  - Ensure touch targets ≥44px on mobile
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.5_

- [x] 5.4 Write unit tests for FeatureCard
  - Test all required elements render
  - Test loading state shows skeleton
  - Test demo badge appears when isDemo=true
  - Test error state shows fallback value
  - Test hover animation
  - Test button click handlers
  - Test keyboard navigation
  - _Requirements: 2.2, 3.1, 3.2, 3.3, 3.4, System Req 12.2_

- [x] 6. Create feature-specific cards
  - Create Guardian card with live Guardian Score
  - Create Hunter card with live opportunities count
  - Create HarvestPro card with live tax benefit estimate
  - Wire up live metrics from useHomeMetrics hook
  - _Requirements: 2.3, 2.4, 2.5_

- [x] 6.1 Implement Guardian FeatureCard
  - Use Shield icon from Lucide
  - Set title: "Guardian"
  - Set tagline: "Secure your wallet"
  - Wire up guardianScore from metrics
  - Set primaryRoute: "/guardian"
  - _Requirements: 2.3_

- [x] 6.2 Implement Hunter FeatureCard
  - Use Zap icon from Lucide
  - Set title: "Hunter"
  - Set tagline: "Hunt alpha opportunities"
  - Wire up hunterOpportunities from metrics
  - Set primaryRoute: "/hunter"
  - _Requirements: 2.4_

- [x] 6.3 Implement HarvestPro FeatureCard
  - Use Leaf icon from Lucide
  - Set title: "HarvestPro"
  - Set tagline: "Harvest tax losses"
  - Wire up harvestEstimateUsd from metrics
  - Set primaryRoute: "/harvestpro"
  - _Requirements: 2.5_

- [x] 7. Build TrustBuilders component
  - Create TrustBuilders component
  - Display trust badges
  - Display platform statistics
  - Handle loading and error states
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7.1 Create TrustBuilders component
  - Create `src/components/home/TrustBuilders.tsx`
  - Define TrustBuildersProps interface
  - Display 4 badges: "Non-custodial", "No KYC", "On-chain", "Guardian-vetted"
  - Display stats: totalWalletsProtected, totalYieldOptimizedUsd, averageGuardianScore
  - Implement skeleton loaders for stats
  - Handle fallback values on error
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7.2 Write unit tests for TrustBuilders
  - Test badges render correctly
  - Test stats display when loaded
  - Test skeleton loaders show during loading
  - Test fallback values on error
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 8. Build OnboardingSection component
  - Create OnboardingSection component
  - Display 3-step onboarding flow
  - Implement primary and secondary CTAs
  - Handle responsive layout
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8.1 Create OnboardingSection component
  - Create `src/components/home/OnboardingSection.tsx`
  - Define OnboardingSectionProps interface
  - Display 3 steps: "Connect Wallet", "Run Guardian Scan", "Browse Hunter"
  - Add primary CTA: "Start Onboarding" → /onboarding
  - Add secondary CTA: "Skip" → /hunter
  - Implement responsive layout (vertical on mobile, horizontal on desktop)
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 8.2 Write unit tests for OnboardingSection
  - Test 3 steps render correctly
  - Test primary CTA navigates to /onboarding
  - Test secondary CTA navigates to /hunter
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 9. Build FooterNav component
  - Create FooterNav component
  - Display navigation icons
  - Implement active route highlighting
  - Handle navigation clicks
  - Ensure mobile-friendly touch targets
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9.1 Create FooterNav component
  - Create `src/components/layout/FooterNav.tsx`
  - Define FooterNavProps interface
  - Use usePathname() hook to get current route
  - Display 4 icons: Guardian, Hunter, HarvestPro, Settings
  - Implement navigation on click
  - Compare current route to determine active item
  - Highlight active route with cyan color
  - Fixed positioning on mobile
  - Ensure touch targets ≥44px
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9.2 Write unit tests for FooterNav
  - Test all 4 icons render
  - Test navigation on click
  - Test active route highlighting
  - Test touch target sizes
  - Test keyboard navigation
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 10. Assemble Home page
  - Create main Home page component
  - Integrate all sections
  - Implement layout and spacing
  - Add SEO metadata
  - _Requirements: 1.1-1.5, 2.1-2.5, 4.1-4.5, 5.1-5.5, 6.1-6.5, 11.1-11.5_

- [x] 10.1 Create Home page component
  - Create `src/app/page.tsx`
  - Import and compose all sections
  - Implement responsive layout
  - Add proper spacing between sections
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10.2 Add SEO metadata
  - Add page title: "AlphaWhale: Master DeFi Risk & Yield in Real Time"
  - Add meta description: "Secure your wallet. Hunt alpha. Harvest taxes..."
  - Create social image (1200x630px) → `/public/og-image.png`
  - Add Open Graph tags (og:title, og:description, og:image)
  - Add og:image URL to meta tags
  - Ensure content is indexable
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 11. Implement backend API endpoint
  - Create /api/home-metrics endpoint
  - Implement authentication verification
  - Fetch metrics from Guardian, Hunter, HarvestPro
  - Aggregate platform statistics
  - Add caching headers
  - _Requirements: 7.1, System Req 14.1, 14.2, 14.4_

- [x] 11.1 Create /api/home-metrics endpoint
  - Create `src/app/api/home-metrics/route.ts`
  - Verify JWT from httpOnly cookie
  - Return 401 if not authenticated
  - Fetch Guardian metrics for user
  - Fetch Hunter metrics for user
  - Fetch HarvestPro metrics for user
  - Fetch platform-wide statistics
  - Return HomeMetrics JSON with cache headers
  - _Requirements: 7.1, System Req 14.1, 14.2, 14.4_

- [x] 11.2 Write integration tests for API endpoint
  - Test authenticated request returns metrics
  - Test unauthenticated request returns 401
  - Test expired JWT returns 401
  - Test 500 error handling
  - Test cache headers
  - _Requirements: 7.1, System Req 14.1, 14.2, 14.4_

- [x] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 13. Implement accessibility features
  - Add ARIA labels to all interactive elements
  - Verify contrast ratios
  - Test keyboard navigation
  - Add focus indicators
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 13.1 Add ARIA labels and semantic HTML
  - Add aria-label to all buttons
  - Add aria-label to all links
  - Use semantic HTML (nav, main, section, article)
  - Add role attributes where needed
  - _Requirements: 8.1_

- [x] 13.2 Verify and fix contrast ratios
  - Test all text against backgrounds
  - Ensure normal text meets 4.5:1 ratio
  - Ensure large text meets 3:1 ratio
  - Fix any failing combinations
  - _Requirements: 1.4, 8.3_

- [ ] 13.3 Run accessibility audit
  - Run axe DevTools on Home page
  - Run Lighthouse accessibility audit
  - Fix all violations
  - Achieve Lighthouse score ≥90
  - _Requirements: 8.5_

- [ ] 14. Optimize performance
  - Implement code splitting
  - Optimize images
  - Add prefetching
  - Minimize bundle size
  - _Requirements: 7.3, System Req 19.1-19.11_

- [ ] 14.1 Implement code splitting
  - Lazy load OnboardingSection
  - Lazy load non-critical animations
  - Use dynamic imports for heavy components
  - _Requirements: System Req 19.8_

- [ ] 14.2 Optimize images and assets
  - Use Next.js Image component for all images
  - Generate WebP versions
  - Add responsive sizes
  - Set priority for above-the-fold images
  - _Requirements: System Req 19.9_

- [ ] 14.3 Add route prefetching
  - Prefetch /guardian on Guardian card hover
  - Prefetch /hunter on Hunter card hover
  - Prefetch /harvestpro on HarvestPro card hover
  - _Requirements: 7.3_

- [ ] 14.4 Run performance audit
  - Run Lighthouse performance audit
  - Verify LCP < 2.5s
  - Verify TTI < 3.0s
  - Verify CLS < 0.1
  - Verify FID < 100ms
  - Achieve Lighthouse score ≥90
  - _Requirements: 7.3, System Req 19.1, 19.2, 19.3, 19.4, 19.7_

- [ ] 15. Write E2E tests
  - Test complete user journey (demo → connect → live)
  - Test navigation flows
  - Test error scenarios
  - Test mobile responsiveness
  - _Requirements: All requirements (validation)_

- [ ] 15.1 Write E2E test for demo mode
  - Test page loads in demo mode
  - Test demo badges visible
  - Test demo metrics display
  - Test navigation works in demo mode
  - _Requirements: System Req 12.1, 12.2, 12.3_

- [ ] 15.2 Write E2E test for wallet connection
  - Test Connect Wallet button click
  - Test WalletConnect modal opens
  - Test wallet selection
  - Test signature request
  - Test transition to live mode
  - _Requirements: System Req 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [ ] 15.3 Write E2E test for error scenarios
  - Test API failure shows cached data
  - Test network offline shows cached data
  - Test JWT expiration reverts to demo
  - _Requirements: System Req 14.5, 14.10, System Req 16.6_

- [ ] 15.4 Write E2E test for mobile responsiveness
  - Test layout on 375px width
  - Test touch targets ≥44px
  - Test footer nav fixed positioning
  - _Requirements: 9.4, 6.4, 6.5_

- [ ] 16. Final Checkpoint - Production readiness
  - Ensure all tests pass, ask the user if questions arise.
