# "Start Harvest" Button - What Should Happen vs What's Implemented

## 🎯 What SHOULD Happen (According to Requirements)

When a user clicks the **"Start Harvest"** button on an opportunity card:

### Step 1: Open Detail Modal (Requirement 7.1)
```
✅ Task 14: HarvestDetailModal component
```
The system should open a modal showing:
- Harvest plan title with token symbol
- Summary section (unrealized loss, net benefit, key metrics)
- Guardian warning banner (if high risk)
- Step-by-step actions list with:
  - Step numbers
  - Descriptions
  - Status icons
- Cost breakdown table
- Net benefit summary
- **"Execute Harvest"** button

### Step 2: User Reviews & Clicks "Execute Harvest" (Requirement 8.1)
```
✅ Task 15: Session Management
✅ Task 16: Action Engine Integration
```
The system should:
1. Create a harvest session with status "executing"
2. Display Action Engine's transaction confirmation modal
3. Show spinner animation and per-step Guardian scores
4. Execute on-chain transactions (sell token at loss)
5. Update step statuses as they complete
6. Handle failures with error messages and retry options

### Step 3: Show Success Screen (Requirement 10)
```
✅ Task 18: Success Screen
```
After successful execution:
- Display achievement-style success card
- Show confetti animation 🎉
- Display total losses harvested
- Provide "Download 8949 CSV" button
- Provide "View Proof-of-Harvest" button

## 📋 What's CURRENTLY Implemented

### ✅ Implemented (Tasks 10 & 11):
```javascript
// In src/pages/HarvestPro.tsx
onStartHarvest={(id) => console.log('Start harvest:', id)}
```

**Current behavior:**
- Logs the opportunity ID to browser console
- No modal opens
- No execution happens
- Just a placeholder for future functionality

### 🚧 NOT YET Implemented:

**Task 14** - HarvestDetailModal
- [ ] Modal component
- [ ] Summary section
- [ ] Step-by-step actions
- [ ] Cost table
- [ ] Execute button

**Task 15** - Session Management
- [ ] Create session API
- [ ] Session state management
- [ ] Session tracking

**Task 16** - Action Engine Integration
- [ ] Transaction execution
- [ ] Step tracking
- [ ] Success/failure handling

**Task 17** - CEX Manual Execution
- [ ] CEX instruction panel
- [ ] Manual step tracking

**Task 18** - Success Screen
- [ ] Success card
- [ ] Confetti animation
- [ ] Download/View buttons

**Task 19** - CSV Export
- [ ] Form 8949 CSV generation
- [ ] Export endpoint

**Task 20** - Proof-of-Harvest
- [ ] Proof page
- [ ] Cryptographic hash
- [ ] Transaction history

## 🔄 Implementation Roadmap

### Current Status: **Tasks 1-11 Complete** ✅

```
✅ Task 1-9:   Core logic (FIFO, eligibility, net benefit, etc.)
✅ Task 10:    Dashboard UI (header, filters, summary)
✅ Task 11:    Opportunity cards
🚧 Task 12:    Filtering system (NEXT)
🚧 Task 13:    API endpoints
🚧 Task 14:    Detail modal (THIS IS WHAT SHOULD OPEN)
🚧 Task 15:    Session management
🚧 Task 16:    Execution flow
🚧 Task 17:    CEX execution
🚧 Task 18:    Success screen
🚧 Task 19:    CSV export
🚧 Task 20:    Proof-of-Harvest
```

## 🎬 Full User Flow (When Complete)

```
1. User views dashboard
   ↓
2. User clicks "Start Harvest" on ETH card
   ↓
3. Detail modal opens showing:
   - "Harvest ETH Loss Plan"
   - $4,500 unrealized loss
   - $1,080 net benefit
   - Steps: Approve → Swap → Confirm
   - Cost breakdown
   ↓
4. User clicks "Execute Harvest" in modal
   ↓
5. Action Engine modal appears
   - "Approve USDC spending"
   - Guardian score: 8.5/10
   - Spinner animation
   ↓
6. Transaction confirms
   - Step 1: ✅ Complete
   - Step 2: 🔄 Executing...
   ↓
7. All steps complete
   ↓
8. Success screen appears
   - 🎉 Confetti animation
   - "Harvested $4,500 in losses!"
   - "Net benefit: $1,080"
   - [Download CSV] [View Proof]
   ↓
9. User downloads Form 8949 CSV
   ↓
10. User views Proof-of-Harvest page
    - Transaction hashes
    - Cryptographic proof
    - Audit trail
```

## 🧪 How to Test Current Implementation

1. Navigate to `/harvestpro`
2. Click "Start Harvest" on any card
3. Open browser console (F12)
4. You'll see: `Start harvest: 1` (or 2, 3)

This confirms the button works and passes the opportunity ID correctly!

## 📝 Summary

**Question:** What should happen when you click "Start Harvest"?
**Answer:** It should open a detail modal (Task 14)

**Question:** Is it implemented?
**Answer:** Not yet - currently just logs to console

**Next Steps:**
1. Task 12: Filtering system
2. Task 13: API endpoints
3. **Task 14: Detail modal** ← This is what you're asking about!
4. Tasks 15-20: Execution, success, export, proof

The button is **ready and waiting** for Task 14 to be implemented! 🚀
