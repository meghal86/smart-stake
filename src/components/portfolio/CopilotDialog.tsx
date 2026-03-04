'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Activity,
  Brain,
  Lightbulb,
  Copy,
  ThumbsUp,
  ThumbsDown,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface CopilotMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: CopilotAction[];
}

interface CopilotAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

interface CopilotDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  {
    id: 'explain',
    label: 'Explain',
    description: 'Get detailed explanation of portfolio conditions',
    icon: Brain,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400',
  },
  {
    id: 'what_changed',
    label: 'What Changed',
    description: 'See what changed in the last 24h',
    icon: Activity,
    color: 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400',
  },
  {
    id: 'do_next',
    label: 'Do Next',
    description: 'Get actionable recommendations',
    icon: Lightbulb,
    color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 dark:text-yellow-400',
  },
  {
    id: 'risk_analysis',
    label: 'Risk Analysis',
    description: 'Analyze current risk factors',
    icon: AlertTriangle,
    color: 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
  },
];

export function CopilotDialog({ isOpen, onClose }: CopilotDialogProps) {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content:
        "Hi! I'm your AI portfolio copilot. I can help you understand your portfolio, analyze risks, and provide actionable insights. What would you like to know?",
      timestamp: new Date().toISOString(),
      actions: [
        {
          id: 'explain_portfolio',
          label: 'Explain my portfolio',
          icon: Brain,
          onClick: () => console.log('Explain portfolio'),
        },
        {
          id: 'show_risks',
          label: 'Show risks',
          icon: AlertTriangle,
          onClick: () => console.log('Show risks'),
        },
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: CopilotMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: CopilotMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content:
          "I understand you're asking about your portfolio. Based on current data, I can see that your portfolio is well-diversified with moderate risk exposure. Would you like me to dive deeper into a specific aspect?",
        timestamp: new Date().toISOString(),
        actions: [
          {
            id: 'analyze_risk',
            label: 'Analyze risk',
            icon: AlertTriangle,
            onClick: () => console.log('Analyze risk'),
          },
          {
            id: 'check_opportunities',
            label: 'Check opportunities',
            icon: TrendingUp,
            onClick: () => console.log('Check opportunities'),
          },
        ],
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleQuickAction = (actionId: string) => {
    const action = QUICK_ACTIONS.find((a) => a.id === actionId);
    if (action) {
      setInputValue(action.description);
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleFeedback = (messageId: string, isPositive: boolean) => {
    console.log(
      `Feedback for message ${messageId}: ${isPositive ? 'positive' : 'negative'}`
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'max-w-2xl max-h-[75vh] p-0 gap-0 overflow-visible flex flex-col',
          isDark
            ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-[rgba(28,169,255,0.3)]'
            : 'bg-gradient-to-br from-white via-slate-50 to-white border-[rgba(28,169,255,0.4)]'
        )}
      >
        {/* Header */}
        <DialogHeader
          className={cn(
            'p-4 border-b',
            isDark ? 'border-white/10' : 'border-gray-200'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className={cn(
                  'p-2 rounded-lg',
                  isDark
                    ? 'bg-gradient-to-br from-[#1CA9FF]/20 to-[#7B61FF]/20'
                    : 'bg-gradient-to-br from-[#1CA9FF]/30 to-[#7B61FF]/30'
                )}
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(28, 169, 255, 0.3)',
                    '0 0 30px rgba(123, 97, 255, 0.4)',
                    '0 0 20px rgba(28, 169, 255, 0.3)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Bot className="w-6 h-6 text-[#1CA9FF]" />
              </motion.div>
              <div>
                <DialogTitle
                  className={cn(
                    'text-xl font-bold',
                    isDark ? 'text-white' : 'text-gray-900'
                  )}
                >
                  AI Portfolio Copilot
                </DialogTitle>
                <DialogDescription
                  className={cn(
                    'text-xs',
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  )}
                >
                  Your intelligent portfolio assistant
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Actions */}
        <div
          className={cn(
            'p-3 border-b',
            isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
          )}
        >
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((action) => (
              <motion.button
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                className={cn(
                  'p-2 rounded-lg text-left transition-all duration-200',
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                    : 'bg-white hover:bg-gray-50 border border-gray-200'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <div className={cn('p-1 rounded', action.color)}>
                    <action.icon className="w-3 h-3" />
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isDark ? 'text-white' : 'text-gray-900'
                    )}
                  >
                    {action.label}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="overflow-y-auto p-4 space-y-3 h-[320px]">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  'flex gap-3',
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.type === 'assistant' && (
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      isDark ? 'bg-[#1CA9FF]/20' : 'bg-[#1CA9FF]/30'
                    )}
                  >
                    <Bot className="w-4 h-4 text-[#1CA9FF]" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[80%] rounded-lg p-2.5',
                    message.type === 'user'
                      ? isDark
                        ? 'bg-gradient-to-r from-[#1CA9FF]/30 to-[#7B61FF]/30 text-white'
                        : 'bg-gradient-to-r from-[#1CA9FF]/40 to-[#7B61FF]/40 text-gray-900'
                      : isDark
                      ? 'bg-white/10 text-white'
                      : 'bg-gray-100 text-gray-900'
                  )}
                >
                  <p className="text-sm">{message.content}</p>

                  {/* Provenance for assistant messages */}
                  {message.type === 'assistant' && (
                    <div
                      className={cn(
                        'mt-2 p-2 rounded text-xs',
                        isDark
                          ? 'bg-white/5 text-gray-400'
                          : 'bg-gray-200 text-gray-600'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span>Data: Portfolio API, updated 2m ago</span>
                        <span>•</span>
                        <span>Confidence: High</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyMessage(message.content)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      {message.type === 'assistant' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleFeedback(message.id, true)}
                            className="h-6 w-6 p-0"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleFeedback(message.id, false)}
                            className="h-6 w-6 p-0"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {message.actions.map((action) => (
                        <Button
                          key={action.id}
                          size="sm"
                          variant="outline"
                          onClick={action.onClick}
                          className="text-xs"
                        >
                          <action.icon className="w-3 h-3 mr-1" />
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {message.type === 'user' && (
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      isDark ? 'bg-white/10' : 'bg-gray-200'
                    )}
                  >
                    <Sparkles
                      className={cn(
                        'w-4 h-4',
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      )}
                    />
                  </div>
                )}
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    isDark ? 'bg-[#1CA9FF]/20' : 'bg-[#1CA9FF]/30'
                  )}
                >
                  <Bot className="w-4 h-4 text-[#1CA9FF]" />
                </div>
                <div
                  className={cn(
                    'rounded-lg p-3',
                    isDark ? 'bg-white/10' : 'bg-gray-100'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full animate-bounce',
                          isDark ? 'bg-gray-400' : 'bg-gray-600'
                        )}
                      />
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full animate-bounce',
                          isDark ? 'bg-gray-400' : 'bg-gray-600'
                        )}
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full animate-bounce',
                          isDark ? 'bg-gray-400' : 'bg-gray-600'
                        )}
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-sm',
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      )}
                    >
                      Thinking...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div
          className={cn(
            'p-4 border-t',
            isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
          )}
        >
          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything about your portfolio..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className={cn(
                'flex-1',
                isDark
                  ? 'bg-white/10 border-white/20 text-white placeholder:text-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'
              )}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-6 bg-gradient-to-r from-[#1CA9FF] to-[#7B61FF] hover:from-[#1CA9FF]/90 hover:to-[#7B61FF]/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p
            className={cn(
              'text-xs mt-2',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )}
          >
            Press Enter to send, or use the quick actions above
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
