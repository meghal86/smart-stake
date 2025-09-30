import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Keyboard, Search, TrendingUp, Fish, Briefcase, Zap } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';

interface HelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpOverlay({ isOpen, onClose }: HelpOverlayProps) {
  const { track } = useAnalytics();
  const [activeTab, setActiveTab] = useState('shortcuts');
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // POLISH: Focus trap and restoration
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    track('help_tab_changed', { tab });
  };

  const shortcuts = [
    { key: '/', description: 'Focus search bar', icon: <Search className="h-4 w-4" /> },
    { key: '?', description: 'Show this help', icon: <Keyboard className="h-4 w-4" /> },
    { key: 'Esc', description: 'Close modals/overlays', icon: <Zap className="h-4 w-4" /> },
    { key: '1-3', description: 'Switch between tabs', icon: <TrendingUp className="h-4 w-4" /> }
  ];

  const searchPrefixes = [
    { prefix: 'addr:', example: 'addr:0x123...', description: 'Search by wallet address' },
    { prefix: 'tx:', example: 'tx:0xabc...', description: 'Search by transaction hash' },
    { prefix: 'asset:', example: 'asset:ETH', description: 'Filter by asset/token' },
    { prefix: 'risk:', example: 'risk:high', description: 'Filter by risk level' },
    { prefix: 'chain:', example: 'chain:eth', description: 'Filter by blockchain' },
    { prefix: 'amount:', example: 'amount:>1000', description: 'Filter by transaction amount' }
  ];

  const features = [
    {
      title: 'KPI Cards',
      description: 'Click any KPI card to drill down into detailed views with pre-applied filters',
      icon: <TrendingUp className="h-5 w-5 text-blue-500" />
    },
    {
      title: 'Whale Analytics',
      description: 'Real-time whale tracking with risk scoring and transaction analysis',
      icon: <Fish className="h-5 w-5 text-green-500" />
    },
    {
      title: 'Portfolio Tracking',
      description: 'Multi-wallet portfolio monitoring with P&L tracking and rebalancing tools',
      icon: <Briefcase className="h-5 w-5 text-purple-500" />
    },
    {
      title: 'Activity Feed',
      description: 'Live stream of market events, whale movements, and portfolio changes',
      icon: <Zap className="h-5 w-5 text-orange-500" />
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Dashboard Help & Shortcuts
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="shortcuts">Keyboard Shortcuts</TabsTrigger>
            <TabsTrigger value="search">Search Tips</TabsTrigger>
            <TabsTrigger value="features">Features Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="shortcuts" className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold">Keyboard Shortcuts</h3>
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {shortcut.icon}
                    <span className="text-sm">{shortcut.description}</span>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {shortcut.key}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold">Smart Search Prefixes</h3>
              <p className="text-sm text-muted-foreground">
                Use these prefixes to quickly filter and find specific data:
              </p>
              {searchPrefixes.map((item, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {item.prefix}
                    </Badge>
                    <span className="text-sm font-medium">{item.description}</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    Example: {item.example}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold">Key Features</h3>
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  {feature.icon}
                  <div>
                    <h4 className="font-medium text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-sm mb-2">💡 Pro Tips</h4>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Use Compact Mode (Layers icon) for Bloomberg-style density</li>
                <li>• Click KPI cards to drill down with automatic filters applied</li>
                <li>• Save frequently used filter combinations as Saved Views</li>
                <li>• Export data to CSV/PDF for external analysis (Premium)</li>
                <li>• Set up alerts on whale movements and portfolio changes</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Got it!</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}