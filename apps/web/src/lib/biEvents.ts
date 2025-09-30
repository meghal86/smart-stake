import { supabase } from '@/integrations/supabase/client';

export async function logPresetClick(presetKey: string, asset?: string) {
  try {
    // Store session ID for cross-device attribution
    const sessionId = sessionStorage.getItem('attribution_session') || crypto.randomUUID();
    sessionStorage.setItem('attribution_session', sessionId);
    
    await supabase.from('preset_click_events').insert({
      preset_key: presetKey,
      asset
    });
    
    // Also log to server-side for ad-blocker resistance
    await supabase.functions.invoke('log-attribution', {
      body: { type: 'preset_click', preset_key: presetKey, asset, session_id: sessionId }
    });
  } catch (error) {
    console.error('Failed to log preset click:', error);
  }
}

export async function logFeatureLock(lockKey: string) {
  try {
    const sessionId = sessionStorage.getItem('attribution_session') || crypto.randomUUID();
    sessionStorage.setItem('attribution_session', sessionId);
    
    await supabase.from('feature_lock_events').insert({
      lock_key: lockKey
    });
    
    // Server-side backup
    await supabase.functions.invoke('log-attribution', {
      body: { type: 'feature_lock', lock_key: lockKey, session_id: sessionId }
    });
  } catch (error) {
    console.error('Failed to log feature lock:', error);
  }
}

export async function logUpgrade(newTier: string) {
  try {
    await supabase.from('upgrade_events').insert({
      new_tier: newTier
    });
  } catch (error) {
    console.error('Failed to log upgrade:', error);
  }
}