"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, AlertCircle, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ROIData {
  date: string;
  pnl: number;
  hitRate: number;
  alerts: number;
}

interface ROISummary {
  totalPnl: number;
  avgHitRate: number;
  totalAlerts: number;
  bestPattern: string;
}

export function MyROI() {
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d">("7d");
  const [roiData, setRoiData] = useState<ROIData[]>([]);
  const [summary, setSummary] = useState<ROISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    fetchROIData();
  }, [user, timeframe]);

  const fetchROIData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch ROI summary
      const { data: summaryData } = await supabase
        .from("v_user_roi_summary")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (summaryData) {
        setSummary({
          totalPnl: summaryData.total_pnl || 0,
          avgHitRate: summaryData.avg_hit_rate || 0,
          totalAlerts: summaryData.total_alerts || 0,
          bestPattern: "Large Accumulation" // Mock for now
        });
      }

      // Mock historical data for chart
      const mockData: ROIData[] = [
        { date: "2024-01-01", pnl: 150, hitRate: 0.65, alerts: 5 },
        { date: "2024-01-02", pnl: 280, hitRate: 0.72, alerts: 8 },
        { date: "2024-01-03", pnl: 420, hitRate: 0.68, alerts: 12 },
        { date: "2024-01-04", pnl: 380, hitRate: 0.75, alerts: 10 },
        { date: "2024-01-05", pnl: 520, hitRate: 0.78, alerts: 15 },
        { date: "2024-01-06", pnl: 680, hitRate: 0.82, alerts: 18 },
        { date: "2024-01-07", pnl: 750, hitRate: 0.85, alerts: 20 }
      ];

      setRoiData(mockData);
    } catch (error) {
      console.error("Failed to fetch ROI data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  const avgImpact = summary ? (summary.totalPnl / summary.totalAlerts * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          My ROI Dashboard
        </h2>
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeframe === period
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Impact</p>
              <p className="text-2xl font-bold text-green-600">+{avgImpact}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hit Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {summary ? (summary.avgHitRate * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Alerts</p>
              <p className="text-2xl font-bold text-purple-600">
                {summary?.totalAlerts || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={roiData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="pnl" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="P&L ($)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Narrative Panel */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Weekly Insights
        </h3>
        <p className="text-blue-800 dark:text-blue-200 mb-4">
          Your alerts had a +{avgImpact}% average impact this week. Your best performing pattern 
          was "{summary?.bestPattern}" with an 85% hit rate.
        </p>
        <div className="flex gap-2">
          <a
            href="/alerts/create"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Create Alert on Best Pattern
          </a>
          <button
            onClick={() => {
              const query = prompt('Ask about your ROI: "What was my best pattern this month?"');
              if (query) {
                alert(`AI Analysis: Based on your ${summary?.totalAlerts || 0} alerts, your strongest pattern shows ${avgImpact}% average returns.`);
              }
            }}
            className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Ask AI
          </button>
        </div>
      </div>
    </div>
  );
}