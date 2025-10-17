import { GlassCard } from "./GlassCard";
import { motion } from "motion/react";
import { AlertTriangle, ShieldAlert, Info } from "lucide-react";

interface ThreatBubble {
  id: string;
  x: number;
  y: number;
  size: number;
  severity: "low" | "medium" | "high";
  label: string;
}

export function ThreatBubbleMap() {
  const threats: ThreatBubble[] = [
    { id: "1", x: 20, y: 30, size: 60, severity: "low", label: "Unusual Volume" },
    { id: "2", x: 60, y: 50, size: 80, severity: "medium", label: "Rug Pull Risk" },
    { id: "3", x: 75, y: 25, size: 50, severity: "low", label: "Whale Exit" },
    { id: "4", x: 40, y: 70, size: 90, severity: "high", label: "Contract Vuln" },
    { id: "5", x: 85, y: 65, size: 55, severity: "low", label: "Liquidity Low" },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "#F95C39";
      case "medium":
        return "#FFC55C";
      default:
        return "#1CA9FF";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return ShieldAlert;
      case "medium":
        return AlertTriangle;
      default:
        return Info;
    }
  };

  return (
    <GlassCard className="p-6">
      <h3 className="mb-6" style={{ color: "#F0F6FF" }}>
        Guardian Threat Map
      </h3>
      <div className="relative w-full h-80 rounded-lg" style={{ background: "rgba(5, 11, 23, 0.5)" }}>
        {threats.map((threat) => {
          const Icon = getSeverityIcon(threat.severity);
          const color = getSeverityColor(threat.severity);
          
          return (
            <motion.div
              key={threat.id}
              className="absolute"
              style={{
                left: `${threat.x}%`,
                top: `${threat.y}%`,
                width: threat.size,
                height: threat.size,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: Math.random() * 0.5 }}
            >
              <motion.div
                className="relative w-full h-full rounded-full flex items-center justify-center cursor-pointer group"
                style={{
                  background: `radial-gradient(circle, ${color}30, ${color}10)`,
                  border: `2px solid ${color}50`,
                }}
                whileHover={{ scale: 1.1 }}
                animate={{
                  boxShadow: [
                    `0 0 20px ${color}30`,
                    `0 0 30px ${color}50`,
                    `0 0 20px ${color}30`,
                  ],
                }}
                transition={{
                  boxShadow: { duration: 2, repeat: Infinity },
                }}
              >
                <Icon className="w-6 h-6" style={{ color }} />
                <div
                  className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: "rgba(5, 11, 23, 0.95)",
                    border: `1px solid ${color}50`,
                    color: "#F0F6FF",
                  }}
                >
                  {threat.label}
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: "#F95C39" }} />
          <span className="text-xs" style={{ color: "#7F9BBF" }}>High Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: "#FFC55C" }} />
          <span className="text-xs" style={{ color: "#7F9BBF" }}>Medium Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: "#1CA9FF" }} />
          <span className="text-xs" style={{ color: "#7F9BBF" }}>Low Risk</span>
        </div>
      </div>
    </GlassCard>
  );
}
