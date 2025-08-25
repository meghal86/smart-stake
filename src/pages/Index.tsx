import { useState, useEffect } from "react";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { UserHeader } from "@/components/layout/UserHeader";
import { OnboardingWalkthrough } from "@/components/onboarding/OnboardingWalkthrough";
import { AuthDebug } from "@/components/debug/AuthDebug";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Home from "./Home";
import Yields from "./Yields";
import Scanner from "./Scanner";
import Premium from "./Premium";
import Profile from "./Profile";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user, loading } = useAuth();

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

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Home />;
      case "yields":
        return <Yields />;
      case "scanner":
        return <Scanner />;
      case "premium":
        return <Premium />;
      case "profile":
        return <Profile />;
      default:
        return <Home />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AuthDebug />
      {showOnboarding ? (
        <OnboardingWalkthrough 
          isOpen={showOnboarding} 
          onClose={() => setShowOnboarding(false)} 
          onComplete={handleOnboardingComplete} 
        />
      ) : (
        <>
          <div className="flex justify-end p-4 bg-card/80 backdrop-blur-lg border-b border-border">
            <UserHeader />
          </div>
          {renderContent()}
          <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}
    </div>
  );
};

export default Index;
