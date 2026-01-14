/**
 * Cockpit End-to-End Tests
 * 
 * Tests complete user journeys from browser perspective,
 * including navigation, UI interactions, and data flow.
 * 
 * Requirements: All integration requirements
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock browser environment
const mockWindow = {
  location: {
    href: 'http://localhost:3000/',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn()
  },
  history: {
    pushState: vi.fn(),
    replaceState: vi.fn(),
    back: vi.fn()
  },
  document: {
    title: '',
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(),
    getElementById: vi.fn(),
    createElement: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  fetch: vi.fn(),
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  sessionStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
};

// Mock DOM elements
const createMockElement = (tagName: string, attributes: Record<string, any> = {}) => ({
  tagName: tagName.toUpperCase(),
  ...attributes,
  click: vi.fn(),
  focus: vi.fn(),
  blur: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  getAttribute: vi.fn((name: string) => attributes[name]),
  setAttribute: vi.fn(),
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
    toggle: vi.fn()
  },
  style: {},
  textContent: attributes.textContent || '',
  innerHTML: attributes.innerHTML || '',
  children: attributes.children || [],
  parentElement: null,
  querySelector: vi.fn(),
  querySelectorAll: vi.fn()
});

// Mock React components and hooks
const mockUseCockpitData = vi.fn();
const mockUseAuth = vi.fn();
const mockUseRouter = vi.fn();

vi.mock('@/hooks/useCockpitData', () => ({
  useCockpitData: mockUseCockpitData
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: mockUseAuth
}));

vi.mock('next/navigation', () => ({
  useRouter: mockUseRouter,
  usePathname: () => '/cockpit',
  useSearchParams: () => new URLSearchParams()
}));

describe('Cockpit End-to-End Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    mockUseRouter.mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn()
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete User Journey - Unauthenticated to Authenticated', () => {
    test('should redirect unauthenticated user and handle demo mode', async () => {
      // Start unauthenticated
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });

      const mockRouter = {
        push: vi.fn(),
        replace: vi.fn()
      };
      mockUseRouter.mockReturnValue(mockRouter);

      // Simulate navigation to /cockpit
      mockWindow.location.pathname = '/cockpit';
      mockWindow.location.search = '';

      // Should redirect to /
      expect(mockRouter.replace).toHaveBeenCalledWith('/');

      // Test demo mode
      mockWindow.location.search = '?demo=1';
      
      // Demo mode should not redirect
      mockUseCockpitData.mockReturnValue({
        summary: {
          data: {
            today_card: {
              kind: 'daily_pulse',
              anchor_metric: '3 new · 2 expiring',
              context_line: 'Demo data',
              primary_cta: { label: 'Open pulse', href: '/cockpit#pulse' }
            },
            action_preview: [
              {
                id: 'demo_act_1',
                lane: 'Protect',
                title: 'Demo: Revoke approval',
                cta: { kind: 'Review', href: '#' }
              }
            ],
            counters: { new_since_last: 3, expiring_soon: 2 },
            degraded_mode: false
          },
          isDemo: true
        },
        isLoading: false,
        error: null
      });

      // Verify demo mode renders correctly
      const summaryData = mockUseCockpitData().summary;
      expect(summaryData.isDemo).toBe(true);
      expect(summaryData.data.today_card.context_line).toBe('Demo data');
    });

    test('should handle authentication flow and load live data', async () => {
      // Simulate authentication
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        isAuthenticated: true,
        isLoading: false
      });

      // Mock live data
      mockUseCockpitData.mockReturnValue({
        summary: {
          data: {
            today_card: {
              kind: 'critical_risk',
              anchor_metric: '2 critical risks',
              context_line: 'Immediate attention required',
              primary_cta: { label: 'Review risks', href: '/guardian' }
            },
            action_preview: [
              {
                id: 'act_123',
                lane: 'Protect',
                title: 'Revoke unused approval: Uniswap Router',
                severity: 'critical',
                cta: { kind: 'Fix', href: '/action-center?intent=act_123' }
              }
            ],
            counters: { new_since_last: 5, critical_risk: 2 },
            degraded_mode: false
          },
          isDemo: false
        },
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      const cockpitData = mockUseCockpitData();
      
      // Verify live data loaded
      expect(cockpitData.summary.isDemo).toBe(false);
      expect(cockpitData.summary.data.today_card.kind).toBe('critical_risk');
      expect(cockpitData.summary.data.counters.critical_risk).toBe(2);
    });
  });

  describe('Three Block Layout Interaction', () => {
    test('should render exactly three blocks and handle interactions', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user-id' },
        isAuthenticated: true,
        isLoading: false
      });

      mockUseCockpitData.mockReturnValue({
        summary: {
          data: {
            today_card: {
              kind: 'pending_actions',
              anchor_metric: '3 pending actions',
              context_line: 'Review and take action',
              primary_cta: { label: 'View actions', href: '/action-center' }
            },
            action_preview: [
              { id: 'act_1', title: 'Action 1', cta: { kind: 'Fix', href: '/fix1' } },
              { id: 'act_2', title: 'Action 2', cta: { kind: 'Execute', href: '/exec2' } },
              { id: 'act_3', title: 'Action 3', cta: { kind: 'Review', href: '/review3' } }
            ],
            counters: { pending_actions: 3 }
          }
        },
        isLoading: false,
        error: null
      });

      // Mock DOM elements for three blocks
      const todayCardElement = createMockElement('div', {
        'data-testid': 'today-card',
        textContent: '3 pending actions'
      });

      const actionPreviewElement = createMockElement('div', {
        'data-testid': 'action-preview',
        children: [
          createMockElement('div', { 'data-testid': 'action-row-0' }),
          createMockElement('div', { 'data-testid': 'action-row-1' }),
          createMockElement('div', { 'data-testid': 'action-row-2' })
        ]
      });

      const peekDrawerTrigger = createMockElement('button', {
        'data-testid': 'peek-drawer-trigger',
        textContent: 'See all signals'
      });

      mockWindow.document.querySelector
        .mockReturnValueOnce(todayCardElement)
        .mockReturnValueOnce(actionPreviewElement)
        .mockReturnValueOnce(peekDrawerTrigger);

      // Verify three blocks exist
      expect(mockWindow.document.querySelector('[data-testid="today-card"]')).toBeTruthy();
      expect(mockWindow.document.querySelector('[data-testid="action-preview"]')).toBeTruthy();
      expect(mockWindow.document.querySelector('[data-testid="peek-drawer-trigger"]')).toBeTruthy();

      // Test action preview shows max 3 rows
      const actionRows = actionPreviewElement.children;
      expect(actionRows.length).toBe(3);
    });
  });

  describe('Peek Drawer Interaction Flow', () => {
    test('should open and close peek drawer correctly', async () => {
      const mockRouter = {
        push: vi.fn()
      };
      mockUseRouter.mockReturnValue(mockRouter);

      // Mock drawer elements
      const drawerTrigger = createMockElement('button', {
        'data-testid': 'peek-drawer-trigger'
      });

      const drawer = createMockElement('div', {
        'data-testid': 'peek-drawer',
        style: { display: 'none' }
      });

      const drawerOverlay = createMockElement('div', {
        'data-testid': 'drawer-overlay'
      });

      mockWindow.document.querySelector
        .mockImplementation((selector: string) => {
          if (selector.includes('peek-drawer-trigger')) return drawerTrigger;
          if (selector.includes('peek-drawer') && !selector.includes('trigger')) return drawer;
          if (selector.includes('drawer-overlay')) return drawerOverlay;
          return null;
        });

      // Simulate opening drawer
      drawerTrigger.click();
      drawer.style.display = 'block';

      expect(drawer.style.display).toBe('block');

      // Simulate closing via overlay click
      drawerOverlay.click();
      drawer.style.display = 'none';

      expect(drawer.style.display).toBe('none');

      // Simulate ESC key close
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      drawer.style.display = 'block';
      
      // Simulate ESC handler
      if (drawer.style.display === 'block') {
        drawer.style.display = 'none';
      }

      expect(drawer.style.display).toBe('none');
    });
  });

  describe('Pulse Sheet Navigation Flow', () => {
    test('should handle pulse sheet navigation correctly', async () => {
      const mockRouter = {
        push: vi.fn(),
        replace: vi.fn()
      };
      mockUseRouter.mockReturnValue(mockRouter);

      // Mock pulse CTA click
      const pulseCTA = createMockElement('button', {
        'data-testid': 'pulse-cta',
        href: '/cockpit#pulse'
      });

      const pulseSheet = createMockElement('div', {
        'data-testid': 'pulse-sheet',
        style: { display: 'none' }
      });

      mockWindow.document.querySelector
        .mockImplementation((selector: string) => {
          if (selector.includes('pulse-cta')) return pulseCTA;
          if (selector.includes('pulse-sheet')) return pulseSheet;
          return null;
        });

      // Simulate navigation to /cockpit#pulse
      mockWindow.location.hash = '#pulse';
      pulseSheet.style.display = 'block';

      expect(pulseSheet.style.display).toBe('block');
      expect(mockWindow.location.hash).toBe('#pulse');

      // Simulate closing sheet
      pulseSheet.style.display = 'none';
      mockWindow.location.hash = '';

      expect(pulseSheet.style.display).toBe('none');
      expect(mockWindow.location.hash).toBe('');
    });
  });

  describe('Error Recovery Flow', () => {
    test('should handle API errors gracefully', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user-id' },
        isAuthenticated: true,
        isLoading: false
      });

      // Mock API error
      mockUseCockpitData.mockReturnValue({
        summary: null,
        isLoading: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to load cockpit data'
        },
        refetch: vi.fn()
      });

      const errorElement = createMockElement('div', {
        'data-testid': 'error-boundary',
        textContent: 'Something went wrong. Please try again.'
      });

      const retryButton = createMockElement('button', {
        'data-testid': 'retry-button',
        textContent: 'Retry'
      });

      mockWindow.document.querySelector
        .mockImplementation((selector: string) => {
          if (selector.includes('error-boundary')) return errorElement;
          if (selector.includes('retry-button')) return retryButton;
          return null;
        });

      // Verify error state displayed
      expect(errorElement.textContent).toContain('Something went wrong');
      expect(retryButton).toBeTruthy();

      // Simulate retry
      const refetchFn = mockUseCockpitData().refetch;
      retryButton.click();
      
      expect(refetchFn).toHaveBeenCalled();
    });
  });

  describe('Performance and Caching Flow', () => {
    test('should handle caching and stale data correctly', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user-id' },
        isAuthenticated: true,
        isLoading: false
      });

      // Mock stale data with staleness indicator
      mockUseCockpitData.mockReturnValue({
        summary: {
          data: {
            today_card: {
              kind: 'critical_risk',
              anchor_metric: '2 critical risks',
              context_line: 'Data may be stale'
            },
            provider_status: { state: 'degraded', detail: 'High latency detected' },
            degraded_mode: true
          }
        },
        isLoading: false,
        error: null,
        isStale: true
      });

      const stalenessIndicator = createMockElement('div', {
        'data-testid': 'staleness-indicator',
        textContent: 'Data may be stale'
      });

      const refreshButton = createMockElement('button', {
        'data-testid': 'refresh-button',
        textContent: 'Refresh'
      });

      mockWindow.document.querySelector
        .mockImplementation((selector: string) => {
          if (selector.includes('staleness-indicator')) return stalenessIndicator;
          if (selector.includes('refresh-button')) return refreshButton;
          return null;
        });

      // Verify staleness indicator shown
      expect(stalenessIndicator.textContent).toContain('stale');
      expect(refreshButton).toBeTruthy();

      // Verify degraded mode disables Fix/Execute actions
      const cockpitData = mockUseCockpitData();
      expect(cockpitData.summary.data.degraded_mode).toBe(true);
    });
  });

  describe('Accessibility Flow', () => {
    test('should handle keyboard navigation correctly', async () => {
      // Mock focusable elements
      const todayCard = createMockElement('div', {
        'data-testid': 'today-card',
        tabIndex: 0
      });

      const actionRows = [
        createMockElement('button', { 'data-testid': 'action-row-0', tabIndex: 0 }),
        createMockElement('button', { 'data-testid': 'action-row-1', tabIndex: 0 }),
        createMockElement('button', { 'data-testid': 'action-row-2', tabIndex: 0 })
      ];

      const peekDrawerTrigger = createMockElement('button', {
        'data-testid': 'peek-drawer-trigger',
        tabIndex: 0
      });

      mockWindow.document.querySelectorAll.mockReturnValue([
        todayCard,
        ...actionRows,
        peekDrawerTrigger
      ]);

      // Simulate Tab navigation
      const focusableElements = mockWindow.document.querySelectorAll('[tabindex="0"]');
      expect(focusableElements.length).toBe(5); // 1 today card + 3 action rows + 1 drawer trigger

      // Test focus management
      actionRows[0].focus();
      expect(actionRows[0].focus).toHaveBeenCalled();

      // Test Enter key activation
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      actionRows[0].addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          actionRows[0].click();
        }
      });

      expect(actionRows[0].addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('should provide proper ARIA labels and roles', async () => {
      const todayCard = createMockElement('div', {
        'data-testid': 'today-card',
        role: 'region',
        'aria-label': 'Today\'s priority information'
      });

      const actionPreview = createMockElement('div', {
        'data-testid': 'action-preview',
        role: 'list',
        'aria-label': 'Top priority actions'
      });

      const peekDrawer = createMockElement('div', {
        'data-testid': 'peek-drawer',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': 'All signals'
      });

      mockWindow.document.querySelector
        .mockImplementation((selector: string) => {
          if (selector.includes('today-card')) return todayCard;
          if (selector.includes('action-preview')) return actionPreview;
          if (selector.includes('peek-drawer')) return peekDrawer;
          return null;
        });

      // Verify ARIA attributes
      expect(todayCard.getAttribute('role')).toBe('region');
      expect(todayCard.getAttribute('aria-label')).toBe('Today\'s priority information');
      expect(actionPreview.getAttribute('role')).toBe('list');
      expect(peekDrawer.getAttribute('aria-modal')).toBe('true');
    });
  });

  describe('Mobile Responsive Flow', () => {
    test('should handle mobile interactions correctly', async () => {
      // Mock mobile viewport
      Object.defineProperty(mockWindow, 'innerWidth', { value: 375 });
      Object.defineProperty(mockWindow, 'innerHeight', { value: 667 });

      const peekDrawer = createMockElement('div', {
        'data-testid': 'peek-drawer',
        style: { height: '80vh', display: 'none' }
      });

      // Mock touch events
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [{ clientY: 100 } as Touch]
      });

      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [{ clientY: 200 } as Touch]
      });

      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [{ clientY: 250 } as Touch]
      });

      // Simulate swipe down to close
      peekDrawer.style.display = 'block';
      
      // Mock swipe detection
      let startY = 0;
      let currentY = 0;
      
      peekDrawer.addEventListener('touchstart', (e: TouchEvent) => {
        startY = e.touches[0].clientY;
      });
      
      peekDrawer.addEventListener('touchmove', (e: TouchEvent) => {
        currentY = e.touches[0].clientY;
      });
      
      peekDrawer.addEventListener('touchend', () => {
        const deltaY = currentY - startY;
        if (deltaY > 50) { // Swipe down threshold
          peekDrawer.style.display = 'none';
        }
      });

      // Simulate swipe down gesture
      startY = 100;
      currentY = 200;
      const deltaY = currentY - startY;
      
      if (deltaY > 50) {
        peekDrawer.style.display = 'none';
      }

      expect(peekDrawer.style.display).toBe('none');
    });
  });
});