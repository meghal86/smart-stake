import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, TrendingUp, Users, MapPin, Activity } from 'lucide-react';

interface RiskFactor {
  score: number;
  weight: number;
  explanation: string;
}

interface RiskBreakdown {
  totalScore: number;
  factors: {
    transactionVolume: RiskFactor;
    counterpartyRisk: RiskFactor;
    geographicRisk: RiskFactor;
    behaviorPattern: RiskFactor;
    complianceFlags: RiskFactor;
  };
  recommendations: string[];
}

interface RiskBreakdownProps {
  walletAddress: string;
}

export function RiskBreakdown({ walletAddress }: RiskBreakdownProps) {
  const [riskData] = useState<RiskBreakdown>({
    totalScore: 6,
    factors: {
      transactionVolume: {
        score: 7,
        weight: 0.25,
        explanation: 'High transaction volume with large amounts indicates institutional or whale activity'
      },
      counterpartyRisk: {
        score: 8,
        weight: 0.30,
        explanation: 'Interactions with high-risk addresses including mixers and sanctioned entities'
      },
      geographicRisk: {
        score: 3,
        weight: 0.15,
        explanation: 'Transactions primarily from low-risk jurisdictions'
      },
      behaviorPattern: {
        score: 5,
        weight: 0.20,
        explanation: 'Mixed patterns of normal and suspicious transaction timing'
      },
      complianceFlags: {
        score: 9,
        weight: 0.10,
        explanation: 'Multiple compliance flags including OFAC sanctions list matches'
      }
    },
    recommendations: [
      'Enhanced due diligence required for high-risk counterparties',
      'Monitor transactions to mixer services',
      'Implement transaction monitoring for amounts >$10K',
      'Review compliance with local AML regulations'
    ]
  });

  const getRiskColor = (score: number) => {
    if (score <= 3) return 'text-green-600';
    if (score <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBadge = (score: number) => {
    if (score <= 3) return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
    if (score <= 6) return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
    return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
  };

  const getFactorIcon = (factor: string) => {
    switch (factor) {
      case 'transactionVolume': return <TrendingUp className="h-4 w-4" />;
      case 'counterpartyRisk': return <Users className="h-4 w-4" />;
      case 'geographicRisk': return <MapPin className="h-4 w-4" />;
      case 'behaviorPattern': return <Activity className="h-4 w-4" />;
      case 'complianceFlags': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getFactorName = (factor: string) => {
    switch (factor) {
      case 'transactionVolume': return 'Transaction Volume';
      case 'counterpartyRisk': return 'Counterparty Risk';
      case 'geographicRisk': return 'Geographic Risk';
      case 'behaviorPattern': return 'Behavior Pattern';
      case 'complianceFlags': return 'Compliance Flags';
      default: return factor;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Risk Score Breakdown</h3>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Overall Risk Score</div>
            <div className={`text-2xl font-bold ${getRiskColor(riskData.totalScore)}`}>
              {riskData.totalScore}/10
            </div>
          </div>
          {getRiskBadge(riskData.totalScore)}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="font-medium mb-4">Risk Factors Analysis</h4>
          <div className="space-y-4">
            {Object.entries(riskData.factors).map(([key, factor]) => (
              <div key={key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getFactorIcon(key)}
                    <span className="font-medium">{getFactorName(key)}</span>
                    <Badge variant="outline" className="text-xs">
                      Weight: {(factor.weight * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${getRiskColor(factor.score)}`}>
                      {factor.score}/10
                    </span>
                    {getRiskBadge(factor.score)}
                  </div>
                </div>
                
                <div className="mb-3">
                  <Progress 
                    value={(factor.score / 10) * 100} 
                    className="h-2"
                  />
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {factor.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-4">AI-Powered Recommendations</h4>
          <div className="space-y-3">
            {riskData.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{recommendation}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(riskData.factors).filter(f => f.score <= 3).length}
            </div>
            <div className="text-sm text-muted-foreground">Low Risk Factors</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {Object.values(riskData.factors).filter(f => f.score > 3 && f.score <= 6).length}
            </div>
            <div className="text-sm text-muted-foreground">Medium Risk Factors</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {Object.values(riskData.factors).filter(f => f.score > 6).length}
            </div>
            <div className="text-sm text-muted-foreground">High Risk Factors</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            Generate Report
          </Button>
          <Button variant="outline" className="flex-1">
            Set Alert Rules
          </Button>
          <Button className="flex-1">
            Export Analysis
          </Button>
        </div>
      </div>
    </Card>
  );
}