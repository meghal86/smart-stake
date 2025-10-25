import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, TrendingUp, Users, Clock, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Quest } from '@/types/hunter';

interface HunterAIExplainabilityProps {
  quest: Quest | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function HunterAIExplainability({
  quest,
  isOpen,
  onClose
}: HunterAIExplainabilityProps) {
  if (!quest) return null;

  const getRiskFactors = (score: number) => {
    if (score >= 90) {
      return [
        { icon: CheckCircle2, color: 'text-emerald-400', text: 'Contract audited by reputable security firm', positive: true },
        { icon: CheckCircle2, color: 'text-emerald-400', text: 'Protocol active for 12+ months with no incidents', positive: true },
        { icon: CheckCircle2, color: 'text-emerald-400', text: 'High TVL ($10M+) indicating strong community trust', positive: true },
        { icon: CheckCircle2, color: 'text-emerald-400', text: 'Team doxxed with verified credentials', positive: true }
      ];
    } else if (score >= 70) {
      return [
        { icon: CheckCircle2, color: 'text-emerald-400', text: 'Basic security audit completed', positive: true },
        { icon: CheckCircle2, color: 'text-emerald-400', text: 'Active development with regular updates', positive: true },
        { icon: AlertTriangle, color: 'text-amber-400', text: 'Protocol relatively new (< 6 months)', positive: false },
        { icon: AlertTriangle, color: 'text-amber-400', text: 'Moderate TVL - proceed with caution', positive: false }
      ];
    } else {
      return [
        { icon: AlertTriangle, color: 'text-red-400', text: 'No security audit found', positive: false },
        { icon: AlertTriangle, color: 'text-red-400', text: 'New protocol with limited track record', positive: false },
        { icon: AlertTriangle, color: 'text-red-400', text: 'Low liquidity - high risk', positive: false },
        { icon: CheckCircle2, color: 'text-emerald-400', text: 'Code is open source', positive: true }
      ];
    }
  };

  const getRecommendation = (score: number) => {
    if (score >= 90) {
      return {
        title: 'Highly Recommended',
        description: 'This opportunity has passed our rigorous safety checks. Guardian AI identifies it as a low-risk, high-potential opportunity.',
        color: 'text-emerald-400'
      };
    } else if (score >= 70) {
      return {
        title: 'Moderate Confidence',
        description: 'This opportunity shows promise but has some risk factors. Consider starting with a smaller allocation to test the waters.',
        color: 'text-amber-400'
      };
    } else {
      return {
        title: 'High Caution Required',
        description: 'This opportunity has multiple risk factors. Only proceed if you understand the risks and can afford potential losses.',
        color: 'text-red-400'
      };
    }
  };

  const riskFactors = getRiskFactors(quest.guardianScore);
  const recommendation = getRecommendation(quest.guardianScore);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-2xl p-0 overflow-hidden",
          "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl",
          "border border-white/10 dark:border-slate-800/50",
          "shadow-2xl"
        )}
      >
        {/* Animated background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 pointer-events-none"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="p-6 border-b border-slate-800/50">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30"
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </motion.div>
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-100">
                    AI Risk Analysis
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-400">
                    {quest.protocol} • {quest.category}
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-lg hover:bg-slate-800/50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Guardian Score */}
            <motion.div
              className="mb-6 p-4 rounded-xl bg-slate-950/40 border border-slate-700/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Guardian Trust Score</span>
                </div>
                <motion.div
                  className={cn(
                    "text-3xl font-bold",
                    quest.guardianScore >= 90 ? "text-emerald-400" :
                    quest.guardianScore >= 70 ? "text-amber-400" :
                    "text-red-400"
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                >
                  {quest.guardianScore}%
                </motion.div>
              </div>
              <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    quest.guardianScore >= 90 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
                    quest.guardianScore >= 70 ? "bg-gradient-to-r from-amber-500 to-amber-400" :
                    "bg-gradient-to-r from-red-500 to-red-400"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${quest.guardianScore}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                />
              </div>
            </motion.div>

            {/* Recommendation */}
            <motion.div
              className="mb-6 p-4 rounded-xl bg-gradient-to-br from-slate-950/60 to-slate-900/60 border border-slate-700/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className={cn("text-lg font-bold mb-2", recommendation.color)}>
                {recommendation.title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {recommendation.description}
              </p>
            </motion.div>

            {/* Risk Factors */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Risk Assessment Factors
              </h3>
              <div className="space-y-3">
                {riskFactors.map((factor, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/40 border border-slate-700/50"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <factor.icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", factor.color)} />
                    <span className="text-sm text-slate-300">{factor.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Additional Metrics */}
            <motion.div
              className="grid grid-cols-2 gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-400">Potential Return</span>
                </div>
                <div className="text-lg font-bold text-slate-100">
                  ${quest.rewardUSD.toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400">Time Required</span>
                </div>
                <div className="text-lg font-bold text-slate-100">
                  {quest.estimatedTime}
                </div>
              </div>
            </motion.div>

            {/* Ask Copilot More */}
            <motion.div
              className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <p className="text-sm text-slate-300 mb-3">
                Want to know more? Ask our AI Copilot for personalized insights.
              </p>
              <Button
                variant="outline"
                className="w-full bg-slate-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                <Bot className="w-4 h-4 mr-2" />
                Ask Copilot
              </Button>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800/50 bg-slate-950/40">
            <p className="text-xs text-slate-500 text-center">
              Analysis powered by Guardian AI • Updated in real-time
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Import Bot from lucide-react at the top
import { Bot } from 'lucide-react';

