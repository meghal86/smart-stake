import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Subscription from "./pages/Subscription";
import ManageSubscription from "./pages/ManageSubscription";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionCancel from "./pages/SubscriptionCancel";
import Scanner from "./pages/Scanner";
import Yields from "./pages/Yields";
import Profile from "./pages/Profile";
import Premium from "./pages/Premium";
import Debug from "./pages/Debug";
import NotificationSettings from "./pages/NotificationSettings";
import WalletAnalysis from "./pages/WalletAnalysis";
import HealthCheck from "./pages/HealthCheck";
import PremiumTest from "./pages/PremiumTest";
import SubscriptionTest from "./pages/SubscriptionTest";
import PredictionsScenarios from "./pages/PredictionsScenarios";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Add error boundary for development
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
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
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {showSplash && (
                <SplashScreen onComplete={handleSplashComplete} duration={5000} />
              )}
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
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
                  <Route path="/health" element={<HealthCheck />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
