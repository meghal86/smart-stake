import React, { useState, useEffect, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { suppressExtensionErrors } from "@/utils/suppressExtensionErrors";
import { BrowserNavigationProvider } from "@/components/navigation/BrowserNavigationProvider";
import { LegalDisclosureModal } from "@/components/LegalDisclosureModal";
import { InstallPrompt } from "@/components/InstallPrompt";
import { toast } from "@/hooks/use-toast";
import "@/theme/ocean.css";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import AlphaWhaleHome from "./pages/AlphaWhaleHome";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SignupNew from "./pages/SignupNew";
import Welcome from "./pages/Welcome";
import Signin from "./pages/Signin";
import Subscription from "./pages/Subscription";
import ManageSubscription from "./pages/ManageSubscription";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionCancel from "./pages/SubscriptionCancel";
import Scanner from "./pages/Scanner";
import Yields from "./pages/Yields";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import Contact from "./pages/legal/Contact";
import Premium from "./pages/Premium";
import Debug from "./pages/Debug";
import NotificationSettings from "./pages/NotificationSettings";
import HealthCheck from "./pages/HealthCheck";
import PremiumTest from "./pages/PremiumTest";
import SubscriptionTest from "./pages/SubscriptionTest";
import HealthEndpoint from "./pages/HealthEndpoint";
// Hub 2 imports
import PulsePage from "./pages/hub2/Pulse";
import ExplorePage from "./pages/hub2/Explore";
import EntityDetailWrapper from "./pages/hub2/EntityDetailWrapper";
import AlertsPage from "./pages/hub2/Alerts";
import WatchlistPage from "./pages/hub2/Watchlist";
import CopilotPage from "./pages/hub2/Copilot";
import PortfolioEnhanced from "./pages/PortfolioEnhanced";
import PortfolioIntelligence from "./pages/PortfolioIntelligence";
import Portfolio from "./pages/Portfolio";
import PortfolioUnified from "./pages/PortfolioUnified";
import PortfolioPositions from "./pages/portfolio/positions";
import PortfolioRisk from "./pages/portfolio/risk";
import PortfolioGuardian from "./pages/portfolio/guardian";
import PortfolioStress from "./pages/portfolio/stress";
import PortfolioResults from "./pages/portfolio/results";
import PortfolioAddresses from "./pages/portfolio/addresses";
import Plans from "./pages/Plans";
import Alerts from "./pages/Alerts";
import LiteHub from "./pages/LiteHub";
import Hub5Page from "./pages/Hub5Page";
import SignalsPage from "./pages/SignalsFeed";
import WhaleSignalsPhaseD from "./pages/whale-signals/index";
import PatternModalDemo from "./pages/PatternModalDemo";
import Cockpit from "./pages/Cockpit";
import Hub2Plus from "./pages/Hub2Plus";
// import Guardian from "./pages/Guardian"; // File removed
import { ProtectedRouteWrapper } from '@/components/ProtectedRouteWrapper';
import { AdminRouteWrapper } from '@/components/AdminRouteWrapper';
import { ClientProviders } from "@/providers/ClientProviders";

// Lazy load heavy component pages
const GuardianEnhanced = React.lazy(() => import("./pages/GuardianEnhanced"));
const GuardianLearn = React.lazy(() => import("./pages/GuardianLearn"));
const Hunter = React.lazy(() => import("./pages/Hunter"));
const HarvestPro = React.lazy(() => import("./pages/HarvestPro"));
const AnomalyDetection = React.lazy(() => import("./pages/AnomalyDetection"));
const ReportsExports = React.lazy(() => import("./pages/ReportsExports"));
const WalletAnalysis = React.lazy(() => import("./pages/WalletAnalysis"));
const PredictionsScenarios = React.lazy(() => import("./pages/PredictionsScenarios"));
const AdminBI = React.lazy(() => import("./pages/AdminBI"));
const AdminOps = React.lazy(() => import("./pages/AdminOps"));
const WhaleAnalyticsDashboard = React.lazy(() => import("./pages/WhaleAnalytics"));
const MarketHub = React.lazy(() => import("./pages/MarketHub"));
const Overview = React.lazy(() => import("./pages/Overview"));
const PatternModalDemo = React.lazy(() => import("./pages/PatternModalDemo"));
const TestWorldClass = React.lazy(() => import("./pages/TestWorldClass"));

// Non-lazy imports (lightweight or critical)
import GuardianUX2 from "./pages/GuardianUX2";
import OnboardingAnalytics from "./pages/admin/OnboardingAnalytics";
import AddWalletWizard from "./pages/AddWalletWizard";
import WalletSettings from "./pages/WalletSettings";

// Placeholder components for missing imports
const SignupTest = () => <div>Signup Test</div>;
const PerformanceDebugger = () => null;

// Page loader component for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Add error boundary and suppress extension errors
  useEffect(() => {
    // Suppress extension errors globally
    suppressExtensionErrors();

    // Fix RainbowKit modal pointer-events on mount (one-time only, no polling)
    let cleanupFn: (() => void) | undefined;
    import('@/utils/fixRainbowKit').then(({ fixRainbowKitModals }) => {
      cleanupFn = fixRainbowKitModals();
    });

    const handleError = (event: ErrorEvent) => {
      if (!event.filename?.includes('chrome-extension://')) {
        console.error('Global error caught:', event.error);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Handle auth errors
      if (event.reason?.message?.includes('Invalid Refresh Token')) {
        console.log('Clearing invalid auth tokens...');
        const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_REF ?? 'supabase';
        localStorage.removeItem(`sb-${projectRef}-auth-token`);
        sessionStorage.clear();
        event.preventDefault();
        return;
      }
      
      if (!event.reason?.message?.includes('chrome-extension://')) {
        console.error('Unhandled promise rejection:', event.reason);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      cleanupFn?.();
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ClientProviders>
        {showSplash && (
          <SplashScreen onComplete={handleSplashComplete} duration={1700} />
        )}
        <LegalDisclosureModal />
        <InstallPrompt />
        <BrowserRouter>
          <BrowserNavigationProvider showToast={(message) => toast({ description: message })}>
            <Suspense fallback={<PageLoader />}>
            <Routes>
                  <Route path="/" element={<AlphaWhaleHome />} />
                  <Route path="/lite" element={<Index />} />
                  <Route path="/whale-alerts" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signin" element={<Signin />} />
                  <Route path="/signup-old" element={<Signup />} />
                  <Route path="/signup" element={<SignupNew />} />
                  <Route path="/welcome" element={<Welcome />} />
                  {/* Dev-only routes — not rendered in production */}
                  {import.meta.env.DEV && <Route path="/signup-test" element={<SignupTest />} />}
                  <Route path="/subscription" element={<Subscription />} />
                  <Route path="/subscription/manage" element={<ManageSubscription />} />
                  <Route path="/subscription/success" element={<SubscriptionSuccess />} />
                  <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
                  {import.meta.env.DEV && <Route path="/debug" element={<Debug />} />}
                  <Route path="/notifications" element={<NotificationSettings />} />
                  <Route path="/analysis" element={<WalletAnalysis />} />
                  <Route path="/analysis/:address" element={<WalletAnalysis />} />
                  <Route path="/guardian" element={<ProtectedRouteWrapper><GuardianEnhanced /></ProtectedRouteWrapper>} />
                  <Route path="/guardian-enhanced" element={<ProtectedRouteWrapper><GuardianEnhanced /></ProtectedRouteWrapper>} />
                  <Route path="/guardian-ux2" element={<ProtectedRouteWrapper><GuardianUX2 /></ProtectedRouteWrapper>} />
                  <Route path="/guardian/learn" element={<ProtectedRouteWrapper><GuardianLearn /></ProtectedRouteWrapper>} />
                  <Route path="/hunter" element={<ProtectedRouteWrapper><Hunter /></ProtectedRouteWrapper>} />
                  <Route path="/harvestpro" element={<ProtectedRouteWrapper><HarvestPro /></ProtectedRouteWrapper>} />
                  <Route path="/anomaly-detection" element={<AnomalyDetection />} />
                  {import.meta.env.DEV && <Route path="/premium-test" element={<PremiumTest />} />}
                  {import.meta.env.DEV && <Route path="/subscription-test" element={<SubscriptionTest />} />}
                  <Route path="/predictions-scenarios" element={<PredictionsScenarios />} />
                  {/* Admin routes — requires auth + admin email in VITE_ADMIN_EMAILS */}
                  <Route path="/admin/bi" element={<AdminRouteWrapper><AdminBI /></AdminRouteWrapper>} />
                  <Route path="/admin/ops" element={<AdminRouteWrapper><AdminOps /></AdminRouteWrapper>} />
                  <Route path="/admin/ops/health" element={<AdminRouteWrapper><HealthEndpoint /></AdminRouteWrapper>} />
                  <Route path="/admin/onboarding" element={<AdminRouteWrapper><OnboardingAnalytics /></AdminRouteWrapper>} />
                  <Route path="/health" element={<HealthCheck />} />
                  <Route path="/portfolio-enhanced" element={<Navigate to="/portfolio" replace />} />
                  <Route path="/portfolio-intelligence" element={<PortfolioIntelligence />} />
                  <Route path="/portfolio" element={<PortfolioUnified />} />
                  <Route path="/portfolio/positions" element={<PortfolioPositions />} />
                  <Route path="/portfolio/risk" element={<PortfolioRisk />} />
                  <Route path="/portfolio/guardian" element={<PortfolioGuardian />} />
                  <Route path="/portfolio/stress" element={<PortfolioStress />} />
                  <Route path="/portfolio/results" element={<PortfolioResults />} />
                  <Route path="/portfolio/addresses" element={<PortfolioAddresses />} />
                  <Route path="/plans" element={<Subscription />} />
                  <Route path="/market/hub" element={<MarketHub />} />
                  <Route path="/overview" element={<Overview />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/lite/hub" element={<LiteHub />} />
                  <Route path="/lite/hub5" element={<Hub5Page />} />
                  <Route path="/lite5/hub5" element={<Hub5Page />} />
                  <Route path="/whales" element={<Home />} />
                  <Route path="/scanner" element={<Scanner />} />
                  <Route path="/reports" element={<ReportsExports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/settings/wallets" element={<ProtectedRouteWrapper><WalletSettings /></ProtectedRouteWrapper>} />
                  <Route path="/settings/wallets/add" element={<ProtectedRouteWrapper><AddWalletWizard /></ProtectedRouteWrapper>} />
                  <Route path="/settings/wallets/connecting" element={<ProtectedRouteWrapper><AddWalletWizard /></ProtectedRouteWrapper>} />
                  <Route path="/settings/wallets/success" element={<ProtectedRouteWrapper><AddWalletWizard /></ProtectedRouteWrapper>} />
                  <Route path="/legal/terms" element={<Terms />} />
                  <Route path="/legal/privacy" element={<Privacy />} />
                  <Route path="/legal/contact" element={<Contact />} />
                  <Route path="/predictions" element={<PredictionsScenarios />} />
                  <Route path="/hub" element={<PulsePage />} />
                  <Route path="/hub2" element={<PulsePage />} />
                  {/* Hub 2 routes */}
                  <Route path="/hub2/pulse" element={<PulsePage />} />
                  <Route path="/hub2/predictions" element={<PredictionsScenarios />} />
                  <Route path="/hub2/explore" element={<ExplorePage />} />
                  <Route path="/hub2/entity/:id" element={<EntityDetailWrapper />} />
                  <Route path="/hub2/alerts" element={<AlertsPage />} />
                  <Route path="/hub2/watchlist" element={<WatchlistPage />} />
                  <Route path="/hub2/copilot" element={<CopilotPage />} />
                  <Route path="/hub2-plus" element={<Hub2Plus />} />
                  <Route path="/signals" element={<SignalsPage />} />
                  <Route path="/signals-feed" element={<SignalsPage />} />
                  {import.meta.env.DEV && <Route path="/test-world-class" element={<TestWorldClass />} />}
                  {import.meta.env.DEV && <Route path="/pattern-demo" element={<PatternModalDemo />} />}
                  <Route path="/hub/whale-signals" element={<WhaleSignalsPhaseD />} />
                  <Route path="/cockpit" element={<Cockpit />} />
                  <Route path="/insights" element={<div className="p-6">Insights Coming Soon</div>} />
                  {/* Unified Pro Signals - redirect old routes */}
                  <Route path="/whales" element={<SignalsPage />} />
                  <Route path="/whale-alerts" element={<SignalsPage />} />
                  <Route path="/pro-signals" element={<SignalsPage />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserNavigationProvider>
        </BrowserRouter>
        <PerformanceDebugger />
      </ClientProviders>
    </ErrorBoundary>
  );
};

export default App;
