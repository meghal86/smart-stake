import { useState, useEffect } from 'react';
import { User, LogOut, Settings, Crown, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
import { useNavigate } from 'react-router-dom';
export const UserHeader = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [userPlan, setUserPlan] = useState('free');
  const [actualPlan, setActualPlan] = useState('free');
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserPlan();
    }
  }, [user]);

  useEffect(() => {
    const handleStorageChange = () => {
      if (user) {
        fetchUserPlan();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const fetchUserPlan = async () => {
    if (!user) return;
    
    setPlanLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('plan, stripe_subscription_id')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching user plan:', error);
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            user_id: user.id,
            email: user.email,
            plan: 'free'
          });
        
        if (!insertError) {
          setUserPlan('free');
          setActualPlan('free');
        }
      } else if (data && data.length > 0) {
        const userData = data[0];
        setUserPlan(userData.plan);
        setActualPlan(userData.plan);
      } else {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            user_id: user.id,
            email: user.email,
            plan: 'free'
          });
        
        if (!insertError) {
          setUserPlan('free');
          setActualPlan('free');
        }
      }
    } catch (error) {
      console.error('Error fetching user plan:', error);
    } finally {
      setPlanLoading(false);
    }
  };

  const getLogoSrc = () => {
    return '/logos/logo on flat backgroud.png';
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <img 
            src={getLogoSrc()}
            alt="WhalePlus" 
            className="h-12 object-contain"
          />
          <span className="font-bold text-base sm:text-lg text-foreground hidden xs:block">
            WhalePlus
          </span>
          <span className="font-bold text-base text-foreground xs:hidden">
            WP
          </span>
        </div>
        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <img 
            src={getLogoSrc()}
            alt="WhalePlus" 
            className="h-12 object-contain"
          />
          <span className="font-bold text-base sm:text-lg text-foreground hidden xs:block">
            WhalePlus
          </span>
          <span className="font-bold text-base text-foreground xs:hidden">
            WP
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {authLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-primary"></div>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate('/login')} className="text-xs sm:text-sm px-2 sm:px-4">
                Login
              </Button>
              <Button onClick={() => navigate('/signup')} className="text-xs sm:text-sm px-2 sm:px-4">
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

  const userMetadata = user?.user_metadata || {};
  const userName = userMetadata.full_name || userMetadata.name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const avatarUrl = userMetadata.avatar_url;

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <img 
          src={getLogoSrc()}
          alt="WhalePlus" 
          className="h-12 object-contain"
        />
        <span className="font-bold text-base sm:text-lg text-foreground hidden xs:block">
          WhalePlus
        </span>
        <span className="font-bold text-base text-foreground xs:hidden">
          WP
        </span>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 h-auto p-1 sm:p-2">
              <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                <AvatarImage src={avatarUrl} alt={userName} />
                <AvatarFallback className="text-xs sm:text-sm">
                  {userName ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{userName}</span>
                  {planLoading && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                  )}
                  {!planLoading && (actualPlan === 'pro' || actualPlan === 'premium') && (
                    <Crown className="h-3 w-3 text-yellow-500" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">{userEmail}</span>
              </div>
              {!planLoading && (actualPlan === 'pro' || actualPlan === 'premium') && (
                <Crown className="h-3 w-3 text-yellow-500 sm:hidden" />
              )}
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
        
          <DropdownMenuContent align="end" className="w-56 sm:w-64">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={(actualPlan === 'pro' || actualPlan === 'premium') ? 'default' : 'secondary'} className="text-xs">
                    {(actualPlan === 'pro' || actualPlan === 'premium') && <Crown className="h-3 w-3 mr-1" />}
                    {actualPlan === 'pro' ? 'Pro' : actualPlan === 'premium' ? 'Premium' : actualPlan.charAt(0).toUpperCase() + actualPlan.slice(1)} Plan
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => navigate('/?tab=profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            
            {(actualPlan === 'pro' || actualPlan === 'premium') ? (
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
            
            <DropdownMenuItem onClick={() => navigate('/?tab=premium')}>
              <Crown className="mr-2 h-4 w-4" />
              {actualPlan === 'free' ? 'Upgrade to Premium' : 'Premium Features'}
            </DropdownMenuItem>
            
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