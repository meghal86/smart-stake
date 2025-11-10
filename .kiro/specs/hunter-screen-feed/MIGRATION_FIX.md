# Migration Syntax Fix

## Issue
The migration file `supabase/migrations/20250104000002_hunter_ranking_view.sql` had syntax errors with dollar-quoted strings in function definitions.

## Problem
Functions were using single `$` instead of `$$` for dollar-quoting:
```sql
CREATE OR REPLACE FUNCTION my_function()
RETURNS NUMERIC AS $    -- ❌ Wrong: single $
BEGIN
  ...
END;
$ LANGUAGE plpgsql;     -- ❌ Wrong: single $
```

## Solution
Fixed all function definitions to use `$$`:
```sql
CREATE OR REPLACE FUNCTION my_function()
RETURNS NUMERIC AS $$   -- ✅ Correct: double $$
BEGIN
  ...
END;
$$ LANGUAGE plpgsql;    -- ✅ Correct: double $$
```

## Functions Fixed
1. `calculate_freshness_score()` - Lines 16, 54
2. `calculate_trust_weighted_score()` - Lines 60, 68
3. `calculate_relevance_score()` - Lines 74, 110
4. `refresh_opportunity_rank_view()` - Lines 277, 283

## Verification
Run this command to verify all functions use `$$`:
```bash
grep "LANGUAGE plpgsql" supabase/migrations/20250104000002_hunter_ranking_view.sql
```

Expected output (all lines should show `$$`):
```
54:$$ LANGUAGE plpgsql IMMUTABLE;
68:$$ LANGUAGE plpgsql IMMUTABLE;
110:$$ LANGUAGE plpgsql IMMUTABLE;
283:$$ LANGUAGE plpgsql;
```

## Status
✅ Fixed - The migration file is now ready to be applied with `supabase db push`
