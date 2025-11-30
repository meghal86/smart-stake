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
import { useLocation, Link } from 'react-router-dom';

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
export function FooterNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');

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
      label: 'HarvestPro',
      ariaLabel: 'Navigate to HarvestPro tax optimization'
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
      className="fixed bottom-0 w-full h-[72px] z-40"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="backdrop-blur-md bg-[rgba(255,255,255,0.7)] dark:bg-[rgba(16,18,30,0.8)] border-t border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)]" style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}>
        <nav className="flex justify-around items-center h-full px-4 text-gray-500 dark:text-gray-300 max-w-screen-xl mx-auto">
          {navItems.map(({ href, icon: Icon, path, label, ariaLabel }) => {
            const active = isActive(path);
            return (
              <Link 
                key={href}
                to={href}
                aria-label={ariaLabel}
                aria-current={active ? 'page' : undefined}
                className={`
                  flex flex-col items-center justify-center 
                  transition-all duration-200 
                  flex-1 py-2
                  min-h-[44px] min-w-[44px]
                  focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900
                  ${active ? 'text-white' : 'hover:text-white'}
                `}
              >
                <div 
                  className={`
                    p-3 rounded-xl transition-all duration-200 
                    ${active 
                      ? 'bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] shadow-lg' 
                      : 'hover:bg-white/10'
                    }
                  `} 
                  style={active ? { boxShadow: '0 0 20px rgba(0, 201, 167, 0.4)' } : {}}
                >
                  <Icon 
                    className={`w-6 h-6 ${active ? 'stroke-white stroke-2' : ''}`}
                    aria-hidden="true"
                  />
                </div>
                <span 
                  className={`
                    text-xs mt-1 font-medium
                    ${active ? 'text-cyan-400' : 'text-gray-400'}
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