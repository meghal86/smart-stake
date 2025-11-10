# API Versioning and Client Guards

This module implements API versioning and client version validation for the Hunter Screen API endpoints.

## Overview

The API versioning system ensures that clients are compatible with the API and provides a mechanism for gradual rollouts and deprecation of old versions.

## Features

- **Semantic Versioning**: Uses semver (MAJOR.MINOR.PATCH) for version numbers
- **Client Version Validation**: Enforces minimum client version requirements
- **Graceful Degradation**: Optional enforcement in development, strict in production
- **Canary Testing**: Query parameter overrides for testing new API versions
- **Clear Error Messages**: Detailed error responses with version information
- **Deprecation Timeline**: Documented timeline for version deprecation and sunset

## Usage

### In API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  checkClientVersion,
  getEffectiveApiVersion,
  shouldEnforceVersion,
  VersionError,
} from '@/lib/api-version';

export async function GET(req: NextRequest) {
  try {
    // Check client version
    checkClientVersion(req, {
      required: shouldEnforceVersion(), // Required in production
      allowQueryOverride: true, // Allow ?client_version=X.Y.Z
    });

    // Get effective API version (supports canary testing)
    const apiVersion = getEffectiveApiVersion(req);

    // ... your API logic ...

    // Include version in response
    const response = NextResponse.json(data);
    response.headers.set('X-API-Version', apiVersion);
    return response;

  } catch (error) {
    if (error instanceof VersionError) {
      return NextResponse.json(
        {
          error: {
            code: 'VERSION_UNSUPPORTED',
            message: error.message,
            details: {
              client_version: error.clientVersion,
              min_version: error.minVersion,
              current_version: error.currentVersion,
            },
          },
        },
        {
          status: 412, // Precondition Failed
          headers: {
            'X-API-Version': getEffectiveApiVersion(req),
          },
        }
      );
    }
    throw error;
  }
}
```

### Client Implementation

#### Required Headers

```typescript
// Production requests MUST include X-Client-Version
fetch('/api/hunter/opportunities', {
  headers: {
    'X-Client-Version': '1.0.0',
  },
});
```

#### Query Parameter Override (Canary Testing)

```typescript
// Test with specific client version
fetch('/api/hunter/opportunities?client_version=1.2.0');

// Test with specific API version
fetch('/api/hunter/opportunities?api_version=1.1.0&client_version=1.0.0');
```

#### Handling Version Errors

```typescript
const response = await fetch('/api/hunter/opportunities', {
  headers: {
    'X-Client-Version': '1.0.0',
  },
});

if (response.status === 412) {
  const error = await response.json();
  console.error('Client version unsupported:', error.error.details);
  
  // Prompt user to update client
  showUpdatePrompt({
    currentVersion: error.error.details.client_version,
    minVersion: error.error.details.min_version,
  });
}
```

## Version Policy

### Semantic Versioning

- **MAJOR**: Breaking changes that require client updates
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Deprecation Process

1. **Announcement**: New version announced with migration guide
2. **Deprecation**: Old version marked deprecated (3 months notice)
3. **Sunset**: Old version removed (6 months total from announcement)

### Current Versions

- **Current API Version**: `1.0.0`
- **Minimum Client Version**: `1.0.0`

## Headers

### Request Headers

- `X-Client-Version`: Client version (semver format, required in production)

### Response Headers

- `X-API-Version`: Current API version (always included)

### Query Parameters

- `client_version`: Override client version (for testing)
- `api_version`: Override API version (for canary testing)

## Error Responses

### 412 Precondition Failed

Returned when client version is unsupported.

```json
{
  "error": {
    "code": "VERSION_UNSUPPORTED",
    "message": "Client version 0.5.0 is no longer supported. Minimum version: 1.0.0. Please update your client.",
    "details": {
      "client_version": "0.5.0",
      "min_version": "1.0.0",
      "current_version": "1.0.0"
    }
  }
}
```

## Environment Behavior

### Production

- Client version **required**
- Strict version enforcement
- Old versions rejected with 412

### Development/Test

- Client version **optional**
- Lenient enforcement
- Warnings logged but requests allowed

## Version Timeline

### Version 1.0.0

- **Introduced**: 2025-01-01
- **Status**: Current
- **Deprecated**: N/A
- **Sunset**: N/A

## Testing

### Unit Tests

```bash
npm test src/__tests__/lib/api-version.test.ts
```

### Integration Tests

```bash
npm test src/__tests__/api/hunter-opportunities-versioning.test.ts
```

## Migration Guide

### Updating Minimum Version

1. Update `MIN_CLIENT_VERSION` in `src/lib/api-version.ts`
2. Add deprecation entry to `VERSION_DEPRECATION_TIMELINE`
3. Update documentation
4. Announce to clients with migration guide
5. Wait for deprecation period before enforcing

### Adding New API Version

1. Update `CURRENT_API_VERSION` in `src/lib/api-version.ts`
2. Add entry to `VERSION_DEPRECATION_TIMELINE`
3. Document breaking changes
4. Support both versions during transition period
5. Deprecate old version after transition

## Best Practices

1. **Always include X-API-Version**: Include in all responses, even errors
2. **Use query overrides for testing**: Test new versions before full rollout
3. **Provide clear error messages**: Help clients understand what went wrong
4. **Document breaking changes**: Maintain changelog for each version
5. **Gradual rollouts**: Use feature flags for gradual version rollouts
6. **Monitor version distribution**: Track client version usage in analytics

## Related Files

- `src/lib/api-version.ts` - Main implementation
- `src/__tests__/lib/api-version.test.ts` - Unit tests
- `src/__tests__/api/hunter-opportunities-versioning.test.ts` - Integration tests
- `src/app/api/hunter/opportunities/route.ts` - Example usage
- `src/types/hunter.ts` - Error code definitions

## Requirements

- **Requirement 1.11**: API versioning with X-API-Version header
- **Task 12a**: Client version guards with X-Client-Version header
