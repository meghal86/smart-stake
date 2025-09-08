import { Home, Activity, Fish, TrendingUp, Shield, Users, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ElementType;
  isPremium?: boolean;
}

const navigationItems: NavigationItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "sentiment", label: "Sentiment", icon: Activity },
  { id: "whales", label: "Whales", icon: Fish },
  { id: "analytics", label: "Analytics", icon: Brain, isPremium: true },
  { id: "team", label: "Team", icon: Users, isPremium: true },
  { id: "scanner", label: "Scanner", icon: Shield, isPremium: true },
];

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 safe-area-pb">
      {/* Mobile-optimized navigation */}
      <div className="flex items-center justify-around px-2 py-2 sm:px-4 sm:py-3 max-w-lg mx-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-2 sm:px-3 rounded-lg transition-all duration-200 min-w-0 flex-1 max-w-[80px]",
                "touch-manipulation", // Better touch response
                isActive
                  ? "text-primary bg-primary/10 scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95"
              )}
            >
              <div className="relative">
                <Icon size={18} className="sm:w-5 sm:h-5" />
                {item.isPremium && (
                  <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-premium rounded-full" />
                )}
              </div>
              <span className="text-[10px] sm:text-xs font-medium truncate leading-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}