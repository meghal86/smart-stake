# Implementation Plan

## Overview

This implementation plan breaks down the HarvestPro feature into discrete, manageable tasks that build incrementally. Each task references specific requirements from requirements.md and follows the design specified in design.md.

## System Architecture Rule (Critical)

**All business logic MUST run inside Supabase Edge Functions. The UI (Next.js) MUST remain 100% presentation-only.**

### Backend Architecture Decision

All HarvestPro business logic will be implemented inside Supabase Edge Functions. The UI will interact exclusively through typed API endpoints and contain ZERO business logic.

**Reason**: This architecture keeps HarvestPro deterministic, secure, auditable, and aligned with tax-compliance requirements. It prevents logic duplication, reduces bugs, improves maintainability, and positions the system correctly for future OaaS (Opportunities-as-a-Service) model.

### Scope of Edge Functions (Backend Only)

The following logic MUST execute inside Supabase Edge Functions:

**Core Engines**:
- FIFO cost basis engine
- PnL calculation engine
- Harvest opportunity detection engine
- Eligibility filtering (loss threshold, liquidity, Guardian, gas, tradability)
- Net benefit calculation engine
- Risk classification (Guardian integration)

**Blockchain & CEX Integrations**:
- Wallet sync & transaction fetch
- CEX API sync
- Gas estimation
- Slippage estimation
- Tradability checks
- Multi-chain routing logic

**API Endpoints**:
- `/api/harvest/opportunities`
- `/api/harvest/sessions`
- `/api/harvest/prices`
- `/api/harvest/sessions/:id/export`
- `/api/harvest/sessions/:id/proof`

**Execution Logic**:
- Action Engine integration
- Session workflow machine
- Error handling
- Retry logic
- Logging

**Export & Proof**:
- CSV generation
- Proof-of-Harvest hash
- PDF Export (if added later)

**Notifications**:
- Push + email notification engines
- Year-end tax reminders

**Security**:
- Zod validation
- Credential encryption
- RLS-compatible auth
- Rate limiting
- CORS
- CSP headers

**Caching**:
- Redis caching for: Opportunities, Prices, Gas, Guardian, CEX results

**Monitoring & Metrics**:
- Performance telemetry
- Error telemetry
- Business metrics
- Alerting rules

### UI Responsibilities (Presentation Only)

The UI MUST ONLY:
- Fetch data via API
- Display cards, modals, and screens
- Trigger harvest sessions
- Sign transactions if needed
- Handle user interactions and navigation
- Manage local UI state (filters, modals, etc.)

The UI MUST NEVER contain:
- Tax logic
- PnL logic
- Guardian logic
- Risk logic
- Transaction logic
- FIFO calculations
- Eligibility filtering
- Net benefit calculations

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

- [ ] 1.4 Establish lint and type-check standards (Code Quality) 🔴
  - Configure ESLint with strict rules for HarvestPro code
  - Enable TypeScript strict mode for all HarvestPro files
  - Set up pre-commit hooks to run lint checks (optional)
  - Configure CI/CD to fail on lint errors
  - Document linting standards in .kiro/specs/harvestpro/LINTING_STANDARDS.md
  - Run `npm run lint` and fix any existing errors in HarvestPro code
  - Run `npm run type-check` and fix any TypeScript errors
  - Ensure no `any` types are used (use `unknown` with type guards instead)
  - Verify all functions have explicit return types
  - Test that build succeeds without warnings
  - **Dependencies**: Task 1 (project structure)
  - **Blocks**: All subsequent tasks (establishes code quality baseline)
  - _Requirements: All (Code Quality)_

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

- [x] 12. Implement filtering system
  - Create FilterState management with Zustand
  - Implement filter chip interactions
  - Create filter application logic
  - Implement URL query parameter persistence
  - Add localStorage caching
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 12.1 Write property test for filter application
  - **Property 8: Filter Application**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [x] 13. Create /api/harvest/opportunities endpoint 🔴
  - Implement GET endpoint with query parameters
  - Add rate limiting (60 req/hour)
  - Implement cursor pagination
  - Add response caching (5 minutes)
  - Return opportunities with summary stats
  - **Dependencies**: Tasks 2, 3, 4, 5, 6, 7, 9 (all core logic)
  - **Parallel with**: Task 10 (UI)
  - **Blocks**: Task 11 (opportunity cards)
  - _Requirements: 2.5, 3.1-3.5, 4.1-4.5_

- [x] 13.1 Write integration tests for opportunities API
  - Test query parameter validation
  - Test rate limiting
  - Test pagination
  - Test caching behavior
  - _Requirements: 2.5, 3.1-3.5_

- [x] 14. Implement HarvestDetailModal component
  - Create modal layout (full-screen mobile, centered desktop)
  - Implement summary section
  - Create Guardian warning banner (conditional)
  - Implement step-by-step actions list
  - Create cost table
  - Implement net benefit summary
  - Add Execute Harvest button
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 15. Create harvest session management
  - Implement /api/harvest/sessions POST endpoint (create session)
  - Implement /api/harvest/sessions/:id GET endpoint
  - Implement /api/harvest/sessions/:id PATCH endpoint (update)
  - Implement /api/harvest/sessions/:id DELETE endpoint (cancel)
  - Add session state management
  - _Requirements: 8.1_

- [x] 15.1 Write property test for session state transitions
  - **Property 9: Session State Transitions**
  - **Validates: Requirements 8.1**

- [x] 16. Implement Action Engine stub/simulator 🔴
  - Create mock Action Engine for development
  - Simulate on-chain transaction flows
  - Simulate failure states
  - Simulate slippage scenarios
  - Simulate retry flows
  - **Dependencies**: Task 1 (data models)
  - **Blocks**: Task 16.1 (real integration)
  - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [x] 16.1 Implement Action Engine integration for on-chain execution 🔴
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

- [x] 17. Implement CEX manual execution flow
  - Create CEX instruction panel
  - Generate platform-specific instructions
  - Implement step completion tracking
  - Handle manual confirmation
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 18. Create success screen
  - Implement achievement-style success card
  - Add confetti animation
  - Display total losses harvested
  - Create Download CSV button
  - Create View Proof button
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 19. Implement CSV export generation
  - Create Form 8949 CSV generation logic
  - Implement /api/harvest/sessions/:id/export endpoint
  - Format monetary values with 2 decimal places
  - Include all required columns
  - Ensure compatibility with Excel, Google Sheets, Numbers
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 19.1 Write property test for CSV export
  - **Property 10: CSV Export Completeness**
  - **Property 11: Monetary Value Formatting**
  - **Validates: Requirements 11.2, 11.3, 11.4**

- [x] 20. Implement Proof-of-Harvest page
  - Create proof page layout
  - Display summary statistics
  - Show executed steps list with transaction hashes
  - Generate and display cryptographic proof hash
  - Add export buttons (PDF, share link)
  - Implement /api/harvest/sessions/:id/proof endpoint
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 20.1 Write property test for proof hash generation
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

- [ ] 28. Checkpoint - Ensure all tests pass and no lint errors
  - Run `npm run lint` to check for ESLint errors
  - Run `npm run lint:fix` to auto-fix fixable issues
  - Fix any remaining ESLint errors or warnings manually
  - Run `npm run type-check` or `tsc --noEmit` to check for TypeScript errors
  - Fix all TypeScript type errors
  - Ensure strict mode compliance (no `any` types, explicit return types)
  - Verify all imports are valid and used
  - Ensure all tests pass
  - Ask the user if questions arise

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

- [ ] 30.5 Apply 10/10 UI Polish (Apple/Stripe-level refinement)
  - **Summary Card Premium Enhancements**:
    - Add "Projected Savings This Year" chip
    - Add iconography enhancements (loss icon, tax icon, shield, gas gauge)
    - Implement Guardian-style pulse ring around Gas Efficiency metric
  - **Opportunity Cards Premium Polish**:
    - Add microline dividers between metrics in MetricStrip
    - Enhance card hover lift effect (already improved in quick wins)
  - **Metric Strip Hunter Consistency**:
    - Ensure full-width metric strip bar matches Hunter opportunities
    - Add icons for each metric (already present, verify consistency)
  - **Category Tag & Risk Chip Premium Upgrade**:
    - Add tiny ⚠️ icon for HIGH RISK chips
    - Add green ring glow for Recommended badges
    - Add tiny venue icons for CEX/DEX tags
  - **Mobile Sticky Footer Bar** (CRITICAL for UX):
    - Create sticky footer showing "Total Net Benefit: $X,XXX → Harvest All"
    - Only visible when scrolling through long opportunity lists
    - Increases conversion, trust, and clarity
  - **Harvest Preview Micro-Modal**:
    - Create quick preview modal (1 tap) before full detail modal
    - Shows: Loss, Benefit, Gas, Slippage, Risk, CTA: "View full plan →"
    - Improves user confidence before commitment
  - **Color Semantics System**:
    - High Benefit = teal
    - Safe = green
    - High Risk = red
    - CEX Holdings = purple
    - Illiquid = orange
  - **Microtextures & Soft Shadows** (Apple-grade polish):
    - Add subtle interior shadows
    - Implement soft corner smoothing
    - Apply high-end color token refinements
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_
  - _Note: This task implements the 10/10 UI polish plan to achieve Apple/Stripe/Robinhood-level visual quality_

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

- [ ] 34. Final checkpoint - Ensure all tests pass and no lint errors
  - Run `npm run lint` to check for ESLint errors
  - Run `npm run lint:fix` to auto-fix fixable issues
  - Fix any remaining ESLint errors or warnings manually
  - Run `npm run type-check` or `tsc --noEmit` to check for TypeScript errors
  - Fix all TypeScript type errors
  - Ensure strict mode compliance (no `any` types, explicit return types)
  - Verify all imports are valid and used
  - Ensure all tests pass
  - Ask the user if questions arise

- [ ] 35. Documentation and deployment preparation
  - Run `npm run lint` and ensure no errors or warnings
  - Run `npm run type-check` and ensure no TypeScript errors
  - Verify build succeeds: `npm run build`
  - Write API documentation
  - Create user guide
  - Document deployment process
  - Create runbooks for alerts
  - Prepare rollout plan
  - _Requirements: All_

---

## v2 Institutional Features (Requirements 21-25)

- [ ] 36. Implement v3 database schema migration
  - Run migration script `20250201000001_harvestpro_v3_schema.sql`
  - Extend harvest_sessions with v3 fields (awaiting_approval status, execution_strategy, economic_substance_status, custody_transaction_id)
  - Extend harvest_user_settings with institutional guardrails (max_daily_loss_usd, max_single_trade_notional_usd, max_slippage_bps, require_private_rpc)
  - Add custody configuration fields (custody_provider, custody_vault_id)
  - Create approval_requests table for maker/checker workflows
  - Create sanctions_screening_logs table for KYT/AML audit trail
  - Verify all indexes and RLS policies are created
  - Test migration rollback
  - **Dependencies**: Task 1 (v1 schema)
  - **Blocks**: All v2/v3 tasks
  - _Requirements: 21-29_

- [ ] 37. Implement MEV protection and private RPC routing (v2)
  - Create PrivateRPCService with Flashbots, Eden, and Bloxroute adapters
  - Implement sendViaPrivateRPC function with provider selection
  - Add private RPC configuration to user settings
  - Implement fallback logic when private RPC unavailable
  - Record privateRpcUsed and provider name on ExecutionStep
  - Add error handling for private RPC failures
  - Implement blocking behavior when requirePrivateRpc is enabled
  - **Dependencies**: Task 36 (v3 schema), Task 16.1 (Action Engine)
  - _Requirements: 21.1, 21.2, 21.3, 21.4_

- [ ]* 37.1 Write property test for private RPC routing
  - **Property 21: Private RPC Routing**
  - **Property 22: Private RPC Recording**
  - **Validates: Requirements 21.1, 21.2, 21.3**

- [ ] 38. Implement economic substance validation (v2)
  - Create EconomicSubstanceService
  - Implement evaluateEconomicSubstance function
  - Add immediate repurchase pattern detection
  - Add harvest frequency analysis
  - Add round-trip pattern detection
  - Add proxy asset usage scoring
  - Implement PASS/WARN/BLOCKED status determination
  - Add economic substance check to session creation
  - Display economic substance warnings in UI
  - Include economic substance status in Proof-of-Harvest
  - **Dependencies**: Task 36 (v3 schema), Task 15 (session management)
  - _Requirements: 22.1, 22.2, 22.3, 22.4_

- [ ]* 38.1 Write property test for economic substance evaluation
  - **Property 23: Economic Substance Evaluation**
  - **Property 24: Economic Substance Blocking**
  - **Validates: Requirements 22.1, 22.2**

- [ ] 39. Implement proxy asset selection (v2)
  - Create ProxyAssetService with asset mappings
  - Define proxy asset mappings (ETH→stETH/rETH/cbETH, BTC→WBTC, etc.)
  - Implement getProxyAssets function
  - Add proxy asset option to HarvestDetailModal
  - Implement addProxyAssetStep function
  - Update execution plan with proxy asset steps
  - Record proxyAssetSymbol on HarvestOpportunity
  - Include proxy assets in Proof-of-Harvest exports
  - **Dependencies**: Task 36 (v3 schema), Task 14 (detail modal)
  - _Requirements: 23.1, 23.2, 23.3, 23.4_

- [ ]* 39.1 Write property test for proxy asset recording
  - **Property 25: Proxy Asset Recording**
  - **Validates: Requirements 23.4**

- [ ] 40. Implement institutional guardrails (v2)
  - Create GuardrailService
  - Implement checkGuardrails function
  - Add daily loss limit enforcement (maxDailyRealizedLossUsd)
  - Add position size limit enforcement (maxSingleTradeNotionalUsd)
  - Add slippage limit enforcement (maxSlippageBps)
  - Implement order splitting for oversized positions
  - Display guardrail violations in UI with clear explanations
  - Add guardrail configuration to user settings UI
  - **Dependencies**: Task 36 (v3 schema), Task 15 (session management), Task 23 (settings)
  - _Requirements: 24.1, 24.2, 24.3, 24.4_

- [ ]* 40.1 Write property tests for guardrail enforcement
  - **Property 26: Guardrail Enforcement - Daily Loss**
  - **Property 27: Guardrail Enforcement - Position Size**
  - **Property 28: Guardrail Enforcement - Slippage**
  - **Validates: Requirements 24.1, 24.2, 24.3**

- [ ] 41. Enhance Proof-of-Harvest for institutional audit (v2)
  - Extend proof payload with economic substance status
  - Add MEV protection mode and provider details to proof
  - Include user settings snapshot (guardrails, tax rate, jurisdiction)
  - Add proxy asset details to proof
  - Enhance proof hash to include all v2 fields
  - Update Proof-of-Harvest page UI to display v2 fields
  - Add institutional-grade PDF export option
  - **Dependencies**: Task 36 (v3 schema), Task 20 (proof page), Tasks 37-40 (v2 features)
  - _Requirements: 25.1, 25.2, 25.3, 25.4_

- [ ]* 41.1 Write property test for enhanced proof payload
  - **Property 29: Enhanced Proof Payload**
  - **Validates: Requirements 25.1**

- [ ] 42. Checkpoint - Ensure all v2 tests pass and no lint errors
  - Run `npm run lint` and fix any errors
  - Run `npm run type-check` and fix any TypeScript errors
  - Ensure all v2 property tests pass
  - Verify MEV protection works correctly
  - Verify economic substance validation works correctly
  - Verify proxy assets work correctly
  - Verify guardrails work correctly
  - Verify enhanced proof includes all v2 fields
  - Ask the user if questions arise

---

## v3 Enterprise Features (Requirements 26-29)

- [ ] 43. Implement custody integration (v3)
  - Create CustodyService with Fireblocks and Copper adapters
  - Implement submitToCustody function
  - Add Fireblocks SDK integration
  - Add Copper API integration
  - Implement custody transaction submission
  - Add custody status polling (pollCustodyStatus)
  - Update session with custody_transaction_id
  - Add custody configuration to user settings UI
  - Display custody status in execution flow UI
  - Handle custody approval/rejection flows
  - **Dependencies**: Task 36 (v3 schema), Task 16.1 (Action Engine)
  - _Requirements: 26.1, 26.2, 26.3, 26.4_

- [ ]* 43.1 Write property tests for custody integration
  - **Property 30: Custody Integration - No Private Keys**
  - **Property 31: Custody Transaction Routing**
  - **Validates: Requirements 26.1, 26.2, 26.3**

- [ ] 44. Implement maker/checker governance (v3)
  - Create ApprovalService
  - Implement requestApproval function
  - Add approval threshold checking to session creation
  - Implement awaiting_approval status transition
  - Create approval notification system (email + push)
  - Implement approveSession function with signature verification
  - Implement rejectSession function
  - Create approval request UI for approvers
  - Add approval history to session details
  - Display approval status in dashboard
  - **Dependencies**: Task 36 (v3 schema), Task 15 (session management)
  - _Requirements: 27.1, 27.2, 27.3, 27.4_

- [ ]* 44.1 Write property tests for maker/checker workflows
  - **Property 32: Approval Threshold Transition**
  - **Property 33: Approval Requirement**
  - **Validates: Requirements 27.1, 27.3**

- [ ] 45. Implement sanctions screening (v3)
  - Create SanctionsScreeningService
  - Integrate with OFAC sanctions list API
  - Integrate with TRM Labs or Chainalysis API
  - Implement screenSwapRoute function
  - Add pool contract address screening
  - Add pool participant screening
  - Implement findCompliantRoute function
  - Log all screening results to sanctions_screening_logs table
  - Display compliance warnings in UI
  - Block non-compliant routes
  - Add sanctions screening toggle to user settings
  - **Dependencies**: Task 36 (v3 schema), Task 9.2 (slippage/routing)
  - _Requirements: 28.1, 28.2, 28.3, 28.4_

- [ ]* 45.1 Write property tests for sanctions screening
  - **Property 34: Sanctions Screening**
  - **Property 35: Sanctioned Route Blocking**
  - **Validates: Requirements 28.1, 28.2**

- [ ] 46. Implement TWAP order routing (v3)
  - Create TWAPExecutionService
  - Implement executeTWAP function
  - Add order slicing logic (parent → child orders)
  - Implement interval-based execution
  - Add price floor monitoring (limitPriceFloor)
  - Implement dynamic pause on price floor breach
  - Calculate average execution price
  - Add TWAP configuration to user settings UI
  - Display TWAP progress in execution flow UI
  - Show child order status and prices
  - **Dependencies**: Task 36 (v3 schema), Task 16.1 (Action Engine)
  - _Requirements: 29.1, 29.2, 29.3, 29.4_

- [ ]* 46.1 Write property tests for TWAP execution
  - **Property 36: TWAP Order Slicing**
  - **Property 37: TWAP Safety Floor**
  - **Validates: Requirements 29.2, 29.3**

- [ ] 47. Update UI for v2/v3 features
  - Add MEV protection toggle to settings
  - Add economic substance status display to session details
  - Add proxy asset selector to detail modal
  - Add guardrail configuration to settings UI
  - Add custody provider configuration to settings
  - Add approval workflow UI for approvers
  - Add sanctions screening status to execution flow
  - Add TWAP configuration to execution options
  - Display v2/v3 fields in Proof-of-Harvest page
  - **Dependencies**: Tasks 37-46 (all v2/v3 features)
  - _Requirements: 21-29_

- [ ] 48. Checkpoint - Ensure all v3 tests pass and no lint errors
  - Run `npm run lint` and fix any errors
  - Run `npm run type-check` and fix any TypeScript errors
  - Ensure all v3 property tests pass
  - Verify custody integration works correctly
  - Verify maker/checker workflows work correctly
  - Verify sanctions screening works correctly
  - Verify TWAP execution works correctly
  - Verify all v2/v3 UI updates work correctly
  - Ask the user if questions arise

- [ ] 49. v2/v3 Documentation and deployment
  - Document v2 institutional features
  - Document v3 enterprise features
  - Create custody integration guide
  - Create maker/checker workflow guide
  - Create sanctions screening guide
  - Create TWAP execution guide
  - Update API documentation with v2/v3 endpoints
  - Create v2/v3 migration guide
  - Prepare v2/v3 rollout plan
  - _Requirements: 21-29_
