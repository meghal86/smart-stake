import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { GlassCard } from '@/components/guardian/GlassUI';

interface RiskSnapshotCardProps {
  label: string;
  score: number; // 0-10
  icon: LucideIcon;
  color: string;
  isLoading?: boolean;
}

export function RiskSnapshotCard({
  label,
  score,
  icon: Icon,
  color,
  isLoading = false
}: RiskSnapshotCardProps) {
  const healthPercentage = Math.min(score * 10, 100);
  
  const getHealthColor = (percentage: number) => {
    if (percentage >= 70) return '#00C9A7'; // Green
    if (percentage >= 40) return '#FFD166'; // Amber
    return '#EF476F'; // Red
  };

  const healthColor = getHealthColor(healthPercentage);

  if (isLoading) {
    return (
      <GlassCard className="p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-xl bg-white/10 animate-pulse" />
          <div className="h-4 w-16 mx-auto bg-white/10 rounded animate-pulse" />
          <div className="h-6 w-12 mx-auto bg-white/10 rounded animate-pulse" />
          <div className="h-3 w-20 mx-auto bg-white/10 rounded animate-pulse" />
        </div>
      </GlassCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <GlassCard className="p-4 text-center hover:bg-white/10 transition-all duration-300">
        <div className="space-y-3">
          {/* Icon */}
          <div 
            className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center border"
            style={{
              backgroundColor: `${color}20`,
              borderColor: `${color}40`
            }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>

          {/* Label */}
          <h3 className="text-sm font-medium text-white">
            {label}
          </h3>

          {/* Score */}
          <motion.div
            key={score}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-white tabular-nums"
          >
            {score.toFixed(1)}
            <span className="text-sm text-gray-400 font-normal"> / 10</span>
          </motion.div>

          {/* Health Percentage */}
          <div className="space-y-2">
            <div className="text-xs font-medium" style={{ color: healthColor }}>
              {Math.round(healthPercentage)}% health
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: healthColor }}
                initial={{ width: 0 }}
                animate={{ width: `${healthPercentage}%` }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}