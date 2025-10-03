import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Fish, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Shield, 
  DollarSign, 
  BarChart3, 
  Target,
  Users,
  Zap,
  Globe,
  Clock,
  X,
  Plus,
  Eye,
  Star
} from 'lucide-react';

interface WhaleComparisonProps {
  selectedWhales: any[];
  onRemoveWhale: (whaleId: string) => void;
  onClearAll: () => void;
  onAddToWatchlist: (whaleId: string) => void;
}

export function WhaleComparison({ 
  selectedWhales, 
  onRemoveWhale, 
  onClearAll, 
  onAddToWatchlist 
}: WhaleComparisonProps) {
  if (selectedWhales.length === 0) {
    return (
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="p-8 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Whales Selected</h3>
          <p className="text-muted-foreground mb-4">
            Select whales from the list to compare their behavior, risk profiles, and activity patterns.
          </p>
          <div className="text-sm text-muted-foreground">
            💡 Tip: Click on whale cards to add them to comparison
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-green-600';
  };

  const getInfluenceColor = (influence: string) => {
    switch (influence) {
      case 'Very High': return 'text-purple-600';
      case 'High': return 'text-blue-600';
      case 'Medium': return 'text-amber-600';
      default: return 'text-meta';
    }
  };

  return (
    <div className="space-y-6">
      {/* Comparison Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Whale Comparison</h3>
            <p className="text-sm text-muted-foreground">
              Comparing {selectedWhales.length} whale{selectedWhales.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClearAll}>
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <Button variant="outline" size="sm">
            <Star className="w-4 h-4 mr-2" />
            Save Comparison
          </Button>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {selectedWhales.map((whale) => (
          <Card key={whale.id} className="relative group">
            <CardContent className="p-6">
              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemoveWhale(whale.id)}
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Whale Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Fish className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-semibold truncate">
                    {whale.address?.slice(0, 8)}...{whale.address?.slice(-6)}
                  </p>
                  <div className="flex gap-1 mt-1">
                    {whale.labels?.slice(0, 2).map((label: string) => (
                      <Badge key={label} variant="outline" className="text-xs">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Key Metrics Comparison */}
              <div className="space-y-4">
                {/* Balance */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      Balance
                    </span>
                    <span className="font-bold text-green-600">
                      ${((whale.balance || 0) / 1e6).toFixed(1)}M
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {whale.balance > 100000000 ? 'Mega Whale' : 
                     whale.balance > 50000000 ? 'Large Whale' : 
                     whale.balance > 10000000 ? 'Medium Whale' : 'Small Whale'}
                  </div>
                </div>

                {/* Risk Score */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-600" />
                      Risk Score
                    </span>
                    <span className={`font-bold ${getRiskColor(whale.riskScore || 0)}`}>
                      {whale.riskScore}/100
                    </span>
                  </div>
                  <Progress 
                    value={whale.riskScore} 
                    className="h-2"
                    style={{
                      background: `linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)`
                    }}
                  />
                </div>

                {/* Influence */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      Influence
                    </span>
                    <span className={`font-bold ${getInfluenceColor(whale.influence)}`}>
                      {whale.influence}
                    </span>
                  </div>
                </div>

                {/* Activity Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">24h Txns</span>
                    </div>
                    <div className="font-bold text-lg text-blue-600">
                      {whale.transactions24h || 0}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-700">Net Flow</span>
                    </div>
                    <div className={`font-bold text-lg ${
                      (whale.netFlow24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(whale.netFlow24h || 0) >= 0 ? '+' : ''}${Math.abs((whale.netFlow24h || 0) / 1e6).toFixed(1)}M
                    </div>
                  </div>
                </div>

                {/* Chains */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Active Chains</span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {whale.chains?.map((chain: string) => (
                      <Badge key={chain} variant="outline" className="text-xs">
                        {chain.charAt(0).toUpperCase() + chain.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Last Activity */}
                <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Last Activity</span>
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(whale.lastActivity).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    Analyze
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onAddToWatchlist(whale.id)}
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Summary */}
      {selectedWhales.length > 1 && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Comparison Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Highest Risk</h4>
                <div className="text-2xl font-bold text-red-600">
                  {Math.max(...selectedWhales.map(w => w.riskScore || 0))}/100
                </div>
                <p className="text-xs text-muted-foreground">
                  Highest risk score among selected whales
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Total Value</h4>
                <div className="text-2xl font-bold text-green-600">
                  ${(selectedWhales.reduce((sum, w) => sum + (w.balance || 0), 0) / 1e6).toFixed(1)}M
                </div>
                <p className="text-xs text-muted-foreground">
                  Combined balance of selected whales
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Total Activity</h4>
                <div className="text-2xl font-bold text-blue-600">
                  {selectedWhales.reduce((sum, w) => sum + (w.transactions24h || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Combined 24h transactions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
