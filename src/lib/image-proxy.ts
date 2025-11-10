/**
 * Image Proxy Library
 * 
 * Provides SSRF-safe image proxying with validation, optimization, and EXIF stripping.
 * Implements security requirements from Hunter Screen spec (Requirements 11.1, 11.11).
 */

import sharp from 'sharp';
import { z } from 'zod';

// Maximum dimensions (4K resolution)
const MAX_WIDTH = 3840;
const MAX_HEIGHT = 2160;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Allowed hostnames for image sources
const ALLOWED_HOSTNAMES = [
  'cdn.alphawhale.com',
  'images.alphawhale.com',
  'assets.alphawhale.com',
  // DeFi protocol CDNs
  'assets.coingecko.com',
  'raw.githubusercontent.com',
  'ipfs.io',
  'cloudflare-ipfs.com',
  // Trusted CDNs
  'cdn.jsdelivr.net',
  'unpkg.com',
];

// RFC1918 private IP ranges
const PRIVATE_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^127\./,
  /^169\.254\./, // Link-local
  /^::1$/, // IPv6 localhost
  /^fe80:/i, // IPv6 link-local
  /^fc00:/i, // IPv6 unique local
  /^fd00:/i, // IPv6 unique local
];

export const ImageProxyQuerySchema = z.object({
  src: z.string().url(),
  w: z.coerce.number().int().positive().max(MAX_WIDTH).optional(),
  h: z.coerce.number().int().positive().max(MAX_HEIGHT).optional(),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).default('cover'),
  format: z.enum(['webp', 'png', 'jpeg']).default('webp'),
});

export type ImageProxyQuery = z.infer<typeof ImageProxyQuerySchema>;

export class ImageProxyError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code: string = 'INVALID_REQUEST'
  ) {
    super(message);
    this.name = 'ImageProxyError';
  }
}

/**
 * Validates that a URL is safe to fetch (no SSRF vulnerabilities)
 */
export function validateImageUrl(url: string): void {
  let parsedUrl: URL;
  
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new ImageProxyError('Invalid URL format', 400, 'INVALID_URL');
  }

  // Must be absolute URL with http/https
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new ImageProxyError('Only HTTP/HTTPS URLs are allowed', 400, 'INVALID_PROTOCOL');
  }

  // Block localhost
  if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '0.0.0.0') {
    throw new ImageProxyError('Localhost URLs are not allowed', 403, 'BLOCKED_HOSTNAME');
  }

  // Block private IP ranges (RFC1918, link-local, etc.)
  const hostname = parsedUrl.hostname;
  for (const pattern of PRIVATE_IP_RANGES) {
    if (pattern.test(hostname)) {
      throw new ImageProxyError('Private IP addresses are not allowed', 403, 'BLOCKED_IP');
    }
  }

  // Check for SSRF via @ in URL (authentication bypass attempts)
  if (url.includes('@')) {
    throw new ImageProxyError('URLs with authentication are not allowed', 403, 'BLOCKED_AUTH');
  }

  // Check for path traversal attempts (both in original URL and decoded pathname)
  if (url.includes('..') || parsedUrl.pathname.includes('..')) {
    throw new ImageProxyError('Path traversal is not allowed', 403, 'BLOCKED_TRAVERSAL');
  }

  // Validate against allowlist
  const isAllowed = ALLOWED_HOSTNAMES.some(allowed => {
    // Support wildcard subdomains (e.g., *.alphawhale.com)
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      return hostname === domain || hostname.endsWith('.' + domain);
    }
    return hostname === allowed;
  });

  if (!isAllowed) {
    throw new ImageProxyError(
      `Hostname ${hostname} is not in the allowlist`,
      403,
      'BLOCKED_HOSTNAME'
    );
  }
}

/**
 * Fetches an image from a URL with size limits
 */
export async function fetchImage(url: string): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AlphaWhale-ImageProxy/1.0',
      },
    });

    if (!response.ok) {
      throw new ImageProxyError(
        `Failed to fetch image: ${response.status} ${response.statusText}`,
        response.status,
        'FETCH_FAILED'
      );
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      throw new ImageProxyError(
        'URL does not point to an image',
        400,
        'INVALID_CONTENT_TYPE'
      );
    }

    // Check content length
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      throw new ImageProxyError(
        `Image size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
        413,
        'FILE_TOO_LARGE'
      );
    }

    // Read response with size limit
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
      throw new ImageProxyError(
        `Image size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
        413,
        'FILE_TOO_LARGE'
      );
    }

    return Buffer.from(arrayBuffer);
  } catch (error) {
    if (error instanceof ImageProxyError) {
      throw error;
    }
    if (error.name === 'AbortError') {
      throw new ImageProxyError('Request timeout', 504, 'TIMEOUT');
    }
    throw new ImageProxyError(
      `Failed to fetch image: ${error.message}`,
      500,
      'FETCH_ERROR'
    );
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Processes an image: strips EXIF, resizes, and optimizes
 */
export async function processImage(
  buffer: Buffer,
  options: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    format?: 'webp' | 'png' | 'jpeg';
  }
): Promise<{ buffer: Buffer; contentType: string }> {
  try {
    let pipeline = sharp(buffer, {
      failOnError: false,
      limitInputPixels: MAX_WIDTH * MAX_HEIGHT * 4, // Prevent decompression bombs
    });

    // Strip all metadata (including EXIF)
    pipeline = pipeline.rotate(); // Auto-rotate based on EXIF, then strip
    pipeline = pipeline.withMetadata({
      exif: {}, // Remove EXIF
      icc: undefined, // Remove ICC profile
      iptc: undefined, // Remove IPTC
      xmp: undefined, // Remove XMP
    });

    // Resize if dimensions provided
    if (options.width || options.height) {
      pipeline = pipeline.resize({
        width: options.width,
        height: options.height,
        fit: options.fit || 'cover',
        withoutEnlargement: true, // Don't upscale
      });
    }

    // Convert to target format
    const format = options.format || 'webp';
    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ quality: 85, effort: 4 });
        break;
      case 'png':
        pipeline = pipeline.png({ compressionLevel: 8, effort: 7 });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality: 85, progressive: true });
        break;
    }

    const outputBuffer = await pipeline.toBuffer();

    const contentType = `image/${format}`;
    return { buffer: outputBuffer, contentType };
  } catch (error) {
    throw new ImageProxyError(
      `Failed to process image: ${error.message}`,
      500,
      'PROCESSING_ERROR'
    );
  }
}

/**
 * Main image proxy handler
 */
export async function proxyImage(query: ImageProxyQuery): Promise<{
  buffer: Buffer;
  contentType: string;
  cacheControl: string;
}> {
  // Validate URL
  validateImageUrl(query.src);

  // Fetch image
  const imageBuffer = await fetchImage(query.src);

  // Process image
  const { buffer, contentType } = await processImage(imageBuffer, {
    width: query.w,
    height: query.h,
    fit: query.fit,
    format: query.format,
  });

  return {
    buffer,
    contentType,
    cacheControl: 'public, max-age=31536000, immutable', // Cache for 1 year
  };
}
