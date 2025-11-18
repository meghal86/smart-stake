# Implementation Plan

## Overview

This implementation plan breaks down the HarvestPro feature into discrete, manageable tasks that build incrementally. Each task references specific requirements from requirements.md and follows the design specified in design.md.

## Execution Strategy

### Critical Path
The critical path for HarvestPro implementation is:
1. Database Schema → 2. FIFO Engine → 3. Opportunity Detection → 5. Net Benefit Calculation → 13. Opportunities API → 10. Dashboard UI → 11. Opportunity Cards → 14. Detail Modal → 15. Session Management → 16. Execution Flow → 18. Success Screen

**Estimated Critical Path Duration:** 14-16 days (with new infrastructure tasks)

### Parallelization Opportunities
- **Phase 1 (Days 1-2)**: Tasks 1, 7, 8, 9 can run in parallel after schema is complete
- **Phase 2 (Days 3-5)**: Tasks 10, 12 (UI) can run in parallel with Tasks 13, 15 (API)
- **Phase 3 (Days 6-8)**: Tasks 19, 20, 21 can run in parallel
- **Phase 4 (Days 9-12)**: Tasks 22-27 (polish) can run in parallel

### Daily Execution Plan

**Day 1: Foundation & Infrastructure**
- Task 1: Database schema and data models (with strict TypeScript)
- Task 1.1: Database migration and seeder framework
- Task 1.2: Design token system (parallel)
- Task 1.3: FIFO property test

**Day 2: Core Calculation Engine**
- Task 2: FIFO cost basis calculation
- Task 2.1: PnL property test
- Task 3: Opportunity detection
- Task 3.1: Eligibility property test

**Day 3: Guardian & Risk System**
- Task 6: Guardian adapter layer (mock + real)
- Task 6.1: Risk classification system
- Task 5.1: Risk classification property test

**Day 4: Business Logic & Estimation Engines (Parallel)**
- Task 4: Eligibility filtering
- Task 4.1: Net benefit property test
- Task 5: Net benefit calculation
- Task 9.1: Gas estimation engine (parallel)
- Task 9.2: Slippage estimation engine (parallel)
- Task 9.3: Token tradability detection (parallel)

**Day 5: Data Integration & Multi-Chain (Parallel)**
- Task 7: Wallet connection layer
- Task 7.1: Encryption property test
- Task 8: CEX integration
- Task 8.1: Aggregation property test
- Task 9: Price oracle with failover
- Task 9.4: Multi-chain engine foundation

**Day 6: API Layer**
- Task 13: Opportunities API endpoint
- Task 13.1: API integration tests
- Task 15: Session management API
- Task 15.1: State transition property test

**Day 7: Core UI & UX (Parallel with API)**
- Task 10: Dashboard UI
- Task 10.1: Loading skeletons
- Task 10.2: Empty state screens
- Task 11: Opportunity cards
- Task 11.1: Card unit tests
- Task 12: Filtering system
- Task 12.1: Filter property test

**Day 8: Execution Flow**
- Task 14: Detail modal
- Task 16: Action Engine stub/simulator
- Task 16.1: Real Action Engine integration
- Task 17: CEX manual execution

**Day 9: Success & Export**
- Task 18: Success screen
- Task 19: CSV export
- Task 19.1: Export property tests
- Task 20: Proof-of-Harvest page
- Task 20.1: Hash property test

**Day 10: Notifications & Settings**
- Task 21: Notification system
- Task 21.1: Notification property test
- Task 23: User settings
- Task 23.1: Settings property test

**Day 11: Security & Error Handling**
- Task 22: Error handling
- Task 22.1: Global network error layer
- Task 24: Security measures
- Task 25: Caching layer

**Day 12: Quality & Accessibility**
- Task 27: Accessibility features
- Task 27.1: Accessibility E2E tests
- Task 29: Responsive design
- Task 29.1: Responsive E2E tests
- Task 30: Visual design consistency

**Day 13: Monitoring & Analytics**
- Task 26: Monitoring and observability
- Task 26.1: Product analytics instrumentation
- Task 26.2: Monitoring integration tests
- Task 33: Performance optimization
- Task 28: Checkpoint

**Day 14-15: Testing & Polish**
- Task 31: Feature flags with kill switch
- Task 32: End-to-end tests
- Task 34: Final checkpoint

**Day 16: Documentation & Deployment**
- Task 35: Documentation and deployment prep

## Task List

### Dependencies Legend
- 🔴 **Blocking**: Must complete before dependent tasks can start
- 🟡 **Parallel**: Can run concurrently with other tasks
- 🟢 **Independent**: No dependencies

- [x] 1. Set up project structure and core data models 🔴
  - Create database schema for harvest_lots, harvest_opportunities, harvest_sessions, execution_steps, harvest_user_settings, wallet_transactions, cex_accounts, and cex_trades tables
  - Set up database indexes for performance (including FTS index for token search)
  - Create TypeScript interfaces matching database schema
  - Set up Zod validation schemas
  - Enable TypeScript strict mode
  - Configure ESLint + Prettier
  - **Dependencies**: None (starting point)
  - **Blocks**: All other tasks
  - _Requirements: All data model requirements_

- [x] 1.1 Create database migration and seeder framework 🔴
  - Create migration scripts for schema
  - Create rollback scripts
  - Create seed data for sample wallet transactions
  - Create seed data for sample CEX transactions
  - Create seed data for sample price history
  - Create seed data for sample Guardian scores
  - **Dependencies**: Task 1 (schema)
  - **Blocks**: All development and testing tasks
  - _Requirements: All data model requirements_

- [x] 1.2 Set up design token system 🟡
  - Extract colors from Hunter/Guardian
  - Extract border radius, shadows, spacing
  - Extract typography tokens
  - Create component tokens (Chips, Cards, Buttons)
  - Set up CSS variables or Tailwind config
  - **Dependencies**: None
  - **Parallel with**: Task 1
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [x] 1.3 Write property test for FIFO cost basis calculation
  - **Property 1: FIFO Cost Basis Consistency**
  - **Validates: Requirements 2.1, 16.1**

- [x] 2. Implement FIFO cost basis calculation engine 🔴
  - Create transaction processing logic
  - Implement FIFO lot calculation algorithm
  - Handle buy, sell, transfer_in, transfer_out transaction types
  - Calculate remaining quantity for each lot
  - **Dependencies**: Task 1 (data models)
  - **Blocks**: Task 3 (opportunity detection)
  - _Requirements: 2.1, 16.1_

- [x] 2.1 Write property test for unrealized PnL calculation
  - **Property 2: Unrealized PnL Calculation Accuracy**
  - **Validates: Requirements 2.2**

- [x] 3. Implement harvest opportunity detection 🔴
  - Create lot evaluation logic
  - Calculate unrealized PnL for each lot
  - Calculate holding period
  - Determine long-term vs short-term classification
  - **Dependencies**: Task 2 (FIFO engine)
  - **Blocks**: Task 4 (eligibility filtering), Task 13 (API)
  - _Requirements: 2.2, 2.3, 2.4_

- [x] 3.1 Write property test for eligibility filtering
  - **Property 5: Eligibility Filter Composition**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

- [x] 4. Implement eligibility filtering system
  - Create eligibility check logic
  - Implement minimum loss threshold filter ($20)
  - Implement liquidity score filter
  - Implement Guardian score filter (>= 3)
  - Implement gas cost filter
  - Implement tradability filter
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4.1 Write property test for net benefit calculation
  - **Property 6: Net Benefit Calculation**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 5. Implement net benefit calculation
  - Calculate tax savings (loss * tax rate)
  - Integrate gas estimation
  - Integrate slippage estimation
  - Calculate trading fees
  - Compute net benefit
  - Classify as recommended/not recommended
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5.1 Write property test for risk classification
  - **Property 12: Risk Level Classification**
  - **Validates: Requirements 15.1, 15.2, 15.3, 15.4**

- [x] 6. Implement Guardian adapter layer 🔴
  - Implement Guardian mock service for development
  - Implement real adapter for Guardian API
  - Add fallback logic when Guardian is unavailable
  - Cache Guardian responses (1 hour TTL)
  - **Dependencies**: Task 1 (data models)
  - **Blocks**: Task 6.1 (risk classification)
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [x] 6.1 Implement risk classification system 🔴
  - Create Guardian score integration
  - Implement risk level classification (LOW/MEDIUM/HIGH)
  - Generate risk chips for UI
  - **Dependencies**: Task 6 (Guardian adapter)
  - **Blocks**: Task 4 (eligibility filtering), Task 11 (opportunity cards)
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 7. Create wallet connection and data sync layer 🟡
  - Implement wallet connection interface
  - Create transaction history fetching
  - Implement multi-wallet support
  - Create wallet data aggregation
  - **Dependencies**: Task 1 (data models)
  - **Parallel with**: Tasks 8, 9
  - **Blocks**: Task 13 (API)
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 7.1 Write property test for credential encryption
  - **Property 17: Credential Encryption**
  - **Validates: Requirements 1.4**

- [x] 8. Implement CEX integration layer
  - Create CEX account linking interface
  - Implement API credential encryption/decryption
  - Create trade history fetching for Binance, Coinbase, Kraken
  - Implement CEX data aggregation
  - _Requirements: 1.3, 1.4, 1.5_

- [x] 8.1 Write property test for data aggregation
  - **Property 18: Data Aggregation Completeness**
  - **Validates: Requirements 1.5**

- [x] 9. Create price oracle integration with failover 🟡
  - Implement CoinGecko API integration (primary)
  - Implement CoinMarketCap API integration (fallback)
  - Create internal cache as final fallback
  - Create price caching layer (1 minute TTL)
  - Implement /api/harvest/prices endpoint
  - Handle price fetching errors gracefully with fallback chain
  - **Dependencies**: Task 1 (data models)
  - **Parallel with**: Tasks 7, 8
  - **Blocks**: Task 3 (opportunity detection), Task 5 (net benefit)
  - _Requirements: 2.2, 4.1_

- [x] 9.1 Implement gas estimation engine 🟡
  - Use EIP-1559 fee logic
  - Implement retry logic on gas estimation failure
  - Support for multiple chains (Ethereum, Base, Arbitrum, etc.)
  - Cache gas estimates for 20-30 seconds
  - Handle gas estimation failure gracefully
  - **Dependencies**: Task 1 (data models)
  - **Parallel with**: Task 9
  - **Blocks**: Task 4 (eligibility filtering), Task 5 (net benefit)
  - _Requirements: 3.4, 4.2_

- [x] 9.2 Implement slippage estimation engine 🟡
  - Integrate DEX quote simulation (Uniswap / 1inch API)
  - Integrate pool depth checking
  - Cache slippage estimates
  - Add "unable to estimate slippage" error state
  - **Dependencies**: Task 1 (data models)
  - **Parallel with**: Task 9, 9.1
  - **Blocks**: Task 4 (eligibility filtering), Task 5 (net benefit)
  - _Requirements: 4.3_

- [x] 9.3 Implement token tradability detection 🟡
  - Check if token is supported on DEX
  - Verify liquidity exceeds minimum depth
  - Verify pool has minimum stable pair
  - Check if allowance approval is needed
  - **Dependencies**: Task 1 (data models)
  - **Parallel with**: Task 9, 9.1, 9.2
  - **Blocks**: Task 4 (eligibility filtering)
  - _Requirements: 3.5_

- [x] 9.4 Implement multi-chain engine foundation 🟡
  - Create RPC provider router (Alchemy/Infura/Quicknode)
  - Implement chain-specific gas estimation
  - Implement chain-specific swap routing
  - Implement chain-specific wallet connectors
  - **Dependencies**: Task 1 (data models)
  - **Parallel with**: Task 9, 9.1, 9.2, 9.3
  - **Blocks**: Task 7 (wallet connection), Task 16 (execution)
  - _Requirements: 1.2, 8.2_

- [x] 10. Implement HarvestPro dashboard UI 🟡
  - Create HarvestProHeader component (matching Hunter header)
  - Implement FilterChipRow component
  - Create HarvestSummaryCard component (Guardian-style)
  - Implement responsive layout (mobile/tablet/desktop)
  - **Dependencies**: Task 1 (data models), Task 1.2 (design tokens)
  - **Parallel with**: Task 13 (API)
  - **Blocks**: Task 11 (opportunity cards)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 18.1, 18.2, 19.1, 19.2, 19.3_

- [x] 10.1 Implement loading skeletons for all components 🟡
  - Create SummaryCard skeleton
  - Create OpportunityCard skeleton
  - Create DetailModal skeleton
  - Create ExecutionFlow skeleton
  - **Dependencies**: Task 10 (dashboard UI)
  - **Parallel with**: Task 11
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 10.2 Implement empty state screens 🟡
  - Create "No wallets connected" empty state
  - Create "No opportunities detected" empty state
  - Create "All opportunities harvested" empty state
  - Create "API failure fallback" empty state
  - **Dependencies**: Task 10 (dashboard UI)
  - **Parallel with**: Task 11
  - _Requirements: 14.1, 14.2_

- [x] 11. Implement HarvestOpportunityCard component
  - Create Hunter-style card layout
  - Implement CategoryTag component
  - Create RiskChip component
  - Implement RecommendationBadge component
  - Create MetricStrip component
  - Implement CTAButton component
  - Add save, share, report action buttons
  - _Requirements: 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 19.4, 19.5_

- [x] 11.1 Write unit tests for HarvestOpportunityCard
  - Test card rendering with various opportunity states
  - Test action button interactions
  - Test responsive behavior
  - _Requirements: 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

- [ ] 12. Implement filtering system
  - Create FilterState management with Zustand
  - Implement filter chip interactions
  - Create filter application logic
  - Implement URL query parameter persistence
  - Add localStorage caching
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 12.1 Write property test for filter application
  - **Property 8: Filter Application**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [ ] 13. Create /api/harvest/opportunities endpoint 🔴
  - Implement GET endpoint with query parameters
  - Add rate limiting (60 req/hour)
  - Implement cursor pagination
  - Add response caching (5 minutes)
  - Return opportunities with summary stats
  - **Dependencies**: Tasks 2, 3, 4, 5, 6, 7, 9 (all core logic)
  - **Parallel with**: Task 10 (UI)
  - **Blocks**: Task 11 (opportunity cards)
  - _Requirements: 2.5, 3.1-3.5, 4.1-4.5_

- [ ] 13.1 Write integration tests for opportunities API
  - Test query parameter validation
  - Test rate limiting
  - Test pagination
  - Test caching behavior
  - _Requirements: 2.5, 3.1-3.5_

- [ ] 14. Implement HarvestDetailModal component
  - Create modal layout (full-screen mobile, centered desktop)
  - Implement summary section
  - Create Guardian warning banner (conditional)
  - Implement step-by-step actions list
  - Create cost table
  - Implement net benefit summary
  - Add Execute Harvest button
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 15. Create harvest session management
  - Implement /api/harvest/sessions POST endpoint (create session)
  - Implement /api/harvest/sessions/:id GET endpoint
  - Implement /api/harvest/sessions/:id PATCH endpoint (update)
  - Implement /api/harvest/sessions/:id DELETE endpoint (cancel)
  - Add session state management
  - _Requirements: 8.1_

- [ ] 15.1 Write property test for session state transitions
  - **Property 9: Session State Transitions**
  - **Validates: Requirements 8.1**

- [ ] 16. Implement Action Engine stub/simulator 🔴
  - Create mock Action Engine for development
  - Simulate on-chain transaction flows
  - Simulate failure states
  - Simulate slippage scenarios
  - Simulate retry flows
  - **Dependencies**: Task 1 (data models)
  - **Blocks**: Task 16.1 (real integration)
  - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [ ] 16.1 Implement Action Engine integration for on-chain execution 🔴
  - Create transaction confirmation modal
  - Implement per-step execution tracking
  - Add spinner animation and loading states
  - Display per-step Guardian scores
  - Handle transaction success/failure
  - Create logs panel for advanced users
  - Integrate with real Action Engine
  - **Dependencies**: Task 16 (simulator), Task 15 (session management)
  - **Blocks**: Task 18 (success screen)
  - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [ ] 17. Implement CEX manual execution flow
  - Create CEX instruction panel
  - Generate platform-specific instructions
  - Implement step completion tracking
  - Handle manual confirmation
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 18. Create success screen
  - Implement achievement-style success card
  - Add confetti animation
  - Display total losses harvested
  - Create Download CSV button
  - Create View Proof button
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 19. Implement CSV export generation
  - Create Form 8949 CSV generation logic
  - Implement /api/harvest/sessions/:id/export endpoint
  - Format monetary values with 2 decimal places
  - Include all required columns
  - Ensure compatibility with Excel, Google Sheets, Numbers
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 19.1 Write property test for CSV export
  - **Property 10: CSV Export Completeness**
  - **Property 11: Monetary Value Formatting**
  - **Validates: Requirements 11.2, 11.3, 11.4**

- [ ] 20. Implement Proof-of-Harvest page
  - Create proof page layout
  - Display summary statistics
  - Show executed steps list with transaction hashes
  - Generate and display cryptographic proof hash
  - Add export buttons (PDF, share link)
  - Implement /api/harvest/sessions/:id/proof endpoint
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 20.1 Write property test for proof hash generation
  - **Property 16: Hash Function Determinism**
  - **Validates: Requirements 16.5**

- [ ] 21. Implement notification system
  - Create notification threshold checking
  - Implement push notification sending
  - Implement email notification sending
  - Add year-end reminder (Dec 1-31)
  - Include token symbol and net benefit in notifications
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 21.1 Write property test for notification threshold
  - **Property 20: Notification Threshold**
  - **Validates: Requirements 13.1, 13.2**

- [ ] 22. Implement error handling and error states
  - Create error boundary for HarvestPro screens
  - Implement no wallets connected state
  - Create CEX API error handling
  - Implement gas estimation failure handling
  - Create illiquid swap warning
  - Implement execution failure handling with retry
  - Add Guardian-style warning banners
  - **Dependencies**: Task 10 (dashboard UI)
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 22.1 Implement global network error handling layer 🟡
  - Add offline detection
  - Create retry banners
  - Implement auto-refresh retry logic
  - Add network status indicator
  - **Dependencies**: Task 22 (error handling)
  - **Parallel with**: Task 23
  - _Requirements: 14.2, 14.3_

- [ ] 23. Implement user settings management
  - Create settings UI component
  - Implement tax rate configuration
  - Add notification preferences
  - Create notification threshold setting
  - Implement settings persistence
  - Add settings application to calculations
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 23.1 Write property test for settings application
  - **Property 19: Settings Application**
  - **Validates: Requirements 20.2, 20.5**

- [ ] 24. Implement security measures
  - Add Content Security Policy headers
  - Implement rate limiting on all endpoints
  - Add input validation with Zod
  - Implement credential encryption
  - Add CORS configuration
  - _Requirements: 1.4, 17.3, 17.4_

- [ ] 25. Implement caching layer
  - Set up Redis/Upstash for server-side caching
  - Implement opportunity caching (5 min TTL)
  - Add Guardian score caching (1 hour TTL)
  - Implement price data caching (1 min TTL)
  - Configure React Query client-side caching
  - _Requirements: 2.5, 17.1_

- [ ] 26. Implement monitoring and observability
  - Set up performance metrics tracking
  - Add business metrics tracking
  - Implement error metrics tracking
  - Create alerting rules
  - Set up monitoring dashboards
  - **Dependencies**: All core tasks
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 26.1 Implement product analytics instrumentation 🟡
  - Track card viewed events
  - Track harvest started events
  - Track harvest completed events
  - Track filters used events
  - Track wallets connected events
  - Track CSV downloaded events
  - Track proof viewed events
  - **Dependencies**: Task 26 (monitoring)
  - **Parallel with**: Task 26.2
  - _Requirements: All_

- [ ] 26.2 Write integration tests for monitoring
  - Test metric collection
  - Test alert triggering
  - Verify dashboard data
  - _Requirements: 17.1, 17.2, 17.3_

- [ ] 27. Implement accessibility features
  - Add ARIA labels to all interactive elements
  - Implement keyboard navigation
  - Add focus management
  - Ensure AA contrast standards
  - Add screen reader support
  - Test with accessibility tools
  - _Requirements: 18.3, 18.4, 18.5_

- [ ] 27.1 Write E2E accessibility tests
  - Test keyboard navigation
  - Test screen reader compatibility
  - Verify ARIA labels
  - Check contrast ratios
  - _Requirements: 18.3, 18.4, 18.5_

- [ ] 28. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 29. Implement responsive design
  - Test mobile layout (≤768px)
  - Test tablet layout (768-1279px)
  - Test desktop layout (≥1280px)
  - Verify touch targets (min 44px)
  - Test all breakpoints
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 29.1 Write E2E responsive tests
  - Test mobile viewport
  - Test tablet viewport
  - Test desktop viewport
  - Verify layout shifts
  - _Requirements: 18.1, 18.2_

- [ ] 30. Implement visual design consistency
  - Match Hunter header styling
  - Match Guardian panel styling
  - Implement filter chip styling
  - Match metric strip styling
  - Implement button styling
  - Verify all design tokens match
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 31. Create feature flags with kill switch
  - Set up feature flag system (Vercel Edge Config or LaunchDarkly)
  - Add harvestProEnabled flag (master kill switch)
  - Add cexIntegrationEnabled flag
  - Add automatedExecutionEnabled flag
  - Add advancedFiltersEnabled flag
  - Configure rollout percentages
  - Implement safe rollout strategy
  - Add instant disable capability for emergencies
  - **Dependencies**: All core tasks
  - _Requirements: All_

- [ ] 32. Write end-to-end tests
  - Test complete harvest flow (wallet to success)
  - Test filter application and persistence
  - Test modal interactions
  - Test execution flow
  - Test CSV download
  - Test Proof-of-Harvest page
  - Test error scenarios
  - _Requirements: All_

- [ ] 33. Performance optimization
  - Optimize database queries
  - Implement code splitting
  - Add image optimization
  - Implement virtual scrolling for large lists
  - Add prefetching
  - Verify P95 scan time < 10s
  - Verify P95 API response < 200ms
  - _Requirements: 2.5, 17.1_

- [ ] 34. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 35. Documentation and deployment preparation
  - Write API documentation
  - Create user guide
  - Document deployment process
  - Create runbooks for alerts
  - Prepare rollout plan
  - _Requirements: All_
