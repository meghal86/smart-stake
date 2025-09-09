import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Zap, Plus, Settings, Star } from 'lucide-react';
import { AlertsManager } from './AlertsManager';
import { useCustomAlerts } from '@/hooks/useCustomAlerts';

export const AlertQuickActions = () => {
  const [showAlertsManager, setShowAlertsManager] = useState(false);
  const { rules = [] } = useCustomAlerts();

  const activeRules = rules.filter(r => r.isActive);
  const recentlyTriggered = rules.filter(r => 
    r.lastTriggeredAt && 
    new Date(r.lastTriggeredAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Alert Center</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAlertsManager(true)}
            className="relative"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage
            {(activeRules.length > 0 || recentlyTriggered.length > 0) && (
              <div className="absolute -top-1 -right-1 flex gap-1">
                {activeRules.length > 0 && (
                  <Badge className="h-4 w-4 p-0 text-xs bg-green-500 text-white rounded-full flex items-center justify-center">
                    {activeRules.length}
                  </Badge>
                )}
                {recentlyTriggered.length > 0 && (
                  <Badge className="h-4 w-4 p-0 text-xs bg-blue-500 text-white rounded-full flex items-center justify-center animate-pulse">
                    {recentlyTriggered.length}
                  </Badge>
                )}
              </div>
            )}
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Active Rules</span>
            <Badge variant="outline" className="text-green-600">
              {activeRules.length}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Triggered Today</span>
            <Badge variant="outline" className="text-blue-600">
              {recentlyTriggered.length}
            </Badge>
          </div>

          <div className="pt-2 space-y-2">
            <Button 
              onClick={() => setShowAlertsManager(true)} 
              className="w-full" 
              size="sm"
            >
              <Zap className="h-4 w-4 mr-2" />
              Create Custom Alert
            </Button>
            
            {activeRules.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setShowAlertsManager(true)} 
                className="w-full" 
                size="sm"
              >
                <Star className="h-4 w-4 mr-2" />
                Save as Template
              </Button>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAlertsManager(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Templates
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAlertsManager(true)}
              >
                <Bell className="h-4 w-4 mr-1" />
                History
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              {activeRules.length > 0 ? 'Recent Rules:' : 'No custom rules yet'}
            </p>
            {activeRules.length > 0 ? (
              <div className="space-y-1">
                {activeRules.slice(0, 2).map(rule => (
                  <div key={rule.id} className="flex items-center justify-between text-xs">
                    <span className="truncate">{rule.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {rule.timesTriggered || 0}
                    </Badge>
                  </div>
                ))}
                {activeRules.length > 2 && (
                  <p className="text-xs text-muted-foreground">
                    +{activeRules.length - 2} more rules
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground">
                  Create your first custom alert rule
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  💡 Tip: Start with templates for common scenarios
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <AlertsManager
        isOpen={showAlertsManager}
        onClose={() => setShowAlertsManager(false)}
      />
    </>
  );
};