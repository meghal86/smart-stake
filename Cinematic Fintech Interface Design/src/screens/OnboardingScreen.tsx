import { motion } from "motion/react";
import { GlassCard } from "../components/GlassCard";
import { Sparkles, TrendingUp, Shield } from "lucide-react";

interface OnboardingScreenProps {
  onComplete: (persona: string) => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const personas = [
    {
      id: "novice",
      title: "Novice Explorer",
      description: "New to crypto, eager to learn and grow",
      icon: Sparkles,
      color: "#2DD4BF",
    },
    {
      id: "explorer",
      title: "Active Explorer",
      description: "Trading actively, seeking better insights",
      icon: TrendingUp,
      color: "#1CA9FF",
    },
    {
      id: "pro",
      title: "Whale Pro",
      description: "Advanced trader, need sophisticated tools",
      icon: Shield,
      color: "#6B5FFF",
    },
  ];

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.h2
        className="mb-2 text-center"
        style={{ color: "var(--foreground)" }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        Choose Your Path
      </motion.h2>
      <p className="mb-12 text-center" style={{ color: "var(--muted-foreground)" }}>
        We'll customize your experience
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {personas.map((persona, index) => (
          <motion.div
            key={persona.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard
              className="p-8 cursor-pointer hover:scale-105 transition-transform"
              glow
              glowColor={persona.color}
              onClick={() => onComplete(persona.id)}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <motion.div
                  className="p-6 rounded-full"
                  style={{
                    background: `${persona.color}20`,
                    border: `2px solid ${persona.color}40`,
                  }}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <persona.icon className="w-12 h-12" style={{ color: persona.color }} />
                </motion.div>
                <h3 style={{ color: "var(--foreground)" }}>{persona.title}</h3>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {persona.description}
                </p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
