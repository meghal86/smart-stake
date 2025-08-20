import { User, Settings, Bell, LogOut, Crown, Shield, Mail, CreditCard, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PersonalizationSection } from "@/components/profile/PersonalizationSection";

export default function Profile() {
  const handleOpenOnboarding = () => {
    // This will be implemented to show onboarding
    console.log("Opening onboarding...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 pb-20">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent/20 rounded-xl">
            <User className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Profile</h1>
            <p className="text-sm text-muted-foreground">Manage your account settings</p>
          </div>
        </div>

        {/* User Info */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border border-border/50">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg font-semibold">JD</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">John Doe</h2>
              <p className="text-sm text-muted-foreground">john.doe@example.com</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="default" className="text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  Pro Plan
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Member since Dec 2024
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">1,247</div>
              <div className="text-xs text-muted-foreground">Alerts Received</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">23</div>
              <div className="text-xs text-muted-foreground">Scans Performed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">$2.5M</div>
              <div className="text-xs text-muted-foreground">Total Tracked</div>
            </div>
          </div>
        </Card>

        {/* Personalization Section */}
        <div className="mb-6">
          <PersonalizationSection />
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {/* Notifications */}
          <Card className="p-4 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Notifications</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">Push Notifications</div>
                  <div className="text-xs text-muted-foreground">Receive alerts on your device</div>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">Email Summaries</div>
                  <div className="text-xs text-muted-foreground">Weekly digest of your activity</div>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">Marketing Updates</div>
                  <div className="text-xs text-muted-foreground">Product updates and announcements</div>
                </div>
                <Switch />
              </div>
            </div>
          </Card>

          {/* Account */}
          <Card className="p-4 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="h-5 w-5 text-accent" />
              <h3 className="font-semibold text-foreground">Account</h3>
            </div>
            
            <div className="space-y-3">
              <Button variant="ghost" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-3" />
                Change Email
              </Button>
              
              <Button variant="ghost" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-3" />
                Security Settings
              </Button>
              
              <Button variant="ghost" className="w-full justify-start">
                <CreditCard className="h-4 w-4 mr-3" />
                Billing & Subscription
              </Button>

              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={handleOpenOnboarding}
              >
                <HelpCircle className="h-4 w-4 mr-3" />
                View Onboarding
              </Button>
            </div>
          </Card>

          {/* Subscription */}
          <Card className="p-4 bg-gradient-to-br from-premium/10 to-secondary/10 border-premium/30">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="h-5 w-5 text-premium" />
              <h3 className="font-semibold text-foreground">Subscription</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">Current Plan</div>
                  <div className="text-xs text-muted-foreground">Pro - Renews Jan 15, 2025</div>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
              
              <Button variant="outline" className="w-full">
                Manage Subscription
              </Button>
            </div>
          </Card>

          {/* Sign Out */}
          <Card className="p-4 bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/30">
            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}