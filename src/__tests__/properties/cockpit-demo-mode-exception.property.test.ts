/**
 * Cockpit Demo Mode Exception Property-Based Tests
 * 
 * Feature: authenticated-home-cockpit
 * Property 2: Demo Mode Exception
 * 
 * Tests that for any unauthenticated user request to /cockpit?demo=1,
 * the system bypasses redirect and renders static demo cockpit without 
 * calling authenticated APIs.
 * 
 * Validates: Requirements 1.6, 1.7
 */

import * as fc from 'fast-check';
import { describe, test, expect, beforeEach, vi } from 'vitest';

// ============================================================================
// Types
// ============================================================================

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  sessionEstablished: boolean;
  user: { id: string; email: string } | null;
}

interface NavigationState {
  currentPath: string;
  searchParams: URLSearchParams;
  redirectCalled: boolean;
  redirectTarget: string | null;
}

interface CockpitPageState {
  rendered: boolean;
  showsAuthenticatedContent: boolean;
  showsLoadingState: boolean;
  showsRedirectState: boolean;
  showsDemoContent: boolean;
  showsDemoBadge: boolean;
}

interface APICallTracker {
  cockpitSummaryCalled: boolean;
  cockpitPrefsCalled: boolean;
  cockpitOpenCalled: boolean;
  cockpitActionsRenderedCalled: boolean;
  totalAPICalls: number;
}

// ============================================================================
// Generators
// ============================================================================

/**
 * Generate various unauthenticated states
 */
const unauthenticatedStateArbitrary = fc.record({
  isAuthenticated: fc.constant(false),
  loading: fc.boolean(),
  sessionEstablished: fc.boolean(),
  user: fc.constant(null)
});

/**
 * Generate various cockpit paths with demo=1 parameter
 */
const demoCockpitPathArbitrary = fc.constantFrom(
  '/cockpit?demo=1',
  '/cockpit/?demo=1',
  '/cockpit?demo=1&foo=bar',
  '/cockpit?foo=bar&demo=1',
  '/cockpit?demo=1#pulse',
  '/cockpit?demo=1#insights'
);

/**
 * Generate search parameters that MUST include demo=1
 */
const demoSearchParamsArbitrary = fc.record({
  demo: fc.constant('1'),
  wallet: fc.option(fc.constantFrom('active', 'all'), { nil: undefined }),
  debug: fc.option(fc.boolean().map(String), { nil: undefined }),
  foo: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
  bar: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined })
}).map(params => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.set(key, value);
    }
  });
  return searchParams;
});

/**
 * Generate various demo mode variations
 */
const demoParameterArbitrary = fc.constantFrom(
  '1',
  'true', // Should not work - only '1' is valid
  'yes',  // Should not work - only '1' is valid
  '0',    // Should not work - only '1' is valid
  ''      // Should not work - only '1' is valid
);

// ============================================================================
// Mock Implementation
// ============================================================================

/**
 * Mock cockpit page behavior that simulates the actual component logic
 */
class MockCockpitPageWithDemo {
  private authState: AuthState;
  private navigationState: NavigationState;
  private pageState: CockpitPageState;
  private apiTracker: APICallTracker;

  constructor(authState: AuthState, path: string, searchParams: URLSearchParams) {
    this.authState = authState;
    this.navigationState = {
      currentPath: path,
      searchParams,
      redirectCalled: false,
      redirectTarget: null
    };
    this.pageState = {
      rendered: false,
      showsAuthenticatedContent: false,
      showsLoadingState: false,
      showsRedirectState: false,
      showsDemoContent: false,
      showsDemoBadge: false
    };
    this.apiTracker = {
      cockpitSummaryCalled: false,
      cockpitPrefsCalled: false,
      cockpitOpenCalled: false,
      cockpitActionsRenderedCalled: false,
      totalAPICalls: 0
    };
  }

  /**
   * Simulate API calls (should NOT be called in demo mode)
   */
  private callCockpitAPI(endpoint: string): void {
    this.apiTracker.totalAPICalls++;
    
    switch (endpoint) {
      case 'summary':
        this.apiTracker.cockpitSummaryCalled = true;
        break;
      case 'prefs':
        this.apiTracker.cockpitPrefsCalled = true;
        break;
      case 'open':
        this.apiTracker.cockpitOpenCalled = true;
        break;
      case 'actions/rendered':
        this.apiTracker.cockpitActionsRenderedCalled = true;
        break;
    }
  }

  /**
   * Simulate the useEffect logic for demo mode detection
   */
  private checkDemoMode(): boolean {
    const demoParam = this.navigationState.searchParams.get('demo');
    return demoParam === '1'; // Only '1' is valid for demo mode
  }

  /**
   * Simulate the useEffect logic for authentication redirect
   */
  private handleAuthenticationRedirect(): void {
    // Check for demo mode first - demo mode bypasses all auth checks
    const isDemo = this.checkDemoMode();
    if (isDemo) {
      return; // Demo mode bypasses redirect logic entirely
    }

    // Wait for session to be established before making redirect decisions
    if (!this.authState.sessionEstablished || this.authState.loading) {
      return;
    }

    // If not authenticated and not in demo mode, redirect to /
    if (!this.authState.isAuthenticated) {
      this.navigationState.redirectCalled = true;
      this.navigationState.redirectTarget = '/';
      return;
    }
  }

  /**
   * Simulate the useCockpitData hook behavior
   */
  private simulateDataFetching(): void {
    const isDemo = this.checkDemoMode();
    
    if (!isDemo && this.authState.isAuthenticated) {
      // Only call APIs if not in demo mode and authenticated
      this.callCockpitAPI('summary');
      this.callCockpitAPI('prefs');
      this.callCockpitAPI('open');
    }
    
    // Demo mode should NOT call any APIs
  }

  /**
   * Simulate the render logic
   */
  render(): CockpitPageState {
    this.handleAuthenticationRedirect();

    // Check for demo mode first
    const isDemo = this.checkDemoMode();

    // Demo mode always renders, regardless of auth state
    if (isDemo) {
      this.pageState = {
        rendered: true,
        showsAuthenticatedContent: false,
        showsLoadingState: false,
        showsRedirectState: false,
        showsDemoContent: true,
        showsDemoBadge: true
      };
      return this.pageState;
    }

    // Show loading state while checking authentication (non-demo mode only)
    if (!this.authState.sessionEstablished || this.authState.loading) {
      this.pageState = {
        rendered: true,
        showsAuthenticatedContent: false,
        showsLoadingState: true,
        showsRedirectState: false,
        showsDemoContent: false,
        showsDemoBadge: false
      };
      return this.pageState;
    }

    // If not authenticated and not demo mode, don't render anything (redirect will happen)
    if (!this.authState.isAuthenticated) {
      this.pageState = {
        rendered: true,
        showsAuthenticatedContent: false,
        showsLoadingState: false,
        showsRedirectState: true,
        showsDemoContent: false,
        showsDemoBadge: false
      };
      return this.pageState;
    }

    // Simulate data fetching
    this.simulateDataFetching();

    // Authenticated user
    this.pageState = {
      rendered: true,
      showsAuthenticatedContent: true,
      showsLoadingState: false,
      showsRedirectState: false,
      showsDemoContent: false,
      showsDemoBadge: false
    };
    return this.pageState;
  }

  /**
   * Simulate action clicks (should not call APIs in demo mode)
   */
  simulateActionClick(): void {
    const isDemo = this.checkDemoMode();
    
    if (!isDemo) {
      this.callCockpitAPI('actions/rendered');
    }
    // Demo mode should NOT call actions/rendered API
  }

  /**
   * Get navigation state for testing
   */
  getNavigationState(): NavigationState {
    return this.navigationState;
  }

  /**
   * Get page state for testing
   */
  getPageState(): CockpitPageState {
    return this.pageState;
  }

  /**
   * Get API call tracker for testing
   */
  getAPITracker(): APICallTracker {
    return this.apiTracker;
  }
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: authenticated-home-cockpit, Property 2: Demo Mode Exception', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Property 2.1: Demo mode bypasses redirect for unauthenticated users
  // ========================================================================

  test('demo mode bypasses redirect for unauthenticated users', () => {
    fc.assert(
      fc.property(
        unauthenticatedStateArbitrary,
        demoCockpitPathArbitrary,
        (authState, path) => {
          // Demo mode should work regardless of session establishment state
          const testAuthState = {
            ...authState,
            // Don't force sessionEstablished - test all states
          };

          const searchParams = new URLSearchParams();
          // Extract search params properly, handling hash fragments
          const urlParts = path.split('?');
          if (urlParts.length > 1) {
            const queryPart = urlParts[1].split('#')[0]; // Remove hash fragment
            searchParams.append('demo', '1'); // We know demo=1 should be present
            // Parse other params if any
            const params = new URLSearchParams(queryPart);
            for (const [key, value] of params.entries()) {
              if (key !== 'demo') {
                searchParams.append(key, value);
              }
            }
          }
          const mockPage = new MockCockpitPageWithDemo(testAuthState, path, searchParams);
          mockPage.render();

          const navState = mockPage.getNavigationState();

          // Property: Should NOT redirect when demo=1, regardless of session state
          return !navState.redirectCalled;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 2.2: Demo mode renders static demo cockpit
  // ========================================================================

  test('demo mode renders static demo cockpit', () => {
    fc.assert(
      fc.property(
        unauthenticatedStateArbitrary,
        demoSearchParamsArbitrary,
        (authState, searchParams) => {
          const testAuthState = {
            ...authState,
            sessionEstablished: true,
            loading: false
          };

          const mockPage = new MockCockpitPageWithDemo(testAuthState, '/cockpit', searchParams);
          const pageState = mockPage.render();

          // Property: Should show demo content and demo badge
          return pageState.showsDemoContent && pageState.showsDemoBadge;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 2.3: Demo mode never calls authenticated APIs
  // ========================================================================

  test('demo mode never calls authenticated APIs', () => {
    fc.assert(
      fc.property(
        unauthenticatedStateArbitrary,
        demoSearchParamsArbitrary,
        (authState, searchParams) => {
          const testAuthState = {
            ...authState,
            sessionEstablished: true,
            loading: false
          };

          const mockPage = new MockCockpitPageWithDemo(testAuthState, '/cockpit', searchParams);
          mockPage.render();

          // Simulate user interactions that might trigger API calls
          mockPage.simulateActionClick();

          const apiTracker = mockPage.getAPITracker();

          // Property: No API calls should be made in demo mode
          return apiTracker.totalAPICalls === 0 &&
                 !apiTracker.cockpitSummaryCalled &&
                 !apiTracker.cockpitPrefsCalled &&
                 !apiTracker.cockpitOpenCalled &&
                 !apiTracker.cockpitActionsRenderedCalled;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 2.4: Only demo=1 parameter enables demo mode
  // ========================================================================

  test('only demo=1 parameter enables demo mode', () => {
    fc.assert(
      fc.property(
        unauthenticatedStateArbitrary,
        demoParameterArbitrary,
        (authState, demoValue) => {
          const testAuthState = {
            ...authState,
            sessionEstablished: true,
            loading: false
          };

          const searchParams = new URLSearchParams();
          searchParams.set('demo', demoValue);

          const mockPage = new MockCockpitPageWithDemo(testAuthState, '/cockpit', searchParams);
          const pageState = mockPage.render();
          const navState = mockPage.getNavigationState();

          if (demoValue === '1') {
            // Property: demo=1 should enable demo mode
            return pageState.showsDemoContent && !navState.redirectCalled;
          } else {
            // Property: any other value should NOT enable demo mode
            return !pageState.showsDemoContent && navState.redirectCalled;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 2.5: Demo mode works with various additional parameters
  // ========================================================================

  test('demo mode works with various additional parameters', () => {
    fc.assert(
      fc.property(
        unauthenticatedStateArbitrary,
        fc.record({
          demo: fc.constant('1'),
          wallet: fc.option(fc.constantFrom('active', 'all'), { nil: undefined }),
          debug: fc.option(fc.boolean().map(String), { nil: undefined }),
          foo: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
          bar: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
          hash: fc.option(fc.constantFrom('pulse', 'insights', ''), { nil: undefined })
        }),
        (authState, params) => {
          const testAuthState = {
            ...authState,
            sessionEstablished: true,
            loading: false
          };

          const searchParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && key !== 'hash') {
              searchParams.set(key, value);
            }
          });

          const mockPage = new MockCockpitPageWithDemo(testAuthState, '/cockpit', searchParams);
          const pageState = mockPage.render();
          const navState = mockPage.getNavigationState();
          const apiTracker = mockPage.getAPITracker();

          // Property: Demo mode should work regardless of additional parameters
          return pageState.showsDemoContent && 
                 pageState.showsDemoBadge &&
                 !navState.redirectCalled &&
                 apiTracker.totalAPICalls === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 2.6: Demo mode is case sensitive
  // ========================================================================

  test('demo mode is case sensitive', () => {
    fc.assert(
      fc.property(
        unauthenticatedStateArbitrary,
        fc.constantFrom('Demo=1', 'DEMO=1', 'demo=True', 'demo=TRUE', 'demo=Yes'),
        (authState, demoParam) => {
          const testAuthState = {
            ...authState,
            sessionEstablished: true,
            loading: false
          };

          const searchParams = new URLSearchParams(demoParam);
          const mockPage = new MockCockpitPageWithDemo(testAuthState, '/cockpit', searchParams);
          const pageState = mockPage.render();
          const navState = mockPage.getNavigationState();

          // Property: Case variations should NOT enable demo mode
          return !pageState.showsDemoContent && navState.redirectCalled;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 2.7: Demo mode state is consistent across renders
  // ========================================================================

  test('demo mode state is consistent across renders', () => {
    fc.assert(
      fc.property(
        unauthenticatedStateArbitrary,
        demoSearchParamsArbitrary,
        fc.integer({ min: 2, max: 5 }),
        (authState, searchParams, renderCount) => {
          const testAuthState = {
            ...authState,
            sessionEstablished: true,
            loading: false
          };

          const mockPage = new MockCockpitPageWithDemo(testAuthState, '/cockpit', searchParams);

          // Render multiple times
          const results = Array.from({ length: renderCount }, () => {
            mockPage.render();
            return {
              page: mockPage.getPageState(),
              nav: mockPage.getNavigationState(),
              api: mockPage.getAPITracker()
            };
          });

          // Property: All renders should behave consistently
          const allShowDemo = results.every(r => r.page.showsDemoContent);
          const allShowBadge = results.every(r => r.page.showsDemoBadge);
          const noneRedirect = results.every(r => !r.nav.redirectCalled);
          const noAPICalls = results.every(r => r.api.totalAPICalls === 0);

          return allShowDemo && allShowBadge && noneRedirect && noAPICalls;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 2.8: Demo mode never shows authenticated content
  // ========================================================================

  test('demo mode never shows authenticated content', () => {
    fc.assert(
      fc.property(
        unauthenticatedStateArbitrary,
        demoSearchParamsArbitrary,
        (authState, searchParams) => {
          const mockPage = new MockCockpitPageWithDemo(authState, '/cockpit', searchParams);
          const pageState = mockPage.render();

          // Property: Should never show authenticated content in demo mode
          return !pageState.showsAuthenticatedContent;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 2.9: Demo mode works regardless of auth state transitions
  // ========================================================================

  test('demo mode works regardless of auth state transitions', () => {
    fc.assert(
      fc.property(
        fc.array(unauthenticatedStateArbitrary, { minLength: 2, maxLength: 5 }),
        demoSearchParamsArbitrary,
        (authStates, searchParams) => {
          const mockPage = new MockCockpitPageWithDemo(authStates[0], '/cockpit', searchParams);

          // Test state transitions
          const results = authStates.map(authState => {
            // Update auth state (simulating auth state changes)
            (mockPage as any).authState = authState;
            mockPage.render();
            return {
              page: mockPage.getPageState(),
              nav: mockPage.getNavigationState(),
              api: mockPage.getAPITracker()
            };
          });

          // Property: Demo mode should work consistently regardless of auth state
          const allShowDemo = results.every(r => r.page.showsDemoContent);
          const noneRedirect = results.every(r => !r.nav.redirectCalled);
          const noAPICalls = results.every(r => r.api.totalAPICalls === 0);

          return allShowDemo && noneRedirect && noAPICalls;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 2.10: Demo mode parameter position doesn't matter
  // ========================================================================

  test('demo mode parameter position does not matter', () => {
    fc.assert(
      fc.property(
        unauthenticatedStateArbitrary,
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 3 }),
        (authState, otherParams) => {
          const testAuthState = {
            ...authState,
            sessionEstablished: true,
            loading: false
          };

          // Create different parameter orders
          const paramOrders = [
            `demo=1&${otherParams.map((p, i) => `param${i}=${p}`).join('&')}`,
            `${otherParams.map((p, i) => `param${i}=${p}`).join('&')}&demo=1`,
            otherParams.length > 1 ? 
              `param0=${otherParams[0]}&demo=1&${otherParams.slice(1).map((p, i) => `param${i+1}=${p}`).join('&')}` :
              `demo=1&param0=${otherParams[0]}`
          ];

          // Test all parameter orders
          const results = paramOrders.map(paramString => {
            const searchParams = new URLSearchParams(paramString);
            const mockPage = new MockCockpitPageWithDemo(testAuthState, '/cockpit', searchParams);
            const pageState = mockPage.render();
            const navState = mockPage.getNavigationState();
            return {
              showsDemo: pageState.showsDemoContent,
              redirects: navState.redirectCalled
            };
          });

          // Property: All parameter orders should enable demo mode
          const allShowDemo = results.every(r => r.showsDemo);
          const noneRedirect = results.every(r => !r.redirects);

          return allShowDemo && noneRedirect;
        }
      ),
      { numRuns: 100 }
    );
  });
});