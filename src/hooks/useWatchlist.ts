import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';

interface WatchlistItem {
  id: string;
  address: string;
  label: string;
  riskScore: number;
  lastActivity: Date;
  totalValue: number;
  alertsEnabled: boolean;
  tags: string[];
  notes?: string;
  addedAt: Date;
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load watchlist from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('whaleplus_watchlist');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWatchlist(parsed.map((item: unknown) => ({
          ...item,
          lastActivity: new Date(item.lastActivity),
          addedAt: new Date(item.addedAt)
        })));
      } catch (error) {
        console.error('Failed to load watchlist:', error);
      }
    }
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('whaleplus_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const addToWatchlist = useCallback(async (
    address: string, 
    label: string, 
    options: Partial<Pick<WatchlistItem, 'tags' | 'notes' | 'alertsEnabled'>> = {}
  ) => {
    setLoading(true);
    
    try {
      // Check if already in watchlist
      if (watchlist.some(item => item.address.toLowerCase() === address.toLowerCase())) {
        toast({
          title: "Already in Watchlist",
          description: "This wallet is already being monitored",
          variant: "destructive"
        });
        return false;
      }

      // Simulate fetching wallet data
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newItem: WatchlistItem = {
        id: `watchlist_${Date.now()}`,
        address,
        label,
        riskScore: Math.floor(Math.random() * 10) + 1,
        lastActivity: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        totalValue: Math.floor(Math.random() * 1000000) + 10000,
        alertsEnabled: options.alertsEnabled ?? true,
        tags: options.tags ?? [],
        notes: options.notes,
        addedAt: new Date()
      };

      setWatchlist(prev => [newItem, ...prev]);
      
      toast({
        title: "Added to Watchlist",
        description: `${label} is now being monitored`,
        variant: "success"
      });

      return true;
    } catch (error) {
      toast({
        title: "Failed to Add",
        description: "Could not add wallet to watchlist",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [watchlist, toast]);

  const removeFromWatchlist = useCallback((id: string) => {
    setWatchlist(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Removed from Watchlist",
      description: "Wallet is no longer being monitored",
      variant: "success"
    });
  }, [toast]);

  const updateWatchlistItem = useCallback((id: string, updates: Partial<WatchlistItem>) => {
    setWatchlist(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, ...updates }
          : item
      )
    );
  }, []);

  const toggleAlerts = useCallback((id: string) => {
    setWatchlist(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, alertsEnabled: !item.alertsEnabled }
          : item
      )
    );
  }, []);

  const isInWatchlist = useCallback((address: string) => {
    return watchlist.some(item => 
      item.address.toLowerCase() === address.toLowerCase()
    );
  }, [watchlist]);

  const getWatchlistItem = useCallback((address: string) => {
    return watchlist.find(item => 
      item.address.toLowerCase() === address.toLowerCase()
    );
  }, [watchlist]);

  const searchWatchlist = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return watchlist.filter(item => 
      item.label.toLowerCase().includes(lowercaseQuery) ||
      item.address.toLowerCase().includes(lowercaseQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }, [watchlist]);

  return {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    updateWatchlistItem,
    toggleAlerts,
    isInWatchlist,
    getWatchlistItem,
    searchWatchlist,
    totalItems: watchlist.length,
    activeAlerts: watchlist.filter(item => item.alertsEnabled).length
  };
}