import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface CTAMetrics {
  variant: 'global' | 'inline' | 'modal';
  clicks: number;
  conversions: number;
  avgTimeToAlert: number; // seconds
}

interface CTATelemetryDashboardProps {
  metrics: CTAMetrics[];
  className?: string;
}

export function CTATelemetryDashboard({ metrics, className = '' }: CTATelemetryDashboardProps) {
  const clickData = metrics.map(m => ({
    variant: m.variant,
    clicks: m.clicks,
    conversions: m.conversions,
    conversionRate: (m.conversions / m.clicks * 100).toFixed(1)
  }));

  const timeData = metrics.map(m => ({
    variant: m.variant,
    avgTime: m.avgTimeToAlert
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Chart 1: Clicks by Variant */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clicks by CTA Variant</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={clickData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="variant" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="clicks" fill="#14B8A6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Conversion Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alert Creation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={clickData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="variant" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, 'Conversion Rate']} />
                <Bar dataKey="conversionRate" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 3: Time to Alert */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Time to Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="variant" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}s`, 'Avg Time']} />
                <Line type="monotone" dataKey="avgTime" stroke="#F59E0B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CTA Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.map((metric) => (
              <div key={metric.variant} className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {metric.variant}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <div>{metric.clicks} clicks</div>
                  <div>{metric.conversions} alerts created</div>
                  <div>{((metric.conversions / metric.clicks) * 100).toFixed(1)}% conversion</div>
                  <div>{metric.avgTimeToAlert}s avg time</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}