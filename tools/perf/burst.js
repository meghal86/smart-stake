import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTrend = new Trend('response_time');

export const options = {
  stages: [
    { duration: '10s', target: 50 }, // Quick ramp to 50 RPS
    { duration: '20s', target: 100 }, // Ramp to 100 RPS
    { duration: '20s', target: 150 }, // Ramp to 150 RPS
    { duration: '10s', target: 200 }, // Peak at 200 RPS
    { duration: '10s', target: 0 }, // Quick ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'], // 95% under 400ms
    errors: ['rate<0.005'], // Error rate under 0.5%
    http_req_failed: ['rate<0.005'],
    http_reqs: ['rate>180'], // Minimum 180 RPS achieved
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const scenarios = [
  { endpoint: '/api/healthz', weight: 0.3 },
  { endpoint: '/api/prices', weight: 0.3 },
  { endpoint: '/status', weight: 0.2 },
  { endpoint: '/lite', weight: 0.2 },
];

export default function () {
  // Weighted random endpoint selection
  const rand = Math.random();
  let cumulative = 0;
  let selectedEndpoint = '/api/healthz';
  
  for (const scenario of scenarios) {
    cumulative += scenario.weight;
    if (rand <= cumulative) {
      selectedEndpoint = scenario.endpoint;
      break;
    }
  }

  const res = http.get(`${BASE_URL}${selectedEndpoint}`, {
    timeout: '5s',
    headers: {
      'User-Agent': 'k6-burst-test/1.0',
    },
  });

  const success = check(res, {
    'status is 2xx or 3xx': (r) => r.status >= 200 && r.status < 400,
    'response time < 400ms': (r) => r.timings.duration < 400,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  errorRate.add(!success);
  responseTrend.add(res.timings.duration);

  // Minimal sleep for burst testing
  sleep(0.1);
}

export function handleSummary(data) {
  const p95 = Math.round(data.metrics.http_req_duration.values['p(95)']);
  const errorPct = (data.metrics.errors.values.rate * 100).toFixed(3);
  const rps = Math.round(data.metrics.http_reqs.values.rate);
  
  const passed = p95 < 400 && parseFloat(errorPct) < 0.5;
  
  return {
    'burst-test-results.json': JSON.stringify(data, null, 2),
    stdout: `
⚡ Burst Test Results (60s ramp to 200 RPS)
==========================================
🚀 Peak RPS: ${rps}
📊 P95 Response Time: ${p95}ms ${p95 < 400 ? '✅' : '❌'}
❌ Error Rate: ${errorPct}% ${parseFloat(errorPct) < 0.5 ? '✅' : '❌'}
🎯 Overall: ${passed ? '✅ PASSED' : '❌ FAILED'}

Detailed Metrics:
- Total Requests: ${data.metrics.http_reqs.values.count}
- Average Response: ${Math.round(data.metrics.http_req_duration.values.avg)}ms
- Max Response: ${Math.round(data.metrics.http_req_duration.values.max)}ms
`,
  };
}