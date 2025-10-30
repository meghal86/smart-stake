import { 
  Home, 
  Activity, 
  Compass, 
  Shield, 
  Briefcase,
  Waves,
  User
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function FooterNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');

  const navItems = [
    { href: '/hub', icon: Home, path: '/hub' },
    { href: '/hub2/pulse', icon: Activity, path: '/hub2/pulse' },
    { href: '/guardian', icon: Shield, path: '/guardian' },
    { href: '/hunter', icon: Compass, path: '/hunter' },
    { href: '/whale-alert', icon: Waves, path: '/whale-alert' },
    { href: '/portfolio', icon: Briefcase, path: '/portfolio' },
    { href: '/settings', icon: User, path: '/settings' }
  ];

  return (
    <footer className="fixed bottom-0 w-full h-[72px] z-40">
      <div className="backdrop-blur-md bg-[rgba(255,255,255,0.7)] dark:bg-[rgba(16,18,30,0.8)] border-t border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)]" style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}>
        <nav className="flex justify-around items-center h-full px-4 text-gray-500 dark:text-gray-300 max-w-screen-xl mx-auto">
          {navItems.map(({ href, icon: Icon, path }) => {
            const active = isActive(path);
            return (
              <a 
                key={href}
                href={href} 
                className={`flex items-center justify-center transition-all duration-200 flex-1 py-3 ${
                  active ? 'text-white' : 'hover:text-white'
                }`}
              >
                <div className={`p-3 rounded-xl transition-all duration-200 ${
                  active 
                    ? 'bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] shadow-lg' 
                    : 'hover:bg-white/10'
                }`} 
                style={active ? { boxShadow: '0 0 20px rgba(0, 201, 167, 0.4)' } : {}}>
                  <Icon className={`w-6 h-6 ${active ? 'stroke-white' : ''}`} />
                </div>
              </a>
            );
          })}
        </nav>
      </div>
    </footer>
  );
}