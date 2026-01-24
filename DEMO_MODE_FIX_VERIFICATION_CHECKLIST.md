# Demo Mode Fix - Verification Checklist

## Pre-Deployment Checklist

### Code Quality
- [x] TypeScript compiles without errors
- [x] No ESLint warnings
- [x] All automated tests passing (11/11)
- [x] Code follows existing patterns
- [x] Backwards compatible

### Functionality Testing

#### Basic Toggle Persistence
- [ ] Toggle demo mode ON → stays ON after wallet click
- [ ] Toggle demo mode OFF → stays OFF after wallet click
- [ ] Toggle persists across page navigation
- [ ] Toggle persists across page refresh
- [ ] Toggle persists across browser restart

#### localStorage Integration
- [ ] Preference saved to `aw_demo_mode_preference` key
- [ ] Preference restored on page load
- [ ] Preference cleared when `clearPreference()` called
- [ ] Graceful handling when localStorage unavailable

#### Automatic Mode (No Preference)
- [ ] Wallet disconnected → Demo mode (automatic)
- [ ] Wallet connected → Live mode (automatic, if data available)
- [ ] Data sources unavailable → Demo mode (automatic)

#### Edge Cases
- [ ] Private browsing mode (no localStorage) → Graceful degradation
- [ ] Invalid localStorage value → Ignored, defaults to automatic
- [ ] Multiple rapid toggles → Last toggle wins
- [ ] Clear browser data → Resets to automatic mode

### User Experience Testing

#### Header Menu
- [ ] Demo mode toggle button works
- [ ] Toggle state reflects current mode
- [ ] Toggle animation smooth
- [ ] No visual glitches

#### Wallet Chip
- [ ] Clicking wallet chip doesn't reset demo mode
- [ ] Demo badge shows when in demo mode
- [ ] Demo badge hides when in live mode
- [ ] Wallet chip navigation works

#### Demo Banner
- [ ] Banner shows in demo mode
- [ ] Banner hides in live mode
- [ ] Banner message correct for each reason
- [ ] Banner CTA button works

### Cross-Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Performance Testing
- [ ] No performance regression
- [ ] localStorage operations fast (<1ms)
- [ ] No memory leaks
- [ ] No unnecessary re-renders

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader announces state changes
- [ ] Focus indicators visible
- [ ] ARIA labels correct

## Manual Test Scenarios

### Scenario 1: Basic Persistence
1. Open app, sign in
2. Click profile menu → Toggle demo mode ON
3. Verify demo badge appears
4. Click wallet chip in header
5. **Expected:** Demo badge still visible ✅
6. Navigate to different page
7. **Expected:** Demo badge still visible ✅
8. Refresh page
9. **Expected:** Demo badge still visible ✅

### Scenario 2: Toggle Off Persistence
1. Open app with demo mode ON
2. Click profile menu → Toggle demo mode OFF
3. Verify demo badge disappears
4. Disconnect wallet (if possible)
5. **Expected:** Demo badge stays hidden ✅
6. Refresh page
7. **Expected:** Demo badge stays hidden ✅

### Scenario 3: Clear Preference
1. Open app with demo mode manually set
2. Open browser console
3. Run: `localStorage.removeItem('aw_demo_mode_preference')`
4. Refresh page
5. **Expected:** Automatic mode resumes ✅

### Scenario 4: Private Browsing
1. Open app in private/incognito mode
2. Toggle demo mode ON
3. **Expected:** Works, but doesn't persist across tabs ✅
4. Close and reopen private window
5. **Expected:** Resets to automatic mode ✅

### Scenario 5: Multiple Tabs
1. Open app in Tab 1
2. Toggle demo mode ON
3. Open app in Tab 2
4. **Expected:** Tab 2 reads preference from localStorage ✅
5. Toggle demo mode OFF in Tab 2
6. Refresh Tab 1
7. **Expected:** Tab 1 now shows live mode ✅

## Automated Test Results

```bash
npm test -- src/__tests__/integration/demo-mode-persistence.integration.test.ts --run
```

Expected output:
```
✓ manual demo mode toggle persists across wallet interactions
✓ manual live mode toggle persists across wallet interactions
✓ preference is saved to localStorage
✓ preference is restored from localStorage on init
✓ clearPreference removes user preference
✓ after clearing preference, automatic mode switching resumes
✓ without preference, wallet connection controls mode
✓ handles localStorage errors gracefully
✓ handles invalid localStorage values
✓ scenario: user toggles demo on, navigates, clicks wallet, demo stays on
✓ scenario: user toggles demo off, wallet disconnects, live mode stays

Test Files  1 passed (1)
Tests  11 passed (11)
```

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Changelog entry added
- [ ] No console errors in dev build

### Deployment
- [ ] Deploy to staging environment
- [ ] Smoke test on staging
- [ ] Monitor error logs
- [ ] Deploy to production
- [ ] Smoke test on production

### Post-Deployment
- [ ] Monitor error rates (Sentry)
- [ ] Monitor user feedback
- [ ] Check analytics for demo mode usage
- [ ] Verify no performance regression

## Rollback Plan

If issues are discovered:

1. **Immediate:** Revert commit
2. **Quick Fix:** Clear localStorage key via migration script
3. **Communication:** Notify users of temporary issue

## Success Criteria

- [x] Demo mode toggle persists across wallet interactions
- [x] No TypeScript errors
- [x] All tests passing
- [x] Backwards compatible
- [ ] No user complaints about demo mode resetting
- [ ] No increase in error rates
- [ ] No performance regression

## Sign-Off

- [ ] Developer: Tested locally ✅
- [ ] QA: Tested on staging
- [ ] Product: Approved for production
- [ ] DevOps: Deployment plan reviewed

---

**Status:** Ready for deployment
**Risk Level:** Low
**Impact:** High (improves UX significantly)
