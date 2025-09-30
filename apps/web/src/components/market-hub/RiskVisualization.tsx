import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Info,
  Eye,
  Zap
} from 'lucide-react';

interface RiskVisualizationProps {
  riskScore: number;
  factors?: {
    exchangeActivity?: number;
    largeTransfers?: number;
    priceCorrelation?: number;
    liquidityImpact?: number;
    entityReputation?: number;
  };
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
  showFactors?: boolean;
  interactive?: boolean;
}

export function RiskVisualization({ 
  riskScore, 
  factors = {},
  confidence = 75,
  size = 'md',
  showFactors = true,
  interactive = false
}: RiskVisualizationProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { level: 'High', color: 'red', bgColor: 'bg-red-50', textColor: 'text-red-700' };
    if (score >= 40) return { level: 'Medium', color: 'orange', bgColor: 'bg-orange-50', textColor: 'text-orange-700' };
    return { level: 'Low', color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700' };
  };

  const risk = getRiskLevel(riskScore);
  
  const sizeClasses = {
    sm: { container: 'w-16 h-16', text: 'text-xs', score: 'text-sm' },
    md: { container: 'w-20 h-20', text: 'text-sm', score: 'text-base' },
    lg: { container: 'w-24 h-24', text: 'text-base', score: 'text-lg' }
  };

  const factorData = [
    { 
      name: 'Exchange Activity', 
      value: factors.exchangeActivity || 0, 
      weight: 30,
      description: 'Frequency and volume of exchange interactions',
      icon: <Activity className="w-3 h-3" />
    },
    { 
      name: 'Large Transfers', 
      value: factors.largeTransfers || 0, 
      weight: 25,
      description: 'Size and frequency of large transactions',
      icon: <TrendingUp className="w-3 h-3" />
    },
    { 
      name: 'Price Correlation', 
      value: factors.priceCorrelation || 0, 
      weight: 20,
      description: 'Correlation between activity and price movements',
      icon: <Zap className="w-3 h-3" />
    },
    { 
      name: 'Liquidity Impact', 
      value: factors.liquidityImpact || 0, 
      weight: 15,
      description: 'Potential impact on market liquidity',
      icon: <AlertTriangle className="w-3 h-3" />
    },
    { 
      name: 'Entity Reputation', 
      value: factors.entityReputation || 0, 
      weight: 10,
      description: 'Known entity labels and reputation score',
      icon: <Shield className="w-3 h-3" />
    }
  ];

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Circular Risk Score */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <CircularProgress 
              value={riskScore} 
              size={size}
              color={risk.color}
            />
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${sizeClasses[size].container}`}>
              <div className={`font-bold ${sizeClasses[size].score} ${risk.textColor}`}>
                {riskScore}
              </div>
              <div className={`${sizeClasses[size].text} text-muted-foreground leading-none`}>
                /100
              </div>
            </div>
          </div>
        </div>

        {/* Risk Level Badge */}
        <div className="text-center">
          <Badge 
            variant={risk.level === 'High' ? 'destructive' : risk.level === 'Medium' ? 'secondary' : 'default'}
            className="text-xs"
          >
            {risk.level} Risk
          </Badge>
        </div>

        {/* Confidence Indicator */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-medium">{confidence}%</span>
          </div>
          <Progress value={confidence} className="h-1" />
        </div>

        {/* Risk Factors */}
        {showFactors && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Risk Factors</span>
              {interactive && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  {showDetails ? 'Hide' : 'Details'}
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              {factorData.map((factor) => (
                <div key={factor.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1">
                      {factor.icon}
                      <span>{factor.name}</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-48">{factor.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="font-medium">
                      {factor.value}% 
                      <span className="text-muted-foreground ml-1">(w:{factor.weight}%)</span>
                    </span>
                  </div>
                  <Progress 
                    value={factor.value} 
                    className="h-1"
                  />
                  
                  {showDetails && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Weighted contribution: {((factor.value * factor.weight) / 100).toFixed(1)} points
                    </div>
                  )}
                </div>
              ))}
            </div>

            {showDetails && (
              <div className="mt-3 p-2 bg-muted/30 rounded text-xs">
                <div className="font-medium mb-1">Risk Calculation</div>
                <div className="text-muted-foreground">
                  Final score: {factorData.reduce((sum, f) => sum + (f.value * f.weight / 100), 0).toFixed(1)}/100
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

interface CircularProgressProps {
  value: number;
  size: 'sm' | 'md' | 'lg';
  color: string;
}

function CircularProgress({ value, size, color }: CircularProgressProps) {
  const sizeMap = {
    sm: { radius: 28, strokeWidth: 4 },
    md: { radius: 36, strokeWidth: 5 },
    lg: { radius: 44, strokeWidth: 6 }
  };

  const { radius, strokeWidth } = sizeMap[size];
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const colorMap = {
    red: '#ef4444',
    orange: '#f97316',
    green: '#22c55e'
  };

  return (
    <div className="relative">
      <svg 
        width={radius * 2 + strokeWidth * 2} 
        height={radius * 2 + strokeWidth * 2}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          stroke={colorMap[color as keyof typeof colorMap]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
    </div>
  );
}

// Compact version for cards
export function CompactRiskScore({ 
  riskScore, 
  showLabel = true 
}: { 
  riskScore: number; 
  showLabel?: boolean; 
}) {
  const getRiskLevel = (score: number) => {
    if (score >= 70) return { level: 'High', color: 'red' };
    if (score >= 40) return { level: 'Medium', color: 'orange' };
    return { level: 'Low', color: 'green' };
  };

  const risk = getRiskLevel(riskScore);

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8">
        <CircularProgress value={riskScore} size="sm" color={risk.color} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold">{riskScore}</span>
        </div>
      </div>
      {showLabel && (
        <Badge 
          variant={risk.level === 'High' ? 'destructive' : risk.level === 'Medium' ? 'secondary' : 'default'}
          className="text-xs"
        >
          {risk.level}
        </Badge>
      )}
    </div>
  );
}

// Risk heatmap for multiple entities
export function RiskHeatmap({ 
  entities 
}: { 
  entities: Array<{ id: string; name: string; riskScore: number; }> 
}) {
  const getRiskColor = (score: number) => {
    if (score >= 70) return 'bg-red-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="grid grid-cols-8 gap-1">
      {entities.map((entity) => (
        <Tooltip key={entity.id}>
          <TooltipTrigger>
            <div 
              className={`w-4 h-4 rounded-sm ${getRiskColor(entity.riskScore)} opacity-80 hover:opacity-100 transition-opacity`}
            />
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <div className="font-medium">{entity.name}</div>
              <div>Risk: {entity.riskScore}/100</div>
            </div>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}