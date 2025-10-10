import { useState, useEffect } from 'react';
import { Bookmark, Star, Share, Trash2, Plus, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/integrations/supabase/client';

interface SavedView {
  id: string;
  name: string;
  view_state: any;
  is_default: boolean | null;
  user_id: string | null;
  created_at: string | null;
}

interface SavedViewsManagerProps {
  currentState: {
    timeframe: string;
    chain: string;
    searchQuery: string;
    activeTab: string;
  };
  onViewSelect: (viewId: string) => void;
  onSaveView: (name: string) => void;
}

export function SavedViewsManager({ currentState, onViewSelect, onSaveView }: SavedViewsManagerProps) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { userPlan } = useSubscription();
  const { toast } = useToast();
  const { track } = useAnalytics();

  // Load saved views
  useEffect(() => {
    if (user) {
      loadSavedViews();
    }
  }, [user]);

  const loadSavedViews = async () => {
    try {
      // Try to load from localStorage first as fallback
      const localViews = localStorage.getItem(`saved_views_${user?.id}`);
      if (localViews) {
        setViews(JSON.parse(localViews));
        return;
      }
      
      const { data, error } = await supabase
        .from('saved_views')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setViews(data || []);
    } catch (error) {
      console.error('Failed to load saved views:', error);
      // Use empty array as fallback
      setViews([]);
    }
  };

  const saveCurrentView = async () => {
    if (!user || !newViewName.trim()) return;

    // Check plan limits
    if (userPlan.plan === 'free' && views.length >= 2) {
      toast({
        title: 'Upgrade Required',
        description: 'Free plan allows up to 2 saved views. Upgrade for unlimited views.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const newView: SavedView = {
        id: `view_${Date.now()}`,
        name: newViewName.trim(),
        view_state: currentState,
        is_default: views.length === 0,
        user_id: user.id,
        created_at: new Date().toISOString()
      };
      
      // Try database first, fallback to localStorage
      try {
        const { error } = await supabase
          .from('saved_views')
          .insert({
            name: newView.name,
            view_state: newView.view_state,
            is_default: newView.is_default
          });

        if (error) throw error;
      } catch (dbError) {
        // Fallback to localStorage
        const updatedViews = [...views, newView];
        localStorage.setItem(`saved_views_${user.id}`, JSON.stringify(updatedViews));
        setViews(updatedViews);
      }

      toast({
        title: 'View Saved',
        description: `"${newViewName}" has been saved successfully.`
      });

      setNewViewName('');
      setIsOpen(false);
      loadSavedViews();
      onSaveView(newViewName);
      track('saved_view_created', { name: newViewName, state: currentState, plan: userPlan.plan });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save view. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const setAsDefault = async (viewId: string) => {
    try {
      // Remove default from all views
      if (user?.id) {
        await supabase
          .from('saved_views')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      // Set new default
      await supabase
        .from('saved_views')
        .update({ is_default: true })
        .eq('id', viewId);

      toast({
        title: 'Default Updated',
        description: 'Default view has been updated.'
      });

      loadSavedViews();
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update default view.',
        variant: 'destructive'
      });
    }
  };

  const shareView = async (view: SavedView) => {
    if (userPlan.plan === 'free') {
      toast({
        title: 'Premium Feature',
        description: 'View sharing is available for Premium users.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}?` + 
        new URLSearchParams({
          tf: view.view_state.timeframe,
          chain: view.view_state.chain,
          search: view.view_state.searchQuery,
          marketTab: view.view_state.activeTab
        }).toString();
      
      await navigator.clipboard.writeText(shareUrl);
      track('saved_view_shared', { viewId: view.id, name: view.name });
      
      toast({
        title: 'Link Copied',
        description: 'Shareable link copied to clipboard.'
      });
    } catch (error) {
      console.error('Failed to share view:', error);
      toast({
        title: 'Share Failed',
        description: 'Failed to copy share link.',
        variant: 'destructive'
      });
    }
  };

  const deleteView = async (viewId: string) => {
    try {
      await supabase
        .from('saved_views')
        .delete()
        .eq('id', viewId);

      toast({
        title: 'View Deleted',
        description: 'Saved view has been deleted.'
      });

      loadSavedViews();
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete view.',
        variant: 'destructive'
      });
    }
  };

  return (
    <>
      <Select onValueChange={onViewSelect}>
        <SelectTrigger className="w-32">
          <Bookmark className="h-4 w-4 mr-1" />
          <SelectValue placeholder="Views" />
        </SelectTrigger>
        <SelectContent>
          {views.map(view => (
            <SelectItem key={view.id} value={view.id}>
              {view.is_default && '⭐ '}{view.name}
            </SelectItem>
          ))}
          <SelectItem value="manage">
            <div className="flex items-center gap-2">
              <Plus className="h-3 w-3" />
              Manage Views
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="h-8"
          >
            <Bookmark className="h-3 w-3 mr-1" />
            Save
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Saved Views</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Save new view */}
            <div className="space-y-2">
              <h4 className="font-medium">Save Current View</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="View name..."
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveCurrentView()}
                />
                <Button 
                  onClick={saveCurrentView}
                  disabled={!newViewName.trim() || loading}
                  size="sm"
                >
                  Save
                </Button>
              </div>
              {userPlan.plan === 'free' && (
                <p className="text-xs text-muted-foreground">
                  Free: {views.length}/2 views used
                </p>
              )}
            </div>

            {/* Existing views */}
            {views.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Saved Views</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {views.map(view => (
                    <div key={view.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {view.is_default && <Star className="h-3 w-3 text-yellow-500" />}
                        <span className="text-sm font-medium">{view.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {!view.is_default && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAsDefault(view.id)}
                            className="h-6 w-6 p-0"
                            title="Set as default"
                          >
                            <Star className="h-3 w-3" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => shareView(view)}
                          className="h-6 w-6 p-0"
                          title="Share view"
                        >
                          <Share className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteView(view.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                          title="Delete view"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}