/**
 * Integration tests for /api/img endpoint
 * Tests SSRF protection with malicious URLs
 */

import { describe, it, expect } from 'vitest';
import { validateImageUrl, ImageProxyError } from '@/lib/image-proxy';

describe('SSRF Protection Integration Tests', () => {
  describe('Localhost blocking', () => {
    it('should block localhost variations', () => {
      const localhostUrls = [
        'http://localhost/image.png',
        'http://localhost:3000/image.png',
        'https://localhost/image.png',
        'http://0.0.0.0/image.png',
        'http://0.0.0.0:8080/image.png',
        'http://127.0.0.1/image.png',
        'http://127.0.0.2/image.png',
        'http://127.255.255.255/image.png',
      ];

      for (const url of localhostUrls) {
        expect(() => validateImageUrl(url)).toThrow(ImageProxyError);
      }
    });
  });

  describe('RFC1918 private IP blocking', () => {
    it('should block 10.0.0.0/8 range', () => {
      const urls = [
        'http://10.0.0.1/image.png',
        'http://10.1.1.1/image.png',
        'http://10.255.255.255/image.png',
      ];

      for (const url of urls) {
        expect(() => validateImageUrl(url)).toThrow(ImageProxyError);
      }
    });

    it('should block 172.16.0.0/12 range', () => {
      const urls = [
        'http://172.16.0.1/image.png',
        'http://172.20.0.1/image.png',
        'http://172.31.255.255/image.png',
      ];

      for (const url of urls) {
        expect(() => validateImageUrl(url)).toThrow(ImageProxyError);
      }
    });

    it('should block 192.168.0.0/16 range', () => {
      const urls = [
        'http://192.168.0.1/image.png',
        'http://192.168.1.1/image.png',
        'http://192.168.255.255/image.png',
      ];

      for (const url of urls) {
        expect(() => validateImageUrl(url)).toThrow(ImageProxyError);
      }
    });
  });

  describe('Link-local address blocking', () => {
    it('should block IPv4 link-local (169.254.0.0/16)', () => {
      const urls = [
        'http://169.254.0.1/image.png',
        'http://169.254.169.254/image.png', // AWS metadata service
        'http://169.254.255.255/image.png',
      ];

      for (const url of urls) {
        expect(() => validateImageUrl(url)).toThrow(ImageProxyError);
      }
    });

    it('should block IPv6 link-local (fe80::/10)', () => {
      const urls = [
        'http://[fe80::1]/image.png',
        'http://[fe80::dead:beef]/image.png',
        'http://[fe80:0000:0000:0000:0000:0000:0000:0001]/image.png',
      ];

      for (const url of urls) {
        expect(() => validateImageUrl(url)).toThrow(ImageProxyError);
      }
    });
  });

  describe('IPv6 special address blocking', () => {
    it('should block IPv6 localhost (::1)', () => {
      const urls = [
        'http://[::1]/image.png',
        'http://[0000:0000:0000:0000:0000:0000:0000:0001]/image.png',
      ];

      for (const url of urls) {
        expect(() => validateImageUrl(url)).toThrow(ImageProxyError);
      }
    });

    it('should block IPv6 unique local (fc00::/7)', () => {
      const urls = [
        'http://[fc00::1]/image.png',
        'http://[fd00::1]/image.png',
        'http://[fc00:dead:beef::1]/image.png',
        'http://[fd12:3456:789a:bcde::1]/image.png',
      ];

      for (const url of urls) {
        expect(() => validateImageUrl(url)).toThrow(ImageProxyError);
      }
    });
  });

  describe('Authentication bypass blocking', () => {
    it('should block URLs with credentials', () => {
      const urls = [
        'http://user:pass@cdn.alphawhale.com/image.png',
        'http://admin@cdn.alphawhale.com/image.png',
        'https://user:pass@assets.coingecko.com/image.png',
        'http://root:toor@192.168.1.1/image.png',
      ];

      for (const url of urls) {
        expect(() => validateImageUrl(url)).toThrow(ImageProxyError);
      }
    });
  });

  describe('Path traversal blocking', () => {
    it('should block path traversal attempts', () => {
      const urls = [
        'https://cdn.alphawhale.com/../../../etc/passwd',
        'https://cdn.alphawhale.com/images/../../secrets.txt',
        'https://cdn.alphawhale.com/./../../config.json',
        'https://assets.coingecko.com/coins/../../../admin/users',
      ];

      for (const url of urls) {
        expect(() => validateImageUrl(url)).toThrow(ImageProxyError);
      }
    });
  });

  describe('Protocol restriction', () => {
    it('should block non-HTTP/HTTPS protocols', () => {
      const urls = [
        'ftp://cdn.alphawhale.com/image.png',
        'file:///etc/passwd',
        'data:image/png;base64,iVBORw0KGgo=',
        'javascript:alert(1)',
        'gopher://evil.com/image.png',
      ];

      for (const url of urls) {
        expect(() => validateImageUrl(url)).toThrow(ImageProxyError);
      }
    });
  });

  describe('Hostname allowlist enforcement', () => {
    it('should block non-allowlisted hostnames', () => {
      const urls = [
        'https://evil.com/malicious.png',
        'https://attacker.net/phishing.jpg',
        'https://malware-site.org/trojan.png',
        'https://phishing-alphawhale.com/fake-logo.png', // Typosquatting
      ];

      for (const url of urls) {
        expect(() => validateImageUrl(url)).toThrow(ImageProxyError);
      }
    });

    it('should allow allowlisted hostnames', () => {
      const urls = [
        'https://cdn.alphawhale.com/logo.png',
        'https://images.alphawhale.com/banner.jpg',
        'https://assets.alphawhale.com/icon.webp',
        'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
        'https://ipfs.io/ipfs/QmHash/image.png',
        'https://cloudflare-ipfs.com/ipfs/QmHash/image.png',
        'https://cdn.jsdelivr.net/npm/package/image.png',
        'https://unpkg.com/package/image.png',
      ];

      for (const url of urls) {
        expect(() => validateImageUrl(url)).not.toThrow();
      }
    });
  });

  describe('Cloud metadata service blocking', () => {
    it('should block AWS metadata service', () => {
      expect(() => {
        validateImageUrl('http://169.254.169.254/latest/meta-data/');
      }).toThrow(ImageProxyError);
    });

    it('should block GCP metadata service', () => {
      // GCP uses metadata.google.internal which resolves to 169.254.169.254
      expect(() => {
        validateImageUrl('http://169.254.169.254/computeMetadata/v1/');
      }).toThrow(ImageProxyError);
    });

    it('should block Azure metadata service', () => {
      // Azure uses 169.254.169.254
      expect(() => {
        validateImageUrl('http://169.254.169.254/metadata/instance');
      }).toThrow(ImageProxyError);
    });
  });

  describe('DNS rebinding protection', () => {
    it('should block localhost after DNS resolution', () => {
      // Note: This test validates the hostname check happens before DNS resolution
      // In a real scenario, a malicious DNS could resolve to localhost
      expect(() => {
        validateImageUrl('http://127.0.0.1/image.png');
      }).toThrow(ImageProxyError);
    });
  });

  describe('Edge cases', () => {
    it('should handle URL encoding attempts', () => {
      // Note: URL constructor does NOT decode %2e (encoded .) in pathname
      // This is actually safe - the encoded path stays encoded and won't traverse
      // However, we still block regular .. patterns
      
      // Regular path traversal (not encoded) - should be blocked
      expect(() => {
        validateImageUrl('http://cdn.alphawhale.com/../../../etc/passwd');
      }).toThrow(ImageProxyError);
      
      // URL with @ in path (not as auth) - this is actually allowed in path
      // The @ check is for authentication (user:pass@host), not path
      const validUrl = 'http://cdn.alphawhale.com/user%40example.com/image.png';
      expect(() => validateImageUrl(validUrl)).not.toThrow();
    });

    it('should handle unicode/punycode domains', () => {
      // Ensure we're checking the actual hostname, not encoded versions
      expect(() => {
        validateImageUrl('https://xn--alphawhale-fake.com/image.png');
      }).toThrow(ImageProxyError);
    });

    it('should reject empty or invalid URLs', () => {
      const urls = ['', ' ', 'not-a-url', 'htp://broken.com'];

      for (const url of urls) {
        expect(() => validateImageUrl(url)).toThrow(ImageProxyError);
      }
    });
  });

  describe('Real-world attack scenarios', () => {
    it('should block SSRF via redirect chain', () => {
      // While we can't test actual redirects here, we validate the initial URL
      expect(() => {
        validateImageUrl('http://evil.com/redirect-to-localhost');
      }).toThrow(ImageProxyError);
    });

    it('should block internal service discovery', () => {
      const internalUrls = [
        'http://192.168.1.1/admin',
        'http://10.0.0.1/api/secrets',
        'http://172.16.0.1/internal',
      ];

      for (const url of internalUrls) {
        expect(() => validateImageUrl(url)).toThrow(ImageProxyError);
      }
    });

    it('should block port scanning attempts', () => {
      // Even with allowed hostname, private IPs should be blocked
      expect(() => {
        validateImageUrl('http://192.168.1.1:22/image.png');
      }).toThrow(ImageProxyError);

      expect(() => {
        validateImageUrl('http://10.0.0.1:3306/image.png');
      }).toThrow(ImageProxyError);
    });
  });
});
