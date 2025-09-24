# Market Intelligence Hub - Complete Feature Testing Guide

## 🧪 **Automated Test Results**

Run the test suite:
```bash
npm test src/components/market-hub/__tests__/MarketHub.test.tsx
```

## 📋 **Manual Testing Checklist**

### **1. Market Health Cards (Top Row)**
- [ ] **Card Count**: Exactly 4 cards displayed
- [ ] **Market Mood**: Shows 0-100 index with "Bullish/Bearish" label
- [ ] **24h Volume**: Displays in billions with Δ% (green/red)
- [ ] **Active Whales**: Shows count with Δ% change
- [ ] **Risk Index**: Shows score + "Top 3 Critical Alerts" mini-list
- [ ] **Alert Clicks**: Clicking alerts in Risk card opens sidebar
- [ ] **Loading States**: Shows skeletons when data loading
- [ ] **Error Handling**: Graceful fallback with mock data

### **2. Whale Clusters Grid**
- [ ] **5 Canonical Types**: Accumulation, Distribution, CEX Inflow, DeFi, Dormant→Waking
- [ ] **Cluster Cards**: Show members count, balance USD, risk score
- [ ] **Selection**: Clicking cluster highlights with ring border
- [ ] **Drill-down Table**: Appears below grid on selection
- [ ] **Table Columns**: Address, Balance, Risk Score, Reason Codes, Actions
- [ ] **Risk Colors**: Green (<40), Orange (40-70), Red (70+)
- [ ] **Close Button**: Hides drill-down table
- [ ] **Mock Data**: Works without real API data

### **3. Risk Heatmap by Chain**
- [ ] **4 Chains**: BTC, ETH, SOL, Others displayed
- [ ] **Circular Indicators**: Color-coded risk levels
- [ ] **Hover Details**: Shows risk value, whale count, time window
- [ ] **Responsive**: Adapts to screen size

### **4. Alerts Sidebar (Right)**
- [ ] **Header**: "Real-time Alerts" with item count badge
- [ ] **AI Digest**: Pinned card with 3 bullet points
- [ ] **Quick Filters**: All, High, ≥$1M, My Watchlist badges
- [ ] **Search Box**: Filters alerts by entity names
- [ ] **Advanced Filters**: Chain dropdown, Min USD input
- [ ] **Alert Cards**: Show severity badge, title, description
- [ ] **Threading**: Groups similar alerts (when >1)
- [ ] **Inline Actions**: Watch, Share, Explorer buttons
- [ ] **Scrolling**: Virtualized for performance
- [ ] **Empty State**: Shows when no alerts match filters

### **5. Tab Navigation**
- [ ] **4 Tabs**: Intelligence Hub, Whale Analytics, Sentiment, Correlation
- [ ] **Default Tab**: Intelligence Hub selected on load
- [ ] **Tab Switching**: Updates content and URL params
- [ ] **Icons**: Each tab has appropriate icon
- [ ] **Active State**: Selected tab highlighted
- [ ] **Analytics**: Tab changes tracked

### **6. Intelligence Hub Tab (Default)**
- [ ] **Layout**: Clusters grid + Risk heatmap + Drill-down table
- [ ] **Interactions**: All cluster selection features work
- [ ] **Responsive**: Mobile-friendly layout

### **7. Whale Analytics Tab**
- [ ] **Whale Cards**: Detailed risk factor breakdown
- [ ] **Risk Factors**: 5 factors with scores and weights
- [ ] **Progress Bars**: Visual risk factor representation
- [ ] **Peer Comparison**: Rank within cluster
- [ ] **Activity Summary**: 24h transactions, net flow
- [ ] **Peer Table**: Comparison with other whales
- [ ] **Actions**: "Detailed Analysis" and "Add to Watchlist"

### **8. Sentiment Analysis Tab**
- [ ] **Multi-Coin Cards**: 6+ cryptocurrency sentiment cards
- [ ] **0-100 Scale**: Consistent sentiment scoring
- [ ] **Sentiment Labels**: Very Bullish, Bullish, Neutral, Bearish, Very Bearish
- [ ] **24h Change**: Trending up/down indicators
- [ ] **Fear & Greed**: Secondary indicator per coin
- [ ] **Social Mentions**: Count display
- [ ] **Key Drivers**: Reason badges (max 2 shown)
- [ ] **Favorites**: Star/unstar functionality
- [ ] **Sort Options**: By sentiment, favorites
- [ ] **Market Overview**: Summary stats at bottom

### **9. Correlation Heatmap Tab**
- [ ] **8x8 Matrix**: Correlation grid for major coins
- [ ] **Color Coding**: Green (strong positive) to Red (negative)
- [ ] **Hover Tooltips**: Shows exact correlation value + label
- [ ] **Fixed Headers**: Row/column headers stay visible
- [ ] **Legend**: 8-level correlation strength guide
- [ ] **Key Insights**: 3 insight cards below heatmap
- [ ] **Export Buttons**: CSV/PNG with Pro gating
- [ ] **Responsive**: Mobile-optimized view

### **10. Command Palette (Cmd+K)**
- [ ] **Keyboard Shortcut**: Cmd+K (Mac) or Ctrl+K (Windows) opens
- [ ] **Search Input**: Placeholder text and focus
- [ ] **Categories**: Coins, Whale Addresses, Whale Clusters
- [ ] **Search Results**: Fuzzy matching on names/symbols
- [ ] **Selection**: Click or Enter to select item
- [ ] **Close**: Escape key or click outside
- [ ] **Entity Selection**: Triggers contextual action bar

### **11. Contextual Action Bar (Bottom)**
- [ ] **Trigger**: Appears only when whale/cluster/alert selected
- [ ] **Entity Display**: Shows selected item name, subtitle, badge
- [ ] **Trade/Hedge**: Button with feature flag check
- [ ] **Add to Watchlist**: Cross-tab entity tracking
- [ ] **Share**: Copies shareable URL to clipboard
- [ ] **Export CSV**: Pro-gated with badge
- [ ] **Export PDF**: Pro-gated with badge
- [ ] **Close Button**: X button hides action bar
- [ ] **Disabled States**: Shows "Soon" or "Pro" badges appropriately

### **12. Pro Feature Gating**
- [ ] **Free User**: Export buttons disabled with "Pro" badges
- [ ] **Free User**: Alert on export click with upgrade message
- [ ] **Premium User**: All export features enabled
- [ ] **Feature Flags**: Trade button respects oneClickTrade flag
- [ ] **Subscription Check**: Real-time plan verification

### **13. Analytics Tracking**
- [ ] **Page Load**: market_hub_view_loaded event
- [ ] **Tab Changes**: market_hub_tab_changed with from/to
- [ ] **Entity Selection**: entity_selected with type/id
- [ ] **Alert Clicks**: alert_clicked with severity/id
- [ ] **Export Actions**: export_clicked with type/format
- [ ] **Command Palette**: search_used with query
- [ ] **Cluster Selection**: whale_cluster_selected with details

### **14. Error Handling & Edge Cases**
- [ ] **API Failures**: Graceful fallback to mock data
- [ ] **Loading States**: Skeleton loaders during data fetch
- [ ] **Empty States**: Appropriate messages when no data
- [ ] **Network Errors**: Retry mechanisms and error messages
- [ ] **Invalid URLs**: Handles bad tab parameters
- [ ] **Browser Back/Forward**: URL state management
- [ ] **Mobile Viewport**: Responsive design works

### **15. Performance & Accessibility**
- [ ] **Virtualization**: Large lists scroll smoothly
- [ ] **Keyboard Navigation**: Tab through all interactive elements
- [ ] **Screen Reader**: ARIA labels and roles
- [ ] **High Contrast**: Colors meet accessibility standards
- [ ] **Loading Performance**: Initial render < 2.5s
- [ ] **Memory Usage**: No memory leaks on tab switching
- [ ] **Cache Efficiency**: API responses cached appropriately

## 🚀 **Quick Test Commands**

```bash
# Run all tests
npm test

# Test specific component
npm test MarketHub

# Test with coverage
npm run test:coverage

# E2E tests (if configured)
npm run test:e2e

# Performance testing
npm run lighthouse

# Accessibility testing
npm run test:a11y
```

## 🐛 **Known Issues to Test**

1. **Button Nesting**: Fixed tooltip warnings
2. **API Timeouts**: 30s timeout handling
3. **Mobile Scrolling**: Sidebar scroll on mobile
4. **Memory Leaks**: Component cleanup on unmount
5. **URL State**: Browser navigation edge cases

## ✅ **Test Completion Criteria**

- [ ] All 15 feature categories pass
- [ ] No console errors or warnings
- [ ] Lighthouse score >90 for Performance/Accessibility
- [ ] Works on Chrome, Firefox, Safari
- [ ] Mobile responsive on iOS/Android
- [ ] Pro/Free tier features work correctly
- [ ] Analytics events fire properly
- [ ] Error boundaries catch failures gracefully

## 📊 **Success Metrics**

- **Functionality**: 100% of features working
- **Performance**: P95 load time <700ms
- **Accessibility**: WCAG 2.1 AA compliance
- **Error Rate**: <0.1% for critical paths
- **User Experience**: Smooth interactions, no jank