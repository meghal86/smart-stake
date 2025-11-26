# HarvestPro Sessions API Documentation

## Overview

The HarvestPro Sessions API manages the lifecycle of tax-loss harvesting sessions. A session represents a user's intent to harvest one or more opportunities, tracks execution progress, and maintains state through the harvest workflow.

## Session State Machine

Sessions follow a strict state machine with the following valid transitions:

```
draft → executing → completed
  ↓         ↓
cancelled  failed → executing (retry)
           ↓
        cancelled
```

### States

- **draft**: Initial state when session is created with selected opportunities
- **executing**: Session is actively executing harvest transactions
- **completed**: All harvest transactions completed successfully
- **failed**: One or more transactions failed during execution
- **cancelled**: User cancelled the session (terminal state)

### Valid Transitions

- `draft → executing`: User clicks "Execute Harvest"
- `draft → cancelled`: User cancels before execution
- `executing → completed`: All steps succeed
- `executing → failed`: Any step fails
- `failed → executing`: User retries after fixing issues
- `failed → cancelled`: User gives up

### Invalid Transitions

Any transition not listed above is invalid and will result in a 400 error. For example:
- `draft → completed` (must go through executing)
- `executing → cancelled` (must complete or fail first)
- `completed → *` (terminal state)
- `cancelled → *` (terminal state)

## Endpoints

### POST /api/harvest/sessions

Create a new harvest session in draft status.

**Authentication**: Required

**Request Body**:
```json
{
  "opportunityIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response** (201 Created):
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "draft",
  "createdAt": "2025-02-01T12:00:00Z"
}
```

**Errors**:
- `400 BAD_REQUEST`: Invalid request body or opportunity IDs
- `401 UNAUTHORIZED`: Not authenticated
- `500 INTERNAL`: Server error

**Example**:
```typescript
const response = await fetch('/api/harvest/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    opportunityIds: ['uuid1', 'uuid2']
  })
});

const data = await response.json();
console.log(data.sessionId); // Use this to track the session
```

---

### GET /api/harvest/sessions/:id

Get details of a specific harvest session.

**Authentication**: Required

**Path Parameters**:
- `id`: Session UUID

**Response** (200 OK):
```json
{
  "session": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-uuid",
    "createdAt": "2025-02-01T12:00:00Z",
    "updatedAt": "2025-02-01T12:05:00Z",
    "status": "executing",
    "opportunitiesSelected": [
      {
        "id": "opp-uuid-1",
        "token": "ETH",
        "unrealizedLoss": 500.00,
        "netTaxBenefit": 120.00,
        ...
      }
    ],
    "realizedLossesTotal": 1500.00,
    "netBenefitTotal": 360.00,
    "executionSteps": [
      {
        "id": "step-uuid-1",
        "stepNumber": 1,
        "description": "Approve token swap",
        "type": "on-chain",
        "status": "completed",
        "transactionHash": "0x123...",
        "guardianScore": 8.5,
        "timestamp": "2025-02-01T12:01:00Z",
        "durationMs": 15000
      }
    ],
    "exportUrl": null,
    "proofHash": null
  }
}
```

**Errors**:
- `401 UNAUTHORIZED`: Not authenticated
- `404 NOT_FOUND`: Session not found or not owned by user
- `500 INTERNAL`: Server error

**Caching**: Response is cached for 30 seconds

**Example**:
```typescript
const response = await fetch(`/api/harvest/sessions/${sessionId}`);
const { session } = await response.json();
console.log(session.status); // Check current status
```

---

### PATCH /api/harvest/sessions/:id

Update a harvest session. Used to change status, add execution steps, or update totals.

**Authentication**: Required

**Path Parameters**:
- `id`: Session UUID

**Request Body** (all fields optional):
```json
{
  "status": "executing",
  "opportunityIds": ["uuid1", "uuid2"],
  "realizedLossesTotal": 1500.00,
  "netBenefitTotal": 360.00,
  "executionSteps": [...],
  "exportUrl": "https://...",
  "proofHash": "abc123..."
}
```

**Response** (200 OK):
```json
{
  "session": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "executing",
    ...
  }
}
```

**Errors**:
- `400 BAD_REQUEST`: Invalid request body or invalid state transition
- `401 UNAUTHORIZED`: Not authenticated
- `404 NOT_FOUND`: Session not found
- `500 INTERNAL`: Server error

**State Transition Validation**: The API validates that status changes follow the state machine. Invalid transitions return 400 with error message like:
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid state transition: draft → completed"
  }
}
```

**Example**:
```typescript
// Start execution
const response = await fetch(`/api/harvest/sessions/${sessionId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'executing'
  })
});

// Add execution step
await fetch(`/api/harvest/sessions/${sessionId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    executionSteps: [
      {
        stepNumber: 1,
        description: 'Approve token',
        type: 'on-chain',
        status: 'completed',
        transactionHash: '0x123...'
      }
    ]
  })
});
```

---

### DELETE /api/harvest/sessions/:id

Cancel a harvest session. This is a soft delete that sets status to 'cancelled'.

**Authentication**: Required

**Path Parameters**:
- `id`: Session UUID

**Response** (204 No Content): Empty response body

**Errors**:
- `400 BAD_REQUEST`: Invalid state transition (e.g., trying to cancel completed session)
- `401 UNAUTHORIZED`: Not authenticated
- `404 NOT_FOUND`: Session not found
- `500 INTERNAL`: Server error

**Example**:
```typescript
const response = await fetch(`/api/harvest/sessions/${sessionId}`, {
  method: 'DELETE'
});

if (response.status === 204) {
  console.log('Session cancelled successfully');
}
```

---

## React Hook

Use the `useHarvestSession` hook for easy session management in React components:

```typescript
import { useHarvestSession } from '@/hooks/useHarvestSession';

function HarvestFlow() {
  const {
    session,
    loading,
    error,
    createSession,
    getSession,
    updateSession,
    cancelSession,
    clearError
  } = useHarvestSession();

  const handleStartHarvest = async (opportunityIds: string[]) => {
    const sessionId = await createSession({ opportunityIds });
    if (sessionId) {
      // Navigate to execution flow
      router.push(`/harvest/execute/${sessionId}`);
    }
  };

  const handleExecute = async (sessionId: string) => {
    await updateSession(sessionId, { status: 'executing' });
    // Start execution flow...
  };

  const handleCancel = async (sessionId: string) => {
    await cancelSession(sessionId);
    // Navigate back to dashboard
  };

  return (
    <div>
      {loading && <Spinner />}
      {error && <ErrorBanner message={error} onDismiss={clearError} />}
      {session && <SessionDetails session={session} />}
    </div>
  );
}
```

## Error Handling

All endpoints return structured error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "retry_after_sec": 60  // Optional, for rate limiting
  }
}
```

### Error Codes

- `RATE_LIMITED`: Too many requests (429)
- `BAD_REQUEST`: Invalid input or state transition (400)
- `UNAUTHORIZED`: Authentication required (401)
- `NOT_FOUND`: Session not found (404)
- `INTERNAL`: Server error (500)
- `UNAVAILABLE`: Service temporarily unavailable (503)

## Best Practices

### 1. Poll for Status Updates

When executing a session, poll the GET endpoint to track progress:

```typescript
async function pollSessionStatus(sessionId: string) {
  const interval = setInterval(async () => {
    const response = await fetch(`/api/harvest/sessions/${sessionId}`);
    const { session } = await response.json();
    
    if (session.status === 'completed' || session.status === 'failed') {
      clearInterval(interval);
      // Handle completion
    }
  }, 2000); // Poll every 2 seconds
}
```

### 2. Handle State Transitions Carefully

Always check current status before attempting transitions:

```typescript
async function safeTransition(sessionId: string, newStatus: string) {
  const { session } = await fetch(`/api/harvest/sessions/${sessionId}`).then(r => r.json());
  
  // Check if transition is valid
  const validTransitions = {
    draft: ['executing', 'cancelled'],
    executing: ['completed', 'failed'],
    failed: ['executing', 'cancelled']
  };
  
  if (validTransitions[session.status]?.includes(newStatus)) {
    await fetch(`/api/harvest/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
  }
}
```

### 3. Implement Retry Logic

For failed sessions, allow users to retry:

```typescript
async function retryFailedSession(sessionId: string) {
  try {
    await fetch(`/api/harvest/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'executing' })
    });
    // Restart execution flow
  } catch (error) {
    console.error('Retry failed:', error);
  }
}
```

### 4. Clean Up Cancelled Sessions

Consider implementing a cleanup job for old cancelled/completed sessions:

```typescript
async function cleanupOldSessions() {
  // Fetch sessions older than 30 days
  // Delete or archive them
}
```

## Security Considerations

1. **Authentication**: All endpoints require authentication via Supabase Auth
2. **Authorization**: Users can only access their own sessions (enforced by RLS)
3. **State Validation**: Invalid state transitions are rejected
4. **Input Validation**: All inputs are validated with Zod schemas
5. **Rate Limiting**: Consider implementing rate limiting for production

## Testing

Run the property-based test to verify state machine correctness:

```bash
npm test -- src/lib/harvestpro/__tests__/session-state-transitions.test.ts
```

This test validates all valid and invalid state transitions with 100+ iterations.

## Related Documentation

- [Opportunities API](./HARVESTPRO_OPPORTUNITIES_API.md)
- [HarvestPro Requirements](../../.kiro/specs/harvestpro/requirements.md)
- [HarvestPro Design](../../.kiro/specs/harvestpro/design.md)
