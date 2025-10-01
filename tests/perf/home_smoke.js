import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'],
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test homepage
  const homeResponse = http.get(`${BASE_URL}/lite`);
  check(homeResponse, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads in <400ms': (r) => r.timings.duration < 400,
    'homepage contains whale spotlight': (r) => r.body.includes('Whale Spotlight'),
  }) || errorRate.add(1);

  sleep(1);

  // Test API endpoints
  const apiTests = [
    '/api/whale-index',
    '/api/digest',
    '/api/og?type=whale&title=Test'
  ];

  for (const endpoint of apiTests) {
    const response = http.get(`${BASE_URL}${endpoint}`);
    check(response, {
      [`${endpoint} status is 200 or 404`]: (r) => r.status === 200 || r.status === 404,
      [`${endpoint} responds in <200ms`]: (r) => r.timings.duration < 200,
    }) || errorRate.add(1);
  }

  sleep(1);

  // Test referrals page
  const referralsResponse = http.get(`${BASE_URL}/referrals`);
  check(referralsResponse, {
    'referrals status is 200': (r) => r.status === 200,
    'referrals loads in <400ms': (r) => r.timings.duration < 400,
    'referrals contains invite form': (r) => r.body.includes('Send Invite'),
  }) || errorRate.add(1);

  sleep(1);
}