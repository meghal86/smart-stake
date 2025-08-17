import { useState } from "react";
import { Home, TrendingUp, Shield, Crown, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ElementType;
  isPremium?: boolean;
}

const navigationItems: NavigationItem[] = [
  { id: "home", label: "Alerts", icon: Home },
  { id: "yields", label: "Yields", icon: TrendingUp },
  { id: "scanner", label: "Scanner", icon: Shield, isPremium: true },
  { id: "premium", label: "Premium", icon: Crown },
  { id: "profile", label: "Profile", icon: User },
];

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around px-4 py-3 max-w-lg mx-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <div className="relative">
                <Icon size={20} />
                {item.isPremium && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-premium rounded-full" />
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}