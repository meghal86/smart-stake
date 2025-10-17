import { GlassCard } from "../components/GlassCard";
import { FileText, Download, Calendar } from "lucide-react";
import { motion } from "motion/react";

export function ReportScreen() {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h2 style={{ color: "var(--foreground)" }}>Annual Reports</h2>
        <p style={{ color: "var(--muted-foreground)" }}>
          Generate comprehensive tax and performance reports
        </p>
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 style={{ color: "var(--foreground)" }}>Generate New Report</h3>
          <button
            className="px-6 py-3 rounded-lg"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--chart-2))", color: "white" }}
          >
            Generate 2025
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["Tax Summary", "Performance Report", "Transaction History"].map((type, idx) => (
            <motion.div
              key={idx}
              className="p-4 rounded-xl cursor-pointer"
              style={{ background: "var(--input-background)", border: "2px dashed var(--border)" }}
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <FileText className="w-8 h-8 mb-2" style={{ color: "var(--primary)" }} />
              <div style={{ color: "var(--foreground)" }}>{type}</div>
              <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
                Select to include
              </p>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="mb-4" style={{ color: "var(--foreground)" }}>Previous Reports</h3>
        <div className="space-y-3">
          {[
            { year: "2024", type: "Full Annual Report", size: "2.4 MB", date: "Jan 15, 2025" },
            { year: "2023", type: "Full Annual Report", size: "1.8 MB", date: "Jan 12, 2024" },
            { year: "2024 Q4", type: "Quarterly Report", size: "890 KB", date: "Oct 5, 2024" },
          ].map((report, idx) => (
            <motion.div
              key={idx}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: "var(--input-background)" }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: "var(--accent)" }}>
                  <FileText className="w-5 h-5" style={{ color: "var(--primary)" }} />
                </div>
                <div>
                  <div style={{ color: "var(--foreground)" }}>{report.year} - {report.type}</div>
                  <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    {report.size} • {report.date}
                  </div>
                </div>
              </div>
              <button
                className="p-2 rounded-lg transition-all hover:scale-110"
                style={{ background: "var(--accent)", color: "var(--primary)" }}
              >
                <Download className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
