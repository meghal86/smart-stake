import { Home, Activity, Fish, TrendingUp, Shield, Users, Brain, Twitter, Briefcase, ChevronUp, FileText, Zap, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { FloatingSocial } from "@/components/ui/FloatingSocial";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ElementType;
  isPremium?: boolean;
}

const navigationItems: NavigationItem[] = [
  { id: "home", label: "Whales", icon: Home },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "market", label: "Market", icon: TrendingUp },
  { id: "hub", label: "Hub", icon: Zap, isPremium: true },
  { id: "portfolio", label: "Portfolio", icon: Briefcase, isPremium: true },
  { id: "predictions", label: "Predictions", icon: Activity, isPremium: true },
  { id: "scanner", label: "Scanner", icon: Shield, isPremium: true },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "profile", label: "Settings", icon: Users },
];

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [showUtilities, setShowUtilities] = useState(false);

  return (
    <>
      <FloatingSocial />
      <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Utility Footer - Collapsible on Mobile */}
      <div className={cn(
        "bg-gradient-to-t from-background/98 to-background/95 backdrop-blur-lg border-t border-border/30",
        "md:block", 
        showUtilities ? "block" : "hidden md:block"
      )}>
        {/* Desktop Utility Row */}
        <div className="hidden md:flex items-center justify-between px-6 py-2 text-xs">
          <div className="flex items-center gap-4">
            <Logo 
              size="xs" 
              showText={true} 
              clickable={true}
              onClick={() => navigate('/?tab=home')}
              src="/hero_logo_512.png"
              textClassName="text-xs font-medium" 
            />
            <div className="flex items-center gap-3 text-muted-foreground">
              <button onClick={() => navigate('/terms')} className="hover:text-[#14B8A6] transition-colors">Terms</button>
              <button onClick={() => navigate('/privacy')} className="hover:text-[#14B8A6] transition-colors">Privacy</button>
              <button onClick={() => navigate('/support')} className="hover:text-[#14B8A6] transition-colors">Support</button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!user && (
              <Button 
                size="sm" 
                onClick={() => navigate('/signup')} 
                className="bg-[#14B8A6] hover:bg-[#0F9488] text-white text-xs px-3 py-1 h-6"
              >
                Get Alerts
              </Button>
            )}
            <span className="text-muted-foreground">© {currentYear} WhalePlus</span>
          </div>
        </div>

        {/* Mobile Utility Section */}
        <div className="md:hidden px-3 py-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Logo size="xs" showText={false} clickable onClick={() => navigate('/?tab=home')} src="/hero_logo_512.png" />
              <span className="text-muted-foreground text-[10px]">© {currentYear}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {!user && (
                <Button 
                  size="sm" 
                  onClick={() => navigate('/signup')} 
                  className="bg-[#14B8A6] hover:bg-[#0F9488] text-white text-[10px] px-2 py-0.5 h-5"
                >
                  Alerts
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
            <button onClick={() => navigate('/terms')} className="hover:text-[#14B8A6]">Terms</button>
            <span>•</span>
            <button onClick={() => navigate('/privacy')} className="hover:text-[#14B8A6]">Privacy</button>
            <span>•</span>
            <button onClick={() => navigate('/support')} className="hover:text-[#14B8A6]">Support</button>
          </div>
        </div>
      </div>

      {/* Primary Navigation Bar */}
      <div className="bg-gradient-to-t from-background/95 to-background/90 backdrop-blur-lg border-t border-border/50">
        {/* Mobile Utility Toggle */}
        <div className="md:hidden flex justify-center">
          <button 
            onClick={() => setShowUtilities(!showUtilities)}
            className="p-1 hover:bg-muted/50 rounded transition-colors"
            title={showUtilities ? "Hide info" : "Show info"}
          >
            <ChevronUp className={cn("h-3 w-3 text-muted-foreground transition-transform", showUtilities && "rotate-180")} />
          </button>
        </div>
        
        {/* Navigation Icons */}
        <div className="flex items-center justify-around px-1 py-1.5 sm:px-4 sm:py-3 max-w-lg mx-auto md:max-w-none overflow-x-auto scrollbar-hide">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={`${item.label}${item.isPremium ? ' (Premium)' : ''}`}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-1.5 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-200 min-w-0 flex-1 max-w-[70px] sm:max-w-[100px]",
                  "touch-manipulation group flex-shrink-0",
                  isActive
                    ? "text-[#14B8A6] bg-[#14B8A6]/10 scale-105 shadow-lg shadow-[#14B8A6]/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95"
                )}
              >
                <div className="relative">
                  <Icon size={16} className="sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
                  {item.isPremium && (
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse" />
                  )}
                </div>
                <span className={cn(
                  "text-[9px] sm:text-xs font-medium truncate leading-tight transition-colors",
                  isActive ? "text-[#14B8A6]" : ""
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
    </>
  );
}
