import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Eye, Shield, TrendingDown, BarChart3, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/portfolio', label: 'Overview' },
  { href: '/portfolio/risk', label: 'Risk Analysis' },
  { href: '/portfolio/guardian', label: 'Guardian' },
  { href: '/portfolio/stress', label: 'Stress Test' },
  { href: '/portfolio/results', label: 'Results' },
  { href: '/portfolio/addresses', label: 'Addresses' },
];

interface PortfolioLayoutProps {
  children: React.ReactNode;
}

export default function PortfolioLayout({ children }: PortfolioLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      {/* Portfolio Sub-Navigation */}
      <div className="border-b border-ocean-800 flex gap-2 px-6 py-3 overflow-x-auto bg-panel-ocean-900">
        {tabs.map(t => (
          <Link
            key={t.href}
            to={t.href}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap",
              location.pathname === t.href 
                ? 'bg-ocean-800 text-white' 
                : 'text-ink-400 hover:text-white'
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-ocean-950">
        {children}
      </div>
    </div>
  );
}