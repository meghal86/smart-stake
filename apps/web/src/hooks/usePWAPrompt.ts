'use client';

import { useState, useEffect } from 'react';

export function usePWAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already dismissed recently
    const dismissed = localStorage.getItem('alpha/pwa-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (dismissedTime > sevenDaysAgo) return;
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if ((window.navigator as any).standalone) return; // iOS

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show if PWA-capable
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && !dismissed) {
      setTimeout(() => setShowPrompt(true), 3000); // Delay for iOS
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('alpha/pwa-dismissed', Date.now().toString());
  };

  return { showPrompt, installPWA, dismissPrompt };
}