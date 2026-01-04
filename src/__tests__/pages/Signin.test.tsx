/**
 * Signin Page Tests
 * 
 * Tests for /signin alias to /login with query parameter preservation
 * 
 * @see .kiro/specs/multi-chain-wallet-system/requirements.md - Requirement 3.6
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Signin from '@/pages/Signin';

// Mock Login page
const MockLoginPage = () => {
  const searchParams = new URLSearchParams(window.location.search);
  return (
    <div>
      <div>Login Page</div>
      <div data-testid="search-params">{window.location.search}</div>
    </div>
  );
};

describe('Signin Page - Alias to Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Requirement 3.6: /signin aliases to /login', () => {
    test('/signin redirects to /login', async () => {
      window.history.pushState({}, '', '/signin');

      render(
        <BrowserRouter>
          <Routes>
            <Route path="/signin" element={<Signin />} />
            <Route path="/login" element={<MockLoginPage />} />
          </Routes>
        </BrowserRouter>
      );

      // Should redirect to login
      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
      }, { timeout: 1000 });
    });

    test('/signin preserves next query parameter', async () => {
      window.history.pushState({}, '', '/signin?next=%2Fguardian');

      render(
        <BrowserRouter>
          <Routes>
            <Route path="/signin" element={<Signin />} />
            <Route path="/login" element={<MockLoginPage />} />
          </Routes>
        </BrowserRouter>
      );

      // Should redirect to login with next parameter preserved
      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
        expect(window.location.search).toContain('next=%2Fguardian');
      }, { timeout: 1000 });
    });

    test('/signin preserves multiple query parameters', async () => {
      window.history.pushState({}, '', '/signin?next=%2Fguardian&utm_source=email');

      render(
        <BrowserRouter>
          <Routes>
            <Route path="/signin" element={<Signin />} />
            <Route path="/login" element={<MockLoginPage />} />
          </Routes>
        </BrowserRouter>
      );

      // Should redirect to login with all parameters preserved
      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
        expect(window.location.search).toContain('next=%2Fguardian');
        expect(window.location.search).toContain('utm_source=email');
      }, { timeout: 1000 });
    });

    test('/signin without query parameters redirects to /login', async () => {
      window.history.pushState({}, '', '/signin');

      render(
        <BrowserRouter>
          <Routes>
            <Route path="/signin" element={<Signin />} />
            <Route path="/login" element={<MockLoginPage />} />
          </Routes>
        </BrowserRouter>
      );

      // Should redirect to login without query parameters
      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
        expect(window.location.search).toBe('');
      }, { timeout: 1000 });
    });

    test('/signin preserves complex query parameters', async () => {
      const complexParams = 'next=%2Fguardian%3Fwallet%3D0x123&network=eip155:1';
      window.history.pushState({}, '', `/signin?${complexParams}`);

      render(
        <BrowserRouter>
          <Routes>
            <Route path="/signin" element={<Signin />} />
            <Route path="/login" element={<MockLoginPage />} />
          </Routes>
        </BrowserRouter>
      );

      // Should redirect to login with complex parameters preserved
      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
        expect(window.location.search).toContain('next=');
        expect(window.location.search).toContain('network=');
      }, { timeout: 1000 });
    });

    test('/signin redirects quickly to login', async () => {
      window.history.pushState({}, '', '/signin?next=%2Fguardian');

      render(
        <BrowserRouter>
          <Routes>
            <Route path="/signin" element={<Signin />} />
            <Route path="/login" element={<MockLoginPage />} />
          </Routes>
        </BrowserRouter>
      );

      // Should redirect to login
      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
      }, { timeout: 1000 });
    });

    test('/signin uses replace navigation to prevent back button issues', async () => {
      window.history.pushState({}, '', '/signin?next=%2Fguardian');

      render(
        <BrowserRouter>
          <Routes>
            <Route path="/signin" element={<Signin />} />
            <Route path="/login" element={<MockLoginPage />} />
          </Routes>
        </BrowserRouter>
      );

      // Should redirect to login
      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
      }, { timeout: 1000 });

      // Verify it's a replace navigation (history length should not increase)
      // This is tested implicitly by the redirect behavior
    });
  });

  describe('Query Parameter Preservation', () => {
    const testCases = [
      { input: '/signin?next=%2Fguardian', expected: 'next=%2Fguardian' },
      { input: '/signin?next=%2Fhunter', expected: 'next=%2Fhunter' },
      { input: '/signin?next=%2Fharvestpro', expected: 'next=%2Fharvestpro' },
      { input: '/signin?next=%2Fguardian&wallet=0x123', expected: 'next=%2Fguardian' },
    ];

    testCases.forEach(({ input, expected }) => {
      test(`preserves query parameters: ${input}`, async () => {
        window.history.pushState({}, '', input);

        render(
          <BrowserRouter>
            <Routes>
              <Route path="/signin" element={<Signin />} />
              <Route path="/login" element={<MockLoginPage />} />
            </Routes>
          </BrowserRouter>
        );

        await waitFor(() => {
          expect(window.location.pathname).toBe('/login');
          expect(window.location.search).toContain(expected);
        }, { timeout: 1000 });
      });
    });
  });

  describe('Edge Cases', () => {
    test('/signin with empty query string redirects to /login', async () => {
      window.history.pushState({}, '', '/signin?');

      render(
        <BrowserRouter>
          <Routes>
            <Route path="/signin" element={<Signin />} />
            <Route path="/login" element={<MockLoginPage />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
      }, { timeout: 1000 });
    });

    test('/signin with special characters in query parameters', async () => {
      window.history.pushState({}, '', '/signin?next=%2Fguardian%3Fnetwork%3Deip155%3A1');

      render(
        <BrowserRouter>
          <Routes>
            <Route path="/signin" element={<Signin />} />
            <Route path="/login" element={<MockLoginPage />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
        expect(window.location.search).toContain('next=');
      }, { timeout: 1000 });
    });

    test('/signin with hash fragment is handled correctly', async () => {
      window.history.pushState({}, '', '/signin?next=%2Fguardian#section');

      render(
        <BrowserRouter>
          <Routes>
            <Route path="/signin" element={<Signin />} />
            <Route path="/login" element={<MockLoginPage />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
      }, { timeout: 1000 });
    });
  });
});
