import { Home, TrendingUp, Shield, BookOpen, User, Sparkles, Wallet, Settings } from "lucide-react";
import { motion } from "motion/react";

interface MobileNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

export function MobileNav({ activeView, onNavigate }: MobileNavProps) {
  const navItems = [
    { id: "dashboard", icon: Home, label: "Home" },
    { id: "signals", icon: TrendingUp, label: "Signals" },
    { id: "guardian", icon: Shield, label: "Guardian" },
    { id: "community", icon: Sparkles, label: "Community" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-2xl border-t md:hidden"
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center justify-around px-2 py-2 safe-bottom">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[60px]"
              style={{
                color: isActive ? "var(--primary)" : "var(--muted-foreground)",
              }}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs">{item.label}</span>
              {isActive && (
                <motion.div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                  style={{ background: "var(--primary)" }}
                  layoutId="mobileNavIndicator"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
