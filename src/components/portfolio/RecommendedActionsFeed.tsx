import { useState } from 'react';
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  ChevronDown, 
  ChevronUp,
  Filter,
  Zap,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { RecommendedAction, FreshnessConfidence } from '@/types/portfolio';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RecommendedActionsFeedProps {
  actions: RecommendedAction[];
  freshness: FreshnessConfidence;
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  showTopN?: number;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function RecommendedActionsFeed({ 
  actions, 
  freshness, 
  currentFilter, 
  onFilterChange,
  showTopN = 5,
  isLoading = false,
  error = null,
  onRetry
}: RecommendedActionsFeedProps) {
  const [showAll, setShowAll] = useState(false);
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return AlertTriangle;
      case 'high': return Shield;
      case 'medium': return TrendingUp;
      default: return Zap;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.round(seconds / 60)}m`;
  };

  const toggleActionExpansion = (actionId: string) => {
    const newExpanded = new Set(expandedActions);
    if (newExpanded.has(actionId)) {
      newExpanded.delete(actionId);
    } else {
      newExpanded.add(actionId);
    }
    setExpandedActions(newExpanded);
  };

  // Filter and sort actions
  const filteredActions = actions
    .filter(action => {
      if (currentFilter === 'all') return true;
      if (currentFilter === 'critical') return action.severity === 'critical';
      if (currentFilter === 'high') return action.severity === 'high';
      return true;
    })
    .sort((a, b) => b.actionScore - a.actionScore);

  const displayedActions = showAll ? filteredActions : filteredActions.slice(0, showTopN);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: showTopN }).map((_, index) => (
        <div key={index} className="p-4 rounded-lg border border-gray-700/50 bg-gray-800/30 animate-pulse">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-gray-700 rounded w-32"></div>
                  <div className="h-4 bg-gray-700 rounded w-16"></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="h-3 bg-gray-700 rounded w-16"></div>
                  <div className="h-3 bg-gray-700 rounded w-20"></div>
                  <div className="h-3 bg-gray-700 rounded w-18"></div>
                  <div className="h-3 bg-gray-700 rounded w-12"></div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="h-3 bg-gray-700 rounded w-16"></div>
              <div className="h-8 bg-gray-700 rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Error state component
  const ErrorState = () => (
    <div className="text-center py-8">
      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
      <h4 className="text-lg font-medium mb-2 text-white">Failed to Load Actions</h4>
      <p className="text-gray-400 mb-4">
        {error || 'Unable to fetch recommended actions. Please try again.'}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="text-gray-300 border-gray-600 hover:bg-gray-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Recommended Actions</h3>
          <Badge variant="outline" className="text-xs">
            {filteredActions.length} actions
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <Select value={currentFilter} onValueChange={onFilterChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="critical">Critical Only</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions List */}
      <div className="space-y-4">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState />
        ) : displayedActions.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h4 className="text-lg font-medium mb-2 text-white">No Actions Required</h4>
            <p className="text-gray-400">
              Your portfolio is optimized. Check back later for new opportunities.
            </p>
          </div>
        ) : (
          displayedActions.map((action) => {
            const SeverityIcon = getSeverityIcon(action.severity);
            const isExpanded = expandedActions.has(action.id);
            
            return (
              <div 
                key={action.id} 
                className={`p-4 rounded-lg border transition-colors hover:bg-gray-700/30 ${getSeverityColor(action.severity)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${getSeverityColor(action.severity)}`}>
                      <SeverityIcon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-white">{action.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          Score: {action.actionScore.toFixed(1)}
                        </Badge>
                      </div>
                      
                      {/* Impact Preview */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-sm">
                        {action.impactPreview.riskDelta !== 0 && (
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-gray-400" />
                            <span className={action.impactPreview.riskDelta < 0 ? 'text-green-400' : 'text-red-400'}>
                              {action.impactPreview.riskDelta > 0 ? '+' : ''}{(action.impactPreview.riskDelta * 100).toFixed(1)}% risk
                            </span>
                          </div>
                        )}
                        
                        {action.impactPreview.preventedLossP50Usd > 0 && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-gray-400" />
                            <span className="text-green-400">
                              {formatCurrency(action.impactPreview.preventedLossP50Usd)} saved
                            </span>
                          </div>
                        )}
                        
                        {action.impactPreview.expectedGainUsd > 0 && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-gray-400" />
                            <span className="text-green-400">
                              {formatCurrency(action.impactPreview.expectedGainUsd)} gain
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-300">
                            {formatTime(action.impactPreview.timeEstimateSec)}
                          </span>
                        </div>
                      </div>

                      {/* Why reasons (expandable) */}
                      {isExpanded && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-300 mb-2">Why this matters:</p>
                          <ul className="text-sm text-gray-400 space-y-1">
                            {action.why.map((reason, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-gray-500 mt-1">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-sm text-gray-400">
                      {Math.round(action.impactPreview.confidence * 100)}% confidence
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActionExpansion(action.id)}
                        className="h-6 w-6 p-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        disabled={freshness.degraded && action.severity === 'critical'}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {action.cta.label}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Progressive Disclosure */}
      {!isLoading && !error && filteredActions.length > showTopN && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="text-gray-300 border-gray-600 hover:bg-gray-700"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Show Top {showTopN}
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                View All {filteredActions.length} Actions
              </>
            )}
          </Button>
        </div>
      )}

      {/* Degraded Mode Warning */}
      {freshness.degraded && (
        <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600/30 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <p className="text-sm text-yellow-200">
              Critical actions are disabled in degraded mode. Improve data confidence to enable.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}