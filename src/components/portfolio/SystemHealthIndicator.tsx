import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface HealthStatus {
  price_oracle: { status: string; cache_size?: number };
  eth_provider: { circuit_state: string; failures: number; cache_size: number };
  sim_version: string;
}

interface SystemHealthIndicatorProps {
  healthStatus: HealthStatus;
  latencyMs?: number;
}

export function SystemHealthIndicator({ healthStatus, latencyMs }: SystemHealthIndicatorProps) {
  const getOverallStatus = () => {
    if (healthStatus.eth_provider.circuit_state === 'open') return 'degraded';
    if (healthStatus.eth_provider.failures > 0) return 'warning';
    return 'healthy';
  };

  const status = getOverallStatus();
  
  const statusConfig = {
    healthy: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    warning: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    degraded: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  const IconComponent = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge variant="outline" className={`${config.color} text-xs flex items-center gap-1`}>
          <IconComponent className="h-3 w-3" />
          System {status}
          {latencyMs && <span className="text-xs">({latencyMs}ms)</span>}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-2">
          <p className="font-medium">System Health:</p>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Price Oracle:</span>
              <span className="text-green-600">✓ Active</span>
            </div>
            <div className="flex justify-between">
              <span>ETH Provider:</span>
              <span className={healthStatus.eth_provider.circuit_state === 'closed' ? 'text-green-600' : 'text-red-600'}>
                {healthStatus.eth_provider.circuit_state === 'closed' ? '✓ Online' : '⚠ Circuit Open'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sim Version:</span>
              <span>v{healthStatus.sim_version}</span>
            </div>
            {latencyMs && (
              <div className="flex justify-between">
                <span>Response Time:</span>
                <span className={latencyMs < 500 ? 'text-green-600' : 'text-yellow-600'}>
                  {latencyMs}ms
                </span>
              </div>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}