import { motion } from "motion/react";
import { GlassCard } from "../components/GlassCard";
import { Globe, TrendingUp, Radio } from "lucide-react";
import { ExplainTooltip } from "../components/ExplainTooltip";

export function PredictivePulseScreen() {
  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ color: "var(--foreground)" }}>Predictive Pulse</h2>
          <p style={{ color: "var(--muted-foreground)" }}>
            Real-time global whale activity visualization
          </p>
        </div>
        <ExplainTooltip title="Predictive Pulse">
          Track whale movements across the globe in real-time with AI-powered predictions
        </ExplainTooltip>
      </div>

      {/* Global Activity Map */}
      <GlassCard className="p-6">
        <div className="relative w-full h-96 rounded-xl overflow-hidden" style={{ background: "var(--input-background)" }}>
          {/* Globe visualization */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Globe className="w-32 h-32 opacity-20" style={{ color: "var(--primary)" }} />
          </div>

          {/* Sonar pings */}
          {[
            { x: "20%", y: "30%", size: "large", color: "var(--chart-3)" },
            { x: "60%", y: "45%", size: "medium", color: "var(--primary)" },
            { x: "75%", y: "65%", size: "small", color: "var(--chart-2)" },
            { x: "40%", y: "70%", size: "medium", color: "var(--chart-3)" },
            { x: "85%", y: "25%", size: "large", color: "var(--chart-4)" },
          ].map((ping, idx) => (
            <motion.div
              key={idx}
              className="absolute rounded-full"
              style={{
                left: ping.x,
                top: ping.y,
                width: ping.size === "large" ? 80 : ping.size === "medium" ? 60 : 40,
                height: ping.size === "large" ? 80 : ping.size === "medium" ? 60 : 40,
              }}
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${ping.color}60, transparent 70%)`,
                  border: `2px solid ${ping.color}`,
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.8, 0.2, 0.8],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  delay: idx * 0.3,
                }}
              />
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center"
                style={{ background: ping.color }}
              >
                <Radio className="w-4 h-4 text-white" />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: "var(--chart-3)" }} />
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Major Inflow</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: "var(--primary)" }} />
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: "var(--chart-4)" }} />
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Risk Alert</span>
          </div>
        </div>
      </GlassCard>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-6">
          <h3 className="mb-4" style={{ color: "var(--foreground)" }}>
            Recent Whale Movements
          </h3>
          <div className="space-y-3">
            {[
              { location: "Singapore", asset: "BTC", amount: "$48M", trend: "up" },
              { location: "New York", asset: "ETH", amount: "$32M", trend: "up" },
              { location: "London", asset: "SOL", amount: "$12M", trend: "down" },
            ].map((activity, idx) => (
              <motion.div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "var(--input-background)" }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div>
                  <div style={{ color: "var(--foreground)" }}>{activity.location}</div>
                  <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>{activity.asset}</div>
                </div>
                <div className="text-right">
                  <div style={{ color: activity.trend === "up" ? "var(--chart-3)" : "var(--destructive)" }}>
                    {activity.amount}
                  </div>
                  <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>2 min ago</div>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="mb-4" style={{ color: "var(--foreground)" }}>
            AI Predictions
          </h3>
          <div className="space-y-4">
            {[
              { prediction: "BTC likely to see major inflow in 2-4 hours", confidence: 87 },
              { prediction: "ETH accumulation phase detected", confidence: 92 },
              { prediction: "Whale exodus from exchange wallets", confidence: 78 },
            ].map((pred, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm flex-1" style={{ color: "var(--foreground)" }}>
                    {pred.prediction}
                  </p>
                  <span className="text-sm px-2 py-0.5 rounded-full" style={{ background: "var(--accent)", color: "var(--primary)" }}>
                    {pred.confidence}%
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, var(--primary), var(--chart-3))" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pred.confidence}%` }}
                    transition={{ duration: 1, delay: idx * 0.2 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
