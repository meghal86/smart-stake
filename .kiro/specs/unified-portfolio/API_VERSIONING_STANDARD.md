# Unified Portfolio API Versioning Standard

## Overview

All Unified Portfolio API endpoints MUST follow the canonical versioning standard to ensure backward compatibility, clear API evolution, and consistent client integration.

## Canonical API Path Structure

### Base Path
All portfolio endpoints MUST be under:
```
/api/v1/portfolio/...
```

### Version Format
- Version is specified as `v{major}` (e.g., `v1`, `v2`)
- Version is part of the URL path, not a query parameter or header
- Breaking changes require a new major version

## Response Format Requirements

### JSON Responses
Every JSON response MUST include an `apiVersion` field:

```typescript
{
  "apiVersion": "v1",
  "data": {
    // Response data
  },
  // ... other fields
}
```

### SSE (Server-Sent Events) Responses
SSE endpoints MUST include version information in TWO places:

1. **Response Header:**
```
X-API-Version: v1
```

2. **First SSE Event:**
```
event: meta
data: {"apiVersion":"v1"}

event: message
data: {"text":"Hello"}
```

## Endpoint Catalog

### V1 Endpoints

#### Portfolio Data
- `GET /api/v1/portfolio/snapshot` - Get portfolio snapshot with freshness metadata
  - Query params: `scope` (active_wallet|all_wallets), `wallet` (0x... address)
  - Returns: PortfolioSnapshot with net worth, delta, positions, approvals, actions, risk summary
  - Response includes: `{ apiVersion: "v1", data: {...}, ts: "..." }`
  
- `GET /api/v1/portfolio/positions` - Get positions with pagination
  - Query params: `scope`, `wallet`, `cursor` (pagination)
  - Returns: ListResponse<Position> with freshness metadata
  - Response includes: `{ apiVersion: "v1", items: [...], nextCursor: "...", freshness: {...} }`
  
- `GET /api/v1/portfolio/approvals` - Get approval risks with severity filtering
  - Query params: `scope`, `wallet`, `cursor`, `severity` (optional filter)
  - Returns: ListResponse<ApprovalRisk> with risk scores, VAR, contributing factors
  - Response includes: `{ apiVersion: "v1", items: [...], nextCursor: "...", freshness: {...} }`
  
- `GET /api/v1/portfolio/actions` - Get recommended actions prioritized by score
  - Query params: `scope`, `wallet`
  - Returns: Prioritized list of RecommendedAction with ActionScore sorting
  - Response includes: `{ apiVersion: "v1", items: [...], freshness: {...} }`

#### Intent Planning & Execution
- `POST /api/v1/portfolio/plan` - Create intent plan
  - Body: `{ intent: string, walletScope: WalletScope, params: {...}, idempotencyKey: string }`
  - Returns: IntentPlan with steps, policy status, simulation status
  - Response includes: `{ apiVersion: "v1", data: {...} }`
  
- `POST /api/v1/portfolio/plan/:id/simulate` - Simulate plan execution
  - Returns: SimulationReceipt with asset deltas, permission deltas, warnings
  - Response includes: `{ apiVersion: "v1", data: {...} }`
  
- `POST /api/v1/portfolio/plan/:id/execute` - Execute plan with idempotency
  - Headers: `Idempotency-Key` (required)
  - Returns: Execution status with step states
  - Response includes: `{ apiVersion: "v1", stepStates: [...] }`
  
- `GET /api/v1/portfolio/plans/:id` - Get plan canonical state
  - Returns: IntentPlan with current status and metadata
  - Response includes: `{ apiVersion: "v1", data: {...} }`
  
- `GET /api/v1/portfolio/plans/:id/steps` - Get plan steps canonical state
  - Returns: Array of ExecutionStep with current status
  - Response includes: `{ apiVersion: "v1", steps: [...] }`

#### Audit & Transparency
- `GET /api/v1/portfolio/audit/events` - Get audit events with filtering
  - Query params: `scope`, `cursor`, `severity` (optional), `plan_id` (optional)
  - Returns: Paginated audit events with timestamps and metadata
  - Response includes: `{ apiVersion: "v1", items: [...], nextCursor: "..." }`
  
- `GET /api/v1/portfolio/graph-lite` - Get transaction flow visualization (v0 placeholder)
  - Query params: `scope`, `wallet`, `tx` (optional transaction hash)
  - Returns: List-based flow summary or mini static diagram (V1: placeholder, V1.1: full interactive)
  - Response includes: `{ apiVersion: "v1", data: {...} }`

#### Settings & Preferences
- `GET /api/v1/portfolio/notification-prefs` - Get notification preferences
  - Returns: User notification settings (DND, caps, severity threshold, channels)
  - Response includes: `{ apiVersion: "v1", data: {...} }`
  
- `PUT /api/v1/portfolio/notification-prefs` - Update notification preferences
  - Body: `{ dnd: boolean, caps: {...}, severityThreshold: string, channels: [...] }`
  - Returns: Updated preferences
  - Response includes: `{ apiVersion: "v1", data: {...} }`

#### AI Copilot
- `GET /api/v1/portfolio/copilot/stream` - SSE stream for AI copilot responses
  - Query params: `wallet` (0x... address)
  - Headers: `X-API-Version: v1` (included in response)
  - First SSE event: `event: meta\ndata: {"apiVersion":"v1"}\n\n`
  - Subsequent events: `message`, `action_card`, `intent_plan`, `capability_notice`, `done`
  - Validates taxonomy: Answer, Observation, Recommendation, ActionCard, IntentPlan, SimulationReceipt, CapabilityNotice

## Implementation Checklist

When creating a new portfolio endpoint:

- [x] Path starts with `/api/v1/portfolio/`
- [x] JSON responses include `{ apiVersion: "v1" }`
- [x] SSE responses include `X-API-Version: v1` header
- [x] SSE responses send `meta` event with `{ apiVersion: "v1" }` as first event
- [x] Endpoint documented in this file
- [x] Endpoint tested with version validation
- [-] Client code uses versioned path

## Migration Guide

### From Unversioned to V1

If you have existing `/api/portfolio/...` endpoints:

1. **Create new versioned endpoint:**
   ```typescript
   // Old: src/app/api/portfolio/snapshot/route.ts
   // New: src/app/api/v1/portfolio/snapshot/route.ts
   ```

2. **Add apiVersion to response:**
   ```typescript
   return NextResponse.json({
     apiVersion: "v1",
     data: portfolioSnapshot,
     ts: new Date().toISOString()
   });
   ```

3. **For SSE endpoints, add version metadata:**
   ```typescript
   // Set header
   headers.set('X-API-Version', 'v1');
   
   // Send meta event first
   encoder.encode(`event: meta\ndata: ${JSON.stringify({ apiVersion: "v1" })}\n\n`);
   ```

4. **Update client code:**
   ```typescript
   // Old
   const response = await fetch('/api/portfolio/snapshot');
   
   // New
   const response = await fetch('/api/v1/portfolio/snapshot');
   ```

5. **Deprecate old endpoint** (if it exists)

## Version Evolution Strategy

### When to Increment Version

**Major version (v1 → v2)** when:
- Breaking changes to request/response format
- Removing fields from responses
- Changing field types or semantics
- Changing authentication requirements
- Changing rate limiting behavior

**Do NOT increment version** for:
- Adding new optional fields to responses
- Adding new optional query parameters
- Adding new endpoints under existing version
- Bug fixes that don't change API contract
- Performance improvements

### Backward Compatibility

- V1 endpoints MUST remain stable once released
- V2 can coexist with V1 during transition period
- Clients specify version in URL path
- Server maintains both versions until V1 deprecation

## Testing Requirements

### Unit Tests
```typescript
describe('GET /api/v1/portfolio/snapshot', () => {
  it('includes apiVersion in response', async () => {
    const response = await fetch('/api/v1/portfolio/snapshot');
    const data = await response.json();
    expect(data.apiVersion).toBe('v1');
  });
});
```

### Integration Tests
```typescript
describe('SSE /api/v1/portfolio/copilot/stream', () => {
  it('includes X-API-Version header', async () => {
    const response = await fetch('/api/v1/portfolio/copilot/stream');
    expect(response.headers.get('X-API-Version')).toBe('v1');
  });
  
  it('sends meta event with apiVersion first', async () => {
    const stream = await fetch('/api/v1/portfolio/copilot/stream');
    const reader = stream.body.getReader();
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    expect(text).toContain('event: meta');
    expect(text).toContain('"apiVersion":"v1"');
  });
});
```

## Acceptance Criteria

Task 0.1 is complete when:

✅ All endpoints in tasks.md use `/api/v1/portfolio/...` format
✅ All endpoints in design.md use `/api/v1/portfolio/...` format
✅ No `/api/portfolio/...` endpoints remain (without v1)
✅ This versioning standard document exists
✅ JSON response format includes `apiVersion` field
✅ SSE response format includes header and meta event

## References

- Requirements: R15.3 (API versioning)
- Design: API Interfaces section
- Tasks: 0.1 Canonical API Versioning
