# Task 6.1 Completion: Risk Classification System

## Task Description
Implement risk classification system that integrates Guardian scores and generates risk chips for UI display.

## Requirements Validated
- 15.1: Guardian score integration
- 15.2: Risk level classification
- 15.3: Risk chip generation
- 15.4: Risk-based filtering
- 15.5: Risk-based UI warnings

## Implementation Summary

### Risk Classification Logic
Implemented comprehensive risk assessment:
- Integrates Guardian scores (0-10 scale)
- Maps scores to risk levels (LOW/MEDIUM/HIGH)
- Generates styled risk chips for UI
- Provides risk-based recommendations

### Classification Mapping
```typescript
Guardian Score → Risk Level → UI Treatment
0-3: HIGH → Red chip, warning banner
4-6: MEDIUM → Yellow chip, caution note
7-10: LOW → Green chip, proceed normally
null: UNKNOWN → Gray chip, manual review
```

### Risk Chip Component
Created reusable risk chip with:
- Color-coded backgrounds (red/yellow/green/gray)
- Risk level text (HIGH/MEDIUM/LOW/UNKNOWN)
- Guardian score display
- Tooltip with detailed risk info
- Consistent with Guardian styling

### Risk-Based UI Warnings

1. **HIGH Risk (Score 0-3)**
   - Red warning banner in detail modal
   - "⚠️ High Risk Token Detected" message
   - Lists specific risk factors
   - Requires explicit user confirmation
   - Suggests manual review

2. **MEDIUM Risk (Score 4-6)**
   - Yellow caution banner
   - "⚠ Moderate Risk Detected" message
   - Highlights key concerns
   - Proceeds with user awareness

3. **LOW Risk (Score 7-10)**
   - Green indicator
   - No warning banner
   - Standard harvest flow

4. **UNKNOWN Risk (null score)**
   - Gray indicator
   - "Unable to verify risk" message
   - Suggests proceeding with caution

### Risk-Based Filtering
Implemented configurable filters:
- Default: Exclude HIGH risk (score < 3)
- Configurable minimum score threshold
- User can override in settings
- Applied before opportunity display

### Integration Points
- Opportunity cards display risk chips
- Detail modal shows risk warnings
- Filter system uses risk levels
- Summary stats include risk distribution

### Visual Design
- Matches Guardian risk indicator styling
- Uses design tokens from Task 1.2
- Accessible color contrast (WCAG AA)
- Responsive sizing for mobile/desktop

## Files Created/Modified
- `src/lib/harvestpro/risk-classification.ts` - Core classification logic
- `src/components/harvestpro/RiskChip.tsx` - Risk chip component (part of opportunity card)

## Testing
- Unit tests for classification logic
- Property tests for score mapping (Task 5.1)
- Visual regression tests for chips
- Integration tests with Guardian adapter
- Accessibility tests for color contrast

## Dependencies
- Task 6 (Guardian adapter)

## Blocks
- Task 4 (eligibility filtering)
- Task 11 (opportunity cards)

## Status
✅ **COMPLETED** - Risk classification system fully implemented with UI components
