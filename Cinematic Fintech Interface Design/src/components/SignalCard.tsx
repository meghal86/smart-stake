import { GlassCard } from "./GlassCard";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface SignalCardProps {
  type: "whale-inflow" | "whale-outflow" | "risk";
  asset: string;
  amount: string;
  change: string;
  timestamp: string;
}

export function SignalCard({ type, asset, amount, change, timestamp }: SignalCardProps) {
  const isPositive = type === "whale-inflow";
  const isRisk = type === "risk";

  const color = isRisk ? "#F95C39" : isPositive ? "#2DD4BF" : "#1CA9FF";
  const Icon = isRisk ? AlertCircle : isPositive ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <GlassCard className="p-4" glow={isRisk} glowColor={color}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className="p-2 rounded-lg"
              style={{
                background: `${color}15`,
                border: `1px solid ${color}30`,
              }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 style={{ color: "#F0F6FF" }}>{asset}</h4>
                <span
                  className="px-2 py-0.5 rounded text-xs"
                  style={{
                    background: `${color}20`,
                    color: color,
                  }}
                >
                  {change}
                </span>
              </div>
              <p className="text-sm" style={{ color: "#7F9BBF" }}>
                {amount}
              </p>
            </div>
          </div>
          <span className="text-xs" style={{ color: "#7F9BBF" }}>
            {timestamp}
          </span>
        </div>
      </GlassCard>
    </motion.div>
  );
}
