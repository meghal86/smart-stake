/**
 * API Versioning and Client Guards
 * 
 * Implements version checking to ensure clients are compatible with the API.
 * Supports gradual rollouts and deprecation timelines.
 * 
 * Requirements:
 * - 1.11: API versioning with X-API-Version header
 * - 12a: Client version guards with X-Client-Version header
 */

import { NextRequest } from 'next/server';

/**
 * Current API version (semver)
 */
export const CURRENT_API_VERSION = '1.0.0';

/**
 * Minimum supported client version (semver)
 * Clients below this version will receive 412 PRECONDITION FAILED
 */
export const MIN_CLIENT_VERSION = '1.0.0';

/**
 * Version deprecation timeline
 * Documents when versions will be deprecated and removed
 */
export const VERSION_DEPRECATION_TIMELINE = {
  '1.0.0': {
    introduced: '2025-01-01',
    deprecated: null, // Current version, not deprecated
    sunset: null,
  },
  // Future versions will be added here
  // '1.1.0': {
  //   introduced: '2025-03-01',
  //   deprecated: null,
  //   sunset: null,
  // },
  // '0.9.0': {
  //   introduced: '2024-11-01',
  //   deprecated: '2025-01-01',
  //   sunset: '2025-03-01',
  // },
} as const;

/**
 * Version policy documentation
 */
export const VERSION_POLICY = {
  description: 'AlphaWhale Hunter API follows semantic versioning (semver)',
  rules: [
    'MAJOR version: Breaking changes that require client updates',
    'MINOR version: New features, backward compatible',
    'PATCH version: Bug fixes, backward compatible',
  ],
  deprecationProcess: [
    '1. New version announced with migration guide',
    '2. Old version marked deprecated (3 months notice)',
    '3. Old version sunset and removed (6 months total)',
  ],
  headers: {
    'X-API-Version': 'Current API version (always included in responses)',
    'X-Client-Version': 'Client version (required in production, optional in dev)',
  },
} as const;

/**
 * Parse semver string into comparable parts
 */
export function parseSemver(version: string): { major: number; minor: number; patch: number } | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Compare two semver versions
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareSemver(a: string, b: string): number {
  const aParsed = parseSemver(a);
  const bParsed = parseSemver(b);
  
  if (!aParsed || !bParsed) {
    throw new Error('Invalid semver format');
  }
  
  if (aParsed.major !== bParsed.major) {
    return aParsed.major < bParsed.major ? -1 : 1;
  }
  
  if (aParsed.minor !== bParsed.minor) {
    return aParsed.minor < bParsed.minor ? -1 : 1;
  }
  
  if (aParsed.patch !== bParsed.patch) {
    return aParsed.patch < bParsed.patch ? -1 : 1;
  }
  
  return 0;
}

/**
 * Check if a version is supported
 */
export function isVersionSupported(clientVersion: string): boolean {
  try {
    return compareSemver(clientVersion, MIN_CLIENT_VERSION) >= 0;
  } catch {
    return false;
  }
}

/**
 * Version check error
 */
export class VersionError extends Error {
  constructor(
    message: string,
    public clientVersion: string,
    public minVersion: string,
    public currentVersion: string
  ) {
    super(message);
    this.name = 'VersionError';
  }
}

/**
 * Extract and validate client version from request
 * 
 * @param req - Next.js request object
 * @param options - Configuration options
 * @returns Client version string or null if not provided
 * @throws VersionError if version is too old
 */
export function checkClientVersion(
  req: NextRequest,
  options: {
    required?: boolean;
    allowQueryOverride?: boolean;
  } = {}
): string | null {
  const { required = false, allowQueryOverride = true } = options;
  
  // Check for query parameter override (for canary clients)
  let clientVersion: string | null = null;
  
  if (allowQueryOverride) {
    const { searchParams } = new URL(req.url);
    const queryVersion = searchParams.get('client_version');
    if (queryVersion) {
      clientVersion = queryVersion;
    }
  }
  
  // Check X-Client-Version header
  if (!clientVersion) {
    clientVersion = req.headers.get('x-client-version');
  }
  
  // If no version provided
  if (!clientVersion) {
    if (required) {
      throw new VersionError(
        'Client version required. Please update your client.',
        'unknown',
        MIN_CLIENT_VERSION,
        CURRENT_API_VERSION
      );
    }
    return null;
  }
  
  // Validate version format
  if (!parseSemver(clientVersion)) {
    throw new VersionError(
      'Invalid client version format. Expected semver (e.g., 1.0.0)',
      clientVersion,
      MIN_CLIENT_VERSION,
      CURRENT_API_VERSION
    );
  }
  
  // Check if version is supported
  if (!isVersionSupported(clientVersion)) {
    throw new VersionError(
      `Client version ${clientVersion} is no longer supported. Minimum version: ${MIN_CLIENT_VERSION}. Please update your client.`,
      clientVersion,
      MIN_CLIENT_VERSION,
      CURRENT_API_VERSION
    );
  }
  
  return clientVersion;
}

/**
 * Get API version from query parameter override
 * Allows canary clients to test new API versions
 */
export function getApiVersionOverride(req: NextRequest): string | null {
  const { searchParams } = new URL(req.url);
  const apiVersion = searchParams.get('api_version');
  
  if (apiVersion && parseSemver(apiVersion)) {
    return apiVersion;
  }
  
  return null;
}

/**
 * Get the effective API version for the request
 * Considers query parameter overrides for canary testing
 */
export function getEffectiveApiVersion(req: NextRequest): string {
  return getApiVersionOverride(req) || CURRENT_API_VERSION;
}

/**
 * Check if environment requires version enforcement
 * In development, version checks are more lenient
 */
export function shouldEnforceVersion(): boolean {
  return process.env.NODE_ENV === 'production';
}
