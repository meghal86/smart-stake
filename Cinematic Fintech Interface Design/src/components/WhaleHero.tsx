import { motion } from "motion/react";
import { useEffect, useState } from "react";

export function WhaleHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-[400px] overflow-hidden">
      {/* Volumetric light shafts */}
      <motion.div
        className="absolute top-0 left-[20%] w-32 h-full opacity-20"
        style={{
          background: "linear-gradient(180deg, rgba(28, 169, 255, 0.4) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
        animate={{
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-0 left-[60%] w-24 h-full opacity-15"
        style={{
          background: "linear-gradient(180deg, rgba(107, 95, 255, 0.3) 0%, transparent 50%)",
          filter: "blur(50px)",
        }}
        animate={{
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Whale silhouette */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{
          y: [-10, 10, -10],
          rotateZ: [-2, 2, -2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg
          width="320"
          height="200"
          viewBox="0 0 320 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="whaleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1CA9FF" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#6B5FFF" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.4" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Whale body */}
          <path
            d="M280 100 Q260 60, 200 70 Q140 80, 100 90 Q60 100, 50 120 Q40 140, 60 150 Q80 160, 120 155 Q160 150, 200 145 Q240 140, 270 130 Q290 120, 280 100Z"
            fill="url(#whaleGradient)"
            filter="url(#glow)"
          />
          {/* Tail */}
          <path
            d="M280 100 Q300 80, 310 90 Q320 100, 310 110 Q300 120, 280 100Z"
            fill="url(#whaleGradient)"
            filter="url(#glow)"
            opacity="0.8"
          />
          {/* Fin */}
          <path
            d="M120 90 Q115 60, 125 75 Q135 90, 120 90Z"
            fill="url(#whaleGradient)"
            filter="url(#glow)"
            opacity="0.7"
          />
          {/* Eye */}
          <circle cx="90" cy="105" r="4" fill="#F0F6FF" opacity="0.9" />
        </svg>
      </motion.div>

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
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
