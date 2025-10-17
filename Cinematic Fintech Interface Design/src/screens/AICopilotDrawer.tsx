import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Send, TrendingUp, HelpCircle } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { useState } from "react";

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AICopilotDrawer({ isOpen, onClose }: AICopilotDrawerProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      type: "ai",
      content: "Hello! I'm your AlphaWhale AI Copilot. Ask me anything about your portfolio, whale movements, or trading strategies!",
    },
  ]);

  const quickActions = [
    { icon: Sparkles, label: "Explain Recent Signals", action: "explain" },
    { icon: TrendingUp, label: "What Changed Today?", action: "changes" },
    { icon: HelpCircle, label: "Best Next Move?", action: "nextmove" },
  ];

  const handleQuickAction = (action: string) => {
    const responses: Record<string, string> = {
      explain: "I've detected 3 major whale movements today: 2,450 BTC moved to cold storage (bullish), 15,890 ETH transferred to exchanges (potentially bearish), and unusual SOL accumulation pattern (neutral). Would you like detailed analysis on any of these?",
      changes: "Your portfolio is up 8.7% today (+$48.2K). Main drivers: BTC whale inflow signals triggered your auto-buy (+12%), ETH staking rewards (+2.1%), and Guardian AI prevented 2 risky trades (saved ~$8K). Your risk score improved from Medium to Low.",
      nextmove: "Based on current whale patterns and your risk profile, I recommend: 1) Take 30% profit from BTC position (resistance ahead), 2) Increase ETH exposure by 15% (accumulation phase detected), 3) Avoid SOL for next 24h (mixed signals). Confidence: 84%",
    };

    setMessages([
      ...messages,
      { type: "user", content: quickActions.find(a => a.action === action)?.label || "" },
      { type: "ai", content: responses[action] },
    ]);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages([
      ...messages,
      { type: "user", content: input },
      { type: "ai", content: "I'm analyzing your question using real-time whale data and AI models. In production, this would provide personalized insights based on your portfolio and market conditions." },
    ]);
    setInput("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] z-50"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <GlassCard className="h-full rounded-none md:rounded-l-2xl flex flex-col">
              {/* Header */}
              <div className="p-6 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: "var(--accent)" }}>
                      <Sparkles className="w-5 h-5" style={{ color: "var(--primary)" }} />
                    </div>
                    <div>
                      <h3 style={{ color: "var(--foreground)" }}>AI Copilot</h3>
                      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                        Always here to help
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg transition-all hover:scale-110"
                    style={{ background: "var(--muted)" }}
                  >
                    <X className="w-5 h-5" style={{ color: "var(--foreground)" }} />
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-4 border-b space-y-2" style={{ borderColor: "var(--border)" }}>
                <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
                  Quick Actions
                </p>
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickAction(action.action)}
                    className="w-full flex items-center gap-2 p-3 rounded-lg transition-all hover:scale-[1.02]"
                    style={{ background: "var(--accent)" }}
                  >
                    <action.icon className="w-4 h-4" style={{ color: "var(--primary)" }} />
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, idx) => (
                  <motion.div
                    key={idx}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div
                      className="max-w-[80%] p-4 rounded-2xl"
                      style={{
                        background: message.type === "user" 
                          ? "linear-gradient(135deg, var(--primary), var(--chart-2))" 
                          : "var(--input-background)",
                        color: message.type === "user" ? "white" : "var(--foreground)",
                      }}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-end gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="flex-1 p-3 rounded-lg"
                    style={{
                      background: "var(--input-background)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                  <button
                    type="submit"
                    className="p-3 rounded-lg transition-all hover:scale-110"
                    style={{
                      background: "linear-gradient(135deg, var(--primary), var(--chart-2))",
                      color: "white",
                    }}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
