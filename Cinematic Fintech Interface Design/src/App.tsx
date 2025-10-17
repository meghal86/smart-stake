import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Home, TrendingUp, Shield, BookOpen, Settings, Sparkles, 
  Menu, X, ChevronRight, BarChart3, Users, DollarSign
} from "lucide-react";

// Components
import { WhaleHero } from "./components/WhaleHero";
import { GlassCard } from "./components/GlassCard";
import { KPIBar } from "./components/KPIBar";
import { ROIGradientRing } from "./components/ROIGradientRing";
import { SignalCard } from "./components/SignalCard";
import { ThreatBubbleMap } from "./components/ThreatBubbleMap";
import { MobileNav } from "./components/MobileNav";
import { FeedbackButton } from "./components/FeedbackButton";
import { ExplainTooltip } from "./components/ExplainTooltip";
import { AchievementBadge } from "./components/AchievementBadge";

// Screens
import { SplashScreen } from "./screens/SplashScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { WalletWizardScreen } from "./screens/WalletWizardScreen";
import { CommunityScreen } from "./screens/CommunityScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { PredictivePulseScreen } from "./screens/PredictivePulseScreen";
import { AICopilotDrawer } from "./screens/AICopilotDrawer";
import { PatternAnalysisScreen } from "./screens/PatternAnalysisScreen";
import { SandboxScreen } from "./screens/SandboxScreen";
import { ReferralScreen } from "./screens/ReferralScreen";
import { PortfolioScreen } from "./screens/PortfolioScreen";
import { ReportScreen } from "./screens/ReportScreen";
import { ComplianceScreen } from "./screens/ComplianceScreen";

type AppFlow = "splash" | "onboarding" | "wallet" | "app";
type Screen = 
  | "dashboard" | "signals" | "pattern" | "predictive" | "guardian"
  | "profit" | "tax" | "portfolio" | "reports" | "compliance"
  | "learn" | "community" | "referral" | "sandbox" | "settings" | "help";

export default function App() {
  const [flow, setFlow] = useState<AppFlow>("splash");
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [theme, setTheme] = useState<"light" | "dark" | "pro">("light");
  const [persona, setPersona] = useState<string>("novice");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.remove("dark", "pro");
    if (theme === "dark") document.documentElement.classList.add("dark");
    if (theme === "pro") document.documentElement.classList.add("dark", "pro");
  }, [theme]);

  const navigate = (newScreen: Screen) => {
    setScreen(newScreen);
    setSidebarOpen(false);
  };

  // Simplified Navigation - Only 3 Categories
  const allScreens = [
    { id: "dashboard", label: "Dashboard", icon: Home, category: "Overview" },
    { id: "signals", label: "Whale Signals", icon: TrendingUp, category: "Analytics" },
    { id: "pattern", label: "Pattern Analysis", icon: BarChart3, category: "Analytics" },
    { id: "predictive", label: "Predictive Pulse", icon: Sparkles, category: "Analytics" },
    { id: "portfolio", label: "Portfolio", icon: DollarSign, category: "Finance" },
    { id: "profit", label: "Profit Center", icon: DollarSign, category: "Finance" },
    { id: "tax", label: "Tax Harvesting", icon: DollarSign, category: "Finance" },
    { id: "reports", label: "Reports", icon: BookOpen, category: "Finance" },
    { id: "guardian", label: "Guardian Scan", icon: Shield, category: "Security" },
    { id: "compliance", label: "Compliance", icon: Shield, category: "Security" },
    { id: "learn", label: "Learn Center", icon: BookOpen, category: "Community" },
    { id: "community", label: "Community", icon: Users, category: "Community" },
    { id: "referral", label: "Referrals", icon: Sparkles, category: "Community" },
    { id: "sandbox", label: "Sandbox", icon: Settings, category: "Tools" },
    { id: "settings", label: "Settings", icon: Settings, category: "Tools" },
  ];

  if (flow === "splash") {
    return <SplashScreen onContinue={() => setFlow("onboarding")} />;
  }

  if (flow === "onboarding") {
    return (
      <OnboardingScreen
        onComplete={(selectedPersona) => {
          setPersona(selectedPersona);
          setFlow("wallet");
        }}
      />
    );
  }

  if (flow === "wallet") {
    return <WalletWizardScreen onComplete={() => setFlow("app")} />;
  }

  return (
    <div className="min-h-screen">
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
                <h1 className="text-lg" style={{ color: "var(--foreground)" }}>
                  AlphaWhale Odyssey
                </h1>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Legendary Edition v5.6
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCopilotOpen(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
                style={{
                  background: "var(--accent)",
                  color: "var(--primary)",
                }}
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Copilot</span>
              </button>

              <button
                onClick={() => navigate("settings")}
                className="p-2 rounded-lg"
                style={{ background: "var(--accent)", color: "var(--foreground)" }}
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || window.innerWidth >= 768) && (
            <motion.aside
              className="fixed md:sticky top-16 left-0 bottom-0 w-64 z-20 overflow-y-auto backdrop-blur-2xl border-r md:block"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <nav className="p-4 space-y-6 pb-24 md:pb-4">
                {Object.entries(
                  allScreens.reduce((acc, screen) => {
                    if (!acc[screen.category]) acc[screen.category] = [];
                    acc[screen.category].push(screen);
                    return acc;
                  }, {} as Record<string, typeof allScreens>)
                ).map(([category, screens]) => (
                  <div key={category}>
                    <div className="text-xs mb-2 px-3 uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                      {category}
                    </div>
                    <div className="space-y-1">
                      {screens.map((item) => (
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
              {screen === "dashboard" && <DashboardScreen navigate={navigate} setCopilotOpen={setCopilotOpen} />}
              {screen === "signals" && <SignalsScreen />}
              {screen === "pattern" && <PatternAnalysisScreen />}
              {screen === "predictive" && <PredictivePulseScreen />}
              {screen === "portfolio" && <PortfolioScreen />}
              {screen === "profit" && <ProfitCenterScreen />}
              {screen === "tax" && <TaxHarvestingScreen />}
              {screen === "reports" && <ReportScreen />}
              {screen === "guardian" && <GuardianScreen />}
              {screen === "compliance" && <ComplianceScreen />}
              {screen === "learn" && <LearnScreen />}
              {screen === "community" && <CommunityScreen />}
              {screen === "referral" && <ReferralScreen />}
              {screen === "sandbox" && <SandboxScreen />}
              {screen === "settings" && <SettingsScreen theme={theme} onThemeChange={setTheme} />}
              {screen === "help" && <HelpScreen />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav activeView={screen} onNavigate={(view) => navigate(view as Screen)} />

      {/* AI Copilot Drawer */}
      <AICopilotDrawer isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />

      {/* Feedback Button */}
      <FeedbackButton />

      {/* Footer */}
      <footer
        className="mt-12 pt-8 pb-24 md:pb-8 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div>
              <p className="text-sm mb-1" style={{ color: "var(--muted-foreground)" }}>
                © 2025 AlphaWhale Odyssey. Deep Blue Ocean Edition.
              </p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Not for collecting PII or sensitive data • For educational purposes
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <button className="hover:underline">Privacy</button>
              <button className="hover:underline">Terms</button>
              <button className="hover:underline">Compliance</button>
              <span>v5.6.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Dashboard Screen Component
function DashboardScreen({ navigate, setCopilotOpen }: { navigate: (s: Screen) => void, setCopilotOpen: (open: boolean) => void }) {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ color: "var(--foreground)" }}>Welcome Back, Explorer</h2>
          <p style={{ color: "var(--muted-foreground)" }}>Your portfolio is performing exceptionally well</p>
        </div>
        <ExplainTooltip title="Dashboard Overview">
          Your central command for all whale intelligence, portfolio insights, and AI-powered recommendations
        </ExplainTooltip>
      </div>

      <WhaleHero />
      <KPIBar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="p-6 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-4">
            <h3 style={{ color: "var(--foreground)" }}>24h Profit</h3>
            <ExplainTooltip>Total realized and unrealized gains in the last 24 hours</ExplainTooltip>
          </div>
          <ROIGradientRing percentage={67} value="+$48.2K" label="ROI: +8.7%" />
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate("profit")}
              className="px-6 py-2 rounded-lg"
              style={{
                background: "linear-gradient(135deg, var(--chart-3), var(--primary))",
                color: "white",
              }}
            >
              Realize Gains
            </button>
            <button
              onClick={() => navigate("reports")}
              className="px-6 py-2 rounded-lg"
              style={{
                background: "var(--accent)",
                border: "1px solid var(--primary)",
                color: "var(--primary)",
              }}
            >
              Export
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="mb-4" style={{ color: "var(--foreground)" }}>Quick Actions</h3>
          <div className="space-y-3">
            {[
              { icon: BarChart3, label: "Run Analysis", color: "var(--primary)", screen: "pattern" },
              { icon: Shield, label: "Guardian Scan", color: "var(--chart-2)", screen: "guardian" },
              { icon: Sparkles, label: "AI Insights", color: "var(--chart-3)", screen: "predictive" },
              { icon: Sparkles, label: "Ask Copilot", color: "var(--chart-4)", action: () => setCopilotOpen(true) },
            ].map((action, idx) => (
              <button
                key={idx}
                onClick={() => action.action ? action.action() : navigate(action.screen as Screen)}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:scale-[1.02]"
                style={{
                  background: `${action.color}15`,
                  border: `1px solid ${action.color}30`,
                }}
              >
                <action.icon className="w-5 h-5" style={{ color: action.color }} />
                <span style={{ color: "var(--foreground)" }}>{action.label}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: "var(--foreground)" }}>Recent Signals</h3>
            <button
              onClick={() => navigate("signals")}
              className="text-sm"
              style={{ color: "var(--primary)" }}
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {[
              { label: "BTC", value: "+2.4M", color: "var(--chart-3)" },
              { label: "ETH", value: "+890K", color: "var(--primary)" },
              { label: "SOL", value: "-450K", color: "var(--chart-2)" },
            ].map((signal, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "var(--input-background)" }}
              >
                <span style={{ color: "var(--foreground)" }}>{signal.label}</span>
                <span style={{ color: signal.color }}>{signal.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AchievementBadge title="First Trade" description="Welcome!" icon="trophy" unlocked rarity="common" />
        <AchievementBadge title="Whale Hunter" description="100 signals tracked" icon="star" unlocked rarity="rare" />
        <AchievementBadge title="Legend" description="$1M+ portfolio" icon="award" unlocked rarity="legendary" />
        <AchievementBadge title="Ultimate" description="Coming soon..." icon="zap" unlocked={false} rarity="legendary" />
      </div>
    </div>
  );
}

// Signals Screen
function SignalsScreen() {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h2 style={{ color: "var(--foreground)" }}>Whale Flow Signals</h2>
        <p style={{ color: "var(--muted-foreground)" }}>Real-time whale movement tracking</p>
      </div>

      <WhaleHero />

      <div className="flex gap-2 flex-wrap">
        {["All", "Inflow", "Outflow", "Alerts"].map((filter) => (
          <button
            key={filter}
            className="px-4 py-2 rounded-lg text-sm"
            style={{
              background: "var(--accent)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        <SignalCard type="whale-inflow" asset="Bitcoin (BTC)" amount="2,450 BTC (~$124M)" change="+18.4%" timestamp="2 min ago" />
        <SignalCard type="whale-inflow" asset="Ethereum (ETH)" amount="15,890 ETH (~$48M)" change="+12.1%" timestamp="8 min ago" />
        <SignalCard type="risk" asset="Suspicious Contract" amount="High-risk transaction detected" change="Alert" timestamp="12 min ago" />
        <SignalCard type="whale-outflow" asset="Solana (SOL)" amount="890K SOL (~$18M)" change="-8.2%" timestamp="23 min ago" />
      </div>
    </div>
  );
}

// Guardian Screen
function GuardianScreen() {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 style={{ color: "var(--foreground)" }}>Guardian Security Scan</h2>
          <p style={{ color: "var(--muted-foreground)" }}>Real-time threat detection & portfolio protection</p>
        </div>
        <button
          className="px-6 py-3 rounded-lg"
          style={{
            background: "linear-gradient(135deg, var(--primary), var(--chart-2))",
            color: "white",
          }}
        >
          Run Full Scan
        </button>
      </div>

      <WhaleHero />
      <ThreatBubbleMap />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ background: "rgba(45, 212, 191, 0.15)", border: "1px solid rgba(45, 212, 191, 0.3)" }}>
              <Shield className="w-5 h-5" style={{ color: "var(--chart-3)" }} />
            </div>
            <h4 style={{ color: "var(--foreground)" }}>Protected Assets</h4>
          </div>
          <div className="text-2xl mb-1" style={{ color: "var(--chart-3)" }}>$2.4M</div>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>100% coverage active</p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ background: "rgba(255, 197, 92, 0.15)", border: "1px solid rgba(255, 197, 92, 0.3)" }}>
              <Sparkles className="w-5 h-5" style={{ color: "var(--chart-4)" }} />
            </div>
            <h4 style={{ color: "var(--foreground)" }}>Threats Detected</h4>
          </div>
          <div className="text-2xl mb-1" style={{ color: "var(--chart-4)" }}>5</div>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>2 medium, 3 low risk</p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ background: "rgba(8, 145, 178, 0.15)", border: "1px solid rgba(8, 145, 178, 0.3)" }}>
              <Sparkles className="w-5 h-5" style={{ color: "var(--primary)" }} />
            </div>
            <h4 style={{ color: "var(--foreground)" }}>AI Confidence</h4>
          </div>
          <div className="text-2xl mb-1" style={{ color: "var(--primary)" }}>94%</div>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>High accuracy rating</p>
        </GlassCard>
      </div>
    </div>
  );
}

// Learn Screen
function LearnScreen() {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <h2 style={{ color: "var(--foreground)" }}>Learn Center</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: "Whale Psychology 101", level: "Novice", duration: "12 min", color: "var(--chart-3)", progress: 75 },
          { title: "Advanced Pattern Recognition", level: "Explorer", duration: "24 min", color: "var(--primary)", progress: 40 },
          { title: "Risk Management Mastery", level: "Pro", duration: "45 min", color: "var(--chart-2)", progress: 0 },
          { title: "Market Maker Flows", level: "Explorer", duration: "18 min", color: "var(--primary)", progress: 100 },
          { title: "Tax Optimization Strategies", level: "Pro", duration: "32 min", color: "var(--chart-4)", progress: 25 },
          { title: "Guardian Alert Setup", level: "Novice", duration: "8 min", color: "var(--chart-3)", progress: 100 },
        ].map((lesson, idx) => (
          <GlassCard key={idx} className="p-6 hover:scale-[1.02] transition-transform cursor-pointer">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: `${lesson.color}20`, border: `1px solid ${lesson.color}40` }}>
              <BookOpen className="w-6 h-6" style={{ color: lesson.color }} />
            </div>
            <h4 className="mb-2" style={{ color: "var(--foreground)" }}>{lesson.title}</h4>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-2 py-1 rounded" style={{ background: `${lesson.color}20`, color: lesson.color }}>{lesson.level}</span>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{lesson.duration}</span>
            </div>
            {lesson.progress > 0 && (
              <div className="mt-4">
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${lesson.progress}%`, background: `linear-gradient(90deg, ${lesson.color}, ${lesson.color}dd)` }} />
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>{lesson.progress}% complete</p>
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

// Profit Center Screen
function ProfitCenterScreen() {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <h2 style={{ color: "var(--foreground)" }}>Profit Center</h2>
      <WhaleHero />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-8 flex flex-col items-center">
          <h3 className="mb-6" style={{ color: "var(--foreground)" }}>Total Realized Profit</h3>
          <ROIGradientRing percentage={82} value="$248.5K" label="All-time ROI: +127%" size={200} />
          <p className="mt-6 text-center" style={{ color: "var(--muted-foreground)" }}>
            You've outperformed the market by 43% this year
          </p>
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="mb-4" style={{ color: "var(--foreground)" }}>Profit Breakdown</h3>
          <div className="space-y-4">
            {[
              { asset: "Bitcoin", profit: "$124.2K", percentage: 50 },
              { asset: "Ethereum", profit: "$89.4K", percentage: 36 },
              { asset: "Others", profit: "$34.9K", percentage: 14 },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: "var(--foreground)" }}>{item.asset}</span>
                  <span style={{ color: "var(--chart-3)" }}>{item.profit}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "var(--chart-3)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 1, delay: idx * 0.2 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// Tax Harvesting Screen
function TaxHarvestingScreen() {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h2 style={{ color: "var(--foreground)" }}>Tax Harvesting Advisor</h2>
        <p style={{ color: "var(--muted-foreground)" }}>Optimize your tax position with AI-powered recommendations</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-8 flex flex-col items-center">
          <h3 className="mb-6" style={{ color: "var(--foreground)" }}>Potential Savings</h3>
          <ROIGradientRing percentage={65} value="$18.4K" label="Tax optimization" size={180} />
          <button className="mt-6 px-8 py-3 rounded-lg" style={{ background: "linear-gradient(135deg, var(--chart-4), var(--chart-3))", color: "white" }}>
            Simulate Harvest
          </button>
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="mb-4" style={{ color: "var(--foreground)" }}>Recommendations</h3>
          <div className="space-y-3">
            {[
              "Harvest $12K in losses from SOL position",
              "Defer $8K gain realization to next year",
              "Consider staking rewards for better tax treatment",
            ].map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-lg" style={{ background: "var(--input-background)" }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: "var(--chart-4)", color: "white" }}>
                  {idx + 1}
                </div>
                <p className="text-sm flex-1" style={{ color: "var(--foreground)" }}>{rec}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// Help Screen
function HelpScreen() {
  return (
    <div className="space-y-6 pb-20 md:pb-0 max-w-4xl">
      <div>
        <h2 style={{ color: "var(--foreground)" }}>Help & About</h2>
        <p style={{ color: "var(--muted-foreground)" }}>Everything you need to know about AlphaWhale Odyssey</p>
      </div>
      <GlassCard className="p-6">
        <h3 className="mb-4" style={{ color: "var(--foreground)" }}>Quick Start Guide</h3>
        <div className="space-y-4">
          {[
            { step: "1", title: "Connect Your Wallet", desc: "Use WalletConnect to securely link your crypto wallet" },
            { step: "2", title: "Explore Whale Signals", desc: "Track major whale movements in real-time" },
            { step: "3", title: "Enable Guardian Protection", desc: "Activate AI-powered security scanning" },
            { step: "4", title: "Learn & Grow", desc: "Complete lessons to unlock advanced features" },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 p-4 rounded-lg" style={{ background: "var(--input-background)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--primary)", color: "white" }}>
                {item.step}
              </div>
              <div>
                <h4 style={{ color: "var(--foreground)" }}>{item.title}</h4>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
      <GlassCard className="p-6">
        <h3 className="mb-4" style={{ color: "var(--foreground)" }}>About This App</h3>
        <p className="mb-4" style={{ color: "var(--foreground)" }}>
          AlphaWhale Odyssey is a legendary deep ocean-themed crypto analytics platform. Built with React, TypeScript, and Motion for animations.
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p style={{ color: "var(--muted-foreground)" }}>Version</p>
            <p style={{ color: "var(--foreground)" }}>5.6.0 Legendary Edition</p>
          </div>
          <div>
            <p style={{ color: "var(--muted-foreground)" }}>Build Date</p>
            <p style={{ color: "var(--foreground)" }}>October 15, 2025</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
