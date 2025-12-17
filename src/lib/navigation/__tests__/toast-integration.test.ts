/**
 * Tests for toast integration with NavigationRouter
 * 
 * Requirements: R1.ROUTING.INVALID_PARAMS
 * Design: Navigation Architecture → Route Canonicalization & Enforcement
 */

import { describe, test, expect, vi } from 'vitest';
import { NavigationRouter } from '../NavigationRouter';

describe('NavigationRouter Toast Integration', () => {
  test('should call showToast with correct message for invalid guardian tab', () => {
    const mockNavigate = vi.fn();
    const mockShowToast = vi.fn();

    NavigationRouter.navigateToPath('/guardian?tab=invalid', mockNavigate, mockShowToast);

    expect(mockShowToast).toHaveBeenCalledWith('Invalid tab "invalid" for guardian — showing scan');
    expect(mockNavigate).toHaveBeenCalledWith('/guardian?tab=scan');
  });

  test('should call showToast with correct message for invalid hunter tab', () => {
    const mockNavigate = vi.fn();
    const mockShowToast = vi.fn();

    NavigationRouter.navigateToPath('/hunter?tab=badtab', mockNavigate, mockShowToast);

    expect(mockShowToast).toHaveBeenCalledWith('Invalid tab "badtab" for hunter — showing all');
    expect(mockNavigate).toHaveBeenCalledWith('/hunter?tab=all');
  });

  test('should not call showToast for valid tabs', () => {
    const mockNavigate = vi.fn();
    const mockShowToast = vi.fn();

    NavigationRouter.navigateToPath('/guardian?tab=scan', mockNavigate, mockShowToast);

    expect(mockShowToast).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/guardian?tab=scan');
  });

  test('should call showToast for completely invalid routes', () => {
    const mockNavigate = vi.fn();
    const mockShowToast = vi.fn();

    NavigationRouter.navigateToPath('/nonexistent', mockNavigate, mockShowToast);

    expect(mockShowToast).toHaveBeenCalledWith('Invalid route: /nonexistent');
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('should handle empty tab parameter correctly', () => {
    const mockNavigate = vi.fn();
    const mockShowToast = vi.fn();

    // Empty tab parameter should be treated as valid (no tab specified)
    NavigationRouter.navigateToPath('/guardian?tab=', mockNavigate, mockShowToast);

    expect(mockShowToast).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/guardian?tab=');
  });

  test('should handle multiple invalid parameters gracefully', () => {
    const mockNavigate = vi.fn();
    const mockShowToast = vi.fn();

    NavigationRouter.navigateToPath('/guardian?tab=invalid&other=param', mockNavigate, mockShowToast);

    expect(mockShowToast).toHaveBeenCalledWith('Invalid tab "invalid" for guardian — showing scan');
    expect(mockNavigate).toHaveBeenCalledWith('/guardian?tab=scan');
  });

  test('should work without showToast callback', () => {
    const mockNavigate = vi.fn();

    // Should not crash when showToast is not provided
    expect(() => {
      NavigationRouter.navigateToPath('/guardian?tab=invalid', mockNavigate);
    }).not.toThrow();

    expect(mockNavigate).toHaveBeenCalledWith('/guardian?tab=scan');
  });
});