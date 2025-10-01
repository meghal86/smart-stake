# AlphaWhale Lite Feature Audit

## Summary

- ✅ **Built**: 26
- 🟡 **Partial**: 9
- ❌ **Missing**: 3

## Feature Details

| Key | Feature | Tier/Flag | Status | Evidence | Tests |
|-----|---------|-----------|--------|----------|-------|
| layout_rhythm_tokens | Spacing tokens s4/8/12/16/24; normalized paddings | ui.v2 | ✅ Built | src/styles/tokens.css, apps/legacy/src/styles/tokens.css, src/styles/compact.css | unit:e2e |
| cta_hierarchy | Primary Set Alert, secondary Follow, tertiary Share styles | ui.v2 | 🟡 Partial | src/components/AlertChannels.tsx, src/components/AlertTeaserCard.tsx | unit:e2e |
| foryou_carousel_newdot | For You row as horizontal carousel with New indicator | ui.v2 | ✅ Built | apps/web/src/components/ForYouRow.tsx, node_modules/@alphawhale/web/src/components/ForYouRow.tsx, src/components/AlertChannels.tsx | unit:e2e |
| digest_row_clickable_hotkeys | Digest rows clickable with mini CTAs and keyboard shortcuts | ui.v2 | ✅ Built | src/components/AlertChannels.tsx, src/components/AlertTeaserCard.tsx | unit:e2e |
| spotlight_time_confidence | Spotlight: absolute+relative time + confidence chip | ui.v2 | ✅ Built | apps/web/src/components/ConfidenceChip.tsx, node_modules/@alphawhale/web/src/components/ConfidenceChip.tsx, src/components/AlertChannels.tsx | unit:e2e |
| fear_index_marker_methodology | Fear Index score on marker + Methodology link | ui.v2 | ✅ Built | docs/methodology.md, docs/methodology.md | unit:e2e |
| alerts_filters_markread | Alerts Feed tabs All/Mine/System + Mark all read | ui.v2 | ✅ Built | apps/web/src/components/AlertsFeed.tsx, node_modules/@alphawhale/web/src/components/AlertsFeed.tsx | unit:e2e |
| portfolio_demo_reset | Try Demo Portfolio + 24h P&L + Reset demo | ui.v2 | 🟡 Partial | src/components/AlertChannels.tsx, src/components/AlertTeaserCard.tsx | unit:e2e |
| pro_teaser_price_trust | $19/mo, bullets, Cancel anytime, trust indicators | ui.v2 | ✅ Built | apps/web/src/components/ProTeaser.tsx, node_modules/@alphawhale/web/src/components/ProTeaser.tsx | unit:e2e |
| mobile_sticky_subheaders_safearea | Mobile sticky headers and safe-area padding | ui.v2 | ✅ Built | apps/web/src/components/MobileDock.tsx, node_modules/@alphawhale/web/src/components/MobileDock.tsx, src/components/AlertChannels.tsx | unit:e2e |
| accessibility_core | Focus order, aria-live, gradient AA contrast | ui.v2 | 🟡 Partial | src/components/AlertChannels.tsx, src/components/AlertTeaserCard.tsx | unit:e2e |
| microcopy_tone_update | See full analysis copy + Simulated tooltip | ui.v2 | 🟡 Partial | src/components/AlertChannels.tsx, src/components/AlertTeaserCard.tsx | unit:e2e |
| foryou_row_actions | For You quick actions (Set Alert/Follow/Share) | ui.v2 | ✅ Built | apps/web/src/components/ForYouRow.tsx, node_modules/@alphawhale/web/src/components/ForYouRow.tsx | unit:e2e |
| alerts_feed | Alerts list grouped by time with create modal | ui.v2 | ✅ Built | apps/web/src/components/AlertsFeed.tsx, node_modules/@alphawhale/web/src/components/AlertsFeed.tsx | unit:e2e |
| actionable_digest_ctas | CTAs on each digest line | ui.v2 | 🟡 Partial | src/components/AlertChannels.tsx, src/components/AlertTeaserCard.tsx | unit:e2e |
| trust_anchors_global | Etherscan links, Last-updated, Provenance tooltips | ui.v2 | 🟡 Partial | src/components/AlertChannels.tsx, src/components/AlertTeaserCard.tsx | unit:e2e |
| pro_teaser_trial | 7-day trial CTA | ui.v2 | ✅ Built | apps/web/src/components/ProTeaser.tsx, node_modules/@alphawhale/web/src/components/ProTeaser.tsx | unit:e2e |
| mobile_sticky_dock | Mobile dock: Spotlight|Watchlist|Alerts|Upgrade | ui.v2 | ✅ Built | apps/web/src/components/MobileDock.tsx, node_modules/@alphawhale/web/src/components/MobileDock.tsx | unit:e2e |
| demo_portfolio_btn | Demo portfolio button near Connect Wallet | ui.v2 | 🟡 Partial | src/components/AlertChannels.tsx, src/components/AlertTeaserCard.tsx | unit:e2e |
| telemetry_events_core | Core telemetry events tracked | ui.v2 | ✅ Built | node_modules/next/dist/telemetry/anonymous-meta.d.ts, node_modules/next/dist/telemetry/anonymous-meta.js, apps/web/src/hooks/useTelemetry.ts | unit:e2e |
| share_og_cards | OG image endpoint + share copy | ui.v2 | ✅ Built | apps/web/src/app/api/og/route.tsx, node_modules/@alphawhale/web/src/app/api/og/route.tsx, apps/web/src/app/api/share/spotlight/[id]/route.tsx | unit:e2e |
| referrals_flow | Invite + progress tracking | pro | ✅ Built | apps/web/src/app/referrals/page.tsx, node_modules/@alphawhale/web/src/app/referrals/page.tsx, apps/web/src/app/referrals/page.tsx | unit:e2e |
| nux_wizard_three_steps | Onboarding: pick assets → follow whales → enable alerts | ui.v2 | ✅ Built | apps/web/src/components/OnboardingWizard.tsx, node_modules/@alphawhale/web/src/components/OnboardingWizard.tsx | unit:e2e |
| visual_feedback_refresh | Refresh spinner, skeletons, auto-refresh pulse | ui.v2 | ✅ Built | apps/web/src/components/RefreshButton.tsx, node_modules/@alphawhale/web/src/components/RefreshButton.tsx, src/components/AlertChannels.tsx | unit:e2e |
| cloud_sync_cross_device | Cross-device sync with user_id or anon_id | ui.v2 | ✅ Built | apps/web/src/hooks/useCloudSync.ts, node_modules/@alphawhale/web/src/hooks/useCloudSync.ts, src/hooks/hub2.ts | unit:e2e |
| link_to_email_or_share_code | Email linking or share code import flow | ui.v2 | 🟡 Partial | src/hooks/hub2.ts, src/hooks/use-mobile.tsx, src/components/AlertChannels.tsx | unit:e2e |
| push_notifications_webpush | Service worker + VAPID push notifications | ui.v2 | ✅ Built | public/sw.js | unit:e2e |
| funnel_dashboard_internal | Internal funnel dashboard page | ui.v2 | ❌ Missing | none | unit:e2e |
| methodology_docs | Methodology documentation page | ui.v2 | ✅ Built | docs/methodology.md, apps/web/src/app/docs/methodology/page.tsx, node_modules/@alphawhale/web/src/app/docs/methodology/page.tsx | unit:e2e |
| leaderboards_page | Most Followed Whales & Top Demo Portfolios | pro | ❌ Missing | none | unit:e2e |
| community_threads | Realtime community threads per wallet | pro | ❌ Missing | none | unit:e2e |
| tests_unit_key_paths | Unit tests for key components and hooks | ui.v2 | ✅ Built | src/__tests__/advanced-whale-predictions.test.ts, src/__tests__/e2e-user-flows.test.tsx, tests/hub2.spec.ts | unit:e2e |
| tests_integration_msq | MSW integration tests | ui.v2 | 🟡 Partial | tests/hub2.spec.ts, tests/notification-system.test.js | unit:e2e |
| tests_e2e_core | E2E tests for core user flows | ui.v2 | ✅ Built | cypress/e2e/portfolio.cy.ts, cypress/e2e/predictions-scenarios.cy.ts, node_modules/playwright/LICENSE | unit:e2e |
| tests_a11y_axe | Accessibility tests with axe-core | ui.v2 | ✅ Built | tests/hub2.spec.ts, tests/notification-system.test.js, cypress/e2e/portfolio.cy.ts | unit:e2e |
| tests_perf_k6 | Performance tests with k6 | ui.v2 | ✅ Built | tests/perf/home_smoke.js | unit:e2e |
| ci_audit_gate | CI workflow running feature audit | ui.v2 | ✅ Built | .github/workflows/drift-monitoring.yml, .github/workflows/enhanced-lite.yml | unit:e2e |
| flags_registry | Feature flags defined and documented | ui.v2 | ✅ Built | config/gating.json, apps/web/src/config/gating.json | unit:e2e |
