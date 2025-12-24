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
      className={`backdrop-blur-lg rounded-[20px] p-8 cursor-pointer group transition-all duration-700 border relative transform-gpu ${
        isDarkTheme
          ? 'bg-gradient-to-br from-slate-900/80 via-blue-950/60 to-slate-900/80 border-teal-400/20'
          : 'bg-white/90 border-gray-200/50'
      }`}
      style={{ 
        boxShadow: isDarkTheme
          ? '0 20px 60px -12px rgba(0,0,0,0.6), 0 8px 32px -8px rgba(20,184,166,0.1), 0 2px 0 0 rgba(255,255,255,0.08) inset, 0 -2px 0 0 rgba(20,184,166,0.1) inset'
          : '0 4px 12px rgba(0,0,0,0.05)'
      }}
      initial={{ 
        opacity: 0, 
        y: 20
      }}
      animate={{ 
        opacity: 1, 
        y: 0
      }}
      transition={{ 
        delay: index * 0.05,
        duration: 0.6,
        ease: [0.25, 1, 0.5, 1]
      }}
      whileHover={{ 
        scale: 1.01, 
        y: isDarkTheme ? -2 : -4,
        boxShadow: isDarkTheme
          ? '0 25px 70px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(20,184,166,0.3)'
          : '0 8px 24px rgba(0,0,0,0.06)'
      }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Elegant Hover Overlay */}
      {isDarkTheme ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-teal-400/0 via-blue-500/0 to-teal-600/0 group-hover:from-teal-400/8 group-hover:via-blue-500/6 group-hover:to-teal-600/8 transition-all duration-700 rounded-[20px]" />
          <motion.div 
            className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent rounded-[20px] pointer-events-none"
            whileHover={{ scale: 1.02, rotateX: 2 }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#FBBF24]/0 via-[#14B8A6]/0 to-[#FBBF24]/0 group-hover:from-[#FBBF24]/5 group-hover:via-[#14B8A6]/3 group-hover:to-[#FBBF24]/5 transition-all duration-700 rounded-[20px]" />
      )}

      <div className="flex flex-col space-y-4 relative z-10">
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
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      isDarkTheme 
                        ? `${typeColors[opportunity.type]} text-white`
                        : 'bg-[#14B8A6]/10 text-[#14B8A6]'
                    }`}>
                      {opportunity.type.toUpperCase()}
                    </span>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      isDarkTheme 
                        ? riskColors[opportunity.riskLevel]
                        : opportunity.riskLevel === 'Low' 
                          ? 'text-emerald-600 bg-emerald-50'
                          : opportunity.riskLevel === 'Medium'
                            ? 'text-amber-600 bg-amber-50'
                            : 'text-red-600 bg-red-50'
                    }`}>
                      <RiskIcon className="w-3 h-3" />
                      {opportunity.riskLevel.toUpperCase()} RISK
                    </div>
                  </div>
                  
                  <h3 className={`text-xl font-bold font-display leading-tight mb-1 ${
                    isDarkTheme ? 'text-[#E4E8F3]' : 'text-[#0F172A]'
                  }`}>
                    {opportunity.title}
                  </h3>
                  
                  {opportunity.protocol && (
                    <p className={`text-sm ${
                      isDarkTheme ? 'text-gray-400' : 'text-[#475569]'
                    }`}>
                      {opportunity.protocol} {opportunity.chain && `• ${opportunity.chain}`}
                    </p>
                  )}
                </div>
              </div>
              
              <p className={`text-sm line-clamp-2 mb-6 leading-relaxed ${
                isDarkTheme ? 'text-gray-300' : 'text-[#475569]'
              }`}>
                {opportunity.description.replace(/on \w+\s*[•·]\s*\w+/gi, '').trim()}
              </p>
              
              {/* Divider */}
              <div className={`w-full h-px bg-gradient-to-r from-transparent to-transparent mb-6 ${
                isDarkTheme ? 'via-white/20' : 'via-gray-200'
              }`}></div>
            </div>
          </div>

          {/* Clean Metrics Grid */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className={`w-4 h-4 ${
                isDarkTheme ? 'text-[#00F5A0]' : 'text-[#FBBF24]'
              }`} />
              <span className={`font-bold ${
                isDarkTheme ? 'text-[#00F5A0]' : 'text-[#FBBF24]'
              }`}>{opportunity.reward}</span>
              <span className={isDarkTheme ? 'text-gray-500' : 'text-[#475569]'}>APY</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className={`w-4 h-4 ${
                isDarkTheme ? 'text-blue-400' : 'text-[#14B8A6]'
              }`} />
              <span className={`font-semibold ${
                isDarkTheme ? 'text-white' : 'text-[#0F172A]'
              }`}>{opportunity.confidence}%</span>
              <span className={isDarkTheme ? 'text-gray-500' : 'text-[#475569]'}>Confidence</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 ${
                isDarkTheme ? 'text-blue-400' : 'text-[#14B8A6]'
              }`} />
              <span className={`font-semibold ${
                isDarkTheme ? 'text-blue-400' : 'text-[#14B8A6]'
              }`}>{opportunity.guardianScore}/10</span>
              <span className={isDarkTheme ? 'text-gray-500' : 'text-[#475569]'}>Guardian</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className={`w-4 h-4 ${
                isDarkTheme ? 'text-gray-400' : 'text-[#64748B]'
              }`} />
              <span className={`font-semibold ${
                isDarkTheme ? 'text-white' : 'text-[#0F172A]'
              }`}>{opportunity.duration}</span>
              <span className={isDarkTheme ? 'text-gray-500' : 'text-[#475569]'}>Duration</span>
            </div>
          </div>
          
          {/* Divider */}
          <div className={`w-full h-px bg-gradient-to-r from-transparent to-transparent my-5 ${
            isDarkTheme ? 'via-white/15' : 'via-gray-200'
          }`}></div>
        </div>

        {/* CTA Button with Subtle Ripple */}
        <motion.button
          onClick={() => onJoinQuest(opportunity)}
          className={`relative w-full py-4 font-bold rounded-xl flex items-center justify-center gap-2 overflow-hidden ${
            isDarkTheme
              ? 'bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] text-white shadow-lg'
              : 'bg-gradient-to-r from-[#FBBF24] to-[#14B8A6] text-white shadow-[0_2px_8px_rgba(251,191,36,0.25)]'
          }`}
          whileHover={{ 
            scale: 1.02, 
            y: -1,
            boxShadow: isDarkTheme
              ? '0 8px 25px rgba(0,245,160,0.3)'
              : '0 4px 16px rgba(251,191,36,0.4)'
          }}
          whileTap={{ scale: 0.98 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25
          }}
        >
          {/* Subtle Ripple Effect */}
          <motion.div
            className={`absolute inset-0 ${
              isDarkTheme
                ? 'bg-gradient-to-r from-white/0 via-white/10 to-white/0'
                : 'bg-gradient-to-r from-white/0 via-white/20 to-white/0'
            }`}
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          />
          <span className="relative z-10">Join Quest</span>
          <motion.div
            className="relative z-10"
            animate={{ x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: [0.25, 1, 0.5, 1] }}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.div>
        </motion.button>
      </div>
    </motion.div>
  );
}