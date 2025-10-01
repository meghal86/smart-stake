'use client';

import { useState, useEffect } from 'react';

interface BrownoutBannerProps {
  healthStatus?: 'live' | 'cached' | 'simulated';
}

export default function BrownoutBanner({ healthStatus }: BrownoutBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('live');

  useEffect(() => {
    // Check health status periodically
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/healthz');
        const data = await response.json();
        setCurrentStatus(data.mode || 'live');
      } catch (error) {
        setCurrentStatus('simulated');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Reset dismissal when status changes
    if (currentStatus !== 'live') {
      setIsDismissed(false);
    }
  }, [currentStatus]);

  const shouldShow = (currentStatus === 'cached' || currentStatus === 'simulated') && !isDismissed;

  if (!shouldShow) return null;

  const bannerConfig = {
    cached: {
      bg: 'bg-yellow-600',
      text: 'Provider degraded — showing cached data.',
      icon: '⚠️'
    },
    simulated: {
      bg: 'bg-orange-600',
      text: 'Provider degraded — showing simulated data.',
      icon: '🔄'
    }
  };

  const config = bannerConfig[currentStatus as keyof typeof bannerConfig] || bannerConfig.simulated;

  return (
    <div className={`${config.bg} text-white px-4 py-2 text-sm flex items-center justify-between z-30 relative`}>
      <div className="flex items-center gap-2">
        <span>{config.icon}</span>
        <span>{config.text}</span>
        <a 
          href="/status" 
          className="underline hover:no-underline ml-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          View Status
        </a>
      </div>
      <button
        onClick={() => setIsDismissed(true)}
        className="text-white/80 hover:text-white text-lg leading-none"
        aria-label="Dismiss banner"
      >
        ×
      </button>
    </div>
  );
}