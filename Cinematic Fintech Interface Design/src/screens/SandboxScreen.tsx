import { GlassCard } from "../components/GlassCard";
import { Play, RotateCcw, TrendingUp } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";

export function SandboxScreen() {
  const [mode, setMode] = useState<"sim" | "real">("sim");
  const [balance, setBalance] = useState(10000);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ color: "var(--foreground)" }}>Sandbox Simulator</h2>
          <p style={{ color: "var(--muted-foreground)" }}>
            Practice trading with simulated funds
          </p>
        </div>
        <div className="flex items-center gap-2 p-1 rounded-lg" style={{ background: "var(--input-background)" }}>
          <button
            onClick={() => setMode("sim")}
            className="px-4 py-2 rounded-lg transition-all"
            style={{
              background: mode === "sim" ? "var(--primary)" : "transparent",
              color: mode === "sim" ? "white" : "var(--foreground)",
            }}
          >
            SIM
          </button>
          <button
            onClick={() => setMode("real")}
            className="px-4 py-2 rounded-lg transition-all"
            style={{
              background: mode === "real" ? "var(--primary)" : "transparent",
              color: mode === "real" ? "white" : "var(--foreground)",
            }}
          >
            REAL
          </button>
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm mb-1" style={{ color: "var(--muted-foreground)" }}>Simulated Balance</p>
            <div className="text-3xl" style={{ color: "var(--foreground)" }}>${balance.toLocaleString()}</div>
          </div>
          <button
            onClick={() => setBalance(10000)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{ background: "var(--accent)", color: "var(--primary)" }}
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { asset: "BTC", price: "$50,234", change: "+2.4%" },
            { asset: "ETH", price: "$3,012", change: "+1.8%" },
            { asset: "SOL", price: "$98.45", change: "-0.5%" },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              className="p-4 rounded-xl"
              style={{ background: "var(--input-background)" }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: "var(--foreground)" }}>{item.asset}</span>
                <span style={{ color: item.change.startsWith("+") ? "var(--chart-3)" : "var(--coral-alert)" }}>
                  {item.change}
                </span>
              </div>
              <div className="text-xl mb-3" style={{ color: "var(--foreground)" }}>{item.price}</div>
              <div className="flex gap-2">
                <button
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--chart-3)", color: "white" }}
                >
                  Buy
                </button>
                <button
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--coral-alert)", color: "white" }}
                >
                  Sell
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="mb-4" style={{ color: "var(--foreground)" }}>Recent Trades</h3>
        <div className="space-y-2">
          {[
            { action: "BUY", asset: "BTC", amount: "0.05", price: "$2,511", time: "2 min ago" },
            { action: "SELL", asset: "ETH", amount: "1.2", price: "$3,614", time: "15 min ago" },
          ].map((trade, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: "var(--input-background)" }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="px-2 py-1 rounded text-xs"
                  style={{
                    background: trade.action === "BUY" ? "var(--chart-3)" : "var(--coral-alert)",
                    color: "white",
                  }}
                >
                  {trade.action}
                </span>
                <div>
                  <div style={{ color: "var(--foreground)" }}>{trade.asset}</div>
                  <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>{trade.amount}</div>
                </div>
              </div>
              <div className="text-right">
                <div style={{ color: "var(--foreground)" }}>{trade.price}</div>
                <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>{trade.time}</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
