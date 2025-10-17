import { motion } from "motion/react";
import { GlassCard } from "../components/GlassCard";
import { AchievementBadge } from "../components/AchievementBadge";
import { Users, MessageCircle, TrendingUp, Award, Copy, Share2, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export function CommunityScreen() {
  const [referralCopied, setReferralCopied] = useState(false);

  const handleCopyReferral = () => {
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <h2 style={{ color: "var(--foreground)" }}>Community Hub</h2>
        <p style={{ color: "var(--muted-foreground)" }}>
          Connect, learn, and grow with fellow whales
        </p>
      </div>

      {/* Referral Card */}
      <GlassCard className="p-6" glow glowColor="var(--chart-4)">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Share2 className="w-5 h-5" style={{ color: "var(--chart-4)" }} />
              <h3 style={{ color: "var(--foreground)" }}>Refer & Earn</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
              Invite friends and earn 10% of their first year subscription
            </p>
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "var(--input-background)" }}>
              <code className="flex-1 text-sm" style={{ color: "var(--foreground)" }}>
                https://alphawhale.io/ref/WHALE2025
              </code>
              <button
                onClick={handleCopyReferral}
                className="p-2 rounded-lg transition-all"
                style={{
                  background: referralCopied ? "var(--chart-3)" : "var(--accent)",
                  color: referralCopied ? "white" : "var(--primary)",
                }}
              >
                {referralCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-1" style={{ color: "var(--chart-4)" }}>
              $480
            </div>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Total Earned
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Achievement Showcase */}
      <div>
        <h3 className="mb-4" style={{ color: "var(--foreground)" }}>
          Your Achievements
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AchievementBadge
            title="First Whale"
            description="Detected your first whale movement"
            icon="trophy"
            unlocked
            rarity="common"
          />
          <AchievementBadge
            title="Risk Master"
            description="Avoided 10 risky trades"
            icon="star"
            unlocked
            rarity="rare"
          />
          <AchievementBadge
            title="Profit Legend"
            description="Achieved 100% ROI"
            icon="award"
            unlocked
            rarity="legendary"
          />
          <AchievementBadge
            title="Guardian"
            description="Protected $1M+ in assets"
            icon="zap"
            unlocked={false}
            rarity="legendary"
          />
        </div>
      </div>

      {/* Top Traders */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 style={{ color: "var(--foreground)" }}>Top Traders This Week</h3>
          <Award className="w-5 h-5" style={{ color: "var(--chart-4)" }} />
        </div>
        <div className="space-y-3">
          {[
            { name: "WhaleHunter", profit: "+$2.4M", rank: 1, avatar: "🐋" },
            { name: "CryptoNinja", profit: "+$1.8M", rank: 2, avatar: "🥷" },
            { name: "AlphaTrader", profit: "+$1.2M", rank: 3, avatar: "⚡" },
            { name: "You", profit: "+$480K", rank: 12, avatar: "🌊" },
          ].map((trader, idx) => (
            <motion.div
              key={idx}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{
                background: trader.name === "You" ? "var(--accent)" : "var(--input-background)",
                border: trader.name === "You" ? "1px solid var(--primary)" : "none",
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: "var(--secondary)" }}>
                  {trader.avatar}
                </div>
                <div>
                  <div style={{ color: "var(--foreground)" }}>{trader.name}</div>
                  <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Rank #{trader.rank}
                  </div>
                </div>
              </div>
              <div style={{ color: "var(--chart-3)" }}>{trader.profit}</div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Community Chat Pods */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 style={{ color: "var(--foreground)" }}>Active Discussions</h3>
          <MessageCircle className="w-5 h-5" style={{ color: "var(--primary)" }} />
        </div>
        <div className="space-y-4">
          {[
            { topic: "BTC Whale Movement Detected", members: 342, live: true },
            { topic: "Best Tax Harvesting Strategies", members: 128, live: false },
            { topic: "Guardian AI Updates", members: 89, live: true },
          ].map((chat, idx) => (
            <motion.button
              key={idx}
              className="w-full flex items-center justify-between p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
              style={{
                background: "var(--input-background)",
                border: chat.live ? "1px solid var(--chart-3)" : "none",
              }}
              whileHover={{ x: 4 }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: "var(--foreground)" }}>{chat.topic}</span>
                  {chat.live && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--chart-3)", color: "white" }}>
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      Live
                    </span>
                  )}
                </div>
                <div className="text-sm flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                  <Users className="w-4 h-4" />
                  {chat.members} members
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
