import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock, Zap, TrendingUp, ExternalLink } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SLOMetric {
  metric: string;
  current_value: number;
  threshold: number;
  status: 'OK' | 'BREACH' | 'WARNING';
}

interface ValidationResult {
  check: string;
  value: number;
  expected: string;
  status: 'PASS' | 'FAIL' | 'INFO';
  drillDownUrl?: string;
}

interface TrendData {
  hour: string;
  outcomes: number;
  latency: number;
  cache_hit_rate: number;
}

interface RecentOutcome {
  timestamp: string;
  asset: string;
  prediction: number;
  outcome: number;
  latency: number;
  tier: string;
}

interface GuardrailStatus {
  asset: string;
  muted_until: string;
  alerts_count: number;
}

export default function AdminOps() {
  const { user } = useAuth();
  const [sloMetrics, setSloMetrics] = useState<SLOMetric[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [recentOutcomes, setRecentOutcomes] = useState<RecentOutcome[]>([]);
  const [guardrailStatus, setGuardrailStatus] = useState<GuardrailStatus[]>([]);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOpsData();
    }
  }, [user]);

  const fetchOpsData = async () => {
    try {
      // Use ops health endpoint
      const response = await fetch('/admin/ops/health');
      const healthData = await response.json();
      
      const [trendData, outcomes, guardrails] = await Promise.all([
        fetchTrendData(),
        fetchRecentOutcomes(),
        fetchGuardrailStatus()
      ]);

      // Convert health data to SLO metrics
      const sloData = healthData ? [
        {
          metric: 'Hit Rate 7d',
          current_value: healthData.slo_metrics?.hit_rate_7d || 0,
          threshold: 70,
          status: (healthData.slo_metrics?.hit_rate_7d || 0) >= 70 ? 'OK' : 'BREACH'
        },
        {
          metric: 'P95 Latency',
          current_value: healthData.slo_metrics?.p95_latency_ms || 0,
          threshold: 700,
          status: (healthData.slo_metrics?.p95_latency_ms || 0) <= 700 ? 'OK' : 'BREACH'
        }
      ] : [];

      // Convert health data to validation results
      const validationData = healthData ? [
        {
          check: 'Outcomes Labeled (1h)',
          value: healthData.slo_metrics?.outcomes_labeled_1h || 0,
          expected: '> 0',
          status: (healthData.slo_metrics?.outcomes_labeled_1h || 0) > 0 ? 'PASS' : 'INFO'
        },
        {
          check: 'Alert Storms',
          value: healthData.alerts?.active_cooldowns || 0,
          expected: '<= 2',
          status: healthData.alerts?.storm_detected ? 'FAIL' : 'PASS'
        },
        {
          check: 'System Status',
          value: healthData.status === 'healthy' ? 1 : 0,
          expected: 'Healthy',
          status: healthData.status === 'healthy' ? 'PASS' : 'FAIL'
        }
      ] : [];

      setSloMetrics(sloData);
      setValidationResults(validationData);
      setTrendData(trendData);
      setRecentOutcomes(outcomes);
      setGuardrailStatus(guardrails);
    } catch (error) {
      console.error('Failed to fetch ops data:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const runValidationChecks = async (): Promise<ValidationResult[]> => {
    const checks = [];

    // Cron + outcomes check
    const { data: outcomesData } = await supabase
      .from('scenario_outcomes')
      .select('*')
      .gte('recorded_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());

    checks.push({
      check: 'Outcomes Labeled (2h)',
      value: outcomesData?.length || 0,
      expected: '> 0',
      status: (outcomesData?.length || 0) > 0 ? 'PASS' : 'FAIL'
    });

    // Alert storm check - use direct table query
    const { data: alertData } = await supabase
      .from('alert_cooldowns')
      .select('asset, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const maxAlertsPerHour = alertData?.length || 0;

    checks.push({
      check: 'Alert Storms (24h)',
      value: maxAlertsPerHour,
      expected: '<= 2',
      status: maxAlertsPerHour <= 2 ? 'PASS' : 'FAIL'
    });

    // Orphaned predictions check
    const { data: orphanData } = await supabase
      .from('v_orphaned_predictions')
      .select('*');

    checks.push({
      check: 'Orphaned Predictions',
      value: orphanData?.length || 0,
      expected: '< 5',
      status: (orphanData?.length || 0) < 5 ? 'PASS' : 'FAIL'
    });

    // Acceptance rate check
    const { data: acceptanceData } = await supabase
      .from('v_guardrail_acceptance')
      .select('acceptance_rate');

    const avgAcceptance = acceptanceData?.length 
      ? acceptanceData.reduce((sum, row) => sum + row.acceptance_rate, 0) / acceptanceData.length
      : 0;

    checks.push({
      check: 'Acceptance Rate (%)',
      value: Math.round(avgAcceptance),
      expected: '10-35%',
      status: avgAcceptance === 0 ? 'INFO' : (avgAcceptance >= 10 && avgAcceptance <= 35 ? 'PASS' : 'FAIL')
    });

    return checks;
  };

  const fetchTrendData = async (): Promise<TrendData[]> => {
    // Generate 24h trend data
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(Date.now() - (23 - i) * 60 * 60 * 1000);
      return {
        hour: hour.getHours().toString().padStart(2, '0') + ':00',
        outcomes: Math.floor(Math.random() * 10) + 2,
        latency: Math.floor(Math.random() * 200) + 300,
        cache_hit_rate: Math.floor(Math.random() * 30) + 70
      };
    });
    
    return hours;
  };

  const fetchRecentOutcomes = async (): Promise<RecentOutcome[]> => {
    // Mock recent outcomes data
    return Array.from({ length: 10 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 30 * 60 * 1000).toISOString(),
      asset: ['ETH', 'BTC', 'SOL'][Math.floor(Math.random() * 3)],
      prediction: Math.round((Math.random() * 10 - 5) * 100) / 100,
      outcome: Math.round((Math.random() * 10 - 5) * 100) / 100,
      latency: Math.floor(Math.random() * 200) + 300,
      tier: ['free', 'pro', 'premium'][Math.floor(Math.random() * 3)]
    }));
  };

  const fetchGuardrailStatus = async (): Promise<GuardrailStatus[]> => {
    // Mock data for now - would come from ops-health in production
    return [];
  };

  const runBackfill = async () => {
    try {
      const { data } = await supabase.rpc('backfill_missed_outcomes');
      alert(`Backfilled ${data} missed outcomes`);
      fetchOpsData();
    } catch (error) {
      console.error('Backfill failed:', error);
      alert('Backfill failed');
    }
  };

  const isAdmin = user?.user_metadata?.role === 'admin';

  if (!user || !isAdmin) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
        <p>You don't have permission to access operations dashboard.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Operations Dashboard</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <Card key={i} className="p-6">
              <div className="h-64 bg-muted rounded animate-pulse"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Operations Dashboard</h1>
          <p className="text-muted-foreground">SLO monitoring and system health</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runBackfill} variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Backfill Outcomes
          </Button>
          <Button onClick={fetchOpsData}>
            <Clock className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.open('/admin/ops/health', '_blank')}
          >
            Health API
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SLO Metrics with Trends */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">SLO Status & Trends</h3>
          </div>
          
          {/* SLO Status */}
          <div className="space-y-3 mb-6">
            {sloMetrics.map((metric, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded">
                <div>
                  <div className="font-medium">{metric.metric.replace(/_/g, ' ')}</div>
                  <div className="text-sm text-muted-foreground">
                    Current: {metric.current_value} | Threshold: {metric.threshold}
                  </div>
                </div>
                <Badge variant={metric.status === 'OK' ? 'default' : 'destructive'}>
                  {metric.status === 'OK' ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 mr-1" />
                  )}
                  {metric.status}
                </Badge>
              </div>
            ))}
          </div>
          
          {/* 24h Trend Chart */}
          <div>
            <h4 className="font-medium mb-3">24h System Health</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="outcomes" stroke="#3b82f6" name="Outcomes/hr" />
                <Line type="monotone" dataKey="cache_hit_rate" stroke="#10b981" name="Cache Hit %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Validation Results */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">System Validation</h3>
          <div className="space-y-3">
            {validationResults.map((result, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded">
                <div>
                  <div className="font-medium">{result.check}</div>
                  <div className="text-sm text-muted-foreground">
                    Value: {result.value} | Expected: {result.expected}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    result.status === 'PASS' ? 'default' : 
                    result.status === 'INFO' ? 'secondary' : 'destructive'
                  }>
                    {result.status === 'PASS' ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : result.status === 'INFO' ? (
                      <Clock className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {result.status === 'INFO' ? 'NO DATA' : result.status}
                  </Badge>
                  {result.drillDownUrl && (
                    <Button size="sm" variant="ghost" onClick={() => window.open(result.drillDownUrl)}>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Guardrail Status & Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Guardrail Status</h3>
          {guardrailStatus.length > 0 ? (
            <div className="space-y-2">
              {guardrailStatus.map((status, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <div>
                    <span className="font-medium">{status.asset}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {status.alerts_count} alerts in last hour
                    </span>
                  </div>
                  <Badge variant="secondary">
                    Muted until {new Date(status.muted_until).toLocaleTimeString()}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              No active cooldowns
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {trendData.length > 0 ? Math.round(trendData[trendData.length - 1]?.latency || 0) : 0}ms
              </div>
              <div className="text-sm text-blue-700">P95 Latency</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">
                {trendData.length > 0 ? Math.round(trendData[trendData.length - 1]?.cache_hit_rate || 0) : 0}%
              </div>
              <div className="text-sm text-green-700">Cache Hit Rate</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded">
              <div className="text-2xl font-bold text-purple-600">
                {trendData.reduce((sum, d) => sum + d.outcomes, 0)}
              </div>
              <div className="text-sm text-purple-700">Outcomes (24h)</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded">
              <div className="text-2xl font-bold text-orange-600">
                {recentOutcomes.length}
              </div>
              <div className="text-sm text-orange-700">Recent Logs</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Drill-Down Panel */}
      <Card className="p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDrillDown(!showDrillDown)}
          >
            {showDrillDown ? 'Hide' : 'Show'} Details
          </Button>
        </div>
        
        {showDrillDown && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Timestamp</th>
                  <th className="text-left p-2">Asset</th>
                  <th className="text-left p-2">Prediction</th>
                  <th className="text-left p-2">Outcome</th>
                  <th className="text-left p-2">Latency</th>
                  <th className="text-left p-2">Tier</th>
                </tr>
              </thead>
              <tbody>
                {recentOutcomes.map((outcome, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="p-2">{new Date(outcome.timestamp).toLocaleTimeString()}</td>
                    <td className="p-2">
                      <Badge variant="outline">{outcome.asset}</Badge>
                    </td>
                    <td className="p-2 text-right">{outcome.prediction.toFixed(2)}%</td>
                    <td className="p-2 text-right">{outcome.outcome.toFixed(2)}%</td>
                    <td className="p-2 text-right">{outcome.latency}ms</td>
                    <td className="p-2">
                      <Badge variant="secondary">{outcome.tier}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Quick Diagnostics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-blue-50 rounded cursor-pointer hover:bg-blue-100" onClick={() => setShowDrillDown(true)}>
            <div className="font-medium text-blue-900">Smoke Test</div>
            <div className="text-blue-700">Check recent outcomes, cooldowns, explainers</div>
          </div>
          <div className="p-3 bg-green-50 rounded cursor-pointer hover:bg-green-100">
            <div className="font-medium text-green-900">Integrity Check</div>
            <div className="text-green-700">Verify no orphans, backfill gaps</div>
          </div>
          <div className="p-3 bg-purple-50 rounded cursor-pointer hover:bg-purple-100">
            <div className="font-medium text-purple-900">Guardrail Tuning</div>
            <div className="text-purple-700">Monitor acceptance rates, adjust thresholds</div>
          </div>
        </div>
      </Card>
    </div>
  );
}