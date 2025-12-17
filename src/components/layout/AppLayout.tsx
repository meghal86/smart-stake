import { AppShell } from "@/components/ux/AppShell";

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
  return (
    <AppShell 
      showHeader={showHeader}
      showNavigation={showNavigation}
    >
      {children}
    </AppShell>
  );
};