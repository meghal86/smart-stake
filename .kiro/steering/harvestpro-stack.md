# HarvestPro Technology Stack & Standards

## Frontend Stack

### Framework & Runtime
- **Framework**: Next.js 14+ (App Router)
- **React**: 18+
- **TypeScript**: 5+ (strict mode enabled)
- **Node**: 18+ or Bun

### Styling & UI
- **CSS Framework**: Tailwind CSS
- **Component Library**: shadcn/ui
- **Icons**: Lucide React
- **Animations**: Framer Motion

### State Management
- **Server State**: React Query (TanStack Query v5)
- **Client State**: Zustand
- **Forms**: React Hook Form + Zod validation

### File Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # Authenticated routes
│   │   └── harvest/       # HarvestPro pages
│   └── api/               # Next.js API routes (thin layer)
│       └── harvest/       # HarvestPro API endpoints
├── components/
│   └── harvestpro/        # HarvestPro UI components
├── lib/
│   └── harvestpro/        # Client-side utilities (NO business logic)
├── hooks/                 # React hooks
├── types/                 # TypeScript types
└── schemas/               # Zod schemas
```

## Backend Stack

### Runtime & Database
- **Runtime**: Deno (Supabase Edge Functions)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Raw SQL with typed interfaces (prefer Drizzle if needed)

### Edge Functions Structure
```
supabase/
├── functions/
│   ├── harvest-sync-wallets/
│   │   └── index.ts
│   ├── harvest-sync-cex/
│   │   └── index.ts
│   ├── harvest-recompute-opportunities/
│   │   └── index.ts
│   ├── harvest-economic-substance/
│   │   └── index.ts
│   ├── harvest-kyt-screen/
│   │   └── index.ts
│   ├── harvest-twap-worker/
│   │   └── index.ts
│   ├── harvest-notify/
│   │   └── index.ts
│   ├── webhook-fireblocks/
│   │   └── index.ts
│   ├── webhook-copper/
│   │   └── index.ts
│   └── _shared/           # Shared utilities
│       └── harvestpro/    # HarvestPro shared logic
├── migrations/            # Database migrations
└── seeds/                 # Seed data
```

## Coding Standards

### TypeScript
- **Always use strict mode**: `"strict": true` in tsconfig.json
- **No `any` types**: Use `unknown` and type guards instead
- **Explicit return types**: Always specify function return types
- **Interface over type**: Use `interface` for object shapes

### Validation
- **All API inputs**: Validate with Zod schemas
- **Runtime validation**: Use Zod for all external data
- **Type guards**: Create type guards for complex types

### Imports
- **Use barrel exports**: Create `index.ts` files for clean imports
- **Absolute imports**: Use `@/` prefix for src imports
- **No default exports**: Use named exports for better refactoring

**Example:**
```typescript
// ✅ Good
import { calculateNetBenefit, type NetBenefitResult } from '@/lib/harvestpro';

// ❌ Bad
import calculateNetBenefit from '../../../lib/harvestpro/net-benefit';
```

### Error Handling
- **Use Result types**: Return `{ success: true, data }` or `{ success: false, error }`
- **Never throw in UI**: Catch errors and display user-friendly messages
- **Log errors**: Use structured logging in Edge Functions

### Testing
- **Property-based tests**: Use fast-check for business logic
- **Unit tests**: Vitest for utilities
- **Integration tests**: Test API endpoints
- **E2E tests**: Playwright for critical flows

## External Services

### Required Integrations
- **Price Oracle**: CoinGecko (primary), CoinMarketCap (fallback)
- **Guardian API**: AlphaWhale security scanning
- **Action Engine**: AlphaWhale transaction execution
- **RPC Nodes**: Alchemy, Infura, Quicknode

### v2 Integrations
- **Private RPC**: Flashbots, Eden, Bloxroute
- **MEV Protection**: Flashbots Protect

### v3 Integrations
- **Custody**: Fireblocks SDK, Copper API
- **Sanctions**: TRM Labs, Chainalysis
- **KYT/AML**: OFAC API

## Environment Variables

### Required for v1
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Price Oracles
COINGECKO_API_KEY=
COINMARKETCAP_API_KEY=

# Guardian
GUARDIAN_API_KEY=

# Encryption
ENCRYPTION_KEY=  # 32-byte hex string for AES-256
```

### Required for v2
```bash
# Private RPC
FLASHBOTS_API_KEY=
EDEN_API_KEY=
BLOXROUTE_API_KEY=
```

### Required for v3
```bash
# Custody
FIREBLOCKS_API_KEY=
FIREBLOCKS_API_SECRET=
COPPER_API_KEY=
COPPER_API_SECRET=

# Sanctions Screening
TRM_LABS_API_KEY=
CHAINALYSIS_API_KEY=
```

## Database Conventions

### Table Naming
- Use `snake_case` for table names
- Prefix HarvestPro tables with `harvest_`
- Examples: `harvest_lots`, `harvest_opportunities`, `harvest_sessions`

### Column Naming
- Use `snake_case` for column names
- Use `_id` suffix for foreign keys
- Use `_at` suffix for timestamps
- Examples: `user_id`, `created_at`, `updated_at`

### Indexes
- Prefix with `idx_`
- Include table name and columns
- Example: `idx_harvest_lots_user_created`

### RLS Policies
- Prefix with `p_`
- Include table name and purpose
- Example: `p_harvest_lots_user`

## API Conventions

### Endpoint Naming
- Use REST conventions
- Plural nouns for collections
- Examples: `/api/harvest/opportunities`, `/api/harvest/sessions`

### Response Format
```typescript
// Success
{
  data: T,
  cursor?: string,
  ts: string  // ISO 8601 UTC
}

// Error
{
  error: {
    code: string,
    message: string,
    retry_after_sec?: number
  }
}
```

### Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Rate Limited
- `500`: Internal Server Error

## Performance Standards

### API Response Times
- P95 < 200ms for read endpoints
- P95 < 2s for compute endpoints
- P95 < 10s for scan/sync endpoints

### Database Queries
- Always use indexes for filters
- Limit results (max 100 items per page)
- Use cursor pagination for large datasets

### Caching
- **Redis/Upstash**: Server-side caching
- **React Query**: Client-side caching
- **TTLs**: 
  - Opportunities: 5 minutes
  - Prices: 1 minute
  - Guardian scores: 1 hour

## Security Standards

### Authentication
- Use Supabase Auth
- Enforce RLS on all tables
- Validate user_id on all requests

### Encryption
- AES-256-GCM for credentials
- Store encrypted values in database
- Never log decrypted values

### Rate Limiting
- 60 requests/hour for compute endpoints
- 600 requests/hour for read endpoints
- Use Upstash Rate Limit

### Input Validation
- Validate all inputs with Zod
- Sanitize user input
- Use parameterized queries

## Version Control

### Branch Naming
- `feature/harvestpro-v1-*` for v1 features
- `feature/harvestpro-v2-*` for v2 features
- `feature/harvestpro-v3-*` for v3 features
- `fix/harvestpro-*` for bug fixes

### Commit Messages
- Use conventional commits
- Prefix with `feat:`, `fix:`, `refactor:`, `test:`, `docs:`
- Reference task numbers: `feat(harvestpro): implement FIFO engine (Task 2)`

## Documentation

### Code Comments
- Document WHY, not WHAT
- Add JSDoc for public functions
- Include examples for complex logic

### README Files
- Create README.md in each major directory
- Document purpose, usage, and examples
- Keep up to date

## Summary

This stack is optimized for:
- **Tax compliance**: Deterministic, auditable calculations
- **Security**: Encrypted credentials, RLS, rate limiting
- **Performance**: Edge Functions, caching, indexes
- **Maintainability**: TypeScript strict mode, Zod validation, clean architecture
- **Scalability**: Supabase, Edge Functions, cursor pagination

Follow these standards for all HarvestPro development.
