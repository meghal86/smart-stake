import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { SoftLockCard } from './SoftLockCard';

interface PlanGateProps {
  min?: 'pro' | 'premium' | 'enterprise';
  children: ReactNode;
  feature?: string;
}

export function PlanGate({ min = 'pro', children, feature }: PlanGateProps) {
  const { userPlan } = useSubscription();
  
  const planHierarchy = { free: 0, guest: 0, pro: 1, premium: 2, enterprise: 3 };
  const userLevel = planHierarchy[userPlan.plan] || 0;
  const requiredLevel = planHierarchy[min];
  
  if (userLevel >= requiredLevel) {
    return <>{children}</>;
  }
  
  return <SoftLockCard feature={feature || 'This feature'} planHint={min} />;
}