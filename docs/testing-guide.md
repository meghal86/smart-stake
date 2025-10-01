# AlphaWhale Feature Testing Guide

## 🧪 How to Test Each Feature

### 1. Onboarding Wizard
**Test Steps:**
```bash
# Clear localStorage to trigger onboarding
localStorage.clear()
# Refresh page
```
**Expected:** Modal appears with "Make it yours" step
**Actions:** Select assets → Follow whales → Enable alerts → Complete

### 2. For You Row
**Test Steps:**
```bash
# Enable flag
localStorage.setItem('feature_flags', JSON.stringify({'forYou.enabled': true}))
```
**Expected:** Horizontal scrollable row with whale cards
**Actions:** Click Set Alert, Follow/Unfollow, Share buttons

### 3. Alerts Feed
**Test Steps:**
```bash
# Enable flag
localStorage.setItem('feature_flags', JSON.stringify({'alerts.feed': true}))
```
**Expected:** Alerts section with filters (All/Mine/System)
**Actions:** Create alert, mark as read, mark all read

### 4. Mobile Dock
**Test Steps:**
```bash
# Enable flag and resize to mobile
localStorage.setItem('feature_flags', JSON.stringify({'mobileDock.enabled': true}))
# Resize browser to <768px width
```
**Expected:** Bottom dock with 4 icons
**Actions:** Click Spotlight, Watchlist, Alerts, Upgrade

### 5. Refresh Button
**Test Steps:**
- Look for "Refresh" button next to timestamps
**Expected:** Shows spinner and "Updating..." when clicked
**Actions:** Click refresh, observe loading state

### 6. Confidence Chip
**Test Steps:**
- Check Whale Spotlight section
**Expected:** Green/Yellow/Red chip showing "High/Med/Low Confidence"
**Actions:** Hover for tooltip explanation

### 7. Pro Teaser
**Test Steps:**
- Scroll to bottom of page
**Expected:** Blue gradient section with "$19/mo" pricing
**Actions:** Click "See full analysis" button

### 8. Actionable Digest
**Test Steps:**
- Hover over digest items
**Expected:** Mini buttons appear (A, F, +)
**Actions:** Click buttons, try keyboard shortcuts A and F

### 9. Sync Status
**Test Steps:**
```bash
# Check navbar for sync chip
```
**Expected:** "Synced • Xm ago" or "Link to email" chip
**Actions:** Click to see sync options

### 10. Enhanced Spotlight
**Test Steps:**
- Check Whale Spotlight card
**Expected:** UTC timestamp, Etherscan link, confidence chip
**Actions:** Click Etherscan link, click refresh

## 🔧 Feature Flag Controls

### Enable All Features
```javascript
localStorage.setItem('feature_flags', JSON.stringify({
  'ui.v2': true,
  'onboarding.enabled': true,
  'forYou.enabled': true,
  'alerts.feed': true,
  'mobileDock.enabled': true,
  'visual.feedback': true,
  'sync.cloud': true
}))
```

### Reset Onboarding
```javascript
localStorage.removeItem('onboardingCompleted')
```

### View Telemetry Events
```javascript
// Open browser console and check for:
console.log('📊 Telemetry Event:', ...)
```

## 📱 Mobile Testing

### Responsive Breakpoints
- **Desktop:** >1024px - Full layout
- **Tablet:** 768-1024px - Stacked cards
- **Mobile:** <768px - Mobile dock appears

### Mobile-Specific Features
1. **Bottom Dock:** Appears only on mobile
2. **Safe Areas:** Content doesn't overlap dock
3. **Touch Targets:** Buttons are 44px+ for touch

## 🎯 User Flows to Test

### New User Flow
1. **First Visit:** Onboarding wizard appears
2. **Step 1:** Select 2+ assets
3. **Step 2:** Follow 2+ whales
4. **Step 3:** Enable alerts
5. **Complete:** For You row populated

### Engagement Flow
1. **For You:** Click Set Alert from For You row
2. **Digest:** Hover and click mini CTAs
3. **Spotlight:** Click Follow Whale
4. **Alerts:** Create new alert
5. **Share:** Use share buttons

### Conversion Flow
1. **Pro Teaser:** Click "See full analysis"
2. **Upgrade Links:** Click upgrade CTAs
3. **Trust:** Click methodology links
4. **Confidence:** Check confidence indicators

## 🐛 Common Issues & Fixes

### Onboarding Not Showing
```javascript
// Check flags and clear completion
localStorage.removeItem('onboardingCompleted')
localStorage.setItem('feature_flags', JSON.stringify({'onboarding.enabled': true}))
```

### Mobile Dock Missing
```javascript
// Enable flag and check screen size
localStorage.setItem('feature_flags', JSON.stringify({'mobileDock.enabled': true}))
// Resize browser to <768px
```

### For You Row Empty
```javascript
// Check if watchlist has data
console.log(localStorage.getItem('whaleplus_watchlist'))
```

### Alerts Not Persisting
```javascript
// Check alerts storage
console.log(localStorage.getItem('alpha/alerts'))
```

## 🧪 Automated Testing

### Run Unit Tests
```bash
npm test -- --testPathPattern=stickiness
npm test -- --testPathPattern=polish
```

### Run E2E Tests
```bash
npx playwright test --grep="onboarding"
npx playwright test --grep="mobile dock"
```

### Visual Testing
```bash
npx playwright test --grep="visual" --update-snapshots
```

## 📊 Analytics Testing

### Check Telemetry
1. Open browser DevTools → Console
2. Interact with features
3. Look for telemetry events logged

### Event Types to Verify
- `nux_start`, `nux_complete`
- `follow_whale`, `unfollow_whale`
- `create_alert_open`, `alert_created`
- `share_spotlight`
- `upgrade_click`

---

**Quick Test:** Enable all flags, clear onboarding, refresh page, complete wizard, interact with all features, check console for telemetry events.