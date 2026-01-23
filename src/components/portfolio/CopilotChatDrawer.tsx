import { useState, useEffect } from 'react';
import { X, MessageCircle, Send } from 'lucide-react';
import { WalletScope } from '@/types/portfolio';

interface CopilotChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  walletScope: WalletScope;
}

export function CopilotChatDrawer({ isOpen, onClose, walletScope }: CopilotChatDrawerProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);

  // Reset messages when wallet scope changes to prevent data leakage
  useEffect(() => {
    setMessages([]);
  }, [walletScope]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');

    // Mock AI response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: `I understand you're asking about "${message}". This is a placeholder response. The full Copilot integration with SSE streaming and wallet scope validation will be implemented here.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative ml-auto w-full max-w-md bg-gray-900 border-l border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">AI Copilot</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wallet Scope Indicator */}
        <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700">
          <p className="text-sm text-gray-400">
            Context: {walletScope.mode === 'all_wallets' ? 'All Wallets' : `Wallet ${walletScope.address?.slice(0, 6)}...${walletScope.address?.slice(-4)}`}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p>Start a conversation with your AI assistant</p>
              <p className="text-sm mt-2">Ask about your portfolio, risks, or opportunities</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about your portfolio..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-2 rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Copilot responses are constrained to valid taxonomy objects
          </p>
        </div>
      </div>
    </div>
  );
}