import { Home, Shield, TrendingUp, Settings } from 'lucide-react';

interface BottomNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function BottomNav({ activeSection, onSectionChange }: BottomNavProps) {
  const navItems = [
    { id: 'portfolio', label: 'Portfolio', icon: Home },
    { id: 'guardian', label: 'Guardian', icon: Shield },
    { id: 'hunter', label: 'Hunter', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-xl border-t border-gray-700/50">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`flex flex-col items-center py-2 px-4 transition-colors ${
                isActive
                  ? 'text-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}