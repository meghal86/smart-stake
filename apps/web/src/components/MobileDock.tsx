'use client';

import { useEffect, useState } from 'react';
import { useActiveSection } from '../hooks/useActiveSection';
import { usePWAPrompt } from '../hooks/usePWAPrompt';
import { useAlertsUnread, AlertItem } from '../hooks/useAlertsUnread';
import { triggerHaptic } from '../utils/haptics';

interface MobileDockProps {
  alerts?: AlertItem[];
  modalOpen?: boolean;
}

export default function MobileDock({ alerts = [], modalOpen = false }: MobileDockProps) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const activeSection = useActiveSection(['spotlight', 'for-you', 'alerts']);
  const { showPrompt, installPWA, dismissPrompt } = usePWAPrompt();
  const { unread, markAlertsViewed } = useAlertsUnread(alerts);

  useEffect(() => {
    // Hide dock when soft keyboard opens (iOS/Android)
    if (window.visualViewport) {
      const vv = window.visualViewport;
      const onResize = () => setKeyboardOpen(vv.height < window.innerHeight - 80);
      vv.addEventListener('resize', onResize);
      onResize();
      return () => vv.removeEventListener('resize', onResize);
    }
  }, []);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 88;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleDockAction = (action: string, callback: () => void) => {
    triggerHaptic();
    
    // Emit telemetry
    if (typeof window !== 'undefined' && (window as any).track) {
      (window as any).track(`dock_${action}`);
    }
    
    callback();
  };

  const openAlerts = () => {
    scrollToId('alerts');
    markAlertsViewed();
  };

  const goUpgrade = () => {
    window.location.assign('/upgrade');
  };

  return (
    <div
      data-testid="mobile-dock"
      role="navigation"
      aria-label="Quick actions"
      className={`
        fixed inset-x-0 bottom-0 md:hidden
        z-50 pointer-events-none
        transition-all duration-300
        ${keyboardOpen || modalOpen ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'}
      `}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto mb-0 max-w-screen-sm pointer-events-auto">
        {/* PWA Prompt */}
        {showPrompt && (
          <div className="mb-2 mx-3 bg-blue-600 text-white text-xs px-3 py-2 rounded-lg flex items-center justify-between">
            <span>Add to Home Screen</span>
            <div className="flex gap-2">
              <button onClick={installPWA} className="text-white underline">Add</button>
              <button onClick={dismissPrompt} className="text-white/70">×</button>
            </div>
          </div>
        )}
        
        {/* Dock */}
        <div className="rounded-t-2xl shadow-lg backdrop-blur-md bg-slate-900/80 border-t border-white/10 grid grid-cols-4 gap-1 px-3 py-2">
          <DockBtn 
            label="Spotlight" 
            active={activeSection === 'spotlight'}
            onClick={() => handleDockAction('spotlight', () => scrollToId('spotlight'))} 
          />
          <DockBtn 
            label="Watchlist" 
            active={activeSection === 'for-you'}
            onClick={() => handleDockAction('watchlist', () => scrollToId('for-you'))} 
          />
          <DockBtn 
            label="Alerts" 
            active={activeSection === 'alerts'}
            badgeCount={unread}
            onClick={() => handleDockAction('alerts', openAlerts)} 
          />
          <DockBtn 
            label="Upgrade" 
            variant="primary" 
            onClick={() => handleDockAction('upgrade', goUpgrade)} 
          />
        </div>
      </div>
    </div>
  );
}

function DockBtn({ 
  label, 
  onClick, 
  variant = 'ghost',
  active = false,
  badgeCount = 0
}: {
  label: string; 
  onClick: () => void; 
  variant?: 'ghost' | 'primary';
  active?: boolean;
  badgeCount?: number;
}) {
  return (
    <button
      type="button"
      aria-label={badgeCount > 0 ? `${label} (${badgeCount} unread)` : label}
      className={[
        "h-11 w-full min-w-[44px] min-h-[44px] rounded-xl text-sm relative",
        variant === 'primary' 
          ? "bg-teal-500 text-slate-900 font-semibold" 
          : active
            ? "bg-white/20 text-white"
            : "bg-white/5 text-slate-200"
      ].join(" ")}
      onClick={onClick}
    >
      {label}
      {badgeCount > 0 && (
        <span
          aria-label={`${badgeCount} unread`}
          className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center
                     h-4 min-w-[16px] px-1 rounded-full text-[10px] font-semibold
                     bg-teal-400 text-slate-900 shadow"
        >
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}
    </button>
  );
}