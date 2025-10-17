import { GlassCard } from "../components/GlassCard";
import { Copy, Share2, CheckCircle2, Gift } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";

export function ReferralScreen() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h2 style={{ color: "var(--foreground)" }}>Referral & Rewards</h2>
        <p style={{ color: "var(--muted-foreground)" }}>
          Invite friends and earn rewards together
        </p>
      </div>

      <GlassCard className="p-8" glow glowColor="var(--chart-4)">
        <div className="text-center mb-6">
          <div className="inline-flex p-4 rounded-full mb-4" style={{ background: "var(--accent)" }}>
            <Gift className="w-8 h-8" style={{ color: "var(--chart-4)" }} />
          </div>
          <h3 className="mb-2" style={{ color: "var(--foreground)" }}>Earn 10% Commission</h3>
          <p style={{ color: "var(--muted-foreground)" }}>
            For every friend who subscribes in their first year
          </p>
        </div>

        <div className="flex items-center gap-2 p-4 rounded-xl mb-4" style={{ background: "var(--input-background)" }}>
          <code className="flex-1 text-sm" style={{ color: "var(--foreground)" }}>
            https://alphawhale.io/ref/WHALE2025
          </code>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg transition-all"
            style={{
              background: copied ? "var(--chart-3)" : "var(--accent)",
              color: copied ? "white" : "var(--primary)",
            }}
          >
            {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            className="px-4 py-3 rounded-lg flex items-center justify-center gap-2"
            style={{ background: "var(--primary)", color: "white" }}
          >
            <Share2 className="w-4 h-4" />
            Share Link
          </button>
          <button
            className="px-4 py-3 rounded-lg"
            style={{ background: "var(--accent)", color: "var(--primary)" }}
          >
            View Details
          </button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-6 text-center">
          <div className="text-3xl mb-2" style={{ color: "var(--chart-3)" }}>12</div>
          <p style={{ color: "var(--muted-foreground)" }}>Referrals</p>
        </GlassCard>
        <GlassCard className="p-6 text-center">
          <div className="text-3xl mb-2" style={{ color: "var(--chart-4)" }}>$480</div>
          <p style={{ color: "var(--muted-foreground)" }}>Total Earned</p>
        </GlassCard>
        <GlassCard className="p-6 text-center">
          <div className="text-3xl mb-2" style={{ color: "var(--primary)" }}>8</div>
          <p style={{ color: "var(--muted-foreground)" }}>Active Subs</p>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h3 className="mb-4" style={{ color: "var(--foreground)" }}>Recent Referrals</h3>
        <div className="space-y-3">
          {[
            { name: "Alex M.", status: "Active", earned: "$40", date: "Oct 10" },
            { name: "Sarah K.", status: "Active", earned: "$40", date: "Oct 8" },
            { name: "Mike R.", status: "Pending", earned: "$0", date: "Oct 15" },
          ].map((ref, idx) => (
            <motion.div
              key={idx}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: "var(--input-background)" }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div>
                <div style={{ color: "var(--foreground)" }}>{ref.name}</div>
                <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>{ref.date}</div>
              </div>
              <div className="text-right">
                <div style={{ color: ref.status === "Active" ? "var(--chart-3)" : "var(--muted-foreground)" }}>
                  {ref.status}
                </div>
                <div className="text-sm" style={{ color: "var(--foreground)" }}>{ref.earned}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
