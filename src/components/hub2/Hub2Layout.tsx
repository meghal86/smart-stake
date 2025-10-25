import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Header from "../shell/Header";
import SearchCommand from "../shell/SearchCommand";
import Hub2Footer from "./Hub2Footer";
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
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Production Header */}
      <Header />
      
      {/* Search Command */}
      <SearchCommand 
        open={searchOpen} 
        onOpenChange={setSearchOpen} 
      />

      {/* Main content */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn(
          "min-h-screen",
          showBottomNav ? "pb-32 md:pb-4" : "pb-4", // Extra space for Hub2Footer
          className
        )}
      >
        {children}
      </motion.main>
      
      {/* Hub2 Footer - consistent across all Hub2 pages */}
      {showBottomNav && (
        <Hub2Footer />
      )}
    </div>
  );
}
