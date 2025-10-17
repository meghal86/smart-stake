import { motion } from "motion/react";
import { Waves } from "lucide-react";

interface SplashScreenProps {
  onContinue: () => void;
}

export function SplashScreen({ onContinue }: SplashScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Animated whale rising */}
      <motion.div
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <svg
          width="200"
          height="120"
          viewBox="0 0 200 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="splashWhaleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.8" />
              <stop offset="50%" stopColor="var(--chart-2)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--chart-3)" stopOpacity="0.4" />
            </linearGradient>
            <filter id="splashGlow">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <motion.path
            d="M170 60 Q150 30, 120 35 Q90 40, 70 45 Q50 50, 45 65 Q40 80, 55 85 Q70 90, 100 87 Q130 84, 160 77 Q180 70, 170 60Z"
            fill="url(#splashWhaleGradient)"
            filter="url(#splashGlow)"
            animate={{
              d: [
                "M170 60 Q150 30, 120 35 Q90 40, 70 45 Q50 50, 45 65 Q40 80, 55 85 Q70 90, 100 87 Q130 84, 160 77 Q180 70, 170 60Z",
                "M170 58 Q150 28, 120 33 Q90 38, 70 43 Q50 48, 45 63 Q40 78, 55 83 Q70 88, 100 85 Q130 82, 160 75 Q180 68, 170 58Z",
                "M170 60 Q150 30, 120 35 Q90 40, 70 45 Q50 50, 45 65 Q40 80, 55 85 Q70 90, 100 87 Q130 84, 160 77 Q180 70, 170 60Z",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <circle cx="65" cy="55" r="3" fill="white" opacity="0.9" />
        </svg>
      </motion.div>

      {/* Title */}
      <motion.h1
        className="mt-8 mb-2 text-center"
        style={{ color: "var(--foreground)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        AlphaWhale Odyssey
      </motion.h1>
      
      <motion.p
        className="mb-8 text-center px-4"
        style={{ color: "var(--muted-foreground)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        Legendary Deep Blue Edition v5.6
      </motion.p>

      {/* Dive In Button */}
      <motion.button
        onClick={onContinue}
        className="px-8 py-4 rounded-full flex items-center gap-2 shadow-2xl"
        style={{
          background: "linear-gradient(135deg, var(--primary), var(--chart-2))",
          color: "white",
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Waves className="w-5 h-5" />
        Dive In
      </motion.button>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full opacity-40"
            style={{
              background: "var(--primary)",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
