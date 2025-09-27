import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu, 
  Home, 
  Activity, 
  TrendingUp, 
  Shield, 
  Users, 
  FileText,
  Bell,
  Briefcase,
  Zap,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainAppRoutes = [
  { id: 'home', label: 'Whales', icon: Home, path: '/?tab=home', description: 'Whale analytics and tracking' },
  { id: 'market', label: 'Market', icon: TrendingUp, path: '/?tab=market', description: 'Market dashboard and trends' },
  { id: 'alerts', label: 'Alerts', icon: Bell, path: '/alerts', description: 'Notification settings' },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase, path: '/?tab=portfolio', description: 'Portfolio management' },
  { id: 'scanner', label: 'Scanner', icon: Shield, path: '/?tab=scanner', description: 'Risk scanning tools' },
  { id: 'reports', label: 'Reports', icon: FileText, path: '/?tab=reports', description: 'Analytics and exports' },
  { id: 'profile', label: 'Settings', icon: Users, path: '/?tab=profile', description: 'Account settings' },
];

interface Hub2MobileNavProps {
  className?: string;
}

export default function Hub2MobileNav({ className }: Hub2MobileNavProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className={cn("fixed top-4 left-4 z-50", className)}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <motion.button
            className="w-10 h-10 rounded-full bg-background/95 backdrop-blur-lg border border-border/50 shadow-lg flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="w-5 h-5" />
          </motion.button>
        </SheetTrigger>
        
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Hub 2 Navigation
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            {/* Back to Main App Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Main App</h3>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => handleNavigation('/?tab=home')}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Main App
              </Button>
            </div>

            {/* Quick Access Routes */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Quick Access</h3>
              <div className="space-y-1">
                {mainAppRoutes.map((route) => (
                  <Button
                    key={route.id}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto p-3"
                    onClick={() => handleNavigation(route.path)}
                  >
                    <route.icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{route.label}</span>
                      <span className="text-xs text-muted-foreground">{route.description}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Hub 2 Info */}
            <div className="mt-6 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Hub 2</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Advanced market intelligence with AI-powered insights and real-time signals.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
