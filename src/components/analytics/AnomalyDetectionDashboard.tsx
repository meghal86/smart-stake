/**
 * Anomaly Detection Dashboard
 * Displays real-time whale behavior anomalies detected by the ML system
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DisabledTooltipButton } from '@/components/ui/disabled-tooltip-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  TrendingUp,
  Activity,
  Zap,
  Users,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Bell,
  Filter
} from 'lucide-react';
import { detectAnomalies, getRecentAnomalies, resolveAnomaly, AnomalyResult } from '@/services/anomalyDetection';
import { supabase } from '@/integrations/supabase/client';
import { FeatureGate } from '@/components/subscription/FeatureGate';

const severityConfig = {
  critical: {
    color: 'bg-red-500 text-white',
    icon: AlertTriangle,
    label: 'Critical',
    borderColor: 'border-red-500'
  },
  high: {
    color: 'bg-orange-500 text-white',
    icon: AlertTriangle,
    label: 'High',
    borderColor: 'border-orange-500'
  },
  medium: {
    color: 'bg-yellow-500 text-black',
    icon: Activity,
    label: 'Medium',
    borderColor: 'border-yellow-500'
  },
  low: {
    color: 'bg-blue-500 text-white',
    icon: Eye,
    label: 'Low',
    borderColor: 'border-blue-500'
  }
};

const typeConfig = {
  volume_spike: { icon: TrendingUp, label: 'Volume Spike', color: 'text-green-600' },
  velocity_anomaly: { icon: Zap, label: 'Velocity Anomaly', color: 'text-yellow-600' },
  cluster_behavior: { icon: Users, label: 'Cluster Behavior', color: 'text-purple-600' },
  dormant_activation: { icon: Activity, label: 'Dormant Activation', color: 'text-orange-600' },
  mass_transfer: { icon: TrendingUp, label: 'Mass Transfer', color: 'text-red-600' },
  coordinated_movement: { icon: Users, label: 'Coordinated Movement', color: 'text-pink-600' },
  balance_deviation: { icon: AlertTriangle, label: 'Balance Deviation', color: 'text-blue-600' },
  unusual_pattern: { icon: Activity, label: 'Unusual Pattern', color: 'text-gray-600' }
};

export function AnomalyDetectionDashboard() {
  const [anomalies, setAnomalies] = useState<AnomalyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Fetch anomalies on mount
  useEffect(() => {
    loadAnomalies();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('anomaly_updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'anomaly_detections' },
        () => loadAnomalies()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadAnomalies = async () => {
    try {
      setLoading(true);
      const data = await getRecentAnomalies(100);
      setAnomalies(data);
    } catch (error) {
      console.error('Failed to load anomalies:', error);
    } finally {
      setLoading(false);
    }
  };

  const runDetection = async () => {
    try {
      setScanning(true);
      const newAnomalies = await detectAnomalies();
      setAnomalies(prev => [...newAnomalies, ...prev]);
    } catch (error) {
      console.error('Detection failed:', error);
    } finally {
      setScanning(false);
    }
  };

  const handleResolve = async (anomalyId: string) => {
    try {
      await resolveAnomaly(anomalyId);
      setAnomalies(prev => prev.filter(a => a.anomalyId !== anomalyId));
    } catch (error) {
      console.error('Failed to resolve anomaly:', error);
    }
  };

  // Filter anomalies
  const filteredAnomalies = anomalies.filter(anomaly => {
    if (activeTab !== 'all' && anomaly.severity !== activeTab) return false;
    if (selectedType && anomaly.type !== selectedType) return false;
    return true;
  });

  // Statistics
  const stats = {
    total: anomalies.length,
    critical: anomalies.filter(a => a.severity === 'critical').length,
    high: anomalies.filter(a => a.severity === 'high').length,
    medium: anomalies.filter(a => a.severity === 'medium').length,
    low: anomalies.filter(a => a.severity === 'low').length
  };

  return (
    <FeatureGate requiredPlan="pro" feature="Anomaly Detection">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Anomaly Detection</h2>
            <p className="text-muted-foreground mt-1">
              Advanced ML pattern recognition for whale behavior
            </p>
          </div>
          <DisabledTooltipButton 
            onClick={runDetection} 
            disabled={scanning}
            disabledTooltip={scanning ? "Anomaly detection in progress..." : undefined}
          >
            {scanning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Run Detection
              </>
            )}
          </DisabledTooltipButton>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Anomalies</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          {(['critical', 'high', 'medium', 'low'] as const).map(severity => {
            const IconComponent = severityConfig[severity].icon;
            return (
              <Card key={severity} className="cursor-pointer hover:bg-accent/50" onClick={() => setActiveTab(severity)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">{severity}</CardTitle>
                  {IconComponent && (
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats[severity]}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Type Filter */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filter by Type</CardTitle>
              {selectedType && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedType(null)}>
                  Clear Filter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(typeConfig).map(([type, config]) => {
                const Icon = config.icon;
                const count = anomalies.filter(a => a.type === type).length;
                
                return (
                  <Button
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(selectedType === type ? null : type)}
                    disabled={count === 0}
                  >
                    <Icon className="mr-2 h-3 w-3" />
                    {config.label}
                    <Badge variant="secondary" className="ml-2">{count}</Badge>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Anomaly List */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as unknown)}>
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="critical">Critical ({stats.critical})</TabsTrigger>
            <TabsTrigger value="high">High ({stats.high})</TabsTrigger>
            <TabsTrigger value="medium">Medium ({stats.medium})</TabsTrigger>
            <TabsTrigger value="low">Low ({stats.low})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {loading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading anomalies...</p>
                </CardContent>
              </Card>
            ) : filteredAnomalies.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold mb-1">No Anomalies Detected</h3>
                  <p className="text-muted-foreground">
                    All whale activities are within normal parameters
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredAnomalies.map(anomaly => (
                <AnomalyCard
                  key={anomaly.anomalyId}
                  anomaly={anomaly}
                  onResolve={handleResolve}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </FeatureGate>
  );
}

interface AnomalyCardProps {
  anomaly: AnomalyResult;
  onResolve: (anomalyId: string) => void;
}

function AnomalyCard({ anomaly, onResolve }: AnomalyCardProps) {
  const [expanded, setExpanded] = useState(false);
  const severityInfo = severityConfig[anomaly.severity];
  const typeInfo = typeConfig[anomaly.type];
  const TypeIcon = typeInfo.icon;
  const SeverityIcon = severityInfo.icon;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className={`border-l-4 ${severityInfo.borderColor}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${severityInfo.color}`}>
              <SeverityIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="font-mono text-xs">
                  {anomaly.anomalyId.split('-')[0].toUpperCase()}
                </Badge>
                <Badge className={severityInfo.color}>{severityInfo.label}</Badge>
                <Badge variant="secondary">
                  {Math.round(anomaly.confidence * 100)}% confidence
                </Badge>
              </div>
              <CardTitle className="text-lg flex items-center gap-2">
                <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
                {typeInfo.label}
              </CardTitle>
              <CardDescription className="mt-1">{anomaly.description}</CardDescription>
              <p className="text-xs text-muted-foreground mt-1">
                {formatTimestamp(anomaly.timestamp)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Hide Details' : 'Show Details'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onResolve(anomaly.anomalyId)}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          {/* Affected Whales */}
          {anomaly.affectedWhales.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Affected Whales ({anomaly.affectedWhales.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {anomaly.affectedWhales.slice(0, 10).map(address => (
                  <Badge key={address} variant="outline" className="font-mono text-xs">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </Badge>
                ))}
                {anomaly.affectedWhales.length > 10 && (
                  <Badge variant="secondary">+{anomaly.affectedWhales.length - 10} more</Badge>
                )}
              </div>
            </div>
          )}

          {/* Metrics */}
          <div>
            <h4 className="font-semibold mb-2">Detection Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(anomaly.metrics).map(([key, value]) => (
                <div key={key} className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-lg font-semibold">
                    {typeof value === 'number' 
                      ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                      : value
                    }
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Actions */}
          {anomaly.suggestedActions.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <h4 className="font-semibold mb-2">Suggested Actions:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {anomaly.suggestedActions.map((action, i) => (
                    <li key={i} className="text-sm">{action}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}
    </Card>
  );
}

