/**
 * Tests for useBrowserNavigation hook
 * 
 * Requirements: R1.ROUTING.DETERMINISTIC, R1.ROUTING.CANONICAL
 * Design: Navigation Architecture → Route Canonicalization & Enforcement
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React, { ReactNode } from 'react';
import { useBrowserNavigation } from '../useBrowserNavigation';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/', search: '' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

// Mock NavigationRouter
vi.mock('@/lib/navigation/NavigationRouter', () => ({
  NavigationRouter: {
    initializeBrowserNavigation: vi.fn(),
    updateCurrentRoute: vi.fn(),
    navigateToCanonical: vi.fn(),
    navigateToPath: vi.fn(),
    getCurrentCanonicalRoute: vi.fn(() => ({
      id: 'home',
      path: '/',
      canonicalUrl: '/'
    })),
  }
}));

import { NavigationRouter } from '@/lib/navigation/NavigationRouter';

const wrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('useBrowserNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('initializes browser navigation on mount', () => {
    const showToast = vi.fn();
    
    renderHook(() => useBrowserNavigation({ showToast }), { wrapper });
    
    expect(NavigationRouter.initializeBrowserNavigation).toHaveBeenCalledWith(
      mockNavigate,
      showToast
    );
    expect(NavigationRouter.updateCurrentRoute).toHaveBeenCalledWith('/');
  });

  test('updates current route when location changes', () => {
    mockLocation.pathname = '/guardian';
    mockLocation.search = '?tab=scan';
    
    renderHook(() => useBrowserNavigation(), { wrapper });
    
    expect(NavigationRouter.updateCurrentRoute).toHaveBeenCalledWith('/guardian?tab=scan');
  });

  test('provides navigateToCanonical function', () => {
    const { result } = renderHook(() => useBrowserNavigation(), { wrapper });
    
    act(() => {
      result.current.navigateToCanonical('guardian');
    });
    
    expect(NavigationRouter.navigateToCanonical).toHaveBeenCalledWith(
      'guardian',
      mockNavigate,
      undefined
    );
  });

  test('provides navigateToPath function', () => {
    const { result } = renderHook(() => useBrowserNavigation(), { wrapper });
    
    act(() => {
      result.current.navigateToPath('/hunter?tab=quests');
    });
    
    expect(NavigationRouter.navigateToPath).toHaveBeenCalledWith(
      '/hunter?tab=quests',
      mockNavigate,
      undefined
    );
  });

  test('provides getCurrentRoute function', () => {
    const { result } = renderHook(() => useBrowserNavigation(), { wrapper });
    
    const currentRoute = result.current.getCurrentRoute();
    
    expect(NavigationRouter.getCurrentCanonicalRoute).toHaveBeenCalled();
    expect(currentRoute).toEqual({
      id: 'home',
      path: '/',
      canonicalUrl: '/'
    });
  });

  test('passes showToast to NavigationRouter methods', () => {
    const showToast = vi.fn();
    const { result } = renderHook(() => useBrowserNavigation({ showToast }), { wrapper });
    
    act(() => {
      result.current.navigateToCanonical('guardian');
    });
    
    expect(NavigationRouter.navigateToCanonical).toHaveBeenCalledWith(
      'guardian',
      mockNavigate,
      showToast
    );
    
    act(() => {
      result.current.navigateToPath('/hunter');
    });
    
    expect(NavigationRouter.navigateToPath).toHaveBeenCalledWith(
      '/hunter',
      mockNavigate,
      showToast
    );
  });
});