import { GlassCard } from "../components/GlassCard";
import { WhaleHero } from "../components/WhaleHero";
import { TrendingUp, Wallet } from "lucide-react";
import { motion } from "motion/react";

export function PortfolioScreen() {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h2 style={{ color: "var(--foreground)" }}>Portfolio Insights</h2>
        <p style={{ color: "var(--muted-foreground)" }}>
          Multi-chain portfolio aggregation and analysis
        </p>
      </div>

      <WhaleHero />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Value", value: "$2.4M", change: "+12.4%", positive: true },
          { label: "24h Change", value: "+$48.2K", change: "+2.1%", positive: true },
          { label: "Assets", value: "23", change: "+3", positive: true },
          { label: "Chains", value: "5", change: "—", positive: true },
        ].map((stat, idx) => (
          <GlassCard key={idx} className="p-4">
            <p className="text-sm mb-1" style={{ color: "var(--muted-foreground)" }}>{stat.label}</p>
            <div className="text-2xl mb-1" style={{ color: "var(--foreground)" }}>{stat.value}</div>
            <span
              className="text-sm"
              style={{ color: stat.positive ? "var(--chart-3)" : "var(--coral-alert)" }}
            >
              {stat.change}
            </span>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-6">
        <h3 className="mb-4" style={{ color: "var(--foreground)" }}>Asset Breakdown</h3>
        <div className="space-y-4">
          {[
            { asset: "Bitcoin", symbol: "BTC", amount: "12.5", value: "$628K", percentage: 26, chain: "Bitcoin" },
            { asset: "Ethereum", symbol: "ETH", amount: "148.2", value: "$446K", percentage: 19, chain: "Ethereum" },
            { asset: "Solana", symbol: "SOL", amount: "8,450", value: "$832K", percentage: 35, chain: "Solana" },
            { asset: "USDC", symbol: "USDC", amount: "494K", value: "$494K", percentage: 20, chain: "Multi" },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--accent)" }}>
                    <Wallet className="w-5 h-5" style={{ color: "var(--primary)" }} />
                  </div>
                  <div>
                    <div style={{ color: "var(--foreground)" }}>{item.asset}</div>
                    <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {item.amount} {item.symbol}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div style={{ color: "var(--foreground)" }}>{item.value}</div>
                  <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>{item.chain}</div>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "var(--chart-3)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ duration: 1, delay: idx * 0.2 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
