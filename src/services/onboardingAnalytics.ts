/**
 * Onboarding Analytics Service
 * Tracks user journey, funnel metrics, and success rates
 */

import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type OnboardingEventType =
  | 'signup_started'
  | 'signup_completed'
  | 'email_verified'
  | 'first_login'
  | 'welcome_viewed'
  | 'tour_started'
  | 'tour_step_viewed'
  | 'tour_completed'
  | 'tour_skipped'
  | 'first_alert_created'
  | 'first_dashboard_view'
  | 'first_whale_view'
  | 'first_scan_completed'
  | 'profile_completed'
  | 'onboarding_completed'
  | 'subscription_viewed'
  | 'subscription_upgraded'
  | 'feature_discovered'
  | 'drop_off';

export interface OnboardingEvent {
  eventType: OnboardingEventType;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface FunnelMetrics {
  totalSignups: number;
  emailVerifiedCount: number;
  firstLoginCount: number;
  tourStartedCount: number;
  tourCompletedCount: number;
  firstAlertCount: number;
  onboardingCompletedCount: number;
  convertedCount: number;
  
  emailVerifyRate: number;
  firstLoginRate: number;
  tourCompletionRate: number;
  onboardingCompletionRate: number;
  conversionRate: number;
  
  avgHoursToEmailVerify: number;
  avgHoursToTourComplete: number;
  avgHoursToOnboardingComplete: number;
}

export interface DropoffAnalysis {
  dropOffStep: string;
  dropoffCount: number;
  avgTimeSpentSeconds: number;
  avgEventsBeforeDropoff: number;
  recoveredCount: number;
  recoveryRate: number;
}

export interface DailyMetrics {
  date: string;
  signups: number;
  completions: number;
  completionRate: number;
  avgEventsPerUser: number;
}

// ============================================================================
// Session Management
// ============================================================================

class OnboardingSession {
  private sessionId: string;
  private userId: string | null = null;

  constructor() {
    // Try to get existing session ID from sessionStorage
    this.sessionId = sessionStorage.getItem('onboarding_session_id') || uuidv4();
    sessionStorage.setItem('onboarding_session_id', this.sessionId);
  }

  getSessionId(): string {
    return this.sessionId;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  getUserId(): string | null {
    return this.userId;
  }

  clear() {
    sessionStorage.removeItem('onboarding_session_id');
    this.sessionId = uuidv4();
    this.userId = null;
  }
}

const sessionManager = new OnboardingSession();

// ============================================================================
// Event Tracking
// ============================================================================

/**
 * Log an onboarding event
 */
export async function logOnboardingEvent(
  event: OnboardingEvent,
  userId?: string
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const effectiveUserId = userId || user?.id;

    if (effectiveUserId) {
      sessionManager.setUserId(effectiveUserId);
    }

    const eventRecord = {
      user_id: effectiveUserId || null,
      event_type: event.eventType,
      event_metadata: event.metadata || {},
      session_id: sessionManager.getSessionId(),
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      timestamp: event.timestamp || new Date().toISOString()
    };

    const { error } = await supabase
      .from('onboarding_events')
      .insert(eventRecord);

    if (error) {
      console.error('Failed to log onboarding event:', error);
      throw error;
    }

    // Update or create session
    await updateSession(effectiveUserId, event.eventType);

    console.log(`✅ Logged onboarding event: ${event.eventType}`);
  } catch (error) {
    console.error('Error logging onboarding event:', error);
  }
}

/**
 * Update onboarding session
 */
async function updateSession(userId: string | null | undefined, currentStep: string): Promise<void> {
  if (!userId) return;

  try {
    const sessionId = sessionManager.getSessionId();

    const { data: existingSession } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (existingSession) {
      // Update existing session
      const stepsCompleted = existingSession.steps_completed || [];
      if (!stepsCompleted.includes(currentStep)) {
        stepsCompleted.push(currentStep);
      }

      await supabase
        .from('onboarding_sessions')
        .update({
          last_event_at: new Date().toISOString(),
          current_step: currentStep,
          steps_completed: stepsCompleted,
          total_events: (existingSession.total_events || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);
    } else {
      // Create new session
      await supabase
        .from('onboarding_sessions')
        .insert({
          session_id: sessionId,
          user_id: userId,
          current_step: currentStep,
          steps_completed: [currentStep],
          total_events: 1
        });
    }
  } catch (error) {
    console.error('Error updating session:', error);
  }
}

/**
 * Mark onboarding as completed
 */
export async function completeOnboarding(userId: string): Promise<void> {
  await logOnboardingEvent({ eventType: 'onboarding_completed' }, userId);

  // Update session
  const sessionId = sessionManager.getSessionId();
  await supabase
    .from('onboarding_sessions')
    .update({
      completed_at: new Date().toISOString(),
      conversion_type: 'completed'
    })
    .eq('session_id', sessionId);

  // Clear session
  sessionManager.clear();
}

/**
 * Track tour progress
 */
export async function logTourStep(stepIndex: number, stepTarget: string): Promise<void> {
  await logOnboardingEvent({
    eventType: 'tour_step_viewed',
    metadata: {
      stepIndex,
      stepTarget
    }
  });
}

/**
 * Track feature discovery
 */
export async function logFeatureDiscovery(featureName: string): Promise<void> {
  await logOnboardingEvent({
    eventType: 'feature_discovered',
    metadata: {
      featureName
    }
  });
}

// ============================================================================
// Analytics & Reporting
// ============================================================================

/**
 * Get funnel conversion metrics
 */
export async function getFunnelMetrics(): Promise<FunnelMetrics | null> {
  try {
    const { data, error } = await supabase
      .from('v_onboarding_funnel_stats')
      .select('*')
      .single();

    if (error) throw error;

    return {
      totalSignups: data.total_signups,
      emailVerifiedCount: data.email_verified_count,
      firstLoginCount: data.first_login_count,
      tourStartedCount: data.tour_started_count,
      tourCompletedCount: data.tour_completed_count,
      firstAlertCount: data.first_alert_count,
      onboardingCompletedCount: data.onboarding_completed_count,
      convertedCount: data.converted_count,
      
      emailVerifyRate: data.email_verify_rate,
      firstLoginRate: data.first_login_rate,
      tourCompletionRate: data.tour_completion_rate,
      onboardingCompletionRate: data.onboarding_completion_rate,
      conversionRate: data.conversion_rate,
      
      avgHoursToEmailVerify: data.avg_hours_to_email_verify,
      avgHoursToTourComplete: data.avg_hours_to_tour_complete,
      avgHoursToOnboardingComplete: data.avg_hours_to_onboarding_complete
    };
  } catch (error) {
    console.error('Failed to fetch funnel metrics:', error);
    return null;
  }
}

/**
 * Get drop-off analysis
 */
export async function getDropoffAnalysis(): Promise<DropoffAnalysis[]> {
  try {
    const { data, error } = await supabase
      .from('v_onboarding_dropoff_analysis')
      .select('*')
      .order('dropoff_count', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      dropOffStep: row.drop_off_step,
      dropoffCount: row.dropoff_count,
      avgTimeSpentSeconds: row.avg_time_spent_seconds,
      avgEventsBeforeDropoff: row.avg_events_before_dropoff,
      recoveredCount: row.recovered_count,
      recoveryRate: row.recovery_rate
    }));
  } catch (error) {
    console.error('Failed to fetch dropoff analysis:', error);
    return [];
  }
}

/**
 * Get daily metrics
 */
export async function getDailyMetrics(days: number = 30): Promise<DailyMetrics[]> {
  try {
    const { data, error } = await supabase
      .from('v_onboarding_daily_metrics')
      .select('*')
      .limit(days);

    if (error) throw error;

    return (data || []).map(row => ({
      date: row.date,
      signups: row.signups,
      completions: row.completions,
      completionRate: row.completion_rate,
      avgEventsPerUser: row.avg_events_per_user
    }));
  } catch (error) {
    console.error('Failed to fetch daily metrics:', error);
    return [];
  }
}

/**
 * Get user's onboarding progress
 */
export async function getUserProgress(userId: string): Promise<unknown> {
  try {
    const { data, error } = await supabase
      .from('onboarding_funnel_metrics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to fetch user progress:', error);
    return null;
  }
}

/**
 * Run drop-off detection (should be called periodically)
 */
export async function detectDropoffs(): Promise<void> {
  try {
    const { error } = await supabase.rpc('detect_dropoffs');
    
    if (error) throw error;
    console.log('✅ Drop-off detection completed');
  } catch (error) {
    console.error('Failed to detect dropoffs:', error);
  }
}

/**
 * Get onboarding insights for a specific user
 */
export async function getUserOnboardingInsights(userId: string): Promise<{
  currentStage: string;
  completionPercentage: number;
  timeSpent: number;
  stepsCompleted: string[];
  nextAction: string;
} | null> {
  try {
    const progress = await getUserProgress(userId);
    
    if (!progress) return null;

    // Determine next action based on current stage
    const nextActions: Record<string, string> = {
      'signed_up': 'Verify your email to unlock all features',
      'email_verified': 'Log in to start your journey',
      'logged_in': 'Take the guided tour to learn the platform',
      'tour_started': 'Complete the tour to understand key features',
      'tour_completed': 'Create your first whale alert',
      'alert_created': 'Explore the dashboard and discover features',
      'onboarding_completed': 'Consider upgrading to Pro for advanced features'
    };

    return {
      currentStage: progress.funnel_stage,
      completionPercentage: progress.completion_percentage,
      timeSpent: progress.time_to_onboarding_complete || 0,
      stepsCompleted: progress.features_discovered || [],
      nextAction: nextActions[progress.funnel_stage] || 'Continue exploring'
    };
  } catch (error) {
    console.error('Failed to get user insights:', error);
    return null;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

// Pre-defined event loggers
export const onboardingTracking = {
  signupStarted: () => logOnboardingEvent({ eventType: 'signup_started' }),
  signupCompleted: (userId: string) => logOnboardingEvent({ eventType: 'signup_completed' }, userId),
  emailVerified: (userId: string) => logOnboardingEvent({ eventType: 'email_verified' }, userId),
  firstLogin: (userId: string) => logOnboardingEvent({ eventType: 'first_login' }, userId),
  welcomeViewed: () => logOnboardingEvent({ eventType: 'welcome_viewed' }),
  tourStarted: () => logOnboardingEvent({ eventType: 'tour_started' }),
  tourCompleted: () => logOnboardingEvent({ eventType: 'tour_completed' }),
  tourSkipped: () => logOnboardingEvent({ eventType: 'tour_skipped' }),
  firstAlertCreated: () => logOnboardingEvent({ eventType: 'first_alert_created' }),
  firstDashboardView: () => logOnboardingEvent({ eventType: 'first_dashboard_view' }),
  firstWhaleView: () => logOnboardingEvent({ eventType: 'first_whale_view' }),
  firstScanCompleted: () => logOnboardingEvent({ eventType: 'first_scan_completed' }),
  profileCompleted: () => logOnboardingEvent({ eventType: 'profile_completed' }),
  subscriptionViewed: () => logOnboardingEvent({ eventType: 'subscription_viewed' }),
  subscriptionUpgraded: () => logOnboardingEvent({ eventType: 'subscription_upgraded' })
};

