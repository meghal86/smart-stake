/**
 * Integration tests for browser navigation deterministic behavior
 * 
 * Requirements: R1.ROUTING.DETERMINISTIC, R1.ROUTING.CANONICAL
 * Design: Navigation Architecture → Route Canonicalization & Enforcement
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { NavigationRouter } from '../NavigationRouter';

// Mock window.history and location
const mockHistoryReplaceState = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

Object.defineProperty(window, 'history', {
  value: {
    replaceState: mockHistoryReplaceState,
  },
  writable: true,
});

Object.defineProperty(window, 'location', {
  value: {
    pathname: '/',
    search: '',
  },
  writable: true,
});

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
});

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
});

describe('Browser Navigation Integration', () => {
  const mockNavigate = vi.fn();
  const mockShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset NavigationRouter state
    (NavigationRouter as any).isInitialized = false;
    (NavigationRouter as any).currentCanonicalRoute = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('initializes browser navigation event listeners', () => {
    NavigationRouter.initializeBrowserNavigation(mockNavigate, mockShowToast);
    
    expect(mockAddEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
    expect((NavigationRouter as any).isInitialized).toBe(true);
  });

  test('does not initialize twice', () => {
    NavigationRouter.initializeBrowserNavigation(mockNavigate, mockShowToast);
    NavigationRouter.initializeBrowserNavigation(mockNavigate, mockShowToast);
    
    // Should only be called once
    expect(mockAddEventListener).toHaveBeenCalledTimes(1);
  });

  test('handles valid popstate events', () => {
    NavigationRouter.initializeBrowserNavigation(mockNavigate, mockShowToast);
    
    // Get the popstate handler
    const popstateHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'popstate'
    )?.[1];
    
    expect(popstateHandler).toBeDefined();
    
    // Simulate valid route
    window.location.pathname = '/guardian';
    window.location.search = '?tab=scan';
    
    const mockEvent = new PopStateEvent('popstate');
    popstateHandler(mockEvent);
    
    // Should not navigate or show toast for valid route
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockShowToast).not.toHaveBeenCalled();
    expect(mockHistoryReplaceState).not.toHaveBeenCalled();
  });

  test('handles invalid popstate events with canonicalization', () => {
    NavigationRouter.initializeBrowserNavigation(mockNavigate, mockShowToast);
    
    // Get the popstate handler
    const popstateHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'popstate'
    )?.[1];
    
    expect(popstateHandler).toBeDefined();
    
    // Simulate invalid route
    window.location.pathname = '/guardian';
    window.location.search = '?tab=invalid';
    
    const mockEvent = new PopStateEvent('popstate');
    popstateHandler(mockEvent);
    
    // Should canonicalize the route
    expect(mockHistoryReplaceState).toHaveBeenCalledWith(null, '', '/guardian?tab=scan');
    expect(mockNavigate).toHaveBeenCalledWith('/guardian?tab=scan');
    expect(mockShowToast).toHaveBeenCalledWith('Invalid tab "invalid" for guardian — showing scan');
  });

  test('handles invalid path in popstate events', () => {
    NavigationRouter.initializeBrowserNavigation(mockNavigate, mockShowToast);
    
    // Get the popstate handler
    const popstateHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'popstate'
    )?.[1];
    
    expect(popstateHandler).toBeDefined();
    
    // Simulate completely invalid route
    window.location.pathname = '/nonexistent';
    window.location.search = '';
    
    const mockEvent = new PopStateEvent('popstate');
    popstateHandler(mockEvent);
    
    // Should redirect to home
    expect(mockHistoryReplaceState).toHaveBeenCalledWith(null, '', '/');
    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(mockShowToast).toHaveBeenCalledWith('Invalid route: /nonexistent');
  });

  test('updates current route state correctly', () => {
    NavigationRouter.initializeBrowserNavigation(mockNavigate, mockShowToast);
    
    // Initial state should be set
    expect(NavigationRouter.getCurrentCanonicalRoute()).toEqual({
      id: 'home',
      path: '/',
      canonicalUrl: '/'
    });
    
    // Update route
    NavigationRouter.updateCurrentRoute('/hunter?tab=quests');
    
    expect(NavigationRouter.getCurrentCanonicalRoute()).toEqual({
      id: 'hunter',
      path: '/hunter',
      tab: 'quests',
      canonicalUrl: '/hunter?tab=quests'
    });
  });

  test('navigateToPath handles valid paths', () => {
    NavigationRouter.initializeBrowserNavigation(mockNavigate, mockShowToast);
    
    NavigationRouter.navigateToPath('/guardian?tab=risks', mockNavigate, mockShowToast);
    
    expect(mockNavigate).toHaveBeenCalledWith('/guardian?tab=risks');
    expect(mockShowToast).not.toHaveBeenCalled();
    expect(NavigationRouter.getCurrentCanonicalRoute()?.canonicalUrl).toBe('/guardian?tab=risks');
  });

  test('navigateToPath handles invalid paths with canonicalization', () => {
    NavigationRouter.initializeBrowserNavigation(mockNavigate, mockShowToast);
    
    NavigationRouter.navigateToPath('/guardian?tab=invalid', mockNavigate, mockShowToast);
    
    expect(mockNavigate).toHaveBeenCalledWith('/guardian?tab=scan');
    expect(mockShowToast).toHaveBeenCalledWith('Invalid tab "invalid" for guardian — showing scan');
    expect(NavigationRouter.getCurrentCanonicalRoute()?.canonicalUrl).toBe('/guardian?tab=scan');
  });

  test('deterministic behavior - same input produces same output', () => {
    NavigationRouter.initializeBrowserNavigation(mockNavigate, mockShowToast);
    
    // Test multiple calls with same input
    const path = '/hunter?tab=invalid';
    
    NavigationRouter.navigateToPath(path, mockNavigate, mockShowToast);
    const firstResult = NavigationRouter.getCurrentCanonicalRoute();
    
    vi.clearAllMocks();
    
    NavigationRouter.navigateToPath(path, mockNavigate, mockShowToast);
    const secondResult = NavigationRouter.getCurrentCanonicalRoute();
    
    expect(firstResult).toEqual(secondResult);
    expect(mockNavigate).toHaveBeenCalledWith('/hunter?tab=all');
  });
});