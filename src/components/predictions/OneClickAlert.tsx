import React, { useState } from 'react';
import { Bell, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSubscription } from '@/hooks/useSubscription';
import { track } from '@/lib/analytics';

interface OneClickAlertProps {
  asset: string;
  direction: 'long' | 'short';
  horizon: number;
  confidence: number;
}

export function OneClickAlert({ asset, direction, horizon, confidence }: OneClickAlertProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [minAmount, setMinAmount] = useState('10');
  const [ethEnabled, setEthEnabled] = useState(asset === 'ETH');
  const [btcEnabled, setBtcEnabled] = useState(asset === 'BTC');
  const { canAccessFeature } = useSubscription();
  
  const handleCreateAlert = () => {
    if (!canAccessFeature('multiChannelAlerts')) {
      // Show upgrade prompt
      window.location.href = '/subscription';
      return;
    }

    track('alert_created_from_prediction', { asset, direction, horizon });
    
    // Create alert logic here
    console.log('Creating alert:', { asset, direction, horizon });
    setIsOpen(false);
  };

  return (
    <>
      <Button 
        size="sm" 
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-1"
      >
        <Bell className="h-3 w-3" />
        Alert
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Alert</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge>{asset}</Badge>
              <Badge variant={direction === 'long' ? 'default' : 'destructive'}>
                {direction.toUpperCase()}
              </Badge>
              <Badge variant="outline">{horizon}min</Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Get notified when whale signals match your criteria
            </p>
            
            {/* Customization Options */}
            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <Label htmlFor="min-amount">Minimum whale move (millions)</Label>
              </div>
              <Input
                id="min-amount"
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="10"
                className="w-24"
              />
              
              <div className="space-y-2">
                <Label>Assets to monitor:</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="eth-toggle"
                      checked={ethEnabled}
                      onCheckedChange={setEthEnabled}
                    />
                    <Label htmlFor="eth-toggle">ETH</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="btc-toggle"
                      checked={btcEnabled}
                      onCheckedChange={setBtcEnabled}
                    />
                    <Label htmlFor="btc-toggle">BTC</Label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleCreateAlert} className="flex-1">
                Create Alert
              </Button>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}