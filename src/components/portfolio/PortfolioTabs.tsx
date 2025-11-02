import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  AlertTriangle, 
  Activity, 
  FileText, 
  MapPin,
  Shield
} from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

interface PortfolioTabsProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'risk', label: 'Risk Analysis', icon: AlertTriangle },
  { id: 'stress', label: 'Stress Test', icon: Activity },
  { id: 'guardian', label: 'Guardian', icon: Shield },
  { id: 'results', label: 'Results', icon: FileText },
  { id: 'addresses', label: 'Addresses', icon: MapPin }
];

export function PortfolioTabs({ activeTab, setActiveTab }: PortfolioTabsProps) {
  return (
    <div className="relative">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 p-1 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {/* Background for active tab */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] rounded-lg"
                  style={{ boxShadow: '0 0 20px rgba(0, 201, 167, 0.4)' }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              {/* Content */}
              <div className="relative flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </div>
              
              {/* Underline animation */}
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-1/2 w-8 h-0.5 bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] rounded-full"
                  style={{ transform: 'translateX(-50%)' }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Mobile Tab Indicator */}
      <div className="sm:hidden mt-2 text-center">
        <span className="text-xs text-gray-400">
          {tabs.find(tab => tab.id === activeTab)?.label}
        </span>
      </div>
    </div>
  );
}