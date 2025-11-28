import React, { useState } from 'react';
import { Bell, DollarSign, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface QuickAlertSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const QuickAlertSetup: React.FC<QuickAlertSetupProps> = ({ isOpen, onClose, onComplete }) => {
  const [alertType, setAlertType] = useState<'whale' | 'price' | 'volume'>('whale');
  const [token, setToken] = useState('ETH');
  const [threshold, setThreshold] = useState('1000000');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleCreateAlert = async () => {
    setIsCreating(true);
    
    try {
      // TODO: Implement alert creation API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Alert created successfully!",
        description: `You'll be notified of ${token} ${alertType} activity above $${Number(threshold).toLocaleString()}.`,
      });
      
      onComplete();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create alert",
        description: "Please try again or create alerts from the dashboard.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const alertTypes = [
    { value: 'whale', label: 'Whale Transactions', icon: TrendingUp, description: 'Large transfers above threshold' },
    { value: 'price', label: 'Price Movements', icon: DollarSign, description: 'Significant price changes' },
    { value: 'volume', label: 'Volume Spikes', icon: Bell, description: 'Unusual trading volume' }
  ];

  const popularTokens = ['ETH', 'BTC', 'USDC', 'USDT', 'BNB', 'ADA', 'SOL', 'MATIC'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Quick Alert Setup
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Set up your first alert in under 30 seconds
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Alert Type Selection */}
          <div className="space-y-2">
            <Label>Alert Type</Label>
            <div className="grid grid-cols-1 gap-2">
              {alertTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      alertType === type.value 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted hover:border-muted-foreground/50'
                    }`}
                    onClick={() => setAlertType(type.value as unknown)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                      {alertType === type.value && (
                        <Badge variant="secondary" className="text-xs">Selected</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Token Selection */}
          <div className="space-y-2">
            <Label>Token</Label>
            <div className="flex flex-wrap gap-2">
              {popularTokens.map((tokenOption) => (
                <Button
                  key={tokenOption}
                  variant={token === tokenOption ? "default" : "outline"}
                  size="sm"
                  onClick={() => setToken(tokenOption)}
                  className="h-8"
                >
                  {tokenOption}
                </Button>
              ))}
            </div>
          </div>

          {/* Threshold */}
          <div className="space-y-2">
            <Label>Threshold (USD)</Label>
            <Select value={threshold} onValueChange={setThreshold}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100000">$100,000+</SelectItem>
                <SelectItem value="500000">$500,000+</SelectItem>
                <SelectItem value="1000000">$1,000,000+</SelectItem>
                <SelectItem value="5000000">$5,000,000+</SelectItem>
                <SelectItem value="10000000">$10,000,000+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">Alert Preview:</p>
            <p className="text-xs text-muted-foreground">
              You'll be notified when {token} {alertType} activity exceeds ${Number(threshold).toLocaleString()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Skip for Now
            </Button>
            <Button 
              onClick={handleCreateAlert} 
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Bell className="h-3 w-3 mr-2" />
                  Create Alert
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            You can customize and add more alerts from the dashboard
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickAlertSetup;