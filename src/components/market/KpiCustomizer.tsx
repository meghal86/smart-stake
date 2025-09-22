import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Settings, DollarSign, Fish, AlertTriangle, Activity, TrendingUp, Target } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface KpiOption {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  premium?: boolean;
}

const AVAILABLE_KPIS: KpiOption[] = [
  { id: 'volume', title: '24h Volume', icon: <DollarSign className="h-4 w-4" />, description: 'Total transaction volume' },
  { id: 'whales', title: 'Active Whales', icon: <Fish className="h-4 w-4" />, description: 'Unique whale addresses' },
  { id: 'risk', title: 'Risk Alerts', icon: <AlertTriangle className="h-4 w-4" />, description: 'High-risk transactions' },
  { id: 'score', title: 'Risk Score', icon: <Activity className="h-4 w-4" />, description: 'Average risk rating' },
  { id: 'sentiment', title: 'Market Sentiment', icon: <TrendingUp className="h-4 w-4" />, description: 'Overall market mood', premium: true },
  { id: 'volatility', title: 'Volatility Index', icon: <Target className="h-4 w-4" />, description: 'Price volatility measure', premium: true }
];

interface KpiCustomizerProps {
  selectedKpis: string[];
  onKpisChange: (kpis: string[]) => void;
}

export function KpiCustomizer({ selectedKpis, onKpisChange }: KpiCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { track } = useAnalytics();
  const { isEnabled } = useFeatureFlags();

  if (!isEnabled('custom_kpi_cards')) {
    return null;
  }

  const handleKpiToggle = (kpiId: string, checked: boolean) => {
    let newKpis = [...selectedKpis];
    
    if (checked && newKpis.length < 6) {
      newKpis.push(kpiId);
    } else if (!checked) {
      newKpis = newKpis.filter(id => id !== kpiId);
    }
    
    // Ensure minimum 3 KPIs
    if (newKpis.length >= 3) {
      onKpisChange(newKpis);
      track('kpi_customization_changed', { selectedKpis: newKpis });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Customize KPI Cards</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Select 3-6 metrics to display in your dashboard header.
          </div>

          <div className="space-y-3">
            {AVAILABLE_KPIS.map((kpi) => (
              <div key={kpi.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                <Checkbox
                  id={kpi.id}
                  checked={selectedKpis.includes(kpi.id)}
                  onCheckedChange={(checked) => handleKpiToggle(kpi.id, checked as boolean)}
                  disabled={!selectedKpis.includes(kpi.id) && selectedKpis.length >= 6}
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {kpi.icon}
                    <span className="font-medium text-sm">{kpi.title}</span>
                    {kpi.premium && (
                      <Badge variant="secondary" className="text-xs">Premium</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{kpi.description}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            Selected: {selectedKpis.length}/6 • Minimum: 3
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}