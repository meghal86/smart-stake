import { useState, useEffect } from "react";
import { Settings, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface UserPreferences {
  favorite_chains: string[];
  favorite_tokens: string[];
  min_whale_threshold: number;
  notification_settings: {
    whale_alerts: boolean;
    yield_alerts: boolean;
    risk_alerts: boolean;
  };
}

const availableChains = [
  { id: "ethereum", name: "Ethereum", color: "bg-blue-500" },
  { id: "polygon", name: "Polygon", color: "bg-purple-500" },
  { id: "solana", name: "Solana", color: "bg-green-500" },
  { id: "bsc", name: "BSC", color: "bg-yellow-500" },
  { id: "arbitrum", name: "Arbitrum", color: "bg-indigo-500" },
  { id: "optimism", name: "Optimism", color: "bg-red-500" },
  { id: "avalanche", name: "Avalanche", color: "bg-red-400" },
];

const popularTokens = [
  "BTC", "ETH", "USDC", "USDT", "BNB", "ADA", "SOL", "DOT", "MATIC", "AVAX",
  "LINK", "UNI", "AAVE", "COMP", "MKR", "SNX", "CRV", "SUSHI", "YFI", "1INCH"
];

export function PersonalizationSection() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    favorite_chains: ["ethereum"],
    favorite_tokens: [],
    min_whale_threshold: 1000000,
    notification_settings: {
      whale_alerts: true,
      yield_alerts: true,
      risk_alerts: false,
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [newToken, setNewToken] = useState("");

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data && !error) {
        setPreferences({
          favorite_chains: data.favorite_chains || ["ethereum"],
          favorite_tokens: data.favorite_tokens || [],
          min_whale_threshold: data.min_whale_threshold || 1000000,
          notification_settings: typeof data.notification_settings === 'object' && data.notification_settings !== null
            ? {
                whale_alerts: (data.notification_settings as any)?.whale_alerts ?? true,
                yield_alerts: (data.notification_settings as any)?.yield_alerts ?? true,
                risk_alerts: (data.notification_settings as any)?.risk_alerts ?? false,
              }
            : {
                whale_alerts: true,
                yield_alerts: true,
                risk_alerts: false,
              },
        });
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const savePreferences = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          ...preferences,
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChain = (chainId: string) => {
    setPreferences(prev => ({
      ...prev,
      favorite_chains: prev.favorite_chains.includes(chainId)
        ? prev.favorite_chains.filter(id => id !== chainId)
        : [...prev.favorite_chains, chainId]
    }));
  };

  const addToken = () => {
    if (newToken && !preferences.favorite_tokens.includes(newToken.toUpperCase())) {
      setPreferences(prev => ({
        ...prev,
        favorite_tokens: [...prev.favorite_tokens, newToken.toUpperCase()]
      }));
      setNewToken("");
    }
  };

  const removeToken = (token: string) => {
    setPreferences(prev => ({
      ...prev,
      favorite_tokens: prev.favorite_tokens.filter(t => t !== token)
    }));
  };

  const updateNotificationSetting = (key: keyof typeof preferences.notification_settings, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      notification_settings: {
        ...prev.notification_settings,
        [key]: value
      }
    }));
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border border-border/50">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-5 w-5 text-accent" />
        <h3 className="font-semibold text-foreground">Personalization</h3>
      </div>

      <div className="space-y-6">
        {/* Favorite Blockchains */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">Favorite Blockchains</Label>
          <p className="text-xs text-muted-foreground">
            Select your preferred chains to prioritize relevant alerts and opportunities
          </p>
          <div className="grid grid-cols-2 gap-2">
            {availableChains.map((chain) => (
              <button
                key={chain.id}
                onClick={() => toggleChain(chain.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  preferences.favorite_chains.includes(chain.id)
                    ? "border-primary/50 bg-primary/10 text-foreground"
                    : "border-border hover:bg-muted/30 text-muted-foreground"
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${chain.color}`} />
                <span className="text-sm font-medium">{chain.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Favorite Tokens */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">Favorite Tokens</Label>
          <p className="text-xs text-muted-foreground">
            Track specific tokens for personalized whale alerts
          </p>
          
          {/* Add Token Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add token (e.g., BTC, ETH)"
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addToken()}
              className="flex-1"
            />
            <Button onClick={addToken} size="sm" disabled={!newToken}>
              Add
            </Button>
          </div>

          {/* Popular Tokens */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Popular tokens:</Label>
            <div className="flex flex-wrap gap-1">
              {popularTokens.slice(0, 10).map((token) => (
                <button
                  key={token}
                  onClick={() => {
                    if (!preferences.favorite_tokens.includes(token)) {
                      setPreferences(prev => ({
                        ...prev,
                        favorite_tokens: [...prev.favorite_tokens, token]
                      }));
                    }
                  }}
                  className="px-2 py-1 text-xs bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded transition-colors"
                  disabled={preferences.favorite_tokens.includes(token)}
                >
                  {token}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Tokens */}
          {preferences.favorite_tokens.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {preferences.favorite_tokens.map((token) => (
                <Badge
                  key={token}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeToken(token)}
                >
                  {token} ×
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Whale Alert Threshold */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">
            Minimum Whale Alert Threshold
          </Label>
          <p className="text-xs text-muted-foreground">
            Only show transactions above this USD value
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              type="number"
              value={preferences.min_whale_threshold}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                min_whale_threshold: parseInt(e.target.value) || 1000000
              }))}
              className="flex-1"
            />
          </div>
        </div>

        {/* Notification Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">Notification Preferences</Label>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">Whale Alerts</div>
                <div className="text-xs text-muted-foreground">Large transaction notifications</div>
              </div>
              <Switch
                checked={preferences.notification_settings.whale_alerts}
                onCheckedChange={(checked) => updateNotificationSetting("whale_alerts", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">Yield Opportunities</div>
                <div className="text-xs text-muted-foreground">New high-yield protocol alerts</div>
              </div>
              <Switch
                checked={preferences.notification_settings.yield_alerts}
                onCheckedChange={(checked) => updateNotificationSetting("yield_alerts", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">Risk Alerts</div>
                <div className="text-xs text-muted-foreground">Security and risk notifications</div>
              </div>
              <Switch
                checked={preferences.notification_settings.risk_alerts}
                onCheckedChange={(checked) => updateNotificationSetting("risk_alerts", checked)}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button 
          onClick={savePreferences}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </Card>
  );
}