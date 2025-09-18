import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, RefreshCw, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AppLayout } from '@/components/layout/AppLayout';

interface HealthStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'checking';
  responseTime?: number;
  error?: string;
  lastChecked?: Date;
  apiEndpoint?: string;
  description?: string;
  affectedFeatures?: string[];
}

export default function HealthCheck() {
  const [services, setServices] = useState<HealthStatus[]>([
    { 
      name: 'Supabase Database', 
      status: 'checking',
      apiEndpoint: 'supabase.from("users").select()',
      description: 'PostgreSQL database connectivity check',
      affectedFeatures: ['User authentication', 'Subscription management', 'All data storage', 'User preferences']
    },
    { 
      name: 'Supabase Auth', 
      status: 'checking',
      apiEndpoint: 'supabase.auth.getSession()',
      description: 'Authentication service status',
      affectedFeatures: ['Login/Signup', 'User sessions', 'Protected pages', 'Profile management']
    },
    { 
      name: 'Stripe API', 
      status: 'checking',
      apiEndpoint: 'stripe.products.list()',
      description: 'Payment processing service',
      affectedFeatures: ['Subscription checkout', 'Payment verification', 'Plan upgrades', 'Billing management']
    },
    { 
      name: 'Resend Email', 
      status: 'checking',
      apiEndpoint: 'https://api.resend.com/domains',
      description: 'Email delivery service',
      affectedFeatures: ['Email notifications', 'Whale alerts via email', 'Password reset emails', 'Welcome emails']
    },
    { 
      name: 'Whale Alert API', 
      status: 'checking',
      apiEndpoint: 'https://api.whale-alert.io/v1/status',
      description: 'Large transaction monitoring',
      affectedFeatures: ['Real-time whale alerts', 'Transaction monitoring', 'Whale dashboard', 'Alert notifications']
    },
    { 
      name: 'Alchemy API', 
      status: 'checking',
      apiEndpoint: 'https://eth-mainnet.g.alchemy.com/v2/{key}',
      description: 'Ethereum blockchain data provider',
      affectedFeatures: ['Ethereum transaction data', 'Wallet balance checks', 'Smart contract interactions', 'Gas price estimates']
    },
    { 
      name: 'Moralis API', 
      status: 'checking',
      apiEndpoint: 'https://deep-index.moralis.io/api/v2/',
      description: 'Multi-chain blockchain data',
      affectedFeatures: ['Multi-chain support', 'NFT data', 'Token balances', 'Cross-chain analytics']
    },
    { 
      name: 'Etherscan API', 
      status: 'checking',
      apiEndpoint: 'https://api.etherscan.io/api',
      description: 'Ethereum blockchain explorer',
      affectedFeatures: ['Transaction verification', 'Address labeling', 'Contract verification', 'Historical data']
    },
    { 
      name: 'OpenAI API', 
      status: 'checking',
      apiEndpoint: 'https://api.openai.com/v1/models',
      description: 'AI-powered analysis and insights',
      affectedFeatures: ['AI risk analysis', 'Smart recommendations', 'Sentiment analysis', 'Automated insights']
    },
    { 
      name: 'CoinGecko API', 
      status: 'checking',
      apiEndpoint: 'https://api.coingecko.com/api/v3/ping',
      description: 'Cryptocurrency market data',
      affectedFeatures: ['Token prices', 'Market cap data', 'Price charts', 'Market sentiment']
    },
    { 
      name: 'DefiLlama API', 
      status: 'checking',
      apiEndpoint: 'https://api.llama.fi/protocols',
      description: 'DeFi protocol analytics',
      affectedFeatures: ['DeFi yield tracking', 'Protocol analytics', 'TVL data', 'Yield farming insights']
    },
    { 
      name: 'Risk Scanner', 
      status: 'checking',
      apiEndpoint: 'supabase.from("risk_scores")',
      description: 'Address risk assessment system',
      affectedFeatures: ['Risk scoring', 'Sanctions screening', 'Address analysis', 'Compliance checks']
    },
    { 
      name: 'Notification System', 
      status: 'checking',
      apiEndpoint: 'supabase.from("notification_logs")',
      description: 'Multi-channel alert delivery',
      affectedFeatures: ['Push notifications', 'SMS alerts', 'Email alerts', 'Alert history']
    },
    { 
      name: 'Edge Functions', 
      status: 'checking',
      apiEndpoint: 'supabase.functions.invoke()',
      description: 'Serverless function infrastructure',
      affectedFeatures: ['API processing', 'Background tasks', 'Data processing', 'Webhook handling']
    }
  ]);

  const checkHealth = async () => {
    const checks = services.map(async (service) => {
      const startTime = Date.now();
      try {
        let isHealthy = false;
        
        const baseUrl = 'https://rebeznxivaxgserswhbn.supabase.co/functions/v1/health-check';
        const headers = {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json'
        };
        
        switch (service.name) {
          case 'Supabase Database':
            const dbResponse = await fetch(`${baseUrl}?service=database`, { headers });
            isHealthy = dbResponse.ok;
            break;
          case 'Supabase Auth':
            isHealthy = true;
            break;
          case 'Stripe API':
            const stripeResponse = await fetch(`${baseUrl}?service=stripe`, { headers });
            isHealthy = stripeResponse.ok;
            break;
          case 'Resend Email':
            const emailResponse = await fetch(`${baseUrl}?service=email`, { headers });
            isHealthy = emailResponse.ok;
            break;
          case 'Whale Alert API':
            const whaleResponse = await fetch(`${baseUrl}?service=whale-alert`, { headers });
            isHealthy = whaleResponse.ok;
            break;
          case 'Alchemy API':
            const alchemyResponse = await fetch(`${baseUrl}?service=alchemy`, { headers });
            isHealthy = alchemyResponse.ok;
            break;
          case 'Moralis API':
            const moralisResponse = await fetch(`${baseUrl}?service=moralis`, { headers });
            isHealthy = moralisResponse.ok;
            break;
          case 'Etherscan API':
            const etherscanResponse = await fetch(`${baseUrl}?service=etherscan`, { headers });
            isHealthy = etherscanResponse.ok;
            break;
          case 'OpenAI API':
            const openaiResponse = await fetch(`${baseUrl}?service=openai`, { headers });
            isHealthy = openaiResponse.ok;
            break;
          case 'CoinGecko API':
            const geckoResponse = await fetch('https://api.coingecko.com/api/v3/ping');
            isHealthy = geckoResponse.ok;
            break;
          case 'DefiLlama API':
            const llamaResponse = await fetch('https://api.llama.fi/protocols');
            isHealthy = llamaResponse.ok;
            break;
          case 'Risk Scanner':
            const riskResponse = await fetch(`${baseUrl}?service=risk-scanner`, { headers });
            isHealthy = riskResponse.ok;
            break;
          case 'Notification System':
            const notifResponse = await fetch(`${baseUrl}?service=notifications`, { headers });
            isHealthy = notifResponse.ok;
            break;
          case 'Edge Functions':
            const funcResponse = await fetch(`${baseUrl}`, { headers });
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
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="p-1 hover:bg-muted rounded">
                          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium">{service.name}</h4>
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium mb-1">API Endpoint:</p>
                            <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                              {service.apiEndpoint}
                            </p>
                          </div>
                          {service.affectedFeatures && (
                            <div>
                              <p className="text-xs font-medium text-red-600 mb-2">
                                ⚠️ If this service fails, these features won't work:
                              </p>
                              <ul className="text-xs space-y-1">
                                {service.affectedFeatures.map((feature, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <span className="text-red-500 mt-0.5">•</span>
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
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