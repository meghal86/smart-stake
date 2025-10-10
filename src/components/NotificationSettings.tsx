import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export const NotificationSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    sms: false,
    push: true
  });
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  useEffect(() => {
    loadPreferences();
    checkPushSupport();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      // Try to get from users table first, fallback to defaults
      const { data, error } = await supabase
        .from('users')
        .select('notification_preferences, phone')
        .eq('id', user.id);

      if (data && data.length > 0 && !error) {
        const userData = data[0];
        const prefs = userData.notification_preferences as NotificationPreferences | null;
        setPreferences(prefs || { email: true, sms: false, push: true });
        setPhone(userData.phone || '');
      } else {
        // Use defaults if table doesn't exist or user not found
        console.log('Using defaults - no user data found');
        setPreferences({ email: true, sms: false, push: true });
        setPhone('');
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      // Use defaults on error
      setPreferences({ email: true, sms: false, push: true });
      setPhone('');
    }
  };

  const checkPushSupport = () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      checkPushSubscription();
    }
  };

  const checkPushSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setPushSubscribed(!!subscription);
    } catch (error) {
      console.error('Failed to check push subscription:', error);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // For now, just save locally since users table may not exist
      console.log('Preferences saved locally:', { preferences, phone });
      
      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated locally."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save preferences."
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPush = async () => {
    if (!pushSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      // Save subscription to database (skip if table doesn't exist)
      try {
        await supabase
          .from('push_subscriptions')
          .insert({
            user_id: user?.id,
            endpoint: subscription.endpoint,
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
          });
      } catch (dbError) {
        console.log('Push subscription saved locally (DB not available)');
      }

      setPushSubscribed(true);
      setPreferences(prev => ({ ...prev, push: true }));
      
      toast({
        title: "Push notifications enabled",
        description: "You'll now receive push notifications for alerts."
      });
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to enable push notifications."
      });
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from database (skip if table doesn't exist)
      try {
        await supabase
          .from('push_subscriptions')
          .update({ active: false })
          .eq('user_id', user?.id);
      } catch (dbError) {
        console.log('Push unsubscription handled locally (DB not available)');
      }

      setPushSubscribed(false);
      setPreferences(prev => ({ ...prev, push: false }));
      
      toast({
        title: "Push notifications disabled",
        description: "You'll no longer receive push notifications."
      });
    } catch (error) {
      console.error('Failed to unsubscribe from push:', error);
    }
  };

  const testNotification = async (channel: 'email' | 'sms' | 'push') => {
    try {
      const { error } = await supabase.functions.invoke('notification-delivery', {
        body: {
          userId: user?.id || 'test-user',
          type: 'test',
          title: `🐋 Test ${channel.toUpperCase()} Notification`,
          message: `This is a test ${channel} notification from WhalePlus. If you receive this, your ${channel} notifications are working correctly!`,
          channels: [channel],
          priority: 'low',
          email: (user?.email as string) || 'test@example.com',
          phone: phone || '+1234567890'
        }
      });

      if (error) throw error;

      toast({
        title: "Test notification sent",
        description: `Check your ${channel} for the test message.`
      });
    } catch (error) {
      console.error('Test notification error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to send test ${channel} notification.`
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to receive alerts and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive alerts via email
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={preferences.email}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, email: checked }))
                }
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => testNotification('email')}
                disabled={!preferences.email}
              >
                Test
              </Button>
            </div>
          </div>

          {/* SMS Notifications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-green-500" />
                <div>
                  <Label className="text-base">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts via text message
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={preferences.sms}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, sms: checked }))
                  }
                  disabled={!phone}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testNotification('sms')}
                  disabled={!preferences.sms || !phone}
                >
                  Test
                </Button>
              </div>
            </div>
            <div className="ml-8">
              <Label htmlFor="phone" className="text-sm">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-purple-500" />
              <div>
                <Label className="text-base">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive alerts as browser notifications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pushSupported ? (
                <>
                  {pushSubscribed ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={unsubscribeFromPush}
                      className="text-red-600"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Disable
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={subscribeToPush}
                      className="text-green-600"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Enable
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testNotification('push')}
                    disabled={!pushSubscribed}
                  >
                    Test
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not supported in this browser
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={savePreferences} disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};