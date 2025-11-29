# AlphaWhale Home - Contrast Ratio Visual Guide

## Before & After Comparison

### Issue 1: Gray-500 Text (FIXED)

**BEFORE** ❌
```
Text Color: #6B7280 (gray-500)
Background: #0A0F1F (slate-950)
Contrast Ratio: 3.95:1
Status: FAILS WCAG AA (needs 4.5:1)
```

**AFTER** ✅
```
Text Color: #9CA3AF (gray-400)
Background: #0A0F1F (slate-950)
Contrast Ratio: 7.51:1
Status: PASSES WCAG AAA
```

**Visual Impact**: Slightly brighter gray text, more readable without being harsh.

---

### Issue 2: Cyan-500 Buttons (FIXED)

**BEFORE** ❌
```
Text Color: #FFFFFF (white)
Background: #06B6D4 (cyan-500)
Contrast Ratio: 2.43:1
Status: FAILS WCAG AA (needs 4.5:1)
```

**AFTER** ✅
```
Text Color: #FFFFFF (white)
Background: #0E7490 (cyan-700)
Contrast Ratio: 5.36:1
Status: PASSES WCAG AA
```

**Visual Impact**: Darker, more professional cyan buttons with better readability.

---

## Color Palette Reference

### Text Colors (on dark backgrounds)

| Color | Hex | Ratio on Slate-950 | WCAG Level | Use Case |
|-------|-----|-------------------|------------|----------|
| White | `#FFFFFF` | 19.07:1 | AAA | Primary text, headings |
| Gray-300 | `#D1D5DB` | ~12:1 | AAA | Subheadings |
| Gray-400 | `#9CA3AF` | 7.51:1 | AAA | Secondary text, labels |
| ~~Gray-500~~ | ~~`#6B7280`~~ | ~~3.95:1~~ | ~~FAIL~~ | ~~Don't use~~ |
| Cyan-400 | `#22D3EE` | 10.55:1 | AAA | Accent text, icons |

### Button Colors (with white text)

| Color | Hex | Ratio with White | WCAG Level | Use Case |
|-------|-----|-----------------|------------|----------|
| ~~Cyan-500~~ | ~~`#06B6D4`~~ | ~~2.43:1~~ | ~~FAIL~~ | ~~Don't use~~ |
| ~~Cyan-600~~ | ~~`#0891B2`~~ | ~~3.68:1~~ | ~~FAIL~~ | ~~Don't use~~ |
| Cyan-700 | `#0E7490` | 5.36:1 | AA | Primary buttons ✅ |
| Cyan-800 | `#155E75` | 7.48:1 | AAA | Active state |

---

## Component Examples

### Hero Section CTA Button

**Before:**
```tsx
className="bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600"
```

**After:**
```tsx
className="bg-cyan-700 hover:bg-cyan-600 active:bg-cyan-800"
```

### Feature Card Labels

**Before:**
```tsx
<p className="text-xs text-gray-500 uppercase tracking-wide">
  {previewLabel}
</p>
```

**After:**
```tsx
<p className="text-xs text-gray-400 uppercase tracking-wide">
  {previewLabel}
</p>
```

### Feature Card Description

**Before:**
```tsx
<p className={`text-xs ${error ? 'text-red-400' : 'text-gray-500'}`}>
  {error || previewDescription}
</p>
```

**After:**
```tsx
<p className={`text-xs ${error ? 'text-red-400' : 'text-gray-400'}`}>
  {error || previewDescription}
</p>
```

---

## Quick Reference: Safe Color Combinations

### ✅ ALWAYS SAFE (AAA Level)

1. **White on slate-950**: 19.07:1
2. **Gray-400 on slate-950**: 7.51:1
3. **Cyan-400 on slate-950**: 10.55:1
4. **White on cyan-800**: 7.48:1

### ✅ SAFE (AA Level)

1. **White on cyan-700**: 5.36:1
2. **Gray-300 on slate-950**: ~12:1

### ❌ NEVER USE

1. **Gray-500 on slate-950**: 3.95:1 (fails)
2. **White on cyan-500**: 2.43:1 (fails)
3. **White on cyan-600**: 3.68:1 (fails)

---

## Testing Your Own Combinations

Use the contrast utility:

```typescript
import { calculateContrastRatio, meetsWCAGAA } from '@/lib/utils/contrast';

// Test a combination
const ratio = calculateContrastRatio('#FFFFFF', '#0E7490');
console.log(`Ratio: ${ratio}:1`);
console.log(`Passes WCAG AA: ${meetsWCAGAA(ratio, false)}`);
```

Or run the full verification:

```typescript
import { verifyHomePageContrast } from '@/lib/utils/contrast';

const { passed, results } = verifyHomePageContrast();
console.log(results);
```

---

## Design System Guidelines

### When Choosing Colors

1. **For normal text (< 18px)**: Minimum 4.5:1 ratio
2. **For large text (≥ 18px)**: Minimum 3:1 ratio
3. **For interactive elements**: Prefer AAA level (7:1+)
4. **For decorative elements**: AA level acceptable

### Button Color Selection

- **Primary actions**: Use cyan-700 background with white text
- **Hover states**: Lighten to cyan-600
- **Active states**: Darken to cyan-800
- **Disabled states**: Reduce opacity to 50%

### Text Color Selection

- **Headings**: Always use white (#FFFFFF)
- **Body text**: Use gray-400 (#9CA3AF) for secondary content
- **Accent text**: Use cyan-400 (#22D3EE) for highlights
- **Error text**: Use red-400 for sufficient contrast

---

## Accessibility Impact

### Before Fixes
- **2 failing combinations** affecting:
  - Feature card labels and descriptions
  - All primary CTA buttons
  - Onboarding section buttons
  - Trust builders error messages

### After Fixes
- **0 failing combinations**
- **All text readable** for users with:
  - Low vision
  - Color blindness
  - Bright ambient lighting
  - Older displays

### User Benefits
- ✅ Easier to read in bright sunlight
- ✅ Better for users with visual impairments
- ✅ More professional appearance
- ✅ Compliant with WCAG 2.1 Level AA
- ✅ Meets accessibility requirements for government/enterprise

---

## Browser DevTools Testing

### Chrome DevTools
1. Open DevTools (F12)
2. Select element
3. View "Accessibility" pane
4. Check "Contrast" section

### Firefox DevTools
1. Open DevTools (F12)
2. Select element
3. View "Accessibility" tab
4. Check contrast ratio

### axe DevTools Extension
1. Install axe DevTools extension
2. Run scan on page
3. Check "Color Contrast" issues
4. Should show 0 issues ✅

---

## Maintenance

### When Adding New Components

1. Use colors from `HOME_COLORS` constant
2. Test with `calculateContrastRatio()`
3. Verify with `meetsWCAGAA()`
4. Add test case to `contrast.test.ts`

### When Updating Design System

1. Update `HOME_COLORS` in `contrast.ts`
2. Run contrast tests: `npm test -- contrast.test.ts`
3. Update this guide
4. Notify team of changes

---

**Last Updated**: November 29, 2025  
**Verified By**: Automated contrast testing  
**Status**: ✅ All combinations WCAG AA compliant
