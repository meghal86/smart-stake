import React from 'react';
import { Database, Wifi, WifiOff, Clock, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface DataSource {
  name: string;
  type: 'real' | 'simulated' | 'cached';
  status: 'healthy' | 'degraded' | 'offline';
  lastUpdate: Date;
  coverage: number;
}

interface DataLineageCardProps {
  sources: DataSource[];
  totalDataPoints: number;
  realDataPercentage: number;
}

export const DataLineageCard: React.FC<DataLineageCardProps> = ({
  sources,
  totalDataPoints,
  realDataPercentage
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <Wifi className="h-4 w-4 text-yellow-500" />;
      case 'offline': return <WifiOff className="h-4 w-4 text-red-500" />;
      default: return <Database className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'real': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'simulated': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'cached': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Data Provenance & Lineage
          </h3>
          <Badge variant="outline" className="text-xs">
            {realDataPercentage.toFixed(1)}% Real Data
          </Badge>
        </div>

        {/* Data Quality Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Data Quality Score</span>
            <span className="font-medium">{realDataPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={realDataPercentage} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {totalDataPoints.toLocaleString()} total data points
          </div>
        </div>

        {/* Data Sources */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Active Sources</h4>
          {sources.map((source, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                {getStatusIcon(source.status)}
                <div>
                  <div className="font-medium text-sm">{source.name}</div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getTypeColor(source.type)}`}>
                      {source.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {source.coverage}% coverage
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(source.lastUpdate).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Data Lineage Summary */}
        <div className="pt-3 border-t border-muted/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-500">
                {sources.filter(s => s.type === 'real').length}
              </div>
              <div className="text-xs text-muted-foreground">Real Sources</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-500">
                {sources.filter(s => s.type === 'simulated').length}
              </div>
              <div className="text-xs text-muted-foreground">Simulated</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-500">
                {sources.filter(s => s.type === 'cached').length}
              </div>
              <div className="text-xs text-muted-foreground">Cached</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};