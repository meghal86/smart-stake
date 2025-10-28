import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Shield, 
  Clock, 
  Zap, 
  ChevronRight,
  Star,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Brain,
  Timer
} from 'lucide-react';

interface Opportunity {
  id: string;
  type: 'Airdrop' | 'Staking' | 'NFT' | 'Quest';
  title: string;
  description: string;
  reward: string;
  confidence: number;
  duration: string;
  guardianScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  chain?: string;
  protocol?: string;
  estimatedAPY?: number;
}

interface OpportunityCardProps {
  opportunity: Opportunity;
  index: number;
  onJoinQuest: (opportunity: Opportunity) => void;
  isDarkTheme?: boolean;
}

const typeIcons = {
  Airdrop: TrendingUp,
  Staking: Shield,
  NFT: Star,
  Quest: Zap
};

const typeColors = {
  Airdrop: 'bg-emerald-500',
  Staking: 'bg-blue-500', 
  NFT: 'bg-purple-500',
  Quest: 'bg-orange-500'
};

const riskColors = {
  Low: 'text-emerald-400 bg-emerald-400/10',
  Medium: 'text-yellow-400 bg-yellow-400/10',
  High: 'text-red-400 bg-red-400/10'
};

const riskIcons = {
  Low: CheckCircle,
  Medium: AlertTriangle,
  High: AlertTriangle
};

export function OpportunityCard({ opportunity, index, onJoinQuest, isDarkTheme = true }: OpportunityCardProps) {
  const TypeIcon = typeIcons[opportunity.type];
  const RiskIcon = riskIcons[opportunity.riskLevel];
  
  return (
    <motion.div
      className={`backdrop-blur-xl rounded-2xl p-6 cursor-pointer group transition-all duration-200 border relative ${
        isDarkTheme 
          ? 'hover:bg-white/8 border-white/10' 
          : 'hover:bg-gray-50/80 border-gray-200/50'
      }`}
      style={{ 
        background: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)',
        boxShadow: isDarkTheme 
          ? '0 4px 20px rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.1)'
          : '0 4px 20px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9)'
      }}
      initial={{ 
        opacity: 0, 
        y: 20,
        boxShadow: '0 0 0px rgba(0, 245, 160, 0)'
      }}
      animate={{ 
        opacity: 1, 
        y: 0,
        boxShadow: [
          '0 0 20px rgba(0, 245, 160, 0.3)',
          '0 4px 24px rgba(0,0,0,0.4)',
          '0 4px 24px rgba(0,0,0,0.4)'
        ]
      }}
      transition={{ 
        delay: index * 0.1,
        boxShadow: { duration: 2, times: [0, 0.3, 1] }
      }}
      whileHover={{ 
        scale: 1.01, 
        y: -2,
        boxShadow: '0 8px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,245,160,0.3)'
      }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex flex-col space-y-4">
        {/* Content */}
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {/* Header with Icon & Badges */}
              <div className="flex items-start gap-4 mb-4">
                <motion.div
                  className={`p-3 rounded-xl ${typeColors[opportunity.type]} shadow-lg`}
                  whileHover={{ scale: 1.05 }}
                >
                  <TypeIcon className="w-6 h-6 text-white" />
                </motion.div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${typeColors[opportunity.type]} text-white`}>
                      {opportunity.type.toUpperCase()}
                    </span>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${riskColors[opportunity.riskLevel]}`}>
                      <RiskIcon className="w-3 h-3" />
                      {opportunity.riskLevel.toUpperCase()} RISK
                    </div>
                  </div>
                  
                  <h3 className={`text-xl font-bold font-display leading-tight mb-1 transition-colors duration-300 ${
                    isDarkTheme ? 'text-[#E4E8F3]' : 'text-[#1B1F29]'
                  }`}>
                    {opportunity.title}
                  </h3>
                  
                  {opportunity.protocol && (
                    <p className={`text-sm transition-colors duration-300 ${
                      isDarkTheme ? 'text-gray-400' : 'text-[#7C8896]'
                    }`}>
                      {opportunity.protocol} {opportunity.chain && `• ${opportunity.chain}`}
                    </p>
                  )}
                </div>
              </div>
              
              <p className={`text-sm line-clamp-2 mb-6 leading-relaxed transition-colors duration-300 ${
                isDarkTheme ? 'text-gray-300' : 'text-[#444C56]'
              }`}>
                {opportunity.description.replace(/on \w+\s*[•·]\s*\w+/gi, '').trim()}
              </p>
              
              {/* Divider */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6"></div>
            </div>
          </div>

          {/* Clean Metrics Grid */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#00F5A0]" />
              <span className="font-semibold text-[#00F5A0]">{opportunity.reward}</span>
              <span className={`transition-colors duration-300 ${
                isDarkTheme ? 'text-gray-500' : 'text-[#7C8896]'
              }`}>APY</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-400" />
              <span className={`font-semibold transition-colors duration-300 ${
                isDarkTheme ? 'text-white' : 'text-[#1B1F29]'
              }`}>{opportunity.confidence}%</span>
              <span className={`transition-colors duration-300 ${
                isDarkTheme ? 'text-gray-500' : 'text-[#7C8896]'
              }`}>Confidence</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-blue-400">{opportunity.guardianScore}/10</span>
              <span className={`transition-colors duration-300 ${
                isDarkTheme ? 'text-gray-500' : 'text-[#7C8896]'
              }`}>Guardian</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-gray-400" />
              <span className={`font-semibold transition-colors duration-300 ${
                isDarkTheme ? 'text-white' : 'text-[#1B1F29]'
              }`}>{opportunity.duration}</span>
              <span className={`transition-colors duration-300 ${
                isDarkTheme ? 'text-gray-500' : 'text-[#7C8896]'
              }`}>Duration</span>
            </div>
          </div>
          
          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/15 to-transparent my-5"></div>
        </div>

        {/* Divider above CTA */}
        <div className="border-t border-white/8 pt-4"></div>

        {/* CTA Button */}
        <motion.button
          onClick={() => onJoinQuest(opportunity)}
          className="w-full py-4 bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
          whileHover={{ 
            scale: 1.02, 
            y: -1,
            boxShadow: '0 8px 25px rgba(0,245,160,0.3)'
          }}
          whileTap={{ scale: 0.98 }}
        >
          <span>Join Quest</span>
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.div>
        </motion.button>
      </div>
    </motion.div>
  );
}