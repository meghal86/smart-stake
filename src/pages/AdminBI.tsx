import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Target, Activity, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PresetConversion {
  preset_name: string;
  total_clicks: number;
  upgrades_within_72h: number;
  conversion_rate: number;
}

interface LockConversion {
  feature_name: string;
  total_locks: number;
  upgrades_within_24h: number;
  conversion_rate: number;
}

interface CohortData {
  cohort_week: string;
  total_users: number;
  active_users: number;
  retention_rate: number;
}

interface DailyRuns {
  day: string;
  user_tier: string;
  total_runs: number;
  unique_users: number;
  runs_per_user: number;
}

export default function AdminBI() {
  const { user } = useAuth();
  const [presetData, setPresetData] = useState<PresetConversion[]>([]);
  const [lockData, setLockData] = useState<LockConversion[]>([]);
  const [cohortData, setCohortData] = useState<CohortData[]>([]);
  const [runsData, setRunsData] = useState<DailyRuns[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const [presets, locks, cohorts, runs] = await Promise.all([
        supabase.from('v_preset_to_upgrade').select('*').limit(5),
        supabase.from('v_lock_to_upgrade').select('*'),
        supabase.from('v_user_cohorts').select('*').limit(8),
        supabase.from('v_daily_runs_by_tier').select('*').limit(30)
      ]);

      setPresetData(presets.data || []);
      setLockData(locks.data || []);
      setCohortData(cohorts.data || []);
      setRunsData(runs.data || []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check admin access
  const isAdmin = user?.user_metadata?.role === 'admin';
  
  if (!user) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>Please sign in to access the admin dashboard.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
        <p>You don't have permission to access this dashboard.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Business Intelligence Dashboard</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
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
          <h1 className="text-3xl font-bold">Business Intelligence Dashboard</h1>
          <p className="text-muted-foreground">Conversion funnels and user behavior analytics</p>
        </div>
        <Button onClick={fetchAnalytics}>
          <Activity className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preset to Upgrade Funnel */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Preset → Upgrade Funnel</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={presetData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="preset_name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                name === 'conversion_rate' ? `${value}%` : value,
                name === 'conversion_rate' ? 'Conversion Rate' : 'Total Clicks'
              ]} />
              <Bar dataKey="total_clicks" fill="#8884d8" name="total_clicks" />
              <Bar dataKey="conversion_rate" fill="#82ca9d" name="conversion_rate" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Feature Lock to Upgrade */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold">Feature Lock → Upgrade</h3>
          </div>
          <div className="space-y-3">
            {lockData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded">
                <div>
                  <div className="font-medium">{item.feature_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.total_locks} views → {item.upgrades_within_24h} upgrades
                  </div>
                </div>
                <Badge variant={item.conversion_rate > 10 ? 'default' : 'secondary'}>
                  {item.conversion_rate}%
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* User Cohorts */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Weekly Cohort Retention</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={cohortData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cohort_week" />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                name === 'retention_rate' ? `${value}%` : value,
                name === 'retention_rate' ? 'Retention Rate' : 'Total Users'
              ]} />
              <Line type="monotone" dataKey="retention_rate" stroke="#8884d8" name="retention_rate" />
              <Line type="monotone" dataKey="total_users" stroke="#82ca9d" name="total_users" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Runs per User by Tier */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Daily Runs by Tier</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={runsData.slice(0, 7)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="runs_per_user" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {presetData.reduce((sum, p) => sum + p.total_clicks, 0)}
          </div>
          <div className="text-sm text-muted-foreground">Total Preset Clicks</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {lockData.reduce((sum, l) => sum + l.total_locks, 0)}
          </div>
          <div className="text-sm text-muted-foreground">Feature Lock Views</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {cohortData.length > 0 ? cohortData[0].retention_rate : 0}%
          </div>
          <div className="text-sm text-muted-foreground">Latest Cohort Retention</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {runsData.reduce((sum, r) => sum + r.total_runs, 0)}
          </div>
          <div className="text-sm text-muted-foreground">Total Runs (30d)</div>
        </Card>
      </div>
    </div>
  );
}