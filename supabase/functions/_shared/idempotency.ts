/**
 * Idempotency Middleware for Edge Functions
 * 
 * Implements idempotency using Upstash Redis with 60-second TTL.
 * Prevents duplicate operations from double-clicks or network retries.
 * 
 * Requirements:
 * - Accept Idempotency-Key header (UUID format)
 * - Cache responses for 60 seconds
 * - Return cached response if same key received within TTL
 * - Database constraints prevent duplicates after TTL expiration
 * 
 * Usage:
 * const idempotencyKey = req.headers.get('idempotency-key');
 * const cached = await getIdempotencyCache(userId, functionName, idempotencyKey);
 * if (cached) return cached;
 * 
 * // ... perform operation ...
 * 
 * await setIdempotencyCache(userId, functionName, idempotencyKey, response, 60);
 */

const UPSTASH_REDIS_REST_URL = Deno.env.get('UPSTASH_REDIS_REST_URL');
const UPSTASH_REDIS_REST_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

const IDEMPOTENCY_TTL_SECONDS = 60;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate idempotency key format (UUID v4)
 */
export function validateIdempotencyKey(key: string | null): boolean {
  if (!key) return false;
  return UUID_PATTERN.test(key);
}

/**
 * Execute a Redis command via Upstash REST API
 */
async function redisCommand(command: string[]): Promise<any> {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    console.warn('Upstash Redis not configured, idempotency disabled');
    return null;
  }

  try {
    const response = await fetch(UPSTASH_REDIS_REST_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      console.error(`Redis command failed: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Redis command error:', error);
    return null;
  }
}

/**
 * Get cached response for an idempotency key
 * 
 * @param userId - User ID
 * @param functionName - Name of the Edge Function (e.g., 'wallets-add-watch')
 * @param idempotencyKey - Idempotency key from request header
 * @returns Cached response object or null if not found
 */
export async function getIdempotencyCache(
  userId: string,
  functionName: string,
  idempotencyKey: string | null
): Promise<any> {
  if (!idempotencyKey || !validateIdempotencyKey(idempotencyKey)) {
    return null;
  }

  const cacheKey = `idempotency:${userId}:${functionName}:${idempotencyKey}`;

  try {
    const cached = await redisCommand(['GET', cacheKey]);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Failed to retrieve idempotency cache:', error);
  }

  return null;
}

/**
 * Set cached response for an idempotency key
 * 
 * @param userId - User ID
 * @param functionName - Name of the Edge Function (e.g., 'wallets-add-watch')
 * @param idempotencyKey - Idempotency key from request header
 * @param response - Response object to cache
 * @param ttlSeconds - Time to live in seconds (default: 60)
 */
export async function setIdempotencyCache(
  userId: string,
  functionName: string,
  idempotencyKey: string | null,
  response: any,
  ttlSeconds: number = IDEMPOTENCY_TTL_SECONDS
): Promise<void> {
  if (!idempotencyKey || !validateIdempotencyKey(idempotencyKey)) {
    return;
  }

  const cacheKey = `idempotency:${userId}:${functionName}:${idempotencyKey}`;

  try {
    const serialized = JSON.stringify(response);
    await redisCommand(['SETEX', cacheKey, ttlSeconds.toString(), serialized]);
  } catch (error) {
    console.error('Failed to set idempotency cache:', error);
  }
}

/**
 * Create an idempotency error response (400 Bad Request)
 */
export function createIdempotencyErrorResponse(message: string): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: 'INVALID_IDEMPOTENCY_KEY',
        message: message,
      },
    }),
    {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Middleware to handle idempotency for a request
 * 
 * Usage:
 * const idempotencyResult = await handleIdempotency(
 *   req,
 *   userId,
 *   'wallets-add-watch'
 * );
 * 
 * if (idempotencyResult.cached) {
 *   return idempotencyResult.response;
 * }
 * 
 * // ... perform operation ...
 * 
 * await idempotencyResult.setCacheResponse(operationResponse);
 */
export async function handleIdempotency(
  req: Request,
  userId: string,
  functionName: string
): Promise<{
  cached: boolean;
  response?: Response;
  idempotencyKey: string | null;
  setCacheResponse: (response: any) => Promise<void>;
}> {
  const idempotencyKey = req.headers.get('idempotency-key');

  // If no idempotency key provided, proceed without caching
  if (!idempotencyKey) {
    return {
      cached: false,
      idempotencyKey: null,
      setCacheResponse: async () => {},
    };
  }

  // Validate idempotency key format
  if (!validateIdempotencyKey(idempotencyKey)) {
    return {
      cached: false,
      response: createIdempotencyErrorResponse(
        'Idempotency-Key must be a valid UUID (e.g., 550e8400-e29b-41d4-a716-446655440000)'
      ),
      idempotencyKey: null,
      setCacheResponse: async () => {},
    };
  }

  // Check for cached response
  const cachedResponse = await getIdempotencyCache(userId, functionName, idempotencyKey);
  if (cachedResponse) {
    return {
      cached: true,
      response: new Response(JSON.stringify(cachedResponse), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Cached': 'true',
        },
      }),
      idempotencyKey,
      setCacheResponse: async () => {},
    };
  }

  // No cached response, proceed with operation
  return {
    cached: false,
    idempotencyKey,
    setCacheResponse: async (response: any) => {
      await setIdempotencyCache(userId, functionName, idempotencyKey, response);
    },
  };
}
