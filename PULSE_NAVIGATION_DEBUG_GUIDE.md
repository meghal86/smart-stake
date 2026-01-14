# Pulse Navigation Debug Guide

## Issue
The "Open today's pulse" button on the Cockpit page is not opening the PulseSheet overlay.

## Changes Made

### 1. Added Comprehensive Logging

**File: `src/components/cockpit/TodayCard.tsx`**
- Added console logging to `handlePrimaryClick` to track:
  - When button is clicked
  - What href value is being used
  - Which navigation path is taken (hash-only, URL with hash, or regular)
  - What hash is being set

**File: `src/pages/Cockpit.tsx`**
- Added console logging to hash change handler to track:
  - When hash changes
  - What the new hash value is
  - Whether pulse sheet is being opened/closed
  - Initial hash on page load

### 2. Added Visual Debug Indicator

**File: `src/pages/Cockpit.tsx`**
- Added a red debug box in the top-right corner that appears when `pulseSheetOpen` is true
- This confirms whether the state is actually changing

### 3. Fixed Event Handler Type

**File: `src/components/cockpit/TodayCard.tsx`**
- Changed `handlePrimaryClick` parameter from `(e: React.MouseEvent)` to `(e?: React.MouseEvent)`
- Made event parameter optional to handle cases where it might not be provided

## How to Test

### Step 1: Open Browser Console
1. Navigate to `http://localhost:8080/cockpit`
2. Open browser DevTools (F12 or Cmd+Option+I on Mac)
3. Go to the Console tab

### Step 2: Click the Button
1. Click the "Open today's pulse" button
2. Watch the console for log messages

### Expected Console Output
```
[Cockpit] Setting up hash change listener, initial hash: 
[Cockpit] Hash changed to:  Current pulseSheetOpen: false
[TodayCard] Primary CTA clicked, href: /cockpit#pulse
[TodayCard] Path: /cockpit Hash: pulse Current path: /cockpit
[TodayCard] Already on target path, setting hash to: pulse
[Cockpit] Hash changed to: pulse Current pulseSheetOpen: false
[Cockpit] Opening pulse sheet
```

### Step 3: Check Visual Indicators
1. Look for the red debug box in the top-right corner
2. If it appears, the state is changing correctly
3. If it doesn't appear, the state is not updating

### Step 4: Check PulseSheet Rendering
1. In DevTools, go to the Elements/Inspector tab
2. Search for `class="pulse-sheet"` or `role="dialog"`
3. Check if the element exists and if it has the correct classes

## Possible Issues and Solutions

### Issue 1: Button Click Not Firing
**Symptoms:** No console logs when clicking button
**Solution:** 
- Check if button is actually clickable (not covered by another element)
- Verify button has `onClick={handlePrimaryClick}` in JSX
- Check if there are any JavaScript errors preventing execution

### Issue 2: Hash Not Changing
**Symptoms:** Console shows button click but hash doesn't change
**Solution:**
- Check if `window.location.hash = hash` is being called
- Verify no errors in the navigation logic
- Check if browser is preventing hash changes

### Issue 3: Hash Changes But Sheet Doesn't Open
**Symptoms:** Hash changes to `#pulse` but sheet stays closed
**Solution:**
- Check if `hashchange` event listener is properly attached
- Verify `setPulseSheetOpen(true)` is being called
- Check if there are any errors in the hash change handler

### Issue 4: State Changes But Sheet Doesn't Render
**Symptoms:** Debug box appears but no sheet visible
**Solution:**
- Check if PulseSheet component is properly imported
- Verify `isOpen` prop is being passed correctly
- Check if AnimatePresence is working (Framer Motion issue)
- Look for CSS issues (z-index, display, visibility)

## Test File

A standalone test file has been created: `test-pulse-navigation-debug.html`

To use it:
1. Open the file in a browser
2. Click the "Open today's pulse" button
3. Watch the debug log and current state
4. Verify the pulse sheet opens

This test file simulates the exact navigation logic without React/Next.js complexity.

## Next Steps

1. **Run the test** at `http://localhost:8080/cockpit`
2. **Check console logs** to see where the flow breaks
3. **Report findings**:
   - What console logs appear?
   - Does the red debug box appear?
   - Does the URL hash change to `#pulse`?
   - Is there any error in the console?

## Code References

### Navigation Flow
```
User clicks button
  ↓
handlePrimaryClick() called
  ↓
window.location.hash = 'pulse'
  ↓
'hashchange' event fires
  ↓
handleHashChange() called
  ↓
setPulseSheetOpen(true)
  ↓
PulseSheet renders with isOpen={true}
  ↓
AnimatePresence shows the sheet
```

### Key Files
- `src/components/cockpit/TodayCard.tsx` - Button and click handler
- `src/pages/Cockpit.tsx` - Hash change listener and PulseSheet integration
- `src/components/cockpit/PulseSheet.tsx` - Sheet component with AnimatePresence

## Debugging Commands

### Check if PulseSheet is in DOM
```javascript
document.querySelector('[role="dialog"]')
```

### Manually trigger hash change
```javascript
window.location.hash = 'pulse'
```

### Check current hash
```javascript
console.log(window.location.hash)
```

### Check pulseSheetOpen state (if using React DevTools)
1. Install React DevTools extension
2. Find Cockpit component
3. Look at hooks state
4. Find `pulseSheetOpen` state value
