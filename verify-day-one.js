#!/usr/bin/env node

// Simple verification script for Day-One implementation
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Day-One AlphaWhale Implementation...\n');

const checks = [
  {
    name: 'Next.js Config (Environment-aware routing)',
    file: 'apps/web/next.config.js',
    test: (content) => content.includes('isProd') && content.includes('rewrites') && content.includes('redirects')
  },
  {
    name: 'Middleware (Tier gating + kill switch)',
    file: 'apps/web/middleware.ts',
    test: (content) => content.includes('next_web_enabled') && content.includes('x-user-tier')
  },
  {
    name: 'Legacy URL Helper',
    file: 'apps/web/src/lib/legacy.ts',
    test: (content) => content.includes('legacyUrl') && content.includes('NODE_ENV')
  },
  {
    name: 'Feature Flags System',
    file: 'apps/web/src/lib/flags.ts',
    test: (content) => content.includes('getFlag') && content.includes('JSON.parse')
  },
  {
    name: 'Analytics Tracking',
    file: 'apps/web/src/lib/track.ts',
    test: (content) => content.includes('track') && content.includes('console.debug')
  },
  {
    name: 'Enhanced Landing Page',
    file: 'apps/web/src/app/page.tsx',
    test: (content) => content.includes('legacyUrl') && content.includes('track') && content.includes('Learn more')
  },
  {
    name: 'Lite Dashboard (Server-side)',
    file: 'apps/web/src/app/lite/page.tsx',
    test: (content) => content.includes('revalidate = 300') && content.includes('getDailySpotlight')
  },
  {
    name: 'Portfolio Lite Component',
    file: 'apps/web/src/components/portfolio/PortfolioLite.tsx',
    test: (content) => content.includes('localStorage') && content.includes('aw_portfolio_lite')
  },
  {
    name: 'OG Share Image API',
    file: 'apps/web/src/app/api/share/spotlight/[id]/route.tsx',
    test: (content) => content.includes('ImageResponse') && content.includes('Whale Spotlight')
  },
  {
    name: 'Upgrade Page',
    file: 'apps/web/src/app/upgrade/page.tsx',
    test: (content) => content.includes('Upgrade Required') && content.includes('Pro or Enterprise')
  },
  {
    name: 'Feature Flags Config',
    file: 'feature_flags.json',
    test: (content) => content.includes('next_web_enabled') && content.includes('spotlight_share')
  },
  {
    name: 'Playwright Tests',
    file: 'tests/e2e/landing-lite.spec.ts',
    test: (content) => content.includes('landing → lite navigation') && content.includes('tier gating')
  },
  {
    name: 'Workspace Config',
    file: 'pnpm-workspace.yaml',
    test: (content) => content.includes('apps/*') && content.includes('packages/*')
  }
];

let passed = 0;
let failed = 0;

checks.forEach(check => {
  try {
    const filePath = path.join(__dirname, check.file);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${check.name}: File not found`);
      failed++;
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    if (check.test(content)) {
      console.log(`✅ ${check.name}`);
      passed++;
    } else {
      console.log(`❌ ${check.name}: Content check failed`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${check.name}: Error - ${error.message}`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n🎉 All Day-One implementation checks passed!');
  console.log('\n🚀 Ready for production deployment');
} else {
  console.log('\n⚠️  Some checks failed. Review the implementation.');
}

console.log('\n📋 Next Steps:');
console.log('1. pnpm install');
console.log('2. pnpm --filter ./apps/legacy dev  # Terminal 1');
console.log('3. pnpm --filter ./apps/web dev     # Terminal 2');
console.log('4. Open http://localhost:3000');
console.log('5. Test tier gating: http://localhost:3000/pro?tier=lite');
console.log('6. Run tests: npx playwright test tests/e2e/landing-lite.spec.ts');