# 🧪 Week 1 Testing Guide - Mobile UX + Sanctions API

## 🚀 **How to Test Week 1 Features**

### **1. Start Development Server**
```bash
cd /Users/miral/Downloads/smart-stake
npm run dev
```

### **2. Access Scanner Page**
Navigate to: `http://localhost:5173/scanner`

### **3. Test Mobile Responsiveness**

#### **Desktop Testing (Chrome DevTools)**
1. Open Chrome DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select different devices:
   - iPhone 12 Pro (390x844)
   - iPad (768x1024) 
   - Galaxy S20 (360x800)

#### **What to Test:**
- ✅ Tab navigation scrolls horizontally on mobile
- ✅ Risk score display stacks vertically on small screens
- ✅ Metrics cards adapt to single column layout
- ✅ Quick action buttons appear as floating FAB

### **4. Test Sanctions Screening**

#### **Scan a Wallet:**
1. Enter wallet address: `0x742d35Cc6634C0532925a3b8D4C9db4C532925a3`
2. Click "Scan Wallet"
3. Wait for results to load

#### **What to Look For:**
- ✅ Sanctions check card appears at top of results
- ✅ Shows "SANCTIONS CLEAR" with green checkmark
- ✅ Displays timestamp of last check
- ✅ Loading skeleton appears during check

### **5. Test Quick Actions (Mobile)**

#### **On Mobile View:**
1. Scroll to bottom right of screen
2. Look for floating "+" button
3. Tap to expand action menu

#### **Available Actions:**
- ✅ Export Report (Download icon)
- ✅ Set Alert (Bell icon)  
- ✅ Share Analysis (Share icon)
- ✅ Add to Watchlist (Bookmark icon)

### **6. Test Alert Center**

#### **In Risk Analysis Tab:**
1. Scroll down to "Alert Center" section
2. Click "New Alert" button
3. Create test alert rule

#### **Test Alert Creation:**
- ✅ Form appears with alert options
- ✅ Can select alert type (Risk Threshold, Large Transaction, etc.)
- ✅ Can set threshold values
- ✅ Alert appears in rules list when created

### **7. Test Loading States**

#### **During Wallet Scan:**
- ✅ Enhanced loading animation appears
- ✅ Skeleton placeholders show expected content structure
- ✅ Progress indicators provide visual feedback

### **8. Test Performance Monitor**

#### **In Risk Analysis Tab:**
1. Look for "Performance Monitor" card
2. Observe live metrics updating

#### **Metrics Displayed:**
- ✅ API Response Time (ms)
- ✅ Cache Hit Rate (%)
- ✅ Active Connections
- ✅ Memory Usage (%)

## 📱 **Mobile-Specific Tests**

### **Touch Interactions:**
- ✅ All buttons are touch-friendly (44px minimum)
- ✅ Tabs can be swiped horizontally
- ✅ Quick actions expand/collapse smoothly

### **Responsive Breakpoints:**
- ✅ `sm:` (640px+) - Tablet layout
- ✅ `md:` (768px+) - Desktop layout  
- ✅ `lg:` (1024px+) - Large desktop

### **Typography Scaling:**
- ✅ Text remains readable on small screens
- ✅ Important information stays visible
- ✅ Icons scale appropriately

## 🔍 **Expected Behavior**

### **✅ Working Features:**
1. **Mobile Navigation** - Tabs scroll, content adapts
2. **Sanctions Check** - Shows compliance status
3. **Quick Actions** - Floating buttons work
4. **Alert Center** - Can create/manage alerts
5. **Loading States** - Smooth transitions
6. **Performance Monitor** - Live metrics display

### **🚨 Known Limitations:**
- Sanctions API uses mock data (replace with real API)
- Performance metrics are simulated
- Alert notifications are placeholder alerts

## 🐛 **Troubleshooting**

### **If Mobile View Doesn't Work:**
```bash
# Clear browser cache and restart
npm run dev
# Hard refresh: Ctrl+Shift+R
```

### **If Components Don't Load:**
```bash
# Check for missing dependencies
npm install
npm run dev
```

### **If Styles Look Broken:**
- Ensure Tailwind CSS is working
- Check browser console for errors
- Verify all imports are correct

## 📊 **Success Criteria**

### **Mobile UX (25 points)**
- [ ] Responsive design works on all screen sizes
- [ ] Touch interactions are smooth
- [ ] Navigation adapts to mobile constraints
- [ ] Content remains accessible and readable

### **Sanctions API (25 points)**  
- [ ] Sanctions check component displays
- [ ] Loading states work properly
- [ ] Compliance status shows correctly
- [ ] Error handling works gracefully

### **Quick Actions (25 points)**
- [ ] Floating action button appears
- [ ] Action menu expands/collapses
- [ ] All action buttons are functional
- [ ] Tooltips provide clear guidance

### **Alert System (25 points)**
- [ ] Alert center loads properly
- [ ] Can create new alert rules
- [ ] Alert rules display correctly
- [ ] Statistics update appropriately

## 🎯 **Next Steps After Testing**

Once Week 1 testing is complete:
1. **Report any issues** found during testing
2. **Verify all features** work as expected
3. **Ready for Week 2** - UX Polish + Error Handling

**Your WhalePlus platform now has enterprise-grade mobile UX and compliance features! 🐋✨**