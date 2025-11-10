/**
 * Unit tests for /api/img endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/img';

// Mock the image-proxy module
vi.mock('@/lib/image-proxy', () => ({
  ImageProxyQuerySchema: {
    parse: vi.fn((query) => {
      if (!query.src) throw new Error('src is required');
      return {
        src: query.src,
        w: query.w,
        h: query.h,
        fit: query.fit || 'cover',
        format: query.format || 'webp',
      };
    }),
  },
  proxyImage: vi.fn(async () => ({
    buffer: Buffer.from('fake-image-data'),
    contentType: 'image/webp',
    cacheControl: 'public, max-age=31536000, immutable',
  })),
  ImageProxyError: class ImageProxyError extends Error {
    constructor(message: string, public statusCode: number, public code: string) {
      super(message);
      this.name = 'ImageProxyError';
    }
  },
}));

describe('/api/img', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 405 for non-GET requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET requests are allowed',
      },
    });
  });

  it('should proxy image successfully', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        src: 'https://cdn.alphawhale.com/logo.png',
        w: '256',
        h: '256',
        format: 'webp',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getHeaders()['content-type']).toBe('image/webp');
    expect(res._getHeaders()['cache-control']).toBe('public, max-age=31536000, immutable');
    expect(res._getHeaders()['x-content-type-options']).toBe('nosniff');
    expect(res._getHeaders()['x-frame-options']).toBe('DENY');
  });

  it('should return 400 for invalid query parameters', async () => {
    const { ImageProxyQuerySchema } = await import('@/lib/image-proxy');
    (ImageProxyQuerySchema.parse as any).mockImplementationOnce(() => {
      const error = new Error('Validation failed');
      error.name = 'ZodError';
      (error as any).errors = [{ message: 'Invalid src' }];
      throw error;
    });

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        src: 'invalid-url',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toMatchObject({
      error: {
        code: 'INVALID_QUERY',
        message: 'Invalid query parameters',
      },
    });
  });

  it('should handle ImageProxyError', async () => {
    const { proxyImage, ImageProxyError } = await import('@/lib/image-proxy');
    (proxyImage as any).mockRejectedValueOnce(
      new ImageProxyError('Blocked hostname', 403, 'BLOCKED_HOSTNAME')
    );

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        src: 'https://evil.com/malicious.png',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(403);
    expect(JSON.parse(res._getData())).toEqual({
      error: {
        code: 'BLOCKED_HOSTNAME',
        message: 'Blocked hostname',
      },
    });
  });

  it('should handle unexpected errors', async () => {
    const { proxyImage } = await import('@/lib/image-proxy');
    (proxyImage as any).mockRejectedValueOnce(new Error('Unexpected error'));

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        src: 'https://cdn.alphawhale.com/logo.png',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  });
});
