/**
 * Onboarding Analytics Dashboard
 * Admin dashboard for monitoring user onboarding funnel and success metrics
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Activity,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import {
  getFunnelMetrics,
  getDropoffAnalysis,
  getDailyMetrics,
  detectDropoffs,
  FunnelMetrics,
  DropoffAnalysis,
  DailyMetrics
} from '@/services/onboardingAnalytics';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, FunnelChart, Funnel, LabelList } from 'recharts';

export function OnboardingAnalyticsDashboard() {
  const [funnelMetrics, setFunnelMetrics] = useState<FunnelMetrics | null>(null);
  const [dropoffs, setDropoffs] = useState<DropoffAnalysis[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [funnel, dropoffData, daily] = await Promise.all([
        getFunnelMetrics(),
        getDropoffAnalysis(),
        getDailyMetrics(30)
      ]);

      setFunnelMetrics(funnel);
      setDropoffs(dropoffData);
      setDailyMetrics(daily);
    } catch (error) {
      console.error('Failed to load onboarding analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const runDropoffDetection = async () => {
    try {
      setRefreshing(true);
      await detectDropoffs();
      await loadData();
    } catch (error) {
      console.error('Failed to run dropoff detection:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!funnelMetrics) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground">
            Onboarding metrics will appear here once users start signing up
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare funnel data for visualization
  const funnelData = [
    { name: 'Signups', value: funnelMetrics.totalSignups, fill: '#8884d8' },
    { name: 'Email Verified', value: funnelMetrics.emailVerifiedCount, fill: '#83a6ed' },
    { name: 'First Login', value: funnelMetrics.firstLoginCount, fill: '#8dd1e1' },
    { name: 'Tour Started', value: funnelMetrics.tourStartedCount, fill: '#82ca9d' },
    { name: 'Tour Completed', value: funnelMetrics.tourCompletedCount, fill: '#a4de6c' },
    { name: 'First Alert', value: funnelMetrics.firstAlertCount, fill: '#d0ed57' },
    { name: 'Onboarding Done', value: funnelMetrics.onboardingCompletedCount, fill: '#ffc658' },
    { name: 'Converted', value: funnelMetrics.convertedCount, fill: '#ff8042' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Onboarding Analytics</h2>
          <p className="text-muted-foreground mt-1">
            Monitor user journey and optimize conversion funnel
          </p>
        </div>
        <Button onClick={runDropoffDetection} disabled={refreshing}>
          {refreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Detecting...
            </>
          ) : (
            <>
              <Activity className="mr-2 h-4 w-4" />
              Run Drop-off Detection
            </>
          )}
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Signups"
          value={funnelMetrics.totalSignups}
          icon={Users}
          color="text-blue-600"
        />
        <MetricCard
          title="Onboarding Rate"
          value={`${funnelMetrics.onboardingCompletionRate}%`}
          icon={CheckCircle}
          color="text-green-600"
          trend={funnelMetrics.onboardingCompletionRate > 50 ? 'up' : 'down'}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${funnelMetrics.conversionRate}%`}
          icon={Target}
          color="text-purple-600"
          trend={funnelMetrics.conversionRate > 10 ? 'up' : 'down'}
        />
        <MetricCard
          title="Avg. Completion Time"
          value={`${funnelMetrics.avgHoursToOnboardingComplete?.toFixed(1) || 0}h`}
          icon={Clock}
          color="text-orange-600"
        />
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funnel">Funnel Analysis</TabsTrigger>
          <TabsTrigger value="dropoffs">Drop-off Points</TabsTrigger>
          <TabsTrigger value="timeline">Daily Metrics</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Breakdown</TabsTrigger>
        </TabsList>

        {/* Funnel Visualization */}
        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Funnel</CardTitle>
              <CardDescription>
                User progression through onboarding stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelData.map((stage, index) => {
                  const percentage = index === 0 
                    ? 100 
                    : (stage.value / funnelData[0].value) * 100;
                  
                  return (
                    <div key={stage.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{stage.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{stage.value}</span>
                          <Badge variant="secondary">{percentage.toFixed(1)}%</Badge>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-3" style={{ backgroundColor: stage.fill + '20' }} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Conversion Rates */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Email Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{funnelMetrics.emailVerifyRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg. {funnelMetrics.avgHoursToEmailVerify?.toFixed(1) || 0}h to verify
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tour Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{funnelMetrics.tourCompletionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg. {funnelMetrics.avgHoursToTourComplete?.toFixed(1) || 0}h to complete
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">First Login Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{funnelMetrics.firstLoginRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Of verified users
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Drop-off Analysis */}
        <TabsContent value="dropoffs">
          <Card>
            <CardHeader>
              <CardTitle>Drop-off Analysis</CardTitle>
              <CardDescription>
                Identify where users abandon the onboarding process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dropoffs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>No drop-offs detected in the last 30 days!</p>
                  </div>
                ) : (
                  dropoffs.map(dropoff => (
                    <Card key={dropoff.dropOffStep} className="border-l-4 border-l-red-500">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">{dropoff.dropOffStep}</h4>
                            <p className="text-sm text-muted-foreground">
                              {dropoff.dropoffCount} users dropped off here
                            </p>
                          </div>
                          <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Avg. Time Spent</p>
                            <p className="text-lg font-semibold">
                              {Math.round(dropoff.avgTimeSpentSeconds / 60)}m
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Avg. Events Before</p>
                            <p className="text-lg font-semibold">
                              {Math.round(dropoff.avgEventsBeforeDropoff)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Recovery Rate</p>
                            <p className="text-lg font-semibold text-green-600">
                              {dropoff.recoveryRate}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Daily Onboarding Metrics</CardTitle>
              <CardDescription>
                Signups and completion rates over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailyMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="signups" 
                    stroke="#8884d8" 
                    name="Signups"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="completions" 
                    stroke="#82ca9d" 
                    name="Completions"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="completionRate" 
                    stroke="#ffc658" 
                    name="Completion Rate (%)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detailed Breakdown */}
        <TabsContent value="detailed">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={funnelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time to Complete Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TimeMetric
                  label="Email Verification"
                  hours={funnelMetrics.avgHoursToEmailVerify || 0}
                  icon={CheckCircle}
                />
                <TimeMetric
                  label="Tour Completion"
                  hours={funnelMetrics.avgHoursToTourComplete || 0}
                  icon={Activity}
                />
                <TimeMetric
                  label="Full Onboarding"
                  hours={funnelMetrics.avgHoursToOnboardingComplete || 0}
                  icon={Target}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
  trend?: 'up' | 'down';
}

function MetricCard({ title, value, icon: Icon, color = 'text-blue-600', trend }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className="flex items-center mt-1">
            {trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
            )}
            <span className={`text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? 'Good' : 'Needs attention'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TimeMetricProps {
  label: string;
  hours: number;
  icon: React.ElementType;
}

function TimeMetric({ label, hours, icon: Icon }: TimeMetricProps) {
  const days = Math.floor(hours / 24);
  const remainingHours = Math.floor(hours % 24);
  
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="font-medium">{label}</span>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold">
          {days > 0 && `${days}d `}
          {remainingHours}h
        </div>
        <div className="text-xs text-muted-foreground">average</div>
      </div>
    </div>
  );
}

