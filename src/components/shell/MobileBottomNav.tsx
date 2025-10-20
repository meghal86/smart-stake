import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTier } from "@/hooks/useTier";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Search, 
  Star, 
  Bell, 
  Bot,
  Zap,
  Lock,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    id: 'pulse',
    label: 'Pulse',
    icon: Activity,
    path: '/hub2/pulse',
    shortcut: 'g p'
  },
  {
    id: 'predictions',
    label: 'Predictions',
    icon: Bot,
    path: '/hub2/predictions',
    shortcut: 'g r'
  },
  {
    id: 'predictions',
    label: 'Predictions',
    icon: Zap,
    path: '/hub2/predictions',
    shortcut: 'g r'
  },
  {
    id: 'explore',
    label: 'Explore',
    icon: Search,
    path: '/hub2/explore',
    shortcut: 'g e'
  },
  {
    id: 'watchlist',
    label: 'Watch',
    icon: Star,
    path: '/hub2/watchlist',
    shortcut: 'g w',
    requiresAuth: true
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: Bell,
    path: '/hub2/alerts',
    shortcut: 'g a',
    requiresAuth: true
  }
];

interface MobileBottomNavProps {
  className?: string;
}

export default function MobileBottomNav({ className }: MobileBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { tier, isPremium } = useTier();

  const handleNavClick = (item: typeof navItems[0]) => {
    // Check auth requirements
    if (item.requiresAuth && !user) {
      navigate('/login');
      return;
    }
    
    // Check plan requirements
    if (item.requiresPlan && !isPremium) {
      // Show upgrade modal or redirect to billing
      navigate('/billing');
      return;
    }
    
    navigate(item.path);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50",
      "md:hidden", // Only show on mobile
      className
    )}>
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const disabled = (item.requiresAuth && !user) || (item.requiresPlan && !isPremium);
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => handleNavClick(item)}
              disabled={disabled}
              className={cn(
                "flex flex-col items-center gap-1 h-12 px-2 py-1",
                active && "text-primary",
                disabled && "opacity-50"
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  "w-5 h-5",
                  active && "text-primary"
                )} />
                
                {/* Plan requirement indicator */}
                {item.requiresPlan && !isPremium && (
                  <Crown className="absolute -top-1 -right-1 w-3 h-3 text-yellow-600" />
                )}
                
                {/* Auth requirement indicator */}
                {item.requiresAuth && !user && (
                  <Lock className="absolute -top-1 -right-1 w-3 h-3 text-red-600" />
                )}
              </div>
              
              <span className={cn(
                "text-xs font-medium",
                active && "text-primary"
              )}>
                {item.label}
              </span>
              
              {/* Active indicator */}
              {active && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </Button>
          );
        })}
      </div>
      
      {/* Keyboard shortcuts hint */}
      <div className="px-4 py-2 border-t border-border/50 bg-muted/30">
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>Press</span>
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">g</kbd>
            <span>+ key for shortcuts</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
