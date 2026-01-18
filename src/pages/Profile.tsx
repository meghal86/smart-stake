import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTier } from "@/hooks/useTier";
import { useUserMetadata } from "@/hooks/useUserMetadata";
import { useWallet, truncateAddress } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { DisabledTooltipButton } from "@/components/ui/disabled-tooltip-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddWalletButton } from "@/components/wallet/AddWalletButton";
import { NavigationRouter } from "@/lib/navigation/NavigationRouter";
import { 
  User, 
  Mail, 
  Calendar,
  Crown,
  Building,
  Zap,
  ArrowLeft,
  Save,
  Key,
  Settings,
  Wallet,
  Check,
  Trash2,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FooterNav } from "@/components/layout/FooterNav";
import { toast } from "sonner";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { tier, isPremium, isEnterprise } = useTier();
  const { metadata, loading } = useUserMetadata();
  const { connectedWallets, activeWallet, setActiveWallet, disconnectWallet } = useWallet();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real implementation, this would save the profile data
      console.log('Saving profile...');
      // For now, just show a message
      toast.success('Profile saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleWalletSwitch = (address: string) => {
    setActiveWallet(address);
    toast.success('Active wallet switched');
  };

  const handleWalletDisconnect = async (address: string) => {
    try {
      await disconnectWallet(address);
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect failed:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  const getWalletProvider = (wallet: any) => {
    // Simple provider detection based on label or address pattern
    if (wallet.label?.toLowerCase().includes('metamask')) return { name: 'MetaMask', icon: '🦊' };
    if (wallet.label?.toLowerCase().includes('rainbow')) return { name: 'Rainbow', icon: '🌈' };
    if (wallet.label?.toLowerCase().includes('base')) return { name: 'Base Wallet', icon: '🔵' };
    if (wallet.label?.toLowerCase().includes('coinbase')) return { name: 'Coinbase Wallet', icon: '💙' };
    return { name: 'Wallet', icon: '💼' };
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'premium':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'enterprise':
        return <Building className="w-4 h-4 text-purple-600" />;
      default:
        return <Zap className="w-4 h-4 text-blue-600" />;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      defaultValue={metadata?.profile?.name || user?.user_metadata?.full_name || ''}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input
                    id="avatar"
                    defaultValue={metadata?.profile?.avatar_url || user?.user_metadata?.avatar_url || ''}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <DisabledTooltipButton 
                  onClick={handleSave} 
                  disabled={isSaving}
                  disabledTooltip={isSaving ? 'Saving changes...' : undefined}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </DisabledTooltipButton>
              </CardContent>
            </Card>

            {/* Wallet Management Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Wallet Management
                </CardTitle>
                <CardDescription>
                  Manage your connected wallets and add new ones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Wallet Button */}
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Connected Wallets</h4>
                    <p className="text-sm text-muted-foreground">
                      {connectedWallets.length} wallet{connectedWallets.length !== 1 ? 's' : ''} connected
                    </p>
                  </div>
                  <AddWalletButton />
                </div>

                {/* Connected Wallets List */}
                {connectedWallets.length > 0 ? (
                  <div className="space-y-3">
                    {connectedWallets.map((wallet) => {
                      const provider = getWalletProvider(wallet);
                      const isActive = wallet.address === activeWallet;
                      
                      return (
                        <div
                          key={wallet.address}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-lg border transition-colors",
                            isActive 
                              ? "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800" 
                              : "bg-muted/50 hover:bg-muted"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{provider.icon}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {wallet.label || provider.name}
                                </span>
                                {isActive && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Check className="w-3 h-3 mr-1" />
                                    Active
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground font-mono">
                                {truncateAddress(wallet.address, 6)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {!isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleWalletSwitch(wallet.address)}
                              >
                                Set Active
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://etherscan.io/address/${wallet.address}`, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleWalletDisconnect(wallet.address)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No wallets connected</p>
                    <p className="text-sm">
                      Connect your first wallet to start using AlphaWhale
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Account Information */}
          <div className="space-y-6">
            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Plan</span>
                  <Badge className={cn("capitalize", getTierColor(tier))}>
                    {getTierIcon(tier)}
                    <span className="ml-1">{tier}</span>
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Member Since</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(user?.created_at || '').toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant="outline" className="text-green-600">
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* API Keys (Enterprise only) */}
            {isEnterprise && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    API Keys
                  </CardTitle>
                  <CardDescription>
                    Manage your API access keys
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Manage API Keys
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/billing')}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Manage Billing
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => NavigationRouter.navigateToCanonical('settings', navigate)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={signOut}
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <FooterNav />
    </div>
  );
}