export type SubscriptionTier = 'free' | 'pro' | 'premium' | 'institutional';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    portfolioAddresses: number;
    whaleAlerts: number;
    apiCalls: number;
    teamSeats: number;
  };
  badge?: string;
}

export interface UserSubscription {
  tier: SubscriptionTier;
  isActive: boolean;
  trialActive: boolean;
  trialExpiry?: Date;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: Date;
}

export interface FeatureAccess {
  hasAccess: boolean;
  tier: SubscriptionTier;
  feature: string;
  upgradeRequired?: SubscriptionTier;
}

// Feature configuration
export const FEATURE_CONFIG = {
  // Portfolio Features
  'portfolio.overview': { requiredTier: 'free' as SubscriptionTier },
  'portfolio.enhanced': { requiredTier: 'pro' as SubscriptionTier },
  'portfolio.benchmarks': { requiredTier: 'pro' as SubscriptionTier },
  'portfolio.risk_intelligence': { requiredTier: 'pro' as SubscriptionTier },
  'portfolio.stress_testing': { requiredTier: 'premium' as SubscriptionTier },
  'portfolio.ai_insights': { requiredTier: 'premium' as SubscriptionTier },
  'portfolio.custom_benchmarks': { requiredTier: 'institutional' as SubscriptionTier },
  'portfolio.pdf_export': { requiredTier: 'pro' as SubscriptionTier },
  'portfolio.api_access': { requiredTier: 'institutional' as SubscriptionTier },
  
  // Whale Features
  'whale.basic_alerts': { requiredTier: 'free' as SubscriptionTier },
  'whale.advanced_filtering': { requiredTier: 'pro' as SubscriptionTier },
  'whale.real_time_notifications': { requiredTier: 'pro' as SubscriptionTier },
  'whale.correlation_analysis': { requiredTier: 'institutional' as SubscriptionTier },
  
  // General Features
  'export.pdf': { requiredTier: 'pro' as SubscriptionTier },
  'export.csv': { requiredTier: 'free' as SubscriptionTier },
  'team.collaboration': { requiredTier: 'institutional' as SubscriptionTier },
} as const;

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Community',
    price: 0,
    interval: 'month',
    badge: '🆓',
    features: [
      'Basic Portfolio Overview',
      'Limited Whale Alerts (50/day)',
      'Basic Charts & Analytics',
      'CSV Export',
      'Community Support'
    ],
    limits: {
      portfolioAddresses: 3,
      whaleAlerts: 50,
      apiCalls: 0,
      teamSeats: 1
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 39,
    interval: 'month',
    badge: '⚡',
    features: [
      'Enhanced Portfolio Intelligence',
      'Unlimited Whale Alerts',
      'Risk Analysis & Benchmarks',
      'Liquidity & Unlock Tracking',
      'PDF Export & Sharing',
      'Real-time Notifications',
      'Advanced Filtering',
      'Priority Support'
    ],
    limits: {
      portfolioAddresses: 25,
      whaleAlerts: -1, // unlimited
      apiCalls: 10000,
      teamSeats: 1
    }
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 99,
    interval: 'month',
    badge: '👑',
    features: [
      'Everything in Pro',
      'Monte Carlo Stress Testing',
      'AI-Powered Risk Intelligence',
      'Advanced Analytics',
      'Priority Support',
      'Custom Reports',
      'API Access',
      'Team Features (3 seats)'
    ],
    limits: {
      portfolioAddresses: 50,
      whaleAlerts: -1, // unlimited
      apiCalls: 50000,
      teamSeats: 3
    }
  },
  {
    id: 'institutional',
    name: 'Institutional',
    price: 499,
    interval: 'month',
    badge: '🏛️',
    features: [
      'Everything in Premium',
      'Custom Benchmark Creation',
      'White-label Options',
      'Team Collaboration (10 seats)',
      'Dedicated Account Manager',
      'Custom Integrations',
      'SLA Guarantees'
    ],
    limits: {
      portfolioAddresses: -1, // unlimited
      whaleAlerts: -1, // unlimited
      apiCalls: 100000,
      teamSeats: 10
    }
  }
];