import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface OnboardingState {
  emailVerified: boolean;
  firstAlertCreated: boolean;
  profileCompleted: boolean;
  progressPercentage: number;
}

export const useOnboarding = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    emailVerified: false,
    firstAlertCreated: false,
    profileCompleted: false,
    progressPercentage: 0
  });
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkOnboardingStatus = async () => {
      try {
        // Check email verification
        const emailVerified = !!user.email_confirmed_at;

        // Check if user has created any alerts (placeholder - implement based on your alerts table)
        const { data: alertsData } = await supabase
          .from('alerts') // Adjust table name as needed
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        const firstAlertCreated = (alertsData?.length || 0) > 0;

        // Check if user has completed profile (placeholder - implement based on your user metadata)
        const { data: profileData } = await supabase
          .from('users_metadata')
          .select('metadata')
          .eq('user_id', user.id)
          .single();

        const profileCompleted = !!profileData?.metadata?.onboarding_completed;

        // Calculate progress
        let progress = 33; // Account created (base)
        if (emailVerified) progress += 33;
        if (firstAlertCreated) progress += 34;

        setOnboardingState({
          emailVerified,
          firstAlertCreated,
          profileCompleted,
          progressPercentage: Math.min(progress, 100)
        });

      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        checkOnboardingStatus();
      }
    });

    return () => subscription.unsubscribe();
  }, [user]);

  const resendVerificationEmail = async () => {
    if (!user?.email || isResendingEmail) return;

    setIsResendingEmail(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to resend email",
          description: error.message,
        });
      } else {
        toast({
          title: "Verification email sent!",
          description: "Please check your inbox and spam folder.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to resend verification email. Please try again.",
      });
    } finally {
      setIsResendingEmail(false);
    }
  };

  const markOnboardingCompleted = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users_metadata')
        .upsert({
          user_id: user.id,
          metadata: {
            onboarding_completed: true,
            completed_at: new Date().toISOString()
          }
        });

      if (!error) {
        setOnboardingState(prev => ({
          ...prev,
          profileCompleted: true
        }));
      }
    } catch (error) {
      console.error('Error marking onboarding as completed:', error);
    }
  };

  return {
    onboardingState,
    resendVerificationEmail,
    markOnboardingCompleted,
    isResendingEmail
  };
};