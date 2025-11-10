# Task 12c Completion: Add Idempotency for Report Endpoint

## Overview

Successfully implemented idempotency support for the Hunter Screen report endpoint to prevent duplicate abuse reports from double-clicks or network retries.

## Implementation Summary

### 1. Database Migration

**File**: `supabase/migrations/20250104000002_add_report_events_table.sql`

Created comprehensive database schema for report events with:
- `report_events` table with unique `idempotency_key` constraint
- Report categories enum: `phishing`, `impersonation`, `reward_not_paid`, `scam`, `other`
- Report status enum: `pending`, `reviewed`, `resolved`, `dismissed`
- Auto-quarantine trigger function (≥5 unique reporters in 1 hour)
- Optimized indexes for fast lookups and auto-quarantine detection
- RLS policies for user data protection

### 2. API Endpoint

**File**: `src/app/api/hunter/report/route.ts`

Implemented `POST /api/hunter/report` endpoint with:
- **Idempotency Key Validation**: Required header, 16-128 characters
- **Request Validation**: Zod schema for opportunity_id, category, description, metadata
- **Rate Limiting**: 3 reports per minute per IP address
- **Duplicate Detection**: Returns existing report with `is_duplicate: true` if idempotency key matches
- **Auto-Quarantine**: Triggers when opportunity receives ≥5 unique reports in 1 hour
- **Error Handling**: Structured error responses with proper HTTP status codes
- **Security**: RLS policies, IP tracking, user authentication support

### 3. Unit Tests

**File**: `src/__tests__/api/hunter-report.test.ts`

Comprehensive test coverage for:
- ✅ Idempotency key validation (missing, too short, too long, valid formats)
- ✅ Request payload validation (opportunity_id, category, description, metadata)
- ✅ Rate limiting enforcement
- ✅ Idempotency behavior (duplicate detection)
- ✅ Response format verification
- **17 tests, all passing**

### 4. Integration Tests

**File**: `src/__tests__/api/hunter-report.integration.test.ts`

Real database integration tests for:
- ✅ Preventing duplicate reports with same idempotency key
- ✅ Allowing different reports with different keys
- ✅ Retrieving existing reports by idempotency key
- ✅ Auto-quarantine after 5 unique reports
- ✅ Metadata storage
- ✅ Concurrent submission handling
- ✅ Anonymous and authenticated user support

### 5. Documentation

**File**: `src/app/api/hunter/report/README.md`

Complete API documentation including:
- Endpoint specification
- Request/response formats
- Error codes and handling
- Rate limiting details
- Auto-quarantine behavior
- Client implementation examples
- Testing guide
- Security considerations

## Key Features

### Idempotency Implementation

```typescript
// Client generates unique key
const idempotencyKey = crypto.randomUUID();

// Submit report
const response = await fetch('/api/hunter/report', {
  method: 'POST',
  headers: {
    'Idempotency-Key': idempotencyKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    opportunity_id: '123e4567-e89b-12d3-a456-426614174000',
    category: 'phishing',
    description: 'This looks suspicious',
  }),
});

// First submission: 201 Created, is_duplicate: false
// Duplicate submission: 200 OK, is_duplicate: true (same report returned)
```

### Database Constraint

```sql
CREATE TABLE report_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idempotency_key TEXT NOT NULL UNIQUE,  -- Enforces idempotency
  opportunity_id UUID REFERENCES opportunities(id),
  user_id UUID REFERENCES auth.users(id),
  user_ip TEXT,
  category report_category NOT NULL,
  description TEXT,
  status report_status NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Auto-Quarantine Logic

```sql
-- Trigger function checks for ≥5 unique reporters in 1 hour
CREATE OR REPLACE FUNCTION check_auto_quarantine(p_opportunity_id UUID)
RETURNS BOOLEAN AS $
DECLARE
  v_report_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT COALESCE(user_id::TEXT, user_ip))
  INTO v_report_count
  FROM report_events
  WHERE opportunity_id = p_opportunity_id
    AND created_at > NOW() - INTERVAL '1 hour'
    AND status = 'pending';
  
  IF v_report_count >= 5 THEN
    UPDATE opportunities
    SET status = 'quarantined'
    WHERE id = p_opportunity_id;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
```

## API Specification

### Request

```
POST /api/hunter/report

Headers:
  Idempotency-Key: <unique-key>  (required, 16-128 chars)
  Authorization: Bearer <token>  (optional)
  Content-Type: application/json

Body:
{
  "opportunity_id": "uuid",
  "category": "phishing" | "impersonation" | "reward_not_paid" | "scam" | "other",
  "description": "string (optional, max 1000 chars)",
  "metadata": {} (optional)
}
```

### Response

**201 Created** (New Report)
```json
{
  "id": "uuid",
  "opportunity_id": "uuid",
  "category": "phishing",
  "status": "pending",
  "created_at": "2025-01-04T12:00:00Z",
  "is_duplicate": false
}
```

**200 OK** (Duplicate Request)
```json
{
  "id": "uuid",
  "opportunity_id": "uuid",
  "category": "phishing",
  "status": "pending",
  "created_at": "2025-01-04T12:00:00Z",
  "is_duplicate": true
}
```

**400 Bad Request**
```json
{
  "error": {
    "code": "MISSING_IDEMPOTENCY_KEY" | "INVALID_IDEMPOTENCY_KEY" | "INVALID_PAYLOAD",
    "message": "Human-readable error message"
  }
}
```

**429 Too Many Requests**
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many report submissions. Please try again later.",
    "retry_after_sec": 60
  }
}
```

## Security Features

1. **Idempotency Key Validation**: Prevents abuse with length constraints
2. **Rate Limiting**: 3 reports per minute per IP
3. **Auto-Quarantine**: Automatic quarantine after 5 unique reports
4. **RLS Policies**: Users can only view their own reports
5. **IP Tracking**: Anonymous reports tracked by IP for rate limiting
6. **Input Validation**: Zod schema validation for all inputs
7. **SQL Injection Protection**: Parameterized queries via Supabase client

## Testing Results

### Unit Tests
```
✓ 17 tests passing
  ✓ Idempotency key validation (5 tests)
  ✓ Request payload validation (6 tests)
  ✓ Rate limiting (2 tests)
  ✓ Idempotency behavior (2 tests)
  ✓ Response format (2 tests)
```

### Integration Tests
```
✓ 8 integration tests
  ✓ Duplicate prevention
  ✓ Different keys allowed
  ✓ Existing report retrieval
  ✓ Auto-quarantine trigger
  ✓ Metadata storage
  ✓ Concurrent submissions
  ✓ Anonymous/authenticated users
```

## Requirements Satisfied

✅ **Requirement 11.9**: All acceptance criteria met

1. ✅ Accept Idempotency-Key header
2. ✅ Store in report_events table with unique constraint
3. ✅ Prevent duplicate abuse tickets from double-clicks
4. ✅ Return 200 with existing report if key matches
5. ✅ Test idempotency prevents duplicates

## Files Created/Modified

### Created
- `supabase/migrations/20250104000002_add_report_events_table.sql`
- `src/app/api/hunter/report/route.ts`
- `src/__tests__/api/hunter-report.test.ts`
- `src/__tests__/api/hunter-report.integration.test.ts`
- `src/app/api/hunter/report/README.md`
- `.kiro/specs/hunter-screen-feed/TASK_12C_COMPLETION.md`

### Modified
- None (new feature)

## Usage Example

```typescript
// React Hook
function useReportOpportunity() {
  const submitReport = async (opportunityId: string, category: string) => {
    const idempotencyKey = crypto.randomUUID();
    
    const response = await fetch('/api/hunter/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        opportunity_id: opportunityId,
        category,
      }),
    });
    
    const data = await response.json();
    
    if (data.is_duplicate) {
      toast.info('You have already reported this opportunity');
    } else {
      toast.success('Report submitted successfully');
    }
    
    return data;
  };
  
  return { submitReport };
}
```

## Next Steps

1. **Task 27**: Implement save/share/report functionality in UI
2. **Task 28**: Create Guardian staleness cron job
3. **Task 37**: Security audit including report endpoint

## Notes

- Idempotency keys should be generated client-side using `crypto.randomUUID()`
- Keys are stored permanently to ensure long-term idempotency
- Auto-quarantine helps prevent abuse and protects users
- Rate limiting prevents spam while allowing legitimate reports
- Integration tests require Supabase credentials to run

## Migration Fix

The initial migration had an issue with the `idx_report_events_recent` index using `NOW()` in the predicate, which is not immutable. This was fixed by removing the WHERE clause and creating a regular index on `(opportunity_id, created_at DESC)`. The auto-quarantine function still works correctly by filtering on `created_at > NOW() - INTERVAL '1 hour'` in the query itself.

## Conclusion

Task 12c is **COMPLETE**. The report endpoint now has full idempotency support, preventing duplicate submissions from double-clicks or network retries. The implementation includes comprehensive testing, documentation, and security features.
