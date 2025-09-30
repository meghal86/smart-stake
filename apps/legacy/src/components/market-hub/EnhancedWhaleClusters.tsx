import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EnhancedTooltip } from '@/components/ui/enhanced-tooltip';
import { Star, StarOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedWhaleClustersProps {
  clusters: any[];
  onClusterClick: (clusterId: string) => void;
  onToggleStar: (clusterId: string) => void;
  starredClusters: Set<string>;
  className?: string;
  isMobile?: boolean;
}

export function EnhancedWhaleClusters({ 
  clusters, 
  onClusterClick, 
  onToggleStar,
  starredClusters,
  className,
  isMobile = false 
}: EnhancedWhaleClustersProps) {
  const getClusterColor = (type: string) => {
    switch (type) {
      case 'DORMANT_WAKING': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'CEX_INFLOW': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'DEFI_ACTIVITY': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'DISTRIBUTION': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { label: 'Critical', color: 'text-red-600' };
    if (score >= 60) return { label: 'High', color: 'text-orange-600' };
    if (score >= 40) return { label: 'Medium', color: 'text-yellow-600' };
    return { label: 'Low', color: 'text-green-600' };
  };

  // Sort clusters: starred first, then by risk score
  const sortedClusters = [...clusters].sort((a, b) => {
    const aStarred = starredClusters.has(a.id);
    const bStarred = starredClusters.has(b.id);
    
    if (aStarred && !bStarred) return -1;
    if (!aStarred && bStarred) return 1;
    return b.riskScore - a.riskScore;
  });

  if (isMobile) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Whale Clusters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
            {sortedClusters.map((cluster) => (
              <MobileClusterCard
                key={cluster.id}
                cluster={cluster}
                onClusterClick={onClusterClick}
                onToggleStar={onToggleStar}
                isStarred={starredClusters.has(cluster.id)}
                getClusterColor={getClusterColor}
                getRiskLevel={getRiskLevel}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">Behavioral Clusters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedClusters.map((cluster) => (
            <DesktopClusterCard
              key={cluster.id}
              cluster={cluster}
              onClusterClick={onClusterClick}
              onToggleStar={onToggleStar}
              isStarred={starredClusters.has(cluster.id)}
              getClusterColor={getClusterColor}
              getRiskLevel={getRiskLevel}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MobileClusterCard({ 
  cluster, 
  onClusterClick, 
  onToggleStar, 
  isStarred, 
  getClusterColor, 
  getRiskLevel 
}: any) {
  const risk = getRiskLevel(cluster.riskScore);
  
  return (
    <div className="flex-shrink-0 w-48 snap-start">
      <div 
        className={cn(
          'p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md',
          isStarred && 'ring-2 ring-blue-400 ring-opacity-50'
        )}
        onClick={() => onClusterClick(cluster.id)}
      >
        <div className="flex items-center justify-between mb-2">
          <Badge className={getClusterColor(cluster.type)}>
            {cluster.type.replace('_', ' ')}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(cluster.id);
            }}
          >
            {isStarred ? (
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOff className="w-3 h-3" />
            )}
          </Button>
        </div>
        
        <div className="space-y-1">
          <div className="text-sm font-medium">{cluster.name}</div>
          <div className="text-xs text-muted-foreground">
            {cluster.membersCount} addresses
          </div>
          <div className="text-xs">
            ${(cluster.sumBalanceUsd / 1000000).toFixed(1)}M
          </div>
          <div className={cn('text-xs font-medium', risk.color)}>
            {risk.label} Risk
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopClusterCard({ 
  cluster, 
  onClusterClick, 
  onToggleStar, 
  isStarred, 
  getClusterColor, 
  getRiskLevel 
}: any) {
  const risk = getRiskLevel(cluster.riskScore);
  
  return (
    <EnhancedTooltip
      content={
        <div className="space-y-2 max-w-xs">
          <div className="font-medium">{cluster.name}</div>
          <div className="text-xs space-y-1">
            <div>Members: {cluster.membersCount} addresses</div>
            <div>Total Value: ${(cluster.sumBalanceUsd / 1000000).toFixed(1)}M</div>
            <div>24h Flow: ${(Math.abs(cluster.netFlow24h) / 1000000).toFixed(1)}M</div>
            <div>Confidence: {(cluster.confidence * 100).toFixed(0)}%</div>
          </div>
          {cluster.classificationReasons && (
            <div className="text-xs text-gray-400 border-t pt-2">
              {cluster.classificationReasons.join(', ')}
            </div>
          )}
        </div>
      }
    >
      <div 
        className={cn(
          'p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md hover:bg-accent/50',
          isStarred && 'ring-2 ring-blue-400 ring-opacity-50'
        )}
        onClick={() => onClusterClick(cluster.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={getClusterColor(cluster.type)}>
              {cluster.type.replace('_', ' ')}
            </Badge>
            <span className="text-sm font-medium">{cluster.name}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-medium', risk.color)}>
              {risk.label}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar(cluster.id);
              }}
            >
              {isStarred ? (
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              ) : (
                <StarOff className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{cluster.membersCount} addresses</span>
          <span>${(cluster.sumBalanceUsd / 1000000).toFixed(1)}M</span>
        </div>
      </div>
    </EnhancedTooltip>
  );
}