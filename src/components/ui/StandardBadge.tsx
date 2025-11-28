import { Badge } from '@/components/ui/badge';
import { TrendingUp, Square, TrendingDown } from 'lucide-react';

interface StandardBadgeProps {
  type: 'impact' | 'provider' | 'quality' | 'confidence';
  value: string | number;
  level?: 'high' | 'medium' | 'low';
  className?: string;
}

export function StandardBadge({ type, value, level, className = '' }: StandardBadgeProps) {
  const getImpactConfig = (level: string) => {
    switch (level) {
      case 'high':
        return { 
          color: 'bg-orange-600 text-white border-orange-700', 
          icon: <TrendingUp className="h-3 w-3" /> 
        };
      case 'medium':
        return { 
          color: 'bg-blue-500 text-white border-blue-600', 
          icon: <Square className="h-3 w-3" /> 
        };
      case 'low':
        return { 
          color: 'bg-gray-500 text-white border-gray-600', 
          icon: <TrendingDown className="h-3 w-3" /> 
        };
      default:
        return { 
          color: 'bg-gray-500 text-white border-gray-600', 
          icon: <Square className="h-3 w-3" /> 
        };
    }
  };

  const renderBadge = () => {
    switch (type) {
      case 'impact': {
        const config = getImpactConfig(level || 'medium');
        return (
          <Badge className={`h-7 px-3 flex items-center gap-1.5 ${config.color} ${className}`}>
            {config.icon}
            <span className="text-xs font-medium">Impact • {value}</span>
          </Badge>
        );
      }
      
      case 'provider':
        return (
          <Badge variant="outline" className={`h-7 px-3 flex items-center gap-1.5 border-green-300 text-green-700 ${className}`}>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs font-medium">Provider • {value}</span>
          </Badge>
        );
      
      case 'quality':
        return (
          <Badge variant="secondary" className={`h-7 px-3 flex items-center gap-1.5 ${className}`}>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs font-medium">Quality • {value}</span>
          </Badge>
        );
      
      case 'confidence':
        return (
          <Badge variant="outline" className={`h-7 px-3 ${className}`}>
            <span className="text-xs font-semibold">{value}%</span>
          </Badge>
        );
      
      default:
        return (
          <Badge className={`h-7 px-3 ${className}`}>
            {value}
          </Badge>
        );
    }
  };

  return renderBadge();
}