/**
 * Image Proxy API Endpoint
 * 
 * Provides SSRF-safe image proxying with validation, optimization, and EXIF stripping.
 * 
 * Query Parameters:
 * - src: Source image URL (required, must be absolute HTTP/HTTPS)
 * - w: Width in pixels (optional, max 3840)
 * - h: Height in pixels (optional, max 2160)
 * - fit: Resize fit mode (optional, default: cover)
 * - format: Output format (optional, default: webp)
 * 
 * Security Features:
 * - Blocks localhost and private IPs (RFC1918, link-local)
 * - Blocks authentication in URLs (@ character)
 * - Blocks path traversal (..)
 * - Hostname allowlist enforcement
 * - 5MB file size limit
 * - EXIF data stripping
 * 
 * Example:
 * /api/img?src=https://assets.coingecko.com/logo.png&w=256&h=256&format=webp
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { ImageProxyQuerySchema, proxyImage, ImageProxyError } from '@/lib/image-proxy';

export const config = {
  api: {
    responseLimit: '10mb', // Allow larger responses for images
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET requests are allowed',
      },
    });
  }

  try {
    // Validate query parameters
    const query = ImageProxyQuerySchema.parse(req.query);

    // Proxy and process image
    const { buffer, contentType, cacheControl } = await proxyImage(query);

    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', cacheControl);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    // Send image buffer
    return res.status(200).send(buffer);
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: {
          code: 'INVALID_QUERY',
          message: 'Invalid query parameters',
          details: error.errors,
        },
      });
    }

    // Handle image proxy errors
    if (error instanceof ImageProxyError) {
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    // Handle unexpected errors
    console.error('Image proxy error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
}
