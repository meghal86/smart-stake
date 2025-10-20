import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
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
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { id: 'pulse', label: 'Pulse', icon: Activity, path: '/hub2/pulse' },
  { id: 'predictions', label: 'Predictions', icon: Zap, path: '/hub2/predictions' },
  { id: 'explore', label: 'Explore', icon: Search, path: '/hub2/explore' },
  { id: 'alerts', label: 'Alerts', icon: Bell, path: '/hub2/alerts' },
  { id: 'watchlist', label: 'Watch', icon: Star, path: '/hub2/watchlist' },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase, path: '/portfolio-enhanced' },
  { id: 'scanner', label: 'Scanner', icon: Radar, path: '/scanner' },
  { id: 'guardian', label: 'Guardian', icon: Shield, path: '/guardian' },
  { id: 'copilot', label: 'AI', icon: Bot, path: '/hub2/copilot' },
];

interface Hub2BottomNavProps {
  className?: string;
}

export default function Hub2BottomNav({ className }: Hub2BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/hub2/pulse')) return 'pulse';
    if (path.startsWith('/hub2/predictions')) return 'predictions';
    if (path.startsWith('/hub2/explore')) return 'explore';
    if (path.startsWith('/hub2/alerts')) return 'alerts';
    if (path.startsWith('/hub2/watchlist')) return 'watchlist';
    if (path.startsWith('/portfolio-enhanced')) return 'portfolio';
    if (path.startsWith('/scanner')) return 'scanner';
    if (path.startsWith('/guardian')) return 'guardian';
    if (path.startsWith('/hub2/copilot')) return 'copilot';
    return 'pulse';
  };

  const activeTab = getActiveTab();

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/95 backdrop-blur-lg border-t border-border/50",
        "safe-area-pb",
        className
      )}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {/* Back to Main App Button */}
        <motion.button
          onClick={() => navigate('/')}
          className={cn(
            "flex flex-col items-center justify-center",
            "px-2 py-2 rounded-lg transition-all duration-200",
            "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            "min-w-0 flex-shrink-0"
          )}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Home className="w-5 h-5" />
          </motion.div>
          
          <motion.span
            className="text-xs font-medium mt-1 text-muted-foreground"
            animate={{ opacity: 0.7 }}
            transition={{ duration: 0.2 }}
          >
            Main
          </motion.span>
        </motion.button>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center",
                "px-3 py-2 rounded-lg transition-all duration-200",
                "min-w-0 flex-1",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                animate={{ 
                  scale: isActive ? 1.1 : 1,
                  rotate: isActive ? 5 : 0
                }}
                transition={{ duration: 0.2 }}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              
              <motion.span
                className={cn(
                  "text-xs font-medium mt-1",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                animate={{ 
                  opacity: isActive ? 1 : 0.7,
                  y: isActive ? 0 : 2
                }}
                transition={{ duration: 0.2 }}
              >
                {item.label}
              </motion.span>
              
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Hub 2 indicator */}
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
        <motion.div
          className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium shadow-lg"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <Zap className="w-3 h-3 inline mr-1" />
          Hub 2
        </motion.div>
      </div>
    </motion.div>
  );
}
