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
  protocol?: string | { name: string; logo?: string };
  estimatedAPY?: number;
}

interface OpportunityCardProps {
  opportunity: Opportunity;
  index: number;
  onJoinQuest: (opportunity: Opportunity) => void;
  isDarkTheme?: boolean;
  isConnected?: boolean;
}

const typeIcons = {
  Airdrop: TrendingUp,
  Staking: Shield,
  NFT: Star,
  Quest: Zap
};

const typeColors = {
  Airdrop: 'bg-[#141414] text-[#cdd9ff] border border-white/10',
  Staking: 'bg-[#141414] text-[#d6c08d] border border-white/10',
  NFT: 'bg-[#141414] text-[#d9c8ff] border border-white/10',
  Quest: 'bg-[#141414] text-[#f6f2ea] border border-white/10'
};

const riskColors = {
  Low: 'text-[#bcd7c5] bg-white/[0.04] border border-white/10',
  Medium: 'text-[#d6c08d] bg-white/[0.04] border border-white/10',
  High: 'text-[#e0b4b4] bg-white/[0.04] border border-white/10'
};

const riskIcons = {
  Low: CheckCircle,
  Medium: AlertTriangle,
  High: AlertTriangle
};

export function OpportunityCard({ opportunity, index, onJoinQuest, isDarkTheme = true, isConnected = false }: OpportunityCardProps) {
  const TypeIcon = opportunity.type ? typeIcons[opportunity.type] : typeIcons.Quest;
  // Ensure RiskIcon is always a valid component, never undefined
  const RiskIcon = (opportunity.riskLevel && riskIcons[opportunity.riskLevel]) 
    ? riskIcons[opportunity.riskLevel] 
    : riskIcons.Medium;
  
  return (
    <motion.div
      className={`relative cursor-pointer rounded-[30px] border p-8 transition-all duration-500 ${
        isDarkTheme
          ? 'border-white/8 bg-[#0b0b0c] shadow-2xl'
          : 'border-black/8 bg-[rgba(245,243,238,0.95)] shadow-xl'
      }`}
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
      }}
      whileTap={{ scale: 0.99 }}
    >
      {isDarkTheme ? (
        <>
          <div className="absolute inset-0 rounded-[30px] bg-[radial-gradient(circle_at_top_right,rgba(126,163,242,0.12),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.03),transparent_34%)] opacity-70" />
          <motion.div 
            className="absolute inset-0 rounded-[30px] border border-white/6 pointer-events-none"
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          />
        </>
      ) : (
        <div className="absolute inset-0 rounded-[30px] bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.04),transparent_26%)]" />
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
                  className={`rounded-2xl p-3 ${opportunity.type ? (typeColors[opportunity.type] || typeColors.Quest) : typeColors.Quest}`}
                  whileHover={{ scale: 1.05 }}
                >
                  <TypeIcon className="h-6 w-6" />
                </motion.div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      isDarkTheme 
                        ? 'border border-white/10 bg-white/[0.04] text-[#f6f2ea]'
                        : 'bg-[#14B8A6]/10 text-[#14B8A6]'
                    }`}>
                      {opportunity.type?.toUpperCase() || 'QUEST'}
                    </span>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      isDarkTheme 
                        ? (riskColors[opportunity.riskLevel] || riskColors.Medium)
                        : opportunity.riskLevel === 'Low' 
                          ? 'text-emerald-600 bg-emerald-50'
                          : opportunity.riskLevel === 'Medium'
                            ? 'text-amber-600 bg-amber-50'
                            : 'text-red-600 bg-red-50'
                    }`}>
                      {RiskIcon && <RiskIcon className="w-3 h-3" />}
                      {opportunity.riskLevel?.toUpperCase() || 'UNKNOWN'} RISK
                    </div>
                  </div>
                  
                  <h3 className={`text-xl font-bold font-display leading-tight mb-1 ${
                    isDarkTheme ? 'text-[#f6f2ea]' : 'text-[#0F172A]'
                  }`}>
                    {opportunity.title || 'Untitled Opportunity'}
                  </h3>
                  
                  {opportunity.protocol && (
                    <p className={`text-sm ${
                      isDarkTheme ? 'text-[#8f8a82]' : 'text-[#475569]'
                    }`}>
                      {typeof opportunity.protocol === 'string' ? opportunity.protocol : opportunity.protocol?.name || 'Unknown'} {opportunity.chain && `• ${typeof opportunity.chain === 'string' ? opportunity.chain : 'Multi-chain'}`}
                    </p>
                  )}
                </div>
              </div>
              
              <p className={`text-sm line-clamp-2 mb-6 leading-relaxed ${
                isDarkTheme ? 'text-[#b8b2a7]' : 'text-[#475569]'
              }`}>
                {opportunity.description?.replace(/on \w+\s*[•·]\s*\w+/gi, '').trim() || 'No description available'}
              </p>
              
              <div className={`mb-6 h-px w-full ${isDarkTheme ? 'bg-white/8' : 'bg-black/8'}`} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className={`w-4 h-4 ${
                isDarkTheme ? 'text-[#d6c08d]' : 'text-[#FBBF24]'
              }`} />
              <span className={`font-bold ${
                isDarkTheme ? 'text-[#f6f2ea]' : 'text-[#FBBF24]'
              }`}>{typeof opportunity.reward === 'string' ? opportunity.reward : 'TBD'}</span>
              <span className={isDarkTheme ? 'text-[#8f8a82]' : 'text-[#475569]'}>Reward</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className={`w-4 h-4 ${
                isDarkTheme ? 'text-[#a7c0ff]' : 'text-[#14B8A6]'
              }`} />
              <span className={`font-semibold ${
                isDarkTheme ? 'text-[#f6f2ea]' : 'text-[#0F172A]'
              }`}>{typeof opportunity.confidence === 'number' ? opportunity.confidence : 0}%</span>
              <span className={isDarkTheme ? 'text-[#8f8a82]' : 'text-[#475569]'}>Confidence</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 ${
                isDarkTheme ? 'text-[#a7c0ff]' : 'text-[#14B8A6]'
              }`} />
              <span className={`font-semibold ${
                isDarkTheme ? 'text-[#f6f2ea]' : 'text-[#14B8A6]'
              }`}>{typeof opportunity.guardianScore === 'number' ? opportunity.guardianScore : 0}/10</span>
              <span className={isDarkTheme ? 'text-[#8f8a82]' : 'text-[#475569]'}>Guardian</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className={`w-4 h-4 ${
                isDarkTheme ? 'text-[#8f8a82]' : 'text-[#64748B]'
              }`} />
              <span className={`font-semibold ${
                isDarkTheme ? 'text-[#f6f2ea]' : 'text-[#0F172A]'
              }`}>{opportunity.duration || 'TBD'}</span>
              <span className={isDarkTheme ? 'text-[#8f8a82]' : 'text-[#475569]'}>Duration</span>
            </div>
          </div>
          
          <div className={`my-5 h-px w-full ${isDarkTheme ? 'bg-white/8' : 'bg-black/8'}`} />
        </div>

        <motion.button
          onClick={() => onJoinQuest(opportunity)}
          className={`relative w-full py-4 font-bold rounded-xl flex items-center justify-center gap-2 overflow-hidden ${
            isDarkTheme
              ? 'border border-white/10 bg-[#f6f2ea] text-black'
              : 'bg-gradient-to-r from-[#FBBF24] to-[#14B8A6] text-white shadow-[0_2px_8px_rgba(251,191,36,0.25)]'
          }`}
          whileHover={{ 
            scale: 1.02, 
            y: -1,
          }}
          whileTap={{ scale: 0.98 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25
          }}
        >
          <motion.div
            className={`absolute inset-0 ${
              isDarkTheme
                ? 'bg-gradient-to-r from-black/0 via-black/10 to-black/0'
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
