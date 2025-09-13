# Whale Alerts Dashboard Implementation Guide

## 1. User Flow Overview

### Home Button Navigation
- **When you click the Home button:**
  - You are routed to the main dashboard (`Home.tsx` or `WhaleAnalytics.tsx`).
  - The dashboard loads real-time whale alerts, analytics, and your personalized watchlist.

### Whale Alerts Screen
- **Main Features:**
  - Real-time whale transaction feed
  - Risk scoring and filtering
  - Custom alert creation and management
  - Whale profile exploration
  - Community watchlists and export options

---

## 2. Main Components & Their Roles

| Component                | Purpose                                                                                  |
|--------------------------|------------------------------------------------------------------------------------------|
| `WhaleAnalytics.tsx`     | Main dashboard page. Loads whale data, handles navigation, modals, and alert setup.      |
| `WhaleBehaviorAnalytics` | Displays market signals, whale list, risk filters, export/report buttons, and admin panel|
| `AlertQuickActions`      | Sidebar widget for managing custom alert rules, templates, and history                   |
| `AlertsManager`          | Modal/dashboard for full alert management (view, edit, delete, trigger history)          |
| `WhaleProfileModal`      | Modal for viewing detailed whale profile, transactions, and portfolio                    |
| `EnterpriseFeatures`     | Advanced alerting, risk rules, and enterprise analytics (for premium users)              |

---

## 3. API Endpoints & Data Flow

| API Name                | Endpoint                        | External Vendor      | Purpose/Usage                                  |
|-------------------------|---------------------------------|----------------------|------------------------------------------------|
| `real-whale-alerts`     | `/functions/v1/real-whale-alerts` | Supabase DB         | Fetches latest whale alerts for dashboard      |
| `whale-predictions`     | `/functions/v1/whale-predictions` | Etherscan           | Gets rule-based predictions for whale activity |
| `whale-profile`         | `/functions/v1/whale-profile`     | (Mock/DB)           | Loads whale profile and transaction history    |
| `whale-notifications`   | `/functions/v1/whale-notifications` | Supabase DB         | Create/manage custom alerts and watchlists     |
| `whale-alerts`          | `/functions/v1/whale-alerts`      | Whale Alert API     | Gets live whale transactions from external API |

**Data Flow Example:**
1. **Dashboard loads:**  
   - Calls `real-whale-alerts` to get latest alerts.
   - Calls `whale-predictions` for market signals.
   - Loads user watchlist from Supabase.
2. **User clicks a whale:**  
   - Opens `WhaleProfileModal` with data from `whale-profile`.
3. **User creates alert:**  
   - Opens alert setup modal, submits to `whale-notifications`.
4. **User views community watchlists:**  
   - Loads shared watchlists from Supabase.

---

## 4. Dashboard Features & Interactions

### Real-Time Whale Feed
- Displays transactions with risk scores, types, and chain/token info.
- Uses `real-whale-alerts` API for data.

### Risk Filtering & Market Signals
- Filter whales by risk level (high, medium, low, new, escalating, etc.).
- Market signals (high risk, clustering, accumulation) shown in summary bar.

### Custom Alerts & Watchlists
- Create custom alerts for whale activity (withdrawal, deposit, activity spike, balance change).
- Manage watchlist (star/eye icons) for favorite whales.
- Alerts managed via `whale-notifications` API.

### Whale Profile Exploration
- Click any whale to view detailed profile, transaction history, and portfolio.
- Modal loads data from `whale-profile` API.

### Community & Enterprise Features
- View and join community watchlists.
- Access advanced analytics and risk rules (premium/enterprise users).

### Export & Reporting
- Export whale data or high-risk reports (CSV, PDF, etc.).
- Buttons for export and report generation.

---

## 5. Example User Actions

### View Whale Alerts
- Click Home → Dashboard loads whale alerts via API.
- See live feed, risk scores, and market signals.

### Create a Custom Alert
- Click Bell icon on whale card or in sidebar.
- Fill out alert type, threshold, notification method.
- Submit → Alert is saved via `whale-notifications` API.

### Explore Whale Profile
- Click whale address or profile icon.
- Modal opens with full profile, transactions, and analytics.

### Manage Watchlist
- Click Star/Eye icon to add/remove whale from watchlist.
- Watchlist summary updates in dashboard.

### Use Enterprise Features
- Click Enterprise button for advanced risk rules and analytics.

---

## 6. API Usage Example

**Fetch Whale Alerts:**
```http
GET /functions/v1/real-whale-alerts
```
**Response:**
```json
{
  "success": true,
  "transactions": [ ... ],
  "count": 50
}
```

**Create Custom Alert:**
```http
POST /functions/v1/whale-notifications
{
  "action": "create_alert",
  "userId": "user-uuid",
  "whaleAddress": "0xabc...",
  "alertType": "withdrawal",
  "thresholdAmount": 100,
  "notificationMethod": "email"
}
```
**Response:**
```json
{ "success": true, "message": "Alert created successfully" }
```

---

## 7. Architecture Reference

- See `docs/architecture-diagram.md` for full data flow.
- See `LIVE_WHALE_SETUP.md` for setup and monitoring instructions.

---

For further technical details, see the source code or contact the development team.
