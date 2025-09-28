import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Hub2BottomNav from "./Hub2BottomNav";
import Hub2FloatingNav from "./Hub2FloatingNav";
import Hub2MobileNav from "./Hub2MobileNav";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Hub2LayoutProps {
  children: React.ReactNode;
  className?: string;
  showBottomNav?: boolean;
}

export default function Hub2Layout({ 
  children, 
  className,
  showBottomNav = true 
}: Hub2LayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hub 2 Header with Navigation */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50"
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Back to Main App */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Main</span>
          </Button>

          {/* Hub 2 Brand */}
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-semibold text-lg">Hub 2</span>
            <div className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              <span>Advanced</span>
            </div>
          </div>

          {/* Quick Access to Main App */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Main App</span>
          </Button>
        </div>
      </motion.header>

      {/* Main content */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn(
          "min-h-screen",
          showBottomNav ? "pb-20" : "pb-4",
          className
        )}
      >
        {children}
      </motion.main>
      
      {/* Mobile bottom navigation */}
      {showBottomNav && (
        <Hub2BottomNav />
      )}

      {/* Mobile Navigation Menu */}
      <Hub2MobileNav />

      {/* Floating Navigation for Main App Access */}
      <Hub2FloatingNav />
    </div>
  );
}
