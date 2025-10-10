"use client";

import { TrendingUp, Target, AlertCircle, Award } from "lucide-react";

interface EmailProps {
  userName: string;
  weeklyStats: {
    totalAlerts: number;
    hits: number;
    totalPnl: number;
    bestPattern: string;
    hitRate: number;
  };
  darkMode?: boolean;
}

export function OutcomeDigestEmail({ userName, weeklyStats, darkMode = false }: EmailProps) {
  const theme = darkMode ? 'dark' : 'light';
  
  const styles = {
    container: `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; ${
      darkMode ? 'background-color: #1f2937; color: #f9fafb;' : 'background-color: #ffffff; color: #111827;'
    }`,
    header: `padding: 32px 24px; text-align: center; ${
      darkMode ? 'background: linear-gradient(135deg, #1e40af, #7c3aed);' : 'background: linear-gradient(135deg, #3b82f6, #8b5cf6);'
    } color: white;`,
    content: `padding: 24px;`,
    card: `padding: 20px; margin: 16px 0; border-radius: 8px; ${
      darkMode ? 'background-color: #374151; border: 1px solid #4b5563;' : 'background-color: #f9fafb; border: 1px solid #e5e7eb;'
    }`,
    statGrid: `display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 20px 0;`,
    statCard: `text-align: center; padding: 16px; border-radius: 6px; ${
      darkMode ? 'background-color: #4b5563;' : 'background-color: #ffffff; border: 1px solid #e5e7eb;'
    }`,
    button: `display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 16px 8px 0 0;`,
    footer: `padding: 24px; text-align: center; font-size: 14px; ${
      darkMode ? 'color: #9ca3af; border-top: 1px solid #4b5563;' : 'color: #6b7280; border-top: 1px solid #e5e7eb;'
    }`
  };

  return (
    <div style={{ backgroundColor: darkMode ? '#111827' : '#f3f4f6', padding: '20px' }}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 'bold' }}>
            🐋 AlphaWhale Weekly Digest
          </h1>
          <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
            Your whale intelligence performance summary
          </p>
        </div>

        {/* Content */}
        <div style={styles.content}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>
            Hi {userName},
          </h2>
          
          <p style={{ lineHeight: '1.6', marginBottom: '24px' }}>
            Here's how your whale predictions performed this week. Your alerts had a{' '}
            <strong style={{ color: '#10b981' }}>+{((weeklyStats.totalPnl / weeklyStats.totalAlerts) * 100).toFixed(1)}%</strong>{' '}
            average impact with a <strong>{(weeklyStats.hitRate * 100).toFixed(0)}%</strong> hit rate.
          </p>

          {/* Stats Grid */}
          <div style={styles.statGrid}>
            <div style={styles.statCard}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '4px' }}>
                {weeklyStats.totalAlerts}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Total Alerts</div>
            </div>
            
            <div style={styles.statCard}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>
                {weeklyStats.hits}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Successful Hits</div>
            </div>
            
            <div style={styles.statCard}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px' }}>
                ${weeklyStats.totalPnl.toFixed(0)}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Total P&L</div>
            </div>
            
            <div style={styles.statCard}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '4px' }}>
                {(weeklyStats.hitRate * 100).toFixed(0)}%
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Hit Rate</div>
            </div>
          </div>

          {/* Best Pattern */}
          <div style={styles.card}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🏆</span>
              Best Performing Pattern
            </h3>
            <p style={{ margin: '0', fontSize: '16px', fontWeight: '500' }}>
              {weeklyStats.bestPattern}
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
              This pattern had the highest accuracy and profit contribution this week.
            </p>
          </div>

          {/* CTA Buttons */}
          <div style={{ textAlign: 'center', margin: '32px 0' }}>
            <a href="https://alphawhale.com/insights" style={styles.button}>
              View Full Report
            </a>
            <a href="https://alphawhale.com/alerts/create" style={{ ...styles.button, backgroundColor: '#10b981' }}>
              Create New Alert
            </a>
          </div>

          {/* Tips */}
          <div style={styles.card}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>💡 Pro Tip</h3>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
              Your {weeklyStats.bestPattern} pattern is performing exceptionally well. 
              Consider creating more alerts based on this pattern to maximize your returns.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={{ margin: '0 0 8px 0' }}>
            AlphaWhale - Institutional-grade crypto intelligence
          </p>
          <p style={{ margin: 0, fontSize: '12px' }}>
            <a href="https://alphawhale.com/unsubscribe" style={{ color: 'inherit' }}>Unsubscribe</a> |{' '}
            <a href="https://alphawhale.com/preferences" style={{ color: 'inherit' }}>Email Preferences</a>
          </p>
        </div>
      </div>
    </div>
  );
}