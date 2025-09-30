import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { STRIPE_CONFIG } from '@/utils/stripeConfig';

interface SignupData {
  email: string;
  password: string;
  plan: 'free' | 'premium';
  paymentMethodId?: string;
}

export const useSignupFlow = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
    };
  };

  const signupUser = async (data: SignupData) => {
    setIsLoading(true);
    setError('');

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            plan: data.plan,
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        setError(authError.message);
        toast({
          variant: "destructive",
          title: "Signup Failed",
          description: authError.message,
        });
        return false;
      }

      if (!authData.user) {
        console.error('No user data returned');
        setError('Failed to create account');
        return false;
      }

      console.log('User created successfully:', authData.user.id);

      // For premium plan with payment method, create subscription directly
      if (data.plan === 'premium' && data.paymentMethodId) {
        try {
          const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('create-subscription', {
            body: {
              userId: authData.user.id,
              email: data.email,
              paymentMethodId: data.paymentMethodId,
              priceId: STRIPE_CONFIG.priceIds.premium
            }
          });

          if (subscriptionError) {
            console.error('Subscription error:', subscriptionError);
            toast({
              title: "Account Created!",
              description: "Payment will be processed shortly. Welcome to WhalePlus!",
            });
          } else {
            console.log('Subscription created successfully:', subscriptionData);
            toast({
              title: "Premium Account Created!",
              description: "Payment successful. Welcome to Premium!",
            });
            
            // Trigger a storage event to refresh user plan
            localStorage.setItem('user_plan_updated', Date.now().toString());
          }
        } catch (err) {
          console.error('Payment processing error:', err);
          toast({
            title: "Account Created!",
            description: "Payment will be processed shortly.",
          });
        }
      }

      // Success - redirect to welcome page
      toast({
        title: "Account Created!",
        description: "Welcome to WhalePlus!",
      });

      console.log('Redirecting to welcome page...');
      navigate(`/welcome?plan=${data.plan}`);
      return true;

    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred');
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signupWithOAuth = async (provider: 'google' | 'apple', plan: 'free' | 'premium') => {
    setIsLoading(true);
    
    try {
      const redirectUrl = plan === 'premium' 
        ? `${window.location.origin}/welcome?plan=premium&payment=pending`
        : `${window.location.origin}/welcome?plan=free`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: { plan }
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: `${provider} Sign Up Failed`,
          description: error.message,
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to sign up with ${provider}. Please try again.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signupUser,
    signupWithOAuth,
    validatePassword,
    isLoading,
    error,
    setError
  };
};