import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Eye, Flag, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface GuardianFlag {
  id: string;
  type: 'sanctions' | 'mixer' | 'scam' | 'suspicious' | 'high_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  address: string;
  description: string;
  timestamp: Date;
  source: string;
}

interface GuardianWidgetProps {
  trustScore: number;
  flags: GuardianFlag[];
  scanTimestamp: Date;
  isScanning?: boolean;
  onRescan?: () => void;
}

export const GuardianWidget: React.FC<GuardianWidgetProps> = ({
  trustScore,
  flags,
  scanTimestamp,
  isScanning = false,
  onRescan
}) => {
  const [showAllFlags, setShowAllFlags] = useState(false);

  const getTrustColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getTrustGlow = (score: number) => {
    if (score >= 80) return 'shadow-green-500/20';
    if (score >= 60) return 'shadow-yellow-500/20';
    return 'shadow-red-500/20';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-red-400 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getFlagIcon = (type: string) => {
    switch (type) {
      case 'sanctions': return <Flag className="h-4 w-4" />;
      case 'mixer': return <Eye className="h-4 w-4" />;
      case 'scam': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const criticalFlags = flags.filter(f => f.severity === 'critical');
  const displayFlags = showAllFlags ? flags : (flags || []).slice(0, 3);

  return (
    <Card className="p-6 bg-gradient-to-br from-background to-muted/20 border-primary/20">
      <div className="space-y-4">
        {/* Guardian Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-primary/20 ${getTrustGlow(trustScore)} shadow-lg`}>
              <Shield className={`h-6 w-6 ${getTrustColor(trustScore)}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Guardian Scan</h3>
              <p className="text-sm text-muted-foreground">
                Trust & Compliance Analysis
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRescan}
            disabled={isScanning}
            className="flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            {isScanning ? 'Scanning...' : 'Rescan'}
          </Button>
        </div>

        {/* Trust Score with Pulse Animation */}
        <div className="text-center py-4">
          <div className={`relative inline-flex items-center justify-center w-24 h-24 rounded-full border-4 ${getTrustColor(trustScore)} border-current ${getTrustGlow(trustScore)} shadow-2xl`}>
            {/* Pulse animation */}
            <div className={`absolute inset-0 rounded-full ${getTrustColor(trustScore)} opacity-20 animate-ping`} />
            <div className={`text-2xl font-bold ${getTrustColor(trustScore)}`}>
              {trustScore}
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-lg font-semibold ${getTrustColor(trustScore)}`}>
              {trustScore >= 80 ? 'Trusted' : trustScore >= 60 ? 'Moderate' : 'High Risk'}
            </div>
            <div className="text-sm text-muted-foreground">
              Trust Index Score
            </div>
          </div>
        </div>

        {/* Trust Score Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Trust Level</span>
            <span className="font-medium">{trustScore}%</span>
          </div>
          <Progress value={trustScore} className="h-2" />
        </div>

        {/* Critical Alerts */}
        {criticalFlags.length > 0 && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-500">
                Critical Security Alerts
              </span>
            </div>
            <div className="text-sm text-red-700">
              {criticalFlags.length} critical issue{criticalFlags.length > 1 ? 's' : ''} detected
            </div>
          </div>
        )}

        {/* Flags List */}
        {(flags || []).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">
                Security Flags ({(flags || []).length})
              </h4>
              {(flags || []).length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllFlags(!showAllFlags)}
                  className="text-xs"
                >
                  {showAllFlags ? 'Show Less' : `Show All (${(flags || []).length})`}
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              {displayFlags.map((flag) => (
                <div key={flag.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className={`p-1 rounded ${getSeverityColor(flag.severity)}`}>
                    {getFlagIcon(flag.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{flag.type.replace('_', ' ').toUpperCase()}</span>
                      <Badge className={`text-xs ${getSeverityColor(flag.severity)}`}>
                        {flag.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {flag.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{flag.address?.slice(0, 8) || 'N/A'}...{flag.address?.slice(-6) || ''}</span>
                      <span>•</span>
                      <span>{flag.source || 'Unknown'}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="p-1">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clean Status */}
        {(flags || []).length === 0 && (
          <div className="text-center py-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <div className="text-sm font-medium text-green-600">All Clear</div>
            <div className="text-xs text-muted-foreground">
              No security flags detected
            </div>
          </div>
        )}

        {/* Scan Info */}
        <div className="pt-3 border-t border-muted/50 text-xs text-muted-foreground text-center">
          Last scan: {scanTimestamp.toLocaleString()}
        </div>
      </div>
    </Card>
  );
};