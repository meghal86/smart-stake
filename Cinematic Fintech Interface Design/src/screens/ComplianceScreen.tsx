import { GlassCard } from "../components/GlassCard";
import { Shield, CheckCircle2, AlertCircle, Globe } from "lucide-react";
import { motion } from "motion/react";

export function ComplianceScreen() {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h2 style={{ color: "var(--foreground)" }}>Compliance Monitor</h2>
        <p style={{ color: "var(--muted-foreground)" }}>
          Regional compliance and regulatory tracking
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ background: "rgba(45, 212, 191, 0.15)" }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: "var(--chart-3)" }} />
            </div>
            <h4 style={{ color: "var(--foreground)" }}>Compliant</h4>
          </div>
          <div className="text-3xl mb-1" style={{ color: "var(--chart-3)" }}>8</div>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Active jurisdictions</p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ background: "rgba(255, 197, 92, 0.15)" }}>
              <AlertCircle className="w-5 h-5" style={{ color: "var(--chart-4)" }} />
            </div>
            <h4 style={{ color: "var(--foreground)" }}>Pending</h4>
          </div>
          <div className="text-3xl mb-1" style={{ color: "var(--chart-4)" }}>2</div>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Updates required</p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ background: "rgba(8, 145, 178, 0.15)" }}>
              <Globe className="w-5 h-5" style={{ color: "var(--primary)" }} />
            </div>
            <h4 style={{ color: "var(--foreground)" }}>Regions</h4>
          </div>
          <div className="text-3xl mb-1" style={{ color: "var(--primary)" }}>5</div>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Coverage active</p>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h3 className="mb-4" style={{ color: "var(--foreground)" }}>Jurisdiction Status</h3>
        <div className="space-y-4">
          {[
            { region: "United States", status: "Compliant", regs: ["KYC", "AML", "Tax Reporting"], color: "var(--chart-3)" },
            { region: "European Union", status: "Compliant", regs: ["MiCA", "GDPR"], color: "var(--chart-3)" },
            { region: "United Kingdom", status: "Review Needed", regs: ["FCA Registration"], color: "var(--chart-4)" },
            { region: "Singapore", status: "Compliant", regs: ["MAS License"], color: "var(--chart-3)" },
          ].map((jurisdiction, idx) => (
            <motion.div
              key={idx}
              className="p-4 rounded-xl"
              style={{ background: "var(--input-background)" }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div style={{ color: "var(--foreground)" }}>{jurisdiction.region}</div>
                <span
                  className="px-3 py-1 rounded-full text-sm"
                  style={{ background: `${jurisdiction.color}20`, color: jurisdiction.color }}
                >
                  {jurisdiction.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {jurisdiction.regs.map((reg, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded"
                    style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                  >
                    {reg}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
