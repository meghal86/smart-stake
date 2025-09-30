import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Activity, 
  TrendingUp, 
  Shield, 
  Users, 
  FileText,
  Bell,
  Briefcase,
  X,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainAppRoutes = [
  { id: 'home', label: 'Whales', icon: Home, path: '/?tab=home' },
  { id: 'market', label: 'Market', icon: TrendingUp, path: '/?tab=market' },
  { id: 'alerts', label: 'Alerts', icon: Bell, path: '/alerts' },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase, path: '/?tab=portfolio' },
  { id: 'scanner', label: 'Scanner', icon: Shield, path: '/?tab=scanner' },
  { id: 'reports', label: 'Reports', icon: FileText, path: '/?tab=reports' },
  { id: 'profile', label: 'Settings', icon: Users, path: '/?tab=profile' },
];

interface Hub2FloatingNavProps {
  className?: string;
}

export default function Hub2FloatingNav({ className }: Hub2FloatingNavProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("fixed bottom-20 right-4 z-50", className)}>
      {/* Floating Action Button */}
      <motion.div
        className="relative"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-16 right-0 bg-background/95 backdrop-blur-lg border border-border/50 rounded-lg shadow-lg p-2 min-w-[200px]"
            >
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border/50">
                  Main App
                </div>
                {mainAppRoutes.map((route) => (
                  <Button
                    key={route.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigate(route.path);
                      setIsOpen(false);
                    }}
                    className="w-full justify-start gap-2 text-sm"
                  >
                    <route.icon className="w-4 h-4" />
                    {route.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-12 h-12 rounded-full shadow-lg flex items-center justify-center",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "transition-all duration-200"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </motion.div>
        </motion.button>
      </motion.div>
    </div>
  );
}
