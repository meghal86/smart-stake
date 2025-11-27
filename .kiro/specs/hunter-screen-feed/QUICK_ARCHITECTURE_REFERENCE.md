# Hunter Architecture - Quick Reference Card

## The Golden Rule

```
🧠 SMART CODE → supabase/functions/*
🎨 DUMB CODE → src/app/* and src/components/*
```

## Decision Tree

```
Is this code...

├─ Calculating something?
│  └─ ✅ Edge Function
│
├─ Making decisions?
│  └─ ✅ Edge Function
│
├─ Calling external APIs?
│  └─ ✅ Edge Function
│
├─ Querying database?
│  └─ ✅ Edge Function (or thin proxy)
│
├─ Just displaying data?
│  └─ ✅ React Component
│
└─ Just validating input?
   └─ ✅ Next.js API Route → then call Edge Function
```

## File Location Cheat Sheet

| What | Where | Example |
|------|-------|---------|
| Feed ranking logic | `supabase/functions/hunter-feed/lib/` | `ranking-safety.ts` |
| Eligibility scoring | `supabase/functions/hunter-eligibility-preview/lib/` | `eligibility-scorer.ts` |
| Policy evaluation | `supabase/functions/hunter-feed/lib/` | `regulatory-policy.ts` |
| Intent quotes | `supabase/functions/hunter-intent-quote/` | `index.ts` |
| Solver orchestration | `supabase/functions/hunter-intent-quote/lib/` | `solver-orchestrator.ts` |
| Sentinel monitoring | `supabase/functions/hunter-sentinel-monitor/` | `index.ts` |
| Threat detection | `supabase/functions/hunter-threat-monitor/` | `index.ts` |
| API proxy | `app/api/hunter/*/` | `route.ts` |
| UI components | `src/components/hunter/` | `OpportunityCard.tsx` |
| Types | `src/types/` | `hunter.ts` |
| Zod schemas | `src/schemas/` | `hunter.ts` |

## Code Pattern Templates

### ✅ Edge Function (Business Logic)

```typescript
// supabase/functions/hunter-*/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const params = await req.json();
  
  // ALL BUSINESS LOGIC HERE
  const result = await doComplexCalculation(params);
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### ✅ Next.js Proxy (Thin Layer)

```typescript
// app/api/hunter/*/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  // 1. Validate
  const params = ParamsSchema.parse(req.nextUrl.searchParams);
  
  // 2. Call Edge Function
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { data, error } = await supabase.functions.invoke('hunter-*', {
    body: params
  });
  
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
  
  // 3. Return with headers
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'max-age=60' }
  });
}
```

### ✅ React Component (Presentation)

```typescript
// src/components/hunter/OpportunityCard.tsx
import { useQuery } from '@tanstack/react-query';

export function OpportunityCard({ opportunity }) {
  // Fetch data
  const { data } = useQuery({
    queryKey: ['eligibility', opportunity.id],
    queryFn: () => fetchEligibility(opportunity.id)
  });
  
  // Display only
  return (
    <div>
      <h3>{opportunity.title}</h3>
      {data && <EligibilityBadge status={data.status} />}
    </div>
  );
}
```

## Common Mistakes

### ❌ Business Logic in React

```typescript
// src/components/hunter/OpportunityCard.tsx
const score = calculateEligibilityScore(signals); // ❌ NO!
```

**Fix:** Move to Edge Function

```typescript
// supabase/functions/hunter-eligibility-preview/lib/scorer.ts
export function calculateEligibilityScore(signals) { ... }
```

### ❌ Complex Logic in Next.js API Route

```typescript
// app/api/hunter/opportunities/route.ts
const ranked = opportunities
  .filter(o => o.trust > 80)
  .sort((a, b) => calculateRank(b) - calculateRank(a)); // ❌ NO!
```

**Fix:** Move to Edge Function

```typescript
// supabase/functions/hunter-feed/lib/ranking.ts
export function rankOpportunities(opportunities) { ... }
```

### ❌ Direct External API Calls from Client

```typescript
// src/lib/hunter/solver.ts
const quote = await fetch('https://li.fi/quote', ...); // ❌ NO!
```

**Fix:** Call through Edge Function

```typescript
// supabase/functions/hunter-intent-quote/lib/lifi-solver.ts
export async function getLiFiQuote(params) {
  return await fetch('https://li.fi/quote', ...);
}
```

## Priority Order

When in doubt, check these docs in order:

1. **ARCHITECTURE_CLARIFICATION.md** ← Start here
2. **design.md** (with location tags)
3. **This quick reference**

## One-Sentence Rules

- **Edge Functions**: Where the brains live
- **Next.js API Routes**: Thin proxies (optional)
- **React Components**: Pretty faces only
- **Types/Schemas**: Shared everywhere
- **External APIs**: Only from Edge Functions
- **Database**: Mostly from Edge Functions
- **Calculations**: Always Edge Functions
- **UI State**: React only (filters, modals, etc.)

## Testing Strategy

```
Edge Functions → Unit tests + Property tests
Next.js Routes → Integration tests (thin, so minimal)
React Components → E2E tests (Playwright)
```

## Deployment

```
Edge Functions → Deploy independently to Supabase
Next.js App → Deploy to Vercel
Database → Supabase (migrations)
```

## When to Add Next.js Proxy

Only add if you need:
- Server-side caching headers
- Rate limiting
- Request transformation
- Response transformation

Otherwise, call Edge Functions directly from client:

```typescript
const { data } = await supabase.functions.invoke('hunter-feed', { body });
```

## Success Checklist

Before merging any Hunter code:

- [ ] All business logic in `supabase/functions/*`
- [ ] All React components in `src/components/hunter/*`
- [ ] No calculations in React
- [ ] No external API calls from Next.js
- [ ] API routes are < 50 lines (if they exist)
- [ ] Edge Functions have tests
- [ ] UI has E2E tests

---

**Keep this card handy when coding!** 📌
