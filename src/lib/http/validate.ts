/**
 * HTTP validation utilities using Zod
 */
import { z } from 'zod';

export interface ValidationError {
  code: string;
  message: string;
  path?: string[];
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ValidationError[];
  };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: ValidationError[]
): ApiError {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data: T): ApiSuccess<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Validate input with Zod schema
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  const result = schema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: ValidationError[] = result.error.errors.map((err) => ({
    code: err.code,
    message: err.message,
    path: err.path.map(String),
  }));

  return { success: false, errors };
}

/**
 * Common validation schemas
 */
export const schemas = {
  ethereumAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),

  chainName: z
    .string()
    .min(1)
    .refine(
      (val) =>
        ['ethereum', 'base', 'arbitrum', 'polygon', 'optimism'].includes(
          val.toLowerCase()
        ),
      'Invalid chain name'
    ),

  scanWalletRequest: z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
    chain: z.string().min(1),
  }),

  revokeApprovalRequest: z.object({
    token: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid token address'),
    spender: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid spender address'),
    user: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid user address'),
    chain: z.string().min(1),
  }),
};

/**
 * Error codes
 */
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;

/**
 * HTTP status codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

