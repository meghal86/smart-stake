import { GlassCard } from "./GlassCard";
import { TrendingUp, Shield, Zap, Wallet } from "lucide-react";

interface KPIMetric {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

export function KPIBar() {
  const metrics: KPIMetric[] = [
    {
      icon: Wallet,
      label: "Portfolio",
      value: "$2.4M",
      change: "+12.4%",
      positive: true,
    },
    {
      icon: TrendingUp,
      label: "24h Profit",
      value: "$48.2K",
      change: "+8.7%",
      positive: true,
    },
    {
      icon: Zap,
      label: "Active Signals",
      value: "127",
      change: "+23",
      positive: true,
    },
    {
      icon: Shield,
      label: "Risk Score",
      value: "Low",
      change: "Safe",
      positive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <GlassCard key={index} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg"
                style={{
                  background: "rgba(28, 169, 255, 0.15)",
                  border: "1px solid rgba(28, 169, 255, 0.3)",
                }}
              >
                <metric.icon className="w-5 h-5" style={{ color: "#1CA9FF" }} />
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: "#7F9BBF" }}>
                  {metric.label}
                </p>
                <div className="text-xl" style={{ color: "#F0F6FF" }}>
                  {metric.value}
                </div>
              </div>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                background: metric.positive ? "rgba(45, 212, 191, 0.15)" : "rgba(249, 92, 57, 0.15)",
                color: metric.positive ? "#2DD4BF" : "#F95C39",
              }}
            >
              {metric.change}
            </span>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
