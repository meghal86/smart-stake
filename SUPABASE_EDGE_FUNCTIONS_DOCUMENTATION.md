# Supabase Edge Functions Documentation

**Generated:** January 10, 2026  
**Total Functions:** 115+ directories  
**Purpose:** Complete documentation of all Supabase Edge Functions with plain English explanations and usage locations

---

## 📋 Table of Contents

1. [Core Business Functions](#core-business-functions)
2. [Authentication & Security](#authentication--security)
3. [Wallet Management](#wallet-management)
4. [HarvestPro (Tax Loss Harvesting)](#harvestpro-tax-loss-harvesting)
5. [Guardian (Security Scanning)](#guardian-security-scanning)
6. [Hunter (Opportunities)](#hunter-opportunities)
7. [Whale Analytics](#whale-analytics)
8. [Market Intelligence](#market-intelligence)
9. [Portfolio Tracking](#portfolio-tracking)
10. [Notifications & Alerts](#notifications--alerts)
11. [Payments & Subscriptions](#payments--subscriptions)
12. [AI/ML Functions](#aiml-functions)
13. [Data Ingestion](#data-ingestion)
14. [Utility Functions](#utility-functions)
15. [Health Checks](#health-checks)
16. [Deprecated/Review Functions](#deprecatedreview-functions)

---

## Core Business Functions

### cockpit-summary
**What it does:** Generates the main dashboard summary including Today Card, action preview, counters, and provider status for the authenticated home cockpit.

**Plain English:** When you open your AlphaWhale dashboard, this function calculates what to show you - like "3 Critical risks need attention" or "5 new opportunities since last visit". It looks at your wallets, recent scans, pending actions, and creates a personalized summary.

**Used in:**
- `src/app/api/cockpit/summary/route.ts` (Next.js API wrapper)
- `src/services/cockpitService.ts` (Frontend service)
- Dashboard components that display the Today Card

**Status:** ⚠️ DUPLICATE - This logic is also implemented in Next.js API routes

### cockpit-actions-rendered
**What it does:** Records which actions were shown to the user in the Action Preview to prevent showing the same actions repeatedly.

**Plain English:** When your dashboard shows you "Fix this security issue" or "Claim this reward", this function remembers that you've seen it. This prevents the same action from appearing over and over again (gives it a -30 penalty score for 2 hours).

**Used in:**
- `src/app/api/cockpit/actions/rendered/route.ts` (Next.js API wrapper)
- Action Preview components when they render actions
- Cockpit scoring system for duplicate detection

**Status:** ⚠️ DUPLICATE - This logic is also implemented in Next.js API routes

---

## Authentication & Security

### verify-session
**What it does:** Verifies user authentication sessions and validates JWT tokens.

**Plain English:** When you log into AlphaWhale, this function checks that your login is still valid and you are who you say you are. It's like a security guard checking your ID card.

**Used in:**
- Authentication middleware
- Protected API routes
- Session validation across the app

**Status:** ✅ ACTIVE

### chainalysis-sanctions
**What it does:** Screens wallet addresses against sanctions lists using Chainalysis API.

**Plain English:** Before you interact with a wallet address, this function checks if it belongs to someone on government sanctions lists (like criminals or banned entities). It's like running a background check.

**Used in:**
- Guardian security scans
- Wallet onboarding flow
- Transaction screening

**Status:** ✅ ACTIVE

---

## Wallet Management

### wallets-add-watch
**What it does:** Adds a new wallet address to user's watchlist with ENS name resolution.

**Plain English:** When you want to track a new wallet (like adding "vitalik.eth"), this function adds it to your list and figures out the actual wallet address if you used an ENS name.

**Used in:**
- Wallet connection flow
- Manual wallet addition forms
- ENS resolution service

**Status:** ✅ ACTIVE

### wallets-list
**What it does:** Returns all wallets associated with a user account, including quota limits.

**Plain English:** Shows you all the wallets you're tracking, plus tells you how many more you can add based on your subscription plan (free users might get 3, pro users get unlimited).

**Used in:**
- Wallet management dashboard
- Subscription limit enforcement
- Wallet selection dropdowns

**Status:** ✅ ACTIVE

### wallets-remove
**What it does:** Removes a wallet from user's account with atomic primary wallet reassignment.

**Plain English:** When you want to stop tracking a wallet, this function removes it safely. If it was your "main" wallet, it automatically picks a new main wallet so you don't break anything.

**Used in:**
- Wallet management settings
- Account cleanup flows

**Status:** ✅ ACTIVE

### wallets-set-primary
**What it does:** Sets which wallet should be the user's primary/active wallet.

**Plain English:** Lets you choose which of your wallets is your "main" one - the one that shows up first in dashboards and gets scanned most frequently.

**Used in:**
- Wallet settings page
- Initial wallet setup
- Wallet priority management

**Status:** ✅ ACTIVE

### wallets-remove-address
**What it does:** Removes a specific wallet address from tracking.

**Plain English:** Similar to wallets-remove but works with the actual wallet address instead of an internal ID.

**Used in:**
- Bulk wallet cleanup
- API integrations
- Address-based removal flows

**Status:** ✅ ACTIVE

### wallet-registry-scan
**What it does:** Scheduled job that scans all registered wallets for updates.

**Plain English:** Runs automatically in the background to check all users' wallets for new transactions, balance changes, and security issues. Like a security patrol that checks everyone's wallets periodically.

**Used in:**
- Scheduled cron jobs
- Background wallet monitoring
- Automated security scanning

**Status:** ✅ ACTIVE

---

## HarvestPro (Tax Loss Harvesting)

### harvest-sync-wallets
**What it does:** Syncs on-chain transaction history for tax loss harvesting calculations.

**Plain English:** Looks at all your wallet transactions on the blockchain and organizes them for tax purposes. It figures out when you bought and sold tokens, at what prices, to calculate potential tax savings.

**Used in:**
- HarvestPro onboarding
- Transaction history sync
- Tax calculation preparation

**Status:** ✅ ACTIVE

### harvest-sync-cex
**What it does:** Syncs centralized exchange (CEX) trading data via API connections.

**Plain English:** Connects to your Coinbase, Binance, etc. accounts (with your permission) and downloads your trading history so it can be included in tax calculations alongside your wallet transactions.

**Used in:**
- CEX integration setup
- Trading history import
- Comprehensive tax reporting

**Status:** ✅ ACTIVE

### harvest-recompute-opportunities
**What it does:** Calculates tax loss harvesting opportunities using FIFO cost basis and current market prices.

**Plain English:** This is the brain of HarvestPro. It looks at all your holdings, figures out which ones are losing money, and calculates exactly how much you could save on taxes by selling them. It considers gas fees, slippage, and other costs to give you the real net benefit.

**Used in:**
- HarvestPro dashboard
- Opportunity calculations
- Tax savings estimates

**Status:** ✅ ACTIVE

### harvest-notify
**What it does:** Sends notifications about new tax loss harvesting opportunities.

**Plain English:** When market conditions create new tax-saving opportunities (like a token you own drops in price), this function sends you an alert so you don't miss the chance to save money.

**Used in:**
- Push notifications
- Email alerts
- Opportunity monitoring

**Status:** ✅ ACTIVE

---

## Guardian (Security Scanning)

### guardian-scan-v2
**What it does:** Performs comprehensive wallet security analysis with real-time streaming results.

**Plain English:** This is the main security scanner. When you click "Scan my wallet", it checks for dangerous token approvals, risky transactions, connections to known bad actors, and gives you a security score. Results stream back in real-time so you see progress.

**Used in:**
- Guardian security dashboard
- Wallet security checks
- Risk assessment flows

**Status:** ✅ ACTIVE (Primary version)

### guardian-scan
**What it does:** Original version of wallet security scanning.

**Plain English:** The older version of the security scanner. Does similar checks but doesn't stream results back in real-time.

**Used in:**
- Legacy Guardian implementations
- Fallback scanning

**Status:** ⚠️ DEPRECATED (Use v2 instead)

### guardian-revoke-v2
**What it does:** Revokes dangerous token approvals with idempotent pre-simulation.

**Plain English:** When the scanner finds that you've given unlimited spending permission to a risky smart contract, this function helps you revoke that permission safely. It simulates the transaction first to make sure it won't fail.

**Used in:**
- Guardian fix flows
- Approval management
- Security remediation

**Status:** ✅ ACTIVE (Primary version)

### guardian-revoke
**What it does:** Original version of approval revocation.

**Plain English:** Older version of the approval revocation system.

**Used in:**
- Legacy Guardian implementations

**Status:** ⚠️ DEPRECATED (Use v2 instead)

### guardian-healthz
**What it does:** Health check endpoint specifically for Guardian services.

**Plain English:** A simple endpoint that other systems can ping to make sure the Guardian security scanning system is working properly.

**Used in:**
- Service monitoring
- Health dashboards
- Uptime checks

**Status:** ✅ ACTIVE

### guardian-multi-scan
**What it does:** Scans multiple wallets simultaneously.

**Plain English:** Instead of scanning wallets one by one, this can scan several at once to save time. Useful for users with many wallets.

**Used in:**
- Bulk wallet scanning
- Multi-wallet dashboards

**Status:** ⚠️ REVIEW (May be mock implementation)

### guardian-automation-propose
**What it does:** Proposes automated security fixes for detected issues.

**Plain English:** When Guardian finds security problems, this function suggests automatic fixes you can apply with one click, like "Revoke approval for SushiSwap Router".

**Used in:**
- Automated remediation flows
- One-click fixes

**Status:** ⚠️ REVIEW

---

## Hunter (Opportunities)

### hunter-opportunities
**What it does:** Fetches yield farming and DeFi opportunities based on user's portfolio.

**Plain English:** Looks at what tokens you own and finds ways to earn money with them - like staking, liquidity pools, or lending. Shows you the best opportunities ranked by potential profit and risk.

**Used in:**
- Hunter opportunities dashboard
- Yield farming recommendations
- DeFi opportunity discovery

**Status:** ✅ ACTIVE

### hunter-refresh
**What it does:** Refreshes and updates opportunity data with current market conditions.

**Plain English:** Updates all the earning opportunities with fresh data - new APY rates, changed risks, expired opportunities, etc. Keeps the recommendations current.

**Used in:**
- Scheduled data updates
- Real-time opportunity refresh
- Market condition updates

**Status:** ✅ ACTIVE

---

## Whale Analytics

### whale-alerts
**What it does:** Fetches and processes large cryptocurrency transactions from whale-alert.io API.

**Plain English:** Monitors the blockchain for huge transactions (like someone moving $10M+ in Bitcoin) and stores them for analysis. These "whale movements" can signal market changes.

**Used in:**
- Whale movement notifications
- Market intelligence dashboard
- Large transaction monitoring

**Status:** ✅ ACTIVE

### whale-analytics
**What it does:** Analyzes whale behavior patterns and generates insights.

**Plain English:** Studies the big players' trading patterns to understand what they're doing. Like "Whales have been accumulating ETH for 3 days" or "Major selloff detected".

**Used in:**
- Whale behavior insights
- Market trend analysis
- Trading signal generation

**Status:** ✅ ACTIVE

### whale-behavior-engine
**What it does:** Advanced pattern detection for whale trading behaviors.

**Plain English:** The smart engine that recognizes complex whale patterns - like coordinated buying, distribution phases, or accumulation cycles. It's like having an expert trader analyze whale movements.

**Used in:**
- Advanced whale analysis
- Pattern recognition
- Behavioral insights

**Status:** ✅ ACTIVE

### whale-clusters
**What it does:** Groups related whale addresses into clusters for analysis.

**Plain English:** Figures out which whale wallets might belong to the same person or organization by analyzing their transaction patterns. Like detective work to map the whale ecosystem.

**Used in:**
- Whale network analysis
- Cluster visualization
- Related address detection

**Status:** ⚠️ REVIEW (May have duplicate)

### whale-clusters-fixed
**What it does:** Improved version of whale clustering with bug fixes.

**Plain English:** The updated version of the whale clustering system with better accuracy and fewer errors.

**Used in:**
- Improved whale analysis
- Fixed clustering algorithms

**Status:** ⚠️ CONSOLIDATE with whale-clusters

### whale-notifications
**What it does:** Sends notifications about whale activity relevant to user's portfolio.

**Plain English:** Alerts you when whales do something that might affect tokens you own. Like "A whale just bought $5M of the same token you hold".

**Used in:**
- Whale activity alerts
- Portfolio-relevant notifications
- Market movement warnings

**Status:** ✅ ACTIVE

### whale-predictions
**What it does:** Predicts future whale movements based on historical patterns.

**Plain English:** Uses AI to predict what whales might do next based on their past behavior. Like "Based on patterns, whales typically sell after accumulating for 7 days".

**Used in:**
- Predictive whale analysis
- Market timing insights
- Trading signal generation

**Status:** ✅ ACTIVE

### whale-profile
**What it does:** Creates detailed profiles of individual whale addresses.

**Plain English:** Builds a complete picture of each major whale - their trading style, favorite tokens, typical transaction sizes, success rate, etc. Like a trading card for each whale.

**Used in:**
- Individual whale analysis
- Whale tracking dashboards
- Detailed whale information

**Status:** ✅ ACTIVE

### whale-signal-processor
**What it does:** Processes and ranks whale signals by importance and relevance.

**Plain English:** Takes all the whale activity and figures out what's actually important. Filters out noise and highlights the signals that matter for your portfolio.

**Used in:**
- Signal processing pipeline
- Relevance ranking
- Noise filtering

**Status:** ✅ ACTIVE

### live-whale-tracker
**What it does:** Real-time tracking of whale movements as they happen.

**Plain English:** Monitors whale activity in real-time and immediately processes new large transactions. Like a live feed of whale movements.

**Used in:**
- Real-time whale monitoring
- Live transaction feeds
- Immediate whale alerts

**Status:** ✅ ACTIVE

### real-whale-alerts
**What it does:** Generates real-time alerts for whale activity.

**Plain English:** Similar to live-whale-tracker but focused on generating immediate alerts when important whale activity happens.

**Used in:**
- Real-time whale alerts
- Immediate notifications

**Status:** ⚠️ REVIEW (May duplicate live-whale-tracker)

### fetchWhales
**What it does:** Fetches whale data from various sources.

**Plain English:** Collects whale information from different APIs and data sources to build a comprehensive whale database.

**Used in:**
- Data collection pipeline
- Whale data aggregation

**Status:** ✅ ACTIVE

### sync-whale-data
**What it does:** Synchronizes whale data across different systems.

**Plain English:** Keeps whale information consistent across all parts of the system. Makes sure the whale data in the dashboard matches the data used for alerts.

**Used in:**
- Data synchronization
- Consistency maintenance

**Status:** ✅ ACTIVE

### populate-whale-data
**What it does:** Initial population of whale data for new deployments.

**Plain English:** Sets up the whale database with historical data when first deploying the system. Like importing a starter dataset.

**Used in:**
- Initial system setup
- Data migration

**Status:** ⚠️ REVIEW (One-time use)

### cleanup-whale-signals
**What it does:** Removes old or irrelevant whale signals to keep the database clean.

**Plain English:** Housekeeping function that deletes old whale alerts and signals that are no longer relevant. Keeps the system running efficiently.

**Used in:**
- Database maintenance
- Scheduled cleanup jobs

**Status:** ✅ ACTIVE

### nft-whale-tracker
**What it does:** Tracks large NFT transactions and whale activity in NFT markets.

**Plain English:** Like whale tracking but for NFTs - monitors when someone buys or sells expensive NFTs (like a $1M Bored Ape). Helps track NFT market trends.

**Used in:**
- NFT market analysis
- High-value NFT tracking
- NFT whale monitoring

**Status:** ✅ ACTIVE

---

## Market Intelligence

### market-intelligence-hub
**What it does:** Aggregates market data, whale activity, and risk metrics into comprehensive market intelligence.

**Plain English:** The central brain that combines all market information - prices, whale movements, risk levels, news sentiment - into a complete market picture. Like a financial news room in one function.

**Used in:**
- Market intelligence dashboard
- Comprehensive market analysis
- Multi-source data aggregation

**Status:** ✅ ACTIVE

### market-summary
**What it does:** Generates market summary with key metrics and trends.

**Plain English:** Creates a daily market overview with the most important numbers - total volume, price changes, whale activity, risk levels. Like a market newsletter.

**Used in:**
- Daily market summaries
- Market overview dashboards

**Status:** ⚠️ REVIEW (May have enhanced version)

### market-summary-enhanced
**What it does:** Enhanced version of market summary with additional metrics.

**Plain English:** More detailed market summary with extra analysis and insights beyond the basic version.

**Used in:**
- Enhanced market analysis
- Detailed market reports

**Status:** ⚠️ CONSOLIDATE with market-summary

### market-kpis
**What it does:** Calculates key performance indicators for market analysis.

**Plain English:** Computes important market metrics like volatility, momentum, whale activity index, risk scores. The numbers that traders and analysts care about.

**Used in:**
- Market KPI dashboards
- Performance tracking
- Market health monitoring

**Status:** ✅ ACTIVE

### market-chain-risk
**What it does:** Analyzes risk levels across different blockchain networks.

**Plain English:** Evaluates how risky each blockchain is right now - like "Ethereum risk is low, but BSC has high risk due to recent exploits". Helps users choose safer chains.

**Used in:**
- Chain risk assessment
- Multi-chain risk analysis

**Status:** ⚠️ REVIEW

### market-chain-risk-quant
**What it does:** Quantitative analysis of chain risk using mathematical models.

**Plain English:** More sophisticated version of chain risk analysis using complex math and statistics to calculate precise risk scores.

**Used in:**
- Advanced risk modeling
- Quantitative risk analysis

**Status:** ⚠️ CONSOLIDATE with market-chain-risk

### market-maker-sentinel
**What it does:** Monitors market maker activity and liquidity conditions.

**Plain English:** Watches the big trading firms and liquidity providers to understand market conditions. Like monitoring the "plumbing" of crypto markets.

**Used in:**
- Liquidity monitoring
- Market maker analysis
- Trading condition assessment

**Status:** ✅ ACTIVE

---

## Portfolio Tracking

### portfolio-tracker
**What it does:** Tracks user portfolio values, balances, and performance metrics.

**Plain English:** Keeps track of all your crypto holdings across different wallets and exchanges, calculates total value, profit/loss, and performance over time.

**Used in:**
- Portfolio dashboard
- Performance tracking
- Balance monitoring

**Status:** ⚠️ REVIEW

### portfolio-tracker-live
**What it does:** Real-time portfolio tracking with live price updates.

**Plain English:** Same as portfolio tracker but updates in real-time as prices change. Shows live portfolio value fluctuations.

**Used in:**
- Live portfolio monitoring
- Real-time value tracking

**Status:** ⚠️ CONSOLIDATE with portfolio-tracker

---

## Notifications & Alerts

### notification-delivery
**What it does:** Delivers notifications through various channels (push, email, SMS).

**Plain English:** The notification system that actually sends alerts to users. Handles different delivery methods and makes sure notifications reach you.

**Used in:**
- Push notifications
- Email alerts
- SMS notifications
- Multi-channel delivery

**Status:** ✅ ACTIVE

### alert-notifications
**What it does:** Generates and sends alerts based on user-defined rules and triggers.

**Plain English:** When something you're watching hits your alert conditions (like "notify me if ETH drops below $2000"), this function creates and sends the alert.

**Used in:**
- Custom alert rules
- Price alerts
- Condition-based notifications

**Status:** ✅ ACTIVE

### multi-channel-alerts
**What it does:** Sends alerts across multiple communication channels simultaneously.

**Plain English:** When something really important happens, this makes sure you get notified everywhere - push notification, email, and SMS all at once.

**Used in:**
- Critical alert delivery
- Multi-channel notifications
- Emergency alerts

**Status:** ✅ ACTIVE

### test-notifications
**What it does:** Testing endpoint for notification system development.

**Plain English:** Lets developers test that notifications are working properly without triggering real alerts to users.

**Used in:**
- Development testing
- Notification system debugging

**Status:** ✅ KEEP (Development only)

### watchlist-alerts
**What it does:** Sends alerts for tokens and addresses on user's watchlist.

**Plain English:** Monitors everything you've added to your watchlist and sends notifications when something interesting happens to those items.

**Used in:**
- Watchlist monitoring
- Custom tracking alerts

**Status:** ✅ ACTIVE

### subscription-reminders
**What it does:** Sends reminders about subscription renewals and billing.

**Plain English:** Reminds you when your subscription is about to expire or when payment is due. Helps prevent service interruptions.

**Used in:**
- Subscription management
- Billing reminders
- Renewal notifications

**Status:** ✅ ACTIVE

### notify_streak
**What it does:** Sends notifications about user engagement streaks.

**Plain English:** Gamification feature that tracks how many days in a row you've used the app and sends congratulations or reminders to maintain your streak.

**Used in:**
- User engagement
- Gamification features
- Streak tracking

**Status:** ✅ ACTIVE

---

## Payments & Subscriptions

### create-checkout-session
**What it does:** Creates Stripe checkout sessions for subscription purchases.

**Plain English:** When you click "Upgrade to Pro", this function sets up the payment page with Stripe so you can enter your credit card information securely.

**Used in:**
- Subscription upgrade flow
- Payment processing
- Stripe integration

**Status:** ✅ ACTIVE

### create-subscription
**What it does:** Creates new subscription records after successful payment.

**Plain English:** After you successfully pay for a subscription, this function sets up your account with the new features and permissions.

**Used in:**
- Subscription activation
- Account upgrades
- Feature unlocking

**Status:** ✅ ACTIVE

### manage-subscription
**What it does:** Handles subscription changes, cancellations, and updates.

**Plain English:** Lets you change your subscription plan, cancel, or update payment methods. The subscription management system.

**Used in:**
- Subscription settings
- Plan changes
- Cancellation flow

**Status:** ✅ ACTIVE

### stripe-webhook
**What it does:** Handles webhooks from Stripe for payment events.

**Plain English:** When Stripe processes a payment or subscription change, it sends a message to this function to update your account accordingly.

**Used in:**
- Payment processing
- Subscription updates
- Stripe integration

**Status:** ✅ ACTIVE

### simple-subscription
**What it does:** Simplified subscription creation flow.

**Plain English:** A streamlined version of subscription creation with fewer steps and options.

**Used in:**
- Simplified upgrade flow
- Basic subscription handling

**Status:** ⚠️ REVIEW (May be redundant)

### simple-webhook
**What it does:** Simplified webhook handler for basic payment events.

**Plain English:** Basic version of webhook handling for simple payment scenarios.

**Used in:**
- Basic payment processing
- Simple webhook handling

**Status:** ⚠️ REVIEW (May be redundant)

---

## AI/ML Functions

### ai-sentiment
**What it does:** Analyzes sentiment of crypto news and social media using AI.

**Plain English:** Reads crypto news articles and social media posts to determine if people are feeling bullish (positive) or bearish (negative) about the market.

**Used in:**
- Sentiment analysis dashboard
- Market mood indicators
- News analysis

**Status:** ✅ ACTIVE

### ai-wallet-analyzer
**What it does:** Uses AI to analyze wallet behavior patterns and classify wallet types.

**Plain English:** AI system that looks at how wallets behave and figures out what type they are - like "this looks like a trading bot" or "this is probably an institutional investor".

**Used in:**
- Wallet classification
- Behavior analysis
- AI-powered insights

**Status:** ✅ ACTIVE

### ml-predictions
**What it does:** Machine learning models for price and market predictions.

**Plain English:** AI that tries to predict future crypto prices and market movements based on historical data and patterns.

**Used in:**
- Price predictions
- Market forecasting
- AI trading signals

**Status:** ✅ ACTIVE

### ml-training
**What it does:** Trains and updates machine learning models with new data.

**Plain English:** The system that teaches the AI models by feeding them new market data and improving their prediction accuracy over time.

**Used in:**
- Model training pipeline
- AI improvement system
- Prediction accuracy enhancement

**Status:** ✅ ACTIVE

### ml-cron
**What it does:** Scheduled jobs for machine learning model maintenance and updates.

**Plain English:** Automated system that runs regularly to retrain AI models, update predictions, and maintain the machine learning infrastructure.

**Used in:**
- Scheduled ML tasks
- Model maintenance
- Automated AI updates

**Status:** ✅ ACTIVE

### feature-engineering
**What it does:** Processes raw data into features suitable for machine learning models.

**Plain English:** Takes raw market data and transforms it into the specific format that AI models need to make predictions. Like preparing ingredients before cooking.

**Used in:**
- ML data preparation
- Feature extraction
- Data preprocessing

**Status:** ✅ ACTIVE

### advanced-whale-predictions
**What it does:** Advanced AI predictions specifically for whale behavior and movements.

**Plain English:** Sophisticated AI that specializes in predicting what big crypto holders (whales) will do next based on their historical patterns.

**Used in:**
- Whale behavior predictions
- Advanced whale analysis
- AI-powered whale insights

**Status:** ✅ ACTIVE

### multi-coin-sentiment
**What it does:** Analyzes sentiment across multiple cryptocurrencies simultaneously.

**Plain English:** Instead of just looking at Bitcoin sentiment, this analyzes the mood around many different cryptocurrencies at once to get a broader market picture.

**Used in:**
- Multi-asset sentiment analysis
- Comprehensive market mood
- Cross-coin sentiment comparison

**Status:** ✅ ACTIVE

### fetch-sentiment
**What it does:** Fetches sentiment data from various sources for analysis.

**Plain English:** Collects sentiment information from news sites, social media, and other sources to feed into the sentiment analysis system.

**Used in:**
- Sentiment data collection
- Multi-source sentiment aggregation

**Status:** ✅ ACTIVE

---

## Data Ingestion

### data-ingestion
**What it does:** General-purpose data ingestion system for various external data sources.

**Plain English:** The system that pulls in data from external APIs, websites, and services to keep the AlphaWhale database updated with fresh information.

**Used in:**
- External data collection
- API data ingestion
- Database updates

**Status:** ✅ ACTIVE

### blockchain-monitor
**What it does:** Monitors blockchain networks for new transactions and events.

**Plain English:** Constantly watches the blockchain for new activity - new transactions, smart contract events, token transfers - and processes them for analysis.

**Used in:**
- Blockchain monitoring
- Transaction processing
- Event detection

**Status:** ✅ ACTIVE

### multi-chain-tracker
**What it does:** Tracks activity across multiple blockchain networks simultaneously.

**Plain English:** Instead of just watching Ethereum, this monitors many different blockchains (Bitcoin, Polygon, Arbitrum, etc.) all at once.

**Used in:**
- Multi-chain monitoring
- Cross-chain analysis
- Comprehensive blockchain tracking

**Status:** ✅ ACTIVE

### ingest_unlocks
**What it does:** Ingests data about token unlock events and vesting schedules.

**Plain English:** Tracks when locked tokens (like from ICOs or team allocations) become available for trading. These "unlock events" can cause price movements.

**Used in:**
- Token unlock tracking
- Vesting schedule monitoring
- Unlock event alerts

**Status:** ✅ ACTIVE

### ingest_whale_index
**What it does:** Ingests whale index data from external providers.

**Plain English:** Pulls in whale tracking data from specialized services that monitor large cryptocurrency holders and their activities.

**Used in:**
- Whale data aggregation
- External whale index integration

**Status:** ✅ ACTIVE

---

## Utility Functions

### prices
**What it does:** Provides cryptocurrency price data from multiple sources.

**Plain English:** The main price feed that gives you current and historical prices for cryptocurrencies. Combines data from multiple exchanges for accuracy.

**Used in:**
- Price displays throughout the app
- Portfolio value calculations
- Price alerts and notifications

**Status:** ✅ ACTIVE

### prices-summary
**What it does:** Provides summarized price data and market statistics.

**Plain English:** Instead of individual token prices, this gives you market summaries like "total market cap", "24h volume", "top gainers/losers".

**Used in:**
- Market overview dashboards
- Summary statistics
- Market health indicators

**Status:** ✅ ACTIVE

### user-notes
**What it does:** CRUD operations for user notes and annotations.

**Plain English:** Lets you save personal notes about wallets, transactions, or opportunities. Like sticky notes for your crypto analysis.

**Used in:**
- Note-taking features
- Personal annotations
- User-generated content

**Status:** ✅ ACTIVE

### log-attribution
**What it does:** Logs user actions for attribution and analytics.

**Plain English:** Tracks what users do in the app for analytics purposes - like "user clicked on whale alert" or "user upgraded subscription". Helps improve the product.

**Used in:**
- User analytics
- Feature usage tracking
- Product improvement insights

**Status:** ✅ ACTIVE

### accuracy-tracker
**What it does:** Tracks the accuracy of predictions and alerts over time.

**Plain English:** Keeps score of how often the AI predictions and alerts turn out to be correct. Like a report card for the prediction system.

**Used in:**
- Prediction accuracy monitoring
- Model performance tracking
- Quality assurance

**Status:** ✅ ACTIVE

### coverage-monitor
**What it does:** Monitors data coverage and completeness across different sources.

**Plain English:** Makes sure the system has complete data coverage - like checking that all important tokens have price data and all major wallets are being monitored.

**Used in:**
- Data quality monitoring
- Coverage gap detection
- System health checks

**Status:** ✅ ACTIVE

### api-monitor
**What it does:** Monitors external API health and performance.

**Plain English:** Keeps track of whether external services (like price APIs or blockchain nodes) are working properly and responding quickly.

**Used in:**
- API health monitoring
- Service reliability tracking
- External dependency monitoring

**Status:** ✅ ACTIVE

### bi-summary
**What it does:** Generates business intelligence summaries and reports.

**Plain English:** Creates summary reports for business analysis - like "how many users upgraded this month" or "which features are most popular".

**Used in:**
- Business intelligence
- Management reporting
- Usage analytics

**Status:** ✅ ACTIVE

### roi_analytics
**What it does:** Calculates return on investment analytics for various features and strategies.

**Plain English:** Measures how profitable different strategies or features are for users. Like "users who follow whale alerts make 15% more profit".

**Used in:**
- ROI tracking
- Strategy performance analysis
- Feature value measurement

**Status:** ✅ ACTIVE

### roi-digest
**What it does:** Generates digestible ROI reports and summaries.

**Plain English:** Takes complex ROI data and turns it into easy-to-understand reports that users can actually read and act on.

**Used in:**
- ROI reporting
- Performance summaries

**Status:** ⚠️ CONSOLIDATE with roi_analytics

### drift-daily
**What it does:** Analyzes daily drift in predictions and market conditions.

**Plain English:** Tracks how much the market or predictions "drift" from expected values each day. Helps identify when models need updating.

**Used in:**
- Model drift detection
- Prediction accuracy monitoring
- Daily analysis reports

**Status:** ✅ ACTIVE

### correlation-enhanced
**What it does:** Enhanced correlation analysis between different assets and metrics.

**Plain English:** Finds relationships between different cryptocurrencies, market indicators, and whale activities. Like "when Bitcoin drops, these altcoins usually follow".

**Used in:**
- Correlation analysis
- Market relationship mapping
- Trading insights

**Status:** ✅ ACTIVE

### forecast-upgrades
**What it does:** Upgrades and improvements to forecasting models.

**Plain English:** System for deploying improvements to the prediction and forecasting capabilities.

**Used in:**
- Model upgrades
- Forecasting improvements

**Status:** ✅ ACTIVE

### crypto-news
**What it does:** Fetches and processes cryptocurrency news from various sources.

**Plain English:** Collects crypto news from different websites and news services, processes it for relevance, and makes it available in the app.

**Used in:**
- News feed
- Market news integration
- Sentiment analysis input

**Status:** ✅ ACTIVE

### fetchYields
**What it does:** Fetches yield farming and staking yield data.

**Plain English:** Collects information about how much you can earn by staking or providing liquidity for different cryptocurrencies.

**Used in:**
- Yield farming opportunities
- Staking rewards tracking
- DeFi yield comparison

**Status:** ✅ ACTIVE

---

## Health Checks

### healthz
**What it does:** Primary health check endpoint for the entire system.

**Plain English:** A simple endpoint that other systems can check to make sure AlphaWhale is running properly. Returns "OK" if everything is working.

**Used in:**
- System monitoring
- Uptime checks
- Load balancer health checks

**Status:** ✅ ACTIVE (Primary)

### health
**What it does:** Basic health check endpoint.

**Plain English:** Simple health check, similar to healthz but more basic.

**Used in:**
- Basic health monitoring

**Status:** ❌ DELETE (Redundant with healthz)

### health-check
**What it does:** Comprehensive health check with detailed system status.

**Plain English:** More detailed health check that provides information about different system components and their status.

**Used in:**
- Detailed system monitoring
- Component health tracking

**Status:** ⚠️ CONSOLIDATE features into healthz

### ops-health
**What it does:** Operations-focused health check for infrastructure monitoring.

**Plain English:** Health check specifically designed for operations teams to monitor infrastructure and system performance.

**Used in:**
- Infrastructure monitoring
- Operations dashboards

**Status:** ⚠️ REVIEW

---

## Scenario/Export Functions

### scenario-simulate
**What it does:** Simulates different market scenarios and their impact on portfolios.

**Plain English:** Lets you run "what if" scenarios like "what would happen to my portfolio if Bitcoin dropped 50%" or "how would a market crash affect my holdings".

**Used in:**
- Scenario analysis
- Risk modeling
- Portfolio stress testing

**Status:** ✅ ACTIVE

### scenario-save
**What it does:** Saves user-created scenarios for future reference.

**Plain English:** Lets you save your "what if" scenarios so you can come back to them later or share them with others.

**Used in:**
- Scenario management
- User-created scenarios
- Analysis persistence

**Status:** ✅ ACTIVE

### scenario-export
**What it does:** Exports scenario analysis results to various formats.

**Plain English:** Lets you download your scenario analysis as PDF, CSV, or other formats for sharing or record-keeping.

**Used in:**
- Report generation
- Data export
- Analysis sharing

**Status:** ✅ ACTIVE

### export-csv-pro
**What it does:** Advanced CSV export functionality for pro users.

**Plain English:** Enhanced export features that let pro subscribers download detailed data in spreadsheet format with more options and customization.

**Used in:**
- Pro user exports
- Advanced data downloads
- Detailed reporting

**Status:** ✅ ACTIVE

### metrics-scenarios-summary
**What it does:** Generates summary metrics for scenario analysis.

**Plain English:** Creates overview statistics and key metrics from your scenario analysis to help you understand the results quickly.

**Used in:**
- Scenario summaries
- Metrics aggregation
- Analysis overview

**Status:** ✅ ACTIVE

---

## Risk Analysis Functions

### auto-risk-scanner
**What it does:** Automated risk scanning across portfolios and market conditions.

**Plain English:** Continuously scans for risks in your portfolio and the broader market, automatically flagging potential problems before they become serious.

**Used in:**
- Automated risk monitoring
- Portfolio risk assessment
- Continuous security scanning

**Status:** ✅ ACTIVE

### riskScan
**What it does:** Risk scanning functionality.

**Plain English:** Scans for various types of risks in wallets and transactions.

**Used in:**
- Risk assessment
- Security scanning

**Status:** ⚠️ REVIEW (May duplicate auto-risk-scanner)

### chain-risk
**What it does:** Analyzes risk levels of different blockchain networks.

**Plain English:** Evaluates how risky each blockchain is based on factors like security incidents, centralization, and technical issues.

**Used in:**
- Blockchain risk assessment
- Chain selection guidance
- Multi-chain risk analysis

**Status:** ✅ ACTIVE

### anomaly-detector
**What it does:** Detects unusual patterns and anomalies in market data and user behavior.

**Plain English:** AI system that spots weird or unusual activity that might indicate problems, opportunities, or important market changes.

**Used in:**
- Anomaly detection
- Unusual activity alerts
- Pattern recognition

**Status:** ✅ ACTIVE

---

## Alert Processing Functions

### alerts-stream
**What it does:** Streams real-time alerts to users based on their preferences.

**Plain English:** The system that delivers alerts to you in real-time as they happen, filtered based on what you want to be notified about.

**Used in:**
- Real-time alert delivery
- Alert streaming
- Live notifications

**Status:** ✅ ACTIVE

### alerts-classify-quant
**What it does:** Uses quantitative methods to classify and rank alerts by importance.

**Plain English:** Smart system that figures out which alerts are most important using math and statistics, so you see the critical ones first.

**Used in:**
- Alert prioritization
- Quantitative alert ranking
- Smart alert filtering

**Status:** ✅ ACTIVE

### custom-alert-processor
**What it does:** Processes custom user-defined alert rules and conditions.

**Plain English:** Handles the custom alerts you set up, like "notify me if ETH goes above $3000" or "alert me if any whale buys more than $1M of my tokens".

**Used in:**
- Custom alert rules
- User-defined notifications
- Personalized alert processing

**Status:** ✅ ACTIVE

### debug-alerts
**What it does:** Debugging tools for the alert system.

**Plain English:** Development tools that help engineers troubleshoot and fix problems with the alert system.

**Used in:**
- Alert system debugging
- Development tools

**Status:** ⚠️ REVIEW (Development only)

---

## Deprecated/Review Functions

### One-Time Setup Functions (Recommend Deletion)

| Function | Purpose | Status |
|----------|---------|--------|
| `add-stripe-columns` | Database migration for Stripe integration | ❌ DELETE if migration complete |
| `create-chain-risk-view` | Creates database view for chain risk | ❌ DELETE if view created |
| `create-table` | Generic table creation utility | ❌ DELETE |
| `create-whale-table` | Creates whale data tables | ❌ DELETE if tables exist |
| `fix-plan` | Fixes subscription plan issues | ❌ DELETE if issues resolved |
| `fix-subscription` | Fixes subscription problems | ❌ DELETE if problems resolved |
| `clear-users` | Clears user data (dangerous) | ❌ DELETE |
| `test-user-plan` | Tests user plan functionality | ⚠️ REVIEW |

### Webhook Handlers (Need Consolidation)

| Function | Purpose | Status |
|----------|---------|--------|
| `webhooks` | Generic webhook handler | ⚠️ REVIEW - May be redundant |
| `simple-webhook` | Simplified webhook processing | ⚠️ CONSOLIDATE with stripe-webhook |

---

## Shared Libraries

### _lib/
**What it does:** Shared library code used across multiple edge functions.

**Plain English:** Common code that multiple functions use, like database connections, utility functions, and shared business logic.

**Status:** ✅ KEEP

### _shared/
**What it does:** Shared utilities and common functionality.

**Plain English:** More shared code including CORS headers, rate limiting, error handling, and other utilities that many functions need.

**Status:** ✅ KEEP

### _shared/harvestpro/
**What it does:** Shared business logic specifically for HarvestPro tax loss harvesting.

**Plain English:** The core tax calculation logic that's used by multiple HarvestPro functions - FIFO calculations, eligibility filters, net benefit calculations, etc.

**Status:** ✅ KEEP

---

## Summary Statistics

| Category | Active Functions | Review Needed | Deprecated |
|----------|------------------|---------------|------------|
| Core Business | 2 | 0 | 0 |
| Authentication & Security | 2 | 0 | 0 |
| Wallet Management | 6 | 0 | 0 |
| HarvestPro | 4 | 0 | 0 |
| Guardian | 2 | 3 | 2 |
| Hunter | 2 | 0 | 0 |
| Whale Analytics | 12 | 3 | 0 |
| Market Intelligence | 4 | 3 | 0 |
| Portfolio Tracking | 0 | 2 | 0 |
| Notifications & Alerts | 7 | 0 | 0 |
| Payments & Subscriptions | 4 | 2 | 0 |
| AI/ML Functions | 8 | 0 | 0 |
| Data Ingestion | 5 | 0 | 0 |
| Utility Functions | 15 | 1 | 0 |
| Health Checks | 1 | 2 | 1 |
| Scenario/Export | 5 | 0 | 0 |
| Risk Analysis | 4 | 1 | 0 |
| Alert Processing | 3 | 1 | 0 |
| **TOTAL** | **76** | **18** | **3** |

---

## Recommendations

### Immediate Actions
1. **Delete cockpit duplicates** - These are redundant with Next.js API routes
2. **Delete one-time migration functions** - After confirming migrations are complete
3. **Consolidate health checks** - Keep healthz as primary
4. **Deprecate Guardian v1 functions** - Use v2 versions

### Review Priorities
1. **Whale function consolidation** - Multiple similar functions need merging
2. **Market summary consolidation** - Enhanced vs basic versions
3. **Portfolio tracker consolidation** - Live vs standard versions
4. **Alert system review** - Potential duplicates in alert processing

### Architecture Notes
- Most core business logic properly resides in Edge Functions
- Good separation between data processing (Edge Functions) and presentation (Next.js)
- Shared libraries are well-organized
- Some functions may be over-engineered for current needs

This documentation provides a complete overview of all Supabase Edge Functions with plain English explanations and usage context. Use this as a reference for understanding the system architecture and making decisions about function consolidation or removal.