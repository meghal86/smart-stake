# App Store Compliance Checklist — AlphaWhale

## ✅ Already Done
- [x] Privacy Policy page at /legal/privacy
- [x] Terms of Service page at /legal/terms
- [x] Financial disclaimer (not financial advice) — in LegalDisclosureModal
- [x] iOS subscription redirect (no direct payment links in iOS app)
- [x] App icons in all required sizes (public/app-icons/)
- [x] PWA manifest with correct metadata
- [x] No seed phrase collection (read-only wallet connection)

## Google Play Store Requirements

### App Content
- [ ] Content rating completed (Finance category, Everyone)
- [ ] Data Safety section filled (email, wallet addresses, usage data)
- [ ] Target API level: Android 14 (API 34) — set in build.gradle
- [ ] 64-bit support — Capacitor handles this automatically

### Store Listing
- [ ] App name (≤30 chars): AlphaWhale — DeFi Intelligence
- [ ] Short description (≤80 chars): See store-assets/GOOGLE_PLAY_LISTING.md
- [ ] Full description (≤4000 chars): See store-assets/GOOGLE_PLAY_LISTING.md
- [ ] Screenshots: min 2 phone screenshots (1080x1920 recommended)
- [ ] Feature graphic: 1024x500 PNG
- [ ] App icon: 512x512 PNG (already in public/favicon-512.png)

### Technical
- [ ] APK/AAB signed with release keystore
- [ ] minSdkVersion ≥ 26 (Android 8) — set in android/app/build.gradle
- [ ] App does NOT request SMS, Call Log, or Location permissions
- [ ] WebView allowlist configured for your domain

## Apple App Store Requirements

### App Review
- [ ] Demo credentials in review notes (or demo mode works without login)
- [ ] No crashes on iPhone 15 and iPhone SE (oldest supported)
- [ ] All features accessible without real money
- [ ] Subscription via web redirect (NOT Stripe in-app) ✅ Done

### Store Listing
- [ ] App name (≤30 chars): AlphaWhale
- [ ] Subtitle (≤30 chars): DeFi Intelligence & Guardian
- [ ] Keywords (≤100 chars): DeFi,crypto,whale,portfolio,guardian,airdrop,token,blockchain,ethereum,wallet
- [ ] Screenshots: iPhone 6.7" required + iPhone 5.5" required
- [ ] App Preview video: optional but highly recommended
- [ ] App icon: 1024x1024 PNG no alpha (use public/whaleplus-appstore-1024x1024.png)

### Privacy
- [ ] Data collection declared: Email (account), Wallet Addresses (user ID), Usage Data
- [ ] Data NOT collected: Financial info, Location, Contacts, Photos, Messages
- [ ] Third-party SDKs declared: Supabase, PostHog, Sentry
- [ ] Age rating: 4+ or 12+ (no violence, no gambling, informational finance app)

### Technical
- [ ] Build with Xcode 15+
- [ ] Deployment target: iOS 16+
- [ ] No private API usage
- [ ] Privacy manifest (PrivacyInfo.xcprivacy) — Capacitor 6+ includes this
