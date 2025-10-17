import { GlassCard } from "../components/GlassCard";
import { WhaleHero } from "../components/WhaleHero";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { motion } from "motion/react";

export function PatternAnalysisScreen() {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h2 style={{ color: "var(--foreground)" }}>Pattern Analysis</h2>
        <p style={{ color: "var(--muted-foreground)" }}>
          Advanced whale movement pattern detection
        </p>
      </div>

      <WhaleHero />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="mb-4" style={{ color: "var(--foreground)" }}>Detected Patterns</h3>
          <div className="space-y-4">
            {[
              { pattern: "Accumulation Phase", asset: "BTC", confidence: 92, trend: "up" },
              { pattern: "Distribution Starting", asset: "ETH", confidence: 78, trend: "down" },
              { pattern: "Whale Coordination", asset: "SOL", confidence: 85, trend: "up" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className="p-4 rounded-xl"
                style={{ background: "var(--input-background)" }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.trend === "up" ? (
                      <TrendingUp className="w-4 h-4" style={{ color: "var(--chart-3)" }} />
                    ) : (
                      <TrendingDown className="w-4 h-4" style={{ color: "var(--coral-alert)" }} />
                    )}
                    <span style={{ color: "var(--foreground)" }}>{item.pattern}</span>
                  </div>
                  <span className="text-sm px-2 py-1 rounded" style={{ background: "var(--accent)", color: "var(--primary)" }}>
                    {item.confidence}%
                  </span>
                </div>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{item.asset}</p>
                <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: item.trend === "up" ? "var(--chart-3)" : "var(--coral-alert)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.confidence}%` }}
                    transition={{ duration: 1, delay: idx * 0.2 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="mb-4" style={{ color: "var(--foreground)" }}>Historical Accuracy</h3>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-5xl mb-4" style={{ color: "var(--chart-3)" }}>87%</div>
            <p style={{ color: "var(--muted-foreground)" }}>Pattern prediction accuracy</p>
            <div className="mt-6 w-full space-y-2">
              {[
                { label: "Last 7 days", value: 92 },
                { label: "Last 30 days", value: 87 },
                { label: "Last 90 days", value: 84 },
              ].map((stat, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{stat.label}</span>
                  <span style={{ color: "var(--foreground)" }}>{stat.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
