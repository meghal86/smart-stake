import React, { useEffect, useState } from 'react';
import PortfolioLayout from '@/components/layouts/PortfolioLayout';
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { RiskAnalysisPanel } from '@/components/portfolio/RiskAnalysisPanel';
import { usePortfolioSummary } from '@/hooks/portfolio/usePortfolioSummary';
import { useRisk } from '@/hooks/portfolio/useRisk';
import { useUIMode } from '@/store/uiMode';
import Hub2Layout from '@/components/hub2/Hub2Layout';
import LegendaryLayout from '@/components/ui/LegendaryLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, TrendingDown, Shield, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Risk() {
  const { data: summary } = usePortfolioSummary();
  const { metrics, trend } = useRisk();
  const { mode } = useUIMode() || { mode: 'novice' };
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [previousRisk, setPreviousRisk] = useState<number | null>(null);
  
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.classList.remove("dark", "pro");
    if (savedTheme === "dark") document.documentElement.classList.add("dark");
    if (savedTheme === "pro") document.documentElement.classList.add("dark", "pro");
  }, []);

  useEffect(() => {
    if (summary?.riskScore && previousRisk !== null) {
      const riskChange = Math.abs(summary.riskScore - previousRisk);
      if (riskChange > 0.5) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      }
    }
    if (summary?.riskScore) {
      setPreviousRisk(summary.riskScore);
    }
  }, [summary?.riskScore, previousRisk]);

  const getRiskColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRiskBgColor = (score: number) => {
    if (score >= 8) return 'from-green-500/20 to-green-500/5';
    if (score >= 6) return 'from-yellow-500/20 to-yellow-500/5';
    return 'from-red-500/20 to-red-500/5';
  };

  const riskFactors = [
    {
      id: 'concentration',
      name: 'Concentration Risk',
      score: metrics?.concentration || 6.5,
      description: 'Portfolio concentrated in top 3 assets',
      mitigation: 'Diversify holdings across more assets and sectors',
      trend: 'stable' as const
    },
    {
      id: 'liquidity',
      name: 'Liquidity Risk', 
      score: metrics?.liquidity || 8.2,
      description: 'High liquidity across major holdings',
      mitigation: 'Maintain current liquidity levels',
      trend: 'down' as const
    },
    {
      id: 'correlation',
      name: 'Market Correlation',
      score: metrics?.correlation || 7.1,
      description: 'Moderate correlation with broader market',
      mitigation: 'Add uncorrelated assets like commodities',
      trend: 'up' as const
    }
  ];

  return (
    <LegendaryLayout mode={mode}>
      <Hub2Layout>
        <PortfolioLayout>
          <div style={{ 
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 24px'
          }}>
            {/* Risk Change Toast */}
            <AnimatePresence>
              {showToast && summary && previousRisk && (
                <motion.div
                  className="fixed top-6 right-6 z-50 p-4 bg-gradient-to-r from-primary/90 to-primary/70 text-white rounded-lg shadow-lg backdrop-blur"
                  initial={{ opacity: 0, x: 100, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 100, scale: 0.9 }}
                >
                  <div className="flex items-center gap-2">
                    {summary.riskScore < previousRisk ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                      Risk {summary.riskScore < previousRisk ? 'decreased' : 'increased'} from {previousRisk.toFixed(1)} → {summary.riskScore.toFixed(1)}!
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <PortfolioHeader summary={summary} />
              
              {/* Risk Overview Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Trust Index with Pulsing Ring */}
                    <div className="text-center">
                      <motion.div 
                        className="relative w-24 h-24 mx-auto mb-4"
                        animate={{ 
                          scale: summary?.trustIndex ? [1, 1.05, 1] : 1
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                        <motion.div 
                          className="absolute inset-2 border-4 border-primary rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {summary?.trustIndex || 87}%
                          </span>
                        </div>
                      </motion.div>
                      <h3 className="font-semibold">Trust Index</h3>
                      <p className="text-sm text-muted-foreground">
                        More trusted than 76% of users
                      </p>
                    </div>

                    {/* Risk Score */}
                    <div className="text-center">
                      <motion.div
                        className={`text-4xl font-bold mb-2 ${getRiskColor(summary?.riskScore || 6.2)}`}
                        animate={{ 
                          scale: summary?.riskScore !== previousRisk ? [1, 1.1, 1] : 1
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        {summary?.riskScore?.toFixed(1) || '6.2'}/10
                      </motion.div>
                      <h3 className="font-semibold">Risk Score</h3>
                      <p className="text-sm text-muted-foreground">
                        {(summary?.riskScore || 6.2) >= 8 ? 'Low risk' : 
                         (summary?.riskScore || 6.2) >= 6 ? 'Medium risk - Diversify top 3 assets' : 
                         'High risk - Immediate action needed'}
                      </p>
                    </div>

                    {/* Portfolio Value */}
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2 text-foreground">
                        ${(summary?.totalValue || 125000).toLocaleString()}
                      </div>
                      <h3 className="font-semibold">Portfolio Value</h3>
                      <div className={`text-sm flex items-center justify-center gap-1 ${
                        (summary?.pnl24hPct || 2.4) >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {(summary?.pnl24hPct || 2.4) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {(summary?.pnl24hPct || 2.4) >= 0 ? '+' : ''}{(summary?.pnl24hPct || 2.4).toFixed(1)}% (24h)
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Risk Factors */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                    Risk Factor Analysis
                  </h3>
                  
                  <div className="space-y-4">
                    {riskFactors.map((factor, index) => (
                      <motion.div
                        key={factor.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="border border-muted rounded-lg overflow-hidden"
                      >
                        <motion.div
                          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setExpandedRisk(expandedRisk === factor.id ? null : factor.id)}
                          whileHover={{ x: 5 }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${getRiskColor(factor.score).replace('text-', 'bg-')}`} />
                              <h4 className="font-medium">{factor.name}</h4>
                              <Badge className={`${getRiskColor(factor.score)} bg-transparent border-current`}>
                                {factor.score.toFixed(1)}/10
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {factor.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                              {factor.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                              {factor.trend === 'stable' && <div className="w-4 h-0.5 bg-muted-foreground" />}
                              {expandedRisk === factor.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </div>
                          
                          <motion.div
                            className="mb-2"
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ delay: 0.6 + index * 0.1, duration: 0.8, ease: "easeOut" }}
                          >
                            <Progress 
                              value={factor.score * 10} 
                              className={`h-2 bg-gradient-to-r ${getRiskBgColor(factor.score)}`}
                            />
                          </motion.div>
                          
                          <p className="text-sm text-muted-foreground">
                            {factor.description}
                          </p>
                        </motion.div>
                        
                        <AnimatePresence>
                          {expandedRisk === factor.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="border-t border-muted bg-muted/20 p-4"
                            >
                              <div className="space-y-3">
                                <div>
                                  <h5 className="font-medium text-sm mb-1 flex items-center gap-2">
                                    <Zap className="h-3 w-3 text-primary" />
                                    Mitigation Strategy
                                  </h5>
                                  <p className="text-sm text-muted-foreground">
                                    {factor.mitigation}
                                  </p>
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    View Details
                                  </Button>
                                  <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80">
                                    Take Action
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </PortfolioLayout>
      </Hub2Layout>
    </LegendaryLayout>
  );
}