import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, TrendingUp, Shield, Settings, Sparkles, 
  Menu, X, ChevronRight, BarChart3, Users, DollarSign
} from "lucide-react";

// Enhanced Components
import { WhaleHero } from "@/components/cinematic/WhaleHero";
import { EnhancedGlassCard } from "@/components/cinematic/EnhancedGlassCard";
import { ThemeToggle } from "@/components/cinematic/ThemeToggle";

// Existing Components
import { useAuth } from "@/contexts/AuthContext";
import { useUserMetadata } from "@/hooks/useUserMetadata";

type Screen = "dashboard" | "signals" | "portfolio" | "settings";

export default function Hub2Plus() {
  const { user } = useAuth();
  const { metadata } = useUserMetadata();
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Apply theme to body
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.classList.remove("dark", "pro");
    if (savedTheme === "dark") document.documentElement.classList.add("dark");
    if (savedTheme === "pro") document.documentElement.classList.add("dark", "pro");
  }, []);

  const navigate = (newScreen: Screen) => {
    setScreen(newScreen);
    setSidebarOpen(false);
  };

  const screens = [
    { id: "dashboard", label: "Dashboard", icon: Home, category: "Overview" },
    { id: "signals", label: "Whale Signals", icon: TrendingUp, category: "Analytics" },
    { id: "portfolio", label: "Portfolio", icon: DollarSign, category: "Finance" },
    { id: "settings", label: "Settings", icon: Settings, category: "Tools" },
  ];

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-30 backdrop-blur-2xl border-b"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-lg"
                style={{ background: "var(--accent)", color: "var(--foreground)" }}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <motion.div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, var(--primary), var(--chart-2))",
                }}
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(8, 145, 178, 0.4)",
                    "0 0 30px rgba(107, 95, 255, 0.6)",
                    "0 0 20px rgba(8, 145, 178, 0.4)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                  AlphaWhale Odyssey
                </h1>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Legendary Edition v5.6
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Welcome, {metadata?.profile?.name || 'Explorer'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || window.innerWidth >= 768) && (
            <motion.aside
              className="fixed md:sticky top-16 left-0 bottom-0 w-64 z-20 overflow-y-auto backdrop-blur-2xl border-r"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <nav className="p-4 space-y-6">
                {Object.entries(
                  screens.reduce((acc, screen) => {
                    if (!acc[screen.category]) acc[screen.category] = [];
                    acc[screen.category].push(screen);
                    return acc;
                  }, {} as Record<string, typeof screens>)
                ).map(([category, items]) => (
                  <div key={category}>
                    <div className="text-xs mb-2 px-3 uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                      {category}
                    </div>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => navigate(item.id as Screen)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:scale-[1.02]"
                          style={{
                            background: screen === item.id ? "var(--accent)" : "transparent",
                            color: screen === item.id ? "var(--primary)" : "var(--foreground)",
                          }}
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="text-sm">{item.label}</span>
                          {screen === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {screen === "dashboard" && <DashboardScreen />}
              {screen === "signals" && <SignalsScreen />}
              {screen === "portfolio" && <PortfolioScreen />}
              {screen === "settings" && <SettingsScreen />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// Dashboard Screen
function DashboardScreen() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Welcome Back, Explorer</h2>
          <p style={{ color: "var(--muted-foreground)" }}>Your portfolio is performing exceptionally well</p>
        </div>
      </div>

      <WhaleHero />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EnhancedGlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="p-2 rounded-lg"
              style={{
                background: "rgba(45, 212, 191, 0.15)",
                border: "1px solid rgba(45, 212, 191, 0.3)"
              }}
            >
              <DollarSign className="w-5 h-5" style={{ color: "var(--chart-3)" }} />
            </div>
            <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Portfolio Value</h3>
          </div>
          <div className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>$2.4M</div>
          <div className="text-sm" style={{ color: "var(--chart-3)" }}>+12.4% today</div>
        </EnhancedGlassCard>

        <EnhancedGlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="p-2 rounded-lg"
              style={{
                background: "rgba(28, 169, 255, 0.15)",
                border: "1px solid rgba(28, 169, 255, 0.3)"
              }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: "var(--chart-1)" }} />
            </div>
            <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Active Signals</h3>
          </div>
          <div className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>127</div>
          <div className="text-sm" style={{ color: "var(--chart-1)" }}>+23 new</div>
        </EnhancedGlassCard>

        <EnhancedGlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="p-2 rounded-lg"
              style={{
                background: "rgba(107, 95, 255, 0.15)",
                border: "1px solid rgba(107, 95, 255, 0.3)"
              }}
            >
              <Shield className="w-5 h-5" style={{ color: "var(--chart-2)" }} />
            </div>
            <h3 className="font-medium" style={{ color: "var(--foreground)" }}>Risk Score</h3>
          </div>
          <div className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>Low</div>
          <div className="text-sm" style={{ color: "var(--chart-2)" }}>Safe</div>
        </EnhancedGlassCard>
      </div>
    </div>
  );
}

// Signals Screen
function SignalsScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Whale Flow Signals</h2>
        <p className="text-white/70">Real-time whale movement tracking</p>
      </div>

      <WhaleHero />

      <div className="grid gap-4">
        {[
          { asset: "Bitcoin (BTC)", amount: "2,450 BTC (~$124M)", change: "+18.4%", type: "inflow" },
          { asset: "Ethereum (ETH)", amount: "15,890 ETH (~$48M)", change: "+12.1%", type: "inflow" },
          { asset: "Solana (SOL)", amount: "890K SOL (~$18M)", change: "-8.2%", type: "outflow" },
        ].map((signal, idx) => (
          <EnhancedGlassCard key={idx} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">{signal.asset}</h4>
                <p className="text-white/70 text-sm">{signal.amount}</p>
              </div>
              <div className={`text-sm px-2 py-1 rounded ${
                signal.type === 'inflow' ? 'text-emerald-400 bg-emerald-500/20' : 'text-red-400 bg-red-500/20'
              }`}>
                {signal.change}
              </div>
            </div>
          </EnhancedGlassCard>
        ))}
      </div>
    </div>
  );
}

// Portfolio Screen
function PortfolioScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Portfolio Overview</h2>
        <p className="text-white/70">Track your crypto holdings and performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnhancedGlassCard className="p-6">
          <h3 className="text-white font-medium mb-4">Asset Allocation</h3>
          <div className="space-y-3">
            {[
              { name: "Bitcoin", percentage: 45, value: "$1.08M" },
              { name: "Ethereum", percentage: 30, value: "$720K" },
              { name: "Others", percentage: 25, value: "$600K" },
            ].map((asset, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white">{asset.name}</span>
                  <span className="text-white/70">{asset.value}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <motion.div
                    className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${asset.percentage}%` }}
                    transition={{ duration: 1, delay: idx * 0.2 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </EnhancedGlassCard>

        <EnhancedGlassCard className="p-6">
          <h3 className="text-white font-medium mb-4">Performance</h3>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">+127%</div>
            <div className="text-emerald-400 text-sm">All-time ROI</div>
          </div>
        </EnhancedGlassCard>
      </div>
    </div>
  );
}

// Settings Screen
function SettingsScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-white/70">Customize your AlphaWhale experience</p>
      </div>

      <EnhancedGlassCard className="p-6">
        <h3 className="text-white font-medium mb-4">Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white">Email Notifications</span>
            <button className="w-12 h-6 bg-blue-500 rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white">Dark Mode</span>
            <button className="w-12 h-6 bg-blue-500 rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
            </button>
          </div>
        </div>
      </EnhancedGlassCard>
    </div>
  );
}