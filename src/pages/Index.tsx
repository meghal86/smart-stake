import { useState } from "react";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import Home from "./Home";
import Yields from "./Yields";
import Scanner from "./Scanner";
import Premium from "./Premium";
import Profile from "./Profile";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

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
    </div>
  );
};

export default Index;
