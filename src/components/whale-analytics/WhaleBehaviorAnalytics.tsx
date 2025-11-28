import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Activity, Wallet, Droplets, AlertTriangle, Eye, Settings, Download, Filter, Info, History, ExternalLink, Bell, HelpCircle, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EnterpriseFeatures } from './EnterpriseFeatures';
import { AlertsManager } from '@/components/alerts/AlertsManager';
import { WhaleProfileModal } from '@/components/whale-profiles/WhaleProfileModal';

interface WhaleData {
  id: string;
  address: string;
  balance: string;
  type: 'trader' | 'hodler' | 'liquidity_provider';
  riskScore: number;
  activity: {
    volume24h: string;
    transactions24h: number;
    lastActive: string;
  };
  signals: string[];
}

// Live whale data will be fetched from API
const liveWhales: WhaleData[] = [];

const getWhaleTypeIcon = (type: string) => {
  switch (type) {
    case 'trader': return <Activity className="h-4 w-4" />;
    case 'hodler': return <Wallet className="h-4 w-4" />;
    case 'liquidity_provider': return <Droplets className="h-4 w-4" />;
    default: return <Eye className="h-4 w-4" />;
  }
};

const getWhaleTypeColor = (type: string) => {
  switch (type) {
    case 'trader': return 'bg-red-500/10 text-red-600 border-red-500/20';
    case 'hodler': return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'liquidity_provider': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    default: return 'bg-gray-500/10 text-meta border-gray-500/20';
  }
};

const getRiskColor = (score: number) => {
  if (score >= 7) return 'text-red-600';
  if (score >= 4) return 'text-yellow-600';
  return 'text-green-600';
};

const getExplanationTooltip = (type: string, whale: WhaleData) => {
  switch (type) {
    case 'trader': return `Flagged as Trader: >$1M daily volume, ${whale.activity.transactions24h} transactions in 24h`;
    case 'hodler': return `Flagged as Hodler: Low activity (${whale.activity.transactions24h} tx/day), balance >${whale.balance.split(' ')[0]} ETH`;
    case 'liquidity_provider': return `Flagged as LP: Regular DEX interactions, providing liquidity across protocols`;
    default: return 'Classification based on on-chain behavior patterns';
  }
};

const getSignalExplanation = (signal: string) => {
  switch (signal) {
    case 'High Volume Trading': return 'High Volume Trading: >50 transactions/day in last 7 days';
    case 'Large Transaction Alert': return 'Large Transaction Alert: Single transaction >$100K detected';
    case 'Low Activity Pattern': return 'Low Activity Pattern: <2 transactions/day, typical hodler behavior';
    case 'LP Position Change': return 'LP Position Change: Liquidity pool deposits/withdrawals detected';
    case 'ESCALATING': return 'ESCALATING: Risk score increased by 2+ points in 24h';
    case 'NEW': return 'NEW: Pattern detected for first time in 30 days';
    case 'Large Balance': return 'Large Balance: Wallet holds >100K ETH equivalent';
    default: return signal;
  }
};

const exportHighRiskReport = (whales: WhaleData[]) => {
  const highRiskWhales = whales.filter(w => w.riskScore >= 7);
  const report = {
    generated_at: new Date().toISOString(),
    total_whales: whales.length,
    high_risk_count: highRiskWhales.length,
    critical_risk_count: whales.filter(w => w.riskScore >= 9).length,
    whales: highRiskWhales.map(w => ({
      address: w.address,
      type: w.type,
      risk_score: w.riskScore,
      balance: w.balance,
      signals: w.signals,
      confidence: w.confidence,
      last_updated: w.activity?.lastActive
    }))
  };
  
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `high-risk-whales-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
};

const exportWhaleData = (whales: WhaleData[]) => {
  const csvContent = whales.map(whale => 
    `${whale.address},${whale.type},${whale.balance},${whale.riskScore},${whale.activity?.volume24h || ''},${whale.signals?.join(';') || ''}`
  ).join('\n');
  const blob = new Blob([`Address,Type,Balance,Risk Score,24h Volume,Signals\n${csvContent}`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'whale-behavior-analytics.csv';
  a.click();
};

const fetchLiveWhaleData = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('whale-analytics');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching whale data:', error);
    return { whales: [], marketSignals: { highRisk: 0, clustering: 0, accumulation: 0 } };
  }
};

export const WhaleBehaviorAnalytics = () => {
  const [selectedWhale, setSelectedWhale] = useState<WhaleData | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [riskFilter, setRiskFilter] = useState('all');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [whales, setWhales] = useState<WhaleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketSignals, setMarketSignals] = useState({ highRisk: 0, clustering: 0, accumulation: 0 });
  const [showEnterpriseFeatures, setShowEnterpriseFeatures] = useState(false);
  const [showAlertsManager, setShowAlertsManager] = useState(false);
  const [showWhaleProfile, setShowWhaleProfile] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({ signals: false, whales: false, admin: true });
  const [activeTab, setActiveTab] = useState('signals');

  useEffect(() => {
    const loadWhaleData = async () => {
      setLoading(true);
      const data = await fetchLiveWhaleData();
      setWhales(data.whales || []);
      setMarketSignals(data.marketSignals || { highRisk: 0, clustering: 0, accumulation: 0 });
      setLoading(false);
    };
    loadWhaleData();
  }, []);

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* Sticky Summary Bar - Mobile */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b p-2 sm:hidden">
        <div className="flex items-center justify-between text-sm">
          <div className="flex gap-4">
            <span className="text-red-600">High Risk: {marketSignals.highRisk}</span>
            <span className="text-yellow-600">Clustering: {marketSignals.clustering}</span>
            <span className="text-green-600">Accumulation: {marketSignals.accumulation}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => setActiveTab(activeTab === 'signals' ? 'whales' : 'signals')}>
            {activeTab === 'signals' ? 'Whales' : 'Signals'}
          </Button>
        </div>
      </div>

      {/* Tab Navigation - Mobile */}
      <div className="flex border-b sm:hidden">
        <Button 
          variant={activeTab === 'signals' ? 'default' : 'ghost'} 
          className="flex-1 rounded-none" 
          onClick={() => setActiveTab('signals')}
        >
          Signals
        </Button>
        <Button 
          variant={activeTab === 'whales' ? 'default' : 'ghost'} 
          className="flex-1 rounded-none" 
          onClick={() => setActiveTab('whales')}
        >
          Whales
        </Button>
        <Button 
          variant={activeTab === 'admin' ? 'default' : 'ghost'} 
          className="flex-1 rounded-none" 
          onClick={() => setActiveTab('admin')}
        >
          Admin
        </Button>
      </div>

      {/* Market Signals Overview */}
      {(activeTab === 'signals' || window.innerWidth >= 640) && (
        <Card className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Market Signals</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="sm:hidden" 
                onClick={() => setCollapsedSections({...collapsedSections, signals: !collapsedSections.signals})}
              >
                {collapsedSections.signals ? '+' : '−'}
              </Button>
            </div>
          <div className="flex flex-wrap gap-2">
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter risks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Whales</SelectItem>
                <SelectItem value="new">New Patterns</SelectItem>
                <SelectItem value="escalating">Escalating Risk</SelectItem>
                <SelectItem value="high-risk">🚨 Danger Zone (7+)</SelectItem>
                <SelectItem value="critical-risk">⚠️ Critical (9+)</SelectItem>
                <SelectItem value="medium-risk">Medium Risk (4-6)</SelectItem>
                <SelectItem value="low-risk">Low Risk (1-3)</SelectItem>
              </SelectContent>
            </Select>
            <div data-tutorial="export-buttons" className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => exportWhaleData(whales)}>
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
              <Button variant="outline" size="sm" className="text-red-600" onClick={() => exportHighRiskReport(whales)}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Export High Risk
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAlertsManager(true)} data-tutorial="alerts-manager">
              <Bell className="h-4 w-4 mr-2" />
              Alerts
            </Button>
            <Button 
              variant={showEnterpriseFeatures ? "default" : "outline"} 
              size="sm" 
              onClick={() => setShowEnterpriseFeatures(!showEnterpriseFeatures)}
              data-tutorial="enterprise-button"
            >
              <Settings className="h-4 w-4 mr-2" />
              Enterprise
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAdmin(!showAdmin)}>
              <Settings className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </div>
        </div>
          {!collapsedSections.signals && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-700" />
                  <span className="text-sm font-medium text-red-800">High Risk Activity</span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xl sm:text-2xl font-bold text-red-700 cursor-help">
                      {marketSignals.highRisk}
                      <HelpCircle className="h-3 w-3 inline ml-1 opacity-60" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Whales with risk score ≥7 showing unusual trading patterns</p>
                  </TooltipContent>
                </Tooltip>
                <div className="text-xs text-red-600/80">Whales showing unusual patterns</div>
              </div>
              <div className="p-2 sm:p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <TrendingUp className="h-4 w-4 text-yellow-700" />
                  <span className="text-sm font-medium text-yellow-800">Whale Clustering</span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xl sm:text-2xl font-bold text-yellow-700 cursor-help">
                      {marketSignals.clustering}
                      <HelpCircle className="h-3 w-3 inline ml-1 opacity-60" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Whales showing coordinated behavior patterns</p>
                  </TooltipContent>
                </Tooltip>
                <div className="text-xs text-yellow-600/80">Similar behavior detected</div>
              </div>
              <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <TrendingDown className="h-4 w-4 text-green-700" />
                  <span className="text-sm font-medium text-green-800">Accumulation</span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xl sm:text-2xl font-bold text-green-700 cursor-help">
                      {marketSignals.accumulation}
                      <HelpCircle className="h-3 w-3 inline ml-1 opacity-60" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Whales in long-term accumulation phase</p>
                  </TooltipContent>
                </Tooltip>
                <div className="text-xs text-green-600/80">Whales in accumulation phase</div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Admin Panel */}
      {((activeTab === 'admin' || window.innerWidth >= 640) && showAdmin) && (
        <Card className="p-3 sm:p-4 bg-muted/20">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <h4 className="font-medium">Classification Thresholds</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              className="sm:hidden" 
              onClick={() => setCollapsedSections({...collapsedSections, admin: !collapsedSections.admin})}
            >
              {collapsedSections.admin ? '+' : '−'}
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Trader Volume Threshold</label>
              <div className="flex items-center gap-2">
                <Progress value={75} className="flex-1" />
                <span className="text-sm">$1M</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Hodler Activity Threshold</label>
              <div className="flex items-center gap-2">
                <Progress value={25} className="flex-1" />
                <span className="text-sm">2 tx/day</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Risk Score Sensitivity</label>
              <div className="flex items-center gap-2">
                <Progress value={60} className="flex-1" />
                <span className="text-sm">6.0</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Whale List */}
      {(activeTab === 'whales' || window.innerWidth >= 640) && (
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <h3 className="text-lg font-semibold">Classified Whales</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="sm:hidden" 
              onClick={() => setCollapsedSections({...collapsedSections, whales: !collapsedSections.whales})}
            >
              {collapsedSections.whales ? '+' : '−'}
            </Button>
          </div>
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : whales
            .filter(whale => {
              if (riskFilter === 'new') return whale.signals?.includes('NEW');
              if (riskFilter === 'escalating') return whale.signals?.includes('ESCALATING');
              if (riskFilter === 'high-risk') return whale.riskScore >= 7;
              if (riskFilter === 'critical-risk') return whale.riskScore >= 9;
              if (riskFilter === 'medium-risk') return whale.riskScore >= 4 && whale.riskScore <= 6;
              if (riskFilter === 'low-risk') return whale.riskScore <= 3;
              return true;
            })
            .sort((a, b) => {
              // Sort by risk score descending (highest risk first)
              return b.riskScore - a.riskScore;
            })
            .map((whale) => (
            <div
              key={whale.id}
              className="p-3 sm:p-4 border rounded-lg hover:bg-muted/20 cursor-pointer transition-all duration-200 hover:shadow-md"
              onClick={() => {
                setSelectedWhale(whale);
                setShowWhaleProfile(true);
              }}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="font-mono text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                    {whale.address.slice(0, 6)}...{whale.address.slice(-4)}
                  </div>
                  <div className="relative">
                    <Badge 
                      className={`text-xs ${getWhaleTypeColor(whale.type)} cursor-help`}
                      onMouseEnter={() => setShowTooltip(whale.id)}
                      onMouseLeave={() => setShowTooltip(null)}
                    >
                      {getWhaleTypeIcon(whale.type)}
                      <span className="ml-1 capitalize">{whale.type.replace('_', ' ')}</span>
                      <Info className="h-3 w-3 ml-1" />
                    </Badge>
                    {showTooltip === whale.id && (
                      <div className="absolute top-full left-0 mt-2 p-3 bg-popover border rounded-lg shadow-lg text-xs w-64 z-20">
                        {getExplanationTooltip(whale.type, whale)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{whale.balance}</div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`text-sm ${getRiskColor(whale.riskScore)} cursor-help`}>
                        Risk: {whale.riskScore}/10
                        <HelpCircle className="h-3 w-3 inline ml-1 opacity-60" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Risk calculated from transaction patterns, volume, and behavior changes</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{whale.activity?.volume24h || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{whale.activity?.transactions24h || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <History className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{whale.activity?.lastActive || 'N/A'}</span>
                </div>
              </div>

              {whale.signals && whale.signals.length > 0 && (
                <div className="mt-2 sm:mt-3">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {whale.signals.map((signal, index) => {
                    const isNew = signal === 'NEW';
                    const isEscalating = signal === 'ESCALATING';
                    const isHighVolume = signal === 'High Volume Trading';
                    return (
                      <div key={index} className="relative group">
                        <Badge 
                          variant="outline" 
                          className={`text-xs cursor-help ${
                            isNew ? 'bg-green-500/10 text-green-600 border-green-500/20 animate-pulse' :
                            isEscalating ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                            isHighVolume ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
                            ''
                          }`}
                        >
                          {signal}
                        </Badge>
                        <div className="absolute bottom-full left-0 mb-2 p-2 bg-popover border rounded shadow-lg text-xs w-64 z-30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          {getSignalExplanation(signal)}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
          </div>
        </Card>
      )}

      {/* Enterprise Features */}
      {showEnterpriseFeatures && (
        <Card className="p-6 border-2 border-slate-300 bg-gradient-to-r from-[#1C2546] to-[#29739E] text-white dark:border-slate-600">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">🏢 Enterprise Features</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowEnterpriseFeatures(false)}
              className="hover:bg-white/20 text-white hover:text-white"
            >
              ×
            </Button>
          </div>
          <div data-tutorial="risk-rules">
            <EnterpriseFeatures 
              whales={whales} 
              onTriggerAlert={(whale, rule) => {
                console.log(`Alert triggered for ${whale.address} by rule ${rule.name}`);
              }} 
            />
          </div>
        </Card>
      )}

      {/* Alerts Manager */}
      <AlertsManager isOpen={showAlertsManager} onClose={() => setShowAlertsManager(false)} />

      {/* Whale Profile Modal */}
      {selectedWhale && (
        <WhaleProfileModal 
          whale={selectedWhale} 
          isOpen={showWhaleProfile} 
          onClose={() => {
            setShowWhaleProfile(false);
            setSelectedWhale(null);
          }} 
        />
      )}



      {/* Floating Action Button - Mobile */}
      <div className="fixed bottom-4 right-4 sm:hidden z-50">
        <div className="flex flex-col gap-2">
          <Button 
            size="sm" 
            className="rounded-full w-12 h-12 shadow-lg"
            onClick={() => exportWhaleData(whales)}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="rounded-full w-12 h-12 shadow-lg bg-background"
            onClick={() => setShowAlertsManager(true)}
          >
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>
      </div>
    </TooltipProvider>
  );
};