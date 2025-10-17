import { cn } from "@/lib/utils";

interface EnhancedGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  glowColor?: string;
}

export function EnhancedGlassCard({ 
  children, 
  className, 
  glow = false, 
  glowColor = "#1CA9FF", 
  ...props 
}: EnhancedGlassCardProps) {
  return (
    <div
      className={cn(
        "relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl overflow-hidden",
        "dark:from-slate-900/40 dark:to-slate-800/20 dark:border-slate-700/30",
        className
      )}
      style={{
        boxShadow: glow
          ? `0 0 40px ${glowColor}20, 0 8px 32px rgba(0, 0, 0, 0.4)`
          : "0 8px 32px rgba(0, 0, 0, 0.1)",
      }}
      {...props}
    >
      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
      {children}
    </div>
  );
}