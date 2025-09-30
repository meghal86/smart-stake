# AlphaWhale Monorepo

A unified Next.js 14 monorepo for the AlphaWhale whale intelligence platform, combining Lite, Pro, and Enterprise features with tier-based access control.

## 🏗️ Architecture

```
repo/
├── apps/
│   ├── web/                 # Next.js 14 – the only user-facing app
│   └── legacy/              # Original Vite app (moved here, proxied)
├── packages/
│   ├── sdk/                 # Domain logic, typed client, zod contracts
│   ├── ui/                  # Design system (Tailwind + Radix + shadcn)
│   ├── types/               # Shared TS types
│   └── config/              # eslint, tsconfig, tailwind config, tokens
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Turbo (for monorepo management)

### Installation
```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

This will start:
- **Next.js app** on http://localhost:3000
- **Legacy Vite app** on http://localhost:8080 (proxied via /legacy/*)

## 📦 Packages

### Apps

#### `apps/web` - Main Next.js Application
- **Framework**: Next.js 14 with App Router
- **Features**: Tier-gated Lite/Pro/Enterprise features
- **Routing**: Middleware-based access control
- **Performance**: Code splitting, progressive loading

#### `apps/legacy` - Legacy Vite Application
- **Framework**: React 18 + Vite
- **Purpose**: Rollback capability during migration
- **Access**: Proxied via `/legacy/*` routes

### Shared Packages

#### `packages/sdk` - Domain Logic
- **Purpose**: Business logic, API contracts, data validation
- **Tech**: TypeScript, Zod schemas
- **Exports**: Data fetching functions, type definitions

#### `packages/ui` - Design System
- **Purpose**: Reusable UI components
- **Tech**: React, Tailwind CSS, Radix UI
- **Exports**: Components, design tokens

#### `packages/types` - Shared Types
- **Purpose**: TypeScript type definitions
- **Tech**: TypeScript
- **Exports**: Shared interfaces, enums, types

#### `packages/config` - Shared Configuration
- **Purpose**: ESLint, TypeScript, Tailwind configs
- **Tech**: Configuration files
- **Exports**: Shared configs for consistency

## 🎯 Features

### Lite Tier (Free)
- 🐋 **Whale Spotlight**: Daily whale movements
- 🧭 **Fear & Whale Index**: Market sentiment dial
- 📩 **Daily Digest**: Whale activity summary
- 📚 **Whale 101**: Educational content
- 💼 **Portfolio Lite**: Basic portfolio tracking

### Pro Tier (Paid)
- 🏆 **Smart Money Leaderboard**: Top performers
- 📅 **Unlock Calendar**: Advanced token unlock tracking
- 🔔 **Custom Alerts**: User-defined notifications
- 🔄 **Portfolio Sync**: External portfolio integration
- 🤖 **Whale Coach**: AI-powered insights
- 🔥 **Hotspots**: Market hotspot detection
- 📊 **Backtesting Lite**: Basic strategy testing

### Enterprise Tier (Custom)
- 💰 **MM Flow Monitoring**: Market maker flow tracking
- 🔗 **Signal Fusion**: Advanced signal processing
- 📈 **Backtests API**: Comprehensive backtesting
- ⚡ **Execution Layer (OMS)**: Order management system
- 📊 **Monitoring**: Advanced system monitoring

## 🛠️ Development

### Commands

```bash
# Development
pnpm dev                 # Start all apps in development
pnpm dev --filter=web    # Start only Next.js app
pnpm dev --filter=legacy # Start only legacy app

# Building
pnpm build               # Build all packages
pnpm build --filter=web  # Build only Next.js app

# Testing
pnpm test                # Run all tests
pnpm test:ui             # Run tests with UI
pnpm test:e2e            # Run E2E tests

# Linting & Formatting
pnpm lint                # Lint all packages
pnpm typecheck           # Type check all packages
pnpm format              # Format all packages
```

### Adding New Features

1. **Create feature branch**
2. **Implement in appropriate package**
3. **Add tests and documentation**
4. **Update feature parity checklist**
5. **Submit PR with migration gate validation**

## 🔒 Tier Gating

### Middleware Implementation
The app uses Next.js middleware to control feature access:

```typescript
// middleware.ts
export async function middleware(req: NextRequest) {
  const tier = await getUserTier(req);
  
  // Gate Pro/Enterprise routes
  if (url.pathname.startsWith('/pro') && tier === 'lite') {
    return NextResponse.redirect(new URL('/upgrade', req.url));
  }
}
```

### Feature Gating Patterns
```typescript
// Component-level gating
{tier === 'lite' && <UpgradePrompt />}

// Route-level gating
if (tier !== 'enterprise') {
  return <AccessDenied />;
}
```

## 📊 Performance

### Bundle Size Targets
- **Lite Route**: <200KB gzipped
- **Pro Route**: <500KB gzipped
- **Enterprise Route**: <1MB gzipped

### Performance Targets
- **LCP**: ≤2.0s (P75)
- **CLS**: ≤0.1
- **Lighthouse Score**: >90

### Optimization Strategies
- **Code Splitting**: Dynamic imports for tier-specific features
- **Progressive Loading**: Load features based on user tier
- **Server Components**: Reduce client-side JavaScript
- **Edge Caching**: ISR for static content

## 🧪 Testing

### Test Strategy
- **Unit Tests**: Component and function testing
- **Integration Tests**: API and data flow testing
- **E2E Tests**: Critical user journey testing
- **Visual Regression**: Component snapshot testing

### Test Commands
```bash
pnpm test                # Run unit tests
pnpm test:coverage       # Run with coverage
pnpm test:e2e           # Run E2E tests
pnpm test:ui            # Run tests with UI
```

## 🚀 Deployment

### Production Deployment
1. **Build**: `pnpm build`
2. **Test**: `pnpm test:all`
3. **Deploy**: Deploy to Vercel/Netlify
4. **Monitor**: Check performance and error rates

### Migration Deployment
1. **Shadow Mode**: Run new system alongside legacy
2. **Traffic Splitting**: Gradually increase traffic to new system
3. **Monitoring**: Watch for issues and performance degradation
4. **Rollback**: Quick rollback if issues arise

## 📈 Migration Strategy

### Migration Gates
See [Migration Gates Checklist](./AlphaWhale_Migration_Gates_Checklist.md) for detailed migration process.

### Feature Parity
See [Feature Parity Checklist](./AlphaWhale_Feature_Parity_Checklist.csv) for complete feature mapping.

### Rollback Plan
- **Immediate**: Route traffic back to legacy app
- **Investigation**: Identify and fix issues
- **Re-deploy**: Gradual re-rollout after fixes

## 🔧 Configuration

### Environment Variables
```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
SENTRY_DSN=your_sentry_dsn

# Feature Flags
NEXT_PUBLIC_ENABLE_PRO_FEATURES=false
NEXT_PUBLIC_ENABLE_ENTERPRISE_FEATURES=false
```

### Turbo Configuration
```json
{
  "pipeline": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "lint": { "outputs": [] },
    "typecheck": { "outputs": [] }
  }
}
```

## 📚 Documentation

- [Architecture Decision Record](./ADR-0001-Converge-to-Next14-Monorepo.md)
- [Migration Gates Checklist](./AlphaWhale_Migration_Gates_Checklist.md)
- [Feature Parity Checklist](./AlphaWhale_Feature_Parity_Checklist.csv)
- [API Documentation](./COMPLETE_FEATURE_API_DOCUMENTATION.md)

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines
- Follow TypeScript strict mode
- Write tests for new features
- Update documentation
- Follow conventional commits
- Ensure all checks pass

## 📞 Support

- **Documentation**: Check this README and linked docs
- **Issues**: Create GitHub issue for bugs
- **Discussions**: Use GitHub Discussions for questions
- **Security**: Report security issues privately

## 📄 License

This project is proprietary and confidential. All rights reserved.

---

**Built with ❤️ by the AlphaWhale Team**