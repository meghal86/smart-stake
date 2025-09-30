import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { UserHeader } from "@/components/layout/UserHeader";

interface SimpleLayoutProps {
  children: React.ReactNode;
}

export const SimpleLayout = ({ children }: SimpleLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 whale-card border-b border-primary/20 px-3 py-2 sm:px-4 sm:py-3">
        <UserHeader />
      </div>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20">
        {children}
      </main>
      
      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNavigation activeTab="home" onTabChange={() => {}} />
      </div>
    </div>
  );
};
