import { NotificationSettings as NotificationSettingsComponent } from '@/components/NotificationSettings';
import { AlertChannels } from '@/components/AlertChannels';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingTipsStore } from '@/stores/useOnboardingTipsStore';
import { trackEvent } from '@/lib/telemetry';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function NotificationSettings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id
  const { copilotTipDismissed, hydrated, resetCopilotTip, dismissCopilotTip, hydrateFromStorage } = useOnboardingTipsStore()

  // Ensure hydrated on first open
  useEffect(() => {
    hydrateFromStorage(userId)
  }, [userId, hydrateFromStorage])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Notification Settings</h1>
        </div>
        
        <div className="space-y-6 max-w-2xl">
          <NotificationSettingsComponent />
          <AlertChannels />
          
          {/* Help & Onboarding Section */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Help & Onboarding</h2>
              
              <div className="rounded-xl border bg-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">Copilot tips</p>
                  <p className="text-sm text-muted-foreground">
                    Show helpful prompts like "Do Next" on the Lite dashboard.
                  </p>
                </div>

                {hydrated && (
                  copilotTipDismissed ? (
                    <Button
                      onClick={async () => {
                        await resetCopilotTip(userId)
                        trackEvent('tip_reenabled', { source: 'settings', plan: 'lite' })
                      }}
                      className="rounded-lg px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Re-enable tips
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={async () => {
                        await dismissCopilotTip(userId)
                        trackEvent('tip_dismissed', { source: 'settings', plan: 'lite' })
                      }}
                      className="rounded-lg px-3 py-2"
                    >
                      Hide tips
                    </Button>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}