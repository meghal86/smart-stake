import React from 'react';
import { Shield, Compass, Leaf, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface FooterNavProps {
  currentRoute?: string;
}

/**
 * FooterNav Component for AlphaWhale Home Page
 * 
 * Displays persistent navigation to core features:
 * - Guardian (security)
 * - Hunter (opportunities)
 * - Harvest (tax optimization)
 * - Settings (user preferences)
 * 
 * Features:
 * - Active route highlighting with cyan color
 * - Fixed positioning on mobile
 * - Touch targets ≥44px for accessibility
 * - Keyboard navigation support
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export const FooterNav = ({ currentRoute }: FooterNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use provided currentRoute or fall back to location.pathname
  const pathname = currentRoute || location.pathname;
  
  const navItems = [
    {
      id: 'guardian',
      icon: Shield,
      label: 'Guardian',
      route: '/guardian',
      ariaLabel: 'Navigate to Guardian security scanner',
    },
    {
      id: 'hunter',
      icon: Compass,
      label: 'Hunter',
      route: '/hunter',
      ariaLabel: 'Navigate to Hunter opportunities',
    },
    {
      id: 'harvest',
      icon: Leaf,
      label: 'Harvest',
      route: '/harvest',
      ariaLabel: 'Navigate to Harvest tax optimization',
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      route: '/settings',
      ariaLabel: 'Navigate to Settings',
    },
  ];
  
  const isActive = (route: string) => {
    return pathname === route || pathname.startsWith(`${route}/`);
  };
  
  const handleNavigation = (route: string) => {
    navigate(route);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent, route: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNavigation(route);
    }
  };
  
  return (
    <footer 
      className="fixed bottom-0 left-0 right-0 z-50 md:relative md:bottom-auto"
      role="navigation"
      aria-label="Main navigation"
    >
      <nav className="
        bg-slate-900/95 
        backdrop-blur-md 
        border-t border-white/10
        h-16
        flex items-center justify-around
        px-4
      ">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.route);
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.route)}
              onKeyDown={(e) => handleKeyDown(e, item.route)}
              aria-label={item.ariaLabel}
              aria-current={active ? 'page' : undefined}
              className={`
                flex flex-col items-center justify-center
                min-h-[44px] min-w-[44px]
                px-3 py-2
                rounded-lg
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900
                ${active 
                  ? 'text-cyan-400' 
                  : 'text-gray-400 hover:text-gray-200'
                }
              `}
            >
              <Icon 
                className={`
                  w-6 h-6
                  ${active ? 'stroke-[2.5]' : 'stroke-2'}
                `}
                aria-hidden="true"
              />
              <span 
                className={`
                  text-xs mt-1 font-medium
                  ${active ? 'text-cyan-400' : 'text-gray-400'}
                `}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </footer>
  );
};
