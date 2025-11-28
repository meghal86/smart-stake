import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useDiscoveryTelemetry() {
  const { user } = useAuth();

  const logEvent = useCallback(async (eventType: string, eventData: Record<string, unknown>) => {
    if (!user) return;

    try {
      await supabase
        .from("discovery_events")
        .insert({
          user_id: user.id,
          event_type: eventType,
          event_data: eventData
        });
    } catch (error) {
      console.error("Failed to log discovery event:", error);
    }
  }, [user]);

  return { logEvent };
}