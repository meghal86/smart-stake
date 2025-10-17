import { motion } from "framer-motion";

interface ROIGradientRingProps {
  percentage: number;
  value: string;
  label: string;
  size?: number;
}

export function ROIGradientRing({ percentage, value, label, size = 160 }: ROIGradientRingProps) {
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <defs>
          <linearGradient id="roiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--chart-3)" />
            <stop offset="50%" stopColor="var(--chart-1)" />
            <stop offset="100%" stopColor="var(--chart-2)" />
          </linearGradient>
        </defs>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r="70"
          stroke="rgba(28, 169, 255, 0.1)"
          strokeWidth="12"
          fill="none"
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r="70"
          stroke="url(#roiGradient)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            filter: "drop-shadow(0 0 8px rgba(28, 169, 255, 0.5))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl mb-1" style={{ color: "var(--foreground)" }}>
          {value}
        </div>
        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {label}
        </div>
      </div>
    </div>
  );
}