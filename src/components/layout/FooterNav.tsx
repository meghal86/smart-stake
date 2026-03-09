import React, { useEffect } from 'react';
import { 
  Home, 
  // Activity, 
  Compass, 
  Shield, 
  Briefcase,
  // Waves,
  // User,
  Leaf
} from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { NavigationRouter } from '@/lib/navigation/NavigationRouter';

/**
 * Unified FooterNav Component for AlphaWhale
 * 
 * Displays persistent navigation to 5 sections:
 * - Home (dashboard/landing page)
 * - Guardian (security scanning)
 * - Hunter (opportunity discovery)
 * - HarvestPro (tax-loss harvesting)
 * - Portfolio (portfolio tracking)
 * 
 * Features:
 * - Active route highlighting with gradient
 * - Fixed positioning on mobile
 * - Touch targets ≥44px for accessibility
 * - Keyboard navigation support
 * - Glassmorphism design
 * 
 * Used across: All major feature pages
 */
interface FooterNavProps {
  currentRoute?: string;
}

export function FooterNav({ currentRoute }: FooterNavProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = currentRoute || (location.pathname + location.search);

  // Initialize browser navigation handling - Requirement R9.NAV.BROWSER_SYNC
  useEffect(() => {
    NavigationRouter.initializeBrowserNavigation(navigate);
  }, [navigate]);

  // Use NavigationRouter for consistent active state detection
  const isActive = (path: string) => {
    const currentPathname = currentPath.split('?')[0];

    if (path === '/portfolio' && currentPathname.startsWith('/portfolio')) {
      return true;
    }

    if (path === '/settings' && currentPathname.startsWith('/settings')) {
      return true;
    }

    const currentRoute = NavigationRouter.canonicalize(currentPath);
    const targetRoute = NavigationRouter.canonicalize(path);
    return currentRoute.id === targetRoute.id;
  };

  const navItems = [
    { 
      href: '/', 
      icon: Home, 
      path: '/',
      label: 'Home',
      ariaLabel: 'Navigate to Home dashboard'
    },
    { 
      href: '/guardian', 
      icon: Shield, 
      path: '/guardian',
      label: 'Guardian',
      ariaLabel: 'Navigate to Guardian security scanner'
    },
    { 
      href: '/hunter', 
      icon: Compass, 
      path: '/hunter',
      label: 'Hunter',
      ariaLabel: 'Navigate to Hunter opportunities'
    },
    { 
      href: '/harvestpro', 
      icon: Leaf, 
      path: '/harvestpro',
      label: 'Harvest',
      ariaLabel: 'Navigate to Harvest tax optimization'
    },
    { 
      href: '/portfolio', 
      icon: Briefcase, 
      path: '/portfolio',
      label: 'Portfolio',
      ariaLabel: 'Navigate to Portfolio tracker'
    }
    // COMMENTED OUT - Can be restored later if needed
    // { 
    //   href: '/hub', 
    //   icon: Home, 
    //   path: '/hub',
    //   label: 'Hub',
    //   ariaLabel: 'Navigate to Hub'
    // },
    // { 
    //   href: '/hub2/pulse', 
    //   icon: Activity, 
    //   path: '/hub2/pulse',
    //   label: 'Pulse',
    //   ariaLabel: 'Navigate to Pulse'
    // },
    // { 
    //   href: '/whale-alert', 
    //   icon: Waves, 
    //   path: '/whale-alert',
    //   label: 'Whale Alert',
    //   ariaLabel: 'Navigate to Whale Alert'
    // },
    // { 
    //   href: '/settings', 
    //   icon: User, 
    //   path: '/settings',
    //   label: 'Settings',
    //   ariaLabel: 'Navigate to Settings'
    // }
  ];

  return (
    <footer 
      className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-2"
      role="navigation"
      aria-label="Main navigation"
    >
      <div
        className="mx-auto max-w-screen-md rounded-[28px] border border-black/10 bg-[rgba(245,243,238,0.92)] shadow-[0_16px_48px_rgba(0,0,0,0.08)] backdrop-blur-xl ring-1 ring-black/[0.04] dark:border-white/8 dark:bg-[rgba(8,8,8,0.92)] dark:ring-white/[0.05]"
        style={{ boxShadow: '0 -8px 32px rgba(0,0,0,0.10)' }}
      >
        <nav className="flex items-center justify-around px-2 py-2 text-[#7f7a72] dark:text-[#8f8a82]">
          {navItems.map(({ href, icon: Icon, path, label, ariaLabel }) => {
            const active = isActive(path);
            return (
              <Link 
                key={href}
                to={href}
                aria-label={ariaLabel}
                aria-current={active ? 'page' : undefined}
                className={`
                  relative flex flex-1 flex-col items-center justify-center rounded-[20px]
                  px-2 py-2.5
                  transition-all duration-150 ease-out
                  min-h-[44px] min-w-[44px]
                  focus:outline-none focus:ring-2 focus:ring-[#6c8ed6] focus:ring-offset-2 focus:ring-offset-[#f5f3ee] dark:focus:ring-offset-[#080808]
                  ${active 
                    ? 'bg-[#111111] text-[#f6f2ea] shadow-[0_10px_30px_rgba(0,0,0,0.22)] dark:bg-[#111111] dark:text-[#f6f2ea]'
                    : 'text-[#7f7a72] hover:bg-black/[0.04] hover:text-[#111111] dark:text-[#8f8a82] dark:hover:bg-white/[0.04] dark:hover:text-[#f6f2ea]'
                  }
                `}
              >
                {active && (
                  <div 
                    className="absolute left-1/2 top-1 h-1 w-8 -translate-x-1/2 rounded-full bg-[#7ea3f2]"
                    aria-hidden="true"
                  />
                )}
                
                <div 
                  className={`
                    rounded-2xl p-2.5 transition-all duration-150 ease-out
                    ${active 
                      ? 'bg-white/[0.08] dark:bg-white/[0.05]' 
                      : 'bg-transparent'
                    }
                  `}
                >
                  <Icon 
                    className={`w-6 h-6 transition-all duration-150 ease-out ${
                      active 
                        ? 'stroke-[#f6f2ea]' 
                        : 'stroke-current'
                    }`}
                    aria-hidden="true"
                  />
                </div>
                
                <span 
                  className={`
                    mt-1 text-[11px] tracking-[0.12em] uppercase transition-all duration-150 ease-out
                    ${active 
                      ? 'font-semibold text-[#f6f2ea]' 
                      : 'font-medium text-[#7f7a72] dark:text-[#8f8a82]'
                    }
                  `}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </footer>
  );
}
