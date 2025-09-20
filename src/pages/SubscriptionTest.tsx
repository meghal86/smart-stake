import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ComingSoonBadge } from '@/components/ComingSoonBadge';
import { AppLayout } from '@/components/layout/AppLayout';

const SubscriptionTest: React.FC = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Subscription Components Test</h1>
        
        <div className="grid gap-6">
          {/* ComingSoonBadge Test */}
          <Card>
            <CardHeader>
              <CardTitle>ComingSoonBadge Component Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <span>Default badge:</span>
                <ComingSoonBadge />
              </div>
              <div className="flex items-center gap-4">
                <span>Custom label:</span>
                <ComingSoonBadge label="Beta" />
              </div>
              <div className="flex items-center gap-4">
                <span>In feature list:</span>
                <span>Smart contract analysis<ComingSoonBadge /></span>
              </div>
            </CardContent>
          </Card>

          {/* Plan Features Test */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Features with Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>✓ Everything in Premium</div>
                <div>✓ Workflow automation<ComingSoonBadge /></div>
                <div>✓ Forensics dashboard: wash trading, collusion detection<ComingSoonBadge /></div>
                <div>✓ Custom API limits</div>
                <div>✓ SLA + dedicated account manager</div>
                <div>✓ Advanced white-label options</div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Display Test */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing Display Test</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <Badge>Free</Badge>
                <div className="text-2xl font-bold">Free</div>
              </div>
              <div className="text-center">
                <Badge className="bg-primary">Pro - Most Popular</Badge>
                <div className="text-2xl font-bold">$9.99/month</div>
                <div className="text-sm text-green-600">$95.99/year (20% off)</div>
              </div>
              <div className="text-center">
                <Badge>Premium</Badge>
                <div className="text-2xl font-bold">$19.99/month</div>
                <div className="text-sm text-green-600">$191.99/year (20% off)</div>
              </div>
              <div className="text-center">
                <Badge className="bg-gradient-to-r from-purple-500 to-blue-500">Enterprise</Badge>
                <div className="text-2xl font-bold">Custom pricing</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default SubscriptionTest;