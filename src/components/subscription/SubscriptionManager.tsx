import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Download, 
  ExternalLink, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionDetails {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  items: {
    data: Array<{
      price: {
        id: string;
        unit_amount: number;
        currency: string;
        recurring: {
          interval: string;
        };
      };
    }>;
  };
  latest_invoice?: {
    hosted_invoice_url: string;
    invoice_pdf: string;
  };
}

interface Invoice {
  id: string;
  amount_paid: number;
  currency: string;
  status: string;
  created: number;
  hosted_invoice_url: string;
  invoice_pdf: string;
}

export const SubscriptionManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscriptionDetails();
      fetchInvoices();
    }
  }, [user]);

  const callStripeFunction = async (action: string, data: unknown = {}) => {
    const response = await supabase.functions.invoke('manage-subscription', {
      body: { action, ...data },
    });

    if (response.error) {
      throw new Error(response.error.message || 'Request failed');
    }

    return response.data;
  };

  const fetchSubscriptionDetails = async () => {
    try {
      setError(null);
      const result = await callStripeFunction('get_details');
      setSubscription(result.subscription);
    } catch (err: unknown) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const result = await callStripeFunction('get_invoices');
      setInvoices(result.invoices || []);
    } catch (err: unknown) {
      console.error('Failed to fetch invoices:', err);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    setIsUpdating(true);
    try {
      const result = await callStripeFunction('cancel');
      setSubscription({ ...subscription, cancel_at_period_end: true });
      toast({
        title: "Subscription Canceled",
        description: result.message,
      });
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription) return;

    setIsUpdating(true);
    try {
      const result = await callStripeFunction('reactivate');
      setSubscription({ ...subscription, cancel_at_period_end: false });
      toast({
        title: "Subscription Reactivated",
        description: result.message,
      });
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleManageBilling = async () => {
    setIsUpdating(true);
    try {
      const result = await callStripeFunction('create_portal_session');
      window.open(result.url, '_blank');
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, icon: CheckCircle, text: 'Active' },
      canceled: { variant: 'destructive' as const, icon: XCircle, text: 'Canceled' },
      past_due: { variant: 'destructive' as const, icon: AlertTriangle, text: 'Past Due' },
      unpaid: { variant: 'destructive' as const, icon: AlertTriangle, text: 'Unpaid' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: 'secondary' as const,
      icon: AlertTriangle,
      text: status
    };

    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            You don't have an active subscription. Upgrade to premium to unlock all features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.href = '/subscription'}>
            View Plans
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentPrice = subscription.items.data[0]?.price;
  const amount = currentPrice ? formatAmount(currentPrice.unit_amount, currentPrice.currency) : 'N/A';
  const interval = currentPrice?.recurring?.interval || 'month';

  return (
    <div className="space-y-6">
      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </div>
            {getStatusBadge(subscription.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Amount
              </div>
              <div className="text-2xl font-bold">{amount}/{interval}</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Current Period
              </div>
              <div className="text-sm">
                {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Settings className="h-4 w-4" />
                Next Billing
              </div>
              <div className="text-sm">
                {subscription.cancel_at_period_end 
                  ? 'Canceled at period end' 
                  : formatDate(subscription.current_period_end)
                }
              </div>
            </div>
          </div>

          {subscription.cancel_at_period_end && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your subscription will be canceled on {formatDate(subscription.current_period_end)}. 
                You'll continue to have access until then.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={isUpdating}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Manage Billing
            </Button>

            {subscription.cancel_at_period_end ? (
              <Button
                onClick={handleReactivateSubscription}
                disabled={isUpdating}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Reactivate Subscription
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={isUpdating}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Recent Invoices
          </CardTitle>
          <CardDescription>
            Download your recent invoices and receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No invoices found</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {formatAmount(invoice.amount_paid, invoice.currency)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(invoice.created)} • {getStatusBadge(invoice.status)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(invoice.hosted_invoice_url, '_blank')}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(invoice.invoice_pdf, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};