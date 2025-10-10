import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTier } from "@/hooks/useTier";
import { useHub2 } from "@/store/hub2";
import { useUIMode } from "@/store/uiMode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Bell, 
  User, 
  Zap, 
  Settings, 
  LogOut,
  CreditCard,
  Key,
  ChevronDown,
  Command,
  Clock,
  Database,
  CheckCircle,
  AlertTriangle,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import UserMenu from "./UserMenu";
import HealthPill from "./HealthPill";
import ModeToggle from "../hub2/ModeToggle";
import TimeWindowToggle from "../hub2/TimeWindowToggle";
import ProvenanceChip from "../hub2/ProvenanceChip";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { tier, isPremium, isEnterprise } = useTier();
  const { filters, setFilters } = useHub2();
  const { mode, setMode } = useUIMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Environment badge
  const env = import.meta.env.VITE_ENV || 'development';
  const envColors = {
    development: 'bg-green-100 text-green-800',
    staging: 'bg-yellow-100 text-yellow-800',
    production: 'bg-blue-100 text-blue-800'
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      
      // Navigation shortcuts
      if (e.key === 'g') {
        const nextKey = e.key;
        // We'll handle this in a separate effect to avoid conflicts
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navigation shortcuts (g + key)
  useEffect(() => {
    let gPressed = false;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'g' && !gPressed) {
        gPressed = true;
        return;
      }
      
      if (gPressed) {
        switch (e.key) {
          case 'p':
            navigate('/hub2/pulse');
            break;
          case 'e':
            navigate('/hub2/explore');
            break;
          case 'w':
            navigate('/hub2/watchlist');
            break;
          case 'a':
            navigate('/hub2/alerts');
            break;
          case 'c':
            navigate('/hub2/copilot');
            break;
        }
        gPressed = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Navigate to search results or entity detail
      navigate(`/hub2/explore?search=${encodeURIComponent(query)}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  const handleProvenanceToggle = () => {
    const newProvenance = filters.provenance === 'real' ? 'sim' : 'real';
    setFilters({ ...filters, provenance: newProvenance });
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50",
      className
    )}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Logo */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/hub2/pulse')}
            className="flex items-center gap-2 p-0 h-auto"
          >
            <img 
              src="/hero_logo_512.png" 
              alt="AlphaWhale" 
              className="w-8 h-8"
            />
            <span className="font-bold text-lg">AlphaWhale</span>
          </Button>

          {/* Environment Badge */}
          {env !== 'production' && (
            <Badge className={cn("text-xs", envColors[env as keyof typeof envColors])}>
              {env.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Center: Time Window + Search */}
        <div className="flex items-center gap-4 flex-1 max-w-2xl mx-8">
          <TimeWindowToggle 
            value={filters.window} 
            onChange={(window) => setFilters({ ...filters, window })}
          />
          
          {/* Global Search */}
          <div className="relative flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search assets, addresses, alerts... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
                className="pl-10 pr-4"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 hidden sm:inline-flex">
                  <Command className="h-3 w-3" />K
                </kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Controls + User Menu */}
        <div className="flex items-center gap-2">
          {/* Mode Toggle */}
          <ModeToggle mode={mode} onModeChange={setMode} />

          {/* Real/Sim Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleProvenanceToggle}
            className="flex items-center gap-2"
          >
            {filters.provenance === 'real' ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <Database className="w-4 h-4 text-blue-600" />
            )}
            <span className="hidden sm:inline">
              {filters.provenance === 'real' ? 'Real' : 'Sim'}
            </span>
          </Button>

          {/* Health Pill */}
          <HealthPill />

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-4 h-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
              3
            </Badge>
          </Button>

          {/* User Menu */}
          {user ? (
            <UserMenu user={user} tier={tier} />
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/login')}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
