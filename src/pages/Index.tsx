import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { UserHeader } from "@/components/layout/UserHeader";
import { OnboardingWalkthrough } from "@/components/onboarding/OnboardingWalkthrough";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Home from "./Home";
import Yields from "./Yields";
import Scanner from "./Scanner";
import Premium from "./Premium";
import Profile from "./Profile";
import Portfolio from "./Portfolio";
import MarketSentiment from "./MarketSentiment";
import MultiCoinSentiment from "./MultiCoinSentiment";
import WhaleAnalytics from "./WhaleAnalytics";
import WhalePredictions from "./WhalePredictions";
import { TeamManagement } from "@/components/team/TeamManagement";
import { PredictiveAnalytics } from "@/components/analytics/PredictiveAnalytics";
import MarketDashboard from "./MarketDashboard";
import PredictionsScenarios from "./PredictionsScenarios";
import ScannerCompliance from "./ScannerCompliance";
import ReportsExports from "./ReportsExports";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user, loading } = useAuth();
  
  // Determine active tab from URL
  const getActiveTabFromUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    return tab || 'home';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromUrl());
  
  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getActiveTabFromUrl());
  }, [location.search]);

  useEffect(() => {
    if (!loading) {
      checkOnboardingStatus();
    }
  }, [user, loading]);

  const checkOnboardingStatus = async () => {
    if (!user) {
      setShowOnboarding(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single();

      if (error || !data?.onboarding_completed) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      if (user) {
        await supabase
          .from("users")
          .update({ onboarding_completed: true })
          .eq("user_id", user.id);
      }
    } catch (error) {
      console.error("Error updating onboarding status:", error);
    }
    setShowOnboarding(false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/?tab=${tab}`);
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Home />;
      case "market":
        return <MarketDashboard />;
      case "predictions":
        return <PredictionsScenarios />;
      case "scanner":
        return <ScannerCompliance />;
      case "reports":
        return <ReportsExports />;
      case "profile":
        return <Profile />;
      // Legacy routes now handled by MarketDashboard
      case "portfolio":
      case "sentiment":
      case "whales":
        return <MarketDashboard />;
      case "yields":
        return <Yields />;
      case "premium":
        return <Premium />;
      default:
        return <Home />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading WhalePlus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background circuit-pattern">
      {showOnboarding ? (
        <OnboardingWalkthrough 
          isOpen={showOnboarding} 
          onClose={() => setShowOnboarding(false)} 
          onComplete={handleOnboardingComplete} 
        />
      ) : (
        <>
          {/* Mobile-optimized header */}
          <div className="sticky top-0 z-50 whale-card border-b border-primary/20 px-3 py-2 sm:px-4 sm:py-3">
            <UserHeader />
          </div>
          
          {/* Main content with proper mobile spacing */}
          <main className="flex-1 overflow-auto pb-20">
            {renderContent()}
          </main>
          
          {/* Mobile-optimized bottom navigation */}
          <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        </>
      )}
    </div>
  );
};

export default Index;
