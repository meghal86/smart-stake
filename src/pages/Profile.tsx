import { useEffect, useState } from "react";
import { Settings, Bell, LogOut, Crown, Shield, Mail, CreditCard, HelpCircle, User, Activity, BarChart3, Camera, MapPin, Clock, Users, Gift, Link2, Edit3, Upload, Eye, TrendingUp, Wallet, X, ChevronDown, ChevronUp, Plus, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PersonalizationSection } from "@/components/profile/PersonalizationSection";


import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMetadata } from "@/hooks/useUserMetadata";
import { useSubscription } from "@/hooks/useSubscription";
import { AppTutorial } from "@/components/tutorial/AppTutorial";
import { HelpSupport } from "@/components/support/HelpSupport";
import { AlertsManager } from "@/components/alerts/AlertsManager";

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { metadata, loading, error, refetch } = useUserMetadata();
  const { userPlan, planLimits } = useSubscription();
  const [displayName, setDisplayName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({});
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  // Refresh metadata when component mounts to get latest subscription status
  useEffect(() => {
    // Listen for subscription change event and refetch metadata
    const handlePlanUpdate = (e: StorageEvent) => {
      if (e.key === 'user_plan_updated') {
        refetch();
      }
    };
    window.addEventListener('storage', handlePlanUpdate);
    // Initial fetch
    if (user && !loading) {
      refetch();
    }
    return () => {
      window.removeEventListener('storage', handlePlanUpdate);
    };
  }, [user]);

  const handleOpenOnboarding = () => {
    setShowTutorial(true);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20">
      <div className="p-4">
        {/* Show loading/error states for metadata */}
        {loading && <div className="text-center text-muted-foreground">Loading profile...</div>}
        {error && <div className="text-center text-red-500">{error}</div>}
        {/* Enhanced User Profile */}
        {metadata && (
          <Card className="p-6 mb-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <div className="flex items-start gap-4 mb-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-xl font-semibold bg-primary/10">
                    {displayName || metadata.profile?.name ? (displayName || metadata.profile.name).split(" ").map(n => n[0]).join("") : "U"}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="absolute -bottom-1 -right-1 h-6 w-6 p-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setShowAvatarUpload(true)}
                >
                  <Camera className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input 
                        value={displayName} 
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="text-xl font-semibold bg-transparent border-b border-primary focus:outline-none"
                        placeholder="Enter display name"
                      />
                      <Button size="sm" onClick={() => setIsEditingName(false)}>Save</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-foreground">{displayName || metadata.profile?.name || "User"}</h2>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingName(true)} className="h-6 w-6 p-0">
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">{metadata.profile?.email || "No email"}</p>
                <div className="flex items-center gap-2 mb-3">
                  {userPlan.plan !== 'free' && (
                    <Badge variant="default" className="text-xs bg-gradient-to-r from-primary to-secondary">
                      <Crown className="h-3 w-3 mr-1" />
                      {userPlan.plan === 'premium' ? 'Premium' : userPlan.plan.charAt(0).toUpperCase() + userPlan.plan.slice(1)} Plan
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Member since {metadata.created_at ? new Date(metadata.created_at).toLocaleDateString() : "N/A"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>Last login: Today</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span>2FA: Enabled</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Usage Statistics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold text-primary">{userPlan.plan === 'free' ? '15/50' : '∞'}</div>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm font-medium">Whale Alerts This Month</div>
                <div className="text-xs text-muted-foreground">35 remaining</div>
              </div>
              <div className="p-4 bg-gradient-to-r from-secondary/10 to-accent/10 rounded-lg border border-secondary/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold text-secondary">{userPlan.plan === 'free' ? '1/1' : '∞'}</div>
                  <Wallet className="h-5 w-5 text-secondary" />
                </div>
                <div className="text-sm font-medium">Wallet Scans Used</div>
                <div className="text-xs text-muted-foreground">Resets in 12 days</div>
              </div>
            </div>
            <div className="p-3 bg-accent/10 rounded-lg border border-accent/20 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">Watchlist: 7 whales tracked</span>
                </div>
                <div className="text-xs text-muted-foreground">{userPlan.plan === 'free' ? 'Upgrade for unlimited' : 'Unlimited'}</div>
              </div>
            </div>
            
            {/* Mini Dashboard Insights */}
            <div className="p-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded border border-green-500/20 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs font-medium">Market uptrend today • Your risk profile: Safe • 3 new whales tracked</span>
              </div>
            </div>
            
            {/* Badges & Streaks */}
            <div className="flex gap-2 mb-4">
              <Badge variant="outline" className="text-xs bg-primary/5">
                🔥 5 day streak
              </Badge>
              <Badge variant="outline" className="text-xs bg-secondary/5">
                ⭐ Premium 2 months
              </Badge>
              <Badge variant="outline" className="text-xs bg-accent/5">
                🎯 Power user
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full" onClick={() => navigate("/subscription")}>
                <CreditCard className="h-4 w-4 mr-2" />
                Subscription
              </Button>
              <Button variant="outline" className="w-full bg-gradient-to-r from-accent/10 to-secondary/10 border-accent/30 hover:from-accent/20 hover:to-secondary/20">
                <Gift className="h-4 w-4 mr-2" />
                Refer & Earn
              </Button>
            </div>
          </Card>
        )}
        
        {/* Compact Recent Activity */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Recent Activity</h3>
              <Badge variant="outline" className="text-xs">3 recent</Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAllActivity(!showAllActivity)}
              className="text-xs"
            >
              {showAllActivity ? <Minus className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
              {showAllActivity ? 'Show Less' : 'Show All'}
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-muted/20 rounded hover:bg-muted/40 cursor-pointer transition-all duration-200 hover:scale-[1.02]" onClick={() => setSelectedActivity({ type: 'scan', address: '0x1234...5678', time: '2h ago', risk: 'Medium', details: 'Risk score: 6/10, No red flags detected' })}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <span className="text-sm font-medium">Wallet scan</span>
                  <div className="text-xs text-muted-foreground">0x1234...5678 • Risk: Medium</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">2h ago</span>
                <Eye className="h-3 w-3 text-muted-foreground mt-1" />
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/20 rounded hover:bg-muted/40 cursor-pointer transition-all duration-200 hover:scale-[1.02]" onClick={() => setSelectedActivity({ type: 'watchlist', whale: 'Whale #4521', time: '1d ago', balance: '2,450 ETH', details: 'Added to personal watchlist, 15 transactions in last 24h' })}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <div>
                  <span className="text-sm font-medium">Added to watchlist</span>
                  <div className="text-xs text-muted-foreground">Whale #4521 • 2,450 ETH</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">1d ago</span>
                <Eye className="h-3 w-3 text-muted-foreground mt-1" />
              </div>
            </div>
            {showAllActivity && (
              <>
                <div className="flex items-center justify-between p-2 bg-muted/20 rounded hover:bg-muted/40 cursor-pointer transition-colors" onClick={() => setSelectedActivity({ type: 'yield', protocol: 'Compound V3', time: '3d ago', apy: '12.5%', details: 'Viewed USDC lending pool, APY: 12.5%, TVL: $2.1B' })}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Viewed yields</span>
                  </div>
                  <span className="text-xs text-muted-foreground">3d ago</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/20 rounded hover:bg-muted/40 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">Plan upgraded</span>
                  </div>
                  <span className="text-xs text-muted-foreground">5d ago</span>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Tabbed Settings */}
        <Card className="p-4 mb-6 transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center gap-1 mb-4 border-b">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'notifications', label: 'Alerts', icon: Bell },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'more', label: 'More', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 text-xs"
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
          
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <PersonalizationSection />
              <div className="p-3 bg-accent/5 rounded-lg border border-accent/20">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold">Referral Program</span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">Give 1 month free, Get 1 month free</div>
                <Button size="sm" className="w-full bg-accent hover:bg-accent/90">Share Code: WHALE2024</Button>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <div><div className="text-sm font-medium">Whale Alerts</div><div className="text-xs text-muted-foreground">Real-time transaction notifications</div></div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <div><div className="text-sm font-medium">Risk Alerts</div><div className="text-xs text-muted-foreground">High-risk wallet notifications</div></div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <div><div className="text-sm font-medium">Email Summaries</div><div className="text-xs text-muted-foreground">Weekly activity digest</div></div>
                <Switch defaultChecked />
              </div>
              <Button variant="outline" className="w-full" onClick={() => setShowAlerts(true)}>
                <Bell className="h-4 w-4 mr-2" />
                Configure Phone Alerts
              </Button>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <div><div className="text-sm font-medium">Two-Factor Auth</div><div className="text-xs text-muted-foreground">Extra account security</div></div>
                <Badge variant="outline" className="text-green-600">Enabled</Badge>
              </div>
              <Button variant="ghost" className="w-full justify-start"><Mail className="h-4 w-4 mr-2" />Change Email</Button>
              <Button variant="ghost" className="w-full justify-start"><Link2 className="h-4 w-4 mr-2" />Connected Wallets</Button>
              <Button variant="ghost" className="w-full justify-start text-destructive"><LogOut className="h-4 w-4 mr-2" />Logout All Sessions</Button>
              <div className="p-3 bg-muted/20 rounded text-xs text-muted-foreground">Last login: Today at 2:30 PM from New York, US</div>
              <div className="p-3 bg-muted/20 rounded text-xs text-muted-foreground">Recent activity: 3 logins this week from 2 devices</div>
            </div>
          )}
          
          {activeTab === 'more' && (
            <div className="space-y-3">
              <Button variant="ghost" className="w-full justify-start" onClick={handleOpenOnboarding}><BarChart3 className="h-4 w-4 mr-2" />App Tutorial</Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => setShowHelpSupport(true)}><HelpCircle className="h-4 w-4 mr-2" />Help & Support</Button>
              {(userPlan.plan === 'pro' || userPlan.plan === 'premium') && (
                <Button variant="ghost" className="w-full justify-start"><Users className="h-4 w-4 mr-2" />Priority Support</Button>
              )}
              <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2" />Sign Out</Button>
            </div>
          )}
          

        </Card>




        

        
        {/* Avatar Upload Modal */}
        {showAvatarUpload && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Upload Avatar</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAvatarUpload(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1">Upload Photo</Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowAvatarUpload(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Activity Detail Modal */}
        {selectedActivity && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Activity Details</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedActivity(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm font-medium mb-1">{selectedActivity.type === 'scan' ? 'Wallet Scan' : selectedActivity.type === 'watchlist' ? 'Watchlist Update' : 'Yield Research'}</div>
                  <div className="text-xs text-muted-foreground">{selectedActivity.time}</div>
                </div>
                <div className="text-sm">{selectedActivity.details}</div>
                <Button variant="outline" className="w-full" onClick={() => setSelectedActivity(null)}>Close</Button>
              </div>
            </div>
          </div>
        )}
        
        {/* App Tutorial */}
        <AppTutorial isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
        
        {/* Help & Support */}
        <HelpSupport isOpen={showHelpSupport} onClose={() => setShowHelpSupport(false)} />
        
        {/* Alerts Manager */}
        <AlertsManager isOpen={showAlerts} onClose={() => setShowAlerts(false)} />
      </div>
    </div>
  );
}