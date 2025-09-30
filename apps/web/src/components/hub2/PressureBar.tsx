import { cn } from "@/lib/utils";

interface PressureBarProps {
  value: number; // -100 to +100
  label?: string;
  className?: string;
}

export default function PressureBar({ value, label = "Whale Pressure", className }: PressureBarProps) {
  const clampedValue = Math.max(-100, Math.min(100, value));
  const percentage = Math.abs(clampedValue);
  const isPositive = clampedValue >= 0;
  
  return (
    <div className={cn("flex flex-col space-y-1", className)}>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={cn(
          "font-medium",
          isPositive ? "text-green-600" : "text-red-600"
        )}>
          {isPositive ? '+' : ''}{clampedValue.toFixed(0)}
        </span>
      </div>
      
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-20" />
        
        {/* Value bar */}
        <div 
          className={cn(
            "absolute top-0 h-full transition-all duration-300",
            isPositive 
              ? "bg-gradient-to-r from-yellow-500 to-green-500" 
              : "bg-gradient-to-r from-red-500 to-yellow-500"
          )}
          style={{
            width: `${percentage}%`,
            left: isPositive ? '50%' : `${50 - percentage}%`,
            transform: isPositive ? 'translateX(0)' : 'translateX(0)'
          }}
        />
        
        {/* Center line */}
        <div className="absolute left-1/2 top-0 w-px h-full bg-foreground/20 transform -translate-x-1/2" />
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Outflow</span>
        <span>Inflow</span>
      </div>
    </div>
  );
}
