# Performance Monitoring

Performance monitoring utilities for Hunter Screen to track and optimize performance metrics.

## Requirements

- **1.1**: FCP < 1.0s on warm cache
- **1.2**: FCP < 1.6s on cold cache
- **1.3**: Interaction response < 150ms
- **1.4**: First 12 cards in single batched response
- **1.5**: API P95 < 200ms
- **1.6**: Images with lazy loading and width/height hints

## Usage

### Automatic Monitoring

The performance monitor automatically tracks Web Vitals when the page loads:

```typescript
import { measureWebVitals } from '@/lib/performance/monitor';

// Automatically called on page load
measureWebVitals();
```

### Manual Metric Recording

```typescript
import { performanceMonitor } from '@/lib/performance/monitor';

// Record a custom metric
performanceMonitor.recordMetric('custom_operation', 45, 100);
```

### Measure Interactions

```typescript
import { performanceMonitor } from '@/lib/performance/monitor';

// Measure synchronous interaction
performanceMonitor.measureInteraction('filter_change', () => {
  // Your interaction code
  updateFilters(newFilters);
});

// Measure async interaction
await performanceMonitor.measureInteraction('load_more', async () => {
  await fetchNextPage();
});
```

### Measure API Calls

```typescript
import { performanceMonitor } from '@/lib/performance/monitor';

const data = await performanceMonitor.measureAPI('fetch_opportunities', async () => {
  return await fetch('/api/hunter/opportunities').then(r => r.json());
});
```

### React Hook

```typescript
import { usePerformanceMonitor } from '@/lib/performance/monitor';

function MyComponent() {
  usePerformanceMonitor('MyComponent');
  
  return <div>...</div>;
}
```

### Get Performance Summary

```typescript
import { performanceMonitor } from '@/lib/performance/monitor';

// Get all metrics
const metrics = performanceMonitor.getMetrics();

// Get summary statistics
const summary = performanceMonitor.getSummary();
console.log(summary);
// {
//   'FCP': { count: 1, avg: 850, max: 850, violations: 0 },
//   'api:fetch_opportunities': { count: 5, avg: 180, max: 220, violations: 1 }
// }
```

## Performance Thresholds

| Metric | Threshold | Description |
|--------|-----------|-------------|
| FCP (warm) | 1000ms | First Contentful Paint with warm cache |
| FCP (cold) | 1600ms | First Contentful Paint with cold cache |
| TTI | 2000ms | Time to Interactive |
| Interaction | 150ms | User interaction response time |
| API P95 | 200ms | 95th percentile API response time |
| Component Render | 50ms | Individual component render time |
| LCP | 2500ms | Largest Contentful Paint |
| CLS | 0.1 | Cumulative Layout Shift |
| FID | 100ms | First Input Delay |

## Testing

Run performance tests:

```bash
./scripts/test-performance.sh
```

Run Lighthouse CI:

```bash
npm install -g @lhci/cli
lhci autorun
```

## Monitoring in Production

Performance metrics are automatically sent to analytics when available:

```typescript
// Metrics are sent to window.analytics if available
window.analytics.track('performance_metric', {
  metric_name: 'FCP',
  value: 850,
  threshold: 1000,
  exceeded: false
});
```

## Optimization Checklist

- [x] Code splitting for heavy components (FilterDrawer, RightRail)
- [x] React.memo for expensive components
- [x] Image optimization with lazy loading
- [x] CDN caching rules configured
- [x] Performance monitoring utilities
- [ ] Virtual scrolling (if needed)
- [ ] Database query optimization verification
- [ ] Lighthouse CI tests passing

## Related Files

- `lighthouserc.json` - Lighthouse CI configuration
- `vercel.json` - CDN caching rules
- `scripts/test-performance.sh` - Performance testing script
