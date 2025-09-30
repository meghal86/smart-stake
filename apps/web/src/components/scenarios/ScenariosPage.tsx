import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ScenarioForm, ScenarioInputs } from './ScenarioForm';
import { ScenarioResult, ScenarioResult as ScenarioResultType } from './ScenarioResult';
import { ScenarioPresets } from './ScenarioPresets';
import { ScenarioHistory } from './ScenarioHistory';
import { ScenariosMetricsHeader } from './ScenariosMetricsHeader';
import { useTier } from '@/hooks/useTier';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Lock } from 'lucide-react';

export function ScenariosPage() {
  const { user } = useAuth();
  const { tier, isPro, isPremium, isEnterprise } = useTier();
  const canAccessAdvanced = isPro || isPremium || isEnterprise;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScenarioResultType | null>(null);
  const [previousResult, setPreviousResult] = useState<ScenarioResultType | null>(null);
  const [activeView, setActiveView] = useState<'builder' | 'history'>('builder');

  const handleRunScenario = async (inputs: ScenarioInputs) => {
    setIsLoading(true);
    setPreviousResult(result);
    
    try {
      const { data, error } = await supabase.functions.invoke('scenario-simulate', {
        body: { 
          inputs, 
          userId: user?.id,
          flags: {
            includeSpillover: canAccessAdvanced,
            includeBacktests: canAccessAdvanced
          }
        }
      });

      if (error) throw error;

      setResult(data);
      
      // Auto-save successful runs for Pro+ users
      if (canAccessAdvanced) {
        const autoSaveName = `${inputs.asset} ${inputs.direction} - ${new Date().toLocaleString()}`;
        try {
          await supabase
            .from('scenarios')
            .insert({
              user_id: user?.id,
              name: autoSaveName,
              inputs,
              last_result: data
            });
        } catch (error) {
          console.log('Auto-save failed:', error);
        }
      }
      
      toast({
        title: "Scenario Complete",
        description: "Your what-if simulation has been generated.",
      });
    } catch (error) {
      toast({
        title: "Simulation Failed",
        description: "Unable to run scenario. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveScenario = async (inputs: ScenarioInputs, name: string) => {
    if (!canAccessAdvanced) {
      toast({
        title: "Pro Feature",
        description: "Upgrade to Pro to save scenarios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('scenarios')
        .insert({
          user_id: user?.id,
          name,
          inputs,
          last_result: result
        });

      if (error) throw error;

      toast({
        title: "Scenario Saved",
        description: `"${name}" has been saved to your scenarios.`,
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Unable to save scenario. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateAlert = async (inputs: ScenarioInputs) => {
    toast({
      title: "Alert Created",
      description: "You'll be notified when this scenario occurs.",
    });
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your scenario report is being generated.",
    });
  };

  const handleShare = async () => {
    toast({
      title: "Share Link Created",
      description: "Scenario link copied to clipboard.",
    });
  };

  const handlePromoteToAlert = () => {
    toast({
      title: "Alert Workflow Started",
      description: "Converting scenario to monitoring alert.",
    });
  };

  const handleRerun = (inputs: ScenarioInputs) => {
    handleRunScenario(inputs);
    setActiveView('builder');
  };

  const handleCompare = (scenarios: any[]) => {
    toast({
      title: "Comparison Ready",
      description: `Comparing ${scenarios.length} scenarios.`,
    });
  };

  const handleSelectPreset = (inputs: ScenarioInputs) => {
    // This would update the form with preset values
    toast({
      title: "Preset Loaded",
      description: "Scenario form updated with preset values.",
    });
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Sign In Required</h3>
          <p className="text-muted-foreground mb-4">
            Create an account to access scenario simulations
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">What-If Scenarios</h2>
        <p className="text-muted-foreground">
          Simulate whale flows and predict market impact
        </p>
      </div>

      {/* Metrics Header */}
      <ScenariosMetricsHeader />

      {/* Tier Gate for Free Users */}
      {tier === 'guest' && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Unlock Scenario Builder</h3>
              <p className="text-sm text-blue-700">
                Create unlimited what-if simulations with Pro
              </p>
            </div>
            <Button onClick={() => window.location.href = '/subscription'}>
              Upgrade to Pro
            </Button>
          </div>
        </Card>
      )}

      {/* View Toggle */}
      <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit mb-6">
        <Button
          variant={activeView === 'builder' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('builder')}
        >
          Scenario Builder
        </Button>
        <Button
          variant={activeView === 'history' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('history')}
        >
          History
        </Button>
      </div>

      {activeView === 'builder' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <ScenarioPresets 
              onSelectPreset={handleSelectPreset}
              userTier={tier}
            />
            
            <ScenarioForm
              onRun={handleRunScenario}
              onSave={handleSaveScenario}
              onCreateAlert={handleCreateAlert}
              isLoading={isLoading}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {result ? (
              <>
                <ScenarioResult 
                  result={result}
                  onExport={handleExport}
                  onShare={handleShare}
                  onPromoteToAlert={handlePromoteToAlert}
                />
                
                {/* Diff Mode */}
                {previousResult && (
                  <Card className="p-4 bg-yellow-50 border-yellow-200">
                    <div className="text-sm">
                      <div className="font-medium text-yellow-900 mb-1">Change from Previous</div>
                      <div className="text-yellow-800">
                        Delta: {result.deltaPct > previousResult.deltaPct ? '+' : ''}
                        {(result.deltaPct - previousResult.deltaPct).toFixed(1)}%
                      </div>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card className="p-12 text-center">
                <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Ready to Simulate</h3>
                <p className="text-muted-foreground">
                  Configure your scenario and click "Run Simulation" to see the predicted impact
                </p>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <ScenarioHistory 
          onRerun={handleRerun}
          onCompare={handleCompare}
        />
      )}
    </div>
  );
}