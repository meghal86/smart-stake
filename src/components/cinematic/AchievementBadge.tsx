import { motion } from "framer-motion";
import { Trophy, Star, Award, Zap } from "lucide-react";
import { useState } from "react";

interface AchievementBadgeProps {
  title: string;
  description: string;
  icon?: "trophy" | "star" | "award" | "zap";
  unlocked?: boolean;
  rarity?: "common" | "rare" | "legendary";
  onClick?: () => void;
}

export function AchievementBadge({ 
  title, 
  description, 
  icon = "trophy",
  unlocked = false,
  rarity = "common",
  onClick 
}: AchievementBadgeProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  
  const icons = {
    trophy: Trophy,
    star: Star,
    award: Award,
    zap: Zap,
  };
  
  const rarityColors = {
    common: "var(--chart-1)",
    rare: "var(--chart-2)",
    legendary: "var(--chart-4)",
  };
  
  const Icon = icons[icon];
  const color = rarityColors[rarity];
  
  const handleClick = () => {
    if (unlocked && onClick) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      onClick();
    }
  };
  
  return (
    <motion.div
      className="relative cursor-pointer"
      whileHover={unlocked ? { scale: 1.05, rotate: [0, -2, 2, 0] } : {}}
      whileTap={unlocked ? { scale: 0.95 } : {}}
      onClick={handleClick}
    >
      <div
        className="relative backdrop-blur-xl rounded-2xl p-4 transition-all"
        style={{
          background: unlocked 
            ? `${color}20` 
            : "rgba(0, 0, 0, 0.1)",
          border: unlocked 
            ? `2px solid ${color}60` 
            : "2px solid var(--border)",
          opacity: unlocked ? 1 : 0.5,
        }}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <motion.div
            className="p-3 rounded-full"
            style={{
              background: unlocked ? `${color}30` : "var(--muted)",
            }}
            animate={unlocked ? {
              boxShadow: [
                `0 0 20px ${color}40`,
                `0 0 30px ${color}60`,
                `0 0 20px ${color}40`,
              ],
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Icon className="w-6 h-6" style={{ color: unlocked ? color : "var(--muted-foreground)" }} />
          </motion.div>
          <h4 className="text-sm" style={{ color: unlocked ? "var(--foreground)" : "var(--muted-foreground)" }}>
            {title}
          </h4>
          <p className="text-xs opacity-70" style={{ color: "var(--muted-foreground)" }}>{description}</p>
        </div>
        
        {rarity === "legendary" && unlocked && (
          <motion.div
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: color }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Star className="w-3 h-3 text-white" fill="white" />
          </motion.div>
        )}
      </div>
      
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: ["var(--chart-4)", "var(--chart-1)", "var(--chart-2)", "var(--chart-3)"][i % 4],
                left: "50%",
                top: "50%",
              }}
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: [0, 1, 0],
                x: (Math.random() - 0.5) * 200,
                y: -100 + (Math.random() - 0.5) * 100,
              }}
              transition={{ duration: 1, delay: i * 0.02 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}