import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logOnboardingEvent, logTourStep, onboardingTracking } from "@/services/onboardingAnalytics";

export function useDiscoveryTelemetry() {
  const { user } = useAuth();

  const logEvent = useCallback(async (eventType: string, eventData: Record<string, unknown>) => {
    if (!user) return;

    try {
      // Log to discovery_events (existing)
      await supabase
        .from("discovery_events")
        .insert({
          user_id: user.id,
          event_type: eventType,
          event_data: eventData
        });

      // Also log to new onboarding analytics system
      if (eventType === 'tour_started' || eventType === 'tour_full_started') {
        await onboardingTracking.tourStarted();
      } else if (eventType === 'tour_step') {
        await logTourStep(eventData.step, eventData.stepTarget);
      } else if (eventType === 'tour_completed') {
        await onboardingTracking.tourCompleted();
      } else if (eventType.startsWith('feature_')) {
        await logOnboardingEvent({
          eventType: 'feature_discovered',
          metadata: { feature: eventType.replace('feature_', ''), ...eventData }
        });
      }
    } catch (error) {
      console.error("Failed to log discovery event:", error);
    }
  }, [user]);

  return { logEvent };
}