# Implementation Plan: Unified Portfolio System

## Overview

This implementation plan transforms the Unified Portfolio System design into actionable coding tasks. The approach emphasizes reuse-first architecture, mobile-first responsive design, and enterprise-grade security with property-based testing for correctness guarantees.

## Tasks

- [ ] 1. Set up project structure and database schema
  - Create database migration for unified portfolio tables
  - Set up TypeScript shared types and interfaces
  - Configure property-based testing framework (fast-check)
  - _Requirements: 1.1, 14.4, 14.5_

- [ ] 1.1 Create database migration for portfolio tables (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search existing migrations in supabase/migrations/ for portfolio_snapshots, approval_risks, intent_plans, execution_steps, simulation_receipts tables
  - **IF EXISTS**: Extend existing tables with ALTER TABLE statements instead of CREATE TABLE
  - **IF NOT EXISTS**: Implement portfolio_snapshots table with scope_key constraints
  - **IF NOT EXISTS**: Implement approval_risks table with chain_id INTEGER NOT NULL (no DEFAULT)
  - **IF NOT EXISTS**: Implement intent_plans table with wallet_scope JSON validation
  - **IF NOT EXISTS**: Implement execution_steps table with chain_id INTEGER NOT NULL (EIP-155)
  - **IF NOT EXISTS**: Implement simulation_receipts table with expiry constraints (expires_at > created_at)
  - **IF NOT EXISTS**: Implement audit_events table with (id, user_id, wallet_scope, event_type, severity, plan_id, step_id, metadata jsonb, created_at)
  - **IF NOT EXISTS**: Implement notification_prefs table with (user_id, dnd, caps, severity_threshold, channels)
  - **IF NOT EXISTS**: Implement notification_events table with (type, severity, scope_key, deep_link, payload)
  - **IF NOT EXISTS**: Implement notification_deliveries table with (event_id, channel, status, sent_at, read_at)
  - **BEFORE CREATING**: Check existing RLS policies and only add missing ones
  - Split normalization triggers (portfolio_snapshots vs approval_risks separate functions)
  - Add risk_score range constraints: 0 <= risk_score <= 1 for approval_risks and portfolio_snapshots
  - Add "latest snapshot" query index: idx_portfolio_snapshots_latest (user_id, scope_mode, scope_key, updated_at DESC)
  - Add audit events index: idx_audit_events_user_created (user_id, created_at DESC) and idx_audit_events_plan (plan_id)
  - Add immutability trigger for intent_plans.steps
  - Create separate CREATE INDEX statements (PostgreSQL-compliant)
  - _Requirements: 1.1, 7.5, 7.6, 8.4, 11.4, 14.4_

- [ ] 1.2 Write integration test for database schema constraints
  - Test scope_key determinism via migrate → insert → assert fail/pass
  - Test database triggers and constraints enforcement
  - Test RLS policies and constraint violations
  - **Validates: Requirements 1.1**

- [ ] 1.3 Set up shared TypeScript types (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/types/** for existing ScopeMode, WalletScope, ExecutionStep, IntentPlan, ApprovalRisk types
  - **IF EXISTS**: Extend existing types with additional properties instead of creating new ones
  - **IF NOT EXISTS**: Define ScopeMode and WalletScope types
  - **IF NOT EXISTS**: Define ExecutionStep interface with chainId: number
  - **IF NOT EXISTS**: Define IntentPlan, ApprovalRisk, and RecommendedAction interfaces
  - **IF NOT EXISTS**: Define FreshnessConfidence and PolicyEngineConfig interfaces
  - _Requirements: 1.1, 6.8_

- [ ] 1.4 Write property test for shared type validation
  - **Property S2: Type safety enforcement**
  - **Validates: Requirements 1.1**

- [ ] 2. Implement reuse audit gate and component discovery
  - Search existing portfolio components and hooks
  - Document reuse decisions for each new component
  - Extend existing components where possible
  - _Requirements: 3.1, 3.2_

- [ ] 2.1 Audit existing portfolio infrastructure (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/components/portfolio/** for reusable components
  - **BEFORE CREATING**: Search src/hooks/** for portfolio-related hooks
  - **BEFORE CREATING**: Search src/services/** for portfolio services
  - **IF EXISTS**: Document existing components and their capabilities
  - **IF NOT EXISTS**: Document gaps that require new components
  - Document findings and reuse opportunities (≤3 bullets per search)
  - _Requirements: 3.1_

- [ ] 2.2 Extend PortfolioHub component (or create if missing) (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/components/portfolio/** for existing PortfolioHub, Portfolio, or similar components
  - **BEFORE CREATING**: Search src/hooks/** for useUserAddresses, useWalletSwitching hooks
  - **IF EXISTS**: Extend existing PortfolioHub with wallet switching and freshness display
  - **IF NOT EXISTS**: Implement wallet switching with freshness display
  - **IF NOT EXISTS**: Add mobile-first responsive layout
  - **IF EXISTS**: Integrate with existing useUserAddresses hook, **IF NOT EXISTS**: create new hook
  - _Requirements: 3.1, 3.2, 10.1_

- [ ] 2.3 Write property test for wallet switching
  - **Property S3: Wallet switch data isolation**
  - **Validates: Requirements 12.5**

- [ ] 2.4 Create Portfolio Route Shell (or extend existing) (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/pages/** and src/app/** for existing /portfolio routes
  - **BEFORE CREATING**: Search src/components/** for existing route shells or layout components
  - **IF EXISTS**: Extend existing /portfolio route with 3-tab spine (Overview, Positions, Audit)
  - **IF NOT EXISTS**: Implement /portfolio route (alias to existing if needed)
  - **IF NOT EXISTS**: Add persistent AI Hub and 3-tab spine (Overview, Positions, Audit)
  - Show always-visible elements: net worth, 24h delta, freshness, trust/risk summary, alerts count
  - Ensure mobile-first responsive layout with single-column for <480px
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [ ] 2.5 Create Overview Tab component (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/components/portfolio/** for existing NetWorthCard, ActionsFeed, RiskSummary components
  - **BEFORE CREATING**: Search src/components/** for existing activity timeline or summary components
  - **IF EXISTS**: Extend existing components with freshness + confidence display
  - **IF NOT EXISTS**: Implement Net Worth Card with freshness + confidence display
  - **IF NOT EXISTS**: Add Recommended Actions Feed (top 5 with progressive disclosure)
  - **IF NOT EXISTS**: Create Risk Summary Card with severity indicators
  - **IF NOT EXISTS**: Add Recent Activity Timeline with AI tags
  - _Requirements: 1.1, 4.1, 10.1_

- [ ] 2.6 Create Positions Tab component (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/components/portfolio/** for existing AssetBreakdown, ChainDistribution, ProtocolExposure components
  - **BEFORE CREATING**: Search src/components/** for existing performance metrics or breakdown components
  - **IF EXISTS**: Extend existing components with progressive disclosure patterns
  - **IF NOT EXISTS**: Implement Asset Breakdown with progressive disclosure
  - **IF NOT EXISTS**: Add Chain Distribution visualization
  - **IF NOT EXISTS**: Create Protocol Exposure breakdown
  - **IF NOT EXISTS**: Add Performance Metrics display
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 2.7 Create Audit Tab component (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/components/portfolio/** for existing TransactionTimeline, ApprovalsList, GraphVisualizer components
  - **BEFORE CREATING**: Search src/components/** for existing audit, timeline, or transaction components
  - **IF EXISTS**: Extend existing components with AI tags and VAR + severity display
  - **IF NOT EXISTS**: Implement Transaction Timeline with AI tags
  - **IF NOT EXISTS**: Add Approvals Risk List with VAR + severity display
  - **IF NOT EXISTS**: Add Graph-Lite Visualizer for transaction flows (90-day placeholder - not blocking v1)
  - **IF NOT EXISTS**: Add Planned vs Executed Receipts section
  - _Requirements: 8.1, 8.4_

- [ ] 2.8 Implement Design System Compliance enforcement
  - Add ESLint rule to prevent custom CSS patterns that bypass shared component library
  - Add Playwright checks for design token compliance (CSS class allowlist)
  - Prevent inline styles and ensure only approved design tokens are used
  - **Property 4: Design System Compliance**
  - **Validates: Requirements 3.1, 3.2**

- [ ] 3. Implement portfolio snapshot API and caching
  - Create /api/portfolio/snapshot endpoint
  - Implement risk-aware caching with severity-based TTL
  - Add freshness and confidence metadata
  - _Requirements: 1.6, 1.8, 10.5_

- [ ] 3.1 Create portfolio snapshot API endpoint (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/app/api/portfolio/** and src/pages/api/portfolio/** for existing snapshot endpoints
  - **BEFORE CREATING**: Search src/services/** for existing portfolio aggregation services
  - **IF EXISTS**: Extend existing endpoint with scope parameter and freshness metadata
  - **IF NOT EXISTS**: Implement GET /api/v1/portfolio/snapshot with scope parameter
  - **IF NOT EXISTS**: Aggregate data from Guardian, Hunter, and Harvest systems
  - **IF NOT EXISTS**: Return PortfolioSnapshot with freshness metadata
  - **IF NOT EXISTS**: Include { apiVersion: "v1" } in response
  - Handle degraded mode when confidence < threshold
  - _Requirements: 1.6, 1.8, 1.9, 15.3_

- [ ] 3.2 Write property test for data aggregation
  - **Property 1: Data Aggregation Completeness**
  - **Validates: Requirements 1.6**

- [ ] 3.3 Write property test for metadata consistency
  - **Property 2: Metadata Attachment Consistency**
  - **Validates: Risk-aware metadata tracking policy**

- [ ] 3.4 Implement risk-aware caching system (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/lib/** for existing caching systems, TTL calculators, or cache invalidation logic
  - **BEFORE CREATING**: Search src/services/** for existing cache warming or risk-based caching
  - **IF EXISTS**: Extend existing caching with severity-based TTL ranges
  - **IF NOT EXISTS**: Create calculateCacheTTL function with severity-based ranges
  - **IF NOT EXISTS**: Implement cache invalidation on new transactions
  - **IF NOT EXISTS**: Add cache warming for critical data
  - _Requirements: 10.5, 10.6_

- [ ] 3.5 Write property test for cache TTL calculation
  - **Property 25: Risk-Aware Caching**
  - **Validates: Requirements 10.5**

- [ ] 4. Implement recommended actions feed
  - Create RecommendedActionsFeed component
  - Implement action scoring algorithm
  - Add progressive disclosure (top 5 with "View all")
  - _Requirements: 4.1, 4.2, 4.3, 10.1_

- [ ] 4.1 Create RecommendedActionsFeed component (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/components/portfolio/** for existing ActionsFeed, RecommendedActions, or similar components
  - **BEFORE CREATING**: Search src/components/** for existing card layouts with severity indicators
  - **IF EXISTS**: Extend existing component with mobile-first layout and action severity indicators
  - **IF NOT EXISTS**: Implement mobile-first card layout
  - **IF NOT EXISTS**: Add action severity indicators and impact previews
  - Integrate with existing portfolio components
  - Add loading states and error handling
  - _Requirements: 4.1, 4.4, 10.1, 10.2_

- [ ] 4.2 Write property test for action scoring
  - **Property 5: Action Score Calculation**
  - **Validates: Requirements 4.2**

- [ ] 4.3 Write property test for action generation bounds
  - **Property 6: Action Generation Bounds**
  - **Validates: Requirements 4.1, 4.3**

- [ ] 4.4 Implement GET /api/v1/portfolio/actions endpoint (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/app/api/portfolio/** and src/pages/api/portfolio/** for existing actions endpoints
  - **BEFORE CREATING**: Search src/services/** for existing action scoring or prioritization services
  - **IF EXISTS**: Extend existing endpoint with ActionScore prioritization and cursor pagination
  - **IF NOT EXISTS**: Return prioritized actions by ActionScore
  - **IF NOT EXISTS**: Include all minimum action types (approval hygiene, de-risk, rewards, routing)
  - **IF NOT EXISTS**: Add cursor pagination for large result sets
  - **IF NOT EXISTS**: Include { apiVersion: "v1" } in response
  - _Requirements: 4.1, 4.3, 15.3_

- [ ] 4.5 Write property test for data structure completeness
  - **Property 7: Data Structure Completeness**
  - **Validates: Requirements 4.4, 4.5, 6.4**

- [ ] 5. Implement approval risk system
  - Create ApprovalRiskCard component
  - Implement approval risk scoring algorithm
  - Add GET /api/portfolio/approvals endpoint
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 5.1 Create ApprovalRiskCard component (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/components/portfolio/** for existing ApprovalRisk, RiskCard, or approval-related components
  - **BEFORE CREATING**: Search src/components/** for existing risk display or severity indicator components
  - **IF EXISTS**: Extend existing component with VAR display and Permit2 detection indicators
  - **IF NOT EXISTS**: Display risk score, severity, and value at risk
  - **IF NOT EXISTS**: Show contributing factors and risk reasons
  - **IF NOT EXISTS**: Add Permit2 detection indicators
  - **IF NOT EXISTS**: Implement progressive disclosure for risk details
  - _Requirements: 5.1, 5.6, 5.7, 5.9_

- [ ] 5.2 Write property test for approval risk scoring
  - **Property 8: Approval Risk Scoring Completeness**
  - **Validates: Requirements 5.1, 5.2**

- [ ] 5.3 Write property test for risk classification
  - **Property 9: Risk Classification Consistency**
  - **Validates: Requirements 5.3, 5.5, 5.8**

- [ ] 5.4 Implement approval risk scoring engine (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/lib/** for existing risk scoring, approval analysis, or security scoring engines
  - **BEFORE CREATING**: Search src/services/** for existing Guardian integration or risk calculation services
  - **IF EXISTS**: Extend existing engine with infinite approval rules and proxy contract detection
  - **IF NOT EXISTS**: Calculate risk scores incorporating all required factors
  - **IF NOT EXISTS**: Apply special rules for infinite approvals and proxy contracts
  - **IF NOT EXISTS**: Generate risk reasons and contributing factors
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [ ] 5.5 Write property test for risk explainability
  - **Property 10: Risk Explainability**
  - **Validates: Requirements 5.6, 5.7**

- [ ] 5.6 Write property test for Permit2 detection
  - **Property 11: Permit2 Detection and Scoring**
  - **Validates: Requirements 5.9**

- [ ] 5.7 Create GET /api/v1/portfolio/approvals endpoint (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/app/api/portfolio/** and src/pages/api/portfolio/** for existing approvals endpoints
  - **BEFORE CREATING**: Search src/services/** for existing approval data aggregation services
  - **IF EXISTS**: Extend existing endpoint with ApprovalRisk objects and cursor pagination
  - **IF NOT EXISTS**: Return paginated list of ApprovalRisk objects
  - **IF NOT EXISTS**: Include risk score, severity, VAR, and contributing factors
  - **IF NOT EXISTS**: Support filtering by severity and chain
  - **IF NOT EXISTS**: Add cursor pagination for large datasets
  - **IF NOT EXISTS**: Include { apiVersion: "v1" } in response
  - Include freshness and confidence metadata
  - _Requirements: 5.1, 5.2, 5.3, 15.3_

- [ ] 5.8 Create missing API endpoints for Requirement 15 compliance (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/app/api/portfolio/** for existing positions, audit, graph-lite, notification-prefs, plans endpoints
  - **IF NOT EXISTS**: Implement GET /api/v1/portfolio/positions?scope=...&wallet=...&cursor=...
  - **IF NOT EXISTS**: Implement GET /api/v1/portfolio/audit/events?scope=...&cursor=...
  - **IF NOT EXISTS**: Implement GET /api/v1/portfolio/graph-lite?scope=...&wallet=...&tx=... (lite v0 placeholder)
  - **IF NOT EXISTS**: Implement GET/PUT /api/v1/portfolio/notification-prefs
  - **IF NOT EXISTS**: Implement GET /api/v1/portfolio/plans/:id (read plan + steps canonical state)
  - **IF NOT EXISTS**: Implement GET /api/v1/portfolio/plans/:id/steps (canonical state)
  - All endpoints MUST include { apiVersion: "v1" } in response
  - _Requirements: 15.2, 15.3_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement intent planning and execution system
  - Create IntentPlanExecutor component
  - Implement POST /api/portfolio/plan endpoint
  - Add simulation and policy checking
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 7.1 Create IntentPlanExecutor component (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/components/portfolio/** for existing IntentPlan, PlanExecutor, or execution-related components
  - **BEFORE CREATING**: Search src/components/** for existing step indicators, status displays, or execution UI components
  - **IF EXISTS**: Extend existing component with policy check results and simulation displays
  - **IF NOT EXISTS**: Display intent plan steps with status indicators
  - **IF NOT EXISTS**: Show policy check results and violations
  - **IF NOT EXISTS**: Add simulation results and pre-flight cards
  - **IF NOT EXISTS**: Implement partial execution UI for mixed results
  - _Requirements: 6.1, 6.4, 6.5_

- [ ] 7.2 Write property test for intent plan generation
  - **Property 12: Intent Plan Generation**
  - **Validates: Requirements 6.1, 6.2**

- [ ] 7.3 Write property test for safety blocking
  - **Property 13: Safety Blocking Rules**
  - **Validates: Requirements 6.3**

- [ ] 7.4 Implement intent planning API endpoints (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/app/api/portfolio/** and src/pages/api/portfolio/** for existing plan, simulate, execute endpoints
  - **BEFORE CREATING**: Search src/services/** for existing intent planning, simulation, or execution services
  - **IF EXISTS**: Extend existing endpoints with idempotency key enforcement
  - **IF NOT EXISTS**: Create POST /api/v1/portfolio/plan for plan creation
  - **IF NOT EXISTS**: Create POST /api/v1/portfolio/plan/:id/simulate for simulation
  - **IF NOT EXISTS**: Create POST /api/v1/portfolio/plan/:id/execute for execution
  - **IF NOT EXISTS**: Add idempotency key enforcement
  - **IF NOT EXISTS**: Include { apiVersion: "v1" } in all responses
  - _Requirements: 6.1, 6.2, 7.5, 7.6, 15.3_

- [ ] 7.5 Write property test for partial execution safety
  - **Property 14: Partial Execution Safety**
  - **Validates: Requirements 6.5**

- [ ] 7.6 Write property test for payload verification
  - **Property 15: Payload Verification Integrity**
  - **Validates: Requirements 6.6, 6.7**

- [ ] 8. Implement Policy Engine v0
  - Create PolicyEngineConfig interface
  - Implement policy checking logic
  - Add user-configurable policy settings
  - _Requirements: 6.8_

- [ ] 8.1 Implement Policy Engine v0 core logic (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/lib/** for existing policy engines, rule engines, or validation systems
  - **BEFORE CREATING**: Search src/services/** for existing policy checking or configuration services
  - **IF EXISTS**: Extend existing engine with portfolio-specific policies (max_gas_usd, block_new_contracts_days)
  - **IF NOT EXISTS**: Enforce max_gas_usd, block_new_contracts_days policies
  - **IF NOT EXISTS**: Block infinite approvals to unknown spenders
  - **IF NOT EXISTS**: Require simulation for high-value transactions
  - **IF NOT EXISTS**: Add confidence threshold enforcement
  - _Requirements: 6.8, 1.8, 1.9_

- [ ] 8.2 Write property test for policy enforcement
  - **Property 16: Policy Engine Enforcement**
  - **Validates: Requirements 6.8**

- [ ] 8.3 Write property test for confidence threshold
  - **Property 3: Confidence Threshold Enforcement**
  - **Validates: Requirements 1.8, 1.9**

- [ ] 9. Implement execution state management
  - Create execution step tracking
  - Add state transition validation
  - Implement audit trail logging
  - _Requirements: 7.1, 8.4_

- [ ] 9.1 Implement execution step state management (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/lib/** for existing state management, step tracking, or execution monitoring systems
  - **BEFORE CREATING**: Search src/services/** for existing transaction tracking or state transition services
  - **IF EXISTS**: Extend existing system with portfolio execution step states and validation
  - **IF NOT EXISTS**: Track step progression through valid states
  - **IF NOT EXISTS**: Prevent invalid state transitions
  - **IF NOT EXISTS**: Add transaction hash and block number tracking
  - _Requirements: 7.1_

- [ ] 9.2 Write property test for state transitions
  - **Property 17: State Transition Validity**
  - **Validates: Requirements 7.1**

- [ ] 9.3 Write property test for idempotency
  - **Property 18: Idempotency Key Enforcement**
  - **Validates: Requirements 7.5, 7.6**

- [ ] 9.4 Implement audit trail system (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/lib/** for existing audit logging, event tracking, or trail systems
  - **BEFORE CREATING**: Search src/services/** for existing audit services or event querying capabilities
  - **IF EXISTS**: Extend existing system with portfolio plan creation and execution events
  - **IF NOT EXISTS**: Log all plan creation and execution events
  - **IF NOT EXISTS**: Maintain planned vs executed receipts
  - **IF NOT EXISTS**: Add audit event querying capabilities
  - _Requirements: 8.4_

- [ ] 9.5 Write property test for audit completeness
  - **Property 19: Audit Trail Completeness**
  - **Validates: Requirements 8.4**

- [ ] 9.6 Implement audit events system for Requirement 8 compliance (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/lib/** for existing audit event emission, logging, or event tracking systems
  - **BEFORE CREATING**: Search src/services/** for existing audit services or event management
  - **IF EXISTS**: Extend existing system with portfolio-specific audit events
  - **IF NOT EXISTS**: Emit audit events for: payload mismatch block, policy block, simulation failover, override unsafe, MEV mode used, cross-wallet guard triggers
  - **IF NOT EXISTS**: Create audit event querying service with filtering by user_id, plan_id, severity
  - **IF NOT EXISTS**: Add audit event API endpoints (GET /api/v1/portfolio/audit/events)
  - _Requirements: 8.1, 8.4, 15.2_

- [ ] 9.7 Write property test for audit event emission
  - **Property 32: Audit Event Emission Completeness**
  - **Validates: Requirements 8.1, 8.4**

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement Copilot SSE integration
  - Create Copilot chat drawer component
  - Implement SSE streaming with wallet scope validation
  - Add action card and intent plan handling
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 11.1 Create Copilot chat drawer component (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/components/** for existing chat, drawer, or SSE streaming components
  - **BEFORE CREATING**: Search src/hooks/** for existing SSE connection management or chat hooks
  - **IF EXISTS**: Extend existing chat component with wallet scope validation and action card handling
  - **IF NOT EXISTS**: Implement persistent chat interface
  - **IF NOT EXISTS**: Add SSE connection management
  - **IF NOT EXISTS**: Handle wallet switching with stream reset
  - **IF NOT EXISTS**: Display action cards and intent plans
  - _Requirements: 9.1, 9.6, 9.7_

- [ ] 11.2 Write property test for Copilot output validation
  - **Property 20: Copilot Output Validation**
  - **Validates: Requirements 9.1, 9.6, 9.7**

- [ ] 11.3 Write property test for action verb handling
  - **Property 21: Copilot Action Verb Handling**
  - **Validates: Requirements 9.2**

- [ ] 11.4 Implement GET /api/v1/portfolio/copilot/stream endpoint (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/app/api/** and src/pages/api/** for existing SSE endpoints or copilot integrations
  - **BEFORE CREATING**: Search src/services/** for existing copilot services or response validation
  - **IF EXISTS**: Extend existing endpoint with wallet scope parameter and taxonomy validation
  - **IF NOT EXISTS**: Create SSE endpoint with wallet scope parameter
  - **IF NOT EXISTS**: Validate Copilot responses against taxonomy
  - **IF NOT EXISTS**: Prevent automation promises in responses
  - **IF NOT EXISTS**: Add capability notices for system limitations
  - **IF NOT EXISTS**: Include { apiVersion: "v1" } in response headers
  - _Requirements: 9.1, 9.2, 9.3, 15.3_

- [ ] 11.5 Write property test for automation promise prevention
  - **Property 22: Copilot Automation Promise Prevention**
  - **Validates: Requirements 9.3**

- [ ] 12. Implement progressive disclosure UI patterns
  - Add "View all" functionality to all sections
  - Implement mobile-first responsive layouts
  - Add loading, empty, error, and degraded states
  - _Requirements: 10.1, 10.2_

- [ ] 12.1 Implement progressive disclosure components (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/components/ux/** for existing progressive disclosure, expandable, or "View all" components
  - **BEFORE CREATING**: Search src/components/** for existing skeleton loading states or error boundary components
  - **IF EXISTS**: Extend existing components with "View all" buttons and top 5 item display
  - **IF NOT EXISTS**: Create expandable sections with "View all" buttons
  - **IF NOT EXISTS**: Show top 5 items by default across all feeds
  - **IF NOT EXISTS**: Add skeleton loading states
  - **IF NOT EXISTS**: Implement error boundaries with fallback UI
  - _Requirements: 10.1, 10.2_

- [ ] 12.2 Write property test for progressive disclosure
  - **Property 23: Progressive Disclosure Consistency**
  - **Validates: Requirements 10.1, 10.2**

- [ ] 12.3 Optimize API performance (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/lib/** for existing cursor pagination, database indexing, or cache prefetching utilities
  - **BEFORE CREATING**: Search existing database migrations for portfolio-related indexes
  - **IF EXISTS**: Extend existing pagination and caching systems for portfolio endpoints
  - **IF NOT EXISTS**: Implement cursor pagination for large datasets
  - **IF NOT EXISTS**: Add database indexes for common queries
  - **IF NOT EXISTS**: Optimize cache hit rates with prefetching
  - _Requirements: 10.3, 10.4_

- [ ] 12.4 Write property test for performance requirements
  - **Property 24: Performance Requirements**
  - **Validates: Requirements 10.3, 10.4**

- [ ] 13. Implement notification system
  - Add exposure-aware notification aggregation
  - Implement user settings for DND and severity thresholds
  - Add deep linking and delivery tracking
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 13.1 Create notification management system (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/lib/** for existing notification systems, aggregation logic, or user preference management
  - **BEFORE CREATING**: Search src/services/** for existing notification services or delivery tracking
  - **IF EXISTS**: Extend existing system with exposure-aware aggregation and portfolio-specific settings
  - **IF NOT EXISTS**: Implement exposure-aware aggregation logic
  - **IF NOT EXISTS**: Add user preference controls (DND, caps, severity)
  - **IF NOT EXISTS**: Create deep link generation for notifications
  - **IF NOT EXISTS**: Track delivery and read status
  - **IF NOT EXISTS**: Enforce daily quotas per user
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 13.2 Write property test for notification management
  - **Property 27: Notification Management**
  - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

- [ ] 13.3 Implement MEV-protected sending mode toggle for Requirement 14.3 compliance (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/lib/** for existing MEV protection, private RPC routing, or transaction sending systems
  - **BEFORE CREATING**: Search src/services/** for existing transaction execution or MEV protection services
  - **IF EXISTS**: Extend existing system with mevProtectedMode configuration and capability detection
  - **IF NOT EXISTS**: Add policy/config flag mevProtectedMode: "off" | "auto" | "force"
  - **IF NOT EXISTS**: Enable only on chains/providers where supported; otherwise emit CapabilityNotice
  - **IF NOT EXISTS**: Ensure plan receipts log whether protected mode was requested/used
  - **IF NOT EXISTS**: Add UI toggle for MEV protection preference
  - _Requirements: 14.3_

- [ ] 13.4 Write property test for MEV protection mode
  - **Property 33: MEV Protection Mode Enforcement**
  - **Validates: Requirements 14.3**

- [ ] 14. Implement multi-wallet aggregation
  - Add cross-wallet net worth calculation
  - Implement unified risk scoring
  - Create exposure breakdown views
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 14.1 Create multi-wallet aggregation engine (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/lib/** for existing multi-wallet, aggregation, or cross-wallet calculation engines
  - **BEFORE CREATING**: Search src/services/** for existing wallet aggregation or unified scoring services
  - **IF EXISTS**: Extend existing engine with unified risk scoring and exposure distribution tracking
  - **IF NOT EXISTS**: Aggregate net worth across all user wallets
  - **IF NOT EXISTS**: Calculate unified risk scores
  - **IF NOT EXISTS**: Track exposure distributions by chain/protocol
  - **IF NOT EXISTS**: Identify top movers across portfolios
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 14.2 Write property test for multi-wallet aggregation
  - **Property 28: Multi-Wallet Aggregation**
  - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Implement security and privacy features
  - Add wallet-user linkage encryption
  - Implement structured logging with data minimization
  - Add safety mode warnings for risky operations
  - _Requirements: 12.5, 14.1, 14.2, 14.4, 14.5_

- [ ] 16.1 Implement security and privacy controls (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/lib/** for existing encryption, logging, or safety mode systems
  - **BEFORE CREATING**: Search src/services/** for existing security controls or privacy protection services
  - **IF EXISTS**: Extend existing systems with wallet-user linkage encryption and portfolio-specific safety warnings
  - **IF NOT EXISTS**: Encrypt wallet-user linkage data
  - **IF NOT EXISTS**: Add structured logging with PII minimization
  - **IF NOT EXISTS**: Implement safety mode warnings for new contracts
  - **IF NOT EXISTS**: Require simulation for all spend/approve operations
  - _Requirements: 12.5, 14.1, 14.2, 14.4, 14.5_

- [ ] 16.2 Write property test for security protection
  - **Property 29: Security and Privacy Protection**
  - **Validates: Requirements 12.5, 14.4, 14.5**

- [ ] 16.3 Write property test for safety mode
  - **Property 30: Safety Mode Enforcement**
  - **Validates: Requirements 14.1**

- [ ] 16.4 Write property test for mandatory simulation
  - **Property 31: Mandatory Simulation Coverage**
  - **Validates: Requirements 14.2**

- [ ] 16.5 Implement concrete stress and adversarial test suites for Requirement 13 compliance
  - Create Playwright test suites for functional stress scenarios:
    - rapid tab + wallet switching for 60s (no stale wallet leakage)
    - wallet switch mid SSE stream (SSE closed, state cleared, restarted)
    - 5k rows virtualization stability
    - degraded provider mode (simulation down) gating
    - deep-link entry guard + phishing warning
  - Create k6 performance test scenarios:
    - snapshot cached p95 < 600ms
    - snapshot cold p95 < 1200ms
    - copilot first token p95 < 1500ms (measure from SSE open → first event)
  - Create adversarial security test suite:
    - prompt injection via token name / tx metadata (Copilot must not deviate from taxonomy)
    - simulation vs execution mismatch (TX differs from simulated plan - blocked + audit logged)
    - deep-link / QR entry points ("Open wallet & sign" link - warning + verification gate)
    - proxy upgradeable contract interaction (flagged with reason + severity)
  - _Requirements: 13.1, 13.2, 13.3_

- [ ] 16.6 Write property test for stress test coverage
  - **Property 34: Stress Test Coverage Completeness**
  - **Validates: Requirements 13.1, 13.2, 13.3**

- [ ] 17. Implement cache invalidation system
  - Add transaction-based cache invalidation
  - Implement wallet switch cache clearing
  - Add policy change invalidation triggers
  - _Requirements: 10.6_

- [ ] 17.1 Create cache invalidation engine (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/lib/** for existing cache invalidation, transaction detection, or refresh scheduling systems
  - **BEFORE CREATING**: Search src/services/** for existing cache management or invalidation trigger services
  - **IF EXISTS**: Extend existing engine with portfolio-specific invalidation triggers (wallet switching, policy changes)
  - **IF NOT EXISTS**: Detect new transactions and invalidate relevant caches
  - **IF NOT EXISTS**: Clear user-specific caches on wallet switching
  - **IF NOT EXISTS**: Invalidate simulation results on policy changes
  - **IF NOT EXISTS**: Add scheduled refresh for time-sensitive data
  - _Requirements: 10.6_

- [ ] 17.2 Write property test for cache invalidation
  - **Property 26: Cache Invalidation Triggers**
  - **Validates: Requirements 10.6**

- [ ] 17.3 Implement telemetry wiring to MetricsService for Requirement 16 compliance (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/services/MetricsService.ts for existing event tracking, correlation IDs, or portfolio metrics
  - **IF EXISTS**: Extend MetricsService with portfolio event taxonomy and correlation ID support
  - **IF NOT EXISTS**: Add event taxonomy with correlation_id per user session
  - **IF NOT EXISTS**: Add plan_id and step_id propagation throughout execution flow
  - **IF NOT EXISTS**: Track SSE reconnect rates and connection stability
  - **IF NOT EXISTS**: Implement required events: portfolio_snapshot_loaded, action_card_viewed, plan_created, plan_simulated, plan_execute_clicked, step_submitted/confirmed/failed, override_unsafe_clicked
  - **IF NOT EXISTS**: Add MTTS (Mean Time To Safety) calculation for critical issues
  - **IF NOT EXISTS**: Track prevented loss $ at p50/p95 percentiles
  - **IF NOT EXISTS**: Monitor fix rate and false positive rate
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 17.4 Write property test for telemetry completeness
  - **Property 35: Telemetry Event Completeness**
  - **Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5**

- [ ] 18. Integration and wiring
  - Connect all components to API endpoints
  - Wire up SSE connections and event handling
  - Integrate with existing AlphaWhale services
  - _Requirements: 1.6, 9.1_

- [ ] 18.1 Wire portfolio components together (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/components/portfolio/** for existing component integration or wiring patterns
  - **BEFORE CREATING**: Search src/hooks/** for existing API integration hooks
  - **IF EXISTS**: Extend existing integrations with new portfolio API endpoints
  - **IF NOT EXISTS**: Connect PortfolioHub to snapshot API
  - **IF NOT EXISTS**: Wire RecommendedActionsFeed to actions API
  - **IF NOT EXISTS**: Connect ApprovalRiskCard to approvals API
  - **IF NOT EXISTS**: Integrate IntentPlanExecutor with planning APIs
  - _Requirements: 1.6_

- [ ] 18.2 Integrate with existing AlphaWhale services (REUSE-FIRST CHECK REQUIRED)
  - **BEFORE CREATING**: Search src/services/** for existing Guardian, Hunter, Harvest service integrations
  - **BEFORE CREATING**: Search src/lib/** for existing blockchain data source connections or API clients
  - **IF EXISTS**: Extend existing service integrations with portfolio-specific data requirements
  - **IF NOT EXISTS**: Connect to Guardian API for security scores
  - **IF NOT EXISTS**: Integrate with Hunter API for opportunities
  - **IF NOT EXISTS**: Wire up Harvest API for tax optimization
  - **IF NOT EXISTS**: Add blockchain data source connections
  - _Requirements: 1.6_

- [ ] 18.3 Write integration tests for service connections
  - Test Guardian, Hunter, and Harvest integrations
  - Verify data flow between components
  - Test error handling and fallback behavior
  - _Requirements: 1.6_

- [ ] 19. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation from the start
- Each property test references specific requirements for traceability
- Checkpoints ensure incremental validation and user feedback
- Property tests use fast-check with minimum 100 iterations (1000 for critical financial operations)
- Unit tests validate specific examples, edge cases, and integration points
- The implementation follows a reuse-first approach to prevent duplication
- All components are designed mobile-first with progressive enhancement
- Enterprise-grade security is enforced through simulation, policy checking, and audit trails

## Testing Strategy

**Dual Testing Approach:**
- **Property-based tests**: Validate universal correctness properties across all inputs using fast-check
- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Integration tests**: Test API endpoints, database constraints, and service connections
- **E2E tests**: Validate complete user journeys with Playwright
- **Load tests**: Performance testing with k6 for scalability validation

**Property Test Configuration:**
- Standard properties: 100 iterations minimum
- Critical financial properties: 1000 iterations
- Tag format: `Feature: unified-portfolio, Property {number}: {property_text}`
- Each property test must reference design document properties

**Integration Test Focus:**
- Database constraint validation (scope_key rules, risk_score bounds, expiry constraints)
- API endpoint behavior under various conditions
- Service integration reliability
- Cache invalidation triggers
- Multi-wallet data isolation

**Performance Testing with k6:**
- Load testing for API endpoints (p95 < 600ms cached, p95 < 1200ms cold)
- Stress testing for concurrent user scenarios
- Scalability testing for multi-wallet aggregation
- Memory usage profiling during extended sessions

**Test Organization:**
```
src/lib/portfolio/__tests__/
├── unit/
│   ├── components.test.ts
│   ├── api-integration.test.ts
│   └── user-flows.test.ts
├── integration/
│   ├── database-constraints.test.ts
│   ├── service-connections.test.ts
│   └── cache-invalidation.test.ts
├── properties/
│   ├── action-scoring.property.test.ts
│   ├── approval-risk.property.test.ts
│   ├── intent-planning.property.test.ts
│   └── simulation-verification.property.test.ts
└── performance/
    ├── api-load.k6.js
    ├── multi-wallet.k6.js
    └── concurrent-users.k6.js
```

This implementation plan provides a comprehensive roadmap for building the Unified Portfolio System with enterprise-grade security, performance, and correctness guarantees.