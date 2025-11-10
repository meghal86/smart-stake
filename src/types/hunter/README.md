# Hunter Screen Types and Schemas

This directory contains TypeScript types and Zod schemas for the AlphaWhale Hunter Screen (Feed) feature.

## Overview

The Hunter Screen types and schemas provide:
- **Type Safety**: Full TypeScript type definitions matching the database schema
- **Runtime Validation**: Zod schemas for API request/response validation
- **Documentation**: Self-documenting types with JSDoc comments
- **Requirements Traceability**: Each type references specific requirements from requirements.md

## Files

### `src/types/hunter.ts`
Core TypeScript type definitions including:
- Enums (OpportunityType, RewardUnit, Chain, TrustLevel, etc.)
- Data models (Opportunity, Trust, Reward, etc.)
- Component props interfaces (OpportunityCardProps, FilterDrawerProps)
- API response interfaces (OpportunitiesResponse, ErrorResponse, etc.)
- Utility types (CursorTuple, EligibilitySignals, etc.)

### `src/schemas/hunter.ts`
Zod validation schemas including:
- Enum schemas for runtime validation
- Data model schemas (OpportunitySchema, TrustSchema, etc.)
- API request/response schemas (OpportunitiesQuerySchema, OpportunitiesResponseSchema, etc.)
- Type inference helpers for convenience

### `src/types/hunter/index.ts`
Convenience re-export file for easy importing

## Usage

### Importing Types

```typescript
import { 
  Opportunity, 
  FilterState, 
  OpportunityCardProps,
  ErrorCode 
} from '@/types/hunter';
```

### Importing Schemas

```typescript
import { 
  OpportunitySchema, 
  OpportunitiesQuerySchema,
  ErrorResponseSchema 
} from '@/schemas/hunter';
```

### Using Both

```typescript
import { 
  Opportunity,
  OpportunitySchema 
} from '@/types/hunter';

// Validate API response
const result = OpportunitySchema.safeParse(apiData);
if (result.success) {
  const opportunity: Opportunity = result.data;
  // Use validated data
}
```

### API Request Validation

```typescript
import { OpportunitiesQuerySchema } from '@/schemas/hunter';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = OpportunitiesQuerySchema.safeParse(
    Object.fromEntries(searchParams)
  );
  
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'BAD_FILTER', message: 'Invalid query' } },
      { status: 400 }
    );
  }
  
  // Use parsed.data with type safety
}
```

### Component Props

```typescript
import { OpportunityCardProps } from '@/types/hunter';

export function OpportunityCard({
  opportunity,
  onSave,
  onShare,
  onReport,
  onCTAClick,
  isConnected,
  userWallet,
}: OpportunityCardProps) {
  // Component implementation
}
```

## Key Types

### Opportunity
The main data model representing a DeFi opportunity. Includes:
- Basic info (id, slug, title, description)
- Protocol details (name, logo)
- Classification (type, chains, difficulty)
- Rewards (min, max, currency, confidence)
- Trust information (score, level, last_scanned_ts)
- Eligibility preview (status, score, reasons)
- Metadata (featured, sponsored, badges)

### FilterState
State object for feed filtering. Includes:
- Search query
- Type filters (airdrop, quest, etc.)
- Chain filters
- Trust level minimum
- Reward range
- Urgency filters
- Eligibility toggle
- Difficulty filters
- Sort option
- Show risky toggle

### ErrorCode Enum
Stable error codes for API responses:
- `RATE_LIMITED`: Too many requests
- `BAD_FILTER`: Invalid query parameters
- `INTERNAL`: Internal server error
- `UNAVAILABLE`: Service unavailable
- `NOT_ALLOWED_GEO`: Geo-restricted
- `NOT_ALLOWED_KYC`: KYC required

## Requirements Coverage

This implementation satisfies:
- **Requirement 1.7**: API response structure with proper typing
- **Requirement 8.14**: Stable error code enum for structured errors
- **Requirement 4.1-4.12**: Comprehensive filtering with FilterState
- **Requirement 2.1-2.7**: Guardian trust integration types
- **Requirement 6.1-6.8**: Eligibility preview types

## Testing

Tests are located in `src/__tests__/schemas/hunter.test.ts` and cover:
- Schema validation for all major types
- Error handling and validation failures
- Default values and coercion
- Edge cases and boundary conditions

Run tests with:
```bash
npm test -- src/__tests__/schemas/hunter.test.ts --run
```

## Design Decisions

### Why Separate Types and Schemas?
- **Types**: Used at compile-time for TypeScript type checking
- **Schemas**: Used at runtime for validation and parsing
- Separation allows using types without importing Zod in components

### Why Zod?
- Runtime type safety for API boundaries
- Automatic type inference from schemas
- Built-in validation and error messages
- Coercion support (e.g., string to number)
- Composable and reusable schemas

### Naming Conventions
- Types: PascalCase (e.g., `Opportunity`, `FilterState`)
- Schemas: PascalCase + "Schema" suffix (e.g., `OpportunitySchema`)
- Enums: PascalCase (e.g., `ErrorCode`)
- Enum values: SCREAMING_SNAKE_CASE (e.g., `RATE_LIMITED`)

## Future Enhancements

Potential additions for future tasks:
- Ranking model types (Task 9a)
- Snapshot watermark types (Task 4a)
- Image proxy types (Task 11a)
- Analytics types with sampling (Task 26)
- Feature flag types (Task 29)
