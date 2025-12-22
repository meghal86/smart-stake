import { useState } from 'react';
import { Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DisabledTooltipButton } from '@/components/ui/disabled-tooltip-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useWhalePreferences } from '@/hooks/useWhalePreferences';

export function WhalePreferencesModal() {
  const { preferences, updatePreferences, isLoading } = useWhalePreferences();
  const [isOpen, setIsOpen] = useState(false);
  const [localPrefs, setLocalPrefs] = useState(preferences);

  const handleSave = async () => {
    console.log('Saving preferences:', localPrefs);
    await updatePreferences(localPrefs);
    console.log('Preferences saved successfully');
    setIsOpen(false);
  };

  const chains = [
    { value: 'ethereum', label: 'Ethereum' },
    { value: 'tron', label: 'Tron' },
    { value: 'ripple', label: 'Ripple' },
    { value: 'solana', label: 'Solana' },
    { value: 'avalanche', label: 'Avalanche' },
    { value: 'polygon', label: 'Polygon' },
    { value: 'bsc', label: 'BSC' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-1" />
          Preferences
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Whale Alert Preferences</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="minAmount">Minimum Amount (USD)</Label>
            <Input
              id="minAmount"
              type="number"
              value={localPrefs.minAmountUsd}
              onChange={(e) => setLocalPrefs({
                ...localPrefs,
                minAmountUsd: parseInt(e.target.value) || 1000000
              })}
              placeholder="1000000"
            />
          </div>

          <div>
            <Label>Preferred Chains</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {chains.map((chain) => (
                <div key={chain.value} className="flex items-center space-x-2">
                  <Switch
                    checked={localPrefs.preferredChains.includes(chain.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setLocalPrefs({
                          ...localPrefs,
                          preferredChains: [...localPrefs.preferredChains, chain.value]
                        });
                      } else {
                        setLocalPrefs({
                          ...localPrefs,
                          preferredChains: localPrefs.preferredChains.filter(c => c !== chain.value)
                        });
                      }
                    }}
                  />
                  <Label className="text-sm">{chain.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={localPrefs.excludeExchanges}
              onCheckedChange={(checked) => setLocalPrefs({
                ...localPrefs,
                excludeExchanges: checked
              })}
            />
            <Label>Exclude exchange transactions</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={localPrefs.notificationEnabled}
              onCheckedChange={(checked) => setLocalPrefs({
                ...localPrefs,
                notificationEnabled: checked
              })}
            />
            <Label>Enable notifications</Label>
          </div>

          <DisabledTooltipButton 
            onClick={handleSave} 
            className="w-full" 
            disabled={isLoading}
            disabledTooltip={isLoading ? "Saving preferences..." : undefined}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Preferences
          </DisabledTooltipButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}