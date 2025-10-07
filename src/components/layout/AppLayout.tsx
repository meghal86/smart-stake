import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { UserHeader } from "@/components/layout/UserHeader";

interface AppLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  showHeader?: boolean;
}

export const AppLayout = ({ 
  children, 
  showNavigation = true, 
  showHeader = true 
}: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab based on current route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/" || path === "/home") return "home";
    if (path === "/yields") return "yields";
    if (path === "/scanner") return "scanner";
    if (path === "/premium" || path === "/subscription") return "premium";
    if (path === "/profile") return "profile";
    if (path.startsWith("/hub2")) return "hub2";
    if (path.startsWith("/hub")) return "hub";
    return "home";
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Navigate to the appropriate route
    switch (tab) {
      case "whales":
        navigate("/whales");
        break;
      case "alerts":
        navigate("/alerts");
        break;
      case "market":
        navigate("/market/hub");
        break;
      case "hub":
        navigate("/hub");
        break;
      case "hub2":
        navigate("/hub2");
        break;
      case "portfolio":
        navigate("/portfolio");
        break;
      case "predictions":
        navigate("/predictions");
        break;
      case "scanner":
        navigate("/scanner");
        break;
      case "reports":
        navigate("/reports");
        break;
      case "settings":
        navigate("/settings");
        break;
      default:
        navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && (
        <div className="flex justify-end p-4 bg-card/80 backdrop-blur-lg border-b border-border">
          <UserHeader />
        </div>
      )}
      
      <div className="flex-1">
        {children}
      </div>
      
      {showNavigation && (
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </div>
  );
};