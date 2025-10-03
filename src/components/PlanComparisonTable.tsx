import React from 'react';
import { Check, X, CreditCard, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ComingSoonBadge } from '@/components/ComingSoonBadge';
import { analytics } from '@/lib/analytics';

// Local analytics helpers
const trackPricingEvent = {
  planCtaClicked: (plan: string, billingPeriod: 'month' | 'year', viewMode: 'cards' | 'table') => {
    analytics.track('pricing_plan_cta_clicked', { plan, billing_period: billingPeriod, view_mode: viewMode });
  },
  comingSoonTooltipOpened: (feature: string, plan: string) => {
    analytics.track('coming_soon_tooltip_opened', { feature, plan });
  }
};

interface PricingPlan {
  id: string;
  name: string;
  price: number | 'custom';
  interval: 'month' | 'year';
  popular?: boolean;
  enterprise?: boolean;
}

interface FeatureRowProps {
  feature: string;
  free: boolean | 'coming-soon' | string;
  pro: boolean | 'coming-soon' | string;
  premium: boolean | 'coming-soon' | string;
  enterprise: boolean | 'coming-soon' | string;
}

const FeatureRow: React.FC<FeatureRowProps> = ({ feature, free, pro, premium, enterprise }) => {
  const getComingSoonETA = (feature: string) => {
    if (feature === 'Smart Contract Analysis' || feature === 'Wallet Security Scoring') return 'ETA Q2 2025';
    if (feature === 'Workflow Automation' || feature === 'Forensics Dashboard') return 'ETA Q3 2025';
    return 'Coming Soon';
  };

  const renderCell = (value: boolean | 'coming-soon' | string) => {
    if (value === true) return <Check className="h-4 w-4 text-green-500 mx-auto" />;
    if (value === 'coming-soon') {
      return (
        <ComingSoonBadge 
          label="Soon" 
          mobile 
          eta={getComingSoonETA(feature)}
          onTooltipOpen={() => trackPricingEvent.comingSoonTooltipOpened(feature, 'table')}
        />
      );
    }
    if (typeof value === 'string') return <span className="text-sm font-medium text-center">{value}</span>;
    return <X className="h-4 w-4 text-muted-foreground mx-auto" />;
  };

  return (
    <tr className="border-b border-border/50">
      <td className="py-3 px-4 text-sm font-medium text-left">{feature}</td>
      <td className="py-3 px-4 text-center">{renderCell(free)}</td>
      <td className="py-3 px-4 text-center">{renderCell(pro)}</td>
      <td className="py-3 px-4 text-center">{renderCell(premium)}</td>
      <td className="py-3 px-4 text-center">{renderCell(enterprise)}</td>
    </tr>
  );
};

interface PlanComparisonTableProps {
  plans: PricingPlan[];
  currentPlan: string;
  isAnnual: boolean;
  onSubscribe: (plan: PricingPlan) => void;
  isLoading: boolean;
}

export const PlanComparisonTable: React.FC<PlanComparisonTableProps> = ({
  plans,
  currentPlan,
  isAnnual,
  onSubscribe,
  isLoading
}) => {
  const formatPrice = (price: number | 'custom') => {
    if (price === 0) return 'Free';
    if (price === 'custom') return 'Custom';
    return `$${price}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse bg-card rounded-lg border border-border">
        {/* Header */}
        <thead>
          <tr className="border-b border-border">
            <th className="py-4 px-4 text-left font-semibold">Features</th>
            {plans.map((plan) => (
              <th key={plan.id} className="py-4 px-4 text-center min-w-[120px]">
                <div className="space-y-2">
                  <div className="font-bold">{plan.name}</div>
                  {plan.popular && (
                    <Badge className="bg-primary text-xs">Most Popular</Badge>
                  )}
                  {plan.id === 'premium' && (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-xs">Best Value</Badge>
                  )}
                  {plan.enterprise && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-xs">Enterprise</Badge>
                  )}
                  <div className="text-lg font-bold">{formatPrice(plan.price)}</div>
                  {plan.price !== 'custom' && plan.price > 0 && (
                    <div className="text-xs text-muted-foreground">
                      /{plan.interval}
                    </div>
                  )}
                  {plan.enterprise && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Plans typically start at $499/mo. Volume and SLA included.
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Features */}
        <tbody>
          <FeatureRow feature="Whale Alerts" free={true} pro={true} premium={true} enterprise={true} />
          <FeatureRow feature="Daily Alert Limit" free="50/day" pro="Unlimited" premium="Unlimited" enterprise="Unlimited" />
          <FeatureRow feature="All Chain Support" free={false} pro={true} premium={true} enterprise={true} />
          <FeatureRow feature="Yield Farming Insights" free={false} pro={true} premium={true} enterprise={true} />
          <FeatureRow feature="Portfolio Tracking" free={false} pro={true} premium={true} enterprise={true} />
          <FeatureRow feature="AI Risk Scanner" free={false} pro={false} premium={true} enterprise={true} />
          <FeatureRow feature="Smart Contract Analysis" free={false} pro={false} premium="coming-soon" enterprise="coming-soon" />
          <FeatureRow feature="Wallet Security Scoring" free={false} pro={false} premium="coming-soon" enterprise="coming-soon" />
          <FeatureRow feature="API Access" free={false} pro={false} premium={true} enterprise={true} />
          <FeatureRow feature="Workflow Automation" free={false} pro={false} premium={false} enterprise="coming-soon" />
          <FeatureRow feature="Forensics Dashboard" free={false} pro={false} premium={false} enterprise="coming-soon" />
          <FeatureRow feature="Custom API Limits" free={false} pro={false} premium={false} enterprise={true} />
          <FeatureRow feature="Dedicated Support" free={false} pro={false} premium={false} enterprise={true} />
        </tbody>

        {/* Footer CTAs */}
        <tfoot>
          <tr>
            <td className="py-4 px-4 font-semibold">Choose Plan</td>
            {plans.map((plan) => (
              <td key={plan.id} className="py-4 px-4 text-center">
                <Button
                  className={`w-full ${
                    plan.enterprise ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600' : ''
                  }`}
                  variant={currentPlan === plan.id ? "outline" : "default"}
                  onClick={() => {
                    trackPricingEvent.planCtaClicked(plan.id, isAnnual ? 'year' : 'month', 'table');
                    onSubscribe(plan);
                  }}
                  disabled={isLoading || currentPlan === plan.id}
                  size="sm"
                >
                  {isLoading ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : currentPlan === plan.id ? (
                    'Current'
                  ) : (
                    <>
                      {plan.enterprise ? (
                        <><Mail className="w-3 h-3 mr-1" />Contact</>
                      ) : plan.id === 'free' ? (
                        <><CreditCard className="w-3 h-3 mr-1" />Free</>
                      ) : (
                        <><CreditCard className="w-3 h-3 mr-1" />Upgrade</>
                      )}
                    </>
                  )}
                </Button>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};