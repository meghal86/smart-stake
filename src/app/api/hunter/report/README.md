# Hunter Report API - Idempotency Implementation

## Overview

The Hunter Report API endpoint (`POST /api/hunter/report`) implements idempotency to prevent duplicate abuse reports from double-clicks or network retries. This ensures that submitting the same report multiple times results in only one record being created.

## Idempotency Key

### What is an Idempotency Key?

An idempotency key is a unique identifier provided by the client that ensures the same operation is not performed multiple times. If a request with the same idempotency key is submitted multiple times, the API will:

1. Return the existing report (if already created)
2. Not create duplicate records
3. Return a 200 status code with `is_duplicate: true`

### Requirements

- **Header**: `Idempotency-Key` (required)
- **Format**: String between 16 and 128 characters
- **Recommended**: Use UUID v4 or similar unique identifier

### Example

```typescript
// Generate a unique idempotency key
const idempotencyKey = crypto.randomUUID();

// Submit report
const response = await fetch('/api/hunter/report', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey,
  },
  body: JSON.stringify({
    opportunity_id: '123e4567-e89b-12d3-a456-426614174000',
    category: 'phishing',
    description: 'This opportunity looks suspicious',
  }),
});
```

## API Specification

### Endpoint

```
POST /api/hunter/report
```

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Idempotency-Key` | Yes | Unique key to prevent duplicates (16-128 chars) |
| `Authorization` | No | Bearer token for authenticated users |
| `Content-Type` | Yes | Must be `application/json` |

### Request Body

```typescript
{
  opportunity_id: string;      // UUID of the opportunity being reported
  category: string;            // One of: phishing, impersonation, reward_not_paid, scam, other
  description?: string;        // Optional description (max 1000 chars)
  metadata?: Record<string, any>; // Optional additional metadata
}
```

### Response

#### Success (201 Created - New Report)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "opportunity_id": "123e4567-e89b-12d3-a456-426614174000",
  "category": "phishing",
  "status": "pending",
  "created_at": "2025-01-04T12:00:00Z",
  "is_duplicate": false
}
```

#### Success (200 OK - Duplicate Request)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "opportunity_id": "123e4567-e89b-12d3-a456-426614174000",
  "category": "phishing",
  "status": "pending",
  "created_at": "2025-01-04T12:00:00Z",
  "is_duplicate": true
}
```

#### Error Responses

**400 Bad Request - Missing Idempotency Key**
```json
{
  "error": {
    "code": "MISSING_IDEMPOTENCY_KEY",
    "message": "Idempotency-Key header is required"
  }
}
```

**400 Bad Request - Invalid Idempotency Key**
```json
{
  "error": {
    "code": "INVALID_IDEMPOTENCY_KEY",
    "message": "Idempotency-Key must be between 16 and 128 characters"
  }
}
```

**400 Bad Request - Invalid Payload**
```json
{
  "error": {
    "code": "INVALID_PAYLOAD",
    "message": "Invalid request payload"
  }
}
```

**404 Not Found - Opportunity Not Found**
```json
{
  "error": {
    "code": "OPPORTUNITY_NOT_FOUND",
    "message": "Opportunity not found"
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

## Rate Limiting

The report endpoint implements rate limiting to prevent abuse:

- **Limit**: 3 reports per minute per IP address
- **Identifier**: IP address from `x-forwarded-for` or `x-real-ip` header
- **Response**: 429 status code with `Retry-After` header

## Auto-Quarantine

When an opportunity receives 5 or more reports from unique sources (different user IDs or IP addresses) within 1 hour, it is automatically quarantined:

1. Opportunity status changes to `quarantined`
2. Opportunity is hidden from the feed
3. Admin review is required to restore

## Database Schema

### report_events Table

```sql
CREATE TABLE report_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idempotency_key TEXT NOT NULL UNIQUE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_ip TEXT,
  category report_category NOT NULL,
  description TEXT,
  status report_status NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

- `UNIQUE(idempotency_key)` - Enforces idempotency
- `idx_report_events_opportunity` - Fast lookups by opportunity
- `idx_report_events_user` - Fast lookups by user
- `idx_report_events_pending` - Fast queries for pending reports
- `idx_report_events_recent` - Auto-quarantine detection

## Client Implementation

### React Hook Example

```typescript
import { useState } from 'react';

interface ReportOptions {
  opportunityId: string;
  category: 'phishing' | 'impersonation' | 'reward_not_paid' | 'scam' | 'other';
  description?: string;
}

export function useReportOpportunity() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReport = async (options: ReportOptions) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Generate unique idempotency key
      const idempotencyKey = crypto.randomUUID();

      const response = await fetch('/api/hunter/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          opportunity_id: options.opportunityId,
          category: options.category,
          description: options.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to submit report');
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitReport, isSubmitting, error };
}
```

### Usage in Component

```typescript
function ReportButton({ opportunityId }: { opportunityId: string }) {
  const { submitReport, isSubmitting } = useReportOpportunity();
  const [showModal, setShowModal] = useState(false);

  const handleReport = async (category: string, description: string) => {
    try {
      const result = await submitReport({
        opportunityId,
        category,
        description,
      });

      if (result.is_duplicate) {
        toast.info('You have already reported this opportunity');
      } else {
        toast.success('Report submitted successfully');
      }

      setShowModal(false);
    } catch (error) {
      toast.error('Failed to submit report');
    }
  };

  return (
    <>
      <button onClick={() => setShowModal(true)} disabled={isSubmitting}>
        Report
      </button>
      {showModal && (
        <ReportModal
          onSubmit={handleReport}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
```

## Testing

### Unit Tests

Run unit tests to verify idempotency logic:

```bash
npm test src/__tests__/api/hunter-report.test.ts
```

### Integration Tests

Run integration tests with real database:

```bash
npm test src/__tests__/api/hunter-report.integration.test.ts
```

### Manual Testing

1. Submit a report with a specific idempotency key
2. Submit the same report again with the same key
3. Verify the second request returns the existing report
4. Verify only one record exists in the database

```bash
# First submission
curl -X POST http://localhost:3000/api/hunter/report \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-key-123" \
  -d '{
    "opportunity_id": "123e4567-e89b-12d3-a456-426614174000",
    "category": "phishing",
    "description": "Test report"
  }'

# Second submission (should return existing report)
curl -X POST http://localhost:3000/api/hunter/report \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-key-123" \
  -d '{
    "opportunity_id": "123e4567-e89b-12d3-a456-426614174000",
    "category": "phishing",
    "description": "Test report"
  }'
```

## Security Considerations

1. **Idempotency Key Validation**: Keys must be 16-128 characters to prevent abuse
2. **Rate Limiting**: 3 reports per minute per IP to prevent spam
3. **Auto-Quarantine**: Automatic quarantine after 5 unique reports
4. **RLS Policies**: Users can only view their own reports
5. **IP Tracking**: Anonymous reports tracked by IP for rate limiting

## Requirements Satisfied

This implementation satisfies Requirement 11.9:

- ✅ Accept Idempotency-Key header
- ✅ Store in report_events table with unique constraint
- ✅ Prevent duplicate abuse tickets from double-clicks
- ✅ Return 200 with existing report if key matches
- ✅ Test idempotency prevents duplicates

## Related Files

- Migration: `supabase/migrations/20250104000002_add_report_events_table.sql`
- API Route: `src/app/api/hunter/report/route.ts`
- Unit Tests: `src/__tests__/api/hunter-report.test.ts`
- Integration Tests: `src/__tests__/api/hunter-report.integration.test.ts`
