'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseHashNavigationOptions {
  targetHash: string; // The hash to listen for (e.g., 'pulse')
  onOpen?: () => void;
  onClose?: () => void;
}

interface UseHashNavigationResult {
  isOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
}

export function useHashNavigation({
  targetHash,
  onOpen,
  onClose,
}: UseHashNavigationOptions): UseHashNavigationResult {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Check if the current hash matches our target
  const checkHash = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.location.hash === `#${targetHash}`;
  }, [targetHash]);

  // Open the sheet and update the hash
  const openSheet = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // Update the hash without triggering a page reload
    const newUrl = `${window.location.pathname}${window.location.search}#${targetHash}`;
    window.history.pushState(null, '', newUrl);
    
    setIsOpen(true);
    onOpen?.();
  }, [targetHash, onOpen]);

  // Close the sheet and remove the hash
  const closeSheet = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // Remove the hash without triggering a page reload
    const newUrl = `${window.location.pathname}${window.location.search}`;
    window.history.pushState(null, '', newUrl);
    
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  // Handle hash changes (browser back/forward, direct navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const shouldBeOpen = checkHash();
      
      if (shouldBeOpen && !isOpen) {
        setIsOpen(true);
        onOpen?.();
      } else if (!shouldBeOpen && isOpen) {
        setIsOpen(false);
        onClose?.();
      }
    };

    // Check initial hash state
    const initiallyOpen = checkHash();
    if (initiallyOpen) {
      setIsOpen(true);
      onOpen?.();
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, [checkHash, isOpen, onOpen, onClose]);

  // Handle browser back button when sheet is open
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (isOpen && !checkHash()) {
        // Sheet was open but hash was removed (back button pressed)
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, checkHash, onClose]);

  return {
    isOpen,
    openSheet,
    closeSheet,
  };
}