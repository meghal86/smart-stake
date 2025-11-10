# API Versioning Quick Start

## For API Developers

### Add versioning to your endpoint:

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
    // 1. Check client version
    checkClientVersion(req, {
      required: shouldEnforceVersion(), // Required in production
      allowQueryOverride: true,
    });

    // 2. Get API version (supports canary testing)
    const apiVersion = getEffectiveApiVersion(req);

    // 3. Your API logic here
    const data = { /* ... */ };

    // 4. Return response with version header
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
          status: 412,
          headers: { 'X-API-Version': getEffectiveApiVersion(req) },
        }
      );
    }
    throw error;
  }
}
```

## For Client Developers

### Production requests:

```typescript
fetch('/api/hunter/opportunities', {
  headers: {
    'X-Client-Version': '1.0.0', // Required in production
  },
});
```

### Testing with query parameters:

```typescript
// Test with specific client version
fetch('/api/hunter/opportunities?client_version=1.2.0');

// Test with specific API version (canary)
fetch('/api/hunter/opportunities?api_version=1.1.0&client_version=1.0.0');
```

### Handle version errors:

```typescript
const response = await fetch('/api/hunter/opportunities', {
  headers: { 'X-Client-Version': '1.0.0' },
});

if (response.status === 412) {
  const error = await response.json();
  // Prompt user to update
  showUpdatePrompt(error.error.details);
}
```

## Current Versions

- **API Version**: `1.0.0`
- **Min Client Version**: `1.0.0`

## Version Policy

- **MAJOR**: Breaking changes (requires client update)
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Deprecation Timeline

1. Announcement with migration guide
2. Deprecation (3 months notice)
3. Sunset (6 months total)

## Testing

```bash
# Run all versioning tests
npm test -- src/__tests__/lib/api-version.test.ts --run
npm test -- src/__tests__/api/hunter-opportunities-versioning.test.ts --run
```

## Full Documentation

See `src/lib/api-version.README.md` for complete documentation.
