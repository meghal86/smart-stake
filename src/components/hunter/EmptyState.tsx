import { motion } from 'framer-motion';
import { Search, Zap, TrendingUp } from 'lucide-react';

interface EmptyStateProps {
  filter: string;
}

export function EmptyState({ filter }: EmptyStateProps) {
  const getEmptyMessage = () => {
    switch (filter) {
      case 'Staking':
        return {
          title: 'No staking opportunities right now',
          description: 'AI Copilot is scanning for new staking rewards across all chains...',
          icon: TrendingUp
        };
      case 'NFT':
        return {
          title: 'No NFT opportunities available',
          description: 'Monitoring upcoming drops and mint opportunities...',
          icon: Search
        };
      case 'Airdrops':
        return {
          title: 'No airdrops detected',
          description: 'Scanning for new airdrop campaigns and eligibility criteria...',
          icon: Search
        };
      case 'Quests':
        return {
          title: 'No active quests',
          description: 'Looking for new protocol quests and reward programs...',
          icon: Search
        };
      default:
        return {
          title: 'No opportunities right now',
          description: 'AI Copilot is scanning the seas for new opportunities...',
          icon: Search
        };
    }
  };

  const { title, description, icon: Icon } = getEmptyMessage();

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Whale Illustration */}
      <motion.div
        className="relative mb-8"
        animate={{ 
          y: [0, -10, 0],
          rotate: [0, 2, -2, 0]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Whale Body */}
        <motion.div
          className="w-24 h-16 bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] rounded-full relative"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {/* Whale Eye */}
          <div className="absolute top-4 left-6 w-2 h-2 bg-white rounded-full">
            <div className="w-1 h-1 bg-gray-800 rounded-full mt-0.5 ml-0.5"></div>
          </div>
          
          {/* Whale Tail */}
          <motion.div
            className="absolute -right-4 top-2 w-8 h-12 bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] rounded-l-full"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ clipPath: 'polygon(0 20%, 100% 0%, 100% 100%, 0 80%)' }}
          />
        </motion.div>

        {/* Scanning Effect */}
        <motion.div
          className="absolute -inset-4 border-2 border-[#00F5A0]/30 rounded-full"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className="absolute -inset-8 border border-[#7B61FF]/20 rounded-full"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        />
      </motion.div>

      {/* Content */}
      <motion.div
        className="text-center space-y-4 max-w-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-white font-display">
          {title}
        </h3>
        
        <p className="text-gray-400 text-sm leading-relaxed">
          {description}
        </p>

        {/* Scanning Indicator */}
        <motion.div
          className="flex items-center justify-center gap-2 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Zap className="w-4 h-4 text-[#00F5A0]" />
          </motion.div>
          <span className="text-sm text-gray-500">
            AI Copilot scanning...
          </span>
        </motion.div>

        {/* Animated Dots */}
        <div className="flex justify-center gap-1 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-[#00F5A0] rounded-full"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Refresh Suggestion */}
      <motion.button
        className="mt-8 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-gray-300 transition-all duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Pull to refresh or check back soon
      </motion.button>
    </motion.div>
  );
}