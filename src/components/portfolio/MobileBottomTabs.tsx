import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Shield, TrendingDown, FileText, MapPin, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'overview', label: 'Overview', icon: Eye, path: '/portfolio' },
  { id: 'risk', label: 'Risk / Trust', icon: Shield, path: '/portfolio/risk' },
  { id: 'stress', label: 'Stress', icon: TrendingDown, path: '/portfolio/stress' },
  { id: 'results', label: 'Results', icon: BarChart3, path: '/portfolio/results' },
  { id: 'addresses', label: 'Addresses', icon: MapPin, path: '/portfolio/addresses' }
];

export default function MobileBottomTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex-1 flex flex-col items-center py-2 px-1 text-xs transition-colors",
                isActive 
                  ? "text-primary bg-primary/5" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}