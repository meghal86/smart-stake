# Task 30a Completion: Refactor OpportunityCard to Match Spec Requirements

## Summary

Successfully refactored the OpportunityCard component to match all spec requirements with proper Guardian trust integration, reward display, eligibility preview, and accessibility compliance.

## Components Created

### 1. GuardianTrustChip Component
**File:** `src/components/hunter/GuardianTrustChip.tsx`

**Features:**
- Color-coded trust levels (green/amber/red)
- Text labels (not color-only) for accessibility
- AA contrast standards compliance
- Interactive tooltip with top 3 issues
- Time ago display for last scan
- Click handler for full Guardian report
- Proper ARIA labels and keyboard navigation

**Requirements Met:**
- 2.1-2.8: Trust & Security Display
- 9.4: Text labels (not color-only)
- 9.1: AA contrast standards

### 2. RewardDisplay Component
**File:** `src/components/hunter/RewardDisplay.tsx`

**Features:**
- Min-max reward range display
- Confidence level badges (Confirmed/Estimated)
- APR/APY normalization (always displays as APY)
- Intl.NumberFormat for proper amount formatting
- Compact notation for large amounts (≥10,000)
- Support for all reward units (USD, APY, POINTS, NFT, TOKEN)
- Proper currency icons and labels

**Requirements Met:**
- 5.3-5.5: Reward display with confidence
- 5.11-5.12: APR/APY normalization and formatting
- 5.17: Intl.NumberFormat for amounts

### 3. EligibilityPreview Component
**File:** `src/components/hunter/EligibilityPreview.tsx`

**Features:**
- Status-based styling (likely/maybe/unlikely/unknown)
- Color-coded backgrounds and borders
- Icon indicators for each status
- Display of 1-2 reason bullets
- Proper ARIA labels for screen readers

**Requirements Met:**
- 6.1-6.8: Eligibility preview
- 5.6: Display eligibility with reasons

### 4. ProtocolLogo Component
**File:** `src/components/hunter/ProtocolLogo.tsx`

**Features:**
- Image display with error handling
- Fallback to initials avatar
- Deterministic color generation from protocol name
- AA contrast compliance for initials
- Multiple size options (sm/md/lg)
- Proper ARIA labels

**Requirements Met:**
- 5.16: Logo fallback with initials avatar
- 9.1: AA contrast standards

### 5. Refactored OpportunityCard Component
**File:** `src/components/hunter/OpportunityCard.tsx`

**Features:**
- Uses Opportunity type from `src/types/hunter.ts`
- Integrates all sub-components (GuardianTrustChip, RewardDisplay, EligibilityPreview, OpportunityActions)
- Displays all required badges (featured, sponsored, custom badges)
- Proper time left formatting
- Difficulty level display
- Chain and protocol information
- Dynamic CTA based on opportunity type
- Yield disclaimer for staking/yield opportunities
- Proper ARIA labels for accessibility
- Responsive layout with proper spacing

**Requirements Met:**
- 5.1-5.21: Opportunity card display
- 9.1-9.12: Accessibility compliance

## Integration with Existing Components

The refactored OpportunityCard integrates with:
- **OpportunityActions** (Task 27): Save, share, and report functionality
- **ReportModal** (Task 27): Report submission
- **Guardian service** (Task 10): Trust score integration
- **UI components**: Button, Badge, Avatar, Tooltip from shadcn/ui

## Test Coverage

**File:** `src/__tests__/components/hunter/OpportunityCard.test.tsx`

**Test Cases (19 total):**
1. ✅ Renders opportunity card with all required elements
2. ✅ Displays Guardian trust chip with correct level
3. ✅ Displays reward information correctly
4. ✅ Displays time left correctly
5. ✅ Displays difficulty badge
6. ✅ Shows eligibility preview when wallet is connected
7. ✅ Does not show eligibility preview when wallet is not connected
8. ✅ Displays featured badge when opportunity is featured
9. ✅ Displays sponsored badge when opportunity is sponsored
10. ✅ Displays custom badges
11. ✅ Calls onCTAClick with correct action when CTA button is clicked
12. ✅ Displays correct CTA label for different opportunity types
13. ✅ Displays yield disclaimer for yield and staking opportunities
14. ✅ Has proper aria-labels for accessibility
15. ✅ Displays amber trust level correctly
16. ✅ Displays red trust level correctly
17. ✅ Formats large USD amounts with compact notation
18. ✅ Displays APY correctly
19. ✅ Displays POINTS reward correctly

**All tests passing:** ✅

## Accessibility Features

1. **ARIA Labels:**
   - Article has descriptive aria-label
   - CTA button has full context aria-label
   - Trust chip has detailed aria-label
   - Logo fallback has initials aria-label

2. **Keyboard Navigation:**
   - All interactive elements are keyboard accessible
   - Trust chip has focus ring
   - Proper tab order

3. **Screen Reader Support:**
   - All icons have aria-hidden="true"
   - Text alternatives for all visual information
   - Status roles for eligibility preview

4. **Color Contrast:**
   - AA contrast standards met for all text
   - Trust levels use both color and text labels
   - Difficulty badges have proper contrast

## Requirements Verification

### Requirement 5.1-5.21: Opportunity Card Display ✅
- [x] Title, protocol logo/name, chain chips
- [x] Guardian trust chip with score and tooltip
- [x] Reward information (min-max + currency or APR)
- [x] Confidence level display
- [x] Time left countdown, difficulty, category
- [x] Eligibility preview for connected wallets
- [x] Appropriate CTA (Claim, Start Quest, Stake, View)
- [x] Action buttons (Save, Share, Report)
- [x] Badges (Featured, Sponsored, Season Bonus, Retroactive)
- [x] Sponsored items clearly labeled
- [x] APR/APY normalized to APY with 1 decimal
- [x] Time left computed in UTC
- [x] RewardUnit enum support
- [x] Yield disclaimer for staking/yield
- [x] Sponsored aria-label
- [x] Logo fallback with initials avatar (AA contrast)
- [x] Intl.NumberFormat with locale and compact notation
- [x] Sponsored badge visible (not tooltip-only)
- [x] External links with rel="noopener noreferrer"
- [x] Safe redirector for external links (via OpportunityActions)
- [x] Content sanitization (handled by API layer)

### Requirement 9.1-9.12: Accessibility ✅
- [x] AA contrast standards for all elements
- [x] Logical keyboard navigation focus order
- [x] ARIA labels on interactive elements
- [x] Text labels on trust chips (not color-only)
- [x] Screen reader announcements
- [x] Keyboard accessible tooltips
- [x] ESC key dismisses tooltips
- [x] No focus traps
- [x] Trust chip has role=button and aria-expanded
- [x] Locale-aware date/time formatting
- [x] Intl formatting for numbers
- [x] Footer link to disclosures (in card for yield/staking)

## Files Modified/Created

### Created:
1. `src/components/hunter/GuardianTrustChip.tsx`
2. `src/components/hunter/RewardDisplay.tsx`
3. `src/components/hunter/EligibilityPreview.tsx`
4. `src/components/hunter/ProtocolLogo.tsx`
5. `src/__tests__/components/hunter/OpportunityCard.test.tsx`

### Modified:
1. `src/components/hunter/OpportunityCard.tsx` (complete refactor)

## Next Steps

The OpportunityCard component is now fully spec-compliant and ready for integration with:
- Task 30b: FilterDrawer component
- Task 30c: SearchBar component
- Task 30d: HunterTabs updates
- Task 30e: StickySubFilters component
- Task 30f: RightRail component
- Task 30g: Hunter page layout updates

## Integration Notes

### Compatibility Layer

A temporary compatibility wrapper (`OpportunityCardLegacy.tsx`) has been created to allow the existing Hunter page to work with the refactored OpportunityCard component. This wrapper:

1. **Transforms old data format to new format**
   - Converts legacy Opportunity type to new Opportunity type
   - Parses reward strings into structured reward objects
   - Maps risk levels to trust levels
   - Provides default values for missing fields

2. **Maintains old interface**
   - Accepts the old props (opportunity, index, onJoinQuest, isDarkTheme)
   - Internally uses the new OpportunityCard component
   - Handles the prop transformation automatically

3. **Temporary solution**
   - This wrapper should be removed in Task 30g
   - It's marked as legacy and should not be used in new code
   - The Hunter page has been updated to use `OpportunityCardLegacy`

### Task 30g Requirements

The Hunter page will need to be fully updated in Task 30g to:
1. Use the new Opportunity type from `src/types/hunter.ts`
2. Fetch data from `/api/hunter/opportunities` endpoint
3. Implement action handlers (onSave, onShare, onReport, onCTAClick)
4. Provide wallet connection state
5. Remove the OpportunityCardLegacy wrapper
6. Use OpportunityCard directly

The refactored OpportunityCard includes safety checks and default values to prevent runtime errors.

## Notes

- The component uses the existing OpportunityActions component from Task 27
- Guardian integration leverages the existing Guardian service from Task 10
- All formatting follows the spec requirements for localization and accessibility
- The component is fully typed with TypeScript using types from `src/types/hunter.ts`
- Framer Motion is used for animations (existing dependency)
- All UI components are from shadcn/ui (existing component library)

## Status

✅ **COMPLETE** - All sub-tasks implemented and tested successfully.
