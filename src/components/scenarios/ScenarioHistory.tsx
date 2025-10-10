import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Play, Trash2, GitCompare, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTier } from '@/hooks/useTier';
import { supabase } from '@/integrations/supabase/client';

interface ScenarioHistoryItem {
  id: string;
  name: string;
  inputs: any;
  last_result: any;
  created_at: string;
  updated_at: string;
}

interface ScenarioHistoryProps {
  onRerun: (inputs: any) => void;
  onCompare: (scenarios: ScenarioHistoryItem[]) => void;
}

export function ScenarioHistory({ onRerun, onCompare }: ScenarioHistoryProps) {
  const { user } = useAuth();
  const { isPro, isPremium, isEnterprise } = useTier();
  const canAccessHistory = isPro || isPremium || isEnterprise;
  const [scenarios, setScenarios] = useState<ScenarioHistoryItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    asset: 'all',
    dateRange: '30d',
    minConfidence: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && canAccessHistory) {
      fetchHistory();
    } else {
      setIsLoading(false);
    }
  }, [user, canAccessHistory, filters]);

  const fetchHistory = async () => {
    try {
      let query = supabase
        .from('scenarios')
        .select('*')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false });

      if (filters.asset !== 'all') {
        query = query.eq('inputs->asset', filters.asset);
      }

      const { data, error } = await query;
      if (error) throw error;

      setScenarios((data || []).map(scenario => ({
        ...scenario,
        created_at: scenario.created_at || new Date().toISOString(),
        updated_at: scenario.updated_at || new Date().toISOString(),
        inputs: scenario.inputs || {},
        last_result: scenario.last_result || null
      })));
    } catch (error) {
      console.error('Failed to fetch scenario history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setScenarios(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Failed to delete scenario:', error);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => 
      checked 
        ? [...prev, id]
        : prev.filter(selectedId => selectedId !== id)
    );
  };

  const handleCompare = () => {
    const selectedScenarios = scenarios.filter(s => selectedIds.includes(s.id));
    onCompare(selectedScenarios);
  };

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Sign In to View History</h3>
        <p className="text-muted-foreground mb-4">
          Track your scenario runs and compare results over time
        </p>
        <Button onClick={() => window.location.href = '/login'}>
          Sign In
        </Button>
      </Card>
    );
  }

  if (!canAccessHistory) {
    return (
      <Card className="p-8 text-center">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Pro Feature</h3>
        <p className="text-muted-foreground mb-4">
          Upgrade to Pro to save and track your scenarios
        </p>
        <Button onClick={() => window.location.href = '/subscription'}>
          Upgrade to Pro
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Scenario History</h3>
        {selectedIds.length > 1 && (
          <Button size="sm" onClick={handleCompare}>
            <GitCompare className="h-4 w-4 mr-2" />
            Compare ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <Select value={filters.asset} onValueChange={(value) => setFilters({...filters, asset: value})}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assets</SelectItem>
            <SelectItem value="ETH">ETH</SelectItem>
            <SelectItem value="BTC">BTC</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.dateRange} onValueChange={(value) => setFilters({...filters, dateRange: value})}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* History Table */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        ) : scenarios.length > 0 ? (
          scenarios.map((scenario) => (
            <div key={scenario.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
              <Checkbox
                checked={selectedIds.includes(scenario.id)}
                onCheckedChange={(checked) => handleSelect(scenario.id, checked as boolean)}
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">{scenario.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {scenario.inputs?.asset || 'ETH'}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {scenario.inputs?.direction || 'accumulation'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{new Date(scenario.created_at).toLocaleDateString()}</span>
                  {scenario.last_result && (
                    <>
                      <span>Δ {scenario.last_result.deltaPct?.toFixed(1)}%</span>
                      <span>{Math.round((scenario.last_result.confidence || 0) * 100)}% confidence</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onRerun(scenario.inputs)}
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDelete(scenario.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">No scenarios yet</p>
            <p className="text-sm mb-4">Try CEX Inflows Spike or build one below</p>
            <div className="flex gap-2 justify-center">
              <Button size="sm" variant="outline" onClick={() => window.location.href = '/?tab=scenarios'}>
                Try Presets
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}