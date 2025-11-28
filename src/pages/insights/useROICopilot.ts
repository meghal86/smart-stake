import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ROIQuery {
  question: string;
  sql?: string;
  result?: unknown;
  insight?: string;
}

export function useROICopilot() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const queryROI = useCallback(async (question: string): Promise<ROIQuery> => {
    if (!user) throw new Error("User not authenticated");

    setLoading(true);
    
    try {
      // Simple query mapping - in production this would use AI
      const queryMap: Record<string, { sql: string; insight: string }> = {
        "best pattern this month": {
          sql: `SELECT pattern_id, AVG(hit_rate) as avg_hit_rate, SUM(pnl) as total_pnl 
                FROM roi_patterns 
                WHERE user_id = '${user.id}' 
                AND updated_at >= NOW() - INTERVAL '30 days'
                GROUP BY pattern_id 
                ORDER BY avg_hit_rate DESC 
                LIMIT 1`,
          insight: "Your best performing pattern this month shows strong consistency in whale accumulation signals."
        },
        "total profit this week": {
          sql: `SELECT SUM(pnl) as weekly_pnl 
                FROM roi_patterns 
                WHERE user_id = '${user.id}' 
                AND updated_at >= NOW() - INTERVAL '7 days'`,
          insight: "Your weekly performance shows positive momentum with whale movement predictions."
        },
        "hit rate trend": {
          sql: `SELECT DATE_TRUNC('day', updated_at) as date, AVG(hit_rate) as daily_hit_rate
                FROM roi_patterns 
                WHERE user_id = '${user.id}' 
                AND updated_at >= NOW() - INTERVAL '30 days'
                GROUP BY DATE_TRUNC('day', updated_at)
                ORDER BY date`,
          insight: "Your prediction accuracy has been improving over the past month, particularly on large whale movements."
        }
      };

      const normalizedQuestion = question.toLowerCase();
      let matchedQuery = null;

      // Find best matching query
      for (const [key, value] of Object.entries(queryMap)) {
        if (normalizedQuestion.includes(key)) {
          matchedQuery = value;
          break;
        }
      }

      if (!matchedQuery) {
        // Default fallback
        matchedQuery = {
          sql: `SELECT COUNT(*) as total_patterns, AVG(hit_rate) as avg_hit_rate, SUM(pnl) as total_pnl
                FROM roi_patterns 
                WHERE user_id = '${user.id}'`,
          insight: "Here's your overall ROI performance summary across all patterns."
        };
      }

      // Execute the query
      const { data, error } = await supabase.rpc("execute_roi_query", {
        query_sql: matchedQuery.sql
      });

      if (error) throw error;

      return {
        question,
        sql: matchedQuery.sql,
        result: data,
        insight: matchedQuery.insight
      };
    } catch (error) {
      console.error("ROI Copilot query failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    queryROI,
    loading
  };
}