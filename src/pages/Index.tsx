import { useState, useEffect } from "react";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { OnboardingWalkthrough } from "@/components/onboarding/OnboardingWalkthrough";
import { supabase } from "@/integrations/supabase/client";
import Home from "./Home";
import Yields from "./Yields";
import Scanner from "./Scanner";
import Premium from "./Premium";
import Profile from "./Profile";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setShowOnboarding(true);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single();

      if (!data?.onboarding_completed) {
        setShowOnboarding(true);
      }
    } catch (error) {
      // If user is not logged in, show onboarding
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
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

  return (
    <div className="min-h-screen bg-background">
      {renderContent()}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <OnboardingWalkthrough
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
};

export default Index;
