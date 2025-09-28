import { cn } from "@/lib/utils";

interface MetricGaugeProps {
  value: number;
  max?: number;
  label: string;
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export default function MetricGauge({ 
  value, 
  max = 100, 
  label, 
  color = 'blue',
  size = 'md',
  showValue = true,
  className 
}: MetricGaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16', 
    lg: 'w-20 h-20'
  };
  
  const colorClasses = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600'
  };
  
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <svg 
          className="w-full h-full transform -rotate-90" 
          viewBox="0 0 36 36"
        >
          {/* Background circle */}
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${percentage}, 100`}
            className={cn("transition-all duration-500", colorClasses[color])}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-xs font-bold", colorClasses[color])}>
              {Math.round(value)}
            </span>
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground mt-1 text-center">
        {label}
      </span>
    </div>
  );
}
