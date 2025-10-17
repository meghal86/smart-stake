import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function WhaleHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-[300px] overflow-hidden rounded-2xl">
      {/* Volumetric light shafts */}
      <motion.div
        className="absolute top-0 left-[20%] w-32 h-full opacity-20"
        style={{
          background: "linear-gradient(180deg, rgba(28, 169, 255, 0.4) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Whale silhouette */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{
          y: [-10, 10, -10],
          rotateZ: [-2, 2, -2],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="280" height="160" viewBox="0 0 280 160" fill="none">
          <defs>
            <linearGradient id="whaleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.8" />
              <stop offset="50%" stopColor="var(--chart-2)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--chart-3)" stopOpacity="0.4" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M240 80 Q220 50, 170 55 Q120 60, 90 70 Q60 80, 55 95 Q50 110, 65 120 Q80 130, 110 125 Q140 120, 170 115 Q200 110, 230 105 Q250 100, 240 80Z"
            fill="url(#whaleGradient)"
            filter="url(#glow)"
          />
          <path
            d="M240 80 Q260 65, 270 75 Q280 85, 270 95 Q260 105, 240 80Z"
            fill="url(#whaleGradient)"
            filter="url(#glow)"
            opacity="0.8"
          />
          <circle cx="85" cy="90" r="3" fill="white" opacity="0.9" />
        </svg>
      </motion.div>

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-cyan-300/40"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -50, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}