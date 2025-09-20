import { useSubscription } from './useSubscription';

export function useUserPlan() {
  const { userPlan } = useSubscription();
  
  return {
    plan: userPlan.plan as 'free' | 'pro' | 'premium' | 'enterprise'
  };
}