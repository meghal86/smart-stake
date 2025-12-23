# Implementation Plan: App Store Onboarding

## Overview

This implementation plan converts the AlphaWhale Next.js web application into an App Store-ready iOS app using Capacitor. The approach focuses on App Store compliance, native security features, and maintaining AlphaWhale's trust moat while ensuring seamless integration between web and native components.

**iOS v1 Scope**: Guest Mode + optional login (no wallet connect, no deep link returns, no push notifications required)

## Tasks

- [ ] 0. iOS v1 Scope Definition and Lock
  - [ ] 0.1 Define iOS v1 feature scope
    - Document Guest Mode only + optional login capabilities
    - Explicitly exclude wallet connect, deep link returns, push notifications
    - Create "iOS v1 Scope Declaration" document
    - _Requirements: 3B.1, 3B.2, 3B.3, 3B.4_
    - **Acceptance Criteria**: Document exists with explicit feature exclusions, signed off by product team

- [ ] 1. Project Setup and Capacitor Integration
  - [ ] 1.1 Install and configure Capacitor for iOS
    - Install @capacitor/core, @capacitor/cli, @capacitor/ios
    - Configure capacitor.config.ts with bundle ID and app metadata
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
    - **Acceptance Criteria**: `npx cap add ios` succeeds, ios/ directory created

  - [ ] 1.2 Set up Next.js static export configuration
    - Configure next.config.js for static export
    - Set up build pipeline: next build && next export
    - _Requirements: 1A.1, 1A.2_
    - **Acceptance Criteria**: `npm run build` generates static files in out/ directory

  - [ ] 1.3 Write property test for Capacitor sync process
    - **Property 2: Capacitor-Next.js State Consistency**
    - **Validates: Requirements 1A.1, 1A.2, 1A.4, 1A.5**
    - **Acceptance Criteria**: Property test passes with 100+ iterations

- [ ] 2. iOS Native Configuration
  - [ ] 2.1 Configure app icons and splash screens for all iOS sizes
    - Create app icons in required sizes (1024x1024, 180x180, 120x120, etc.)
    - Set up splash screen assets and configuration
    - _Requirements: 2.1, 2.5_
    - **Acceptance Criteria**: All icon sizes present, Xcode shows no missing asset warnings

  - [ ] 2.2 Set up iOS permissions and Info.plist
    - Configure Face ID permission (NSFaceIDUsageDescription)
    - Add privacy usage descriptions for required features only
    - Remove unused permissions to avoid ATT prompts
    - _Requirements: 2.2, 8.2_
    - **Acceptance Criteria**: Info.plist contains only required permissions, no unused tracking permissions

  - [ ] 2.3 Write property test for permission system
    - **Property 6: Native Feature Integration Consistency**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
    - **Acceptance Criteria**: Property test validates permission requests match usage

  - [ ] 2.4 Implement Native Security Baselines
    - Configure domain allowlist in WKWebView
    - Enforce App Transport Security (ATS)
    - Block arbitrary navigation to unknown origins
    - Implement SafariViewController for external links
    - _Requirements: 5B.1, 5B.2_
    - **Acceptance Criteria**: Only allowlisted domains load, external links blocked

  - [ ] 2.5 Implement CSP Policy Enforcement
    - Configure Content Security Policy headers
    - Disallow unsafe-inline unless using nonce/hashes for Next.js runtime
    - CSP violations fail CI only for new violations (baseline allowlist)
    - _Requirements: 8.3_
    - **Acceptance Criteria**: No CSP violations beyond approved baseline; no third-party script injection

  - [ ] 2.6 Add ATS Configuration Validation
    - Ensure HTTPS-only network requests
    - Block mixed content loading
    - Validate ATS settings
    - Certificate pinning is Phase 2 (optional)
    - _Requirements: 8.3_
    - **Acceptance Criteria**: No ATS exceptions; TLS required; no mixed content

  - [ ] 2.7 Implement Domain Allowlist Testing and Monitoring
    - Add allowlist config file management
    - Create metrics for blocked navigation attempts
    - Write property test for navigation blocking
    - Log blocked navigation attempts for analysis
    - _Requirements: 5B.1, 5B.2_
    - **Acceptance Criteria**: Navigation blocked for non-allowlisted domains, metrics collected

- [ ] 3. App Store Compliance Implementation
  - [ ] 3.1A Implement crypto compliance disclaimer with enforcement
    - Add first-launch compliance modal with required copy
    - Implement IOS_EXECUTION_DISABLED = true flag
    - Create runtime assertion to block execution UI
    - _Requirements: 3A.1, 3A.2, 3A.3, 3A.4, 3A.5, 3A.6_
    - **Acceptance Criteria**: Modal shows required disclaimer, execution UI blocked

  - [ ] 3.1B Implement App Store wording compliance linter
    - Create automated check for prohibited words ("trade", "execute", "buy", "sell")
    - Validate App Store description uses only approved terms
    - Add CI check to prevent prohibited wording
    - _Requirements: 3A.5, 3A.6_
    - **Acceptance Criteria**: Linter catches prohibited words, CI fails on violations

  - [ ] 3.2 Implement Guest Mode system
    - Create demo data service with hardcoded sample data
    - Build guest navigation flow with clear "Demo Mode" badges
    - Add wallet connection upgrade prompts
    - _Requirements: 3B.1, 3B.2, 3B.3, 3B.4_
    - **Acceptance Criteria**: Guest mode works without authentication, demo badges visible

  - [ ] 3.3 Write property test for App Store compliance
    - **Property 1: App Store Compliance Validation**
    - **Validates: Requirements 3.1, 3A.1, 3A.2, 3A.3, 3A.4, 3A.5, 3A.6**
    - **Acceptance Criteria**: Property test validates compliance across all app states

  - [ ] 3.4 Write property test for Guest Mode accessibility
    - **Property 3: Guest Mode Accessibility**
    - **Validates: Requirements 3B.1, 3B.2, 3B.3, 3B.4**
    - **Acceptance Criteria**: Property test validates guest mode provides value without auth

- [ ] 4. Security and Trust Layer Implementation
  - [ ] 4.1 Implement biometric authentication system
    - Set up Face ID/Touch ID integration using Capacitor plugins
    - Create app lock/unlock functionality
    - Add manual lock from settings
    - _Requirements: 5A.1, 5A.5_
    - **Acceptance Criteria**: Biometric auth works on supported devices, graceful fallback

  - [ ] 4.2A Implement Safe Mode Policy Engine
    - Create explicit blocklist/allowlist for external domains
    - Implement Safe Mode toggle with persistent state
    - Block auto-redirects and background-triggered deep links
    - _Requirements: 5A.2, 5B.1, 5B.2_
    - **Acceptance Criteria**: Safe Mode blocks external navigation, user can toggle

  - [ ] 4.2B Build external link protection system
    - Create external link interception middleware
    - Add risk confirmation modals for DEX/token links
    - Implement SafariViewController for external links
    - _Requirements: 5B.1, 5B.2, 5B.3_
    - **Acceptance Criteria**: All external links show warning, open in SafariViewController

  - [ ] 4.3A Set up iOS Keychain storage with data classification
    - Implement secure data storage for sensitive preferences
    - Create keychain access methods with proper error handling
    - Add data encryption/decryption for non-keychain data
    - Classify data by sensitivity level (keychain vs local storage)
    - _Requirements: 5A.4, 8.3_
    - **Acceptance Criteria**: Sensitive data in keychain, proper data classification documented

  - [ ] 4.4 Write property test for biometric security
    - **Property 4: Biometric Security Enforcement**
    - **Validates: Requirements 5A.1, 5A.5**
    - **Acceptance Criteria**: Property test validates biometric enforcement across scenarios

  - [ ] 4.5 Write property test for external link safety
    - **Property 5: External Link Safety Validation**
    - **Validates: Requirements 5B.1, 5B.2, 5B.3, 5B.4**
    - **Acceptance Criteria**: Property test validates link safety across all URL types

  - [ ] 4.6 Write property test for keychain security
    - **Property 9: Keychain Storage Security**
    - **Validates: Requirements 5A.4, 8.3**
    - **Acceptance Criteria**: Property test validates secure storage and retrieval

- [ ] 5. Checkpoint - Core functionality validation
  - Run all property tests and validate 100% pass rate
  - Verify Guest Mode works end-to-end without authentication
  - Confirm Safe Mode blocks external navigation
  - **Acceptance Criteria**: All tests pass, core functionality validated on device

- [ ] 6. Native Feature Integration (iOS v1 Scope: In-App Alerts Only)
  - [ ] 6.1 Implement in-app alert system (NO push notifications for v1)
    - Create native-style in-app alert banners
    - Implement Guardian alert integration within app
    - Add alert history and management
    - _Requirements: 5A.3_
    - **Acceptance Criteria**: In-app alerts work without APNs, no push notification permissions requested

  - [ ] 6.2 Add native sharing integration (NO camera/haptics for v1)
    - Implement iOS share sheet for portfolio insights
    - Add share functionality for Guardian alerts
    - _Requirements: 5.2_
    - **Acceptance Criteria**: Share sheet works for supported content types

  - [ ] 6.3 Write property test for in-app alert system
    - **Property 15: In-App Alert System Integration**
    - **Validates: Requirements 5A.3**
    - **Acceptance Criteria**: Property test validates alert delivery without push notifications

- [ ] 7. Capacitor-Next.js Compatibility Layer
  - [ ] 7.1 Implement client-side routing compatibility
    - Configure Next.js for WKWebView navigation
    - Prevent full page reloads in WebView
    - Handle iOS back gesture mapping
    - _Requirements: 1A.1, 1A.2, 1A.4_
    - **Acceptance Criteria**: Navigation feels native, no page reloads

  - [ ] 7.2 Implement Universal Link safety (NO wallet connect deep links for v1)
    - Set up Universal Links for app routing only
    - Block wallet connection deep link returns
    - Add state recovery for app backgrounding
    - _Requirements: 1A.3, 1A.5_
    - **Acceptance Criteria**: Universal Links work for app navigation, wallet deep links blocked

  - [ ] 7.3 Write property test for safe deep link handling
    - **Property 7: Safe Deep Link Handling Reliability**
    - **Validates: Requirements 1A.3, 2.4**
    - **Acceptance Criteria**: Property test validates safe link handling, blocks unsafe links

- [ ] 8. Performance Optimization
  - [ ] 8.1 Optimize app launch and bundle size
    - Implement lazy loading for non-critical components
    - Optimize asset sizes and compression
    - Configure memory management for iOS
    - _Requirements: 4.1, 4.4, 4.5_
    - **Acceptance Criteria**: Launch time < 3 seconds, bundle size optimized

  - [ ] 8.2 Implement native loading states and transitions
    - Add iOS-style activity indicators
    - Create 60fps transition animations
    - Implement skeleton loading screens
    - _Requirements: 4.2, 4.3_
    - **Acceptance Criteria**: Animations run at 60fps, loading states feel native

  - [ ] 8.3 Write property test for performance standards
    - **Property 11: Performance Standards Compliance**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - **Acceptance Criteria**: Property test validates performance benchmarks

- [ ] 9. App Store Connect Setup
  - [ ] 9.1 Create App Store Connect app record
    - Set up bundle ID and app metadata
    - Configure pricing and availability
    - Add app categories (Finance, Business) and keywords
    - _Requirements: 6.1, 6.5_
    - **Acceptance Criteria**: App record created, metadata configured

- [ ] 10. In-App Purchase Implementation
  - [ ] 10.1 Implement StoreKit integration
    - Set up StoreKit 2 for subscription management
    - Create product configuration for Pro subscriptions
    - Implement purchase flow and receipt validation
    - _Requirements: 6.1, 6.5_
    - **Acceptance Criteria**: IAP works for Pro subscriptions, receipts validated

  - [ ] 10.2 Add subscription management UI
    - Create subscription status display
    - Implement upgrade/downgrade flows
    - Add subscription cancellation support
    - _Requirements: 6.1_
    - **Acceptance Criteria**: Users can manage subscriptions within app

  - [ ] 10.3 Block external payment links
    - Remove or hide external payment buttons in iOS build
    - Redirect subscription flows to IAP only
    - Add compliance messaging about App Store purchases
    - _Requirements: 6.1_
    - **Acceptance Criteria**: No external payment options visible in iOS app

  - [ ] 10.4 Write property test for IAP compliance
    - **Property 16: IAP Compliance Enforcement**
    - **Validates: Requirements 6.1, 6.5**
    - **Acceptance Criteria**: Property test validates IAP-only subscription flows

- [ ] 11. App Store Connect Metadata and Screenshots
  - [ ] 11.1 Prepare app metadata and screenshots
    - Create App Store screenshots showing monitoring/analytics (NOT execution)
    - Write app description using only approved terms
    - Set up privacy policy and support URLs
    - _Requirements: 6.3, 8.1_
    - **Acceptance Criteria**: Screenshots show analytics only, description uses approved wording

  - [ ] 11.2 Write property test for privacy manifest accuracy
    - **Property 12: Privacy Manifest Accuracy**
    - **Validates: Requirements 8.1, 8.2, 10A.3**
    - **Acceptance Criteria**: Property test validates privacy declarations match actual usage

- [ ] 12. Build Pipeline and CI/CD Setup
  - [ ] 12.1 Configure CI guardrails to prevent capability drift
    - Add automated checks for prohibited packages (wallet signing libraries)
    - Validate IOS_EXECUTION_DISABLED flag in CI
    - Block builds with execution-related components
    - _Requirements: 9A.1, 9A.3_
    - **Acceptance Criteria**: CI fails if execution capabilities detected

  - [ ] 12.2 Set up Capacitor-safe build pipeline
    - Configure web → capacitor sync → Xcode archive flow
    - Implement build validation checks
    - Configure certificate management
    - _Requirements: 9A.1, 9A.2, 9A.3_
    - **Acceptance Criteria**: Build pipeline works without regenerating ios/ directory

  - [ ] 12.3 Set up TestFlight integration
    - Configure automated TestFlight uploads
    - Set up beta testing workflows
    - Implement build number management
    - _Requirements: 9A.4, 7.3_
    - **Acceptance Criteria**: TestFlight uploads work automatically

  - [ ] 12.4 Write property test for build pipeline reliability
    - **Property 10: Build Pipeline Reliability**
    - **Validates: Requirements 9A.1, 9A.2, 9A.3, 9A.4**
    - **Acceptance Criteria**: Property test validates consistent builds

- [ ] 13. Testing and Quality Assurance
  - [ ] 13.1 Implement comprehensive test suite
    - Set up unit tests for native integrations
    - Create integration tests for Capacitor bridge
    - Add E2E tests for critical user flows (guest mode, safe mode)
    - _Requirements: 7.1, 7.2, 7.4_
    - **Acceptance Criteria**: Test suite covers all critical paths

  - [ ] 13.2 Set up device testing and validation
    - Test on physical iPhone and iPad devices
    - Validate across supported iOS versions (iOS 14+)
    - Perform memory and performance testing
    - _Requirements: 7.1, 7.4_
    - **Acceptance Criteria**: App works on all supported devices and iOS versions

  - [ ] 13.3 Write property test for crypto compliance positioning
    - **Property 13: Crypto Compliance Positioning**
    - **Validates: Requirements 3A.1, 3A.2, 3A.3, 3A.4, 3A.5**
    - **Acceptance Criteria**: Property test validates non-custodial positioning across app

- [ ] 14. App Integrity and Trust Signals
  - [ ] 14.1 Implement app integrity verification
    - Add jailbreak detection (non-blocking, logging only)
    - Implement simulator detection
    - Create runtime tamper detection
    - _Requirements: 10A.1, 10A.2_
    - **Acceptance Criteria**: Integrity checks work but don't block app usage

  - [ ] 14.2 Create "How AlphaWhale Protects You" page
    - Build trust information display
    - Add company and security information
    - Implement support contact integration
    - _Requirements: 10A.1, 10A.2_
    - **Acceptance Criteria**: Trust page displays company info and security posture

  - [ ] 14.3 Write property test for trust signal consistency
    - **Property 14: Trust Signal Display Consistency**
    - **Validates: Requirements 10A.1, 10A.2**
    - **Acceptance Criteria**: Property test validates consistent trust signal display

- [ ] 15. App Review Killer Test Pack
  - [ ] 15.1 App Review Killer Test Pack (must pass on a physical device)
    - Guest Mode: launch → see demo alerts → view Hunter demo → view Protects You page
    - External links: any link → warning → opens SafariViewController
    - Safe Mode: enable → external links require confirm; any auto-redirect blocked
    - Permissions: no ATT prompt; FaceID prompt only when enabling App Lock
    - IAP: paywall opens; subscription purchase flow works; restore purchases works
    - Wording lint: forbidden words absent across UI + metadata strings
    - Guest Mode provides full demo value even if login fails or is skipped
    - _Requirements: 3A.1, 3A.2, 3A.3, 3A.4, 3A.5, 3A.6, 3B.1, 3B.2, 3B.3, 3B.4, 5A.1, 5B.1, 5B.2, 6.1_
    - **Acceptance Criteria**: All killer tests pass on physical device, app ready for submission

- [ ] 16. Final checkpoint - Pre-submission validation
  - Run complete test suite and validate 100% pass rate
  - Verify Guest Mode works end-to-end without any authentication
  - Confirm all external links show warnings and open in SafariViewController
  - Validate IAP works for all subscription flows
  - **Acceptance Criteria**: All tests pass, app ready for submission

- [ ] 17. App Store Submission Preparation
  - [ ] 17.1 Final compliance and metadata review
    - Validate App Store description uses only approved terms
    - Review privacy manifest accuracy against actual app behavior
    - Confirm crypto compliance positioning in all user-facing text
    - _Requirements: 3A.5, 8.1, 10A.3_
    - **Acceptance Criteria**: All metadata compliant, no prohibited terms used

  - [ ] 17.2 Create App Review Notes and submission materials
    - Prepare App Review Notes using template from design.md
    - Generate final screenshots showing analytics/monitoring only
    - Create submission checklist
    - _Requirements: 6.3, 6.4_
    - **Acceptance Criteria**: App Review Notes complete, screenshots show no execution UI

- [ ] 18. Monitoring and Analytics Setup (No ATT prompts)
  - [ ] 18.1 Implement privacy-safe analytics tracking
    - Set up analytics without cross-app tracking
    - Configure crash reporting (no personal data)
    - Add performance monitoring
    - Avoid any tracking that requires ATT permission
    - _Requirements: 10.1, 10.2, 10.3_
    - **Acceptance Criteria**: Analytics work without ATT prompts, privacy-compliant

  - [ ] 18.2 Set up App Store Connect analytics integration
    - Configure download and revenue tracking
    - Set up user feedback collection
    - Implement review monitoring
    - _Requirements: 10.4, 10.5_
    - **Acceptance Criteria**: App Store analytics configured, feedback collection works

  - [ ] 16.2 Set up App Store Connect analytics integration
    - Configure download and revenue tracking
    - Set up user feedback collection
    - Implement review monitoring
    - _Requirements: 10.4, 10.5_
    - **Acceptance Criteria**: App Store analytics configured, feedback collection works

## Notes

- All tasks are required for comprehensive App Store submission readiness
- Each task references specific requirements for traceability
- Checkpoints provide objective go/no-go criteria instead of "ask user" prompts
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- The implementation follows a layered approach: setup → compliance → security → integration → optimization → submission

## Critical v1.2 Updates Applied

This tasks.md v1.2 addresses all final "sharp edges" identified for execution readiness:

1. **Certificate Pinning Removed (2.6)**: Replaced brittle pinning with TLS enforcement + optional pinning later
2. **Domain Allowlist Consolidation (2.4/2.7)**: Implementation in 2.4, testing/monitoring in 2.7
3. **CSP Next.js Compatibility (2.5)**: Allow controlled exceptions for Next.js runtime with nonce/hashes
4. **IAP Before Screenshots (10→11)**: IAP implementation moved before App Store Connect screenshots
5. **App Review Killer Test Pack (15.1)**: Comprehensive device testing checklist for App Review readiness
6. **Reality Check Mitigations**: Guest Mode provides full value even if login fails; Demo Mode badges on all screens

## iOS v1 Scope Enforcement

- **Guest Mode + Optional Login**: Core functionality works without wallet connection
- **No Wallet Connect Deep Links**: Removed for v1 safety
- **No Push Notifications**: In-app alerts only for v1
- **No Camera/Haptics**: Removed scope creep
- **IAP Only**: All subscriptions through App Store
- **Analytics Without ATT**: Privacy-safe tracking only

## App Review Readiness Checklist

The App Review Killer Test Pack (Task 15.1) ensures:
- ✅ Guest Mode provides full demo value
- ✅ External links show warnings → SafariViewController
- ✅ Safe Mode blocks auto-redirects
- ✅ No ATT prompts unless tracking
- ✅ IAP flows work end-to-end
- ✅ Forbidden words absent from UI/metadata
- ✅ Demo Mode clearly labeled throughout