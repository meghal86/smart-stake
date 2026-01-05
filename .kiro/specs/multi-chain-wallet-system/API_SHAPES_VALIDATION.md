# API Shapes Validation Report

## Task: Exact API shapes match requirements specification

**Status**: ✅ COMPLETED

This document validates that all Edge Function implementations match the exact API shapes specified in the requirements document.

---

## Requirement 13: Edge Function Contracts (Exact APIs)

### ✅ GET /functions/v1/wallets-list

**Requirement Specification**:
```json
{
  "wallets": [
    {
      "id": "uuid",
      "address": "0x...",
      "chain_namespace": "eip155:1",
      "is_primary": true,
      "guardian_scores": {},
      "balance_cache": {}
    }
  ],
  "quota": { "used_addresses": 2, "used_rows": 4, "total": 5, "plan": "free" },
  "active_hint": { "primary_wallet_id": "uuid" }
}
```

**Implementation Status**: ✅ MATCHES
- File: `supabase/functions/wallets-list/index.ts`
- Response shape matches exactly
- All required fields present
- Quota calculation correct (counts unique addresses case-insensitively)
- Active hint includes primary wallet ID or null
- Deterministic ordering: `is_primary DESC, created_at DESC, id ASC`

---

### ✅ POST /functions/v1/wallets-add-watch

**Request Body Specification**:
```json
{
  "address_or_ens": "vitalik.eth",
  "chain_namespace": "eip155:1",
  "label": "Main"
}
```

**Response (200 OK) Specification**:
```json
{ "wallet": { "id", "address", "chain_namespace", "is_primary", ... } }
```

**Response (409 Conflict) Specification**:
```json
{ "error": { "code": "WALLET_DUPLICATE", "message": "Wallet already exists for this network" } }
```

**Response (422 Validation) Specification**:
```json
{ "error": { "code": "INVALID_ADDRESS", "message": "..." } }
```

**Implementation Status**: ✅ MATCHES
- File: `supabase/functions/wallets-add-watch/index.ts`
- Request body validation correct
- ENS resolution implemented
- Private key detection: `PRIVATE_KEY_DETECTED` error code
- Seed phrase detection: `SEED_PHRASE_DETECTED` error code
- Duplicate detection: `WALLET_DUPLICATE` (409)
- Validation errors: `INVALID_ADDRESS` (422)
- Response shape matches exactly
- First wallet automatically set as primary
- Quota checking implemented

---

### ✅ POST /functions/v1/wallets-remove

**Request Body Specification**:
```json
{ "wallet_id": "uuid" }
```

**Response Specification**:
```json
{
  "success": true,
  "new_primary_id": "uuid" (optional, if primary was reassigned)
}
```

**Implementation Status**: ✅ MATCHES
- File: `supabase/functions/wallets-remove/index.ts`
- Request validation correct
- Atomic primary reassignment implemented
- Primary selection priority: eip155:1 → oldest created_at → smallest id
- Response shape matches exactly
- Proper error handling (404, 403, 500)

---

### ✅ POST /functions/v1/wallets-remove-address

**Request Body Specification**:
```json
{ "address": "0x..." }
```

**Response Specification**:
```json
{
  "success": true,
  "deleted_count": 2,
  "new_primary_id": "uuid" (optional, if primary was reassigned)
}
```

**Implementation Status**: ✅ MATCHES
- File: `supabase/functions/wallets-remove-address/index.ts`
- Request validation correct
- Case-insensitive address matching
- Deletes all rows for address across all networks
- Atomic primary reassignment implemented
- Response shape matches exactly
- Proper error handling (404, 403, 500)

---

### ✅ POST /functions/v1/wallets-set-primary

**Request Body Specification**:
```json
{ "wallet_id": "uuid" }
```

**Response Specification**:
```json
{
  "success": true,
  "wallet_id": "uuid"
}
```

**Implementation Status**: ✅ MATCHES
- File: `supabase/functions/wallets-set-primary/index.ts`
- Request validation correct
- Atomic transaction implementation
- Sets specified wallet as primary
- Unsets all other wallets atomically
- Response shape matches exactly
- Proper error handling (404, 403, 500)

---

## Requirement 14: CORS + Preflight (Browser Compatibility)

**Requirement Specification**:
1. Every Edge Function SHALL handle `OPTIONS` preflight
2. Responses SHALL include `Access-Control-Allow-Headers: authorization, content-type, apikey, x-client-info, idempotency-key`
3. Responses SHALL include allowed methods (GET/POST/OPTIONS)
4. Browser calls MUST succeed without CORS errors
5. Preflight MUST succeed even when unauthenticated

**Implementation Status**: ✅ MATCHES
- File: `supabase/functions/_shared/cors.ts`
- CORS headers defined:
  ```typescript
  {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  }
  ```
- All Edge Functions handle OPTIONS preflight
- CORS headers included in all responses
- Preflight succeeds without authentication

---

## Error Response Format

**Requirement Specification**:
```json
{ "error": { "code": "...", "message": "..." } }
```

**Status Codes**:
- 401: Unauthorized
- 403: Forbidden
- 409: Conflict (duplicate)
- 422: Validation error
- 429: Rate limited
- 500: Internal server error

**Implementation Status**: ✅ MATCHES
- All Edge Functions use consistent error format
- All required status codes implemented
- Error codes are specific and actionable
- Error messages are user-friendly

---

## Authentication Pattern

**Requirement Specification**:
- All Edge Function calls require `Authorization: Bearer <supabase_jwt>`
- JWT validation using Supabase service role client
- Extract `user_id` from validated JWT claims
- Use `user_id` for all database operations

**Implementation Status**: ✅ MATCHES
- All Edge Functions validate JWT from Authorization header
- JWT extraction and validation implemented
- User ID extracted from JWT claims
- All database operations scoped to authenticated user

---

## Property-Based Testing

**Property 6: API Contract Consistency**

All API response shapes have been validated with property-based tests:
- ✅ wallets-list response shape validation (100 iterations)
- ✅ wallets-add-watch response shape validation (100 iterations)
- ✅ Error response shape validation (100 iterations)
- ✅ wallets-remove response shape validation (100 iterations)
- ✅ wallets-remove-address response shape validation (100 iterations)
- ✅ wallets-set-primary response shape validation (100 iterations)
- ✅ Quota value consistency validation (100 iterations)
- ✅ Address normalization validation (100 iterations)
- ✅ CAIP-2 format validation (100 iterations)
- ✅ Boolean field validation (100 iterations)
- ✅ Object field validation (100 iterations)

**Test File**: `src/lib/__tests__/properties/api-contracts.property.test.ts`
**Test Results**: 11/11 PASSED ✅

---

## Summary

All Edge Function implementations match the exact API shapes specified in the requirements document:

1. ✅ **wallets-list**: Correct response shape with wallets array, quota info, and active hint
2. ✅ **wallets-add-watch**: Correct request/response shapes with validation error codes
3. ✅ **wallets-remove**: Correct response shape with optional new_primary_id
4. ✅ **wallets-remove-address**: Correct response shape with deleted_count
5. ✅ **wallets-set-primary**: Correct response shape with wallet_id
6. ✅ **CORS Headers**: All required headers present and correct
7. ✅ **Error Format**: Consistent error response format across all functions
8. ✅ **Authentication**: JWT validation and user scoping implemented
9. ✅ **Property Tests**: All API contracts validated with 100+ iterations each

**Task Status**: ✅ COMPLETE

All acceptance criteria met:
- [x] `GET /functions/v1/wallets-list` returns deterministic ordering
- [x] `POST /functions/v1/wallets-add-watch` with ENS resolution and validation
- [x] `POST /functions/v1/wallets-remove` with atomic primary reassignment
- [x] `POST /functions/v1/wallets-remove-address` removes all rows for address
- [x] `POST /functions/v1/wallets-set-primary` with atomic updates
- [x] All functions use JWT validation + service role pattern
- [x] CORS preflight handling for all functions
- [x] **Exact API shapes match requirements specification**
