# Smart-Stake API Implementation Guide

## Table of Contents
- [Subscription & Payment Functions](#1-subscription--payment-functions)
- [Whale Analytics & Alerts](#2-whale-analytics--alerts)
- [ML & Sentiment Functions](#3-ml--sentiment-functions)
- [Utility & Monitoring Functions](#4-utility--monitoring-functions)
- [User Features](#5-user-features)
- [API Reference Table](#6-api-reference-table)
- [Supabase Service Usage](#supabase-service-usage)
- [Usage Example](#usage-example)

---

## 1. Subscription & Payment Functions

### `simple-subscription`
- **Purpose:** Handles Stripe checkout session creation and payment verification. Updates user plan in Supabase.
- **Input:**  
  - `action`: `"create-checkout"` or `"verify-payment"`
  - `priceId`, `userId`, `sessionId`
- **Output:**  
  - On create: `{ url }` (Stripe checkout URL)
  - On verify: Updates user plan, returns status
- **Supabase Usage:** Auth, Database (users)
- **Improvements:** Add error handling for missing parameters, log Stripe errors.

### `manage-subscription`
- **Purpose:** Manage user subscriptions (upgrade, downgrade, cancel) via Stripe and Supabase.
- **Input:**  
  - Auth header (Bearer token)
  - `action`, `subscriptionId`, `priceId`
- **Output:**  
  - Status, updated subscription info
- **Supabase Usage:** Auth, Database (users, subscriptions)
- **Improvements:** Add more granular error messages, validate actions.

---

## 2. Whale Analytics & Alerts

### `real-whale-alerts`
- **Purpose:** Fetches live whale alerts from Supabase and transforms for frontend.
- **Input:** None (GET)
- **Output:**  
  - `{ predictions }`
- **Improvements:** Add caching, allow filtering by address.

### `whale-profile`
- **Purpose:** Returns whale profile, transactions, and portfolio for a given address.
 - **API Name:** `simple-subscription`
 - **External API Vendor:** Stripe
- **Output:**  
  - `{ profile, transactions, portfolio }`
- **Improvements:** Connect to real DB, add error handling for missing address.

- **Input:**  
  - `action`: `"create_alert"`, `"toggle_watchlist"`
 - **API Name:** `manage-subscription`
 - **External API Vendor:** Stripe
  - Success message or updated watchlist
- **Supabase Usage:** Database (whale_alerts, user_watchlists)

- **Input:** None (GET)
  - `{ success, count, transactions }`
- **Supabase Usage:** None (external API)
- **Improvements:** Add error handling for API failures.

 - **API Name:** `real-whale-alerts`
 - **External API Vendor:** None (Supabase DB)

- **Input:** None (GET)
- **Output:**  
 - **API Name:** `whale-predictions`
 - **External API Vendor:** Etherscan

- **Input:** None (GET)
- **Output:**  
 - **API Name:** `whale-profile`
 - **External API Vendor:** None (mock data)
- **Improvements:** Add caching, allow custom coin list.
---

### `api-monitor`
 - **API Name:** `whale-notifications`
 - **External API Vendor:** None (Supabase DB)
- **Output:**  
  - `{ success, currentStatus, metrics }`
- **Improvements:** Add more APIs, alerting on failures.
- **Purpose:** Tests user plan queries with different Supabase keys.
- **Input:** Auth header (Bearer token)
 - **API Name:** `whale-alerts`
 - **External API Vendor:** Whale Alert
- **Improvements:** Add more test cases, log errors.
- **Purpose:** Scans wallet address for risk factors.
  - `walletAddress`, `userId`
- **Output:**  
  - Risk analysis object
- **Supabase Usage:** None (mock analysis)
 - **API Name:** `ml-training`
 - **External API Vendor:** None
- **Purpose:** Returns portfolio data for a list of addresses.
- **Output:**  
  - Portfolio data per address
 - **API Name:** `multi-coin-sentiment`
 - **External API Vendor:** CoinGecko, Alternative.me
### `blockchain-monitor`
  - `address`
  - Transactions, balances
- **Supabase Usage:** None (external API)
- **Improvements:** Add error handling, support more chains.

 - **API Name:** `api-monitor`
 - **External API Vendor:** Etherscan, CoinGecko

- **Input:**  
  - Auth header (Bearer token)
 - **API Name:** `test-user-plan`
 - **External API Vendor:** None
  - Success message or notes data

### `webhooks`
 - **API Name:** `riskScan`
 - **External API Vendor:** None (mock analysis)
  - Auth header (Bearer token)
  - JSON body for create/trigger
- **Supabase Usage:** Auth, Database (webhooks)
- **Improvements:** Add event logs, validate webhook URLs.
 - **API Name:** `portfolio-tracker`
 - **External API Vendor:** None (mock data)


| `/functions/v1/simple-subscription` | simple-subscription | `{ action, priceId, userId, sessionId }` | `{ url }` or status update        | Auth, DB (users)       | Create Stripe checkout |
| `/functions/v1/manage-subscription` | manage-subscription | Auth header, `{ action, subscriptionId, priceId }` | Status, subscription info         | Auth, DB (users, subscriptions) | Upgrade plan |
 - **API Name:** `blockchain-monitor`
 - **External API Vendor:** Alchemy, Moralis
| `/functions/v1/whale-profile`       | whale-profile       | Query: `address`, `chain`            | `{ profile, transactions, portfolio }` | -                  | Get whale profile |
| `/functions/v1/whale-alerts`        | whale-alerts        | None                                 | `{ success, count, transactions }`| -                      | Get whale txs |
| `/functions/v1/api-monitor`         | api-monitor         | None                                 | `{ success, currentStatus, metrics }` | DB (data_quality_metrics) | Monitor APIs |
| `/functions/v1/riskScan`            | riskScan            | `{ walletAddress, userId }`          | Risk analysis object              | -                      | Scan wallet |
| `/functions/v1/portfolio-tracker`   | portfolio-tracker   | `{ addresses }`                      | Portfolio data                    | -                      | Get portfolio |
| `/functions/v1/blockchain-monitor`  | blockchain-monitor  | `{ address }`                        | Transactions, balances            | -                      | Get blockchain data |
| `/functions/v1/user-notes`          | user-notes          | Auth header, `{ method, coinId, note }` | Success or notes data           | Auth, DB (user_notes)  | Save/get notes |
 - **API Name:** `user-notes`
 - **External API Vendor:** None
---

## Supabase Service Usage
- **Auth:** Used for user authentication and authorization in most functions.
- **Functions:** All endpoints above are implemented as Supabase Edge Functions.

 - **API Name:** `webhooks`
 - **External API Vendor:** None
## Usage Example

**Create Stripe Checkout (simple-subscription):**
POST /functions/v1/simple-subscription
  "priceId": "price_1S0HB3JwuQyqUsks8bKNUt6M",
}
```
**Response:**
| Endpoint                        | API Name              | External API Vendor         | Request Params / Body                | Response Structure                | Supabase Usage         | Example Usage |
|----------------------------------|-----------------------|----------------------------|--------------------------------------|-----------------------------------|------------------------|---------------|
| `/functions/v1/simple-subscription` | simple-subscription  | Stripe                     | `{ action, priceId, userId, sessionId }` | `{ url }` or status update        | Auth, DB (users)       | Create Stripe checkout |
| `/functions/v1/manage-subscription` | manage-subscription  | Stripe                     | Auth header, `{ action, subscriptionId, priceId }` | Status, subscription info         | Auth, DB (users, subscriptions) | Upgrade plan |
| `/functions/v1/real-whale-alerts`   | real-whale-alerts    | None (Supabase DB)         | None                                 | `{ success, transactions, count }`| DB (alerts)            | Get whale alerts |
| `/functions/v1/whale-predictions`   | whale-predictions    | Etherscan                  | None                                 | `{ predictions }`                 | -                      | Get predictions |
| `/functions/v1/whale-profile`       | whale-profile        | None (mock data)           | Query: `address`, `chain`            | `{ profile, transactions, portfolio }` | -                  | Get whale profile |
| `/functions/v1/whale-notifications` | whale-notifications  | None (Supabase DB)         | `{ action, userId, whaleAddress, ...}`| Success or watchlist data         | DB (whale_alerts, user_watchlists) | Create alert |
| `/functions/v1/whale-alerts`        | whale-alerts         | Whale Alert                | None                                 | `{ success, count, transactions }`| -                      | Get whale txs |
| `/functions/v1/ml-training`         | ml-training          | None                       | None                                 | Status, model accuracy            | DB (ml_models, ml_predictions) | Train models |
| `/functions/v1/multi-coin-sentiment`| multi-coin-sentiment | CoinGecko, Alternative.me  | None                                 | Sentiment scores                  | -                      | Get coin sentiment |
| `/functions/v1/api-monitor`         | api-monitor          | Etherscan, CoinGecko       | None                                 | `{ success, currentStatus, metrics }` | DB (data_quality_metrics) | Monitor APIs |
| `/functions/v1/test-user-plan`      | test-user-plan       | None                       | Auth header                          | Query results                     | Auth, DB (users), RPC  | Test user plan |
| `/functions/v1/riskScan`            | riskScan             | None (mock analysis)       | `{ walletAddress, userId }`          | Risk analysis object              | -                      | Scan wallet |
| `/functions/v1/portfolio-tracker`   | portfolio-tracker    | None (mock data)           | `{ addresses }`                      | Portfolio data                    | -                      | Get portfolio |
| `/functions/v1/blockchain-monitor`  | blockchain-monitor   | Alchemy, Moralis           | `{ address }`                        | Transactions, balances            | -                      | Get blockchain data |
| `/functions/v1/user-notes`          | user-notes           | None                       | Auth header, `{ method, coinId, note }` | Success or notes data           | Auth, DB (user_notes)  | Save/get notes |
| `/functions/v1/webhooks`            | webhooks             | None                       | Auth header, action in URL, JSON body| Success or webhook data           | Auth, DB (webhooks)    | Manage webhooks |
## 6. API Reference Table
