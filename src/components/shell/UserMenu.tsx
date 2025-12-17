import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTier } from "@/hooks/useTier";
import { useUserMetadata } from "@/hooks/useUserMetadata";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  CreditCard, 
  Key, 
  Settings, 
  LogOut, 
  Crown,
  Building,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavigationRouter } from "@/lib/navigation/NavigationRouter";
import { toast } from "sonner";

interface UserMenuProps {
  user: unknown;
  tier: string;
}

export default function UserMenu({ user, tier }: UserMenuProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isPremium, isEnterprise } = useTier();
  const { metadata } = useUserMetadata();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/hub2/pulse');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'premium':
        return <Crown className="w-3 h-3 text-yellow-600" />;
      case 'enterprise':
        return <Building className="w-3 h-3 text-purple-600" />;
      default:
        return <Zap className="w-3 h-3 text-blue-600" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'bg-yellow-100 text-yellow-800';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const userName = metadata?.profile?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const userAvatar = metadata?.profile?.avatar_url || user.user_metadata?.avatar_url;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="text-xs">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Badge 
                variant="outline" 
                className={cn("text-xs", getTierColor(tier))}
              >
                {getTierIcon(tier)}
                <span className="ml-1 capitalize">{tier}</span>
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/billing')}>
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Plans & Billing</span>
        </DropdownMenuItem>
        
        {isEnterprise && (
          <DropdownMenuItem onClick={() => navigate('/api-keys')}>
            <Key className="mr-2 h-4 w-4" />
            <span>API Keys</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={() => NavigationRouter.navigateToCanonical('settings', navigate, toast)}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
