import { useState } from "react";
import Hub2Layout from "@/components/hub2/Hub2Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Send, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Activity,
  Brain,
  Lightbulb,
  Zap,
  MessageSquare,
  Copy,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  icon: React.ComponentType<unknown>;
  onClick: () => void;
}

const QUICK_ACTIONS = [
  {
    id: 'explain',
    label: 'Explain',
    description: 'Get detailed explanation of market conditions',
    icon: Brain,
    color: 'text-blue-600 bg-blue-50',
    examples: ['Explain BTC risk today', 'Why is SOL pumping?', 'What drives ETH sentiment?']
  },
  {
    id: 'what_changed',
    label: 'What Changed',
    description: 'See what changed in the last 24h',
    icon: Activity,
    color: 'text-green-600 bg-green-50',
    examples: ['What changed with BTC?', 'Show me recent SOL activity', 'ETH movements today']
  },
  {
    id: 'do_next',
    label: 'Do Next',
    description: 'Get actionable recommendations',
    icon: Lightbulb,
    color: 'text-yellow-600 bg-yellow-50',
    examples: ['Should I buy BTC now?', 'What to watch for ETH?', 'Next moves for SOL?']
  },
  {
    id: 'risk_analysis',
    label: 'Risk Analysis',
    description: 'Analyze current risk factors',
    icon: AlertTriangle,
    color: 'text-red-600 bg-red-50',
    examples: ['Analyze BTC risk', 'SOL risk factors', 'ETH volatility check']
  }
];

export default function CopilotPage() {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your AI market copilot. I can help you understand market conditions, analyze trends, and provide actionable insights. What would you like to know?",
      timestamp: new Date().toISOString(),
      actions: [
        {
          id: 'explain_market',
          label: 'Explain current market',
          icon: Brain,
          onClick: () => console.log('Explain market')
        },
        {
          id: 'show_trends',
          label: 'Show trends',
          icon: TrendingUp,
          onClick: () => console.log('Show trends')
        }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: CopilotMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: CopilotMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I understand you're asking about market conditions. Based on current data, I can see that market sentiment is moderate with some interesting whale activity patterns. Would you like me to dive deeper into unknown specific aspect?",
        timestamp: new Date().toISOString(),
        actions: [
          {
            id: 'analyze_sentiment',
            label: 'Analyze sentiment',
            icon: Brain,
            onClick: () => console.log('Analyze sentiment')
          },
          {
            id: 'check_whales',
            label: 'Check whale activity',
            icon: Activity,
            onClick: () => console.log('Check whales')
          }
        ]
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleQuickAction = (actionId: string) => {
    const action = QUICK_ACTIONS.find(a => a.id === actionId);
    if (action) {
      setInputValue(action.description);
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleFeedback = (messageId: string, isPositive: boolean) => {
    console.log(`Feedback for message ${messageId}: ${isPositive ? 'positive' : 'negative'}`);
  };

  return (
    <Hub2Layout>
      <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Copilot</h1>
            <p className="text-muted-foreground">
              Your intelligent market assistant
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {QUICK_ACTIONS.map((action) => (
            <Card
              key={action.id}
              className="cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={() => handleQuickAction(action.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("p-2 rounded-lg", action.color)}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{action.label}</h3>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </div>
                {action.examples && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Examples:</p>
                    {action.examples.slice(0, 2).map((example, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground italic">
                        "{example}"
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Messages */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Conversation
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.type === 'assistant' && (
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    
                    <div className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    )}>
                      <p className="text-sm">{message.content}</p>
                      
                      {/* Provenance for assistant messages */}
                      {message.type === 'assistant' && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span>Data: Etherscan, updated 6m ago</span>
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
                      <div className="p-2 bg-muted rounded-lg">
                        <Sparkles className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Recent Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Market Sentiment</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sentiment increased by 12% in the last 24h
                </p>
              </div>
              
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">Risk Alert</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Risk level increased for 3 assets
                </p>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Whale Activity</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Large transaction detected on Ethereum
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Conversations</span>
                <Badge variant="secondary">12</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Insights Generated</span>
                <Badge variant="secondary">47</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Accuracy</span>
                <Badge variant="secondary">94%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Input Area */}
      <div className="mt-6">
        <div className="flex gap-2">
          <Input
            placeholder="Ask me anything about the market..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-6"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, or use the quick actions above
        </p>
      </div>
      </div>
    </Hub2Layout>
  );
}
