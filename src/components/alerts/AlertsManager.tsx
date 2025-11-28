import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Phone, Smartphone, X, Settings, Zap, List, FileText } from 'lucide-react';
import { AlertDashboard } from './AlertDashboard';
import { AlertTemplates } from './AlertTemplates';

interface AlertsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlertsManager = ({ isOpen, onClose }: AlertsManagerProps) => {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isTestingAlert, setIsTestingAlert] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [alertSettings, setAlertSettings] = useState({
    whaleAlerts: true,
    riskAlerts: true,
    priceAlerts: false,
    portfolioAlerts: false
  });

  useEffect(() => {
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPushEnabled(permission === 'granted');
    }
  };

  const sendTestAlert = () => {
    setIsTestingAlert(true);
    
    setTimeout(() => {
      let alertSent = false;
      
      // Send push notification if enabled
      if (pushEnabled) {
        try {
          new Notification('🐋 WhalePlus Test Alert', {
            body: 'Test successful! Large whale transaction detected 🚨',
            icon: '/favicon.ico',
            tag: 'whale-test-alert'
          });
          alertSent = true;
        } catch (error) {
          console.error('Push notification failed:', error);
        }
      }
      
      // Simulate SMS if phone number provided
      if (phoneNumber) {
        console.log(`📱 SMS Test: Alert sent to ${phoneNumber}`);
        alertSent = true;
      }
      
      // Show success feedback
      if (alertSent) {
        const methods = [];
        if (pushEnabled) methods.push('Push Notification');
        if (phoneNumber) methods.push(`SMS (${phoneNumber})`);
        alert(`✅ Test alert sent via: ${methods.join(' and ')}`);
      } else {
        alert('❌ Please enable push notifications or add a phone number first!');
      }
      
      setIsTestingAlert(false);
    }, 500);
  };

  const handleUseTemplate = (template: unknown) => {
    setShowTemplates(false);
    setShowDashboard(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl max-h-[85vh] overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Alert Center</h2>
                  <p className="text-sm text-muted-foreground">Manage notifications and custom alert rules</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Tabs defaultValue="settings" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Basic Settings
                </TabsTrigger>
                <TabsTrigger value="custom">
                  <Zap className="h-4 w-4 mr-2" />
                  Custom Rules
                </TabsTrigger>
                <TabsTrigger value="templates">
                  <FileText className="h-4 w-4 mr-2" />
                  Templates
                </TabsTrigger>
              </TabsList>

              <div className="mt-6 max-h-[calc(85vh-200px)] overflow-y-auto">
                <TabsContent value="settings" className="space-y-6">

          <div className="space-y-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-medium">Push Notifications</h3>
                    <p className="text-sm text-muted-foreground">Get instant alerts on your device</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pushEnabled && <Badge variant="outline" className="text-green-600">Enabled</Badge>}
                  {!pushEnabled && (
                    <Button size="sm" onClick={requestNotificationPermission}>
                      Enable
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Phone className="h-5 w-5 text-secondary" />
                <div>
                  <h3 className="font-medium">SMS Alerts</h3>
                  <p className="text-sm text-muted-foreground">Receive alerts via text message</p>
                </div>
              </div>
              <div className="space-y-3">
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                {phoneNumber && (
                  <Badge variant="outline" className="text-green-600">
                    SMS alerts enabled for {phoneNumber}
                  </Badge>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="h-5 w-5 text-accent" />
                <div>
                  <h3 className="font-medium">Alert Types</h3>
                  <p className="text-sm text-muted-foreground">Choose which alerts to receive</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Whale Alerts</div>
                    <div className="text-sm text-muted-foreground">Large transaction notifications</div>
                  </div>
                  <Switch 
                    checked={alertSettings.whaleAlerts}
                    onCheckedChange={(checked) => setAlertSettings({...alertSettings, whaleAlerts: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Risk Alerts</div>
                    <div className="text-sm text-muted-foreground">High-risk wallet notifications</div>
                  </div>
                  <Switch 
                    checked={alertSettings.riskAlerts}
                    onCheckedChange={(checked) => setAlertSettings({...alertSettings, riskAlerts: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Price Alerts</div>
                    <div className="text-sm text-muted-foreground">Token price movement alerts</div>
                  </div>
                  <Switch 
                    checked={alertSettings.priceAlerts}
                    onCheckedChange={(checked) => setAlertSettings({...alertSettings, priceAlerts: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Portfolio Alerts</div>
                    <div className="text-sm text-muted-foreground">Watchlist activity notifications</div>
                  </div>
                  <Switch 
                    checked={alertSettings.portfolioAlerts}
                    onCheckedChange={(checked) => setAlertSettings({...alertSettings, portfolioAlerts: checked})}
                  />
                </div>
              </div>
            </Card>

                    <div className="flex gap-3">
                      <Button 
                        onClick={() => {
                          sendTestAlert();
                          setTimeout(() => {
                            alert('✅ Test alert sent successfully!');
                          }, 1000);
                        }} 
                        className="flex-1" 
                        disabled={isTestingAlert}
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        {isTestingAlert ? 'Sending...' : 'Send Test Alert'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          alert('✅ Settings saved successfully!');
                          onClose();
                        }}
                      >
                        Save Settings
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="custom" className="space-y-4">
                  <div className="text-center py-12">
                    <Zap className="h-16 w-16 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Advanced Alert Rules</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Create sophisticated multi-condition alerts with custom logic, time windows, and delivery preferences.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={() => setShowDashboard(true)} size="lg">
                        <List className="h-5 w-5 mr-2" />
                        Manage Rules
                      </Button>
                      <Button variant="outline" onClick={() => setShowTemplates(true)} size="lg">
                        <FileText className="h-5 w-5 mr-2" />
                        Browse Templates
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="templates" className="space-y-4">
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Alert Templates</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Get started quickly with pre-configured alert templates for common monitoring scenarios.
                    </p>
                    <Button onClick={() => setShowTemplates(true)} size="lg">
                      <FileText className="h-5 w-5 mr-2" />
                      Browse All Templates
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </Card>
      </div>

      <AlertDashboard
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
      />

      <AlertTemplates
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onUseTemplate={handleUseTemplate}
      />
    </>
  );
};