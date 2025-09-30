import Pulse from "./pages/Pulse";
import Explore from "./pages/Explore";
import EntityDetail from "./pages/EntityDetail";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CompactViewProvider } from "@/contexts/CompactViewContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { suppressExtensionErrors } from "@/utils/suppressExtensionErrors";
import { DevInfo } from "@/components/DevInfo";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SignupNew from "./pages/SignupNew";
import Welcome from "./pages/Welcome";
import SignupTest from "./pages/SignupTest";
import Subscription from "./pages/Subscription";
import ManageSubscription from "./pages/ManageSubscription";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionCancel from "./pages/SubscriptionCancel";
import Scanner from "./pages/Scanner";
import Yields from "./pages/Yields";
import Profile from "./pages/Profile";
import Billing from "./pages/Billing";
import Premium from "./pages/Premium";
import Debug from "./pages/Debug";
import NotificationSettings from "./pages/NotificationSettings";
import WalletAnalysis from "./pages/WalletAnalysis";
import HealthCheck from "./pages/HealthCheck";
import PremiumTest from "./pages/PremiumTest";
import SubscriptionTest from "./pages/SubscriptionTest";
import PredictionsScenarios from "./pages/PredictionsScenarios";
import AdminBI from "./pages/AdminBI";
import AdminOps from "./pages/AdminOps";
import HealthEndpoint from "./pages/HealthEndpoint";
// Hub 2 imports
import PulsePage from "./pages/hub2/Pulse";
import ExplorePage from "./pages/hub2/Explore";
import EntityDetailWrapper from "./pages/hub2/EntityDetailWrapper";
import AlertsPage from "./pages/hub2/Alerts";
import WatchlistPage from "./pages/hub2/Watchlist";
import CopilotPage from "./pages/hub2/Copilot";
import PortfolioEnhanced from "./pages/PortfolioEnhanced";
import Portfolio from "./pages/Portfolio";
import Plans from "./pages/Plans";
import MarketHub from "./pages/MarketHub";
import Overview from "./pages/Overview";
import Alerts from "./pages/Alerts";

// POLISH: Enhanced React Query configuration with retry logic
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Add error boundary and suppress extension errors
  useEffect(() => {
    // Suppress extension errors globally
    suppressExtensionErrors();

    const handleError = (event: ErrorEvent) => {
      if (!event.filename?.includes('chrome-extension://')) {
        console.error('Global error caught:', event.error);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Handle auth errors
      if (event.reason?.message?.includes('Invalid Refresh Token')) {
        console.log('Clearing invalid auth tokens...');
        localStorage.removeItem('sb-rebeznxivaxgserswhbn-auth-token');
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
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <CompactViewProvider>
            <AuthProvider>
              <SubscriptionProvider>
              <TooltipProvider>
              <Toaster />
              <Sonner />
              <DevInfo />
              {showSplash && (
                <SplashScreen onComplete={handleSplashComplete} duration={5000} />
              )}
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup-old" element={<Signup />} />
                  <Route path="/signup" element={<SignupNew />} />
                  <Route path="/welcome" element={<Welcome />} />
                  <Route path="/signup-test" element={<SignupTest />} />
                  <Route path="/subscription" element={<Subscription />} />
                  <Route path="/subscription/manage" element={<ManageSubscription />} />
                  <Route path="/subscription/success" element={<SubscriptionSuccess />} />
                  <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
                  <Route path="/debug" element={<Debug />} />
                  <Route path="/notifications" element={<NotificationSettings />} />
                  <Route path="/analysis" element={<WalletAnalysis />} />
                  <Route path="/analysis/:address" element={<WalletAnalysis />} />
                  <Route path="/premium-test" element={<PremiumTest />} />
                  <Route path="/subscription-test" element={<SubscriptionTest />} />
                  <Route path="/predictions-scenarios" element={<PredictionsScenarios />} />
                  <Route path="/admin/bi" element={<AdminBI />} />
                  <Route path="/admin/ops" element={<AdminOps />} />
                  <Route path="/admin/ops/health" element={<HealthEndpoint />} />
                  <Route path="/health" element={<HealthCheck />} />
                  <Route path="/portfolio-enhanced" element={<PortfolioEnhanced />} />
                  <Route path="/portfolio" element={<Portfolio />} />
                  <Route path="/plans" element={<Plans />} />
                  <Route path="/market/hub" element={<MarketHub />} />
                  <Route path="/overview" element={<Overview />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/billing" element={<Billing />} />
                  <Route path="/profile" element={<Profile />} />
                  {/* Hub 2 routes */}
                  <Route path="/hub2" element={<PulsePage />} />
                  <Route path="/hub2/pulse" element={<PulsePage />} />
                  <Route path="/hub2/explore" element={<ExplorePage />} />
                  <Route path="/hub2/entity/:id" element={<EntityDetailWrapper />} />
                  <Route path="/hub2/alerts" element={<AlertsPage />} />
                  <Route path="/hub2/watchlist" element={<WatchlistPage />} />
                  <Route path="/hub2/copilot" element={<CopilotPage />} />
                  {/* Direct routes for Pulse, Explore, Entity Detail */}
                  <Route path="/pulse" element={<Pulse />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/entity/:id" element={<EntityDetail />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
              </TooltipProvider>
              </SubscriptionProvider>
            </AuthProvider>
          </CompactViewProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
