# Hunter Screen: Live Data & Wallet Scanning Flow

## 🔄 Complete Data Flow Explanation

### Overview

The Hunter Screen has **TWO separate but connected systems**:

1. **Opportunity Feed** (Hunter Screen) - Shows DeFi opportunities
2. **Wallet Scanning** (Guardian + Eligibility) - Analyzes user wallets

---

## 1. 📊 Opportunity Feed (Hunter Screen)

### How Live Data Works

```
┌─────────────────────────────────────────────────────────────┐
│                    HUNTER SCREEN FLOW                        │
└─────────────────────────────────────────────────────────────┘

1. User visits /hunter
   ↓
2. Hunter.tsx loads with isDemo={true/false}
   ↓
3. useHunterFeed hook checks mode:
   
   IF isDemo = true:
   ├─→ Returns MOCK DATA (5 hardcoded opportunities)
   └─→ Used for testing/demo purposes
   
   IF isDemo = false:
   ├─→ Calls getFeedPage() API
   ├─→ Queries mv_opportunity_rank materialized view
   ├─→ Returns LIVE opportunities from database
   └─→ Ranked by: 60% relevance + 25% trust + 15% urgency

4. Opportunities displayed in feed
   ↓
5. Each card shows:
   - Title, protocol, chain
   - Guardian trust score (from guardian_scans table)
   - Reward amount
   - Time left
   - Eligibility preview (if wallet connected)
```

### Data Sources for Opportunities

**Live opportunities come from**:
- `opportunities` table in Supabase
- Populated by:
  - Partner APIs (Aave, Uniswap, etc.)
  - Internal curation team
  - Aggregator services (DeFi Llama, etc.)

**Guardian trust scores come from**:
- `guardian_scans` table
- Populated by:
  - Guardian API scanning opportunity contracts
  - Cron job rescanning stale opportunities (>24h)

---

## 2. 👛 Wallet Scanning Flow

### Which Wallet Gets Scanned?

**Answer**: The **USER'S CONNECTED WALLET** (not the opportunity creator's wallet)

### Two Types of Wallet Scanning:

#### A. Guardian Trust Scanning (Opportunity Contracts)

```
┌─────────────────────────────────────────────────────────────┐
│              GUARDIAN OPPORTUNITY SCANNING                   │
└─────────────────────────────────────────────────────────────┘

1. Opportunity added to database
   ↓
2. Guardian API scans the OPPORTUNITY'S CONTRACT ADDRESS
   ↓
3. Checks for:
   - Phishing indicators
   - Scam patterns
   - Contract vulnerabilities
   - Rug pull risks
   ↓
4. Trust score calculated (0-100)
   ↓
5. Stored in guardian_scans table
   ↓
6. Displayed on Hunter cards as trust chip
```

**Example**:
- Opportunity: "Stake ETH on Lido"
- Guardian scans: Lido's staking contract address
- Trust score: 95/100 (Green)
- Displayed on card: "✓ 95 Guardian Score"

#### B. Eligibility Scanning (User Wallets)

```
┌─────────────────────────────────────────────────────────────┐
│              USER WALLET ELIGIBILITY SCANNING                │
└─────────────────────────────────────────────────────────────┘

1. User connects wallet (MetaMask, WalletConnect, etc.)
   ↓
2. User views opportunity card
   ↓
3. Frontend calls /api/eligibility/preview
   ├─→ Passes: user's wallet address + opportunity ID
   └─→ Checks cache first (60 min TTL)
   ↓
4. If not cached, fetches wallet signals:
   ├─→ Wallet age (days since first transaction)
   ├─→ Transaction count
   ├─→ Chain presence (active on required chain?)
   ├─→ Holdings (has required tokens?)
   └─→ Allowlist proofs (whitelisted?)
   ↓
5. Calculates eligibility score (0-1):
   ├─→ Chain presence: 40% weight
   ├─→ Wallet age: 25% weight
   ├─→ Transaction count: 20% weight
   ├─→ Holdings: 15% weight
   └─→ Allowlist: +5% bonus
   ↓
6. Returns label:
   ├─→ ≥0.7 = "Likely Eligible" ✓
   ├─→ 0.4-0.69 = "Maybe Eligible" ?
   └─→ <0.4 = "Unlikely Eligible" ✗
   ↓
7. Cached for 60 minutes
   ↓
8. Displayed on card: "✓ Likely Eligible"
```

**Example**:
- User wallet: `0x1234...5678`
- Opportunity: "LayerZero Airdrop" (requires Ethereum activity)
- System checks:
  - ✓ Wallet has Ethereum transactions (40%)
  - ✓ Wallet is 180 days old (25%)
  - ✓ Has 50+ transactions (20%)
  - ✓ Holds ETH (15%)
  - ✗ Not on allowlist (0%)
- **Score**: 0.85 → "Likely Eligible"

---

## 3. 🔗 Complete Integration Flow

### When User Visits Hunter Screen:

```
┌─────────────────────────────────────────────────────────────┐
│                  COMPLETE USER FLOW                          │
└─────────────────────────────────────────────────────────────┘

STEP 1: Load Opportunities
├─→ Fetch from database (live mode)
├─→ Each opportunity has pre-scanned Guardian trust score
└─→ Display cards with trust chips

STEP 2: User Connects Wallet (Optional)
├─→ Wallet address captured
├─→ Stored in session
└─→ Used for eligibility checks

STEP 3: Eligibility Preview (Per Card)
├─→ For each visible card:
│   ├─→ Check if user wallet is eligible
│   ├─→ Analyze wallet signals
│   ├─→ Calculate score
│   └─→ Display "Likely Eligible" badge
└─→ Cached to avoid repeated scans

STEP 4: User Clicks "Join Quest"
├─→ Redirects to opportunity page
├─→ Action Engine executes transaction
└─→ Wallet signs transaction
```

---

## 4. 📍 Where Wallets Are Scanned

### Guardian Page (`/guardian`)

**Purpose**: Scan ANY wallet for security analysis

```
User Flow:
1. Visit /guardian page
2. Enter wallet address (or connect wallet)
3. Guardian scans wallet for:
   - Phishing exposure
   - Scam interactions
   - Compromised contracts
   - Risk score
4. Results displayed with trust score
5. Stored in guardian_scans table
6. Can export proof/report
```

**Use Case**: 
- Check if a wallet is safe before interacting
- Verify your own wallet security
- Analyze any Ethereum address

### Hunter Screen (`/hunter`)

**Purpose**: Show eligibility for opportunities

```
User Flow:
1. Connect wallet
2. Browse opportunities
3. System automatically checks:
   - Is wallet eligible for THIS opportunity?
   - Does wallet meet requirements?
4. Display "Likely Eligible" badge
5. No manual scanning needed
```

**Use Case**:
- See which opportunities you qualify for
- Filter by "Likely Eligible"
- Save time on ineligible opportunities

---

## 5. 🎯 Key Differences

| Feature | Guardian Scanning | Eligibility Scanning |
|---------|------------------|---------------------|
| **What's Scanned** | Opportunity contracts | User wallets |
| **Purpose** | Security/trust score | Qualification check |
| **When** | When opportunity added | When user views card |
| **Frequency** | Every 24 hours (auto-rescan) | On-demand (cached 60 min) |
| **Displayed As** | Trust chip (Green/Amber/Red) | Eligibility badge |
| **User Action** | None (automatic) | Must connect wallet |
| **Cache** | Redis (1 hour) | Database (60 min) |

---

## 6. 💡 Example Scenarios

### Scenario 1: Anonymous User (No Wallet)

```
User visits /hunter
├─→ Sees 12 opportunities (live data)
├─→ Each card shows Guardian trust score
├─→ NO eligibility badges (wallet not connected)
└─→ Can filter by trust level, type, chain, etc.
```

### Scenario 2: Connected Wallet User

```
User connects wallet: 0xABC...123
├─→ Sees 12 opportunities (live data)
├─→ Each card shows:
│   ├─→ Guardian trust score (opportunity security)
│   └─→ Eligibility badge (user qualification)
├─→ Can filter by "Likely Eligible"
└─→ Personalized ranking based on wallet history
```

### Scenario 3: Guardian Page Scan

```
User visits /guardian
├─→ Enters wallet: 0xDEF...456
├─→ Guardian scans wallet for security
├─→ Shows:
│   ├─→ Trust score: 85/100
│   ├─→ Security flags: None
│   └─→ Risk level: Low
└─→ Can export proof
```

---

## 7. 🔧 Technical Implementation

### Data Flow Diagram

```
┌──────────────┐
│   Database   │
│              │
│ opportunities│◄─── Partner APIs
│ guardian_scans│◄─── Guardian API
│ eligibility_  │◄─── Wallet signals
│   cache      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  API Layer   │
│              │
│ /api/hunter/ │
│ opportunities│
│              │
│ /api/guardian│
│ /summary     │
│              │
│ /api/        │
│ eligibility/ │
│ preview      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Frontend    │
│              │
│ Hunter.tsx   │
│ useHunterFeed│
│              │
│ Opportunity  │
│ Card         │
│              │
│ Guardian     │
│ TrustChip    │
│              │
│ Eligibility  │
│ Preview      │
└──────────────┘
```

### Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      CACHE LAYERS                            │
└─────────────────────────────────────────────────────────────┘

1. Guardian Trust Scores
   ├─→ Redis cache: 1 hour TTL
   ├─→ Database: guardian_scans table
   └─→ Auto-rescan: Every 24 hours

2. Eligibility Scores
   ├─→ Database: eligibility_cache table
   ├─→ TTL: 60 minutes
   └─→ Per wallet + opportunity pair

3. Wallet Signals
   ├─→ Redis cache: 20 minutes TTL
   ├─→ Key: wallet_signals:{address}:{day}
   └─→ Reduces blockchain queries

4. Feed Results
   ├─→ HTTP cache: 60 seconds
   ├─→ ETag support for 304 responses
   └─→ Stale-while-revalidate: 5 minutes
```

---

## 8. ✅ Summary

### Live Data Flow:
1. **Opportunities** → Fetched from database (live mode)
2. **Trust Scores** → Pre-scanned by Guardian (opportunity contracts)
3. **Eligibility** → Calculated on-demand (user wallets)

### Which Wallets Are Scanned:
1. **Opportunity Contracts** → Scanned by Guardian for security
2. **User Wallets** → Scanned for eligibility when connected
3. **Any Wallet** → Can be scanned on `/guardian` page

### Key Points:
- ✅ Hunter shows LIVE opportunities from database
- ✅ Guardian scans OPPORTUNITY contracts (not user wallets)
- ✅ Eligibility scans USER wallets (when connected)
- ✅ Both systems work together for complete UX
- ✅ All scanning is automatic and cached

---

**Status**: Fully Implemented ✅  
**Documentation**: Complete  
**Ready for**: Production deployment
