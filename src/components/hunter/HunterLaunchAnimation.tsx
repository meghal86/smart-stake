import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface HunterLaunchAnimationProps {
  onComplete?: () => void;
}

export default function HunterLaunchAnimation({ onComplete }: HunterLaunchAnimationProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Launch confetti after a short delay
    const confettiTimer = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#34d399', '#22d3ee']
      });
    }, 800);

    // Hide animation after 2 seconds
    const hideTimer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 2500);

    return () => {
      clearTimeout(confettiTimer);
      clearTimeout(hideTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-emerald-400/30 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  scale: 0,
                  opacity: 0
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  y: [null, -100]
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 0.5,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>

          {/* Main content */}
          <div className="relative z-10 text-center px-6">
            {/* Icon */}
            <motion.div
              className="mb-6 flex justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                duration: 0.8
              }}
            >
              <div className="flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-2xl shadow-emerald-500/50">
                <motion.span
                  className="text-5xl"
                  animate={{
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 0.5,
                    delay: 0.8
                  }}
                >
                  🎯
                </motion.span>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Hunter
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-lg md:text-xl text-slate-300 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Track, Earn, and Evolve with AlphaWhale
            </motion.p>

            {/* Feature badges */}
            <motion.div
              className="flex flex-wrap items-center justify-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              {['AI-Powered', 'Guardian Verified', 'Gamified'].map((badge, index) => (
                <motion.div
                  key={badge}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-xl"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                >
                  <span className="text-sm font-medium text-slate-400">{badge}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              className="mt-8 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-emerald-400"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Export confetti trigger for achievements
export const triggerConfetti = () => {
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#10b981', '#06b6d4', '#34d399', '#22d3ee', '#fbbf24']
  });
};

export const triggerLevelUpConfetti = () => {
  // Left side
  confetti({
    particleCount: 100,
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 0.6 },
    colors: ['#10b981', '#06b6d4', '#fbbf24']
  });
  
  // Right side
  confetti({
    particleCount: 100,
    angle: 120,
    spread: 55,
    origin: { x: 1, y: 0.6 },
    colors: ['#10b981', '#06b6d4', '#fbbf24']
  });
};




