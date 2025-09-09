import { useState, useEffect } from 'react';
import { User, LogOut, Settings, Crown, ChevronDown, Menu, X, Bell, Wallet, BarChart3, Shield, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/Logo';
import { WalletConnectModal } from '@/components/ui/WalletConnectModal';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const UserHeader = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [userPlan, setUserPlan] = useState('free');
  const [actualPlan, setActualPlan] = useState('free');
  const [planLoading, setPlanLoading] = useState(false);
  const [dailyAlerts] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const maxAlerts = actualPlan === 'free' ? 50 : 500;

  useEffect(() => {
    if (user) {
      fetchUserPlan();
    }
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

  if (authLoading) {
    return (
      <div className="bg-gradient-to-r from-background to-muted/20 border-b shadow-sm">
        <div className="flex items-center justify-between w-full px-4 py-4">
          <Logo 
            size="sm" 
            showText={true}
            clickable={true}
            onClick={() => navigate('/?tab=home')}
            textClassName="text-base font-semibold"
          />
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-gradient-to-r from-background to-muted/20 border-b shadow-sm">
        <div className="flex items-center justify-between w-full px-4 py-4">
          <Logo 
            size="sm" 
            showText={true}
            clickable={true}
            onClick={() => navigate('/?tab=home')}
            textClassName="text-base font-semibold"
          />
          
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={() => navigate('/login')} className="text-sm">
              Login
            </Button>
            <Button onClick={() => navigate('/signup')} className="text-sm bg-[#14B8A6] hover:bg-[#0F9488] text-white shadow-md">
              Sign Up
            </Button>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur">
            <div className="flex gap-2 p-4">
              <Button variant="outline" onClick={() => navigate('/login')} className="flex-1 text-sm">
                Login
              </Button>
              <Button onClick={() => navigate('/signup')} className="flex-1 text-sm bg-[#14B8A6] hover:bg-[#0F9488] text-white">
                Sign Up
              </Button>
            </div>
          </div>
        )}
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
  const alertProgress = (dailyAlerts / maxAlerts) * 100;

  return (
    <div className="bg-gradient-to-r from-background to-muted/20 border-b shadow-sm">
      <div className="flex items-center justify-between w-full px-4 py-4">
        <Logo 
          size="sm" 
          showText={true}
          clickable={true}
          onClick={() => navigate('/?tab=home')}
          textClassName="text-base font-semibold"
        />
        
        <div className="hidden md:flex items-center gap-4">
          <Badge variant={actualPlan === 'free' ? 'secondary' : 'default'}>
            {actualPlan === 'free' && <span className="mr-1">🆓</span>}
            {(actualPlan === 'pro' || actualPlan === 'premium') && <Crown className="h-3 w-3 mr-1" />}
            {actualPlan.charAt(0).toUpperCase() + actualPlan.slice(1)}
          </Badge>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Daily alerts:</span>
            <span className="font-medium">{dailyAlerts}/{maxAlerts}</span>
            <Progress value={alertProgress} className="w-16 h-2" />
            {actualPlan === 'free' && (
              <Button size="sm" variant="outline" onClick={() => navigate('/subscription')} className="ml-2 text-xs">
                Upgrade
              </Button>
            )}
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/?tab=whales')}
            className="relative hover:bg-[#14B8A6]/10"
            title="View whale alerts"
          >
            <Bell className="h-4 w-4" />
            {dailyAlerts > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#14B8A6] text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                {dailyAlerts > 9 ? '9+' : dailyAlerts}
              </span>
            )}
          </Button>

          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} alt={userName} />
                  <AvatarFallback className="text-sm">
                    {userName ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start">
                  <span className="text-sm font-medium">{userName}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">{userEmail}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
          
            <DropdownMenuContent align="end" className="w-64">
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
              
              <DropdownMenuItem onClick={() => navigate('/?tab=profile')} className="font-medium">
                <User className="mr-2 h-4 w-4" />
                Profile & Settings
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

        <div className="md:hidden flex items-center gap-2">
          <Badge variant={actualPlan === 'free' ? 'secondary' : 'default'} className="text-xs">
            {actualPlan === 'free' ? '🆓' : '👑'}
          </Badge>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/?tab=whales')}
            className="relative hover:bg-[#14B8A6]/10"
            title="Alerts"
          >
            <Bell className="h-3 w-3" />
            {dailyAlerts > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#14B8A6] text-white text-xs rounded-full h-3 w-3 flex items-center justify-center text-[10px]">
                {dailyAlerts > 9 ? '9' : dailyAlerts}
              </span>
            )}
          </Button>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={avatarUrl} alt={userName} />
                  <AvatarFallback className="text-xs">
                    {userName ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant={(actualPlan === 'pro' || actualPlan === 'premium') ? 'default' : 'secondary'} className="text-xs">
                      {(actualPlan === 'pro' || actualPlan === 'premium') && <Crown className="h-3 w-3 mr-1" />}
                      {actualPlan === 'pro' ? 'Pro' : actualPlan === 'premium' ? 'Premium' : 'Free'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Alerts: {dailyAlerts}/{maxAlerts}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/?tab=profile')} className="font-medium">
                <User className="mr-2 h-4 w-4" />Profile & Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/subscription')}>
                <Settings className="mr-2 h-4 w-4" />Subscription
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/?tab=premium')}>
                <Crown className="mr-2 h-4 w-4" />Premium
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <WalletConnectModal 
        isOpen={walletModalOpen} 
        onClose={() => setWalletModalOpen(false)} 
      />
    </div>
  );
};