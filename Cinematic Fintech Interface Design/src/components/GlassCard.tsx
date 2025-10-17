import { cn } from "./ui/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  glowColor?: string;
}

export function GlassCard({ children, className, glow = false, glowColor = "#1CA9FF", ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl overflow-hidden",
        className
      )}
      style={{
        boxShadow: glow
          ? `0 0 40px ${glowColor}20, 0 8px 32px rgba(0, 0, 0, 0.4)`
          : "0 8px 32px rgba(0, 0, 0, 0.4)",
      }}
      {...props}
    >
      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
      {children}
    </div>
  );
}
