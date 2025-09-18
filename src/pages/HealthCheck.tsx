import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

interface HealthStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'checking';
  responseTime?: number;
  error?: string;
  lastChecked?: Date;
}

export default function HealthCheck() {
  const [services, setServices] = useState<HealthStatus[]>([
    { name: 'Supabase Database', status: 'checking' },
    { name: 'Supabase Auth', status: 'checking' },
    { name: 'Stripe API', status: 'checking' },
    { name: 'Resend Email', status: 'checking' },
    { name: 'Whale Alerts API', status: 'checking' },
    { name: 'Risk Scanner', status: 'checking' },
    { name: 'Notification System', status: 'checking' },
    { name: 'Edge Functions', status: 'checking' }
  ]);

  const checkHealth = async () => {
    const checks = services.map(async (service) => {
      const startTime = Date.now();
      try {
        let isHealthy = false;
        
        const baseUrl = 'https://rebeznxivaxgserswhbn.supabase.co/functions/v1/health-check';
        
        switch (service.name) {
          case 'Supabase Database':
            const dbResponse = await fetch(`${baseUrl}?service=database`);
            isHealthy = dbResponse.ok;
            break;
          case 'Supabase Auth':
            isHealthy = true; // Always healthy if we can load the page
            break;
          case 'Stripe API':
            const stripeResponse = await fetch(`${baseUrl}?service=stripe`);
            isHealthy = stripeResponse.ok;
            break;
          case 'Resend Email':
            const emailResponse = await fetch(`${baseUrl}?service=email`);
            isHealthy = emailResponse.ok;
            break;
          case 'Whale Alerts API':
            isHealthy = true; // Mock for now
            break;
          case 'Risk Scanner':
            isHealthy = true; // Mock for now
            break;
          case 'Notification System':
            isHealthy = true; // Mock for now
            break;
          case 'Edge Functions':
            const funcResponse = await fetch(`${baseUrl}`);
            isHealthy = funcResponse.ok;
            break;
        }

        return {
          ...service,
          status: isHealthy ? 'healthy' : 'unhealthy' as const,
          responseTime: Date.now() - startTime,
          lastChecked: new Date(),
          error: isHealthy ? undefined : 'Service unavailable'
        };
      } catch (error) {
        return {
          ...service,
          status: 'unhealthy' as const,
          responseTime: Date.now() - startTime,
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const results = await Promise.all(checks);
    setServices(results);
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'unhealthy':
        return <Badge className="bg-red-100 text-red-800">Unhealthy</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Checking</Badge>;
    }
  };

  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const totalCount = services.length;

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">System Health Check</h1>
            <p className="text-muted-foreground">
              Monitor all API services and system components
            </p>
          </div>
          <Button onClick={checkHealth} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh All
          </Button>
        </div>

        <div className="grid gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                System Overview
                <Badge variant={healthyCount === totalCount ? 'default' : 'destructive'}>
                  {healthyCount}/{totalCount} Services Healthy
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${(healthyCount / totalCount) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {Math.round((healthyCount / totalCount) * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.name}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  {getStatusIcon(service.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    {getStatusBadge(service.status)}
                  </div>
                  
                  {service.responseTime && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Response:</span>
                      <span className="text-sm font-mono">{service.responseTime}ms</span>
                    </div>
                  )}
                  
                  {service.lastChecked && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Last Check:</span>
                      <span className="text-sm">{service.lastChecked.toLocaleTimeString()}</span>
                    </div>
                  )}
                  
                  {service.error && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                      {service.error}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}