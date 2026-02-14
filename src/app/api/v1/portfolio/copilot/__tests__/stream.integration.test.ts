/**
 * Copilot Stream SSE Integration Tests
 * 
 * Verifies that the SSE endpoint includes proper API versioning headers
 * according to API_VERSIONING_STANDARD.md requirements.
 * 
 * Requirements: 15.3, API_VERSIONING_STANDARD.md
 */

import { describe, test, expect } from 'vitest';

describe('GET /api/v1/portfolio/copilot/stream', () => {
  const baseUrl = 'http://localhost:3000';
  const endpoint = '/api/v1/portfolio/copilot/stream';

  describe('SSE Response Headers', () => {
    test('includes X-API-Version: v1 header', async () => {
      const url = `${baseUrl}${endpoint}?scope=active_wallet&wallet=0x1234567890123456789012345678901234567890`;
      
      const response = await fetch(url);
      
      expect(response.headers.get('X-API-Version')).toBe('v1');
    });

    test('includes Content-Type: text/event-stream header', async () => {
      const url = `${baseUrl}${endpoint}?scope=active_wallet&wallet=0x1234567890123456789012345678901234567890`;
      
      const response = await fetch(url);
      
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    });

    test('includes Cache-Control: no-cache header', async () => {
      const url = `${baseUrl}${endpoint}?scope=active_wallet&wallet=0x1234567890123456789012345678901234567890`;
      
      const response = await fetch(url);
      
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
    });

    test('includes Connection: keep-alive header', async () => {
      const url = `${baseUrl}${endpoint}?scope=active_wallet&wallet=0x1234567890123456789012345678901234567890`;
      
      const response = await fetch(url);
      
      expect(response.headers.get('Connection')).toBe('keep-alive');
    });
  });

  describe('SSE Meta Event', () => {
    test('sends meta event with apiVersion as first event', async () => {
      const url = `${baseUrl}${endpoint}?scope=active_wallet&wallet=0x1234567890123456789012345678901234567890`;
      
      const response = await fetch(url);
      
      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // Read first chunk
      const { value, done } = await reader.read();
      
      if (done || !value) {
        throw new Error('Stream ended before meta event');
      }

      const text = decoder.decode(value);
      
      // Verify meta event is present
      expect(text).toContain('event: meta');
      expect(text).toContain('"apiVersion":"v1"');
      
      // Clean up
      reader.cancel();
    });

    test('meta event contains valid JSON with apiVersion field', async () => {
      const url = `${baseUrl}${endpoint}?scope=active_wallet&wallet=0x1234567890123456789012345678901234567890`;
      
      const response = await fetch(url);
      
      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // Read first chunk
      const { value } = await reader.read();
      
      if (!value) {
        throw new Error('No data received');
      }

      const text = decoder.decode(value);
      
      // Extract JSON from meta event
      const dataMatch = text.match(/event: meta\ndata: ({.*})\n\n/);
      
      if (!dataMatch) {
        throw new Error('Meta event not found in expected format');
      }

      const metaData = JSON.parse(dataMatch[1]);
      
      expect(metaData).toHaveProperty('apiVersion');
      expect(metaData.apiVersion).toBe('v1');
      
      // Clean up
      reader.cancel();
    });
  });

  describe('Query Parameter Validation', () => {
    test('accepts valid active_wallet scope with address', async () => {
      const url = `${baseUrl}${endpoint}?scope=active_wallet&wallet=0x1234567890123456789012345678901234567890`;
      
      const response = await fetch(url);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('X-API-Version')).toBe('v1');
    });

    test('accepts all_wallets scope without address', async () => {
      const url = `${baseUrl}${endpoint}?scope=all_wallets`;
      
      const response = await fetch(url);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('X-API-Version')).toBe('v1');
    });

    test('defaults to active_wallet scope when not specified', async () => {
      const url = `${baseUrl}${endpoint}?wallet=0x1234567890123456789012345678901234567890`;
      
      const response = await fetch(url);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('X-API-Version')).toBe('v1');
    });

    test('rejects invalid wallet address format', async () => {
      const url = `${baseUrl}${endpoint}?scope=active_wallet&wallet=invalid-address`;
      
      const response = await fetch(url);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.apiVersion).toBe('v1');
      expect(data.error.code).toBe('INVALID_PARAMS');
    });
  });

  describe('Error Response Format', () => {
    test('error responses include apiVersion field', async () => {
      const url = `${baseUrl}${endpoint}?scope=active_wallet&wallet=invalid`;
      
      const response = await fetch(url);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('apiVersion');
      expect(data.apiVersion).toBe('v1');
      expect(data).toHaveProperty('error');
    });
  });

  describe('Acceptance Criteria Verification', () => {
    test('✅ SSE responses include X-API-Version: v1 header', async () => {
      const url = `${baseUrl}${endpoint}?scope=active_wallet&wallet=0x1234567890123456789012345678901234567890`;
      
      const response = await fetch(url);
      
      // Verify header is present and correct
      const apiVersion = response.headers.get('X-API-Version');
      expect(apiVersion).toBe('v1');
    });

    test('✅ SSE responses send meta event with apiVersion as first event', async () => {
      const url = `${baseUrl}${endpoint}?scope=active_wallet&wallet=0x1234567890123456789012345678901234567890`;
      
      const response = await fetch(url);
      
      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // Read first chunk
      const { value } = await reader.read();
      
      if (!value) {
        throw new Error('No data received');
      }

      const text = decoder.decode(value);
      
      // Verify meta event is first
      expect(text.indexOf('event: meta')).toBe(0);
      expect(text).toContain('"apiVersion":"v1"');
      
      // Clean up
      reader.cancel();
    });
  });
});
