/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const LEGACY_PROXY_BASE = process.env.LEGACY_PROXY_BASE || 'http://localhost:8080';

const nextConfig = {
  experimental: { 
    serverActions: { bodySizeLimit: '2mb' } 
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  async redirects() {
    if (isProd) return [];
    // Dev: open legacy directly on :8080 and preserve deep links
    return [
      { source: '/legacy', destination: 'http://localhost:8080', permanent: false },
      { source: '/legacy/:path*', destination: 'http://localhost:8080/:path*', permanent: false },
      { source: '/market/:path*', destination: 'http://localhost:8080/market/:path*', permanent: false },
      { source: '/alerts/:path*', destination: 'http://localhost:8080/alerts/:path*', permanent: false },
    ];
  },

  async rewrites() {
    if (!isProd) return [];
    // Prod: proxy legacy under same domain (one origin; shared session)
    return [
      { source: '/legacy', destination: `${LEGACY_PROXY_BASE}/legacy` },
      { source: '/legacy/:path*', destination: `${LEGACY_PROXY_BASE}/legacy/:path*` },
      { source: '/market/:path*', destination: `${LEGACY_PROXY_BASE}/legacy/market/:path*` },
      { source: '/alerts/:path*', destination: `${LEGACY_PROXY_BASE}/legacy/alerts/:path*` },
    ];
  },
};

module.exports = nextConfig
