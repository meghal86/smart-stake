# Enhanced HarvestPro Implementation Plan - App Store Version

## Overview

This implementation plan converts the Enhanced HarvestPro design into discrete coding tasks for a code-generation LLM. Each task builds incrementally toward a complete, App Store-compliant tax-loss harvesting system with property-based testing and Trinity-correct architecture.

## Programming Language

**TypeScript** - Selected for type safety, Next.js compatibility, and comprehensive tooling ecosystem.

## Tasks

### Phase 1: Foundation & Legal Compliance (Requirements 0-5)

- [ ] 1. Set up project structure and legal compliance framework
  - Create HarvestPro directory structure following harvestpro-stack.md guidelines
  - Implement legal disclaimer system with versioning (Requirement 0)
  - Set up Apple-safe UI copy constants and lint rules (Requirement 27)
  - Configure TypeScript strict mode and Zod validation schemas
  - _Requirements: 0.1-0.5, 27.1-27.5_

- [ ] 1b. Implement auth + wallet ownership binding (SOC-2-lite core)
  - Create user_profiles, user_wallets tables (wallet address, label, chain, created_at)
  - Enforce RLS: only auth.uid() can read their wallets
  - Implement "active wallet" selection integration (Hunter-style)
  - Ensure all harvest queries require wallet ownership validation
  - _Requirements: 1.4, 26.1-26.5_

- [ ] 1c. Define API boundary contract
  - Document which routes call Edge Functions vs direct DB reads
  - Add middleware: all /api/harvest/* requires authenticated session
  - Establish rule: all authoritative calculations through Edge Functions; Next API is orchestration + auth + file streaming only
  - _Requirements: Architecture compliance_

- [ ] 2. Implement core data models and database schema
  - [ ] 2.1 Create TypeScript interfaces for all data models
    - Define Lot, HarvestOpportunity, HarvestSession interfaces
    - Include enhanced fields for data quality and asset classification
    - _Requirements: 23.1-23.5_

  - [ ] 2.2 Write property test for data model consistency (MANDATORY)
    - **Property 15: Session Data Persistence**
    - **Validates: Requirements 16.4**

  - [ ] 2.3 Create Supabase database migration files
    - Implement all tables: harvest_lots, harvest_opportunities, harvest_sessions, harvest_execution_steps, harvest_session_opportunities, harvest_user_settings
    - Add RLS policies and performance indexes
    - Include asset event type classification fields
    - _Requirements: 1.1-1.5, 23.1-23.5_

  - [ ] 2.3b Add immutable events layer
    - harvest_events_raw (source payloads)
    - harvest_events_norm (typed events)
    - indexes by user_id, wallet, timestamp, token
    - _Requirements: 23.1-23.5_

  - [ ] 2.4 Write property test for database schema integrity (MANDATORY)
    - **Property 18: Data Aggregation Completeness**
    - **Validates: Requirements 1.5**

- [ ] 3. Implement event ingestion + normalization
  - [ ] 3.1 Implement wallet transaction ingestion
    - Create harvest-sync-wallets Edge Function
    - Ingest wallet txs → raw events table
    - _Requirements: 2.1, 16.1_

  - [ ] 3.2 Implement event classification system
    - Normalize raw events → typed events + classification flags
    - Handle crypto-specific events (airdrops, staking, bridging, transfers)
    - Set costBasisConfidence based on event type
    - _Requirements: 23.1-23.5_

  - [ ] 3.3 Build FIFO cost basis calculation engine
    - FIFO engine consumes normalized events → lots
    - Implement deterministic FIFO cost basis calculation
    - _Requirements: 2.1, 16.1_

  - [ ] 3.4 Write property test for FIFO consistency (MANDATORY)
    - **Property 1: FIFO Cost Basis Consistency**
    - **Validates: Requirements 2.1, 16.1**

  - [ ] 3.5 Implement unrealized PnL calculation
    - Calculate (current_price - acquired_price) * quantity
    - Handle edge cases and data quality flags
    - _Requirements: 2.2_

  - [ ] 3.6 Write property test for PnL accuracy (MANDATORY)
    - **Property 2: Unrealized PnL Calculation Accuracy**
    - **Validates: Requirements 2.2**

- [ ] 4. Create opportunity detection and eligibility filtering
  - [ ] 4.1 Add Guardian stub + cached score provider
    - Implement minimal Guardian score fetch for eligibility filtering
    - Add caching layer for Guardian scores
    - Handle API failures gracefully with fallbacks
    - _Requirements: 15.1-15.5_

  - [ ] 4.2 Implement eligibility filter engine
    - Create harvest-recompute-opportunities Edge Function
    - Apply loss threshold, liquidity, Guardian score, gas cost filters
    - _Requirements: 3.1-3.5_

  - [ ] 4.3 Write property test for eligibility filtering (MANDATORY)
    - **Property 3: Loss Threshold Filtering**
    - **Property 5: Eligibility Filter Composition**
    - **Validates: Requirements 3.1-3.5**

  - [ ] 4.4 Implement estimated tax impact calculation
    - Calculate estimated tax impact after costs (not "tax savings")
    - Use user's estimatedMarginalRate with safe defaults
    - Use "informational estimate" language throughout
    - _Requirements: 4.1-4.4, 25.1-25.5_

  - [ ] 4.5 Write property test for tax impact calculation (MANDATORY)
    - **Property 6: Net Tax Impact Calculation**
    - **Validates: Requirements 4.1-4.4**

- [ ] 5. Build Hunter-style dashboard UI
  - [ ] 5.1 Create HarvestPro dashboard page component
    - Implement responsive layout with header, filters, summary card
    - Follow Hunter design patterns and AlphaWhale styling
    - _Requirements: 5.1-5.5, 19.1-19.5_

  - [ ]* 5.2 Write unit tests for dashboard components
    - Test responsive behavior and accessibility
    - Test demo mode vs live mode switching
    - _Requirements: 18.1-18.5, 30.1-30.5_

  - [ ] 5.3 Create OpportunityCard component
    - Display opportunity details with risk indicators
    - Include "Prepare Harvest" button (Apple-safe language)
    - Show data quality flags and explanations
    - _Requirements: 5.5, 15.1-15.5, 23.5_

  - [ ]* 5.4 Write unit tests for OpportunityCard
    - Test all risk levels and data quality states
    - Test Apple-safe copy compliance
    - _Requirements: 15.1-15.5, 27.1-27.5_

- [ ] 6. Add immutable audit log table
  - harvest_audit_log (who/when/action/request_id)
  - log: session create/update/prepare/export/proof
  - never log secrets
  - _Requirements: 26.5_

### Phase 2: Transaction Preparation & Action Center Integration (Requirements 6-10)

- [ ] 7. Implement filtering and search functionality
  - [ ] 7.1 Create filter chip system
    - Implement All, High Benefit, Short-Term, Long-Term, Wallet, CEX filters
    - Ensure filter composition is order-independent
    - _Requirements: 6.1-6.5_

  - [ ] 7.2 Write property test for filter application (MANDATORY)
    - **Property 8: Filter Application**
    - **Validates: Requirements 6.1-6.5**

  - [ ] 7.3 Add search and sorting capabilities
    - Implement opportunity search and custom sorting
    - Avoid ranking solely by tax impact unless explicitly chosen
    - _Requirements: 25.5_

- [ ] 8. Build harvest opportunity modal and execution flow
  - [ ] 8.1 Create HarvestModal component
    - Display detailed opportunity information
    - Show Guardian warnings and risk context
    - Include "What assumptions were used?" panel
    - _Requirements: 7.1-7.5, 23.5_

  - [ ]* 8.2 Write unit tests for HarvestModal
    - Test modal behavior on mobile vs desktop
    - Test Guardian warning display logic
    - _Requirements: 7.1-7.5, 18.3-18.4_

  - [ ] 8.3 Implement ExecutionFlow component
    - Create step-by-step execution interface
    - Handle both on-chain and CEX manual instructions
    - _Requirements: 8.1-8.5, 9.1-9.5_

  - [ ]* 8.4 Write unit tests for ExecutionFlow
    - Test session state transitions
    - Test CEX instruction display
    - _Requirements: 8.1-8.5, 9.1-9.5_

- [ ] 9. Integrate with Action Center for transaction preparation
  - [ ] 9.1 Implement wallet handoff security system
    - Create WalletConnect v2 integration with allowlist
    - Add confirmation modal for wallet handoffs
    - Block unknown deep-link schemes
    - _Requirements: 22.1-22.5, 29.1-29.5_

  - [ ]* 9.2 Write unit tests for wallet handoff security
    - Test allowlist enforcement
    - Test confirmation modal behavior
    - _Requirements: 22.1-22.5, 29.1-29.5_

  - [ ] 9.3 Create session management system
    - Implement harvest session creation and state tracking
    - Store immutable logs of prepared vs confirmed actions
    - _Requirements: 8.1-8.5, 22.5_

  - [ ] 9.4 Write property test for session state transitions (MANDATORY)
    - **Property 9: Session State Transitions**
    - **Validates: Requirements 8.1-8.5**

- [ ] 10. Build success screen and completion flow
  - [ ] 10.1 Create success screen component
    - Display achievement-style card with confetti animation
    - Show total losses harvested and export buttons
    - Use Apple-safe language ("Activity recorded")
    - _Requirements: 10.1-10.5, 27.3_

  - [ ]* 10.2 Write unit tests for success screen
    - Test animation and button functionality
    - Test Apple-safe copy compliance
    - _Requirements: 10.1-10.5, 27.1-27.5_

### Phase 3: Export Generation & Proof System (Requirements 11-16)

- [ ] 11. Implement Form 8949-compatible CSV export system
  - [ ] 11.1 Create CSV export generation engine
    - Generate Form 8949-compatible CSV with all required fields
    - Include header metadata and data quality flags
    - Ensure Excel/Google Sheets/Numbers compatibility
    - _Requirements: 11.1-11.5, 21.1-21.5_

  - [ ] 11.2 Write property test for CSV export completeness (MANDATORY)
    - **Property 10: CSV Export Completeness**
    - **Validates: Requirements 11.2, 21.2**

  - [ ] 11.3 Add monetary value formatting
    - Format all values with exactly 2 decimal places
    - Handle edge cases and large numbers
    - _Requirements: 11.3_

  - [ ] 11.4 Write property test for monetary formatting (MANDATORY)
    - **Property 11: Monetary Value Formatting**
    - **Validates: Requirements 11.3**

  - [ ] 11.5 Add export validation step
    - After CSV generation, validate headers/row count/required fields
    - If validation fails, block download + show "export needs review" error
    - _Requirements: 21.1-21.5_

- [ ] 12. Build Proof-of-Activity integrity system
  - [ ] 12.1 Create cryptographic proof generation
    - Implement SHA-256 hash of canonical session data
    - Ensure deterministic serialization (sorted keys, fixed decimals)
    - _Requirements: 12.4, 24.1-24.3_

  - [ ] 12.2 Write property test for hash determinism (MANDATORY)
    - **Property 16: Hash Function Determinism**
    - **Validates: Requirements 16.5, 24.2**

  - [ ] 12.3 Create ProofOfActivity page component
    - Display integrity record with clear disclaimers
    - Show execution timeline and transaction hashes
    - Include PDF export functionality
    - _Requirements: 12.1-12.5, 24.4-24.5_

  - [ ]* 12.4 Write unit tests for ProofOfActivity component
    - Test PDF generation and sharing
    - Test disclaimer display
    - _Requirements: 12.1-12.5, 24.4-24.5_

- [ ] 13. Implement risk classification and Guardian integration
  - [ ] 13.1 Create risk level classification engine
    - Classify opportunities based on Guardian score and liquidity
    - Display colored risk chips (green/amber/red)
    - _Requirements: 15.1-15.5_

  - [ ] 13.2 Write property test for risk classification (MANDATORY)
    - **Property 12: Risk Level Classification**
    - **Validates: Requirements 15.1-15.4**

  - [ ] 13.3 Add full Guardian API integration
    - Fetch Guardian scores for all opportunities
    - Handle API failures gracefully with fallbacks
    - _Requirements: 15.1-15.5_

### Phase 4: User Settings & Notifications (Requirements 17-20)

- [ ] 14. Build user settings and preferences system
  - [ ] 14.1 Create user settings interface
    - Implement tax rate input with safe labeling ("Estimated marginal rate (optional)")
    - Add notification preferences and thresholds
    - Include risk tolerance and wallet preferences
    - _Requirements: 20.1-20.5, 25.1-25.3_

  - [ ] 14.2 Write property test for settings application (MANDATORY)
    - **Property 19: Settings Application**
    - **Validates: Requirements 20.2**

  - [ ] 14.3 Implement settings persistence and validation
    - Store settings in harvest_user_settings table
    - Validate input ranges and apply immediately
    - _Requirements: 20.5_

- [ ] 15. Create notification system
  - [ ] 15.1 Implement notification engine
    - Create harvest-notify Edge Function for scheduled notifications
    - Notification channel policy: v1 uses email + in-app; push optional after APNs setup
    - Include year-end reminders (Dec 1-31)
    - _Requirements: 13.1-13.5_

  - [ ] 15.2 Write property test for notification thresholds (MANDATORY)
    - **Property 20: Notification Threshold**
    - **Validates: Requirements 13.1, 20.3**

  - [ ] 15.3 Add notification click handling
    - Navigate directly to relevant opportunities
    - Track notification engagement
    - _Requirements: 13.5_

### Phase 5: Data Quality & Security (Requirements 21-30)

- [ ] 16. Implement enhanced data quality and transparency
  - [ ] 16.1 Create asset/event type classification system
    - Classify all lots by event type (trade, airdrop, staking, etc.)
    - Set costBasisConfidence based on data quality
    - Exclude low-confidence lots from recommendations
    - _Requirements: 23.1-23.5_

  - [ ] 16.2 Write property test for data quality classification (MANDATORY)
    - **Property 14: Export Data Completeness**
    - **Validates: Requirements 16.3**

  - [ ] 16.3 Add data quality UI indicators
    - Show explanation chips for data quality flags
    - Provide "What assumptions were used?" panels
    - _Requirements: 23.5_

- [ ] 17. Implement CEX credential security system
  - [ ] 17.1 Create secure credential storage
    - Encrypt all CEX credentials using KMS/Vault
    - Validate read-only permissions at connection time
    - Support instant credential revocation
    - _Requirements: 26.1-26.5_

  - [ ] 17.2 Write property test for credential encryption (MANDATORY)
    - **Property 17: Credential Encryption**
    - **Validates: Requirements 17.3, 26.3**

  - [ ] 17.3 Add credential audit logging
    - Log all credential create/update/delete events
    - Include who/when/what information
    - _Requirements: 26.5_

  - [ ] 17.4 Add secret-handling policies
    - Ensure secrets are never returned to client
    - Redact logs by default
    - Add tests: "no plaintext secrets in DB"
    - _Requirements: 26.1-26.5_

- [ ] 18. Build wash sale warning system
  - [ ] 18.1 Implement wash-sale risk flagging and warning copy
    - Detect "sell and immediately rebuy" patterns
    - Display warnings for regulatory uncertainty (not "violations")
    - Default re-entry suggestions to OFF
    - _Requirements: 28.1-28.5_

  - [ ]* 18.2 Write unit tests for wash sale warnings
    - Test warning display logic
    - Test re-entry suggestion defaults
    - _Requirements: 28.1-28.5_

  - [ ] 18.3 Add wash sale flags to exports
    - Include re-entry timing flags in CSV exports
    - Separate loss realization from portfolio strategy
    - _Requirements: 28.3-28.4_

- [ ] 19. Implement comprehensive demo mode
  - [ ] 19.1 Create demo data generation system
    - Generate realistic sample opportunities
    - Show clear "Demo Mode" badges on all data
    - Guarantee: everything works without wallet connection
    - _Requirements: 30.1-30.2_

  - [ ] 19.2 Add demo interaction handling
    - Can view opportunities
    - Can run "Prepare Harvest" but it produces "demo prepared steps"
    - Export is generated with DEMO_DATA=TRUE watermark
    - Proof hash is generated from demo canonical json
    - _Requirements: 30.3-30.5_

  - [ ]* 19.3 Write unit tests for demo mode
    - Test demo data consistency
    - Test badge display logic
    - _Requirements: 30.1-30.5_

### Phase 6: Performance & Error Handling (Requirements 17, 14)

- [ ] 20. Implement performance optimization and monitoring
  - [ ] 20.1 Add performance monitoring
    - Ensure P95 < 10s for opportunity scans
    - Ensure P95 < 2s for export generation
    - Add performance metrics and alerting
    - _Requirements: 17.1-17.2_

  - [ ] 20.2 Write property test for calculation determinism (MANDATORY)
    - **Property 13: Calculation Determinism**
    - **Validates: Requirements 16.2**

  - [ ] 20.3 Implement caching and optimization
    - Cache opportunity calculations with appropriate TTLs
    - Optimize database queries with proper indexes
    - _Requirements: 17.5_

- [ ] 21. Build comprehensive error handling system
  - [ ] 21.1 Create error classification and handling
    - Implement structured error responses for all error types
    - Add user-friendly error messages with resolution steps
    - Handle external service failures gracefully
    - _Requirements: 14.1-14.5_

  - [ ]* 21.2 Write unit tests for error handling
    - Test all error scenarios and recovery flows
    - Test error message clarity and actionability
    - _Requirements: 14.1-14.5_

  - [ ] 21.3 Add error monitoring and alerting
    - Implement Sentry integration for error tracking
    - Add structured logging for debugging
    - _Requirements: 17.4_

- [ ] 22. Add "Forbidden Copy" enforcement across the whole repo
  - [ ] 22.1 Centralize copy strings and add CI enforcement
    - Centralize copy strings in src/lib/copy/harvestpro.ts
    - Add a CI script that fails build if forbidden phrases appear (grep + allowlist)
    - Add unit test: "HarvestPro UI contains no forbidden phrases"
    - _Requirements: 27.1-27.5_

### Phase 7: Testing & Quality Assurance

- [ ] 23. Implement comprehensive property-based test suite
  - [ ] 23.1 Set up fast-check testing framework
    - Configure property-based testing with fast-check
    - Create smart generators for valid input spaces
    - Set minimum 100 iterations per test (1000 for critical calculations)
    - _Testing Strategy Requirements_

  - [ ] 23.2 Complete all remaining property tests
    - Implement any property tests not yet covered in previous phases
    - Ensure all 20 core properties are tested
    - Add proper test tagging for requirement traceability
    - _All Property Requirements 1-20_

- [ ] 24. Build integration and E2E test suite
  - [ ] 24.1 Create API integration tests
    - Test all Next.js API routes with real HTTP requests
    - Test Edge Function integration and error handling
    - _Integration Testing Requirements_

  - [ ]* 24.2 Write E2E tests with Playwright
    - Test complete harvest flow (demo and live modes)
    - Test mobile responsiveness and accessibility
    - Test error recovery scenarios
    - _E2E Testing Requirements_

- [ ] 25. Final checkpoint and deployment preparation
  - Ensure all tests pass and meet coverage requirements
  - Verify Apple App Store compliance (language, disclaimers, functionality)
  - Confirm Trinity-correct flow (Hunter → Action Center → Guardian)
  - Validate security measures (encryption, RLS, rate limiting)
  - Test demo mode functionality and wallet connection flow

## Notes

- Tasks marked with `*` are optional non-critical UI tests that can be skipped for faster MVP
- **MANDATORY tests**: Only correctness tests (FIFO, export, hash, eligibility, tax impact) are required for MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and integration points
- All tasks build incrementally toward a complete, App Store-compliant system
- Focus on Apple-safe language throughout: "Prepare Harvest", "Estimated tax impact", "Form 8949-compatible"

## Implementation Priority

**Phase 1-3**: Core MVP functionality (Requirements 0-16)
**Phase 4-5**: Enhanced features and compliance (Requirements 17-30)
**Phase 6-7**: Performance, testing, and quality assurance

This implementation plan ensures systematic development of a production-ready, App Store-compliant HarvestPro system with comprehensive testing and security measures.