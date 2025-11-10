/**
 * Unit tests for image proxy library
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateImageUrl,
  fetchImage,
  processImage,
  proxyImage,
  ImageProxyError,
  ImageProxyQuerySchema,
} from '@/lib/image-proxy';

describe('ImageProxyQuerySchema', () => {
  it('should validate valid query parameters', () => {
    const result = ImageProxyQuerySchema.parse({
      src: 'https://cdn.alphawhale.com/logo.png',
      w: 256,
      h: 256,
      fit: 'cover',
      format: 'webp',
    });

    expect(result).toEqual({
      src: 'https://cdn.alphawhale.com/logo.png',
      w: 256,
      h: 256,
      fit: 'cover',
      format: 'webp',
    });
  });

  it('should apply defaults for optional parameters', () => {
    const result = ImageProxyQuerySchema.parse({
      src: 'https://cdn.alphawhale.com/logo.png',
    });

    expect(result.fit).toBe('cover');
    expect(result.format).toBe('webp');
  });

  it('should reject invalid URLs', () => {
    expect(() => {
      ImageProxyQuerySchema.parse({ src: 'not-a-url' });
    }).toThrow();
  });

  it('should reject dimensions exceeding max', () => {
    expect(() => {
      ImageProxyQuerySchema.parse({
        src: 'https://cdn.alphawhale.com/logo.png',
        w: 5000,
      });
    }).toThrow();
  });

  it('should reject invalid fit values', () => {
    expect(() => {
      ImageProxyQuerySchema.parse({
        src: 'https://cdn.alphawhale.com/logo.png',
        fit: 'invalid',
      });
    }).toThrow();
  });

  it('should reject invalid format values', () => {
    expect(() => {
      ImageProxyQuerySchema.parse({
        src: 'https://cdn.alphawhale.com/logo.png',
        format: 'gif',
      });
    }).toThrow();
  });
});

describe('validateImageUrl', () => {
  it('should accept valid URLs from allowlist', () => {
    expect(() => {
      validateImageUrl('https://cdn.alphawhale.com/logo.png');
    }).not.toThrow();

    expect(() => {
      validateImageUrl('https://assets.coingecko.com/coins/images/1/large/bitcoin.png');
    }).not.toThrow();
  });

  it('should reject non-HTTP/HTTPS protocols', () => {
    expect(() => {
      validateImageUrl('ftp://cdn.alphawhale.com/logo.png');
    }).toThrow(ImageProxyError);

    expect(() => {
      validateImageUrl('file:///etc/passwd');
    }).toThrow(ImageProxyError);
  });

  it('should reject localhost', () => {
    expect(() => {
      validateImageUrl('http://localhost:3000/image.png');
    }).toThrow(ImageProxyError);

    expect(() => {
      validateImageUrl('http://0.0.0.0/image.png');
    }).toThrow(ImageProxyError);
  });

  it('should reject RFC1918 private IPs', () => {
    // 10.0.0.0/8
    expect(() => {
      validateImageUrl('http://10.0.0.1/image.png');
    }).toThrow(ImageProxyError);

    // 172.16.0.0/12
    expect(() => {
      validateImageUrl('http://172.16.0.1/image.png');
    }).toThrow(ImageProxyError);

    expect(() => {
      validateImageUrl('http://172.31.255.255/image.png');
    }).toThrow(ImageProxyError);

    // 192.168.0.0/16
    expect(() => {
      validateImageUrl('http://192.168.1.1/image.png');
    }).toThrow(ImageProxyError);
  });

  it('should reject link-local addresses', () => {
    // IPv4 link-local
    expect(() => {
      validateImageUrl('http://169.254.1.1/image.png');
    }).toThrow(ImageProxyError);

    // IPv6 link-local
    expect(() => {
      validateImageUrl('http://[fe80::1]/image.png');
    }).toThrow(ImageProxyError);
  });

  it('should reject IPv6 localhost and unique local', () => {
    expect(() => {
      validateImageUrl('http://[::1]/image.png');
    }).toThrow(ImageProxyError);

    expect(() => {
      validateImageUrl('http://[fc00::1]/image.png');
    }).toThrow(ImageProxyError);

    expect(() => {
      validateImageUrl('http://[fd00::1]/image.png');
    }).toThrow(ImageProxyError);
  });

  it('should reject URLs with authentication', () => {
    expect(() => {
      validateImageUrl('https://user:pass@cdn.alphawhale.com/logo.png');
    }).toThrow(ImageProxyError);

    expect(() => {
      validateImageUrl('https://admin@cdn.alphawhale.com/logo.png');
    }).toThrow(ImageProxyError);
  });

  it('should reject path traversal attempts', () => {
    expect(() => {
      validateImageUrl('https://cdn.alphawhale.com/../../../etc/passwd');
    }).toThrow(ImageProxyError);

    expect(() => {
      validateImageUrl('https://cdn.alphawhale.com/images/../../secrets.txt');
    }).toThrow(ImageProxyError);
  });

  it('should reject hostnames not in allowlist', () => {
    expect(() => {
      validateImageUrl('https://evil.com/malicious.png');
    }).toThrow(ImageProxyError);

    expect(() => {
      validateImageUrl('https://attacker.net/phishing.jpg');
    }).toThrow(ImageProxyError);
  });

  it('should reject invalid URL format', () => {
    expect(() => {
      validateImageUrl('not a url');
    }).toThrow(ImageProxyError);

    expect(() => {
      validateImageUrl('');
    }).toThrow(ImageProxyError);
  });
});

describe('fetchImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch image successfully', async () => {
    const mockBuffer = Buffer.from('fake-image-data');
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => {
          if (name === 'content-type') return 'image/png';
          if (name === 'content-length') return '1024';
          return null;
        },
      },
      arrayBuffer: async () => mockBuffer.buffer,
    });

    const result = await fetchImage('https://cdn.alphawhale.com/logo.png');
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should reject non-image content types', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => {
          if (name === 'content-type') return 'text/html';
          return null;
        },
      },
    });

    await expect(
      fetchImage('https://cdn.alphawhale.com/page.html')
    ).rejects.toThrow(ImageProxyError);
  });

  it('should reject files exceeding size limit', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => {
          if (name === 'content-type') return 'image/png';
          if (name === 'content-length') return String(10 * 1024 * 1024); // 10MB
          return null;
        },
      },
    });

    await expect(
      fetchImage('https://cdn.alphawhale.com/huge.png')
    ).rejects.toThrow(ImageProxyError);
  });

  it('should handle fetch errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(
      fetchImage('https://cdn.alphawhale.com/missing.png')
    ).rejects.toThrow(ImageProxyError);
  });

  it('should handle network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(
      fetchImage('https://cdn.alphawhale.com/logo.png')
    ).rejects.toThrow(ImageProxyError);
  });
});

describe('processImage', () => {
  // Note: These tests require sharp to be installed and working
  // In a real environment, you'd use actual image buffers
  
  it('should process image with default options', async () => {
    // Create a minimal valid PNG buffer (1x1 transparent pixel)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
      0x42, 0x60, 0x82,
    ]);

    const result = await processImage(pngBuffer, {
      format: 'webp',
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.contentType).toBe('image/webp');
  });

  it('should resize image when dimensions provided', async () => {
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
      0x42, 0x60, 0x82,
    ]);

    const result = await processImage(pngBuffer, {
      width: 256,
      height: 256,
      fit: 'cover',
      format: 'png',
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.contentType).toBe('image/png');
  });

  it('should handle invalid image data', async () => {
    const invalidBuffer = Buffer.from('not an image');

    await expect(
      processImage(invalidBuffer, { format: 'webp' })
    ).rejects.toThrow(ImageProxyError);
  });
});

describe('ImageProxyError', () => {
  it('should create error with default values', () => {
    const error = new ImageProxyError('Test error');
    
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('INVALID_REQUEST');
    expect(error.name).toBe('ImageProxyError');
  });

  it('should create error with custom values', () => {
    const error = new ImageProxyError('Custom error', 403, 'BLOCKED');
    
    expect(error.message).toBe('Custom error');
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('BLOCKED');
  });
});
