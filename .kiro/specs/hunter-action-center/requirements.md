# Requirements Document: Hunter Action Center / Execute Quest

## Introduction

The Hunter Action Center is the execution engine for AlphaWhale's Hunter Screen that enables users to safely execute DeFi opportunities (quests, airdrops, staking) with Guardian-verified security, transaction simulation, and comprehensive audit trails. This system bridges the gap between opportunity discovery and actual on-chain execution.

**Version:** 1.0  
**Author:** AlphaWhale Product Team  
**Date:** December 2025

## Glossary

- **Action_Center**: The execution system that handles transaction preparation and execution
- **Quest_Execution**: A tracked session of executing a specific opportunity
- **Pre_Flight_Check**: Transaction simulation and validation before execution
- **Guardian_Approval**: Security verification required before execution
- **Execution_Step**: Individual transaction or action within a quest execution
- **Idempotency_Key**: Unique identifier preventing duplicate executions
- **Audit_Trail**: Immutable log of all execution activities
- **Transaction_Simulation**: Preview of transaction effects before signing
- **Execution_Session**: Complete lifecycle of executing an opportunity

## Global Policies

- **Security First**: All executions require Guardian approval and transaction simulation
- **Idempotency**: All execution requests must be idempotent to prevent duplicates
- **Audit Trail**: All execution activities must be logged immutably
- **User Control**: Users maintain full control over transaction signing
- **Transparency**: All fees, risks, and outcomes must be clearly disclosed

## Requirements

### Requirement 1: Quest Execution Initiation

**User Story:** As a Hunter, I want to initiate quest execution from an opportunity card so that I can participate in verified DeFi opportunities.

#### Acceptance Criteria

1. WHEN a user clicks "Join Quest" on an opportunity card THEN the Action Center modal SHALL open with quest details
2. WHEN the Action Center modal opens THEN it SHALL display: quest title, protocol, reward, Guardian score, estimated time, and fee breakdown
3. WHEN a wallet is not connected THEN the modal SHALL show "Connect Wallet" as the first step
4. WHEN a wallet is connected THEN the modal SHALL show "Review Details" as the first step
5. WHEN the quest requires specific chain THEN the modal SHALL prompt for chain switching if needed
6. WHEN the quest is geo-restricted THEN the modal SHALL display "Not available in your region" and disable execution
7. WHEN the Guardian score is below user's trust threshold THEN the modal SHALL show warning and require explicit consent
8. WHEN the quest has expired THEN the modal SHALL show "Quest Expired" and disable execution

### Requirement 2: Transaction Simulation & Pre-Flight Checks

**User Story:** As a Hunter, I want to see exactly what will happen before I sign any transactions so that I can make informed decisions.

#### Acceptance Criteria

1. WHEN a user proceeds to execution THEN the system SHALL simulate all transactions using Tenderly API
2. WHEN simulation completes THEN the system SHALL display: gas estimates, asset changes, approval requirements, and potential risks
3. WHEN simulation fails THEN the system SHALL show error details and block execution
4. WHEN simulation shows high slippage (>5%) THEN the system SHALL display slippage warning
5. WHEN simulation shows new contract interactions THEN the system SHALL highlight unverified contracts
6. WHEN simulation shows token approvals THEN the system SHALL list all approval amounts and recipients
7. WHEN user has insufficient balance THEN the system SHALL show required amounts and suggest funding
8. WHEN gas price is high THEN the system SHALL suggest waiting or using different chain

### Requirement 3: Guardian Integration & Security Verification

**User Story:** As a Hunter, I want Guardian security verification before execution so that I don't interact with malicious contracts.

#### Acceptance Criteria

1. WHEN a quest execution is initiated THEN the system SHALL verify current Guardian score is ≥ user's trust threshold
2. WHEN Guardian score is below threshold THEN execution SHALL be blocked with clear explanation
3. WHEN Guardian scan is stale (>24h) THEN the system SHALL trigger rescan before allowing execution
4. WHEN Guardian identifies new risks THEN the system SHALL update the quest status and notify user
5. WHEN Guardian score changes during execution THEN the system SHALL pause and require user confirmation
6. WHEN Guardian detects honeypot patterns THEN the system SHALL block execution and show warning
7. WHEN Guardian verifies safety THEN the system SHALL display green checkmark and proceed
8. WHEN Guardian is unavailable THEN execution SHALL be blocked unless protocol is allowlisted AND user enables Danger Mode with explicit consent

### Requirement 4: Execution Session Management

**User Story:** As a Hunter, I want my quest execution to be tracked and resumable so that I don't lose progress if something goes wrong.

#### Acceptance Criteria

1. WHEN a user starts quest execution THEN the system SHALL create a unique execution session with ID
2. WHEN execution session is created THEN it SHALL be stored in database with status "initiated"
3. WHEN user closes modal during execution THEN session SHALL persist and be resumable
4. WHEN user returns to quest THEN system SHALL show "Resume Execution" if session exists
5. WHEN execution fails THEN session SHALL be marked "failed" with error details
6. WHEN execution completes THEN session SHALL be marked "completed" with transaction hashes
7. WHEN session is older than 24h THEN it SHALL expire and require restart
8. WHEN user has multiple sessions THEN system SHALL show most recent active session

### Requirement 5: Step-by-Step Execution Flow

**User Story:** As a Hunter, I want to see clear progress through execution steps so that I understand what's happening at each stage.

#### Acceptance Criteria

1. WHEN execution begins THEN the system SHALL display step-by-step progress indicator
2. WHEN each step starts THEN it SHALL be marked as "executing" with loading animation
3. WHEN step completes successfully THEN it SHALL be marked "completed" with checkmark
4. WHEN step fails THEN it SHALL be marked "failed" with error message and retry option
5. WHEN step requires user action THEN it SHALL highlight the required action clearly
6. WHEN step involves transaction signing THEN it SHALL show "Waiting for signature" status
7. WHEN all steps complete THEN it SHALL show "Quest Completed" with celebration animation
8. WHEN execution can be retried THEN it SHALL show "Retry" button with clear explanation

### Requirement 6: Transaction Preparation & Signing

**User Story:** As a Hunter, I want transactions to be properly prepared and presented for signing so that I maintain full control over my assets.

#### Acceptance Criteria

1. WHEN execution step requires transaction THEN system SHALL prepare transaction data with proper gas estimates
2. WHEN transaction is prepared THEN system SHALL display transaction details: to address, value, gas limit, gas price
3. WHEN user approves transaction THEN system SHALL send to connected wallet for signing
4. WHEN user rejects transaction THEN system SHALL mark step as "cancelled" and pause execution
5. WHEN transaction is signed THEN system SHALL broadcast to network and track status
6. WHEN transaction is pending THEN system SHALL show "Transaction pending" with explorer link
7. WHEN transaction confirms THEN system SHALL mark step as completed and proceed
8. WHEN transaction fails THEN system SHALL show error and offer retry with higher gas

### Requirement 7: Idempotency & Duplicate Prevention

**User Story:** As a Hunter, I want protection against duplicate executions so that I don't accidentally execute the same quest multiple times.

#### Acceptance Criteria

1. WHEN execution request is made THEN system SHALL generate unique idempotency key
2. WHEN duplicate request with same idempotency key is received THEN system SHALL return existing execution status
3. WHEN execution is already in progress THEN system SHALL show "Execution in progress" and current status
4. WHEN execution is already completed THEN system SHALL show "Already completed" with completion details
5. WHEN execution failed previously THEN system SHALL allow retry with new idempotency key
6. WHEN user attempts multiple executions THEN system SHALL prevent concurrent executions for same quest
7. WHEN idempotency key expires (24h) THEN system SHALL allow new execution
8. WHEN system detects potential duplicate THEN it SHALL show confirmation dialog before proceeding

### Requirement 8: Execution Audit Trail & Logging

**User Story:** As a Hunter, I want complete records of my quest executions so that I can track my activities and troubleshoot issues.

#### Acceptance Criteria

1. WHEN execution session starts THEN system SHALL create immutable audit log entry
2. WHEN each execution step occurs THEN system SHALL log: timestamp, step details, status, transaction hash
3. WHEN execution completes THEN system SHALL log final status, total time, gas used, rewards earned
4. WHEN execution fails THEN system SHALL log error details, failure point, and recovery options
5. WHEN user views execution history THEN system SHALL display chronological list of all executions
6. WHEN user clicks on execution THEN system SHALL show detailed step-by-step log
7. WHEN audit log is created THEN it SHALL be immutable and tamper-evident
8. WHEN system needs debugging THEN logs SHALL contain sufficient detail for troubleshooting

### Requirement 9: Error Handling & Recovery

**User Story:** As a Hunter, I want clear error messages and recovery options when quest execution fails so that I can resolve issues and complete my quests.

#### Acceptance Criteria

1. WHEN execution fails THEN system SHALL display user-friendly error message with specific cause
2. WHEN network error occurs THEN system SHALL show "Network error" and offer retry
3. WHEN insufficient gas error occurs THEN system SHALL suggest increasing gas limit
4. WHEN slippage error occurs THEN system SHALL suggest adjusting slippage tolerance
5. WHEN contract error occurs THEN system SHALL show contract-specific error message
6. WHEN user error occurs THEN system SHALL provide clear instructions to resolve
7. WHEN error is recoverable THEN system SHALL show "Retry" button
8. WHEN error is not recoverable THEN system SHALL show "Contact Support" option

### Requirement 10: Fee Transparency & Cost Estimation

**User Story:** As a Hunter, I want to see all costs upfront before execution so that I can make informed decisions about quest participation.

#### Acceptance Criteria

1. WHEN execution modal opens THEN system SHALL display estimated total cost breakdown
2. WHEN cost breakdown is shown THEN it SHALL include: network fees, protocol fees, slippage estimates
3. WHEN gas prices are high THEN system SHALL highlight high gas costs and suggest alternatives
4. WHEN quest has protocol fees THEN system SHALL clearly disclose fee amounts and recipients
5. WHEN slippage is estimated THEN system SHALL show range (min-max) and current market conditions
6. WHEN costs exceed user's balance THEN system SHALL show shortfall and funding options
7. WHEN costs change during execution THEN system SHALL notify user and require confirmation
8. WHEN execution completes THEN system SHALL show actual costs vs estimates

### Requirement 11: Multi-Chain Execution Support

**User Story:** As a Hunter, I want to execute quests on different chains seamlessly so that I can participate in opportunities across the DeFi ecosystem.

#### Acceptance Criteria

1. WHEN quest requires different chain THEN system SHALL detect current chain and prompt for switch
2. WHEN chain switch is needed THEN system SHALL show "Switch to [Chain]" button
3. WHEN user switches chain THEN system SHALL verify switch completed before proceeding
4. WHEN chain switch fails THEN system SHALL show error and retry option
5. WHEN quest supports multiple chains THEN system SHALL let user choose preferred chain
6. WHEN executing on L2 THEN system SHALL show bridge options if funds are on L1
7. WHEN gas token is different THEN system SHALL check balance and suggest funding
8. WHEN chain is congested THEN system SHALL suggest alternative chains if available

### Requirement 12: Execution Status Tracking & Notifications

**User Story:** As a Hunter, I want to track execution progress and receive notifications so that I stay informed about my quest status.

#### Acceptance Criteria

1. WHEN execution is in progress THEN system SHALL show real-time status updates
2. WHEN transaction is broadcast THEN system SHALL show "Transaction submitted" notification
3. WHEN transaction confirms THEN system SHALL show "Transaction confirmed" notification
4. WHEN execution completes THEN system SHALL show "Quest completed" notification with rewards
5. WHEN execution fails THEN system SHALL show "Execution failed" notification with error
6. WHEN user navigates away THEN system SHALL continue tracking in background
7. WHEN user returns THEN system SHALL show current status and any updates
8. WHEN execution takes longer than expected THEN system SHALL show "Still processing" message

### Requirement 13: Reward Claiming & Verification

**User Story:** As a Hunter, I want to claim my quest rewards and verify receipt so that I can confirm successful completion.

#### Acceptance Criteria

1. WHEN quest execution completes THEN system SHALL check for claimable rewards
2. WHEN rewards are available THEN system SHALL show "Claim Rewards" button
3. WHEN user clicks claim THEN system SHALL prepare claim transaction
4. WHEN claim transaction is ready THEN system SHALL show reward details and gas cost
5. WHEN claim is successful THEN system SHALL show "Rewards claimed" confirmation
6. WHEN rewards are automatically distributed THEN system SHALL show "Rewards received" status
7. WHEN rewards are pending THEN system SHALL show estimated distribution time
8. WHEN rewards fail to claim THEN system SHALL show error and retry option

### Requirement 14: Execution History & Portfolio Integration

**User Story:** As a Hunter, I want to see my quest execution history integrated with my portfolio so that I can track my DeFi activities comprehensively.

#### Acceptance Criteria

1. WHEN user views execution history THEN system SHALL show chronological list of all quest executions
2. WHEN execution history is displayed THEN it SHALL show: quest name, date, status, rewards, gas spent
3. WHEN user clicks on execution THEN system SHALL show detailed execution log
4. WHEN execution affects portfolio THEN system SHALL update portfolio balances and history
5. WHEN rewards are received THEN system SHALL add to portfolio tracking
6. WHEN user exports data THEN system SHALL include quest execution data
7. WHEN filtering history THEN system SHALL support filters by: status, date range, protocol, chain
8. WHEN searching history THEN system SHALL support search by quest name or protocol

### Requirement 15: Security Safeguards & Risk Management

**User Story:** As a Hunter, I want comprehensive security safeguards during execution so that my assets are protected from malicious activities.

#### Acceptance Criteria

1. WHEN execution involves new contracts THEN system SHALL verify contract source code and warn if unverified
2. WHEN execution requires large approvals THEN system SHALL suggest exact approval amounts instead of unlimited
3. WHEN execution involves high-risk patterns THEN system SHALL show additional warnings and confirmations
4. WHEN Guardian detects suspicious activity THEN system SHALL pause execution and require manual review
5. WHEN execution involves proxy contracts THEN system SHALL verify implementation contract safety
6. WHEN execution requires admin privileges THEN system SHALL clearly warn about elevated permissions
7. WHEN execution involves experimental protocols THEN system SHALL show "Experimental" warning
8. WHEN user has set spending limits THEN system SHALL enforce limits and show remaining allowance

### Requirement 16: Performance & Reliability

**User Story:** As a Hunter, I want quest execution to be fast and reliable so that I don't miss time-sensitive opportunities.

#### Acceptance Criteria

1. WHEN execution is initiated THEN pre-flight checks SHALL complete within 10 seconds
2. WHEN transaction simulation runs THEN it SHALL complete within 5 seconds
3. WHEN execution step processes THEN status updates SHALL appear within 2 seconds
4. WHEN network is slow THEN system SHALL show "Network slow" warning and continue processing
5. WHEN system is under load THEN execution SHALL queue gracefully with position indicator
6. WHEN execution fails due to system error THEN it SHALL automatically retry non-signing operations (simulate, quote, status fetch, SSE reconnect) up to 3 times
7. WHEN retry attempts fail THEN system SHALL escalate to manual review
8. WHEN execution completes THEN success confirmation SHALL appear within 1 second

### Requirement 17: Mobile Optimization & Responsive Design

**User Story:** As a mobile Hunter, I want quest execution to work seamlessly on my mobile device so that I can participate in opportunities anywhere.

#### Acceptance Criteria

1. WHEN using mobile device THEN execution modal SHALL be optimized for touch interaction
2. WHEN modal is displayed THEN it SHALL use full screen on mobile with proper safe areas
3. WHEN steps are shown THEN they SHALL be clearly visible and tappable on small screens
4. WHEN transaction signing is required THEN it SHALL integrate smoothly with mobile wallets
5. WHEN execution is in progress THEN user SHALL be able to minimize app without losing progress
6. WHEN user returns to app THEN execution status SHALL be preserved and displayed
7. WHEN notifications are sent THEN they SHALL work with mobile notification systems
8. WHEN typing is required THEN mobile keyboard SHALL not obscure important information

### Requirement 18: Integration with External Wallets

**User Story:** As a Hunter, I want quest execution to work with my preferred wallet so that I can maintain my existing security practices.

#### Acceptance Criteria

1. WHEN execution requires signing THEN system SHALL support MetaMask, WalletConnect, and Coinbase Wallet
2. WHEN wallet is not connected THEN system SHALL show wallet connection options
3. WHEN wallet connection fails THEN system SHALL show clear error and retry options
4. WHEN wallet is locked THEN system SHALL prompt user to unlock wallet
5. WHEN wallet rejects transaction THEN system SHALL handle gracefully and allow retry
6. WHEN wallet network differs THEN system SHALL prompt for network switch
7. WHEN hardware wallet is used THEN system SHALL show appropriate signing instructions
8. WHEN wallet disconnects during execution THEN system SHALL pause and prompt for reconnection

### Requirement 19: Analytics & Monitoring

**User Story:** As a platform operator, I want comprehensive analytics on quest execution so that I can optimize the system and detect issues.

#### Acceptance Criteria

1. WHEN execution starts THEN system SHALL log execution_started event with quest details
2. WHEN execution completes THEN system SHALL log execution_completed event with duration and gas used
3. WHEN execution fails THEN system SHALL log execution_failed event with error details
4. WHEN user abandons execution THEN system SHALL log execution_abandoned event with step reached
5. WHEN analytics are collected THEN wallet addresses SHALL be hashed for privacy
6. WHEN monitoring dashboards are viewed THEN they SHALL show success rates, failure reasons, and performance metrics
7. WHEN anomalies are detected THEN system SHALL alert operators
8. WHEN user consents THEN detailed analytics SHALL be collected for product improvement

### Requirement 20: Testing & Quality Assurance

**User Story:** As a QA engineer, I want comprehensive testing capabilities for quest execution so that I can ensure system reliability.

#### Acceptance Criteria

1. WHEN test mode is enabled THEN system SHALL use test networks and mock data
2. WHEN running tests THEN system SHALL support deterministic execution scenarios
3. WHEN testing failures THEN system SHALL simulate various error conditions
4. WHEN testing performance THEN system SHALL measure execution times and resource usage
5. WHEN testing security THEN system SHALL verify all safeguards work correctly
6. WHEN testing integrations THEN system SHALL verify wallet and Guardian integrations
7. WHEN running regression tests THEN system SHALL verify existing functionality remains intact
8. WHEN deploying updates THEN system SHALL require passing all critical test scenarios

## Out of Scope (v1)

- Advanced execution strategies (DCA, limit orders)
- Cross-chain atomic swaps
- MEV protection integration
- Automated execution scheduling
- Social features (sharing executions)
- Advanced analytics dashboard
- White-label execution engine
- Institutional execution features

## Requirements Coverage Matrix

This matrix serves as the "definition of done" checklist for Hunter Action Center implementation. Each requirement must have all components implemented and tested before release.

**Legend:**
- ✅ **Impl** = implemented in code
- ✅ **Tests** = automated test coverage exists  
- ✅ **Telemetry** = logs/metrics/traces exist
- ✅ **UX** = UX states (loading/error/disabled) exist
- ✅ **Security** = abuse/security controls exist

| Req | Requirement | Status | Implementation | Tests | Telemetry | UX | Security |
|-----|-------------|--------|----------------|-------|-----------|----|---------| 
| 1 | Quest Execution Initiation | ❌ Missing | "Join Quest" opens Action Center modal with correct opportunity payload. Wallet disconnected → "Connect Wallet" step 1. Chain mismatch prompts switch. Geo-restricted/expired disables CTA. Guardian below threshold requires consent. | UI: modal opens from card, correct fields render. Integration: chain-switch success/fail paths. Policy: geo/expired block renders. | event: action_center_opened, join_clicked, blocked_geo, blocked_expired | Modal loading states, wallet connection flow | Geo-blocking, Guardian threshold enforcement |
| 2 | Simulation & Pre-Flight Checks | ❌ Missing | POST /simulate runs Tenderly for all planned steps. Render gas estimate, asset deltas, approvals, risks. Simulation fail blocks execution. High slippage warning + acknowledge. Insufficient balance guidance. | Contract test doubles: sim success/fail/high-slippage. UI: renders deltas/approvals and disables proceed on blocks_execution=true. | metric: simulation latency P95. event: simulation_started, simulation_completed, simulation_failed | Simulation loading, error states, retry options | Simulation failure blocking, slippage warnings |
| 3 | Guardian Integration & Security | ❌ Missing | Guardian trust >= threshold gate enforced. Stale scan triggers rescan. Mid-session score change pauses. Guardian unavailable → blocked unless allowlisted + Danger Mode. | Unit: gating logic for thresholds + stale rules. Integration: Guardian unavailable paths and allowlist override. | event: guardian_gate_pass, guardian_gate_block, guardian_rescan_triggered | Guardian loading, stale warnings, unavailable states | Trust threshold enforcement, allowlist + Danger Mode controls |
| 4 | Execution Session Management | ❌ Missing | Session created on start with initiated and expiry semantics. Resume execution from existing active session. Fail/completed stores errors/tx hashes. Expiration jobs mark sessions expired/tracking_expired. | API: create session idempotent. UI: resume shows if active session exists. Job: expiration transitions correct by status. | metric: active sessions count. event: session_created, session_resumed, session_expired | Session loading, resume flow, expiration notices | Single active session constraint, expiration enforcement |
| 5 | Step-by-Step Execution Flow | ❌ Missing | Stepper with statuses: pending/executing/awaiting_signature/pending_confirmation/confirmed/failed/canceled/skipped. "Waiting for signature" UI state. "Retry" only for safe retry states. Completion celebration state. | UI snapshot test: all step states. State machine test: valid transitions only. | event: step_started, step_completed, step_failed, step_retry_clicked | All step states with loading/error/disabled | Safe retry state validation |
| 6 | Transaction Preparation & Signing | ❌ Missing | tx request includes to/data/value/gas. Sign via connected wallet, handle reject. Broadcast and track explorer URL. Retry strategy for gas bump. | Wallet mock: approve/reject/timeout. Integration: submit_tx updates step/session. | event: signature_requested, signature_rejected, tx_submitted, tx_confirmed | Signature waiting, rejection handling, retry options | Transaction validation, gas estimation |
| 7 | Idempotency & Duplicate Prevention | ❌ Missing | Idempotency-Key required on mutating endpoints. Key reuse with different request hash → 409 conflict. Single active session constraint per (user, opportunity). UI prevents concurrent execution attempts. | API: same key returns same response. API: different hash same key → 409. DB: unique active session constraint enforced. | event: idempotency_replay, idempotency_conflict, duplicate_blocked | Concurrent execution prevention UI | Idempotency key validation, duplicate detection |
| 8 | Audit Trail & Logging | ❌ Missing | Append-only events written for all state changes/steps. Event includes timestamp, type, payload, tx hash when present. UI view: execution history + detail log. | API: events created on all transitions. UI: renders audit log chronologically. | metric: event writes/sec. event: audit_view_opened | History loading, detail view | Append-only enforcement, tamper detection |
| 9 | Error Handling & Recovery | ❌ Missing | Map errors to human-friendly codes/messages. Retry only for safe operations (simulate/status/SSE reconnect). "Contact Support" includes session_id + last error. | Error mapping unit tests. UI: retry button appears only when recoverable. | event: error_shown, retry_attempted, support_clicked | Error states, retry options, support contact | Safe retry operation validation |
| 10 | Fee Transparency & Cost Estimation | ❌ Missing | Display network fees, protocol fees, slippage range. Highlight high gas and suggest alternatives (L2/Wait). Final "actual vs estimate" post-completion view. | UI: fee breakdown always visible before execute. Simulation inputs produce correct display. | event: fee_breakdown_viewed, high_gas_warning_shown | Fee loading, high gas warnings, cost comparison | Cost validation, high gas protection |
| 11 | Multi-Chain Execution Support | ❌ Missing | Chain detection + switch prompt. Multi-chain choice (if supported). Funding checks for native gas token. Optional bridge suggestion (informational). | Integration: chain switch success/failure. UI: gas token balance warning. | event: chain_switch_prompted, chain_switch_failed, insufficient_gas_token | Chain switching flow, balance warnings | Chain validation, funding checks |
| 12 | Status Tracking & Notifications | ❌ Missing | Real-time status in modal + background tracking. Pending tx "still processing" after threshold. Notifications for submitted/confirmed/failed/completed. | SSE integration tests (or polling fallback). UI: background return shows latest state. | metric: SSE connected clients. event: notif_sent_submitted, notif_sent_confirmed | Real-time updates, background tracking | Notification rate limiting |
| 13 | Reward Claiming & Verification | ❌ Missing | Verify claimable rewards and show claim step. Claim tx prepared + estimated gas. Pending distribution state when auto-distributed. | Integration: claim available vs auto-distributed vs pending. UI: claim flow end-to-end. | event: rewards_detected, claim_clicked, claim_success, claim_failed | Claim flow states, pending indicators | Reward verification, claim validation |
| 14 | Execution History & Portfolio Integration | ❌ Missing | History list with filters: status/date/protocol/chain + search. Portfolio updates when rewards/positions change. Export includes execution data. | UI: filtering/search correctness. Integration: portfolio updates on completion. | event: history_viewed, history_filtered, export_clicked | History loading, filtering, export | Data access controls, export validation |
| 15 | Security Safeguards & Risk Management | ❌ Missing | Unverified contract warnings/blocks based on policy. Exact approvals default + unlimited approval warnings. Proxy contract checks + recent upgrade warnings. Spending limits enforced if configured. | Unit: risk findings → block/allow mapping. UI: approvals display and decision options. | event: unverified_contract_detected, unlimited_approval_detected, spending_limit_blocked | Risk warnings, approval options | Contract verification, spending limits |
| 16 | Performance & Reliability | ❌ Missing | SLO instrumentation: session create, simulation, status update latencies. Non-signing retries max 3 with backoff. Queue/backpressure behavior under load. | Load test: /sessions, /simulate, SSE. Chaos test: RPC/Tenderly intermittent failures. | metrics: P95 per endpoint, error rate, retry rate | Performance indicators, queue status | Rate limiting, retry limits |
| 17 | Mobile Optimization & Responsive Design | ❌ Missing | Fullscreen modal on mobile with safe areas. Touch-friendly stepper + buttons. Keyboard does not obscure CTAs. Wallet deep-link behavior doesn't break session. | Mobile viewport e2e. Accessibility: tap targets, focus, scroll locking. | event: mobile_action_center_opened, abandonment per device type | Mobile-optimized UI states | Touch target validation |
| 18 | External Wallet Integration | ❌ Missing | MetaMask + WalletConnect + Coinbase Wallet paths. Handle locked wallet, disconnect mid-flow. Hardware wallet guidance copy. | Wallet provider integration tests (mocked provider events). UI: disconnect → pause + resume. | event: wallet_connected, wallet_disconnected_during_execution, wallet_error | Wallet connection states, disconnect handling | Wallet validation, reconnection security |
| 19 | Analytics & Monitoring | ❌ Missing | Event schema with hashed wallet for analytics. Dashboard for success/failure reasons + funnel. Anomaly alerts (spike in failures, latency). | Event emission tests. Privacy test: wallet hashing verified. | metrics: conversion funnel, fail reasons distribution | Analytics loading, dashboard states | Privacy protection, data hashing |
| 20 | Testing & Quality Assurance | ❌ Missing | Deterministic test mode (testnets + fixtures). Scenario runner for: happy path, failures, stuck tx, high slippage. Regression gate in CI. | E2E suite runs on PR. Security test suite for risk blocks. | CI reporting: pass/fail, flaky tests tracked | Test mode indicators | Test environment isolation |
| 21 | API Contracts & Data Schemas | ❌ Missing | Endpoints match request/response formats exactly. Standard error format {error:{code,message,retry_after_sec}}. X-API-Version emitted. Rate limiting returns 429 + Retry-After. Server-only DB writes. Idempotency conflict handling (409). | Contract tests (Zod/TypeScript) for API responses. Rate limit test returns correct headers. | endpoint error code distribution | API error states, version indicators | Schema validation, rate limiting |
| 22 | Pre-Sign Risk Engine & Threat Detection | ❌ Missing | Detect unlimited approvals, Permit2, proxy, unverified bytecode, honeypot patterns. Findings include severity + blocks_execution. Overrides require explicit accept list + logged accepted risks. | Unit tests for each threat pattern. Integration test ensures blocked requests cannot proceed. | event: risk_blocked, risk_override_accepted, severity counts | Risk warning states, override flows | Threat pattern detection, override logging |
| 23 | Tamper-Evident Audit Trail | ❌ Missing | Hash chain computed on insert. Session digest computed on completion. Export includes digest + verification instructions. Integrity check endpoint or job exists. | Tamper test: modify event → integrity check fails. Export verification test. | alert: integrity_compromised | Audit export states, integrity indicators | Hash chain validation, tamper detection |
| 24 | State Machine & Concurrency Control | ❌ Missing | Valid transitions only (enforced centrally). Advisory locks or equivalent for transitions. Single active session per (user, opportunity). Stuck session detector + recovery path. | State transition unit tests (invalid → rejected). Concurrency test with parallel requests. | event: invalid_transition_attempted, stuck_session_detected | State transition indicators, recovery options | Transition validation, concurrency protection |
| 25 | Approval Doctor & Revocation Economics | ❌ Missing | Exact approval default. Unlimited approval options + auto-revoke step. Batch revoke option using Multicall3. Gas cost estimate in USD + L2 suggestion. | Simulation fixture includes approvals and revoke plan. UI: strategy selection alters plan. | event: approval_strategy_selected, auto_revoke_enabled, batch_revoke_suggested | Approval strategy UI, cost estimates | Approval validation, revocation economics |
| 26 | Real-Time Status Transport & Caching | ❌ Missing | SSE endpoint; polling fallback with backoff. Simulation cache TTL risk-based. Guardian freshness cache + confidence decay. Session fetch always uncached. | SSE stream test + reconnect path. Cache TTL test by risk tier. | metric: cache hit rate, SSE disconnect rate | SSE connection states, cache indicators | Cache validation, connection security |
| 27 | Enhanced Notifications & Background Tracking | ❌ Missing | Notification aggregation caps. Pending >2m "still pending" once. DND queue behavior. Prioritization across sessions. | Notification throttling tests. Pending threshold tests. | metric: notifications/session, delivery success rate | Notification states, DND indicators | Notification rate limiting, priority validation |
| 28 | Versioned Policy Engine & Compliance Decisions | ❌ Missing | Policy decision object returned on simulate. Policy version stored with audit events. Export of policy decisions. | Policy regression test suite per version. Audit export includes version/timestamps. | event: policy_blocked, codes distribution | Policy decision indicators, version display | Policy validation, version enforcement |
| 29 | Authentication & Session Security (Wallet-First) | ❌ Missing | Nonce issuance + SIWE-like verify. Token bound to wallet + domain + nonce. Token expiry + refresh via resign. Wallet mismatch → 401. Multi-wallet separate sessions. | Replay attempt fails (nonce reuse). Wallet mismatch fails. Expired token refresh flow. | event: siwe_started, siwe_verified, auth_failed_replay, auth_failed_mismatch | Auth flow states, token refresh | SIWE validation, replay protection |
| 30 | Append-Only Audit Enforcement | ❌ Missing | UPDATE/DELETE triggers hard-fail on events table. No UPDATE/DELETE policies on events. Insert validates hash chain continuity. | DB test: update/delete raises exception. Hash chain continuity test. | alert on mutation attempts (API-level and/or DB error monitoring) | Audit integrity indicators | Mutation prevention, integrity enforcement |
| 31 | Expiration Semantics | ❌ Missing | Idle states expire at 24h. Pending tx tracking for up to 7 days. Broadcast extends to tracking_expires_at. tracking_expired state retains audit trail. | Expiration job tests for each status bucket. Broadcast transition extends expiry. | event: idle_expired, tracking_expired, counts per reason | Expiration warnings, tracking indicators | Expiration enforcement, audit retention |
| 32 | SSE Contract (Replay + Ordering) | ❌ Missing | Supports Last-Event-ID replay. Event payload includes {session_id,status,step_id?,ts,seq}. Ordering is guaranteed per session. Gap detection triggers full refresh. | Disconnect/reconnect replays missed events. Gap simulation forces refresh. | metric: replay count, gap count | SSE replay states, gap indicators | Replay validation, ordering guarantees |
| 33 | Action Rate Limits | ❌ Missing | Risk-tiered rate limits per user + wallet + IP. 429 includes Retry-After + retry_after_sec. Progressive penalties for abuse. Operator alerting on patterns. | Rate limit exceeded returns correct headers/body. Abuse pattern triggers penalties. | metric: 429 rate, top offending IPs/wallets, penalty activations | Rate limit indicators, penalty notices | Multi-dimensional limiting, abuse detection |
| 37 | Rate Limit Policy (Concrete Numbers) | ❌ Missing | Token bucket algorithm with burst support. Specific limits per endpoint. Risk-tier adjustments. Abuse signal detection. | Burst behavior + 429 headers/body correctness. Abuse pattern detection tests. | 429 rate, top violators, tier escalations | Rate limit UI feedback | Token bucket implementation, abuse penalties |
| 38 | Simulation Timeout & Fallback Policy | ❌ Missing | 10s timeout + exponential backoff retries. Block by default with allowlist + Danger Mode override. Clear fallback UI. | Simulated timeouts lead to block or Danger Mode gating. Retry behavior validation. | timeout %, retry %, fallback usage % | Timeout indicators, fallback options | Timeout enforcement, override validation |
| 39 | Guardian Staleness vs Unavailable Semantics | ❌ Missing | Soft/hard stale definitions. Background rescan logic. Clear UI distinction between stale vs unavailable. | Stale_soft proceed rules + stale_hard block. Background rescan triggers. | stale events + rescan completion rate | Staleness indicators, rescan progress | Staleness enforcement, rescan validation |
| 40 | SSE Replay Buffer & Gap Handling | ❌ Missing | 1000 events/24h replay buffer. 410 Gone for gaps. Full state refresh on gap detection. Monotonic sequence guarantees. | Reconnect replay + gap triggers GET refresh. Buffer overflow handling. | replay count, gap count, reconnect rate | Replay indicators, gap handling | Buffer validation, sequence guarantees |
| 41 | Realtime Scaling & Connection Multiplexing | ❌ Missing | Single connection per user (not per session). Supabase quota awareness with graceful degradation. Client-side demultiplexing. Thundering herd prevention. | User stream multiplexing tests. Quota limit handling. Connection storm prevention. | connection count per plan tier, quota utilization | Connection status, quota warnings | Connection multiplexing, quota enforcement |
| 42 | Audit Event Partitioning & Queued Processing | ❌ Missing | Monthly partitioning. Redis Streams queuing. Bulk inserts with hash chain preservation. Cold storage archival. | Partition rotation tests. Queue processing with hash chain integrity. Archive/restore procedures. | partition size, queue depth, processing latency | Partition status, queue health | Hash chain integrity across partitions |
| 43 | Advisory Locks & Race Condition Prevention | ❌ Missing | Postgres advisory locks on (user_id, opportunity_id). Lock timeout handling. Deadlock detection and retry. | Concurrent request tests. Lock timeout scenarios. Deadlock recovery validation. | lock wait times, deadlock frequency, contention alerts | Lock status indicators, timeout warnings | Lock scoping, deadlock prevention |
| 44 | Mobile Resurrection Protocol | ❌ Missing | Secure local storage persistence. Deep link format: alphawhale://session/{id}/verify. State reconciliation with RPC. WalletConnect silent reconnection. | App backgrounding tests. Deep link handling. State hydration validation. | resurrection success rate, state reconciliation frequency | Resurrection progress, hydration status | Session persistence security |
| 45 | Pending Transaction Monitoring & Speed Up | ❌ Missing | Background monitoring of pending_confirmation. Speed-up suggestions after 5min. EIP-1559 conservative fee estimation. Replacement transaction tracking. | Stuck transaction detection. Speed-up flow validation. Fee estimation accuracy. | stuck transaction rate, speed-up success rate, fee estimation accuracy | Speed-up suggestions, transaction status | Fee estimation validation, replacement tracking |
| 46 | Database Schema Corrections | ❌ Missing | Soft deletion (deleted_at + active=false). Preserved audit events. Global monotonic sequence clarification. GDPR crypto-shredding patterns. | Soft deletion tests. Audit preservation validation. Sequence ordering verification. | soft deletion rate, audit retention metrics | Deletion status, audit integrity | Soft deletion enforcement, audit preservation |

### Release Gate Checklist (Must-Pass for Launch)

**Security:**
- [ ] No client direct writes to action_* tables (server-only writes via service role)
- [ ] Idempotency conflict handling (409) implemented with canonical endpoint_key
- [ ] Audit immutability enforced (DB hard-fail triggers, no CASCADE deletes)
- [ ] Guardian unavailable policy behaves exactly as spec
- [ ] Soft deletion implemented (deleted_at) with audit preservation

**Reliability:**
- [ ] SSE replay works with global seq; polling fallback works
- [ ] Expiration job correct for idle vs pending tx (dual TTL system)
- [ ] Concurrency constraint prevents double sessions (excludes soft-deleted)
- [ ] Transaction hash stored for broadcasting/pending_confirmation states

**UX:**
- [ ] Every step has loading/error/disabled states
- [ ] Clear warnings for unlimited approvals + Permit2 + proxies
- [ ] Mobile stepper usable (tap targets + safe areas)

**Observability:**
- [ ] SLO metrics wired (P95 latency, error rate)
- [ ] Structured events for key funnel steps
- [ ] Alerts for integrity compromised / spike in failures

## Success Metrics

- Quest execution success rate ≥ 95%
- Pre-flight check completion time ≤ 10 seconds
- Transaction simulation accuracy ≥ 98%
- User abandonment rate ≤ 15%
- Zero duplicate executions
- Guardian integration uptime ≥ 99.5%
- Mobile execution completion rate ≥ 90%
- User satisfaction score ≥ 4.5/5.0

## Dependencies

- Guardian API for security verification
- Tenderly API for transaction simulation
- Supabase for execution state management
- Web3 wallet integrations
- Blockchain RPC endpoints
- Gas price oracles
- Protocol-specific APIs
- Error monitoring service (Sentry)

## Compliance & Legal

- All executions must comply with applicable regulations
- User consent required for all transactions
- Clear disclaimers about risks and potential losses
- Audit trail must meet compliance requirements
- Privacy policy must cover execution data collection
- Terms of service must include execution limitations
- Geo-blocking for restricted jurisdictions
- AML/KYC compliance where required

---

# Action Center v1.1 Addendum

**Date:** December 2025  
**Status:** Production-Ready Specification

## Critical Additions to Base Requirements

### Requirement 21: API Contracts & Data Schemas

**User Story:** As a developer, I want explicit API contracts and database schemas so that I can implement the Action Center reliably without ambiguity.

#### Acceptance Criteria

1. WHEN creating execution session THEN `POST /api/action/sessions` SHALL accept: `{opportunity_id: UUID, wallet_address: string, chain_id: number, mode: "embedded_widget"|"manual_tx"}` and return: `{session: {id: UUID, status: "initiated", expires_at: RFC3339}, next: {step: string}}`
2. WHEN simulating execution THEN `POST /api/action/simulate` SHALL return: `{simulation_id: UUID, ttl_sec: 90, asset_deltas: [], approval_deltas: [], risk_findings: [], gas_estimate: {}, blocks_execution: boolean}`
3. WHEN all mutating endpoints are called THEN they SHALL require `Idempotency-Key` header and store `(user_id, endpoint, idempotency_key, request_hash, response)` for duplicate detection
4. WHEN database tables are created THEN they SHALL include: `action_execution_sessions`, `action_execution_steps`, `action_simulations`, `action_execution_events`, `api_idempotency_keys`
5. WHEN RLS policies are applied THEN they SHALL enforce `user_id = auth.uid()` for all user data and prevent cross-user access absolutely
6. WHEN error responses are returned THEN they SHALL use format: `{error: {code: "STRING", message: "HUMAN_READABLE", retry_after_sec: number}}`
7. WHEN API versioning is needed THEN responses SHALL include `X-API-Version` header
8. WHEN session state is queried THEN `GET /api/action/sessions/:id` SHALL return complete session with steps and events
9. WHEN mutating Action endpoints are called THEN they SHALL enforce rate limits and return 429 with Retry-After header for violations
10. WHEN database writes are needed THEN all writes (sessions, steps, simulations, events) SHALL be performed by server APIs using service role
11. WHEN client access is needed THEN client SHALL NOT write directly to tables and RLS SHALL protect client reads and prevent cross-user access
12. WHEN Idempotency-Key is reused with different request_hash THEN API SHALL return 409 with `{error: {code: "IDEMPOTENCY_KEY_REUSE"}}` and MUST NOT execute

### Requirement 22: Pre-Sign Risk Engine & Threat Detection

**User Story:** As a Hunter, I want advanced threat detection before signing so that I'm protected from drainer patterns, malicious approvals, and proxy risks.

#### Acceptance Criteria

1. WHEN simulation runs THEN system SHALL detect and report: unlimited approvals, Permit2 usage, proxy contracts, unverified bytecode, honeypot patterns
2. WHEN approval deltas are calculated THEN system SHALL show: `{spender: address, token: address, amount: string, unlimited: boolean, permit2: boolean, current_allowance: string}`
3. WHEN contract provenance is checked THEN system SHALL return: `{verified_source: boolean, proxy: boolean, implementation_address: string, last_upgrade: timestamp, bytecode_match: boolean}`
4. WHEN risk findings are generated THEN they SHALL include: `{code: string, severity: "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", title: string, detail: string, recommendation: string, blocks_execution: boolean}`
5. WHEN blocking policy is applied THEN execution SHALL be blocked if `severity >= HIGH OR blocks_execution=true OR Guardian trust below threshold` unless explicit override
6. WHEN Permit2 is detected THEN system SHALL show warning: "This transaction uses Permit2 signatures which can be dangerous if misused"
7. WHEN unlimited approval is required THEN system SHALL show red warning and offer: "Proceed", "Proceed + Auto-Revoke after completion"
8. WHEN proxy contract is detected THEN system SHALL verify implementation safety and warn if implementation changed recently

### Requirement 23: Tamper-Evident Audit Trail

**User Story:** As an enterprise user, I want cryptographically verifiable audit trails so that I can prove execution integrity for compliance and forensics.

#### Acceptance Criteria

1. WHEN execution event is logged THEN system SHALL create hash chain: `event_hash = hash(prev_hash + event_json + timestamp)`
2. WHEN audit trail is queried THEN system SHALL verify hash chain integrity and report any breaks
3. WHEN events are stored THEN they SHALL be append-only with no updates allowed via database constraints
4. WHEN session completes THEN system SHALL generate session digest: `session_hash = hash(all_event_hashes + session_metadata)`
5. WHEN audit export is requested THEN system SHALL provide tamper-evident digest with verification instructions
6. WHEN hash chain is broken THEN system SHALL alert operators and mark affected sessions as "integrity_compromised"
7. WHEN daily audit is performed THEN system SHALL optionally anchor root hash to public blockchain for ultimate tamper-evidence
8. WHEN forensic investigation is needed THEN audit trail SHALL provide complete reconstruction of all execution decisions

### Requirement 24: Execution State Machine & Concurrency Control

**User Story:** As a system operator, I want deterministic state transitions and concurrency protection so that executions don't get stuck or duplicated.

#### Acceptance Criteria

1. WHEN session is created THEN status SHALL be one of: `initiated → planning → simulating → blocked_risk → awaiting_user_confirm → awaiting_signature → broadcasting → pending_confirmation → confirmed → verifying_rewards → completed → failed → canceled → expired`
2. WHEN state transition is requested THEN system SHALL enforce valid transitions only and reject invalid ones
3. WHEN concurrent execution is attempted THEN database SHALL enforce unique constraint on `(user_id, opportunity_id)` where `active = true`
4. WHEN session state changes THEN system SHALL use advisory locks to prevent race conditions
5. WHEN session expires THEN system SHALL automatically transition to `expired` status after 24 hours
6. WHEN Guardian score drops mid-session THEN session SHALL transition to `awaiting_user_confirm` or `blocked_risk` based on severity
7. WHEN user abandons execution THEN session SHALL remain resumable until expiration
8. WHEN system detects stuck session THEN it SHALL provide recovery mechanisms and alert operators

### Requirement 25: Approval Doctor & Revocation Economics

**User Story:** As a Hunter, I want intelligent approval management and cost-effective revocation so that I minimize wallet risk and gas costs.

#### Acceptance Criteria

1. WHEN approval is required THEN system SHALL default to exact amount needed (or smallest safe buffer) instead of unlimited
2. WHEN unlimited approval is detected THEN system SHALL show red warning: "Unlimited approval detected" with options: "Use exact amount", "Proceed with unlimited", "Proceed + Auto-revoke"
3. WHEN user has ≥2 risky approvals THEN system SHALL offer "Batch Revoke" via Multicall3 with gas cost estimate
4. WHEN revocation is suggested THEN system SHALL show gas cost in USD and recommend L2 if cheaper: "Revoke on Ethereum: ~$45, or Arbitrum: ~$2"
5. WHEN Permit2 is used THEN system SHALL explain: "This uses Permit2 which allows spending without on-chain approval but requires careful signature review"
6. WHEN approval delta shows risk THEN system SHALL highlight: "This approval allows protocol to spend ALL your [TOKEN]"
7. WHEN auto-revoke is selected THEN system SHALL add revocation step to execution plan with gas estimate
8. WHEN approval batching is available THEN system SHALL group multiple approvals/revokes into single transaction

### Requirement 26: Real-Time Status Transport & Caching Strategy

**User Story:** As a Hunter, I want real-time execution updates and smart caching so that I stay informed without overwhelming the system.

#### Acceptance Criteria

1. WHEN user is authenticated THEN system SHALL provide SSE endpoint: `/api/action/sse?session_id=...` for real-time updates
2. WHEN SSE is unavailable THEN system SHALL fall back to polling every 2s → 5s exponential backoff
3. WHEN simulation results are cached THEN TTL SHALL be 30-120 seconds based on risk level
4. WHEN Guardian freshness is cached THEN TTL SHALL be 24 hours but confidence decays after 24h
5. WHEN session state is queried THEN it SHALL always be fresh (no cache)
6. WHEN risk-based caching is applied THEN high-risk operations SHALL have shorter TTLs
7. WHEN user navigates away THEN SSE connection SHALL gracefully close and resume on return
8. WHEN system is under load THEN caching SHALL be more aggressive to reduce database pressure

### Requirement 27: Enhanced Notifications & Background Tracking

**User Story:** As a Hunter, I want intelligent notifications and background tracking so that I stay informed without being overwhelmed.

#### Acceptance Criteria

1. WHEN execution updates occur THEN system SHALL aggregate notifications by session (max 3 per session per 10 minutes)
2. WHEN transaction is pending >2 minutes THEN system SHALL send "Still pending" notification once with explorer link
3. WHEN execution fails THEN system SHALL send immediate notification with error summary and retry option
4. WHEN execution completes THEN system SHALL send success notification with rewards summary
5. WHEN user has Do Not Disturb enabled THEN system SHALL queue notifications for later delivery
6. WHEN multiple sessions are active THEN system SHALL prioritize notifications by urgency and value
7. WHEN background tracking is active THEN system SHALL continue monitoring even when user is offline
8. WHEN notification caps are reached THEN system SHALL show summary: "3 more updates available" instead of individual notifications

### Requirement 28: Versioned Policy Engine & Compliance Decisions

**User Story:** As a compliance officer, I want auditable policy decisions with versioning so that I can prove regulatory compliance over time.

#### Acceptance Criteria

1. WHEN geo/KYC check is performed THEN system SHALL return: `{policy_decision: {policy_version: "v1.2", decision_code: "BLOCKED_GEO", jurisdiction_basis: "US_OFAC", blocked: true}}`
2. WHEN policy rules change THEN system SHALL increment version and maintain backward compatibility for audit
3. WHEN execution is blocked THEN system SHALL log policy decision with version for future audit
4. WHEN policy decision is appealed THEN system SHALL provide decision history and reasoning
5. WHEN compliance audit is performed THEN system SHALL export all policy decisions with versions and timestamps
6. WHEN new jurisdiction rules are added THEN system SHALL apply them prospectively with clear version tracking
7. WHEN policy engine is updated THEN system SHALL validate against test cases to prevent regression
8. WHEN regulatory inquiry occurs THEN system SHALL provide complete decision audit trail with policy versions

### Requirement 29: Authentication & Session Security (Wallet-First)

**User Story:** As a Hunter, I want secure wallet-based authentication so that I can safely execute quests without compromising my wallet security.

#### Acceptance Criteria

1. WHEN accessing Action Center endpoints THEN system SHALL require `Authorization: Bearer <aw_session_jwt>` issued via SIWE-like signature with nonce + domain binding
2. WHEN token is issued THEN it SHALL bind to wallet_address and reject mismatches via `X-Wallet-Address` header verification
3. WHEN tokens are created THEN they SHALL expire within 15–60 minutes and be refreshable via re-sign
4. WHEN replay protection is needed THEN nonce SHALL be one-time-use and stored server-side
5. WHEN wallet address mismatch occurs THEN system SHALL reject request with 401 Unauthorized
6. WHEN token expires THEN system SHALL return 401 with refresh instructions
7. WHEN multiple wallets are used THEN each SHALL have separate session tokens
8. WHEN session is established THEN server SHALL map wallet_address to user_id for RLS enforcement

### Requirement 30: Append-Only Audit Enforcement

**User Story:** As a compliance officer, I want guaranteed immutable audit trails so that I can prove execution integrity under regulatory scrutiny.

#### Acceptance Criteria

1. WHEN action_execution_events table is modified THEN system SHALL hard-fail on UPDATE/DELETE via DB triggers (not silent rules)
2. WHEN RLS policies are applied THEN they SHALL be operation-scoped (SELECT/INSERT only), with no UPDATE/DELETE policies allowed
3. WHEN audit trail integrity is checked THEN system SHALL detect and alert on any mutation attempts
4. WHEN database triggers fire THEN they SHALL raise exceptions that can be monitored and alerted
5. WHEN events are inserted THEN they SHALL be validated for hash chain integrity
6. WHEN mutation is attempted THEN system SHALL log the attempt for security monitoring
7. WHEN audit export is performed THEN system SHALL verify no mutations occurred via trigger logs
8. WHEN forensic investigation is needed THEN immutability SHALL be cryptographically verifiable

### Requirement 31: Expiration Semantics

**User Story:** As a Hunter, I want my execution sessions to remain trackable for pending transactions so that I don't lose visibility into on-chain activity.

#### Acceptance Criteria

1. WHEN session expires THEN it SHALL expire after 24h only if no broadcasted tx exists and status IN (initiated, planning, simulating, awaiting_user_confirm, awaiting_signature)
2. WHEN session has pending transactions THEN sessions in pending_confirmation SHALL remain trackable for up to 7 days
3. WHEN session expiration is checked THEN system SHALL differentiate between idle_expires_at and tracking_expires_at
4. WHEN transaction is broadcast THEN session SHALL automatically extend tracking window
5. WHEN session is truly idle THEN it SHALL expire and be marked as "expired" status
6. WHEN pending transaction exists THEN session SHALL NOT expire until final confirmation or 7-day limit
7. WHEN tracking window expires THEN system SHALL mark session as "tracking_expired" but preserve audit trail
8. WHEN user returns to expired session THEN system SHALL show appropriate message based on expiration type

### Requirement 32: SSE Contract

**User Story:** As a Hunter, I want reliable real-time updates with replay capability so that I never miss execution status changes.

#### Acceptance Criteria

1. WHEN SSE connection is established THEN system SHALL support Last-Event-ID replay and monotonic seq
2. WHEN SSE events are emitted THEN data payload SHALL include `{session_id, status, step_id?, ts, seq}`
3. WHEN client reconnects THEN system SHALL use Last-Event-ID to replay missed events
4. WHEN SSE events are generated THEN they SHALL use a global monotonic seq for replay (Last-Event-ID). Client ordering per session is derived by filtering events by session_id and sorting by seq
5. WHEN SSE connection drops THEN client SHALL automatically reconnect with Last-Event-ID header
6. WHEN event ordering is critical THEN system SHALL guarantee sequential delivery per session
7. WHEN SSE buffer overflows THEN system SHALL indicate gap and require full state refresh
8. WHEN multiple sessions are tracked THEN they share the same global seq stream; client demultiplexes by session_id

### Requirement 33: Action Rate Limits

**User Story:** As a platform operator, I want comprehensive rate limiting on Action endpoints so that I can prevent abuse and ensure system stability.

#### Acceptance Criteria

1. WHEN mutating endpoints are called THEN they SHALL be rate-limited per user + wallet + IP with risk-tiered limits
2. WHEN rate limits are exceeded THEN system SHALL return 429 responses with Retry-After header and `{error: {retry_after_sec: number}}`
3. WHEN POST /sessions, /simulate, /execute are called THEN they SHALL have tighter limits than read endpoints
4. WHEN rate limiting is applied THEN system SHALL track limits across user_id, wallet_address, and IP address dimensions
5. WHEN 429 is returned THEN response SHALL include specific retry timing and limit information
6. WHEN legitimate high-frequency usage occurs THEN system SHALL provide rate limit increase mechanisms
7. WHEN abuse is detected THEN system SHALL implement progressive penalties (longer timeouts)
8. WHEN rate limit monitoring is performed THEN system SHALL alert on unusual patterns or potential attacks

### Requirement 34: Finality & Confirmation Management

**User Story:** As a Hunter, I want reliable transaction confirmation tracking so that I know exactly when my quest execution is truly complete.

#### Acceptance Criteria

1. WHEN transaction is broadcast THEN system SHALL track confirmations based on chain-specific requirements from chain_confirmation_config
2. WHEN confirmation threshold is reached THEN step status SHALL transition from pending_confirmation to confirmed
3. WHEN reorg is detected THEN status SHALL revert from confirmed back to pending_confirmation
4. WHEN finality time exceeds estimate THEN system SHALL show "Taking longer than expected" with updated ETA
5. WHEN chain config is missing THEN system SHALL default to 1 confirmation with 60-second estimate
6. WHEN multiple chains are supported THEN each SHALL have appropriate confirmation requirements (ETH: 2-5, L2s: 1)
7. WHEN confirmation count increases THEN system SHALL update progress indicator in real-time
8. WHEN final confirmation is reached THEN system SHALL emit SSE event and proceed to next step

### Requirement 35: Protocol Allowlist & Danger Mode

**User Story:** As a Hunter, I want controlled access to unverified protocols so that I can participate in new opportunities while maintaining security awareness.

#### Acceptance Criteria

1. WHEN Guardian is unavailable THEN system SHALL check protocol_allowlist for quest protocol
2. WHEN protocol is allowlisted THEN execution SHALL proceed with warning: "Guardian unavailable, using allowlisted protocol"
3. WHEN protocol is not allowlisted THEN execution SHALL be blocked unless user has Danger Mode enabled
4. WHEN Danger Mode is enabled THEN user SHALL see prominent warning: "DANGER MODE: Proceeding without security verification"
5. WHEN enabling Danger Mode THEN system SHALL require 2-step confirmation with risk acknowledgment
6. WHEN protocol allowlist is updated THEN changes SHALL be logged with operator identity and reason
7. WHEN allowlist entry has HIGH risk_level THEN additional warnings SHALL be shown even when Guardian is available
8. WHEN Danger Mode is used THEN execution SHALL be logged with special audit flag for compliance review

### Requirement 36: Manual Review & Escalation Workflow

**User Story:** As a platform operator, I want a structured manual review process so that I can handle edge cases and system failures effectively.

#### Acceptance Criteria

1. WHEN system escalates to manual review THEN entry SHALL be created in action_operator_reviews table
2. WHEN review is created THEN system SHALL alert operators via configured channels (Slack, email, etc.)
3. WHEN operator claims review THEN status SHALL change to in_progress with assigned_to field
4. WHEN operator completes review THEN they SHALL add notes and resolution decision
5. WHEN review is resolved THEN original session SHALL be updated with operator decision
6. WHEN review queue is viewed THEN operators SHALL see prioritized list by creation time and session value
7. WHEN review takes >4 hours THEN system SHALL send escalation alert to senior operators
8. WHEN review is closed THEN user SHALL be notified of resolution and next steps

### Requirement 37: Rate Limit Policy (Concrete Numbers & Algorithm)

**User Story:** As a platform operator, I want specific rate limiting policies with concrete numbers so that I can prevent abuse while allowing legitimate usage.

#### Acceptance Criteria

1. WHEN rate limiting is implemented THEN system SHALL use token bucket algorithm with burst support
2. WHEN limits are enforced THEN they SHALL apply per user_id + wallet_address + IP, with strictest limit winning
3. WHEN production limits are set THEN they SHALL be: POST /sessions (10/min, burst 15), POST /simulate (30/min, burst 45), POST /execute (5/min, burst 8), POST /submit_tx (20/min per session, burst 30), GET /sessions (120/min, burst 200), GET /sse (1 concurrent + max 3 reconnects/min)
4. WHEN rate limit is violated THEN server SHALL return 429 with Retry-After header and `{error: {code: "rate_limit_exceeded", retry_after_sec: number}}`
5. WHEN risk-tier adjustments are applied THEN new wallets (<24h) get 50% limits, failed executions (≥3 in 24h) get 70% limits, abuse signals trigger 30min block + manual review
6. WHEN abuse is detected THEN signals SHALL include: repeated idempotency conflicts, high 429 rate, malformed tx submissions, repeated Danger Mode usage
7. WHEN rate limiting backend is chosen THEN system SHALL use token bucket in Redis/Upstash for predictable burst support
8. WHEN monitoring is performed THEN system SHALL track 429 rate, top violating IPs/wallets, and tier escalations

### Requirement 38: Simulation Timeout & Fallback Policy

**User Story:** As a Hunter, I want reliable simulation with clear fallback behavior so that I know what happens when simulation fails.

#### Acceptance Criteria

1. WHEN Tenderly simulation runs THEN it SHALL hard-timeout at 10 seconds
2. WHEN simulation fails THEN system SHALL retry with exponential backoff: 1s → 2s → 5s, maximum 3 attempts
3. WHEN simulation fails after retries THEN execution SHALL be BLOCKED by default with error "simulation_unavailable"
4. WHEN simulation override is needed THEN it SHALL be allowed ONLY if protocol is allowlisted AND user enables Danger Mode AND (Guardian available ≥ threshold OR user accepts "reduced visibility")
5. WHEN simulation is unavailable THEN UI SHALL show "Simulation unavailable" with options: Retry / Cancel / Danger Mode (if eligible)
6. WHEN fallback policy is configured THEN default SHALL be block-by-default with allowlisted protocol + Danger Mode override
7. WHEN simulation timeout occurs THEN system SHALL log timeout events for monitoring
8. WHEN simulation retry succeeds THEN system SHALL track retry success rate for reliability metrics

### Requirement 39: Guardian Staleness vs Unavailable Semantics

**User Story:** As a Hunter, I want clear distinction between outdated Guardian data and unavailable Guardian service so that I understand the security implications.

#### Acceptance Criteria

1. WHEN Guardian staleness is defined THEN stale_soft SHALL be age > 24h and stale_hard SHALL be age > 7d
2. WHEN Guardian is stale_soft AND service is reachable THEN system SHALL trigger background rescan and allow proceed only for LOW/MEDIUM risk (HIGH+ requires fresh scan)
3. WHEN Guardian is stale_hard THEN execution SHALL be blocked until rescan completes
4. WHEN Guardian service is unavailable THEN execution SHALL be blocked unless protocol is allowlisted AND user enables Danger Mode
5. WHEN UI displays Guardian status THEN it SHALL clearly distinguish "Guardian scan outdated (24h old)" vs "Guardian service unavailable"
6. WHEN background rescan is triggered THEN system SHALL show progress indicator and estimated completion time
7. WHEN Guardian policies are applied THEN soft stale SHALL warn + background rescan, hard stale SHALL block execution
8. WHEN Guardian monitoring is performed THEN system SHALL track stale events and rescan completion rates

### Requirement 40: SSE Replay Buffer & Gap Handling

**User Story:** As a Hunter, I want reliable real-time updates with proper gap handling so that I never miss critical execution status changes.

#### Acceptance Criteria

1. WHEN SSE replay buffer is maintained THEN server SHALL retain last 1000 events OR 24h per session, whichever is smaller
2. WHEN client reconnects with Last-Event-ID older than available THEN server SHALL return 410 Gone with `{error: {code: "sse_gap_detected", available_from_seq, requested_seq}}`
3. WHEN SSE gap is detected THEN client SHALL call GET /api/action/sessions/:id for full state refresh
4. WHEN SSE events are emitted THEN they SHALL include `{session_id, status, step_id?, ts, seq}` where seq is global monotonic (not per-session)
5. WHEN event ordering is critical THEN server SHALL guarantee ordered delivery per session
6. WHEN SSE buffer overflows THEN system SHALL use 1000 events + 24h window with 410 gap response
7. WHEN SSE monitoring is performed THEN system SHALL track replay count, gap count, and reconnection rate
8. WHEN SSE connection management is needed THEN system SHALL support graceful reconnection with proper gap detection

## Enhanced API Specification

**All `/api/action/*` endpoints require `Authorization: Bearer <aw_session_jwt>`. All mutating endpoints additionally require `Idempotency-Key`.**

### Authentication

All Action Center endpoints require wallet-based authentication:

```
Authorization: Bearer <aw_session_jwt>
X-Wallet-Address: 0x... (verified against token)
```

**Session Token (aw_session_jwt):**
- Issued via SIWE-like signature with nonce + domain binding
- Expires in 15-60 minutes, refreshable via re-sign
- Bound to specific wallet_address with server-side user_id mapping
- Replay protection via one-time nonce storage

**Authentication Flow:**
1. Client requests nonce: `GET /api/auth/nonce`
2. Client signs message with wallet: `Sign-In with Ethereum` format
3. Client submits signature: `POST /api/auth/verify` → returns aw_session_jwt
4. Client includes token in all subsequent requests

### Core Endpoints

```typescript
// Session Management
POST /api/action/sessions
Headers: { "Idempotency-Key": "uuid", "Authorization": "Bearer ..." }
Request: {
  opportunity_id: string,
  wallet_address: string,
  chain_id: number,
  mode: "embedded_widget" | "manual_tx"
}
Response: {
  session: {
    id: string,
    status: "initiated",
    expires_at: string,
    opportunity: OpportunityDetails
  },
  next: { step: "review_details" | "connect_wallet" }
}

// Simulation & Risk Analysis
POST /api/action/simulate
Headers: { "Idempotency-Key": "uuid" }
Request: {
  session_id: string,
  plan: {
    steps: Array<{
      kind: "approve" | "swap" | "stake" | "claim",
      tx: TransactionRequest
    }>
  }
}
Response: {
  simulation_id: string,
  ttl_sec: number,
  asset_deltas: Array<{
    token: { symbol: string, contract: string },
    delta_in: string,
    delta_out: string,
    net_delta: string,
    usd_estimate: number
  }>,
  approval_deltas: Array<{
    spender: string,
    token: string,
    amount: string,
    unlimited: boolean,
    permit2: boolean,
    current_allowance: string
  }>,
  contract_provenance: Array<{
    address: string,
    verified_source: boolean,
    proxy: boolean,
    implementation_address?: string,
    last_upgrade?: string,
    bytecode_match: boolean
  }>,
  risk_findings: Array<{
    code: string,
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    title: string,
    detail: string,
    recommendation: string,
    blocks_execution: boolean
  }>,
  gas_estimate: {
    max_gwei: number,
    max_fee_native: string,
    usd_estimate: number
  },
  blocks_execution: boolean,
  policy_decision: {
    policy_version: string,
    decision_code: string,
    jurisdiction_basis?: string,
    blocked: boolean
  }
}

// Execution Control
POST /api/action/execute
Headers: { "Idempotency-Key": "uuid" }
Request: {
  session_id: string,
  simulation_id: string,
  confirm: {
    accepted_risks: string[],
    approval_strategy: "exact" | "unlimited" | "unlimited_with_revoke"
  }
}
Response: {
  session_id: string,
  status: "awaiting_signature",
  current_step: {
    id: string,
    kind: "approve" | "swap" | "stake",
    tx_request: {
      to: string,
      data: string,
      value: string,
      gas_limit: string
    }
  }
}

// Transaction Submission
POST /api/action/steps/:step_id/submit_tx
Request: {
  tx_hash: string,
  chain_id: number
}
Response: {
  status: "pending_confirmation",
  explorer_url: string,
  estimated_confirmation_time: number
}

// Real-time Updates (SSE with replay support)
GET /api/action/sse
Headers: { "Last-Event-ID": "456", "Authorization": "Bearer ..." } // Global sequence number for replay
Query: ?session_id=uuid (optional filter)
Response: Server-Sent Events stream

event: session_update
id: 456
data: { "session_id": "uuid", "status": "awaiting_signature", "step_id": "uuid", "ts": "2025-01-01T00:00:00Z", "seq": 456 }

event: step_update  
id: 457
data: { "session_id": "uuid", "step_id": "uuid", "status": "confirmed", "tx_hash": "0x...", "ts": "2025-01-01T00:01:00Z", "seq": 457 }

// SSE uses global sequence (seq) for Last-Event-ID replay
// Client filters events by session_id after receiving them
```

## Database Schema

```sql
-- Sessions (read model)
CREATE TABLE action_execution_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  opportunity_id UUID NOT NULL,
  wallet_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'initiated', 'planning', 'simulating', 'blocked_risk',
    'awaiting_user_confirm', 'awaiting_signature', 'broadcasting',
    'pending_confirmation', 'confirmed', 'verifying_rewards',
    'completed', 'failed', 'canceled', 'expired', 'tracking_expired'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft deletion timestamp
  idle_expires_at TIMESTAMPTZ NOT NULL, -- 24h for pre-execution states
  tracking_expires_at TIMESTAMPTZ, -- 7 days for pending tx states
  active BOOLEAN NOT NULL DEFAULT TRUE,
  session_hash TEXT, -- Final tamper-evident digest
  
  -- Data validation constraints
  CONSTRAINT ck_wallet_addr CHECK (wallet_address ~* '^0x[0-9a-f]{40}$'),
  CONSTRAINT ck_chain_id CHECK (chain_id > 0),
  CONSTRAINT ck_tracking_expires CHECK (tracking_expires_at IS NULL OR tracking_expires_at >= idle_expires_at)
);

-- Normalize wallet addresses to lowercase
CREATE OR REPLACE FUNCTION normalize_wallet_address() RETURNS TRIGGER AS $$
BEGIN
  NEW.wallet_address = lower(NEW.wallet_address);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_normalize_wallet 
  BEFORE INSERT OR UPDATE ON action_execution_sessions 
  FOR EACH ROW EXECUTE FUNCTION normalize_wallet_address();

-- Enforce single active session per user+opportunity (exclude soft-deleted)
CREATE UNIQUE INDEX ux_active_session 
ON action_execution_sessions (user_id, opportunity_id) 
WHERE active = TRUE AND deleted_at IS NULL;

-- Steps
CREATE TABLE action_execution_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES action_execution_sessions(id) ON DELETE RESTRICT,
  step_index INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('approve', 'swap', 'stake', 'claim', 'verify', 'revoke')),
  adapter_type TEXT NOT NULL DEFAULT 'native_tx' CHECK (adapter_type IN ('native_tx', 'widget')),
  status TEXT NOT NULL CHECK (status IN (
    'pending', 'executing', 'awaiting_signature', 'pending_confirmation',
    'confirmed', 'failed', 'canceled', 'skipped'
  )),
  tx_to TEXT,
  tx_data TEXT,
  tx_value TEXT,
  tx_hash TEXT,
  gas_used BIGINT,
  gas_price_gwei NUMERIC,
  confirmations_required INTEGER DEFAULT 1,
  confirmations_received INTEGER DEFAULT 0,
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_step_order ON action_execution_steps(session_id, step_index);

-- Simulation artifacts
CREATE TABLE action_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES action_execution_sessions(id) ON DELETE RESTRICT,
  tenderly_simulation_id TEXT,
  ttl_expires_at TIMESTAMPTZ NOT NULL,
  asset_deltas JSONB NOT NULL,
  approval_deltas JSONB NOT NULL,
  contract_provenance JSONB NOT NULL,
  risk_findings JSONB NOT NULL,
  gas_estimate JSONB NOT NULL,
  policy_decision JSONB NOT NULL,
  blocks_execution BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Append-only audit log (tamper-evident with hard enforcement)
CREATE TABLE action_execution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES action_execution_sessions(id) ON DELETE RESTRICT,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seq BIGINT GENERATED ALWAYS AS IDENTITY, -- Global monotonic sequence for SSE replay
  event_type TEXT NOT NULL,
  event JSONB NOT NULL,
  prev_hash TEXT,
  event_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_events_session_ts ON action_execution_events(session_id, ts);
CREATE INDEX ix_events_seq ON action_execution_events(seq); -- For SSE Last-Event-ID lookup

-- Hard enforcement of append-only via triggers (not silent rules)
CREATE OR REPLACE FUNCTION forbid_mutation() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'append_only_table: % operation forbidden on %', TG_OP, TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_no_update_events 
  BEFORE UPDATE ON action_execution_events 
  FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

CREATE TRIGGER t_no_delete_events 
  BEFORE DELETE ON action_execution_events 
  FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

-- Idempotency with TTL policies
CREATE TABLE api_idempotency_keys (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint_key TEXT NOT NULL, -- Canonical endpoint identifier
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- TTL policies by endpoint_key
  CONSTRAINT ck_ttl_policy CHECK (
    (endpoint_key = 'ACTION_SESSIONS_CREATE' AND expires_at <= created_at + INTERVAL '24 hours') OR
    (endpoint_key = 'ACTION_SIMULATE' AND expires_at <= created_at + INTERVAL '10 minutes') OR
    (endpoint_key = 'ACTION_EXECUTE' AND expires_at <= created_at + INTERVAL '24 hours') OR
    (endpoint_key = 'ACTION_SUBMIT_TX' AND expires_at <= created_at + INTERVAL '24 hours') OR
    (expires_at <= created_at + INTERVAL '24 hours') -- Default fallback
  )
);

CREATE UNIQUE INDEX ux_idem ON api_idempotency_keys(user_id, endpoint_key, idempotency_key);
CREATE INDEX ix_idem_expires ON api_idempotency_keys(expires_at);

-- Authentication nonces for replay protection
CREATE TABLE auth_nonces (
  nonce TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX ix_nonces_wallet ON auth_nonces(wallet_address);
CREATE INDEX ix_nonces_expires ON auth_nonces(expires_at);

-- Performance indexes
CREATE INDEX ix_sessions_user_updated ON action_execution_sessions(user_id, updated_at DESC);
CREATE INDEX ix_steps_session_status ON action_execution_steps(session_id, status);

-- Protocol allowlist for Guardian unavailable scenarios
CREATE TABLE protocol_allowlist (
  id BIGSERIAL PRIMARY KEY,
  protocol_name TEXT NOT NULL UNIQUE,
  contract_addresses TEXT[] NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chain-specific confirmation requirements
CREATE TABLE chain_confirmation_config (
  chain_id INTEGER PRIMARY KEY,
  chain_name TEXT NOT NULL,
  confirmations_required INTEGER NOT NULL DEFAULT 1,
  finality_time_estimate_sec INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT ck_confirmations_positive CHECK (confirmations_required > 0)
);

-- Insert default chain configs
INSERT INTO chain_confirmation_config (chain_id, chain_name, confirmations_required, finality_time_estimate_sec) VALUES
(1, 'Ethereum', 2, 300),
(137, 'Polygon', 1, 30),
(42161, 'Arbitrum', 1, 15),
(10, 'Optimism', 1, 15),
(8453, 'Base', 1, 15);

-- Manual review queue for escalations
CREATE TABLE action_operator_reviews (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES action_execution_sessions(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  notes TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_reviews_status ON action_operator_reviews(status);
CREATE INDEX ix_reviews_session ON action_operator_reviews(session_id);

-- RLS Policies (operation-scoped)
ALTER TABLE action_execution_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_execution_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Sessions: SELECT only for owner (server handles writes via service role)
CREATE POLICY p_sessions_select ON action_execution_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Steps: SELECT only for owner
CREATE POLICY p_steps_select ON action_execution_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM action_execution_sessions s
      WHERE s.id = action_execution_steps.session_id 
      AND s.user_id = auth.uid()
    )
  );

-- Simulations: SELECT only for owner
CREATE POLICY p_simulations_select ON action_simulations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM action_execution_sessions s
      WHERE s.id = action_simulations.session_id 
      AND s.user_id = auth.uid()
    )
  );

-- Events: SELECT only for owner (no INSERT/UPDATE/DELETE policies - server only)
CREATE POLICY p_events_select ON action_execution_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM action_execution_sessions s
      WHERE s.id = action_execution_events.session_id 
      AND s.user_id = auth.uid()
    )
  );
```

## Institutional-Grade Safety Invariant

**Transaction Hash Requirement:** Any time `session.status` is `broadcasting` or `pending_confirmation`, the backend MUST store `tx_hash` for the current step (or explicitly store `tx_hash=null` with a reason). This makes resurrection and reconciliation deterministic and prevents "UI says one thing, chain says another" bugs.

## Performance & Reliability SLOs

### Response Time Targets
- Session creation: P95 < 500ms
- Simulation completion: P95 < 5s
- Step execution: P95 < 2s
- Status updates: P95 < 200ms

### Availability Targets
- Action Center API: 99.9% uptime
- Guardian integration: 99.5% uptime
- Transaction simulation: 99% uptime
- Real-time updates: 99% uptime

### Caching Strategy
- Simulation results: 30-120s TTL (risk-based)
- Guardian scores: 24h TTL with confidence decay
- Session state: No cache (always fresh)
- Policy decisions: 1h TTL

## Security & Compliance Enhancements

### Threat Detection Patterns
- Unlimited approvals → Red warning + alternatives
- Permit2 usage → Yellow warning + explanation
- Proxy contracts → Verify implementation safety
- Unverified contracts → Block unless override
- Honeypot patterns → Hard block with explanation

### Audit Requirements
- All execution events logged immutably
- Hash chain verification for tamper-evidence
- Policy decisions versioned and auditable
- Cross-user access prevention via RLS
- Idempotency protection against duplicates

### Compliance Features
- Geo-blocking with jurisdiction basis
- Policy versioning for regulatory audit
- Tamper-evident audit trail export
- Complete decision reconstruction capability
- Regulatory inquiry response automation

## Implementation Priority

### 0-30 Days (Core Foundation)
1. Database schema + RLS policies
2. Session management + state machine
3. Basic simulation + Guardian integration
4. Idempotency protection
5. UI stepper + error handling

### 31-60 Days (Security Hardening)
1. Pre-sign risk engine + threat detection
2. Approval Doctor + revocation economics
3. Tamper-evident audit trail
4. Real-time status transport (SSE)
5. Enhanced notifications

### 61-90 Days (Enterprise Features)
1. Policy engine versioning
2. Compliance audit export
3. Advanced threat detection
4. Performance optimization
5. Monitoring + alerting

This addendum transforms the base requirements into a production-ready specification with explicit contracts, enterprise-grade security, and comprehensive auditability.

## Implementation Addenda (Operational Clarity)

### Permit2 Detection Implementation

**Added to Requirements 22 & 25:**

Permit2 detection SHALL be performed by:
- Checking known Permit2 contract addresses per chain (mainnet: 0x000000000022D473030F116dFC393EBE325649be)
- Parsing transaction calldata for known selectors (permit/transferFrom patterns)
- Mark finding severity as MEDIUM (warn + require acknowledgment), escalate to HIGH if combined with unlimited approvals or unverified contracts

### Gas Oracle & "High Gas" Definition

**Added to Requirements 2.8 & 11:**

Gas oracle SHALL use:
- Primary: eth_feeHistory / eth_maxPriorityFeePerGas (native RPC methods)
- Secondary fallback: RPC eth_gasPrice
- "High gas" defined as: estimated_usd_fee > $25 for L1 OR > 90th percentile of last 7d median (stored server-side)
- Gas prices cached for 30 seconds
- High gas triggers "Wait" suggestion + alternative chain suggestions (if quest supports multiple chains)

### History Pagination Implementation

**Added to Requirement 14:**

- Endpoint: GET /api/action/history?limit=20&cursor=<opaque>
- Cursor-based pagination REQUIRED (avoids offset drift issues)
- Default limit: 20, maximum: 100
- Cursor format: opaque string encoding timestamp + session_id for stable ordering

### Cost Variance vs Estimate Handling

**Added to Requirement 10.8:**

- If actual gas > estimate * 1.5 before broadcast: show "Costs changed" and require re-confirmation
- If simulation older than 120 seconds: require re-simulate OR explicit accept with warning
- Cost variance threshold: 1.5x for gas, 5% for slippage, any amount for protocol fees

### Wallet Disconnect Recovery

**Added to Requirement 18.8:**

- If disconnect during awaiting_signature: keep step in awaiting_signature for 5 minutes
- After 5 minutes: mark as failed with wallet_disconnected_timeout
- Session remains viewable/resumable until normal expiry window
- UI shows "Wallet disconnected - please reconnect to continue" with reconnect button

### Danger Mode Lifecycle

**Added to Requirements 3.8 & 35:**

- Danger Mode is per-session only, never global setting
- Requires 2-step confirmation: checkbox + typed confirmation ("I understand the risks")
- Rate limit: maximum 3 Danger Mode sessions per 24h per user
- Always logs danger_mode=true in audit trail and analytics
- UI shows prominent warning: "DANGER MODE: Proceeding without full security verification"

### Test Mode Specification

**Added to Requirement 20:**

- Enabled ONLY in non-production via environment flag + ?test_mode=true query parameter
- Networks: Sepolia + Arbitrum Sepolia (or configured test networks)
- Uses separate database schema or project (recommended: separate Supabase project for staging)
- Test sessions auto-cleaned after 24 hours
- Test mode clearly indicated in UI with banner/badge

### Protocol Allowlist Operator Workflow

**Added to Requirements 3.8 & 35:**

- Allowlist managed via Supabase table with RLS restricted to service role only
- Changes require: change_request record (who/why/when) + 2-person approval process
- Audit log for all allowlist modifications with operator identity and justification
- Initial allowlist can be managed manually; admin UI can be added later

---

# Action Center v1.2 Institutional-Grade Addendum

**Date:** December 2025  
**Status:** Institutional-Grade Specification  
**Based on:** Gemini Audit Recommendations

## Critical Clarifications & Fixes

### Requirement 41: Realtime Scaling & Connection Multiplexing

**User Story:** As a platform operator, I want efficient realtime connection management so that I can scale to thousands of concurrent users without hitting Supabase quotas.

#### Acceptance Criteria

1. WHEN realtime connections are established THEN system SHALL use single connection per user (not per session) to avoid quota pressure
2. WHEN Supabase plan quotas are considered THEN system SHALL note "10k connections / 2.5k msg/s varies by plan" and degrade gracefully
3. WHEN multiple sessions exist for user THEN all session updates SHALL be published to single user stream with client-side demultiplexing
4. WHEN SSE is used THEN endpoint SHALL be `GET /api/action/sse` (authenticated user stream). It MAY accept `?session_id=` as an optional filter, but MUST NOT accept user_id as a query param
5. WHEN connection limits are reached THEN system SHALL queue updates and batch delivery to prevent message loss
6. WHEN client reconnects THEN system SHALL replay all missed events across all user sessions since Last-Event-ID
7. WHEN thundering herd scenarios occur THEN single-pipe-per-user SHALL prevent connection storms
8. WHEN quota monitoring is performed THEN system SHALL track connections per plan tier and alert before limits

### Requirement 42: Audit Event Partitioning & Queued Processing

**User Story:** As a platform operator, I want scalable audit logging with preserved hash chain integrity so that I can handle high-volume execution without performance degradation.

#### Acceptance Criteria

1. WHEN audit events are stored THEN action_execution_events SHALL be partitioned by month (or week for high volume)
2. WHEN API writes events THEN they SHALL be queued via Redis Streams for batched processing
3. WHEN worker processes events THEN it SHALL perform bulk inserts while preserving hash chain ordering
4. WHEN hash chain is computed THEN it SHALL be calculated in worker with prev_hash from last committed event per session
5. WHEN batching occurs THEN ordering rules SHALL ensure prev_hash links to actual previous event, not queued event
6. WHEN partition rotation happens THEN old partitions SHALL be archived to cold storage, never deleted
7. WHEN queue processing fails THEN system SHALL retry with exponential backoff and alert operators
8. WHEN audit integrity is verified THEN system SHALL validate hash chains across partition boundaries

### Requirement 43: Advisory Locks & Race Condition Prevention

**User Story:** As a system operator, I want bulletproof concurrency control so that race conditions cannot corrupt execution state.

#### Acceptance Criteria

1. WHEN session is created THEN system SHALL acquire Postgres advisory lock on (user_id, opportunity_id) inside transaction
2. WHEN any mutating endpoint is called THEN it SHALL acquire appropriate advisory lock before state changes
3. WHEN lock is acquired THEN it SHALL be released at transaction commit/rollback automatically
4. WHEN concurrent requests occur THEN second request SHALL wait for lock or timeout with clear error
5. WHEN lock timeout occurs THEN system SHALL return 409 Conflict with retry guidance
6. WHEN deadlock is detected THEN system SHALL retry with jittered backoff up to 3 times
7. WHEN lock monitoring is performed THEN system SHALL track lock wait times and alert on excessive contention
8. WHEN advisory locks are used THEN they SHALL be scoped to prevent cross-user interference

### Requirement 44: Mobile Resurrection Protocol

**User Story:** As a mobile Hunter, I want seamless session recovery after wallet interactions so that I never lose execution progress due to app backgrounding.

#### Acceptance Criteria

1. WHEN app backgrounds THEN system SHALL persist {session_id, step_id, last_status, timestamp} to secure local storage
2. WHEN wallet redirect occurs THEN deep link SHALL use format: `alphawhale://session/{id}/verify?step={step_id}`
3. WHEN app foregrounds from deep link THEN system SHALL call GET /api/action/sessions/:id for current state
4. WHEN state reconciliation is needed THEN system SHALL query RPC to verify on-chain status vs server state
5. WHEN discrepancy is found THEN system SHALL update server state to match blockchain reality
6. WHEN WalletConnect is used THEN system SHALL support silent reconnection patterns per WalletConnect best practices
7. WHEN session hydration occurs THEN UI SHALL show "Resuming execution..." with progress indicator
8. WHEN resurrection fails THEN system SHALL offer manual refresh with clear recovery instructions

### Requirement 45: Pending Transaction Monitoring & Speed Up

**User Story:** As a Hunter, I want proactive stuck transaction detection and speed-up options so that my executions don't get permanently stuck.

#### Acceptance Criteria

1. WHEN transactions are pending THEN background worker SHALL monitor sessions in pending_confirmation status
2. WHEN transaction is pending > 5 minutes THEN system SHALL suggest "Speed Up" option with higher gas price
3. WHEN EIP-1559 fee estimation is used THEN default SHALL be conservative: max_fee ≈ 2×base_fee + priority_fee
4. WHEN speed-up is requested THEN system SHALL create replacement transaction with higher gas price
5. WHEN replacement transaction is broadcast THEN system SHALL track both original and replacement tx hashes
6. WHEN either transaction confirms THEN system SHALL mark step as confirmed and ignore the other
7. WHEN transaction is stuck > 30 minutes THEN system SHALL escalate to manual review queue
8. WHEN fee estimation fails THEN system SHALL fall back to network average + 20% buffer

### Requirement 46: Database Schema Corrections

**User Story:** As a system operator, I want truly immutable audit trails so that forensic integrity is never compromised by cascading deletes.

#### Acceptance Criteria

1. WHEN sessions are deleted THEN system SHALL use soft deletion (deleted_at + active=false) instead of hard deletion
2. WHEN ON DELETE CASCADE is removed THEN audit events SHALL be preserved even if session is soft-deleted
3. WHEN SSE sequence is implemented THEN seq SHALL be global monotonic with clarification: "ordered by seq within session stream"
4. WHEN partition archival occurs THEN old audit data SHALL be moved to cold storage, never permanently deleted
5. WHEN forensic investigation is needed THEN complete audit trail SHALL be reconstructable from archives
6. WHEN GDPR compliance is required THEN PII SHALL be separated from audit events using crypto-shredding patterns
7. WHEN database constraints are enforced THEN foreign key relationships SHALL allow soft-deleted sessions
8. WHEN cleanup jobs run THEN they SHALL archive old data, never delete audit events

## Enhanced Implementation Specifications

### SSE Replay Buffer Semantics (Requirement 32 Update)

**Clarified Buffer Rules:**
- Buffer size: 1000 events OR 24 hours per user (not per session)
- Gap detection: Return 410 Gone with `{error: {code: "sse_gap_detected", available_from_seq, requested_seq}}`
- Full refresh: Client calls GET /api/action/sessions for complete state reconstruction
- Sequence: Global monotonic, ordered by seq within user stream, filtered by session_id client-side

### Rate Limit Policy Table (Requirement 37 Enhancement)

**Production Rate Limits:**
```
POST /api/action/sessions: 10/min (burst 15)
POST /api/action/simulate: 30/min (burst 45)  
POST /api/action/execute: 5/min (burst 8)
POST /api/action/steps/:id/submit_tx: 20/min per session (burst 30)
GET /api/action/sessions/:id: 120/min (burst 200)
GET /api/action/sse: 1 concurrent per user + max 3 reconnects/min
```

**Risk Tier Adjustments:**
- Tier 1 (new wallet <24h): 50% of base limits
- Tier 2 (≥3 failed executions in 24h): 70% of base limits  
- Tier 3 (abuse signals): 30min temporary block + manual review

### Timeout & Retry Policy Table

**Service Timeouts:**
```
Tenderly simulation: 10s hard timeout, retry 1s→2s→5s (max 3 attempts)
Guardian API: 5s timeout, retry 1s→2s (max 3 attempts)
RPC calls: 30s timeout, retry 2s→4s→8s (max 3 attempts)
SSE reconnection: 2s→4s→8s→16s exponential backoff (max 5 attempts)
Database queries: 10s timeout, no retry (fail fast)
```

**Non-Retryable Operations:**
- Transaction signing requests
- Transaction broadcasting  
- State machine transitions
- Audit event logging

### Error Code Catalog

**Authentication Errors:**
- `AUTH_TOKEN_EXPIRED`: Token expired, refresh required → Retryable
- `AUTH_WALLET_MISMATCH`: Wallet address mismatch → Not retryable
- `AUTH_NONCE_REUSED`: Replay attack detected → Not retryable

**Execution Errors:**
- `SIMULATION_TIMEOUT`: Tenderly timeout → Retryable
- `SIMULATION_FAILED`: Simulation error → Not retryable without changes
- `GUARDIAN_BELOW_THRESHOLD`: Guardian score too low → Not retryable
- `INSUFFICIENT_BALANCE`: Not enough funds → Not retryable

**System Errors:**
- `RATE_LIMIT_EXCEEDED`: Too many requests → Retryable after delay
- `IDEMPOTENCY_KEY_REUSE`: Key reused with different hash → Not retryable
- `SESSION_EXPIRED`: Session too old → Not retryable
- `CONCURRENT_EXECUTION`: Another execution in progress → Retryable

### Test Mode Specification (Requirement 20 Enhancement)

**Test Environment Rules:**
- Enabled ONLY in non-production via `TEST_MODE=true` environment flag
- Networks: Sepolia (ETH), Arbitrum Sepolia, Polygon Mumbai
- Database: Separate Supabase project for staging isolation
- Session cleanup: Auto-delete test sessions after 24 hours
- Rate limits: 10x higher limits for testing
- Guardian: Mock responses with configurable scores
- Simulation: Use Tenderly fork mode with deterministic results

### Manual Review Triggers & Thresholds

**Automatic Escalation Triggers:**
- Guardian score drops >20 points during execution
- Simulation timeout after 3 retries
- Transaction stuck >30 minutes
- Rate limit violations >5x in 1 hour
- Danger Mode used >3x in 24 hours
- Idempotency conflicts >10 in 1 hour

**Review Queue Priority:**
1. Security violations (Guardian, risk engine blocks)
2. Stuck high-value transactions (>$10k)
3. Technical failures (simulation, RPC timeouts)
4. User escalations (support requests)

This v1.2 addendum transforms the Hunter Action Center into an institutional-grade system capable of handling enterprise scale while maintaining the security and audit integrity of the original design.

---

# Action Center v1.3 Final Addendum - DeFi 2025 Standards

**Date:** December 2025  
**Status:** Production-Ready with 2025 DeFi Standards  
**Based on:** Ethereum Pectra Hard Fork & DeFi Evolution

## Critical 2025 Standards Integration

### Requirement 47: EIP-7702 Delegation & Atomic Batching

**User Story:** As a Hunter, I want to execute approve + swap operations in a single transaction so that I save gas costs and reduce execution complexity.

#### Acceptance Criteria

1. WHEN user wallet supports EIP-7702 delegation THEN system SHALL detect capability via `eth_getCode` after delegation
2. WHEN EIP-7702 is available THEN system SHALL propose atomic batch transaction combining approvals + execution steps
3. WHEN batching is used THEN system SHALL show single gas estimate for the entire batch operation
4. WHEN EIP-7702 is unavailable THEN system SHALL fall back to traditional multi-transaction flow
5. WHEN batch transaction is prepared THEN system SHALL simulate the entire batch as a single unit
6. WHEN batch fails THEN system SHALL provide granular error details for each step within the batch
7. WHEN user signs batch THEN system SHALL track the single transaction hash for all constituent steps
8. WHEN batch confirms THEN system SHALL mark all constituent steps as completed simultaneously

### Requirement 48: MEV Protection & Private RPC Routing

**User Story:** As a Hunter executing high-value quests, I want protection from MEV attacks so that I don't lose value to front-running bots.

#### Acceptance Criteria

1. WHEN transaction value exceeds $1000 USD THEN system SHALL route transaction via private RPC by default
2. WHEN private RPC routing is used THEN system SHALL use Flashbots Protect, MEV-Blocker, or equivalent service
3. WHEN private RPC is unavailable THEN system SHALL warn user about MEV risk and offer to proceed
4. WHEN MEV protection is active THEN system SHALL display "MEV Protected" badge in transaction status
5. WHEN private mempool is used THEN system SHALL adjust confirmation time estimates (typically longer)
6. WHEN MEV protection fails THEN system SHALL fall back to public RPC with explicit user consent
7. WHEN user opts out of MEV protection THEN system SHALL show warning: "Transaction may be front-run"
8. WHEN MEV protection is configured THEN system SHALL support multiple private RPC providers for redundancy

### Requirement 49: Institutional Tax & Audit Export Standards

**User Story:** As an institutional user, I want standardized export formats so that I can import execution data into professional accounting software.

#### Acceptance Criteria

1. WHEN exporting execution history THEN system SHALL provide CSV format compatible with CoinTracker schema
2. WHEN CSV export is generated THEN it SHALL include columns: Date, Sent Asset, Sent Amount, Received Asset, Received Amount, Fee Asset, Fee Amount, TxHash, Quest Protocol
3. WHEN export includes multiple steps THEN each step SHALL be a separate row with clear step identification
4. WHEN Koinly compatibility is requested THEN system SHALL provide alternative schema with Koinly-specific columns
5. WHEN export spans multiple chains THEN system SHALL include Chain ID and Network Name columns
6. WHEN gas fees are paid THEN they SHALL be listed as separate "Fee" entries with ETH/native token
7. WHEN export is generated THEN system SHALL include metadata header with export date, user ID hash, and schema version
8. WHEN large exports are requested THEN system SHALL support pagination and streaming download

### Requirement 50: Safe App SDK & Multisig Integration

**User Story:** As an institutional user with multisig wallets, I want native Safe integration so that I can propose and execute quests through my organization's multisig workflow.

#### Acceptance Criteria

1. WHEN running inside Safe iframe THEN system SHALL detect Safe environment via `window.parent !== window`
2. WHEN Safe Apps SDK is available THEN system SHALL use Safe transaction proposal instead of direct wallet signing
3. WHEN multisig is detected THEN system SHALL hide "Speed Up" and "Cancel" options (not applicable to multisig)
4. WHEN Safe transaction is proposed THEN system SHALL show "Proposed to Safe" status with multisig address
5. WHEN Safe transaction requires signatures THEN system SHALL display signature progress (2 of 3 signed)
6. WHEN Safe transaction is executed THEN system SHALL track the Safe transaction hash
7. WHEN Safe integration fails THEN system SHALL fall back to WalletConnect with clear error message
8. WHEN Safe App is used THEN system SHALL adjust UI layout for iframe constraints and Safe branding

### Requirement 51: Enhanced Threat Detection - Trojan Tokens

**User Story:** As a Hunter, I want protection from malicious tokens that can drain my wallet so that I don't fall victim to sophisticated token attacks.

#### Acceptance Criteria

1. WHEN simulation includes token transfers THEN system SHALL analyze opcodes for unexpected DELEGATECALL operations
2. WHEN token transfer triggers SSTORE on unauthorized contracts THEN system SHALL flag as "Trojan Token Risk"
3. WHEN malicious token patterns are detected THEN system SHALL block execution with detailed warning
4. WHEN token has unusual transfer hooks THEN system SHALL warn about "Complex Token Behavior"
5. WHEN token contract is unverified AND has complex logic THEN system SHALL require explicit user acknowledgment
6. WHEN token analysis fails THEN system SHALL err on the side of caution and block execution
7. WHEN allowlisted tokens are used THEN system SHALL skip deep analysis for performance
8. WHEN trojan detection is bypassed THEN system SHALL log override decision for security monitoring

### Requirement 52: Intent-Based Fallback & Smart Routing

**User Story:** As a Hunter, I want automatic route optimization and fallback so that my quests succeed even when initial routing fails.

#### Acceptance Criteria

1. WHEN swap step fails due to slippage THEN system SHALL automatically retry with aggregator API (1inch, CowSwap)
2. WHEN bridge step fails THEN system SHALL suggest alternative bridge routes with cost comparison
3. WHEN intent-based routing is used THEN system SHALL show "Smart Routing" indicator
4. WHEN multiple routes are available THEN system SHALL present best route by cost and time
5. WHEN route optimization is active THEN system SHALL update gas estimates dynamically
6. WHEN fallback routing is triggered THEN system SHALL notify user of route change and require confirmation
7. WHEN intent resolution fails THEN system SHALL fall back to original transaction-based approach
8. WHEN smart routing is used THEN system SHALL track both intended outcome and actual execution path

### Requirement 53: Chaos Engineering & Network Resilience Testing

**User Story:** As a QA engineer, I want comprehensive chaos testing so that I can verify system resilience under adverse network conditions.

#### Acceptance Criteria

1. WHEN chaos testing is enabled THEN system SHALL inject artificial latency (1-10s) into RPC calls
2. WHEN reorg simulation runs THEN system SHALL artificially revert confirmed transactions and test recovery
3. WHEN network partition testing occurs THEN system SHALL simulate RPC timeouts and test fallback behavior
4. WHEN mobile resurrection testing runs THEN system SHALL simulate app kills during critical execution phases
5. WHEN SSE chaos testing is active THEN system SHALL inject connection drops and test replay functionality
6. WHEN database chaos is enabled THEN system SHALL simulate lock timeouts and test deadlock recovery
7. WHEN chaos proxy is used THEN system SHALL log all injected failures for test result correlation
8. WHEN chaos testing completes THEN system SHALL generate resilience report with failure recovery metrics

## Updated Out of Scope (v1.3)

**Moved to In-Scope:**
- ✅ MEV protection integration (now Requirement 48)
- ✅ Institutional execution features (now Requirements 49-50)

**Still Out of Scope:**
- Advanced execution strategies (DCA, limit orders)
- Cross-chain atomic swaps
- Automated execution scheduling
- Social features (sharing executions)
- Advanced analytics dashboard
- White-label execution engine

## Updated Requirements Coverage Matrix (v1.3 Additions)

| Req | Requirement | Status | Implementation | Tests | Telemetry | UX | Security |
|-----|-------------|--------|----------------|-------|-----------|----|---------| 
| 47 | EIP-7702 Delegation & Atomic Batching | ❌ Missing | EIP-7702 capability detection via eth_getCode. Batch transaction builder. Single gas estimate for batched operations. Fallback to multi-tx flow. | Unit: EIP-7702 detection logic. Integration: batch simulation success/failure. E2E: full batch execution flow. | event: eip7702_detected, batch_proposed, batch_executed, fallback_triggered | Batch operation indicators, capability detection | EIP-7702 validation, batch integrity |
| 48 | MEV Protection & Private RPC Routing | ❌ Missing | Value threshold detection ($1000+). Private RPC routing (Flashbots/MEV-Blocker). Fallback to public RPC with warnings. Multiple provider redundancy. | Unit: value threshold logic. Integration: private RPC success/failure paths. Load: private RPC provider failover. | metric: mev_protection_usage_rate, private_rpc_success_rate. event: mev_protection_enabled, private_rpc_failed | MEV protection badges, routing status | MEV attack prevention, private RPC validation |
| 49 | Institutional Tax & Audit Export Standards | ❌ Missing | CoinTracker/Koinly CSV schema generation. Multi-step row handling. Chain-specific metadata. Streaming export for large datasets. | Unit: CSV schema validation. Integration: export generation correctness. Performance: large export streaming. | event: export_generated, export_downloaded, schema_version_used | Export progress, schema selection | Data privacy, export validation |
| 50 | Safe App SDK & Multisig Integration | ❌ Missing | Safe environment detection. Safe Apps SDK integration. Multisig-specific UI adjustments. Transaction proposal flow. Signature progress tracking. | Unit: Safe detection logic. Integration: Safe Apps SDK calls. E2E: full multisig proposal flow. | event: safe_detected, transaction_proposed, signature_progress | Safe-specific UI states, signature progress | Safe integration validation, multisig security |
| 51 | Enhanced Threat Detection - Trojan Tokens | ❌ Missing | Opcode analysis during simulation. DELEGATECALL/SSTORE pattern detection. Trojan token risk flagging. Complex token behavior warnings. | Unit: opcode analysis logic. Integration: threat detection accuracy. Security: malicious token test cases. | event: trojan_detected, complex_token_warned, threat_bypassed | Threat warnings, token risk indicators | Trojan token prevention, opcode validation |
| 52 | Intent-Based Fallback & Smart Routing | ❌ Missing | Aggregator API integration (1inch/CowSwap). Route optimization logic. Fallback routing on failure. Multi-route comparison. | Unit: route optimization algorithms. Integration: aggregator API calls. E2E: fallback routing scenarios. | event: smart_routing_used, route_fallback_triggered, route_optimized | Smart routing indicators, route comparison | Route validation, aggregator security |
| 53 | Chaos Engineering & Network Resilience Testing | ❌ Missing | Chaos proxy implementation. Latency/timeout injection. Reorg simulation. Network partition testing. Resilience metrics collection. | Chaos: all failure scenarios. Load: system behavior under chaos. Recovery: failure recovery validation. | metric: chaos_test_pass_rate, recovery_time_p95. event: chaos_test_started, failure_injected, recovery_completed | Chaos testing indicators, resilience reports | Chaos test isolation, failure injection safety |

## 2025 DeFi Competitive Positioning

With v1.3, the Hunter Action Center now includes:

**✅ Next-Gen Ethereum Features:**
- EIP-7702 atomic batching for gas optimization
- MEV protection as standard (not premium)
- Intent-based fallback routing

**✅ Institutional Grade:**
- Safe multisig native integration
- Professional tax export standards
- Enhanced threat detection (beyond honeypots)

**✅ Production Resilience:**
- Chaos engineering test suite
- Network partition recovery
- Mobile resurrection under adverse conditions

This positions AlphaWhale's Hunter Action Center as a **best-in-class DeFi execution engine** for December 2025, competitive with or superior to MetaMask Portfolio, Zapper, or DeFiSaver in terms of security, user experience, and institutional readiness.