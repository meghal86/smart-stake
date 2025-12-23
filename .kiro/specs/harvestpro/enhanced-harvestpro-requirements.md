# Enhanced HarvestPro Requirements Document - App Store Version

## Introduction

HarvestPro is a tax-record and loss-identification module within AlphaWhale. It helps users identify unrealized losses across connected wallets and read-only CEX accounts, estimate potential tax impact and execution costs (gas, fees, slippage), and prepare user-initiated action flows through the Action Center. HarvestPro also generates tax-preparer-friendly, Form 8949–compatible exports and an integrity record of the session for auditability.

Disclosures: HarvestPro provides informational outputs only and does not provide tax, legal, or financial advice. Users are responsible for verifying results with a qualified tax professional and for confirming all transactions in their wallet.

## Glossary

- **HarvestPro_System**: The tax-loss harvesting module within AlphaWhale
- **User**: An AlphaWhale account holder with connected wallets or CEX accounts
- **Wallet**: A blockchain wallet connected to the User's account
- **CEX_Account**: A centralized exchange account linked to the User's profile
- **Lot**: A specific acquisition of a token at a particular time and price
- **Harvest_Opportunity**: An eligible lot with unrealized loss that can be sold for tax benefits
- **Action_Center**: AlphaWhale's transaction preparation and routing system
- **Guardian_Score**: AlphaWhale's risk assessment metric (scale 0-10)
- **Net_Tax_Benefit**: Tax savings minus execution costs (gas, slippage, fees)
- **Proof_of_Activity**: Cryptographically verifiable integrity record of the HarvestSession, including calculations and user-confirmed outcomes (if any)
- **Form_8949**: IRS tax form for reporting capital gains and losses
- **FIFO**: First-In-First-Out accounting method for cost basis
- **Unrealized_Loss**: Negative difference between acquisition price and current price
- **Liquidity_Score**: Metric indicating ease of selling a token without price impact
- **Slippage**: Price difference between expected and actual execution price
- **activityProofHash**: SHA-256 hash of canonical session data for integrity verification

## Data Models

### Lot
```typescript
{
  lotId: string                    // Unique identifier for this lot
  token: string                    // Token symbol (e.g., "ETH", "BTC")
  walletOrCex: string             // Source identifier (wallet address or CEX name)
  acquiredAt: string              // ISO 8601 timestamp of acquisition
  acquiredQty: number             // Quantity of tokens acquired
  acquiredPriceUsd: number        // Price per token at acquisition in USD
  currentPriceUsd: number         // Current market price per token in USD
  unrealizedPnl: number           // (currentPrice - acquiredPrice) * quantity
  holdingPeriodDays: number       // Days between acquisition and now
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  liquidityScore: number          // 0-100 scale
  guardianScore: number           // 0-10 scale
  eligibleForHarvest: boolean     // Passes all eligibility criteria
  costBasisConfidence: "HIGH" | "MEDIUM" | "LOW"  // Data quality indicator
  dataQualityFlags: string[]      // Array of quality issues if any
}
```

### HarvestOpportunity
```typescript
{
  id: string                      // Unique opportunity identifier
  lotId: string                   // Reference to source Lot
  token: string                   // Token symbol
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  unrealizedLoss: number          // Absolute value of loss in USD
  gasEstimate: number             // Estimated gas cost in USD
  slippageEstimate: number        // Estimated slippage in USD
  tradingFees: number             // Estimated trading fees in USD
  netTaxBenefit: number           // Tax savings minus all costs
  guardianScore: number           // 0-10 risk score
  executionTimeEstimate: string   // Human-readable estimate (e.g., "5-10 min")
  confidence: number              // 0-100 confidence in estimates
  washSaleRisk: boolean           // Flag for potential wash sale issues
  metadata: {
    walletName: string
    venue: string                 // Exchange or DEX name
    reasons: string[]             // Why this is a good opportunity
    dataQualityFlags: string[]    // Quality issues for this opportunity
  }
}
```

### HarvestSession
```typescript
{
  sessionId: string               // Unique session identifier
  userId: string                  // User who initiated harvest
  createdAt: string               // ISO 8601 timestamp
  updatedAt: string               // ISO 8601 timestamp
  status: "draft" | "preparing" | "completed" | "failed" | "cancelled"
  opportunitiesSelected: HarvestOpportunity[]
  realizedLossesTotal: number     // Sum of all harvested losses
  netBenefitTotal: number         // Sum of all net benefits
  executionSteps: ExecutionStep[]
  exportUrl: string | null        // URL to CSV export
  activityProofHash: string | null // Cryptographic proof hash
  disclosureAccepted: boolean     // User accepted legal disclaimers
  disclosureVersion: string       // Version of disclaimers accepted
  disclosureTimestamp: string     // When disclaimers were accepted
}
```

### ExecutionStep
```typescript
{
  stepNumber: number
  description: string
  type: "on-chain" | "cex-manual"
  status: "pending" | "executing" | "completed" | "failed"
  transactionHash: string | null  // For on-chain steps
  errorMessage: string | null     // If failed
  guardianScore: number           // Risk score for this step
  timestamp: string | null        // When step completed
  preparedOnly: boolean           // True if only prepared, not executed
}
```

### UserSettings
```typescript
{
  userId: string
  estimatedMarginalRate: number   // Percentage (e.g., 0.24 for 24%)
  notificationsEnabled: boolean
  notificationThreshold: number   // Minimum net benefit in USD
  preferredWallets: string[]      // Prioritized wallet addresses
  riskTolerance: "conservative" | "moderate" | "aggressive"
  washSaleWarningsEnabled: boolean // Show wash sale warnings
}
```

## State Machine

### HarvestSession Status Flow
```
draft → preparing → completed
  ↓         ↓
cancelled  failed
```

**State Transitions:**
- `draft`: Initial state when user selects opportunities
- `draft → preparing`: User clicks "Prepare Harvest"
- `draft → cancelled`: User cancels before execution
- `preparing → completed`: All steps succeed
- `preparing → failed`: Any step fails
- `failed → preparing`: User retries after fixing issues

## API Endpoints

### Opportunity Discovery
- `GET /api/harvest/opportunities` - List all eligible harvest opportunities
- `GET /api/harvest/opportunities/:id` - Get detailed opportunity information

### Session Management
- `POST /api/harvest/sessions` - Create new harvest session (draft)
- `GET /api/harvest/sessions/:id` - Get session details
- `PATCH /api/harvest/sessions/:id` - Update session (add/remove opportunities)
- `POST /api/harvest/sessions/:id/prepare` - Begin execution preparation
- `POST /api/harvest/sessions/:id/confirm` - Mark completion with tx hashes
- `DELETE /api/harvest/sessions/:id` - Cancel session

### Execution & Results
- `GET /api/harvest/sessions/:id/status` - Poll execution status
- `GET /api/harvest/sessions/:id/export` - Download 8949-Compatible CSV
- `GET /api/harvest/sessions/:id/proof` - Get Proof-of-Activity page data

### User Configuration
- `GET /api/harvest/settings` - Get user settings
- `PUT /api/harvest/settings` - Update user settings

### Data Sync
- `POST /api/harvest/sync/wallets` - Trigger wallet data refresh
- `POST /api/harvest/sync/cex` - Trigger CEX data refresh
- `GET /api/harvest/sync/status` - Get sync status

## Requirements

### Requirement 0 — Legal, Apple, and Safety Disclosures (MANDATORY)

**User Story:** As a user, I want clear disclosures so I understand what HarvestPro does and does not do.

#### Acceptance Criteria

1. WHEN a user opens HarvestPro for the first time THEN the HarvestPro_System SHALL display a disclosure modal stating: "Informational outputs only", "No tax/legal/financial advice", "Verify with a tax professional", "All transactions require confirmation in your wallet"
2. WHEN the disclosure is accepted THEN the HarvestPro_System SHALL store the acceptance timestamp and version
3. WHEN disclosures change materially THEN the HarvestPro_System SHALL re-prompt users on next open
4. THE UI SHALL avoid "guarantee", "IRS-ready", "file now", "official form", or "compliance certified" phrasing
5. THE App Store copy and in-app copy SHALL consistently describe exports as Form 8949–compatible and tax-preparer-friendly

### Requirement 1

**User Story:** As a user, I want to connect my wallets and CEX accounts to HarvestPro, so that the system can analyze all my holdings for tax-loss harvesting opportunities.

#### Acceptance Criteria

1. WHEN a user navigates to the HarvestPro dashboard THEN the HarvestPro_System SHALL display a wallet connection interface if no wallets are connected
2. WHEN a user connects a wallet THEN the HarvestPro_System SHALL fetch the complete transaction history for that wallet
3. WHEN a user links a CEX_Account THEN the HarvestPro_System SHALL retrieve trade history, deposits, withdrawals, and current balances using read-only API credentials
4. WHEN wallet or CEX data is fetched THEN the HarvestPro_System SHALL store CEX API credentials only as ciphertext encrypted via KMS/Vault-managed keys; never log secrets; redact at ingestion; support immediate revocation
5. WHEN multiple wallets or CEX accounts are connected THEN the HarvestPro_System SHALL aggregate data from all sources into a unified view

### Requirement 2

**User Story:** As a user, I want the system to automatically detect unrealized losses across all my holdings, so that I can identify tax-loss harvesting opportunities without manual calculation.

#### Acceptance Criteria

1. WHEN the HarvestPro_System processes transaction history THEN the HarvestPro_System SHALL calculate cost basis for each lot using FIFO accounting
2. WHEN calculating unrealized PnL THEN the HarvestPro_System SHALL compare acquisition price against current market price for each lot
3. WHEN a lot has negative unrealized PnL exceeding twenty dollars THEN the HarvestPro_System SHALL flag the lot as a potential harvest opportunity
4. WHEN evaluating lots THEN the HarvestPro_System SHALL calculate holding period from acquisition date to current date
5. WHEN scanning completes THEN the HarvestPro_System SHALL complete the scan within ten seconds for the ninety-fifth percentile of requests

### Requirement 3

**User Story:** As a user, I want to see harvest opportunities filtered by eligibility criteria, so that I only review viable opportunities that provide net tax benefits.

#### Acceptance Criteria

1. WHEN determining eligibility THEN the HarvestPro_System SHALL exclude lots where unrealized loss is less than or equal to twenty dollars
2. WHEN determining eligibility THEN the HarvestPro_System SHALL exclude lots where the liquidity score falls below the minimum threshold
3. WHEN determining eligibility THEN the HarvestPro_System SHALL exclude lots where the Guardian_Score is less than three out of ten
4. WHEN determining eligibility THEN the HarvestPro_System SHALL exclude lots where estimated gas cost exceeds the unrealized loss amount
5. WHEN determining eligibility THEN the HarvestPro_System SHALL exclude lots where the token is not tradable on any supported venue

### Requirement 4

**User Story:** As a user, I want to see the net tax benefit for each harvest opportunity, so that I can prioritize opportunities with the highest return after costs.

#### Acceptance Criteria

1. WHEN calculating net benefit THEN the HarvestPro_System SHALL multiply unrealized loss by the user's estimatedMarginalRate (optional) to estimate tax impact
2. WHEN calculating net benefit THEN the HarvestPro_System SHALL subtract estimated gas cost from tax impact
3. WHEN calculating net benefit THEN the HarvestPro_System SHALL subtract estimated slippage cost from tax impact
4. WHEN calculating net benefit THEN the HarvestPro_System SHALL subtract trading fees from tax impact
5. WHEN net benefit is less than or equal to zero THEN the HarvestPro_System SHALL tag the opportunity as not recommended

### Requirement 5

**User Story:** As a user, I want to view harvest opportunities in a dashboard with Hunter-style cards, so that I can quickly scan and select opportunities using a familiar interface.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the HarvestPro_System SHALL display a header containing the AlphaWhale logo, title, last updated timestamp, connect wallet button, demo chip, live chip, and AI digest button
2. WHEN the dashboard loads THEN the HarvestPro_System SHALL display a horizontally scrollable filter chip row with chips for All, High Benefit, Short-Term Loss, Long-Term Loss, Wallet filters, CEX Holdings, Gas Efficient, Illiquid, Safe, High Risk, and Favorites
3. WHEN the dashboard loads THEN the HarvestPro_System SHALL display a Harvest Summary Card showing total harvestable loss, estimated net benefit, eligible tokens count, and gas efficiency score
4. WHEN high-risk positions exist THEN the HarvestPro_System SHALL display a yellow warning banner in the Harvest Summary Card stating that some opportunities have elevated risk
5. WHEN displaying harvest opportunities THEN the HarvestPro_System SHALL render each opportunity as a Hunter-style card containing category tag, risk chip, title, subtitle, metric strip with net benefit, confidence, Guardian_Score, execution time, and a Prepare Harvest button

### Requirement 6

**User Story:** As a user, I want to filter harvest opportunities by various criteria, so that I can focus on opportunities matching my preferences.

#### Acceptance Criteria

1. WHEN a user selects a filter chip THEN the HarvestPro_System SHALL update the displayed opportunities to show only those matching the selected filter
2. WHEN the High Benefit filter is active THEN the HarvestPro_System SHALL display only opportunities where net benefit exceeds a high threshold
3. WHEN the Short-Term Loss filter is active THEN the HarvestPro_System SHALL display only opportunities where holding period is less than or equal to three hundred sixty-five days
4. WHEN the Long-Term Loss filter is active THEN the HarvestPro_System SHALL display only opportunities where holding period exceeds three hundred sixty-five days
5. WHEN a wallet-specific filter is active THEN the HarvestPro_System SHALL display only opportunities from that specific wallet

### Requirement 7

**User Story:** As a user, I want to view detailed information about a harvest opportunity in a modal, so that I can understand the execution plan before proceeding.

#### Acceptance Criteria

1. WHEN a user clicks a harvest opportunity card THEN the HarvestPro_System SHALL open a full-screen modal on mobile or centered modal on desktop
2. WHEN the modal opens THEN the HarvestPro_System SHALL display a header with the harvest plan title including the token symbol
3. WHEN the modal opens THEN the HarvestPro_System SHALL display a summary section showing unrealized loss, net benefit, and key metrics
4. WHEN high risk is detected THEN the HarvestPro_System SHALL display a Guardian warning banner in the modal
5. WHEN the modal opens THEN the HarvestPro_System SHALL display step-by-step actions with step numbers, descriptions, and status icons

### Requirement 8

**User Story:** As a user, I want to prepare harvest transactions through the Action_Center, so that I can review and confirm transactions in my external wallet.

#### Acceptance Criteria

1. WHEN a user initiates harvest execution THEN the HarvestPro_System SHALL create a harvest session with status set to preparing
2. WHEN preparing transactions THEN the HarvestPro_System SHALL prepare and route transactions for explicit user confirmation in the user's external wallet
3. WHEN a transaction is pending THEN the HarvestPro_System SHALL display a spinner animation and per-step Guardian_Score
4. WHEN a transaction completes THEN the HarvestPro_System SHALL update the step status to complete and display a success indicator
5. WHEN a transaction fails THEN the HarvestPro_System SHALL update the step status to failed, display an error message, and halt execution

### Requirement 9

**User Story:** As a user with CEX holdings, I want to receive step-by-step instructions for manual CEX execution, so that I can complete the harvest on exchanges that don't support API trading.

#### Acceptance Criteria

1. WHEN a harvest opportunity involves CEX holdings THEN the HarvestPro_System SHALL display a CEX instruction panel in the execution flow
2. WHEN displaying CEX instructions THEN the HarvestPro_System SHALL provide numbered steps specific to the exchange platform
3. WHEN displaying CEX instructions THEN the HarvestPro_System SHALL include the exact token pair, quantity, and order type
4. WHEN a user marks a CEX step as complete THEN the HarvestPro_System SHALL update the step status and proceed to the next step
5. WHEN all CEX steps are marked complete THEN the HarvestPro_System SHALL proceed to the success screen

### Requirement 10

**User Story:** As a user, I want to see a success screen after completing a harvest, so that I receive confirmation and can access export files.

#### Acceptance Criteria

1. WHEN all harvest steps complete successfully THEN the HarvestPro_System SHALL display a success screen with a centered achievement-style card
2. WHEN the success screen displays THEN the HarvestPro_System SHALL show a confetti animation
3. WHEN the success screen displays THEN the HarvestPro_System SHALL show the total losses harvested in dollars
4. WHEN the success screen displays THEN the HarvestPro_System SHALL provide a Download 8949-Compatible CSV button
5. WHEN the success screen displays THEN the HarvestPro_System SHALL provide a View Proof-of-Activity button

### Requirement 11

**User Story:** As a user, I want to download a Form 8949-style CSV export, so that I can provide accurate records to my tax preparer or import into tax software.

#### Acceptance Criteria

1. WHEN a user clicks the Download 8949-Compatible CSV button THEN the HarvestPro_System SHALL generate a CSV file within two seconds
2. WHEN generating the CSV THEN the HarvestPro_System SHALL include columns for description, date acquired, date sold, proceeds, cost basis, and gain or loss
3. WHEN generating the CSV THEN the HarvestPro_System SHALL format all monetary values with two decimal places
4. WHEN generating the CSV THEN the HarvestPro_System SHALL include a row for each harvested lot
5. WHEN the CSV is generated THEN the HarvestPro_System SHALL ensure the file opens correctly in Excel, Google Sheets, and Numbers

### Requirement 12

**User Story:** As a user, I want to view a Proof-of-Activity page with cryptographic verification, so that I have an auditable record of my harvest execution.

#### Acceptance Criteria

1. WHEN a user navigates to the Proof-of-Activity page THEN the HarvestPro_System SHALL display a header with the HarvestPro title
2. WHEN the page loads THEN the HarvestPro_System SHALL display a summary section showing total losses harvested, net benefit, and execution timestamp
3. WHEN the page loads THEN the HarvestPro_System SHALL display a list of all executed steps with transaction hashes for on-chain actions
4. WHEN the page loads THEN the HarvestPro_System SHALL display a cryptographic activityProofHash generated from the harvest session data
5. WHEN the page loads THEN the HarvestPro_System SHALL provide export buttons for downloading the proof as PDF or sharing via link

### Requirement 13

**User Story:** As a user, I want to receive notifications about harvest opportunities, so that I can take action at optimal times.

#### Acceptance Criteria

1. WHEN a new harvest opportunity exceeds the notification threshold THEN the HarvestPro_System SHALL send a push notification to the user's device
2. WHEN a new harvest opportunity exceeds the notification threshold THEN the HarvestPro_System SHALL send an email notification to the user's registered email address
3. WHEN the date is between December first and December thirty-first THEN the HarvestPro_System SHALL send a year-end reminder notification
4. WHEN sending notifications THEN the HarvestPro_System SHALL include the token symbol and estimated net benefit
5. WHEN a user clicks a notification THEN the HarvestPro_System SHALL navigate directly to the relevant harvest opportunity

### Requirement 14

**User Story:** As a user, I want to see clear error messages when issues occur, so that I understand what went wrong and how to resolve it.

#### Acceptance Criteria

1. WHEN no wallets are connected THEN the HarvestPro_System SHALL display a Guardian-style warning banner stating that wallet connection is required
2. WHEN a CEX API error occurs THEN the HarvestPro_System SHALL display an error banner with the exchange name and suggested resolution steps
3. WHEN gas estimation fails THEN the HarvestPro_System SHALL display an error banner indicating network issues and suggest retrying
4. WHEN a swap is illiquid THEN the HarvestPro_System SHALL display a warning banner indicating high slippage risk before execution
5. WHEN execution fails mid-process THEN the HarvestPro_System SHALL display an error banner with the failed step, error message, and option to retry or cancel

### Requirement 15

**User Story:** As a user, I want the system to classify harvest opportunities by risk level, so that I can make informed decisions about which opportunities to pursue.

#### Acceptance Criteria

1. WHEN a lot has a Guardian_Score less than or equal to three THEN the HarvestPro_System SHALL classify the opportunity as HIGH RISK
2. WHEN a lot has a Guardian_Score between four and six inclusive THEN the HarvestPro_System SHALL classify the opportunity as MEDIUM RISK
3. WHEN a lot has a Guardian_Score greater than or equal to seven THEN the HarvestPro_System SHALL classify the opportunity as LOW RISK
4. WHEN a lot has a liquidity flag set to false THEN the HarvestPro_System SHALL classify the opportunity as HIGH RISK regardless of Guardian_Score
5. WHEN displaying an opportunity THEN the HarvestPro_System SHALL show the risk classification as a colored chip with green for LOW RISK, amber for MEDIUM RISK, and red for HIGH RISK

### Requirement 16

**User Story:** As a system administrator, I want all calculations to be deterministic and auditable, so that we can verify accuracy and maintain user trust.

#### Acceptance Criteria

1. WHEN calculating cost basis THEN the HarvestPro_System SHALL use FIFO accounting consistently across all lots
2. WHEN calculating net benefit THEN the HarvestPro_System SHALL use the same formula for all opportunities with identical parameters
3. WHEN generating exports THEN the HarvestPro_System SHALL include all source data used in calculations
4. WHEN storing harvest sessions THEN the HarvestPro_System SHALL record all input parameters and calculation results
5. WHEN generating activityProofHash THEN the HarvestPro_System SHALL use a cryptographic hash function that produces identical output for identical input

### Requirement 17

**User Story:** As a system administrator, I want the system to maintain high performance and reliability, so that users have a smooth experience.

#### Acceptance Criteria

1. WHEN processing wallet data THEN the HarvestPro_System SHALL complete scans within ten seconds for ninety-five percent of requests
2. WHEN generating export files THEN the HarvestPro_System SHALL complete generation within two seconds
3. WHEN storing sensitive data THEN the HarvestPro_System SHALL encrypt all API credentials and private information
4. WHEN measuring uptime THEN the HarvestPro_System SHALL maintain availability of ninety-nine point nine percent or higher
5. WHEN handling concurrent users THEN the HarvestPro_System SHALL maintain consistent performance under normal load conditions

### Requirement 18

**User Story:** As a user, I want the interface to be responsive and mobile-friendly, so that I can manage harvests from any device.

#### Acceptance Criteria

1. WHEN viewing the dashboard on mobile THEN the HarvestPro_System SHALL display the header with title stacked above buttons
2. WHEN viewing harvest cards on mobile THEN the HarvestPro_System SHALL render the Prepare Harvest button as full-width
3. WHEN opening a modal on mobile THEN the HarvestPro_System SHALL display the modal as full-screen
4. WHEN opening a modal on desktop THEN the HarvestPro_System SHALL display the modal as a centered overlay with maximum width
5. WHEN scrolling the filter chip row THEN the HarvestPro_System SHALL enable horizontal scrolling on all screen sizes

### Requirement 19

**User Story:** As a user, I want consistent visual design matching Hunter and Guardian, so that HarvestPro feels like a natural part of AlphaWhale.

#### Acceptance Criteria

1. WHEN rendering any card THEN the HarvestPro_System SHALL use white background, twelve-pixel rounded corners, and subtle shadow matching Guardian panels
2. WHEN rendering the header THEN the HarvestPro_System SHALL use twenty-four-pixel semi-bold font for the title matching Hunter header style
3. WHEN rendering filter chips THEN the HarvestPro_System SHALL use thirty-two-pixel height, sixteen-pixel border radius, and primary blue for active state matching Hunter filters
4. WHEN rendering metric strips THEN the HarvestPro_System SHALL use uppercase grey titles and medium bold values with spacing matching Hunter cards
5. WHEN rendering buttons THEN the HarvestPro_System SHALL use primary blue color and border radius matching Hunter's Join Quest button

### Requirement 20

**User Story:** As a user, I want to configure my tax rate and preferences, so that net benefit calculations reflect my personal tax situation.

#### Acceptance Criteria

1. WHEN a user accesses settings THEN the HarvestPro_System SHALL provide an input field for tax rate as a percentage labeled "Estimated marginal rate (optional)"
2. WHEN a user updates their tax rate THEN the HarvestPro_System SHALL recalculate net benefits for all opportunities using the new rate
3. WHEN a user sets notification preferences THEN the HarvestPro_System SHALL store the minimum threshold for harvest opportunity notifications
4. WHEN a user enables or disables notifications THEN the HarvestPro_System SHALL respect the preference for all future notifications
5. WHEN a user saves settings THEN the HarvestPro_System SHALL persist the settings and apply them immediately to all calculations

### Requirement 21 — Form 8949–Compatible Export Standard (NOT "Tax Filing Ready")

**User Story:** As a user, I want exports that my CPA or tax software can import reliably.

#### Acceptance Criteria

1. WHEN a user downloads the export THEN the HarvestPro_System SHALL generate a Form 8949–compatible CSV (not an IRS filing)
2. THE export SHALL include per-disposition rows with: description (asset + symbol), date_acquired, date_disposed, proceeds_usd, cost_basis_usd, gain_or_loss_usd, source (wallet/cex + address/exchange name), tx_hash_or_trade_id, quantity, term (SHORT|LONG), network, fee_usd (if known)
3. THE export SHALL include a header note row (or companion JSON metadata) stating: accounting method (FIFO), pricing sources used, timestamp range covered
4. THE UI SHALL display: "This file is for import/review and is not a tax filing"
5. THE export SHALL open correctly in Excel, Google Sheets, and Numbers

### Requirement 22 — Action_Center Execution Guardrails (Trinity Correct)

**User Story:** As a user, I want HarvestPro actions to be safe and fully under my control.

#### Acceptance Criteria

1. WHEN a user clicks "Prepare Harvest" THEN the HarvestPro_System SHALL open an Action_Center flow that prepares transactions but does not auto-sign
2. WHEN a transaction is prepared THEN the HarvestPro_System SHALL display: exact token + amount, venue (DEX/CEX), estimated gas/fees/slippage, Guardian risk context
3. WHEN the user proceeds THEN the HarvestPro_System SHALL hand off to the external wallet for confirmation
4. THE HarvestPro_System SHALL NOT perform background signing, auto-execution, or delegated signing by default
5. THE HarvestPro_System SHALL store an immutable session log of what was prepared vs what was confirmed

### Requirement 23 — Data Quality & Assumption Transparency (Avoid "wrong 8949" disasters)

**User Story:** As a user, I want to understand when data is incomplete so I don't export wrong records.

#### Acceptance Criteria

1. WHEN cost basis cannot be confidently computed for a lot THEN the HarvestPro_System SHALL label it cost_basis_confidence = LOW and exclude it from "Recommended" by default
2. WHEN a transaction is missing pricing data THEN the HarvestPro_System SHALL: show "price unavailable" and use a fallback price source only if marked as fallback
3. WHEN transfers occur between wallets THEN the HarvestPro_System SHALL preserve lot continuity where possible and label transfer_inferred = true if inferred
4. THE export SHALL include a data_quality_flags column (semicolon-separated) for each row when applicable
5. THE UI SHALL provide a "What assumptions were used?" panel in the modal

### Requirement 24 — Proof-of-Activity Integrity Record (Rename + clarify)

**User Story:** As a user, I want an auditable integrity record of what the system calculated and what I executed.

#### Acceptance Criteria

1. WHEN a HarvestSession completes THEN the HarvestPro_System SHALL generate a Proof-of-Activity record that includes: inputs (selected opportunities, tax rate, fee assumptions), outputs (computed lots, net benefit estimates), execution outcomes (confirmed tx hashes / manual completion markers)
2. THE HarvestPro_System SHALL compute activityProofHash = SHA-256(canonical_json(session))
3. THE canonical JSON serialization SHALL be deterministic (sorted keys, fixed decimals)
4. THE Proof-of-Activity page SHALL explicitly state: "Integrity record for reference", "Not legal or tax certification"
5. THE Proof-of-Activity SHALL be exportable as PDF for user records

### Requirement 25 — "Tax Rate" UX Safe Mode (Reduce advice perception)

**User Story:** As a user, I want tax impact estimates without being misled into thinking it's advice.

#### Acceptance Criteria

1. WHEN a user enters a tax rate THEN the UI SHALL label it "Estimated marginal rate (optional)"
2. WHEN empty THEN the HarvestPro_System SHALL use a conservative default range display (e.g., "Estimated impact range") rather than a single number
3. THE UI SHALL provide a tooltip: "Estimates only; confirm with a tax professional"
4. THE net benefit label SHALL be "Estimated tax impact after costs" (not "return")
5. THE HarvestPro_System SHALL not rank opportunities solely by tax impact unless the user explicitly chooses "Sort by estimated tax impact"

### Requirement 26 — CEX Credential Security & SOC-2-lite Controls

**User Story:** As a compliance officer, I want strong safeguards for read-only exchange connections.

#### Acceptance Criteria

1. THE HarvestPro_System SHALL only accept read-only API keys for CEX integrations (no trading permissions)
2. THE HarvestPro_System SHALL validate permissions at connection time and refuse keys with trading/withdrawal scopes
3. THE HarvestPro_System SHALL encrypt CEX credentials at rest using a KMS/Vault-managed key and store only ciphertext
4. THE HarvestPro_System SHALL support credential rotation and revocation (user can delete instantly)
5. THE HarvestPro_System SHALL maintain audit logs for credential create/update/delete events (who/when/what)

### Requirement 27 — Apple-Safe UI Copy Rules (Stops future rejection)

**User Story:** As a product owner, I want consistent language that won't trigger Apple review issues.

#### Acceptance Criteria

1. THE UI SHALL avoid these words in CTA/buttons: "Execute", "Auto", "Guaranteed", "IRS-ready", "File", "Submit"
2. Preferred CTAs: "Prepare Harvest", "Review Plan", "Open in Wallet", "Download 8949-Compatible CSV"
3. THE success screen SHALL say: "Activity recorded", "Export ready for tax software/CPA"
4. THE HarvestPro_System SHALL centralize copy strings so changes apply globally
5. A lint rule (or unit test list) SHALL fail builds if forbidden phrases appear in HarvestPro UI copy

### Requirement 28 — Wash Sale / Regulatory Uncertainty Guardrail (Crypto-specific)

**User Story:** As a user, I want warnings when rules are unclear so I don't rely on the app incorrectly.

#### Acceptance Criteria

1. WHEN the user attempts to "sell and immediately rebuy" the same asset THEN the HarvestPro_System SHALL display a warning: "Wash sale rules may apply; consult a tax professional"
2. WHEN offering any "re-entry" suggestion THEN the HarvestPro_System SHALL default to OFF unless the user explicitly enables it
3. THE export SHALL include a flag if re-entry occurred within a short window (configurable)
4. THE UI SHALL clearly separate "loss realization" from "portfolio strategy"
5. THE HarvestPro_System SHALL not present re-entry timing as a recommendation

### Requirement 29 — External Wallet Handoff Safety

**User Story:** As a user, I want wallet handoffs to be safe and predictable on mobile.

#### Acceptance Criteria

1. WHEN routing a prepared action THEN the HarvestPro_System SHALL use approved wallet connection methods (WalletConnect / universal links) and SHALL NOT embed raw private deep links without validation
2. WHEN a wallet is not installed THEN the HarvestPro_System SHALL show a safe fallback flow (App Store link or QR handoff)
3. WHEN an external link is opened THEN the HarvestPro_System SHALL show a confirmation modal with the destination wallet and network
4. THE HarvestPro_System SHALL block handoffs to unknown wallet schemes/domains by default
5. THE Proof_of_Activity SHALL record the wallet handoff method used (WalletConnect/session id)

### Requirement 30 — Demo Mode

**User Story:** As a user, I want to explore HarvestPro features before connecting my wallet, so that I can understand the value proposition.

#### Acceptance Criteria

1. WHEN a user opens HarvestPro without a connected wallet THEN the HarvestPro_System SHALL display sample harvest opportunities with realistic data
2. WHEN in demo mode THEN the HarvestPro_System SHALL show clear "Demo Mode" badges on all cards and data
3. WHEN a user interacts with demo opportunities THEN the HarvestPro_System SHALL show data quality warnings and export samples
4. WHEN a user clicks "Prepare Harvest" in demo mode THEN the HarvestPro_System SHALL show a modal explaining the feature and prompting wallet connection
5. WHEN a user downloads exports in demo mode THEN the HarvestPro_System SHALL generate sample CSV files clearly marked as "DEMO DATA - NOT FOR TAX FILING"