# Requirements Document

## Version History

- **v1 (Requirements 1-20)**: Core tax-loss harvesting for retail users
  - Wallet and CEX integration
  - Opportunity detection and net benefit calculation
  - Guided execution through Action Engine
  - Compliance-ready exports with cryptographic proof

- **v2 (Requirements 21-25)**: Institutional-grade enhancements
  - MEV-aware execution and private RPC routing
  - Economic substance validation
  - Proxy asset selection for exposure maintenance
  - Institutional guardrails and audit-quality reporting

- **v3 (Requirements 26-29)**: Enterprise features
  - Institutional custody integration (Fireblocks, Copper)
  - Maker/checker governance workflows
  - Pre-trade sanctions screening (KYT/AML)
  - Intelligent order routing (TWAP/VWAP)

## Introduction

HarvestPro is a tax-loss harvesting module for AlphaWhale that enables users to identify, optimize, and execute cryptocurrency tax-loss harvesting opportunities across connected wallets and centralized exchange (CEX) accounts.

In **v1**, the focus is on accurate detection of unrealized losses, net tax benefit calculation (after gas and slippage), guided execution through the Action Engine, and compliance-ready export files with cryptographic proof of execution.

In **v2 (Institutional Grade)**, HarvestPro is extended for high-net-worth individuals (HNWIs) and funds with:
- MEV-aware execution and private RPC routing
- Economic-substance-aware policies
- Proxy asset selection to maintain exposure
- Institutional guardrails and audit-quality Proof-of-Harvest

In **v3 (Enterprise)**, HarvestPro adds capabilities for regulated funds and large institutions:
- Institutional custody integration (Fireblocks, Copper)
- Maker/checker governance workflows
- Pre-trade sanctions screening (KYT/AML)
- Intelligent order routing (TWAP/VWAP)

## Glossary

### Core Terms (v1)

- **HarvestPro System**: The tax-loss harvesting module within AlphaWhale
- **User**: An AlphaWhale account holder with connected wallets or CEX accounts
- **Wallet**: A blockchain wallet connected to the User's account
- **CEX Account**: A centralized exchange account linked to the User's profile
- **Lot**: A specific acquisition of a token at a particular time and price
- **Harvest Opportunity**: An eligible lot with unrealized loss that can be sold for tax benefits
- **Action Engine**: AlphaWhale's transaction execution system
- **Guardian Score**: AlphaWhale's risk assessment metric (scale 0-10)
- **Net Tax Benefit**: Tax savings minus execution costs (gas, slippage, fees)
- **Proof-of-Harvest**: Cryptographically verifiable record of completed harvest
- **Form 8949**: IRS tax form for reporting capital gains and losses
- **FIFO**: First-In-First-Out accounting method for cost basis
- **Unrealized Loss**: Negative difference between acquisition price and current price
- **Liquidity Score**: Metric indicating ease of selling a token without price impact
- **Slippage**: Price difference between expected and actual execution price

### Institutional Terms (v2)

- **Proxy Asset**: A correlated token used to maintain market exposure without triggering "wash sale" or "substantially identical" issues (e.g., ETH → stETH)
- **MEV (Maximal Extractable Value)**: Value that block producers or validators can extract by reordering or sandwiching transactions in the mempool
- **Private RPC**: A transaction submission endpoint (e.g., Flashbots) that bypasses the public mempool to reduce MEV risk
- **Economic Substance**: Legal and financial concept requiring that transactions have real economic risk or impact beyond tax optimization
- **Dust**: Token balances with negligible value that clutter tax reporting and are uneconomical to trade
- **Guardrails**: Configurable risk limits that prevent execution beyond user-defined thresholds (e.g., max daily loss, max position size)

### Enterprise Terms (v3)

- **MPC Custodian**: Multi-Party Computation custody provider (e.g., Fireblocks, Copper) that manages private keys through distributed key shares
- **Co-Signing**: Process where custody provider requires API credentials to approve and sign transactions without exposing private keys
- **Maker/Checker**: Governance pattern requiring dual authorization where one party creates a transaction and another approves it
- **OFAC**: Office of Foreign Assets Control - US Treasury department that maintains sanctions lists
- **KYT (Know Your Transaction)**: Real-time transaction monitoring to detect interactions with sanctioned addresses or high-risk entities
- **TWAP (Time-Weighted Average Price)**: Order execution strategy that splits large orders into smaller chunks executed at regular intervals
- **VWAP (Volume-Weighted Average Price)**: Order execution strategy that splits orders based on historical volume patterns
- **Iceberg Order**: Large order split into smaller visible portions to minimize market impact

## Data Models

### Lot
```typescript
{
  lotId: string                    // Unique identifier for this lot
  token: string                    // Token symbol (e.g., "ETH", "BTC")
  walletOrCex: string             // Source identifier (wallet address or CEX name)
  
  // v2 additions
  chainId?: number                 // EVM chain id or chain identifier
  venueType?: "WALLET" | "CEX" | "DEFI"
  venueName?: string               // e.g. "Aave", "Uniswap", "Binance"
  
  acquiredAt: string              // ISO 8601 timestamp of acquisition
  acquiredQty: number             // Quantity of tokens acquired
  acquiredPriceUsd: number        // Price per token at acquisition in USD
  currentPriceUsd: number         // Current market price per token in USD
  unrealizedPnl: number           // (currentPrice - acquiredPrice) * quantity
  holdingPeriodDays: number       // Days between acquisition and now
  longTerm: boolean               // True if holdingPeriodDays > 365
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  liquidityScore: number          // 0-100 scale
  guardianScore: number           // 0-10 scale
  
  // v2 additions
  mevRiskScore?: number            // 0-10 scale for MEV exposure
  
  eligibleForHarvest: boolean     // Passes all eligibility criteria
}
```

### HarvestOpportunity
```typescript
{
  id: string                      // Unique opportunity identifier
  lotId: string                   // Reference to source Lot
  token: string                   // Token symbol
  tokenLogoUrl: string            // URL to token logo image (required for Hunter-style cards)
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  unrealizedLoss: number          // Absolute value of loss in USD
  gasEstimate: number             // Estimated gas cost in USD
  slippageEstimate: number        // Estimated slippage in USD
  tradingFees: number             // Estimated trading fees in USD
  
  // v2 additions
  taxRateUsed?: number             // Effective tax rate applied
  mevRiskCostUsd?: number          // Optional haircut for MEV risk
  
  netTaxBenefit: number           // Tax savings minus all costs
  guardianScore: number           // 0-10 risk score
  executionTimeEstimate: string   // Human-readable estimate (e.g., "5-10 min")
  confidence: number              // 0-100 confidence in estimates
  
  // v2 additions
  economicSubstanceFlag?: "PASS" | "WARN" | "BLOCKED"
  proxyAssetSymbol?: string        // If a proxy is part of the plan
  
  metadata: {
    walletName: string
    venue: string                 // Exchange or DEX name
    reasons: string[]             // Why this is a good opportunity
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
  status: "draft" | "executing" | "completed" | "failed" | "cancelled" | "awaiting_approval"  // v3: added awaiting_approval
  opportunitiesSelected: HarvestOpportunity[]
  realizedLossesTotal: number     // Sum of all harvested losses
  netBenefitTotal: number         // Sum of all net benefits
  
  // v2 additions
  executionStrategy?: "IMMEDIATE" | "TWAP" | "MANUAL"
  mevProtectionMode?: "REQUIRED" | "PREFERRED" | "DISABLED"
  jurisdictionCode?: string        // e.g. "US", "EU"
  economicSubstanceStatus?: "PASS" | "WARN" | "BLOCKED"
  
  executionSteps: ExecutionStep[]
  exportUrl: string | null        // URL to CSV export
  proofHash: string | null        // Cryptographic proof hash
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
  cexPlatform?: string            // e.g., "Binance", "Coinbase" (for cex-manual type)
  
  // v2 additions
  privateRpcUsed?: boolean
  mevProtectionProvider?: string   // e.g. "Flashbots"
  gasPaidUsd?: number
  slippageRealizedBps?: number
  
  errorMessage: string | null     // If failed
  guardianScore: number           // Risk score for this step
  timestamp: string | null        // When step completed
  durationMs?: number             // Execution duration in milliseconds (for progress tracking)
}
```

### UserSettings
```typescript
{
  userId: string
  taxRate: number                 // Percentage (e.g., 0.24 for 24%)
  notificationsEnabled: boolean
  notificationThreshold: number   // Minimum net benefit in USD
  preferredWallets: string[]      // Prioritized wallet addresses
  riskTolerance: "conservative" | "moderate" | "aggressive"
  
  // v2 additions - institutional guardrails
  maxDailyRealizedLossUsd?: number
  maxSingleTradeNotionalUsd?: number
  maxSlippageBps?: number
  requirePrivateRpc?: boolean
  allowCexAutoTrade?: boolean
  
  // v3 additions - enterprise features
  custodyProvider?: "FIREBLOCKS" | "COPPER" | "NONE"
  custodyApiCredentials?: string   // Encrypted co-signing credentials
  approvalThresholdUsd?: number    // Maker/checker threshold
  approverRole?: string            // User role required for approval
  sanctionsScreeningEnabled?: boolean
  orderRoutingStrategy?: "IMMEDIATE" | "TWAP" | "VWAP"
  twapDurationMinutes?: number
  limitPriceFloor?: number         // Safety floor for TWAP execution
}
```

## State Machine

### HarvestSession Status Flow
```
draft → executing → completed
  ↓         ↓
cancelled  failed
```

**State Transitions:**
- `draft`: Initial state when user selects opportunities
- `draft → executing`: User clicks "Execute Harvest"
- `draft → cancelled`: User cancels before execution
- `executing → completed`: All steps succeed
- `executing → failed`: Any step fails
- `failed → executing`: User retries after fixing issues

## API Endpoints

### Opportunity Discovery
- `GET /api/harvest/opportunities` - List all eligible harvest opportunities
- `GET /api/harvest/opportunities/:id` - Get detailed opportunity information

### Session Management
- `POST /api/harvest/sessions` - Create new harvest session (draft)
- `GET /api/harvest/sessions/:id` - Get session details
- `PATCH /api/harvest/sessions/:id` - Update session (add/remove opportunities)
- `POST /api/harvest/sessions/:id/execute` - Begin execution
- `DELETE /api/harvest/sessions/:id` - Cancel session

### Execution & Results
- `GET /api/harvest/sessions/:id/status` - Poll execution status
- `GET /api/harvest/sessions/:id/export?type=csv` - Download CSV export (Form 8949)
- `GET /api/harvest/sessions/:id/export?type=pdf` - Download PDF export
- `GET /api/harvest/sessions/:id/proof` - Get proof-of-harvest page data

### User Configuration
- `GET /api/harvest/settings` - Get user settings
- `PUT /api/harvest/settings` - Update user settings

### Data Sync
- `POST /api/harvest/sync/wallets` - Trigger wallet data refresh
- `POST /api/harvest/sync/cex` - Trigger CEX data refresh
- `GET /api/harvest/sync/status` - Get sync status

## Requirements

### Requirement 1

**User Story:** As a user, I want to connect my wallets and CEX accounts to HarvestPro, so that the system can analyze all my holdings for tax-loss harvesting opportunities.

#### Acceptance Criteria

1. WHEN a user navigates to the HarvestPro dashboard THEN the HarvestPro System SHALL display a wallet connection interface if no wallets are connected
2. WHEN a user connects a wallet THEN the HarvestPro System SHALL fetch the complete transaction history for that wallet
3. WHEN a user links a CEX account THEN the HarvestPro System SHALL retrieve trade history, deposits, withdrawals, and current balances using read-only API credentials
4. WHEN wallet or CEX data is fetched THEN the HarvestPro System SHALL encrypt and store API credentials using industry-standard encryption
5. WHEN multiple wallets or CEX accounts are connected THEN the HarvestPro System SHALL aggregate data from all sources into a unified view

### Requirement 2

**User Story:** As a user, I want the system to automatically detect unrealized losses across all my holdings, so that I can identify tax-loss harvesting opportunities without manual calculation.

#### Acceptance Criteria

1. WHEN the HarvestPro System processes transaction history THEN the HarvestPro System SHALL calculate cost basis for each lot using FIFO accounting
2. WHEN calculating unrealized PnL THEN the HarvestPro System SHALL compare acquisition price against current market price for each lot
3. WHEN a lot has negative unrealized PnL exceeding twenty dollars THEN the HarvestPro System SHALL flag the lot as a potential harvest opportunity
4. WHEN evaluating lots THEN the HarvestPro System SHALL calculate holding period from acquisition date to current date
5. WHEN scanning completes THEN the HarvestPro System SHALL complete the scan within ten seconds for the ninety-fifth percentile of requests

### Requirement 3

**User Story:** As a user, I want to see harvest opportunities filtered by eligibility criteria, so that I only review viable opportunities that provide net tax benefits.

#### Acceptance Criteria

1. WHEN determining eligibility THEN the HarvestPro System SHALL exclude lots where unrealized loss is less than or equal to twenty dollars
2. WHEN determining eligibility THEN the HarvestPro System SHALL exclude lots where the liquidity score falls below the minimum threshold
3. WHEN determining eligibility THEN the HarvestPro System SHALL exclude lots where the Guardian score is less than three out of ten
4. WHEN determining eligibility THEN the HarvestPro System SHALL exclude lots where estimated gas cost exceeds the unrealized loss amount
5. WHEN determining eligibility THEN the HarvestPro System SHALL exclude lots where the token is not tradable on any supported venue

### Requirement 4

**User Story:** As a user, I want to see the net tax benefit for each harvest opportunity, so that I can prioritize opportunities with the highest return after costs.

#### Acceptance Criteria

1. WHEN calculating net benefit THEN the HarvestPro System SHALL multiply unrealized loss by the user's configured tax rate to estimate tax savings
2. WHEN calculating net benefit THEN the HarvestPro System SHALL subtract estimated gas cost from tax savings
3. WHEN calculating net benefit THEN the HarvestPro System SHALL subtract estimated slippage cost from tax savings
4. WHEN calculating net benefit THEN the HarvestPro System SHALL subtract trading fees from tax savings
5. WHEN net benefit is less than or equal to zero THEN the HarvestPro System SHALL tag the opportunity as not recommended

### Requirement 5

**User Story:** As a user, I want to view harvest opportunities in a dashboard with Hunter-style cards, so that I can quickly scan and select opportunities using a familiar interface.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the HarvestPro System SHALL display a header containing the AlphaWhale logo, title, last updated timestamp, connect wallet button, demo chip, live chip, and AI digest button
2. WHEN the dashboard loads THEN the HarvestPro System SHALL display a horizontally scrollable filter chip row with chips for All, High Benefit, Short-Term Loss, Long-Term Loss, Wallet filters, CEX Holdings, Gas Efficient, Illiquid, Safe, High Risk, and Favorites
3. WHEN the dashboard loads THEN the HarvestPro System SHALL display a Harvest Summary Card showing total harvestable loss, estimated net benefit, eligible tokens count, and gas efficiency score
4. WHEN high-risk positions exist THEN the HarvestPro System SHALL display a yellow warning banner in the Harvest Summary Card stating that some opportunities have elevated risk
5. WHEN displaying harvest opportunities THEN the HarvestPro System SHALL render each opportunity as a Hunter-style card containing category tag, risk chip, title, subtitle, metric strip with net benefit, confidence, Guardian score, execution time, and a Start Harvest button

### Requirement 6

**User Story:** As a user, I want to filter harvest opportunities by various criteria, so that I can focus on opportunities matching my preferences.

#### Acceptance Criteria

1. WHEN a user selects a filter chip THEN the HarvestPro System SHALL update the displayed opportunities to show only those matching the selected filter
2. WHEN the High Benefit filter is active THEN the HarvestPro System SHALL display only opportunities where net benefit exceeds a high threshold
3. WHEN the Short-Term Loss filter is active THEN the HarvestPro System SHALL display only opportunities where holding period is less than or equal to three hundred sixty-five days
4. WHEN the Long-Term Loss filter is active THEN the HarvestPro System SHALL display only opportunities where holding period exceeds three hundred sixty-five days
5. WHEN a wallet-specific filter is active THEN the HarvestPro System SHALL display only opportunities from that specific wallet

### Requirement 7

**User Story:** As a user, I want to view detailed information about a harvest opportunity in a modal, so that I can understand the execution plan before proceeding.

#### Acceptance Criteria

1. WHEN a user clicks a harvest opportunity card THEN the HarvestPro System SHALL open a full-screen modal on mobile or centered modal on desktop
2. WHEN the modal opens THEN the HarvestPro System SHALL display a header with the harvest plan title including the token symbol
3. WHEN the modal opens THEN the HarvestPro System SHALL display a summary section showing unrealized loss, net benefit, and key metrics
4. WHEN high risk is detected THEN the HarvestPro System SHALL display a Guardian warning banner in the modal
5. WHEN the modal opens THEN the HarvestPro System SHALL display step-by-step actions with step numbers, descriptions, and status icons

### Requirement 8

**User Story:** As a user, I want to execute harvest transactions through the Action Engine, so that I can complete the harvest with guided on-chain execution.

#### Acceptance Criteria

1. WHEN a user initiates harvest execution THEN the HarvestPro System SHALL create a harvest session with status set to executing
2. WHEN executing on-chain transactions THEN the HarvestPro System SHALL display the Action Engine's transaction confirmation modal
3. WHEN a transaction is pending THEN the HarvestPro System SHALL display a spinner animation and per-step Guardian score
4. WHEN a transaction completes THEN the HarvestPro System SHALL update the step status to complete and display a success indicator
5. WHEN a transaction fails THEN the HarvestPro System SHALL update the step status to failed, display an error message, and halt execution

### Requirement 9

**User Story:** As a user with CEX holdings, I want to receive step-by-step instructions for manual CEX execution, so that I can complete the harvest on exchanges that don't support API trading.

#### Acceptance Criteria

1. WHEN a harvest opportunity involves CEX holdings THEN the HarvestPro System SHALL display a CEX instruction panel in the execution flow
2. WHEN displaying CEX instructions THEN the HarvestPro System SHALL provide numbered steps specific to the exchange platform
3. WHEN displaying CEX instructions THEN the HarvestPro System SHALL include the exact token pair, quantity, and order type
4. WHEN a user marks a CEX step as complete THEN the HarvestPro System SHALL update the step status and proceed to the next step
5. WHEN all CEX steps are marked complete THEN the HarvestPro System SHALL proceed to the success screen

### Requirement 10

**User Story:** As a user, I want to see a success screen after completing a harvest, so that I receive confirmation and can access export files.

#### Acceptance Criteria

1. WHEN all harvest steps complete successfully THEN the HarvestPro System SHALL display a success screen with a centered achievement-style card
2. WHEN the success screen displays THEN the HarvestPro System SHALL show a confetti animation
3. WHEN the success screen displays THEN the HarvestPro System SHALL show the total losses harvested in dollars
4. WHEN the success screen displays THEN the HarvestPro System SHALL provide a Download 8949 CSV button
5. WHEN the success screen displays THEN the HarvestPro System SHALL provide a View Proof-of-Harvest button

### Requirement 11

**User Story:** As a user, I want to download a Form 8949-style CSV export, so that I can provide accurate records to my tax preparer or import into tax software.

#### Acceptance Criteria

1. WHEN a user clicks the Download 8949 CSV button THEN the HarvestPro System SHALL generate a CSV file within two seconds
2. WHEN generating the CSV THEN the HarvestPro System SHALL include columns for description, date acquired, date sold, proceeds, cost basis, and gain or loss
3. WHEN generating the CSV THEN the HarvestPro System SHALL format all monetary values with two decimal places
4. WHEN generating the CSV THEN the HarvestPro System SHALL include a row for each harvested lot
5. WHEN the CSV is generated THEN the HarvestPro System SHALL ensure the file opens correctly in Excel, Google Sheets, and Numbers

### Requirement 12

**User Story:** As a user, I want to view a Proof-of-Harvest page with cryptographic verification, so that I have an auditable record of my harvest execution.

#### Acceptance Criteria

1. WHEN a user navigates to the Proof-of-Harvest page THEN the HarvestPro System SHALL display a header with the HarvestPro title
2. WHEN the page loads THEN the HarvestPro System SHALL display a summary section showing total losses harvested, net benefit, and execution timestamp
3. WHEN the page loads THEN the HarvestPro System SHALL display a list of all executed steps with transaction hashes for on-chain actions
4. WHEN the page loads THEN the HarvestPro System SHALL display a cryptographic proof hash generated from the harvest session data
5. WHEN the page loads THEN the HarvestPro System SHALL provide export buttons for downloading the proof as PDF or sharing via link

### Requirement 13

**User Story:** As a user, I want to receive notifications about harvest opportunities, so that I can take action at optimal times.

#### Acceptance Criteria

1. WHEN a new harvest opportunity exceeds the notification threshold THEN the HarvestPro System SHALL send a push notification to the user's device
2. WHEN a new harvest opportunity exceeds the notification threshold THEN the HarvestPro System SHALL send an email notification to the user's registered email address
3. WHEN the date is between December first and December thirty-first THEN the HarvestPro System SHALL send a year-end reminder notification
4. WHEN sending notifications THEN the HarvestPro System SHALL include the token symbol and estimated net benefit
5. WHEN a user clicks a notification THEN the HarvestPro System SHALL navigate directly to the relevant harvest opportunity

### Requirement 14

**User Story:** As a user, I want to see clear error messages when issues occur, so that I understand what went wrong and how to resolve it.

#### Acceptance Criteria

1. WHEN no wallets are connected THEN the HarvestPro System SHALL display a Guardian-style warning banner stating that wallet connection is required
2. WHEN a CEX API error occurs THEN the HarvestPro System SHALL display an error banner with the exchange name and suggested resolution steps
3. WHEN gas estimation fails THEN the HarvestPro System SHALL display an error banner indicating network issues and suggest retrying
4. WHEN a swap is illiquid THEN the HarvestPro System SHALL display a warning banner indicating high slippage risk before execution
5. WHEN execution fails mid-process THEN the HarvestPro System SHALL display an error banner with the failed step, error message, and option to retry or cancel

### Requirement 15

**User Story:** As a user, I want the system to classify harvest opportunities by risk level, so that I can make informed decisions about which opportunities to pursue.

#### Acceptance Criteria

1. WHEN a lot has a Guardian score less than or equal to three THEN the HarvestPro System SHALL classify the opportunity as HIGH RISK
2. WHEN a lot has a Guardian score between four and six inclusive THEN the HarvestPro System SHALL classify the opportunity as MEDIUM RISK
3. WHEN a lot has a Guardian score greater than or equal to seven THEN the HarvestPro System SHALL classify the opportunity as LOW RISK
4. WHEN a lot has a liquidity flag set to false THEN the HarvestPro System SHALL classify the opportunity as HIGH RISK regardless of Guardian score
5. WHEN displaying an opportunity THEN the HarvestPro System SHALL show the risk classification as a colored chip with green for LOW RISK, amber for MEDIUM RISK, and red for HIGH RISK

### Requirement 16

**User Story:** As a system administrator, I want all calculations to be deterministic and auditable, so that we can verify accuracy and maintain user trust.

#### Acceptance Criteria

1. WHEN calculating cost basis THEN the HarvestPro System SHALL use FIFO accounting consistently across all lots
2. WHEN calculating net benefit THEN the HarvestPro System SHALL use the same formula for all opportunities with identical parameters
3. WHEN generating exports THEN the HarvestPro System SHALL include all source data used in calculations
4. WHEN storing harvest sessions THEN the HarvestPro System SHALL record all input parameters and calculation results
5. WHEN generating proof hashes THEN the HarvestPro System SHALL use a cryptographic hash function that produces identical output for identical input

### Requirement 17

**User Story:** As a system administrator, I want the system to maintain high performance and reliability, so that users have a smooth experience.

#### Acceptance Criteria

1. WHEN processing wallet data THEN the HarvestPro System SHALL complete scans within ten seconds for ninety-five percent of requests
2. WHEN generating export files THEN the HarvestPro System SHALL complete generation within two seconds
3. WHEN storing sensitive data THEN the HarvestPro System SHALL encrypt all API credentials and private information
4. WHEN measuring uptime THEN the HarvestPro System SHALL maintain availability of ninety-nine point nine percent or higher
5. WHEN handling concurrent users THEN the HarvestPro System SHALL maintain consistent performance under normal load conditions

### Requirement 18

**User Story:** As a user, I want the interface to be responsive and mobile-friendly, so that I can manage harvests from any device.

#### Acceptance Criteria

1. WHEN viewing the dashboard on mobile THEN the HarvestPro System SHALL display the header with title stacked above buttons
2. WHEN viewing harvest cards on mobile THEN the HarvestPro System SHALL render the Start Harvest button as full-width
3. WHEN opening a modal on mobile THEN the HarvestPro System SHALL display the modal as full-screen
4. WHEN opening a modal on desktop THEN the HarvestPro System SHALL display the modal as a centered overlay with maximum width
5. WHEN scrolling the filter chip row THEN the HarvestPro System SHALL enable horizontal scrolling on all screen sizes

### Requirement 19

**User Story:** As a user, I want consistent visual design matching Hunter and Guardian, so that HarvestPro feels like a natural part of AlphaWhale.

#### Acceptance Criteria

1. WHEN rendering any card THEN the HarvestPro System SHALL use white background, twelve-pixel rounded corners, and subtle shadow matching Guardian panels
2. WHEN rendering the header THEN the HarvestPro System SHALL use twenty-four-pixel semi-bold font for the title matching Hunter header style
3. WHEN rendering filter chips THEN the HarvestPro System SHALL use thirty-two-pixel height, sixteen-pixel border radius, and primary blue for active state matching Hunter filters
4. WHEN rendering metric strips THEN the HarvestPro System SHALL use uppercase grey titles and medium bold values with spacing matching Hunter cards
5. WHEN rendering buttons THEN the HarvestPro System SHALL use primary blue color and border radius matching Hunter's Join Quest button

### Requirement 20

**User Story:** As a user, I want to configure my tax rate and preferences, so that net benefit calculations reflect my personal tax situation.

#### Acceptance Criteria

1. WHEN a user accesses settings THEN the HarvestPro System SHALL provide an input field for tax rate as a percentage
2. WHEN a user updates their tax rate THEN the HarvestPro System SHALL recalculate net benefits for all opportunities using the new rate
3. WHEN a user sets notification preferences THEN the HarvestPro System SHALL store the minimum threshold for harvest opportunity notifications
4. WHEN a user enables or disables notifications THEN the HarvestPro System SHALL respect the preference for all future notifications
5. WHEN a user saves settings THEN the HarvestPro System SHALL persist the settings and apply them immediately to all calculations

---

## v2 Institutional Requirements

### Requirement 21

**User Story:** As an institutional user, I want my on-chain harvests to be protected from MEV and routed via private RPC when possible, so that I minimize invisible execution costs and frontrunning risk.

#### Acceptance Criteria

1. WHEN a user has `requirePrivateRpc` enabled in settings THEN the HarvestPro System SHALL route all on-chain harvest transactions through a configured private RPC provider where available
2. WHEN a harvest transaction is sent via private RPC THEN the HarvestPro System SHALL record `privateRpcUsed = true` and the provider name on the corresponding `ExecutionStep`
3. WHEN private RPC is unavailable or fails AND `requirePrivateRpc` is enabled THEN the HarvestPro System SHALL block execution and display an error banner instead of silently falling back to public RPC
4. WHEN private RPC is optional AND private RPC fails THEN the HarvestPro System MAY fall back to public RPC and SHALL mark the step as `privateRpcUsed = false`

### Requirement 22

**User Story:** As a compliance-conscious user, I want HarvestPro to apply an economic substance check to my sessions, so that I avoid patterns that could be interpreted as purely tax-motivated.

#### Acceptance Criteria

1. WHEN a user creates a harvest session THEN the HarvestPro System SHALL evaluate economic substance and set `economicSubstanceStatus` to `PASS`, `WARN`, or `BLOCKED`
2. WHEN `economicSubstanceStatus` is `BLOCKED` THEN the HarvestPro System SHALL prevent execution and show a clear explanation of why the session is blocked
3. WHEN `economicSubstanceStatus` is `WARN` THEN the HarvestPro System SHALL require explicit user confirmation before allowing execution to start
4. WHEN generating Proof-of-Harvest THEN the HarvestPro System SHALL include the economic substance status and a short explanation in the proof payload used to generate the `proofHash`

### Requirement 23

**User Story:** As a user, I want the option to use proxy assets to maintain market exposure after harvesting, so that I can lock in tax benefits without fully exiting my market view.

#### Acceptance Criteria

1. WHEN a token has one or more approved proxy assets in the HarvestPro System THEN the opportunity detail modal SHALL show a "Maintain Exposure with Proxy Asset" option
2. WHEN a user enables the proxy option for an opportunity THEN the HarvestPro System SHALL add a `Sell base token → Buy proxy token` execution plan and update the `ExecutionStep` list accordingly
3. WHEN a proxy asset is marked as blocked by policy THEN the HarvestPro System SHALL not offer it in the UI and SHALL not use it in any execution plans
4. WHEN a session uses proxy assets THEN the HarvestPro System SHALL record the chosen proxy symbol on the corresponding `HarvestOpportunity` and include it in Proof-of-Harvest exports

### Requirement 24

**User Story:** As an institutional user, I want configurable guardrails (max daily realized loss, max position size, max slippage), so that HarvestPro never exceeds my risk or mandate limits.

#### Acceptance Criteria

1. WHEN a user configures `maxDailyRealizedLossUsd` in settings THEN the HarvestPro System SHALL prevent execution of any session that would exceed this limit based on estimated realized losses
2. WHEN a user configures `maxSingleTradeNotionalUsd` THEN the HarvestPro System SHALL split or reject execution steps that exceed this limit
3. WHEN a user configures `maxSlippageBps` THEN the HarvestPro System SHALL block any opportunity where estimated slippage exceeds this threshold
4. WHEN a session is blocked by any of these guardrails THEN the HarvestPro System SHALL display a clear explanation and highlight which limit was hit

### Requirement 25

**User Story:** As a fund manager, I want an audit-grade Proof-of-Harvest record, so that I can defend my process to regulators, LPs, and auditors.

#### Acceptance Criteria

1. WHEN a harvest session reaches `completed` status THEN the HarvestPro System SHALL create a canonical proof payload including all selected opportunities, all execution steps, user settings snapshot relevant to risk and policy, economic substance status, and MEV protection mode and provider details
2. WHEN generating the proof hash THEN the HarvestPro System SHALL use a deterministic cryptographic hash function such that identical input always produces identical output
3. WHEN a user or admin views the Proof-of-Harvest page THEN the HarvestPro System SHALL display both the human-readable summary and the raw proof hash value
4. WHEN exporting proof as CSV or PDF THEN the HarvestPro System SHALL include a reference to the proof hash and session ID so that external systems can correlate records

---

## v3 Enterprise Requirements

### Requirement 26

**User Story:** As a fund manager using Fireblocks or Copper, I want HarvestPro to push transaction payloads to my custody vault for approval, so that I do not have to expose private keys.

#### Acceptance Criteria

1. WHEN a user connects an MPC Custodian THEN the HarvestPro System SHALL NOT ask for private keys but instead require API co-signing credentials
2. WHEN executing a harvest THEN the Action Engine SHALL NOT broadcast the transaction directly
3. WHEN executing a harvest with custody integration THEN the Action Engine SHALL construct the unsigned transaction payload and push it to the Custodian's API with a note containing the session identifier
4. WHEN a transaction is sent to custody THEN the HarvestPro System SHALL poll the Custodian status until the external approver signs the transaction

### Requirement 27

**User Story:** As a CFO, I want to approve any harvest session over a configured threshold, so that junior traders cannot accidentally trigger massive tax events.

#### Acceptance Criteria

1. WHEN a HarvestSession has a net benefit exceeding the approval threshold THEN the HarvestPro System SHALL transition the status to `awaiting_approval` instead of `executing`
2. WHEN a session requires approval THEN the HarvestPro System SHALL notify users with the APPROVER role via email and push notification
3. WHEN a session is awaiting approval THEN the HarvestPro System SHALL NOT proceed with execution until an APPROVER cryptographically signs the session approval
4. WHEN an approver rejects a session THEN the HarvestPro System SHALL transition the status to `cancelled` and notify the session creator

### Requirement 28

**User Story:** As a compliance officer, I want to block any harvest path that interacts with sanctioned entities, so that our fund remains compliant with OFAC and AML laws.

#### Acceptance Criteria

1. WHEN proposing a swap route THEN the HarvestPro System SHALL screen the pool contract addresses against the OFAC Sanctions List
2. WHEN a route interacts with a high-risk address THEN the HarvestPro System SHALL block that route and find a compliant alternative
3. WHEN no compliant route is available THEN the HarvestPro System SHALL mark the opportunity as ineligible and display a compliance warning
4. WHEN sanctions screening is enabled THEN the HarvestPro System SHALL log all screening results for audit purposes

### Requirement 29

**User Story:** As a whale moving large positions, I do not want to dump everything in one block; I want to split the order over time to minimize price impact.

#### Acceptance Criteria

1. WHEN harvest size exceeds the liquidity threshold THEN the Action Engine SHALL offer TWAP execution as an option
2. WHEN TWAP is selected THEN the HarvestPro System SHALL slice the parent order into child iceberg orders and execute them over a user-defined duration
3. WHEN executing TWAP orders THEN the HarvestPro System SHALL dynamically pause execution if the price drops below a limit price safety floor
4. WHEN TWAP execution completes THEN the HarvestPro System SHALL display the actual average execution price compared to the initial estimate
