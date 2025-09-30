# ADR-0001: Converge to Next.js 14 Monorepo

## Status
**Accepted** - 2024-01-XX

## Context

We currently have two separate frontend applications:
1. **Original App**: React 18 + Vite with comprehensive whale intelligence features
2. **Lite5 App**: Next.js 14 with lightweight retail features

This dual-app approach creates several challenges:
- **Maintenance Overhead**: Two separate codebases to maintain
- **Feature Duplication**: Similar features implemented differently
- **User Confusion**: Multiple entry points and inconsistent UX
- **Development Inefficiency**: Context switching between apps
- **Deployment Complexity**: Multiple deployment pipelines

## Decision

We will converge both applications into a **single Next.js 14 monorepo** with the following architecture:

### Monorepo Structure
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

### Key Architectural Decisions

#### 1. **Tier Gating via Middleware**
- Implement middleware-based feature gating
- Route-level access control for Lite/Pro/Enterprise tiers
- Progressive enhancement based on user tier

#### 2. **Code Splitting & Progressive Loading**
- Dynamic imports for Pro/Enterprise features
- Lite bundle <200KB gzipped
- Lazy loading of heavy components

#### 3. **Legacy Proxy Strategy**
- Proxy `/legacy/*` routes to Vite app during migration
- Zero-downtime migration with rollback capability
- Gradual feature migration using strangler pattern

#### 4. **Shared Package Architecture**
- `@sdk/*`: Domain logic and API contracts
- `@ui/*`: Reusable UI components
- `@types/*`: Shared TypeScript types
- `@config/*`: Shared configuration

## Rationale

### Benefits

#### **Unified Development Experience**
- Single codebase to maintain
- Consistent development patterns
- Shared component library
- Unified testing strategy

#### **Improved User Experience**
- Single entry point
- Consistent navigation
- Seamless tier upgrades
- Progressive feature discovery

#### **Technical Advantages**
- Next.js 14 App Router for better performance
- Server Components for reduced bundle size
- Server Actions for form handling
- Built-in optimization features

#### **Business Benefits**
- Easier feature rollout
- Better analytics and tracking
- Simplified deployment
- Reduced maintenance costs

### Risks & Mitigation

#### **Migration Risk**
- **Risk**: Feature loss during migration
- **Mitigation**: Comprehensive feature parity checklist and migration gates

#### **Performance Risk**
- **Risk**: Bundle size increase
- **Mitigation**: Code splitting and progressive loading

#### **Rollback Risk**
- **Risk**: Difficult to rollback if issues arise
- **Mitigation**: Legacy proxy and kill switch implementation

## Implementation Plan

### Phase 1: Monorepo Setup (Week 1)
- [x] Create Turborepo structure
- [x] Configure workspaces and build system
- [x] Set up shared packages
- [x] Implement middleware for tier gating

### Phase 2: Core Features (Week 2-3)
- [x] Implement Day-One Lite features (Spotlight, Dial, Digest)
- [ ] Port critical Pro features
- [ ] Set up analytics and monitoring

### Phase 3: Migration (Week 4-6)
- [ ] Implement migration gates
- [ ] Gradual feature migration
- [ ] A/B testing and validation

### Phase 4: Decommission (Week 7-8)
- [ ] Legacy app decommission
- [ ] Final cleanup and optimization

## Success Metrics

### Technical Metrics
- **Bundle Size**: Lite route <200KB gzipped
- **Performance**: LCP ≤2.0s, CLS ≤0.1
- **Lighthouse Score**: >90 for all pages
- **Test Coverage**: >80% for critical paths

### Business Metrics
- **Feature Parity**: 100% of legacy features available
- **User Experience**: No degradation in UX metrics
- **Development Velocity**: Faster feature delivery
- **Maintenance Cost**: Reduced operational overhead

## Alternatives Considered

### 1. **Keep Separate Apps**
- **Pros**: Lower migration risk
- **Cons**: Continued maintenance overhead, user confusion
- **Decision**: Rejected due to long-term maintenance burden

### 2. **Migrate to Vite Monorepo**
- **Pros**: Keep existing Vite setup
- **Cons**: Miss Next.js optimizations, less modern architecture
- **Decision**: Rejected in favor of Next.js 14 benefits

### 3. **Gradual Migration**
- **Pros**: Lower risk, incremental approach
- **Cons**: Longer timeline, continued complexity
- **Decision**: Rejected due to timeline constraints

## Consequences

### Positive
- **Unified codebase** reduces maintenance overhead
- **Better performance** through Next.js optimizations
- **Improved developer experience** with shared packages
- **Enhanced user experience** with consistent navigation

### Negative
- **Migration complexity** requires careful planning
- **Temporary dual maintenance** during transition
- **Learning curve** for team on new architecture
- **Risk of feature loss** if migration not executed properly

## Monitoring & Rollback

### Success Criteria
- All migration gates passed
- Performance metrics meet targets
- User feedback positive
- No critical bugs in production

### Rollback Triggers
- Critical bugs affecting >5% of users
- Performance degradation >20%
- User complaints >10% increase
- Security vulnerabilities

### Rollback Procedure
1. **Immediate**: Route traffic back to legacy app
2. **Investigation**: Identify root cause
3. **Fix**: Address issues in new system
4. **Re-deploy**: Gradual re-rollout

## Conclusion

The convergence to a Next.js 14 monorepo provides significant long-term benefits in terms of maintainability, performance, and user experience. While the migration carries some risk, the comprehensive migration gates and rollback procedures ensure a safe transition.

The investment in this architectural change will pay dividends in reduced maintenance overhead, improved developer productivity, and enhanced user experience.
