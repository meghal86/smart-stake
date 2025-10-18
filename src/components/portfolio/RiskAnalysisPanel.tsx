import React, { useState } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, BarChart3, PieChart, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart as RechartsPieChart, Cell } from 'recharts';

interface RiskFactor {
  name: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  impact: 'low' | 'medium' | 'high';
  description: string;
}

interface GuardianFlag {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  count: number;
}

interface RiskAnalysisPanelProps {
  overallRiskScore: number;
  riskFactors: RiskFactor[];
  guardianFlags: GuardianFlag[];
  riskTrend: Array<{ date: string; score: number }>;
  liquidityRisk: number;
  concentrationRisk: number;
  marketCorrelation: number;
}

export const RiskAnalysisPanel: React.FC<RiskAnalysisPanelProps> = ({
  overallRiskScore,
  riskFactors,
  guardianFlags,
  riskTrend,
  liquidityRisk,
  concentrationRisk,
  marketCorrelation
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7D');

  const getRiskColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRiskBgColor = (score: number) => {
    if (score >= 8) return 'bg-green-500/10 border-green-500/20';
    if (score >= 6) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  // Prepare pie chart data for Guardian flags
  const flagChartData = guardianFlags.map(flag => ({
    name: flag.type,
    value: flag.count,
    color: getSeverityColor(flag.severity)
  }));

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-6 w-6 ${getRiskColor(overallRiskScore)}`} />
            <div>
              <h3 className="text-lg font-semibold">Risk Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive risk assessment with Guardian integration
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg ${getRiskBgColor(overallRiskScore)}`}>
            <div className={`text-2xl font-bold ${getRiskColor(overallRiskScore)}`}>
              {overallRiskScore}/10
            </div>
          </div>
        </div>

        <Tabs defaultValue="factors" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="factors">Risk Factors</TabsTrigger>
            <TabsTrigger value="guardian">Guardian Flags</TabsTrigger>
            <TabsTrigger value="metrics">Risk Metrics</TabsTrigger>
            <TabsTrigger value="trend">Trend Analysis</TabsTrigger>
          </TabsList>

          {/* Risk Factors Tab */}
          <TabsContent value="factors" className="space-y-4">
            <div className="space-y-3">
              {riskFactors.map((factor, index) => (
                <div key={index} className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{factor.name}</span>
                      {getTrendIcon(factor.trend)}
                      <Badge className={`text-xs ${getImpactColor(factor.impact)}`}>
                        {factor.impact}
                      </Badge>
                    </div>
                    <span className={`font-bold ${getRiskColor(factor.score)}`}>
                      {factor.score}/10
                    </span>
                  </div>
                  <Progress value={factor.score * 10} className="h-2 mb-2" />
                  <p className="text-sm text-muted-foreground">{factor.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Guardian Flags Tab */}
          <TabsContent value="guardian" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Flags List */}
              <div className="space-y-3">
                <h4 className="font-medium">Security Flags by Type</h4>
                {guardianFlags.map((flag, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getSeverityColor(flag.severity) }}
                      />
                      <span className="font-medium">{flag.type}</span>
                      <Badge variant="outline" className="text-xs">
                        {flag.severity}
                      </Badge>
                    </div>
                    <span className="font-bold">{flag.count}</span>
                  </div>
                ))}
              </div>

              {/* Flags Distribution Chart */}
              <div className="space-y-3">
                <h4 className="font-medium">Flag Distribution</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <RechartsPieChart
                        data={flagChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {flagChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </RechartsPieChart>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Risk Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Liquidity Risk */}
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="font-medium">Liquidity Risk</span>
                </div>
                <div className={`text-2xl font-bold ${getRiskColor(liquidityRisk)}`}>
                  {liquidityRisk}/10
                </div>
                <Progress value={liquidityRisk * 10} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Asset liquidity and exit capability
                </p>
              </div>

              {/* Concentration Risk */}
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <PieChart className="h-4 w-4 text-primary" />
                  <span className="font-medium">Concentration Risk</span>
                </div>
                <div className={`text-2xl font-bold ${getRiskColor(concentrationRisk)}`}>
                  {concentrationRisk}/10
                </div>
                <Progress value={concentrationRisk * 10} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Portfolio diversification level
                </p>
              </div>

              {/* Market Correlation */}
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="font-medium">Market Correlation</span>
                </div>
                <div className={`text-2xl font-bold ${getRiskColor(marketCorrelation)}`}>
                  {marketCorrelation}/10
                </div>
                <Progress value={marketCorrelation * 10} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Correlation with market movements
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Trend Analysis Tab */}
          <TabsContent value="trend" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Risk Score Trend</h4>
                <div className="flex gap-2">
                  {['1D', '7D', '30D'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedTimeframe(period)}
                      className={`px-3 py-1 text-xs rounded ${
                        selectedTimeframe === period
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={riskTrend}>
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#00D0C7" 
                      strokeWidth={2}
                      dot={{ fill: '#00D0C7', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};