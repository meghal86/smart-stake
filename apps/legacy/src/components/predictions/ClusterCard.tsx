import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { PredictionCluster } from '@/hooks/usePredictionClusters';
import { track } from '@/lib/analytics';

interface ClusterCardProps {
  cluster: PredictionCluster;
  onClick: (cluster: PredictionCluster) => void;
  isSelected?: boolean;
}

export function ClusterCard({ cluster, onClick, isSelected }: ClusterCardProps) {
  const handleClick = () => {
    track('cluster_clicked', {
      cluster_id: cluster.id,
      assets: cluster.assets,
      direction: cluster.direction
    });
    onClick(cluster);
  };

  return (
    <Card 
      className={`p-3 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2 mb-2">
        {cluster.direction === 'long' ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
        <span className="font-medium text-sm">{cluster.label}</span>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        {cluster.assets.map(asset => (
          <Badge key={asset} variant="outline" className="text-xs">
            {asset}
          </Badge>
        ))}
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{cluster.signal_count} signals</span>
        <span>{Math.round(cluster.confidence * 100)}%</span>
      </div>
    </Card>
  );
}