import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";

interface NavPillProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function NavPill({ icon: Icon, label, active = false, onClick }: NavPillProps) {
  return (
    <motion.button
      onClick={onClick}
      className="relative px-6 py-3 rounded-full flex items-center gap-3 transition-all"
      style={{
        background: active
          ? "linear-gradient(135deg, rgba(28, 169, 255, 0.2), rgba(107, 95, 255, 0.15))"
          : "rgba(255, 255, 255, 0.03)",
        border: active ? "1px solid rgba(28, 169, 255, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
        color: active ? "#1CA9FF" : "#7F9BBF",
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
      {active && (
        <motion.div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent, #1CA9FF, transparent)",
            boxShadow: "0 0 8px rgba(28, 169, 255, 0.6)",
          }}
          layoutId="activeNav"
        />
      )}
    </motion.button>
  );
}
