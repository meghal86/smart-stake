import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTrend = new Trend('response_time');

export const options = {
  stages: [
    { duration: '2m', target: 40 }, // Ramp up to 40 VUs
    { duration: '30m', target: 40 }, // Stay at 40 VUs for 30 minutes
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'], // 95% of requests under 400ms
    errors: ['rate<0.005'], // Error rate under 0.5%
    http_req_failed: ['rate<0.005'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const endpoints = [
  '/api/healthz',
  '/api/prices',
  '/status',
];

export default function () {
  // Test health endpoint
  const healthRes = http.get(`${BASE_URL}/api/healthz`);
  check(healthRes, {
    'health status is 200 or 206': (r) => r.status === 200 || r.status === 206,
    'health response time < 400ms': (r) => r.timings.duration < 400,
  });
  
  errorRate.add(healthRes.status >= 400);
  responseTrend.add(healthRes.timings.duration);

  // Test random endpoint
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(`${BASE_URL}${endpoint}`);
  
  check(res, {
    'status is 2xx or 3xx': (r) => r.status >= 200 && r.status < 400,
    'response time < 400ms': (r) => r.timings.duration < 400,
  });

  errorRate.add(res.status >= 400);
  responseTrend.add(res.timings.duration);

  // Simulate realistic user behavior
  sleep(Math.random() * 2 + 1); // 1-3 second pause
}

export function handleSummary(data) {
  return {
    'soak-test-results.json': JSON.stringify(data, null, 2),
    stdout: `
🔥 Soak Test Results (30min @ 40 VUs)
=====================================
✅ Requests: ${data.metrics.http_reqs.values.count}
📊 P95 Response Time: ${Math.round(data.metrics.http_req_duration.values['p(95)'])}ms
❌ Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%
🎯 Thresholds: ${Object.keys(data.metrics).filter(m => data.metrics[m].thresholds).map(m => 
  Object.keys(data.metrics[m].thresholds).map(t => 
    data.metrics[m].thresholds[t].ok ? '✅' : '❌'
  ).join(' ')
).join(' ')}
`,
  };
}