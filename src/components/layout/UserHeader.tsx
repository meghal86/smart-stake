import { User, LogOut, Settings, Crown, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
// import { useUserMetadata } from '@/hooks/useUserMetadata';
import { useNavigate } from 'react-router-dom';

export const UserHeader = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  // const { metadata, loading: metadataLoading } = useUserMetadata();
  const navigate = useNavigate();
  
  // Temporary: use fallback data without metadata hook
  const metadata = null;
  const metadataLoading = false;

  // Show login/signup only if user is not authenticated or auth is still loading
  if (!user) {
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <img 
            src="/whaleplus-logo.png" 
            alt="WhalePlus" 
            className="h-8 w-8"
          />
          <span className="font-bold text-lg text-foreground">WhalePlus</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {authLoading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate('/login')} className="text-sm">
                Login
              </Button>
              <Button onClick={() => navigate('/signup')} className="text-sm">
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Use fallback data from user auth data only
  const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
  const userEmail = user.email;
  const userPlan = 'free'; // Default to free plan for now
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <img 
          src="/whaleplus-logo.png" 
          alt="WhalePlus" 
          className="h-8 w-8"
        />
        <span className="font-bold text-lg text-foreground">WhalePlus</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={userName} />
                <AvatarFallback className="text-sm">
                  {userName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{userName}</span>
                  {metadataLoading && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                  )}
                  {!metadataLoading && userPlan === 'premium' && (
                    <Crown className="h-3 w-3 text-yellow-500" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{userEmail}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
        
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={userPlan === 'premium' ? 'default' : 'secondary'} className="text-xs">
                    {userPlan === 'premium' && <Crown className="h-3 w-3 mr-1" />}
                    {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} Plan
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            
            {userPlan === 'premium' ? (
              <DropdownMenuItem onClick={() => navigate('/subscription/manage')}>
                <Settings className="mr-2 h-4 w-4" />
                Manage Subscription
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => navigate('/subscription')}>
                <Settings className="mr-2 h-4 w-4" />
                Subscription
              </DropdownMenuItem>
            )}
            
            {userPlan === 'free' && (
              <DropdownMenuItem onClick={() => navigate('/subscription')}>
                <Crown className="mr-2 h-4 w-4" />
                Upgrade to Premium
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};