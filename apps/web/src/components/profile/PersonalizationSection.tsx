import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Palette, Moon, Sun, Monitor } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserMetadata, updateUserMetadata } from '@/hooks/useUserMetadata';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeContext';

const POPULAR_CHAINS = ['Ethereum', 'Bitcoin', 'Polygon', 'BSC', 'Arbitrum', 'Optimism', 'Avalanche'];
const POPULAR_TOKENS = ['ETH', 'BTC', 'USDC', 'USDT', 'MATIC', 'BNB', 'AVAX', 'SOL'];

export const PersonalizationSection = () => {
  const { user } = useAuth();
  const { metadata, refetch } = useUserMetadata();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  const [favoriteChains, setFavoriteChains] = useState<string[]>(
    metadata?.preferences?.favorite_chains || []
  );
  const [favoriteTokens, setFavoriteTokens] = useState<string[]>(
    metadata?.preferences?.favorite_tokens || []
  );
  const [minThreshold, setMinThreshold] = useState<string>(
    metadata?.preferences?.min_whale_threshold?.toString() || '1000000'
  );
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    if (!user || !metadata) return;

    const updates = {
      ...metadata,
      preferences: {
        ...metadata.preferences,
        favorite_chains: favoriteChains,
        favorite_tokens: favoriteTokens,
        min_whale_threshold: parseInt(minThreshold) || 1000000,
      },
    };

    const result = await updateUserMetadata(user.id, updates);
    
    if (result.success) {
      toast({
        title: 'Preferences Updated',
        description: 'Your personalization settings have been saved.',
      });
      setIsEditing(false);
      refetch();
    } else {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Failed to save your preferences. Please try again.',
      });
    }
  };

  const addChain = (chain: string) => {
    if (!favoriteChains?.includes(chain)) {
      setFavoriteChains([...(favoriteChains || []), chain]);
    }
  };

  const removeChain = (chain: string) => {
    setFavoriteChains(favoriteChains?.filter(c => c !== chain) || []);
  };

  const addToken = (token: string) => {
    if (!favoriteTokens?.includes(token)) {
      setFavoriteTokens([...(favoriteTokens || []), token]);
    }
  };

  const removeToken = (token: string) => {
    setFavoriteTokens(favoriteTokens?.filter(t => t !== token) || []);
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Personalization</h3>
        </div>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Favorite Chains */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Favorite Chains</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {favoriteChains?.map((chain) => (
              <Badge key={chain} variant="secondary" className="flex items-center gap-1">
                {chain}
                {isEditing && (
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeChain(chain)}
                  />
                )}
              </Badge>
            ))}
          </div>
          {isEditing && (
            <div className="flex flex-wrap gap-1">
              {POPULAR_CHAINS.filter(chain => !favoriteChains?.includes(chain)).map((chain) => (
                <Button
                  key={chain}
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => addChain(chain)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {chain}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Favorite Tokens */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Favorite Tokens</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {favoriteTokens?.map((token) => (
              <Badge key={token} variant="secondary" className="flex items-center gap-1">
                {token}
                {isEditing && (
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeToken(token)}
                  />
                )}
              </Badge>
            ))}
          </div>
          {isEditing && (
            <div className="flex flex-wrap gap-1">
              {POPULAR_TOKENS.filter(token => !favoriteTokens?.includes(token)).map((token) => (
                <Button
                  key={token}
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => addToken(token)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {token}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Preference */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Theme Preference</Label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Light
                </div>
              </SelectItem>
              <SelectItem value="dark">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  Dark
                </div>
              </SelectItem>
              <SelectItem value="system">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  System
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Minimum Whale Threshold */}
        <div>
          <Label htmlFor="threshold" className="text-sm font-medium mb-2 block">
            Minimum Whale Threshold (USD)
          </Label>
          {isEditing ? (
            <Input
              id="threshold"
              type="number"
              value={minThreshold}
              onChange={(e) => setMinThreshold(e.target.value)}
              placeholder="1000000"
              className="w-full"
            />
          ) : (
            <div className="text-sm text-muted-foreground">
              ${parseInt(minThreshold || '1000000').toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};