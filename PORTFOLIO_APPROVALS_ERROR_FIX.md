# Portfolio Approvals Error Fix

## Error
```
TypeError: Cannot read properties of undefined (reading 'map')
at ApprovalsRiskList.tsx:251:49
```

## Root Cause
The `ApprovalsRiskList` component was trying to map over `approval.riskReasons` without checking if it exists first. When the approvals data doesn't have `riskReasons` defined, it causes a crash.

## Fix Applied

### File: `src/components/portfolio/ApprovalsRiskList.tsx`

**Line 248-257**: Added safety check before mapping

```typescript
// ❌ BEFORE (line 248-257)
<div className="mt-2">
  <p className="text-xs text-gray-400 mb-1">Risk Factors:</p>
  <div className="flex flex-wrap gap-1">
    {approval.riskReasons.map((reason, index) => (  // ← Crashes if undefined!
      <Badge key={index} variant="outline" className="text-xs">
        {reason.replace(/_/g, ' ').toLowerCase()}
      </Badge>
    ))}
  </div>
</div>

// ✅ AFTER
{approval.riskReasons && approval.riskReasons.length > 0 && (
  <div className="mt-2">
    <p className="text-xs text-gray-400 mb-1">Risk Factors:</p>
    <div className="flex flex-wrap gap-1">
      {approval.riskReasons.map((reason, index) => (
        <Badge key={index} variant="outline" className="text-xs">
          {reason.replace(/_/g, ' ').toLowerCase()}
        </Badge>
      ))}
    </div>
  </div>
)}
```

## Why This Happened

The `ApprovalRisk` type includes an optional `riskReasons` property:

```typescript
interface ApprovalRisk {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  riskScore: number;
  valueAtRisk: number;
  riskReasons?: string[];  // ← Optional!
  // ... other properties
}
```

When approvals data comes from the API without `riskReasons`, the component tried to call `.map()` on `undefined`, causing the error.

## Safety Pattern

This is the correct pattern for optional arrays in React:

```typescript
// ✅ Good: Check existence and length
{array && array.length > 0 && (
  <div>
    {array.map(item => <Component key={item.id} />)}
  </div>
)}

// ✅ Also good: Use optional chaining with fallback
{(array || []).map(item => <Component key={item.id} />)}

// ❌ Bad: Direct map without check
{array.map(item => <Component key={item.id} />)}
```

## Related Safety Checks

The codebase already has similar safety checks in other places:

**OverviewTab.tsx (line 62)**:
```typescript
approvals.filter(a => a.riskReasons?.includes('UNLIMITED_ALLOWANCE'))
//                                  ↑ Optional chaining
```

This is the correct pattern and prevents the same error.

## Status

✅ **Error fixed**: Added safety check for undefined array
✅ **Component safe**: Won't crash if riskReasons is missing
✅ **Graceful degradation**: Simply doesn't show risk factors section if none exist

## Testing

1. Refresh your browser
2. Navigate to Portfolio → Audit tab
3. Verify no errors in console
4. Check that approvals list displays correctly

---

**The error should now be resolved. The component will gracefully handle approvals with or without risk reasons.**
