/**
 * Hub2 Footer - Consistent footer across all Hub2 pages
 * Matches the design pattern from Guardian with Hub2 specific navigation
 */
import { forwardRef, HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Search, 
  Bell, 
  Star, 
  Bot, 
  Zap, 
  Home,
  Briefcase,
  Radar,
  Shield,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export interface Hub2FooterProps extends HTMLAttributes<HTMLElement> {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const navItems = [
  { id: 'pulse', label: 'Pulse', icon: Activity, path: '/hub2/pulse' },
  { id: 'explore', label: 'Explore', icon: Search, path: '/hub2/explore' },
  { id: 'watchlist', label: 'Watch', icon: Star, path: '/hub2/watchlist', requiresAuth: true },
  { id: 'alerts', label: 'Alerts', icon: Bell, path: '/hub2/alerts', requiresAuth: true },
  { id: 'copilot', label: 'AI', icon: Bot, path: '/hub2/copilot' },
];

const quickActions = [
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase, path: '/portfolio-enhanced' },
  { id: 'scanner', label: 'Scanner', icon: Radar, path: '/scanner' },
  { id: 'guardian', label: 'Guardian', icon: Shield, path: '/guardian' },
  { id: 'hunter', label: 'Hunter', icon: Target, path: '/hunter' },
];

export const Hub2Footer = forwardRef<HTMLElement, Hub2FooterProps>(
  ({ className, activeSection, onSectionChange, ...props }, ref) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const getActiveSection = () => {
      const path = location.pathname;
      if (path.startsWith('/hub2/pulse')) return 'pulse';
      if (path.startsWith('/hub2/explore')) return 'explore';
      if (path.startsWith('/hub2/watchlist')) return 'watchlist';
      if (path.startsWith('/hub2/alerts')) return 'alerts';
      if (path.startsWith('/hub2/copilot')) return 'copilot';
      return activeSection || 'pulse';
    };

    const currentSection = getActiveSection();

    const handleNavClick = (item: typeof navItems[0]) => {
      if (item.requiresAuth && !user) {
        navigate('/login');
        return;
      }
      
      navigate(item.path);
      onSectionChange?.(item.id);
    };

    return (
      <motion.footer
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'border-t border-white/10',
          'bg-background/95 backdrop-blur-xl',
          className
        )}
        {...props}
      >
        {/* Main Navigation */}
        <div className="flex items-center justify-around px-2 py-2">
          {/* Back to Main App */}
          <motion.button
            onClick={() => navigate('/')}
            className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            whileTap={{ scale: 0.95 }}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">Main</span>
          </motion.button>

          {/* Hub2 Navigation Items */}
          {navItems.map((item) => {
            const isActive = currentSection === item.id;
            const Icon = item.icon;
            const disabled = item.requiresAuth && !user;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavClick(item)}
                disabled={disabled}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 relative',
                  isActive
                    ? 'text-primary bg-primary/10 scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: disabled ? 1 : 1.05 }}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="hub2-active-footer"
                      className="absolute inset-0 rounded-full border-2 border-primary/70 -m-2"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  {/* Auth required indicator */}
                  {item.requiresAuth && !user && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Quick Actions Bar */}
        <div className="border-t border-white/5 bg-muted/20 px-4 py-2">
          <div className="flex items-center justify-around">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  onClick={() => navigate(action.path)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="h-4 w-4" />
                  <span>{action.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Hub2 Indicator */}
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
          <motion.div
            className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <Zap className="w-3 h-3" />
            Hub 2
          </motion.div>
        </div>
      </motion.footer>
    );
  }
);

Hub2Footer.displayName = 'Hub2Footer';

export default Hub2Footer;