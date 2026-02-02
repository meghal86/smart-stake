import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Bot, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCopilotSSE, type WalletScope, type ActionCard, type IntentPlan } from '@/hooks/useCopilotSSE';
import { cn } from '@/lib/utils';

export interface CopilotChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  walletScope: WalletScope;
  onActionCardClick?: (actionCard: ActionCard) => void;
  onIntentPlanClick?: (intentPlan: IntentPlan) => void;
}

export function CopilotChatDrawer({
  isOpen,
  onClose,
  walletScope,
  onActionCardClick,
  onIntentPlanClick,
}: CopilotChatDrawerProps) {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    isConnecting,
    error,
    messages,
    actionCards,
    intentPlans,
    capabilityNotices,
    sendMessage,
    clearHistory,
  } = useCopilotSSE({
    walletScope,
    enabled: isOpen, // Only connect when drawer is open
    onError: (err) => {
      console.error('Copilot SSE error:', err);
    },
  });

  // Auto-scroll to bottom when new messages arrive - debounced
  useEffect(() => {
    if (!isOpen) return;
    
    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages.length, actionCards.length, intentPlans.length, capabilityNotices.length, isOpen]);

  const handleSendMessage = useCallback(() => {
    if (!inputMessage.trim() || !isConnected) return;
    
    sendMessage(inputMessage.trim());
    setInputMessage('');
  }, [inputMessage, isConnected, sendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const getSeverityColor = useCallback((severity: 'critical' | 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'allowed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'blocked':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warn':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'block':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  }, []);

  const hasContent = useMemo(() => 
    messages.length > 0 || actionCards.length > 0 || intentPlans.length > 0,
    [messages.length, actionCards.length, intentPlans.length]
  );

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[80vh] flex flex-col">
        <DrawerHeader className="flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-500" />
            <DrawerTitle>Portfolio Copilot</DrawerTitle>
            <div className="flex items-center gap-2 ml-auto">
              {isConnecting && (
                <Badge variant="outline" className="text-yellow-500">
                  <Clock className="w-3 h-3 mr-1" />
                  Connecting...
                </Badge>
              )}
              {isConnected && (
                <Badge variant="outline" className="text-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              )}
              {error && (
                <Badge variant="outline" className="text-red-500">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Error
                </Badge>
              )}
            </div>
          </div>
          <DrawerDescription>
            AI assistant for portfolio analysis and recommendations
            {walletScope.mode === 'active_wallet' && (
              <span className="block text-xs text-muted-foreground mt-1">
                Active wallet: {walletScope.address.slice(0, 6)}...{walletScope.address.slice(-4)}
              </span>
            )}
          </DrawerDescription>
        </DrawerHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Connection error. Retrying...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Text Messages */}
          {messages.map((message, index) => (
            <div key={`message-${index}`} className="flex gap-3">
              <Bot className="w-6 h-6 text-cyan-500 flex-shrink-0 mt-1" />
              <div className="flex-1 bg-muted/50 rounded-lg p-3">
                <p className="text-sm whitespace-pre-wrap">{message}</p>
              </div>
            </div>
          ))}

          {/* Action Cards */}
          {actionCards.map((actionCard, index) => (
            <Card 
              key={`action-${index}`} 
              className={cn(
                "cursor-pointer transition-colors hover:bg-muted/50",
                getSeverityColor(actionCard.severity)
              )}
              onClick={() => onActionCardClick?.(actionCard)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {actionCard.title}
                  </CardTitle>
                  <Badge variant="outline" className={getSeverityColor(actionCard.severity)}>
                    {actionCard.severity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {actionCard.why.map((reason, reasonIndex) => (
                    <p key={reasonIndex} className="text-xs text-muted-foreground">
                      • {reason}
                    </p>
                  ))}
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      <span>Risk Δ: {actionCard.impactPreview.riskDelta > 0 ? '+' : ''}{actionCard.impactPreview.riskDelta}</span>
                      <span>Gas: ${actionCard.impactPreview.gasEstimateUsd}</span>
                      <span>Time: {actionCard.impactPreview.timeEstimateSec}s</span>
                    </div>
                    <span className="text-muted-foreground">
                      Confidence: {Math.round(actionCard.impactPreview.confidence * 100)}%
                    </span>
                  </div>
                  
                  <Button size="sm" className="w-full mt-2">
                    <Zap className="w-3 h-3 mr-1" />
                    {actionCard.cta.label}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Intent Plans */}
          {intentPlans.map((intentPlan, index) => (
            <Card 
              key={`plan-${index}`} 
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => onIntentPlanClick?.(intentPlan)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Intent Plan: {intentPlan.intent}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(intentPlan.policy.status)}
                    {getStatusIcon(intentPlan.simulation.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    {intentPlan.steps.length} step{intentPlan.steps.length !== 1 ? 's' : ''}
                  </div>
                  
                  {intentPlan.policy.violations.length > 0 && (
                    <div className="text-xs text-red-500">
                      Policy violations: {intentPlan.policy.violations.join(', ')}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      <span>Risk Δ: {intentPlan.impactPreview.riskDelta > 0 ? '+' : ''}{intentPlan.impactPreview.riskDelta}</span>
                      <span>Gas: ${intentPlan.impactPreview.gasEstimateUsd}</span>
                      <span>Time: {intentPlan.impactPreview.timeEstimateSec}s</span>
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="w-full mt-2"
                    disabled={intentPlan.policy.status === 'blocked'}
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    {intentPlan.policy.status === 'blocked' ? 'Blocked by Policy' : 'Execute Plan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Capability Notices */}
          {capabilityNotices.map((notice, index) => (
            <Card key={`notice-${index}`} className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-500">System Notice</p>
                    <p className="text-xs text-muted-foreground mt-1">{notice.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isConnected 
                  ? "Ask about your portfolio..." 
                  : "Connecting to Copilot..."
              }
              disabled={!isConnected || isConnecting}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || !isConnected || isConnecting}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {hasContent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="mt-2 text-xs"
            >
              Clear History
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}