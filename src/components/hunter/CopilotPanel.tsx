import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface CopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CopilotPanel({ isOpen, onClose }: CopilotPanelProps) {
  const insights = [
    {
      icon: TrendingUp,
      text: "3 new high-confidence staking yields detected today",
      type: "positive" as const
    },
    {
      icon: CheckCircle,
      text: "ETH staking remains top 2% APY vs DeFi average",
      type: "positive" as const
    },
    {
      icon: AlertTriangle,
      text: "1 risk event flagged (LayerZero bridge volatility ↑12%)",
      type: "warning" as const
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-xl border-t border-white/20 rounded-t-3xl p-6 max-w-2xl mx-auto shadow-2xl shadow-black/40"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.08) 100%)',
              boxShadow: '0 0 40px rgba(0, 245, 160, 0.1), 0 0 80px rgba(123, 97, 255, 0.05)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] rounded-xl relative"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(0, 245, 160, 0.4)',
                      '0 0 30px rgba(123, 97, 255, 0.6)',
                      '0 0 20px rgba(0, 245, 160, 0.4)'
                    ]
                  }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  <span className="text-lg">🤖</span>
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold text-[#E4E8F3] font-display">
                    AI Copilot Digest
                  </h3>
                  <motion.p
                    className="text-xs text-[#00F5A0] mt-1"
                    animate={{ opacity: [0, 1, 1, 0] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 8, 
                      times: [0, 0.1, 0.9, 1],
                      repeatDelay: 12 
                    }}
                  >
                    ✨ Analyzing market patterns...
                  </motion.p>
                </div>
              </div>
              
              <motion.button
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5 text-gray-300" />
              </motion.button>
            </div>

            {/* Insights */}
            <div className="space-y-4 mb-6">
              {insights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <motion.div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={`p-2 rounded-lg ${
                      insight.type === 'positive' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {insight.text}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            {/* CTA */}
            <motion.button
              className="w-full py-3 bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] text-white font-semibold rounded-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View Detailed Analysis →
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}