import { cn } from "@/lib/utils";

interface GaugeDialProps {
  value: number;
  max: number;
  label: string;
  color?: 'green' | 'red' | 'blue' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function GaugeDial({ 
  value, 
  max, 
  label, 
  color = 'blue', 
  size = 'md',
  className 
}: GaugeDialProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const angle = (percentage / 100) * 180; // Half circle
  
  const sizeClasses = {
    sm: 'w-16 h-8',
    md: 'w-20 h-10', 
    lg: 'w-24 h-12'
  };
  
  const colorClasses = {
    green: 'stroke-green-500',
    red: 'stroke-red-500',
    blue: 'stroke-blue-500',
    yellow: 'stroke-yellow-500'
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <svg 
          viewBox="0 0 100 50" 
          className="w-full h-full"
          aria-label={`${label}: ${value} out of ${max}`}
        >
          {/* Background arc */}
          <path
            d="M 10 40 A 40 40 0 0 1 90 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted-foreground/20"
          />
          {/* Value arc */}
          <path
            d="M 10 40 A 40 40 0 0 1 90 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className={colorClasses[color]}
            strokeDasharray={`${(angle / 180) * 251.2} 251.2`}
            style={{
              strokeDashoffset: 0,
              transform: 'rotate(-90deg)',
              transformOrigin: '50px 50px'
            }}
          />
        </svg>
        {/* Value text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-foreground">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}
